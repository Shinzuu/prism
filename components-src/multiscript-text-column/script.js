/* Four scripts in a narrowing column. Each breaks lines by different rules,
   and the English defaults — word-break: break-all being the usual reach —
   damage all of them: it cuts Thai mid-syllable, lets Japanese start a line
   with a full stop, and severs the joins between Arabic letters. */
(() => {
  const SAMPLES = [
    { lang: 'th', label: 'Thai — no spaces between words',
      text: 'การจัดวางตัวอักษรที่ดีต้องรู้ว่าคำจบตรงไหนแม้ไม่มีช่องว่างคั่นระหว่างคำ' },
    { lang: 'ja', label: 'Japanese — kinsoku line-break rules',
      text: '行頭に句読点や閉じ括弧を置いてはいけません。「禁則処理」と呼ばれる規則です。' },
    { lang: 'ar', label: 'Arabic — letters must stay joined',
      text: 'النص العربي يتصل حروفه ببعضها، وكسر الكلمة يقطع هذا الاتصال ويجعلها غير مقروءة.' },
    { lang: 'en', label: 'English — for comparison',
      text: 'Latin text breaks at spaces and hyphens, which is the only rule most layout code knows.' },
  ];

  document.querySelectorAll('[data-mtc]').forEach((root) => {
    const cols = root.querySelector('[data-mtc-cols]');
    const slider = root.querySelector('[data-mtc-w]');
    const px = root.querySelector('[data-mtc-px]');

    for (const s of SAMPLES) {
      const col = document.createElement('div');
      col.className = 'mtc__col';
      col.innerHTML = '<p class="mtc__lab">' + s.label + '</p>';
      const p = document.createElement('p');
      p.className = 'mtc__p';
      // lang is not decoration: the engine picks its line-breaking dictionary
      // from it. Without lang, Thai gets no word boundaries at all.
      p.lang = s.lang;
      p.textContent = s.text;
      col.append(p);
      cols.append(col);
    }

    // One column repeated with the English defaults applied, so the damage is
    // visible side by side rather than described.
    const bad = document.createElement('div');
    bad.className = 'mtc__col';
    bad.dataset.bad = '';
    bad.innerHTML = '<p class="mtc__lab">Thai with word-break: break-all</p>';
    const bp = document.createElement('p');
    bp.className = 'mtc__p'; bp.lang = 'th'; bp.textContent = SAMPLES[0].text;
    bad.append(bp);
    cols.append(bad);

    const apply = () => {
      cols.style.gridTemplateColumns = 'repeat(auto-fit, minmax(' + slider.value + 'px, 1fr))';
      cols.style.maxWidth = (Number(slider.value) * 2 + 20) + 'px';
      px.textContent = slider.value + 'px';
    };
    slider.addEventListener('input', apply);
    apply();
  });
})();
