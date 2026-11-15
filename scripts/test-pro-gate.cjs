#!/usr/bin/env node
// scripts/test-pro-gate.cjs
// =============================================================================
// Porte du bureau pro pendant la mise en ligne anticipée (15/11 : espaces pilotes
// seulement, `config/features.proPilotBoutiques`) :
//   node scripts/test-pro-gate.cjs
// Même chargement que `test-pro-desk.cjs` (`ts-register.cjs`, alias `@/`), modules purs seulement.
// =============================================================================

const Module = require('module');
const path = require('path');
const assert = require('assert/strict');

const ROOT = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolve.call(this, request.startsWith('@/') ? path.join(ROOT, request.slice(2)) : request, ...rest);
};
require('./ts-register.cjs');

const { pilotesDepuisConfig, espacesOuverts, porteDuBureau } = require('../lib/pro/pilot.ts');
const { proTexts } = require('../lib/pro/texts.ts');

let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed += 1;
  } catch (e) {
    console.error(`ÉCHEC : ${name}`);
    throw e;
  }
};

const S = (id) => ({ id, nom: id, kind: 'agence', statut: 'pending' });

test('config : identifiants valides seulement, sans doublon ; autre forme = personne', () => {
  assert.deepEqual([...pilotesDepuisConfig(['b1', 'b1', 3, '', 'a/b', 'b-2'])], ['b1', 'b-2']);
  assert.equal(pilotesDepuisConfig(undefined).size, 0);
  assert.equal(pilotesDepuisConfig('b1').size, 0);
});

test('espaces ouverts : seulement ceux de la liste', () => {
  assert.deepEqual(espacesOuverts([S('b1'), S('b2')], new Set(['b2'])).map((s) => s.id), ['b2']);
  assert.deepEqual(espacesOuverts([S('b1')], new Set()), []);
});

test('porte : attente, fermé (sans boutique aussi, pendant le pilote), ouvert', () => {
  const base = { spaces: [S('b1')], spacesReady: true, pilotes: new Set(['b1']), pilotesError: false };
  assert.equal(porteDuBureau({ ...base, spacesReady: false }), 'attente');
  assert.equal(porteDuBureau({ ...base, pilotes: null }), 'attente');
  assert.equal(porteDuBureau({ ...base, spaces: [] }), 'ferme');
  assert.equal(porteDuBureau({ ...base, pilotes: new Set() }), 'ferme');
  assert.equal(porteDuBureau({ ...base, pilotes: new Set(['autre']) }), 'ferme');
  assert.equal(porteDuBureau({ ...base, pilotes: null, pilotesError: true }), 'ferme');
  assert.equal(porteDuBureau(base), 'ouvert');
});

test('textes de la porte dans les trois langues, sans tiret long', () => {
  for (const locale of ['fr', 'en', 'ar']) {
    const x = proTexts(locale);
    for (const k of ['gate.closedTitle', 'gate.closedBody', 'gate.openApp', 'signin.error.noAccount']) {
      const v = x.t(k);
      assert.ok(v && v !== k, `${locale} ${k}`);
      assert.ok(!/[\u2013\u2014]/.test(v), `${locale} ${k} : tiret long`);
    }
  }
  assert.equal(proTexts('fr').t('gate.closedTitle'), 'L’espace pro n’est pas encore ouvert pour votre compte');
});

console.log(`test-pro-gate : ${passed}/${passed} réussis`);
