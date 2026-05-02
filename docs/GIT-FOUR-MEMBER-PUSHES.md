# Four member pushes — split the repo by part (Git walkthrough)

Use this when you want **four separate pushes** (four commits) so **each group member** delivers one part of the divided codebase.

## Group E roster (authors for each push)

| Push | Member | Email | Part |
|------|--------|-------|------|
| 1 | **Cholo Diel** | `200810445@my.xu.edu.ph` | **firebase-rules** |
| 2 | **Frances Raphael Llamera Sedayon** | `20200020138@my.xu.edu.ph` | **docs** |
| 3 | **Joshua Balista** | `20220026362@my.xu.edu.ph` | **frontend** |
| 4 | **Jhemar Visande** | `20200020235@my.xu.edu.ph` | **functions** + root **README** |

| Push | Branch suggestion | What it contains |
|------|-------------------|------------------|
| 1 | `feature/part-firebase-rules` | Firestore/Storage rules + indexes under `firebase-rules/` |
| 2 | `feature/part-docs` | Workflow doc, scripts, backups under `docs/` |
| 3 | `feature/part-frontend` | React app under `frontend/`, Docker, root workspace `package.json`, hosting path |
| 4 | `feature/part-functions-and-readme` | `functions/README.md` + expanded root `README.md` (repo map for all four parts) |

`functions/` **source code** often does not move in a restructure; the **fourth push** still represents the “functions / integration” owner by adding **`functions/README.md`** and the **main README** that documents the whole system.

---

## Warnings

- **Rewriting history** (`git reset` below) **replaces** the single “split everything” commit. If **`main` is already pushed** and others pulled it, coordinate with your group or use **`git revert`** instead of reset (ask your instructor).
- Do this on a **copy** of the repo first if you are unsure.
- Each commit below uses **`git -c user.name=... -c user.email=...`** so history shows the right **Group E** author. Members can instead set `git config user.name` / `user.email` on their own PC before committing.

---

## Prerequisite

Your **working tree** must already be the **final** four-part layout (this repo today: `frontend/`, `functions/`, `firebase-rules/`, `docs/`, updated `firebase.json`, etc.).

---

## Step 0 — Save your work and create a safety branch

```powershell
cd path\to\Strucsure-SOPS
git branch backup-before-four-pushes
```

---

## Step 1 — Put the index back one commit; keep files on disk

This makes Git see “old” `main` (`cc8cf76`-style) in the index, while your **folders on disk** stay in the **new** layout.

```powershell
git reset --soft HEAD~1
git reset HEAD
```

Check: `git status` should list many changes (moves, edits, new folders).

---

## Step 2 — Push 1 — Cholo Diel: Firebase rules (`firebase-rules/`)

**Goal:** Rules and indexes live under `firebase-rules/`. **Hosting must still be `"build"`** so the app (still at repo root in Git’s eyes until push 3) keeps working.

1. Temporarily set `firebase.json` **hosting** to **`"build"`** (not `frontend/build`).  
   Firestore/Storage should point at **`firebase-rules/...`** (same as your final file except hosting).

   Minimal `firebase.json` for this commit:

   ```json
   {
     "hosting": {
       "public": "build",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [{ "source": "**", "destination": "/index.html" }],
       "headers": [
         {
           "source": "**/*.@(js|css)",
           "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }]
         }
       ]
     },
     "firestore": {
       "rules": "firebase-rules/firestore.rules",
       "indexes": "firebase-rules/firestore.indexes.json"
     },
     "storage": {
       "rules": "firebase-rules/storage.rules"
     },
     "functions": {
       "source": "functions",
       "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run lint"]
     }
   }
   ```

2. Stage and commit:

   ```powershell
   git add firebase-rules/
   git rm firestore.rules firestore.indexes.json storage.rules
   git add firebase.json

   git -c user.name="Cholo Diel" -c user.email="200810445@my.xu.edu.ph" commit -m "feat(rules): move Firestore and Storage rules to firebase-rules/"
   ```

