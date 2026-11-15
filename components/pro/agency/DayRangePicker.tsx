'use client';

// components/pro/agency/DayRangePicker.tsx
// Calendrier des dates d'une réservation : un clic pour le premier jour, un
// second pour le jour du retour (fin EXCLUSIVE). `inclusive` (blocage) : le
// second clic est le DERNIER jour bloqué, `end` = ce dernier jour, et un seul
// clic suffit pour un seul jour. Les jours déjà pris sont
// barrés (prévenus ; le serveur tranche), les jours passés sont éteints. La
// ligne d'aide et « Effacer » ont leur place dès l'ouverture : la grille ne
// bouge jamais entre deux clics (leçon du passage simulateur du 15/11).

import { useMemo, useState } from 'react';
import { addDays, type Plage } from '@/lib/pro-core';
import { pickRangeDay } from '@/lib/pro/agency/blocks';
import { monthBounds, shiftMonth } from '@/lib/pro/agency/planning';
import { monthTitle, shortRange, weekdayLetter } from '@/lib/pro/agency/text';
import type { ProTexts } from '@/lib/pro/texts';
import { AgencyIcon } from './icons';

/** Une semaine qui commence un dimanche (15/11/2026) : les lettres des colonnes, du dimanche au samedi. */
const REFERENCE_WEEK = ['2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21'];

export function DayRangePicker({ texts, today, start, end, kind, unavailable, onChange, inclusive = false }: {
  texts: ProTexts;
  today: string;
  start: string | null;
  end: string | null;
  kind: 'car' | 'immo';
  unavailable: readonly Plage[];
  onChange: (start: string | null, end: string | null) => void;
  /** Blocage : `end` est le dernier jour choisi (compris), pas le jour du retour. */
  inclusive?: boolean;
}) {
  const t = texts.t;
  const [month, setMonth] = useState(() => monthBounds(start ?? today).first);
  const { first, next } = monthBounds(month);
  const cells = useMemo(() => {
    const lead = new Date(`${first}T00:00:00Z`).getUTCDay();
    const out: Array<string | null> = Array.from({ length: lead }, () => null);
    for (let d = first; d < next; d = addDays(d, 1)) out.push(d);
    return out;
  }, [first, next]);
  const taken = (day: string) => unavailable.some((r) => r.start <= day && day < r.end);
  const minMonth = monthBounds(today).first;

  const pick = (day: string) => {
    const [s, e] = pickRangeDay(start, end, day, inclusive);
    onChange(s, e);
  };

  // Blocage : la plage choisie s'écrit sous le calendrier (tiroir) ; ici, toujours le geste suivant.
  const hint = inclusive
    ? !start
      ? t('ag.unit.blockPickStart')
      : t(`ag.unit.blockPickEnd.${kind}`)
    : !start
      ? t(`ag.booking.datesSheet.pickStart.${kind}`)
      : !end
        ? t(`ag.booking.datesSheet.pickEnd.${kind}`)
        : shortRange(start, end, texts);

  return (
    <div className="rounded-[16px] border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(first, -1))}
          disabled={first <= minMonth}
          aria-label={t('ag.web.prevMonth')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-paperHard text-ink hover:bg-line disabled:opacity-30"
        >
          <AgencyIcon name="chevronStart" className="rtl:-scale-x-100" />
        </button>
        <span className="font-display text-[17px] font-bold text-ink">{monthTitle(first, texts)}</span>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(first, 1))}
          aria-label={t('ag.web.nextMonth')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-paperHard text-ink hover:bg-line"
        >
          <AgencyIcon name="chevronEnd" className="rtl:-scale-x-100" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {REFERENCE_WEEK.map((d) => (
          <span key={d} className="pb-1 text-[12px] font-semibold text-inkMuted">
            {weekdayLetter(d, texts)}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`lead-${i}`} />;
          const past = day < today;
          const isTaken = taken(day);
          const isStart = day === start;
          const isEnd = day === end;
          const inRange = !!start && !!end && day > start && day < end;
          const selected = isStart || isEnd;
          return (
            <button
              key={day}
              type="button"
              disabled={past}
              onClick={() => pick(day)}
              aria-pressed={selected}
              className={`flex h-10 items-center justify-center rounded-[10px] text-[15px] font-semibold transition ${
                selected
                  ? 'bg-ink text-white'
                  : inRange
                    ? 'bg-paperHard text-ink'
                    : past
                      ? 'cursor-default text-line2'
                      : isTaken
                        ? 'text-inkMuted line-through hover:bg-paperSoft'
                        : 'text-ink hover:bg-paperSoft'
              } ${day === today && !selected ? 'ring-1 ring-cash' : ''}`}
            >
              {Number(day.slice(8, 10))}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex min-h-[40px] items-center justify-between gap-3">
        <p className="text-[14px] text-inkSoft">{hint}</p>
        <button
          type="button"
          onClick={() => onChange(null, null)}
          className={`rounded-full bg-paperHard px-4 py-1.5 text-[14px] font-semibold text-ink hover:bg-line ${start ? '' : 'invisible'}`}
        >
          {t('ag.booking.datesSheet.clear')}
        </button>
      </div>
    </div>
  );
}
