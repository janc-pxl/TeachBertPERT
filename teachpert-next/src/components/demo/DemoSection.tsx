'use client';

import { useEffect, useRef, useState } from 'react';

// ── DEMO 1 DATA ──
const D1_NODES = ['I', 'II', 'III', 'IV'];
const D1_ARROWS = ['I-II', 'I-III', 'II-III', 'III-IV'];
const D1_DASHED = new Set(['II-III']);

const PHASE_CLS: Record<string, string> = {
  start: 'phase-start',
  forward: 'phase-forward',
  backward: 'phase-backward',
  result: 'phase-result',
};

type DemoStep = {
  phase: string;
  lbl: string;
  title: string;
  expl: string;
  te: Record<string, number>;
  tl: Record<string, number>;
  hi: string[];
  ha: string[];
  crit: string[];
};

const D1_STEPS: DemoStep[] = [
  { phase: 'start', lbl: 'Start', title: 'Leeg netwerk',
    expl: 'Dit netwerk heeft 4 knooppunten (I–IV) en 3 activiteiten + 1 schijnactiviteit (stippellijn). Klik op <strong>Volgende →</strong> om te starten met de voorwaartse gang (T<sub>E</sub>, links→rechts).',
    te: {}, tl: {}, hi: [], ha: [], crit: [] },
  { phase: 'forward', lbl: '➡ Voorwaartse gang', title: 'Stap 1, Knooppunt I',
    expl: 'Het <strong>startpunt</strong> heeft altijd <strong>T<sub>E</sub>(I) = 0</strong>. Er zijn geen inkomende activiteiten.',
    te: { I: 0 }, tl: {}, hi: ['I'], ha: [], crit: [] },
  { phase: 'forward', lbl: '➡ Voorwaartse gang', title: 'Stap 2, Knooppunt II',
    expl: 'Één inkomend pad via Act 1 (iOS, 4w):<br><strong>T<sub>E</sub>(II) = T<sub>E</sub>(I) + 4 = 0 + 4 = 4</strong>',
    te: { I: 0, II: 4 }, tl: {}, hi: ['II'], ha: ['I-II'], crit: [] },
  { phase: 'forward', lbl: '➡ Voorwaartse gang', title: 'Stap 3, Knooppunt III',
    expl: 'Twee inkomende paden:<br>&bull; Via Act 2 (Android, 8w): T<sub>E</sub>(I) + 8 = <strong>8</strong><br>&bull; Via schijnactiviteit van II (0w): T<sub>E</sub>(II) + 0 = 4<br>📌 Neem de <strong>grootste</strong>: <strong>T<sub>E</sub>(III) = 8</strong>',
    te: { I: 0, II: 4, III: 8 }, tl: {}, hi: ['III'], ha: ['I-III', 'II-III'], crit: [] },
  { phase: 'forward', lbl: '➡ Voorwaartse gang', title: 'Stap 4, Knooppunt IV (voorwaartse gang klaar)',
    expl: 'Één inkomend pad via Act 3 (Release, 2w):<br><strong>T<sub>E</sub>(IV) = T<sub>E</sub>(III) + 2 = 8 + 2 = 10</strong><br>✅ De totale verwachte projectduur is <strong>10 weken</strong>.',
    te: { I: 0, II: 4, III: 8, IV: 10 }, tl: {}, hi: ['IV'], ha: ['III-IV'], crit: [] },
  { phase: 'backward', lbl: '⬅ Achterwaartse gang', title: 'Stap 5, Knooppunt IV',
    expl: 'We starten de achterwaartse gang bij het eindpunt.<br>T<sub>L</sub> van het laatste knooppunt = T<sub>E</sub>:<br><strong>T<sub>L</sub>(IV) = T<sub>E</sub>(IV) = 10</strong>',
    te: { I: 0, II: 4, III: 8, IV: 10 }, tl: { IV: 10 }, hi: ['IV'], ha: [], crit: [] },
  { phase: 'backward', lbl: '⬅ Achterwaartse gang', title: 'Stap 6, Knooppunt III',
    expl: 'Één uitgaande activiteit (Act 3, 2w):<br><strong>T<sub>L</sub>(III) = T<sub>L</sub>(IV) − 2 = 10 − 2 = 8</strong>',
    te: { I: 0, II: 4, III: 8, IV: 10 }, tl: { IV: 10, III: 8 }, hi: ['III'], ha: ['III-IV'], crit: [] },
  { phase: 'backward', lbl: '⬅ Achterwaartse gang', title: 'Stap 7, Knooppunt II',
    expl: 'Één uitgaande verbinding (schijnactiviteit naar III, 0w):<br><strong>T<sub>L</sub>(II) = T<sub>L</sub>(III) − 0 = 8 − 0 = 8</strong>',
    te: { I: 0, II: 4, III: 8, IV: 10 }, tl: { IV: 10, III: 8, II: 8 }, hi: ['II'], ha: ['II-III'], crit: [] },
  { phase: 'backward', lbl: '⬅ Achterwaartse gang', title: 'Stap 8, Knooppunt I (achterwaartse gang klaar)',
    expl: 'Twee uitgaande activiteiten:<br>&bull; Via Act 1 naar II: T<sub>L</sub>(II) − 4 = 8 − 4 = 4<br>&bull; Via Act 2 naar III: T<sub>L</sub>(III) − 8 = 8 − 8 = <strong>0</strong><br>📌 Neem de <strong>kleinste</strong>: <strong>T<sub>L</sub>(I) = 0</strong>',
    te: { I: 0, II: 4, III: 8, IV: 10 }, tl: { IV: 10, III: 8, II: 8, I: 0 }, hi: ['I'], ha: ['I-II', 'I-III'], crit: [] },
  { phase: 'result', lbl: '🔴 Resultaat', title: 'Stap 9, Speling &amp; kritiek pad',
    expl: 'Speling = T<sub>L</sub> − T<sub>E</sub>:<br>&bull; I:  0 − 0 = <strong>0</strong> ✅ kritiek<br>&bull; II: 8 − 4 = <strong>4</strong> (positieve speling, niet kritiek)<br>&bull; III: 8 − 8 = <strong>0</strong> ✅ kritiek<br>&bull; IV: 10 − 10 = <strong>0</strong> ✅ kritiek<br>🔴 <strong>Kritiek pad: I → III → IV</strong>',
    te: { I: 0, II: 4, III: 8, IV: 10 }, tl: { IV: 10, III: 8, II: 8, I: 0 }, hi: [], ha: [], crit: ['I', 'III', 'IV', 'I-III', 'III-IV'] },
];

