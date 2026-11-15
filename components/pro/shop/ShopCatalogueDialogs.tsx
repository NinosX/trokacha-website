'use client';

// components/pro/shop/ShopCatalogueDialogs.tsx
// =============================================================================
// Les fenêtres du catalogue en tableau : vente au comptoir (une pièce, payée en
// espèces au prix de l'article) et vente notée (quantité, prix, client, canal,
// payé, mis de côté ou à expédier : transporteur, domicile ou bureau, wilaya,
// commune, frais, payé à la livraison ou déjà payé), prix en série, stock en série, « épuisé » en série,
// arrivage. Chaque écriture passe par `lib/pro/shop/writes.ts` (callables du
// carnet ; prix : catalogue et annonce ensemble, comme l'application).
// =============================================================================

import { useMemo, useRef, useState } from 'react';
import { lireSaisieOperation, telInternational, type MoyenPaiement, type Origine } from '@/lib/pro-core';
import {
  ARRIVAL_SOLO_KEY,
  articleLineLabel,
  articlePrice,
  availableFor,
  buildArrivalLines,
  counterSaleSaisie,
  draftPieces,
  hasVariants,
  isSaleArticle,
  matchesArticle,
  parseAmount,
  planArticleEdit,
  planPriceChange,
  ARTICLE_TITLE_MAX,
  planSoldOut,
  planStockSet,
  SALE_CARRIERS,
  shipExpeditionOf,
  stockOf,
  variantChipLabel,
  variantColors,
  variantStocks,
  type ArrivalDraftItem,
  type PriceChange,
  type ShipExpedition,
  type ShopArticle,
} from '@/lib/pro/shop/catalogue';
import { adjustStock, newProId, receiveArrival, runSeries, saveSale, shopErrorKey, writeArticleEdit, writeArticlePrice } from '@/lib/pro/shop/writes';
import type { ProTexts } from '@/lib/pro/texts';
import { WILAYA_CODES, wilayaName } from '@/lib/pro/shared/wilayas';
import { useProSession } from '../ProSession';
import { ArticleThumb, ChipRow, FormError, inputClass, ShopButton, ShopChip, ShopDialog, ShopField, ShopIcon } from './ShopUi';

export interface DoneReport {
  tone: 'success' | 'error';
  text: string;
}

const titleOf = (a: ShopArticle, x: ProTexts) => a.titre ?? x.t('boutique.cat.untitled');

function reasonText(reason: string, x: ProTexts): string {
  return x.t(`boutique.err.${reason}`) || x.t('boutique.err.generic');
}

/** Compte rendu d'une série : réussite, ou ce qui n'a pas abouti. */
function seriesReport(result: { done: number; failed: number; firstErrorKey: string | null }, x: ProTexts, doneKey: string): DoneReport {
  if (!result.failed) return { tone: 'success', text: x.tp(doneKey, result.done) };
  const reason = x.t(result.firstErrorKey ?? 'boutique.err.generic');
  const fail = x.tp('boutique.partialFail', result.failed, { reason });
  return { tone: 'error', text: result.done ? `${x.tp(doneKey, result.done)}. ${fail}` : fail };
}

// =============================================================================
// VENTE AU COMPTOIR (« −1 »)
// =============================================================================

