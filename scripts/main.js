/**********************************************************************
 *  scripts/main.js  –  増援：青＝最下段 / 赤＝最上段
 *    ● 青(プレイヤー) のターン終了 → 最下段に味方 1 体出現
 *    ● 赤(AI)           のターン終了 → 最上段に敵    1 体出現
 *    それ以外は前回バージョンと同一
 *********************************************************************/

import { loadGameData }        from "./services/config.js";
import { createInitialUnits }  from "./services/spawn.js";

import {
  renderMap, getCell, highlightMovement,
  highlightUnit, clearHighlights
} from "./core/board.js";

import { drawUnits }           from "./core/render.js";
import {
  manhattan, canAttack, resetTurnFlags
} from "./core/rules.js";

import { runAITurn }           from "./core/ai.js";

/* ---------- 状態 -------------------------------------------------- */
let CFG, TYPES, units = [];
const HUMAN = 0, AI = 1;
let turn = HUMAN, actionsLeft = 0, gameEnded = false;
let sel = null, reach = [], atkIds = [];

/* ---------- DOM -------------------------------------------------- */
const board = document.getElementById("mapArea");
const log   = document.getElementById("log");

/* ---------- 初期化 ---------------------------------------------- */
(async () => {
  ({ cfg: CFG, types: TYPES } = await loadGameData());
  units = createInitialUnits(CFG, TYPES);
  renderMap(board, CFG.mapWidth, CFG.mapHeight);
  drawUnits(board, units, "assets/sprites/");
  startTurn();
})();

/* ---------- 決着 -------------------------------------------------- */
function heroesAlive(owner) {
  return units.some(u => u.owner === owner && u.def.name === "Hero" && u.hp > 0);
}
function checkEnd() {
  if (!heroesAlive(HUMAN)) { end(false); return true; }
  if (!heroesAlive(AI   )) { end(true ); return true; }
  return false;
}
function end(win) {
  gameEnded = true;
  log.textContent = win ? "🎉 Victory!" : "💀 Game Over…";
  alert(log.textContent);
}

/* ---------- ★ 増援生成 ------------------------------------------ */
function spawnReinforcement(owner) {
  const y = owner === HUMAN ? CFG.mapHeight - 1 : 0;       // 最下段 or 最上段
  const freeXs = [...Array(CFG.mapWidth).keys()].filter(
    x => !units.some(u => u.x === x && u.y === y)
  );
  if (freeXs.length === 0) return;                          // 満杯ならスキップ

  const x    = freeXs[Math.random() * freeXs.length | 0];
  const type = CFG.initial.randomPool[
    Math.random() * CFG.initial.randomPool.length | 0
  ];
  const base = TYPES[type];
  const id   = `RF-${Date.now()}-${Math.random().toString(36).slice(2,5)}`;

  units.push({
    id, owner, x, y, moved:false, attacked:false,
    hp: base.maxHp,
    def: {
      ...base,
      placeholder: base.placeholder[owner],
      sprite:      base.sprite[owner]
    }
  });

  const side = owner === HUMAN ? "青" : "赤";
  log.textContent = `🛡️ 増援：${base.name}(${side}) が (${x},${y}) に出現！`;
  drawUnits(board, units, "assets/sprites/");
}

/* ---------- ターン制御 ------------------------------------------ */
function startTurn() {
  if (gameEnded) return;
  actionsLeft = CFG.actionsPerTurn;
  resetTurnFlags(units, turn);
  clearHighlights(board); clearSel();
  log.textContent = `ログ：プレイヤー${turn + 1} のターン（残 ${actionsLeft}）`;

  if (turn === AI) {
    runAITurn({
      board, units, cfg: CFG,
      draw: () => drawUnits(board, units, "assets/sprites/"),
      rules: { manhattan, canAttack }, log, owner: AI
    }).then(() => {
      if (!checkEnd()) {
        spawnReinforcement(AI);  // ★ 赤のターン終了時に最上段増援
        turn = HUMAN;
        startTurn();
      }
    });
  }
}

