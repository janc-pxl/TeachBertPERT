'use client';

import { useEffect, useRef, useState } from 'react';
import { downloadSvgAsJpg } from '@/lib/pert/download';

// ── Data ────────────────────────────────────────────────────────────────────

interface NodeDef {
  id: number;
  label: string;
  x: number;
  y: number;
  te: number;
  tl: number;
  readonly_te?: boolean;
}

interface EdgeDef {
  from: number;
  to: number;
  dur: number;
  act: string;
}

const NODES: NodeDef[] = [
  { id: 1,  label: 'I',    x: 60,  y: 100, te: 0,  tl: 0,  readonly_te: true },
  { id: 2,  label: 'II',   x: 60,  y: 400, te: 0,  tl: 4,  readonly_te: true },
  { id: 3,  label: 'III',  x: 250, y: 170, te: 10, tl: 10 },
  { id: 4,  label: 'IV',   x: 250, y: 400, te: 5,  tl: 21 },
  { id: 5,  label: 'V',    x: 440, y: 80,  te: 16, tl: 16 },
  { id: 6,  label: 'VI',   x: 400, y: 290, te: 15, tl: 18 },
  { id: 7,  label: 'VII',  x: 400, y: 420, te: 7,  tl: 23 },
  { id: 8,  label: 'VIII', x: 590, y: 230, te: 21, tl: 21 },
  { id: 9,  label: 'IX',   x: 620, y: 70,  te: 23, tl: 28 },
  { id: 10, label: 'X',    x: 760, y: 360, te: 29, tl: 29 },
  { id: 11, label: 'XI',   x: 880, y: 180, te: 33, tl: 33 },
];

const EDGES: EdgeDef[] = [
  { from: 1,  to: 3,  dur: 10, act: 'A' },
  { from: 2,  to: 3,  dur: 6,  act: 'B' },
  { from: 2,  to: 4,  dur: 5,  act: 'C' },
  { from: 3,  to: 5,  dur: 6,  act: 'D' },
  { from: 3,  to: 6,  dur: 5,  act: 'E' },
  { from: 4,  to: 7,  dur: 2,  act: 'F' },
  { from: 6,  to: 10, dur: 1,  act: 'J' },
  { from: 5,  to: 8,  dur: 5,  act: 'H' },
  { from: 5,  to: 9,  dur: 7,  act: 'G' },
  { from: 6,  to: 8,  dur: 3,  act: 'I' },
  { from: 7,  to: 10, dur: 6,  act: 'K' },
  { from: 8,  to: 10, dur: 8,  act: 'L' },
  { from: 9,  to: 11, dur: 5,  act: 'M' },
  { from: 10, to: 11, dur: 4,  act: 'N' },
];

const CRITICAL_EDGES = new Set(['1-3', '3-5', '5-8', '8-10', '10-11']);

const R = 34;

// ── Activity table rows ─────────────────────────────────────────────────────

const ACTIVITIES = [
  { act: 'A', desc: 'Voorbereiden analyse',             dur: '10 dagen', pre: '—' },
  { act: 'B', desc: 'Gegevensverzameling',              dur: '6 dagen',  pre: '—' },
  { act: 'C', desc: 'Ontwerpen opzetten',               dur: '5 dagen',  pre: '—' },
  { act: 'D', desc: 'Prototype ontwikkelen',            dur: '6 dagen',  pre: 'A, B' },
  { act: 'E', desc: 'Test uitvoeren',                   dur: '5 dagen',  pre: 'A, B' },
  { act: 'F', desc: 'Feedback verwerken',               dur: '2 dagen',  pre: 'C' },
  { act: 'G', desc: 'Systeemintegratie',                dur: '7 dagen',  pre: 'D' },
  { act: 'H', desc: 'Interface ontwerpen',              dur: '5 dagen',  pre: 'D' },
  { act: 'I', desc: 'Gebruikerservaring optimaliseren', dur: '3 dagen',  pre: 'E' },
  { act: 'J', desc: 'Functionaliteit implementeren',    dur: '1 dag',    pre: 'E' },
  { act: 'K', desc: 'Finale configuratie',              dur: '6 dagen',  pre: 'F' },
  { act: 'L', desc: 'Interface testen',                 dur: '8 dagen',  pre: 'H, I' },
  { act: 'M', desc: 'Integratietest',                   dur: '5 dagen',  pre: 'G' },
  { act: 'N', desc: 'Volledige implementatie',          dur: '4 dagen',  pre: 'J, K, L' },
];

// ── Edge state stored outside React (imperative SVG refs) ────────────────────

