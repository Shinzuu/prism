/* Word-level diff. Line diffs mark a whole sentence changed when one word moved,
   which hides the edit inside the noise. This finds the longest common
   subsequence over word tokens and marks only what actually differs. */
(() => {
  const tokenise = (s) => s.match(/\S+\s*/g) || [];

  function lcs(a, b) {
    // Classic dynamic programme; the texts here are paragraphs, not files.
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
    for (let i = m - 1; i >= 0; i--)
      for (let j = n - 1; j >= 0; j--)
        dp[i][j] = a[i].trim() === b[j].trim()
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);

    const ops = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
      if (a[i].trim() === b[j].trim()) { ops.push(['same', a[i]]); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push(['del', a[i]]); i++; }
      else { ops.push(['ins', b[j]]); j++; }
    }
    while (i < m) ops.push(['del', a[i++]]);
    while (j < n) ops.push(['ins', b[j++]]);
    return ops;
  }

  document.querySelectorAll('[data-wd]').forEach((root) => {
    const src = JSON.parse(root.querySelector('[data-wd-src]').textContent);
    const paneA = root.querySelector('[data-wd-a]');
    const paneB = root.querySelector('[data-wd-b]');
    const stat = root.querySelector('[data-wd-stat]');
    const ops = lcs(tokenise(src.a), tokenise(src.b));

    function render(pane) {
      pane.textContent = '';
      for (const [kind, text] of ops) {
        if (kind === 'same') { pane.append(document.createTextNode(text)); continue; }
        const el = document.createElement(kind === 'ins' ? 'ins' : 'del');
        el.textContent = text;
        // Screen readers get the change type in words, not a visual style.
        el.setAttribute('aria-label', (kind === 'ins' ? 'added: ' : 'removed: ') + text.trim());
        pane.append(el);
      }
    }
    render(paneA); render(paneB);

    const added = ops.filter((o) => o[0] === 'ins').length;
    const removed = ops.filter((o) => o[0] === 'del').length;
    stat.textContent = `+${added} −${removed} words`;

    root.dataset.mode = 'inline';
    root.querySelectorAll('[data-wd-mode]').forEach((b) => b.addEventListener('click', () => {
      root.dataset.mode = b.dataset.wdMode;
      root.querySelectorAll('[data-wd-mode]').forEach((o) =>
        o.setAttribute('aria-pressed', String(o === b)));
    }));
  });
})();
