'use client';

// components/pro/agency/PlanningGrid.tsx
// =============================================================================
// La grille du planning du mois : une ligne par bien, une colonne par jour, les
// barres placées en pourcentage du mois (côté début de lecture : la grille se
// retourne d'elle-même en arabe). Couleurs de la maquette L2 : réservation
// pleine en bleu, demande en pointillés, blocage hachuré, retard en orange,
// retour du jour bordé d'orange avec la clé. Un jour libre (aujourd'hui ou
// plus tard) se clique pour noter une réservation ; une barre ouvre sa fiche.
// =============================================================================

import type { ReactNode } from 'react';
import type { ProTexts } from '@/lib/pro/texts';
import { barAtColumn, type MonthPlanning, type PlanningBar, type PlanningRow } from '@/lib/pro/agency/planning';
import { weekdayLetter } from '@/lib/pro/agency/text';
import { AgencyIcon } from './icons';
import { Thumb } from './ui';

const UNIT_COL = 220;
const MIN_DAY = 34;
const LANE = 32;
const BAR = 26;
const PAD = 12;

export function rowHeight(lanes: number): number {
  return Math.max(64, Math.max(1, lanes) * LANE - (LANE - BAR) + 2 * PAD);
}

function barClass(bar: PlanningBar): string {
  const round = `${bar.clippedStart ? 'rounded-s-none' : 'rounded-s-full'} ${bar.clippedEnd ? 'rounded-e-none' : 'rounded-e-full'}`;
  if (bar.kind === 'request') return `${round} border-2 border-dashed border-cash bg-white text-cash hover:bg-cashBg`;
  if (bar.kind === 'blocked') return `${round} border border-[#DCD3C2] bg-[#ECE5D8] text-inkSoft bg-[repeating-linear-gradient(135deg,transparent_0,transparent_6px,rgba(26,24,20,0.07)_6px,rgba(26,24,20,0.07)_9px)] cursor-default`;
  if (bar.late) return `${round} border-2 border-warning bg-[#FEF3C7] text-[#92400E] hover:brightness-95`;
  if (bar.returnsToday) return `${round} border-2 border-warning bg-white text-[#92400E] hover:bg-paperSoft`;
  return `${round} border border-cash bg-cash text-white hover:bg-cashInk`;
}

export interface PlanningGridProps {
  planning: MonthPlanning;
  today: string;
  texts: ProTexts;
  unitTitle: (row: PlanningRow) => string;
  barLabel: (row: PlanningRow, bar: PlanningBar) => string;
  barTitle: (row: PlanningRow, bar: PlanningBar) => string;
  onCell: (row: PlanningRow, day: string) => void;
  onBar: (row: PlanningRow, bar: PlanningBar) => void;
  cellTitle: (row: PlanningRow) => string;
}

