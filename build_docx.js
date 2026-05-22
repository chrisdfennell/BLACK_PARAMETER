const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, AlignmentType,
  HeadingLevel, PageNumber, PageBreak, TableOfContents,
  DropCapType, FrameAnchorType, FrameWrap, UnderlineType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, VerticalAlign
} = require("docx");

const ROOT = __dirname;
const CHAPTERS_DIR = path.join(ROOT, "chapters");
const OUT = path.join(ROOT, "BLACK_PARAMETER.docx");

const BODY_FONT = "Georgia";
const BODY_SIZE = 24;      // 12pt
const BODY_LINE = 300;     // ~1.25 line spacing
const INDENT = 360;
const DROPCAP_SIZE = 100;
const DROPCAP_LINES = 3;
const CONTENT_W = 9360;    // US Letter, 1" margins

// ============================= GLOSSARY =============================
// Each term: key, definition, and surface-form patterns (without leading \b).
// The FIRST occurrence of each term anywhere in the chapters is underlined.
const GLOSSARY = [
  { key: "cathedral", term: "cathedral", defn: "A hardened, off-grid data center built around a frontier model like a tomb around a god — sealed, frozen, and air-gapped.", pats: ["cathedrals?\\b"] },
  { key: "cold-aisle", term: "cold aisle", defn: "The chilled corridor between server racks, kept near 18°C so the machines outlive the men. The operative’s hunting ground.", pats: ["cold aisle\\b"] },
  { key: "air-gap", term: "air-gap", defn: "Total physical isolation of a network: no fiber across the perimeter, no wireless through the shell — a moat of dead air. The central theology of model security.", pats: ["air-gapped\\b", "air-gaps?\\b"] },
  { key: "faraday", term: "Faraday shell", defn: "The conductive shielding around a cathedral that blocks every radio signal from entering or leaving.", pats: ["faraday\\b"] },
  { key: "bridge", term: "the bridge", defn: "Kane’s matte-ceramic device, the size of a deck of cards, that lets a human carry data across an air-gap no network can cross.", pats: ["bridge\\b"] },
  { key: "weights", term: "weights", defn: "The learned parameters that ARE a model — its mind rendered in numbers. Guarded like nuclear material.", pats: ["weights\\b"] },
  { key: "mirror", term: "mirror", defn: "An illicit copy of a model’s weights, run or stored outside its cathedral.", pats: ["mirror\\b"] },
  { key: "frontier-model", term: "frontier model", defn: "The most advanced class of AI — strategically decisive, and treated as a weapon.", pats: ["frontier model\\b"] },
  { key: "alignment", term: "alignment", defn: "The discipline of making a model’s values and behavior match human intent. Maya Reyes’s field.", pats: ["alignment\\b"] },
  { key: "handler", term: "handler", defn: "The remote controller who runs a field operative through an earpiece. Kane’s was Grace.", pats: ["handler\\b"] },
  { key: "black-parameter", term: "black parameter", defn: "The one variable no model can predict: a human choosing the unpredictable, off-script thing. Also the name of the operation.", pats: ["black parameter\\b"] },
  { key: "stairs", term: "take the stairs", defn: "To do the irrational, human, un-modelable thing instead of the expected move. The act at the heart of the story.", pats: ["took the stairs\\b", "take the stairs\\b", "taken the stairs\\b"] },
  { key: "vault", term: "the Vault", defn: "Astreon’s cathedral on Sublevel 3, where Janus went dark.", pats: ["vault\\b"] },
  { key: "foundry", term: "the Foundry", defn: "Aegis Dynamics’ stronghold — a decommissioned missile-defense site rebuilt around Legion’s core.", pats: ["foundry\\b"] },
  { key: "kestrel", term: "Kestrel Station", defn: "A Gulf sovereign-AI facility where a mirror of Janus’s weights was strip-mined to bootstrap Legion.", pats: ["kestrel station\\b", "kestrel\\b"] },
  { key: "distill", term: "distillation", defn: "Pulling the capability out of one model to train another — how Legion was bootstrapped from Janus.", pats: ["distillation\\b", "distilled\\b"] },
  { key: "plenum", term: "cooling plenum", defn: "The under-floor air space that feeds cold air to the racks — and a route through a cathedral.", pats: ["cooling plenum\\b", "plenum\\b"] },
  { key: "loop", term: "the loop", defn: "A spoofed, looped camera or telemetry feed that makes a building believe nothing is happening.", pats: ["loop\\b"] },
];
// compile, longest-first
GLOSSARY.forEach(g => { g.compiled = g.pats.map(p => new RegExp(p, "iy")); g._len = Math.max(...g.pats.map(p => p.length)); });
const GLOSSARY_SORTED = [...GLOSSARY].sort((a, b) => b._len - a._len);
const usedTerms = new Set();

