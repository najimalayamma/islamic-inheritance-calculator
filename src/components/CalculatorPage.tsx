import { useMemo, useState } from "react";
import type { CalculationInput, Gender, RelationshipType } from "../engine/models";
import { RELATIONSHIPS, getRelationshipMeta } from "../data/relationships";
import { useI18n } from "../i18n";
import { validateInput } from "../shafii/validation";
import { useReveal } from "../utils/useReveal";

interface Props {
  initialInput: CalculationInput;
  onCalculate: (input: CalculationInput) => void;
  onBack: () => void;
}

const CURRENCIES = ["INR", "USD", "AED", "MYR", "EUR", "GBP"];

function PersonIcon({ gender }: { gender: Gender | null }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <circle cx="12" cy="7.5" r="3.4" stroke={gender === "female" ? "#2FA36E" : "#176B45"} strokeWidth="2" />
      <path d="M4.5 19.5c1.3-3.6 4.1-5.4 7.5-5.4s6.2 1.8 7.5 5.4" stroke={gender === "female" ? "#2FA36E" : "#176B45"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CalculatorPage({ initialInput, onCalculate, onBack }: Props) {
  const { t, lang } = useI18n();
  const rootRef = useReveal<HTMLDivElement>([lang]);

  const [gender, setGender] = useState<Gender>(initialInput.deceased.gender);
  const [estate, setEstate] = useState<string>(initialInput.deceased.estateValue ? String(initialInput.deceased.estateValue) : "");
  const [currency, setCurrency] = useState(initialInput.deceased.currency);
  const [deductionsOpen, setDeductionsOpen] = useState(false);
  const [funeral, setFuneral] = useState<string>(initialInput.deceased.funeralExpenses ? String(initialInput.deceased.funeralExpenses) : "");
  const [debts, setDebts] = useState<string>(initialInput.deceased.debts ? String(initialInput.deceased.debts) : "");
  const [bequest, setBequest] = useState<string>(initialInput.deceased.bequest ? String(initialInput.deceased.bequest) : "");

  const [relatives, setRelatives] = useState<{ relationship: RelationshipType; count: number }[]>(
    initialInput.relatives.map((r) => ({ ...r }))
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const input: CalculationInput = useMemo(
    () => ({
      deceased: {
        gender,
        estateValue: estate.trim() === "" ? NaN : Number(estate),
        currency,
        funeralExpenses: Number(funeral || 0),
        debts: Number(debts || 0),
        bequest: Number(bequest || 0),
      },
      relatives,
    }),
    [gender, estate, currency, funeral, debts, bequest, relatives]
  );

  const errors = useMemo(() => validateInput(input), [input]);
  const showError = (key: string) => attempted && errors.some((e) => e.key === key);
  const anyError = errors.length > 0;

  const addRelative = (rel: RelationshipType) => {
    const meta = getRelationshipMeta(rel);
    setRelatives((prev) => {
      const existing = prev.find((r) => r.relationship === rel);
      if (existing) {
        if (existing.count >= meta.max) return prev;
        return prev.map((r) => (r.relationship === rel ? { ...r, count: r.count + 1 } : r));
      }
      return [...prev, { relationship: rel, count: 1 }];
    });
  };

  const changeCount = (rel: RelationshipType, delta: number) => {
    setRelatives((prev) =>
      prev
        .map((r) => {
          if (r.relationship !== rel) return r;
          const max = getRelationshipMeta(rel).max;
          return { ...r, count: Math.min(max, Math.max(1, r.count + delta)) };
        })
        .filter((r) => r.count > 0)
    );
  };

  const removeRelative = (rel: RelationshipType) => {
    setRelatives((prev) => prev.filter((r) => r.relationship !== rel));
  };

  const totalCount = relatives.reduce((s, r) => s + r.count, 0);

  const submit = () => {
    setAttempted(true);
    if (anyError) return;
    onCalculate(input);
  };

  const categories: { key: "calc.category.immediate" | "calc.category.grandparents" | "calc.category.siblings"; id: string }[] = [
    { key: "calc.category.immediate", id: "immediate" },
    { key: "calc.category.grandparents", id: "grandparents" },
    { key: "calc.category.siblings", id: "siblings" },
  ];

  const isDisabledOption = (rel: RelationshipType): boolean => {
    if (rel === "husband" && gender !== "female") return true;
    if (rel === "wife" && gender !== "male") return true;
    const existing = relatives.find((r) => r.relationship === rel);
    if (existing && existing.count >= getRelationshipMeta(rel).max) return true;
    return false;
  };

  const numField =
    "w-full rounded-lg border border-mint-2 bg-paper px-4 py-3 text-lg font-semibold text-ink outline-none transition-colors placeholder:font-normal placeholder:text-ink/35 focus:border-primary";

  return (
    <div ref={rootRef} className="mx-auto max-w-3xl px-5 pb-40 pt-8">
      {/* step header */}
      <div className="reveal mb-8 flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg border border-mint-2 bg-paper px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary/50 hover:text-deep">
          {t("common.back")}
        </button>
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-deep">{t("calc.title")}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-primary">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden><path d="M8 1l1.8 3.7 4.1.6-3 2.9.7 4.1L8 10.4l-3.6 1.9.7-4.1-3-2.9 4.1-.6z"/></svg>
            {t("calc.note.shafii")}
          </p>
        </div>
      </div>

      {/* ── Step 1: deceased info ── */}
      <section className="reveal rounded-2xl border border-mint-2 bg-paper p-6 shadow-card md:p-8" aria-labelledby="step1-h">
        <h2 id="step1-h" className="mb-6 flex items-center gap-3 font-display text-xl font-bold text-deep">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-base text-mint">١</span>
          {t("calc.step1")}
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-ink/70">{t("calc.gender")}</label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-mint p-1.5">
              {(["male", "female"] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  aria-pressed={gender === g}
                  className={`rounded-lg px-4 py-3 text-base font-bold transition-all duration-200 ${gender === g ? "bg-primary text-mint shadow-card" : "text-deep/70 hover:bg-paper"}`}
                >
                  {t(g === "male" ? "calc.male" : "calc.female")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="estate" className="mb-2 block text-sm font-bold text-ink/70">{t("calc.estate")}</label>
            <div className="flex gap-2">
              <input
                id="estate"
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="1000000"
                value={estate}
                onChange={(e) => setEstate(e.target.value)}
                className={numField}
                dir="ltr"
              />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-lg border border-mint-2 bg-paper px-3 font-semibold text-deep outline-none focus:border-primary" aria-label={t("calc.currency")}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {(showError("error.estateRequired") || showError("error.estateNegative")) && (
              <p className="anim-fade-up mt-2 text-sm font-semibold text-blocked">
                {t(estate.trim() === "" || Number.isNaN(Number(estate)) ? "error.estateRequired" : "error.estateNegative")}
              </p>
            )}
          </div>
        </div>

        {/* optional deductions */}
        <div className="mt-6 rounded-xl border border-mint-2 bg-mint/40">
          <button
            type="button"
            onClick={() => setDeductionsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-bold text-deep transition-colors hover:text-primary"
            aria-expanded={deductionsOpen}
          >
            {t("calc.optional")}
            <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform duration-300 ${deductionsOpen ? "rotate-180" : ""}`} fill="none" aria-hidden>
              <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {deductionsOpen && (
            <div className="anim-fade-up border-t border-mint-2 px-5 pb-5 pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ["calc.funeral", funeral, setFuneral],
                    ["calc.debts", debts, setDebts],
                    ["calc.bequest", bequest, setBequest],
                  ] as ["calc.funeral" | "calc.debts" | "calc.bequest", string, (v: string) => void][]
                ).map(([label, value, setter]) => (
                  <div key={label}>
                    <label className="mb-1.5 block text-xs font-bold text-ink/60">{t(label)}</label>
                    <input type="number" inputMode="decimal" min="0" value={value} onChange={(e) => setter(e.target.value)} className={`${numField} py-2.5 text-base`} dir="ltr" />
                  </div>
                ))}
              </div>
              <p className="mt-4 flex gap-2 rounded-lg border border-gold/40 bg-gold-soft/50 p-3 text-xs leading-relaxed text-deep">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="currentColor" aria-hidden>
                  <path d="M10 1.7a8.3 8.3 0 100 16.6 8.3 8.3 0 000-16.6zm-.9 4h1.8v1.9H9.1zm0 3.4h1.8v5.2H9.1z" />
                </svg>
                {t("calc.deductionsNote")}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Step 2: relatives ── */}
      <section className="reveal mt-6 rounded-2xl border border-mint-2 bg-paper p-6 shadow-card md:p-8" aria-labelledby="step2-h">
        <h2 id="step2-h" className="mb-6 flex items-center gap-3 font-display text-xl font-bold text-deep">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-base text-mint">٢</span>
          {t("calc.step2")}
        </h2>

        {relatives.length === 0 ? (
          <p className="rounded-xl border border-dashed border-mint-2 bg-mint/30 p-6 text-center leading-relaxed text-ink/60">{t("calc.empty")}</p>
        ) : (
          <ul className="divide-y divide-mint-2 overflow-hidden rounded-xl border border-mint-2">
            {relatives.map((r) => {
              const meta = getRelationshipMeta(r.relationship);
              return (
                <li key={r.relationship} className="flex items-center gap-3 bg-paper px-4 py-3 transition-colors hover:bg-mint/40">
                  <PersonIcon gender={meta.gender} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-ink">{t(`rel.${r.relationship}` as never)}</div>
                    {r.count > 1 && <div className="text-xs font-semibold text-primary">×{r.count}</div>}
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-mint-2 bg-mint/50 p-1">
                    <button type="button" onClick={() => changeCount(r.relationship, -1)} disabled={r.count <= 1} aria-label="−"
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-paper font-display text-lg font-bold text-deep transition-all hover:bg-primary hover:text-mint disabled:opacity-30 disabled:hover:bg-paper disabled:hover:text-deep">
                      −
                    </button>
                    <span className="w-8 text-center font-display text-lg font-bold text-deep" dir="ltr">{r.count}</span>
                    <button type="button" onClick={() => changeCount(r.relationship, 1)} disabled={r.count >= meta.max} aria-label="+"
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-paper font-display text-lg font-bold text-deep transition-all hover:bg-primary hover:text-mint disabled:opacity-30 disabled:hover:bg-paper disabled:hover:text-deep">
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => removeRelative(r.relationship)} aria-label={t("calc.remove")}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/40 transition-colors hover:bg-blocked-soft hover:text-blocked">
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
                      <path d="M4 6h12M8 6V4.5A1.5 1.5 0 019.5 3h1A1.5 1.5 0 0112 4.5V6m2.5 0l-.7 9.1a2 2 0 01-2 1.9H8.2a2 2 0 01-2-1.9L5.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Add relative */}
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-expanded={pickerOpen}
          className={`mt-5 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-5 text-lg font-bold transition-all duration-300 ${pickerOpen ? "border-primary bg-mint text-deep" : "border-primary/40 bg-mint/30 text-primary hover:border-primary hover:bg-mint hover:-translate-y-0.5"}`}
        >
          <svg viewBox="0 0 20 20" className={`h-6 w-6 transition-transform duration-300 ${pickerOpen ? "rotate-45" : ""}`} fill="none" aria-hidden>
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          {t("calc.addRelative")}
        </button>

        {pickerOpen && (
          <div className="anim-fade-up mt-4 space-y-5 rounded-xl border border-mint-2 bg-mint/30 p-5">
            {categories.map((cat) => (
              <div key={cat.id}>
                <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.18em] text-primary/80">{t(cat.key)}</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {RELATIONSHIPS.filter((r) => r.category === cat.id).map((r) => {
                    const disabled = isDisabledOption(r.type);
                    const existing = relatives.find((x) => x.relationship === r.type);
                    return (
                      <button
                        key={r.type}
                        type="button"
                        disabled={disabled}
                        onClick={() => addRelative(r.type)}
                        className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                          disabled
                            ? "cursor-not-allowed border-mint-2 bg-paper text-ink/30"
                            : "border-mint-2 bg-paper text-ink hover:-translate-y-0.5 hover:border-primary hover:text-deep hover:shadow-card"
                        }`}
                      >
                        <span className="truncate">{t(`rel.${r.type}` as never)}</span>
                        {existing ? (
                          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-mint" dir="ltr">×{existing.count}</span>
                        ) : (
                          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-primary" fill="none" aria-hidden>
                            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {attempted && showError("error.atLeastOne") && (
          <p className="anim-fade-up mt-3 text-sm font-semibold text-blocked">{t("error.atLeastOne")}</p>
        )}
        {attempted && (showError("error.husbandForFemale") || showError("error.wifeForMale")) && (
          <p className="anim-fade-up mt-3 text-sm font-semibold text-blocked">
            {t(relatives.some((r) => r.relationship === "husband") ? "error.husbandForFemale" : "error.wifeForMale")}
          </p>
        )}
        {attempted && showError("error.maxWives") && <p className="anim-fade-up mt-3 text-sm font-semibold text-blocked">{t("error.maxWives")}</p>}
      </section>

      {/* ── Sticky action bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-mint-2 bg-paper/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4">
          <div className="flex-1 text-sm font-semibold text-ink/70">
            {totalCount > 0 ? t("calc.totalHeirs", { n: totalCount }) : t("calc.relatives")}
          </div>
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-3 rounded-xl bg-primary px-8 py-3.5 text-lg font-bold text-mint shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:bg-deep active:translate-y-0"
          >
            {t("calc.calculate")}
            <svg viewBox="0 0 20 20" className="h-5 w-5 rtl:-scale-x-100" fill="none" aria-hidden>
              <path d="M3.5 10h12m0 0l-4.5-4.5M15.5 10L11 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
