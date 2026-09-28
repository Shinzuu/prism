# Cross-browser verification

`test/browsers.mjs` runs every component through one engine and reports which
ones render nothing, which ones throw, and which CSS features the engine
actually supports.

```bash
node test/browsers.mjs chromium
node test/browsers.mjs firefox
node test/browsers.mjs webkit
```

Chromium and Firefox work out of the box after `npx playwright install`.

## WebKit on Arch (no sudo)

Playwright ships WebKit built against Ubuntu, so on Arch it starts and then
dies looking for 19 Debian-named shared objects that Arch either versions
differently or does not package. The fix is a local shim — no system packages,
nothing outside `~/.cache`.

```bash
WK=~/.cache/ms-playwright/webkit-2359/minibrowser-wpe/sys/lib

# 1. what is actually missing
ldd $WK/../bin/MiniBrowser | grep 'not found'

# 2. most are present under a different soname; symlink those in
ln -s /usr/lib/libfoo.so.5 $WK/libfoo.so.5

# 3. the rest come from Ubuntu debs, unpacked into a scratch dir
mkdir -p /tmp/wkdeps && cd /tmp/wkdeps
curl -sO http://archive.ubuntu.com/ubuntu/pool/main/i/icu/libicu74_74.2-1ubuntu3_amd64.deb
# …libflite1, libxml2, libbacktrace0 the same way
for d in *.deb; do ar x "$d" && tar xf data.tar.* ; done
cp -a usr/lib/x86_64-linux-gnu/*.so* $WK/
```

**Do not symlink over a library the bundle already ships.** `libjxl.so.0.8` is
part of the WebKit build; pointing it at the system `libjxl.so.0.12` replaces a
working library with an incompatible ABI and WebKit fails in a way that looks
unrelated. Only add files for sonames that `ldd` reports as `not found`.

Verify with `ldd` again — zero `not found` lines — then run the sweep.

## Recorded results (2026-09-29)

| Engine | Rendered | Threw |
|---|---|---|
| chromium | 70/70 | 0 |
| firefox | 70/70 | 0 |
| webkit | 70/70 | 0 |

Feature support differs and the components degrade rather than break:
`animation-timeline: view()` and `scroll-timeline` are Chromium-only,
`corner-shape` is Chromium-only, and WebKit lacks `field-sizing`. Every
component that uses one of these ships a static fallback, which is why the
render count is the same on all three.
