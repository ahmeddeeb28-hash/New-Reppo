# Scopeline (working name)

Landing page for a guided feature-definition workspace. Product, design, growth and engineering use it to agree one feature's problem, scope and success measures, with evidence, assumptions and decisions kept explicit.

Plain HTML, CSS and JavaScript with no build step.

## Structure

`index.html` is the whole product in one file: a landing page (hero, product walkthrough, interactive feature rows, how it works, FAQ). "Start free" opens the new-chat screen, and sending a message turns the page into the chat workspace (conversation on the left, definition on the right).

- With Claude available (opened on claude.ai), the assistant asks follow-up questions and proposes labelled items.
- Anywhere else, guided mode asks the same questions in order and labels answers with built-in rules.
- Chats are saved in the browser (localStorage).

## Run locally

```bash
python3 -m http.server 8000
```

## Deploy

Settings → Pages → Deploy from branch → `main` / root.
