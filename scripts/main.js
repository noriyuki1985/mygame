/* ------------------------------------------------------------
 * scripts/main.js  – 1ターン1行動 & HPバー常時表示 (最終版)
 * ---------------------------------------------------------- */
import {
  renderMap, getCell, highlightMovement,
  clearHighlights, highlightUnit
} from './game/board.js';

/* === 1. 定数 / ユニット定義 === */
const MAP_W=8, MAP_H=8;
const ASSET='assets/sprites/';

const UNIT={
  p1:{name:'Hero',      sprite:'hero_ally.png',  ph:'△', move:2,range:1,atk:5,maxHp:20},
  p2:{name:'EnemyHero', sprite:'hero_enemy.png', ph:'▽', move:2,range:1,atk:5,maxHp:20}
};
let units=[
  {id:'P1',owner:1,x:3,y:7,def:UNIT.p1,hp:20,moved:false},
  {id:'P2',owner:2,x:3,y:0,def:UNIT.p2,hp:20,moved:false}
];

/* === 2. 状態 === */
let turn=1, sel=null, reach=[], atkList=[];

/* === 3. DOM === */
const board=document.getElementById('mapArea');
const log  =document.getElementById('log');

/* === 4. 補助 === */
const uAt=(x,y)=>units.find(u=>u.x===x&&u.y===y)||null;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const enemy=u=>u.owner!==turn;

/* === 5. 描画 === */
function drawUnits(){
  /* 既存アイコン & HPバーを全削除 */
  board.querySelectorAll('.unit-sprite,.hp-wrapper').forEach(e=>e.remove());

  units.forEach(u=>{
    const cell=getCell(board,u.x,u.y);

    /* --- アイコン --- */
    const icon=document.createElement('div');
    icon.className=`unit-sprite owner-${u.owner}`;
    icon.dataset.id=u.id;

    const img=document.createElement('img');
    img.src=ASSET+u.def.sprite; img.alt=u.def.name;
    img.onerror=()=>{img.remove(); icon.textContent=u.def.ph};
    icon.appendChild(img);
    cell.appendChild(icon);

    /* --- HPバー --- */
    const wrap=document.createElement('div');
    wrap.className=`hp-wrapper ${u.owner===1?'hp-bottom':'hp-top'}`;
    const bar=document.createElement('div');
    bar.className='hp-value';
    const r=u.hp/u.def.maxHp;
    bar.style.width=`${r*100}%`;
    if(r<=.25) bar.style.background='#e74c3c';
    else if(r<=.5) bar.style.background='#f39c12';
    wrap.appendChild(bar);
    cell.appendChild(wrap);
  });
}

/* === 6. 攻撃候補ハイライト === */
function hiAtk(selU){
  atkList=[];
  units.forEach(e=>{
    if(enemy(e)&&dist(selU,e)<=selU.def.range){
      const c=getCell(board,e.x,e.y);
      c.classList.add('highlight-attack');
      atkList.push(e.id);
    }
  });
}

/* === 7. 選択解除 === */
function clearSel(){sel=null;highlightUnit(null);atkList=[]}

/* === 8. ターン交替 === */
function endTurn(){
  turn=turn===1?2:1;
  units.forEach(u=>{if(u.owner===turn)u.moved=false});
  clearHighlights(board); clearSel(); reach=[];
  log.textContent=`ログ：プレイヤー${turn} のターン`;
}

/* === 9. 盤面クリック === */
board.addEventListener('click',e=>{
  const cell=e.target.closest('.grid-cell'); if(!cell) return;
  const x=+cell.dataset.x, y=+cell.dataset.y, hit=uAt(x,y);

  /* 1) 選択 */
  if(!sel){
    if(hit&&hit.owner===turn&&!hit.moved){
      sel=hit; highlightUnit(cell);
      reach=highlightMovement(board,x,y,hit.def.move); hiAtk(hit);
    }
    return;
  }

  /* 2) 攻撃 */
  if(hit&&enemy(hit)){
    if(!atkList.includes(hit.id)){alert('射程外');return;}
    hit.hp-=sel.def.atk;
    log.textContent=`ログ：${sel.def.name} が ${hit.def.name} に ${sel.def.atk} ダメージ`;
    if(hit.hp<=0){units=units.filter(u=>u.id!==hit.id);log.textContent+='（撃破！）';}
    drawUnits(); sel.moved=true; endTurn(); return;
  }

  /* 3) 移動 */
  if(!hit&&reach.some(p=>p.x===x&&p.y===y)){
    sel.x=x; sel.y=y; sel.moved=true;
    drawUnits();
    log.textContent=`ログ：${sel.def.name} を (${x},${y}) へ移動`;
    endTurn();
  }
});

/* === 10. 初期化 === */
renderMap(board,MAP_W,MAP_H);
drawUnits();
log.textContent='ログ：ゲーム開始！（プレイヤー1 のターン）';
