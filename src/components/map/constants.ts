// Isometric rendering constants shared across map layers
export const TILE_W = 48;
export const TILE_H = 24;
export const WALL_H_UNIT = 16;
export const MOVE_DURATION = 1200;

export function iso(gx: number, gy: number): { x: number; y: number } {
  return {
    x: (gx - gy) * (TILE_W / 2) + 500,
    y: (gx + gy) * (TILE_H / 2) + 40,
  };
}

export function diamond(cx: number, cy: number): string {
  return `${cx},${cy - TILE_H / 2} ${cx + TILE_W / 2},${cy} ${cx},${cy + TILE_H / 2} ${cx - TILE_W / 2},${cy}`;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
