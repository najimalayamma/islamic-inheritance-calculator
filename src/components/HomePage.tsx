import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import { useReveal } from "../utils/useReveal";
import { BookIcon } from "./Logo";

type InfoTopic = "about" | "how" | "disclaimer";

interface Props {
  onStart: () => void;
  onInfo: (topic: InfoTopic) => void;
}

const PIPELINE_KEYS = [
  "home.p1", "home.p2", "home.p3", "home.p4", "home.p5", "home.p6", "home.p7", "home.p8", "home.p9",
] as const;

const TERM_KEYS = [
  { term: "home.term.furud", desc: "home.term.furudDesc" },
  { term: "home.term.asabah", desc: "home.term.asabahDesc" },
  { term: "home.term.hajb", desc: "home.term.hajbDesc" },
  { term: "home.term.awl", desc: "home.term.awlDesc" },
  { term: "home.term.radd", desc: "home.term.raddDesc" },
] as const;

/** A living sample distribution: wife, mother, father, 2 sons, 1 daughter. */
const SAMPLE = [
  { key: "rel.wife", pct: 12.5, color: "#4CBB87" },
  { key: "rel.mother", pct: 16.67, color: "#2FA36E" },
  { key: "rel.father", pct: 16.67, color: "#1F8A5B" },
  { key: "rel.son", pct: 43.33, color: "#176B45" },
  { key: "rel.daughter", pct: 10.83, color: "#7ACBA1" },
] as const;

