'use strict';

// Journal officiel fetch + filter (issue abe7824). No network: the listing lines below and the
// tarball in fixtures/jorf/ are real DILA JORFSIMPLE data, saved unmodified. The tarball is the
// night file of 10 Oct 2026 (75 texts): 7 numbered décrets, a loi and a décret rectificatif,
// 6 unnumbered (individual) décrets, arrêtés, avis and one text with an empty NATURE.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const {
  parisYmd,
  nightFileName,
  parseJorfText,
  isReportable,
  filterFacts,
  attribution,
  readNightFile,
} = require('../jorf');

const FIXTURE = path.join(__dirname, 'fixtures', 'jorf', 'JORFSIMPLE_20261010-002617.tar.gz');

// Real lines from https://echanges.dila.gouv.fr/OPENDATA/JORFSIMPLE/ (16 Oct 2026). 12 Oct is a
// Monday: no JO, so only an evening file. 15 Oct has a night, a midday and an evening file.
const LISTING = `
<a href="JORFSIMPLE_20261010-002617.tar.gz">JORFSIMPLE_20261010-002617.tar.gz</a> 2026-10-10 00:26  104K
<a href="JORFSIMPLE_20261010-211641.tar.gz">JORFSIMPLE_20261010-211641.tar.gz</a> 2026-10-10 21:19  928K
<a href="JORFSIMPLE_20261012-212534.tar.gz">JORFSIMPLE_20261012-212534.tar.gz</a> 2026-10-12 21:30  3.0M
<a href="JORFSIMPLE_20261015-004729.tar.gz">JORFSIMPLE_20261015-004729.tar.gz</a> 2026-10-15 00:47  111K
<a href="JORFSIMPLE_20261015-122925.tar.gz">JORFSIMPLE_20261015-122925.tar.gz</a> 2026-10-15 12:30   54K
<a href="JORFSIMPLE_20261015-214025.tar.gz">JORFSIMPLE_20261015-214025.tar.gz</a> 2026-10-15 21:44  1.9M
`;

// --- parisYmd ---------------------------------------------------------------

test('parisYmd — uses the Paris date, not the UTC one', () => {
  // 23:30 UTC on 15 Oct is already 16 Oct in Paris (UTC+2 in October).
  assert.equal(parisYmd(new Date('2026-10-15T23:30:00Z')), '20261016');
  assert.equal(parisYmd(new Date('2026-10-16T07:00:00Z')), '20261016');
  // Winter time, UTC+1.
  assert.equal(parisYmd(new Date('2026-12-31T23:30:00Z')), '20270101');
});

// --- nightFileName ----------------------------------------------------------

test('nightFileName — picks the night increment and ignores midday and evening files', () => {
  assert.equal(nightFileName(LISTING, '20261010'), 'JORFSIMPLE_20261010-002617.tar.gz');
  assert.equal(nightFileName(LISTING, '20261015'), 'JORFSIMPLE_20261015-004729.tar.gz');
});

test('nightFileName — a day with only an evening file has no JO', () => {
  assert.equal(nightFileName(LISTING, '20261012'), null);
});

test('nightFileName — a day absent from the listing has no JO', () => {
  assert.equal(nightFileName(LISTING, '20261013'), null);
  assert.equal(nightFileName('', '20261010'), null);
});

// --- parseJorfText ----------------------------------------------------------

// Header of a real unnumbered décret (JORFTEXT000054979766, 14 Oct 2026), cut after its first
// article. The empty header <NUM/> must stay empty even though an article <NUM> follows.
const INDIVIDUAL_DECRET = `<?xml version="1.0" encoding="UTF-8"?>
<TEXTE>
<ID>JORFTEXT000054979766</ID>
<ANCIEN_ID/>
<ORIGINE>JORF</ORIGINE>
<NATURE>DECRET</NATURE>
<NUM/>
<NUM_PARUTION>0240</NUM_PARUTION>
<NUM_SEQUENCE>14</NUM_SEQUENCE>
<NOR>INTP2624230D</NOR>
<TITREFULL>Décret du 13 octobre 2026 portant nomination du sous-préfet de Riom - M. CARDOUAT (Thierry)</TITREFULL>
<MINISTERE>Ministère de l'intérieur</MINISTERE>
<NOTICE>
<CONTENU/>
</NOTICE>
<STRUCT><ARTICLE><NUM>1</NUM></ARTICLE></STRUCT>
</TEXTE>`;

