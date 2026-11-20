# Anti-Pattern: God Object

**Principle violated:** *"Change only what solves the problem."* (and
*"Smallest surface area."*)
**Fix:** Split into single-purpose modules. See
`examples/patterns/surgical-diff.md` for the surgical-change mindset.

## The Bad Code

```ts
// One class that does user CRUD, auth, notifications, billing, logging.
export class UserManager {
  createUser(data) { /* ... */ }
  updateUser(id, data) { /* ... */ }
  deleteUser(id) { /* ... */ }
  authenticate(email, password) { /* ... */ }
  hashPassword(pw) { /* ... */ }
  issueToken(user) { /* ... */ }
  sendWelcomeEmail(user) { /* ... */ }
  sendPasswordResetEmail(user) { /* ... */ }
  chargeSubscription(user, plan) { /* ... */ }
  issueRefund(user, amount) { /* ... */ }
  logEvent(kind, meta) { /* ... */ }
  buildAuditReport() { /* ... */ }
  // ... 8 more methods
}
```

## Why this is problematic

- **Four concerns, one class.** CRUD, auth, comms, billing, audit — each
  belongs to a different domain with different change cadences.
- **Testing cost.** To unit-test `createUser` you must mock an email sender,
  a payment gateway, a logger, and a token issuer. The blast radius of a
  stub decision is enormous.
- **Change amplification.** A billing-provider swap touches the same file as
  an email-template tweak. Reviewers, CI runs, and merge conflicts all pay
  the tax.
- **Incentive to pile on.** Once `UserManager` exists, every new user-related
  feature has a gravitational home here. The class grows monotonically.

## How it bloats over time

- **Maintenance.** The file becomes 2000+ lines. IDEs slow down. New
  engineers take a week to locate the method they need to change.
- **Debugging.** A bug in `sendWelcomeEmail` forces a check on every other
  method that shares `this.state`.
- **Review drag.** Every unrelated PR looks like it "might affect users" and
  pulls in the same three reviewers.

## The fix

Extract along concern lines — one module per responsibility:

```ts
// user/repository.ts  — createUser / updateUser / deleteUser
// auth/service.ts     — authenticate / hashPassword / issueToken
// notifications/ts    — sendWelcomeEmail / sendPasswordResetEmail
// billing/service.ts  — chargeSubscription / issueRefund
// audit/log.ts        — logEvent / buildAuditReport
```

Each module is independently testable, independently deployable (at the
module-boundary level), and independently readable.
