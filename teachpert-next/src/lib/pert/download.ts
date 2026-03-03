export function downloadSvgAsJpg(svgId: string, filename: string): void {
  const ACCENT = '#e63946';
  const liveSvg = document.getElementById(svgId) as unknown as SVGSVGElement;
  if (!liveSvg) return;
  const vb = liveSvg.viewBox.baseVal;
  const W = vb.width, H = vb.height;

  // Capture all foreignObject input values in DOM order (cloneNode doesn't copy .value)
  const foValues: string[] = [];
  liveSvg.querySelectorAll('foreignObject').forEach((fo) => {
    const inp = fo.querySelector('input') as HTMLInputElement | null;
    foValues.push(inp ? inp.value : '');
  });

  const clone = liveSvg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(W));
  clone.setAttribute('height', String(H));

  // White background
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
  bg.setAttribute('width', String(W)); bg.setAttribute('height', String(H));
  bg.setAttribute('fill', '#ffffff');
  clone.insertBefore(bg, clone.firstChild);

  // Inject CSS into the SVG so class-based styles (ex1/ex2 .selected) render in the image
  const svgStyle = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  svgStyle.textContent =
    ':root{--accent:#e63946}' +
    '.ex1-edge-line.selected{stroke:#e63946!important;stroke-width:3!important}' +
    '.ex1-edge-lbl.selected{fill:#e63946!important}';
  const defsEl = clone.querySelector('defs');
  if (defsEl) defsEl.appendChild(svgStyle); else clone.insertBefore(svgStyle, clone.firstChild);

  // Hide ghost preview line (only present in builder exercises)
  const ghostEl = clone.querySelector('[id$="-ghost"]');
  if (ghostEl) ghostEl.setAttribute('opacity', '0');

  // Resolve CSS var(--accent) → hardcoded color
  const markerSel = clone.querySelector('[id$="-m-sel"]');
  if (markerSel) {
    const poly = markerSel.querySelector('polygon');
    if (poly && poly.getAttribute('fill') === 'var(--accent)') poly.setAttribute('fill', ACCENT);
  }
  clone.querySelectorAll('[stroke="var(--accent)"]').forEach((el) => {
    el.setAttribute('stroke', ACCENT);
  });
  clone.querySelectorAll('[fill="var(--accent)"]').forEach((el) => {
    el.setAttribute('fill', ACCENT);
  });

  // Replace foreignObjects with SVG text
  let idx = 0;
  clone.querySelectorAll('foreignObject').forEach((fo) => {
    const val = foValues[idx++] || '';
    const x = parseFloat(fo.getAttribute('x')!);
    const y = parseFloat(fo.getAttribute('y')!);
    const w = parseFloat(fo.getAttribute('width')!);
    const h = parseFloat(fo.getAttribute('height')!);
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', String(x + w / 2));
    t.setAttribute('y', String(y + h / 2));
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('font-family', 'Segoe UI,sans-serif');
    t.setAttribute('font-size', '10');
    t.setAttribute('font-weight', '600');
    t.setAttribute('fill', '#333');
    t.setAttribute('pointer-events', 'none');
    t.textContent = val;
    fo.parentNode!.replaceChild(t, fo);
  });

  // Serialize → Blob → Image → Canvas → JPG download
  const svgStr = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    URL.revokeObjectURL(url);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.92);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  img.onerror = function () { URL.revokeObjectURL(url); };
  img.src = url;
}
