import { eq, isNull, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, departamentos, Departamento, equipamentos, Equipamento } from "../drizzle/schema";
import { ENV } from './_core/env';
import * as bcrypt from "bcryptjs";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ── Departamentos ──────────────────────────────────────────────────────────

export async function getDepartamentoByLogin(login: string): Promise<Departamento | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get departamento: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(departamentos)
    .where(eq(departamentos.login, login))
    .limit(1);

  return result.length > 0 && !result[0].deletedAt ? result[0] : undefined;
}

export async function listDepartamentos(): Promise<Departamento[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list departamentos: database not available");
    return [];
  }

  return await db.select().from(departamentos).where(isNull(departamentos.deletedAt));
}

export async function createDepartamento(nome: string, login: string, senha: string): Promise<Departamento> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const result = await db.insert(departamentos).values({
    nome,
    login,
    senhaHash,
    ativo: "sim",
  });

  const id = result[0].insertId as number;
  const dept = await db.select().from(departamentos).where(eq(departamentos.id, id)).limit(1);
  return dept[0];
}

export async function updateDepartamento(id: number, updates: Partial<{ nome: string; login: string; senhaHash: string; ativo: "sim" | "nao"; podeEditar: "sim" | "nao"; podeCriar: "sim" | "nao"; podeDeletar: "sim" | "nao"; podeSincronizar: "sim" | "nao" }>): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(departamentos).set(updates).where(eq(departamentos.id, id));
}

export async function deleteDepartamento(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Soft delete: marca com deletedAt
  await db.update(departamentos).set({ deletedAt: new Date() }).where(eq(departamentos.id, id));
}

export async function validarSenhaDepartamento(senhaHash: string, senha: string): Promise<boolean> {
  return await bcrypt.compare(senha, senhaHash);
}

export async function getDepartamentoById(id: number): Promise<Departamento | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get departamento: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(departamentos)
    .where(eq(departamentos.id, id))
    .limit(1);

  return result.length > 0 && !result[0].deletedAt ? result[0] : undefined;
}

// ===== TRASH / LIXEIRA =====

export async function listDeletedEquipamentos(): Promise<Equipamento[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list deleted equipamentos: database not available");
    return [];
  }

  return await db.select().from(equipamentos).where(isNotNull(equipamentos.deletedAt));
}

export async function listDeletedDepartamentos(): Promise<Departamento[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot list deleted departamentos: database not available");
    return [];
  }

  return await db.select().from(departamentos).where(isNotNull(departamentos.deletedAt));
}

export async function restoreEquipamento(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(equipamentos).set({ deletedAt: null }).where(eq(equipamentos.id, id));
}

export async function restoreDepartamento(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(departamentos).set({ deletedAt: null }).where(eq(departamentos.id, id));
}

export async function permanentlyDeleteEquipamento(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(equipamentos).where(eq(equipamentos.id, id));
}

export async function permanentlyDeleteDepartamento(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(departamentos).where(eq(departamentos.id, id));
}


// Funções de recuperação de senha
export async function generateResetToken(): Promise<string> {
  return require("crypto").randomBytes(32).toString("hex");
}

export async function requestPasswordReset(login: string, email: string): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(departamentos).where(eq(departamentos.login, login)).limit(1);
  const departamento = result[0];

  if (!departamento) {
    throw new Error("Departamento não encontrado");
  }

  // Verificar se o email corresponde
  if (departamento.email !== email) {
    throw new Error("Email não corresponde ao cadastrado");
  }

  // Gerar token com expiração de 1 hora
  const token = await generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await db.update(departamentos).set({
    resetToken: token,
    resetTokenExpiry: expiresAt,
  }).where(eq(departamentos.id, departamento.id));

  return { token, expiresAt };
}

export async function resetPassword(token: string, novaSenha: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(departamentos).where(eq(departamentos.resetToken, token)).limit(1);
  const departamento = result[0];

  if (!departamento) {
    throw new Error("Token inválido");
  }

  // Verificar se o token expirou
  if (!departamento.resetTokenExpiry || new Date() > departamento.resetTokenExpiry) {
    throw new Error("Token expirado");
  }

  // Hash da nova senha
  const bcrypt = require("bcryptjs");
  const senhaHash = await bcrypt.hash(novaSenha, 10);

  // Atualizar senha e limpar token
  await db.update(departamentos).set({
    senhaHash,
    resetToken: null,
    resetTokenExpiry: null,
  }).where(eq(departamentos.id, departamento.id));
}

export async function getDepartamentoByResetToken(token: string): Promise<Departamento | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(departamentos).where(eq(departamentos.resetToken, token)).limit(1);
  const departamento = result[0];

  if (!departamento) {
    return undefined;
  }

  // Verificar se o token expirou
  if (!departamento.resetTokenExpiry || new Date() > departamento.resetTokenExpiry) {
    return undefined;
  }

  return departamento;
}