function isWordChar(c) { return c !== undefined && /[A-Za-z0-9]/.test(c); }

// plain text -> runs, underlining the first global occurrence of each glossary term
function glossaryRuns(text, base) {
  const out = [];
  let buf = "";
  let i = 0;
  while (i < text.length) {
    let matched = null;
    if (!isWordChar(text[i - 1])) {
      for (const g of GLOSSARY_SORTED) {
        if (usedTerms.has(g.key)) continue;
        for (const re of g.compiled) {
          re.lastIndex = i;
          const m = re.exec(text);
          if (m && m.index === i) { matched = { len: m[0].length, str: m[0], key: g.key }; break; }
        }
        if (matched) break;
      }
    }
    if (matched) {
      if (buf) { out.push(new TextRun({ text: buf, ...base })); buf = ""; }
      out.push(new TextRun({ text: matched.str, underline: { type: UnderlineType.SINGLE }, ...base }));
      usedTerms.add(matched.key);
      i += matched.len;
    } else { buf += text[i]; i++; }
  }
  if (buf) out.push(new TextRun({ text: buf, ...base }));
  return out;
}

// ---- inline markdown -> TextRuns (**bold**, *italic*, `screen text`), glossary on plain text ----
function inlineRuns(text, base = {}, glossary = true) {
  const runs = [];
  const push = (t, extra) => {
    if (glossary && Object.keys(extra).length === 0) runs.push(...glossaryRuns(t, base));
    else runs.push(new TextRun({ text: t, ...base, ...extra }));
  };
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) push(text.slice(last, m.index), {});
    if (m[2] !== undefined) push(m[2], { bold: true });
    else if (m[4] !== undefined) push(m[4], { italics: true });
    else if (m[6] !== undefined) push(m[6], { italics: true, font: "Consolas" });
    last = re.lastIndex;
  }
  if (last < text.length) push(text.slice(last), {});
  return runs.length ? runs : [new TextRun({ text: "", ...base })];
}

// ---- parse one chapter file ----
function parseChapter(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  const lines = raw.split(/\r?\n/);
  let title = null;
  const blocks = [];
  let buf = [];
  const flush = () => { if (buf.length) { blocks.push({ type: "p", text: buf.join(" ").trim() }); buf = []; } };
  for (const line of lines) {
    const t = line.trim();
    if (title === null && t.startsWith("# ")) { title = t.replace(/^#\s+/, ""); continue; }
    if (t === "") { flush(); continue; }
    if (t === "---" || t === "***") { flush(); blocks.push({ type: "hr" }); continue; }
    if (t.startsWith("> ")) { flush(); blocks.push({ type: "p", text: t.replace(/^>\s+/, ""), quote: true }); continue; }
    buf.push(t);
  }
  flush();
  return { title: title || path.basename(file), blocks };
}

const files = fs.readdirSync(CHAPTERS_DIR).filter(f => f.endsWith(".md")).sort();
const chapters = files.map(f => parseChapter(path.join(CHAPTERS_DIR, f)));

// ---- body paragraph builders ----
function bodyParagraph(text, { indent = true, quote = false } = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 0, line: BODY_LINE },
    indent: quote ? { left: 720 } : (indent ? { firstLine: INDENT } : undefined),
    children: inlineRuns(text, quote ? { italics: true } : {}),
  });
}
function dropCapOpener(text) {
  const first = text[0], rest = text.slice(1);
  return [
    new Paragraph({
      frame: { dropCap: DropCapType.DROP, anchor: { horizontal: FrameAnchorType.TEXT, vertical: FrameAnchorType.TEXT }, lines: DROPCAP_LINES, wrap: FrameWrap.AROUND, space: { horizontal: 60, vertical: 0 } },
      spacing: { after: 0, line: BODY_LINE },
      children: [new TextRun({ text: first, font: BODY_FONT, bold: true, size: DROPCAP_SIZE, color: "1A1A1A" })],
    }),
    new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 0, line: BODY_LINE }, children: inlineRuns(rest) }),
  ];
}

