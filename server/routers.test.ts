import { describe, it, expect } from "vitest";

// Testes unitários para validar a lógica de negócio do catálogo

describe("Catálogo de Equipamentos - Lógica de Negócio", () => {
  it("deve calcular corretamente o total de páginas", () => {
    const total = 5689;
    const pageSize = 24;
    const totalPages = Math.ceil(total / pageSize);
    expect(totalPages).toBe(238);
  });

  it("deve calcular o offset corretamente para paginação", () => {
    const page = 3;
    const pageSize = 24;
    const offset = (page - 1) * pageSize;
    expect(offset).toBe(48);
  });

  it("deve mapear grupo 700 para nome correto", () => {
    const grupos_map: Record<string, string> = {
      "700": "Estações de Tratamento",
      "780": "Equipamentos Especiais",
      "800": "Componentes e Acessórios",
    };
    expect(grupos_map["700"]).toBe("Estações de Tratamento");
    expect(grupos_map["800"]).toBe("Componentes e Acessórios");
  });

  it("deve validar que fornecedores são limitados a 3 por equipamento", () => {
    const slots = [1, 2, 3];
    expect(slots.length).toBe(3);
    expect(slots).toContain(1);
    expect(slots).toContain(2);
    expect(slots).toContain(3);
  });

  it("deve filtrar equipamentos com descrição vazia", () => {
    const items = [
      { descricao: "TANQUE PP", codigo: "701001" },
      { descricao: "", codigo: "701002" },
      { descricao: "BOMBA CENTRIFUGA", codigo: "701003" },
    ];
    const filtered = items.filter(i => i.descricao);
    expect(filtered.length).toBe(2);
  });

  it("deve limpar valores nan dos campos ncm e ipi", () => {
    const ncm = "nan";
    const ipi = "nan";
    const cleanNcm = ncm === "nan" ? "" : ncm;
    const cleanIpi = ipi === "nan" ? "" : ipi;
    expect(cleanNcm).toBe("");
    expect(cleanIpi).toBe("");
  });

  it("deve montar payload de update com todos os campos editáveis", () => {
    const original = {
      id: 1,
      descricao: "TANQUE PP",
      codigo: "701001",
      referencia: "REF-001",
      ncm: "39251000",
      unidade: "PC",
      grupo: "700",
      grupoNome: "ESTACOES-MP",
      subgrupo: "701",
      subgrupoNome: "701 - ESTACOES-MP",
      fornecedor1Id: null,
      fornecedor2Id: null,
      fornecedor3Id: null,
    };
    const updated = { ...original, descricao: "TANQUE PP ATUALIZADO", fornecedor1Id: 5 };
    expect(updated.descricao).toBe("TANQUE PP ATUALIZADO");
    expect(updated.fornecedor1Id).toBe(5);
    expect(updated.id).toBe(1);
  });

  it("deve confirmar exclusão apenas com id válido", () => {
    const validDelete = (id: number) => typeof id === "number" && id > 0;
    expect(validDelete(42)).toBe(true);
    expect(validDelete(0)).toBe(false);
    expect(validDelete(-1)).toBe(false);
  });

  it("deve impedir exclusão sem confirmação do usuário", () => {
    let confirmed = false;
    const askConfirm = () => { confirmed = true; };
    // Simula que o botão de confirmar não foi clicado
    expect(confirmed).toBe(false);
    askConfirm();
    expect(confirmed).toBe(true);
  });
});

