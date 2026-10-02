'use client';
import { useEffect, useRef, useState } from 'react';
import { createPertBuilder } from '@/lib/pert/createPertBuilder';
import { downloadSvgAsJpg } from '@/lib/pert/download';
import { exportNetwork, importNetwork } from '@/lib/pert/importExport';
import { hasExtraDependency, structureErrors } from '@/lib/pert/validation';
import type { Activity, PertBuilderAPI } from '@/lib/pert/types';
import { BenFeedback } from '@/components/ben/BenFeedback';

const ACTIVITIES: Activity[] = [
  { id:'A', desc:'Maak de plannen',               pred:[],        to:1, tl:2, tp:3,  te:2 },
  { id:'B', desc:'Zoek voldoende dienaren',       pred:[],        to:3, tl:3, tp:3,  te:3 },
  { id:'C', desc:'Hak en transporteer rotsen',    pred:['A','B'], to:8, tl:8, tp:14, te:9 },
  { id:'D', desc:'Leid dienaren op als beeldhouwers', pred:['B'], to:2, tl:3, tp:4,  te:3 },
  { id:'E', desc:'Beeldhouw figuren',             pred:['C','D'], to:8, tl:10,tp:12, te:10 },
  { id:'F', desc:'Leg de fundamenten',            pred:['C'],     to:5, tl:10,tp:15, te:10 },
  { id:'G', desc:'Verplaats beeld naar piramide', pred:['E','F'], to:3, tl:5, tp:7,  te:5 },
  { id:'H', desc:'Vorm piramide met rotsblokken', pred:['G'],     to:27,tl:32,tp:43, te:33 },
];

