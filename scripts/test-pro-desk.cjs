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
const { buildDeskDocument, deskDocuments, wilayaBilingue } = require('../lib/pro/shared/documents.ts');

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
  assert.equal(fr.money(-2000), '\u2066\u22122\u00a0000\u2069 DA');
  assert.ok(ar.money(-2000).includes('⁦−2'));
  assert.ok(ar.money(-2000).endsWith('⁩ دج'));
  assert.equal(fr.money(2000), '2\u00a0000 DA');
});

test('documents : bon de livraison bilingue, wilaya en deux langues, taille, en-tête de l’espace', () => {
  const op = {
    id: 'op_lq3z00000000000yas7n',
    type: 'vente',
    origine: 'instagram',
    statut: 'a_expedier',
    itemId: 'it_1',
    itemTitre: 'Abaya',
    variante: 'm_noir',
    quantite: 1,
    clientNom: 'Amel <b>Kaci</b>',
    clientTel: '+213770987654',
    lignes: [{ libelle: 'Abaya', quantite: 1, prix: 7000 }],
    total: 7000,
    paiements: [],
    solde: 7000,
    garanties: [],
    garantieOuverte: false,
    expedition: { transporteur: 'Yalidine', mode: 'bureau', wilaya: '25', commune: 'El Khroub', frais: 500, suivi: null, etat: 'a_confirmer' },
    creePar: 'u',
    creeLe: 0,
    modifieLe: 0,
    version: 1,
  };
  assert.deepEqual(deskDocuments(op, 'car'), ['livraison']);
  assert.deepEqual(deskDocuments({ ...op, statut: 'annulee' }, 'car'), []);
  assert.deepEqual(wilayaBilingue('25'), { fr: 'Constantine', ar: 'قسنطينة' });
  assert.equal(wilayaBilingue('Ailleurs'), null);
  const doc = buildDeskDocument({
    sorte: 'livraison',
    op,
    space: { nom: 'Dar El Yasmine', wilayaCode: '31', tel: '0770112233' },
    bien: null,
    client: null,
    reglages: {},
    variante: 'M · Noir',
    now: Date.parse('2026-11-20T09:00:00Z'),
  });
  assert.equal(doc.nomFichier, 'Bon-livraison-0YAS7N');
  assert.ok(doc.html.includes('وصل التسليم'));
  assert.ok(doc.html.includes('Constantine') && doc.html.includes('قسنطينة'));
  assert.ok(doc.html.includes('Oran') && doc.html.includes('وهران'));
  assert.ok(doc.html.includes('0770 11 22 33'));
  assert.ok(doc.html.includes('M · Noir'));
  assert.ok(doc.html.includes('Amel &lt;b&gt;Kaci&lt;/b&gt;'));
  assert.ok(!/[\u2013\u2014]/.test(doc.html));
});

test('textes des documents : les trois langues, mêmes clés', () => {
  for (const key of ['doc.section', 'doc.kind.contrat', 'doc.kind.sejour', 'doc.kind.caution', 'doc.kind.livraison', 'doc.settingsTitle', 'doc.field.conditionsVente']) {
    for (const locale of ['fr', 'en', 'ar']) {
      const text = proTexts(locale).t(key);
      assert.ok(text.trim() !== '' && !text.includes(key), `${locale} ${key}`);
    }
  }
});

test('dates bloquées : raison privée lue sur l’article, texte de la période, blocage d’une barre rognée, mots dans les trois langues', () => {
  const { readRentalUnit } = require('../lib/pro/agency/units.ts');
  const { blockOfBar, blockRangeText, blockReasonText } = require('../lib/pro/agency/blocks.ts');
  const { errorReason } = require('../lib/pro/agency/errors.ts');
  const unit = readRentalUnit('clio', {
    titre: 'Clio 5',
    statut: 'publie',
    adId: 'ad1',
    rental: { kind: 'car', pricingTiers: [{ upToDays: null, pricePerDay: 5000 }], blockedRanges: [{ start: '2026-11-23', end: '2026-11-25', id: 'bl_a' }, { start: '2026-12-02', end: '2026-12-03' }, { start: 'x', end: 'y' }] },
    blocages: { bl_a: { motif: 'garage' } },
  });
  assert.deepEqual(unit.blockedRanges, [
    { start: '2026-11-23', end: '2026-11-25', id: 'bl_a', reason: 'garage' },
    { start: '2026-12-02', end: '2026-12-03', id: null, reason: null },
  ]);
  const fr = proTexts('fr');
  assert.equal(blockRangeText(unit.blockedRanges[0], fr), 'Bloqué du lun. 23 au mar. 24 nov.');
  assert.equal(blockRangeText(unit.blockedRanges[1], fr), 'Bloqué le mer. 2 déc.');
  assert.equal(blockReasonText('garage', 'immo', fr), 'Travaux');
  assert.equal(blockOfBar(unit, { start: '2026-11-24', end: '2026-11-25' }).id, 'bl_a');
  assert.equal(blockOfBar(unit, { start: '2026-11-26', end: '2026-11-27' }), null);
  assert.equal(errorReason({ reason: 'DATES_PASSEES' }), 'DATES_PASSEES');
  for (const key of ['ag.web.blockButton', 'ag.web.blockHint', 'ag.unit.blockReason.perso', 'ag.unit.unblockTitle', 'ag.unit.unblockBody', 'ag.errors.BLOCAGES_MAX', 'ag.errors.DATES_PASSEES']) {
    for (const locale of ['fr', 'en', 'ar']) {
      const text = proTexts(locale).t(key, { range: 'x', reason: 'y' });
      assert.ok(text.trim() !== '' && !text.includes(key) && !/[\u2013\u2014]/.test(text), `${locale} ${key}`);
    }
  }
});