function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${className} rtl:-scale-x-100`} aria-hidden>
      <path d="M3.5 10h12m0 0l-4.5-4.5M15.5 10L11 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomePage({ onStart, onInfo }: Props) {
  const { t, lang } = useI18n();
  const rootRef = useReveal<HTMLDivElement>([lang]);
  const [barsDrawn, setBarsDrawn] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setBarsDrawn(true), 350);
    return () => window.clearTimeout(id);
  }, []);

  const arabicDigits = ["٠١", "٠٢", "٠٣", "٠٤", "٠٥", "٠٦", "٠٧", "٠٨", "٠٩"];

  return (
    <div ref={rootRef}>
      {/* ═══════════ Opening spread ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="geo-lattice lattice-drift pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-8 lg:pt-16">
          {/* Brand column */}
          <div>
            <div className="anim-fade-up inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold-soft/60 px-4 py-1.5 text-sm font-semibold text-deep">
              <svg viewBox="0 0 20 20" className="h-4 w-4 text-gold" fill="currentColor" aria-hidden>
                <path d="M10 1.8l2.4 4.9 5.4.8-3.9 3.8.9 5.4L10 14.2l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" />
              </svg>
              {t("app.madhhab")}
            </div>

            <h1 className="line-mask mt-5">
              <span className="font-display text-[clamp(4.2rem,13vw,8rem)] font-bold leading-[0.95] text-deep">
                فرائض
              </span>
            </h1>
            <p className="anim-fade-up mt-3 font-display text-2xl text-primary md:text-3xl" style={{ animationDelay: "0.15s" }}>
              {t("app.subtitle")}
            </p>
            <p className="anim-fade-up mt-4 max-w-md text-lg leading-relaxed text-ink/75" style={{ animationDelay: "0.25s" }}>
              {t("app.tagline")}
            </p>

            <div className="anim-fade-up mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: "0.35s" }}>
              <button
                onClick={onStart}
                className="group inline-flex items-center gap-3 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-mint shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:bg-deep hover:shadow-card active:translate-y-0"
              >
                {t("home.start")}
                <ArrowIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </button>
            </div>

            {/* Index of chapters — manuscript style */}
            <nav className="anim-fade-up mt-10 max-w-md" style={{ animationDelay: "0.45s" }} aria-label={t("home.indexTitle")}>
              <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary/70">{t("home.indexTitle")}</div>
              {(
                [
                  ["about", "home.about"],
                  ["how", "home.how"],
                  ["disclaimer", "home.disclaimer"],
                ] as [InfoTopic, "home.about" | "home.how" | "home.disclaimer"][]
              ).map(([topic, key], i) => (
                <button
                  key={topic}
                  onClick={() => onInfo(topic)}
                  className="group flex w-full items-center gap-4 border-b border-mint-2 py-3.5 text-start transition-all duration-300 hover:border-primary/50 hover:ps-2"
                >
                  <span className="font-display text-xl text-gold">{arabicDigits[i]}</span>
                  <span className="flex-1 font-semibold text-ink group-hover:text-deep">{t(key)}</span>
                  <ArrowIcon className="h-4 w-4 text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </button>
              ))}
            </nav>
          </div>

          {/* Book column — the open book and a living sample division */}
          <div className="relative flex flex-col items-center">
            <div className="book-glow absolute top-6 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="reveal relative rounded-3xl border border-mint-2 bg-paper/80 p-8 shadow-card">
              <BookIcon size={168} className="mx-auto drop-shadow-sm md:size-[200px]" />
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-ink/60">
                  <span>{t("result.chartTitle")}</span>
                  <span className="rounded-full bg-mint px-2 py-0.5 font-display text-primary">13/24</span>
                </div>
                <div className="flex h-9 w-full overflow-hidden rounded-lg border border-mint-2" role="img" aria-label="sample distribution">
                  {SAMPLE.map((s, i) => (
                    <div
                      key={s.key}
                      className="h-full transition-all duration-1000 ease-out"
                      style={{
                        width: barsDrawn ? `${s.pct}%` : "0%",
                        background: s.color,
                        transitionDelay: `${i * 140}ms`,
                      }}
                      title={`${t(s.key)} ${s.pct}%`}
                    />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {SAMPLE.map((s) => (
                    <span key={s.key} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/70">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
                      {t(s.key)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="reveal mt-4 max-w-sm text-center text-sm leading-relaxed text-ink/60">
              {t("home.exactTitle")} — {t("home.exactDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ Ayah band ═══════════ */}
      <section className="geo-lattice-dark relative overflow-hidden bg-deep py-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gold/40" aria-hidden />
        <div className="reveal mx-auto max-w-4xl px-5 text-center">
          <div className="mb-4 inline-block rounded-full border border-gold/50 px-4 py-1 text-xs font-bold tracking-widest text-gold">
            {t("home.ayahLabel")}
          </div>
          <blockquote className="font-display text-2xl leading-[2.1] text-mint md:text-[2rem]">
            {t("home.ayah")}
          </blockquote>
          <cite className="mt-4 block text-sm font-medium not-italic text-mint/70">— {t("home.ayahRef")}</cite>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gold/40" aria-hidden />
      </section>

      {/* ═══════════ Pipeline ═══════════ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-bold text-deep md:text-4xl">{t("home.pipelineTitle")}</h2>
            <p className="mt-2 text-ink/65">{t("home.pipelineSub")}</p>
          </div>
          <button onClick={onStart} className="group inline-flex items-center gap-2 font-bold text-primary transition-colors hover:text-deep">
            {t("home.start")}
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </button>
        </div>
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9 lg:gap-2">
          {PIPELINE_KEYS.map((key, i) => (
            <li
              key={key}
              className="reveal group relative rounded-xl border border-mint-2 bg-paper p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <div className="font-display text-2xl font-bold text-primary/40 transition-colors group-hover:text-gold">
                {arabicDigits[i]}
              </div>
              <div className="mt-2 text-sm font-semibold leading-snug text-ink">{t(key)}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* ═══════════ Terms of the chapter ═══════════ */}
      <section className="border-y border-mint-2 bg-mint/50 py-16">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="reveal mb-10 text-center font-display text-3xl font-bold text-deep md:text-4xl">{t("home.termsTitle")}</h2>
          <div className="space-y-4">
            {TERM_KEYS.map((item, i) => (
              <div
                key={item.term}
                className={`reveal group relative overflow-hidden rounded-xl border border-mint-2 bg-paper p-6 transition-all duration-300 hover:shadow-card ${i % 2 === 1 ? "lg:ms-[10%]" : i % 2 === 0 && i > 0 ? "lg:me-[10%]" : ""}`}
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="absolute inset-y-0 start-0 w-1 origin-top scale-y-0 bg-gold transition-transform duration-500 group-hover:scale-y-100" aria-hidden />
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                  <h3 className="shrink-0 font-display text-2xl font-bold text-primary sm:w-44">{t(item.term)}</h3>
                  <p className="leading-relaxed text-ink/75">{t(item.desc)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Madhhab commitment ═══════════ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="reveal rounded-2xl border border-mint-2 bg-paper p-8 shadow-card">
            <div className="mb-3 flex items-center gap-3">
              <BookIcon size={40} />
              <h2 className="font-display text-2xl font-bold text-deep">{t("app.madhhab")}</h2>
            </div>
            <p className="text-lg leading-relaxed text-ink/80">{t("home.madhhabNote")}</p>
          </div>
          <div className="reveal flex flex-col justify-between gap-6 rounded-2xl bg-deep p-8 text-mint" style={{ transitionDelay: "120ms" }}>
            <div>
              <h3 className="font-display text-xl font-bold text-gold">{t("footer.privacy")}</h3>
              <p className="mt-3 leading-relaxed text-mint/80">{t("audit.local")}</p>
            </div>
            <button
              onClick={() => onInfo("disclaimer")}
              className="group inline-flex items-center gap-2 self-start font-bold text-gold transition-colors hover:text-gold-soft"
            >
              {t("home.disclaimer")}
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA band ═══════════ */}
      <section className="geo-lattice relative overflow-hidden border-t border-mint-2 bg-mint py-16">
        <div className="reveal mx-auto max-w-3xl px-5 text-center">
          <BookIcon size={72} className="mx-auto mb-5" />
          <h2 className="font-display text-4xl font-bold text-deep md:text-5xl">فرائض</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/70">{t("app.tagline")}</p>
          <button
            onClick={onStart}
            className="group mt-8 inline-flex items-center gap-3 rounded-xl bg-primary px-10 py-4 text-xl font-bold text-mint shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:bg-deep active:translate-y-0"
          >
            {t("home.start")}
            <ArrowIcon className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </button>
        </div>
      </section>
    </div>
  );
}
