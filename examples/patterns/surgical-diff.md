# Gold Standard: Surgical Diff

**Principle:** *"Change only what solves the problem."* A bug fix should
change the buggy line. A feature should touch only the files the feature
needs. Drive-by cleanups live in their own commit.

**Applies when:** You are modifying existing code — fixing a bug, patching
behaviour, adjusting a constant.

## Before (naive)

```diff
- function totalPrice(items) {
-   return items.reduce((sum, i) => sum + i.price, 0);
- }
+ /**
+  * Compute the total price of a basket.
+  * @param items - List of purchasable items
+  * @returns the rounded total
+  */
+ export function totalPrice(items: Item[]): number {
+   if (!items || items.length === 0) return 0;
+   const total = items.reduce((sum, i) => sum + (i?.price ?? 0), 0);
+   return Math.round(total * 100) / 100;
+ }
```

The ticket said "bug: totalPrice returns NaN when an item has no price".
Look at everything else that got dragged in: types, JSDoc, null check,
rounding, `export` change. Each of those is a legitimate improvement —
and each of them is a new risk.

## After (gold standard)

```diff
  function totalPrice(items) {
-   return items.reduce((sum, i) => sum + i.price, 0);
+   return items.reduce((sum, i) => sum + (i.price ?? 0), 0);
  }
```

One line changed, matching the one line specified in the bug report.

## Why this is simple

- **The diff matches the ticket.** A reviewer can check "does this diff fix
  the reported NaN?" without reading anything else.
- **Revertability.** If the fix causes a regression, `git revert` restores
  exactly the previous behaviour in every other dimension.
- **Separation of concerns over time.** Types, rounding, and the `export`
  change are each better-suited to their own commits, where each can be
  reviewed on its merits.

## Related anti-pattern

See `examples/anti-patterns/god-object.md` for the extreme version — a
change that accretes responsibilities because "while I'm here..."
