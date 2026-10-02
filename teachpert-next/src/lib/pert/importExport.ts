import type { PertBuilderAPI, PertNetworkFile } from './types';

export function exportNetwork(builder: PertBuilderAPI, context: string, filename = 'pert-netwerk.json'): void {
  const data: PertNetworkFile = {
    version: 1,
    context,
    nodes: builder.nodes.map(n => ({
      id: n.id,
      label: n.label,
      x: Math.round(n.x),
      y: Math.round(n.y),
      te: n._teInput.value.trim() !== '' ? Number(n._teInput.value.trim()) : null,
      tl: n._tlInput.value.trim() !== '' ? Number(n._tlInput.value.trim()) : null,
    })),
    edges: builder.edges.map(e => ({
      id: e.id,
      fromId: e.fromId,
      toId: e.toId,
      dashed: e.dashed,
      act: e.act,
      dur: e.dur,
      selected: e.selected,
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function importNetwork(builder: PertBuilderAPI, context: string): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const data: PertNetworkFile = JSON.parse(await file.text());
      if (data.version !== 1 || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        alert('Ongeldig bestandsformaat.');
        return;
      }
      if (data.context !== context) {
        alert(`Dit bestand is gemaakt voor een andere oefening (${data.context}) en kan hier niet worden ingeladen.`);
        return;
      }
      builder.loadState(data);
    } catch {
      alert('Fout bij inlezen van bestand.');
    }
  };
  input.click();
}
