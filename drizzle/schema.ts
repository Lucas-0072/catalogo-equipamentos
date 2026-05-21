import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de fornecedores
 */
export const fornecedores = mysqlTable("fornecedores", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  logo: text("logo"),
  contato: varchar("contato", { length: 255 }),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Fornecedor = typeof fornecedores.$inferSelect;
export type InsertFornecedor = typeof fornecedores.$inferInsert;

/**
 * Tabela de equipamentos
 */
export const equipamentos = mysqlTable("equipamentos", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull(),
  referencia: varchar("referencia", { length: 100 }),
  descricao: text("descricao").notNull(),
  unidade: varchar("unidade", { length: 20 }),
  idTipo: varchar("idTipo", { length: 20 }),
  grupo: varchar("grupo", { length: 20 }),
  grupoNome: varchar("grupoNome", { length: 100 }),
  subgrupo: varchar("subgrupo", { length: 20 }),
  subgrupoNome: varchar("subgrupoNome", { length: 100 }),
  ncm: varchar("ncm", { length: 20 }),
  ipi: varchar("ipi", { length: 20 }),
  imagem: text("imagem"),
  fornecedor1Id: int("fornecedor1Id"),
  fornecedor2Id: int("fornecedor2Id"),
  fornecedor3Id: int("fornecedor3Id"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Equipamento = typeof equipamentos.$inferSelect;
export type InsertEquipamento = typeof equipamentos.$inferInsert;
