# Scopeline (working name)

Landing page for a guided feature-definition workspace. Product, design, growth and engineering use it to agree one feature's problem, scope and success measures, with evidence, assumptions and decisions kept explicit.

Plain HTML, CSS and JavaScript with no build step.

## Structure

```
index.html      Page markup and copy
css/style.css   Styles (light and dark via prefers-color-scheme)
js/main.js      Mobile menu, claim filter in the hero mock, footer year
assets/         Images, icons, fonts
```

## Before launch

- "Scopeline" is a working name. Check availability before using it publicly.
- "Start free" buttons link to the try-it workspace; point them at the hosted app once it is deployed.
- Hero mock content is illustrative example data, not research.

## Run locally

```bash
python3 -m http.server 8000
```

## Deploy

Settings → Pages → Deploy from branch → `main` / root.