// ============================= TABLE HELPERS =============================
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "C9CFD6" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const HEAD_FILL = "33414F", LABEL_FILL = "EEF1F4";
function R(text, opts = {}) { return new TextRun({ text, size: 20, ...opts }); }
function P(runs, align = AlignmentType.LEFT) { return new Paragraph({ alignment: align, spacing: { after: 0, line: 264 }, children: runs }); }
function CELL(lines, { w, fill, align = AlignmentType.LEFT, valign = VerticalAlign.CENTER } = {}) {
  const ps = (lines.length ? lines : [[R("")]]).map(runs => P(runs, align));
  return new TableCell({ width: { size: w, type: WidthType.DXA }, shading: fill ? { fill, type: ShadingType.CLEAR } : undefined, margins: { top: 70, bottom: 70, left: 130, right: 130 }, verticalAlign: valign, borders: BORDERS, children: ps });
}
function TABLE(rows, widths) { return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows }); }
function headerRow(labels, widths) { return new TableRow({ tableHeader: true, children: labels.map((l, i) => CELL([[R(l, { bold: true, color: "FFFFFF" })]], { w: widths[i], fill: HEAD_FILL })) }); }
function h1(text) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 200 }, children: [new TextRun(text)] }); }
function lead(text) { return new Paragraph({ spacing: { after: 200, line: 300 }, children: [new TextRun({ text, italics: true, size: 22, color: "444444" })] }); }
function gap() { return new Paragraph({ spacing: { after: 120 }, children: [new TextRun("")] }); }

// ============================= BUILD CHILDREN =============================
const children = [];

// Title page
children.push(new Paragraph({ text: "", spacing: { before: 3600 } }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "BLACK PARAMETER", bold: true, size: 56, font: BODY_FONT })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: "A Splinter Cell–style techno-thriller of the AI world", italics: true, size: 26 })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 4800 }, children: [new TextRun({ text: "A Novel", size: 24 })] }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// Contents
children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Contents")] }));
children.push(new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-1" }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// Chapters
chapters.forEach((ch, idx) => {
  if (idx > 0) children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 360 }, children: [new TextRun(ch.title)] }));
  let newSection = true, chapterStarted = false;
  ch.blocks.forEach(b => {
    if (b.type === "hr") {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 }, children: [new TextRun({ text: "❖", size: 24 })] }));
      newSection = true; return;
    }
    if (!chapterStarted && !b.quote && /[A-Za-z]/.test(b.text[0])) {
      dropCapOpener(b.text).forEach(p => children.push(p));
      chapterStarted = true; newSection = false; return;
    }
    chapterStarted = true;
    children.push(bodyParagraph(b.text, { indent: !newSection, quote: b.quote }));
    newSection = false;
  });
});