function consume() {
  actionsLeft--;
  if (actionsLeft <= 0) {
    if (turn === HUMAN) spawnReinforcement(HUMAN);  // ★ 青のターン終了時に最下段増援
    turn = 1 - turn;
    startTurn();
  } else {
    log.textContent = `ログ：残アクション ${actionsLeft}`;
  }
}

function forcePass() {
  if (turn !== HUMAN || actionsLeft === 0 || gameEnded) return;
  actionsLeft = 0;
  consume();              // パスも consume でターン終了処理
}

/* ---------- Helper ------------------------------------------------ */
function clearSel() { sel = null; highlightUnit(null); atkIds = []; reach = []; }
function markAtk(s) {
  atkIds = units.filter(t => canAttack(s, t)).map(t => {
    getCell(board, t.x, t.y).classList.add("highlight-attack");
    return t.id;
  });
}

/* ---------- Human クリック -------------------------------------- */
board.addEventListener("click", e => {
  if (turn !== HUMAN || gameEnded) return;
  const cell = e.target.closest(".grid-cell"); if (!cell) return;
  const x = +cell.dataset.x, y = +cell.dataset.y;
  const hit = units.find(u => u.x === x && u.y === y);

  /* 選択解除/切替 */
  if (sel) {
    if (hit && hit.id === sel.id) { clearHighlights(board); clearSel(); return; }
    if (hit && hit.owner === HUMAN && !(hit.moved && hit.attacked)) {
      clearHighlights(board); sel = hit; highlightUnit(cell);
      reach = hit.moved ? [] : highlightMovement(board, x, y, hit.def.move);
      markAtk(sel); return;
    }
    if (!hit && !reach.some(p => p.x === x && p.y === y)) {
      clearHighlights(board); clearSel(); return;
    }
  }
  if (!sel) {
    if (hit && hit.owner === HUMAN && !(hit.moved && hit.attacked)) {
      sel = hit; highlightUnit(cell);
      reach = hit.moved ? [] : highlightMovement(board, x, y, hit.def.move);
      markAtk(sel);
    }
    return;
  }

  /* 回復 */
  if (hit && hit.owner === HUMAN && sel.def.heal) {
    if (sel.attacked) { alert("この駒は既に行動済みです"); return; }
    if (manhattan(sel, hit) > sel.def.maxRange) { alert("射程外です"); return; }

    hit.hp = Math.min(hit.def.maxHp, hit.hp + sel.def.heal);
    sel.attacked = true;
    log.textContent = `ログ：${sel.def.name} が ${hit.def.name} を ${sel.def.heal} 回復`;
    drawUnits(board, units, "assets/sprites/");
    consume(); clearHighlights(board); clearSel(); return;
  }

  /* 攻撃 */
  if (hit && hit.owner === AI) {
    if (sel.attacked) { alert("この駒は既に行動済みです"); return; }
    if (!canAttack(sel, hit)) { alert("射程外です"); return; }

    hit.hp -= sel.def.atk;
    log.textContent = `ログ：${sel.def.name} が ${hit.def.name} に ${sel.def.atk} ダメージ`;
    if (hit.hp <= 0) units = units.filter(u => u.id !== hit.id);
    sel.attacked = true;
    drawUnits(board, units, "assets/sprites/");
    if (!checkEnd()) consume();
    clearHighlights(board); clearSel(); return;
  }

  /* 移動 */
  if (!sel.moved && !hit && reach.some(p => p.x === x && p.y === y)) {
    sel.x = x; sel.y = y; sel.moved = true;
    drawUnits(board, units, "assets/sprites/");
    consume();
    clearHighlights(board); clearSel();
  }
});

/* ---------- Pass キー -------------------------------------------- */
document.addEventListener("keydown", e => {
  if (CFG.passKeys.includes(e.code)) { e.preventDefault(); forcePass(); }
});
log.addEventListener("click", forcePass);