// ── DEMO 2 DATA ──
const D2_NODES = ['I', 'II', 'III', 'IV'];
const D2_ARROWS = ['I-II', 'I-III', 'II-III', 'II-IV', 'III-IV'];
const D2_DASHED = new Set(['II-III']);

const D2_STEPS: DemoStep[] = [
  { phase: 'start', lbl: 'Start', title: 'Netwerk met schijnactiviteit',
    expl: 'Dit netwerk heeft <strong>4 knooppunten</strong>, <strong>4 activiteiten</strong> en een <strong>schijnactiviteit (0-lijn)</strong> van II naar III.<br><br>De schijnactiviteit zorgt ervoor dat Act 4 (meubels plaatsen) pas kan starten als <em>zowel</em> de elektriciteit (Act 1) <em>als</em> het schilderen (Act 2) klaar is, terwijl Act 3 (verlichting) <em>enkel</em> afhangt van Act 1.<br><br>Klik op <strong>Volgende →</strong> om te starten.',
    te: {}, tl: {}, hi: [], ha: [], crit: [] },
  { phase: 'start', lbl: '⚠ Probleem', title: 'Waarom is de schijnactiviteit nodig?',
    expl: '<strong>Zonder de schijnactiviteit:</strong><br>Als Act 1 en Act 2 naar <em>hetzelfde</em> knooppunt zouden lopen, dan zou Act 3 (verlichting) ook afhangen van Act 2 (schilderen). Maar dat klopt niet: de verlichting hangt <em>enkel</em> af van de elektriciteit!<br><br><strong>Met de schijnactiviteit:</strong><br>Act 1 komt aan in knooppunt II. Van daaruit vertrekt Act 3 (enkel afhankelijk van Act 1). De schijnactiviteit stuurt het signaal "<em>Act 1 is klaar</em>" door naar knooppunt III, waar Act 4 ook wacht op Act 2.',
    te: {}, tl: {}, hi: [], ha: ['II-III'], crit: [] },
  { phase: 'forward', lbl: '➡ Voorwaartse gang', title: 'Stap 1, Knooppunt I',
    expl: 'Het <strong>startpunt</strong> heeft altijd <strong>T<sub>E</sub>(I) = 0</strong>.',
    te: { I: 0 }, tl: {}, hi: ['I'], ha: [], crit: [] },
  { phase: 'forward', lbl: '➡ Voorwaartse gang', title: 'Stap 2, Knooppunt II',
    expl: 'Één inkomend pad via Act 1 (Elektriciteit, 4w):<br><strong>T<sub>E</sub>(II) = T<sub>E</sub>(I) + 4 = 0 + 4 = 4</strong>',
    te: { I: 0, II: 4 }, tl: {}, hi: ['II'], ha: ['I-II'], crit: [] },
  { phase: 'forward', lbl: '➡ Voorwaartse gang', title: 'Stap 3, Knooppunt III ⭐',
    expl: 'Twee inkomende paden:<br>&bull; Via Act 2 (Schilderen, 3w): T<sub>E</sub>(I) + 3 = <strong>3</strong><br>&bull; Via <strong>schijnactiviteit</strong> van II (0w): T<sub>E</sub>(II) + 0 = <strong>4</strong><br><br>📌 Neem de <strong>grootste</strong>: <strong>T<sub>E</sub>(III) = 4</strong><br><br>💡 <em>Zonder de schijnactiviteit zou T<sub>E</sub>(III) = 3 zijn. Dan zou Act 4 op week 3 starten, terwijl de elektriciteit pas op week 4 klaar is!</em>',
    te: { I: 0, II: 4, III: 4 }, tl: {}, hi: ['III'], ha: ['I-III', 'II-III'], crit: [] },
  { phase: 'forward', lbl: '➡ Voorwaartse gang', title: 'Stap 4, Knooppunt IV',
    expl: 'Twee inkomende paden:<br>&bull; Via Act 3 (Verlichting, 2w): T<sub>E</sub>(II) + 2 = 4 + 2 = <strong>6</strong><br>&bull; Via Act 4 (Meubels, 1w): T<sub>E</sub>(III) + 1 = 4 + 1 = 5<br><br>📌 Neem de <strong>grootste</strong>: <strong>T<sub>E</sub>(IV) = 6</strong><br>✅ Totale projectduur: <strong>6 weken</strong>.',
    te: { I: 0, II: 4, III: 4, IV: 6 }, tl: {}, hi: ['IV'], ha: ['II-IV', 'III-IV'], crit: [] },
  { phase: 'backward', lbl: '⬅ Achterwaartse gang', title: 'Stap 5, Knooppunt IV',
    expl: 'T<sub>L</sub> van het laatste knooppunt = T<sub>E</sub>:<br><strong>T<sub>L</sub>(IV) = T<sub>E</sub>(IV) = 6</strong>',
    te: { I: 0, II: 4, III: 4, IV: 6 }, tl: { IV: 6 }, hi: ['IV'], ha: [], crit: [] },
  { phase: 'backward', lbl: '⬅ Achterwaartse gang', title: 'Stap 6, Knooppunt III',
    expl: 'Één uitgaande activiteit (Act 4, 1w):<br><strong>T<sub>L</sub>(III) = T<sub>L</sub>(IV) − 1 = 6 − 1 = 5</strong>',
    te: { I: 0, II: 4, III: 4, IV: 6 }, tl: { IV: 6, III: 5 }, hi: ['III'], ha: ['III-IV'], crit: [] },
  { phase: 'backward', lbl: '⬅ Achterwaartse gang', title: 'Stap 7, Knooppunt II ⭐',
    expl: 'Twee uitgaande verbindingen:<br>&bull; Via Act 3 naar IV: T<sub>L</sub>(IV) − 2 = 6 − 2 = <strong>4</strong><br>&bull; Via <strong>schijnactiviteit</strong> naar III: T<sub>L</sub>(III) − 0 = 5 − 0 = 5<br><br>📌 Neem de <strong>kleinste</strong>: <strong>T<sub>L</sub>(II) = 4</strong><br><br>💡 <em>De schijnactiviteit werkt ook door in de achterwaartse richting!</em>',
    te: { I: 0, II: 4, III: 4, IV: 6 }, tl: { IV: 6, III: 5, II: 4 }, hi: ['II'], ha: ['II-IV', 'II-III'], crit: [] },
  { phase: 'backward', lbl: '⬅ Achterwaartse gang', title: 'Stap 8, Knooppunt I',
    expl: 'Twee uitgaande activiteiten:<br>&bull; Via Act 1 naar II: T<sub>L</sub>(II) − 4 = 4 − 4 = <strong>0</strong><br>&bull; Via Act 2 naar III: T<sub>L</sub>(III) − 3 = 5 − 3 = 2<br><br>📌 Neem de <strong>kleinste</strong>: <strong>T<sub>L</sub>(I) = 0</strong>',
    te: { I: 0, II: 4, III: 4, IV: 6 }, tl: { IV: 6, III: 5, II: 4, I: 0 }, hi: ['I'], ha: ['I-II', 'I-III'], crit: [] },
  { phase: 'result', lbl: '🔴 Resultaat', title: 'Stap 9, Speling &amp; kritiek pad',
    expl: 'Speling = T<sub>L</sub> − T<sub>E</sub>:<br>&bull; I:   0 − 0 = <strong>0</strong> ✅ kritiek<br>&bull; II:  4 − 4 = <strong>0</strong> ✅ kritiek<br>&bull; III: 5 − 4 = <strong>1</strong> (positieve speling)<br>&bull; IV:  6 − 6 = <strong>0</strong> ✅ kritiek<br><br>🔴 <strong>Kritiek pad: I → II → IV</strong> (Act 1 → Act 3, totaal 6 weken)<br><br>💡 De schijnactiviteit zelf ligt <em>niet</em> op het kritieke pad: knooppunt III heeft speling 1.',
    te: { I: 0, II: 4, III: 4, IV: 6 }, tl: { IV: 6, III: 5, II: 4, I: 0 }, hi: [], ha: [], crit: ['I', 'II', 'IV', 'I-II', 'II-IV'] },
];

