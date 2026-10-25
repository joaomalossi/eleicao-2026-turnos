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
