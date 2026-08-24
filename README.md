# فرائض — حاسبة المواريث

**Faraid** — an Islamic inheritance calculator that follows the **Shafi‘i Madhhab (المذهب الشافعي)** exclusively.

> This application is a calculation aid based on the Shafi‘i school of Islamic inheritance. Complex cases should be verified by a qualified scholar of Faraid. It does not provide a fatwa or legal advice.

---

## Purpose

Ordinary users should be able to open the app, enter the relatives of the deceased, and receive — without computing a single fraction by hand:

- who is an heir, and who is **blocked by Hajb (الحجب)** (with the reason and the rule id),
- who receives a **fixed share (أصحاب الفروض)** and which fraction,
- who becomes **Asabah (العصبة)** and how the residue is distributed,
- whether **Awl (العول)** or **Radd (الرد)** applies — with a transparent explanation,
- the final exact fraction, percentage and monetary amount per heir,
- the full auditable calculation trail ("How was this calculated?").

## Shafi‘i Madhhab commitment

Where the schools differ, the verified Shafi‘i rule is used — never a mixture:

| Matter | Shafi‘i position applied |
| --- | --- |
| Paternal grandfather | Stands in the father's place (inherits as the father, blocks siblings) |
| Radd to spouses | **No** radd to spouses; the residue goes to the Bayt al-Mal |
| Dhawu al-arham (e.g. maternal grandfather) | Do not inherit; residue to the Bayt al-Mal |
| Mushtarakah case | Maternal siblings and full brothers share the third equally |
| Umariyyatain | Mother receives a third of the remainder after the spouse's share |

