<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rules & Guidelines — The Undertow</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>%E2%9A%93</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IM+Fell+English+SC&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Special+Elite&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css">
</head>
<body>

<svg class="grain" width="100%" height="100%">
  <filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/></filter>
  <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
</svg>

<nav class="brass-nav">
  <div class="brand"><span>THE UNDERTOW</span> <span>HARBOR AUTHORITY · EST. 1891</span></div>
  <ul>
    <li><a href="/#welcome">Welcome</a></li>
    <li><a href="/#history">History</a></li>
    <li><a href="/#notices">Notices</a></li>
    <li><a href="/rules.html">Rules</a></li>
    <li><a href="/news.html">News</a></li>
    <li><a href="/lore.html">Lore</a></li>
    <li><a href="/#residents">Residents</a></li>
    <li><a href="/#almanac">Almanac</a></li>
    <li><a href="/#residency">Residency</a></li>
    <li><a href="/#admin">Admin</a></li>
  </ul>
  <div class="nav-auth" id="navAuth"></div>
</nav>

<header class="page-header">
  <p class="eyebrow">Harbor Authority Notice</p>
  <h1>Rules &amp; Guidelines</h1>
  <p class="tagline">What's expected of every resident, on the docks and off. Read carefully — the Authority does not accept ignorance as an excuse.</p>
  <a class="back-home" href="/">&larr; Back to the harbor</a>
</header>

<section class="section rules-section reveal">
  <div id="rules-list" class="rules-list">
    <p class="loading-text">Consulting the ledger…</p>
  </div>
</section>

<footer>
  <div class="seal">⚓ THE UNDERTOW HARBOR AUTHORITY</div>
  <p>Est. 1891 · Reopened courtesy of the Coddiwomple Maritime Co.</p>
  <p>The Authority is not responsible for losses incurred at sea, after dark, or at the intersection of the two.</p>
</footer>

<script src="/js/site.js"></script>
<script>
  async function loadRulesPage() {
    const container = document.getElementById('rules-list');
    try {
      const res = await fetch('/api/rules');
      if (!res.ok) throw new Error('bad response');
      const sections = await res.json();
      if (!sections.length) {
        container.innerHTML = '<p class="empty-state">No rules have been posted yet.</p>';
        return;
      }
      container.innerHTML = sections
        .map(s => `<div class="rules-card"><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.content)}</p></div>`)
        .join('');
    } catch (err) {
      container.innerHTML = '<p class="empty-state">The ledger is unreachable right now — try again shortly.</p>';
    }
  }
  loadRulesPage();
</script>

</body>
</html>
