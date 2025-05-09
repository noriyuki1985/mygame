/**********************************************************************
 *  scripts/main.js  –  ランダムマップ生成 + 地形効果 完全版
 *      ■ 毎ゲーム開始時に 8×8 のマップをランダム生成
 *          - Road 1 本（南北） / 左右に Fort 2 つ
 *          - Forest・Hill・Mountain を確率で散布
 *      ■ 地形効果
 *          - 移動コスト (Plain1 Forest2 Mountain3 Hill2 Road1 Fort2)
 *          - 防御補正  (0 / +1 / +2 / +1 / 0 / +3)
 *          - Hill：射程 2 ユニットは射程 +1
 *          - Fort：ターン開始時 HP +2
 *      ■ 1 ターン 2 アクション  /  3 ターンごと各陣営に増援
 *      ■ Healer は回復確認ダイアログ
 *      ■ Hero 撃破で勝敗  /  Red 側 AI は terrain-aware 版 ai.js
 *********************************************************************/

import { loadGameData }       from "./services/config.js";
import { createInitialUnits } from "./services/spawn.js";
import { generateMap }        from "./services/mapGenerator.js";

import {
  renderMap, getCell, highlightMovement,
  highlightUnit, clearHighlights, getTileChar
} from "./core/board.js";

import { drawUnits } from "./core/render.js";
import { manhattan, resetTurnFlags, canAttack } from "./core/rules.js";
import { runAITurn } from "./core/ai.js";

/* ---------- 地形定数 -------------------------------------------- */
const DEF_BONUS = { P:0, F:1, M:2, H:1, R:0, T:3 };
const FORT_HEAL = 2;

/* ---------- ゲーム状態 ------------------------------------------ */
let CFG, TYPES, units = [];
const HUMAN = 0, AI = 1;
let turn = HUMAN, actionsLeft = 0, gameEnded = false;
const turnsSinceReinforcement = [0, 0];

let sel = null, reach = [], atkIds = [];

/* ---------- DOM -------------------------------------------------- */
const board = document.getElementById("mapArea");
const log   = document.getElementById("log");

/* ---------- 初期化 ---------------------------------------------- */
(async () => {
  ({ cfg: CFG, types: TYPES } = await loadGameData());

  const tileMap = generateMap(CFG.mapWidth, CFG.mapHeight); // ★ ランダム生成

  units = createInitialUnits(CFG, TYPES);
  renderMap(board, CFG.mapWidth, CFG.mapHeight, tileMap);
  drawUnits(board, units, "assets/sprites/");

  startTurn();
})();

/* ---------- 勝敗判定 -------------------------------------------- */
function heroAlive(owner){
  return units.some(u => u.owner === owner && u.def.name === "Hero" && u.hp > 0);
}
function checkEnd(){
  if (!heroAlive(HUMAN)){ end(false); return true; }
  if (!heroAlive(AI   )){ end(true ); return true; }
  return false;
}
function end(win){
  gameEnded = true;
  log.textContent = win ? "🎉 Victory!" : "💀 Game Over…";
  alert(log.textContent);
}

/* ---------- Fort 回復 ------------------------------------------- */
function healOnFort(owner){
  let healed = 0;
  for (const u of units){
    if (u.owner !== owner) continue;
    if (getTileChar(u.x, u.y) === "T" && u.hp < u.def.maxHp){
      u.hp = Math.min(u.def.maxHp, u.hp + FORT_HEAL);
      healed++;
    }
  }
  if (healed){
    drawUnits(board, units, "assets/sprites/");
    log.textContent = `🏰 砦で ${healed} 体が HP +${FORT_HEAL}`;
  }
}