export function Exercise3() {
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
      prefix: 'ex3',
      activities: ACTIVITIES,
      durField: 'te',
      canvasHeight: 500,
      labels: ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'],
      edgeLabelFn: (act, dur) => `${act}(${dur})`,
      optionLabelFn: (a) => `${a.id}, ${a.desc}`,
      popupDurReadonly: true,
    });
    builderRef.current = builder;
    return () => { builderRef.current = null; };
  }, []);

  // Populate TE table rows after mount
  useEffect(() => {
    const tbody = document.getElementById('ex3-te-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    ACTIVITIES.forEach((a) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><strong>${a.id}</strong></td>` +
        `<td style="text-align:left;font-size:.82rem;">${a.desc}</td>` +
        `<td>${a.pred.length ? a.pred.join(', ') : '—'}</td>` +
        `<td>${a.to}</td><td>${a.tl}</td><td>${a.tp}</td>` +
        `<td><input type="text" inputmode="decimal" class="ex3-te-input" data-act="${a.id}" placeholder="?"></td>`;
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
      const val = inp.value.trim() === '' ? NaN : Number(inp.value.trim().replace(',', '.'));
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
      msg += ', Alle tₑ waarden correct! Stap 2 is nu ontgrendeld.';
      setLocked(false);
    } else {
      cls = correct >= 5 ? 'ex1-feedback partial' : 'ex1-feedback fail';
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
    if (actEdges.length === 8) score++; else messages.push(`Activiteiten: ${actEdges.length}/8`);

    total += 1;
    const structErrs = structureErrors(edges);
    if (structErrs.length === 0) score++; else messages.push(...structErrs);

    const actMap: Record<string, typeof edges[0]> = {};
    actEdges.forEach((e) => { if (e.act) actMap[e.act] = e; });

    ACTIVITIES.forEach((a) => {
      total++;
      const edge = actMap[a.id];
      if (edge && edge.dur === a.te) score++;
      else if (!edge) messages.push(`Activiteit ${a.id} ontbreekt`);
      else messages.push(`Act ${a.id}: duurtijd ${edge.dur} (verwacht ${a.te})`);
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
        if (!allOk) messages.push(`${a.id}: voorgangers bereiken bronknooppunt niet`);
        else if (hasExtraDependency(a.id, ACTIVITIES, actMap, canReach)) messages.push(`${a.id}: wacht op een activiteit die geen voorganger is`);
        else score++;
      }
    });

    let projectEnd = 0;
    nodes.forEach((n) => { const te = computeTE(n.id); if (te > projectEnd) projectEnd = te; });

    nodes.forEach((n) => {
      const teVal = n._teInput.value.trim() === '' ? NaN : Number(n._teInput.value.trim().replace(',', '.'));
      const tlVal = n._tlInput.value.trim() === '' ? NaN : Number(n._tlInput.value.trim().replace(',', '.'));
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
    total += cpTotal; score += Math.max(0, cpCorrect - cpWrong);
    const cpPerfect = cpCorrect === cpTotal && cpWrong === 0;

    const pct = total > 0 ? Math.round(score / total * 100) : 0;
    let msg = `Score: ${score}/${total} (${pct}%)`;
    if (messages.length > 0) msg += ', ' + messages.slice(0, 3).join('; ');
    if (cpTotal > 0) {
      if (cpPerfect) msg += ', Kritiek pad correct!';
      else if (cpWrong > 0) msg += ', Kritiek pad: niet correct.';
      else if (cpCorrect === 0) msg += ', Kritiek pad: niet aangeduid.';
      else msg += ', Kritiek pad: niet volledig.';
    }
    if (score === total) msg = `Uitstekend! ${score}/${total}, Het netwerk is perfect!`;
    setNetFeedback(msg);
    setNetFeedbackClass(score === total ? 'ex1-feedback success' : pct >= 60 ? 'ex1-feedback partial' : 'ex1-feedback fail');
  }

  function handleNetReset() {
    builderRef.current?.resetBuilder();
    setNetFeedback('');
    setNetFeedbackClass('ex1-feedback');
  }

  return (
    <section id="oefening3" style={{ marginTop: '3rem' }}>
      <div className="section-header">
        <div className="section-badge">Oefening 3</div>
        <h1>De piramide van de farao</h1>
        <p>Bereken de verwachte tijden, bouw het PERT-netwerk en bepaal het kritieke pad.</p>
      </div>

      <div className="card">
        <div className="card-title">📜 Opdracht</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.7 }}>
          Een farao wil een piramide laten bouwen. Het project bestaat uit 8 activiteiten.
          <strong>(1)</strong> Bereken eerst de verwachte tijd t<sub>e</sub> voor elke activiteit.
          <strong>(2)</strong> Bouw daarna het PERT-netwerk door knooppunten te plaatsen en verbindingen te tekenen.
          <strong>(3)</strong> Vul de T<sub>E</sub>- en T<sub>L</sub>-waarden in en bepaal het kritieke pad.
        </p>
      </div>

      {/* STAP 1 */}
      <div className="card">
        <div className="card-title">📊 Stap 1, Bereken t<sub>e</sub></div>
        <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: '1rem' }}>
          Gebruik de formule t<sub>e</sub> = (t<sub>o</sub> + 4 · t<sub>l</sub> + t<sub>p</sub>) / 6 en rond af naar het dichtstbijzijnde geheel getal.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="ex3-te-table" id="ex3-te-table">
            <thead>
              <tr>
                <th>Act</th><th>Beschrijving</th><th>Voorganger</th>
                <th>t<sub>o</sub></th><th>t<sub>l</sub></th><th>t<sub>p</sub></th><th>t<sub>e</sub></th>
              </tr>
            </thead>
            <tbody id="ex3-te-tbody"></tbody>
          </table>
        </div>
        <div className="ex1-controls" style={{ marginTop: '.75rem' }}>
          <button className="ex1-check-btn" onClick={handleTeCheck}>Controleer</button>
          <button className="ex1-reset-btn" onClick={handleTeReset}>Opnieuw</button>
        </div>
        <BenFeedback message={teFeedback} cls={teFeedbackClass} successPose="encouraging" watch="#ex3-te-table" suppress={netFeedbackClass.includes('success')} />
      </div>

      {/* STAP 2 */}
      <div className={`card${locked ? ' ex3-locked' : ''}`} id="ex3-builder-card">
        {locked && (
          <div className="ex3-lock-overlay" id="ex3-lock-overlay">
            <div className="ex3-lock-msg">
              <strong>🔒 Stap 2 is vergrendeld</strong>
              <p>Voltooi eerst Stap 1 (alle t<sub>e</sub> waarden correct).</p>
            </div>
          </div>
        )}
        <div className="card-title">🔨 Stap 2, Bouw het PERT-netwerk</div>
        <div className="ex1-instructions" style={{ marginBottom: '1rem' }}>
          <strong>Instructies:</strong> Gebruik de werkbalk om knooppunten te plaatsen en verbindingen te tekenen.
          <strong>(1)</strong> Klik <em>Knooppunt</em> en klik op het canvas om een knooppunt toe te voegen.
          <strong>(2)</strong> Klik <em>Activiteit</em> of <em>0-lijn</em>, klik op een bronknooppunt en dan op een doelknooppunt.
          <strong>(3)</strong> Vul T<sub>E</sub> en T<sub>L</sub> in bij elk knooppunt.
          <strong>(4)</strong> Duid het kritieke pad aan in <em>Selecteer</em>-modus.
          <strong>(5)</strong> Klik op <em>Controleer</em>.
        </div>

        <div className="ex3-toolbar" id="ex3-toolbar">
          <div className="ex3-tool-group">
            <button className="ex3-tool active" data-tool="select">&#8598; Selecteer</button>
            <button className="ex3-tool" data-tool="node">&#8853; Knooppunt</button>
            <button className="ex3-tool" data-tool="edge">&#8594; Activiteit</button>
            <button className="ex3-tool" data-tool="relay">&#8674; 0-lijn</button>
            <button className="ex3-tool" data-tool="delete">&#10005; Verwijder</button>
          </div>
          <div className="ex3-tool-file-group">
            <button className="ex3-tool-file" onClick={() => builderRef.current && exportNetwork(builderRef.current, 'ex3', 'oefening-3.json')}>&#8593; Exporteer</button>
            <button className="ex3-tool-file" disabled={locked} title={locked ? 'Ontgrendel eerst Stap 1' : undefined} onClick={() => builderRef.current && importNetwork(builderRef.current, 'ex3')}>&#8595; Importeer</button>
            <button className="ex3-tool-download" onClick={() => downloadSvgAsJpg('ex3-svg', 'oefening-3.jpg')}>&#8681; Download</button>
          </div>
        </div>

        <div className="ex3-canvas-wrap" id="ex3-canvas-wrap">
          <svg id="ex3-svg" viewBox="0 0 960 500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="ex3-m-def" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#888"/></marker>
              <marker id="ex3-m-dash" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#bbb"/></marker>
              <marker id="ex3-m-sel" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#e63946"/></marker>
              <marker id="ex3-m-ghost" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#457b9d" opacity=".5"/></marker>
              <clipPath id="ex3-cl"><rect x="-30" y="-30" width="30" height="60"/></clipPath>
              <clipPath id="ex3-ctr"><rect x="0" y="-30" width="30" height="30"/></clipPath>
              <clipPath id="ex3-cbr"><rect x="0" y="0" width="30" height="30"/></clipPath>
            </defs>
            <g id="ex3-grid" opacity=".15"></g>
            <line id="ex3-ghost" x1="0" y1="0" x2="0" y2="0" stroke="#457b9d" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#ex3-m-ghost)" opacity="0" pointerEvents="none"/>
            <g id="ex3-edges"></g>
            <g id="ex3-nodes"></g>
          </svg>
          <div className="ex3-edge-popup" id="ex3-edge-popup" style={{ display: 'none' }}>
            <label htmlFor="ex3-popup-act">Activiteit</label>
            <select id="ex3-popup-act"></select>
            <label htmlFor="ex3-popup-dur">Duurtijd (t<sub>e</sub>)</label>
            <input type="number" id="ex3-popup-dur" min="0" placeholder="—" readOnly style={{ background: 'var(--bg)', color: 'var(--muted)', cursor: 'default' }}/>
            <div className="ex3-edge-popup-btns">
              <button className="ex3-popup-ok" id="ex3-popup-ok">OK</button>
              <button className="ex3-popup-cancel" id="ex3-popup-cancel">Annuleer</button>
            </div>
          </div>
        </div>

        <div className="ex1-controls" style={{ marginTop: '1rem' }}>
          <button className="ex1-check-btn" onClick={handleNetCheck}>Controleer</button>
          <button className="ex1-reset-btn" onClick={handleNetReset}>Opnieuw beginnen</button>
        </div>
        <BenFeedback message={netFeedback} cls={netFeedbackClass} successPose="completed" watch="#ex3-canvas-wrap, #ex3-toolbar .ex3-tool-file:nth-of-type(2)" />
      </div>
    </section>
  );
}
