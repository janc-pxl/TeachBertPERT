'use client';
import { useEffect, useRef, useState } from 'react';
import { createPertBuilder } from '@/lib/pert/createPertBuilder';
import { downloadSvgAsJpg } from '@/lib/pert/download';
import { exportNetwork, importNetwork } from '@/lib/pert/importExport';
import type { Activity, PertBuilderAPI } from '@/lib/pert/types';

const ACTIVITIES: Activity[] = [
  { id:'1',  desc:'Behoefteanalyse maken',        pred:[],         to:3, tl:5, tp:7,   te:5  },
  { id:'2',  desc:'Technologie verkennen',        pred:[],         to:2, tl:3, tp:4,   te:3  },
  { id:'3',  desc:'UI-ontwerp maken',             pred:['2'],      to:4, tl:6, tp:8,   te:6  },
  { id:'4',  desc:'Backendarchitectuur',          pred:['1'],      to:2, tl:3, tp:10,  te:4  },
  { id:'5',  desc:'Prototype bouwen',             pred:['3'],      to:3, tl:4, tp:5,   te:4  },
  { id:'6',  desc:'Database-ontwerp',             pred:['4'],      to:4, tl:6, tp:14,  te:7  },
  { id:'7',  desc:'User stories verwerken',       pred:['5'],      to:2, tl:3, tp:4,   te:3  },
  { id:'8',  desc:'API-documentatie',             pred:['6'],      to:1, tl:2, tp:3,   te:2  },
  { id:'9',  desc:'Frontend implementatie',       pred:['6','7'],  to:5, tl:7, tp:15,  te:8  },
  { id:'10', desc:'Backend implementatie',        pred:['8'],      to:2, tl:3, tp:4,   te:3  },
  { id:'11', desc:'Integratietesten',             pred:['9','10'], to:2, tl:3, tp:4,   te:3  },
  { id:'12', desc:'Finale tests en lancering',    pred:['11'],     to:1, tl:2, tp:9,   te:3  },
];

