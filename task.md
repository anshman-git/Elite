# EliteStudy Revamp Task List

- [x] Fix critical compile & navigation bugs
  - [x] Fix `writeBatch` name collision build error in `src/firebase.js`
  - [x] Fix duplicate Admin tab bug in `src/components/navigation.jsx`
- [x] Resolve ESLint warnings and errors
  - [x] Hoist `Metric` and fix `confirm` calls in `src/screens/Admin.jsx`
  - [x] Fix `useEffect` state synchronization and memo dependency warnings in `src/screens/Profile.jsx`
  - [x] Fix state setters inside `useEffect` in `src/screens/Quizzes.jsx`
- [x] Upgrade UI components & design styles
  - [x] Refactor Toast system to support colored success/error alerts in `src/components/ui.jsx`
  - [x] Upgrade Card styling to include soft shadow glows and hover effects
- [x] Revamp pages (LeetCode/G4G style)
  - [x] **Dashboard**: Standout "Daily Challenge" card, XP progress ring indicators, themed metrics
  - [x] **Quizzes Screen**: Left pane question navigator, right pane active question workspace, responsive option clicks
  - [x] **Leaderboard Screen**: Golden/Silver/Bronze trophies, spotlight bars, list animations
  - [x] **Performance Screen**: Refined statistics cards, responsive progress chart bars
- [x] Build & verification
  - [x] Run `npm run lint` to verify clean code compliance
  - [x] Run `npm run build` to verify successful client bundling
