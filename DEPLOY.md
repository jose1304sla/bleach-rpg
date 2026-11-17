# Publicação online — Soul Reborn

## O que esta configuração prepara
- Servidor Node.js acessível pelo proxy da hospedagem (`0.0.0.0`).
- HTTPS/cookie `Secure` em produção atrás de proxy HTTPS.
- SQLite em disco persistente (`/var/data/game.sqlite`).
- Cada navegador/dispositivo recebe uma sessão e um personagem independentes.

## Publicar no Render
1. Crie um repositório GitHub privado e envie o conteúdo desta pasta (não envie `node_modules`, `.runtime` nem dados locais).
2. No Render, crie um serviço usando esse repositório e o arquivo `render.yaml`.
3. O serviço usa `npm ci && npm run build` e `npm start`.
4. Aguarde o deploy e teste `/api/catalog` e a página inicial.

O arquivo `render.yaml` usa plano Starter porque a persistência SQLite requer disco persistente. Um plano gratuito com armazenamento efêmero pode apagar os personagens em reinicializações/redeploys.

## Limitação importante
Esta versão usa sessões anônimas por navegador, não contas com e-mail/senha. Cada navegador cria e mantém seu próprio personagem enquanto conservar o cookie. Se a pessoa limpar os dados do navegador ou trocar de dispositivo, não há recuperação de personagem. Para contas recuperáveis será necessário implementar cadastro/login e migração de sessão.

## Segurança e operação
- Use somente HTTPS público.
- Configure backups regulares do volume `/var/data`.
- Não compartilhe o banco SQLite local incluído no ZIP original; ele não é necessário para iniciar o servidor público.
- O servidor foi preparado para uma única instância com SQLite. Não escale horizontalmente múltiplas instâncias usando o mesmo arquivo SQLite.