test('dates à bloquer : premier puis dernier jour compris, un seul clic pour un seul jour ; la réservation garde le jour du retour', () => {
  const { pickRangeDay, blockRangeOfPick, blockRangeText } = require('../lib/pro/agency/blocks.ts');
  const fr = proTexts('fr');
  // Blocage (inclusif).
  assert.deepEqual(pickRangeDay(null, null, '2026-11-27', true), ['2026-11-27', null]);
  assert.deepEqual(blockRangeOfPick('2026-11-27', null), { start: '2026-11-27', end: '2026-11-28' });
  assert.equal(blockRangeText(blockRangeOfPick('2026-11-27', null), fr), 'Bloqué le ven. 27 nov.');
  assert.deepEqual(pickRangeDay('2026-11-27', null, '2026-11-28', true), ['2026-11-27', '2026-11-28']);
  assert.deepEqual(blockRangeOfPick('2026-11-27', '2026-11-28'), { start: '2026-11-27', end: '2026-11-29' });
  assert.equal(blockRangeText(blockRangeOfPick('2026-11-27', '2026-11-28'), fr), 'Bloqué du ven. 27 au sam. 28 nov.');
  assert.deepEqual(pickRangeDay('2026-11-27', null, '2026-11-27', true), [null, null]);
  assert.deepEqual(pickRangeDay('2026-11-27', '2026-11-29', '2026-11-29', true), ['2026-11-27', null]);
  assert.deepEqual(pickRangeDay('2026-11-27', '2026-11-29', '2026-11-30', true), ['2026-11-27', '2026-11-30']);
  assert.deepEqual(pickRangeDay('2026-11-27', '2026-11-29', '2026-11-25', true), ['2026-11-25', null]);
  assert.equal(blockRangeOfPick(null, null), null);
  // Réservation (fin exclusive, inchangée).
  assert.deepEqual(pickRangeDay('2026-11-27', null, '2026-11-29', false), ['2026-11-27', '2026-11-29']);
  assert.deepEqual(pickRangeDay('2026-11-27', '2026-11-29', '2026-11-30', false), ['2026-11-30', null]);
  assert.deepEqual(pickRangeDay('2026-11-27', null, '2026-11-27', false), ['2026-11-27', null]);
  for (const locale of ['fr', 'en', 'ar']) {
    const text = proTexts(locale).t('ag.unit.blockPickEnd.car');
    assert.ok(!/redevient|free again|من جديد/.test(text) && !/[\u2013\u2014]/.test(text), `${locale} blockPickEnd`);
  }
});

test('montants : milliers séparés par une espace insécable ordinaire (l’en-tête du planning lisait « 121500 DA »)', () => {
  const { groupDigits } = require('../lib/pro/shared/format.ts');
  const { monthRest } = require('../lib/pro/agency/text.ts');
  assert.equal(groupDigits(121500), '121\u00a0500');
  assert.equal(proTexts('fr').money(121500), '121\u00a0500 DA');
  assert.ok(!/[\u202f\u2009]/.test(proTexts('ar').money(2500000)));
  assert.equal(monthRest(16, 121500, proTexts('fr')), '16 % loué · 121\u00a0500 DA');
});

