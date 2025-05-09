/* scripts/services/mapGenerator.js
 * ---------------------------------------------------------------
 *  generateMap(w = 8, h = 8) → ["PRPP...","PPF..."] の 1 行 = 1 文字列
 *    ・Road 列を 1 本（南北に貫く）
 *    ・Road の左右に Fort を 1 個ずつ
 *    ・Forest / Hill / Mountain を確率散布
 * --------------------------------------------------------------*/

export function generateMap(w = 8, h = 8) {
    // 0. 盤面を平地で初期化
    const grid = Array.from({ length: h }, () => Array(w).fill("P"));
  
    /* 1. Road を 1 列引く */
    const roadCol = 2 + Math.floor(Math.random() * (w - 4)); // 2～w-3
    for (let y = 0; y < h; y++) grid[y][roadCol] = "R";
  
    /* 2. Fort を中央付近に 2 個 */
    const fortY = Math.floor(h / 2);
    const neighbors = [roadCol - 1, roadCol + 1].filter(c => c >= 0 && c < w);
    neighbors.forEach(c => (grid[fortY][c] = "T"));
  
    /* 3. ランダム散布 */
    const probs = { F: 0.20, H: 0.12, M: 0.12 }; // Forest / Hill / Mountain
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (grid[y][x] !== "P") continue;            // 既に決定済みなら飛ばす
        const r = Math.random();
        let acc = 0;
        for (const [ch, p] of Object.entries(probs)) {
          acc += p;
          if (r < acc) { grid[y][x] = ch; break; }
        }
      }
    }
  
    /* 4. 文字列配列で返す */
    return grid.map(row => row.join(""));
  }
  