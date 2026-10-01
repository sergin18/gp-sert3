# SERTÂNIA: DESAFIO DE GESTÃO

Simulador educacional de gestão pública municipal, ambientado em um município fictício inspirado no sertão pernambucano.

> **Aviso:** simulação fictícia e educativa. Não representa a Prefeitura de Sertânia nem pessoas reais. Todos os personagens (conselheiros, vereadores, jornal) são fictícios ou paródicos, e os valores financeiros são inventados.

## Objetivo

Governar por 4 anos com recursos limitados: decidir diante de eventos aleatórios, equilibrar indicadores, negociar com a Câmara, executar projetos e encarar as consequências, inclusive as que aparecem meses depois. Não existe resposta certa.

## Tecnologias

HTML5, CSS3 e JavaScript puro (sem backend, sem build, sem dependências).

## Estrutura

```text
index.html          telas, modais e containers
css/style.css       estilos organizados por seção
js/game.js          estado central, calendário, interface, balanço e fim do mandato
js/economy.js       orçamento, receitas, despesas e custos (caixa único: S.b)
js/save.js          localStorage (sertania_save_v2, migra o v1)
js/news.js          Tribuna do Mocotó
js/events.js        banco de eventos, sorteio ponderado e consequências
js/council.js       conselheiros, Câmara, busca de apoio e votação
js/projects.js      projetos, execução e desbloqueios por eventos
js/main.js          ações dos botões e inicialização
assets/icons/       favicon
```

Os scripts são clássicos (não ES modules) e compartilham o escopo global, por isso a ordem de carregamento no `index.html` importa: `game → economy → save → news → events → council → projects → main`.

## Como executar

Abra o `index.html` no navegador (duplo clique). Não precisa de servidor.

## Publicar no GitHub Pages

1. Envie esta pasta para um repositório (o `index.html` deve ficar na raiz).
2. Em **Settings → Pages**, escolha **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
3. Aguarde alguns minutos e acesse o endereço indicado.

Todos os caminhos são relativos.

## Save

O progresso fica no `localStorage` do navegador (`sertania_save_v2`). Saves antigos (`sertania_save_v1`) são lidos e migrados automaticamente, sem perder o mandato.

## Próximas expansões previstas

Economia 2.0 (receitas externas, salários, déficit, reserva) em `economy.js`; Câmara 2.0 em `council.js`; Projetos 2.0 em `projects.js`; notícias geradas pelos acontecimentos em `news.js`; avaliação final com nota de 0 a 10.

Desenvolvido por Serg!n