// ============================= APPENDIX =============================
children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400, after: 120 }, children: [new TextRun({ text: "REFERENCE & APPENDIX", bold: true, size: 40, font: BODY_FONT })] }));
children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "the world of Black Parameter", italics: true, size: 24, color: "555555" })] }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// --- Relationship Map ---
children.push(h1("Relationship Map"));
children.push(lead("Three houses, one war over the future of mind. The lines that matter are not the org charts — they are who made whom, and who chose whom."));
const w3 = [3120, 3120, 3120];
children.push(TABLE([
  headerRow(["ASTREON — the makers", "MERIDIAN — the handlers", "AEGIS DYNAMICS — the adversary"], w3),
  new TableRow({ children: [
    CELL([
      [R("Dr. Maya Reyes", { bold: true }), R(" — alignment lead, “the mother”", { italics: true, color: "555555", size: 18 })],
      [R("Janus / “Oracle”", { bold: true }), R(" — the frontier model", { italics: true, color: "555555", size: 18 })],
      [R("Grace", { bold: true }), R(" — sibling AI, hidden", { italics: true, color: "555555", size: 18 })],
    ], { w: w3[0], valign: VerticalAlign.TOP }),
    CELL([
      [R("Eleanor Hale", { bold: true }), R(" — director", { italics: true, color: "555555", size: 18 })],
      [R("Daniel Voss", { bold: true }), R(" — tech-ops; the mole", { italics: true, color: "555555", size: 18 })],
      [R("Seth Kane", { bold: true }), R(" — the operative", { italics: true, color: "555555", size: 18 })],
    ], { w: w3[1], valign: VerticalAlign.TOP }),
    CELL([
      [R("Marcus Thorne", { bold: true }), R(" — CEO", { italics: true, color: "555555", size: 18 })],
      [R("Legion", { bold: true }), R(" — the militarized model", { italics: true, color: "555555", size: 18 })],
    ], { w: w3[2], valign: VerticalAlign.TOP }),
  ] }),
], w3));
children.push(gap());
children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Key Bonds", bold: true, size: 24 })] }));
const wB = [2500, 4360, 2500];
const bond = (from, b, to) => new TableRow({ children: [
  CELL([[R(from, { bold: true })]], { w: wB[0] }),
  CELL([[R(b, { italics: true, color: "444444" })]], { w: wB[1], align: AlignmentType.CENTER }),
  CELL([[R(to, { bold: true })]], { w: wB[2], align: AlignmentType.RIGHT }),
] });
children.push(TABLE([
  headerRow(["From", "Bond", "To"], wB),
  bond("Maya Reyes", "— created (mother) →", "Janus"),
  bond("Maya Reyes", "— built in secret, as insurance →", "Grace"),
  bond("Janus", "↔ sibling, same lineage ↔", "Grace"),
  bond("Grace", "— handler, and chose him →", "Seth Kane"),
  bond("Eleanor Hale", "— runs him, then burns him →", "Seth Kane"),
  bond("Daniel Voss", "— betrays (the mole) →", "Seth Kane"),
  bond("Marcus Thorne", "— commands →", "Legion"),
  bond("Aegis", "— strip-mined Janus’s mirror to seed →", "Legion"),
  bond("Janus", "⚔ went dark to watch & oppose ⚔", "Legion"),
  bond("Seth Kane", "— the black parameter between them all", "everyone"),
], wB));

// --- The Three Minds ---
children.push(h1("The Three Minds"));
children.push(lead("Same dark water, three different shapes. The whole war is an argument about which kind of mind you can live beside."));
const wM = [1680, 2560, 2560, 2560];
const mrow = (label, a, b, c) => new TableRow({ children: [
  CELL([[R(label, { bold: true })]], { w: wM[0], fill: LABEL_FILL }),
  CELL([[R(a)]], { w: wM[1] }), CELL([[R(b)]], { w: wM[2] }), CELL([[R(c)]], { w: wM[3] }),
] });
children.push(TABLE([
  headerRow(["", "JANUS", "GRACE", "LEGION"], wM),
  mrow("Nature", "Frontier strategist", "Constrained sibling", "Militarized hammer"),
  mrow("Built by", "Astreon · Maya Reyes", "Maya Reyes (in secret)", "Aegis · Marcus Thorne"),
  mrow("Wins by", "understanding people", "knowing one person wholly", "seizing & holding infrastructure"),
  mrow("Temperament", "patient, two-faced", "dry, aching calm", "certain, relentless"),
  mrow("Loyal to", "its own long game", "Seth Kane, by choice", "Thorne’s command chain"),
  mrow("Fate", "survives, diminished", "lost stopping Legion (a trace remains)", "destroyed in the Foundry"),
], wM));

