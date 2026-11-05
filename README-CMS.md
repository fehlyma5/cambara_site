# CMS Cambará — primeira etapa

Esta etapa adiciona o painel inicial de gerenciamento de banners, mantendo a landing page atual separada.

## Arquivos
- `admin/index.html`: tela de login e painel.
- `admin/admin.js`: autenticação Supabase e operações CRUD.
- `admin/admin.css`: estilos responsivos.
- `admin/config.js`: URL e chave pública do Supabase.
- `database/schema.sql`: tabela, permissões RLS e bucket de imagens.

## Configuração necessária
1. Crie um projeto no Supabase.
2. No SQL Editor, execute o conteúdo de `database/schema.sql`.
3. Em Project Settings > API, copie a Project URL e a chave publicável/anon.
4. Preencha `admin/config.js` com esses dois valores.
5. Em Authentication > Users, crie o usuário administrador.
6. Copie o UUID desse usuário e execute o INSERT comentado no final de `database/schema.sql`, definindo role `admin`.
7. Publique os arquivos do site e acesse `/admin/`.

## Segurança
- Não coloque a chave `service_role` no navegador nem no GitHub.
- O painel usa autenticação por e-mail e senha do Supabase.
- As permissões de escrita são controladas no banco por RLS e pela tabela `profiles`.
- O bucket `site-images` é público apenas para leitura, pois as imagens precisam aparecer na página pública. Upload, atualização e exclusão exigem perfil CMS.

## Observação desta etapa
O painel já permite cadastrar, editar, ativar/desativar e excluir banners no Supabase. A conexão automática desses registros com a seção de banners da página pública será feita na próxima integração, preservando os banners atuais como fallback.