function renderDemo(
  steps: DemoStep[],
  nodes: string[],
  arrows: string[],
  dashed: Set<string>,
  prefix: string,
  idx: number
) {
  const s = steps[idx];
  const stepCounterEl = document.getElementById(`${prefix}-step-counter`);
  if (stepCounterEl) stepCounterEl.textContent = `Stap ${idx} van ${steps.length - 1}`;
  const titleEl = document.getElementById(`${prefix}-title`);
  if (titleEl) titleEl.innerHTML = s.title;
  const explEl = document.getElementById(`${prefix}-explanation`);
  if (explEl) explEl.innerHTML = s.expl;
  const badge = document.getElementById(`${prefix}-phase-badge`);
  if (badge) {
    badge.textContent = s.lbl;
    badge.className = 'demo-phase-badge ' + (PHASE_CLS[s.phase] || 'phase-start');
  }

  const d = prefix === 'demo' ? 'd' : 'd2';

  nodes.forEach((n) => {
    const te = document.getElementById(`${d}-te-${n}`);
    const tl = document.getElementById(`${d}-tl-${n}`);
    if (te) {
      const v = s.te[n];
      te.textContent = v !== undefined ? String(v) : '—';
      te.setAttribute('fill', v !== undefined ? '#155724' : '#ccc');
    }
    if (tl) {
      const v = s.tl[n];
      tl.textContent = v !== undefined ? String(v) : '—';
      tl.setAttribute('fill', v !== undefined ? '#004085' : '#ccc');
    }
  });

  nodes.forEach((n) => {
    const bdr = document.getElementById(`${d}-bdr-${n}`);
    if (!bdr) return;
    const isCrit = s.crit.includes(n);
    const isHi = s.hi.includes(n);
    bdr.setAttribute('stroke', isCrit ? '#e63946' : isHi ? '#457b9d' : '#555');
    bdr.setAttribute('stroke-width', isCrit ? '4' : isHi ? '3.5' : '2');
  });

  const mPrefix = prefix === 'demo' ? '' : 'd2-';

  arrows.forEach((a) => {
    const line = document.getElementById(`${d}-line-${a}`);
    const lbl = document.getElementById(`${d}-lbl-${a}`);
    if (!line) return;
    const isDash = dashed.has(a);
    const isCrit = s.crit.includes(a);
    const isHi = s.ha.includes(a);
    let col: string, w: string, mk: string;
    if (isCrit) { col = '#e63946'; w = '3'; mk = `url(#${mPrefix}m-crit)`; }
    else if (isHi) { col = '#457b9d'; w = '2.5'; mk = isDash ? `url(#${mPrefix}m-r-act)` : `url(#${mPrefix}m-act)`; }
    else { col = isDash ? '#ccc' : '#aaa'; w = isDash ? '1.4' : '1.8'; mk = isDash ? `url(#${mPrefix}m-relay)` : `url(#${mPrefix}m-def)`; }
    line.setAttribute('stroke', col);
    line.setAttribute('stroke-width', w);
    line.setAttribute('marker-end', mk);
    if (lbl) lbl.setAttribute('fill', isCrit ? '#e63946' : isHi ? '#457b9d' : '#ccc');
  });

  const slkId = prefix === 'demo' ? 'd-slack' : 'd2-slack';
  const slk = document.getElementById(slkId);
  if (slk) slk.setAttribute('opacity', s.phase === 'result' ? '1' : '0');
}