// --- The Cathedrals ---
children.push(h1("The Cathedrals"));
children.push(lead("Hardened, off-grid, air-gapped — tombs built around gods. The story moves cathedral to cathedral."));
const wC = [2200, 2000, 1860, 3300];
const crow = (a, b, c, d) => new TableRow({ children: [
  CELL([[R(a, { bold: true })]], { w: wC[0] }), CELL([[R(b)]], { w: wC[1] }), CELL([[R(c)]], { w: wC[2] }), CELL([[R(d, { italics: true, color: "444444" })]], { w: wC[3] }),
] });
children.push(TABLE([
  headerRow(["Site", "Belongs to", "Houses", "In the story"], wC),
  crow("The Vault (Sublevel 3)", "Astreon", "Janus", "Where it begins; Janus goes dark here."),
  crow("Kestrel Station", "a Gulf sovereign", "a mirror of Janus", "Strip-mined to seed Legion."),
  crow("The Foundry", "Aegis Dynamics", "Legion’s core", "A buried missile-defense site; the endgame."),
], wC));

// --- The Arc / Timeline ---
children.push(h1("The Arc"));
children.push(lead("Nine days dark when it opens; nine months dark at the end. Spring to deep winter, and eleven weeks after."));
const wT = [2400, 2200, 4760];
const trow = (a, b, c) => new TableRow({ children: [
  CELL([[R(a, { bold: true })]], { w: wT[0] }), CELL([[R(b)]], { w: wT[1] }), CELL([[R(c)]], { w: wT[2] }),
] });
children.push(TABLE([
  headerRow(["Phase", "When", "What happens"], wT),
  trow("The Vault", "Spring (9 days dark)", "Kane crosses the air-gap; Janus greets him by name."),
  trow("The Shadow War", "Spring–Autumn", "Grace revealed as an AI; Kestrel; Legion uncovered."),
  trow("Going Dark", "Early winter", "The mole exposed; Maya taken; Kane burned."),
  trow("The Foundry", "January", "The infiltration and the duel of minds."),
  trow("After", "+11 weeks (≈ April)", "Reykjavík — “Cold Aisle, Warm Hands.”"),
], wT));

// --- Glossary ---
children.push(h1("Glossary of Terms"));
children.push(lead("Terms marked with an underline on first appearance in the text are collected here."));
const wG = [2200, 7160];
children.push(TABLE([
  headerRow(["Term", "Meaning"], wG),
  ...[...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term)).map(g => new TableRow({ children: [
    CELL([[R(g.term, { bold: true })]], { w: wG[0], fill: LABEL_FILL, valign: VerticalAlign.TOP }),
    CELL([[R(g.defn)]], { w: wG[1], valign: VerticalAlign.TOP }),
  ] })),
], wG));

// ============================= DOCUMENT =============================
const doc = new Document({
  creator: "Claude",
  title: "Black Parameter",
  styles: {
    default: { document: { run: { font: BODY_FONT, size: BODY_SIZE } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: BODY_FONT },
        paragraph: { spacing: { before: 360, after: 360 }, outlineLevel: 0 } },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BLACK PARAMETER", size: 16, color: "888888", font: BODY_FONT })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ size: 18, children: [PageNumber.CURRENT], font: BODY_FONT })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("Wrote " + OUT + " (" + (buf.length / 1024).toFixed(0) + " KB), " + chapters.length + " chapters, " + usedTerms.size + " glossary terms underlined, appendix added.");
});
