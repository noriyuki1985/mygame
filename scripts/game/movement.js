// scripts/game/movement.js

/**
 * 移動可能マスを取得する
 * @param {number} x0     - 出発 X 座標
 * @param {number} y0     - 出発 Y 座標
 * @param {number} move   - 移動力（マス数）
 * @param {number} width  - マップ幅
 * @param {number} height - マップ高さ
 * @returns {{x:number,y:number}[]} 到達可能セル座標の配列
 */
export function getReachableCells(x0, y0, move, width, height) {
    const visited = Array.from({ length: height }, () => Array(width).fill(false));
    const results = [];
    const queue = [{ x: x0, y: y0, dist: 0 }];
    visited[y0][x0] = true;
  
    const dirs = [
      { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
    ];
  
    while (queue.length) {
      const { x, y, dist } = queue.shift();
      if (dist > 0) results.push({ x, y });
      if (dist === move) continue;
  
      for (const { dx, dy } of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (visited[ny][nx]) continue;
        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny, dist: dist + 1 });
      }
    }
    return results;
  }
  