Every rule lives in **`src/shafii/rules.ts`** with id, conditions, result, classical references (Qur'an 4:11–12 & 4:176, Minhaj al-Talibin, Mughni al-Muhtaj, Tuhfat al-Muhtaj) and a verification status: `VERIFIED`, `PENDING_REVIEW`, or `NEEDS_REVISION`. Rules that are not confidently established are marked **PENDING SCHOLAR VERIFICATION** and are never represented to users as religiously verified.

## Features

- Step-by-step input: deceased information (gender, estate, currency; optional funeral/debts/bequest with an explicit non-deduction notice) and a large **Add Relative / إضافة وارث / അവകാശിയെ ചേർക്കുക** flow with counts (e.g. Son × 2, Daughter × 1).
- Exact rational arithmetic (`Fraction` over `bigint`) — no floating point until final money conversion.
- Dedicated, separable engines: eligibility, hajb, fixed shares, asabah, awl, radd.
- Result screen: donut distribution (eligible heirs only), shares table, blocked-heirs section with reasons, Awl/Radd banners, Bayt al-Mal remainder, expandable 9-step calculation trail, print/PDF output.
- **Review Mode**: the complete Shafi‘i rule register for scholar audit.
- History via `localStorage` — save, open, delete, clear. No accounts, no server: all computation is local.
- Trilingual UI: **العربية (RTL) · മലയാളം · English**.

## Technology

React 18 · TypeScript (strict) · Vite · Tailwind CSS v4 · Vitest.

## Getting started

```bash
npm install
npm run dev        # start the app
npm run build      # production build
npx vitest run     # run the unit tests (npm test once a test script exists)
```

> Note: this sandbox's `package.json` is managed externally and cannot be edited here, so the `test` script is run with `npx vitest run`. The Vitest configuration (`vitest.config.ts`) is included; adding `"test": "vitest run"` to `package.json` makes `npm test` work as-is.

## Architecture

```
src/
  engine/            pure, UI-free core
    fractions.ts     exact rational arithmetic (bigint)
    models.ts        strongly typed domain models
  shafii/            the auditable Shafi'i rule engine
    rules.ts         central rule register (id, conditions, result, refs, status)
    validation.ts    input validation
    eligibility.ts   spouse direction, dhawu al-arham
    hajb.ts          حجب الحرمان blocking table
    fixedShares.ts   أصحاب الفروض from the complete family configuration
    asabah.ts        العصبة — residue classes & 2:1 pairs
    specialAsabah.ts special asabah/residue rules + female-asabah table
    awl.ts           العول — gated by shouldApplyAwl (last resort only)
    radd.ts          الرد (spouses excluded — Shafi'i)
    calculator.ts    the staged pipeline orchestrator
  i18n/              ar.ts · ml.ts · en.ts + provider
  data/              relationship metadata
  components/        UI only — never contains inheritance logic
  tests/             fractions, hajb, and classical-case calculator tests
```

### Pipeline

```
input → validate → identify heirs → apply hajb → identify dhawu al-furud
→ assign fixed shares → identify all possible asabah → check special
asabah/residue rules → calculate remainder
→ if a valid asabah exists: distribute remainder to the asabah
  else: check whether awl applies
→ final normalization → radd where applicable → money distribution
```

Awl is a **last-resort** mechanism: it is never applied merely because
apparent shares exceed the estate. The engine first confirms that no
applicable asabah/residue rule resolves the case (see `awl.ts` →
`shouldApplyAwl`, which returns `{ applies, reasonKey, ruleId }`).

### Special asabah rule (pending scholar verification)

Based on the report supplied for this project, preserved verbatim in
`src/shafii/specialAsabah.ts`:

> للإبنة النصف ولابنة الابن السدس تكملة للثلثين ، وما بقي فللأخت

For the exact configuration **daughter (1) + son's daughter (≥1, unblocked)
+ full sister (≥1, unblocked) + no male residuary**, the engine computes:

| Heir           | Share                  | Class  |
| -------------- | ---------------------- | ------ |
| Daughter       | 1/2                    | Furud  |
| Son's daughter | 1/6 (completing 2/3)   | Furud  |
| Full sister    | remainder (1/3)        | Asabah |

**Awl is NOT applied.** The result screen states this explicitly, and the
rule carries `verificationStatus: PENDING_SCHOLAR_VERIFICATION` — the
application does not claim independent religious verification of the
source or its interpretation.

The rule is **not generalized**: it never fires outside its exact
conditions, and genuine awl cases (e.g. husband + two full sisters → 3/7,
4/7) still apply awl. Female asabah cases (daughter, son's daughter, full
sister, paternal half-sister) are documented as an explicit rules table
(`FEMALE_ASABAH_TABLE`) — condition, asabah type, cause, residue handling
— and are visible in Review Mode alongside the full Awl-vs-Asabah
decision trail (fixed shares, potential residue, potential asabah,
special rule, awl candidate, final decision, rule id).

### Scholar verification process

1. Open **Review Mode** (وضع المراجعة) in the app — it lists every rule exactly as applied.
2. A qualified scholar checks each rule's conditions, result and references.
3. The rule's `verificationStatus` in `src/shafii/rules.ts` is updated (`VERIFIED` / `NEEDS_REVISION`); pending rules remain clearly labelled to users.

## Disclaimer

هذا التطبيق أداة لحساب المواريث وفق قواعد المذهب الشافعي، ولا يُغني عن مراجعة أهل العلم المختصين في مسائل الفرائض.

ഈ ആപ്പ് ശാഫിഈ മദ്ഹബിലെ ഫറാഇദ് നിയമങ്ങളെ അടിസ്ഥാനമാക്കി അനന്തരാവകാശ ഓഹരി കണക്കാക്കുന്നതിനുള്ള സഹായിയാണ്. സങ്കീർണ്ണമായ കേസുകളിൽ യോഗ്യനായ ഫറാഇദ് പണ്ഡിതന്റെ പരിശോധന നടത്തുക.

This application is a calculation aid based on the Shafi‘i school of Islamic inheritance. Complex cases should be verified by a qualified scholar of Faraid. This application does not provide a fatwa or legal advice. Applicable civil/legal requirements should also be verified separately.

**فرائض · حاسبة المواريث · المذهب الشافعي**