export function SellDialog({ bid, article, onClose, onDone, onMore }: { bid: string; article: ShopArticle; onClose: () => void; onDone: (r: DoneReport) => void; onMore: () => void }) {
  const { texts: x } = useProSession();
  const inStock = useMemo(() => (hasVariants(article) ? variantStocks(article).filter((v) => v.stock > 0) : []), [article]);
  const [variante, setVariante] = useState<string | null>(inStock.length === 1 ? inStock[0].cle : null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const several = variantColors(article).length > 1;
  const needsSize = hasVariants(article);
  const chosen = inStock.find((v) => v.cle === variante) ?? null;
  const price = articlePrice(article);
  const title = titleOf(article, x);

  const confirm = async () => {
    const result = counterSaleSaisie({ bid, opId: newProId('op'), article, variante });
    if (result.ok === false) {
      setError(reasonText(result.reason, x));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveSale(result.value);
      onDone({ tone: 'success', text: x.t('boutique.sell.done', { label: articleLineLabel(title, chosen) }) });
    } catch (e) {
      setBusy(false);
      setError(x.t(shopErrorKey(e)));
    }
  };

  return (
    <ShopDialog
      title={x.t('boutique.sell.title')}
      sub={chosen ? `${title} · ${chosen.label}` : title}
      onClose={onClose}
      footer={
        <>
          <ShopButton tone="ghost" onClick={onMore}>
            {x.t('boutique.sell.more')}
          </ShopButton>
          <ShopButton onClick={() => void confirm()} disabled={needsSize && !chosen} busy={busy}>
            {x.t('boutique.sell.confirm')}
          </ShopButton>
        </>
      }
    >
      {needsSize ? (
        <div className="mb-5">
          <p className="mb-2 text-[15px] font-semibold text-ink">{x.t('boutique.sell.pick')}</p>
          {inStock.length ? (
            <ChipRow>
              {inStock.map((v) => (
                <ShopChip key={v.cle} label={variantChipLabel(v, several)} sub={String(v.stock)} selected={v.cle === variante} onClick={() => setVariante(v.cle)} ariaLabel={`${v.label}, ${x.tp('boutique.cat.inStock', v.stock)}`} />
              ))}
            </ChipRow>
          ) : (
            <p className="text-[15px] text-danger">{x.t('boutique.sell.noSize')}</p>
          )}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-display text-[28px] font-bold text-ink">{price === null ? x.t('boutique.cat.priceOnRequest') : x.money(price)}</span>
        <span className="inline-flex items-center gap-2 rounded-[14px] bg-matchBg px-3 py-2 text-[15px] font-semibold text-matchInk">{x.t('boutique.sell.paidCash')}</span>
      </div>
      <FormError text={error} />
    </ShopDialog>
  );
}

// =============================================================================
// VENTE NOTÉE (autre paiement, client, canal, mis de côté)
// =============================================================================

const SALE_ORIGINS: readonly Exclude<Origine, 'trokacha'>[] = ['comptoir', 'telephone', 'whatsapp', 'instagram', 'tiktok', 'messenger', 'ouedkniss', 'site', 'autre'];
const SALE_MOYENS: readonly MoyenPaiement[] = ['especes', 'cib', 'edahabia', 'baridimob', 'ccp', 'virement', 'cheque'];
const QUANTITY_MAX = 999;

export function SaleDialog({ bid, article, onClose, onDone }: { bid: string; article: ShopArticle; onClose: () => void; onDone: (r: DoneReport) => void }) {
  const { texts: x } = useProSession();
  const inStock = useMemo(() => (hasVariants(article) ? variantStocks(article).filter((v) => v.stock > 0) : []), [article]);
  const several = variantColors(article).length > 1;
  const [variante, setVariante] = useState<string | null>(inStock.length === 1 ? inStock[0].cle : null);
  const [quantite, setQuantite] = useState(1);
  const [priceText, setPriceText] = useState('');
  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const [origine, setOrigine] = useState<Exclude<Origine, 'trokacha'>>('comptoir');
  const [mode, setMode] = useState<'paid' | 'aside' | 'ship'>('paid');
  // À expédier : le colis (mêmes champs que l'application) et le paiement, à la livraison par défaut.
  const [transporteur, setTransporteur] = useState('');
  const [livraison, setLivraison] = useState<'domicile' | 'bureau'>('domicile');
  const [wilaya, setWilaya] = useState<string | null>(null);
  const [commune, setCommune] = useState('');
  const [fraisText, setFraisText] = useState('');
  const [shipPaid, setShipPaid] = useState(false);
  const [moyen, setMoyen] = useState<MoyenPaiement>('especes');
  const [acompteText, setAcompteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const opId = useRef(newProId('op'));
  const title = titleOf(article, x);
  const listed = articlePrice(article);
  const typed = parseAmount(priceText);
  const unit = typed ?? listed;
  const total = unit === null || Number.isNaN(unit) ? null : unit * quantite;
  const chosen = inStock.find((v) => v.cle === variante) ?? null;

  const save = async () => {
    setError(null);
    const variants = hasVariants(article);
    if (variants && !variante) return setError(reasonText('VARIANTE_REQUISE', x));
    if (availableFor(article, variants ? variante : null) < quantite) return setError(reasonText('STOCK_INSUFFISANT', x));
    if (unit === null) return setError(reasonText('PRIX_REQUIS', x));
    if (Number.isNaN(unit)) return setError(reasonText('MONTANT_INVALIDE', x));
    const amount = unit * quantite;
    const telText = tel.trim();
    if (telText && !telInternational(telText)) return setError(reasonText('TEL_INVALIDE', x));
    let paiement: { moyen: MoyenPaiement; montant: number } | null = null;
    let expedition: ShipExpedition | null = null;
    if (mode === 'paid') paiement = amount > 0 ? { moyen, montant: amount } : null;
    else if (mode === 'ship') {
      const colis = shipExpeditionOf({ transporteur, livraison, wilaya, commune, fraisText });
      if (colis.ok === false) return setError(reasonText(colis.reason, x));
      expedition = colis.value;
      paiement = shipPaid && amount > 0 ? { moyen, montant: amount } : null;
    } else {
      const acompte = parseAmount(acompteText);
      if (acompte !== null && Number.isNaN(acompte)) return setError(reasonText('MONTANT_INVALIDE', x));
      if (acompte !== null && acompte > amount) return setError(reasonText('ACOMPTE_TROP_GRAND', x));
      if (acompte !== null && acompte > 0) paiement = { moyen, montant: acompte };
    }
    const label = articleLineLabel(title, chosen);
    const edited = typed !== null && typed !== listed;
    const saisie = lireSaisieOperation({
      bid,
      opId: opId.current,
      type: 'vente',
      origine,
      itemId: article.id,
      variante: variants ? variante : null,
      quantite,
      debut: null,
      fin: null,
      heureDebut: null,
      heureFin: null,
      remise: null,
      client: nom.trim() || telText ? { nom: nom.trim() || null, tel: telText || null } : null,
      lignes: edited ? [{ libelle: label.slice(0, 120), quantite, prix: unit }] : null,
      paiement,
      garanties: [],
      expedition,
      statutVente: mode === 'paid' ? 'vendue' : mode === 'ship' ? 'a_expedier' : 'mise_de_cote',
      notes: null,
    });
    if (saisie.ok === false) return setError(reasonText(saisie.reason, x));
    setBusy(true);
    try {
      await saveSale(saisie.value);
      onDone({ tone: 'success', text: x.t('boutique.sell.done', { label }) });
    } catch (e) {
      setBusy(false);
      setError(x.t(shopErrorKey(e)));
    }
  };

  return (
    <ShopDialog
      title={x.t('boutique.sale.title')}
      sub={chosen ? `${title} · ${chosen.label}` : title}
      onClose={onClose}
      wide
      footer={
        <>
          <ShopButton tone="outline" onClick={onClose}>
            {x.t('boutique.cat.cancel')}
          </ShopButton>
          <ShopButton onClick={() => void save()} busy={busy}>
            {x.t('boutique.sale.save')}
          </ShopButton>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-5">
          {hasVariants(article) ? (
            <div>
              <p className="mb-2 text-[14px] font-semibold text-ink">{x.t('boutique.sale.size')}</p>
              {inStock.length ? (
                <ChipRow>
                  {inStock.map((v) => (
                    <ShopChip key={v.cle} label={variantChipLabel(v, several)} sub={String(v.stock)} selected={v.cle === variante} onClick={() => setVariante(v.cle)} />
                  ))}
                </ChipRow>
              ) : (
                <p className="text-[15px] text-danger">{x.t('boutique.sell.noSize')}</p>
              )}
            </div>
          ) : null}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="mb-1.5 text-[14px] font-semibold text-ink">{x.t('boutique.sale.quantity')}</p>
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white p-1">
                <button type="button" aria-label="-1" disabled={quantite <= 1} onClick={() => setQuantite((q) => Math.max(1, q - 1))} className="rounded-full p-2 text-ink hover:bg-paperSoft disabled:opacity-40">
                  <ShopIcon name="minus" size={16} />
                </button>
                <span className="min-w-8 text-center font-display text-[18px] font-bold" dir="ltr">
                  {quantite}
                </span>
                <button type="button" aria-label="+1" disabled={quantite >= QUANTITY_MAX} onClick={() => setQuantite((q) => Math.min(QUANTITY_MAX, q + 1))} className="rounded-full p-2 text-ink hover:bg-paperSoft disabled:opacity-40">
                  <ShopIcon name="plus" size={16} />
                </button>
              </div>
            </div>
            <div className="min-w-[160px] flex-1">
              <ShopField label={x.t('boutique.sale.price')}>
                <input inputMode="numeric" dir="ltr" value={priceText} onChange={(e) => setPriceText(e.target.value)} placeholder={listed === null ? '' : String(listed)} className={inputClass} />
              </ShopField>
            </div>
          </div>
          {total !== null ? <p className="text-[16px] font-semibold text-ink">{x.tp('boutique.sale.total', quantite, { amount: x.money(total) })}</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <ShopField label={x.t('boutique.sale.clientName')}>
              <input value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass} autoComplete="off" />
            </ShopField>
            <ShopField label={x.t('boutique.sale.clientTel')}>
              <input value={tel} onChange={(e) => setTel(e.target.value)} dir="ltr" inputMode="tel" className={inputClass} autoComplete="off" />
            </ShopField>
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[14px] font-semibold text-ink">{x.t('boutique.sale.origin')}</p>
            <ChipRow>
              {SALE_ORIGINS.map((o) => (
                <ShopChip key={o} label={x.t(`boutique.origin.${o}`)} selected={o === origine} onClick={() => setOrigine(o)} />
              ))}
            </ChipRow>
          </div>
          <div>
            <p className="mb-2 text-[14px] font-semibold text-ink">{x.t('boutique.sale.mode')}</p>
            <ChipRow>
              <ShopChip label={x.t('boutique.sale.modes.paid')} selected={mode === 'paid'} onClick={() => setMode('paid')} />
              <ShopChip label={x.t('boutique.sale.modes.aside')} selected={mode === 'aside'} onClick={() => setMode('aside')} />
              <ShopChip label={x.t('boutique.sale.modes.ship')} selected={mode === 'ship'} onClick={() => setMode('ship')} />
            </ChipRow>
          </div>
          {mode === 'ship' ? (
            <div className="space-y-4 rounded-[14px] border border-line bg-paperSoft p-4">
              <p className="text-[14px] font-semibold text-ink">{x.t('boutique.sale.delivery')}</p>
              <ShopField label={x.t('boutique.sale.carrier')}>
                <input value={transporteur} onChange={(e) => setTransporteur(e.target.value)} placeholder={x.t('boutique.sale.carrierPlaceholder')} maxLength={60} className={inputClass} autoComplete="off" />
              </ShopField>
              <ChipRow>
                {SALE_CARRIERS.map((c) => (
                  <ShopChip key={c} label={c} selected={transporteur.trim().toLowerCase() === c.toLowerCase()} onClick={() => setTransporteur(c)} />
                ))}
              </ChipRow>
              <ChipRow>
                <ShopChip label={x.t('boutique.sale.deliveryMode.domicile')} selected={livraison === 'domicile'} onClick={() => setLivraison('domicile')} />
                <ShopChip label={x.t('boutique.sale.deliveryMode.bureau')} selected={livraison === 'bureau'} onClick={() => setLivraison('bureau')} />
              </ChipRow>
              <div className="grid gap-3 sm:grid-cols-2">
                <ShopField label={x.t('boutique.sale.wilaya')}>
                  <select value={wilaya ?? ''} onChange={(e) => setWilaya(e.target.value || null)} className={inputClass}>
                    <option value="">{x.t('boutique.sale.pickWilaya')}</option>
                    {WILAYA_CODES.map((code) => (
                      <option key={code} value={code}>
                        {`${code} · ${wilayaName(code, x.locale)}`}
                      </option>
                    ))}
                  </select>
                </ShopField>
                <ShopField label={x.t('boutique.sale.commune')}>
                  <input value={commune} onChange={(e) => setCommune(e.target.value)} maxLength={80} className={inputClass} autoComplete="off" />
                </ShopField>
              </div>
              <ShopField label={x.t('boutique.sale.fees')}>
                <input inputMode="numeric" dir="ltr" value={fraisText} onChange={(e) => setFraisText(e.target.value)} maxLength={9} className={inputClass} />
              </ShopField>
              <div>
                <p className="mb-2 text-[14px] font-semibold text-ink">{x.t('boutique.sale.shipPay')}</p>
                <ChipRow>
                  <ShopChip label={x.t('boutique.sale.shipPayOnDelivery')} selected={!shipPaid} onClick={() => setShipPaid(false)} />
                  <ShopChip label={x.t('boutique.sale.shipPayPaid')} selected={shipPaid} onClick={() => setShipPaid(true)} />
                </ChipRow>
                {!shipPaid ? <p className="mt-2 text-[13px] text-inkMuted">{x.t('boutique.sale.shipNote')}</p> : null}
              </div>
            </div>
          ) : null}
          {mode === 'aside' ? (
            <ShopField label={x.t('boutique.sale.deposit')}>
              <input inputMode="numeric" dir="ltr" value={acompteText} onChange={(e) => setAcompteText(e.target.value)} className={inputClass} />
            </ShopField>
          ) : null}
          {mode !== 'ship' || shipPaid ? (
            <div>
              <p className="mb-2 text-[14px] font-semibold text-ink">{mode === 'aside' ? x.t('boutique.sale.depositWith') : x.t('boutique.sale.paidWith')}</p>
              <ChipRow>
                {SALE_MOYENS.map((m) => (
                  <ShopChip key={m} label={x.t(`boutique.moyen.${m}`)} selected={m === moyen} onClick={() => setMoyen(m)} />
                ))}
              </ChipRow>
            </div>
          ) : null}
        </div>
      </div>
      <FormError text={error} />
    </ShopDialog>
  );
}

// =============================================================================
// PRIX EN SÉRIE
// =============================================================================

type PriceMode = 'down' | 'up' | 'set';
const PREVIEW_MAX = 8;

export function PriceDialog({ bid, articles, onClose, onDone }: { bid: string; articles: ShopArticle[]; onClose: () => void; onDone: (r: DoneReport) => void }) {
  const { texts: x } = useProSession();
  const [mode, setMode] = useState<PriceMode>('down');
  const [unit, setUnit] = useState<'percent' | 'amount'>('percent');
  const [valueText, setValueText] = useState('');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const value = parseAmount(valueText);
  const valid = value !== null && !Number.isNaN(value) && value > 0 && !(mode !== 'set' && unit === 'percent' && mode === 'down' && value >= 100);

  const change: PriceChange | null = !valid || value === null ? null : mode === 'set' ? { kind: 'set', value } : unit === 'percent' ? { kind: 'percent', direction: mode, value } : { kind: 'amount', direction: mode, value };
  // Quelques centaines d'articles au plus : recalculé à chaque frappe, sans mémo.
  const plan = change ? planPriceChange(articles, change) : null;

  const skippedCount = (reason: string) => plan?.skipped.filter((s) => s.reason === reason).length ?? 0;

  const apply = async () => {
    if (!plan || !plan.lines.length) return;
    setProgress({ done: 0, total: plan.lines.length });
    const result = await runSeries(plan.lines, (line) => writeArticlePrice(bid, line.article, line.after), (done, total) => setProgress({ done, total }));
    onDone(seriesReport(result, x, 'boutique.price.done'));
  };

  return (
    <ShopDialog
      title={x.t('boutique.price.title')}
      sub={x.tp('boutique.cat.selected', articles.length)}
      onClose={progress ? () => undefined : onClose}
      wide
      footer={
        <>
          {progress ? <span className="me-auto self-center text-[14px] text-inkMuted">{x.t('boutique.progress', { done: progress.done, total: progress.total })}</span> : null}
          <ShopButton tone="outline" onClick={onClose} disabled={!!progress}>
            {x.t('boutique.cat.cancel')}
          </ShopButton>
          <ShopButton onClick={() => void apply()} disabled={!plan || !plan.lines.length} busy={!!progress}>
            {x.tp('boutique.price.apply', plan?.lines.length ?? 0)}
          </ShopButton>
        </>
      }
    >
      <ChipRow>
        {(['down', 'up', 'set'] as const).map((m) => (
          <ShopChip key={m} label={x.t(`boutique.price.mode.${m}`)} selected={m === mode} onClick={() => setMode(m)} />
        ))}
      </ChipRow>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-[180px]">
          <ShopField label={mode === 'set' ? x.t('boutique.price.newPrice') : x.t('boutique.price.value')}>
            <input inputMode="numeric" dir="ltr" value={valueText} onChange={(e) => setValueText(e.target.value)} className={inputClass} />
          </ShopField>
        </div>
        {mode !== 'set' ? (
          <ChipRow>
            <ShopChip label={x.t('boutique.price.unit.percent')} selected={unit === 'percent'} onClick={() => setUnit('percent')} />
            <ShopChip label={x.t('boutique.price.unit.amount')} selected={unit === 'amount'} onClick={() => setUnit('amount')} />
          </ChipRow>
        ) : (
          <span className="pb-3 text-[15px] text-inkMuted">{x.t('boutique.price.unit.amount')}</span>
        )}
      </div>
      {mode !== 'set' && unit === 'percent' ? <p className="mt-2 text-[13px] text-inkMuted">{x.t('boutique.price.rounding')}</p> : null}

      {plan ? (
        <div className="mt-5">
          {plan.lines.length ? (
            <>
              <p className="mb-2 text-[14px] font-semibold text-ink">{x.t('boutique.price.preview')}</p>
              <ul className="divide-y divide-line rounded-[14px] border border-line bg-white">
                {plan.lines.slice(0, PREVIEW_MAX).map((line) => (
                  <li key={line.article.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[15px]">
                    <bdi className="min-w-0 flex-1 truncate text-ink">{titleOf(line.article, x)}</bdi>
                    <span className="shrink-0 text-inkMuted line-through">{line.before === null ? '' : x.money(line.before)}</span>
                    <span className="shrink-0 font-semibold text-ink">{x.money(line.after)}</span>
                  </li>
                ))}
              </ul>
              {plan.lines.length > PREVIEW_MAX ? <p className="mt-2 text-[14px] text-inkMuted">{x.tp('boutique.price.more', plan.lines.length - PREVIEW_MAX)}</p> : null}
            </>
          ) : (
            <p className="text-[15px] text-inkMuted">{x.t('boutique.price.nothing')}</p>
          )}
          <div className="mt-3 space-y-1 text-[14px] text-[#B45309]">
            {(['promo', 'onRequest', 'noPrice', 'invalid'] as const).map((reason) => {
              const n = skippedCount(reason);
              return n ? <p key={reason}>{x.tp(`boutique.price.skipped.${reason}`, n)}</p> : null;
            })}
          </div>
          {plan.lines.length ? <p className="mt-3 text-[14px] text-inkMuted">{x.t('boutique.price.note')}</p> : null}
        </div>
      ) : null}
    </ShopDialog>
  );
}

// =============================================================================
// STOCK EN SÉRIE, « ÉPUISÉ » EN SÉRIE
// =============================================================================

export function StockDialog({ bid, articles, initial, title, onClose, onDone }: { bid: string; articles: ShopArticle[]; initial?: number; title?: string; onClose: () => void; onDone: (r: DoneReport) => void }) {
  const { texts: x } = useProSession();
  const [valueText, setValueText] = useState(initial === undefined ? '' : String(initial));
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const value = parseAmount(valueText);
  const valid = value !== null && !Number.isNaN(value);
  const plan = useMemo(() => (valid && value !== null ? planStockSet(articles, value, x.t('boutique.cat.untitled')) : null), [articles, valid, value, x]);

  const apply = async () => {
    if (!plan || !plan.sets.length) return;
    setProgress({ done: 0, total: plan.sets.length });
    const result = await runSeries(plan.sets, (set) => adjustStock(bid, set), (done, total) => setProgress({ done, total }));
    onDone(seriesReport(result, x, 'boutique.stock.done'));
  };

  const variantCount = articles.filter(hasVariants).length;

  return (
    <ShopDialog
      title={title ?? x.t('boutique.stock.title')}
      sub={articles.length === 1 ? titleOf(articles[0], x) : x.tp('boutique.cat.selected', articles.length)}
      onClose={progress ? () => undefined : onClose}
      footer={
        <>
          {progress ? <span className="me-auto self-center text-[14px] text-inkMuted">{x.t('boutique.progress', { done: progress.done, total: progress.total })}</span> : null}
          <ShopButton tone="outline" onClick={onClose} disabled={!!progress}>
            {x.t('boutique.cat.cancel')}
          </ShopButton>
          <ShopButton onClick={() => void apply()} disabled={!plan || !plan.sets.length} busy={!!progress}>
            {x.tp('boutique.stock.apply', plan?.sets.length ?? Math.max(0, articles.length - variantCount))}
          </ShopButton>
        </>
      }
    >
      <div className="w-[200px]">
        <ShopField label={x.t('boutique.stock.label')}>
          <input inputMode="numeric" dir="ltr" value={valueText} onChange={(e) => setValueText(e.target.value)} className={inputClass} />
        </ShopField>
      </div>
      {variantCount ? <p className="mt-3 text-[14px] text-[#B45309]">{x.tp('boutique.stock.variantsNote', variantCount)}</p> : null}
      {plan && !plan.sets.length && variantCount < articles.length ? <p className="mt-3 text-[14px] text-inkMuted">{x.t('boutique.stock.nothing')}</p> : null}
    </ShopDialog>
  );
}

export function SoldOutDialog({ bid, articles, onClose, onDone }: { bid: string; articles: ShopArticle[]; onClose: () => void; onDone: (r: DoneReport) => void }) {
  const { texts: x } = useProSession();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const sets = useMemo(() => planSoldOut(articles, x.t('boutique.cat.untitled')), [articles, x]);
  const touched = useMemo(() => new Set(sets.map((s) => s.itemId)).size, [sets]);

  const apply = async () => {
    if (!sets.length) return;
    setProgress({ done: 0, total: sets.length });
    const result = await runSeries(sets, (set) => adjustStock(bid, set), (done, total) => setProgress({ done, total }));
    onDone(result.failed ? seriesReport(result, x, 'boutique.stock.done') : { tone: 'success', text: x.tp('boutique.soldOut.done', touched) });
  };

  return (
    <ShopDialog
      title={x.t('boutique.soldOut.title')}
      sub={x.tp('boutique.cat.selected', articles.length)}
      onClose={progress ? () => undefined : onClose}
      footer={
        <>
          {progress ? <span className="me-auto self-center text-[14px] text-inkMuted">{x.t('boutique.progress', { done: progress.done, total: progress.total })}</span> : null}
          <ShopButton tone="outline" onClick={onClose} disabled={!!progress}>
            {x.t('boutique.cat.cancel')}
          </ShopButton>
          <ShopButton tone="danger" onClick={() => void apply()} disabled={!sets.length} busy={!!progress}>
            {x.t('boutique.soldOut.confirm')}
          </ShopButton>
        </>
      }
    >
      <p className="text-[16px] text-ink">{sets.length ? x.tp('boutique.soldOut.body', touched) : x.t('boutique.soldOut.none')}</p>
    </ShopDialog>
  );
}

// =============================================================================
// ARRIVAGE (plusieurs articles, quantités taille par taille)
// =============================================================================

export function ArrivalDialog({ bid, catalogue, initialIds, onClose, onDone }: { bid: string; catalogue: ShopArticle[]; initialIds: string[]; onClose: () => void; onDone: (r: DoneReport) => void }) {
  const { texts: x } = useProSession();
  const saleArticles = useMemo(() => catalogue.filter(isSaleArticle), [catalogue]);
  const byId = useMemo(() => new Map(saleArticles.map((a) => [a.id, a])), [saleArticles]);
  const [items, setItems] = useState<ArrivalDraftItem[]>(() => initialIds.filter((id) => byId.has(id)).map((itemId) => ({ itemId, quantities: {}, prixAchatText: '' })));
  const [picking, setPicking] = useState(initialIds.length === 0);
  const [query, setQuery] = useState('');
  const [supplier, setSupplier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const arrivageId = useRef(newProId('ar'));

  const pieces = items.reduce((sum, item) => sum + draftPieces(item), 0);
  const candidates = useMemo(() => saleArticles.filter((a) => !items.some((i) => i.itemId === a.id) && matchesArticle(a, query)).slice(0, 30), [items, query, saleArticles]);

  const setQuantity = (itemId: string, key: string, text: string) =>
    setItems((list) => list.map((i) => (i.itemId === itemId ? { ...i, quantities: { ...i.quantities, [key]: text } } : i)));
  const setBuyPrice = (itemId: string, text: string) => setItems((list) => list.map((i) => (i.itemId === itemId ? { ...i, prixAchatText: text } : i)));

  const save = async () => {
    setError(null);
    const plan = buildArrivalLines(items, saleArticles);
    if (plan.ok === false) return setError(reasonText(plan.reason, x));
    setBusy(true);
    try {
      await receiveArrival(bid, { arrivageId: arrivageId.current, lignes: plan.value.lignes, fournisseur: supplier.trim() || null });
      onDone({ tone: 'success', text: x.tp('boutique.arrival.saved', plan.value.pieces) });
    } catch (e) {
      setBusy(false);
      setError(x.t(shopErrorKey(e)));
    }
  };

  return (
    <ShopDialog
      title={x.t('boutique.arrival.title')}
      sub={x.t('boutique.arrival.intro')}
      onClose={onClose}
      wide
      footer={
        <>
          <span className="me-auto self-center text-[15px] font-semibold text-ink">{x.tp('boutique.arrival.summary', pieces)}</span>
          <ShopButton tone="outline" onClick={onClose}>
            {x.t('boutique.cat.cancel')}
          </ShopButton>
          <ShopButton onClick={() => void save()} disabled={pieces === 0} busy={busy}>
            {x.t('boutique.arrival.save')}
          </ShopButton>
        </>
      }
    >
      {!items.length && !picking ? <p className="mb-4 text-[15px] text-inkMuted">{x.t('boutique.arrival.empty')}</p> : null}

      <div className="space-y-4">
        {items.map((item) => {
          const article = byId.get(item.itemId);
          if (!article) return null;
          const variants = variantStocks(article);
          return (
            <div key={item.itemId} className="rounded-[16px] border border-line bg-white p-4">
              <div className="flex items-center gap-3">
                <ArticleThumb url={article.photo} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-semibold text-ink">
                    <bdi>{titleOf(article, x)}</bdi>
                  </p>
                  <p className="text-[13px] text-inkMuted">{x.tp('boutique.cat.inStock', stockOf(article))}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setItems((list) => list.filter((i) => i.itemId !== item.itemId))}
                  aria-label={x.t('boutique.arrival.remove', { title: titleOf(article, x) })}
                  className="rounded-full p-2 text-inkSoft hover:bg-paperHard"
                >
                  <ShopIcon name="x" size={18} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {hasVariants(article) ? (
                  variants.map((v) => (
                    <label key={v.cle} className="w-[110px]">
                      <span className="mb-1 block truncate text-[13px] text-inkSoft">
                        <bdi>{v.label}</bdi> <span className="text-inkMuted">({v.stock})</span>
                      </span>
                      <input inputMode="numeric" dir="ltr" value={item.quantities[v.cle] ?? ''} onChange={(e) => setQuantity(item.itemId, v.cle, e.target.value)} placeholder="0" className={inputClass} />
                    </label>
                  ))
                ) : (
                  <label className="w-[140px]">
                    <span className="mb-1 block text-[13px] text-inkSoft">{x.t('boutique.arrival.quantity')}</span>
                    <input inputMode="numeric" dir="ltr" value={item.quantities[ARRIVAL_SOLO_KEY] ?? ''} onChange={(e) => setQuantity(item.itemId, ARRIVAL_SOLO_KEY, e.target.value)} placeholder="0" className={inputClass} />
                  </label>
                )}
                <label className="w-[180px]">
                  <span className="mb-1 block text-[13px] text-inkSoft">{x.t('boutique.arrival.buyPrice')}</span>
                  <input inputMode="numeric" dir="ltr" value={item.prixAchatText} onChange={(e) => setBuyPrice(item.itemId, e.target.value)} placeholder={x.t('boutique.arrival.optional')} className={inputClass} />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {picking ? (
        <div className="mt-4 rounded-[16px] border border-line bg-white p-3">
          <div className="relative">
            <ShopIcon name="search" size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-inkMuted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={x.t('boutique.arrival.search')} className={`${inputClass} ps-10`} />
          </div>
          <ul className="mt-2 max-h-[240px] overflow-y-auto">
            {candidates.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setItems((list) => [...list, { itemId: a.id, quantities: {}, prixAchatText: '' }]);
                    setQuery('');
                    setPicking(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-[12px] px-2 py-2 text-start hover:bg-paperSoft"
                >
                  <ArticleThumb url={a.photo} size={36} />
                  <bdi className="min-w-0 flex-1 truncate text-[15px] text-ink">{titleOf(a, x)}</bdi>
                  <span className="text-[13px] text-inkMuted">{x.tp('boutique.cat.inStock', stockOf(a))}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4">
          <ShopButton tone="soft" small onClick={() => setPicking(true)}>
            <ShopIcon name="plus" size={16} />
            {x.t('boutique.arrival.add')}
          </ShopButton>
        </div>
      )}

      <div className="mt-5 max-w-[360px]">
        <ShopField label={x.t('boutique.arrival.supplier')}>
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder={x.t('boutique.arrival.supplierPlaceholder')} className={inputClass} />
        </ShopField>
      </div>
      <FormError text={error} />
    </ShopDialog>
  );
}

// =============================================================================
// MODIFIER L'ARTICLE : le titre, une promotion (prix barré), même voie que le prix
// =============================================================================

export function EditArticleDialog({ bid, article, today, onClose, onDone }: { bid: string; article: ShopArticle; today: string; onClose: () => void; onDone: (r: DoneReport) => void }) {
  const { texts: x } = useProSession();
  const [titleText, setTitleText] = useState(article.titre ?? '');
  const [promoText, setPromoText] = useState('');
  const [promoEndDay, setPromoEndDay] = useState('');
  const [removePromo, setRemovePromo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const current = articlePrice(article);

  const save = async () => {
    setError(null);
    const plan = planArticleEdit(article, { titleText, promoText, promoEndDay, removePromo }, today);
    if (plan.ok === false) {
      if (plan.reason === 'RIEN_A_CHANGER') return onClose();
      return setError(x.t(`boutique.edit.err.${plan.reason}`) || reasonText(plan.reason, x));
    }
    setBusy(true);
    try {
      await writeArticleEdit(bid, article, plan.value);
      onDone({ tone: 'success', text: x.t('boutique.edit.saved', { title: plan.value.titre ?? titleOf(article, x) }) });
    } catch (e) {
      setBusy(false);
      setError(x.t(shopErrorKey(e)));
    }
  };

  return (
    <ShopDialog
      title={x.t('boutique.edit.title')}
      sub={titleOf(article, x)}
      onClose={onClose}
      footer={
        <>
          <ShopButton tone="outline" onClick={onClose}>
            {x.t('boutique.cat.cancel')}
          </ShopButton>
          <ShopButton onClick={() => void save()} busy={busy}>
            {x.t('boutique.edit.save')}
          </ShopButton>
        </>
      }
    >
      <div className="space-y-5">
        <ShopField label={x.t('boutique.edit.name')}>
          <input value={titleText} onChange={(e) => setTitleText(e.target.value)} maxLength={ARTICLE_TITLE_MAX} className={inputClass} autoComplete="off" />
        </ShopField>
        {article.adId ? <p className="-mt-3 text-[13px] text-inkMuted">{x.t('boutique.edit.nameNote')}</p> : null}
        <div className="rounded-[14px] border border-line bg-paperSoft p-4">
          <p className="mb-2 text-[14px] font-semibold text-ink">{x.t('boutique.edit.promo')}</p>
          {article.promo ? (
            <>
              <p className="text-[15px] text-ink">
                {article.promoPrixBarre !== null && current !== null
                  ? x.t('boutique.edit.promoNow', { before: x.money(article.promoPrixBarre), now: x.money(current) })
                  : x.t('boutique.edit.promoOn')}
              </p>
              <label className="mt-3 flex items-center gap-2 text-[15px] text-ink">
                <input type="checkbox" checked={removePromo} onChange={(e) => setRemovePromo(e.target.checked)} className="h-4 w-4 accent-[#0A66C2]" />
                {article.promoPrixBarre !== null
                  ? x.t('boutique.edit.promoRemove', { amount: x.money(article.promoPrixBarre) })
                  : x.t('boutique.edit.promoRemovePlain')}
              </label>
            </>
          ) : current === null ? (
            <p className="text-[14px] text-inkMuted">{x.t('boutique.edit.promoNoPrice')}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <ShopField label={x.t('boutique.edit.promoPrice', { amount: x.money(current) })}>
                <input inputMode="numeric" dir="ltr" value={promoText} onChange={(e) => setPromoText(e.target.value)} maxLength={10} className={inputClass} />
              </ShopField>
              <ShopField label={x.t('boutique.edit.promoEnd')}>
                <input type="date" dir="ltr" min={today} value={promoEndDay} onChange={(e) => setPromoEndDay(e.target.value)} className={inputClass} />
              </ShopField>
            </div>
          )}
        </div>
      </div>
      <FormError text={error} />
    </ShopDialog>
  );
}
