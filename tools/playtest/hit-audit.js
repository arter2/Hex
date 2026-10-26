// Inject on a rendered page. Reads hit regions; scrolls only when explicitly requested.
(function (root) {
  async function audit(options = {}) {
    const scope = document.querySelector(options.scope || 'body');
    if (!scope) throw Error('Missing audit scope: ' + options.scope);
    const results = [],
      all = [...scope.querySelectorAll('button,input,select,textarea,summary,a[href]')];
    for (const [index, el] of all.entries()) {
      // not drawn at all: no box, hidden, or inside a closed <details> / content-visibility:hidden
      if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') continue;
      if (
        el.checkVisibility &&
        !el.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true })
      )
        continue;
      const item = {
        id: el.id || null,
        index,
        text: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 80),
        issues: [],
        warnings: []
      };
      if (el.disabled) {
        item.skipped = 'disabled';
        results.push(item);
        continue;
      }
      // decoration drawn as a button (a card preview inside a shop item): taps pass through it on purpose
      if (getComputedStyle(el).pointerEvents === 'none') {
        item.skipped = 'not tappable (pointer-events: none)';
        results.push(item);
        continue;
      }
      if (options.scroll) {
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      const r = el.getBoundingClientRect();
      item.rect = { x: r.x, y: r.y, width: r.width, height: r.height };
      if (r.width < 44 || r.height < 44) item.warnings.push('target smaller than 44 CSS px');
      const ix = Math.min(14, r.width / 4),
        iy = Math.min(14, r.height / 4),
        points = [
          [r.x + r.width / 2, r.y + r.height / 2],
          [r.x + ix, r.y + iy],
          [r.right - ix, r.y + iy],
          [r.x + ix, r.bottom - iy],
          [r.right - ix, r.bottom - iy]
        ];
      item.points = points.map(([x, y]) => {
        const top = document.elementFromPoint(x, y),
          outside = x < 0 || y < 0 || x >= innerWidth || y >= innerHeight,
          hit = !outside && (top === el || el.contains(top));
        return { x, y, hit, cover: top ? top.id || top.tagName + '.' + top.className : null, coverEl: top };
      });
      // Covered at the centre: a real problem. Covered only at an edge by a fixed or sticky bar (a footer over a
      // scrolling list): the player can scroll it clear, so it is a warning, not a failure.
      const pinned = n => {
        for (let e = n; e && e !== document.body; e = e.parentElement) {
          const pos = getComputedStyle(e).position;
          if (pos === 'fixed' || pos === 'sticky') return true;
        }
        return false;
      };
      const missed = item.points.filter(p => !p.hit);
      if (!item.points[0].hit) item.issues.push('the centre of the control is clipped or covered');
      else if (missed.some(p => !p.coverEl || !pinned(p.coverEl)))
        item.issues.push('an edge of the control is clipped or covered');
      else if (missed.length) item.warnings.push('an edge sits under a fixed bar until scrolled');
      for (const p of item.points) delete p.coverEl;
      results.push(item);
    }
    return {
      scope: options.scope || 'body',
      viewport: { width: innerWidth, height: innerHeight },
      checked: results.filter(r => !r.skipped).length,
      failures: results.filter(r => r.issues.length).length,
      warnings: results.filter(r => r.warnings.length).length,
      results
    };
  }
  root.PTHitAudit = audit;
})(typeof globalThis !== 'undefined' ? globalThis : this);
