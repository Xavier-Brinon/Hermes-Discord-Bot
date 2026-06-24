# Gold Standard: Simple Loop

**Principle:** *"Prefer the obvious form."* Use direct iteration when direct
iteration is what you need. Reach for functional pipelines only when the
intermediate stages carry their own meaning.

**Applies when:** You need to iterate over a collection and do something with
each item — filter, accumulate, or side-effect.

## Before (naive)

```js
// A reducer chain dressed up as cleverness.
const totalActive = users
  .reduce((acc, u) => (u.isActive ? acc.concat([u]) : acc), [])
  .reduce((acc, u) => acc + u.score, 0);
```

## After (gold standard)

```js
// A loop that says exactly what it does.
let totalActive = 0;
for (const user of users) {
  if (user.isActive) totalActive += user.score;
}
```

## Why this is simple

- **One pass, one intent.** The reader learns "sum active users' scores" in
  three lines. The reducer version hides that behind two reducers and one
  array allocation.
- **No allocation.** The naive version builds a throwaway filtered array.
  The loop version accumulates directly.
- **No points-free puzzle.** `reduce((acc, u) => …)` reads like a riddle.
  `for (const user of users)` reads like a sentence.

## When NOT to use this pattern

If the intermediate filtered list is itself a useful value (e.g. returned
elsewhere), do filter first. This pattern is for the common case where the
intermediate is a local throwaway.
