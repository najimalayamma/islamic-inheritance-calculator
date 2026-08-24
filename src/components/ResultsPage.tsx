import type { CalculationResult, HeirResult } from "../engine/models";
import { useI18n } from "../i18n";
import { formatMoney, formatPercent } from "../utils/helpers";
import { useReveal } from "../utils/useReveal";
import { DonutChart } from "./DonutChart";
import { BookIcon } from "./Logo";
import { StepsPanel } from "./StepsPanel";

interface Props {
  result: CalculationResult;
  saved: boolean;
  onSave: () => void;
  onNew: () => void;
  onEdit: () => void;
}

function StatusBadge({ heir }: { heir: HeirResult }) {
  const { t } = useI18n();
  if (heir.status === "BLOCKED")
    return <span className="rounded-full bg-blocked-soft px-3 py-1 text-xs font-bold text-blocked">{t("status.BLOCKED")}</span>;
  if (heir.status === "INELIGIBLE")
    return <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-bold text-ink/60">{t("status.INELIGIBLE")}</span>;
  const labelKey = heir.shareType === "NONE" ? "status.NONE" : `status.${heir.shareType}`;
  const tone =
    heir.shareType === "FIXED"
      ? "bg-mint text-primary"
      : heir.shareType === "ASABAH_MA_GHAYR" || heir.shareType === "ASABAH_GHAYRIHI" || heir.shareType === "ASABAH_NAFSIHI"
        ? "bg-deep text-mint"
        : "bg-ink/8 bg-ink/10 text-ink/60";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{t(labelKey as never)}</span>;
}

