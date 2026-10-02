import type { Activity, PertBuilderAPI, PertEdge, PertNode } from './types';

/**
 * Structural PERT rules: exactly one end node (several start nodes are allowed),
 * and never two edges (activity or dummy) between the same pair of nodes.
 * Returns feedback messages; an empty array means the structure is valid.
 */
export function structureErrors(nodes: PertNode[], edges: PertEdge[]): string[] {
  const errors: string[] = [];
  const ends = nodes.filter((n) => !edges.some((e) => e.fromId === n.id));
  if (ends.length > 1) errors.push('Netwerk heeft meer dan één eindknooppunt');
  const pairs = new Set<string>();
  const hasParallel = edges.some((e) => {
    const key = `${e.fromId}-${e.toId}`;
    if (pairs.has(key)) return true;
    pairs.add(key);
    return false;
  });
  if (hasParallel) errors.push('Twee verbindingen tussen dezelfde knooppunten');
  return errors;
}

/** All activities that must precede `actId` (direct + transitive predecessors). */
function requiredAncestors(actId: string, activities: Activity[]): Set<string> {
  const byId: Record<string, Activity> = {};
  activities.forEach((a) => { byId[a.id] = a; });
  const result = new Set<string>();
  const stack = [...(byId[actId]?.pred ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    stack.push(...(byId[id]?.pred ?? []));
  }
  return result;
}

/**
 * True if some activity that is NOT a (transitive) predecessor of `actId`
 * still finishes before `actId` can start in the student's network,
 * e.g. E drawn after F while E only depends on C and D.
 */
export function hasExtraDependency(
  actId: string,
  activities: Activity[],
  actMap: Record<string, PertEdge>,
  canReach: PertBuilderAPI['canReach'],
): boolean {
  const edge = actMap[actId];
  if (!edge) return false;
  const allowed = requiredAncestors(actId, activities);
  return activities.some((other) => {
    if (other.id === actId || allowed.has(other.id)) return false;
    const otherEdge = actMap[other.id];
    return !!otherEdge && canReach(otherEdge.toId, edge.fromId, {});
  });
}