/* ---------- 増援 ------------------------------------------------- */
function spawnReinforcement(owner){
  const y   = (owner === HUMAN) ? CFG.mapHeight - 1 : 0;
  const xs  = [...Array(CFG.mapWidth).keys()].filter(
               x => !units.some(u => u.x === x && u.y === y));
  if (!xs.length) return;
  const x   = xs[Math.random() * xs.length | 0];
  const type= CFG.initial.randomPool[Math.random()*CFG.initial.randomPool.length|0];
  const base= TYPES[type];

  units.push({
    id  : `RF-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
    owner, x, y, moved:false, attacked:false, hp:base.maxHp,
    def : {...base, placeholder: base.placeholder[owner], sprite: base.sprite[owner]}
  });

  drawUnits(board, units, "assets/sprites/");
  log.textContent = `🛡️ 増援：${base.name}(${owner===HUMAN?"青":"赤"}) を配置`;
}
function maybeSpawn(owner){
  turnsSinceReinforcement[owner]++;
  if (turnsSinceReinforcement[owner] % 3 === 0) spawnReinforcement(owner);
}

/* ---------- ターン制御 ------------------------------------------ */
function startTurn(){
  if (gameEnded) return;

  healOnFort(turn);                       // ★ Fort 回復

  actionsLeft = CFG.actionsPerTurn;
  resetTurnFlags(units, turn);
  clearHighlights(board); clearSelection();

  log.textContent = `ログ：プレイヤー${turn+1} のターン（残 ${actionsLeft}）`;

  /* AI 手番 */
  if (turn === AI){
    runAITurn({
      board, units, cfg: CFG,
      draw : () => drawUnits(board, units, "assets/sprites/"),
      rules: { manhattan, canAttack, getTileChar },      // tile 情報を渡す
      log, owner: AI
    }).then(() => {
      if (!checkEnd()){
        maybeSpawn(AI);
        turn = HUMAN;
        startTurn();
      }
    });
  }
}
function consumeAction(){
  actionsLeft--;
  if (actionsLeft <= 0){
    maybeSpawn(turn);
    turn = 1 - turn;
    startTurn();
  }else{
    log.textContent = `ログ：残アクション ${actionsLeft}`;
  }
}
function forcePass(){
  if (turn!==HUMAN || actionsLeft===0 || gameEnded) return;
  actionsLeft = 0;
  consumeAction();
}
document.addEventListener("keydown", e=>{
  if (CFG.passKeys.includes(e.code)){ e.preventDefault(); forcePass(); }
});
log.addEventListener("click", forcePass);

/* ---------- 便利ユーティリティ ------------------------------- */
function clearSelection(){
  sel=null; highlightUnit(null); atkIds=[]; reach=[];
}
function hillBonus(u){
  return (getTileChar(u.x,u.y)==="H" && u.def.maxRange>=2) ? 1 : 0;
}
function markAttackables(src){
  atkIds=[];
  const bonus = hillBonus(src);
  units.forEach(t=>{
    if (t.owner===src.owner) return;
    const d = manhattan(src,t);
    if (d>=src.def.minRange && d<=src.def.maxRange+bonus){
      getCell(board,t.x,t.y).classList.add("highlight-attack");
      atkIds.push(t.id);
    }
  });
}

/* ---------- Human クリック -------------------------------------- */
board.addEventListener("click", e=>{
  if (turn!==HUMAN || gameEnded) return;
  const cell = e.target.closest(".grid-cell"); if(!cell) return;
  const x = +cell.dataset.x, y = +cell.dataset.y;
  const hit = units.find(u=>u.x===x && u.y===y);

  /* 選択解除/切替/ヒーラー回復確認 */
  if (sel){
    const canHeal = sel.def.heal && hit && hit.owner===HUMAN &&
                    hit.hp < hit.def.maxHp && !sel.attacked &&
                    manhattan(sel,hit) <= sel.def.maxRange;
    if (canHeal){
      if (confirm(`${hit.def.name} を ${sel.def.heal} 回復しますか？`)){
        hit.hp = Math.min(hit.def.maxHp, hit.hp + sel.def.heal);
        sel.attacked = true;
        log.textContent = `ログ：${sel.def.name} が ${hit.def.name} を回復`;
        drawUnits(board, units, "assets/sprites/");
        consumeAction(); clearHighlights(board); clearSelection();
      }
      return;
    }
    if (hit && hit.id===sel.id){ clearHighlights(board); clearSelection(); return; }
    if (hit && hit.owner===HUMAN && !(hit.moved && hit.attacked)){
      clearHighlights(board); sel = hit; highlightUnit(cell);
      reach = hit.moved ? [] : highlightMovement(board, x, y, hit.def.move);
      markAttackables(sel); return;
    }
    if (!hit && !reach.some(p=>p.x===x&&p.y===y)){ clearHighlights(board); clearSelection(); return; }
  }

  /* 新規選択 */
  if (!sel){
    if (hit && hit.owner===HUMAN && !(hit.moved && hit.attacked)){
      sel = hit; highlightUnit(cell);
      reach = hit.moved ? [] : highlightMovement(board, x, y, hit.def.move);
      markAttackables(sel);
    }
    return;
  }

  /* 攻撃 */
  if (hit && hit.owner===AI){
    if (sel.attacked){ alert("この駒は既に行動済みです"); return; }
    const dist = manhattan(sel,hit);
    const rng  = sel.def.maxRange + hillBonus(sel);
    if (dist < sel.def.minRange || dist > rng){ alert("射程外です"); return; }

    const defPlus = DEF_BONUS[getTileChar(hit.x,hit.y)] || 0;
    const dmg = Math.max(1, sel.def.atk - defPlus);
    hit.hp -= dmg;
    log.textContent = `ログ：${sel.def.name} が ${hit.def.name} に ${dmg} ダメージ (地形 -${defPlus})`;
    if (hit.hp<=0) units = units.filter(u=>u.id!==hit.id);

    sel.attacked = true;
    drawUnits(board, units, "assets/sprites/");
    if (!checkEnd()) consumeAction();
    clearHighlights(board); clearSelection(); return;
  }

  /* 移動 */
  if (!sel.moved && !hit && reach.some(p=>p.x===x&&p.y===y)){
    sel.x = x; sel.y = y; sel.moved = true;
    drawUnits(board, units, "assets/sprites/");
    consumeAction(); clearHighlights(board); clearSelection();
  }
});