export function Exercise5() {
  const builderRef = useRef<PertBuilderAPI | null>(null);
  const [locked, setLocked] = useState(true);
  const [teFeedback, setTeFeedback] = useState('');
  const [teFeedbackClass, setTeFeedbackClass] = useState('ex1-feedback');
  const [netFeedback, setNetFeedback] = useState('');
  const [netFeedbackClass, setNetFeedbackClass] = useState('ex1-feedback');
  const teInputsRef = useRef<Record<string, HTMLInputElement>>({});

  // Mount PERT builder
  useEffect(() => {
    const builder = createPertBuilder({
      prefix: 'ex5',
      activities: ACTIVITIES,
      durField: 'te',
      canvasHeight: 500,
      labels: ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'],
      edgeLabelFn: (act, dur) => 'Act ' + act + '(' + dur + ')',
      optionLabelFn: (a) => `Act ${a.id} — ${a.desc}`,
      popupDurReadonly: true,
    });
    builderRef.current = builder;
    return () => { builderRef.current = null; };
  }, []);

  // Populate TE table rows after mount
  useEffect(() => {
    const tbody = document.getElementById('ex5-te-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    ACTIVITIES.forEach((a) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${a.id}</strong></td>` +
        `<td style="text-align:left;font-size:.82rem;">${a.desc}</td>` +
        `<td>${a.pred.length ? a.pred.join(', ') : '—'}</td>` +
        `<td>${a.to}</td><td>${a.tl}</td><td>${a.tp}</td>` +
        `<td><input type="number" class="ex3-te-input" data-act="${a.id}" placeholder="?"></td>`;
      tbody.appendChild(tr);
      teInputsRef.current[a.id] = tr.querySelector('.ex3-te-input') as HTMLInputElement;
    });
  }, []);

  function handleTeCheck() {
    const teInputs = teInputsRef.current;
    let correct = 0;
    ACTIVITIES.forEach((a) => {
      const inp = teInputs[a.id];
      if (!inp) return;
      const val = inp.value.trim() === '' ? NaN : Math.round(parseFloat(inp.value));
      if (val === a.te) {
        inp.classList.remove('wrong'); inp.classList.add('correct'); correct++;
      } else {
        inp.classList.remove('correct'); inp.classList.add('wrong');
      }
    });
    let msg = `Score: ${correct}/${ACTIVITIES.length}`;
    let cls = 'ex1-feedback';
    if (correct === ACTIVITIES.length) {
      cls = 'ex1-feedback success';
      msg += ' — Alle tₑ waarden correct! Stap 2 is nu ontgrendeld.';
      setLocked(false);
    } else {
      cls = correct >= 7 ? 'ex1-feedback partial' : 'ex1-feedback fail';
    }
    setTeFeedback(msg);
    setTeFeedbackClass(cls);
  }

  function handleTeReset() {
    const teInputs = teInputsRef.current;
    ACTIVITIES.forEach((a) => {
      const inp = teInputs[a.id];
      if (inp) { inp.value = ''; inp.classList.remove('correct','wrong'); }
    });
    setTeFeedback('');
    setTeFeedbackClass('ex1-feedback');
  }

  function handleNetCheck() {
    const builder = builderRef.current;
    if (!builder) return;
    const { nodes, edges, computeTE, computeTL, canReach } = builder;

    let score = 0, total = 0;
    const messages: string[] = [];
    const actEdges = edges.filter((e) => !e.dashed);
    total += 1;
    if (actEdges.length === 12) score++; else messages.push(`Activiteiten: ${actEdges.length}/12`);

    const actMap: Record<string, typeof edges[0]> = {};
    actEdges.forEach((e) => { if (e.act) actMap[e.act] = e; });

    ACTIVITIES.forEach((a) => {
      total++;
      const edge = actMap[a.id];
      if (edge && edge.dur === a.te) score++;
      else if (!edge) messages.push(`Activiteit ${a.id} ontbreekt`);
      else messages.push(`Act ${a.id}: duur ${edge.dur} (verwacht ${a.te})`);
    });

    ACTIVITIES.forEach((a) => {
      total++;
      const edge = actMap[a.id];
      if (!edge) return;
      const srcId = edge.fromId;
      if (a.pred.length === 0) {
        const incoming = edges.filter((e) => e.toId === srcId);
        if (incoming.length === 0) score++;
        else messages.push(`${a.id}: bronknooppunt heeft onverwachte inkomende verbindingen`);
      } else {
        let allOk = true;
        a.pred.forEach((predId) => {
          const predEdge = actMap[predId];
          if (!predEdge) { allOk = false; return; }
          if (!canReach(predEdge.toId, srcId, {})) allOk = false;
        });
        if (allOk) score++; else messages.push(`${a.id}: voorgangers bereiken bronknooppunt niet`);
      }
    });

    let projectEnd = 0;
    nodes.forEach((n) => { const te = computeTE(n.id); if (te > projectEnd) projectEnd = te; });

    nodes.forEach((n) => {
      const teVal = n._teInput.value.trim() === '' ? NaN : parseInt(n._teInput.value, 10);
      const tlVal = n._tlInput.value.trim() === '' ? NaN : parseInt(n._tlInput.value, 10);
      const expectedTE = computeTE(n.id), expectedTL = computeTL(n.id, projectEnd);
      total++;
      if (!isNaN(teVal) && teVal === expectedTE) { n._teInput.classList.remove('wrong'); n._teInput.classList.add('correct'); score++; }
      else { n._teInput.classList.remove('correct'); if (!isNaN(teVal)) n._teInput.classList.add('wrong'); }
      total++;
      if (!isNaN(tlVal) && !isNaN(expectedTL) && isFinite(expectedTL) && tlVal === expectedTL) { n._tlInput.classList.remove('wrong'); n._tlInput.classList.add('correct'); score++; }
      else { n._tlInput.classList.remove('correct'); if (!isNaN(tlVal)) n._tlInput.classList.add('wrong'); }
    });

    const criticalEdges = edges.filter((e) => {
      const fromTE = computeTE(e.fromId), toTE = computeTE(e.toId);
      const fromTL = computeTL(e.fromId, projectEnd), toTL = computeTL(e.toId, projectEnd);
      return fromTE === fromTL && toTE === toTL && fromTE + e.dur === toTE;
    });
    let cpCorrect = 0, cpWrong = 0;
    edges.forEach((e) => {
      const isCrit = criticalEdges.includes(e);
      if (isCrit && e.selected) cpCorrect++;
      if (!isCrit && e.selected) cpWrong++;
    });
    const cpTotal = criticalEdges.length;
    total += cpTotal; score += cpCorrect;
    const cpPerfect = cpCorrect === cpTotal && cpWrong === 0;

    const pct = total > 0 ? Math.round(score / total * 100) : 0;
    let msg = `Score: ${score}/${total} (${pct}%)`;
    if (messages.length > 0) msg += ' — ' + messages.slice(0, 3).join('; ');
    if (cpTotal > 0) {
      if (cpPerfect) msg += ' — Kritiek pad correct!';
      else if (cpWrong > 0) msg += ' — Kritiek pad: niet correct.';
      else if (cpCorrect === 0) msg += ' — Kritiek pad: niet aangeduid.';
      else msg += ' — Kritiek pad: niet volledig.';
    }
    if (score === total) msg = `Uitstekend! ${score}/${total} — Het netwerk is perfect!`;
    setNetFeedback(msg);
    setNetFeedbackClass(score === total ? 'ex1-feedback success' : pct >= 60 ? 'ex1-feedback partial' : 'ex1-feedback fail');
  }

  function handleNetReset() {
    builderRef.current?.resetBuilder();
    setNetFeedback('');
    setNetFeedbackClass('ex1-feedback');
  }

  return (
    <section id="oefening5" style={{ marginTop: '3rem' }}>
      <div className="section-header">
        <div className="section-badge">Oefening 5</div>
        <h1>iGame of Thrones</h1>
        <p>Bereken de verwachte tijden, bouw het PERT-netwerk en bepaal het kritieke pad.</p>
      </div>

      <div className="card">
        <div className="card-title">📜 Opdracht</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.7 }}>
          Het bedrijf WalkerWhite wil een applicatie maken voor smartphones over de serie Game of Thrones.
          De televisiezender HBO heeft voorlopig de goedkeuring gegeven aan het bedrijf indien zij de voorgestelde
          deadline halen. De resources en tijd zijn beperkt. 3 projectmanagers stellen samen een PERT-planning op.
          De ingeschatte duur is in dagen.
          <br/><br/>
          <strong>(1)</strong> Bereken eerst de verwachte tijd t<sub>e</sub> voor elke activiteit.{' '}
          <strong>(2)</strong> Bouw daarna het PERT-netwerk door knooppunten te plaatsen en verbindingen te tekenen.{' '}
          <strong>(3)</strong> Vul de T<sub>E</sub> en T<sub>L</sub> waarden in en identificeer het kritieke pad.
        </p>
      </div>

      {/* STAP 1 */}
      <div className="card">
        <div className="card-title">📊 Stap 1 — Bereken t<sub>e</sub></div>
        <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: '1rem' }}>
          Gebruik de formule t<sub>e</sub> = (t<sub>o</sub> + 4 · t<sub>l</sub> + t<sub>p</sub>) / 6 en rond af naar het dichtstbijzijnde geheel getal.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="ex3-te-table" id="ex5-te-table">
            <thead>
              <tr>
                <th>Act</th><th>Beschrijving</th><th>Voorganger</th>
                <th>t<sub>o</sub></th><th>t<sub>l</sub></th><th>t<sub>p</sub></th><th>t<sub>e</sub></th>
              </tr>
            </thead>
            <tbody id="ex5-te-tbody"></tbody>
          </table>
        </div>
        <div className="ex1-controls" style={{ marginTop: '.75rem' }}>
          <button className="ex1-check-btn" onClick={handleTeCheck}>Controleer</button>
          <button className="ex1-reset-btn" onClick={handleTeReset}>Opnieuw</button>
          <div className={teFeedbackClass}>{teFeedback}</div>
        </div>
      </div>

      {/* STAP 2 */}
      <div className={`card${locked ? ' ex3-locked' : ''}`} id="ex5-builder-card">
        {locked && (
          <div className="ex3-lock-overlay" id="ex5-lock-overlay">
            <div className="ex3-lock-msg">
              <strong>🔒 Stap 2 is vergrendeld</strong>
              <p>Voltooi eerst Stap 1 (alle t<sub>e</sub> waarden correct).</p>
            </div>
          </div>
        )}
        <div className="card-title">🔨 Stap 2 — Bouw het PERT-netwerk</div>
        <div className="ex1-instructions" style={{ marginBottom: '1rem' }}>
          <strong>Instructies:</strong> Gebruik de werkbalk om knooppunten te plaatsen en verbindingen te tekenen.
          <strong>(1)</strong> Klik <em>Knooppunt</em> en klik op het canvas om een knooppunt toe te voegen.
          <strong>(2)</strong> Klik <em>Activiteit</em> of <em>0-lijn</em>, klik op een bronknooppunt en dan op een doelknooppunt.
          <strong>(3)</strong> Vul T<sub>E</sub> en T<sub>L</sub> in bij elk knooppunt.
          <strong>(4)</strong> Duid het kritieke pad aan in <em>Selecteer</em>-modus.
          <strong>(5)</strong> Klik op <em>Controleer</em>.
        </div>

        <div className="ex3-toolbar" id="ex5-toolbar">
          <button className="ex3-tool active" data-tool="select">&#8598; Selecteer</button>
          <button className="ex3-tool" data-tool="node">&#8853; Knooppunt</button>
          <button className="ex3-tool" data-tool="edge">&#8594; Activiteit</button>
          <button className="ex3-tool" data-tool="relay">&#8674; 0-lijn</button>
          <button className="ex3-tool" data-tool="delete">&#10005; Verwijder</button>
          <button className="ex3-tool-download" onClick={() => builderRef.current && exportNetwork(builderRef.current, 'oefening-5.json')}>&#8593; Exporteer</button>
          <button className="ex3-tool-download" disabled={locked} title={locked ? 'Ontgrendel eerst Stap 1' : undefined} onClick={() => builderRef.current && importNetwork(builderRef.current)}>&#8595; Importeer</button>
          <button className="ex3-tool-download" onClick={() => downloadSvgAsJpg('ex5-svg', 'oefening-5.jpg')}>&#8681; Download</button>
        </div>

        <div className="ex3-canvas-wrap" id="ex5-canvas-wrap">
          <svg id="ex5-svg" viewBox="0 0 960 500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="ex5-m-def" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#888"/></marker>
              <marker id="ex5-m-dash" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#bbb"/></marker>
              <marker id="ex5-m-sel" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#e63946"/></marker>
              <marker id="ex5-m-ghost" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#457b9d" opacity=".5"/></marker>
              <clipPath id="ex5-cl"><rect x="-30" y="-30" width="30" height="60"/></clipPath>
              <clipPath id="ex5-ctr"><rect x="0" y="-30" width="30" height="30"/></clipPath>
              <clipPath id="ex5-cbr"><rect x="0" y="0" width="30" height="30"/></clipPath>
            </defs>
            <g id="ex5-grid" opacity=".15"></g>
            <line id="ex5-ghost" x1="0" y1="0" x2="0" y2="0" stroke="#457b9d" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#ex5-m-ghost)" opacity="0" pointerEvents="none"/>
            <g id="ex5-edges"></g>
            <g id="ex5-nodes"></g>
          </svg>
          <div className="ex3-edge-popup" id="ex5-edge-popup" style={{ display: 'none' }}>
            <label htmlFor="ex5-popup-act">Activiteit</label>
            <select id="ex5-popup-act"></select>
            <label htmlFor="ex5-popup-dur">Duurtijd (t<sub>e</sub>, in dagen)</label>
            <input type="number" id="ex5-popup-dur" min="0" placeholder="—" readOnly style={{ background: 'var(--bg)', color: 'var(--muted)', cursor: 'default' }}/>
            <div className="ex3-edge-popup-btns">
              <button className="ex3-popup-ok" id="ex5-popup-ok">OK</button>
              <button className="ex3-popup-cancel" id="ex5-popup-cancel">Annuleer</button>
            </div>
          </div>
        </div>

        <div className="ex1-controls" style={{ marginTop: '1rem' }}>
          <button className="ex1-check-btn" onClick={handleNetCheck}>Controleer</button>
          <button className="ex1-reset-btn" onClick={handleNetReset}>Opnieuw beginnen</button>
          <div className={netFeedbackClass}>{netFeedback}</div>
        </div>
      </div>
    </section>
  );
}
