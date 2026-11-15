#!/usr/bin/env node
// scripts/test-pro-desk.cjs
// =============================================================================
// Tests des modules PURS du bureau pro (le site n'a pas de lanceur de tests) :
//   node scripts/test-pro-desk.cjs
// Charge le TypeScript à la volée avec sucrase (déjà dans node_modules, aucune
// dépendance ajoutée) et résout l'alias `@/` vers la racine du site.
// =============================================================================

const Module = require('module');
const path = require('path');
const assert = require('assert/strict');

const ROOT = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  return resolve.call(this, request.startsWith('@/') ? path.join(ROOT, request.slice(2)) : request, ...rest);
};
require('sucrase/register/ts');

const { colonneDeEntete, detecterEntete, apercu, lignesBrutes, parseTable, estMemeNom } = require('../lib/pro/shared/importTableur.ts');
const { displayPhone } = require('../lib/pro/shared/format.ts');
const { wilayaName } = require('../lib/pro/shared/wilayas.ts');
const { proTexts } = require('../lib/pro/texts.ts');
const { cleTitre } = require('../lib/pro-core');

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

test('colonnes de la flotte : « Prix par jour dès 7 jours » est le prix dès 7 jours', () => {
  const h = ['Nom', 'Plaque', 'Prix par jour', 'Prix par jour dès 7 jours', 'Kilométrage', 'Places', 'Type'];
  assert.deepEqual(h.map((x) => colonneDeEntete(x, 'flotte')), ['titre', 'plaque', 'prixJour', 'prixSemaine', 'km', 'capacite', 'kind']);
  assert.equal(colonneDeEntete('Prix semaine (DA)', 'flotte'), 'prixSemaine');
  assert.equal(colonneDeEntete('Prix 7j', 'flotte'), 'prixSemaine');
  assert.equal(colonneDeEntete('Tarif à partir de 7 jours', 'flotte'), 'prixSemaine');
  assert.equal(colonneDeEntete('Price per day from 7 days', 'flotte'), 'prixSemaine');
  assert.equal(colonneDeEntete('Weekly rate', 'flotte'), 'prixSemaine');
  assert.equal(colonneDeEntete('السعر اليومي من 7 أيام', 'flotte'), 'prixSemaine');
  assert.equal(colonneDeEntete('سعر الأسبوع', 'flotte'), 'prixSemaine');
  assert.equal(colonneDeEntete('Prix par jour', 'flotte'), 'prixJour');
  assert.equal(colonneDeEntete('Prix (DA)', 'flotte'), 'prixJour');
  assert.equal(colonneDeEntete('السعر اليومي', 'flotte'), 'prixJour');
  // Articles : pas de prix à la semaine.
  assert.equal(colonneDeEntete('Prix', 'articles'), 'prix');
  const d = detecterEntete([h, ['Seat Ibiza', '01234-120-42', '5 500 DA', '5000', '61000', '5', 'voiture']], 'flotte');
  assert.equal(d.aUneEntete, true);
  assert.deepEqual(d.correspondance, ['titre', 'plaque', 'prixJour', 'prixSemaine', 'km', 'capacite', 'kind']);
});

test('aperçu de la flotte : même nom sans plaque laissé de côté, sauf la case cochée', () => {
  const rows = parseTable(
    'Nom\tPlaque\tPrix par jour\nSeat Ibiza\t01234-120-42\t5500\nRenault Clio 5\t\t5000\nF2 Tipaza plage\t\t9000\nf2 tipaza plage\t\t9000\nSeat Ibiza\t09999-120-42\t5500\n',
  );
  const d = detecterEntete(rows, 'flotte');
  const brutes = lignesBrutes(rows, d.correspondance, d.aUneEntete);
  const existants = { titres: new Set([cleTitre('Renault Clio 5')]), plaques: new Set(['01234120 42'.replace(/\s/g, '')]) };
  const sans = apercu('flotte', brutes, existants).map((l) => l.raison);
  assert.deepEqual(sans, ['DEJA_AU_CATALOGUE', 'MEME_NOM_FLOTTE', null, 'MEME_NOM_LIGNE', null]);
  assert.equal(estMemeNom(sans[1]), true);
  assert.equal(estMemeNom(sans[0]), false);
  const avec = apercu('flotte', brutes, existants, { memesNoms: true }).map((l) => l.raison);
  assert.deepEqual(avec, ['DEJA_AU_CATALOGUE', null, null, null, null]);
});

test('téléphone : un seul format', () => {
  assert.equal(displayPhone('+213699876543'), '0699 87 65 43');
  assert.equal(displayPhone('0699876543'), '0699 87 65 43');
  assert.equal(displayPhone('+21321234567'), '021 23 45 67');
  assert.equal(displayPhone('+33612345678'), '+33612345678');
  assert.equal(displayPhone('pas un numéro'), 'pas un numéro');
  assert.equal(displayPhone(''), null);
});

test('wilaya : le nom, pas le code', () => {
  assert.equal(wilayaName('16', 'fr'), 'Alger');
  assert.equal(wilayaName('16', 'ar'), 'الجزائر');
  assert.equal(wilayaName('9', 'fr'), 'Blida');
  assert.equal(wilayaName('31', 'en'), 'Oran');
  assert.equal(wilayaName('Ailleurs', 'fr'), 'Ailleurs');
  assert.equal(wilayaName(null, 'fr'), '');
});

test('montant négatif : vrai signe moins dans un isolat gauche-à-droite', () => {
  const fr = proTexts('fr');
  const ar = proTexts('ar');
  assert.equal(fr.money(-2000), '⁦−2 000⁩ DA');
  assert.ok(ar.money(-2000).includes('⁦−2'));
  assert.ok(ar.money(-2000).endsWith('⁩ دج'));
  assert.equal(fr.money(2000), '2 000 DA');
});

console.log(`Bureau pro : ${passed} tests verts.`);
