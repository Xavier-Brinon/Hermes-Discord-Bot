// jorf.js
// Today's Journal officiel as a list of facts for the daily government recap (issue abe7824,
// epic b982ce8, ADR docs/adr/0002). The source is DILA's anonymous JORFSIMPLE open-data dump:
// a directory listing plus one small .tar.gz per increment, with one flat XML per text. No
// token, no scraping. Légifrance itself sits behind a bot challenge, so the bot never browses
// it; Hermes only writes French text from the facts returned here.
// Source details: docs/research/french-gov-activity-sources.org §1.
//
// Two outcomes must stay distinct. "No JO today" (Monday, the day after a public holiday) is a
// normal empty result. A failed download is an exception. The recap posts a joke on a quiet
// Wednesday, and a network error must not be reported as a government that did nothing.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const JORF_BASE_URL = 'https://echanges.dila.gouv.fr/OPENDATA/JORFSIMPLE/';
const TIMEOUT_JORF = 60000; // 60s per HTTP request or tar run; a night file is 50-180 KB

// Natures worth reporting. Everything else (arrêtés, avis, décisions, annonces…) is dropped.
const KEPT_NATURES = new Set(['LOI', 'ORDONNANCE', 'DECRET']);

// Today's date in Paris as YYYYMMDD, the stamp DILA puts in its file names. The VPS clock runs
// in UTC, and the two disagree for an hour or two around midnight.
function parisYmd(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' })
    .format(date)
    .replaceAll('-', '');
}

// The night increment for `ymd` named in the DILA directory listing, or null when there is none.
// The night file is stamped 00h-02h Paris (`JORFSIMPLE_<ymd>-00xxxx`) and carries that day's JO.
// Later files the same day (a midday fix, the ~21h enrichment) re-deliver texts already sent, so
// the `-0` hour prefix is what keeps them out. Pure.
function nightFileName(listingHtml, ymd) {
  const match = String(listingHtml).match(new RegExp(`JORFSIMPLE_${ymd}-0\\d{5}\\.tar\\.gz`));
  return match ? match[0] : null;
}

// XML's five predefined entities; the files are UTF-8, so nothing else is escaped. &amp; goes
// last so `&amp;lt;` decodes to the literal `&lt;`, not to `<`.
function decodeXml(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

// One JORFTEXT file's metadata. Only the header, before <NOTICE>, is read: the articles further
// down carry their own <NUM> elements, and an individual décret has an empty header <NUM/> that
// a whole-file match would wrongly fill with an article number. Missing fields are ''. Pure.
function parseJorfText(xml) {
  const head = String(xml).split('<NOTICE')[0];
  const field = (tag) => {
    const m = head.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return m ? decodeXml(m[1]).trim() : '';
  };
  return {
    id: field('ID'),
    nature: field('NATURE'),
    num: field('NUM'),
    sequence: Number(field('NUM_SEQUENCE')) || 0,
    nor: field('NOR'),
    title: field('TITREFULL'),
    ministry: field('MINISTERE'),
    url: field('ID_ELI'),
  };
}

// Whether a parsed text belongs in the recap. A loi, an ordonnance or a décret, and:
// - numbered. Unnumbered décrets ("Décret du …") are individual measures: nominations,
//   magistrates' postings, naturalisations, délégations de signature. Checked on 9 night files
//   (7-16 Oct 2026): all 49 unnumbered décrets were individual measures, and the numbered ones
//   kept ran 2026-929 to 2026-959 with no gap.
// - not a rectificatif, which corrects a text published earlier and is not news.
// Pure.
function isReportable(text) {
  return KEPT_NATURES.has(text.nature) && text.num !== '' && !/\(rectificatif\)$/i.test(text.title);
}

// XML strings → reportable facts in JO order. Pure.
function filterFacts(xmls) {
  return xmls
    .map(parseJorfText)
    .filter(isReportable)
    .sort((a, b) => a.sequence - b.sequence);
}

// The Licence Ouverte v2.0 credit the recap post must carry: DILA, the file's full URL, and its
// name and date (DILA fiche JORF). French, because it is posted to Discord. Pure.
function attribution(fileName) {
  const [, y, m, d] = fileName.match(/_(\d{4})(\d{2})(\d{2})-/);
  return (
    `Source : DILA, Journal officiel, fichier ${fileName} du ${d}/${m}/${y} ` +
    `(${JORF_BASE_URL}${fileName}), Licence Ouverte v2.0.`
  );
}

// Every JORFTEXT XML under `dir`, as strings. The archive nests them under the container's
// directory tree, so the walk is recursive.
function readTextFiles(dir) {
  return fs
    .readdirSync(dir, { recursive: true })
    .filter((f) => /JORFTEXT\d+\.xml$/.test(f))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
}

// Unpack `archive` into a temporary directory and return its facts. Uses the system tar through
// execFile, never exec (AGENTS.md); Node has no built-in tar reader.
async function readNightFile(archive) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jorf-'));
  try {
    await new Promise((resolve, reject) => {
      execFile(
        'tar',
        ['-xzf', archive, '-C', dir],
        { timeout: TIMEOUT_JORF },
        (error, _o, stderr) => (error ? reject(new Error(stderr || error.message)) : resolve())
      );
    });
    return filterFacts(readTextFiles(dir));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

async function download(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_JORF) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}

// Facts from the JO published on `date` (Paris), as `{ facts, attribution }`. A day without a JO
// gives no facts and no attribution. Throws when DILA cannot be reached or the archive cannot be
// read; see the file header for why that is not folded into an empty result.
async function fetchJorfFacts(date = new Date()) {
  const listing = await (await download(JORF_BASE_URL)).text();
  const fileName = nightFileName(listing, parisYmd(date));
  if (!fileName) {
    console.log(`🏛️ JO: no night file for ${parisYmd(date)}`);
    return { facts: [], attribution: null };
  }

  const archive = path.join(os.tmpdir(), `${process.pid}-${fileName}`);
  try {
    const body = Buffer.from(await (await download(JORF_BASE_URL + fileName)).arrayBuffer());
    fs.writeFileSync(archive, body);
    const facts = await readNightFile(archive);
    console.log(`🏛️ JO ${fileName}: ${facts.length} text(s) kept`);
    return { facts, attribution: attribution(fileName) };
  } finally {
    fs.rmSync(archive, { force: true });
  }
}

module.exports = {
  parisYmd,
  nightFileName,
  parseJorfText,
  isReportable,
  filterFacts,
  attribution,
  readNightFile,
  fetchJorfFacts,
};
