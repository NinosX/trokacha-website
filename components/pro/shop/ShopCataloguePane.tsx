'use client';

// components/pro/shop/ShopCataloguePane.tsx
// =============================================================================
// « CATALOGUE » DE LA BOUTIQUE SUR LE BUREAU WEB : le tableau du comptoir pour
// des centaines d'articles (maquette W1, règles de B1 de l'application).
// =============================================================================
//
//   • une ligne par article de VENTE : vignette, titre, tailles encore en
//     boutique, prix, stock (« 3 restants »), état (En ligne, Épuisé, En
//     vérification…), et le geste du comptoir : « −1 Vendu au comptoir », ou
//     « Remettre en stock » pour un article épuisé ;
//   • un article à tailles se déplie : le stock taille par taille, tapé
//     directement (`proAdjustStock`, valeur absolue) ;
//   • le prix et le stock d'un article sans tailles se changent dans la case
//     (Entrée enregistre, Échap annule) ;
//   • recherche, filtre (en stock, bientôt épuisés, épuisés), tri ;
//   • sélection de plusieurs lignes et gestes EN SÉRIE : changer le prix
//     (montant ou pourcentage, aperçu avant), marquer épuisé, mettre le stock
//     à N, noter un arrivage pour ces articles.
// Écritures : `lib/pro/shop/writes.ts` (callables du carnet ; prix : catalogue
// et annonce ensemble, comme l'écran « Modifier l'article » de l'application).
// =============================================================================

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  articleLineLabel,
  catalogueRows,
  clampStock,
  isSaleArticle,
  parseAmount,
  type ArticleState,
  type CatalogueFilter,
  type CatalogueRow,
  type CatalogueSort,
  type ShopArticle,
  variantStocks,
} from '@/lib/pro/shop/catalogue';
import { useShopCatalogue } from '@/lib/pro/shop/hooks';
import { adjustStock, shopErrorKey, writeArticlePrice } from '@/lib/pro/shop/writes';
import type { ProTexts } from '@/lib/pro/texts';
import { useProDesk } from '../ProDeskShell';
import { ProPaneTitle } from '../ProPane';
import { ProCentered, useProSession } from '../ProSession';
import { ArrivalDialog, PriceDialog, SaleDialog, SellDialog, SoldOutDialog, StockDialog, type DoneReport } from './ShopCatalogueDialogs';
import { ArticleThumb, inputClass, NoticeBar, ShopButton, ShopIcon, useNotice } from './ShopUi';

type Dialog =
  | { kind: 'sell'; id: string }
  | { kind: 'sale'; id: string }
  | { kind: 'price'; ids: string[] }
  | { kind: 'stock'; ids: string[]; initial?: number; restock?: boolean }
  | { kind: 'soldOut'; ids: string[] }
  | { kind: 'arrival'; ids: string[] };

const FILTERS: readonly CatalogueFilter[] = ['all', 'inStock', 'low', 'soldOut'];
const SORTS: readonly CatalogueSort[] = ['catalogue', 'title', 'priceAsc', 'priceDesc', 'stockAsc', 'stockDesc'];

const STATE_TONE: Record<ArticleState, string> = {
  soldOut: 'bg-[#FEF3C7] text-[#92400E]',
  online: 'bg-matchBg text-matchInk',
  inReview: 'bg-cashBg text-cash',
  rejected: 'bg-[#FBE9EC] text-danger',
  withdrawn: 'bg-[#FBE9EC] text-danger',
  hidden: 'bg-paperHard text-inkSoft',
  draft: 'bg-paperHard text-inkSoft',
  scheduled: 'bg-paperHard text-inkSoft',
};

const titleOf = (a: ShopArticle, x: ProTexts) => a.titre ?? x.t('boutique.cat.untitled');

// ── Cases modifiables ─────────────────────────────────────────────────────

