// Endereços da API pública de resultados do TSE e busca dos arquivos.

export const BASE = 'https://resultados.tse.jus.br/oficial/ele2026';
export const ELEICAO = { t1: '6257', t2: '6258' };

const pad = (cd) => cd.padStart(6, '0');

// abrangencia: 'br', sigla da UF ('sp'), 'zz' (exterior) ou 'zz' + código da cidade ('zz29700').
export function urlResultado(turno, abrangencia) {
  const cd = ELEICAO[turno];
  const pasta = abrangencia.slice(0, 2);
  return `${BASE}/${cd}/dados/${pasta}/${abrangencia}-c0001-e${pad(cd)}-u.json`;
}

export function urlMunicipios(turno) {
  const cd = ELEICAO[turno];
  return `${BASE}/${cd}/config/mun-e${pad(cd)}-cm.json`;
}

export async function buscarJson(url, { tentativas = 2 } = {}) {
  let erro;
  for (let i = 0; i < tentativas; i++) {
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} em ${url}`);
      return await resp.json();
    } catch (e) {
      erro = e;
    }
  }
  throw erro;
}

// Executa fn sobre cada item com no máximo `limite` chamadas simultâneas.
// Devolve { ok: Map(item -> valor), falhas: [item] }.
export async function emLotes(itens, limite, fn) {
  const ok = new Map();
  const falhas = [];
  let i = 0;
  async function trabalhador() {
    while (i < itens.length) {
      const item = itens[i++];
      try {
        ok.set(item, await fn(item));
      } catch {
        falhas.push(item);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return { ok, falhas };
}

// Arquivos de urna (boletins por seção), publicados à medida que as seções são recebidas.
export const PLEITO_T2 = '3221';
const URNA = `${BASE}/arquivo-urna/${PLEITO_T2}`;
const p4 = (n) => String(n).padStart(4, '0');

export const urlSecoesExterior = () => `${URNA}/config/zz/zz-p00${PLEITO_T2}-cs.json`;

export function urlAuxSecao({ cidade, zona, secao }) {
  return `${URNA}/dados/zz/${cidade}/${p4(zona)}/${p4(secao)}/p00${PLEITO_T2}-zz-m${cidade}-z${p4(zona)}-s${p4(secao)}-aux.json`;
}

export function urlArquivoUrna({ cidade, zona, secao }, hash, nome) {
  return `${URNA}/dados/zz/${cidade}/${p4(zona)}/${p4(secao)}/${hash}/${nome}`;
}
