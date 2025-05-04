/* scripts/core/board.js
 * -------------------------------------------------------------------
 *  export  renderMap(boardEl, w, h)
 *          getCell(boardEl, x, y)
 *          highlightMovement(boardEl, sx, sy, moveRange)
 *          highlightUnit(cellEl | null)
 *          clearHighlights(boardEl)
 * ------------------------------------------------------------------*/

/* ========== 1. 盤面生成 ========================================== */
export function renderMap(board, w, h) {
    board.style.setProperty("--grid-w", w);
    board.style.setProperty("--grid-h", h);
    board.innerHTML = "";                          // 一旦クリア
  
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.dataset.x = x;
        cell.dataset.y = y;
        board.appendChild(cell);
      }
    }
  }
  
  /* ========== 2. セル取得 ========================================== */
  export function getCell(board, x, y) {
    return board.querySelector(
      `.grid-cell[data-x="${x}"][data-y="${y}"]`
    );
  }
  
  /* ========== 3. 移動ハイライト (マンハッタン距離) ================ */
  export function highlightMovement(board, sx, sy, moveRange) {
    clearHighlights(board, ".highlight-move");
  
    const coords = [];
    const w = +board.style.getPropertyValue("--grid-w") || 8;
    const h = +board.style.getPropertyValue("--grid-h") || 8;
  
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        /* 距離 + そのセルにユニットがいるかをチェック */
        const dist = Math.abs(x - sx) + Math.abs(y - sy);
        const targetCell = getCell(board, x, y);
        const occupied = targetCell.querySelector(".unit-sprite") !== null;
  
        if (dist !== 0 && dist <= moveRange && !occupied) {
          targetCell.classList.add("highlight-move");
          coords.push({ x, y });
        }
      }
    }
    return coords;                                 // [{x,y}, …] を main.js に返却
  }
  
  /* ========== 4. ユニット選択ハイライト ============================ */
  let prevSelected = null;
  
  export function highlightUnit(cell) {
    if (prevSelected) prevSelected.classList.remove("unit-selected");
    prevSelected = cell;
    if (cell) cell.classList.add("unit-selected");
  }
  
  /* ========== 5. ハイライト一括除去 ================================ */
  export function clearHighlights(board, selector = ".highlight-move, .highlight-attack") {
    board.querySelectorAll(selector).forEach(el => el.classList.remove(
      ...el.classList // remove all matched classes
        .value
        .split(" ")
        .filter(c => c.startsWith("highlight"))
    ));
  }
  