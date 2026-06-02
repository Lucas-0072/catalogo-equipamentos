import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import * as db from "./db";
import { equipamentos, fornecedores, syncHistory } from "../drizzle/schema";
import type { Equipamento, Fornecedor } from "../drizzle/schema";
import { eq, like, or, and, sql } from "drizzle-orm";
import { z } from "zod";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    loginDepartamento: publicProcedure
      .input(z.object({
        login: z.string().min(1),
        senha: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const departamento = await db.getDepartamentoByLogin(input.login);
        if (!departamento) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        if (departamento.ativo !== "sim") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Departamento inativo" });
        }
        // Comparar senha com bcrypt
        const senhaValida = await db.validarSenhaDepartamento(departamento.senhaHash, input.senha);
        if (!senhaValida) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciais inválidas" });
        }
        // Criar cookie de sessão com departamento
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, JSON.stringify({ departamentoId: departamento.id, departamentoNome: departamento.nome }), {
          ...cookieOptions,
          maxAge: 24 * 60 * 60 * 1000, // 24 horas
        });
        return { id: departamento.id, nome: departamento.nome };
      }),
    logoutDepartamento: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Departamentos ──────────────────────────────────────────────────────────
  departamentos: router({
    list: publicProcedure.query(async () => {
      return await db.listDepartamentos();
    }),
    create: publicProcedure
      .input(z.object({
        nome: z.string().min(1),
        login: z.string().min(1),
        senha: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return await db.createDepartamento(input.nome, input.login, input.senha);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().optional(),
        login: z.string().optional(),
        senha: z.string().optional(),
        ativo: z.enum(["sim", "nao"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateDepartamento(id, updates);
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDepartamento(input.id);
        return { success: true };
      }),
  }),

  // ── Fornecedores ──────────────────────────────────────────────────────────
  fornecedores: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(fornecedores).orderBy(fornecedores.nome);
    }),

    create: publicProcedure
      .input(z.object({
        nome: z.string().min(1),
        logo: z.string().optional(),
        contato: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const [result] = await db.insert(fornecedores).values(input);
        return { id: result.insertId };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        nome: z.string().min(1).optional(),
        logo: z.string().optional(),
        contato: z.string().optional(),
        email: z.string().optional(),
        telefone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { id, ...data } = input;
        await db.update(fornecedores).set(data).where(eq(fornecedores.id, id));
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(fornecedores).where(eq(fornecedores.id, input.id));
        return { success: true };
      }),
  }),

  // ── Equipamentos ──────────────────────────────────────────────────────────
  equipamentos: router({
    list: publicProcedure
      .input(z.object({
        page: z.number().default(1),
        pageSize: z.number().default(20),
        search: z.string().optional(),
        searchNome: z.string().optional(),
        searchCodigo: z.string().optional(),
        grupo: z.string().optional(),
        subgrupo: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };

        const { page, pageSize, search, searchNome, searchCodigo, grupo, subgrupo } = input;
        const offset = (page - 1) * pageSize;

        const conditions = [];
        // Busca combinada legada
        if (search) {
          conditions.push(
            or(
              like(equipamentos.descricao, `%${search}%`),
              like(equipamentos.codigo, `%${search}%`),
              like(equipamentos.referencia, `%${search}%`)
            )
          );
        }
        // Busca por nome/descrição
        if (searchNome) {
          conditions.push(like(equipamentos.descricao, `%${searchNome}%`));
        }
        // Busca por código
        if (searchCodigo) {
          conditions.push(
            or(
              like(equipamentos.codigo, `%${searchCodigo}%`),
              like(equipamentos.referencia, `%${searchCodigo}%`)
            )
          );
        }
        if (grupo) conditions.push(eq(equipamentos.grupo, grupo));
        if (subgrupo) conditions.push(eq(equipamentos.subgrupo, subgrupo));

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const [items, countResult] = await Promise.all([
          db.select().from(equipamentos)
            .where(where)
            .limit(pageSize)
            .offset(offset)
            .orderBy(equipamentos.codigo),
          db.select({ count: sql<number>`count(*)` }).from(equipamentos).where(where),
        ]);

        const total = Number(countResult[0]?.count ?? 0);

        // Buscar fornecedores para os itens
        const fornecedorIds = new Set<number>();
        (items as Equipamento[]).forEach((item: Equipamento) => {
          if (item.fornecedor1Id) fornecedorIds.add(item.fornecedor1Id);
          if (item.fornecedor2Id) fornecedorIds.add(item.fornecedor2Id);
          if (item.fornecedor3Id) fornecedorIds.add(item.fornecedor3Id);
        });

        const fornecedoresMap: Record<number, Fornecedor> = {};
        if (fornecedorIds.size > 0) {
          const ids = Array.from(fornecedorIds);
          const fList = await db.select().from(fornecedores).where(
            sql`${fornecedores.id} IN (${sql.join(ids.map((id: number) => sql`${id}`), sql`, `)})`
          );
          (fList as Fornecedor[]).forEach((f: Fornecedor) => { fornecedoresMap[f.id] = f; });
        }

        const itemsWithFornecedores = (items as Equipamento[]).map((item: Equipamento) => ({
          ...item,
          fornecedor1: item.fornecedor1Id ? fornecedoresMap[item.fornecedor1Id] ?? null : null,
          fornecedor2: item.fornecedor2Id ? fornecedoresMap[item.fornecedor2Id] ?? null : null,
          fornecedor3: item.fornecedor3Id ? fornecedoresMap[item.fornecedor3Id] ?? null : null,
        }));

        return {
          items: itemsWithFornecedores,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const [item] = await db.select().from(equipamentos).where(eq(equipamentos.id, input.id));
        if (!item) return null;

        const typedItem = item as Equipamento;
        const fornecedorIds = [typedItem.fornecedor1Id, typedItem.fornecedor2Id, typedItem.fornecedor3Id].filter(Boolean) as number[];
        const fornecedoresMap: Record<number, Fornecedor> = {};
        if (fornecedorIds.length > 0) {
          const fList = await db.select().from(fornecedores).where(
            sql`${fornecedores.id} IN (${sql.join(fornecedorIds.map((id: number) => sql`${id}`), sql`, `)})`
          );
          (fList as Fornecedor[]).forEach((f: Fornecedor) => { fornecedoresMap[f.id] = f; });
        }

        return {
          ...typedItem,
          fornecedor1: typedItem.fornecedor1Id ? fornecedoresMap[typedItem.fornecedor1Id] ?? null : null,
          fornecedor2: typedItem.fornecedor2Id ? fornecedoresMap[typedItem.fornecedor2Id] ?? null : null,
          fornecedor3: typedItem.fornecedor3Id ? fornecedoresMap[typedItem.fornecedor3Id] ?? null : null,
        };
      }),

    create: publicProcedure
      .input(z.object({
        codigo: z.string().min(1),
        descricao: z.string().min(1),
        referencia: z.string().optional().nullable(),
        ncm: z.string().optional().nullable(),
        unidade: z.string().optional().nullable(),
        grupo: z.string().optional().nullable(),
        grupoNome: z.string().optional().nullable(),
        subgrupo: z.string().optional().nullable(),
        subgrupoNome: z.string().optional().nullable(),
        imagem: z.string().optional().nullable(),
        fornecedor1Id: z.number().optional().nullable(),
        fornecedor2Id: z.number().optional().nullable(),
        fornecedor3Id: z.number().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const existing = await db.select({ id: equipamentos.id }).from(equipamentos)
          .where(eq(equipamentos.codigo, input.codigo)).limit(1);
        if (existing.length > 0) throw new Error(`Código "${input.codigo}" já existe no catálogo.`);
        const [result] = await db.insert(equipamentos).values(input);
        return { id: result.insertId };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        descricao: z.string().optional(),
        codigo: z.string().optional(),
        referencia: z.string().optional(),
        ncm: z.string().optional().nullable(),
        unidade: z.string().optional().nullable(),
        grupo: z.string().optional().nullable(),
        grupoNome: z.string().optional().nullable(),
        subgrupo: z.string().optional().nullable(),
        subgrupoNome: z.string().optional().nullable(),
        imagem: z.string().optional().nullable(),
        fornecedor1Id: z.number().optional().nullable(),
        fornecedor2Id: z.number().optional().nullable(),
        fornecedor3Id: z.number().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { id, ...data } = input;
        await db.update(equipamentos).set(data).where(eq(equipamentos.id, id));
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        await db.delete(equipamentos).where(eq(equipamentos.id, input.id));
        return { success: true };
      }),

    grupos: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      const result = await db
        .selectDistinct({ grupo: equipamentos.grupo, grupoNome: equipamentos.grupoNome })
        .from(equipamentos)
        .orderBy(equipamentos.grupo);
      return result.filter((r: { grupo: string | null; grupoNome: string | null }) => r.grupo);
    }),

    subgrupos: publicProcedure
      .input(z.object({ grupo: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const where = input.grupo ? eq(equipamentos.grupo, input.grupo) : undefined;
        const result = await db
          .selectDistinct({ subgrupo: equipamentos.subgrupo, subgrupoNome: equipamentos.subgrupoNome, grupo: equipamentos.grupo })
          .from(equipamentos)
          .where(where)
          .orderBy(equipamentos.subgrupo);
        return result.filter((r: { subgrupo: string | null; subgrupoNome: string | null; grupo: string | null }) => r.subgrupo);
      }),

    uploadImagem: publicProcedure
      .input(z.object({
        id: z.number(),
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const buffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.mimeType.split("/")[1] || "jpg";
        const key = `equipamentos/${input.id}/imagem.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await db.update(equipamentos).set({ imagem: url }).where(eq(equipamentos.id, input.id));
        return { url };
      }),

    // Sincronização com Excel com histórico detalhado
    syncExcel: publicProcedure
      .input(z.object({
        fileName: z.string(),
        rows: z.array(z.object({
          codigo: z.string(),
          referencia: z.string().optional().nullable(),
          descricao: z.string(),
          unidade: z.string().optional().nullable(),
          idTipo: z.string().optional().nullable(),
          grupo: z.string().optional().nullable(),
          subgrupo: z.string().optional().nullable(),
          ncm: z.string().optional().nullable(),
          ipi: z.string().optional().nullable(),
        })),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Registrar início da sincronização
        const [syncResult] = await db.insert(syncHistory).values({
          fileName: input.fileName,
          status: "processing",
          totalRows: input.rows.length,
        });
        const syncId = syncResult.insertId;

        let adicionados = 0;
        let atualizados = 0;
        let ignorados = 0;
        let erros = 0;
        const detalhesAdicionados: string[] = [];
        const detalhesAtualizados: { codigo: string; campos: string[] }[] = [];

        try {
          // Buscar todos os registros existentes
          const existingRows = await db
            .select({
              id: equipamentos.id,
              codigo: equipamentos.codigo,
              descricao: equipamentos.descricao,
              referencia: equipamentos.referencia,
              unidade: equipamentos.unidade,
              grupo: equipamentos.grupo,
              subgrupo: equipamentos.subgrupo,
              ncm: equipamentos.ncm,
              ipi: equipamentos.ipi,
              imagem: equipamentos.imagem,
              fornecedor1Id: equipamentos.fornecedor1Id,
              fornecedor2Id: equipamentos.fornecedor2Id,
              fornecedor3Id: equipamentos.fornecedor3Id,
            })
            .from(equipamentos);

          const existingMap = new Map<string, typeof existingRows[0]>();
          for (const row of existingRows) {
            if (row.codigo) existingMap.set(row.codigo.trim(), row);
          }

          // Processar em lotes de 100
          const BATCH = 100;
          for (let i = 0; i < input.rows.length; i += BATCH) {
            const batch = input.rows.slice(i, i + BATCH);
            for (const row of batch) {
              try {
                const codigo = row.codigo?.trim();
                if (!codigo) { ignorados++; continue; }

                const grupoStr = row.grupo ? String(row.grupo).trim() : null;
                const subgrupoStr = row.subgrupo ? String(row.subgrupo).trim() : null;
                const refStr = row.referencia ? String(row.referencia).trim() : null;
                const grupoNome = refStr || grupoStr;
                const subgrupoNome = subgrupoStr ? `${subgrupoStr} - ${refStr ?? grupoStr ?? ""}` : null;
                const ncmClean = row.ncm && String(row.ncm) !== "nan" && String(row.ncm) !== "None" ? String(row.ncm).trim() : null;
                const ipiClean = row.ipi && String(row.ipi) !== "nan" && String(row.ipi) !== "0" ? String(row.ipi).trim() : null;
                const descricaoClean = row.descricao?.trim() || "";

                const existing = existingMap.get(codigo);

                if (existing) {
                  // Detectar campos alterados
                  const camposAlterados: string[] = [];
                  if (existing.descricao !== descricaoClean) camposAlterados.push("descrição");
                  if ((existing.referencia ?? null) !== refStr) camposAlterados.push("referência");
                  if ((existing.unidade ?? null) !== (row.unidade?.trim() || null)) camposAlterados.push("unidade");
                  if ((existing.grupo ?? null) !== grupoStr) camposAlterados.push("grupo");
                  if ((existing.subgrupo ?? null) !== subgrupoStr) camposAlterados.push("subgrupo");
                  if ((existing.ncm ?? null) !== ncmClean) camposAlterados.push("NCM");
                  if ((existing.ipi ?? null) !== ipiClean) camposAlterados.push("IPI");

                  if (camposAlterados.length > 0) {
                    await db.update(equipamentos).set({
                      descricao: descricaoClean,
                      referencia: refStr,
                      unidade: row.unidade?.trim() || null,
                      grupo: grupoStr,
                      grupoNome,
                      subgrupo: subgrupoStr,
                      subgrupoNome,
                      ncm: ncmClean,
                      ipi: ipiClean,
                    }).where(eq(equipamentos.id, existing.id));
                    atualizados++;
                    detalhesAtualizados.push({ codigo, campos: camposAlterados });
                  } else {
                    ignorados++;
                  }
                } else {
                  await db.insert(equipamentos).values({
                    codigo,
                    descricao: descricaoClean,
                    referencia: refStr,
                    unidade: row.unidade?.trim() || null,
                    grupo: grupoStr,
                    grupoNome,
                    subgrupo: subgrupoStr,
                    subgrupoNome,
                    ncm: ncmClean,
                    ipi: ipiClean,
                  });
                  adicionados++;
                  detalhesAdicionados.push(codigo);
                }
              } catch {
                erros++;
              }
            }
          }

          // Atualizar registro de sincronização como concluído
          const detalhesJson = JSON.stringify({
            adicionados: detalhesAdicionados.slice(0, 100),
            atualizados: detalhesAtualizados.slice(0, 100),
          });
          await db.update(syncHistory).set({
            status: "completed",
            adicionados,
            atualizados,
            ignorados,
            erros,
            detalhes: detalhesJson,
            completedAt: new Date(),
          }).where(eq(syncHistory.id, syncId));

          return { syncId, adicionados, atualizados, ignorados, erros, total: input.rows.length };
        } catch (err) {
          await db.update(syncHistory).set({
            status: "error",
            errorMessage: String(err),
            completedAt: new Date(),
          }).where(eq(syncHistory.id, syncId));
          throw err;
        }
      }),

    // Histórico de sincronizações
    syncHistoryList: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(syncHistory)
        .orderBy(sql`${syncHistory.createdAt} DESC`)
        .limit(20);
    }),
  }),
});

export type AppRouter = typeof appRouter;
