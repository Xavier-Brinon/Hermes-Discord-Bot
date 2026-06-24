---
artifact_type: verification_matrix
task_id: dotenvx-runtime-dep
timestamp: 2026-06-24T10:55:02Z
complexity_score: 1
complexity_tier: TRIVIAL
---

## Minimal variant (TRIVIAL only)

- Pass: `@dotenvx/dotenvx` is declared under `dependencies` (not `devDependencies`)
  in `package.json`, and `package-lock.json` no longer marks it `dev: true`, so
  `npm ci --omit=dev` resolves it.

## Observed outcome

- PASS — `package.json` `dependencies` includes `@dotenvx/dotenvx`;
  `devDependencies` is now absent. `package-lock.json`: `dev` flag on
  `node_modules/@dotenvx/dotenvx` is `undefined` (cleared); root `dependencies`
  lists it; root `devDependencies` is `null`. Verified via `node -e`.

## Orthogonal finding (not in scope, recorded per Skill C discipline)

Regenerating `package-lock.json` (required for `npm ci` sync) also pruned 19
entries present in the lock but undeclared in `package.json`: the `ts-node` /
`typescript` toolchain (`ts-node`, `typescript`, `@tsconfig/*`, `acorn`,
`acorn-walk`, `arg`, `create-require`, `diff`, `make-error`, `yn`,
`v8-compile-cache-lib`, `@cspotcode/source-map-support`, `@jridgewell/*`) and a
stale `hermes-agent`. None are `require()`d by the bot (it shells out to the
`hermes` binary via `execFile`; the code is plain CommonJS). The prune is a
necessary consequence of producing a consistent lockfile, not a chosen change.
Candidate for its own issue if the drift's origin needs investigation.
