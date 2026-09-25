/* Live component workbench: edit the source, the preview re-renders.
   The preview runs in a sandboxed iframe so a component's script cannot
   reach the gallery around it. */
(() => {
  document.querySelectorAll('[data-wb]').forEach((wb) => {
    const frame  = wb.querySelector('[data-wb-frame]');
    const tabs   = [...wb.querySelectorAll('[data-wb-tab]')];
    const panes  = [...wb.querySelectorAll('[data-wb-pane]')];
    const status = wb.querySelector('[data-wb-status]');
    const reset  = wb.querySelector('[data-wb-reset]');
    const copy   = wb.querySelector('[data-wb-copy]');

    const original = Object.fromEntries(panes.map(p => [p.dataset.wbPane, p.value]));
    let theme = (window.prism && window.prism.tokens) ? window.prism.tokens() : {};
    let timer;

    const src = (lang) => wb.querySelector(`[data-wb-pane="${lang}"]`)?.value ?? '';

    function tokenBlock() {
      const body = Object.entries(theme)
        .filter(([k]) => k.startsWith('--'))
        .map(([k, v]) => `${k}:${v};`).join('');
      return `:root{${body}color-scheme:${theme['color-scheme'] || 'light'};}`;
    }

    function document_() {
      return `<!doctype html><html><head><meta charset="utf-8">
<style>
${tokenBlock()}
*{box-sizing:border-box}
html,body{margin:0}
body{background:var(--bg);color:var(--text);
 font-family:var(--sans,system-ui);font-size:15px;line-height:1.6;padding:24px}
</style>
<style>${src('css')}</style></head>
<body>${src('html')}
<script>
window.onerror=(m,s,l)=>{parent.postMessage({wb:'error',msg:m+' (line '+l+')'},'*');};
<\/script>
<script>${src('js')}<\/script>
<script>parent.postMessage({wb:'ok',h:document.documentElement.scrollHeight},'*');<\/script>
</body></html>`;
    }

    function render() {
      status.textContent = 'rendering…';
      frame.srcdoc = document_();
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(render, 350);
    }

    addEventListener('message', (e) => {
      if (e.source !== frame.contentWindow || !e.data || !e.data.wb) return;
      if (e.data.wb === 'ok') {
        frame.style.height = Math.max(180, Math.min(e.data.h + 24, 620)) + 'px';
        status.textContent = 'live';
        status.dataset.state = 'ok';
      } else {
        status.textContent = e.data.msg;
        status.dataset.state = 'err';
      }
    });

    addEventListener('prism:theme', (e) => { theme = e.detail; render(); });

    panes.forEach((p) => p.addEventListener('input', () => {
      status.dataset.state = 'edit';
      schedule();
    }));

    tabs.forEach((t) => t.addEventListener('click', () => {
      tabs.forEach(x => x.setAttribute('aria-selected', String(x === t)));
      panes.forEach(x => { x.hidden = x.dataset.wbPane !== t.dataset.wbTab; });
    }));

    /* Viewport rig: components are judged at the widths they actually ship to. */
    const rig = wb.querySelector('[data-wb-rig]');
    const wrap = wb.querySelector('[data-wb-wrap]');
    rig?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-w]');
      if (!b) return;
      rig.querySelectorAll('[data-w]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const w = b.dataset.w;
      wrap.style.maxWidth = w === 'full' ? '100%' : w + 'px';
      wrap.dataset.narrow = String(w !== 'full');
    });

    reset?.addEventListener('click', () => {
      panes.forEach(p => { p.value = original[p.dataset.wbPane]; });
      render();
    });

    copy?.addEventListener('click', async () => {
      const active = tabs.find(t => t.getAttribute('aria-selected') === 'true');
      try {
        await navigator.clipboard.writeText(src(active.dataset.wbTab));
        copy.textContent = 'copied';
        setTimeout(() => { copy.textContent = 'copy'; }, 1400);
      } catch { copy.textContent = 'copy failed'; }
    });

    render();
  });
})();
