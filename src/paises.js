// O TSE publica o exterior por cidade (abrangência ZZ). Este módulo agrupa as cidades por país.

const CIDADES_POR_PAIS = {
  'África do Sul': ['29530', '30376'],
  Albânia: ['99139'],
  Alemanha: ['29386', '29696', '30180'],
  Angola: ['29998'],
  'Antígua e Barbuda': ['99147'],
  'Arábia Saudita': ['30422'],
  Argélia: ['29300'],
  Argentina: ['29467', '29602', '39004', '30295', '99155'],
  Armênia: ['38989'],
  Austrália: ['29491', '30562'],
  Áustria: ['30767'],
  Azerbaijão: ['39128'],
  Bahamas: ['99180'],
  Bahrein: ['99473'],
  Bangladesh: ['29629'],
  Barbados: ['29424'],
  Bélgica: ['29432'],
  Belize: ['38881'],
  Benin: ['38920'],
  Bolívia: ['99210', '29572', '29904', '99236', '30473'],
  'Bósnia e Herzegovina': ['30988'],
  Botsuana: ['30669'],
  Bulgária: ['30546'],
  'Burkina Faso': ['39284'],
  'Cabo Verde': ['30368'],
  Camarões: ['29815'],
  Canadá: ['30155', '30252', '30635', '39063'],
  Catar: ['29653'],
  Cazaquistão: ['39241'],
  Chile: ['30481'],
  China: ['30651', '29793', '30317', '30848'],
  Chipre: ['39322'],
  Colômbia: ['29408'],
  Congo: ['39187'],
  'Coreia do Norte': ['99295'],
  'Coreia do Sul': ['30538'],
  'Costa do Marfim': ['29254'],
  'Costa Rica': ['30511'],
  Croácia: ['39020'],
  Cuba: ['29777'],
  Dinamarca: ['29599'],
  Egito: ['29483'],
  'El Salvador': ['30520'],
  'Emirados Árabes Unidos': ['29262'],
  Equador: ['30392'],
  Eslováquia: ['39209'],
  Eslovênia: ['39160'],
  Espanha: ['29351', '30066'],
  'Estados Unidos': ['39080', '29416', '29513', '30902', '29807', '29980', '30112', '30228', '99490', '30503', '30783'],
  Estônia: ['99317'],
  Etiópia: ['99325'],
  Filipinas: ['30082'],
  Finlândia: ['29785'],
  França: ['30287', '99511'],
  Gabão: ['29939'],
  Gana: ['29270'],
  Geórgia: ['99104'],
  Grécia: ['29335'],
  Guatemala: ['98000'],
  Guiana: ['29718'],
  'Guiana Francesa': ['29475', '99333'],
  Guiné: ['38903'],
  'Guiné Equatorial': ['39263'],
  'Guiné-Bissau': ['29394'],
  Haiti: ['30333'],
  Honduras: ['30600'],
  Hungria: ['29459'],
  Índia: ['30171', '30210'],
  Indonésia: ['29840'],
  Irã: ['30597'],
  Iraque: ['99171'],
  Irlanda: ['29661'],
  Israel: ['30619'],
  Itália: ['30120', '30449'],
  Jamaica: ['99430'],
  Japão: ['29742', '30198', '30627'],
  Jordânia: ['29289'],
  Kuwait: ['29882'],
  Líbano: ['29360'],
  Líbia: ['30686'],
  Malásia: ['29890'],
  Malaui: ['99341'],
  Mali: ['99350'],
  Marrocos: ['30406'],
  México: ['30104'],
  Mianmar: ['99376'],
  Moçambique: ['30090'],
  Namíbia: ['30821'],
  Nepal: ['29173'],
  Nicarágua: ['30074'],
  Nigéria: ['99198', '29912'],
  Noruega: ['30244'],
  'Nova Zelândia': ['30805'],
  Omã: ['39102'],
  'Países Baixos': ['30457'],
  Palestina: ['30414'],
  Panamá: ['30260'],
  Paquistão: ['29831'],
  Paraguai: ['29327', '29556', '29580', '29670', '30309', '30465'],
  Peru: ['29823', '29947'],
  Polônia: ['30740'],
  Portugal: ['30961', '29955', '30341'],
  Quênia: ['30201'],
  'Reino Unido': ['99503', '29971'],
  'República Democrática do Congo': ['29874'],
  'República Dominicana': ['30490'],
  'República Tcheca': ['30350'],
  Romênia: ['29440'],
  Rússia: ['30163'],
  'Santa Lúcia': ['99384'],
  'São Tomé e Príncipe': ['39225'],
  Senegal: ['29610'],
  Sérvia: ['29378'],
  Singapura: ['29548'],
  Síria: ['29637'],
  'Sri Lanka': ['30929'],
  Suécia: ['29688'],
  Suíça: ['29700', '30864'],
  Suriname: ['30279'],
  Tailândia: ['29343'],
  Taiwan: ['30570'],
  Tanzânia: ['38962'],
  'Timor-Leste': ['29645'],
  Togo: ['29963'],
  'Trinidad e Tobago': ['30325'],
  Tunísia: ['30708'],
  Turquia: ['29297', '39306'],
  Ucrânia: ['29858'],
  Uruguai: ['29319', '29521', '30147', '30430', '99244'],
  Venezuela: ['29505', '29564', '99279'],
  Vietnã: ['29750'],
  Zâmbia: ['99287'],
  Zimbábue: ['29769'],
};

const PAIS_DA_CIDADE = Object.fromEntries(
  Object.entries(CIDADES_POR_PAIS).flatMap(([pais, cidades]) => cidades.map((cd) => [cd, pais])),
);

export const CIDADES_EXTERIOR = Object.keys(PAIS_DA_CIDADE);

export const paisDaCidade = (codigo) => PAIS_DA_CIDADE[codigo] ?? null;

function somar(pais, resultados) {
  const total = {
    local: pais, secoesTotais: 0, secoesTotalizadas: 0, eleitorado: 0,
    validos: 0, brancos: 0, nulos: 0, candidatos: {}, atualizadoEm: null,
  };
  for (const r of resultados) {
    for (const campo of ['secoesTotais', 'secoesTotalizadas', 'eleitorado', 'validos', 'brancos', 'nulos']) {
      total[campo] += r[campo];
    }
    for (const [n, c] of Object.entries(r.candidatos)) {
      total.candidatos[n] ??= { nome: c.nome, votos: 0 };
      total.candidatos[n].votos += c.votos;
    }
  }
  return total;
}

// resultados: Resultado de cidades do exterior (local = código TSE da cidade).
// Devolve { [país]: Resultado somado }.
export function agregarPorPais(resultados) {
  const grupos = {};
  for (const r of resultados) {
    const pais = paisDaCidade(r.local);
    if (!pais) continue;
    (grupos[pais] ??= []).push(r);
  }
  return Object.fromEntries(Object.entries(grupos).map(([pais, rs]) => [pais, somar(pais, rs)]));
}
