# New Site

A simple static website: plain HTML, CSS and JavaScript with no build step.

## Structure

```
index.html      Page markup
css/style.css   Styles (light/dark via prefers-color-scheme)
js/main.js      Scripts
assets/         Images, icons, fonts
```

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Deploy

Push to GitHub, then enable **Settings → Pages → Deploy from branch → `main` / root**.