// ── DEMO NODE SVG helpers ──
function DemoNode({ cx, cy, label, teId, tlId, bdrId, r = 36, clipPrefix }: {
  cx: number; cy: number; label: string; teId: string; tlId: string; bdrId: string;
  r?: number; clipPrefix: string;
}) {
  const fs = label.length > 3 ? '12' : label.length > 2 ? '12' : label.length > 1 ? '13' : '15';
  return (
    <g transform={`translate(${cx},${cy})`}>
      <circle r={r} fill="#eef0f2" clipPath={`url(#${clipPrefix}-l)`}/>
      <circle r={r} fill="#e8f5e9" clipPath={`url(#${clipPrefix}-tr)`}/>
      <circle r={r} fill="#e3f0fb" clipPath={`url(#${clipPrefix}-br)`}/>
      <circle r={r} fill="none" stroke="#333" strokeWidth="2.5" id={bdrId}/>
      <line x1="0" y1={-r} x2="0" y2={r} stroke="#555" strokeWidth="1.6"/>
      <line x1="0" y1="0" x2={r} y2="0" stroke="#555" strokeWidth="1.6"/>
      <text x={label.length > 1 ? '-13' : '-14'} y="5" textAnchor="middle"
            fontFamily="Segoe UI,sans-serif" fontSize={fs} fontWeight="700" fill="#333">{label}</text>
      <text id={teId} x="18" y="-11" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="12" fontWeight="700" fill="#ccc">—</text>
      <text id={tlId} x="18" y="16" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="12" fontWeight="700" fill="#ccc">—</text>
    </g>
  );
}