export function PlanningGrid({ planning, today, texts, unitTitle, barLabel, barTitle, onCell, onBar, cellTitle }: PlanningGridProps) {
  const n = planning.days.length;
  const pct = (i: number) => `${(i / n) * 100}%`;
  const grid = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` };

  return (
    <div className="overflow-x-auto rounded-card border border-line bg-white shadow-card">
      <div style={{ minWidth: UNIT_COL + n * MIN_DAY }}>
        {/* En-tête des jours */}
        <div className="flex border-b border-line">
          <div className="sticky start-0 z-20 shrink-0 bg-white" style={{ width: UNIT_COL }} />
          <div className="grid flex-1" style={grid}>
            {planning.days.map((day) => {
              const isToday = day === today;
              return (
                <div key={day} className={`flex flex-col items-center py-2 ${isToday ? 'rounded-t-[10px] bg-cashBg' : ''}`}>
                  <span className="text-[12px] font-semibold text-inkMuted">{weekdayLetter(day, texts)}</span>
                  <span className={`font-display text-[15px] font-bold ${isToday ? 'text-cash' : 'text-ink'}`}>{Number(day.slice(8, 10))}</span>
                </div>
              );
            })}
          </div>
        </div>

        {planning.rows.map((row) => {
          const height = rowHeight(row.lanes);
          const content = Math.max(1, row.lanes) * LANE - (LANE - BAR);
          const top0 = (height - content) / 2;
          const title = unitTitle(row);
          return (
            <div key={row.unit.id} className="flex border-b border-line last:border-b-0">
              <div className="sticky start-0 z-20 flex shrink-0 items-center gap-3 border-e border-line bg-white px-3" style={{ width: UNIT_COL, height }}>
                <Thumb url={row.unit.photo} size={40} />
                <bdi className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink" title={title}>
                  {title}
                </bdi>
              </div>
              <div className="relative flex-1" style={{ height }}>
                {/* Jours (cases cliquables) */}
                <div className="absolute inset-0 grid" style={grid}>
                  {planning.days.map((day, column) => {
                    const past = day < today;
                    const isToday = day === today;
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={past}
                        aria-label={past ? undefined : `${title} · ${texts.relativeDay(day, today)}`}
                        title={past ? undefined : cellTitle(row)}
                        onClick={() => {
                          const bar = barAtColumn(row, column);
                          if (bar) onBar(row, bar);
                          else onCell(row, day);
                        }}
                        className={`h-full border-e border-line/60 last:border-e-0 ${isToday ? 'bg-cashBg/70' : ''} ${past ? 'cursor-default bg-paperSoft/40' : 'hover:bg-paperSoft'}`}
                      />
                    );
                  })}
                </div>
                {/* Barres */}
                {row.bars.map((bar) => {
                  const label = barLabel(row, bar);
                  const span = bar.endIndex - bar.startIndex;
                  const icon = bar.kind === 'booking' ? (bar.airport ? 'plane' : bar.offTrokacha && span >= 2 ? 'phone' : null) : null;
                  return (
                    <button
                      key={bar.key}
                      type="button"
                      title={barTitle(row, bar)}
                      aria-label={barTitle(row, bar)}
                      onClick={() => onBar(row, bar)}
                      className={`absolute z-10 flex items-center gap-1.5 overflow-hidden px-2.5 text-[13px] font-semibold transition ${barClass(bar)}`}
                      style={{
                        insetInlineStart: `calc(${pct(bar.startIndex)} + 2px)`,
                        width: `calc(${pct(span)} - 4px)`,
                        top: top0 + bar.lane * LANE,
                        height: BAR,
                      }}
                    >
                      {icon ? <AgencyIcon name={icon} size={14} className="shrink-0" /> : null}
                      {bar.returnsToday ? <AgencyIcon name="key" size={14} className="shrink-0" /> : null}
                      {span >= 2 || !icon ? <bdi className="truncate">{label}</bdi> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlanningLegend({ texts }: { texts: ProTexts }) {
  const t = texts.t;
  const item = (swatch: ReactNode, label: string) => (
    <span className="inline-flex items-center gap-2 text-[14px] text-inkSoft">
      {swatch}
      {label}
    </span>
  );
  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
      {item(<span className="h-4 w-8 rounded-full border border-cash bg-cash" />, t('ag.planning.booked'))}
      {item(<span className="h-4 w-8 rounded-full border-2 border-dashed border-cash bg-white" />, t('ag.planning.legend.request'))}
      {item(<span className="h-4 w-8 rounded-full border border-[#DCD3C2] bg-[#ECE5D8]" />, t('ag.planning.blocked'))}
      {item(<AgencyIcon name="phone" size={16} />, t('ag.planning.legend.offTrokacha'))}
      {item(<AgencyIcon name="plane" size={16} />, t('ag.planning.legend.airport'))}
      {item(<AgencyIcon name="key" size={16} className="text-warning" />, t('ag.planning.legend.returnToday'))}
      {item(<span className="h-4 w-8 rounded-full border-2 border-warning bg-[#FEF3C7]" />, t('ag.planning.legend.late'))}
    </div>
  );
}
