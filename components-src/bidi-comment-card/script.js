/* Mixed-direction text breaks in a specific, repeatable way: a Latin handle at
   the start of an Arabic sentence drags the sentence's trailing punctuation to
   the wrong end of the line, and a number next to it lands in the wrong place.
   The fix is isolation — telling the bidi algorithm that a run is a unit and
   its direction must not leak into its neighbours. <bdi> does exactly this. */
(() => {
  const COMMENTS = [
    { who: 'sara_k', dir: 'rtl', lang: 'ar',
      body: 'هذا يبدو رائعًا، شكرًا لك!', likes: 12, url: 'example.com/specs' },
    { who: 'דניאל', dir: 'rtl', lang: 'he',
      body: 'אני אבדוק את זה מחר בבוקר.', likes: 3, url: 'example.com/thread/8' },
    { who: 'm_torres', dir: 'ltr', lang: 'en',
      body: 'Agreed — I will push the fix tonight.', likes: 7, url: 'example.com/pr/441' },
    { who: 'أحمد', dir: 'rtl', lang: 'ar',
      body: 'النسخة 2.4 تعمل بشكل جيد على الإصدار 11.', likes: 21, url: 'example.com/v2-4' },
  ];

  document.querySelectorAll('[data-bcc]').forEach((root) => {
    const list = root.querySelector('[data-bcc-list]');
    const raw = root.querySelector('[data-bcc-raw]');

    for (const c of COMMENTS) {
      const li = document.createElement('li');
      li.className = 'bcc__card';

      /* <bdi> around each independently-authored string. The author's handle,
         the URL and the count all have their own direction, and none of them
         should be able to reorder the sentence they sit beside. */
      const meta = document.createElement('p');
      meta.className = 'bcc__meta';
      meta.innerHTML =
        '<bdi class="bcc__who">' + c.who + '</bdi>' +
        '<bdi class="bcc__iso">' + c.url + '</bdi>' +
        '<bdi class="bcc__iso">' + c.likes + ' likes</bdi>';

      const body = document.createElement('p');
      body.className = 'bcc__body';
      // dir on the element carrying the text, not on an ancestor: the paragraph
      // direction decides where the trailing full stop goes.
      body.dir = c.dir;
      body.lang = c.lang;
      body.textContent = c.body;

      li.append(meta, body);
      list.append(li);
    }

    raw.addEventListener('change', () => {
      if (raw.checked) root.dataset.raw = ''; else root.removeAttribute('data-raw');
    });
  });
})();
