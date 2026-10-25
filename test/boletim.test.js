import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lerBoletim } from '../src/boletim.js';

const bu = readFileSync(new URL('./fixtures/bu-toquio-s1389.dat', import.meta.url));

test('lê seção e votos para presidente de um boletim de urna real', () => {
  const b = lerBoletim(bu, { eleicao: 6258 });
  assert.equal(b.cidade, '30627');
  assert.equal(b.zona, 1);
  assert.equal(b.secao, 1389);
  assert.equal(b.aptos, 717);
  assert.equal(b.comparecimento, 315);
  assert.deepEqual(b.votos, { 13: 91, 22: 211 });
  assert.equal(b.brancos, 8);
  assert.equal(b.nulos, 5);
});

test('boletim de outra eleição é ignorado', () => {
  assert.equal(lerBoletim(bu, { eleicao: 6257 }), null);
});

import { resultadosPorCidade } from '../src/boletim.js';

test('soma os boletins recebidos de cada cidade e conta as seções', () => {
  const secoes = [
    { cidade: '30627', zona: 1, secao: 1 },
    { cidade: '30627', zona: 1, secao: 2 },
    { cidade: '30627', zona: 1, secao: 3 },
    { cidade: '29955', zona: 1, secao: 9 },
  ];
  const boletins = [
    { cidade: '30627', zona: 1, secao: 1, aptos: 100, comparecimento: 60, votos: { 13: 20, 22: 30 }, brancos: 4, nulos: 6 },
    { cidade: '30627', zona: 1, secao: 2, aptos: 200, comparecimento: 90, votos: { 13: 50, 22: 30 }, brancos: 5, nulos: 5 },
  ];
  const r = resultadosPorCidade(secoes, boletins);
  assert.equal(r['30627'].local, '30627');
  assert.equal(r['30627'].secoesTotais, 3);
  assert.equal(r['30627'].secoesTotalizadas, 2);
  assert.equal(r['30627'].eleitorado, 300);
  assert.equal(r['30627'].validos, 130);
  assert.equal(r['30627'].brancos, 9);
  assert.equal(r['30627'].nulos, 11);
  assert.equal(r['30627'].candidatos['13'].votos, 70);
  assert.equal(r['30627'].candidatos['22'].votos, 60);
  assert.equal(r['29955'].secoesTotais, 1);
  assert.equal(r['29955'].secoesTotalizadas, 0);
  assert.equal(r['29955'].validos, 0);
});
