'use client';

// components/pro/shop/ShopOrdersPane.tsx
// =============================================================================
// « COMMANDES » DE LA BOUTIQUE SUR LE BUREAU WEB (maquette B4 de l'application).
// =============================================================================
//
//   • À traiter : les offres Trokacha où c'est au pro de répondre (montant
//     comparé au prix affiché, échéance). La réponse se fait dans
//     l'application : « Répondre dans l'application » ouvre la page de l'offre
//     (le site la passe à l'application). Puis les commandes Trokacha dont la
//     taille reste à choisir (`proAssignVariant`, comme le téléphone) ;
//   • Hors Trokacha : les ventes notées à la main encore ouvertes, rangées
//     comme sur le téléphone (à expédier, mis de côté, colis en route, colis
//     qui reviennent), avec leurs étapes (`proOperationStep`) et
//     l'encaissement du reste (`proRecordPayment`) ;
//   • en bas, ce que les clients doivent encore.
// =============================================================================

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { Etape, MoyenPaiement, Operation } from '@/lib/pro-core';
import { useOpenOps } from '@/lib/pro/hooks';
import { articlePrice, hasVariants, isSaleArticle, parseAmount, variantChipLabel, variantColors, variantStocks, type ShopArticle } from '@/lib/pro/shop/catalogue';
import { useShopCatalogue, useShopOffers } from '@/lib/pro/shop/hooks';
import { hoursLeft, needsSizeChoice, offerPriceLine, outsideSalesOf, saleActionsOf, type SaleAction, type ShopOffer } from '@/lib/pro/shop/orders';
import { assignVariant, recordPayment, saleStep, shopErrorKey } from '@/lib/pro/shop/writes';
import { shortClientName } from '@/lib/pro/today';
import type { ProTexts } from '@/lib/pro/texts';
import { useProDesk } from '../ProDeskShell';
import { ProPaneTitle } from '../ProPane';
import { ProCentered, useProSession } from '../ProSession';
import { ArticleThumb, ChipRow, FormError, inputClass, NoticeBar, ShopButton, ShopChip, ShopDialog, ShopField, useNotice } from './ShopUi';

const PAY_MOYENS: readonly MoyenPaiement[] = ['especes', 'cib', 'edahabia', 'baridimob', 'ccp', 'virement', 'cheque'];

type Dialog = { kind: 'confirm'; op: Operation; etape: Etape } | { kind: 'ship'; op: Operation } | { kind: 'pay'; op: Operation } | { kind: 'size'; op: Operation };

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="mb-3 flex items-center gap-2 text-[19px] font-semibold text-ink">
        {title}
        {count ? <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cash px-2 text-[13px] font-bold text-white">{count}</span> : null}
      </h2>
      {children}
    </section>
  );
}

function variantLabel(article: ShopArticle | undefined, cle: string | null | undefined): string | null {
  if (!article || !cle) return null;
  return variantStocks(article).find((v) => v.cle === cle)?.label ?? null;
}

function opTitle(op: Operation, article: ShopArticle | undefined): string {
  return [shortClientName(op.clientNom), op.itemTitre || article?.titre || null, variantLabel(article, op.variante)].filter(Boolean).join(' · ');
}

function carnetLine(op: Operation, x: ProTexts): { text: string; warning: boolean } {
  const exp = op.expedition;
  const carrier = exp?.transporteur ? [exp.transporteur, exp.wilaya].filter(Boolean).join(' · ') : '';
  switch (op.statut) {
    case 'mise_de_cote':
      return op.solde > 0 ? { text: x.t('shop.line.putAsideDue', { amount: x.money(op.solde) }), warning: true } : { text: x.t('shop.line.putAside'), warning: false };
    case 'a_expedier':
      return { text: carrier ? x.t('shop.line.toShip', { carrier }) : x.t('shop.line.toShipBare'), warning: true };
    case 'expediee':
      if (exp?.suivi && exp.transporteur) return { text: x.t('shop.line.shippedTracking', { carrier: exp.transporteur, tracking: exp.suivi }), warning: false };
      return { text: exp?.transporteur ? x.t('shop.line.shipped', { carrier: exp.transporteur }) : x.t('shop.line.shippedBare'), warning: false };
    default:
      return { text: x.t('shop.line.returning'), warning: true };
  }
}

