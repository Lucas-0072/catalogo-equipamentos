import { config } from "dotenv";
config();

import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

// Parsear URL
const url = new URL(DB_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port || "3306"),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  charset: "utf8mb4",
  ssl: { rejectUnauthorized: false },
});

// Verificar se já há dados
const [rows] = await conn.execute("SELECT COUNT(*) as cnt FROM equipamentos");
const count = rows[0].cnt;
if (count > 0) {
  console.log(`Já existem ${count} equipamentos. Pulando importação.`);
  await conn.end();
  process.exit(0);
}

// Ler JSON gerado anteriormente
const data = JSON.parse(readFileSync("/home/ubuntu/equipamentos.json", "utf-8"));
console.log(`Importando ${data.length} equipamentos...`);

const batchSize = 500;
let total = 0;

for (let i = 0; i < data.length; i += batchSize) {
  const batch = data.slice(i, i + batchSize);
  const values = batch.map(e => [
    e.codigo || "",
    e.referencia || "",
    e.descricao || "",
    e.unidade || "",
    e.id || "",
    e.grupo || "",
    e.grupo_nome || "",
    e.subgrupo || "",
    e.subgrupo_nome || "",
    e.ncm && e.ncm !== "nan" ? e.ncm : "",
    e.ipi && e.ipi !== "nan" ? e.ipi : "",
  ]);

  const placeholders = values.map(() => "(?,?,?,?,?,?,?,?,?,?,?)").join(",");
  const flat = values.flat();

  await conn.execute(
    `INSERT INTO equipamentos (codigo, referencia, descricao, unidade, idTipo, grupo, grupoNome, subgrupo, subgrupoNome, ncm, ipi) VALUES ${placeholders}`,
    flat
  );

  total += batch.length;
  process.stdout.write(`\rInseridos: ${total}/${data.length}`);
}

console.log(`\n✅ Importação concluída! Total: ${total} equipamentos`);
await conn.end();
