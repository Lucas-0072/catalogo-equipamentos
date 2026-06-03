# Catálogo de Equipamentos — TODO

- [x] Analisar arquivo Excel com 5.689 equipamentos
- [x] Exportar dados do Excel para JSON
- [x] Inicializar projeto web com banco de dados e autenticação
- [x] Criar schema do banco: tabelas equipamentos e fornecedores
- [x] Executar migration do banco de dados
- [x] Desenvolver backend (tRPC): rotas de equipamentos e fornecedores
- [x] Adicionar logo Procytek no header
- [x] Adicionar botões desfazer/refazer no canto superior direito
- [x] Desenvolver frontend: página de catálogo com design preto/amarelo
- [x] Desenvolver frontend: filtros por grupo e subgrupo
- [x] Desenvolver frontend: busca por código, referência e descrição
- [x] Desenvolver frontend: paginação
- [x] Desenvolver frontend: card de equipamento com imagem e fornecedores
- [x] Desenvolver frontend: página de detalhes do equipamento
- [x] Desenvolver frontend: upload de imagem por equipamento
- [x] Desenvolver frontend: seleção de até 3 fornecedores por equipamento
- [x] Desenvolver frontend: página Admin para gerenciar fornecedores
- [x] Hook useUndoRedo com atalhos Ctrl+Z / Ctrl+Y
- [x] Importar 5.689 equipamentos do Excel para o banco de dados
- [x] Exibir grupos com código + referência real do arquivo (ex: 700 - ESTACOES-MP)
- [x] Exibir subgrupos com código numérico real do arquivo (ex: 701, 702...)
- [x] Atualizar nomes de grupos/subgrupos no banco com os valores reais
- [x] Melhorar barra de busca com filtro dedicado por nome e por código
- [x] Adicionar botões Desfazer/Refazer visíveis no header com ícones e tooltips
- [x] Configurar PWA (Service Worker + manifest.json) para acesso offline
- [x] Implementar cache offline dos equipamentos via Service Worker
- [x] Adicionar botão Editar no card do equipamento (modal com todos os campos editáveis)
- [x] Adicionar botão Excluir no card do equipamento (confirmação antes de deletar)
- [x] Criar endpoint de update e delete no backend para equipamentos
- [x] Integrar undo/redo com as ações de editar e excluir
- [x] Header responsivo com menu hamburguer no mobile
- [x] Sidebar de filtros como drawer/gaveta no mobile
- [x] Grid de cards adaptado para 1 coluna no mobile
- [x] Botões de editar/excluir acessíveis por toque no mobile (sem depender de hover)
- [x] Modal de edição com scroll adequado no mobile
- [x] Paginação compacta para telas pequenas
- [x] Analisar colunas do Excel e mapear para schema do banco
- [x] Criar endpoint de upload e sincronização do Excel no backend (upsert por código)
- [x] Criar interface de upload da planilha no painel Admin com barra de progresso
- [x] Exibir relatório pós-sincronização (itens adicionados, atualizados, removidos)
- [x] Criar botão "Novo Equipamento" no catálogo com modal de cadastro completo (todos os campos + imagem + até 3 fornecedores)
- [x] Criar endpoint de criação de equipamento no backend
- [x] Paginação aprimorada: ir para primeira/última página, campo "ir para página", seletor de itens por página (12/24/48/96)
- [x] Indicador de progresso visual (ex: "Página 3 de 238 — 5.689 itens")
- [x] Scroll automático ao topo ao trocar de página
- [x] Criar tabela sync_history no banco para registrar histórico de sincronizações
- [x] Criar endpoint de upload e processamento do Excel com relatório detalhado de diferenças
- [x] Criar interface de sincronização no Admin com upload drag-and-drop, barra de progresso e histórico
- [x] Exibir diff detalhado: itens adicionados, atualizados (com campos alterados) e removidos
- [x] Corrigir bug de inserir imagem (state assíncrono + endpoints sem autenticação)
- [x] Implementar botão para excluir imagem do equipamento
- [x] Corrigir redirecionamento após login (erro 404 após callback OAuth)
- [x] Implementar teste automatizado para validar o fluxo OAuth/callback/redirecionamento
- [x] Remover exibição de NCM do frontend (modais e página de detalhes)

## Autenticação por Departamento

- [x] Criar tabela de departamentos no banco de dados (nome, login, senha hash)
- [x] Implementar endpoints de login/logout por departamento com bcrypt
- [x] Criar tela de login com seleção de departamento (Gestão, Almoxarifado)
- [x] Testar fluxo completo de login por departamento (8 testes automatizados passando)
- [x] Proteger rotas com autenticação de departamento (endpoints protegidos com bcrypt)
- [x] Adicionar painel de gerenciamento de departamentos no Admin

## Controle de Permissões por Departamento

- [x] Criar middleware de autorização para departamentos com permissão de escrita
- [x] Proteger endpoints de escrita (criar, editar, deletar equipamentos e fornecedores)
- [x] Proteger endpoint de sincronização Excel
- [x] Proteger página Admin para apenas Gestão e Almoxarifado (via middleware)
- [x] Adicionar testes de autorização por departamento (7 testes automatizados passando)

## Permiss\u00f5es Configur\u00e1veis por Departamento

- [x] Adicionar coluna de permiss\u00f5es na tabela de departamentos
- [x] Atualizar middleware de autoriza\u00e7\u00e3o para usar permiss\u00f5es do banco
- [x] Atualizar gerenciador de departamentos no Admin com controles de permiss\u00f5es
- [x] Adicionar testes de permiss\u00f5es configur\u00e1veis
- [x] Adicionar modo de edição para nomes de departamentos no gerenciador
- [x] Implementar diálogo de confirmação melhorado para excluir departamentos
- [x] Implementar diálogo de confirmação melhorado para excluir produtos/equipamentos

## Sistema de Lixeira (Soft Delete)

- [x] Adicionar coluna deletedAt ao schema de equipamentos e departamentos
- [x] Atualizar queries para filtrar itens não deletados
- [x] Implementar endpoints de lixeira (listar, restaurar, deletar permanentemente)
- [x] Adicionar testes para funcionalidade de lixeira (18 testes de soft delete)
- [ ] Criar página de lixeira no Admin
