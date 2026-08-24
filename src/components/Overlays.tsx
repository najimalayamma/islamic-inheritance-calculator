import { useMemo, useState } from "react";
import type { HistoryEntry, RuleVerificationStatus } from "../engine/models";
import { inheritanceRules } from "../shafii/rules";
import { useI18n, type Language } from "../i18n";
import { formatDate } from "../utils/helpers";

/* ═══════════════ shared shell ═══════════════ */
function Overlay({ onClose, children, wide = false }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const { t, dir } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-deep-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`anim-slide-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-paper shadow-lift sm:rounded-2xl ${wide ? "sm:max-w-4xl" : "sm:max-w-lg"}`}
        style={{ ["--slide-from" as never]: dir === "rtl" ? "24px" : "-24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute end-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-mint text-deep transition-colors hover:bg-primary hover:text-mint"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════ Info modal (about / how / disclaimer) ═══════════════ */
export type InfoTopic = "about" | "how" | "disclaimer";

export function InfoModal({ topic, onClose }: { topic: InfoTopic; onClose: () => void }) {
  const { t } = useI18n();
  const titleKey = topic === "about" ? "about.title" : topic === "how" ? "how.title" : "disclaimer.title";

  return (
    <Overlay onClose={onClose}>
      <div className="overflow-y-auto p-7 md:p-9">
        <h2 className="font-display text-3xl font-bold text-deep">{t(titleKey)}</h2>
        <div className="mt-5 space-y-4 leading-relaxed text-ink/85">
          {topic === "about" && (
            <>
              <p>{t("about.p1")}</p>
              <p>{t("about.p2")}</p>
              <p>{t("about.p3")}</p>
              <p>{t("about.p4")}</p>
            </>
          )}
          {topic === "how" && (
            <ol className="space-y-3">
              {(["how.s1", "how.s2", "how.s3", "how.s4", "how.s5", "how.s6"] as const).map((k, i) => (
                <li key={k} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-mint">{i + 1}</span>
                  <span>{t(k)}</span>
                </li>
              ))}
            </ol>
          )}
          {topic === "disclaimer" && (
            <>
              <p className="rounded-xl border border-gold/40 bg-gold-soft/50 p-4 font-semibold text-deep">{t("disclaimer.body")}</p>
              <p>{t("disclaimer.extra1")}</p>
              <p>{t("disclaimer.extra2")}</p>
              <p className="text-sm text-ink/60">{t("disclaimer.review")}</p>
            </>
          )}
        </div>
      </div>
    </Overlay>
  );
}

/* ═══════════════ History panel ═══════════════ */
interface HistoryProps {
  entries: HistoryEntry[];
  onOpen: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function HistoryPanel({ entries, onOpen, onDelete, onClear, onClose }: HistoryProps) {
  const { t, lang } = useI18n();
  return (
    <Overlay onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="border-b border-mint-2 p-6">
          <h2 className="font-display text-2xl font-bold text-deep">{t("history.title")}</h2>
          {entries.length > 0 && (
            <button onClick={onClear} className="mt-1 text-sm font-semibold text-blocked transition-colors hover:underline">
              {t("history.clear")}
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-mint-2 bg-mint/30 p-6 text-center leading-relaxed text-ink/60">{t("history.empty")}</p>
          ) : (
            <ul className="space-y-3">
              {entries.map((e) => (
                <li key={e.id} className="group rounded-xl border border-mint-2 bg-paper p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-ink">{e.label}</div>
                      <div className="mt-0.5 text-xs text-ink/55">
                        {t("history.savedOn")}: {formatDate(e.savedAt, lang)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => onOpen(e)} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-mint transition-colors hover:bg-deep">
                      {t("history.open")}
                    </button>
                    <button onClick={() => onDelete(e.id)} className="rounded-lg border border-blocked/30 px-4 py-2 text-sm font-bold text-blocked transition-colors hover:bg-blocked-soft">
                      {t("history.delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Overlay>
  );
}

/* ═══════════════ Audit / scholar review mode ═══════════════ */
const STATUS_TONE: Record<RuleVerificationStatus, string> = {
  VERIFIED: "bg-mint text-primary",
  PENDING_REVIEW: "bg-gold-soft text-blocked",
  NEEDS_REVISION: "bg-blocked-soft text-blocked",
};

export function AuditPanel({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<RuleVerificationStatus | "ALL">("ALL");

  const rules = useMemo(
    () => (filter === "ALL" ? inheritanceRules : inheritanceRules.filter((r) => r.verificationStatus === filter)),
    [filter]
  );

  const pick = (s: { ar: string; en: string; ml?: string }) => {
    if (lang === "ar") return s.ar;
    if (lang === "ml") return s.ml ?? s.en;
    return s.en;
  };

  const filters: (RuleVerificationStatus | "ALL")[] = ["ALL", "VERIFIED", "PENDING_REVIEW", "NEEDS_REVISION"];

  return (
    <Overlay onClose={onClose} wide>
      <div className="flex h-full flex-col">
        <div className="border-b border-mint-2 p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold text-deep md:text-3xl">{t("audit.title")}</h2>
          <p className="mt-1 text-sm text-ink/65">{t("audit.subtitle")}</p>
          <p className="mt-3 rounded-xl border border-gold/40 bg-gold-soft/50 p-3 text-xs leading-relaxed text-deep">{t("audit.note")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.map((f) => {
              const count = f === "ALL" ? inheritanceRules.length : inheritanceRules.filter((r) => r.verificationStatus === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${filter === f ? "bg-deep text-mint" : "bg-mint text-deep hover:bg-mint-2"}`}
                >
                  {f === "ALL" ? t("audit.all") : t(`audit.${f}` as never)} · {count}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <ul className="space-y-4">
            {rules.map((r) => (
              <li key={r.id} className="rounded-xl border border-mint-2 bg-paper p-5 transition-all duration-300 hover:border-primary/40 hover:shadow-card">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-deep px-2 py-1 font-mono text-xs font-bold text-mint" dir="ltr">{r.id}</span>
                  <span className="rounded-md bg-mint px-2 py-1 text-xs font-bold text-primary">{r.category}</span>
                  <span className="rounded-md bg-ink/8 bg-ink/10 px-2 py-1 text-xs font-bold text-ink/60" dir="ltr">Shafi‘i</span>
                  <span className={`ms-auto rounded-full px-3 py-1 text-xs font-bold ${STATUS_TONE[r.verificationStatus]}`}>
                    {t(`audit.${r.verificationStatus}` as never)}
                  </span>
                </div>
                <p className="mt-3 leading-relaxed text-ink/85">{pick(r.description)}</p>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-primary/70">{t("audit.conditions")}</dt>
                    <dd className="mt-0.5 text-ink/75">{lang === "ar" ? r.conditions.ar : r.conditions.en}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-primary/70">{t("audit.result")}</dt>
                    <dd className="mt-0.5 text-ink/75">{lang === "ar" ? r.result.ar : r.result.en}</dd>
                  </div>
                </dl>
                <div className="mt-3 border-t border-mint-2 pt-2.5">
                  <dt className="sr-only">{t("audit.reference")}</dt>
                  {r.references.map((ref, i) => (
                    <dd key={i} className="inline-flex items-center gap-1.5 text-xs text-ink/60">
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-gold" fill="currentColor" aria-hidden>
                        <path d="M2.5 2h4A2.5 2.5 0 019 4.5V14a2 2 0 00-2-1.5H2.5zm6.5 2.5A2.5 2.5 0 0111.5 2h2v10.5H9A2 2 0 007 14z" />
                      </svg>
                      {ref.source} — {ref.location}
                      {i < r.references.length - 1 ? " · " : ""}
                    </dd>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-xs text-ink/50">
            {t("audit.count", { n: rules.length })} · {t("audit.local")}
          </p>
        </div>
      </div>
    </Overlay>
  );
}

/* re-export for App convenience */
export type { Language };