/** Une valeur qui se change dans la case : Entrée enregistre, Échap annule, quitter la case enregistre. */
function InlineNumber({ value, display, label, onSave, disabled, width = 'w-[110px]' }: { value: number | null; display: string; label: string; onSave: (next: number) => Promise<boolean>; disabled?: boolean; width?: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  const commit = async () => {
    const next = parseAmount(text);
    if (next === null || Number.isNaN(next) || next === value) {
      setEditing(false);
      return;
    }
    setBusy(true);
    const ok = await onSave(next);
    setBusy(false);
    if (ok) setEditing(false);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void commit();
    if (e.key === 'Escape') {
      e.stopPropagation();
      setEditing(false);
    }
  };

  if (disabled) return <span className="text-[15px] text-ink">{display}</span>;
  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setText(value === null ? '' : String(value));
          setEditing(true);
        }}
        aria-label={label}
        title={label}
        className="rounded-[10px] px-2 py-1 text-start text-[15px] text-ink underline decoration-line2 decoration-dotted underline-offset-4 hover:bg-paperHard"
      >
        {display}
      </button>
    );
  }
  return (
    <input
      ref={input}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={onKey}
      onBlur={() => void commit()}
      disabled={busy}
      inputMode="numeric"
      dir="ltr"
      aria-label={label}
      className={`${inputClass} ${width} py-1.5`}
    />
  );
}

