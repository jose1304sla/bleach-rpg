# Soul Reborn — RPG espiritual

RPG de fã inspirado em Bleach, jogável localmente. React + TypeScript, Tailwind CSS, Framer Motion, Node.js e SQLite nativo. Sem dinheiro real. Não afiliado aos titulares de Bleach.

## Iniciar no Windows

Dê dois cliques em **INICIAR.cmd**, ou execute **iniciar.ps1** no PowerShell dentro desta pasta:

```powershell
powershell -ExecutionPolicy Bypass -File .\iniciar.ps1
```

O script usa o Node portátil em .runtime quando presente ou Node instalado no PATH. Instala dependências ausentes, compila a interface e inicia o servidor em **http://127.0.0.1:3001**. Encerre com Ctrl+C. Node 24+ é necessário (SQLite nativo).

Alternativa com Node instalado:

```sh
npm install
npm run build
npm start
```

Desenvolvimento: `npm run dev` (Vite em http://127.0.0.1:5173, API em 3001).
Verificações: `npm test` e `npm run build`.

## Jogar

1. Crie o personagem e escolha Shinigami, Hollow, Quincy ou Fullbringer.
2. Você recebe 6 giros, 150 moedas, 3 poções e 5 pontos de atributos.
3. Role uma família. Para Shinigami, role também a Zanpakutō. Cada giro substitui o item equipado; é irreversível. Estágios dominados são preservados.
4. Distribua pontos na tela Personagem e enfrente Almas errantes.
5. Treine a cada 10 segundos, vença combates e colete missões.
6. Consulte Evolução para requisitos completos. Complete a missão de evolução para liberar o próximo estágio; depois ative a transformação em cada batalha.
7. Resgate 2 giros por dia UTC. Cada 3 vitórias dão mais 1 giro. Poções custam 30 moedas.

Não existe morte permanente. Cada novo encontro restaura vida e energia. Derrotas e retiradas não concedem recompensas. Os adversários avançados exigem nível mínimo igual ao nível do inimigo menos 5. Chefes são personagens originais do jogo. Inimigos muito abaixo do seu nível dão menos XP.

## Sistemas e arquitetura

- `server/balance.mjs`: tabelas de probabilidades inteiras, famílias, lâminas, raças, inimigos, missões, limite de nível e requisitos.
- `server/engine.mjs`: regras puras testáveis para progressão, atributos, roletas, missões e combate.
- `server/index.mjs`: HTTP/API e SQLite transacional.
- `src/main.tsx`: criação, dashboard, ficha, duas roletas animadas, evolução, habilidades, missões, combate, inventário e histórico.
- `src/types.ts`: contratos da interface.
- src/components/: interface reutilizável e tela de combate; src/api.ts: acesso à API.
- `src/styles.css`: tema responsivo, arte original em CSS e suporte a movimento reduzido.
- `tests/`: testes determinísticos de regras, probabilidades e integração HTTP.

O servidor é a autoridade sobre todo o estado. O cliente só envia intenções; não aceita valores de XP, dano, moeda, raridade ou recompensa. Sorteios usam `crypto.randomInt`, selecionando raridade e depois item uniforme. A configuração é validada ao iniciar, totalizando exatamente 10.000 unidades = 100%. Zangetsu e Kyōka Suigetsu têm 0,05% cada.

A API usa cookie HttpOnly/SameSite e tokens aleatórios de 256 bits armazenados como SHA-256 no banco, valida origem, limita tamanho de requisições e frequência de ações. Escritas do personagem usam transações SQLite. Não há CORS aberto. O servidor escuta somente em loopback. Não publique diretamente como serviço de internet: contas, HTTPS, recuperação de acesso, proteção contra abuso distribuído e operação multiusuário ainda precisam de implementação. A camada de sessão é isolada para futura associação a contas.

## Salvamento

`data/game.sqlite` guarda todo o estado, inclusive batalha em andamento, missões, histórico de até 100 giros, atributos e inventário. O cookie deste navegador identifica o personagem. Não limpe os dados do navegador para manter o acesso. Não há autenticação nem recuperação de personagem nesta versão. Outro perfil de navegador cria outro personagem.

Para backup, encerre o servidor e copie a pasta `data`. Ela é ignorada pelo Git. Não utilize os bancos SQLite da pasta superior; eles não pertencem ao jogo e não são modificados.

## Fórmulas

A = atributo distribuído + bônus racial + bônus de família; L = nível.
- HP = 100 + Resistência × 14 + L × 8.
- Energia = 60 + Reiatsu × 8 + Controle × 3.
- Dano físico = 10 + Força × 3 + L × 2.
- Dano espiritual = 10 + Reiatsu × 3 + Inteligência × 1,5 + L × 2.
- Defesa = Resistência × 1,6 + Controle × 0,4.
- Crítico = min(35%, 5% + Inteligência × 0,2% + Velocidade × 0,1%); crítico multiplica dano por 1,5.
- Esquiva = min(30%, Velocidade × 0,3%); ação Esquivar soma 45%; iniciativa superior acrescenta 4%, limite total de 80%.
- Iniciativa = Velocidade × 2 + L. O jogador escolhe sua ação primeiro; iniciativa modifica a evasão.
- Regeneração = 2 + floor(Controle / 6) de energia por turno.
- Dano final = max(1, floor((poder − Defesa do alvo × 0,55) × crítico)).
- Transformação multiplica poder por 1,3 + estágio × 0,17.
- Técnica espiritual aplica poder espiritual × 1,35. Uma lâmina liberada aplica ainda × (1 + raridade × 0,025), de 1 a 1,15, para manter todas viáveis.
- XP por nível = 80 + nível × 20. Limite inicial: 100; 3 pontos por nível.
- Recarga indicada internamente inclui o turno de uso: técnica 2 turnos completos de espera, racial 3.

Queimadura causa dano ao longo dos turnos; congelamento bloqueia uma ação; enfraquecimento reduz ataque; drenagem recupera vida ou retira energia; perfuração ignora parte da defesa. Inimigos possuem resistência a um efeito. Resistência a efeito reduz dano espiritual em 30% e impede sua aplicação. Defesa reduz dano recebido em 65%. A transformação altera aura CSS e dano; técnicas próprias das lâminas são liberadas com Shikai.

## Conteúdo canônico e original

Os nomes exigidos de famílias e Zanpakutōs foram incluídos. A classificação de raridade, passivas, equilíbrio, técnicas, efeitos e progressões são adaptações de jogo, não afirmações sobre escalas canônicas. Famílias comuns e incomuns (Aokawa, Mizuhara, Ishikaze, Tsukimori e Akeboshi) são originais. Hisagi e Kira são sobrenomes canônicos usados como heranças de RPG; não são apresentados como casas nobres oficiais. Asauchi Brisa/Pedra/Centelha/Maré/Eco e suas liberações são originais.

Kyōka Suigetsu, Itegumo, Tobiume, Haineko e Wabisuke não recebem um Bankai apresentado como oficial: suas liberações avançadas são marcadas como originais. Todos os nomes das técnicas de combate e efeitos são criações/adaptações do RPG. Schrift genérico e evolução de Fullbring também são mecânicas próprias, sem inventar revelações oficiais. As árvores de Hollow representam marcos principais, simplificados para jogabilidade.

## Limites desta entrega

Versão local jogável com os seis blocos de sistemas integrados. Sem PvP, multiplayer, contas, áudio, mapa explorável ou animações individuais para cada lâmina. A interface usa runas, aura e arte CSS próprias; técnicas possuem técnicas próprias e seis paletas de aura, compartilhando a estrutura de animações e efeitos. Lâminas diferem por efeitos configurados, mas não recriam individualmente todo o arsenal canônico. A divisão em componentes pode ser ampliada à medida que novas telas forem adicionadas.

A documentação de SQLite nativo está em https://nodejs.org/api/sqlite.html; Node oficial em https://nodejs.org/en/download.
