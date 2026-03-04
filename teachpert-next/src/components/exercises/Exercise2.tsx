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
  act?: string;
  dashed?: boolean;
}

const NODES: NodeDef[] = [
  { id: 1,  label: 'I',    x: 70,  y: 70,  te: 0,  tl: 0,  readonly_te: true },
  { id: 2,  label: 'II',   x: 350, y: 110, te: 14, tl: 14 },
  { id: 3,  label: 'III',  x: 130, y: 220, te: 5,  tl: 5  },
  { id: 4,  label: 'IV',   x: 130, y: 430, te: 14, tl: 34 },
  { id: 5,  label: 'V',    x: 580, y: 160, te: 32, tl: 32 },
  { id: 6,  label: 'VI',   x: 370, y: 460, te: 40, tl: 45 },
  { id: 7,  label: 'VII',  x: 770, y: 80,  te: 40, tl: 40 },
  { id: 8,  label: 'VIII', x: 310, y: 290, te: 14, tl: 14 },
  { id: 9,  label: 'IX',   x: 510, y: 380, te: 40, tl: 45 },
  { id: 10, label: 'X',    x: 840, y: 350, te: 47, tl: 47 },
];

const EDGES: EdgeDef[] = [
  { from: 1, to: 2,  dur: 4,  act: 'A' },
  { from: 1, to: 3,  dur: 5,  act: 'B' },
  { from: 3, to: 8,  dur: 9,  act: 'C' },
  { from: 2, to: 5,  dur: 18, act: 'D' },
  { from: 8, to: 5,  dur: 6,  act: 'E' },
  { from: 3, to: 4,  dur: 9,  act: 'F' },
  { from: 4, to: 9,  dur: 11, act: 'G' },
  { from: 4, to: 6,  dur: 3,  act: 'H' },
  { from: 5, to: 7,  dur: 8,  act: 'I' },
  { from: 5, to: 10, dur: 13, act: 'J' },
  { from: 5, to: 9,  dur: 8,  act: 'K' },
  { from: 6, to: 10, dur: 2,  act: 'L' },
  { from: 7, to: 10, dur: 7,  act: 'M' },
  { from: 8, to: 2,  dur: 0,  dashed: true },
  { from: 9, to: 6,  dur: 0,  dashed: true },
];

const CRITICAL_EDGES = new Set(['1-3', '3-8', '8-2', '2-5', '5-7', '7-10']);

const R = 34;

// ── Activity table rows ─────────────────────────────────────────────────────

const ACTIVITIES = [
  { act: 'A',              desc: 'Bedrijfsprocessen identificeren',    dur: '4 dagen',  pre: '—' },
  { act: 'B',              desc: 'Documentatie digitaliseren',         dur: '5 dagen',  pre: '—' },
  { act: 'C',              desc: 'Workflow optimaliseren',             dur: '9 dagen',  pre: 'B' },
  { act: 'D',              desc: 'Data-analyse uitvoeren',             dur: '18 dagen', pre: 'A, C' },
  { act: 'E',              desc: 'Cloudoplossingen implementeren',     dur: '6 dagen',  pre: 'C' },
  { act: 'F',              desc: 'Digitale archivering opzetten',      dur: '9 dagen',  pre: 'B' },
  { act: 'G',              desc: 'Automatisering implementeren',       dur: '11 dagen', pre: 'F' },
  { act: 'H',              desc: 'Software integreren',                dur: '3 dagen',  pre: 'F' },
  { act: 'I',              desc: 'Trainingsprogramma ontwikkelen',     dur: '8 dagen',  pre: 'D, E' },
  { act: 'J',              desc: 'Gebruikersbegeleiding verzorgen',    dur: '13 dagen', pre: 'D, E' },
  { act: 'K',              desc: 'Feedback verzamelen en verwerken',   dur: '8 dagen',  pre: 'D, E' },
  { act: 'L',              desc: 'Trainingsprogramma ontwikkelen',     dur: '2 dagen',  pre: 'G, H' },
  { act: 'M',              desc: 'Prestatieanalyse uitvoeren',         dur: '7 dagen',  pre: 'I' },
];

// ── Edge state stored outside React (imperative SVG refs) ────────────────────

