#!/usr/bin/env node
// scripts/test-public-boutiques.cjs
// =============================================================================
// Tests du module PUR des pages publiques des agences et boutiques :
//   node scripts/test-public-boutiques.cjs
// Même lanceur que `test-pro-desk.cjs` (`ts-register.cjs`, typescript déclaré).
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

const {
  availabilityLabel,
  espaceKindOf,
  rentalFreeFrom,
  rentalPriceLabel,
  shortDate,
  sizesLabel,
  toBoutiqueAd,
  visibleSorted,
} = require('../lib/boutiquePublic.ts');

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
const bidi = (s) => s.replace(/[⁦⁩]/g, '');

const TODAY = '2026-11-15';

test('libre aujourd’hui : aucune plage, ou seulement des plages passées ou à venir', () => {
  assert.equal(rentalFreeFrom([], TODAY), null);
  assert.equal(rentalFreeFrom([{ start: '2026-11-01', end: '2026-11-15' }], TODAY), null, 'fin exclusive : rendue ce matin');
  assert.equal(rentalFreeFrom([{ start: '2026-11-16', end: '2026-11-20' }], TODAY), null, 'réservée demain seulement');
});

test('occupée aujourd’hui : libre au lendemain de la fin, plages qui se touchent fusionnées', () => {
  assert.equal(rentalFreeFrom([{ start: '2026-11-14', end: '2026-11-18' }], TODAY), '2026-11-18');
  // Une réservation puis le tampon de ménage déjà compris dans la fin, puis un blocage collé.
  assert.equal(
    rentalFreeFrom(
      [
        { start: '2026-11-20', end: '2026-11-22' },
        { start: '2026-11-15', end: '2026-11-17' },
        { start: '2026-11-17', end: '2026-11-20' },
      ],
      TODAY,
    ),
    '2026-11-22',
  );
  // Un trou d'un jour : libre dès le trou.
  assert.equal(
    rentalFreeFrom(
      [
        { start: '2026-11-15', end: '2026-11-17' },
        { start: '2026-11-18', end: '2026-11-25' },
      ],
      TODAY,
    ),
    '2026-11-17',
  );
});

test('plages invalides ignorées', () => {
  assert.equal(rentalFreeFrom([{ start: 'demain', end: '2026-11-18' }, { start: '2026-11-18', end: '2026-11-10' }], TODAY), null);
});

test('libellés : date courte, année affichée seulement si différente', () => {
  assert.equal(shortDate('2026-11-18', TODAY), '18/11');
  assert.equal(shortDate('2027-01-03', TODAY), '03/01/2027');
  const car = { kind: 'car', pricingTiers: [], busy: [{ start: '2026-11-10', end: '2026-11-18' }] };
  assert.deepEqual(
    { ...availabilityLabel(car, TODAY, 'fr'), text: bidi(availabilityLabel(car, TODAY, 'fr').text) },
    { free: false, text: 'Libre à partir du 18/11' },
  );
  assert.equal(bidi(availabilityLabel(car, TODAY, 'ar').text), 'متاحة ابتداءً من 18/11');
  assert.equal(bidi(availabilityLabel(car, TODAY, 'en').text), 'Available from 18/11');
  const immo = { kind: 'immo', pricingTiers: [], busy: [] };
  assert.deepEqual(availabilityLabel(immo, TODAY, 'fr'), { free: true, text: 'Libre aujourd’hui' });
  assert.equal(availabilityLabel(immo, TODAY, 'ar').text, 'متاح اليوم');
});

