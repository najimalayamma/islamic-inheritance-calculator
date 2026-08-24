import { useEffect, useMemo, useState } from "react";
import type { HeirResult } from "../engine/models";
import { useI18n } from "../i18n";
import { formatMoney, formatPercent } from "../utils/helpers";

const SEGMENT_COLORS = [
  "#176B45",
  "#1F8A5B",
  "#2FA36E",
  "#4CBB87",
  "#7ACBA1",
  "#A8DEC2",
  "#0E4B32",
  "#8FD3AE",
  "#CDE7D8",
  "#3D8F66",
];
const BAYT_COLOR = "#C6A14B";

export interface ChartSegment {
  key: string;
  label: string;
  fractionLabel: string;
  pct: number;
  amount: number;
  color: string;
  isBayt?: boolean;
}

interface Props {
  heirs: HeirResult[];
  baytAmount: number | null;
  baytPct: number | null;
  baytFraction: string | null;
  currency: string;
  estate: number;
}

const R = 86;
const C = 2 * Math.PI * R;

/**
 * Distribution donut — eligible heirs only (blocked heirs never appear).
 * Pure SVG, animated draw, keyboard-focusable segments.
 */
export function DonutChart({ heirs, baytAmount, baytPct, baytFraction, currency, estate }: Props) {
  const { t, lang } = useI18n();
  const [active, setActive] = useState<string | null>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDrawn(true), 80);
    return () => window.clearTimeout(id);
  }, []);

  const segments = useMemo<ChartSegment[]>(() => {
    const list: ChartSegment[] = [];
    let i = 0;
    for (const h of heirs) {
      if (h.status !== "ELIGIBLE" || h.groupFraction.isZero()) continue;
      list.push({
        key: h.relationship,
        label: h.count > 1 ? `${t(`rel.${h.relationship}` as never)} ×${h.count}` : t(`rel.${h.relationship}` as never),
        fractionLabel: h.groupFraction.toString(),
        pct: h.percentage,
        amount: h.groupAmount,
        color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      });
      i++;
    }
    if (baytAmount !== null && baytPct !== null && baytPct > 0) {
      list.push({
        key: "baytAlMal",
        label: t("rel.baytAlMal"),
        fractionLabel: baytFraction ?? "—",
        pct: baytPct,
        amount: baytAmount,
        color: BAYT_COLOR,
        isBayt: true,
      });
    }
    return list;
  }, [heirs, baytAmount, baytPct, baytFraction, t]);

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const len = (seg.pct / 100) * C;
    const offset = cumulative;
    cumulative += len;
    return { seg, len, offset };
  });

  const activeSeg = segments.find((s) => s.key === active) ?? null;

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
      <div className="relative shrink-0">
        <svg width="240" height="240" viewBox="0 0 220 220" role="img" aria-label={t("result.chartTitle")}>
          <circle cx="110" cy="110" r={R} fill="none" stroke="#EAF5EF" strokeWidth="30" />
          <g transform="rotate(-90 110 110)">
            {arcs.map(({ seg, len, offset }) => (
              <circle
                key={seg.key}
                className="donut-seg cursor-pointer"
                cx="110"
                cy="110"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={active === seg.key ? 38 : 30}
                strokeLinecap="butt"
                strokeDasharray={`${Math.max(len - 1.5, 0.1)} ${C - Math.max(len - 1.5, 0.1)}`}
                strokeDashoffset={drawn ? -offset : C}
                opacity={active === null || active === seg.key ? 1 : 0.3}
                onMouseEnter={() => setActive(seg.key)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(seg.key)}
                onBlur={() => setActive(null)}
                tabIndex={0}
              />
            ))}
          </g>
          <text x="110" y="100" textAnchor="middle" className="fill-deep font-display" fontSize="15" fontWeight="700">
            {t("result.estate")}
          </text>
          <text x="110" y="124" textAnchor="middle" className="fill-primary" fontSize="14" fontWeight="600" fontFamily="Space Grotesk, sans-serif" direction="ltr">
            {formatMoney(estate, currency)}
          </text>
        </svg>
        <div className="pointer-events-none absolute -inset-3 rounded-full border border-mint-2" aria-hidden />
      </div>

      <div className="w-full flex-1">
        <ul className="divide-y divide-mint-2 rounded-xl border border-mint-2 bg-paper">
          {arcs.map(({ seg }) => (
            <li
              key={seg.key}
              className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${active === seg.key ? "bg-mint" : ""}`}
              onMouseEnter={() => setActive(seg.key)}
              onMouseLeave={() => setActive(null)}
            >
              <span className="h-3.5 w-3.5 shrink-0 rounded-sm" style={{ background: seg.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate font-medium text-ink">{seg.label}</span>
              <span className="font-display text-sm text-primary" dir="ltr">{seg.fractionLabel}</span>
              <span className="w-16 text-end text-sm text-ink/70" dir="ltr">{formatPercent(seg.pct)}</span>
              <span className="hidden w-24 text-end text-sm font-semibold text-deep sm:block" dir="ltr">
                {formatMoney(seg.amount, currency)}
              </span>
            </li>
          ))}
        </ul>

        {/* Accessible text version */}
        <p className="mt-3 text-xs leading-relaxed text-ink/60">
          <span className="font-semibold">{t("result.textVersion")}: </span>
          {segments
            .map((s) => t("result.accessibleLine", { name: s.label, share: s.fractionLabel, pct: formatPercent(s.pct), amount: formatMoney(s.amount, currency) }))
            .join(lang === "ar" ? "؛ " : "; ")}
        </p>
        {activeSeg && (
          <p className="anim-fade-up mt-2 rounded-lg bg-deep px-3 py-2 text-sm font-medium text-mint">
            {activeSeg.label} — {activeSeg.fractionLabel} · {formatPercent(activeSeg.pct)} ·{" "}
            <span dir="ltr">{formatMoney(activeSeg.amount, currency)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
