// ===== AGENT PATHFINDING =====
// Grid-based pathfinding along roads for natural agent movement
// Road spine: vertical at gridX=16,17 / horizontal at gridY=16,17

import type { Building } from '@/data/world';

export interface Waypoint {
  x: number;
  y: number;
}

// Road grid constants (in the 36x36 grid)
const ROAD_V_X = 16.5;  // center of vertical road (col 16-17)
const ROAD_H_Y = 16.5;  // center of horizontal road (row 16-17)

/** Get the "door" position of a building — the point on its perimeter closest to a road */
function getBuildingDoor(b: Building): Waypoint {
  const cx = b.gridX + b.width / 2;
  const cy = b.gridY + b.height / 2;

  // Determine which road edge is closest
  const distToVertRoad = Math.abs(cx - ROAD_V_X);
  const distToHorizRoad = Math.abs(cy - ROAD_H_Y);

  if (distToVertRoad < distToHorizRoad) {
    // Closer to vertical road — exit through east or west side
    const exitX = cx < ROAD_V_X ? b.gridX + b.width + 0.5 : b.gridX - 0.5;
    return { x: exitX, y: cy };
  } else {
    // Closer to horizontal road — exit through south or north side
    const exitY = cy < ROAD_H_Y ? b.gridY + b.height + 0.5 : b.gridY - 0.5;
    return { x: cx, y: exitY };
  }
}

/** Get the road entry point — the point on the road nearest to the door */
function getRoadEntry(door: Waypoint): Waypoint {
  const distV = Math.abs(door.x - ROAD_V_X);
  const distH = Math.abs(door.y - ROAD_H_Y);

  if (distV < distH) {
    // Enter vertical road
    return { x: ROAD_V_X, y: door.y };
  } else {
    // Enter horizontal road
    return { x: door.x, y: ROAD_H_Y };
  }
}

/** Build a path of waypoints from one building to another along roads */
export function findPath(from: Building, to: Building): Waypoint[] {
  const doorA = getBuildingDoor(from);
  const entryA = getRoadEntry(doorA);

  const doorB = getBuildingDoor(to);
  const entryB = getRoadEntry(doorB);

  const path: Waypoint[] = [doorA, entryA];

  // If both entries are on the same road (both on V or both on H), direct connection
  const bothOnV = Math.abs(entryA.x - ROAD_V_X) < 1 && Math.abs(entryB.x - ROAD_V_X) < 1;
  const bothOnH = Math.abs(entryA.y - ROAD_H_Y) < 1 && Math.abs(entryB.y - ROAD_H_Y) < 1;

  if (bothOnV || bothOnH) {
    // Simple: walk along the same road
    path.push(entryB);
  } else {
    // Need to go through intersection
    const intersection: Waypoint = { x: ROAD_V_X, y: ROAD_H_Y };

    // Route: entryA → intersection → entryB
    // But we need intermediate points to follow the road
    if (Math.abs(entryA.x - ROAD_V_X) < 1) {
      // A is on vertical road — walk down to intersection, then along horizontal
      path.push({ x: ROAD_V_X, y: ROAD_H_Y }); // intersection
      path.push(entryB);
    } else {
      // A is on horizontal road — walk to intersection, then along vertical
      path.push({ x: ROAD_V_X, y: ROAD_H_Y }); // intersection
      path.push(entryB);
    }
  }

  path.push(doorB);
  return path;
}

/** Calculate total path length */
export function pathLength(path: Waypoint[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

/** Interpolate position along a path at time t (0-1) */
export function interpolatePath(path: Waypoint[], t: number): Waypoint {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1 || t <= 0) return path[0];
  if (t >= 1) return path[path.length - 1];

  const totalLen = pathLength(path);
  const targetDist = totalLen * t;

  let accumulated = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (accumulated + segLen >= targetDist) {
      const segT = segLen > 0 ? (targetDist - accumulated) / segLen : 0;
      return {
        x: path[i - 1].x + dx * segT,
        y: path[i - 1].y + dy * segT,
      };
    }
    accumulated += segLen;
  }
  return path[path.length - 1];
}

/** Get the direction the agent is facing at point on path */
export function getPathDirection(path: Waypoint[], t: number): { dx: number; dy: number } {
  if (path.length < 2) return { dx: 1, dy: 0 };

  const totalLen = pathLength(path);
  const targetDist = totalLen * Math.min(0.99, t);
  let accumulated = 0;

  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (accumulated + segLen >= targetDist) {
      return { dx, dy };
    }
    accumulated += segLen;
  }
  const last = path.length - 1;
  return { dx: path[last].x - path[last - 1].x, dy: path[last].y - path[last - 1].y };
}
