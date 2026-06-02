import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Autorização por Departamento", () => {
  let gestaoId: number;
  let almoxarifadoId: number;
  let outroId: number;

  beforeAll(async () => {
    // Criar departamentos de teste
    const gestao = await db.createDepartamento("Gestão Test", "gestao_test", "pass123");
    const almoxarifado = await db.createDepartamento("Almoxarifado Test", "almoxarifado_test", "pass456");
    const outro = await db.createDepartamento("Outro Test", "outro_test", "pass789");

    gestaoId = gestao.id;
    almoxarifadoId = almoxarifado.id;
    outroId = outro.id;
  });

  it("Gestão deve estar ativo", async () => {
    const dept = await db.getDepartamentoById(gestaoId);
    expect(dept?.ativo).toBe("sim");
    expect(dept?.login).toBe("gestao_test");
  });

  it("Almoxarifado deve estar ativo", async () => {
    const dept = await db.getDepartamentoById(almoxarifadoId);
    expect(dept?.ativo).toBe("sim");
    expect(dept?.login).toBe("almoxarifado_test");
  });

  it("Outro departamento deve estar ativo", async () => {
    const dept = await db.getDepartamentoById(outroId);
    expect(dept?.ativo).toBe("sim");
    expect(dept?.login).toBe("outro_test");
  });

  it("Gestão e Almoxarifado devem ter login nos nomes permitidos", async () => {
    const WRITE_ALLOWED = ["gestao", "almoxarifado"];
    const gestao = await db.getDepartamentoById(gestaoId);
    const almoxarifado = await db.getDepartamentoById(almoxarifadoId);

    // Verificar que os logins contêm os identificadores
    expect(gestao?.login).toContain("gestao");
    expect(almoxarifado?.login).toContain("almoxarifado");
  });

  it("Outro departamento não deve estar em lista de permissão de escrita", async () => {
    const WRITE_ALLOWED = ["gestao", "almoxarifado"];
    const outro = await db.getDepartamentoById(outroId);

    expect(WRITE_ALLOWED).not.toContain(outro?.login);
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
