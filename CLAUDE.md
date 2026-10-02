# Project contract — BenimKasam
Use the user-level SafeCargo Factory Manager and registry under ~/.claude. Do not copy global agents/skills into this repository; project-specific ones live in .claude/agents and .claude/skills. Follow existing project rules and user scope.

- Product/actors/platforms: docs/ai/PROJECT.md (personal currency/gold vault tracker, Turkish UI; Android live, iOS in review, web/PWA)
- Stack/package manager: factory profile below; npm with package-lock.json
- Commands (cwd: repo root): `npm run dev`, `npm run lint`, `npm run build`, `npm run preview`, `npx cap sync`. No unit/e2e test script; last results in docs/ai/TEST_STATUS.md
- Invariants, trust boundaries and modules: docs/ai/ARCHITECTURE.md
- Current milestone/baseline/evidence: docs/ai/CURRENT_STATE.md
- Multi-task graph: docs/ai/TASKS.json; durable choices: docs/ai/DECISIONS.md
- Release target and authorization: preparation only. Store uploads, `firebase deploy`, RTDB `config` writes, Vercel env changes and `git push` need explicit authorization.

This repository is public: never commit secret values, credentials or user data, and never migrate frameworks as a side effect.

@.claude/factory-project.md
