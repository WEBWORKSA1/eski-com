/* eSKI.com core behaviours: navigation, protected contact routing, forms, consent, ads, video, UI polish. */
(function(){
  "use strict";
  var C = window.ESKI_CONFIG || {};
  var $ = function(s,r){return (r||document).querySelector(s)};
  var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  function dec(a){ if(!a) return ""; return a.map(function(c,i){return String.fromCharCode(c ^ ((i % 9) + 5));}).join(""); }
  function store(k,v){ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v);}catch(e){ return null; } }
  window.ESKI = window.ESKI || {};
  ESKI.base = document.body.getAttribute("data-base") || "";

  /* Year + season status (self-updating by date) */
  $$("[data-year]").forEach(function(el){ el.textContent = new Date().getFullYear(); });
  (function season(){
    var el = $("[data-season]"); if(!el) return;
    var m = new Date().getMonth(); /* 0=Jan */
    var north = (m>=10 || m<=3), south = (m>=5 && m<=9);
    var t;
    if(north && (m===10)) t = "Northern season is opening — early-season resorts are spinning lifts";
    else if(north && (m===3)) t = "Spring skiing in the north — corn snow and long days";
    else if(north) t = "Peak northern season — Alps, Rockies, Japan & Canada are live";
    else if(south) t = "Southern season is on — Chile, Argentina, Australia & New Zealand";
    else t = "Between seasons — glacier skiing and pre-season planning time";
    el.textContent = t;
  })();

  /* Mobile nav */
  var mb = $(".menu-btn"), nav = $(".nav");
  if(mb && nav){ mb.addEventListener("click", function(){ var o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); }); }

  /* Protected partner/inquiry link: the destination is never written into the page. */
  $$("[data-intent]").forEach(function(a){
    a.addEventListener("click", function(e){
      var url = dec(C.partner);
      if(!url) return; /* falls back to the on-site contact page */
      e.preventDefault();
      window.open("https://" + url, "_blank", "noopener");
    });
  });

  /* Forms → protected inbox via FormSubmit AJAX */
  function send(form, extra){
    var msg = $(".msg", form), btn = $("[type=submit]", form);
    if($(".hp input", form) && $(".hp input", form).value) return; /* honeypot */
    var data = {};
    new FormData(form).forEach(function(v,k){ if(k==="_gotcha") return; data[k] = data[k] ? data[k] + ", " + v : v; });
    data._subject = "[eSKI.com] " + (form.getAttribute("data-form") || "Inquiry") + (data.name ? " — " + data.name : "");
    data._template = "table"; data._captcha = "false";
    data.page = location.pathname; data.sent_at = new Date().toISOString();
    if(extra) for(var k in extra) data[k] = extra[k];
    var inbox = dec(C.inbox);
    if(btn){ btn.disabled = true; btn.dataset.t = btn.textContent; btn.textContent = "Sending…"; }
    if(msg){ msg.className = "msg"; }
    fetch((C.formEndpoint || "https://formsubmit.co/ajax/") + inbox, {
      method:"POST", headers:{"Content-Type":"application/json","Accept":"application/json"}, body: JSON.stringify(data)
    }).then(function(r){ return r.json().catch(function(){return {};}).then(function(j){ if(!r.ok) throw j; return j; }); })
    .then(function(){
      form.reset();
      if(form.hasAttribute("data-redirect")){ location.href = ESKI.base + "thank-you.html?f=" + encodeURIComponent(form.getAttribute("data-form")||""); return; }
      if(msg){ msg.textContent = form.getAttribute("data-ok") || "Thanks — we received it and will reply within 1–2 business days."; msg.className = "msg ok"; }
    }).catch(function(){
      if(msg){ msg.textContent = "Sorry, that didn't go through. Please try again in a minute."; msg.className = "msg err"; }
    }).then(function(){ if(btn){ btn.disabled = false; btn.textContent = btn.dataset.t; } });
  }
  ESKI.send = send;
  $$("form[data-form]").forEach(function(f){
    if(f.hasAttribute("data-multistep")) return;
    f.addEventListener("submit", function(e){ e.preventDefault(); send(f); });
  });

  /* Multi-step lead form */
  $$("form[data-multistep]").forEach(function(f){
    var steps = $$(".step", f), bars = $$(".steps i", f), i = 0;
    function show(n){
      steps.forEach(function(s,k){ s.classList.toggle("on", k===n); });
      bars.forEach(function(b,k){ b.classList.toggle("on", k<=n); });
      var back = $("[data-back]", f), next = $("[data-next]", f), sub = $("[type=submit]", f);
      if(back) back.style.visibility = n===0 ? "hidden" : "visible";
      if(next) next.style.display = n===steps.length-1 ? "none" : "";
      if(sub) sub.style.display = n===steps.length-1 ? "" : "none";
      i = n;
    }
    function valid(){
      var ok = true;
      $$("input,select,textarea", steps[i]).forEach(function(el){ if(!el.checkValidity()){ ok = false; el.reportValidity(); } });
      return ok;
    }
    f.addEventListener("click", function(e){
      if(e.target.closest("[data-next]")){ e.preventDefault(); if(valid()) show(Math.min(i+1, steps.length-1)); }
      if(e.target.closest("[data-back]")){ e.preventDefault(); show(Math.max(i-1, 0)); }
    });
    f.addEventListener("submit", function(e){ e.preventDefault(); if(valid()) send(f); });
    /* Prefill destination from ?resort= */
    var q = new URLSearchParams(location.search).get("resort");
    var d = $("[name=destination]", f); if(q && d) d.value = q;
    show(0);
  });

  /* Cookie / consent notice */
  if(C.cookieNotice && !store("eski_consent")){
    var ck = document.createElement("div"); ck.className = "cookie show"; ck.setAttribute("role","dialog");
    ck.innerHTML = 'We use cookies for analytics and to show ads (Google AdSense), which keep eSKI free. See our <a href="'+ESKI.base+'privacy.html">Privacy Policy</a>.<br><button class="btn btn-signal btn-sm">OK, got it</button>';
    document.body.appendChild(ck);
    $("button", ck).addEventListener("click", function(){ store("eski_consent","1"); ck.remove(); });
  }

  /* Manual AdSense units (only when slot IDs are configured; Auto ads work without them) */
  $$(".ad-slot[data-slot]").forEach(function(box){
    var id = (C.adSlots||{})[box.getAttribute("data-slot")];
    if(!id) return;
    box.innerHTML = '<div class="ad-label">Advertisement</div><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-6620975821265271" data-ad-slot="'+id+'" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    try{ (window.adsbygoogle = window.adsbygoogle || []).push({}); }catch(e){}
  });

  /* Lite YouTube embeds (privacy-enhanced, load on click) */
  $$(".vid[data-yt]").forEach(function(v){
    var id = v.getAttribute("data-yt");
    v.innerHTML = '<img loading="lazy" alt="" src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg"><div class="play"><span>▶</span></div>';
    v.setAttribute("role","button"); v.setAttribute("tabindex","0");
    function go(){ v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0" title="'+(v.getAttribute("data-title")||"Video")+'" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'; }
    v.addEventListener("click", go); v.addEventListener("keydown", function(e){ if(e.key==="Enter") go(); });
  });

  /* Sticky lead bar after 45% scroll (once per session) */
  var sl = $(".sticky-lead");
  if(sl && C.stickyLead){
    var shown = false, closed = false;
    try{ closed = sessionStorage.getItem("eski_sl")==="x"; }catch(e){}
    window.addEventListener("scroll", function(){
      if(shown || closed) return;
      var p = (window.scrollY + innerHeight) / document.body.scrollHeight;
      if(p > .45){ shown = true; sl.classList.add("show"); }
    }, {passive:true});
    $(".x", sl).addEventListener("click", function(){ sl.classList.remove("show"); try{ sessionStorage.setItem("eski_sl","x"); }catch(e){} });
  }

  /* Donation tiers */
  $$(".tier").forEach(function(t){
    t.addEventListener("click", function(){
      $$(".tier").forEach(function(x){ x.classList.remove("on"); }); t.classList.add("on");
      var a = $("#donate-amount"); if(a) a.value = t.getAttribute("data-amt");
    });
  });
  var dl = C.donate || {};
  $$("[data-pay]").forEach(function(a){
    var u = dl[a.getAttribute("data-pay")];
    if(u){ a.href = u; a.target = "_blank"; a.rel = "noopener"; a.hidden = false; } else { a.hidden = true; }
  });
  var anyPay = Object.keys(dl).some(function(k){ return dl[k]; });
  $$("[data-pay-empty]").forEach(function(el){ el.hidden = anyPay; });
  var goal = C.fundraising || {};
  $$("[data-goal]").forEach(function(el){
    var pct = goal.target ? Math.min(100, Math.round(100*goal.raised/goal.target)) : 0;
    el.innerHTML = '<div class="progress"><i style="width:'+pct+'%"></i></div><p class="muted" style="margin-top:8px"><b class="mono">$'+(goal.raised||0).toLocaleString()+'</b> raised of $'+(goal.target||0).toLocaleString()+' season goal · '+(goal.label||"")+'</p>';
  });

  /* Contest config */
  var ct = C.contest || {};
  $$("[data-contest]").forEach(function(el){ var k = el.getAttribute("data-contest"); if(ct[k]) el.textContent = ct[k]; });
  $$("[data-countdown]").forEach(function(el){
    var end = new Date((ct.closes||"") + "T23:59:59");
    function tick(){
      var ms = end - new Date();
      if(isNaN(ms)) return;
      if(ms <= 0){ el.textContent = "Entries closed — winners announced soon"; return; }
      var d = Math.floor(ms/864e5), h = Math.floor(ms/36e5)%24, m = Math.floor(ms/6e4)%60;
      el.textContent = d + "d " + h + "h " + m + "m left to enter";
    }
    tick(); setInterval(tick, 30000);
  });

  /* Reveal on scroll */
  if("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }); }, {rootMargin:"0px 0px -40px 0px"});
    $$(".reveal").forEach(function(el){ io.observe(el); });
  } else { $$(".reveal").forEach(function(el){ el.classList.add("in"); }); }

  /* Header search → resorts page */
  $$("form[data-search]").forEach(function(f){
    f.addEventListener("submit", function(e){ e.preventDefault(); var q = $("input", f).value.trim(); location.href = ESKI.base + "resorts.html" + (q ? "?q=" + encodeURIComponent(q) : ""); });
  });
})();
