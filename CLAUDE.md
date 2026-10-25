# Eleição 2026 — 1º × 2º turno

Dashboard estático (GitHub Pages) que compara a apuração do 2º turno presidencial de 2026 com o resultado oficial do 1º turno, por UF e por país do exterior.

- Site: https://joaomalossi.github.io/eleicao-2026-turnos/
- Repo: `joaomalossi/eleicao-2026-turnos` (PRD na issue #1)
- Idioma: interface, código, comentários e commits em português.

## Comandos

```sh
npm test                              # node --test, sem dependências
npm run snapshot                      # regenera data/turno1.json (1º turno, final)
node scripts/boletins-exterior.mjs    # coleta boletins de urna do exterior
python3 -m http.server 8765           # servir localmente (módulos ES exigem HTTP)
```

Não há build, bundler nem dependências. Para publicar, basta fazer push na `main`: o Pages publica sozinho em cerca de 40 s.

## Arquitetura

- O navegador lê a API pública do TSE direto (ela libera CORS para qualquer origem) e se atualiza a cada 10 min. Quando algum arquivo falha, tenta de novo em 2 min.
- O 1º turno é final e fica congelado em `data/turno1.json` (Brasil, 27 UFs e 133 países).
- `data/exterior-bu.json` é gerado pelo workflow `.github/workflows/boletins.yml` (cron a cada 10 min), que faz commits automáticos. Rode `git pull --rebase` antes de dar push.

Módulos em `src/`:

| Módulo | Papel |
|---|---|
| `tse.js` | `parseResultado`: JSON `-u.json` do TSE → `Resultado` normalizado |
| `comparar.js` | `comparar(t1, t2)`: ganhos, margens, quem ganhou terreno, flag `parcial`; `escolherFonte(oficial, bu)` |
| `paises.js` | mapa fixo cidade (código TSE) → país e `agregarPorPais` |
| `boletim.js` | `lerBoletim`: decodifica o BU (ASN.1 DER); `resultadosPorCidade` |
| `tse-api.js` | URLs da API, `buscarJson`, `emLotes` (concorrência limitada) |
| `formato.js` | números, % e deltas no formato pt-BR |
| `view.js` / `app.js` | HTML do placar e das tabelas; ciclo de atualização |

`Resultado` = `{ local, secoesTotais, secoesTotalizadas, eleitorado, validos, brancos, nulos, candidatos: { [numero]: { nome, votos } }, atualizadoEm }`. Tudo que entra no comparador precisa ter esse formato, seja oficial, soma de cidades ou soma de boletins.

## API do TSE — o que não é óbvio

- Base: `https://resultados.tse.jus.br/oficial/ele2026`. Eleições: **6257** = 1º turno, **6258** = 2º turno. Cargo presidente = `c0001`. Lista de eleições: `/oficial/comum/config/ele-c.json`.
- Candidatos: **13** = Lula, **22** = Flávio Bolsonaro.
- Números chegam como string. O % é recalculado a partir dos votos, nunca lido do `pvap`.
- **O exterior (`zz`) é publicado por cidade (186), não por país.** Toda cidade nova precisa entrar no mapa de `paises.js`; um teste de cobertura com a lista real (`test/fixtures/cidades-exterior.json`) quebra se faltar alguma.
- Escolhas do mapa: Guiana Francesa fica separada da França; Hong Kong entra na China; Rio Branco (`30430`) é no Uruguai.
- O resultado oficial só é divulgado depois das 17h (Brasília). Antes disso, o exterior usa os **boletins de urna** de `arquivo-urna/3221` (pleito do 2º turno): config `config/zz/zz-p003221-cs.json` → `-aux.json` da seção → `<hash>/<arquivo>-bu.dat`.
- Na config de seções, as entradas com `nsp` são **agregadas** a uma seção principal e não têm BU próprio. Use só as sem `nsp` (1.351 seções, o mesmo `s.ts` do TSE para `zz`).
- O BU vale só enquanto cobrir mais seções que o oficial (`escolherFonte`). Na interface ele é sempre marcado como não oficial (tag **BU**).

## Testes

- TDD, com testes de comportamento pela interface pública e fixtures reais do TSE em `test/fixtures/`.
- Comparar percentuais com tolerância (`quase`), nunca com igualdade exata.
- Carregador e interface não têm teste automatizado. Valide abrindo a página, por exemplo com Chrome headless: `--virtual-time-budget=20000 --screenshot` ou `--dump-dom`.

## Interface

- Cores fixas por candidato (validadas para daltonismo, claro e escuro): Lula `#d03b33`/`#e8615a`, Flávio `#2a6fdb`/`#5b93f0`. Os tokens ficam em `style.css`.
- Sem votos no 2º turno, os ganhos aparecem como "Aguardando apuração", nunca como valores negativos.
- O ganho em votos leva a tag "parcial" enquanto a apuração do local estiver abaixo de 100%.
- A tabela do exterior oculta os países que ainda não têm votos do 2º turno.
- No celular (390 px), o placar empilha e as tabelas rolam na horizontal dentro do próprio container.

## Depois da eleição

Desativar o workflow `boletins.yml`, que continua rodando até ser desligado:

```sh
gh workflow disable boletins.yml
```
