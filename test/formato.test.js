import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numero, percentual, deltaVotos, deltaPp } from '../src/formato.js';

test('números e percentuais no formato brasileiro', () => {
  assert.equal(numero(56104503), '56.104.503');
  assert.equal(percentual(47.0278), '47,03%');
  assert.equal(percentual(0), '0,00%');
});

test('deltas levam sinal explícito', () => {
  assert.equal(deltaVotos(1234567), '+1.234.567');
  assert.equal(deltaVotos(-50), '−50');
  assert.equal(deltaVotos(0), '0');
  assert.equal(deltaPp(4.256), '+4,26 p.p.');
  assert.equal(deltaPp(-0.5), '−0,50 p.p.');
  assert.equal(deltaPp(0), '0,00 p.p.');
});
