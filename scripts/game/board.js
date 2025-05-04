/* ------------------------------------------------------------
 * scripts/game/board.js
 * 盤面（グリッド）描画とハイライト操作系ユーティリティ
 * ---------------------------------------------------------- */

/**
 * グリッド（タイル）を描画する。呼び出すたびに中身を全クリアして再構築。
 * container は CSS で `display:grid` にしておくこと。
 *
 * @param {HTMLElement} container  盤面を入れる DOM 要素
 * @param {number}      width      タイル横幅（デフォルト 8）
 * @param {number}      height     タイル縦幅（デフォルト 8）
 */
export function renderMap(container, width = 8, height = 8) {
  // 既存ノードを全部除去
  container.innerHTML = '';

  // サイズを CSS カスタムプロパティで公開（グリッドテンプレート用）
  container.style.setProperty('--grid-w', width);
  container.style.setProperty('--grid-h', height);

  // タイル生成
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = document.createElement('div');
      cell.className  = 'grid-cell';
      cell.dataset.x  = x;
      cell.dataset.y  = y;
      container.appendChild(cell);
    }
  }
}

/**
 * container 内の (x,y) タイル DOM を取得。
 * @param {HTMLElement} container
 * @param {number}      x
 * @param {number}      y
 * @returns {HTMLElement|null}
 */
export function getCell(container, x, y) {
  return container.querySelector(
    `.grid-cell[data-x="${x}"][data-y="${y}"]`
  );
}

/**
 * (startX,startY) から移動力 move 以内で到達可能なセルをハイライトする。
 * 移動経路はマンハッタン距離で計算（障害物・地形コストは未考慮）。
 * 既存ハイライトは自動で消去。戻り値として到達可能セル配列を返却。
 *
 * @param {HTMLElement} container  盤面 DOM
 * @param {number}      startX
 * @param {number}      startY
 * @param {number}      move       移動力（0 以上整数）
 * @returns {{x:number,y:number}[]} 到達可能セル座標リスト
 */
export function highlightMovement(container, startX, startY, move) {
  clearHighlights(container);

  const width  = parseInt(getComputedStyle(container).getPropertyValue('--grid-w')) || 8;
  const height = parseInt(getComputedStyle(container).getPropertyValue('--grid-h')) || 8;

  /** @type {{x:number,y:number}[]} */
  const reachable = [];

  for (let dy = -move; dy <= move; dy++) {
    for (let dx = -move; dx <= move; dx++) {
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist === 0 || dist > move) continue;

      const x = startX + dx;
      const y = startY + dy;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      reachable.push({ x, y });
    }
  }

  // CSS クラス付与
  reachable.forEach(({ x, y }) => {
    const cell = getCell(container, x, y);
    cell?.classList.add('highlight-move');
  });

  return reachable;
}

/**
 * 盤面上のハイライト（移動／攻撃／経路）をすべて除去する。
 * @param {HTMLElement} container
 */
export function clearHighlights(container) {
  container
    .querySelectorAll('.highlight-move, .highlight-attack, .highlight-path')
    .forEach(el =>
      el.classList.remove(
        'highlight-move',
        'highlight-attack',
        'highlight-path'
      )
    );
}

/**
 * ユニットが載っているセルに選択枠を付ける。
 * null を渡すと全選択解除。
 *
 * @param {HTMLElement|null} cellEl  対象セル要素
 */
export function highlightUnit(cellEl) {
  const board = cellEl ? cellEl.parentElement : null;
  if (!board) return;

  board
    .querySelectorAll('.unit-selected')
    .forEach(el => el.classList.remove('unit-selected'));

  cellEl?.classList.add('unit-selected');
}
