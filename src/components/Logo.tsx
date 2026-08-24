import { useI18n } from "../i18n";

/**
 * Brand identity: the open Islamic book — knowledge, scholarship, trust.
 * Variants: icon, full (stacked), horizontal, monochrome.
 */
export function BookIcon({
  size = 48,
  mono = false,
  className = "",
}: {
  size?: number;
  mono?: boolean;
  className?: string;
}) {
  const page = mono ? "currentColor" : "#EAF5EF";
  const line = mono ? "currentColor" : "#176B45";
  const spine = mono ? "currentColor" : "#0E4B32";
  const star = mono ? "currentColor" : "#C6A14B";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      role="img"
      aria-label="فرائض — open book logo"
    >
      {/* outer frame */}
      <rect x="6" y="14" width="84" height="70" rx="10" fill={mono ? "none" : "#0E4B32"} stroke={mono ? "currentColor" : "none"} strokeWidth={mono ? 3 : 0} />
      {/* open book pages */}
      <path
        d="M48 34c-6-4.6-13.8-6.4-24-5.6v34c10.2-.8 18 1 24 5.6 6-4.6 13.8-6.4 24-5.6v-34C61.8 27.6 54 29.4 48 34z"
        fill={page}
        stroke={mono ? "currentColor" : "#0E4B32"}
        strokeWidth="2.5"
      />
      {/* spine */}
      <path d="M48 34v34" stroke={spine} strokeWidth="3" strokeLinecap="round" />
      {/* text lines */}
      <path d="M31 39.5c4.5.2 8.6 1.1 12 2.8M31 47.5c4.5.2 8.6 1.1 12 2.8M31 55.5c4.5.2 8.6 1.1 12 2.8" stroke={line} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M65 39.5c-4.5.2-8.6 1.1-12 2.8M65 47.5c-4.5.2-8.6 1.1-12 2.8M65 55.5c-4.5.2-8.6 1.1-12 2.8" stroke={line} strokeWidth="2.4" strokeLinecap="round" />
      {/* guiding star above the book */}
      <path d="M48 16.5l2.5 4.6 5.1 1-3.7 3.7.8 5.2-4.7-2.4-4.7 2.4.8-5.2-3.7-3.7 5.1-1z" fill={star} />
      {/* bookmark ribbon */}
      <path d="M56 62.5l3 5 3-5v-16h-6z" fill={mono ? "currentColor" : "#C6A14B"} opacity="0.9" />
    </svg>
  );
}

export function LogoFull({ size = 64 }: { size?: number }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <BookIcon size={size} />
      <div>
        <div className="font-display text-3xl font-bold leading-none text-deep">{t("app.name")}</div>
        <div className="mt-1 text-sm font-medium text-primary">{t("app.subtitle")}</div>
      </div>
    </div>
  );
}

export function LogoHorizontal({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3">
      <BookIcon size={compact ? 36 : 44} />
      <div className="leading-tight">
        <div className={`font-display font-bold text-deep ${compact ? "text-2xl" : "text-3xl"}`}>{t("app.name")}</div>
        {!compact && <div className="text-xs font-medium tracking-wide text-primary">{t("app.subtitle")} · {t("app.madhhab")}</div>}
      </div>
    </div>
  );
}

/** Mobile app tile / monochrome variant used in print + footer. */
export function LogoMono({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <BookIcon size={size} mono className={className} />;
}
