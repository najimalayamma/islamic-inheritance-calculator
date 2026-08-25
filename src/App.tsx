import { useCallback, useEffect, useState } from "react";
import type { CalculationInput, CalculationResult, HistoryEntry } from "./engine/models";
import { calculate } from "./shafii/calculator";
import { I18nProvider, useI18n, LANGUAGE_OPTIONS } from "./i18n";
import { BookIcon, LogoHorizontal } from "./components/Logo";
import { HomePage } from "./components/HomePage";
import { CalculatorPage } from "./components/CalculatorPage";
import { ResultsPage } from "./components/ResultsPage";
import { AuditPanel, HistoryPanel, InfoModal, type InfoTopic } from "./components/Overlays";
import { clearHistory, deleteHistoryEntry, generateId, loadHistory, saveHistoryEntry } from "./utils/helpers";

type View = "home" | "calc" | "result";

function freshInput(): CalculationInput {
  return {
    deceased: { gender: "male", estateValue: 1000000, currency: "INR", funeralExpenses: 0, debts: 0, bequest: 0 },
    relatives: [],
  };
}

function AppShell() {
  const { t } = useI18n();
  const [view, setView] = useState<View>("home");
  const [input, setInput] = useState<CalculationInput>(freshInput);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [infoTopic, setInfoTopic] = useState<InfoTopic | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  const handleCalculate = useCallback((next: CalculationInput) => {
    try {
      setInput(next);
      setResult(calculate(next));
      setSaved(false);
      setView("result");
    } catch (err) {
      console.error("Calculation failed:", err);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!result) return;
    const totalHeirs = result.input.relatives.reduce((s, r) => s + r.count, 0);
    const entry: HistoryEntry = {
      id: generateId(),
      savedAt: new Date().toISOString(),
      label: `${t("app.name")} — ${t("calc.totalHeirs", { n: totalHeirs })}`,
      input: result.input,
    };
    setHistory(saveHistoryEntry(entry));
    setSaved(true);
  }, [result, t]);

  const handleOpenHistory = useCallback((entry: HistoryEntry) => {
    setShowHistory(false);
    handleCalculate(entry.input);
  }, [handleCalculate]);

  const handleNew = useCallback(() => {
    setInput(freshInput());
    setResult(null);
    setSaved(false);
    setView("calc");
  }, []);

  return (
    <div className="ambient-bg flex min-h-screen flex-col">
      {/* ═══════════ Header ═══════════ */}
      <header className="sticky top-0 z-40 border-b border-mint-2 bg-paper/90 backdrop-blur no-print">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          <button onClick={() => setView("home")} className="transition-opacity hover:opacity-80" aria-label={t("nav.home")}>
            <LogoHorizontal compact />
          </button>

          <nav className="ms-auto flex items-center gap-1.5">
            {view !== "calc" && (
              <button
                onClick={() => setView("calc")}
                className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-bold text-mint transition-all duration-200 hover:bg-deep sm:block"
              >
                {t("nav.calculate")}
              </button>
            )}
            <button
              onClick={() => setShowHistory(true)}
              className="relative rounded-lg border border-mint-2 bg-paper p-2 text-deep transition-all duration-200 hover:border-primary/50 hover:text-primary"
              aria-label={t("nav.history")}
              title={t("nav.history")}
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M10 2a8 8 0 108 8h-2a6 6 0 11-1.8-4.3L12 8h6V2l-2.1 2.1A8 8 0 0010 2z" fill="currentColor" opacity="0.15" />
                <path d="M10 2a8 8 0 108 8M18 10A8 8 0 0015.9 4.6L18 2.5V8h-5.5M10 5.5V10l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {history.length > 0 && (
                <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-deep" dir="ltr">
                  {history.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowAudit(true)}
              className="rounded-lg border border-mint-2 bg-paper p-2 text-deep transition-all duration-200 hover:border-primary/50 hover:text-primary"
              aria-label={t("nav.audit")}
              title={t("nav.audit")}
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M4 3.5h8.5L16 7v9.5H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M12.5 3.5V7H16M6.8 10h6.4M6.8 13h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            {/* language switcher */}
            <LangSwitcher />
          </nav>
        </div>
      </header>

      {/* ═══════════ Views ═══════════ */}
      <main className="flex-1">
        {view === "home" && <HomePage onStart={() => setView("calc")} onInfo={(topic) => setInfoTopic(topic)} />}
        {view === "calc" && (
          <CalculatorPage initialInput={input} onCalculate={handleCalculate} onBack={() => setView(result ? "result" : "home")} />
        )}
        {view === "result" && result && (
          <ResultsPage result={result} saved={saved} onSave={handleSave} onNew={handleNew} onEdit={() => setView("calc")} />
        )}
      </main>

      {/* ═══════════ Footer ═══════════ */}
      <footer className="geo-lattice-dark mt-auto bg-deep text-mint no-print">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <BookIcon size={46} />
              <div>
                <div className="font-display text-2xl font-bold">فرائض</div>
                <div className="text-xs text-mint/70">{t("app.subtitle")}</div>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mint/70">{t("footer.madhhab")}</p>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold">{t("home.indexTitle")}</h3>
            <ul className="space-y-2 text-sm">
              {(
                [
                  ["about", "home.about"],
                  ["how", "home.how"],
                  ["disclaimer", "home.disclaimer"],
                ] as [InfoTopic, "home.about" | "home.how" | "home.disclaimer"][]
              ).map(([topic, key]) => (
                <li key={topic}>
                  <button onClick={() => setInfoTopic(topic)} className="text-mint/80 transition-colors hover:text-gold">
                    {t(key)}
                  </button>
                </li>
              ))}
              <li>
                <button onClick={() => setShowAudit(true)} className="text-mint/80 transition-colors hover:text-gold">
                  {t("nav.audit")}
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold">{t("disclaimer.title")}</h3>
            <p className="text-sm leading-relaxed text-mint/70">{t("disclaimer.body")}</p>
            <p className="mt-3 text-xs text-mint/50">{t("footer.privacy")}</p>
            <p className="mt-1 text-xs text-mint/50">{t("footer.scholar")} · {t("footer.version")}</p>
          </div>
        </div>
        <div className="border-t border-mint/10 py-4 text-center text-xs text-mint/50">
          فرائض · {t("app.madhhab")} · Shafi‘i Madhhab · Faraid
        </div>
      </footer>

      {/* ═══════════ Overlays ═══════════ */}
      {showHistory && (
        <HistoryPanel
          entries={history}
          onOpen={handleOpenHistory}
          onDelete={(id) => setHistory(deleteHistoryEntry(id))}
          onClear={() => {
            clearHistory();
            setHistory([]);
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
      {showAudit && <AuditPanel result={result} onClose={() => setShowAudit(false)} />}
      {infoTopic && <InfoModal topic={infoTopic} onClose={() => setInfoTopic(null)} />}
    </div>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center rounded-lg border border-mint-2 bg-mint/50 p-0.5" role="group" aria-label="Language">
      {LANGUAGE_OPTIONS.map((opt) => (
        <button
          key={opt.code}
          onClick={() => setLang(opt.code)}
          aria-pressed={lang === opt.code}
          className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition-all duration-200 ${lang === opt.code ? "bg-deep text-mint shadow-card" : "text-deep/70 hover:text-deep"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  );
}
