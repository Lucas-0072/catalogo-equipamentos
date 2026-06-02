import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import * as bcrypt from "bcryptjs";

describe("Autenticação por Departamento", () => {
  let testDeptId: number;

  beforeAll(async () => {
    // Criar um departamento de teste
    const dept = await db.createDepartamento("Test Dept", "testdept", "testpass123");
    testDeptId = dept.id;
  });

  it("deve criar departamento com senha hash", async () => {
    const dept = await db.getDepartamentoByLogin("testdept");
    expect(dept).toBeDefined();
    expect(dept?.nome).toBe("Test Dept");
    expect(dept?.login).toBe("testdept");
    // Verificar que a senha está hashada (não é igual ao texto puro)
    expect(dept?.senhaHash).not.toBe("testpass123");
  });

  it("deve validar senha correta com bcrypt", async () => {
    const dept = await db.getDepartamentoByLogin("testdept");
    expect(dept).toBeDefined();
    if (!dept) return;

    const isValid = await db.validarSenhaDepartamento(dept.senhaHash, "testpass123");
    expect(isValid).toBe(true);
  });

  it("deve rejeitar senha incorreta", async () => {
    const dept = await db.getDepartamentoByLogin("testdept");
    expect(dept).toBeDefined();
    if (!dept) return;

    const isValid = await db.validarSenhaDepartamento(dept.senhaHash, "wrongpassword");
    expect(isValid).toBe(false);
  });

  it("deve listar departamentos", async () => {
    const depts = await db.listDepartamentos();
    expect(Array.isArray(depts)).toBe(true);
    expect(depts.length).toBeGreaterThan(0);
    const testDept = depts.find(d => d.login === "testdept");
    expect(testDept).toBeDefined();
  });

  it("deve atualizar departamento", async () => {
    await db.updateDepartamento(testDeptId, { nome: "Updated Test Dept" });
    const dept = await db.getDepartamentoByLogin("testdept");
    expect(dept?.nome).toBe("Updated Test Dept");
  });

  it("deve desativar departamento", async () => {
    await db.updateDepartamento(testDeptId, { ativo: "nao" });
    const dept = await db.getDepartamentoByLogin("testdept");
    expect(dept?.ativo).toBe("nao");
  });

  it("deve reativar departamento", async () => {
    await db.updateDepartamento(testDeptId, { ativo: "sim" });
    const dept = await db.getDepartamentoByLogin("testdept");
    expect(dept?.ativo).toBe("sim");
  });

  it("deve deletar departamento", async () => {
    await db.deleteDepartamento(testDeptId);
    const dept = await db.getDepartamentoByLogin("testdept");
    expect(dept).toBeUndefined();
  });
});
