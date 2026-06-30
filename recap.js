// recap.js
// Pure recap-input helpers. parseTimeframe lifts the timeframe date-math out of the
// recap handler in hermes-discord-bot-clean.js (issue 6115cc3) so it can be unit-tested.
// The impure parts (fetchChannelHistory, the <10-message extend-to-30-days fallback,
// the 200-message cap) stay in the handler. Given `content` + `now`, this is pure.

'use strict';

// French + English month names → 0-based month index.
// Pre-existing quirks carried over verbatim from the inline block (issue 6115cc3,
// Orthogonal Issues) — preserved here, fixed in a separate behaviour-changing follow-up:
//   1. 'février'/'fevrier' map to 0 (January), not 1. Only the ASCII 'fevrier' is
//      reachable (see quirk 2); the English 'february' is correct (1).
//   2. The match regex below uses `\w+` with no `u` flag, so accented month names
//      (février, décembre, août) capture only up to the accent and never match —
//      they silently fall through to the default window. ASCII spellings work.
//   3. The regex requires the French "mois …"; English "month of X" is not handled.
const MONTH_NAMES = {
  'janvier':0,'février':0,'fevrier':0,'mars':2,'avril':3,'mai':4,'juin':5,
  'juillet':6,'aout':7,'août':7,'septembre':8,'octobre':9,'novembre':10,
  'décembre':11,'decembre':11,
  'january':0,'february':1,'march':2,'april':3,'may':4,'june':5,
  'july':6,'august':7,'september':8,'october':9,'november':10,'december':11
};

// Parse a recap request into a timeframe. Returns { daysBack, sinceTs, untilTs }:
// month-based requests set absolute sinceTs/untilTs (ms) and leave daysBack at its
// default; relative/numeric requests set daysBack and leave the timestamps null.
function parseTimeframe(content, now) {
  let daysBack = 7; // default: 1 week
  let sinceTs = null, untilTs = null; // absolute timestamps for month-based requests

  // "mois de mai", "mois d'avril", "month of may" → only that month
  const monthMatch = content.match(/mois\s+(d['e]|de\s+)?(\w+)/i);
  if (monthMatch && MONTH_NAMES[monthMatch[2].toLowerCase()] !== undefined) {
    const m = MONTH_NAMES[monthMatch[2].toLowerCase()];
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

module.exports = { MONTH_NAMES, parseTimeframe };
