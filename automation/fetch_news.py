"""Refreshes assets/data/news.json from public ski-news RSS feeds (headlines + links only).
Run by .github/workflows/update-news.yml every 6 hours. Standard library only."""
import json, re, urllib.request, email.utils, datetime, html, os

FEEDS = [
    ("SnowBrains", "https://snowbrains.com/feed/"),
    ("Unofficial Networks", "https://unofficialnetworks.com/feed/"),
    ("OnTheSnow", "https://www.onthesnow.com/news/feed"),
    ("Ski Mag", "https://www.skimag.com/feed/"),
    ("Powder", "https://www.powder.com/feed"),
    ("Newschoolers", "https://www.newschoolers.com/rss/news"),
    ("SnowIndustryNews", "https://snowindustrynews.com/rss"),
    ("PlanetSKI", "https://planetski.eu/feed/"),
    ("InTheSnow", "https://www.inthesnow.com/feed/"),
    ("Ski Canada", "https://skicanadamag.com/feed/"),
]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "data", "news.json")

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "eSKI-news-bot/1.0 (+https://eski.com)"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", "ignore")

def tag(block, name):
    m = re.search(rf"<{name}[^>]*>(.*?)</{name}>", block, re.S | re.I)
    if not m: return ""
    v = re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", m.group(1), flags=re.S).strip()
    return html.unescape(re.sub(r"<[^>]+>", "", v)).strip()

def parse_date(s):
    try: return email.utils.parsedate_to_datetime(s).astimezone(datetime.timezone.utc)
    except Exception:
        try: return datetime.datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception: return datetime.datetime.now(datetime.timezone.utc)

items, seen = [], set()
for source, url in FEEDS:
    try:
        xml = get(url)
    except Exception as e:
        print("skip", source, e); continue
    for block in re.findall(r"<(?:item|entry)\b.*?</(?:item|entry)>", xml, re.S | re.I)[:12]:
        title = tag(block, "title")
        link = tag(block, "link") or (re.search(r'<link[^>]+href="([^"]+)"', block) or [None, ""])[1]
        date = tag(block, "pubDate") or tag(block, "updated") or tag(block, "published")
        if not title or not link.startswith("http") or link in seen: continue
        seen.add(link)
        items.append({"title": title[:180], "link": link, "date": parse_date(date).isoformat(), "source": source})

if items:
    items.sort(key=lambda x: x["date"], reverse=True)
    json.dump({"updated": datetime.datetime.now(datetime.timezone.utc).isoformat(), "items": items[:60]}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("wrote", len(items[:60]), "items")
else:
    print("no items fetched; keeping existing file")
