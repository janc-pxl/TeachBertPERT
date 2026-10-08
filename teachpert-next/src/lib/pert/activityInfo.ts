/**
 * Info bar under a PERT canvas: shows the full description of the activity
 * under the pointer and highlights its row in the
 * activity table. Works for the static diagrams (ex1/2) and the builders (ex3–5)
 * via a `resolve` callback that maps an event target to an activity id.
 */

export interface ActivityDetails {
  label: string; // e.g. "A" or "Act 4"
  desc: string;
  dur: string;   // e.g. "5 weken"
  pred: string;  // e.g. "Act 1" or "—"
}

/** Activity id, 'dummy' for a 0-line, or null when the target is not an activity arrow. */
export type ResolvedTarget = string | 'dummy' | null;

interface Options {
  svg: SVGSVGElement;
  infoEl: HTMLElement;
  table: HTMLElement | null;
  details: Record<string, ActivityDetails>;
  resolve: (target: Element) => ResolvedTarget;
}

const DEFAULT_TEXT = 'Wijs een pijl aan om de omschrijving van de activiteit te zien.';

export function attachActivityInfo({ svg, infoEl, table, details, resolve }: Options): () => void {
  function highlightRow(id: ResolvedTarget) {
    table?.querySelectorAll('tr.act-row-active').forEach((tr) => tr.classList.remove('act-row-active'));
    if (id && id !== 'dummy') table?.querySelector(`tr[data-act="${CSS.escape(id)}"]`)?.classList.add('act-row-active');
  }

  function show(id: ResolvedTarget) {
    const line = (cls: string, ...parts: (string | Node)[]) => {
      const d = document.createElement('div');
      d.className = cls;
      d.append(...parts);
      return d;
    };
    const strong = (t: string) => { const b = document.createElement('strong'); b.textContent = t; return b; };

    const d = id && id !== 'dummy' ? details[id] : undefined;
    infoEl.classList.toggle('is-empty', !id || (id !== 'dummy' && !d));
    if (id === 'dummy') {
      infoEl.replaceChildren(
        line('act-info-main', strong('0-lijn (schijnactiviteit)')),
        line('act-info-sub', 'Legt alleen een afhankelijkheid vast · duurtijd 0'),
      );
    } else if (d) {
      infoEl.replaceChildren(
        line('act-info-main', strong(d.label), ' · ', d.desc),
        line('act-info-sub', `Duurtijd: ${d.dur} · Voorganger(s): ${d.pred}`),
      );
    } else {
      // Empty second line (non-breaking space) keeps the bar at its fixed two-line height
      infoEl.replaceChildren(line('act-info-main', DEFAULT_TEXT), line('act-info-sub', '\u00a0'));
    }
    // Full text as tooltip, for when a line is cut off with an ellipsis
    infoEl.title = Array.from(infoEl.children, (c) => (c.textContent ?? '').trim()).filter(Boolean).join(' — ');
    highlightRow(d || id === 'dummy' ? id : null);
  }

  const onOver = (e: Event) => show(resolve(e.target as Element));
  const onLeave = () => show(null);

  svg.addEventListener('pointerover', onOver);
  svg.addEventListener('pointerleave', onLeave);
  show(null);

  return () => {
    svg.removeEventListener('pointerover', onOver);
    svg.removeEventListener('pointerleave', onLeave);
  };
}
