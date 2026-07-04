**Issue / task:**

<!-- Link the GitHub issue or task this PR addresses (e.g. H-07, T-04, UC-AUTH-17). -->


## Description

<!-- What changed and why. Keep it focused on the user-facing or behavioural impact. -->


## Checklist

- [ ] Node v22 gate passed before install/test (`nvm use`; `.nvmrc` = 22).
- [ ] `npm test` (jest) is green for the affected area.
- [ ] `npm run lint` and `npm run lint:style` are clean.
- [ ] `npm run check:lazy` and `npm run check:canon` pass (no `React.lazy` except deliberate code-splitting).
- [ ] Native-adaptation premise respected: no `@progress/*` runtime dependency added; per-file attribution on any component adapted from a reference package.
- [ ] Commits follow the Tim Pope style (imperative subject, capitalized, no trailing period); this PR targets `develop`.
- [ ] For UI changes: screenshots attached in both light and dark modes.
- [ ] No secrets or tokens committed; auth remains session-only (no JWT in localStorage/sessionStorage).
