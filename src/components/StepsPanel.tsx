import { useState } from "react";
import type { CalculationStep, RelationshipType, StepEntry } from "../engine/models";
import { useI18n } from "../i18n";

interface Props {
  steps: CalculationStep[];
}

function RuleChip({ ruleId }: { ruleId: string }) {
  return (
    <span className="rounded-md bg-mint px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-tight text-primary" dir="ltr" title={ruleId}>
      {ruleId}
    </span>
  );
}

function EntryRow({ entry }: { entry: StepEntry }) {
  const { t } = useI18n();
  const name = entry.relationship ? t(`rel.${entry.relationship}` as never) : null;

  if (entry.textKey === "step.entry.blocked") {
    const blockers = (entry.fraction ?? "")
      .split(",")
      .map((b) => (b ? t(`rel.${b as RelationshipType}` as never) : b))
      .filter(Boolean)
      .join("، ");
    return (
      <li className="flex flex-wrap items-center gap-2 py-1.5 text-sm">
        <span className="font-semibold text-ink">{name}</span>
        {entry.count !== undefined && entry.count > 1 && <span className="text-xs text-ink/50" dir="ltr">×{entry.count}</span>}
        <span className="text-ink/70">{t("step.entry.blocked")}</span>
        <span className="text-blocked">({blockers})</span>
        {entry.ruleId && <RuleChip ruleId={entry.ruleId} />}
      </li>
    );
  }

  if (entry.textKey === "step.entry.familyMember") {
    return (
      <li className="flex flex-wrap items-center gap-2 py-1.5 text-sm">
        <span className="font-semibold text-ink">{name}</span>
        <span className="rounded-md bg-mint px-2 py-0.5 font-display text-xs font-bold text-primary" dir="ltr">
          ×{entry.count ?? 1}
        </span>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-2 py-1.5 text-sm">
      {name && (
        <>
          <span className="font-semibold text-ink">{name}</span>
          {entry.count !== undefined && entry.count > 1 && <span className="text-xs text-ink/50" dir="ltr">×{entry.count}</span>}
          <span className="text-ink/40">—</span>
        </>
      )}
      <span className="text-ink/75">{t(entry.textKey as never)}</span>
      {entry.fraction && !entry.textKey.startsWith("step.taker") && (
        <span className="rounded-md bg-deep px-2 py-0.5 font-display text-xs font-bold text-mint" dir="ltr">
          {entry.fraction}
        </span>
      )}
      {entry.ruleId && <RuleChip ruleId={entry.ruleId} />}
    </li>
  );
}

/**
 * "How was this calculated?" — every pipeline step with its heirs,
 * fractions and rule ids, fully expandable.
 */
export function StepsPanel({ steps }: Props) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState<number | null>(1);

  const arabicDigits = ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠"];

  return (
    <section className="rounded-2xl border border-mint-2 bg-paper shadow-card" aria-label={t("result.how")}>
      <h2 className="flex items-center gap-3 p-6 pb-4 font-display text-xl font-bold text-deep">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary" fill="none" aria-hidden>
          <path d="M12 3v3m0 12v3M5.6 5.6l2.2 2.2m8.4 8.4l2.2 2.2M3 12h3m12 0h3M5.6 18.4l2.2-2.2m8.4-8.4l2.2-2.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        {t("result.how")}
      </h2>
      <ol className="px-6 pb-6">
        {steps.map((step, idx) => {
          const isOpen = open === step.id;
          return (
            <li key={step.id} className="border-t border-mint-2 first:border-t-0">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : step.id)}
                aria-expanded={isOpen}
                className="group flex w-full items-center gap-4 py-4 text-start"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold transition-all duration-300 ${isOpen ? "bg-primary text-mint" : "bg-mint text-primary group-hover:bg-mint-2"}`}>
                  {lang === "ar" ? arabicDigits[idx] : step.id}
                </span>
                <span className="flex-1 font-bold text-ink transition-colors group-hover:text-deep">{t(step.titleKey as never)}</span>
                <svg viewBox="0 0 20 20" className={`h-4 w-4 shrink-0 text-primary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} fill="none" aria-hidden>
                  <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {isOpen && (
                <ul className="anim-fade-up mb-4 ms-[52px] divide-y divide-mint-2/70 rounded-xl border border-mint-2 bg-mint/30 px-4 py-1">
                  {step.entries.map((entry, i) => (
                    <EntryRow key={i} entry={entry} />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