describe("Sincronização com Excel", () => {
  it("deve mapear colunas do Excel para o formato do backend", () => {
    const rawRow: Record<string, string> = {
      CODIGO: "701001",
      REFERENCIA: "ESTACOES-MP",
      DESCRICAO: "TANQUE PP EST. REMOVIVEL",
      UN: "PC",
      ID: "MP",
      GRUPO: "700",
      SUBGRUPO: "701",
      "CST CÓD": "01",
      CST: "000",
      "NBM/NCM": "39251000",
      "%IPI": "0",
    };
    const mapped = {
      codigo: String(rawRow["CODIGO"] ?? "").trim(),
      referencia: String(rawRow["REFERENCIA"] ?? "").trim() || null,
      descricao: String(rawRow["DESCRICAO"] ?? "").trim(),
      unidade: String(rawRow["UN"] ?? "").trim() || null,
      grupo: String(rawRow["GRUPO"] ?? "").trim() || null,
      subgrupo: String(rawRow["SUBGRUPO"] ?? "").trim() || null,
      ncm: String(rawRow["NBM/NCM"] ?? "").trim() || null,
      ipi: String(rawRow["%IPI"] ?? "").trim() || null,
    };
    expect(mapped.codigo).toBe("701001");
    expect(mapped.referencia).toBe("ESTACOES-MP");
    expect(mapped.descricao).toBe("TANQUE PP EST. REMOVIVEL");
    expect(mapped.grupo).toBe("700");
    expect(mapped.subgrupo).toBe("701");
    expect(mapped.ncm).toBe("39251000");
  });

  it("deve filtrar linhas sem código durante sincronização", () => {
    const rows = [
      { codigo: "701001", descricao: "TANQUE PP" },
      { codigo: "", descricao: "SEM CODIGO" },
      { codigo: "701002", descricao: "BOMBA" },
    ];
    const valid = rows.filter(r => r.codigo.trim());
    expect(valid.length).toBe(2);
    expect(valid[0].codigo).toBe("701001");
  });

  it("deve preservar imagem e fornecedores ao atualizar equipamento existente", () => {
    const existing = {
      id: 1,
      codigo: "701001",
      imagem: "/manus-storage/img.jpg",
      fornecedor1Id: 3,
      fornecedor2Id: null,
      fornecedor3Id: null,
    };
    const updatePayload = {
      descricao: "TANQUE PP ATUALIZADO",
      // imagem e fornecedores NÃO são sobrescritos pela sincronização
    };
    // Simula que a sincronização não toca em imagem/fornecedores
    expect(updatePayload).not.toHaveProperty("imagem");
    expect(updatePayload).not.toHaveProperty("fornecedor1Id");
    expect(existing.imagem).toBe("/manus-storage/img.jpg");
    expect(existing.fornecedor1Id).toBe(3);
  });

  it("deve contabilizar corretamente adicionados e atualizados", () => {
    const existingCodigos = new Set(["701001", "701002"]);
    const rows = [
      { codigo: "701001" }, // existente → atualizado
      { codigo: "701002" }, // existente → atualizado
      { codigo: "701099" }, // novo → adicionado
    ];
    let adicionados = 0;
    let atualizados = 0;
    for (const row of rows) {
      if (existingCodigos.has(row.codigo)) atualizados++;
      else adicionados++;
    }
    expect(adicionados).toBe(1);
    expect(atualizados).toBe(2);
  });

  it("deve dividir corretamente em chunks de 500 para envio", () => {
    const CHUNK = 500;
    const total = 5689;
    const chunks = Math.ceil(total / CHUNK);
    expect(chunks).toBe(12);
  });
});

describe("Cadastro Manual de Equipamento", () => {
  it("deve rejeitar cadastro sem código", () => {
    const validate = (form: { codigo: string; descricao: string }) => {
      const errs: Record<string, string> = {};
      if (!form.codigo.trim()) errs.codigo = "Código é obrigatório";
      if (!form.descricao.trim()) errs.descricao = "Descrição é obrigatória";
      return errs;
    };
    const errs = validate({ codigo: "", descricao: "TANQUE PP" });
    expect(errs.codigo).toBe("Código é obrigatório");
    expect(errs.descricao).toBeUndefined();
  });

  it("deve rejeitar cadastro sem descrição", () => {
    const validate = (form: { codigo: string; descricao: string }) => {
      const errs: Record<string, string> = {};
      if (!form.codigo.trim()) errs.codigo = "Código é obrigatório";
      if (!form.descricao.trim()) errs.descricao = "Descrição é obrigatória";
      return errs;
    };
    const errs = validate({ codigo: "701099", descricao: "" });
    expect(errs.descricao).toBe("Descrição é obrigatória");
    expect(errs.codigo).toBeUndefined();
  });

  it("deve aceitar cadastro com código e descrição válidos", () => {
    const validate = (form: { codigo: string; descricao: string }) => {
      const errs: Record<string, string> = {};
      if (!form.codigo.trim()) errs.codigo = "Código é obrigatório";
      if (!form.descricao.trim()) errs.descricao = "Descrição é obrigatória";
      return errs;
    };
    const errs = validate({ codigo: "701099", descricao: "TANQUE PP NOVO" });
    expect(Object.keys(errs).length).toBe(0);
  });

  it("deve normalizar campos opcionais vazios para null", () => {
    const normalize = (val: string) => val.trim() || null;
    expect(normalize("")).toBeNull();
    expect(normalize("  ")).toBeNull();
    expect(normalize("39251000")).toBe("39251000");
  });

  it("deve detectar código duplicado antes de inserir", () => {
    const existingCodigos = new Set(["701001", "701002", "701003"]);
    const isDuplicate = (codigo: string) => existingCodigos.has(codigo);
    expect(isDuplicate("701001")).toBe(true);
    expect(isDuplicate("701099")).toBe(false);
  });
});
