// Converte os arquivos "-u.json" da API de resultados do TSE em um Resultado normalizado.

const inteiro = (s) => Number.parseInt(s ?? '0', 10) || 0;

export function parseResultado(json) {
  const candidatos = {};
  for (const agr of json.carg?.[0]?.agr ?? []) {
    for (const par of agr.par ?? []) {
      for (const c of par.cand ?? []) {
        candidatos[c.n] = { nome: c.nmu, votos: inteiro(c.vap) };
      }
    }
  }
  return {
    local: json.cdabr,
    secoesTotais: inteiro(json.s?.ts),
    secoesTotalizadas: inteiro(json.s?.st),
    eleitorado: inteiro(json.e?.te),
    validos: inteiro(json.v?.vv),
    brancos: inteiro(json.v?.vb),
    nulos: inteiro(json.v?.tvn),
    candidatos,
    atualizadoEm: json.dg && json.hg ? `${json.dg} ${json.hg}` : null,
  };
}
