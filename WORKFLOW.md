# Sprout — Dev Workflow

## Run Locally

```bash
cd "c:\Users\chenh\OneDrive\Desktop\Coding\Subscription Tracker"
npx serve . -p 8080
```

Open **localhost:8080** in Chrome. Edit any file → refresh to see changes. No build step needed.

---

## Make Changes → Test → Push

```bash
# 1. Check what changed
git status
git diff

# 2. Stage your files
git add <filename>    # specific file
git add .             # everything

# 3. Commit
git commit -m "your message here"

# 4. Push to GitHub (goes live on GitHub Pages)
git push origin main
```

---

## Full Example Session

```bash
# Start local server
npx serve . -p 8080

# ... make edits in VS Code, test at localhost:8080 ...

git add app.html css/styles.css
git commit -m "Fix subscription card layout"
git push origin main
```

Live at `nyang9825-crypto.github.io/SubTrack` within ~60 seconds.

---

## Key Files

| File | What it does |
|------|-------------|
| `index.html` | Landing page |
| `app.html` | The actual app |
| `css/styles.css` | App styles |
| `css/landing.css` | Landing page styles |
| `js/main.js` | App entry point |
| `sprout-logo.png` | App logo |

---

## Rules of Thumb

- Always test at `localhost:8080` before pushing
- One commit per logical change — not one giant commit for everything
- If something breaks locally, **don't push** — fix it first
- GitHub Pages takes 1–2 min to reflect changes after push