export function ResultsPage({ result, saved, onSave, onNew, onEdit }: Props) {
  const { t, lang } = useI18n();
  const rootRef = useReveal<HTMLDivElement>([result.generatedAt, lang]);
  const currency = result.input.deceased.currency;
  const heirs = result.eligibleHeirs;
  const blocked = result.blockedHeirs;
  const ineligible = result.ineligibleHeirs;

  const blockerNames = (h: HeirResult) =>
    h.blockedBy.map((b) => t(`rel.${b}` as never)).join(lang === "ar" ? "، " : ", ");

  return (
    <div ref={rootRef} className="mx-auto max-w-5xl px-5 pb-20 pt-8">
      {/* ── Print header ── */}
      <div className="print-only mb-6 border-b-2 border-deep pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookIcon size={44} mono className="text-deep" />
            <div>
              <div className="font-display text-2xl font-bold text-deep">فرائض — حاسبة المواريث</div>
              <div className="text-sm text-deep/70">المذهب الشافعي · Shafi‘i Madhhab</div>
            </div>
          </div>
          <div className="text-sm text-deep/70" dir="ltr">{new Date(result.generatedAt).toLocaleString()}</div>
        </div>
      </div>

      {/* ── Header ── */}
      <header className="reveal">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary/70">{t("app.madhhab")}</p>
            <h1 className="mt-1 font-display text-4xl font-bold text-deep md:text-5xl">{t("result.title")}</h1>
            <p className="mt-2 text-ink/60">{t("result.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <button onClick={onSave} className={`rounded-xl border px-5 py-2.5 font-bold transition-all duration-300 ${saved ? "border-primary bg-mint text-primary" : "border-mint-2 bg-paper text-deep hover:border-primary hover:-translate-y-0.5"}`}>
              {saved ? t("result.saved") : t("result.save")}
            </button>
            <button onClick={() => window.print()} className="rounded-xl border border-mint-2 bg-paper px-5 py-2.5 font-bold text-deep transition-all duration-300 hover:border-primary hover:-translate-y-0.5">
              {t("result.print")}
            </button>
            <button onClick={onNew} className="rounded-xl bg-primary px-5 py-2.5 font-bold text-mint shadow-card transition-all duration-300 hover:bg-deep hover:-translate-y-0.5">
              {t("result.new")}
            </button>
          </div>
        </div>

        {/* Estate strip */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="print-card rounded-xl border border-mint-2 bg-deep p-5 text-mint">
            <div className="text-xs font-bold uppercase tracking-widest text-mint/60">{t("result.estate")}</div>
            <div className="mt-1 font-display text-3xl font-bold" dir="ltr">{formatMoney(result.estateValue, currency)}</div>
          </div>
          <div className="print-card rounded-xl border border-mint-2 bg-paper p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-primary/70">{t("result.distributed")}</div>
            <div className="mt-1 font-display text-3xl font-bold text-deep" dir="ltr">{formatMoney(result.distributedTotal, currency)}</div>
          </div>
          <div className="print-card flex items-center rounded-xl border border-mint-2 bg-paper p-5">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-primary/70">{t("result.class")}</div>
              <div className="mt-1 font-display text-xl font-bold text-primary">{t("app.madhhab")}</div>
            </div>
            <BookIcon size={44} className="ms-auto" />
          </div>
        </div>

        {/* Awl / Radd banners */}
        {result.awl.applied && (
          <div className="anim-fade-up mt-4 flex items-start gap-3 rounded-xl border border-gold/50 bg-gold-soft/60 p-4 text-sm font-semibold leading-relaxed text-deep">
            <span className="font-display text-xl text-gold">﴾</span>
            {t("result.awlBanner", { base: result.awl.baseTotal })}
          </div>
        )}
        {result.radd.applied && (
          <div className="anim-fade-up mt-4 flex items-start gap-3 rounded-xl border border-primary/40 bg-mint p-4 text-sm font-semibold leading-relaxed text-deep">
            <span className="font-display text-xl text-primary">﴿</span>
            {t("result.raddBanner")}
          </div>
        )}
        {result.baytAlMal && (
          <div className="anim-fade-up mt-4 flex items-start gap-3 rounded-xl border border-gold/50 bg-gold-soft/40 p-4 text-sm font-semibold leading-relaxed text-deep">
            <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-gold" fill="currentColor" aria-hidden>
              <path d="M3 8.5h14v2H3zM4 12h2.2v4H4zm4.9 0h2.2v4H8.9zm4.9 0H16v4h-2.2zM10 2.5l7 4.5H3z" />
            </svg>
            {t("result.baytNote", { amount: formatMoney(result.baytAlMal.amount, currency) })}
          </div>
        )}
      </header>

      {/* ── Chart + table ── */}
      <section className="reveal mt-10 print-card rounded-2xl border border-mint-2 bg-paper p-6 shadow-card md:p-8" aria-label={t("result.chartTitle")}>
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-deep">{t("result.chartTitle")}</h2>
          <p className="mt-1 text-sm text-ink/60">{t("result.chartSub")}</p>
        </div>
        <DonutChart
          heirs={heirs}
          baytAmount={result.baytAlMal?.amount ?? null}
          baytPct={result.baytAlMal ? result.baytAlMal.fraction.toPercentage(2) : null}
          baytFraction={result.baytAlMal?.fraction.toString() ?? null}
          currency={currency}
          estate={result.estateValue}
        />

        {/* Table */}
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-deep/70 text-start">
                <th className="py-3 pe-3 text-start font-bold text-deep">{t("result.relative")}</th>
                <th className="py-3 pe-3 text-start font-bold text-deep">{t("result.class")}</th>
                <th className="py-3 pe-3 text-start font-bold text-deep">{t("result.share")}</th>
                <th className="py-3 pe-3 text-start font-bold text-deep">{t("result.percentage")}</th>
                <th className="py-3 text-start font-bold text-deep">{t("result.amount")}</th>
              </tr>
            </thead>
            <tbody>
              {heirs.map((h) => (
                <tr key={h.relationship} className="border-b border-mint-2 transition-colors hover:bg-mint/40">
                  <td className="py-3.5 pe-3">
                    <div className="font-bold text-ink">{t(`rel.${h.relationship}` as never)}</div>
                    {h.count > 1 && (
                      <div className="text-xs text-ink/55">
                        {t("result.groupShare", { n: h.count })}: <span dir="ltr">{formatMoney(h.groupAmount, currency)}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 pe-3"><StatusBadge heir={h} /></td>
                  <td className="py-3.5 pe-3">
                    <span className="font-display text-lg font-bold text-primary" dir="ltr">{h.groupFraction.toString()}</span>
                    {h.count > 1 && <div className="text-xs text-ink/55">{t("result.perPerson")}: <span dir="ltr">{h.finalFraction.toString()}</span></div>}
                  </td>
                  <td className="py-3.5 pe-3 text-ink/80" dir="ltr">{formatPercent(h.percentage)}</td>
                  <td className="py-3.5 font-bold text-deep" dir="ltr">{formatMoney(h.amount, currency)}</td>
                </tr>
              ))}
              {result.baytAlMal && (
                <tr className="border-b border-mint-2 bg-gold-soft/30">
                  <td className="py-3.5 pe-3 font-bold text-deep">{t("rel.baytAlMal")}</td>
                  <td className="py-3.5 pe-3"><span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-blocked">{t("status.BAYT")}</span></td>
                  <td className="py-3.5 pe-3 font-display text-lg font-bold text-blocked" dir="ltr">{result.baytAlMal.fraction.toString()}</td>
                  <td className="py-3.5 pe-3 text-ink/80" dir="ltr">{formatPercent(result.baytAlMal.fraction.toPercentage(2))}</td>
                  <td className="py-3.5 font-bold text-deep" dir="ltr">{formatMoney(result.baytAlMal.amount, currency)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Blocked by hajb ── */}
      <section className="reveal mt-10" aria-label={t("result.blockedSection")}>
        <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-bold text-deep">
          <span className="rounded-lg bg-blocked-soft px-3 py-1 text-base text-blocked">الحجب</span>
          {t("result.blockedTitle")}
        </h2>
        {blocked.length === 0 && ineligible.length === 0 ? (
          <p className="rounded-xl border border-mint-2 bg-mint/40 p-5 text-ink/60">{t("result.noBlocked")}</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {[...blocked, ...ineligible].map((h) => (
              <li key={h.relationship} className="print-card rounded-xl border border-blocked/25 bg-blocked-soft/40 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-ink">
                    {t(`rel.${h.relationship}` as never)}
                    {h.count > 1 && <span className="text-xs text-ink/50" dir="ltr"> ×{h.count}</span>}
                  </div>
                  <StatusBadge heir={h} />
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-blocked">
                  {h.status === "BLOCKED"
                    ? t("result.blockedReason", { names: blockerNames(h) })
                    : t(h.reasonKey === "reason.dhawuAlArham" ? "result.reason.dhawuAlArham" : "result.reason.spouseGenderMismatch")}
                </p>
                {h.reasonRuleId && (
                  <span className="mt-2 inline-block rounded-md bg-paper px-2 py-0.5 font-mono text-[10px] font-semibold text-blocked" dir="ltr">
                    {h.reasonRuleId}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Steps ── */}
      <div className="reveal mt-10 no-print">
        <StepsPanel steps={result.steps} />
      </div>

      {/* ── Print-only calculation summary ── */}
      <div className="print-only mt-8">
        <h3 className="mb-2 font-display text-lg font-bold text-deep">Calculation Summary — ملخص الحساب</h3>
        <ol className="list-inside list-decimal space-y-1 text-sm text-ink">
          {result.steps.map((s) => (
            <li key={s.id}>
              {t(s.titleKey as never)}:{" "}
              {s.entries.map((e) => `${e.relationship ? t(`rel.${e.relationship}` as never) + " " : ""}${e.fraction ?? ""}`).filter(Boolean).join(" · ") || "—"}
            </li>
          ))}
        </ol>
      </div>

      {/* ── Disclaimer ── */}
      <footer className="reveal mt-10 rounded-2xl border border-mint-2 bg-mint/50 p-6 text-sm leading-relaxed text-ink/75">
        <p className="font-bold text-deep">{t("disclaimer.title")}</p>
        <p className="mt-2">{t("disclaimer.body")}</p>
        <p className="mt-1.5">{t("disclaimer.extra1")} {t("disclaimer.extra2")}</p>
        <p className="mt-3 text-xs text-ink/55">{t("footer.privacy")} · {t("footer.version")}</p>
      </footer>

      <div className="mt-8 flex justify-center gap-3 no-print">
        <button onClick={onEdit} className="rounded-xl border border-mint-2 bg-paper px-6 py-3 font-bold text-deep transition-all hover:border-primary hover:-translate-y-0.5">
          {t("common.back")}
        </button>
        <button onClick={onNew} className="rounded-xl bg-primary px-6 py-3 font-bold text-mint shadow-card transition-all hover:bg-deep hover:-translate-y-0.5">
          {t("result.new")}
        </button>
      </div>
    </div>
  );
}
