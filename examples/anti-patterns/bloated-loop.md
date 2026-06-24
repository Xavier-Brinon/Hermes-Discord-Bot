# Anti-Pattern: Bloated Loop

**Principle violated:** *"Prefer the obvious form."*
**Fix:** See `examples/patterns/simple-loop.md`.

## The Bad Code

```js
// Nested loops, flag variables, commented-out branches, and a helpful TODO.
let totalActive = 0;
let found = false;
for (let i = 0; i < users.length; i++) {
  // TODO: handle pagination someday?
  for (let j = 0; j < 1; j++) {    // defensive: in case users becomes nested
    const u = users[i];
    if (u && u.isActive === true && u.score != null) {
      // if (u.tier === 'gold') { ... } // disabled pending product decision
      totalActive = totalActive + u.score;
      found = true;
    }
  }
}
if (!found) totalActive = 0;  // redundant: 0 already
```

## Why this is problematic

- **Ghost loops.** The inner `for (let j = 0; j < 1; j++)` runs exactly once
  and exists "in case" — defensive code for a scenario that isn't real.
- **Dead code preserved.** The commented-out tier check creates a reader tax
  forever: every future reader must decide whether to re-enable it.
- **Redundant guards.** `!found → totalActive = 0` is a no-op; the variable
  was already 0.
- **Over-checked inputs.** `u && u.isActive === true && u.score != null`
  guards against three impossibilities instead of documenting what the
  collection contract actually is.

## How it bloats over time

- **Maintenance.** Each defensive branch becomes load-bearing in readers' minds
  even though it never fires. Removing them requires a conversation months
  later: "are we sure?"
- **Debugging.** When the real bug arrives, it hides between three guards and
  two comments. The actual failure mode is obscured.
- **Review drag.** PRs touching this code have to relitigate every dead branch.

## The fix

Delete the dead code. Collapse the ghost loop. Trust your collection
contract. See `examples/patterns/simple-loop.md` for the 3-line equivalent
that does the same work.
