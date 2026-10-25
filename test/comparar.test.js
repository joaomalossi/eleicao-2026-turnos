import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparar } from '../src/comparar.js';

const quase = (atual, esperado) => assert.ok(Math.abs(atual - esperado) < 1e-9, `${atual} ≉ ${esperado}`);

const resultado = (votos13, votos22, { totais = 100, totalizadas = 100, outros = 0 } = {}) => ({
  local: 'xx',
  secoesTotais: totais,
  secoesTotalizadas: totalizadas,
  eleitorado: 1000,
  validos: votos13 + votos22 + outros,
  brancos: 0,
  nulos: 0,
  candidatos: { 13: { nome: 'LULA', votos: votos13 }, 22: { nome: 'FLAVIO BOLSONARO', votos: votos22 } },
  atualizadoEm: null,
});

test('calcula ganho em votos e em pontos percentuais de cada candidato', () => {
  const t1 = resultado(400, 400, { outros: 200 }); // 40% × 40%
  const t2 = resultado(550, 450);                   // 55% × 45%
  const c = comparar(t1, t2);
  assert.equal(c.candidatos['13'].t1.votos, 400);
  assert.equal(c.candidatos['13'].t2.votos, 550);
  assert.equal(c.candidatos['13'].ganhoVotos, 150);
  quase(c.candidatos['13'].t1.pct, 40);
  quase(c.candidatos['13'].t2.pct, 55);
  quase(c.candidatos['13'].ganhoPp, 15);
  assert.equal(c.candidatos['22'].ganhoVotos, 50);
  quase(c.candidatos['22'].ganhoPp, 5);
});

test('informa a margem de cada turno e quem ganhou terreno', () => {
  const t1 = resultado(400, 450, { outros: 150 }); // Flávio +50 votos, +5 p.p.
  const t2 = resultado(520, 480);                   // Lula +40 votos, +4 p.p.
  const c = comparar(t1, t2);
  assert.equal(c.margem.t1.lider, '22');
  assert.equal(c.margem.t1.votos, 50);
  quase(c.margem.t1.pp, 5);
  assert.equal(c.margem.t2.lider, '13');
  assert.equal(c.margem.t2.votos, 40);
  quase(c.margem.t2.pp, 4);
  assert.equal(c.ganhouTerreno, '13');
});

test('marca a comparação como parcial enquanto a apuração não termina', () => {
  const t1 = resultado(400, 400, { outros: 200 });
  const c = comparar(t1, resultado(30, 20, { totais: 200, totalizadas: 50 }));
  quase(c.apuracao, 25);
  assert.equal(c.parcial, true);
  assert.equal(comparar(t1, resultado(550, 450)).parcial, false);
});

test('sem seções apuradas no 2º turno não aponta quem ganhou terreno', () => {
  const t1 = resultado(400, 450, { outros: 150 });
  const c = comparar(t1, resultado(0, 0, { totais: 200, totalizadas: 0 }));
  assert.equal(c.apuracao, 0);
  assert.equal(c.ganhouTerreno, null);
  assert.equal(c.margem.t2.lider, null);
  assert.equal(c.candidatos['13'].t2.pct, 0);
  assert.equal(c.candidatos['13'].ganhoVotos, null);
  assert.equal(c.candidatos['13'].ganhoPp, null);
});

import { escolherFonte } from '../src/comparar.js';

test('usa o boletim de urna enquanto ele tiver mais seções que o resultado oficial', () => {
  const oficial = { ...resultado(0, 0, { totais: 10, totalizadas: 0 }) };
  const bu = { ...resultado(30, 20, { totais: 10, totalizadas: 4 }) };
  assert.deepEqual(escolherFonte(oficial, bu), { resultado: bu, fonte: 'bu' });
  const oficialAvancado = { ...resultado(80, 60, { totais: 10, totalizadas: 4 }) };
  assert.deepEqual(escolherFonte(oficialAvancado, bu), { resultado: oficialAvancado, fonte: 'oficial' });
  assert.deepEqual(escolherFonte(oficial, undefined), { resultado: oficial, fonte: 'oficial' });
});
