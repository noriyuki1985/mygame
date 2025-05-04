/**********************************************************************
 * scripts/core/board.js  –  Step‑1 完全版
 *      • 6 種タイルを描画（Plain, Forest, Mountain, Hill, Road, Fort）
 *      • 移動ハイライトは「タイルごとの移動コスト」を考慮して BFS 探索
 *      • API
 *          renderMap(board, w, h, tileGrid)
 *          getCell(board, x, y)
 *          highlightMovement(board, sx, sy, movePoints) → [{x,y}, …]
 *          highlightUnit(cell | null)
 *          clearHighlights(board [, selector])
 *          getTileChar(x, y)  ← ★ Step‑2 以降で地形参照に使用
 *********************************************************************/

/* ========= 0. グローバル保持 ==================================== */
let MAP_W = 8, MAP_H = 8;
let tileGrid = [];                 // 文字 2D 配列（P/F/M/H/R/T）

/* ========= 1. タイル関連ユーティリティ ========================== */
function tileName(ch) {
  switch (ch) {
    case "F": return "Forest";
    case "M": return "Mountain";
    case "H": return "Hill";
    case "R": return "Road";
    case "T": return "Fort";
    default : return "Plain";
  }
}

/* 移動コスト表（後からバランス調整可） */
const MOVE_COST = {
  P: 1,           // Plain
  F: 2,           // Forest
  M: 3,           // Mountain
  H: 2,           // Hill
  R: 1,           // Road
  T: 2            // Fort
};

/* ========= 2. 盤面生成 ========================================== */
export function renderMap(board, w, h, tiles) {
  MAP_W = w;
  MAP_H = h;
  tileGrid = tiles || Array.from({ length: h }, () => "P".repeat(w));

  board.style.setProperty("--grid-w", w);
  board.style.setProperty("--grid-h", h);
  board.innerHTML = "";

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell tile-" + tileName(tileGrid[y][x]);
      cell.dataset.x = x;
      cell.dataset.y = y;
      board.appendChild(cell);
    }
  }
}

/* ========= 3. セル取得 ========================================== */
export function getCell(board, x, y) {
  return board.querySelector(`.grid-cell[data-x="${x}"][data-y="${y}"]`);
}

/* ========= 4. 移動ハイライト（BFS・移動コスト対応） ============= */
export function highlightMovement(board, sx, sy, movePoints) {
  clearHighlights(board, ".highlight-move");
  const reachable = [];

  /* コストグリッド初期化 */
  const cost = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(Infinity));
  cost[sy][sx] = 0;

  /* 幅優先探索 */
  const queue = [{ x: sx, y: sy }];
  const dirs = [
    [ 1, 0], [-1, 0],
    [ 0, 1], [ 0,-1]
  ];

  while (queue.length) {
    const { x, y } = queue.shift();

    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) continue;

      const tileChar = tileGrid[ny][nx] || "P";
      const stepCost = MOVE_COST[tileChar] ?? 1;
      const newCost  = cost[y][x] + stepCost;
      if (newCost > movePoints || newCost >= cost[ny][nx]) continue;

      /* occupied? */
      const targetCell = getCell(board, nx, ny);
      if (targetCell.querySelector(".unit-sprite")) continue;

      cost[ny][nx] = newCost;
      queue.push({ x: nx, y: ny });
    }
  }

  /* ハイライト描画 & 座標収集 */
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (cost[y][x] !== Infinity && !(x === sx && y === sy)) {
        getCell(board, x, y).classList.add("highlight-move");
        reachable.push({ x, y });
      }
    }
  }
  return reachable;
}

/* ========= 5. ユニット選択枠 ==================================== */
export function highlightUnit(cell) {
  document
    .querySelectorAll(".unit-selected")
    .forEach(c => c.classList.remove("unit-selected"));
  if (cell) cell.classList.add("unit-selected");
}

/* ========= 6. ハイライト一括除去 ================================ */
export function clearHighlights(board, selector = ".highlight-move,.highlight-attack") {
  board.querySelectorAll(selector).forEach(el => {
    el.classList.remove(
      ...Array.from(el.classList).filter(c => c.startsWith("highlight"))
    );
  });
}

/* ========= 7. 外部から地形文字取得 ============================== */
export function getTileChar(x, y) {
  if (y < 0 || y >= MAP_H || x < 0 || x >= MAP_W) return "P";
  return tileGrid[y][x] || "P";
}
