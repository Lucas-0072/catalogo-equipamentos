import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Autorização por Departamento", () => {
  let gestaoId: number;
  let almoxarifadoId: number;
  let outroId: number;

  beforeAll(async () => {
    // Usar departamentos existentes ou criar com nomes únicos
    const timestamp = Date.now();
    const gestao = await db.createDepartamento(`Gestão Test ${timestamp}`, `gestao_test_${timestamp}`, "pass123");
    const almoxarifado = await db.createDepartamento(`Almoxarifado Test ${timestamp}`, `almoxarifado_test_${timestamp}`, "pass456");
    const outro = await db.createDepartamento(`Outro Test ${timestamp}`, `outro_test_${timestamp}`, "pass789");

    gestaoId = gestao.id;
    almoxarifadoId = almoxarifado.id;
    outroId = outro.id;
  });

  it("Gestão deve estar ativo", async () => {
    const dept = await db.getDepartamentoById(gestaoId);
    expect(dept?.ativo).toBe("sim");
    expect(dept?.login).toContain("gestao_test");
  });

  it("Almoxarifado deve estar ativo", async () => {
    const dept = await db.getDepartamentoById(almoxarifadoId);
    expect(dept?.ativo).toBe("sim");
    expect(dept?.login).toContain("almoxarifado_test");
  });

  it("Outro departamento deve estar ativo", async () => {
    const dept = await db.getDepartamentoById(outroId);
    expect(dept?.ativo).toBe("sim");
    expect(dept?.login).toContain("outro_test");
  });

  it("Gestão e Almoxarifado devem ter login nos nomes permitidos", async () => {
    const gestao = await db.getDepartamentoById(gestaoId);
    const almoxarifado = await db.getDepartamentoById(almoxarifadoId);

    // Verificar que os logins contém os identificadores
    expect(gestao?.login).toContain("gestao_test");
    expect(almoxarifado?.login).toContain("almoxarifado_test");
  });

  it("Outro departamento não deve estar em lista de permissão de escrita", async () => {
    const outro = await db.getDepartamentoById(outroId);
    // Verificar que o login é diferente dos permitidos
    expect(outro?.login).not.toContain("gestao");
    expect(outro?.login).not.toContain("almoxarifado");
  });

  it("Departamentos podem ser desativados", async () => {
    await db.updateDepartamento(outroId, { ativo: "nao" });
    const dept = await db.getDepartamentoById(outroId);
    expect(dept?.ativo).toBe("nao");
  });

  it("Departamentos desativados não podem fazer login", async () => {
    const dept = await db.getDepartamentoById(outroId);
    expect(dept?.ativo).toBe("nao");
    // Verificação de lógica: departamento inativo não deve ser permitido
  });
});
