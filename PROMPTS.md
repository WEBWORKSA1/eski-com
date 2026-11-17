# eSKI.com — Phase-wise build prompts

Use these prompts in order to rebuild, extend or audit eSKI.com. Each phase is self-contained.

---

## Phase 1 — Concept & positioning
> Build **eSKI.com** ("everything ski, online"): an independent, AdSense-monetised ski intelligence hub. Core promise: *where is it snowing, where should I go, what will it cost?* Primary revenue: AdSense (ca-pub-6620975821265271), trip-quote lead generation, sponsorships/featured resorts, reader donations. Brand as **eSKI** with a mountain-peak logo; never use "Eskimo", "Esky", "WeSki" or any ESKI Inc. branding. Include a trademark/copyright disclosure naming those parties as unaffiliated.

## Phase 2 — Research
> Review 35 leading ski websites (snow reports, resort databases, travel agencies, pass providers, magazines, retailers, tourism boards, safety bodies, video channels). Extract features, forms, content types and design patterns into RESEARCH.md and turn them into a feature checklist.

## Phase 3 — Information architecture
> Jekyll site compiled free by GitHub Pages from main. Pages: Home, Resort Finder (+ one page per resort generated from `_data/resorts.json`), Powder Radar (snow forecast), Plan My Trip (lead gen), Trip Cost Calculator, Gear (size calculator + checklist), Learn to Ski (+quiz), Safety, Videos, News, Guides hub + 5 guides, Contests, Careers, Support (donations), Advertise, For Business, About, Contact, Editorial Policy, Privacy, Terms, Disclaimer, Trademark & Copyright, Thank-you, 404. Plus sitemap.xml, robots.txt, ads.txt, CNAME, manifest.

## Phase 4 — Design system
> Alpine "instrument panel" aesthetic: midnight navy (#0b1b2b), glacier blue (#7cc8ee), signal orange (#ff5a1f) for CTAs, ice backgrounds. Archivo (wide, heavy) for headings, Manrope for body, JetBrains Mono for data. Topographic contour pattern + mountain-ridge divider in the hero. Fully responsive, reduced-motion aware, accessible (skip link, labels, focus states).

## Phase 5 — Global chrome
> On top of every page show: "Contact, if you are interested in this website/domain name/Sponsorship/Advertisement/Partnership" linking to the owner's external business-contact page — the destination is stored encoded in config.js and opened by JavaScript, never written in HTML. Sticky header with nav and "Get Free Trip Quotes" CTA. Footer with newsletter, link columns, independence + data attribution statement.

## Phase 6 — Live data (self-updating)
> Use Open-Meteo (free, CORS) to fetch, in one batched request, 7-day snowfall + temps for every resort at mid-mountain elevation; cache 1 h in sessionStorage. Render: home top-7 mini radar, full ranked table with pass/country filter, live card badges in the Resort Finder, per-resort 7-day cards + current conditions, and any-location lookup via Open-Meteo geocoding. cm/inch toggle stored locally. Season status banner computed from today's date.

## Phase 7 — Resort database
> resorts.json with ~45 resorts across 6 continents (name, region, country, lat/lon, base/top m, terrain, lifts, pass, airport, tags, blurb). One layout renders an SEO page per resort with live forecast, stats table (m + ft), when-to-go, planning tips, more resorts on the same continent, FAQ with FAQPage schema, SkiResort schema and a prefilled lead CTA.

## Phase 8 — Lead generation (highest revenue)
> Three-step quote form (destination/dates/party → needs chips/budget/ability → contact + explicit consent to share with up to 3 partners). Embed on Home, Resorts, Forecast, every resort page and guides; dedicated landing page with how-it-works, use-case cards and FAQ. Add a sticky bottom lead bar after 45% scroll. B2B page for resorts/schools/rentals/lodging/tour operators to receive leads.

## Phase 9 — Forms & email privacy
> All forms post via FormSubmit AJAX to a single inbox stored as an XOR-encoded array in config.js and decoded only at submit time; honeypot field; subject prefixed "[eSKI.com]". The address is never visible in HTML, JS strings, or the repo. Activate FormSubmit by confirming its one-time email after the first submission.

## Phase 10 — Monetisation modules
> AdSense script in every <head>, ads.txt, auto-ads friendly layout, optional manual slots (home-mid, in-content, sidebar, resort) rendered only when slot IDs exist (no empty boxes). Support page with tiers, season goal bar, payment-link buttons that appear when PayPal/Stripe/BMC URLs are set, otherwise a pledge form. Advertise page with media-kit form including "acquire website/domain". Contest page with configurable prize, countdown and official rules. Careers page for writers, reporters, photographers, instructors, ambassadors, sales.

## Phase 11 — Content for AdSense approval
> Original, substantive content: 5 long-form guides (choosing a resort, saving money, passes, trail ratings, best time to ski), learn-to-ski, safety (link official avalanche centres), gear advice, About, Editorial Policy, Privacy (Google advertising cookie disclosure + opt-out links), Terms, Disclaimer, Trademark & Copyright. Clear navigation, no broken links, no placeholder text, cookie notice.

## Phase 12 — Media
> Curated YouTube lessons (verified IDs) as click-to-load privacy-enhanced embeds: beginner ski/snowboard, carving, tricks, avalanche beacon drills, gear.

## Phase 13 — Automation
> automation/fetch_news.py pulls headlines+links from ~10 ski RSS feeds into assets/data/news.json; automation/update-news.yml runs it every 6 h (move to .github/workflows/). Weather is fully client-side and always live.

## Phase 14 — SEO & performance
> Canonicals, OG/Twitter tags, WebSite+SearchAction, Organization, Article, SkiResort and FAQPage JSON-LD, XML sitemap generated by Jekyll, robots.txt (Mediapartners-Google allowed), semantic HTML, lazy video thumbnails, a single CSS and two deferred JS files.

## Phase 15 — Deploy & verify
> Push to github.com/WEBWORKSA1/eski-com (main). Enable Pages (Settings → Pages → Deploy from branch → main / root), keep CNAME eski.com, point DNS (A records 185.199.108–111.153, CNAME www → webworksa1.github.io), enforce HTTPS. Verify: every page loads, forms reach the inbox, forecasts render, no email string in the source, then apply to AdSense.

## Phase 16 — Expansion roadmap
> Add more resorts (target 200+), webcams links, user trip reports, resort reviews, powder-alert emails, affiliate deep links (lodging, gear, insurance), localisation (FR/DE/JA), a "storm chaser" map, and a paid "pro" alert tier.
