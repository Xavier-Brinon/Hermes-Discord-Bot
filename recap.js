// recap.js
// Recap-input helpers. parseTimeframe (pure: content + now → {daysBack,sinceTs,untilTs})
// is unit-tested (issue 6115cc3). fetchChannelHistory + scanChannelForLinks were moved
// here with the modularisation (issue 950dc54); they do Discord I/O (channel.messages.fetch)
// so they aren't pure. The orchestration around them (the <10-message extend-to-30-days
// fallback, the 200-message cap) stays in the handler.

'use strict';

const { LINK_PATTERN } = require('./config');

// French + English month names → 0-based month index. The capture regex below is
// Unicode-aware (`u` flag + `\p{L}+`) so accented French months (février, décembre,
// août) match, and it accepts both the French "mois …" and English "month of …"
// prefixes. Three bugs fixed in issue 3471651 (accented months fell through, English
// was unhandled, 'fevrier' mapped to January); behaviour is pinned by test/recap.test.js.
const MONTH_NAMES = {
  janvier: 0,
  février: 1,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  août: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11,
  decembre: 11,
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

// Parse a recap request into a timeframe. Returns { daysBack, sinceTs, untilTs }:
// month-based requests set absolute sinceTs/untilTs (ms) and leave daysBack at its
// default; relative/numeric requests set daysBack and leave the timestamps null.
function parseTimeframe(content, now) {
  let daysBack = 7; // default: 1 week
  let sinceTs = null,
    untilTs = null; // absolute timestamps for month-based requests

  // "mois de mai", "mois d'avril", "month of may" → only that month.
  // `\p{L}+` + the `u` flag captures accented month names; the prefix accepts both
  // the French "mois [d'|de] …" and the English "month of …".
  const monthMatch = content.match(/(?:mois\s+(?:d['e]|de\s+)?|month\s+of\s+)(\p{L}+)/iu);
  if (monthMatch && MONTH_NAMES[monthMatch[1].toLowerCase()] !== undefined) {
    const m = MONTH_NAMES[monthMatch[1].toLowerCase()];
    let year = now.getFullYear();
    if (m > now.getMonth()) year--; // future month → last year
    sinceTs = new Date(year, m, 1).getTime();
    untilTs = new Date(year, m + 1, 0, 23, 59, 59, 999).getTime(); // last day of month
  }
  // "mois dernier", "last month" → only last month
  else if (/mois\s+dernier|last\s+month/i.test(content)) {
    const lastM = now.getMonth() - 1;
    const year = lastM < 0 ? now.getFullYear() - 1 : now.getFullYear();
    const m = lastM < 0 ? 11 : lastM;
    sinceTs = new Date(year, m, 1).getTime();
    untilTs = new Date(year, m + 1, 0, 23, 59, 59, 999).getTime();
  }
  // "semaine dernière", "last week"
  else if (/semaine\s+dernière|dernière\s+semaine|last\s+week/i.test(content)) {
    daysBack = 7;
  }
  // "hier", "yesterday"
  else if (/\bhier\b|yesterday/i.test(content)) {
    daysBack = 1;
  }
  // "aujourd'hui", "today"
  else if (/\baujourd['e]hui\b|today/i.test(content)) {
    daysBack = 1;
  }
  // Numeric: "3 jours", "2 semaines", "5 days", "3 weeks"
  else {
    const dayMatch = content.match(/(\d+)\s*(jours?|days?|semaines?|weeks?)/i);
    if (dayMatch) {
      const num = parseInt(dayMatch[1]);
      const unit = dayMatch[2].toLowerCase();
      daysBack = unit.startsWith('semaine') || unit.startsWith('week') ? num * 7 : num;
    }
  }

  return { daysBack, sinceTs, untilTs };
}

// Scan recent channel messages for links (fallback when the link cache is empty).
async function scanChannelForLinks(channel) {
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const links = [];
    for (const [, msg] of messages) {
      if (msg.author.bot) continue;
      const found = msg.content.match(LINK_PATTERN);
      if (found) {
        for (const link of found) {
          links.push({ url: link, author: msg.author.tag, content: msg.content.substring(0, 200) });
        }
      }
    }
    return links;
  } catch (e) {
    console.error('Failed to scan channel for links:', e.message);
    return [];
  }
}

// Fetch channel history for a given time range.
// Accepts either { daysBack } (relative to now) or { since, until } (absolute ms timestamps).
async function fetchChannelHistory(channel, opts = {}) {
  try {
    let since, until;
    if (opts.since && opts.until) {
      since = opts.since;
      until = opts.until;
    } else {
      const daysBack = opts.daysBack || 7;
      since = Date.now() - daysBack * 24 * 60 * 60 * 1000;
      until = Date.now();
    }
    const sinceDate = new Date(since).toISOString();
    const untilDate = new Date(until).toISOString();
    console.log(`📜 Fetching history for #${channel.name}, range: ${sinceDate} → ${untilDate}`);
    const allMessages = [];
    let lastId = null;
    let fetched = 0;
    let stopped = false;

    while (!stopped) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;

      const batch = await channel.messages.fetch(options);
      if (batch.size === 0) {
        console.log(`📜 No more messages returned by API (fetched ${fetched} total)`);
        break;
      }

      const firstMsg = batch.first();
      const lastMsg = batch.last();
      console.log(
        `📜 Batch: ${batch.size} msgs, range: ${new Date(lastMsg.createdTimestamp).toISOString()} → ${new Date(firstMsg.createdTimestamp).toISOString()}`
      );

      // If the NEWEST message in this batch is already older than cutoff, stop
      if (firstMsg.createdTimestamp < since) {
        console.log(`📜 Entire batch is older than cutoff, stopping`);
        break;
      }

      for (const [, msg] of batch) {
        if (msg.createdTimestamp < since) {
          // This message is too old, skip it but keep going through the batch
          continue;
        }
        if (msg.createdTimestamp > until) {
          // This message is too new (future batches will cover it), skip
          continue;
        }
        allMessages.push({
          author: msg.author.tag,
          content: msg.content.substring(0, 500),
          timestamp: msg.createdAt.toISOString(),
          hasLinks: LINK_PATTERN.test(msg.content),
          isBot: msg.author.bot,
        });
      }

      lastId = batch.last().id;
      fetched += batch.size;
      console.log(
        `📜 Collected ${allMessages.length} in-window messages so far (${fetched} total fetched)...`
      );

      // Safety limit: max 5000 messages fetched
      if (fetched >= 5000) {
        console.log(`📜 Hit safety limit of 5000 messages`);
        break;
      }
    }

    console.log(`📜 Done: ${allMessages.length} messages in window`);
    return allMessages.reverse();
  } catch (e) {
    console.error('Failed to fetch channel history:', e.message);
    return [];
  }
}

module.exports = { MONTH_NAMES, parseTimeframe, scanChannelForLinks, fetchChannelHistory };
