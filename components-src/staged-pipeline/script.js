/* Staged progress where each stage reports its own duration and a failure is
   shown in place — with the stages after it marked skipped rather than left
   looking as though they might still run. */
(() => {
  document.querySelectorAll('[data-sp]').forEach((root) => {
    const sr = document.querySelector('[data-sp-sr]');
    const stages = [...root.querySelectorAll('li')].map((li) => {
      li.dataset.state = 'waiting';
      const mark = document.createElement('span'); mark.className = 'sp__mark';
      const name = document.createElement('span'); name.textContent = li.dataset.stage;
      const time = document.createElement('span'); time.className = 'sp__time';
      li.append(mark, name, time);
      return { li, name: li.dataset.stage, ms: +li.dataset.ms, fails: li.dataset.fails === 'true', time };
    });

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    async function run(from = 0) {
      for (let i = from; i < stages.length; i++) {
        const s = stages[i];
        s.li.dataset.state = 'running';
        s.time.textContent = '';
        const t0 = performance.now();
        await sleep(s.ms);
        const took = ((performance.now() - t0) / 1000).toFixed(1) + 's';

        if (s.fails) {
          s.li.dataset.state = 'failed';
          s.time.textContent = took;
          fail(s, i);
          // Everything after a failure is skipped, not pending: a stage that
          // will never run must not look like one that is about to.
          for (let j = i + 1; j < stages.length; j++) {
            stages[j].li.dataset.state = 'skipped';
            stages[j].time.textContent = 'skipped';
          }
          sr.textContent = s.name + ' failed after ' + took + '. Later stages skipped.';
          return;
        }
        s.li.dataset.state = 'done';
        s.time.textContent = took;
      }
      sr.textContent = 'Pipeline finished.';
    }

    function fail(s, i) {
      s.li.querySelector('.sp__why')?.remove();
      const p = document.createElement('p');
      p.className = 'sp__why';
      p.textContent = '3 assertions failed in suite “filmstrip”.';
      const retry = document.createElement('button');
      retry.type = 'button'; retry.textContent = 'retry from here';
      retry.addEventListener('click', () => {
        p.remove();
        s.fails = false;                         // second run succeeds, so the demo completes
        for (let j = i; j < stages.length; j++) { stages[j].li.dataset.state = 'waiting'; stages[j].time.textContent = ''; }
        run(i);
      });
      p.append(retry);
      s.li.append(p);
    }

    run();
  });
})();