interface EdgeState {
  line: SVGLineElement;
  lbl: SVGTextElement;
  hit: SVGLineElement;
  selected: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Exercise1() {
  const [feedback, setFeedback] = useState('');
  const [feedbackClass, setFeedbackClass] = useState('ex1-feedback');

  // Mutable refs for imperative SVG data (not re-rendered by React)
  const inputElsRef = useRef<Record<string, HTMLInputElement>>({});
  const edgeElsRef  = useRef<Record<string, EdgeState>>({});
  const nodeDefsRef = useRef<NodeDef[]>([]);
  const drawnRef    = useRef(false);

  useEffect(() => {
    if (drawnRef.current) return;
    drawnRef.current = true;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const edgesG  = document.getElementById('ex1-edges')  as SVGGElement | null;
    const nodesG  = document.getElementById('ex1-nodes')  as SVGGElement | null;
    if (!edgesG || !nodesG) return;

    const nodeMap: Record<number, NodeDef> = {};
    NODES.forEach(n => { nodeMap[n.id] = n; });

    const inputEls = inputElsRef.current;
    const edgeEls  = edgeElsRef.current;
    nodeDefsRef.current = NODES;

    // ── Draw edges ──────────────────────────────────────────────────────────
    EDGES.forEach(e => {
      const fn = nodeMap[e.from], tn = nodeMap[e.to];
      const dx = tn.x - fn.x, dy = tn.y - fn.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / dist, uy = dy / dist;
      const x1 = fn.x + ux * R, y1 = fn.y + uy * R;
      const x2 = tn.x - ux * (R + 10), y2 = tn.y - uy * (R + 10);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const key = e.from + '-' + e.to;

      const hit = document.createElementNS(SVG_NS, 'line') as SVGLineElement;
      hit.setAttribute('x1', String(x1)); hit.setAttribute('y1', String(y1));
      hit.setAttribute('x2', String(x2)); hit.setAttribute('y2', String(y2));
      hit.classList.add('ex1-edge-hit');
      edgesG.appendChild(hit);

      const line = document.createElementNS(SVG_NS, 'line') as SVGLineElement;
      line.setAttribute('x1', String(x1)); line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2));
      line.setAttribute('stroke', '#888');
      line.setAttribute('stroke-width', '1.8');
      line.setAttribute('marker-end', 'url(#ex1-m-def)');
      line.classList.add('ex1-edge-line');
      edgesG.appendChild(line);

      const perpX = -uy * 14, perpY = ux * 14;
      const lbl = document.createElementNS(SVG_NS, 'text') as SVGTextElement;
      lbl.setAttribute('x', String(mx + perpX));
      lbl.setAttribute('y', String(my + perpY + 4));
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('font-family', 'Segoe UI,sans-serif');
      lbl.setAttribute('font-size', '11');
      lbl.setAttribute('font-weight', '600');
      lbl.setAttribute('fill', '#555');
      lbl.classList.add('ex1-edge-lbl');
      lbl.textContent = e.act + ' (' + e.dur + 'd)';
      edgesG.appendChild(lbl);

      edgeEls[key] = { hit, line, lbl, selected: false };

      hit.addEventListener('click', () => {
        const ed = edgeEls[key];
        ed.selected = !ed.selected;
        ed.line.classList.toggle('selected', ed.selected);
        ed.lbl.classList.toggle('selected', ed.selected);
        ed.line.setAttribute('marker-end', ed.selected ? 'url(#ex1-m-sel)' : 'url(#ex1-m-def)');
      });
    });

    // ── Draw nodes ──────────────────────────────────────────────────────────
    NODES.forEach(n => {
      const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
      g.setAttribute('transform', `translate(${n.x},${n.y})`);

      const bgL = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
      bgL.setAttribute('r', String(R)); bgL.setAttribute('fill', '#eef0f2');
      bgL.setAttribute('clip-path', 'url(#ex1-cl)');
      g.appendChild(bgL);

      const bgTR = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
      bgTR.setAttribute('r', String(R)); bgTR.setAttribute('fill', '#e8f5e9');
      bgTR.setAttribute('clip-path', 'url(#ex1-ctr)');
      g.appendChild(bgTR);

      const bgBR = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
      bgBR.setAttribute('r', String(R)); bgBR.setAttribute('fill', '#e3f0fb');
      bgBR.setAttribute('clip-path', 'url(#ex1-cbr)');
      g.appendChild(bgBR);

      const border = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
      border.setAttribute('r', String(R)); border.setAttribute('fill', 'none');
      border.setAttribute('stroke', '#333'); border.setAttribute('stroke-width', '2.5');
      g.appendChild(border);

      const lineV = document.createElementNS(SVG_NS, 'line') as SVGLineElement;
      lineV.setAttribute('x1', '0'); lineV.setAttribute('y1', String(-R));
      lineV.setAttribute('x2', '0'); lineV.setAttribute('y2', String(R));
      lineV.setAttribute('stroke', '#555'); lineV.setAttribute('stroke-width', '1.6');
      g.appendChild(lineV);

      const lineH = document.createElementNS(SVG_NS, 'line') as SVGLineElement;
      lineH.setAttribute('x1', '0'); lineH.setAttribute('y1', '0');
      lineH.setAttribute('x2', String(R)); lineH.setAttribute('y2', '0');
      lineH.setAttribute('stroke', '#555'); lineH.setAttribute('stroke-width', '1.6');
      g.appendChild(lineH);

      const txt = document.createElementNS(SVG_NS, 'text') as SVGTextElement;
      txt.setAttribute('x', String(-R / 2)); txt.setAttribute('y', '5');
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-family', 'Segoe UI,sans-serif');
      txt.setAttribute('font-size', n.label.length > 3 ? '10' : n.label.length > 2 ? '11' : '14');
      txt.setAttribute('font-weight', '700'); txt.setAttribute('fill', '#333');
      txt.textContent = n.label;
      g.appendChild(txt);

      // TE input (top-right quadrant)
      const foTE = document.createElementNS(SVG_NS, 'foreignObject');
      foTE.setAttribute('x', '2'); foTE.setAttribute('y', String(-R + 4));
      foTE.setAttribute('width', String(R - 4)); foTE.setAttribute('height', String(R - 4));
      const teInput = document.createElement('input');
      teInput.type = 'number'; teInput.className = 'ex1-input';
      teInput.placeholder = '?';
      teInput.setAttribute('aria-label', `TE knooppunt ${n.label}`);
      if (n.readonly_te) {
        teInput.value = String(n.te);
        teInput.readOnly = true;
        teInput.classList.add('readonly');
      }
      foTE.appendChild(teInput);
      g.appendChild(foTE);
      inputEls[n.id + '-te'] = teInput;

      // TL input (bottom-right quadrant)
      const foTL = document.createElementNS(SVG_NS, 'foreignObject');
      foTL.setAttribute('x', '2'); foTL.setAttribute('y', '2');
      foTL.setAttribute('width', String(R - 4)); foTL.setAttribute('height', String(R - 4));
      const tlInput = document.createElement('input');
      tlInput.type = 'number'; tlInput.className = 'ex1-input';
      tlInput.placeholder = '?';
      tlInput.setAttribute('aria-label', `TL knooppunt ${n.label}`);
      foTL.appendChild(tlInput);
      g.appendChild(foTL);
      inputEls[n.id + '-tl'] = tlInput;

      nodesG.appendChild(g);
    });
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────────

  function handleCheck() {
    let correct = 0, total = 0;
    const inputEls = inputElsRef.current;
    const edgeEls  = edgeElsRef.current;

    NODES.forEach(n => {
      const teEl  = inputEls[n.id + '-te'];
      const teVal = teEl.value.trim() === '' ? NaN : Number(teEl.value.trim());
      total++;
      if (teVal === n.te) {
        teEl.classList.remove('wrong'); teEl.classList.add('correct'); correct++;
      } else {
        teEl.classList.remove('correct'); teEl.classList.add('wrong'); teEl.title = 'Fout';
      }

      const tlEl  = inputEls[n.id + '-tl'];
      const tlVal = tlEl.value.trim() === '' ? NaN : Number(tlEl.value.trim());
      total++;
      if (tlVal === n.tl) {
        tlEl.classList.remove('wrong'); tlEl.classList.add('correct'); correct++;
      } else {
        tlEl.classList.remove('correct'); tlEl.classList.add('wrong'); tlEl.title = 'Fout';
      }
    });

    let edgesCorrect = 0;
    const edgesTotal = CRITICAL_EDGES.size;
    let wrongSelections = 0;

    Object.keys(edgeEls).forEach(key => {
      const ed = edgeEls[key];
      const shouldBeCrit = CRITICAL_EDGES.has(key);
      if (shouldBeCrit && ed.selected) edgesCorrect++;
      if (!shouldBeCrit && ed.selected) wrongSelections++;
    });

    const pathPerfect = edgesCorrect === edgesTotal && wrongSelections === 0;
    total += edgesTotal;
    correct += edgesCorrect;

    const pct = Math.round(correct / total * 100);
    let msg = `Score: ${correct}/${total} (${pct}%)`;
    if (pathPerfect)           msg += ' \u2014 Kritiek pad correct!';
    else if (wrongSelections > 0) msg += ' \u2014 Kritiek pad: niet correct.';
    else if (edgesCorrect === 0)  msg += ' \u2014 Kritiek pad: niet aangeduid.';
    else                          msg += ' \u2014 Kritiek pad: niet volledig.';

    setFeedback(msg);
    if (correct === total && pathPerfect) setFeedbackClass('ex1-feedback success');
    else if (pct >= 60)                  setFeedbackClass('ex1-feedback partial');
    else                                 setFeedbackClass('ex1-feedback fail');
  }

  // ── Reset ───────────────────────────────────────────────────────────────────

  function handleReset() {
    const inputEls = inputElsRef.current;
    const edgeEls  = edgeElsRef.current;

    NODES.forEach(n => {
      const teEl = inputEls[n.id + '-te'];
      const tlEl = inputEls[n.id + '-tl'];
      if (!n.readonly_te) teEl.value = '';
      tlEl.value = '';
      teEl.classList.remove('correct', 'wrong');
      tlEl.classList.remove('correct', 'wrong');
      teEl.title = ''; tlEl.title = '';
    });

    Object.keys(edgeEls).forEach(key => {
      const ed = edgeEls[key];
      ed.selected = false;
      ed.line.classList.remove('selected');
      ed.lbl.classList.remove('selected');
      ed.line.setAttribute('stroke', '#888');
      ed.line.setAttribute('stroke-width', '1.8');
      ed.line.setAttribute('marker-end', 'url(#ex1-m-def)');
      ed.line.removeAttribute('stroke-dasharray');
    });

    setFeedback('');
    setFeedbackClass('ex1-feedback');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section id="oefening1" style={{ marginTop: '3rem' }}>
      <div className="section-header">
        <div className="section-badge">Oefening 1</div>
        <h1>Vul het PERT-netwerk in</h1>
        <p>
          Vul de T<sub>E</sub> en T<sub>L</sub> waarden in voor elk knooppunt en
          selecteer het kritieke pad.
        </p>
      </div>

      <div className="ex1-instructions">
        <strong>Opdracht:</strong> Hieronder zie je een PERT-netwerk met 11 knooppunten en 14
        activiteiten.{' '}
        <strong>(1)</strong> Vul voor elk knooppunt de T<sub>E</sub> (vroegst mogelijke
        tijdstip) en T<sub>L</sub> (laatste toelaatbare tijdstip) in.{' '}
        <strong>(2)</strong> Klik op de pijlen die op het{' '}
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>kritieke pad</span>{' '}
        liggen.{' '}
        <strong>(3)</strong> Klik op <em>Controleer</em> om je antwoorden te controleren.
      </div>

      {/* Activity reference table */}
      <table
        className="ex1-act-table"
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem', marginBottom: '1.25rem' }}
      >
        <thead>
          <tr style={{ background: '#030203', color: '#fff' }}>
            <th style={{ padding: '.55rem .7rem', textAlign: 'left', borderRadius: '8px 0 0 0', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Act</th>
            <th style={{ padding: '.55rem .7rem', textAlign: 'left', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Omschrijving</th>
            <th style={{ padding: '.55rem .7rem', textAlign: 'center', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Duurtijd</th>
            <th style={{ padding: '.55rem .7rem', textAlign: 'left', borderRadius: '0 8px 0 0', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Voorganger(s)</th>
          </tr>
        </thead>
        <tbody>
          {ACTIVITIES.map((row, i) => {
            const isLast = i === ACTIVITIES.length - 1;
            const cellStyle = {
              padding: '.4rem .7rem',
              borderBottom: isLast ? undefined : '1px solid #dde2ea',
            };
            return (
              <tr key={row.act}>
                <td style={{ ...cellStyle, fontWeight: 700 }}>{row.act}</td>
                <td style={cellStyle}>{row.desc}</td>
                <td style={{ ...cellStyle, textAlign: 'center' }}>{row.dur}</td>
                <td style={cellStyle}>{row.pre}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Diagram card */}
      <div className="card">
        <div className="card-title">PERT-netwerk</div>

        <div className="ex1-wrap" id="ex1-wrap">
          <svg id="ex1-svg" viewBox="0 0 940 500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="ex1-m-def" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0,9 3.5,0 7" fill="#888" />
              </marker>
              <marker id="ex1-m-sel" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0,9 3.5,0 7" fill="#e63946" />
              </marker>
              <clipPath id="ex1-cl">
                <rect x="-34" y="-34" width="34" height="68" />
              </clipPath>
              <clipPath id="ex1-ctr">
                <rect x="0" y="-34" width="34" height="34" />
              </clipPath>
              <clipPath id="ex1-cbr">
                <rect x="0" y="0" width="34" height="34" />
              </clipPath>
            </defs>
            <g id="ex1-edges" />
            <g id="ex1-nodes" />
          </svg>
        </div>

        <div className="ex1-controls">
          <button className="ex1-check-btn" onClick={handleCheck}>Controleer</button>
          <button className="ex1-reset-btn" onClick={handleReset}>Opnieuw beginnen</button>
          <button
            className="ex3-tool-download"
            onClick={() => downloadSvgAsJpg('ex1-svg', 'oefening-1.jpg')}
          >
            &#8681; Download
          </button>
          <div className={feedbackClass}>{feedback}</div>
        </div>
      </div>
    </section>
  );
}