export function DemoSection() {
  const [d1Cur, setD1Cur] = useState(0);
  const [d2Cur, setD2Cur] = useState(0);

  useEffect(() => {
    renderDemo(D1_STEPS, D1_NODES, D1_ARROWS, D1_DASHED, 'demo', d1Cur);
  }, [d1Cur]);

  useEffect(() => {
    renderDemo(D2_STEPS, D2_NODES, D2_ARROWS, D2_DASHED, 'demo2', d2Cur);
  }, [d2Cur]);

  // Initial render
  useEffect(() => {
    renderDemo(D1_STEPS, D1_NODES, D1_ARROWS, D1_DASHED, 'demo', 0);
    renderDemo(D2_STEPS, D2_NODES, D2_ARROWS, D2_DASHED, 'demo2', 0);
  }, []);

  return (
    <section id="demo" style={{ marginTop: '3rem' }}>
      <div className="section-header">
        <div className="section-badge">Sectie 2</div>
        <h1>Demo</h1>
        <p>Stap voor stap door een PERT-netwerk: T<sub>E</sub> (links→rechts) en T<sub>L</sub> (rechts→links).</p>
      </div>

      <div className="definitie" style={{ marginBottom: '1.25rem' }}>
        <div className="def-label">Netwerk: Lancering van een mobiele app</div>
        <p>Een softwarebedrijf wil een app lanceren. Er zijn twee parallelle ontwikkeltrajecten (iOS en Android),
           een schijnactiviteit en een gezamenlijke release. Doorloop het netwerk stap voor stap.</p>
      </div>

      {/* DEMO 1 */}
      <div className="demo-card">
        <div className="demo-header">
          <div>
            <div className="demo-step-counter" id="demo-step-counter">Stap 0 van 9</div>
            <div className="demo-card-title" id="demo-title">Leeg netwerk</div>
          </div>
          <span className="demo-phase-badge phase-start" id="demo-phase-badge">Start</span>
        </div>

        <div className="demo-network-wrap">
          <svg viewBox="0 0 560 320" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="m-def"   markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#888"/></marker>
              <marker id="m-act"   markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#457b9d"/></marker>
              <marker id="m-crit"  markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#e63946"/></marker>
              <marker id="m-relay" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#bbb"/></marker>
              <marker id="m-r-act" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#457b9d"/></marker>
              <clipPath id="dcl-l" ><rect x="-36" y="-36" width="36" height="72"/></clipPath>
              <clipPath id="dcl-tr"><rect x="0"   y="-36" width="36" height="36"/></clipPath>
              <clipPath id="dcl-br"><rect x="0"   y="0"   width="36" height="36"/></clipPath>
            </defs>

            <g id="d-arr-I-II">
              <line id="d-line-I-II" x1="122" y1="140" x2="236" y2="86" stroke="#888" strokeWidth="1.8" markerEnd="url(#m-def)"/>
              <text id="d-lbl-I-II" x="172" y="97" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="11" fill="#999">Act 1: iOS, 4w</text>
            </g>
            <g id="d-arr-I-III">
              <line id="d-line-I-III" x1="122" y1="170" x2="236" y2="224" stroke="#888" strokeWidth="1.8" markerEnd="url(#m-def)"/>
              <text id="d-lbl-I-III" x="163" y="220" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="11" fill="#999">Act 2: Android, 8w</text>
            </g>
            <g id="d-arr-II-III">
              <line id="d-line-II-III" x1="270" y1="106" x2="270" y2="204" stroke="#bbb" strokeWidth="1.6" strokeDasharray="6,4" markerEnd="url(#m-relay)"/>
              <text id="d-lbl-II-III" x="284" y="160" textAnchor="start" fontFamily="Georgia,serif" fontSize="15" fontWeight="700" fill="#bbb">0</text>
            </g>
            <g id="d-arr-III-IV">
              <line id="d-line-III-IV" x1="303" y1="225" x2="425" y2="170" stroke="#888" strokeWidth="1.8" markerEnd="url(#m-def)"/>
              <text id="d-lbl-III-IV" x="375" y="214" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="11" fill="#999">Act 3: Release, 2w</text>
            </g>

            <DemoNode cx={90} cy={155} label="I" teId="d-te-I" tlId="d-tl-I" bdrId="d-bdr-I" clipPrefix="dcl"/>
            <DemoNode cx={270} cy={70} label="II" teId="d-te-II" tlId="d-tl-II" bdrId="d-bdr-II" clipPrefix="dcl"/>
            <DemoNode cx={270} cy={240} label="III" teId="d-te-III" tlId="d-tl-III" bdrId="d-bdr-III" clipPrefix="dcl"/>
            <DemoNode cx={460} cy={155} label="IV" teId="d-te-IV" tlId="d-tl-IV" bdrId="d-bdr-IV" clipPrefix="dcl"/>

            <g id="d-slack" opacity="0" style={{ transition: 'opacity .3s' }}>
              <rect x="55" y="198" width="72" height="18" rx="9" fill="#16a34a"/>
              <text x="91" y="211" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fontWeight="700" fill="#fff">speling = 0</text>
              <rect x="310" y="55" width="72" height="18" rx="9" fill="#2563eb"/>
              <text x="346" y="68" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fontWeight="700" fill="#fff">speling = 4</text>
              <rect x="230" y="283" width="72" height="18" rx="9" fill="#16a34a"/>
              <text x="266" y="296" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fontWeight="700" fill="#fff">speling = 0</text>
              <rect x="420" y="198" width="72" height="18" rx="9" fill="#16a34a"/>
              <text x="456" y="211" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fontWeight="700" fill="#fff">speling = 0</text>
            </g>
          </svg>
        </div>

        <div className="demo-explanation" id="demo-explanation">
          Dit netwerk heeft 4 knooppunten (I–IV) en 3 activiteiten + 1 schijnactiviteit. Klik op <strong>Volgende →</strong> om te starten.
        </div>

        <div className="demo-nav">
          <button className="demo-btn demo-btn-prev" id="demo-prev" disabled={d1Cur === 0} onClick={() => setD1Cur((c) => Math.max(0, c - 1))}>← Vorige</button>
          <div className="demo-dots" id="demo-dots">
            {D1_STEPS.map((_, i) => (
              <div key={i} className={`demo-dot${i === d1Cur ? ' active' : ''}${i < d1Cur ? ' done' : ''}`}/>
            ))}
          </div>
          <button className="demo-btn demo-btn-next" id="demo-next" disabled={d1Cur === D1_STEPS.length - 1} onClick={() => setD1Cur((c) => Math.min(D1_STEPS.length - 1, c + 1))}>Volgende →</button>
        </div>
        <div className="demo-footer">
          <button className="demo-btn-reset" id="demo-reset" onClick={() => setD1Cur(0)}>↺ Opnieuw beginnen</button>
        </div>
      </div>

      {/* Schijnactiviteit detail card */}
      <div className="card">
        <div className="card-title">🔗 De schijnactiviteit (0-lijn) in detail</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1.1rem' }}>
          In dit netwerk loopt er een schijnactiviteit van knooppunt II naar knooppunt III.
          Hieronder zie je precies wat dat betekent en hoe je ermee rekent.
        </p>
        <table className="slack-table" style={{ marginBottom: '1.25rem' }}>
          <thead>
            <tr><th>Type</th><th>Symbool</th><th>Tijd</th><th>Mankracht / middelen</th><th>Gebruik</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Activiteit</strong></td><td>Volle pijl</td><td>Ja (duurtijd &gt; 0)</td><td>Ja</td><td>Een echte taak (bv. iOS bouwen)</td></tr>
            <tr style={{ background: '#fffbeb' }}><td><strong>Wachttijd</strong></td><td>Stippelpijl</td><td>Ja (wachttijd)</td><td>Nee</td><td>Technische wachttijd (bv. beton uitharden)</td></tr>
            <tr style={{ background: '#eef5fb' }}><td><strong>Schijnactiviteit</strong></td><td>Stippelpijl met <strong>0</strong></td><td><strong>Nee</strong> (duurtijd = 0)</td><td>Nee</td><td>Noodzakelijk logisch verband zonder tijdskost</td></tr>
          </tbody>
        </table>
        <div className="pass-grid">
          <div className="pass-card forward">
            <div className="pass-title">➡ Voorwaartse gang via schijnactiviteit</div>
            <p className="pass-desc">De schijnactiviteit <strong>II → III</strong> heeft duurtijd 0.</p>
            <div className="pass-rule">T<sub>E</sub>(III) via II = T<sub>E</sub>(II) + <strong>0</strong> = 4 + 0 = 4</div>
            <div className="pass-rule">T<sub>E</sub>(III) via I (Act 2) = T<sub>E</sub>(I) + 8 = 0 + 8 = <strong>8</strong></div>
            <div className="pass-rule">📌 Neem de <strong>grootste</strong>: T<sub>E</sub>(III) = <strong>8</strong></div>
          </div>
          <div className="pass-card backward">
            <div className="pass-title">⬅ Achterwaartse gang via schijnactiviteit</div>
            <p className="pass-desc">In de achterwaartse gang gaat de schijnactiviteit <em>omgekeerd</em> (III → II).</p>
            <div className="pass-rule">T<sub>L</sub>(II) = T<sub>L</sub>(III) − <strong>0</strong> = 8 − 0 = <strong>8</strong></div>
            <div className="pass-rule" style={{ marginTop: '.5rem' }}>Speling knooppunt II = T<sub>L</sub> − T<sub>E</sub> = 8 − 4 = <strong>4</strong> → positieve speling, <em>niet kritiek</em>.</div>
            <div className="pass-rule" style={{ marginTop: '.5rem', background: '#fee2e2' }}>⚠️ De schijnactiviteit zelf is <strong>niet kritiek</strong> omdat knooppunt II speling heeft.</div>
          </div>
        </div>
      </div>

      {/* DEMO 2 */}
      <div className="definitie" style={{ marginTop: '2rem', marginBottom: '1.25rem' }}>
        <div className="def-label">Demo 2: Waarom heb je een schijnactiviteit (0-lijn) nodig?</div>
        <p>Studenten vragen zich vaak af: <em>wanneer</em> gebruik je een schijnactiviteit? Dit voorbeeld toont stap voor stap
           waarom een schijnactiviteit soms <strong>onmisbaar</strong> is om afhankelijkheden correct voor te stellen.</p>
      </div>

      <div className="card">
        <div className="card-title">🏗 Voorbeeld: Renovatie van een klaslokaal</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1rem' }}>
          Een school renoveert een klaslokaal. Er zijn vier activiteiten:
        </p>
        <table className="slack-table" style={{ marginBottom: '1.25rem' }}>
          <thead>
            <tr><th>Activiteit</th><th>Beschrijving</th><th>Duurtijd</th><th>Hangt af van</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Act 1</strong></td><td>Elektriciteit vernieuwen</td><td>4 weken</td><td>—</td></tr>
            <tr><td><strong>Act 2</strong></td><td>Muren schilderen</td><td>3 weken</td><td>—</td></tr>
            <tr><td><strong>Act 3</strong></td><td>Verlichting ophangen</td><td>2 weken</td><td>Act 1</td></tr>
            <tr style={{ background: '#eef5fb' }}><td><strong>Act 4</strong></td><td>Meubels plaatsen</td><td>1 week</td><td><strong>Act 1 én Act 2</strong></td></tr>
          </tbody>
        </table>
        <div className="pass-grid" style={{ marginBottom: '1.25rem' }}>
          <div className="pass-card forward" style={{ background: '#fff8f0', borderColor: '#fed7aa' }}>
            <div className="pass-title" style={{ color: '#9a3412' }}>⚠ Het probleem</div>
            <p className="pass-desc">Act 4 hangt af van <strong>zowel</strong> Act 1 als Act 2. Maar Act 3 hangt <strong>enkel</strong> af van Act 1.</p>
            <div className="pass-rule" style={{ background: '#fef3c7' }}>Als je Act 1 en Act 2 naar <em>hetzelfde</em> knooppunt laat lopen, dan zou Act 3 óók afhangen van Act 2, en dat klopt niet!</div>
          </div>
          <div className="pass-card backward" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div className="pass-title" style={{ color: '#166534' }}>✅ De oplossing</div>
            <p className="pass-desc">Gebruik een <strong>schijnactiviteit (0-lijn)</strong> van knooppunt II naar III.</p>
            <div className="pass-rule" style={{ background: '#dcfce7' }}>De schijnactiviteit legt vast dat Act 4 pas kan starten als Act 1 klaar is, <strong>zonder</strong> dat Act 3 ook van Act 2 afhangt.</div>
          </div>
        </div>
      </div>

      <div className="demo-card">
        <div className="demo-header">
          <div>
            <div className="demo-step-counter" id="demo2-step-counter">Stap 0 van 9</div>
            <div className="demo-card-title" id="demo2-title">Netwerk met schijnactiviteit</div>
          </div>
          <span className="demo-phase-badge phase-start" id="demo2-phase-badge">Start</span>
        </div>

        <div className="demo-network-wrap">
          <svg id="demo2-svg" viewBox="0 0 560 340" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="d2-m-def"   markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#888"/></marker>
              <marker id="d2-m-act"   markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#457b9d"/></marker>
              <marker id="d2-m-crit"  markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#e63946"/></marker>
              <marker id="d2-m-relay" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#bbb"/></marker>
              <marker id="d2-m-r-act" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#457b9d"/></marker>
              <clipPath id="d2cl-l" ><rect x="-36" y="-36" width="36" height="72"/></clipPath>
              <clipPath id="d2cl-tr"><rect x="0"   y="-36" width="36" height="36"/></clipPath>
              <clipPath id="d2cl-br"><rect x="0"   y="0"   width="36" height="36"/></clipPath>
            </defs>

            <g id="d2-arr-I-II">
              <line id="d2-line-I-II" x1="122" y1="140" x2="236" y2="86" stroke="#888" strokeWidth="1.8" markerEnd="url(#d2-m-def)"/>
              <text id="d2-lbl-I-II" x="160" y="97" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="11" fill="#999">Act 1: Elektriciteit, 4w</text>
            </g>
            <g id="d2-arr-I-III">
              <line id="d2-line-I-III" x1="122" y1="175" x2="236" y2="234" stroke="#888" strokeWidth="1.8" markerEnd="url(#d2-m-def)"/>
              <text id="d2-lbl-I-III" x="155" y="230" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="11" fill="#999">Act 2: Schilderen, 3w</text>
            </g>
            <g id="d2-arr-II-III">
              <line id="d2-line-II-III" x1="270" y1="106" x2="270" y2="204" stroke="#bbb" strokeWidth="1.6" strokeDasharray="6,4" markerEnd="url(#d2-m-relay)"/>
              <text id="d2-lbl-II-III" x="284" y="160" textAnchor="start" fontFamily="Georgia,serif" fontSize="15" fontWeight="700" fill="#bbb">0</text>
            </g>
            <g id="d2-arr-II-IV">
              <line id="d2-line-II-IV" x1="303" y1="62" x2="425" y2="132" stroke="#888" strokeWidth="1.8" markerEnd="url(#d2-m-def)"/>
              <text id="d2-lbl-II-IV" x="380" y="78" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="11" fill="#999">Act 3: Verlichting, 2w</text>
            </g>
            <g id="d2-arr-III-IV">
              <line id="d2-line-III-IV" x1="303" y1="232" x2="425" y2="175" stroke="#888" strokeWidth="1.8" markerEnd="url(#d2-m-def)"/>
              <text id="d2-lbl-III-IV" x="380" y="224" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="11" fill="#999">Act 4: Meubels, 1w</text>
            </g>

            <DemoNode cx={90} cy={155} label="I" teId="d2-te-I" tlId="d2-tl-I" bdrId="d2-bdr-I" clipPrefix="d2cl"/>
            <DemoNode cx={270} cy={70} label="II" teId="d2-te-II" tlId="d2-tl-II" bdrId="d2-bdr-II" clipPrefix="d2cl"/>
            <DemoNode cx={270} cy={240} label="III" teId="d2-te-III" tlId="d2-tl-III" bdrId="d2-bdr-III" clipPrefix="d2cl"/>
            <DemoNode cx={460} cy={155} label="IV" teId="d2-te-IV" tlId="d2-tl-IV" bdrId="d2-bdr-IV" clipPrefix="d2cl"/>

            <g id="d2-slack" opacity="0" style={{ transition: 'opacity .3s' }}>
              <rect x="55" y="198" width="72" height="18" rx="9" fill="#16a34a"/>
              <text x="91" y="211" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fontWeight="700" fill="#fff">speling = 0</text>
              <rect x="310" y="55" width="72" height="18" rx="9" fill="#16a34a"/>
              <text x="346" y="68" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fontWeight="700" fill="#fff">speling = 0</text>
              <rect x="230" y="283" width="72" height="18" rx="9" fill="#2563eb"/>
              <text x="266" y="296" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fontWeight="700" fill="#fff">speling = 1</text>
              <rect x="420" y="198" width="72" height="18" rx="9" fill="#16a34a"/>
              <text x="456" y="211" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fontWeight="700" fill="#fff">speling = 0</text>
            </g>
          </svg>
        </div>

        <div className="demo-explanation" id="demo2-explanation">
          Dit netwerk heeft 4 knooppunten, 4 activiteiten en een schijnactiviteit (0-lijn). Klik op <strong>Volgende →</strong>.
        </div>

        <div className="demo-nav">
          <button className="demo-btn demo-btn-prev" id="demo2-prev" disabled={d2Cur === 0} onClick={() => setD2Cur((c) => Math.max(0, c - 1))}>← Vorige</button>
          <div className="demo-dots" id="demo2-dots">
            {D2_STEPS.map((_, i) => (
              <div key={i} className={`demo-dot${i === d2Cur ? ' active' : ''}${i < d2Cur ? ' done' : ''}`}/>
            ))}
          </div>
          <button className="demo-btn demo-btn-next" id="demo2-next" disabled={d2Cur === D2_STEPS.length - 1} onClick={() => setD2Cur((c) => Math.min(D2_STEPS.length - 1, c + 1))}>Volgende →</button>
        </div>
        <div className="demo-footer">
          <button className="demo-btn-reset" id="demo2-reset" onClick={() => setD2Cur(0)}>↺ Opnieuw beginnen</button>
        </div>
      </div>
    </section>
  );
}
