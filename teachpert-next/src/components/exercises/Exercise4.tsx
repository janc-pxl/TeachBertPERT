'use client';
import { useEffect, useRef, useState } from 'react';
import { createPertBuilder } from '@/lib/pert/createPertBuilder';
import { downloadSvgAsJpg } from '@/lib/pert/download';
import { exportNetwork, importNetwork } from '@/lib/pert/importExport';
import type { Activity, PertBuilderAPI } from '@/lib/pert/types';

const ACTIVITIES: Activity[] = [
  { id:'1',  desc:'Projectanalyse',                pred:[],          dur:10 },
  { id:'2',  desc:'Probleemanalyse CRM',           pred:['1'],       dur:10 },
  { id:'3',  desc:'Probleemanalyse ERP',            pred:['1'],       dur:5  },
  { id:'4',  desc:'Offertes computerinstallatie',   pred:['1'],       dur:5  },
  { id:'5',  desc:'Werving en selectie personeel',  pred:['1'],       dur:10 },
  { id:'6',  desc:'Bouw CRM-systeem',               pred:['2'],       dur:30 },
  { id:'7',  desc:'Invoeringsvoorbereiding CRM',    pred:['2'],       dur:20 },
  { id:'8',  desc:'Bouw ERP-systeem',                pred:['3'],       dur:30 },
  { id:'9',  desc:'Invoeringsvoorbereiding ERP',     pred:['3'],       dur:20 },
  { id:'10', desc:'Laptopkeuze en levering',         pred:['4'],       dur:45 },
  { id:'11', desc:'Software-installatie',            pred:['5','10'],  dur:5  },
  { id:'12', desc:'Invoering CRM',                  pred:['6','7','11'], dur:10 },
  { id:'13', desc:'Invoering ERP',                  pred:['8','9','11'], dur:10 },
  { id:'14', desc:'Integratie ERP-CRM',             pred:['12','13'], dur:10 },
];

