/* The Run Rate — shared article rendering
 * Single source of truth: /articles.json
 * Usage:
 *   TRR.renderCategory('Wellness', document.getElementById('trr-grid'));
 *   TRR.renderSidebar('/wellness/apple-health-ios27-womens-fitness', document.getElementById('trr-sidebar'));
 *   TRR.renderMore('/wellness/apple-health-ios27-womens-fitness', document.getElementById('trr-more'));
 */
const TRR = (() => {
  let _cache = null;

  async function fetchArticles() {
    if (_cache) return _cache;
    try {
      const r = await fetch('/articles.json');
      _cache = await r.json();
    } catch (e) {
      _cache = [];
    }
    return _cache;
  }

  function bg(src) {
    return `background-image:url('${src}');background-size:cover;background-position:center;`;
  }

  function lazyImg(a) {
    return `<img src="${a.image}" alt="${a.title}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block;">`;
  }

  function label(a) {
    return a.section || a.category;
  }

  // Category index page grid
  async function renderCategory(category, el) {
    if (!el) return;
    const all = await fetchArticles();
    const arts = all.filter(a => a.category === category);
    if (!arts.length) {
      el.innerHTML = `<div class="cat-empty"><p>New ${category} articles coming soon.</p><a href="https://newsletter.therunrate.co" class="cat-empty-cta">Subscribe to get them first →</a></div>`;
      return;
    }
    el.className = 'cat-grid';
    el.innerHTML = arts.map(a => `
      <a href="${a.url}" class="cat-card">
        <div class="cat-card-img">${lazyImg(a)}</div>
        <div class="cat-card-meta">${label(a)} &nbsp;·&nbsp; ${a.dateDisplay}</div>
        <div class="cat-card-headline">${a.title}</div>
        <p class="cat-card-deck">${a.deck}</p>
      </a>`).join('');
  }

  // Article sidebar "More from..." links (2–3 items, exclude current, same-cat first)
  async function renderSidebar(currentUrl, category, el) {
    if (!el) return;
    const all = await fetchArticles();
    const others = all.filter(a => a.url !== currentUrl);
    const samecat = others.filter(a => a.category === category);
    const rest = others.filter(a => a.category !== category);
    const picks = [...samecat, ...rest].slice(0, 3);
    el.innerHTML = picks.map(a => `
      <a href="${a.url}" class="sidebar-article">
        <div class="sidebar-article-cat">${label(a)}</div>
        <div class="sidebar-article-title">${a.title}</div>
      </a>`).join('');
  }

  // Article bottom "More from The Run Rate" mini-card grid (4 items, exclude current)
  async function renderMore(currentUrl, el) {
    if (!el) return;
    const all = await fetchArticles();
    const picks = all.filter(a => a.url !== currentUrl).slice(0, 4);
    el.className = 'art-more-grid';
    el.innerHTML = picks.map(a => `
      <a href="${a.url}" class="mini-card">
        <div class="mini-card-img">${lazyImg(a)}</div>
        <div class="mini-card-cat">${label(a)}</div>
        <div class="mini-card-headline">${a.title}</div>
      </a>`).join('');
  }

  return { renderCategory, renderSidebar, renderMore };
})();