interface EdgeState {
  line: SVGLineElement;
  lbl: SVGTextElement;
  hit: SVGLineElement;
  selected: boolean;
  dashed: boolean;
  defaultMarker: string;
  defaultStroke: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Exercise2() {
  const [feedback, setFeedback] = useState('');
  const [feedbackClass, setFeedbackClass] = useState('ex1-feedback');

  const inputElsRef = useRef<Record<string, HTMLInputElement>>({});
  const edgeElsRef  = useRef<Record<string, EdgeState>>({});
  const drawnRef    = useRef(false);

  useEffect(() => {
    if (drawnRef.current) return;
    drawnRef.current = true;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const edgesG = document.getElementById('ex2-edges') as SVGGElement | null;
    const nodesG = document.getElementById('ex2-nodes') as SVGGElement | null;
    if (!edgesG || !nodesG) return;

    const nodeMap: Record<number, NodeDef> = {};
    NODES.forEach(n => { nodeMap[n.id] = n; });

    const inputEls = inputElsRef.current;
    const edgeEls  = edgeElsRef.current;

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

      const defaultMarker = e.dashed ? 'url(#ex2-m-dash)' : 'url(#ex2-m-def)';
      const defaultStroke = e.dashed ? '#bbb' : '#888';

      const hit = document.createElementNS(SVG_NS, 'line') as SVGLineElement;
      hit.setAttribute('x1', String(x1)); hit.setAttribute('y1', String(y1));
      hit.setAttribute('x2', String(x2)); hit.setAttribute('y2', String(y2));
      hit.classList.add('ex1-edge-hit');
      edgesG.appendChild(hit);

      const line = document.createElementNS(SVG_NS, 'line') as SVGLineElement;
      line.setAttribute('x1', String(x1)); line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2));
      line.setAttribute('stroke', defaultStroke);
      line.setAttribute('stroke-width', '1.8');
      line.setAttribute('marker-end', defaultMarker);
      line.classList.add('ex1-edge-line');
      if (e.dashed) line.setAttribute('stroke-dasharray', '8 4');
      edgesG.appendChild(line);

      const perpX = -uy * 14, perpY = ux * 14;
      const lbl = document.createElementNS(SVG_NS, 'text') as SVGTextElement;
      lbl.setAttribute('x', String(mx + perpX));
      lbl.setAttribute('y', String(my + perpY + 4));
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('font-family', 'Segoe UI,sans-serif');
      lbl.setAttribute('font-weight', '600');
      lbl.setAttribute('fill', e.dashed ? '#bbb' : '#555');
      lbl.setAttribute('font-size', '11');
      lbl.classList.add('ex1-edge-lbl');
      lbl.textContent = e.dashed ? '0' : (e.act! + ' (' + e.dur + 'd)');
      edgesG.appendChild(lbl);

      edgeEls[key] = { hit, line, lbl, selected: false, dashed: !!e.dashed, defaultMarker, defaultStroke };

      hit.addEventListener('click', () => {
        const ed = edgeEls[key];
        ed.selected = !ed.selected;
        ed.line.classList.toggle('selected', ed.selected);
        ed.lbl.classList.toggle('selected', ed.selected);
        ed.line.setAttribute('marker-end', ed.selected ? 'url(#ex2-m-sel)' : ed.defaultMarker);
      });
    });

    // ── Draw nodes ──────────────────────────────────────────────────────────
    NODES.forEach(n => {
      const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
      g.setAttribute('transform', `translate(${n.x},${n.y})`);

      const bgL = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
      bgL.setAttribute('r', String(R)); bgL.setAttribute('fill', '#eef0f2');
      bgL.setAttribute('clip-path', 'url(#ex2-cl)');
      g.appendChild(bgL);

      const bgTR = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
      bgTR.setAttribute('r', String(R)); bgTR.setAttribute('fill', '#e8f5e9');
      bgTR.setAttribute('clip-path', 'url(#ex2-ctr)');
      g.appendChild(bgTR);

      const bgBR = document.createElementNS(SVG_NS, 'circle') as SVGCircleElement;
      bgBR.setAttribute('r', String(R)); bgBR.setAttribute('fill', '#e3f0fb');
      bgBR.setAttribute('clip-path', 'url(#ex2-cbr)');
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
      const teVal = teEl.value.trim() === '' ? NaN : parseInt(teEl.value, 10);
      total++;
      if (teVal === n.te) {
        teEl.classList.remove('wrong'); teEl.classList.add('correct'); correct++;
      } else {
        teEl.classList.remove('correct'); teEl.classList.add('wrong'); teEl.title = 'Fout';
      }

      const tlEl  = inputEls[n.id + '-tl'];
      const tlVal = tlEl.value.trim() === '' ? NaN : parseInt(tlEl.value, 10);
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
    if (pathPerfect)              msg += ' \u2014 Kritiek pad correct!';
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
      ed.line.setAttribute('stroke', ed.defaultStroke);
      ed.line.setAttribute('stroke-width', '1.8');
      ed.line.setAttribute('marker-end', ed.defaultMarker);
      if (ed.dashed) {
        ed.line.setAttribute('stroke-dasharray', '8 4');
      } else {
        ed.line.removeAttribute('stroke-dasharray');
      }
    });

    setFeedback('');
    setFeedbackClass('ex1-feedback');
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section id="oefening2" style={{ marginTop: '3rem' }}>
      <div className="section-header">
        <div className="section-badge">Oefening 2</div>
        <h1>Digitale transformatie</h1>
        <p>
          Vul de T<sub>E</sub> en T<sub>L</sub> waarden in voor elk knooppunt en
          selecteer het kritieke pad.
        </p>
      </div>

      <div className="ex1-instructions">
        <strong>Opdracht:</strong> Hieronder zie je een PERT-netwerk met 10 knooppunten en 13
        activiteiten.{' '}
        <strong>(1)</strong> Vul voor elk knooppunt de T<sub>E</sub> (vroegst mogelijke
        tijdstip) en T<sub>L</sub> (laatste toelaatbare tijdstip) in.{' '}
        <strong>(2)</strong> Klik op de pijlen die op het{' '}
        <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>kritieke pad</span>{' '}
        liggen.{' '}
        <strong>(3)</strong> Klik op <em>Controleer</em> om je antwoorden te checken.
      </div>

      {/* Activity reference table */}
      <table
        className="ex2-act-table"
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem', marginBottom: '1.25rem' }}
      >
        <thead>
          <tr style={{ background: '#030203', color: '#fff' }}>
            <th style={{ padding: '.55rem .7rem', textAlign: 'left', borderRadius: '8px 0 0 0', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Act</th>
            <th style={{ padding: '.55rem .7rem', textAlign: 'left', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Omschrijving</th>
            <th style={{ padding: '.55rem .7rem', textAlign: 'center', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Duur</th>
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

        <div className="ex1-wrap" id="ex2-wrap">
          <svg id="ex2-svg" viewBox="0 0 940 500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="ex2-m-def" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0,9 3.5,0 7" fill="#888" />
              </marker>
              <marker id="ex2-m-sel" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0,9 3.5,0 7" fill="#e63946" />
              </marker>
              <marker id="ex2-m-dash" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0,9 3.5,0 7" fill="#bbb" />
              </marker>
              <clipPath id="ex2-cl">
                <rect x="-34" y="-34" width="34" height="68" />
              </clipPath>
              <clipPath id="ex2-ctr">
                <rect x="0" y="-34" width="34" height="34" />
              </clipPath>
              <clipPath id="ex2-cbr">
                <rect x="0" y="0" width="34" height="34" />
              </clipPath>
            </defs>
            <g id="ex2-edges" />
            <g id="ex2-nodes" />
          </svg>
        </div>

        <div className="ex1-controls">
          <button className="ex1-check-btn" onClick={handleCheck}>Controleer</button>
          <button className="ex1-reset-btn" onClick={handleReset}>Opnieuw beginnen</button>
          <button
            className="ex3-tool-download"
            onClick={() => downloadSvgAsJpg('ex2-svg', 'oefening-2.jpg')}
          >
            &#8681; Download
          </button>
          <div className={feedbackClass}>{feedback}</div>
        </div>
      </div>
    </section>
  );
}
