# Final Project — Milestones 3 & 4 Checklist

Use this list to track **Milestone 3 (Integration + System Testing)** and **Milestone 4 (Staging Deployment + Acceptance Testing)**. Check items off as you complete them.

---

## Milestone 3: Integration + System Testing

### Prerequisites — branch structure (group GitHub repo)

- [ ] **`main`** exists and holds the most stable, production-ready code (rename from `master` if needed).
- [ ] **`staging`** created from `main` — used for staging / systems & acceptance testing.
- [ ] **`develop`** created from `main` — aggregates all developers’ work for integration testing.
- [ ] **Feature branches** follow `feature/your-feature-name` (e.g. `feature/create-user`, `feature/login`).
- [ ] Branch protection / review rules set (if your instructor or group policy requires them).

### Contributor onboarding & remotes

- [ ] Every developer has pushed their work to the **group** repository (manual upload or Git).
- [ ] Each developer has configured remote, e.g. `git remote add <name> <GitHubGroupRepoURL>` and pushed their feature branch.
- [ ] Reference followed where helpful: [Adding an existing project to GitHub (CLI)](https://docs.github.com/en/github/importing-your-projects-to-github/adding-an-existing-project-to-github-using-the-command-line).

### Integration (group leader / integrator)

- [ ] **Appointed leader** merges each **feature branch** into **`develop`** via **Pull Requests** (one feature at a time, not all at once).
- [ ] Any **merge conflicts** resolved manually using the files/lines GitHub indicates.
- [ ] **`develop`** history shows clear, ordered merges (usable for grading).

### Local integration verification

- [ ] Group members **`git clone`** or **`git pull`** **`develop`** and run the app locally.
- [ ] **Integration testing** performed: application features + integrated components exercised together.

### System testing (web app minimum)

- [ ] **HTTP-level tests** in place or executed (e.g. API/routes, status codes, payloads).
- [ ] **Browser / UI tests** in place or executed (e.g. critical user flows, e2e if applicable).
- [ ] *(If stack were Laravel)* framework testing docs would apply; for **this React + Firebase** stack, document what you used (e.g. Jest/React Testing Library, Cypress, Playwright, Postman collections, etc.).

### Deliverables & grading artifacts

- [ ] Report submitted: **`<group#>_integrationTestReport.pdf`** (naming per instructor).
- [ ] **GitHub evidence** ready for grading: branches visible, merges into `develop`, meaningful **commit history**.

---

## Milestone 4: Staging Deployment and Acceptance Testing

### Precondition

- [ ] **All feature branches** are merged into **`develop`** before starting Milestone 4.

### Merge to staging

- [ ] **Pull Request**: merge **`develop`** → **`staging`** (not directly to `main` unless your rubric says otherwise).
- [ ] Conflicts **resolved** and merge **reviewed** before completing the PR.

### Semantic versioning (semver.org)

- [ ] Versioning scheme agreed: **major.minor.patch** (e.g. `1.0.0`).
- [ ] **Pre-release tags** for internal testing: **`vX.Y.Z-alpha.N`** (e.g. `v1.0.0-alpha.1`).
- [ ] **Pre-release tags** for beta: **`vX.Y.Z-beta.N`** (e.g. `v1.0.0-beta.1`).
- [ ] Each GitHub **Release** (or tag annotation) notes **changes**, **known issues**, and other relevant notes.

### CI/CD — deploy from `staging`

- [ ] **GitHub Actions** (or equivalent) workflow added: deploy when **`staging`** updates (or on tagged pre-releases, per your design).
- [ ] Pipeline deploys to chosen host (e.g. **Vercel**, **Render**, **Azure for Students**, or other with GitHub integration).
- [ ] **Secrets** (API keys, Firebase tokens, etc.) stored in GitHub **Secrets** / provider dashboard — not committed.

### Staging site

- [ ] **Staging app** is **publicly reachable** (URL works from the Internet).
- [ ] **Access details** documented (URL, test accounts if any, environment caveats) for instructors and beta testers.

### Acceptance testing — alpha & beta

- [ ] **Test plan** written for **alpha** (internal) phase.
- [ ] **Test plan** written for **beta** (external) phase.
- [ ] **Test cases** documented (steps, expected results, pass/fail).
- [ ] **Execute** tests on staging; **re-execute** after fixes (regression / sign-off cycles).
- [ ] **Beta feedback** collected systematically (e.g. embedded form, survey, or structured sheet).
- [ ] **Evidence** collected: screenshots, logs, exported feedback, summary of issues and resolutions.

### Documentation

- [ ] **`README.md`** updated with **staging environment** section: how it’s deployed, URL, branch (`staging`), versioning tags, and how to run tests or report issues.

### Expected outputs (rubric alignment)

- [ ] Codebase + docs updated on **group repo**.
- [ ] **Tagged** alpha and beta releases on GitHub with release notes.
- [ ] **Staging website** live with URL + access info shared as required.

---

## Quick reference — typical Git flow

| Branch    | Typical role                                      |
|-----------|---------------------------------------------------|
| `feature/*` | Individual work; PR → `develop`                 |
| `develop` | Integrated features; integration & system tests   |
| `staging` | Pre-production; CI/CD deploy; acceptance tests    |
| `main`    | Production-ready / stable                         |

---

*Tailor names (`<group#>_integrationTestReport.pdf`) and tooling to your instructor’s exact wording.*