export function Exercise4() {
  const builderRef = useRef<PertBuilderAPI | null>(null);
  const [netFeedback, setNetFeedback] = useState('');
  const [netFeedbackClass, setNetFeedbackClass] = useState('ex1-feedback');

  useEffect(() => {
    const builder = createPertBuilder({
      prefix: 'ex4',
      activities: ACTIVITIES,
      durField: 'dur',
      canvasHeight: 600,
      labels: ['I','II','III','IV','VI','VII','VIII','IX','X','XI','XII','XIII','XIV'],
      edgeLabelFn: (act, dur) => `Act ${act}(${dur})`,
      optionLabelFn: (a) => `Act ${a.id} — ${a.desc}`,
      popupDurReadonly: true,
    });
    builderRef.current = builder;
    return () => { builderRef.current = null; };
  }, []);

  function handleNetCheck() {
    const builder = builderRef.current;
    if (!builder) return;
    const { nodes, edges, computeTE, computeTL, canReach } = builder;

    let score = 0, total = 0;
    const messages: string[] = [];
    const actEdges = edges.filter((e) => !e.dashed);
    total += 1;
    if (actEdges.length === 14) score++; else messages.push(`Activiteiten: ${actEdges.length}/14`);

    const actMap: Record<string, typeof edges[0]> = {};
    actEdges.forEach((e) => { if (e.act) actMap[e.act] = e; });

    ACTIVITIES.forEach((a) => {
      total++;
      const edge = actMap[a.id];
      if (edge && edge.dur === a.dur) score++;
      else if (!edge) messages.push(`Activiteit ${a.id} ontbreekt`);
      else messages.push(`Act ${a.id}: duur ${edge.dur} (verwacht ${a.dur})`);
    });

    ACTIVITIES.forEach((a) => {
      total++;
      const edge = actMap[a.id];
      if (!edge) return;
      const srcId = edge.fromId;
      if (a.pred.length === 0) {
        const incoming = edges.filter((e) => e.toId === srcId);
        if (incoming.length === 0) score++;
        else messages.push(`Act ${a.id}: bronknooppunt heeft onverwachte inkomende verbindingen`);
      } else {
        let allOk = true;
        a.pred.forEach((predId) => {
          const predEdge = actMap[predId];
          if (!predEdge) { allOk = false; return; }
          if (!canReach(predEdge.toId, srcId, {})) allOk = false;
        });
        if (allOk) score++; else messages.push(`Act ${a.id}: voorgangers bereiken bronknooppunt niet`);
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
      if (criticalEdges.includes(e) && e.selected) cpCorrect++;
      if (!criticalEdges.includes(e) && e.selected) cpWrong++;
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
    <section id="oefening4" style={{ marginTop: '3rem' }}>
      <div className="section-header">
        <div className="section-badge">Oefening 4</div>
        <h1>H. Oessers digitalisering</h1>
        <p>Bouw het PERT-netwerk voor dit groot digitaliseringsproject en bepaal het kritieke pad.</p>
      </div>

      <div className="card">
        <div className="card-title">📋 Activiteitenoverzicht</div>
        <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: '.75rem' }}>
          Het transportbedrijf <em>&quot;H. Oessers&quot;</em> voert een groot digitaliseringsproject uit met 14 activiteiten.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="ex3-te-table">
            <thead>
              <tr><th>Act</th><th>Beschrijving</th><th>Voorganger(s)</th><th>Duur (w)</th></tr>
            </thead>
            <tbody>
              {ACTIVITIES.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.desc}</td>
                  <td>{a.pred.length ? a.pred.join(', ') : '—'}</td>
                  <td>{a.dur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-title">🔨 Bouw het PERT-netwerk</div>
        <div className="ex1-instructions" style={{ marginBottom: '1rem' }}>
          <strong>Instructies:</strong> Gebruik de werkbalk om knooppunten te plaatsen en verbindingen te tekenen.
          <strong>(1)</strong> Klik <em>Knooppunt</em> en klik op het canvas om een knooppunt toe te voegen.
          <strong>(2)</strong> Klik <em>Activiteit</em> of <em>0-lijn</em>, klik op een bronknooppunt en dan op een doelknooppunt.
          <strong>(3)</strong> Vul T<sub>E</sub> en T<sub>L</sub> in bij elk knooppunt.
          <strong>(4)</strong> Duid het kritieke pad aan in <em>Selecteer</em>-modus.
          <strong>(5)</strong> Klik op <em>Controleer</em>.
        </div>

        <div className="ex3-toolbar" id="ex4-toolbar">
          <button className="ex3-tool active" data-tool="select">&#8598; Selecteer</button>
          <button className="ex3-tool" data-tool="node">&#8853; Knooppunt</button>
          <button className="ex3-tool" data-tool="edge">&#8594; Activiteit</button>
          <button className="ex3-tool" data-tool="relay">&#8674; 0-lijn</button>
          <button className="ex3-tool" data-tool="delete">&#10005; Verwijder</button>
          <button className="ex3-tool-download" onClick={() => builderRef.current && exportNetwork(builderRef.current, 'ex4', 'oefening-4.json')}>&#8593; Exporteer</button>
          <button className="ex3-tool-download" onClick={() => builderRef.current && importNetwork(builderRef.current, 'ex4')}>&#8595; Importeer</button>
          <button className="ex3-tool-download" onClick={() => downloadSvgAsJpg('ex4-svg', 'oefening-4.jpg')}>&#8681; Download</button>
        </div>

        <div className="ex3-canvas-wrap" id="ex4-canvas-wrap">
          <svg id="ex4-svg" viewBox="0 0 960 600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="ex4-m-def" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#888"/></marker>
              <marker id="ex4-m-dash" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#bbb"/></marker>
              <marker id="ex4-m-sel" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#e63946"/></marker>
              <marker id="ex4-m-ghost" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#457b9d" opacity=".5"/></marker>
              <clipPath id="ex4-cl"><rect x="-30" y="-30" width="30" height="60"/></clipPath>
              <clipPath id="ex4-ctr"><rect x="0" y="-30" width="30" height="30"/></clipPath>
              <clipPath id="ex4-cbr"><rect x="0" y="0" width="30" height="30"/></clipPath>
            </defs>
            <g id="ex4-grid" opacity=".15"></g>
            <line id="ex4-ghost" x1="0" y1="0" x2="0" y2="0" stroke="#457b9d" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#ex4-m-ghost)" opacity="0" pointerEvents="none"/>
            <g id="ex4-edges"></g>
            <g id="ex4-nodes"></g>
          </svg>
          <div className="ex3-edge-popup" id="ex4-edge-popup" style={{ display: 'none' }}>
            <label htmlFor="ex4-popup-act">Activiteit</label>
            <select id="ex4-popup-act"></select>
            <label htmlFor="ex4-popup-dur">Duurtijd (weken)</label>
            <input type="number" id="ex4-popup-dur" min="0" placeholder="—" readOnly style={{ background: 'var(--bg)', color: 'var(--muted)', cursor: 'default' }}/>
            <div className="ex3-edge-popup-btns">
              <button className="ex3-popup-ok" id="ex4-popup-ok">OK</button>
              <button className="ex3-popup-cancel" id="ex4-popup-cancel">Annuleer</button>
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
