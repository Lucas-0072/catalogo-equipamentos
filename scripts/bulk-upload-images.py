#!/usr/bin/env python3

import os
import sys
import sqlite3
import base64
from pathlib import Path
from difflib import SequenceMatcher

# Configuração
UPLOAD_DIR = '/home/ubuntu/upload'
DB_PATH = '/home/ubuntu/catalogo-equipamentos/db.sqlite'

def get_db_connection():
    """Conectar ao banco de dados SQLite"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f'✗ Erro ao conectar ao banco de dados: {e}')
        sys.exit(1)

def get_equipamentos(conn):
    """Carregar todos os equipamentos do banco de dados"""
    print('Carregando equipamentos do banco de dados...')
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT id, codigo, descricao, referencia FROM equipamentos')
        equipamentos = cursor.fetchall()
        print(f'✓ Carregados {len(equipamentos)} equipamentos')
        return equipamentos
    except Exception as e:
        print(f'✗ Erro ao carregar equipamentos: {e}')
        sys.exit(1)

def get_image_files():
    """Listar todos os arquivos de imagem"""
    print('Listando arquivos de imagem...')
    extensions = {'.jpg', '.jpeg', '.png'}
    files = []
    
    for root, dirs, filenames in os.walk(UPLOAD_DIR):
        for filename in filenames:
            if Path(filename).suffix.lower() in extensions:
                files.append(os.path.join(root, filename))
    
    print(f'✓ Encontrados {len(files)} arquivos de imagem')
    return files

def similarity_ratio(a, b):
    """Calcular razão de similaridade entre duas strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def match_images_with_equipamentos(equipamentos, image_files):
    """Fazer fuzzy matching entre imagens e equipamentos"""
    print('\nExecutando fuzzy matching...')
    
    matches = {}  # equipamento_id -> image_path
    unmatched = []
    
    for image_path in image_files:
        filename = Path(image_path).stem.lower()
        
        best_match = None
        best_score = 0.3  # Threshold mínimo
        
        for equip in equipamentos:
            equip_id = equip['id']
            codigo = (equip['codigo'] or '').lower()
            descricao = (equip['descricao'] or '').lower()
            referencia = (equip['referencia'] or '').lower()
            
            # Calcular scores
            score_codigo = similarity_ratio(filename, codigo)
            score_descricao = similarity_ratio(filename, descricao)
            score_referencia = similarity_ratio(filename, referencia)
            
            # Usar o melhor score
            max_score = max(score_codigo, score_descricao, score_referencia)
            
            if max_score > best_score:
                best_score = max_score
                best_match = equip_id
        
        if best_match is not None:
            matches[best_match] = image_path
        else:
            unmatched.append({
                'filename': Path(image_path).name,
                'path': image_path
            })
    
    print(f'✓ Fuzzy matching concluído')
    print(f'  - {len(matches)} imagens com match encontrado')
    print(f'  - {len(unmatched)} imagens sem match')
    
    return matches, unmatched

def upload_matches(conn, matches):
    """Fazer upload das imagens associadas"""
    print('\nFazendo upload de imagens...')
    
    success_count = 0
    failure_count = 0
    
    cursor = conn.cursor()
    
    for equip_id, image_path in matches.items():
        filename = Path(image_path).name
        sys.stdout.write(f'  Equipamento {equip_id}: {filename}... ')
        sys.stdout.flush()
        
        try:
            # Ler arquivo de imagem
            with open(image_path, 'rb') as f:
                image_data = f.read()
            
            # Converter para base64
            base64_data = base64.b64encode(image_data).decode('utf-8')
            
            # Determinar MIME type
            ext = Path(image_path).suffix.lower()
            mime_type = 'image/png' if ext == '.png' else 'image/jpeg'
            
            # Atualizar banco de dados com imagem em base64
            cursor.execute(
                'UPDATE equipamentos SET imagem = ? WHERE id = ?',
                (base64_data, equip_id)
            )
            conn.commit()
            
            print('✓')
            success_count += 1
        except Exception as e:
            print(f'✗ ({str(e)[:30]})')
            failure_count += 1
    
    print(f'\n✓ Upload concluído: {success_count} sucesso, {failure_count} falhas')
    return success_count, failure_count

def main():
    print('=== Bulk Upload de Imagens para Catálogo 710 ===\n')
    
    try:
        conn = get_db_connection()
        equipamentos = get_equipamentos(conn)
        image_files = get_image_files()
        
        if not equipamentos:
            print('✗ Nenhum equipamento encontrado no banco de dados')
            sys.exit(1)
        
        if not image_files:
            print('✗ Nenhum arquivo de imagem encontrado')
            sys.exit(1)
        
        matches, unmatched = match_images_with_equipamentos(equipamentos, image_files)
        
        if not matches:
            print('✗ Nenhuma imagem foi associada a equipamentos')
            sys.exit(1)
        
        success_count, failure_count = upload_matches(conn, matches)
        
        print('\n=== Resumo Final ===')
        print(f'Total de equipamentos: {len(equipamentos)}')
        print(f'Total de imagens: {len(image_files)}')
        print(f'Imagens com match: {len(matches)}')
        print(f'Imagens sem match: {len(unmatched)}')
        print(f'Upload bem-sucedido: {success_count}')
        print(f'Upload com falha: {failure_count}')
        
        if unmatched and len(unmatched) <= 10:
            print('\nImagens sem match:')
            for item in unmatched:
                print(f"  - {item['filename']}")
        
        conn.close()
        sys.exit(0 if success_count > 0 else 1)
    
    except Exception as e:
        print(f'✗ Erro fatal: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
