import type { PertBuilderConfig, PertBuilderAPI, PertNode, PertEdge, PertNetworkFile } from './types';

export function createPertBuilder(cfg: PertBuilderConfig): PertBuilderAPI | null {
  const prefix = cfg.prefix;
  const activities = cfg.activities;
  const durField = cfg.durField as keyof import('./types').Activity | null;
  const canvasHeight = cfg.canvasHeight || 500;
  const labels = cfg.labels;
  const edgeLabelFn = cfg.edgeLabelFn;
  const popupDurReadonly = cfg.popupDurReadonly;
  const R = 30;

  // ── STATE ──
  const nodes: PertNode[] = [];
  const edges: PertEdge[] = [];
  let tool = 'select';
  let edgeSource: number | null = null;
  let dragNode: PertNode | null = null;
  const dragOffset = { x: 0, y: 0 };
  let nextId = 1;
  let nextEdgeId = 1;

  // ── DOM REFS ──
  const svg = document.getElementById(prefix + '-svg') as SVGSVGElement | null;
  if (!svg) return null;
  const edgesG     = document.getElementById(prefix + '-edges') as unknown as SVGGElement;
  const nodesG     = document.getElementById(prefix + '-nodes') as unknown as SVGGElement;
  const ghost      = document.getElementById(prefix + '-ghost') as unknown as SVGLineElement;
  const canvasWrap = document.getElementById(prefix + '-canvas-wrap') as HTMLElement;
  const popup      = document.getElementById(prefix + '-edge-popup') as HTMLElement;
  const popupAct   = document.getElementById(prefix + '-popup-act') as HTMLSelectElement | HTMLInputElement;
  const popupDur   = document.getElementById(prefix + '-popup-dur') as HTMLInputElement;
  const toolbar    = document.getElementById(prefix + '-toolbar') as HTMLElement;

  // ── DOT GRID ──
  const gridG = document.getElementById(prefix + '-grid') as unknown as SVGGElement;
  for (let gx = 20; gx < 960; gx += 40) {
    for (let gy = 20; gy < canvasHeight; gy += 40) {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', String(gx)); dot.setAttribute('cy', String(gy));
      dot.setAttribute('r', '1.5'); dot.setAttribute('fill', '#999');
      gridG.appendChild(dot);
    }
  }

  // ── COORDINATE HELPERS ──
  function svgPoint(evt: PointerEvent) {
    const pt = svg!.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg!.getScreenCTM()!.inverse());
  }

  function edgeEndpoints(fn: PertNode, tn: PertNode) {
    const dx = tn.x - fn.x, dy = tn.y - fn.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x1: fn.x, y1: fn.y, x2: tn.x, y2: tn.y };
    const ux = dx / dist, uy = dy / dist;
    return { x1: fn.x + ux * R, y1: fn.y + uy * R, x2: tn.x - ux * (R + 10), y2: tn.y - uy * (R + 10) };
  }

  // ── TOOLBAR ──
  function setTool(t: string) {
    tool = t;
    edgeSource = null;
    ghost.setAttribute('opacity', '0');
    canvasWrap.classList.remove('tool-node', 'tool-edge', 'tool-delete');
    if (t === 'node') canvasWrap.classList.add('tool-node');
    else if (t === 'edge' || t === 'relay') canvasWrap.classList.add('tool-edge');
    else if (t === 'delete') canvasWrap.classList.add('tool-delete');
    nodes.forEach((n) => { n.gEl.classList.remove('source-highlight'); });
    toolbar.querySelectorAll('.ex3-tool').forEach((btn) => {
      (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.tool === t);
    });
  }

  toolbar.addEventListener('click', function (e) {
    const btn = (e.target as Element).closest('.ex3-tool') as HTMLElement | null;
    if (btn) setTool(btn.dataset.tool!);
  });

  // ── NODE OPERATIONS ──
  function findNode(id: number): PertNode | undefined {
    return nodes.find((n) => n.id === id);
  }

  function toRoman(num: number): string {
    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    for (let i = 0; i < vals.length; i++) {
      while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
    }
    return result;
  }

  // Extra nodes continue numbering after the last predefined label
  // (ex4's list skips V, so id 14 must become XV, not a second XIV)
  const lastLabelNum = (() => {
    for (let k = 1; k <= 100; k++) if (toRoman(k) === labels[labels.length - 1]) return k;
    return labels.length;
  })();

  function addNode(x: number, y: number): PertNode {
    const id = nextId++;
    const label = labels[id - 1] || toRoman(lastLabelNum + id - labels.length);
    const node: PertNode = { id, label, x, y, gEl: null!, _teInput: null!, _tlInput: null! };

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
    g.setAttribute('transform', `translate(${x},${y})`);
    g.classList.add('ex3-node-group');
    g.dataset.nodeId = String(id);

    const bgL = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgL.setAttribute('r', String(R)); bgL.setAttribute('fill', '#eef0f2'); bgL.setAttribute('clip-path', `url(#${prefix}-cl)`);
    g.appendChild(bgL);
    const bgTR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgTR.setAttribute('r', String(R)); bgTR.setAttribute('fill', '#e8f5e9'); bgTR.setAttribute('clip-path', `url(#${prefix}-ctr)`);
    g.appendChild(bgTR);
    const bgBR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgBR.setAttribute('r', String(R)); bgBR.setAttribute('fill', '#e3f0fb'); bgBR.setAttribute('clip-path', `url(#${prefix}-cbr)`);
    g.appendChild(bgBR);

    const border = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    border.setAttribute('r', String(R)); border.setAttribute('fill', 'none');
    border.setAttribute('stroke', '#333'); border.setAttribute('stroke-width', '2.5');
    g.appendChild(border);

    const lineV = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineV.setAttribute('x1', '0'); lineV.setAttribute('y1', String(-R)); lineV.setAttribute('x2', '0'); lineV.setAttribute('y2', String(R));
    lineV.setAttribute('stroke', '#555'); lineV.setAttribute('stroke-width', '1.6');
    g.appendChild(lineV);
    const lineH = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineH.setAttribute('x1', '0'); lineH.setAttribute('y1', '0'); lineH.setAttribute('x2', String(R)); lineH.setAttribute('y2', '0');
    lineH.setAttribute('stroke', '#555'); lineH.setAttribute('stroke-width', '1.6');
    g.appendChild(lineH);

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', String(-R / 2)); txt.setAttribute('y', '5');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-family', 'Segoe UI,sans-serif');
    txt.setAttribute('font-size', label.length > 3 ? '9' : label.length > 2 ? '10' : '13');
    txt.setAttribute('font-weight', '700'); txt.setAttribute('fill', '#333');
    txt.setAttribute('pointer-events', 'none');
    txt.textContent = label;
    g.appendChild(txt);

    const foTE = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foTE.setAttribute('x', '2'); foTE.setAttribute('y', String(-R + 3));
    foTE.setAttribute('width', String(R - 4)); foTE.setAttribute('height', String(R - 3));
    const teInput = document.createElement('input');
    teInput.type = 'text'; teInput.inputMode = 'decimal'; teInput.className = 'ex1-input';
    teInput.style.width = '26px'; teInput.style.height = '18px'; teInput.style.fontSize = '10px';
    teInput.placeholder = '?';
    foTE.appendChild(teInput);
    g.appendChild(foTE);
    node._teInput = teInput;

    const foTL = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foTL.setAttribute('x', '2'); foTL.setAttribute('y', '2');
    foTL.setAttribute('width', String(R - 4)); foTL.setAttribute('height', String(R - 3));
    const tlInput = document.createElement('input');
    tlInput.type = 'text'; tlInput.inputMode = 'decimal'; tlInput.className = 'ex1-input';
    tlInput.style.width = '26px'; tlInput.style.height = '18px'; tlInput.style.fontSize = '10px';
    tlInput.placeholder = '?';
    foTL.appendChild(tlInput);
    g.appendChild(foTL);
    node._tlInput = tlInput;

    nodesG.appendChild(g);
    node.gEl = g;
    nodes.push(node);
    return node;
  }

  function removeNode(nodeId: number) {
    const idx = nodes.findIndex((n) => n.id === nodeId);
    if (idx === -1) return;
    nodes[idx].gEl.remove();
    nodes.splice(idx, 1);
    const connected = edges.filter((e) => e.fromId === nodeId || e.toId === nodeId);
    connected.forEach((e) => { removeEdge(e.id); });
  }

  // ── EDGE OPERATIONS ──
  function addEdge(fromId: number, toId: number, dashed?: boolean, act?: string, dur?: number): PertEdge | null {
    const id = nextEdgeId++;
    const fn = findNode(fromId), tn = findNode(toId);
    if (!fn || !tn) return null;
    const edge: PertEdge = { id, fromId, toId, dashed: !!dashed, act: act || '', dur: dur || 0, selected: false, gEl: null!, _line: null!, _lbl: null!, _hit: null! };

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
    g.dataset.edgeId = String(id);
    const ep = edgeEndpoints(fn, tn);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line') as SVGLineElement;
    line.setAttribute('x1', String(ep.x1)); line.setAttribute('y1', String(ep.y1));
    line.setAttribute('x2', String(ep.x2)); line.setAttribute('y2', String(ep.y2));
    line.setAttribute('stroke', dashed ? '#bbb' : '#888');
    line.setAttribute('stroke-width', dashed ? '1.6' : '2');
    if (dashed) line.setAttribute('stroke-dasharray', '6 4');
    line.setAttribute('marker-end', dashed ? `url(#${prefix}-m-dash)` : `url(#${prefix}-m-def)`);
    g.appendChild(line);
    edge._line = line;

    const mx = (ep.x1 + ep.x2) / 2, my = (ep.y1 + ep.y2) / 2;
    const dx = ep.x2 - ep.x1, dy = ep.y2 - ep.y1;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -(dy / dist) * 14, perpY = (dx / dist) * 14;
    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text') as SVGTextElement;
    lbl.setAttribute('x', String(mx + perpX)); lbl.setAttribute('y', String(my + perpY));
    lbl.setAttribute('text-anchor', 'middle');
    lbl.setAttribute('font-family', 'Segoe UI,sans-serif');
    lbl.setAttribute('font-size', '10'); lbl.setAttribute('font-weight', '600');
    lbl.setAttribute('fill', dashed ? '#bbb' : '#666');
    lbl.setAttribute('pointer-events', 'none');
    lbl.textContent = dashed ? '0' : (act ? edgeLabelFn(act, dur || 0) : '');
    g.appendChild(lbl);
    edge._lbl = lbl;

    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'line') as SVGLineElement;
    hit.setAttribute('x1', String(ep.x1)); hit.setAttribute('y1', String(ep.y1));
    hit.setAttribute('x2', String(ep.x2)); hit.setAttribute('y2', String(ep.y2));
    hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', '18');
    hit.setAttribute('fill', 'none'); hit.style.cursor = 'pointer';
    g.appendChild(hit);
    edge._hit = hit;

    edgesG.appendChild(g);
    edge.gEl = g;
    edges.push(edge);
    return edge;
  }

  function removeEdge(edgeId: number) {
    const idx = edges.findIndex((e) => e.id === edgeId);
    if (idx === -1) return;
    edges[idx].gEl.remove();
    edges.splice(idx, 1);
  }

  function updateEdgePositions() {
    edges.forEach((e) => {
      const fn = findNode(e.fromId), tn = findNode(e.toId);
      if (!fn || !tn) return;
      const ep = edgeEndpoints(fn, tn);
      e._line.setAttribute('x1', String(ep.x1)); e._line.setAttribute('y1', String(ep.y1));
      e._line.setAttribute('x2', String(ep.x2)); e._line.setAttribute('y2', String(ep.y2));
      e._hit.setAttribute('x1', String(ep.x1)); e._hit.setAttribute('y1', String(ep.y1));
      e._hit.setAttribute('x2', String(ep.x2)); e._hit.setAttribute('y2', String(ep.y2));
      const mx = (ep.x1 + ep.x2) / 2, my = (ep.y1 + ep.y2) / 2;
      const dx = ep.x2 - ep.x1, dy = ep.y2 - ep.y1;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const perpX = -(dy / dist) * 14, perpY = (dx / dist) * 14;
      e._lbl.setAttribute('x', String(mx + perpX));
      e._lbl.setAttribute('y', String(my + perpY));
    });
  }

  // ── EDGE POPUP ──
  let pendingEdge: PertEdge | null = null;
  const isFreeMode = popupAct.tagName !== 'SELECT';

  function showEdgePopup(edge: PertEdge, svgX: number, svgY: number) {
    pendingEdge = edge;
    const svgRect = svg!.getBoundingClientRect();
    const vb = svg!.viewBox.baseVal;
    const scaleX = svgRect.width / vb.width;
    const scaleY = svgRect.height / vb.height;
    const left = svgX * scaleX;
    const top = svgY * scaleY;
    popup.style.left = left + 'px';
    popup.style.top = Math.max(0, top - 30) + 'px';
    popup.style.display = 'block';
    // While open the popup may extend past the canvas (small screens); otherwise the
    // wrap's overflow:hidden clips it and the OK button becomes unreachable.
    canvasWrap.classList.add('popup-open');

    if (isFreeMode) {
      (popupAct as HTMLInputElement).value = edge.act || '';
      popupDur.value = String(edge.dur || '');
    } else {
      const selectEl = popupAct as HTMLSelectElement;
      const usedActs: Record<string, boolean> = {};
      edges.forEach((e) => { if (e.act && e.id !== edge.id) usedActs[e.act] = true; });
      selectEl.innerHTML = '<option value="">— Kies —</option>';
      (activities || []).forEach((a) => {
        if (!usedActs[a.id]) {
          const opt = document.createElement('option');
          opt.value = a.id;
          opt.textContent = cfg.optionLabelFn ? cfg.optionLabelFn(a) : (a.id + ' — ' + a.desc);
          selectEl.appendChild(opt);
        }
      });
      if (edge.act) selectEl.value = edge.act;
      const selAct = (activities || []).find((a) => a.id === selectEl.value);
      popupDur.value = selAct && durField ? String((selAct as unknown as Record<string, unknown>)[durField] || '') : '';

      selectEl.onchange = function () {
        const a = (activities || []).find((a) => a.id === selectEl.value);
        popupDur.value = a && durField ? String((a as unknown as Record<string, unknown>)[durField] || '') : '';
      };
    }
    // Keep the whole popup inside the canvas, using its real size (long activity names widen it)
    const margin = 8;
    const maxLeft = canvasWrap.clientWidth - popup.offsetWidth - margin;
    const maxTop = canvasWrap.clientHeight - popup.offsetHeight - margin;
    popup.style.left = Math.max(margin, Math.min(left, maxLeft)) + 'px';
    popup.style.top = Math.max(margin, Math.min(top - 30, maxTop)) + 'px';

    popupAct.focus({ preventScroll: true });
    popup.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function hideEdgePopup() {
    popup.style.display = 'none';
    canvasWrap.classList.remove('popup-open');
    pendingEdge = null;
  }

  document.getElementById(prefix + '-popup-ok')!.addEventListener('click', function () {
    if (!pendingEdge) return;
    pendingEdge.act = popupAct.value;
    pendingEdge.dur = parseInt(popupDur.value, 10) || 0;
    pendingEdge._lbl.textContent = pendingEdge.act ? edgeLabelFn(pendingEdge.act, pendingEdge.dur) : String(pendingEdge.dur);
    hideEdgePopup();
  });

  document.getElementById(prefix + '-popup-cancel')!.addEventListener('click', function () {
    if (pendingEdge && !pendingEdge.act && !pendingEdge.dashed) {
      removeEdge(pendingEdge.id);
    }
    hideEdgePopup();
  });

  // ── SVG EVENTS ──
  // ── DELETE CONFIRMATION ──
  // Built here (not in JSX) so every builder (ex3/4/5, playground) gets it.
  const confirmBox = document.createElement('div');
  confirmBox.className = 'ex3-confirm-popup';
  confirmBox.setAttribute('role', 'alertdialog');
  confirmBox.setAttribute('aria-labelledby', prefix + '-confirm-msg');
  confirmBox.style.display = 'none';
  confirmBox.innerHTML =
    `<p id="${prefix}-confirm-msg" class="ex3-confirm-msg"></p>` +
    '<div class="ex3-edge-popup-btns">' +
    '<button type="button" class="ex3-confirm-delete">Verwijder</button>' +
    '<button type="button" class="ex3-popup-cancel">Annuleer</button>' +
    '</div>';
  canvasWrap.appendChild(confirmBox);
  // Amber arrowhead for arrows awaiting deletion (marker colours can't be changed via CSS)
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const delMarker = document.createElementNS(SVG_NS, 'marker');
  delMarker.id = prefix + '-m-del';
  [['markerWidth', '9'], ['markerHeight', '7'], ['refX', '9'], ['refY', '3.5'], ['orient', 'auto']]
    .forEach(([k, v]) => delMarker.setAttribute(k, v));
  const delTip = document.createElementNS(SVG_NS, 'polygon');
  delTip.setAttribute('points', '0 0,9 3.5,0 7');
  delTip.setAttribute('fill', '#f59e0b');
  delMarker.appendChild(delTip);
  (svg.querySelector('defs') ?? svg).appendChild(delMarker);
  const confirmMsg = confirmBox.querySelector('p') as HTMLElement;
  const confirmYes = confirmBox.querySelector('.ex3-confirm-delete') as HTMLButtonElement;
  const confirmNo = confirmBox.querySelector('.ex3-popup-cancel') as HTMLButtonElement;
  let pendingDelete: { kind: 'node' | 'edge'; id: number; els: SVGGElement[] } | null = null;

  function askDelete(kind: 'node' | 'edge', id: number, evt: PointerEvent) {
    // Message built from text nodes: labels/activity names can be user input (playground, imports)
    const strong = (t: string) => { const b = document.createElement('strong'); b.textContent = t; return b; };
    const parts: (string | Node)[] = [];
    let els: SVGGElement[];
    if (kind === 'node') {
      const node = findNode(id);
      if (!node) return;
      const connected = edges.filter((e) => e.fromId === id || e.toId === id);
      els = [node.gEl, ...connected.map((e) => e.gEl)]; // connected arrows disappear too
      const n = connected.length;
      parts.push('Knooppunt ', strong(node.label), ' verwijderen?');
      if (n) parts.push(document.createElement('br'),
        `Ook ${n === 1 ? 'de verbonden pijl wordt' : `de ${n} verbonden pijlen worden`} verwijderd.`);
    } else {
      const edge = edges.find((e) => e.id === id);
      if (!edge) return;
      els = [edge.gEl];
      if (edge.dashed) parts.push('Deze ', strong('0-lijn'), ' verwijderen?');
      else if (edge.act) parts.push('Activiteit ', strong(edge._lbl.textContent || edge.act), ' verwijderen?');
      else parts.push('Deze pijl verwijderen?');
    }
    pendingDelete = { kind, id, els };
    els.forEach((el) => el.classList.add('delete-pending'));
    els.forEach((el) => { const l = el.querySelector('line'); if (l && el.dataset.edgeId) l.style.markerEnd = `url(#${prefix}-m-del)`; });
    confirmMsg.replaceChildren(...parts);
    confirmBox.style.display = 'block';
    canvasWrap.classList.add('popup-open');
    // Next to the pointer, kept inside the canvas
    const wr = canvasWrap.getBoundingClientRect();
    const margin = 8;
    const x = evt.clientX - wr.left + 12, y = evt.clientY - wr.top + 12;
    confirmBox.style.left = Math.max(margin, Math.min(x, canvasWrap.clientWidth - confirmBox.offsetWidth - margin)) + 'px';
    confirmBox.style.top = Math.max(margin, Math.min(y, canvasWrap.clientHeight - confirmBox.offsetHeight - margin)) + 'px';
    confirmNo.focus({ preventScroll: true }); // safe default: Enter cancels
    confirmBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function closeDeleteConfirm() {
    if (pendingDelete) pendingDelete.els.forEach((el) => {
      el.classList.remove('delete-pending');
      const l = el.querySelector('line');
      if (l) l.style.markerEnd = '';
    });
    pendingDelete = null;
    confirmBox.style.display = 'none';
    if (popup.style.display === 'none') canvasWrap.classList.remove('popup-open');
  }

  confirmYes.addEventListener('click', function () {
    if (!pendingDelete) return;
    const { kind, id } = pendingDelete;
    closeDeleteConfirm();
    if (kind === 'node') removeNode(id); else removeEdge(id);
  });
  confirmNo.addEventListener('click', closeDeleteConfirm);

  svg.addEventListener('pointerdown', function (evt: PointerEvent) {
    if (popup.style.display !== 'none') return;
    // A click on the canvas while confirming = cancel
    if (pendingDelete) { closeDeleteConfirm(); return; }
    const pt = svgPoint(evt);
    const target = evt.target as Element;
    const nodeG = target.closest('.ex3-node-group') as SVGGElement | null;
    const edgeG = target.closest('[data-edge-id]') as SVGGElement | null;

    if (tool === 'select') {
      if (nodeG && !target.closest('foreignObject')) {
        const nid = parseInt((nodeG as unknown as HTMLElement).dataset.nodeId!);
        const node = findNode(nid);
        if (node) {
          dragNode = node;
          dragOffset.x = pt.x - node.x;
          dragOffset.y = pt.y - node.y;
          nodeG.classList.add('dragging');
          svg.setPointerCapture(evt.pointerId);
          evt.preventDefault();
        }
      } else if (edgeG && !nodeG) {
        const eid = parseInt((edgeG as unknown as HTMLElement).dataset.edgeId!);
        const edge = edges.find((e) => e.id === eid);
        if (edge) {
          edge.selected = !edge.selected;
          if (edge.selected) {
            edge._line.setAttribute('stroke', '#e63946');
            edge._line.setAttribute('stroke-width', '3');
            edge._line.setAttribute('marker-end', `url(#${prefix}-m-sel)`);
            edge._lbl.setAttribute('fill', '#e63946');
          } else {
            edge._line.setAttribute('stroke', edge.dashed ? '#bbb' : '#888');
            edge._line.setAttribute('stroke-width', edge.dashed ? '1.6' : '2');
            edge._line.setAttribute('marker-end', edge.dashed ? `url(#${prefix}-m-dash)` : `url(#${prefix}-m-def)`);
            edge._lbl.setAttribute('fill', edge.dashed ? '#bbb' : '#666');
          }
        }
      }
    } else if (tool === 'node') {
      if (!nodeG) {
        addNode(pt.x, pt.y);
        setTool('select');
      }
    } else if (tool === 'edge' || tool === 'relay') {
      if (nodeG) {
        const nid2 = parseInt((nodeG as unknown as HTMLElement).dataset.nodeId!);
        if (edgeSource === null) {
          edgeSource = nid2;
          nodeG.classList.add('source-highlight');
          const srcNode = findNode(nid2)!;
          ghost.setAttribute('x1', String(srcNode.x));
          ghost.setAttribute('y1', String(srcNode.y));
          ghost.setAttribute('x2', String(srcNode.x));
          ghost.setAttribute('y2', String(srcNode.y));
          ghost.setAttribute('opacity', '1');
        } else if (nid2 !== edgeSource) {
          ghost.setAttribute('opacity', '0');
          nodes.forEach((n) => { n.gEl.classList.remove('source-highlight'); });
          const isDashed = (tool === 'relay');
          const src = edgeSource;
          edgeSource = null;
          // Never allow two connections between the same pair of nodes (either direction)
          if (edges.some((e) => (e.fromId === src && e.toId === nid2) || (e.fromId === nid2 && e.toId === src))) {
            [src, nid2].forEach((id) => {
              const g = findNode(id)?.gEl;
              if (!g) return;
              g.classList.add('edge-refused');
              setTimeout(() => g.classList.remove('edge-refused'), 700);
            });
            return;
          }
          const newEdge = addEdge(src, nid2, isDashed);
          if (newEdge && !isDashed) {
            const fromN = findNode(newEdge.fromId)!, toN = findNode(newEdge.toId)!;
            const emx = (fromN.x + toN.x) / 2, emy = (fromN.y + toN.y) / 2;
            showEdgePopup(newEdge, emx, emy);
          }
        }
      }
    } else if (tool === 'delete') {
      if (nodeG) {
        askDelete('node', parseInt((nodeG as unknown as HTMLElement).dataset.nodeId!), evt);
      } else if (edgeG) {
        askDelete('edge', parseInt((edgeG as unknown as HTMLElement).dataset.edgeId!), evt);
      }
    }
  });

  svg.addEventListener('pointermove', function (evt: PointerEvent) {
    if (dragNode) {
      const pt = svgPoint(evt);
      dragNode.x = Math.max(R, Math.min(960 - R, pt.x - dragOffset.x));
      dragNode.y = Math.max(R, Math.min(canvasHeight - R, pt.y - dragOffset.y));
      dragNode.gEl.setAttribute('transform', `translate(${dragNode.x},${dragNode.y})`);
      updateEdgePositions();
      evt.preventDefault();
    }
    if (edgeSource !== null) {
      const pt2 = svgPoint(evt);
      ghost.setAttribute('x2', String(pt2.x));
      ghost.setAttribute('y2', String(pt2.y));
    }
  });

  svg.addEventListener('pointerup', function (evt: PointerEvent) {
    if (dragNode) {
      dragNode.gEl.classList.remove('dragging');
      dragNode = null;
      svg.releasePointerCapture(evt.pointerId);
    }
  });

  svg.addEventListener('dblclick', function (evt: MouseEvent) {
    const edgeG = (evt.target as Element).closest('[data-edge-id]') as HTMLElement | null;
    if (edgeG && tool === 'select') {
      const eid = parseInt(edgeG.dataset.edgeId!);
      const edge = edges.find((e) => e.id === eid);
      if (edge && !edge.dashed) {
        const fn = findNode(edge.fromId)!, tn = findNode(edge.toId)!;
        showEdgePopup(edge, (fn.x + tn.x) / 2, (fn.y + tn.y) / 2);
      }
    }
  });

  document.addEventListener('keydown', function (evt: KeyboardEvent) {
    if (evt.key === 'Escape') {
      if (pendingDelete) closeDeleteConfirm();
      if (edgeSource !== null) {
        edgeSource = null;
        ghost.setAttribute('opacity', '0');
        nodes.forEach((n) => { n.gEl.classList.remove('source-highlight'); });
      }
      if (popup.style.display !== 'none') {
        if (pendingEdge && !pendingEdge.act && !pendingEdge.dashed) removeEdge(pendingEdge.id);
        hideEdgePopup();
      }
    }
  });

  // ── GRAPH TRAVERSAL (for validation) ──
  function computeTE(nodeId: number, visited: Record<number, boolean> = {}): number {
    if (visited[nodeId]) return 0;
    visited[nodeId] = true;
    const incoming = edges.filter((e) => e.toId === nodeId);
    if (incoming.length === 0) return 0;
    let maxTE = 0;
    incoming.forEach((e) => {
      const v = computeTE(e.fromId, { ...visited }) + e.dur;
      if (v > maxTE) maxTE = v;
    });
    return maxTE;
  }

  function computeTL(nodeId: number, projectEnd: number, visited: Record<number, boolean> = {}): number {
    if (visited[nodeId]) return Infinity;
    visited[nodeId] = true;
    const outgoing = edges.filter((e) => e.fromId === nodeId);
    if (outgoing.length === 0) return projectEnd;
    let minTL = Infinity;
    outgoing.forEach((e) => {
      const v = computeTL(e.toId, projectEnd, { ...visited }) - e.dur;
      if (v < minTL) minTL = v;
    });
    return minTL;
  }

  function canReach(fromId: number, toId: number, visited: Record<number, boolean>): boolean {
    if (fromId === toId) return true;
    if (visited[fromId]) return false;
    visited[fromId] = true;
    return edges.filter((e) => e.fromId === fromId)
      .some((e) => canReach(e.toId, toId, { ...visited }));
  }

  // ── RESET ──
  function resetBuilder() {
    while (edges.length) { edges[0].gEl.remove(); edges.splice(0, 1); }
    while (nodes.length) { nodes[0].gEl.remove(); nodes.splice(0, 1); }
    nextId = 1; nextEdgeId = 1;
    edgeSource = null;
    ghost.setAttribute('opacity', '0');
    closeDeleteConfirm();
    hideEdgePopup();
    setTool('select');
  }

  // ── LOAD STATE ──
  function loadState(data: PertNetworkFile) {
    resetBuilder();
    data.nodes.forEach(n => {
      nextId = n.id; // addNode uses nextId++ so the node gets exactly n.id
      const node = addNode(n.x, n.y);
      if (n.te !== null) node._teInput.value = String(n.te);
      if (n.tl !== null) node._tlInput.value = String(n.tl);
    });
    // nextId is now max(n.id) + 1 — correct for future additions
    data.edges.forEach(e => {
      nextEdgeId = e.id; // addEdge uses nextEdgeId++ so the edge gets exactly e.id
      const edge = addEdge(e.fromId, e.toId, e.dashed, e.act, e.dur);
      if (edge && e.selected) {
        edge.selected = true;
        edge._line.setAttribute('stroke', '#e63946');
        edge._line.setAttribute('stroke-width', '3');
        edge._line.setAttribute('marker-end', `url(#${prefix}-m-sel)`);
        edge._lbl.setAttribute('fill', '#e63946');
      }
    });
    // nextEdgeId is now max(e.id) + 1 — correct for future additions
  }

  return {
    nodes,
    edges,
    computeTE,
    computeTL,
    canReach,
    findNode,
    hideEdgePopup,
    setTool,
    resetBuilder,
    loadState,
  };
}
