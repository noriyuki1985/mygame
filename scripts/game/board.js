// scripts/game/board.js

import { loadMap } from '../data/mapLoader.js';
import { getReachableCells } from './movement.js';

/**
 * マップを描画する
 * @param {HTMLElement} container - マップ描画エリア要素 (#map-area)
 * @returns {Promise<void>}
 */
export async function renderMap(container) {
  if (!(container instanceof HTMLElement)) {
    throw new Error('renderMap: container が HTMLElement ではありません');
  }

  // マップデータ読み込み
  const { width, height, tiles } = await loadMap();

  // コンテナ初期化
  container.innerHTML = '';
  container.style.display = 'grid';
  container.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
  container.style.gridTemplateRows    = `repeat(${height}, 1fr)`;

  // セル生成
  tiles.forEach((row, y) => {
    row.forEach((tileType, x) => {
      const cell = document.createElement('div');
      cell.className = `grid-cell tile-${tileType}`;
      cell.dataset.x = x.toString();
      cell.dataset.y = y.toString();
      container.appendChild(cell);
    });
  });
}

/**
 * 移動可能マスをハイライトする
 * @param {HTMLElement} container - マップ描画エリア要素 (#map-area)
 * @param {number} startX - 起点 X 座標
 * @param {number} startY - 起点 Y 座標
 * @param {number} move - 移動力
 * @returns {Promise<void>}
 */
export async function highlightMovement(container, startX, startY, move) {
  if (!(container instanceof HTMLElement)) {
    throw new Error('highlightMovement: container が HTMLElement ではありません');
  }
  const { width, height } = await loadMap();
  const reachableCells = getReachableCells(startX, startY, move, width, height);

  reachableCells.forEach(({ x, y }) => {
    const selector = `.grid-cell[data-x=\"${x}\"][data-y=\"${y}\"]`;
    const cell = container.querySelector(selector);
    if (cell) cell.classList.add('highlight-move');
  });
}

/**
 * 既存のハイライトをすべてクリアする
 * @param {HTMLElement} container - マップ描画エリア要素 (#map-area)
 */
export function clearHighlights(container) {
  if (!(container instanceof HTMLElement)) {
    throw new Error('clearHighlights: container が HTMLElement ではありません');
  }
  container.querySelectorAll('.highlight-move').forEach(cell => {
    cell.classList.remove('highlight-move');
  });
}


// scripts/game/unitRenderer.js

/**
 * テスト用プレースホルダーでユニットを描画する
 * 敵味方を△▽で区別し、色は青(味方)/赤(敵)
 * @param {HTMLElement} container - マップ描画エリア要素 (#map-area)
 * @param {Array} instances - UnitInstance[]
 * @param {Object} defs - Record<string, UnitDef>
 */
export function renderUnits(container, instances, defs) {
  if (!(container instanceof HTMLElement)) {
    throw new Error('renderUnits: container が HTMLElement ではありません');
  }
  if (!Array.isArray(instances)) {
    throw new Error('renderUnits: instances は配列である必要があります');
  }

  instances.forEach(inst => {
    const def = defs[inst.type];
    if (!def) {
      console.warn(`renderUnits: 定義が見つかりません type=${inst.type}`);
      return;
    }

    // プレースホルダー要素作成
    const el = document.createElement('div');
    const char = inst.owner === 1 ? '△' : '▽';
    const cls  = inst.owner === 1 ? 'unit-ally' : 'unit-enemy';
    el.textContent = char;
    el.classList.add('unit-sprite', cls);

    // Grid の行列指定（1始まり）
    el.style.gridColumnStart = (inst.x + 1).toString();
    el.style.gridRowStart    = (inst.y + 1).toString();
    // データ属性
    el.dataset.instanceId = inst.instanceId;
    el.dataset.owner      = inst.owner.toString();
    el.dataset.hp         = inst.hp.toString();
    el.dataset.maxHp      = def.maxHp.toString();

    container.appendChild(el);
  });
}
