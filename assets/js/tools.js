/* eSKI.com live data + interactive tools. Weather: Open-Meteo (free, no key). */
(function(){
  "use strict";
  var C = window.ESKI_CONFIG || {};
  var $ = function(s,r){return (r||document).querySelector(s)};
  var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var BASE = document.body.getAttribute("data-base") || "";
  var WX = (C.weatherApi || "https://api.open-meteo.com/v1/forecast");
  var KEY = C.weatherApiKey ? "&apikey=" + C.weatherApiKey : "";
  var unitsIn = false;
  try{ unitsIn = localStorage.getItem("eski_units")==="in"; }catch(e){}
  function snow(cm){ return unitsIn ? (cm/2.54).toFixed(1) + '"' : Math.round(cm) + " cm"; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function cache(k, v){ try{ if(v===undefined){ var o = JSON.parse(sessionStorage.getItem(k)||"null"); return (o && Date.now()-o.t < 3600e3) ? o.v : null; } sessionStorage.setItem(k, JSON.stringify({t:Date.now(), v:v})); }catch(e){ return null; } }

  var resortsP = null;
  function resorts(){
    if(!resortsP) resortsP = fetch(BASE + "assets/data/resorts.json").then(function(r){ return r.json(); });
    return resortsP;
  }
  function mid(r){ return Math.round((r.base_m + r.top_m) / 2); }

  /* Batch 7-day forecast for every resort (one request, cached 1 h) */
  var radarP = null;
  function radar(){
    if(radarP) return radarP;
    radarP = resorts().then(function(list){
      var c = cache("eski_radar_v1"); if(c) return c;
      var url = WX + "?latitude=" + list.map(function(r){return r.lat;}).join(",") +
        "&longitude=" + list.map(function(r){return r.lon;}).join(",") +
        "&elevation=" + list.map(mid).join(",") +
        "&daily=snowfall_sum,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto" + KEY;
      return fetch(url).then(function(r){ if(!r.ok) throw new Error("wx"); return r.json(); }).then(function(j){
        var arr = Array.isArray(j) ? j : [j];
        var out = list.map(function(r,i){
          var d = arr[i] && arr[i].daily || {};
          var s = (d.snowfall_sum||[]).reduce(function(a,b){ return a + (b||0); }, 0);
          return {slug:r.slug, name:r.name, country:r.country, region:r.region, pass:r.pass, snow7:s, daily:d};
        });
        cache("eski_radar_v1", out); return out;
      });
    });
    return radarP;
  }
  window.ESKI = window.ESKI || {}; ESKI.radar = radar; ESKI.resorts = resorts;

  function passTag(p){ var c = /epic/i.test(p) ? "epic" : /ikon/i.test(p) ? "ikon" : "ind"; return '<span class="tag '+c+'">'+esc(p)+'</span>'; }
  function stamp(el){ if(el) el.textContent = "Updated " + new Date().toLocaleString([], {hour:"2-digit", minute:"2-digit", month:"short", day:"numeric"}); }

  /* Home mini radar */
  var mini = $("#radar-mini");
  if(mini){
    radar().then(function(rows){
      rows = rows.slice().sort(function(a,b){ return b.snow7 - a.snow7; }).slice(0, 7);
      var max = Math.max(1, rows[0].snow7);
      mini.innerHTML = rows.map(function(r,i){
        return '<li><span class="rk">'+String(i+1).padStart(2,"0")+'</span><div><a href="'+BASE+'resorts/'+r.slug+'.html">'+esc(r.name)+'</a><div class="bar"><i style="width:'+Math.round(100*r.snow7/max)+'%"></i></div></div><span class="cm">'+snow(r.snow7)+'</span></li>';
      }).join("");
      stamp($("#radar-stamp"));
    }).catch(function(){ mini.innerHTML = '<li><span></span><span>Live forecast is temporarily unavailable — <a href="'+BASE+'snow-forecast.html">open the forecast page</a>.</span><span></span></li>'; });
  }

  /* Full Powder Radar table */
  var full = $("#radar-table");
  if(full){
    var filt = $("#radar-filter");
    function draw(rows){
      var f = filt ? filt.value : "";
      var list = rows.filter(function(r){ return !f || r.pass.indexOf(f)>-1 || r.country===f; }).sort(function(a,b){ return b.snow7 - a.snow7; });
      var max = Math.max(1, list.length ? list[0].snow7 : 1);
      $("tbody", full).innerHTML = list.map(function(r,i){
        var d = r.daily, t = d.temperature_2m_max ? Math.round(d.temperature_2m_max[0]) + "° / " + Math.round(d.temperature_2m_min[0]) + "°C" : "–";
        var next3 = (d.snowfall_sum||[]).slice(0,3).reduce(function(a,b){return a+(b||0);},0);
        return '<tr><td class="n">'+(i+1)+'</td><td><a href="'+BASE+'resorts/'+r.slug+'.html"><b>'+esc(r.name)+'</b></a><br><small class="muted">'+esc(r.region)+', '+esc(r.country)+'</small></td><td>'+passTag(r.pass)+'</td><td class="n">'+snow(next3)+'</td><td class="n">'+snow(r.snow7)+'</td><td class="barcell"><div class="bar"><i style="width:'+Math.round(100*r.snow7/max)+'%"></i></div></td><td>'+t+'</td></tr>';
      }).join("");
    }
    radar().then(function(rows){ draw(rows); stamp($("#radar-stamp")); if(filt) filt.addEventListener("change", function(){ draw(rows); }); })
      .catch(function(){ $("tbody", full).innerHTML = '<tr><td colspan="7">Live forecast temporarily unavailable. Please refresh in a few minutes.</td></tr>'; });
  }

  /* Units toggle */
  $$("[data-units]").forEach(function(b){
    b.textContent = unitsIn ? "Show cm" : "Show inches";
    b.addEventListener("click", function(){ try{ localStorage.setItem("eski_units", unitsIn ? "cm" : "in"); }catch(e){} location.reload(); });
  });

  /* Single resort forecast (resort pages) */
  function dayCards(el, d){
    var names = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    el.innerHTML = (d.time||[]).map(function(t,i){
      var s = d.snowfall_sum[i]||0, dt = new Date(t + "T12:00:00");
      return '<div class="'+(s>=10?"hot":"")+'"><div class="d">'+names[dt.getDay()]+' '+dt.getDate()+'</div><div class="s">'+snow(s)+'</div><div class="t">'+Math.round(d.temperature_2m_max[i])+'° / '+Math.round(d.temperature_2m_min[i])+'°</div></div>';
    }).join("");
  }
  var rf = $("#resort-forecast");
  if(rf){
    var lat = rf.getAttribute("data-lat"), lon = rf.getAttribute("data-lon"), el = rf.getAttribute("data-elev");
    fetch(WX + "?latitude="+lat+"&longitude="+lon+"&elevation="+el+"&daily=snowfall_sum,temperature_2m_max,temperature_2m_min&current=temperature_2m,wind_speed_10m,snow_depth&forecast_days=7&timezone=auto" + KEY)
      .then(function(r){ return r.json(); }).then(function(j){
        dayCards(rf, j.daily);
        var cur = j.current || {}, tot = j.daily.snowfall_sum.reduce(function(a,b){return a+(b||0);},0);
        var s = $("#resort-now");
        if(s) s.innerHTML = '<div><b>'+snow(tot)+'</b><span>7-day snowfall</span></div><div><b>'+(cur.temperature_2m!=null?Math.round(cur.temperature_2m)+"°C":"–")+'</b><span>Now (mid-mountain)</span></div><div><b>'+(cur.wind_speed_10m!=null?Math.round(cur.wind_speed_10m)+" km/h":"–")+'</b><span>Wind</span></div><div><b>'+(cur.snow_depth!=null?Math.round(cur.snow_depth*100)+" cm":"–")+'</b><span>Modelled snow depth</span></div>';
        stamp($("#resort-stamp"));
      }).catch(function(){ rf.innerHTML = '<p class="muted">Forecast temporarily unavailable.</p>'; });
  }

  /* Resort explorer + compare */
  var grid = $("#resort-grid");
  if(grid){
    var q = $("#f-q"), cont = $("#f-cont"), pass = $("#f-pass"), tag = $("#f-tag"), sort = $("#f-sort"), count = $("#f-count");
    var picked = [];
    var params = new URLSearchParams(location.search);
    if(params.get("q") && q) q.value = params.get("q");
    if(params.get("pass") && pass) pass.value = params.get("pass");
    if(params.get("continent") && cont) cont.value = params.get("continent");
    Promise.all([resorts(), radar().catch(function(){ return []; })]).then(function(res){
      var list = res[0], snowMap = {};
      res[1].forEach(function(r){ snowMap[r.slug] = r.snow7; });
      list.forEach(function(r){ r.snow7 = snowMap[r.slug]; });
      function render(){
        var s = (q.value||"").toLowerCase().trim();
        var rows = list.filter(function(r){
          return (!s || (r.name+" "+r.country+" "+r.region+" "+r.tags.join(" ")).toLowerCase().indexOf(s)>-1) &&
            (!cont.value || r.continent===cont.value) && (!pass.value || r.pass.indexOf(pass.value)>-1) && (!tag.value || r.tags.indexOf(tag.value)>-1);
        });
        var k = sort.value;
        rows.sort(function(a,b){
          if(k==="vertical") return (b.top_m-b.base_m)-(a.top_m-a.base_m);
          if(k==="top") return b.top_m-a.top_m;
          if(k==="snow") return (b.snow7||0)-(a.snow7||0);
          return a.name.localeCompare(b.name);
        });
        count.textContent = rows.length + " resort" + (rows.length===1?"":"s");
        grid.innerHTML = rows.map(function(r){
          var on = picked.indexOf(r.slug)>-1;
          return '<article class="rcard"><div class="top"><h3><a href="'+BASE+'resorts/'+r.slug+'.html">'+esc(r.name)+'</a></h3><div class="loc">'+esc(r.region)+' · '+esc(r.country)+'</div>'+
            '<div class="snow"><b>'+(r.snow7!=null?snow(r.snow7):"—")+'</b><small>7-DAY SNOW</small></div></div>'+
            '<div class="body"><div>'+passTag(r.pass)+r.tags.slice(0,2).map(function(t){return '<span class="tag">'+esc(t.replace(/-/g," "))+'</span>';}).join("")+'</div>'+
            '<div class="facts"><div><b>'+(r.top_m-r.base_m).toLocaleString()+' m</b>vertical</div><div><b>'+r.top_m.toLocaleString()+' m</b>summit</div><div><b>'+r.lifts+'</b>lifts</div></div>'+
            '<div class="act"><a class="btn btn-ice btn-sm" href="'+BASE+'resorts/'+r.slug+'.html">Details</a><button class="btn btn-sm '+(on?"btn-signal":"btn-ice")+'" data-cmp="'+r.slug+'">'+(on?"✓ Comparing":"+ Compare")+'</button></div></div></article>';
        }).join("") || '<p>No resorts match. Try clearing a filter.</p>';
      }
      function tray(){
        var t = $("#cmp-tray"); if(!t) return;
        t.classList.toggle("show", picked.length>0);
        $("span", t).textContent = picked.length + " of 3 selected";
      }
      function compare(){
        var sel = list.filter(function(r){ return picked.indexOf(r.slug)>-1; });
        var rowsDef = [["Country",function(r){return r.country;}],["Pass",function(r){return r.pass;}],["Summit",function(r){return r.top_m+" m";}],["Base",function(r){return r.base_m+" m";}],["Vertical",function(r){return (r.top_m-r.base_m)+" m";}],["Terrain",function(r){return r.terrain;}],["Lifts",function(r){return r.lifts;}],["7-day snow",function(r){return r.snow7!=null?snow(r.snow7):"—";}],["Nearest airport",function(r){return r.airport;}],["Best for",function(r){return r.tags.join(", ").replace(/-/g," ");}]];
        var box = $("#cmp-out");
        box.innerHTML = '<div class="table-scroll"><table class="cmp"><thead><tr><th></th>'+sel.map(function(r){return '<th>'+esc(r.name)+'</th>';}).join("")+'</tr></thead><tbody>'+rowsDef.map(function(d){ return '<tr><th>'+d[0]+'</th>'+sel.map(function(r){return '<td>'+esc(d[1](r))+'</td>';}).join("")+'</tr>'; }).join("")+'</tbody></table></div><p style="margin-top:14px"><a class="btn btn-signal" href="'+BASE+'plan-my-trip.html?resort='+encodeURIComponent(sel.map(function(r){return r.name;}).join(" vs "))+'">Get free quotes for these resorts →</a></p>';
        box.scrollIntoView({behavior:"smooth"});
      }
      grid.addEventListener("click", function(e){
        var b = e.target.closest("[data-cmp]"); if(!b) return;
        var s = b.getAttribute("data-cmp"), i = picked.indexOf(s);
        if(i>-1) picked.splice(i,1); else if(picked.length<3) picked.push(s); else alertBox();
        render(); tray();
      });
      function alertBox(){ var t = $("#cmp-tray span"); if(t) t.textContent = "Max 3 — remove one first"; }
      [q,cont,pass,tag,sort].forEach(function(el){ el.addEventListener("input", render); });
      var go = $("#cmp-go"); if(go) go.addEventListener("click", compare);
      var clr = $("#cmp-clear"); if(clr) clr.addEventListener("click", function(){ picked = []; render(); tray(); $("#cmp-out").innerHTML = ""; });
      render();
    });
  }

  /* Any-location snow lookup (Open-Meteo geocoding) */
  var lf = $("#loc-form");
  if(lf){
    lf.addEventListener("submit", function(e){
      e.preventDefault();
      var name = $("input", lf).value.trim(), out = $("#loc-out"); if(!name) return;
      out.innerHTML = '<p class="muted">Searching…</p>';
      fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=" + encodeURIComponent(name)).then(function(r){ return r.json(); }).then(function(g){
        var p = g.results && g.results[0]; if(!p) throw new Error("none");
        return fetch(WX + "?latitude="+p.latitude+"&longitude="+p.longitude+"&daily=snowfall_sum,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto" + KEY).then(function(r){ return r.json(); }).then(function(j){
          out.innerHTML = '<h3>'+esc(p.name)+(p.admin1?", "+esc(p.admin1):"")+(p.country?", "+esc(p.country):"")+' <small class="muted mono">'+(p.elevation!=null?Math.round(p.elevation)+" m":"")+'</small></h3><div class="fc" id="loc-fc"></div>';
          dayCards($("#loc-fc"), j.daily);
        });
      }).catch(function(){ out.innerHTML = '<p>Couldn\'t find that place. Try a town or resort name, e.g. "Courchevel" or "Hakuba".</p>'; });
    });
  }

  /* Trip cost calculator */
  var tc = $("#trip-calc");
  if(tc){
    var presets = {budget:{lodge:90,ticket:75,rent:40,food:45,lesson:0},mid:{lodge:180,ticket:150,rent:55,food:75,lesson:120},lux:{lodge:450,ticket:240,rent:85,food:150,lesson:300}};
    function calc(){
      var g = function(n){ return parseFloat($("[name="+n+"]", tc).value) || 0; };
      var ppl = Math.max(1, g("people")), days = Math.max(1, g("days")), nights = Math.max(0, g("nights"));
      var renters = Math.min(ppl, g("renters")), lessons = Math.min(ppl, g("learners"));
      var rows = [
        ["Lift tickets", ppl * days * g("ticket")],
        ["Lodging", nights * g("lodge") * Math.ceil(ppl/2)],
        ["Rentals", renters * days * g("rent")],
        ["Lessons", lessons * g("lesson") * Math.min(days, 3)],
        ["Food & après", ppl * days * g("food")],
        ["Travel (flights/fuel)", ppl * g("travel")],
        ["Insurance & extras (≈6%)", 0]
      ];
      var sub = rows.reduce(function(a,r){ return a + r[1]; }, 0); rows[6][1] = sub * 0.06;
      var total = sub * 1.06, cur = $("[name=currency]", tc).value;
      var f = function(n){ return cur + Math.round(n).toLocaleString(); };
      $("#trip-out").innerHTML = '<div class="muted" style="color:#a9c4d8">Estimated total</div><div class="big">'+f(total)+'</div><div style="color:#a9c4d8;margin-bottom:12px">'+f(total/ppl)+' per person · '+f(total/ppl/days)+' per person per day</div><table>'+rows.map(function(r){ return '<tr><td>'+r[0]+'</td><td>'+f(r[1])+'</td></tr>'; }).join("")+'</table><p style="margin:16px 0 0"><a class="btn btn-signal" href="'+BASE+'plan-my-trip.html">Beat this price — get free quotes →</a></p>';
    }
    $$("[data-preset]", tc).forEach(function(b){
      b.addEventListener("click", function(e){ e.preventDefault(); var p = presets[b.getAttribute("data-preset")]; for(var k in p) $("[name="+k+"]", tc).value = p[k]; calc(); });
    });
    tc.addEventListener("input", calc); calc();
  }

  /* Ski length + boot size */
  var sz = $("#size-calc");
  if(sz){
    function size(){
      var h = parseFloat($("[name=height]", sz).value)||0, lvl = $("[name=level]", sz).value, style = $("[name=style]", sz).value, foot = parseFloat($("[name=foot]", sz).value)||0;
      var off = {beginner:-15, intermediate:-8, advanced:-3, expert:2}[lvl]; var st = {piste:0, allmtn:3, powder:7, park:-5}[style];
      var lo = Math.round(h + off + st - 4), hi = Math.round(h + off + st + 4);
      var mondo = foot ? (Math.round(foot*2)/2).toFixed(1) : "–";
      var flex = {beginner:"60–80 (soft)", intermediate:"80–100", advanced:"100–120", expert:"120–130+ (stiff)"}[lvl];
      $("#size-out").innerHTML = '<div style="color:#a9c4d8">Suggested ski length</div><div class="big">'+lo+'–'+hi+' cm</div><table><tr><td>Boot (Mondopoint)</td><td>'+mondo+'</td></tr><tr><td>Men\'s boot flex guide</td><td>'+flex+'</td></tr><tr><td>Snowboard length (approx.)</td><td>'+Math.round(h*0.88)+'–'+Math.round(h*0.92)+' cm</td></tr></table><p style="font-size:.8rem;color:#a9c4d8;margin:10px 0 0">A starting point only. Weight, ski shape and a professional boot fitting matter more than any formula.</p>';
    }
    sz.addEventListener("input", size); size();
  }

  /* Ski or snowboard quiz */
  var qz = $("#quiz");
  if(qz){
    qz.addEventListener("submit", function(e){
      e.preventDefault();
      var s = 0; $$("input:checked", qz).forEach(function(i){ s += parseInt(i.value,10); });
      var n = $$(".quiz-q", qz).length;
      var r = s > n*0.4 ? ["Snowboarding","You'll likely enjoy snowboarding: a tougher first two days, then fast progression and a surf/skate feel."] : s < -n*0.4 ? ["Skiing","Skiing suits you: easier first day, independent legs for balance, and simpler lift and flat-track handling."] : ["Either — try both!","You're balanced. Book a one-day lesson in each and let your legs vote."];
      $("#quiz-out").innerHTML = '<div style="color:#a9c4d8">Your match</div><div class="big">'+r[0]+'</div><p style="margin:6px 0 14px">'+r[1]+'</p><a class="btn btn-signal" href="'+BASE+'plan-my-trip.html">Find a beginner-friendly trip →</a>';
      $("#quiz-out").hidden = false;
    });
  }

  /* Packing checklist with memory */
  $$(".checklist input[type=checkbox]").forEach(function(cb, i){
    var k = "eski_pack_" + i;
    try{ cb.checked = localStorage.getItem(k)==="1"; }catch(e){}
    cb.addEventListener("change", function(){ try{ localStorage.setItem(k, cb.checked?"1":"0"); }catch(e){} });
  });

  /* Auto-updating news (assets/data/news.json, refreshed by GitHub Action) */
  $$("[data-news]").forEach(function(box){
    var n = parseInt(box.getAttribute("data-news"),10) || 10;
    fetch(BASE + "assets/data/news.json?v=" + Math.floor(Date.now()/36e5)).then(function(r){ return r.json(); }).then(function(j){
      var items = (j.items||[]).slice(0, n);
      box.innerHTML = items.map(function(it){
        var d = new Date(it.date);
        return '<div class="news-item"><time>'+(isNaN(d)?"":d.toLocaleDateString([], {month:"short", day:"numeric"}))+'</time><div><a href="'+esc(it.link)+'" target="_blank" rel="noopener nofollow">'+esc(it.title)+'</a><small>'+esc(it.source||"")+'</small></div></div>';
      }).join("") || '<p class="muted">Headlines refresh automatically several times a day.</p>';
      var u = $("[data-news-updated]"); if(u && j.updated) u.textContent = "Feed refreshed " + new Date(j.updated).toLocaleString();
    }).catch(function(){ box.innerHTML = '<p class="muted">Headlines refresh automatically several times a day.</p>'; });
  });
})();