/** Le stock d'un article à tailles, taille par taille (ligne dépliée). */
function VariantStockEditor({ article, onSave }: { article: ShopArticle; onSave: (variante: string, label: string, stock: number) => Promise<boolean> }) {
  const { texts: x } = useProSession();
  const variants = variantStocks(article);
  return (
    <div className="rounded-[16px] bg-paperSoft px-4 py-3">
      <p className="mb-2 text-[13px] text-inkMuted">{x.t('boutique.cat.sizesHint')}</p>
      <div className="flex flex-wrap gap-3">
        {variants.map((v) => (
          <div key={v.cle} className={`flex items-center gap-2 rounded-[12px] border px-3 py-1.5 ${v.stock === 0 ? 'border-[#F5D58A] bg-[#FEF9E7]' : 'border-line bg-white'}`}>
            <bdi className="text-[14px] font-semibold text-ink">{v.label}</bdi>
            <InlineNumber
              value={v.stock}
              display={String(v.stock)}
              width="w-[80px]"
              label={x.t('boutique.cat.editStockOf', { label: articleLineLabel(titleOf(article, x), v) })}
              onSave={(next) => onSave(v.cle, articleLineLabel(titleOf(article, x), v), clampStock(next))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Une ligne du tableau ──────────────────────────────────────────────────

function Row({
  row,
  selected,
  expanded,
  onSelect,
  onToggle,
  onSell,
  onRestock,
  onPrice,
  onStock,
  onVariantStock,
}: {
  row: CatalogueRow;
  selected: boolean;
  expanded: boolean;
  onSelect: (id: string, on: boolean) => void;
  onToggle: (id: string) => void;
  onSell: (row: CatalogueRow) => void;
  onRestock: (row: CatalogueRow) => void;
  onPrice: (row: CatalogueRow, prix: number) => Promise<boolean>;
  onStock: (row: CatalogueRow, stock: number) => Promise<boolean>;
  onVariantStock: (row: CatalogueRow, variante: string, label: string, stock: number) => Promise<boolean>;
}) {
  const { texts: x } = useProSession();
  const a = row.article;
  const title = titleOf(a, x);
  const priceLocked = a.promo || a.prixSurDemande;
  const priceDisplay = row.price === null ? (a.prixSurDemande ? x.t('boutique.cat.priceOnRequest') : x.t('boutique.cat.noPrice')) : x.money(row.price);

  return (
    <>
      <tr className={`border-b border-line align-middle ${selected ? 'bg-cashBg/40' : 'bg-white'} hover:bg-paperSoft`}>
        <td className="w-10 ps-4">
          <input type="checkbox" checked={selected} onChange={(e) => onSelect(row.id, e.target.checked)} aria-label={x.t('boutique.cat.selectRow', { title })} className="h-4 w-4 accent-[#0A66C2]" />
        </td>
        <td className="py-3 pe-3">
          <div className="flex min-w-[240px] items-center gap-3">
            <ArticleThumb url={a.photo} />
            <div className="min-w-0">
              <p className="line-clamp-2 text-[15px] font-semibold leading-5 text-ink">
                <bdi>{title}</bdi>
              </p>
              {row.sizes ? (
                <p className="mt-0.5 truncate text-[13px] text-inkMuted">
                  <bdi>{row.sizes}</bdi>
                </p>
              ) : null}
              {row.waiting > 0 ? <p className="mt-0.5 text-[13px] text-[#B45309]">{x.tp('boutique.cat.waiting', row.waiting)}</p> : null}
            </div>
          </div>
        </td>
        <td className="whitespace-nowrap px-3">
          <span title={a.promo ? x.t('boutique.cat.promoNote') : a.prixSurDemande ? x.t('boutique.cat.onRequestNote') : undefined}>
            <InlineNumber value={row.price} display={priceDisplay} disabled={priceLocked} label={x.t('boutique.cat.editPrice', { title })} onSave={(next) => onPrice(row, next)} />
          </span>
        </td>
        <td className="whitespace-nowrap px-3">
          {row.variants ? (
            <button type="button" onClick={() => onToggle(row.id)} aria-expanded={expanded} className="inline-flex items-center gap-1.5 rounded-[10px] px-2 py-1 text-[15px] text-ink hover:bg-paperHard">
              <span className={row.soldOut ? 'font-semibold text-[#92400E]' : 'font-semibold'}>{x.tp('boutique.cat.remaining', row.remaining)}</span>
              <ShopIcon name="chevron" size={16} className={`text-inkMuted transition ${expanded ? 'rotate-90' : 'rtl:-scale-x-100'}`} />
              <span className="sr-only">{expanded ? x.t('boutique.cat.hideSizes') : x.t('boutique.cat.showSizes')}</span>
            </button>
          ) : (
            <InlineNumber value={row.remaining} display={x.tp('boutique.cat.remaining', row.remaining)} label={x.t('boutique.cat.editStockOf', { label: title })} onSave={(next) => onStock(row, clampStock(next))} />
          )}
        </td>
        <td className="whitespace-nowrap px-3">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[13px] font-semibold ${STATE_TONE[row.state]}`}>{x.t(`boutique.state.${row.state}`)}</span>
        </td>
        <td className="whitespace-nowrap py-3 pe-4 ps-3 text-end">
          {row.soldOut ? (
            <ShopButton tone="soft" small onClick={() => onRestock(row)}>
              <ShopIcon name="refresh" size={15} />
              {x.t('boutique.cat.restock')}
            </ShopButton>
          ) : (
            <button
              type="button"
              onClick={() => onSell(row)}
              aria-label={x.t('boutique.cat.sellA11y', { title })}
              className="inline-flex items-center gap-2 rounded-full bg-cashBg py-1 pe-4 ps-1 text-[14px] font-bold text-cash hover:bg-[#d7e7f7]"
            >
              <span className="inline-flex h-7 min-w-9 items-center justify-center rounded-full bg-white px-2 text-[14px] font-extrabold" dir="ltr">
                {x.t('boutique.cat.sellBadge')}
              </span>
              {x.t('boutique.cat.sell')}
            </button>
          )}
        </td>
      </tr>
      {expanded && row.variants ? (
        <tr className="border-b border-line bg-white">
          <td />
          <td colSpan={5} className="pb-4 pe-4">
            <VariantStockEditor article={a} onSave={(variante, label, stock) => onVariantStock(row, variante, label, stock)} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

// ── Le volet ──────────────────────────────────────────────────────────────

export function ShopCataloguePane() {
  const { texts: x } = useProSession();
  const { space } = useProDesk();
  const bid = space.id;
  const catalogue = useShopCatalogue(bid);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CatalogueFilter>('all');
  const [sort, setSort] = useState<CatalogueSort>('catalogue');
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const { notice, show, clear } = useNotice();

  const saleCount = useMemo(() => catalogue.rows.filter(isSaleArticle).length, [catalogue.rows]);
  const rows = useMemo(() => catalogueRows(catalogue.rows, { query, filter, sort, locale: x.locale }), [catalogue.rows, query, filter, sort, x.locale]);
  const byId = useMemo(() => new Map(catalogue.rows.map((a) => [a.id, a])), [catalogue.rows]);
  const visibleIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  // Un article sorti du catalogue (supprimé, devenu location) quitte la sélection.
  useEffect(() => {
    setSelected((current) => {
      const next = new Set([...current].filter((id) => byId.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [byId]);

  const onSelect = (id: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const toggleAll = (on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      for (const id of visibleIds) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  const onToggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const report = (r: DoneReport) => {
    setDialog(null);
    show(r.tone, r.text);
  };

  const onSell = (row: CatalogueRow) => setDialog({ kind: row.price === null ? 'sale' : 'sell', id: row.id });
  const onRestock = (row: CatalogueRow) => {
    if (row.variants) {
      setExpanded((current) => new Set(current).add(row.id));
      return;
    }
    const quantite = row.article.quantite && row.article.quantite > 0 ? row.article.quantite : 1;
    setDialog({ kind: 'stock', ids: [row.id], initial: quantite, restock: true });
  };
  const onPrice = async (row: CatalogueRow, prix: number): Promise<boolean> => {
    if (prix <= 0) return false;
    try {
      await writeArticlePrice(bid, row.article, prix);
      show('success', x.t('boutique.cat.priceSaved', { amount: x.money(prix) }));
      return true;
    } catch (e) {
      show('error', x.t(shopErrorKey(e)));
      return false;
    }
  };
  const onStock = async (row: CatalogueRow, stock: number): Promise<boolean> => {
    try {
      await adjustStock(bid, { itemId: row.id, variante: null, stock });
      show('success', x.t('boutique.cat.stockSaved', { label: titleOf(row.article, x) }));
      return true;
    } catch (e) {
      show('error', x.t(shopErrorKey(e)));
      return false;
    }
  };
  const onVariantStock = async (row: CatalogueRow, variante: string, label: string, stock: number): Promise<boolean> => {
    try {
      await adjustStock(bid, { itemId: row.id, variante, stock });
      show('success', x.t('boutique.cat.stockSaved', { label }));
      return true;
    } catch (e) {
      show('error', x.t(shopErrorKey(e)));
      return false;
    }
  };

  const articlesOf = (ids: string[]) => ids.flatMap((id) => (byId.has(id) ? [byId.get(id) as ShopArticle] : []));
  const dialogArticle = dialog && (dialog.kind === 'sell' || dialog.kind === 'sale') ? byId.get(dialog.id) ?? null : null;

  return (
    <>
      <ProPaneTitle title={x.t('pane.catalogue')}>
        <div className="flex flex-wrap items-center gap-3">
          {catalogue.status === 'ready' && saleCount ? <span className="text-[15px] text-inkMuted">{x.tp('boutique.cat.count', saleCount)}</span> : null}
          {saleCount ? (
            <ShopButton tone="outline" onClick={() => setDialog({ kind: 'arrival', ids: [] })}>
              <ShopIcon name="package" size={18} />
              {x.t('boutique.cat.arrival')}
            </ShopButton>
          ) : null}
        </div>
      </ProPaneTitle>

      {catalogue.status === 'loading' ? (
        <ProCentered>
          <p className="text-inkMuted">{x.t('common.loading')}</p>
        </ProCentered>
      ) : catalogue.status === 'error' ? (
        <ProCentered>
          <div>
            <p className="text-ink">{x.t('common.error')}</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full border border-line px-4 py-2 font-semibold text-ink hover:bg-paperHard">
              {x.t('common.retry')}
            </button>
          </div>
        </ProCentered>
      ) : !saleCount ? (
        <div className="rounded-card border border-line bg-paperSoft px-6 py-10 text-center">
          <p className="text-[19px] font-semibold text-ink">{x.t('boutique.cat.emptyTitle')}</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-6 text-inkMuted">{x.t('boutique.cat.emptyBody')}</p>
        </div>
      ) : (
        <>
          {/* Recherche, filtre, tri */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <ShopIcon name="search" size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-inkMuted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={x.t('boutique.cat.search')} aria-label={x.t('boutique.cat.search')} className={`${inputClass} ps-10`} />
            </div>
            <div className="flex flex-wrap gap-1 rounded-full bg-paperHard p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={f === filter}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3.5 py-1.5 text-[14px] ${f === filter ? 'bg-white font-semibold text-ink shadow-card' : 'text-inkSoft hover:text-ink'}`}
                >
                  {x.t(`boutique.cat.filter.${f}`)}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[14px] text-inkSoft">
              {x.t('boutique.cat.sort.label')}
              <select value={sort} onChange={(e) => setSort(e.target.value as CatalogueSort)} className="rounded-[12px] border border-line bg-white px-3 py-2 text-[14px] text-ink">
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {x.t(`boutique.cat.sort.${s}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Gestes en série */}
          {selected.size ? (
            <div className="sticky top-0 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-[16px] border border-cash/30 bg-cashBg px-4 py-3 shadow-card">
              <span className="me-2 text-[15px] font-semibold text-cash">{x.tp('boutique.cat.selected', selected.size)}</span>
              <ShopButton small onClick={() => setDialog({ kind: 'price', ids: [...selected] })}>
                {x.t('boutique.cat.bulk.price')}
              </ShopButton>
              <ShopButton small tone="outline" onClick={() => setDialog({ kind: 'stock', ids: [...selected] })}>
                {x.t('boutique.cat.bulk.stock')}
              </ShopButton>
              <ShopButton small tone="outline" onClick={() => setDialog({ kind: 'arrival', ids: [...selected] })}>
                {x.t('boutique.cat.bulk.arrival')}
              </ShopButton>
              <ShopButton small tone="danger" onClick={() => setDialog({ kind: 'soldOut', ids: [...selected] })}>
                {x.t('boutique.cat.bulk.soldOut')}
              </ShopButton>
              <ShopButton small tone="ghost" className="ms-auto" onClick={() => setSelected(new Set())}>
                {x.t('boutique.cat.clearSelection')}
              </ShopButton>
            </div>
          ) : null}

          {rows.length ? (
            <div className="overflow-x-auto rounded-card border border-line bg-white shadow-card">
              <table className="w-full min-w-[860px] border-collapse text-start">
                <thead>
                  <tr className="border-b border-line bg-paperSoft text-[13px] font-semibold uppercase tracking-wide text-inkMuted">
                    <th className="w-10 py-3 ps-4 text-start">
                      <input type="checkbox" checked={allVisibleSelected} onChange={(e) => toggleAll(e.target.checked)} aria-label={x.t('boutique.cat.selectAll')} className="h-4 w-4 accent-[#0A66C2]" />
                    </th>
                    <th className="py-3 pe-3 text-start">{x.t('boutique.cat.col.article')}</th>
                    <th className="px-3 py-3 text-start">{x.t('boutique.cat.col.price')}</th>
                    <th className="px-3 py-3 text-start">{x.t('boutique.cat.col.stock')}</th>
                    <th className="px-3 py-3 text-start">{x.t('boutique.cat.col.state')}</th>
                    <th className="py-3 pe-4 ps-3 text-end">
                      <span className="sr-only">{x.t('boutique.cat.col.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <Row
                      key={row.id}
                      row={row}
                      selected={selected.has(row.id)}
                      expanded={expanded.has(row.id)}
                      onSelect={onSelect}
                      onToggle={onToggle}
                      onSell={onSell}
                      onRestock={onRestock}
                      onPrice={onPrice}
                      onStock={onStock}
                      onVariantStock={onVariantStock}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-card border border-line bg-paperSoft px-6 py-8 text-center text-[16px] text-inkMuted">{x.t('boutique.cat.noMatch')}</p>
          )}
        </>
      )}

      {dialog?.kind === 'sell' && dialogArticle ? (
        <SellDialog bid={bid} article={dialogArticle} onClose={() => setDialog(null)} onDone={report} onMore={() => setDialog({ kind: 'sale', id: dialogArticle.id })} />
      ) : null}
      {dialog?.kind === 'sale' && dialogArticle ? <SaleDialog bid={bid} article={dialogArticle} onClose={() => setDialog(null)} onDone={report} /> : null}
      {dialog?.kind === 'price' ? <PriceDialog bid={bid} articles={articlesOf(dialog.ids)} onClose={() => setDialog(null)} onDone={report} /> : null}
      {dialog?.kind === 'stock' ? (
        <StockDialog bid={bid} articles={articlesOf(dialog.ids)} initial={dialog.initial} title={dialog.restock ? x.t('boutique.cat.restock') : undefined} onClose={() => setDialog(null)} onDone={report} />
      ) : null}
      {dialog?.kind === 'soldOut' ? <SoldOutDialog bid={bid} articles={articlesOf(dialog.ids)} onClose={() => setDialog(null)} onDone={report} /> : null}
      {dialog?.kind === 'arrival' ? <ArrivalDialog bid={bid} catalogue={catalogue.rows} initialIds={dialog.ids} onClose={() => setDialog(null)} onDone={report} /> : null}

      <NoticeBar notice={notice} onClose={clear} />
    </>
  );
}