3. **Group workflow:** create a branch and push; open a PR into **`develop`**. Leader merges **Cholo’s** branch before Frances starts the next push.

   ```powershell
   git checkout -b feature/part-firebase-rules
   git push -u origin feature/part-firebase-rules
   ```

   **Local replay (all four commits on one machine, no PR between steps):** stay on the same branch (e.g. `replay-four-pushes`), do **not** run `git checkout develop` between commits—go straight to **Frances’s** `git add` / `git commit`.

---

## Step 3 — Push 2 — Frances Raphael Llamera Sedayon: Docs (`docs/`)

**If you already merged Cholo’s PR into `develop` on GitHub:**

```powershell
git checkout develop
git pull origin develop
```

**If you are replaying locally in one sitting:** stay on your current branch (already has Cholo’s commit).

Then:

```powershell
git add docs/
git add -u SYSTEM_WORKFLOW_DOCUMENTATION.md
git add -u scripts
git add -u firestore.rules.backup

git -c user.name="Frances Raphael Llamera Sedayon" -c user.email="20200020138@my.xu.edu.ph" commit -m "docs: consolidate workflow, scripts, and backups under docs/"

git checkout -b feature/part-docs
git push -u origin feature/part-docs
```

(For **local replay**, you can omit `git checkout -b` / `push` until after Member 4, then push once—or push each branch for realism.)

---

## Step 4 — Push 3 — Joshua Balista: Frontend (`frontend/`) + workspace + Docker

**If Frances’s PR is already merged into `develop`:** `git checkout develop` && `git pull origin develop` first. **Local replay:** continue on the same branch.

1. Restore **full** `firebase.json` with **`"public": "frontend/build"`** (your current production-ready version).

2. Stage the React move and tooling:

   ```powershell
   git add frontend/
   git rm -r src
   git rm -r public
   git rm package.json package-lock.json postcss.config.js tailwind.config.js test.js
   git rm Dockerfile.frontend

   git add frontend/Dockerfile
   git add docker-compose.yml
   git add .gitignore
   git add package.json
   git add firebase.json

   git -c user.name="Joshua Balista" -c user.email="20220026362@my.xu.edu.ph" commit -m "feat(frontend): move React app to frontend/; root workspace; Docker; Firebase hosting path"
   ```

3. Push:

   ```powershell
   git checkout -b feature/part-frontend
   git push -u origin feature/part-frontend
   ```

---

## Step 5 — Push 4 — Jhemar Visande: Functions doc + root README

**If prior PRs are merged:** `git checkout develop` && `git pull origin develop`. **Local replay:** same branch as before.

1. Add **`functions/README.md`** (describe Cloud Functions, Node version, deploy: `firebase deploy --only functions`, link to Firebase console). Create the file if it does not exist.

2. Stage the expanded **`README.md`** (four-part table, quick start, links to `docs/`).

   ```powershell
   git add functions/README.md
   git add README.md

   git -c user.name="Jhemar Visande" -c user.email="20200020235@my.xu.edu.ph" commit -m "docs(functions): add functions README; document four-part repo layout in root README"

   git checkout -b feature/part-functions-and-readme
   git push -u origin feature/part-functions-and-readme
   ```

---

## After all four merges into `develop`

```powershell
git checkout develop
git pull origin develop
npm run install:all
npm start
```

---

## If you already deleted the old single commit on `main`

If you **only** replay locally and want **`main`** to show four commits:

```powershell
git checkout main
git reset --hard develop
git push origin main
```

(Only if your group allows **force-push** to `main`; otherwise open a PR `develop` → `main`.)

---

## Grading narrative (short)

- **Four branches** → **four PRs** → **`develop`** merged **one at a time** matches the milestone.  
- **Commit history** should show four authors: **Cholo Diel**, **Frances Raphael Llamera Sedayon**, **Joshua Balista**, **Jhemar Visande** (use the `git -c user.name` / `user.email` lines above, or each member’s own Git config).  
- **Four directories** in the tree match the four responsibilities.

---

## Rollback

```powershell
git reset --hard backup-before-four-pushes
```

---

*Intermediate commits assume nobody checks out `main` between steps without merging; the leader should merge PRs on `develop` in order: **Cholo → Frances → Joshua → Jhemar** (pushes 1–4).*
