/* The dialog and popover need no script. This listens for the ONE custom
   command — a name starting with two dashes — which is the part of the invoker
   API people miss: you get the same declarative wiring for your own actions,
   delivered as a CommandEvent on the target rather than on the button. */
(() => {
  const log = document.querySelector('[data-cb-log]');
  if (!log) return;

  const lines = [];
  const write = (text) => {
    lines.unshift(text);
    log.textContent = lines.slice(0, 3).join('\n');
  };

  // The event fires on the TARGET, so one listener serves every button
  // pointing at this element — however many get added later.
  log.addEventListener('command', (event) => {
    if (event.command === '--clear') {
      lines.length = 0;
      log.textContent = 'cleared by --clear, dispatched to the target';
    }
  });

  for (const el of document.querySelectorAll('#cb-sheet, #cb-tip')) {
    el.addEventListener('command', (e) => write(e.command + ' → #' + el.id));
  }

  write('waiting — every button above is declarative');
})();
