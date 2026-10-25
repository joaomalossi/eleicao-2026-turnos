// Formatação pt-BR para números, percentuais e variações.

const inteiros = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const decimais = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const sinal = (v, texto) => (v > 0 ? `+${texto}` : v < 0 ? `−${texto}` : texto);

export const numero = (v) => inteiros.format(v);
export const percentual = (v) => `${decimais.format(v)}%`;
export const deltaVotos = (v) => sinal(v, inteiros.format(Math.abs(v)));
export const deltaPp = (v) => {
  const arredondado = Math.round(v * 100) / 100;
  return `${sinal(arredondado, decimais.format(Math.abs(arredondado)))} p.p.`;
};
