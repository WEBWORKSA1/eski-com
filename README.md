# eSKI.com

Live snow forecasts, a 45-resort finder with side-by-side comparison, trip-cost and ski-size calculators, learn-to-ski content, auto-updated ski news, and a lead-generation engine. Built with Jekyll, which GitHub Pages compiles for free from `main`.

## Structure
- `_layouts/default.html`: the shared head (AdSense, SEO, schema), the top interest strip, header and footer
- `_layouts/resort.html` + `_data/resorts.json`: every resort page is generated from one data file. To add a resort, add a row and a 6-line stub in `resorts/`
- `_includes/lead_form.html` / `lead_block.html`: the multi-step trip-quote form used site-wide
- `assets/js/site.js`: forms, protected contact routing, consent notice, ads, videos
- `assets/js/tools.js`: Powder Radar (Open-Meteo), resort explorer and compare, calculators, quiz, news

## Settings
Edit `assets/js/config.js`:
- `adSlots`: AdSense unit IDs (optional; Auto ads work without them)
- `donate`: PayPal / Stripe / Buy Me a Coffee links (buttons appear automatically)
- `fundraising`, `contest`: goal bar and contest details
- `weatherApiKey`: add an Open-Meteo commercial key once traffic grows
- `inbox` / `partner`: stored encoded. Do not replace them with plain text.

## Automation
To turn on news refreshes every 6 hours, move `automation/update-news.yml` into `.github/workflows/`.

## Docs
- `RESEARCH.md`: the 35-site competitive review
- `PROMPTS.md`: the phase-wise build prompts
- `legal.html`: the trademark and copyright disclosure
