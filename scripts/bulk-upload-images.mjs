#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fuse from 'fuse.js';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração
const UPLOAD_DIR = '/home/ubuntu/upload';
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('✗ DATABASE_URL não configurada');
  process.exit(1);
}

let connection = null;

async function initDb() {
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✓ Conectado ao banco de dados');
    return connection;
  } catch (error) {
    console.error('✗ Erro ao conectar ao banco de dados:', error.message);
    process.exit(1);
  }
}

async function getEquipamentos() {
  console.log('Carregando equipamentos do banco de dados...');
  try {
    const [rows] = await connection.execute('SELECT id, codigo, descricao, referencia FROM equipamentos');
    console.log(`✓ Carregados ${rows.length} equipamentos`);
    return rows;
  } catch (error) {
    console.error('✗ Erro ao carregar equipamentos:', error.message);
    process.exit(1);
  }
}

function getImageFiles() {
  console.log('Listando arquivos de imagem...');
  const extensions = ['.jpg', '.jpeg', '.png'];
  const files = [];

  function walkDir(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (extensions.includes(path.extname(item).toLowerCase())) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      console.warn(`⚠ Erro ao ler diretório ${dir}:`, err.message);
    }
  }

  walkDir(UPLOAD_DIR);
  console.log(`✓ Encontrados ${files.length} arquivos de imagem`);
  return files;
}

function matchImagesWithEquipamentos(equipamentos, imageFiles) {
  console.log('\nExecutando fuzzy matching...');

  // Criar índice Fuse para equipamentos
  const fuseOptions = {
    keys: ['codigo', 'descricao', 'referencia'],
    threshold: 0.3,
    includeScore: true,
  };

  const fuse = new Fuse(equipamentos, fuseOptions);

  const matches = new Map(); // equipamentoId -> imagePath
  const unmatched = [];

  for (const imagePath of imageFiles) {
    const fileName = path.basename(imagePath, path.extname(imagePath));

    // Tentar encontrar match
    const results = fuse.search(fileName);

    if (results.length > 0 && results[0].score < 0.5) {
      const equipamento = results[0].item;
      matches.set(equipamento.id, imagePath);
    } else {
      unmatched.push({ fileName, imagePath });
    }
  }

  console.log(`✓ Fuzzy matching concluído`);
  console.log(`  - ${matches.size} imagens com match encontrado`);
  console.log(`  - ${unmatched.length} imagens sem match`);

  return { matches, unmatched };
}

async function uploadMatches(matches) {
  console.log('\nFazendo upload de imagens...');

  let successCount = 0;
  let failureCount = 0;

  for (const [equipamentoId, imagePath] of matches) {
    const fileName = path.basename(imagePath);
    process.stdout.write(`  Equipamento ${equipamentoId}: ${fileName}... `);

    try {
      // Ler arquivo de imagem
      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString('base64');

      // Atualizar banco de dados com imagem em base64
      await connection.execute(
        'UPDATE equipamentos SET imagem = ? WHERE id = ?',
        [base64, equipamentoId]
      );

      console.log('✓');
      successCount++;
    } catch (error) {
      console.log(`✗ (${error.message.slice(0, 30)})`);
      failureCount++;
    }

    // Pequeno delay para não sobrecarregar o servidor
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n✓ Upload concluído: ${successCount} sucesso, ${failureCount} falhas`);
  return { successCount, failureCount };
}

async function main() {
  console.log('=== Bulk Upload de Imagens para Catálogo 710 ===\n');

  try {
    await initDb();

    const equipamentos = await getEquipamentos();
    const imageFiles = getImageFiles();

    if (equipamentos.length === 0) {
      console.error('✗ Nenhum equipamento encontrado no banco de dados');
      process.exit(1);
    }

    if (imageFiles.length === 0) {
      console.error('✗ Nenhum arquivo de imagem encontrado');
      process.exit(1);
    }

    const { matches, unmatched } = matchImagesWithEquipamentos(equipamentos, imageFiles);

    if (matches.size === 0) {
      console.error('✗ Nenhuma imagem foi associada a equipamentos');
      process.exit(1);
    }

    const { successCount, failureCount } = await uploadMatches(matches);

    console.log('\n=== Resumo Final ===');
    console.log(`Total de equipamentos: ${equipamentos.length}`);
    console.log(`Total de imagens: ${imageFiles.length}`);
    console.log(`Imagens com match: ${matches.size}`);
    console.log(`Imagens sem match: ${unmatched.length}`);
    console.log(`Upload bem-sucedido: ${successCount}`);
    console.log(`Upload com falha: ${failureCount}`);

    if (unmatched.length > 0 && unmatched.length <= 10) {
      console.log('\nImagens sem match:');
      unmatched.forEach(({ fileName }) => {
        console.log(`  - ${fileName}`);
      });
    }

    if (connection) {
      await connection.end();
    }

    process.exit(successCount > 0 ? 0 : 1);
  } catch (error) {
    console.error('✗ Erro fatal:', error.message);
    console.error(error.stack);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

main();
