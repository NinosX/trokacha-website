#!/usr/bin/env node
// scripts/test-pro-site-safety.cjs
// =============================================================================
// Relecture du site par Main (15/11) : robots (S1), retour après connexion (S2),
// porte du bureau pendant le pilote (S4), taille de l'import (S8) ; relecture 2 :
// lecture des espaces en échec (SM2), cas de retour en plus (SM5).
//   node scripts/test-pro-site-safety.cjs
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

// Lecture des règles robots comme Google : préfixe, `*` joker, `$` fin d'adresse,
// la règle la plus longue l'emporte, « allow » gagne à égalité.
function bloque(rules, url) {
  const matches = (pattern) => {
    const anchored = pattern.endsWith('$');
    const body = (anchored ? pattern.slice(0, -1) : pattern).replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${body}${anchored ? '$' : ''}`).test(url);
  };
  const toList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  let best = { len: -1, allow: true };
  for (const rule of toList(rules.rules)) {
    for (const p of toList(rule.allow)) if (matches(p) && p.length >= best.len) best = { len: p.length, allow: true };
    for (const p of toList(rule.disallow)) if (matches(p) && p.length > best.len) best = { len: p.length, allow: false };
  }
  return !best.allow;
}

test('S1 robots : bureau, connexion et /__/ bloqués ; /profile et /proposal ouverts', () => {
  const robots = require('../app/robots.ts').default();
  for (const url of ['/pro', '/pro/', '/pro/b1/planning', '/pro?x=1', '/fr/pro', '/fr/pro/b1/caisse', '/en/pro', '/kab/pro/', '/connexion', '/connexion?next=%2Fpro', '/fr/connexion', '/__/auth/handler', '/api/subscribe']) {
    assert.equal(bloque(robots, url), true, `devrait être bloqué : ${url}`);
  }
  for (const url of ['/', '/profile/abc', '/proposal/xyz', '/fr/profile/abc', '/en/proposal/xyz', '/boutiques', '/ad/123', '/fr']) {
    assert.equal(bloque(robots, url), false, `devrait être ouvert : ${url}`);
  }
});

test('S2 retour après connexion : chemin du bureau seulement, jamais une autre adresse', () => {
  const { safeNext } = require('../lib/pro/safeNext.ts');
  const O = 'https://trokacha.com';
  assert.equal(safeNext(null, O), '/pro');
  assert.equal(safeNext('', O), '/pro');
  assert.equal(safeNext('/pro', O), '/pro');
  assert.equal(safeNext('/pro/b1/planning?mois=2026-11', O), '/pro/b1/planning?mois=2026-11');
  // Préfixe de langue retiré (le routeur du site le remet) : jamais /fr/fr/pro.
  assert.equal(safeNext('/fr/pro/b1/caisse', O), '/pro/b1/caisse');
  for (const bad of [
    '/\t/evil.example',
    '/\t\t/evil.example',
    '/\n/evil.example',
    '/\r/evil.example',
    '/ /evil.example',
    '//evil.example',
    '/\\evil.example',
    '\\/evil.example',
    '/%2F%2Fevil.example',
    '/%09/evil.example',
    'https://evil.example/pro',
    'javascript:alert(1)',
    'evil.example/pro',
    '/pro/../evil',
    '/profile/abc',
    '/proposal/x',
    '/prox',
    '/connexion',
    // Relecture 2 de Main (15/11, SM5).
    '/pro/..//evil.example',
    '/pro/%2e%2e//evil',
    '/pro@evil.example',
    '/pro ',
    '/%5C',
    '/%252F',
    '/pro//x',
    '/pro/b1//evil.example',
  ]) {
    assert.equal(safeNext(bad, O), '/pro', `refusé : ${JSON.stringify(bad)}`);
  }
  // Préfixes de langue du site (ar, fr, en, kab) : retirés, le routeur les remet.
  for (const locale of ['en', 'kab', 'ar', 'fr']) {
    assert.equal(safeNext(`/${locale}/pro`, O), '/pro', `langue ${locale}`);
    assert.equal(safeNext(`/${locale}/pro/b1/caisse`, O), '/pro/b1/caisse', `langue ${locale}, sous-page`);
  }
  assert.equal(safeNext('/de/pro', O), '/pro');
});

test('S4 pendant le pilote : un compte sans boutique voit « pas encore ouvert »', () => {
  const { porteDuBureau } = require('../lib/pro/pilot.ts');
  assert.equal(porteDuBureau({ spaces: [], spacesReady: true, pilotes: new Set(['b1']), pilotesError: false }), 'ferme');
  assert.equal(porteDuBureau({ spaces: [], spacesReady: true, pilotes: null, pilotesError: false }), 'ferme');
  assert.equal(porteDuBureau({ spaces: [], spacesReady: false, pilotes: null, pilotesError: false }), 'attente');
});

test('SM2 : lecture des espaces en échec, une erreur avec « Réessayer », jamais « pas encore ouvert »', () => {
  const { porteDuBureau } = require('../lib/pro/pilot.ts');
  const base = { spaces: [], spacesReady: true, spacesError: true, pilotes: new Set(['b1']), pilotesError: false };
  assert.equal(porteDuBureau(base), 'erreur');
  assert.equal(porteDuBureau({ ...base, pilotes: null }), 'erreur');
  assert.equal(porteDuBureau({ ...base, spacesReady: false }), 'attente');
  assert.equal(porteDuBureau({ ...base, spacesError: false }), 'ferme');
  const { proTexts } = require('../lib/pro/texts.ts');
  for (const locale of ['fr', 'en', 'ar']) {
    const t = proTexts(locale).t;
    for (const key of ['gate.errorTitle', 'gate.errorBody', 'common.retry']) {
      const v = t(key);
      assert.ok(v && v !== key, `${locale} ${key}`);
      assert.ok(!/[\u2013\u2014]/.test(v), `tiret long : ${locale} ${key}`);
    }
  }
});

test('S8 import : 2 Mo et 5 000 lignes au plus, message clair dans les trois langues', () => {
  const { importTropLourd, importTropLong, IMPORT_FICHIER_MAX_OCTETS, IMPORT_TABLE_MAX_LIGNES } = require('../lib/pro/shared/importTableur.ts');
  assert.equal(IMPORT_FICHIER_MAX_OCTETS, 2 * 1024 * 1024);
  assert.equal(IMPORT_TABLE_MAX_LIGNES, 5000);
  assert.equal(importTropLourd(IMPORT_FICHIER_MAX_OCTETS), false);
  assert.equal(importTropLourd(IMPORT_FICHIER_MAX_OCTETS + 1), true);
  assert.equal(importTropLong(5000), false);
  assert.equal(importTropLong(5001), true);
  const { proTexts } = require('../lib/pro/texts.ts');
  for (const locale of ['fr', 'en', 'ar']) {
    const t = proTexts(locale).t;
    for (const key of ['imp.tooBig', 'imp.tooManyRows']) {
      const s = t(key, { max: 5000 });
      assert.ok(s && s !== key, `${locale} ${key}`);
      assert.ok(!/[\u2013\u2014]/.test(s), `tiret long : ${locale} ${key}`);
    }
  }
});

console.log(`test-pro-site-safety : ${passed}/5 réussis`);
