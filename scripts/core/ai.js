/**********************************************************************
 *  scripts/core/ai.js  –  Step-3  (Fort / Hill / Forest を考慮)
 *     1) ヒール  2) 攻撃  3) 移動 ← 地形＋戦術スコアで最善 1 マス
 *     ※ Exponentiation (**) の直前に unary minus を置く場合は
 *        必ず括弧で包む必要があるため修正済み。
 *********************************************************************/

export async function runAITurn(ctx) {
    const { board, units, cfg, draw, rules, log, owner } = ctx;
    let actions = cfg.actionsPerTurn;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const ENEMY = 1 - owner;
  
    /* --- 汎用 ---- */
    const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
    const inBrd = (x,y)=>x>=0&&x<cfg.mapWidth&&y>=0&&y<cfg.mapHeight;
    const free  = (x,y)=>!units.some(u=>u.x===x&&u.y===y);
  
    /* 地形評価 */
    const getTile = rules.getTileChar || (()=>"P");
    function terrScore(ch,u){
      switch(ch){
        case "T": return u.def.name==="Hero"? 6:4;
        case "H": return u.def.maxRange>=2?3:1;
        case "F": return (u.def.heal||u.def.maxRange>=2)?2:1;
        case "M": return -1;
        default : return 0;
      }
    }
  
    while(actions>0){
      let acted=false;
  
      /* ---------- ① ヒール -------------------------------- */
      for(const u of units){
        if(u.owner!==owner||u.attacked||!u.def.heal)continue;
        const tgt=units
          .filter(t=>t.owner===owner&&t.hp<t.def.maxHp&&
                 rules.manhattan(u,t)<=u.def.maxRange)
          .sort((a,b)=>a.hp/a.def.maxHp-b.hp/b.def.maxHp)[0];
        if(tgt){
          tgt.hp=Math.min(tgt.def.maxHp,tgt.hp+u.def.heal);
          u.attacked=true; actions--;
          log.textContent=`AI：${u.def.name} が ${tgt.def.name} を回復`;
          draw(); await wait(200); acted=true; break;
        }
      }
      if(acted)continue;
  
      /* ---------- ② 攻撃 --------------------------------- */
      for(const u of units){
        if(u.owner!==owner||u.attacked)continue;
        const tgts=units.filter(t=>rules.canAttack(u,t));
        if(tgts.length){
          const tgt=tgts.sort((a,b)=>rules.manhattan(u,a)-rules.manhattan(u,b))[0];
          tgt.hp-=u.def.atk;
          if(tgt.hp<=0) units.splice(units.indexOf(tgt),1);
          u.attacked=true; actions--;
          log.textContent=`AI：${u.def.name} が ${tgt.def.name} を攻撃`;
          draw(); await wait(200); acted=true; break;
        }
      }
      if(acted)continue;
  
      /* ---------- ③ 移動 --------------------------------- */
      for(const u of units){
        if(u.owner!==owner||u.moved)continue;
  
        let best={score:-Infinity,x:u.x,y:u.y};
        const enemyHero=units.find(t=>t.owner===ENEMY&&t.def.name==="Hero")
                      || units.find(t=>t.owner===ENEMY);
  
        dirs.forEach(d=>{
          const nx=u.x+d.dx, ny=u.y+d.dy;
          if(!inBrd(nx,ny)||!free(nx,ny))return;
  
          /* 距離ベースの戦術スコア */
          let tactical=0;
          if(enemyHero){
            const dist=rules.manhattan({x:nx,y:ny},enemyHero);
            if(u.def.name==="ArmorKnight")       tactical = -dist;
            else if(u.def.maxRange===2)          tactical = -Math.abs(dist-2);
            else if(u.def.heal)                  tactical = -((dist-3)**2);  // ← 括弧追加
            else                                 tactical = -dist;
          }
  
          const terr = terrScore(getTile(nx,ny),u);
          const tot  = tactical + terr;
          if(tot>best.score) best={score:tot,x:nx,y:ny};
        });
  
        if(best.x!==u.x||best.y!==u.y){
          u.x=best.x; u.y=best.y; u.moved=true; actions--;
          log.textContent=`AI：${u.def.name} が (${u.x},${u.y}) へ移動`;
          draw(); await wait(150); acted=true; break;
        }
      }
  
      if(!acted) break;   // もう行動できない
    }
  }
  