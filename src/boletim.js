// Lê o boletim de urna (arquivo "-bu.dat" do TSE, ASN.1 DER) de uma seção.

const TIPO_VOTO = { NOMINAL: 1, BRANCO: 2, NULO: 3 };
const CARGO_PRESIDENTE = 1;

// Decodificador DER mínimo: devolve uma árvore { classe, tag, filhos | bytes }.
function lerDer(bytes, inicio = 0, fim = bytes.length) {
  const nos = [];
  let i = inicio;
  while (i < fim) {
    const primeiro = bytes[i++];
    let tag = primeiro & 0x1f;
    if (tag === 0x1f) {
      tag = 0;
      let b;
      do {
        b = bytes[i++];
        tag = (tag << 7) | (b & 0x7f);
      } while (b & 0x80);
    }
    let tamanho = bytes[i++];
    if (tamanho & 0x80) {
      const n = tamanho & 0x7f;
      tamanho = 0;
      for (let k = 0; k < n; k++) tamanho = tamanho * 256 + bytes[i++];
    }
    const no = { classe: primeiro >> 6, tag, construido: Boolean(primeiro & 0x20) };
    if (no.construido) no.filhos = lerDer(bytes, i, i + tamanho);
    else no.bytes = bytes.subarray(i, i + tamanho);
    nos.push(no);
    i += tamanho;
  }
  return nos;
}

function inteiro(no) {
  let v = 0;
  for (const b of no.bytes) v = v * 256 + b;
  return no.bytes.length && no.bytes[0] & 0x80 ? v - 2 ** (8 * no.bytes.length) : v;
}

const contexto = (no, tag) => no.filhos.find((f) => f.classe === 2 && f.tag === tag);

// bytes: Uint8Array/Buffer do arquivo bu.dat.
// Devolve { cidade, zona, secao, aptos, comparecimento, votos: { [numero]: qtd }, brancos, nulos }
// ou null se o boletim não tiver a eleição pedida.
export function lerBoletim(bytes, { eleicao }) {
  const [envelope] = lerDer(bytes);
  const conteudo = envelope.filhos.find((f) => f.classe === 0 && f.tag === 4);
  const [boletim] = lerDer(conteudo.bytes);

  const [municipioZona, , secao] = boletim.filhos[3].filhos; // identificação da seção

  // resultadosVotacaoPorEleicao: SEQUENCE OF { idEleicao, qtdEleitoresAptos, ..., resultadosVotacao }
  const ehDaEleicao = (r) => r.construido && r.filhos[0]?.bytes && r.filhos[0].tag === 2 && inteiro(r.filhos[0]) === eleicao;
  const daEleicao = boletim.filhos.slice(4).flatMap((f) => (f.construido ? f.filhos : [])).find(ehDaEleicao);
  if (!daEleicao) return null;

  const saida = {
    cidade: String(inteiro(municipioZona.filhos[0])),
    zona: inteiro(municipioZona.filhos[1]),
    secao: inteiro(secao),
    aptos: inteiro(daEleicao.filhos[1]),
    comparecimento: 0,
    votos: {},
    brancos: 0,
    nulos: 0,
  };

  const resultadosVotacao = daEleicao.filhos.findLast((f) => f.construido).filhos;
  for (const rv of resultadosVotacao) {
    const [, comparecimento, totaisCargo] = rv.filhos;
    for (const total of totaisCargo.filhos) {
      const cargo = total.filhos[0];
      if (inteiro(cargo) !== CARGO_PRESIDENTE) continue;
      saida.comparecimento = inteiro(comparecimento);
      for (const voto of total.filhos.findLast((f) => f.construido).filhos) {
        const tipo = inteiro(contexto(voto, 1));
        const qtd = inteiro(contexto(voto, 2));
        if (tipo === TIPO_VOTO.NOMINAL) {
          const numero = inteiro(contexto(voto, 3).filhos[1]);
          saida.votos[numero] = (saida.votos[numero] ?? 0) + qtd;
        } else if (tipo === TIPO_VOTO.BRANCO) saida.brancos += qtd;
        else if (tipo === TIPO_VOTO.NULO) saida.nulos += qtd;
      }
    }
  }
  return saida;
}

const NOMES_URNA = { 13: 'LULA', 22: 'FLAVIO BOLSONARO' };

// secoes: todas as seções previstas ({ cidade, zona, secao }); boletins: saídas de lerBoletim.
// Devolve { [cidade]: Resultado } no mesmo formato de parseResultado, com as seções que já têm boletim.
export function resultadosPorCidade(secoes, boletins) {
  const cidades = {};
  const cidade = (cd) => (cidades[cd] ??= {
    local: cd, secoesTotais: 0, secoesTotalizadas: 0, eleitorado: 0,
    validos: 0, brancos: 0, nulos: 0, candidatos: {}, atualizadoEm: null,
  });
  for (const s of secoes) cidade(s.cidade).secoesTotais++;
  for (const b of boletins) {
    const r = cidade(b.cidade);
    r.secoesTotalizadas++;
    r.eleitorado += b.aptos;
    r.brancos += b.brancos;
    r.nulos += b.nulos;
    for (const [n, qtd] of Object.entries(b.votos)) {
      r.candidatos[n] ??= { nome: NOMES_URNA[n] ?? n, votos: 0 };
      r.candidatos[n].votos += qtd;
      r.validos += qtd;
    }
  }
  return cidades;
}
