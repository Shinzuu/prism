#!/usr/bin/env bash
# Stop-hook gate. Runs the visual QA only when something visual has changed
# since the last pass, so ending a turn stays fast when nothing did.
set -uo pipefail
cd "$(dirname "$0")/.." || exit 0

STAMP=.qa-stamp
HASH=$(find src components-src public -type f \
        \( -name '*.astro' -o -name '*.css' -o -name '*.js' -o -name '*.html' -o -name '*.json' \) \
        -not -path '*/node_modules/*' -print0 2>/dev/null \
      | sort -z | xargs -0 sha1sum 2>/dev/null | sha1sum | cut -d' ' -f1)

[ -f "$STAMP" ] && [ "$(cat "$STAMP")" = "$HASH" ] && exit 0

OUT=$(node test/qa.mjs 2>&1)
if [ $? -eq 0 ]; then
  echo "$HASH" > "$STAMP"
  exit 0
fi

# Block the turn and hand the failures back.
python3 - "$OUT" <<'PY'
import json, sys
print(json.dumps({
  "decision": "block",
  "reason": "Visual QA is failing, so this work is not done:\n\n" + sys.argv[1] +
            "\n\nFix these, then render the page and look at it before reporting again. "
            "If a check itself is wrong, fix the check rather than loosening the threshold."
}))
PY
exit 0
