# PEI Inteligente - Prototipo

Prototipo navegavel para validar os fluxos de administrador e professor do PEI Inteligente.

## Como acessar

- Administrador: usuario `administrador`, senha `123456`
- Professor: usuario `professor`, senha `123456`

## O que o prototipo faz

- Login por perfil: administrador ou professor.
- Administrador cadastra alunos da inclusao.
- Administrador cadastra professores.
- Administrador vincula alunos a professores.
- Professor visualiza seus alunos vinculados.
- Professor cria PEI do aluno com campos inspirados no modelo MariTalk/Sabia-3.
- Professor gera atividades adaptadas usando as informacoes do estudante.

## Dados e privacidade

Este projeto foi preparado para ser publicado como demonstracao. O aluno inicial usa dados ficticios/anonimizados.

Para uma pagina publica, nao cadastre nomes reais, telefones, documentos, datas de nascimento ou diagnosticos identificaveis. Os cadastros feitos no prototipo ficam salvos apenas no navegador da pessoa que acessou, usando `localStorage`.

Ainda nao existe banco de dados compartilhado em servidor. Para uso real em escola ou instituicao, a proxima etapa recomendada e conectar um banco como Supabase, Firebase ou outro backend com autenticacao.

## Integracao com MariTalk no Vercel

A pasta ja inclui a rota segura `api/maritalk.js`. Ela permite chamar o MariTalk pelo Vercel sem expor a chave no codigo.

No Vercel:

1. Abra o projeto.
2. Va em **Settings > Environment Variables**.
3. Adicione `MARITALK_API_KEY` com a chave da API.
4. Opcionalmente adicione `MARITALK_MODEL` com `sabia-3`.
5. Faca um novo deploy.

Se `MARITALK_API_KEY` nao estiver configurada, o prototipo continua funcionando com uma geracao local demonstrativa.

## Publicar no GitHub e Vercel

1. Crie um repositorio no GitHub.
2. Envie todos os arquivos desta pasta, incluindo `assets`, `api`, `index.html`, `styles2.css`, `app.js` e `vercel.json`.
3. No Vercel, clique em **Add New Project**.
4. Importe o repositorio.
5. Mantenha as configuracoes padrao e publique.

Nao precisa instalar dependencias nem configurar build.