test('prix d’une location : fixe ou « à partir de », par jour ou par nuit', () => {
  const tiers = [
    { upToDays: 6, pricePerDay: 4500 },
    { upToDays: null, pricePerDay: 4050 },
  ];
  assert.equal(bidi(rentalPriceLabel({ kind: 'car', pricingTiers: tiers, busy: [] }, 4500, 'fr')), 'à partir de 4 050 DA par jour');
  assert.equal(bidi(rentalPriceLabel({ kind: 'immo', pricingTiers: [{ upToDays: null, pricePerDay: 9000 }], busy: [] }, 9000, 'ar')), '9 000 دج لليلة');
  assert.equal(bidi(rentalPriceLabel({ kind: 'car', pricingTiers: [], busy: [] }, 5000, 'en')), '5 000 DA per day');
  assert.equal(rentalPriceLabel({ kind: 'car', pricingTiers: [], busy: [] }, null, 'fr'), null);
});

test('tailles en stock', () => {
  assert.equal(sizesLabel([], 'fr'), '');
  assert.equal(bidi(sizesLabel(['S', 'M', 'L'], 'fr')), 'Tailles : S · M · L');
  assert.equal(bidi(sizesLabel(['40', '42'], 'ar')), 'المقاسات: 40 · 42');
});

test('agence ou boutique, comme l’app', () => {
  assert.equal(espaceKindOf(['location_voiture']), 'agence');
  assert.equal(espaceKindOf(['location_voiture', 'location_immobilier']), 'agence');
  assert.equal(espaceKindOf(['locations']), 'agence');
  assert.equal(espaceKindOf(['location_voiture', 'textile']), 'boutique');
  assert.equal(espaceKindOf(['textile']), 'boutique');
  assert.equal(espaceKindOf([]), 'boutique');
  assert.equal(espaceKindOf(undefined), 'boutique');
});

test('lecture d’une annonce : seules les dates partent dans la page, jamais les identifiants', () => {
  const ad = toBoutiqueAd('ad_1', {
    title: 'Renault Clio 5',
    price: 5000,
    category: 'Locations',
    hidden: false,
    rental: {
      kind: 'car',
      pricingTiers: [{ upToDays: null, pricePerDay: 5000 }],
      bookedRanges: [{ start: '2026-11-14', end: '2026-11-17', opId: 'op_secret', at: 1 }],
      blockedRanges: [{ start: '2026-11-17', end: '2026-11-19', id: 'note_secret' }],
    },
    createdAt: { seconds: 10 },
  });
  assert.deepEqual(ad.rental.busy, [{ start: '2026-11-14', end: '2026-11-19' }]);
  assert.equal(JSON.stringify(ad).includes('secret'), false);
  assert.equal(ad.createdAtMs, 10000);

  const robe = toBoutiqueAd('ad_2', { title: 'Robe', category: 'Mode', details: { taillesDispo: ['S', 'M', 3, ''] }, quantiteRestante: 4 });
  assert.equal(robe.rental, null);
  assert.deepEqual(robe.taillesDispo, ['S', 'M']);
});

test('vitrine : masqués retirés, épinglés d’abord puis les plus récents', () => {
  const list = visibleSorted([
    { id: 'a', createdAtMs: 1, taillesDispo: [], rental: null },
    { id: 'b', createdAtMs: 3, taillesDispo: [], rental: null, hidden: true },
    { id: 'c', createdAtMs: 2, taillesDispo: [], rental: null },
    { id: 'd', createdAtMs: 0, taillesDispo: [], rental: null, pinned: true },
  ]);
  assert.deepEqual(
    list.map((x) => x.id),
    ['d', 'c', 'a'],
  );
});

test('aucun tiret long dans les libellés', () => {
  const car = { kind: 'car', pricingTiers: [{ upToDays: 3, pricePerDay: 6000 }, { upToDays: null, pricePerDay: 5000 }], busy: [{ start: '2026-11-15', end: '2026-12-01' }] };
  for (const locale of ['fr', 'en', 'ar']) {
    const texts = [availabilityLabel(car, TODAY, locale).text, rentalPriceLabel(car, 6000, locale), sizesLabel(['M'], locale)];
    for (const t of texts) assert.equal(/[\u2013\u2014]/.test(t), false, t);
  }
});

console.log(`${passed} tests réussis.`);