// ── Une offre Trokacha ────────────────────────────────────────────────────

function OfferCard({ offer, article, now }: { offer: ShopOffer; article: ShopArticle | undefined; now: number }) {
  const { texts: x } = useProSession();
  const price = offerPriceLine(offer.amount, article ? articlePrice(article) : null);
  const left = hoursLeft(offer.expiresAt, now);
  const priceText =
    price === null
      ? x.t('boutique.orders.swap')
      : price.kind === 'below'
        ? x.t('boutique.orders.offerBelow', { amount: x.money(price.amount), listed: x.money(price.listed) })
        : price.kind === 'atPrice'
          ? x.t('boutique.orders.atPrice', { amount: x.money(price.amount) })
          : x.t('boutique.orders.offerAmount', { amount: x.money(price.amount) });
  return (
    <li className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-white px-5 py-4 shadow-card">
      <ArticleThumb url={article?.photo ?? null} size={56} />
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold text-ink">
          <bdi>{x.t('boutique.orders.offerTitle', { name: offer.name ?? x.t('boutique.orders.someone') })}</bdi>
          {offer.counter ? <span className="ms-2 rounded-full bg-paperHard px-2 py-0.5 align-middle text-[12px] font-semibold text-inkSoft">{x.t('boutique.orders.counter')}</span> : null}
        </p>
        {article?.titre ? (
          <p className="truncate text-[15px] text-inkSoft">
            <bdi>{article.titre}</bdi>
          </p>
        ) : null}
        <p className="text-[15px] text-ink">{priceText}</p>
        {left !== null ? <p className={`text-[14px] ${left <= 12 ? 'font-semibold text-[#B45309]' : 'text-inkMuted'}`}>{x.tp('boutique.orders.expiresIn', left)}</p> : null}
      </div>
      <Link href={`/proposal/${encodeURIComponent(offer.id)}`} className="inline-flex items-center gap-2 rounded-full bg-cash px-4 py-2 text-[15px] font-semibold text-white hover:bg-cashInk">
        {x.t('boutique.orders.answer')}
      </Link>
    </li>
  );
}

// ── Le volet ──────────────────────────────────────────────────────────────

