// The Utah prospect list from the July 2026 field guide.
// Tier 1: owner-run local shops — call first. Tier 2: locals advertising 24/7 — the "2 am" pitch.
// Tier 3: big fish — call last, pitch overflow only. Tier 4: spotted — grab the number off Google first.

export type UtahProspect = {
  company: string;
  phone: string | null;
  altPhones?: Array<{ label: string; phone: string }>;
  area: string;
  tier: 1 | 2 | 3 | 4;
  research: string;
  angle: string;
};

export const UTAH_PROSPECTS_SOURCE = "utah-field-guide-2026-07";

export const utahProspects: UtahProspect[] = [
  // ── Tier 1 — owner-run local shops ──
  {
    company: "The Garage Door Man",
    phone: "(801) 356-6020",
    area: "Orem · Utah County",
    tier: 1,
    research: "Storefront on 100 E in Orem. Posted hours: Mon–Fri 8–6, Sat 8–4, closed Sunday. Active Yelp profile with photos.",
    angle: "You close at six — who's answering the broken-spring call at nine? Right now, nobody. That's the exact call I built this for.",
  },
  {
    company: "Poulson Doors LLC",
    phone: "(801) 529-4395",
    area: "Ogden · Weber Co + SLC",
    tier: 1,
    research: "Shop on 2100 S in Ogden. Hours Mon–Fri 8–5, Sat 9–3, closed Sunday. Clopay dealer; also markets to Salt Lake and Utah County.",
    angle: "Your shop closes at five and Sundays are dark — that's most of the emergency calls in a week going somewhere else.",
  },
  {
    company: "Uplifting Garage Doors",
    phone: "(801) 682-7586",
    area: "West Jordan · 21 SLC-valley cities",
    tier: 1,
    research: "Owner-operator Brandon McClellan; markets \"you talk directly to the owner — no call center, no dispatcher.\" Advertises 24/7.",
    angle: "Your whole pitch is 'you get me directly' — so what happens to caller two while you're mid-repair? This keeps your promise for you.",
  },
  {
    company: "DC Garage Doors",
    phone: "(801) 280-3419",
    altPhones: [
      { label: "Park City", phone: "(435) 649-7113" },
      { label: "Tooele", phone: "(435) 843-1570" },
    ],
    area: "SLC · Park City · Tooele",
    tier: 1,
    research: "Father-son team (Dale + son), 40+ years combined. Three coverage areas, three phone lines.",
    angle: "Two guys, three phone numbers, three markets. When you're both on installs, all three lines go to voicemail at once.",
  },
  {
    company: "Salt Lake Garage Doors",
    phone: "(801) 269-1940",
    area: "South Salt Lake",
    tier: 1,
    research: "Sheppard family shop since 1966 — three generations. Physical location on 300 W.",
    angle: "Sixty years of reputation answers your phone when you pick up — voicemail doesn't sound like 1966-grade service.",
  },
  {
    company: "Trusted Garage Door Services",
    phone: "(435) 554-4962",
    area: "Logan · Cache Valley",
    tier: 1,
    research: "Solo owner who grew up in Cache Valley; 9 years with the big companies before going out on his own. Newer business.",
    angle: "You left the big guys to do this right — but they have someone answering phones and you have a voicemail. This levels that.",
  },
  {
    company: "Accent Garage Doors",
    phone: "(385) 455-4697",
    area: "American Fork · Wasatch Front",
    tier: 1,
    research: "Family-owned since 1993. Serves SLC valley plus north Utah County (Lehi, Saratoga Springs, Eagle Mountain) — fast-growth suburbs.",
    angle: "Your service area is the fastest-growing corridor in Utah — call volume's only going up. Thirty years of goodwill deserves a phone that always answers.",
  },
  {
    company: "Anderson Garage Doors",
    phone: "(435) 752-6677",
    area: "Logan · Cache Valley",
    tier: 1,
    research: "Fixing doors in Cache Valley for 40+ years. Long-standing local name.",
    angle: "Everyone in the valley knows your name — do they get you when they call at 8 pm, or a beep?",
  },
  {
    company: "Garage Door Utah",
    phone: "(801) 837-1862",
    area: "Ogden · Weber, Davis + Utah Co",
    tier: 1,
    research: "Locally owned, based in Ogden, covers three counties — a big area for a small outfit.",
    angle: "Three counties is a lot of windshield time. Every mile you drive is time your phone rings unanswered.",
  },
  {
    company: "Provo Garage Door",
    phone: "(801) 895-3404",
    area: "Provo · Orem, Lehi, PG",
    tier: 1,
    research: "Local Utah County outfit serving Provo through Lehi.",
    angle: "Every student rental and new build in the county has a door that breaks. The company that answers first gets the job.",
  },
  {
    company: "St. George Garage Door Specialist",
    phone: "(435) 229-2480",
    area: "St. George",
    tier: 1,
    research: "Small St. George operator; simple one-man-shop web presence.",
    angle: "St. George heat kills springs year-round — and half your callers are retirees who will not leave a voicemail.",
  },
  {
    company: "Black Rock Garage Doors LLC",
    phone: "(435) 232-2646",
    area: "Southern Utah",
    tier: 1,
    research: "Small LLC on the Washington County directory listings.",
    angle: "Small shop, growing market — the free month costs you nothing and I need a southern Utah test partner anyway.",
  },
  {
    company: "B&H Garage Door Pros",
    phone: "(435) 412-9109",
    area: "Washington County",
    tier: 1,
    research: "Local pros on the southern Utah directory listings.",
    angle: "Position as \"the first southern Utah shop to have this\" — which is literally true.",
  },

  // ── Tier 2 — advertise 24/7 — the "2 am" pitch ──
  {
    company: "Mehr's Garage Doors",
    phone: "(435) 673-4457",
    area: "St. George",
    tier: 2,
    research: "Install + repair with advertised 24/7 emergency service.",
    angle: "24/7 on the website means your phone on the nightstand. Ours answers the 2 am spring call, books the 7 am slot, and you sleep.",
  },
  {
    company: "Maverick Overhead Doors",
    phone: "(435) 627-3667",
    area: "St. George · all of southern UT",
    tier: 2,
    research: "Covers St. George, Hurricane, Cedar City, Washington, Santa Clara, Ivins. Publishes maintenance content — marketing-savvy.",
    angle: "You clearly invest in marketing — this makes sure the leads that marketing buys actually reach a human-sounding voice.",
  },
  {
    company: "Beacon Garage Doors",
    phone: "(385) 393-8909",
    area: "Riverdale · Weber + Davis Co",
    tier: 2,
    research: "Residential + commercial across northern Utah; spring, opener, install work.",
    angle: "Commercial clients expect a receptionist. Now the residential callers get one too — without a hire.",
  },
  {
    company: "Right Choice Doors",
    phone: "(801) 877-2987",
    area: "Layton · SLC to Ogden",
    tier: 2,
    research: "Advertises 24/7 install, repair, maintenance from Bountiful to Ogden.",
    angle: "Who's on call tonight? If the answer is 'me, always' — that's the thing I fix.",
  },
  {
    company: "Performance Garage Door",
    phone: "(801) 889-0069",
    area: "Logan · Cache Valley + Wasatch Front",
    tier: 2,
    research: "15 years collective experience, 24-hour emergency services, covers two markets.",
    angle: "Two markets, one phone. The math only works if every call gets caught.",
  },
  {
    company: "Universal Garage Door Repair",
    phone: "(801) 590-7055",
    area: "Ogden + SLC valley",
    tier: 2,
    research: "Skyline Dr, Ogden suite; runs city landing pages for Draper, SLC, Ogden — investing in SEO leads.",
    angle: "You're paying to rank for a dozen cities. An unanswered ring is SEO money in the trash.",
  },

  // ── Tier 3 — big fish — overflow pitch only, call last ──
  {
    company: "A+ Garage Doors",
    phone: "(801) 316-3285",
    altPhones: [
      { label: "Orem", phone: "(385) 482-0242" },
      { label: "Ogden", phone: "(801) 850-9482" },
      { label: "Cedar City", phone: "(435) 261-7471" },
    ],
    area: "Statewide — SLC, Orem, Ogden, Cedar City",
    tier: 3,
    research: "24/7 statewide operation with local branch lines. Southern Utah since 2005.",
    angle: "What does your after-hours answering cost per booked job? I'll run a month free next to it and you compare.",
  },
  {
    company: "Advanced Garage Door",
    phone: "(801) 882-2865",
    altPhones: [{ label: "Logan", phone: "(435) 363-4929" }],
    area: "Ogden HQ · statewide + Logan",
    tier: 3,
    research: "Family-owned since 1994 but big now — 4.9 stars across 30,000+ reviews, lifetime warranty marketing.",
    angle: "Overflow + weekends only. They have staff — sell \"never a busy signal during the Monday-morning rush.\"",
  },
  {
    company: "A1 Garage Door Repair (Utah)",
    phone: "(801) 444-0324",
    altPhones: [{ label: "St. George", phone: "(435) 272-2459" }],
    area: "Layton HQ · Ogden + St. George",
    tier: 3,
    research: "Multi-market operation, part of a large national brand family.",
    angle: "Overflow pitch. If they have a national call center, ask what it costs and whether it can book to a live calendar. Ours can — that's the wedge.",
  },
  {
    company: "Precision Garage Door of Salt Lake",
    phone: "(801) 406-6606",
    area: "Franchise · SLC + Provo/Orem",
    tier: 3,
    research: "National franchise, 198+ reviews in Provo/Orem at 5 stars. Franchise rules may limit tooling decisions.",
    angle: "Lowest priority — franchise HQ likely controls the phone stack. Only worth a dial once you have Utah case studies.",
  },

  // ── Tier 4 — spotted; grab the number off Google before dialing ──
  {
    company: "Garage Works",
    phone: null,
    area: "Salt Lake area",
    tier: 4,
    research: "Runs repairthegarage.com, advertises 24/7 across the SLC area. Number not captured in research — pull it from their site before dialing.",
    angle: "24/7 promise with no visible after-hours staffing — the nightstand pitch.",
  },
  {
    company: "Overhead Door Co. of the Wasatch",
    phone: null,
    area: "Salt Lake area",
    tier: 4,
    research: "Family-owned Overhead Door distributor, 30+ years. Distributor of a national brand — decent overflow prospect.",
    angle: "Overflow prospect — brand-distributor profile.",
  },
  {
    company: "Overhead Door Co. of Cache Valley",
    phone: null,
    area: "Logan",
    tier: 4,
    research: "The national brand's Cache Valley distributor. Same brand-distributor profile as the Wasatch outfit.",
    angle: "Overflow prospect — brand-distributor profile.",
  },
];
