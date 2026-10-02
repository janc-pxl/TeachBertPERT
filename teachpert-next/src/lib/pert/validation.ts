import type { Activity, PertBuilderAPI, PertEdge } from './types';

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
