'use client';
import { useEffect, useRef, useState } from 'react';
import { createPertBuilder } from '@/lib/pert/createPertBuilder';
import { downloadSvgAsJpg } from '@/lib/pert/download';
import { exportNetwork, importNetwork } from '@/lib/pert/importExport';
import type { PertBuilderAPI } from '@/lib/pert/types';

export function Playground() {
  const builderRef = useRef<PertBuilderAPI | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackClass, setFeedbackClass] = useState('ex1-feedback');

  useEffect(() => {
    const builder = createPertBuilder({
      prefix: 'play',
      activities: null,
      durField: null,
      canvasHeight: 500,
      labels: ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'],
      edgeLabelFn: (act, dur) => act ? `${act}(${dur})` : String(dur),
      popupDurReadonly: false,
    });
    builderRef.current = builder;
    return () => { builderRef.current = null; };
  }, []);

  function handleCheck() {
    const builder = builderRef.current;
    if (!builder) return;
    const { nodes, edges, computeTE, computeTL } = builder;

    if (nodes.length === 0) {
      setFeedback('Voeg eerst knooppunten en verbindingen toe.');
      setFeedbackClass('ex1-feedback fail');
      return;
    }

    let score = 0, total = 0;

    let projectEnd = 0;
    nodes.forEach((n) => { const te = computeTE(n.id); if (te > projectEnd) projectEnd = te; });

    // Validate TE and TL values
    nodes.forEach((n) => {
      const expectedTE = computeTE(n.id);
      const expectedTL = computeTL(n.id, projectEnd);
      const teVal = n._teInput.value.trim() === '' ? NaN : parseInt(n._teInput.value, 10);
      const tlVal = n._tlInput.value.trim() === '' ? NaN : parseInt(n._tlInput.value, 10);

      total++;
      if (!isNaN(teVal) && teVal === expectedTE) {
        n._teInput.classList.remove('wrong'); n._teInput.classList.add('correct'); score++;
      } else {
        n._teInput.classList.remove('correct');
        if (!isNaN(teVal)) n._teInput.classList.add('wrong');
      }

      total++;
      if (!isNaN(tlVal) && isFinite(expectedTL) && tlVal === expectedTL) {
        n._tlInput.classList.remove('wrong'); n._tlInput.classList.add('correct'); score++;
      } else {
        n._tlInput.classList.remove('correct');
        if (!isNaN(tlVal)) n._tlInput.classList.add('wrong');
      }
    });

    // Validate critical path
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
    total += cpTotal;
    score += cpCorrect;
    const cpPerfect = cpCorrect === cpTotal && cpWrong === 0;

    const pct = total > 0 ? Math.round(score / total * 100) : 0;
    let msg = `Score: ${score}/${total} (${pct}%)`;
    let cls = 'ex1-feedback';

    if (cpTotal > 0) {
      if (cpPerfect) msg += ' — Kritiek pad correct!';
      else if (cpWrong > 0) msg += ' — Kritiek pad: niet correct.';
      else if (cpCorrect === 0) msg += ' — Kritiek pad: niet aangeduid.';
      else msg += ' — Kritiek pad: niet volledig.';
    } else {
      msg += ' — Vul de T\u1D38- en T\u1D38-waarden in bij alle knooppunten.';
    }

    if (score === total && total > 0) {
      msg = `Uitstekend! ${score}/${total} — Alles correct!`;
      cls = 'ex1-feedback success';
    } else if (pct >= 60) {
      cls = 'ex1-feedback partial';
    } else {
      cls = 'ex1-feedback fail';
    }
    setFeedback(msg);
    setFeedbackClass(cls);
  }

  function handleReset() {
    const builder = builderRef.current;
    if (builder) {
      builder.nodes.forEach((n) => {
        n._teInput.classList.remove('correct', 'wrong');
        n._tlInput.classList.remove('correct', 'wrong');
      });
      builder.resetBuilder();
    }
    setFeedback('');
    setFeedbackClass('ex1-feedback');
  }

  return (
    <section id="playground" style={{ marginTop: '3rem' }}>
      <div className="section-header">
        <div className="section-badge">PERT Playground</div>
        <h1>Vrije PERT-builder</h1>
        <p>Bouw zelf een PERT-netwerk van nul. Geen voorgedefinieerde activiteiten — volledig vrij.</p>
      </div>

      <div className="card">
        <div className="card-title">🔨 Bouw je eigen PERT-netwerk</div>
        <div className="ex1-instructions" style={{ marginBottom: '1rem' }}>
          <strong>Instructies:</strong> Gebruik de werkbalk om knooppunten te plaatsen en verbindingen te tekenen.{' '}
          <strong>(1)</strong> Klik <em>Knooppunt</em> en klik op het canvas om een knooppunt toe te voegen.{' '}
          <strong>(2)</strong> Klik <em>Activiteit</em> of <em>0-lijn</em> en klik achtereenvolgens op twee knooppunten.{' '}
          <strong>(3)</strong> In het popup: vul de naam en duur van de activiteit in. Vul ook de T<sub>E</sub> en T<sub>L</sub> in bij elk knooppunt.{' '}
          <strong>(4)</strong> Duid het kritieke pad aan in <em>Selecteer</em>-modus en klik <em>Controleer</em>.
        </div>

        <div className="ex3-toolbar" id="play-toolbar">
          <button className="ex3-tool active" data-tool="select">&#8598; Selecteer</button>
          <button className="ex3-tool" data-tool="node">&#8853; Knooppunt</button>
          <button className="ex3-tool" data-tool="edge">&#8594; Activiteit</button>
          <button className="ex3-tool" data-tool="relay">&#8674; 0-lijn</button>
          <button className="ex3-tool" data-tool="delete">&#10005; Verwijder</button>
          <button className="ex3-tool-download" onClick={() => builderRef.current && exportNetwork(builderRef.current, 'playground', 'playground.json')}>&#8593; Exporteer</button>
          <button className="ex3-tool-download" onClick={() => builderRef.current && importNetwork(builderRef.current, 'playground')}>&#8595; Importeer</button>
          <button className="ex3-tool-download" onClick={() => downloadSvgAsJpg('play-svg', 'playground.jpg')}>&#8681; Download</button>
        </div>

        <div className="ex3-canvas-wrap" id="play-canvas-wrap">
          <svg id="play-svg" viewBox="0 0 960 500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <marker id="play-m-def" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#888"/></marker>
              <marker id="play-m-dash" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#bbb"/></marker>
              <marker id="play-m-sel" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#e63946"/></marker>
              <marker id="play-m-ghost" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,9 3.5,0 7" fill="#457b9d" opacity=".5"/></marker>
              <clipPath id="play-cl"><rect x="-30" y="-30" width="30" height="60"/></clipPath>
              <clipPath id="play-ctr"><rect x="0" y="-30" width="30" height="30"/></clipPath>
              <clipPath id="play-cbr"><rect x="0" y="0" width="30" height="30"/></clipPath>
            </defs>
            <g id="play-grid" opacity=".15"></g>
            <line id="play-ghost" x1="0" y1="0" x2="0" y2="0" stroke="#457b9d" strokeWidth="2" strokeDasharray="6 4" markerEnd="url(#play-m-ghost)" opacity="0" pointerEvents="none"/>
            <g id="play-edges"></g>
            <g id="play-nodes"></g>
          </svg>
          <div className="ex3-edge-popup" id="play-edge-popup" style={{ display: 'none' }}>
            <label htmlFor="play-popup-act">Activiteitnaam</label>
            <input type="text" id="play-popup-act" placeholder="bv. A" maxLength={10}/>
            <label htmlFor="play-popup-dur">Duurtijd</label>
            <input type="number" id="play-popup-dur" min="0" placeholder="0"/>
            <div className="ex3-edge-popup-btns">
              <button className="ex3-popup-ok" id="play-popup-ok">OK</button>
              <button className="ex3-popup-cancel" id="play-popup-cancel">Annuleer</button>
            </div>
          </div>
        </div>

        <div className="ex1-controls" style={{ marginTop: '1rem' }}>
          <button className="ex1-check-btn" onClick={handleCheck}>Controleer</button>
          <button className="ex1-reset-btn" onClick={handleReset}>&#8634; Opnieuw beginnen</button>
          <div className={feedbackClass}>{feedback}</div>
        </div>
      </div>
    </section>
  );
}
