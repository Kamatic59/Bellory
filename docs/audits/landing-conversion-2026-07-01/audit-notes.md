# Bellory Landing Conversion Audit

Date: 2026-07-01

## Research Signals Used

- NN/g homepage guidance: make the offering clear at a glance, keep the page simple, and give users an obvious next action.
- Baymard form guidance: visible form-field count strongly affects perceived effort; optional or infrequently used fields should be hidden behind a link or collapsed section.
- SaaS landing page guidance: keep the conversion path focused around one primary CTA and make product value visible through concrete examples.

## Screenshot Evidence

- `01-desktop-hero-before.png`
- `02-desktop-story-before.png`
- `03-desktop-waitlist-before.png`
- `04-mobile-hero-before.png`
- `05-mobile-waitlist-before.png`
- `06-desktop-hero-after.png`
- `07-desktop-waitlist-after.png`
- `08-mobile-hero-after.png`
- `09-mobile-waitlist-after.png`
- `10-tablet-hero-after.png`
- `11-wide-hero-after.png`
- `12-desktop-waitlist-expanded-after.png`
- `13-mobile-waitlist-expanded-after.png`
- `14-production-desktop-hero.png`
- `15-production-desktop-waitlist.png`
- `16-production-mobile-hero.png`

## Findings

1. The hero now communicates Bellory's promise quickly and has one dominant conversion action. The secondary action is still useful, but visually subordinate.
2. The prior waitlist form made the visitor evaluate seven inputs before committing. This was the largest conversion risk, especially on mobile.
3. The landing page spacing is strongest when content is presented as one idea at a time. The story panels and simplified hero follow that pattern.
4. The form needed stronger trust microcopy and clearer next-step language so visitors know what happens after submitting.
5. Shared form controls needed more visible keyboard focus treatment before the page could be considered polished.

## Changes Applied

1. Changed the waitlist card to ask only for name, work email, and optional business name by default.
2. Moved phone, business type, call volume, and context into an optional collapsible setup section.
3. Standardized the CTA language around `Request early access` / `Request access`.
4. Added conversion reassurance copy: short completion time, no spam, and manual review.
5. Added native required fields, autocomplete names, accessible labels, and live status messaging.
6. Improved shared button, input, and select focus states.
7. Aligned the footer content width to the same max width as the rest of the page.

## Verification

- Desktop hero: 1440px and 1920px captures reviewed.
- Tablet hero: 768px capture reviewed.
- Mobile hero and waitlist: 390px captures reviewed.
- Collapsed and expanded waitlist form states reviewed on desktop and mobile.
- Production deployment smoke screenshots reviewed on desktop and mobile.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