test('vente à expédier : transporteur et wilaya exigés, frais lisibles, 69 wilayas, mots dans les trois langues', () => {
  const { shipExpeditionOf, SALE_CARRIERS } = require('../lib/pro/shop/catalogue.ts');
  const { WILAYA_CODES } = require('../lib/pro/shared/wilayas.ts');
  const { lireSaisieOperation } = require('../lib/pro-core');
  const base = { transporteur: ' Yalidine ', livraison: 'bureau', wilaya: '25', commune: ' El Khroub ', fraisText: '600' };
  assert.deepEqual(shipExpeditionOf(base), { ok: true, value: { transporteur: 'Yalidine', mode: 'bureau', wilaya: '25', commune: 'El Khroub', frais: 600 } });
  assert.deepEqual(shipExpeditionOf({ ...base, transporteur: '  ' }), { ok: false, reason: 'TRANSPORTEUR_REQUIS' });
  assert.deepEqual(shipExpeditionOf({ ...base, wilaya: null }), { ok: false, reason: 'WILAYA_REQUISE' });
  assert.deepEqual(shipExpeditionOf({ ...base, fraisText: '6x' }), { ok: false, reason: 'MONTANT_INVALIDE' });
  assert.equal(shipExpeditionOf({ ...base, commune: '', fraisText: '' }).value.frais, null);
  assert.equal(WILAYA_CODES.length, 69);
  assert.equal(WILAYA_CODES[0], '01');
  assert.equal(WILAYA_CODES[68], '69');
  assert.ok(SALE_CARRIERS.includes('Yalidine'));
  // Le cœur accepte la vente à expédier telle que le bureau l'envoie (payée à la livraison ou déjà payée).
  const saisie = (paiement) => lireSaisieOperation({ bid: 'b1', opId: 'op_abcdefgh1234', type: 'vente', origine: 'instagram', itemId: 'it1', variante: null, quantite: 2, debut: null, fin: null, heureDebut: null, heureFin: null, remise: null, client: { nom: 'Amel', tel: '0770987654' }, lignes: null, paiement, garanties: [], expedition: shipExpeditionOf(base).value, statutVente: 'a_expedier', notes: null });
  assert.equal(saisie(null).ok, true);
  assert.equal(saisie({ moyen: 'baridimob', montant: 13000 }).ok, true);
  for (const key of ['boutique.sale.modes.ship', 'boutique.sale.carrier', 'boutique.sale.deliveryMode.bureau', 'boutique.sale.pickWilaya', 'boutique.sale.shipPayPaid', 'boutique.err.TRANSPORTEUR_REQUIS', 'boutique.err.WILAYA_REQUISE']) {
    for (const locale of ['fr', 'en', 'ar']) {
      const text = proTexts(locale).t(key);
      assert.ok(text.trim() !== '' && !text.includes(key) && !/[\u2013\u2014]/.test(text), `${locale} ${key}`);
    }
  }
  assert.ok(!/application/.test(proTexts('fr').t('boutique.sale.shipNote')));
});

test('modifier un article : titre, promotion posée sous le prix actuel, retirée au prix barré', () => {
  const { planArticleEdit, promoEndMs } = require('../lib/pro/shop/catalogue.ts');
  const art = { titre: 'Robe longue', prix: 6500, prixSurDemande: false, promo: false, promoPrixBarre: null };
  const today = '2026-11-15';
  const none = { titleText: 'Robe longue', promoText: '', promoEndDay: '', removePromo: false };
  assert.deepEqual(planArticleEdit(art, none, today), { ok: false, reason: 'RIEN_A_CHANGER' });
  assert.deepEqual(planArticleEdit(art, { ...none, titleText: '  Robe   longue fleurie ' }, today), { ok: true, value: { titre: 'Robe longue fleurie' } });
  assert.deepEqual(planArticleEdit(art, { ...none, titleText: ' ' }, today), { ok: false, reason: 'TITRE_REQUIS' });
  assert.deepEqual(planArticleEdit(art, { ...none, promoText: '4 900' }, today), { ok: true, value: { prix: 4900, promo: { prixBarre: 6500, finMs: null } } });
  assert.deepEqual(planArticleEdit(art, { ...none, promoText: '6500' }, today), { ok: false, reason: 'PROMO_TROP_HAUTE' });
  assert.deepEqual(planArticleEdit(art, { ...none, promoText: 'abc' }, today), { ok: false, reason: 'MONTANT_INVALIDE' });
  assert.deepEqual(planArticleEdit(art, { ...none, promoText: '4900', promoEndDay: '2026-11-10' }, today), { ok: false, reason: 'FIN_PASSEE' });
  const withEnd = planArticleEdit(art, { ...none, promoText: '4900', promoEndDay: '2026-11-30' }, today);
  assert.equal(withEnd.value.promo.finMs, Date.parse('2026-11-30T22:59:59Z'));
  assert.equal(promoEndMs('x'), null);
  assert.deepEqual(planArticleEdit({ ...art, prix: null }, { ...none, promoText: '100' }, today), { ok: false, reason: 'PRIX_REQUIS' });
  const onPromo = { ...art, prix: 4900, promo: true, promoPrixBarre: 6500 };
  assert.deepEqual(planArticleEdit(onPromo, { ...none, removePromo: true }, today), { ok: true, value: { promo: null, prix: 6500 } });
  // En promotion, un prix promo tapé est ignoré (on retire d'abord la promotion).
  assert.deepEqual(planArticleEdit(onPromo, { ...none, promoText: '3000' }, today), { ok: false, reason: 'RIEN_A_CHANGER' });
  for (const key of ['boutique.edit.title', 'boutique.edit.promoPrice', 'boutique.edit.promoRemove', 'boutique.edit.err.PROMO_TROP_HAUTE', 'boutique.edit.err.TITRE_REQUIS', 'boutique.edit.nameNote']) {
    for (const locale of ['fr', 'en', 'ar']) {
      const text = proTexts(locale).t(key, { amount: '1', title: 't' });
      assert.ok(text.trim() !== '' && !text.includes(key) && !/[\u2013\u2014]/.test(text), `${locale} ${key}`);
    }
  }
  assert.ok(!/application/.test(proTexts('fr').t('boutique.cat.promoNote')));
});

console.log(`Bureau pro : ${passed} tests verts.`);