export function ShopOrdersPane() {
  const { texts: x, user } = useProSession();
  const { space } = useProDesk();
  const bid = space.id;
  const ops = useOpenOps(bid);
  const catalogue = useShopCatalogue(bid);
  const offers = useShopOffers(user.uid, bid);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busyOp, setBusyOp] = useState<string | null>(null);
  const { notice, show, clear } = useNotice();
  const now = Date.now();

  const byId = useMemo(() => new Map(catalogue.rows.map((a) => [a.id, a])), [catalogue.rows]);
  const byAdId = useMemo(() => new Map(catalogue.rows.flatMap((a) => (a.adId ? [[a.adId, a] as const] : []))), [catalogue.rows]);
  const sizeOps = useMemo(
    () =>
      ops.rows.filter((op) =>
        needsSizeChoice(op, (itemId) => {
          const a = byId.get(itemId);
          return !!a && hasVariants(a);
        }),
      ),
    [ops.rows, byId],
  );
  const sales = useMemo(() => outsideSalesOf(ops.rows), [ops.rows]);
  const outsideCount = sales.toShip.length + sales.putAside.length + sales.shipped.length + sales.returning.length;
  const todoCount = offers.offers.length + sizeOps.length;

  const runAction = async (op: Operation, work: () => Promise<unknown>, success: string) => {
    setBusyOp(op.id);
    try {
      await work();
      setDialog(null);
      show('success', success);
    } catch (e) {
      show('error', x.t(shopErrorKey(e)));
    } finally {
      setBusyOp(null);
    }
  };

  const onAction = (op: Operation, action: SaleAction) => {
    if (action.kind === 'pay') setDialog({ kind: 'pay', op });
    else if (action.etape === 'expediee') setDialog({ kind: 'ship', op });
    else setDialog({ kind: 'confirm', op, etape: action.etape });
  };

  const actionLabel = (action: SaleAction) => (action.kind === 'pay' ? x.t('boutique.step.pay') : x.t(`boutique.step.${action.etape}`));

  const carnetBlock = (title: string, list: Operation[]) =>
    list.length ? (
      <div className="mt-5 first:mt-0">
        <h3 className="mb-2 text-[16px] font-semibold text-inkSoft">
          {title} <span className="text-inkMuted">· {list.length}</span>
        </h3>
        <ul className="grid gap-3 2xl:grid-cols-2">
          {list.map((op) => {
            const article = byId.get(op.itemId);
            const line = carnetLine(op, x);
            const actions = saleActionsOf(op);
            return (
              <li key={op.id} className="rounded-card border border-line bg-white px-5 py-4 shadow-card">
                <div className="flex items-start gap-3">
                  <ArticleThumb url={article?.photo ?? null} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold text-ink">
                      <bdi>{opTitle(op, article)}</bdi>
                    </p>
                    <p className={`mt-0.5 text-[15px] ${line.warning ? 'text-[#B45309]' : 'text-inkSoft'}`}>
                      <bdi>{line.text}</bdi>
                    </p>
                    <p className="mt-0.5 text-[13px] text-inkMuted">
                      {x.t('boutique.orders.originLine', { origin: x.t(`boutique.origin.${op.origine}`) })}
                      {op.clientTel ? (
                        <>
                          {' · '}
                          <a href={`tel:${op.clientTel}`} dir="ltr" className="underline decoration-dotted underline-offset-2">
                            {op.clientTel}
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                {actions.length ? (
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {actions.map((action, i) => (
                      <ShopButton
                        key={action.kind === 'pay' ? 'pay' : action.etape}
                        small
                        tone={action.kind === 'step' && action.etape === 'annulation' ? 'ghost' : i === 0 ? 'primary' : 'outline'}
                        busy={busyOp === op.id}
                        onClick={() => onAction(op, action)}
                      >
                        {actionLabel(action)}
                      </ShopButton>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    ) : null;

  const loading = ops.status === 'loading' || catalogue.status === 'loading';

  return (
    <>
      <ProPaneTitle title={x.t('pane.commandes')} />
      {loading ? (
        <ProCentered>
          <p className="text-inkMuted">{x.t('common.loading')}</p>
        </ProCentered>
      ) : ops.status === 'error' ? (
        <ProCentered>
          <div>
            <p className="text-ink">{x.t('common.error')}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full border border-line px-4 py-2 font-semibold text-ink hover:bg-paperHard">
              {x.t('common.retry')}
            </button>
          </div>
        </ProCentered>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <Section title={x.t('boutique.orders.todoTitle')} count={todoCount}>
              <p className="mb-3 text-[14px] text-inkMuted">{x.t('boutique.orders.trokachaNote')}</p>
              {offers.status === 'error' ? <p className="mb-3 rounded-[14px] bg-paperSoft px-4 py-3 text-[14px] text-inkSoft">{x.t('boutique.orders.offersError')}</p> : null}
              {offers.offers.length || sizeOps.length ? (
                <ul className="space-y-3">
                  {offers.offers.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} article={offer.adId ? byAdId.get(offer.adId) : undefined} now={now} />
                  ))}
                  {sizeOps.map((op) => {
                    const article = byId.get(op.itemId);
                    return (
                      <li key={op.id} className="flex flex-wrap items-center gap-4 rounded-card border border-[#F5D58A] bg-[#FEF9E7] px-5 py-4">
                        <ArticleThumb url={article?.photo ?? null} size={56} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[17px] font-semibold text-ink">
                            <bdi>{opTitle(op, article)}</bdi>
                          </p>
                          <p className="text-[15px] text-[#92400E]">{x.t('boutique.orders.sizeLine')}</p>
                        </div>
                        <ShopButton small onClick={() => setDialog({ kind: 'size', op })}>
                          {x.t('boutique.orders.chooseSize')}
                        </ShopButton>
                      </li>
                    );
                  })}
                </ul>
              ) : offers.status === 'ready' ? (
                <p className="rounded-card border border-line bg-paperSoft px-5 py-6 text-center text-[16px] text-inkMuted">{x.t('boutique.orders.emptyTodo')}</p>
              ) : null}
            </Section>
          </div>

          <div className="min-w-0">
            <Section title={x.t('boutique.orders.outsideTitle')} count={outsideCount}>
              {outsideCount ? (
                <>
                  {carnetBlock(x.t('shop.toShipTitle'), sales.toShip)}
                  {carnetBlock(x.t('shop.putAsideTitle'), sales.putAside)}
                  {carnetBlock(x.t('shop.shippedTitle'), sales.shipped)}
                  {carnetBlock(x.t('shop.returningTitle'), sales.returning)}
                </>
              ) : (
                <p className="rounded-card border border-line bg-paperSoft px-5 py-6 text-center text-[15px] leading-6 text-inkMuted">{x.t('boutique.orders.outsideEmpty')}</p>
              )}
              {sales.dueTotal > 0 ? <div className="mt-5 rounded-card border border-line bg-paperSoft px-5 py-4 text-[16px] text-inkSoft">{x.t('boutique.orders.due', { amount: x.money(sales.dueTotal) })}</div> : null}
            </Section>
          </div>
        </div>
      )}

      {dialog?.kind === 'confirm' ? (
        <ShopDialog
          title={x.t(`boutique.confirm.${dialog.etape}.title`)}
          sub={opTitle(dialog.op, byId.get(dialog.op.itemId))}
          onClose={() => setDialog(null)}
          footer={
            <>
              <ShopButton tone="outline" onClick={() => setDialog(null)}>
                {x.t('boutique.cat.cancel')}
              </ShopButton>
              <ShopButton
                tone={dialog.etape === 'annulation' ? 'danger' : 'primary'}
                busy={busyOp === dialog.op.id}
                onClick={() => void runAction(dialog.op, () => saleStep(bid, { opId: dialog.op.id, etape: dialog.etape, version: dialog.op.version }), x.t('boutique.stepSaved'))}
              >
                {x.t('boutique.confirm.yes')}
              </ShopButton>
            </>
          }
        >
          <p className="text-[16px] text-ink">{x.t(`boutique.confirm.${dialog.etape}.body`)}</p>
        </ShopDialog>
      ) : null}
      {dialog?.kind === 'ship' ? <ShipDialog bid={bid} op={dialog.op} title={opTitle(dialog.op, byId.get(dialog.op.itemId))} busy={busyOp === dialog.op.id} onClose={() => setDialog(null)} run={runAction} /> : null}
      {dialog?.kind === 'pay' ? <PayDialog bid={bid} op={dialog.op} title={opTitle(dialog.op, byId.get(dialog.op.itemId))} busy={busyOp === dialog.op.id} onClose={() => setDialog(null)} run={runAction} /> : null}
      {dialog?.kind === 'size' ? (
        <SizeDialog bid={bid} op={dialog.op} article={byId.get(dialog.op.itemId)} busy={busyOp === dialog.op.id} onClose={() => setDialog(null)} run={runAction} />
      ) : null}

      <NoticeBar notice={notice} onClose={clear} />
    </>
  );
}

type Run = (op: Operation, work: () => Promise<unknown>, success: string) => Promise<void>;

function ShipDialog({ bid, op, title, busy, onClose, run }: { bid: string; op: Operation; title: string; busy: boolean; onClose: () => void; run: Run }) {
  const { texts: x } = useProSession();
  const [suivi, setSuivi] = useState('');
  return (
    <ShopDialog
      title={x.t('boutique.shipping.title')}
      sub={title}
      onClose={onClose}
      footer={
        <>
          <ShopButton tone="outline" onClick={onClose}>
            {x.t('boutique.cat.cancel')}
          </ShopButton>
          <ShopButton busy={busy} onClick={() => void run(op, () => saleStep(bid, { opId: op.id, etape: 'expediee', version: op.version, suivi: suivi.trim().slice(0, 60) || null }), x.t('boutique.stepSaved'))}>
            {x.t('boutique.shipping.confirm')}
          </ShopButton>
        </>
      }
    >
      <input value={suivi} onChange={(e) => setSuivi(e.target.value)} dir="ltr" placeholder={x.t('boutique.shipping.placeholder')} aria-label={x.t('boutique.shipping.title')} className={inputClass} />
    </ShopDialog>
  );
}

function PayDialog({ bid, op, title, busy, onClose, run }: { bid: string; op: Operation; title: string; busy: boolean; onClose: () => void; run: Run }) {
  const { texts: x } = useProSession();
  const [amountText, setAmountText] = useState(op.solde > 0 ? String(op.solde) : '');
  const [moyen, setMoyen] = useState<MoyenPaiement>('especes');
  const [error, setError] = useState<string | null>(null);
  const amount = parseAmount(amountText);
  const valid = amount !== null && !Number.isNaN(amount) && amount > 0;
  const submit = () => {
    if (!valid || amount === null) {
      setError(x.t('boutique.err.MONTANT_INVALIDE'));
      return;
    }
    void run(op, () => recordPayment(bid, { opId: op.id, moyen, montant: amount }), x.t('boutique.pay.saved', { amount: x.money(amount) }));
  };
  return (
    <ShopDialog
      title={x.t('boutique.pay.title')}
      sub={title}
      onClose={onClose}
      footer={
        <>
          <ShopButton tone="outline" onClick={onClose}>
            {x.t('boutique.cat.cancel')}
          </ShopButton>
          <ShopButton busy={busy} disabled={!valid} onClick={submit}>
            {valid && amount !== null ? x.t('boutique.pay.confirm', { amount: x.money(amount) }) : x.t('boutique.pay.title')}
          </ShopButton>
        </>
      }
    >
      <div className="w-[200px]">
        <ShopField label={x.t('boutique.pay.amount')}>
          <input inputMode="numeric" dir="ltr" value={amountText} onChange={(e) => setAmountText(e.target.value)} className={inputClass} />
        </ShopField>
      </div>
      <p className="mb-2 mt-4 text-[14px] font-semibold text-ink">{x.t('boutique.pay.moyen')}</p>
      <ChipRow>
        {PAY_MOYENS.map((m) => (
          <ShopChip key={m} label={x.t(`boutique.moyen.${m}`)} selected={m === moyen} onClick={() => setMoyen(m)} />
        ))}
      </ChipRow>
      <FormError text={error} />
    </ShopDialog>
  );
}

function SizeDialog({ bid, op, article, busy, onClose, run }: { bid: string; op: Operation; article: ShopArticle | undefined; busy: boolean; onClose: () => void; run: Run }) {
  const { texts: x } = useProSession();
  const inStock = article && isSaleArticle(article) ? variantStocks(article).filter((v) => v.stock > 0) : [];
  const several = article ? variantColors(article).length > 1 : false;
  const [chosen, setChosen] = useState<string | null>(inStock.length === 1 ? inStock[0].cle : null);
  const name = shortClientName(op.clientNom) ?? x.t('boutique.orders.someone');
  const label = inStock.find((v) => v.cle === chosen)?.label ?? '';
  return (
    <ShopDialog
      title={x.t('boutique.orders.chooseSizeTitle', { name })}
      sub={op.itemTitre || article?.titre || undefined}
      onClose={onClose}
      footer={
        <>
          <ShopButton tone="outline" onClick={onClose}>
            {x.t('boutique.cat.cancel')}
          </ShopButton>
          <ShopButton busy={busy} disabled={!chosen} onClick={() => chosen && void run(op, () => assignVariant(bid, op.id, chosen), x.t('boutique.orders.chooseSizeDone', { label }))}>
            {x.t('boutique.orders.chooseSizeConfirm')}
          </ShopButton>
        </>
      }
    >
      {inStock.length ? (
        <ChipRow>
          {inStock.map((v) => (
            <ShopChip key={v.cle} label={variantChipLabel(v, several)} sub={String(v.stock)} selected={v.cle === chosen} onClick={() => setChosen(v.cle)} />
          ))}
        </ChipRow>
      ) : (
        <p className="text-[15px] text-danger">{x.t('boutique.orders.sizeNoStock')}</p>
      )}
    </ShopDialog>
  );
}
