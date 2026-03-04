export interface Activity {
  id: string;
  desc: string;
  pred: string[];
  dur?: number;
  to?: number;
  tl?: number;
  tp?: number;
  te?: number;
}

export interface PertBuilderConfig {
  prefix: string;
  activities: Activity[] | null;
  durField: string | null;
  canvasHeight?: number;
  labels: string[];
  edgeLabelFn: (act: string, dur: number) => string;
  optionLabelFn?: (a: Activity) => string;
  popupDurReadonly: boolean;
}

export interface PertNode {
  id: number;
  label: string;
  x: number;
  y: number;
  gEl: SVGGElement;
  _teInput: HTMLInputElement;
  _tlInput: HTMLInputElement;
}

export interface PertEdge {
  id: number;
  fromId: number;
  toId: number;
  dashed: boolean;
  act: string;
  dur: number;
  selected: boolean;
  gEl: SVGGElement;
  _line: SVGLineElement;
  _lbl: SVGTextElement;
  _hit: SVGLineElement;
}

export interface SerializedNode {
  id: number;
  label: string;
  x: number;
  y: number;
  te: number | null;
  tl: number | null;
}

export interface SerializedEdge {
  id: number;
  fromId: number;
  toId: number;
  dashed: boolean;
  act: string;
  dur: number;
  selected: boolean;
}

export interface PertNetworkFile {
  version: 1;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

export interface PertBuilderAPI {
  nodes: PertNode[];
  edges: PertEdge[];
  computeTE: (nodeId: number, visited?: Record<number, boolean>) => number;
  computeTL: (nodeId: number, projectEnd: number, visited?: Record<number, boolean>) => number;
  canReach: (fromId: number, toId: number, visited: Record<number, boolean>) => boolean;
  findNode: (id: number) => PertNode | undefined;
  hideEdgePopup: () => void;
  setTool: (tool: string) => void;
  resetBuilder: () => void;
  loadState: (data: PertNetworkFile) => void;
}
