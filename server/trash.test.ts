import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { equipamentos } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Sistema de Lixeira (Trash)", () => {
  let testEquipId: number;
  let testDeptId: number;

  beforeAll(async () => {
    // Criar departamento de teste
    const dept = await db.createDepartamento("Trash Test Dept", "trashtestdept", "testpass123");
    testDeptId = dept.id;

    // Criar equipamento de teste
    const drizzleDb = await db.getDb();
    if (!drizzleDb) throw new Error("Database not available");

    const result = await drizzleDb.insert(equipamentos).values({
      codigo: "TEST-TRASH-001",
      descricao: "Equipamento de teste para lixeira",
      grupo: "700",
      grupoNome: "ESTACOES-MP",
      subgrupo: "701",
      subgrupoNome: "701 - ESTACOES-MP",
    });

    testEquipId = (result[0].insertId as number) || 1;
  });

  afterAll(async () => {
    // Limpar dados de teste
    const dept = await db.getDepartamentoByLogin("trashtestdept");
    if (dept) {
      await db.permanentlyDeleteDepartamento(dept.id);
    }
    // Limpar equipamento de teste
    await db.permanentlyDeleteEquipamento(testEquipId);
  });

  describe("Equipamentos", () => {
    it("deve fazer soft delete de equipamento", async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("Database not available");

      // Soft delete
      await drizzleDb.update(equipamentos)
        .set({ deletedAt: new Date() })
        .where(eq(equipamentos.id, testEquipId));

      // Verificar que aparece em listagens de deletados
      const deleted = await db.listDeletedEquipamentos();
      expect(deleted.some(e => e.id === testEquipId)).toBe(true);
    });

    it("deve listar equipamentos deletados", async () => {
      const deleted = await db.listDeletedEquipamentos();
      expect(Array.isArray(deleted)).toBe(true);
      expect(deleted.length).toBeGreaterThan(0);
    });

    it("deve restaurar equipamento deletado", async () => {
      await db.restoreEquipamento(testEquipId);
      const deleted = await db.listDeletedEquipamentos();
      expect(deleted.some(e => e.id === testEquipId)).toBe(false);
    });

    it("deve deletar permanentemente equipamento", async () => {
      const drizzleDb = await db.getDb();
      if (!drizzleDb) throw new Error("Database not available");

      // Primeiro fazer soft delete
      await drizzleDb.update(equipamentos)
        .set({ deletedAt: new Date() })
        .where(eq(equipamentos.id, testEquipId));

      // Depois deletar permanentemente
      await db.permanentlyDeleteEquipamento(testEquipId);

      // Verificar que não existe mais
      const deleted = await db.listDeletedEquipamentos();
      expect(deleted.some(e => e.id === testEquipId)).toBe(false);
    });
  });

  describe("Departamentos", () => {
    it("deve fazer soft delete de departamento", async () => {
      await db.deleteDepartamento(testDeptId);
      const dept = await db.getDepartamentoByLogin("trashtestdept");
      expect(dept).toBeUndefined();
    });

    it("deve listar departamentos deletados", async () => {
      const deleted = await db.listDeletedDepartamentos();
      expect(Array.isArray(deleted)).toBe(true);
      expect(deleted.some(d => d.id === testDeptId)).toBe(true);
    });

    it("deve restaurar departamento deletado", async () => {
      await db.restoreDepartamento(testDeptId);
      const dept = await db.getDepartamentoByLogin("trashtestdept");
      expect(dept).toBeDefined();
      expect(dept?.deletedAt).toBeNull();
    });

    it("deve deletar permanentemente departamento", async () => {
      // Primeiro fazer soft delete
      await db.deleteDepartamento(testDeptId);

      // Depois deletar permanentemente
      await db.permanentlyDeleteDepartamento(testDeptId);

      // Verificar que não existe mais
      const deleted = await db.listDeletedDepartamentos();
      expect(deleted.some(d => d.id === testDeptId)).toBe(false);
    });
  });
});
