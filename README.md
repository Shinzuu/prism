# prism

A component gallery where every component takes its colour from an image.

Thirty components, two a week, built over ninety days. All of them plain HTML, CSS and
vanilla JavaScript — no framework, no build step to consume them, no dependencies to rot.

## The palette

The theme is generated from a wallpaper. Hue and chroma are read from the image's pixels in
OKLab; lightness stays on a fixed ladder the image never touches. Contrast is therefore
structurally guaranteed rather than checked after the fact, and any image produces a
readable palette.

Components reference design tokens only. A literal hex value fails the build.

## Every component records its prompt

Each component ships with the prompt that produced it, the earlier attempts that failed, and
why they failed. The code is the easy half — knowing which constraints to state up front is
the part worth keeping.

## Layout

```
components-src/<slug>/     index.html, style.css, script.js, meta.json
src/lib/registry.js        loads and validates components at build time
src/pages/                 gallery, component pages, about
public/theme.js            palette extraction, ~130 lines, no dependencies
```

## Build

```bash
npm install
npm run dev      # localhost:4321
npm run build    # dist/
```

The build refuses to publish a component that has no prompt, uses a literal colour, or
declares a type outside the allowed set.
