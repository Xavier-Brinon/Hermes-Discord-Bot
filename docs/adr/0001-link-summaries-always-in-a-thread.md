---
status: accepted
date: 2026-09-25
issue: f16ff0f
---

# Link summaries always post in a thread

A 📝 link summary always opens a thread on the linked message (named after the link's
embed title) and posts the summary and its ❓ questions there, however short the summary
is. The channel keeps only the member's link message, so it stays readable, and the
thread is where people talk about the article. The alternative, threading only when the
summary is too long for one message, made the choice depend on length rather than
purpose. Once the questions moved out of the summary body (issue 576af84), most summaries
fit in one message and ended up in the channel along with their question replies.

## Consequences

- **Already in a thread or a DM:** the summary stays where it is (the placeholder is
  edited in place). Discord can't nest threads and DMs have none.
- **Message already has a thread** (a member started one): the summary goes into that
  thread instead of failing.
- **The "🔄 Je récupère…" placeholder** still appears in the channel while Hermes works,
  and is deleted when the summary is posted. The channel ends up clean.
- **Follow-ups in the thread:** the thread gets the summary's cached link. A ❓ question,
  when there is one, records the summary's Hermes session on the thread. An @mention
  there has the article in context.
- **Out of scope:** @mention Q&A answers, including a link @mentioned to the bot. They
  still thread only when they are too long. A question is a conversation with the asker,
  not a post for the whole channel.
