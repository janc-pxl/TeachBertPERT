'use client';

import { useEffect, useRef, useState } from 'react';

export function TheorySection() {
  const calcToRef = useRef<HTMLInputElement>(null);
  const calcTlRef = useRef<HTMLInputElement>(null);
  const calcTpRef = useRef<HTMLInputElement>(null);
  const [calcResult, setCalcResult] = useState('—');
  const [calcFormula, setCalcFormula] = useState('');
  const [calcHasValue, setCalcHasValue] = useState(false);

  // Node anatomy interaction
  useEffect(() => {
    const clicks = document.querySelectorAll<SVGElement>('.node-click');
    const sections = document.querySelectorAll<SVGElement>('.node-section');
    const nipItems = document.querySelectorAll<HTMLElement>('.nip-item');
    let active: string | null = null;

    function showSection(name: string) {
      sections.forEach((s) => {
        if (s.dataset.section === name) {
          s.style.opacity = '1';
          s.style.filter = 'brightness(.82)';
        } else {
          s.style.opacity = '.45';
          s.style.filter = 'brightness(1)';
        }
      });
      nipItems.forEach((el) => el.classList.remove('active'));
      const target = document.getElementById('nip-' + name);
      if (target) target.classList.add('active');
    }

    function resetSections() {
      sections.forEach((s) => {
        s.style.opacity = '1';
        s.style.filter = 'brightness(1)';
      });
      nipItems.forEach((el) => el.classList.remove('active'));
      const def = document.getElementById('nip-default');
      if (def) def.classList.add('active');
    }

    const handlers: Array<{ el: Element; type: string; fn: EventListener }> = [];

    clicks.forEach((el) => {
      const name = el.dataset.section!;

      const clickFn = () => {
        if (active === name) {
          active = null;
          resetSections();
        } else {
          active = name;
          showSection(name);
        }
      };

      const enterFn = () => {
        if (!active) {
          sections.forEach((s) => {
            s.style.filter = s.dataset.section === name
              ? 'brightness(.88)' : 'brightness(1)';
          });
        }
      };

      const leaveFn = () => {
        if (!active) {
          sections.forEach((s) => { (s as SVGElement).style.filter = 'brightness(1)'; });
        }
      };

      el.addEventListener('click', clickFn);
      el.addEventListener('mouseenter', enterFn);
      el.addEventListener('mouseleave', leaveFn);
      handlers.push({ el, type: 'click', fn: clickFn });
      handlers.push({ el, type: 'mouseenter', fn: enterFn });
      handlers.push({ el, type: 'mouseleave', fn: leaveFn });
    });

    return () => {
      handlers.forEach(({ el, type, fn }) => el.removeEventListener(type, fn));
    };
  }, []);

  function updateCalc() {
    const to = parseFloat(calcToRef.current?.value || '');
    const tl = parseFloat(calcTlRef.current?.value || '');
    const tp = parseFloat(calcTpRef.current?.value || '');
    if (isNaN(to) || isNaN(tl) || isNaN(tp)) {
      setCalcResult('—');
      setCalcFormula('');
      setCalcHasValue(false);
      return;
    }
    const te = (to + 4 * tl + tp) / 6;
    const round2 = (n: number) => Math.round(n * 100) / 100;
    setCalcResult(String(round2(te)));
    setCalcFormula(`(${to} + 4×${tl} + ${tp}) / 6`);
    setCalcHasValue(true);
  }

  return (
    <section id="theorie">
      <div className="section-header">
        <div className="section-badge">Sectie 1</div>
        <h1>Theorie</h1>
        <p>Leer de basisconcepten van PERT: knooppunten, activiteiten, tijdsberekeningen en het kritieke pad.</p>
      </div>

      {/* Definitie */}
      <div className="definitie">
        <div className="def-label">Definitie: PERT</div>
        <p>
          <strong>PERT</strong> (Program Evaluation and Review Technique) is een hulpmiddel voor de
          bedrijfsleiding bij de analyse en planning van projecten. Hierbij wordt gebruik gemaakt van
          een grafische voorstelling, het <strong>netwerk</strong>, om de samenhang tussen de
          verschillende werkzaamheden aan te geven.
        </p>
        <details>
          <summary>Wist je dat? Geschiedenis van PERT</summary>
          <div className="detail-body">
            De PERT-methode werd uitgevonden door de <em>United States Department of Defense&apos;s US Navy
            Special Projects Office</em> in <strong>1958</strong> als onderdeel van het <strong>Polaris-project</strong> (de ontwikkeling van nucleaire onderzeeërs).
            PERT lijkt sterk op de <em>kritiekepadmethode</em> (CPM), maar bij PERT wordt een
            kansberekening toegepast op de duurtijden, terwijl CPM uitgaat van vaste tijden.
          </div>
        </details>
      </div>

      {/* Node Anatomy */}
      <div className="card">
        <div className="card-title">🔵 Anatomie van een knooppunt</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1.4rem' }}>
          Een <strong>knooppunt</strong> (milestone) is een cirkel verdeeld in drie vlakken.
          Klik op een vlak om de betekenis ervan te bekijken.
        </p>

        <div className="node-anatomy">
          <div className="node-svg-wrap">
            <svg id="anatomy-svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Interactief knooppunt">
              <defs>
                <clipPath id="clip-left">
                  <rect x="0" y="0" width="80" height="160"/>
                </clipPath>
                <clipPath id="clip-top-right">
                  <rect x="80" y="0" width="80" height="80"/>
                </clipPath>
                <clipPath id="clip-bot-right">
                  <rect x="80" y="80" width="80" height="80"/>
                </clipPath>
              </defs>

              <circle id="bg-label" cx="80" cy="80" r="72"
                      fill="#e9ecef" clipPath="url(#clip-left)"
                      className="node-section" data-section="label"/>
              <circle id="bg-te" cx="80" cy="80" r="72"
                      fill="#d4edda" clipPath="url(#clip-top-right)"
                      className="node-section" data-section="te"/>
              <circle id="bg-tl" cx="80" cy="80" r="72"
                      fill="#cce5ff" clipPath="url(#clip-bot-right)"
                      className="node-section" data-section="tl"/>

              <circle cx="80" cy="80" r="72" fill="none" stroke="#333" strokeWidth="2.5"/>
              <line x1="80" y1="8" x2="80" y2="152" stroke="#333" strokeWidth="2"/>
              <line x1="80" y1="80" x2="152" y2="80" stroke="#333" strokeWidth="2"/>

              <text x="43" y="84" textAnchor="middle" fontFamily="Segoe UI,sans-serif"
                    fontSize="15" fontWeight="700" fill="#444" pointerEvents="none">MS</text>
              <text x="116" y="54" textAnchor="middle" fontFamily="Segoe UI,sans-serif"
                    fontSize="14" fontWeight="700" fill="#155724" pointerEvents="none">
                T<tspan fontSize="10" dy="2">E</tspan>
              </text>
              <text x="116" y="112" textAnchor="middle" fontFamily="Segoe UI,sans-serif"
                    fontSize="14" fontWeight="700" fill="#004085" pointerEvents="none">
                T<tspan fontSize="10" dy="2">L</tspan>
              </text>

              <circle cx="80" cy="80" r="72" fill="transparent"
                      clipPath="url(#clip-left)" className="node-click" data-section="label" style={{ cursor: 'pointer' }}/>
              <circle cx="80" cy="80" r="72" fill="transparent"
                      clipPath="url(#clip-top-right)" className="node-click" data-section="te" style={{ cursor: 'pointer' }}/>
              <circle cx="80" cy="80" r="72" fill="transparent"
                      clipPath="url(#clip-bot-right)" className="node-click" data-section="tl" style={{ cursor: 'pointer' }}/>
            </svg>
            <p className="node-hint">↑ Klik op een vlak</p>
          </div>

          <div className="node-info-panel">
            <div className="nip-item active" id="nip-default">
              <p className="nip-placeholder">Selecteer een vlak van het knooppunt om de betekenis ervan te bekijken.</p>
            </div>
            <div className="nip-item" id="nip-label">
              <span className="nip-tag nip-tag-label">Naam / Nummer</span>
              <h3>Knooppuntnaam (MS)</h3>
              <p>
                Het linker vlak bevat de naam of het volgnummer van het knooppunt
                (<em>milestone</em>). Een knooppunt stelt het <strong>begin of einde</strong> van
                een activiteit voor. Het neemt zelf <strong>geen tijd, arbeid of grondstoffen</strong>
                in beslag. Het is een moment, geen taak.
              </p>
            </div>
            <div className="nip-item" id="nip-te">
              <span className="nip-tag nip-tag-te">T<sub>E</sub>: Vroegst mogelijke tijdstip</span>
              <h3>Earliest Expected Time</h3>
              <p>
                Het vroegst mogelijke tijdstip waarop dit knooppunt bereikt kan worden.
                Berekend via de <strong>voorwaartse gang</strong> (links → rechts):
                tel de duurtijden van alle inkomende activiteiten op bij de T<sub>E</sub>
                van het vorige knooppunt.
              </p>
              <div className="nip-rule">
                📌 <strong>Regel:</strong> Bij meerdere inkomende paden neem je de <strong>grootste</strong> som (= het traagste pad bepaalt de vroegste aankomst).
              </div>
            </div>
            <div className="nip-item" id="nip-tl">
              <span className="nip-tag nip-tag-tl">T<sub>L</sub>: Laatste toelaatbare tijdstip</span>
              <h3>Latest Allowable Time</h3>
              <p>
                Het laatste tijdstip waarop dit knooppunt bereikt <em>mag</em> worden zonder de
                totale projectduur te overschrijden. Berekend via de
                <strong>achterwaartse gang</strong> (rechts → links):
                trek de duurtijden van de uitgaande activiteiten af van de T<sub>L</sub>
                van het volgende knooppunt.
              </p>
              <div className="nip-rule">
                📌 <strong>Regel:</strong> Bij meerdere uitgaande activiteiten neem je de <strong>kleinste</strong> waarde (= de strengste deadline bepaalt de T<sub>L</sub>).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Begrippen */}
      <div className="card">
        <div className="card-title">📖 Begrippen</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1.4rem' }}>
          Een PERT-netwerk bouw je op met een klein aantal bouwstenen. Voor je een netwerk
          kunt tekenen of lezen, moet je deze begrippen kennen.
        </p>
        <div className="concepts-grid">

          <div className="concept-card">
            <svg width="110" height="90" viewBox="0 0 110 90">
              <circle cx="55" cy="45" r="36" fill="#fff" stroke="#333" strokeWidth="2"/>
              <line x1="55" y1="9" x2="55" y2="81" stroke="#333" strokeWidth="1.5"/>
              <line x1="55" y1="45" x2="91" y2="45" stroke="#333" strokeWidth="1.5"/>
              <text x="35" y="49" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="11" fontWeight="700" fill="#444">MS</text>
              <text x="73" y="33" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fontWeight="700" fill="#155724">T<tspan fontSize="8" dy="1">E</tspan></text>
              <text x="73" y="62" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fontWeight="700" fill="#004085">T<tspan fontSize="8" dy="1">L</tspan></text>
            </svg>
            <h3>Knooppunt</h3>
            <p>Een gebeurtenis: het moment waarop een activiteit begint of eindigt. Een punt in de tijd, geen werk. Neemt geen tijd, arbeid of grondstoffen in beslag.</p>
          </div>

          <div className="concept-card">
            <svg width="180" height="70" viewBox="0 0 180 70">
              <circle cx="22" cy="35" r="18" fill="#fff" stroke="#333" strokeWidth="2"/>
              <line x1="22" y1="17" x2="22" y2="53" stroke="#333" strokeWidth="1.5"/>
              <line x1="22" y1="35" x2="40" y2="35" stroke="#333" strokeWidth="1.5"/>
              <line x1="41" y1="35" x2="130" y2="35" stroke="#333" strokeWidth="2"/>
              <polygon points="130,29 144,35 130,41" fill="#333"/>
              <text x="87" y="24" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="10" fill="#555">Activiteit X, 5 weken</text>
              <circle cx="158" cy="35" r="18" fill="#fff" stroke="#333" strokeWidth="2"/>
              <line x1="158" y1="17" x2="158" y2="53" stroke="#333" strokeWidth="1.5"/>
              <line x1="158" y1="35" x2="176" y2="35" stroke="#333" strokeWidth="1.5"/>
            </svg>
            <h3>Activiteit</h3>
            <p>De uitvoering van een taak. Kost wél tijd en middelen. Voorgesteld door een pijl tussen twee knooppunten; de lengte van de pijl zegt niets over de duurtijd.</p>
          </div>

          <div className="concept-card">
            <svg width="180" height="90" viewBox="0 0 180 90">
              <defs>
                <marker id="net-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0,8 3,0 6" fill="#333"/>
                </marker>
              </defs>
              <circle cx="20" cy="45" r="14" fill="#fff" stroke="#333" strokeWidth="1.8"/>
              <circle cx="80" cy="20" r="14" fill="#fff" stroke="#333" strokeWidth="1.8"/>
              <circle cx="80" cy="70" r="14" fill="#fff" stroke="#333" strokeWidth="1.8"/>
              <circle cx="160" cy="45" r="14" fill="#fff" stroke="#333" strokeWidth="1.8"/>
              <line x1="34" y1="39" x2="66" y2="25" stroke="#333" strokeWidth="1.5" markerEnd="url(#net-arr)"/>
              <line x1="34" y1="51" x2="66" y2="65" stroke="#333" strokeWidth="1.5" markerEnd="url(#net-arr)"/>
              <line x1="94" y1="25" x2="146" y2="41" stroke="#333" strokeWidth="1.5" markerEnd="url(#net-arr)"/>
              <line x1="94" y1="65" x2="146" y2="49" stroke="#333" strokeWidth="1.5" markerEnd="url(#net-arr)"/>
              <text x="20" y="49" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="9" fill="#555">I</text>
              <text x="80" y="24" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="9" fill="#555">II</text>
              <text x="80" y="74" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="9" fill="#555">III</text>
              <text x="160" y="49" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="9" fill="#555">IV</text>
            </svg>
            <h3>Netwerk</h3>
            <p>Brengt alle activiteiten en hun volgorde samen in één tekening. Toont welke activiteiten elkaar voorafgaan, volgen of tegelijk lopen.</p>
          </div>

          <div className="concept-card">
            <svg width="180" height="70" viewBox="0 0 180 70">
              <circle cx="22" cy="35" r="18" fill="#fff" stroke="#333" strokeWidth="2"/>
              <line x1="22" y1="17" x2="22" y2="53" stroke="#333" strokeWidth="1.5"/>
              <line x1="22" y1="35" x2="40" y2="35" stroke="#333" strokeWidth="1.5"/>
              <line x1="41" y1="35" x2="130" y2="35" stroke="#555" strokeWidth="2" strokeDasharray="7,5"/>
              <polygon points="130,29 144,35 130,41" fill="#555"/>
              <text x="87" y="24" textAnchor="middle" fontFamily="Segoe UI,sans-serif" fontSize="11" fill="#555" fontStyle="italic">wachttijd</text>
              <circle cx="158" cy="35" r="18" fill="#fff" stroke="#333" strokeWidth="2"/>
              <line x1="158" y1="17" x2="158" y2="53" stroke="#333" strokeWidth="1.5"/>
              <line x1="158" y1="35" x2="176" y2="35" stroke="#333" strokeWidth="1.5"/>
            </svg>
            <h3>Wachttijd</h3>
            <p>Er verstrijkt tijd zonder eigen werk, bijvoorbeeld verf die droogt of wachten op een levering. Neemt <em>alleen tijd</em> in beslag, geen mankracht of hulpmiddelen.</p>
          </div>

          <div className="concept-card">
            <svg width="180" height="70" viewBox="0 0 180 70">
              <circle cx="22" cy="35" r="18" fill="#fff" stroke="#333" strokeWidth="2"/>
              <line x1="22" y1="17" x2="22" y2="53" stroke="#333" strokeWidth="1.5"/>
              <line x1="22" y1="35" x2="40" y2="35" stroke="#333" strokeWidth="1.5"/>
              <line x1="41" y1="35" x2="130" y2="35" stroke="#888" strokeWidth="2" strokeDasharray="5,4"/>
              <polygon points="130,29 144,35 130,41" fill="#888"/>
              <text x="87" y="24" textAnchor="middle" fontFamily="Georgia,serif" fontSize="15" fontWeight="700" fill="#888">0</text>
              <circle cx="158" cy="35" r="18" fill="#fff" stroke="#333" strokeWidth="2"/>
              <line x1="158" y1="17" x2="158" y2="53" stroke="#333" strokeWidth="1.5"/>
              <line x1="158" y1="35" x2="176" y2="35" stroke="#333" strokeWidth="1.5"/>
            </svg>
            <h3>Schijnactiviteit</h3>
            <p>Ook <em>relatielijn</em>, <em>0-lijn</em> of <em>dummy</em> genoemd. Legt een noodzakelijk verband tussen twee knooppunten, <em>zonder tijd of werk</em>. Voorgesteld door een stippellijn met een 0.</p>
          </div>

        </div>
        <p style={{ fontSize: '.9rem', marginTop: '1.3rem' }}>
          💡 Let vooral op het verschil tussen een <strong>wachttijd</strong> en een{' '}
          <strong>schijnactiviteit</strong>: een wachttijd kost wél tijd maar geen werk, terwijl
          een schijnactiviteit een noodzakelijk verband legt zonder dat er tijd of werk aan
          verbonden is.
        </p>
      </div>

      {/* Tijdsfactor */}
      <div className="card">
        <div className="card-title">⏱ Tijdsfactor &amp; t<sub>e</sub>-berekening</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1.1rem' }}>
          Bij PERT worden <strong>drie schattingen</strong> gebruikt om de verwachte duurtijd van
          een activiteit te berekenen. Zo wordt rekening gehouden met onzekerheid.
        </p>

        <div className="formula-display">
          t<sub>e</sub> = (t<sub>o</sub> + 4 · t<sub>l</sub> + t<sub>p</sub>) / 6
        </div>

        <div className="time-types">
          <div className="time-type-card">
            <div className="sym sym-to">t<sub>o</sub></div>
            <div className="name">Optimistisch</div>
            <div className="desc">De kortst mogelijke duurtijd (beste geval)</div>
          </div>
          <div className="time-type-card">
            <div className="sym sym-tl">t<sub>l</sub></div>
            <div className="name">Realistisch</div>
            <div className="desc">De meest waarschijnlijke duurtijd (meest waarschijnlijk)</div>
          </div>
          <div className="time-type-card">
            <div className="sym sym-tp">t<sub>p</sub></div>
            <div className="name">Pessimistisch</div>
            <div className="desc">De langst mogelijke duurtijd (slechtste geval)</div>
          </div>
        </div>

        <div className="calc-wrap">
          <p className="calc-label-row">🧮 Mini-calculator, vul de drie schattingen in:</p>
          <div className="calc-grid">
            <div className="calc-field">
              <label>t<sub>o</sub> (optimistisch)</label>
              <input ref={calcToRef} type="number" id="calc-to" placeholder="0" min="0" step="0.5" onInput={updateCalc}/>
            </div>
            <div className="calc-field">
              <label>t<sub>l</sub> (realistisch)</label>
              <input ref={calcTlRef} type="number" id="calc-tl" placeholder="0" min="0" step="0.5" onInput={updateCalc}/>
            </div>
            <div className="calc-field">
              <label>t<sub>p</sub> (pessimistisch)</label>
              <input ref={calcTpRef} type="number" id="calc-tp" placeholder="0" min="0" step="0.5" onInput={updateCalc}/>
            </div>
            <div className="calc-arrow">→</div>
            <div className={`calc-result-box${calcHasValue ? ' has-value' : ''}`} id="calc-result-box">
              <div className="res-label">t<sub>e</sub> (verwacht)</div>
              <div className="res-value" id="calc-result">{calcResult}</div>
              <div className="res-formula" id="calc-formula">{calcFormula}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Voorwaartse & Achterwaartse gang */}
      <div className="card">
        <div className="card-title">🔄 Voorwaartse en achterwaartse gang</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1.1rem' }}>
          Om T<sub>E</sub> en T<sub>L</sub> te berekenen, doorloop je het netwerk twee keer:
          eerst van links naar rechts, daarna van rechts naar links.
        </p>
        <div className="pass-grid">
          <div className="pass-card forward">
            <div className="pass-title">➡ Voorwaartse gang</div>
            <p className="pass-desc">Bereken <strong>T<sub>E</sub></strong> voor elk knooppunt, van links naar rechts.</p>
            <div className="pass-rule">📍 Startpunt: T<sub>E</sub> van het eerste knooppunt = <strong>0</strong>.</div>
            <div className="pass-rule">📐 Bereken: T<sub>E</sub>(vorig) + duurtijd activiteit voor elk inkomend pad.</div>
            <div className="pass-rule">✅ <strong>Neem de grootste waarde</strong> bij meerdere inkomende paden.</div>
          </div>
          <div className="pass-card backward">
            <div className="pass-title">⬅ Achterwaartse gang</div>
            <p className="pass-desc">Bereken <strong>T<sub>L</sub></strong> voor elk knooppunt, van rechts naar links.</p>
            <div className="pass-rule">📍 Eindpunt: T<sub>L</sub> van het laatste knooppunt = T<sub>E</sub> van dat knooppunt.</div>
            <div className="pass-rule">📐 Bereken: T<sub>L</sub>(volgend) − duurtijd activiteit voor elke uitgaande activiteit.</div>
            <div className="pass-rule">✅ <strong>Neem de kleinste waarde</strong> bij meerdere uitgaande activiteiten.</div>
          </div>
        </div>
      </div>

      {/* Speling */}
      <div className="card">
        <div className="card-title">📊 Speling (Slack)</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1rem' }}>
          Speling is de maximale vertraging die een activiteit mag oplopen
          zonder de totale projectduur te beïnvloeden.
        </p>
        <div className="slack-formula">
          Speling = T<sub>L</sub> − T<sub>E</sub>
        </div>
        <table className="slack-table">
          <thead>
            <tr>
              <th>Type speling</th>
              <th>Formule</th>
              <th>Betekenis &amp; gevolg</th>
            </tr>
          </thead>
          <tbody>
            <tr className="slack-pos">
              <td><span className="badge badge-pos">Positief</span></td>
              <td>T<sub>L</sub> &gt; T<sub>E</sub></td>
              <td>De activiteit mag uitgesteld worden. Minder mensen en middelen nodig.</td>
            </tr>
            <tr className="slack-zero">
              <td><span className="badge badge-zero">Nul → kritiek</span></td>
              <td>T<sub>L</sub> = T<sub>E</sub></td>
              <td>Geen vertraging toegestaan. Dit knooppunt ligt op het <strong>kritieke pad</strong>.</td>
            </tr>
            <tr className="slack-neg">
              <td><span className="badge badge-neg">Negatief</span></td>
              <td>T<sub>L</sub> &lt; T<sub>E</sub></td>
              <td>De activiteit moet versneld worden. Meer mensen en middelen inzetten.</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Kritieke pad */}
      <div className="card">
        <div className="card-title">🔴 Kritieke pad</div>
        <p style={{ fontSize: '.9rem', marginBottom: '.25rem' }}>
          Het <strong>kritieke pad</strong> is het langste pad van het begin- naar het eindknooppunt.
          Elke vertraging op dit pad heeft rechtstreeks invloed op de totale projectduur.
        </p>
        <div className="slack-formula" style={{ fontSize: '.95rem', marginBottom: '1rem' }}>
          Speling op het kritieke pad = T<span style={{ fontSize: '.7em', verticalAlign: 'sub' }}>L</span> − T<span style={{ fontSize: '.7em', verticalAlign: 'sub' }}>E</span> = 0
        </div>
        <ul className="crit-list">
          <li>Alle knooppunten op het kritieke pad hebben een <strong>speling van 0</strong>, dus de deadline en vroegste aankomst vallen samen.</li>
          <li>Het kritieke pad wordt aangeduid met een <span style={{ color: 'var(--accent)', fontWeight: 700 }}>rode pijl</span> in het netwerk.</li>
          <li>Er kunnen meerdere kritieke paden bestaan als twee paden dezelfde maximale duurtijd hebben.</li>
          <li>De totale projectduur is gelijk aan het vroegst mogelijke tijdstip van het laatste knooppunt.</li>
        </ul>
      </div>
    </section>
  );
}
