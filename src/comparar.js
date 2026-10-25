// Compara o Resultado do 1º turno com o do 2º turno para os dois candidatos da disputa.

export const CANDIDATOS = ['13', '22'];

const pct = (votos, validos) => (validos > 0 ? (votos / validos) * 100 : 0);

function desempenho(r, numero) {
  const votos = r?.candidatos?.[numero]?.votos ?? 0;
  return { votos, pct: pct(votos, r?.validos ?? 0) };
}

function margem(candidatos, [a, b], turno) {
  const va = candidatos[a][turno];
  const vb = candidatos[b][turno];
  if (va.votos === vb.votos) return { lider: null, votos: 0, pp: 0 };
  const [lider, segundo] = va.votos > vb.votos ? [a, b] : [b, a];
  const l = candidatos[lider][turno];
  const s = candidatos[segundo][turno];
  return { lider, votos: l.votos - s.votos, pp: l.pct - s.pct };
}

export function comparar(t1, t2, numeros = CANDIDATOS) {
  const comVotos = (t2?.validos ?? 0) > 0;
  const candidatos = {};
  for (const n of numeros) {
    const a = desempenho(t1, n);
    const b = desempenho(t2, n);
    candidatos[n] = {
      nome: t2?.candidatos?.[n]?.nome ?? t1?.candidatos?.[n]?.nome ?? n,
      t1: a,
      t2: b,
      ganhoVotos: comVotos ? b.votos - a.votos : null,
      ganhoPp: comVotos ? b.pct - a.pct : null,
    };
  }
  const [a, b] = numeros;
  const apuracao = t2?.secoesTotais > 0 ? (t2.secoesTotalizadas / t2.secoesTotais) * 100 : 0;
  const saldo = comVotos ? candidatos[a].ganhoPp - candidatos[b].ganhoPp : 0;
  return {
    apuracao,
    parcial: apuracao < 100,
    candidatos,
    margem: { t1: margem(candidatos, numeros, 't1'), t2: margem(candidatos, numeros, 't2') },
    ganhouTerreno: saldo > 0 ? a : saldo < 0 ? b : null,
  };
}

// Escolhe entre o resultado oficial do TSE e a soma dos boletins de urna:
// o boletim vale só enquanto cobrir mais seções que o oficial.
export function escolherFonte(oficial, bu) {
  if (bu && bu.secoesTotalizadas > (oficial?.secoesTotalizadas ?? 0)) return { resultado: bu, fonte: 'bu' };
  return { resultado: oficial, fonte: 'oficial' };
}
