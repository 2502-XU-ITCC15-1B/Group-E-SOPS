# TODO

- [x] Inspect current code for AuthContext, App theme sync, AdminPanel/MemberProfile dark mode, Navigation notifications, CSP, and roleAudit function.
- [x] Fix AuthContext compile issues and refactor to stable hooks usage (replaced file with corrected content).
- [x] Same-tab dark mode sync: App.js now listens to `theme-change` in addition to `storage`.
- [x] Remove/centralize dark mode sync in AdminPanel.js and MemberProfile.js by subscribing to both `storage` and `theme-change`.
- [x] Tighten CSP in firebase.json by removing `https:` from `default-src`.
- [x] Navigation.js: replace notifications polling (`setInterval`/`getDocs`) with Firestore `onSnapshot` real-time listener.
- [x] Navigation.js: update Firestore imports accordingly.
- [ ] Verify functions/index.js: confirm roleAudit uses correct `oldRole` ordering (likely already correct).
- [ ] Confirm/ensure firebase/config.js env placeholders via frontend/.env.example and repo root .gitignore entries.
- [ ] Ensure Navigation.js no longer imports unused `getDocs` after onSnapshot change (manual check).
- [ ] Build frontend and ensure it completes successfully.
- [ ] Final verification pass: run build again if needed after any remaining edits.

