// scripts/main.js

import { renderMap, highlightMovement, clearHighlights } from './game/board.js';
import { renderUnits } from './game/unitRenderer.js';
import { loadMap } from './data/mapLoader.js';
import { loadUnitDefs } from './data/unitLoader.js';
import { attackUnit } from './game/battle.js';

window.addEventListener('DOMContentLoaded', async () => {
  // DOM要素取得
  const mapArea           = document.getElementById('map-area');
  const turnIndicator     = document.getElementById('turn-indicator');
  const unitInfo          = document.getElementById('unit-info');
  const moveModeButton    = document.getElementById('move-mode-button');
  const attackModeButton  = document.getElementById('attack-mode-button');
  const endTurnButton     = document.getElementById('end-turn-button');
  const logEl             = document.getElementById('log');

  // ゲーム状態
  let mapData;
  let unitDefs;
  let units;
  let currentPlayer = 1;
  let selectedUnit = null;
  let mode = 'move'; // 'move' or 'attack'

  try {
    log('ゲーム初期化中...', logEl);

    // マップ描画
    await renderMap(mapArea);
    log('マップ描画完了', logEl);

    // データ読み込み
    mapData  = await loadMap();
    unitDefs = await loadUnitDefs();

    // ユニット描画
    renderUnits(mapArea, mapData.units, unitDefs);

    // ユニット状態初期化
    units = mapData.units.map(inst => ({
      instanceId: inst.instanceId,
      type:       inst.type,
      def:        unitDefs[inst.type],
      owner:      inst.owner,
      x:          inst.x,
      y:          inst.y,
      hp:         unitDefs[inst.type].maxHp
    }));

    updateTurnIndicator(currentPlayer, turnIndicator);
    log(`プレイヤー${currentPlayer}のターン開始`, logEl);

  } catch (error) {
    console.error(error);
    alert('初期化エラー: ' + error.message);
    return;
  }

  // モード切替ボタン設定
  moveModeButton.addEventListener('click', () => {
    mode = 'move';
    moveModeButton.classList.add('active');
    attackModeButton.classList.remove('active');
    log('移動モード', logEl);
    clearSelection();
  });

  attackModeButton.addEventListener('click', () => {
    mode = 'attack';
    attackModeButton.classList.add('active');
    moveModeButton.classList.remove('active');
    log('攻撃モード', logEl);
    clearSelection();
  });

  // マップクリック処理
  mapArea.addEventListener('click', event => {
    const cell = event.target.closest('.grid-cell');
    if (!cell) return;
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);

    // クリック位置のユニット取得
    const clickedUnit = units.find(u => u.x === x && u.y === y);

    // 自ユニット選択
    if (clickedUnit && clickedUnit.owner === currentPlayer) {
      clearHighlights(mapArea);
      selectedUnit = clickedUnit;
      selectUnitInfo(selectedUnit, unitInfo);
      if (mode === 'move') {
        highlightMovement(mapArea, selectedUnit.x, selectedUnit.y, selectedUnit.def.move);
      }
      return;
    }

    // 移動モード：移動処理
    if (mode === 'move' && selectedUnit && !clickedUnit) {
      const dist = Math.abs(selectedUnit.x - x) + Math.abs(selectedUnit.y - y);
      if (dist <= selectedUnit.def.move) {
        moveUnit(selectedUnit, x, y, mapArea);
        log(`${selectedUnit.def.name} を (${x},${y}) へ移動`, logEl);
      } else {
        log('移動範囲外です', logEl);
      }
      clearHighlights(mapArea);
      selectedUnit = null;
      unitInfo.textContent = '';
      return;
    }

    // 攻撃モード：攻撃処理
    if (mode === 'attack' && selectedUnit && clickedUnit && clickedUnit.owner !== currentPlayer) {
      const dist = Math.abs(selectedUnit.x - clickedUnit.x) + Math.abs(selectedUnit.y - clickedUnit.y);
      const [minR, maxR] = selectedUnit.def.range;
      if (dist >= minR && dist <= maxR) {
        const { damage, killed } = attackUnit(selectedUnit, clickedUnit, mapArea);
        log(`${selectedUnit.def.name} が ${clickedUnit.def.name} に ${damage} ダメージ`, logEl);
        if (killed) {
          units = units.filter(u => u.instanceId !== clickedUnit.instanceId);
          checkVictory();
        }
      } else {
        log('攻撃範囲外です', logEl);
      }
      selectedUnit = null;
      unitInfo.textContent = '';
    }
  });

  // ターン終了ボタン
  endTurnButton.addEventListener('click', () => {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    updateTurnIndicator(currentPlayer, turnIndicator);
    log(`プレイヤー${currentPlayer}のターン開始`, logEl);
    clearHighlights(mapArea);
    selectedUnit = null;
    unitInfo.textContent = '';
    moveModeButton.click();
  });

  // 以下ユーティリティ関数
  function log(message, container) {
    container.textContent = 'ログ：' + message;
  }

  function updateTurnIndicator(player, el) {
    el.textContent = `ターン: プレイヤー${player}`;
  }

  function selectUnitInfo(unit, el) {
    el.textContent = `選択中: ${unit.def.name} (HP: ${unit.hp}/${unit.def.maxHp})`;
  }

  function moveUnit(unit, x, y, container) {
    const selector = `.unit-sprite[data-instance-id="${unit.instanceId}"]`;
    const sprite = container.querySelector(selector);
    if (sprite) {
      unit.x = x;
      unit.y = y;
      sprite.style.gridColumnStart = x + 1;
      sprite.style.gridRowStart    = y + 1;
    }
  }

  function clearSelection() {
    clearHighlights(mapArea);
    selectedUnit = null;
    unitInfo.textContent = '';
  }

  function checkVictory() {
    const heroes = units.filter(u => u.type === 'hero');
    const p1 = heroes.some(u => u.owner === 1);
    const p2 = heroes.some(u => u.owner === 2);
    if (!p1 || !p2) {
      const winner = p1 ? 1 : 2;
      alert(`プレイヤー${winner}の勝利！`);
      location.reload();
    }
  }
});
