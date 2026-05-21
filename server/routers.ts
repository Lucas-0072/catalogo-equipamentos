import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { equipamentos, fornecedores } from "../drizzle/schema";
import type { Equipamento, Fornecedor } from "../drizzle/schema";
import { eq, like, or, and, sql } from "drizzle-orm";
import { z } from "zod";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Fornecedores ──────────────────────────────────────────────────────────
  fornecedores: router({
    list: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(fornecedores).orderBy(fornecedores.nome);
    }),

    create: protectedProcedure
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

    update: protectedProcedure
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

    delete: protectedProcedure
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

    update: protectedProcedure
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

    delete: protectedProcedure
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

    // ── Sincronização com planilha Excel ──────────────────────────────────
    syncExcel: protectedProcedure
      .input(z.object({
        // Dados da planilha como array de objetos
        rows: z.array(z.object({
          codigo: z.string(),
          referencia: z.string().optional().nullable(),
          descricao: z.string(),
          unidade: z.string().optional().nullable(),
          idTipo: z.string().optional().nullable(),
          grupo: z.string().optional().nullable(),
          subgrupo: z.string().optional().nullable(),
          cstCod: z.string().optional().nullable(),
          cst: z.string().optional().nullable(),
          ncm: z.string().optional().nullable(),
          ipi: z.string().optional().nullable(),
        })),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        let adicionados = 0;
        let atualizados = 0;
        let ignorados = 0;

        // Buscar todos os códigos existentes de uma vez
        const existingRows = await db
          .select({ id: equipamentos.id, codigo: equipamentos.codigo, imagem: equipamentos.imagem,
            fornecedor1Id: equipamentos.fornecedor1Id, fornecedor2Id: equipamentos.fornecedor2Id, fornecedor3Id: equipamentos.fornecedor3Id })
          .from(equipamentos);

        const existingMap = new Map<string, { id: number; imagem: string | null; fornecedor1Id: number | null; fornecedor2Id: number | null; fornecedor3Id: number | null }>();
        for (const row of existingRows) {
          if (row.codigo) existingMap.set(row.codigo.trim(), row as any);
        }

        // Processar em lotes de 100
        const BATCH = 100;
        for (let i = 0; i < input.rows.length; i += BATCH) {
          const batch = input.rows.slice(i, i + BATCH);
          for (const row of batch) {
            const codigo = row.codigo?.trim();
            if (!codigo) { ignorados++; continue; }

            const grupoStr = row.grupo ? String(row.grupo).trim() : null;
            const subgrupoStr = row.subgrupo ? String(row.subgrupo).trim() : null;

            // Montar nome do grupo/subgrupo a partir da referência
            const refStr = row.referencia ? String(row.referencia).trim() : null;
            const grupoNome = refStr || grupoStr;
            const subgrupoNome = subgrupoStr ? `${subgrupoStr} - ${refStr ?? grupoStr ?? ""}` : null;

            const ncmClean = row.ncm && String(row.ncm) !== "nan" && String(row.ncm) !== "None" ? String(row.ncm).trim() : null;
            const ipiClean = row.ipi && String(row.ipi) !== "nan" && String(row.ipi) !== "0" ? String(row.ipi).trim() : null;

            const existing = existingMap.get(codigo);

            if (existing) {
              // Atualizar preservando imagem e fornecedores
              await db.update(equipamentos).set({
                descricao: row.descricao?.trim() || "",
                referencia: refStr,
                unidade: row.unidade?.trim() || null,
                grupo: grupoStr,
                grupoNome: grupoNome,
                subgrupo: subgrupoStr,
                subgrupoNome: subgrupoNome,
                ncm: ncmClean,
                ipi: ipiClean,
              }).where(eq(equipamentos.id, existing.id));
              atualizados++;
            } else {
              // Inserir novo
              await db.insert(equipamentos).values({
                codigo,
                descricao: row.descricao?.trim() || "",
                referencia: refStr,
                unidade: row.unidade?.trim() || null,
                grupo: grupoStr,
                grupoNome: grupoNome,
                subgrupo: subgrupoStr,
                subgrupoNome: subgrupoNome,
                ncm: ncmClean,
                ipi: ipiClean,
              });
              adicionados++;
            }
          }
        }

        return { adicionados, atualizados, ignorados, total: input.rows.length };
      }),

    uploadImagem: protectedProcedure
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
  }),
});

export type AppRouter = typeof appRouter;