test('parseJorfText — reads the header only, so an article <NUM> does not leak in', () => {
  const t = parseJorfText(INDIVIDUAL_DECRET);
  assert.equal(t.num, '');
  assert.equal(t.nature, 'DECRET');
  assert.equal(t.sequence, 14);
  assert.equal(t.url, '');
  assert.equal(t.ministry, "Ministère de l'intérieur");
});

test('parseJorfText — decodes XML entities', () => {
  const t = parseJorfText(
    '<TEXTE><TITREFULL>Décret relatif à la R&amp;D &amp;lt;x&gt;</TITREFULL>'
  );
  assert.equal(t.title, 'Décret relatif à la R&D &lt;x>');
});

// --- isReportable -----------------------------------------------------------

const numbered = { nature: 'DECRET', num: '2026-959', title: 'Décret n° 2026-959 du …' };

test('isReportable — numbered loi, ordonnance and décret are kept', () => {
  assert.equal(isReportable(numbered), true);
  assert.equal(isReportable({ ...numbered, nature: 'LOI' }), true);
  assert.equal(isReportable({ ...numbered, nature: 'ORDONNANCE' }), true);
});

test('isReportable — other natures, unnumbered texts and rectificatifs are dropped', () => {
  assert.equal(isReportable({ ...numbered, nature: 'ARRETE' }), false);
  assert.equal(isReportable({ ...numbered, nature: '' }), false);
  assert.equal(isReportable({ ...numbered, num: '' }), false);
  assert.equal(
    isReportable({ ...numbered, title: 'LOI n° 2026-103 de finances (rectificatif)' }),
    false
  );
});

test('filterFacts — keeps JO order', () => {
  const xml = (seq, num) =>
    `<TEXTE><NATURE>DECRET</NATURE><NUM>${num}</NUM><NUM_SEQUENCE>${seq}</NUM_SEQUENCE><NOTICE>`;
  assert.deepEqual(
    filterFacts([xml(9, 'b'), xml(2, 'a'), INDIVIDUAL_DECRET]).map((t) => t.num),
    ['a', 'b']
  );
});

// --- attribution ------------------------------------------------------------

test('attribution — names DILA, the licence, and the file with its URL and date', () => {
  assert.equal(
    attribution('JORFSIMPLE_20261010-002617.tar.gz'),
    'Source : DILA, Journal officiel, fichier JORFSIMPLE_20261010-002617.tar.gz du 10/10/2026 ' +
      '(https://echanges.dila.gouv.fr/OPENDATA/JORFSIMPLE/JORFSIMPLE_20261010-002617.tar.gz), ' +
      'Licence Ouverte v2.0.'
  );
});

// --- readNightFile on the real sample ---------------------------------------

test('readNightFile — the 10 Oct 2026 JO gives its 7 numbered décrets, in JO order', async () => {
  const facts = await readNightFile(FIXTURE);
  assert.deepEqual(
    facts.map((t) => t.num),
    ['2026-937', '2026-938', '2026-939', '2026-940', '2026-941', '2026-942', '2026-943']
  );
  for (const t of facts) {
    assert.equal(t.nature, 'DECRET');
    assert.match(t.url, /^https:\/\/www\.legifrance\.gouv\.fr\/eli\/decret\//);
    assert.ok(t.title.startsWith(`Décret n° ${t.num} `), t.title);
    assert.ok(t.nor && t.ministry, t.id);
  }
});

test('readNightFile — a broken archive rejects instead of returning no facts', async () => {
  await assert.rejects(readNightFile(__filename));
});
