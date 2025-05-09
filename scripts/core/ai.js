/**********************************************************************
 * scripts/core/ai.js  –  Hero セーフティ重視版
 *
 * 1) ヒール       : HP% が低い味方を回復（Hero を最優先）
 * 2) 攻撃         : 射程内の敵を攻撃（Hero は無闇に前進しない）
 * 3) 移動         :
 *      • Hero        :   ─ 敵が 3 マス以内 ⇒ 距離を離す
 *                       ─ そうでなければ Fort・Forest に待機
 *      • ArmorKnight :   ─ Hero に隣接 or Hero と敵の間に割り込む
 *                       ─ 近づけない時は敵 Hero へ前進
 *      • Archer/Mage :   ─ Hill > Forest > Plain の優先度で
 *                         射程 2 を維持
 *      • Healer      :   ─ Hero を射程 1 に捉えつつ森に隠れる
 *      • Others      :   ─ 最近接敵／敵 Hero に前進
 *
 * 4) 評価関数      : tileScore + tacticalScore を 4 方向で比較
 * 5) 1 アクション実行ごとにアニメ待機 (150–200ms)
 *********************************************************************/

export async function runAITurn(ctx) {
    const { board, units, cfg, draw, rules, log, owner } = ctx;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let actions = cfg.actionsPerTurn;
  
    const OPP = 1 - owner;
    const dirs = [
      {dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}
    ];
    const inB = (x,y)=>x>=0&&x<cfg.mapWidth&&y>=0&&y<cfg.mapHeight;
    const free= (x,y)=>!units.some(u=>u.x===x&&u.y===y);
  
    /* --- tile helpers ------------------------------------ */
    const getTile = rules.getTileChar || (()=>"P");
    const tileScore = (ch,u)=>{
      switch(ch){
        case "T": return u.def.name==="Hero"? 10:4;
        case "H": return u.def.maxRange>=2?3:1;
        case "F": return (u.def.heal||u.def.maxRange>=2)?2:1;
        case "M": return -2;
        default : return 0;
      }
    };
  
    /* === メインループ (残りアクションが尽きるまで) ============ */
    while(actions>0){
      let acted=false;
  
      /* ---------- ① ヒール (Hero 優先) -------------------- */
      for(const u of units){
        if(u.owner!==owner||u.attacked||!u.def.heal) continue;
        const targets=units.filter(t=>t.owner===owner&&t.hp<t.def.maxHp&&rules.manhattan(u,t)<=u.def.maxRange)
                           .sort((a,b)=>{
                             if(a.def.name==="Hero") return -1;
                             if(b.def.name==="Hero") return +1;
                             return a.hp/a.def.maxHp-b.hp/b.def.maxHp;
                           });
        if(targets.length){
          const tgt=targets[0];
          tgt.hp=Math.min(tgt.def.maxHp,tgt.hp+u.def.heal);
          u.attacked=true; actions--;
          log.textContent=`AI：${u.def.name} が ${tgt.def.name} を回復`;
          draw(); await wait(200); acted=true; break;
        }
      }
      if(acted) continue;
  
      /* ---------- ② 攻撃 --------------------------------- */
      for(const u of units){
        if(u.owner!==owner||u.attacked) continue;
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
      if(acted) continue;
  
      /* ---------- ③ 移動 --------------------------------- */
      for(const u of units){
        if(u.owner!==owner||u.moved) continue;
  
        const best = {score:-Infinity,x:u.x,y:u.y};
        const enemyHero=units.find(t=>t.owner===OPP&&t.def.name==="Hero")
                         || units.find(t=>t.owner===OPP);
        const ownHero = units.find(t=>t.owner===owner&&t.def.name==="Hero");
  
        dirs.forEach(d=>{
          const nx=u.x+d.dx, ny=u.y+d.dy;
          if(!inB(nx,ny)||!free(nx,ny)) return;
  
          /* --- tactical score by role --- */
          let tact = 0;
  
          if(u.def.name==="Hero"){
            /* 距離を離す (敵が3以内なら +dist) */
            const nearestE = nearestEnemy(u);
            const dist = nearestE? rules.manhattan({x:nx,y:ny},nearestE):9;
            tact = dist;
            if(getTile(nx,ny)==="T") tact += 5;           // Fort 優先
          }
          else if(u.def.name==="ArmorKnight"){
            if(ownHero){
              const distNow=rules.manhattan(u,ownHero);
              const distNext=rules.manhattan({x:nx,y:ny},ownHero);
              tact += (distNow>1 && distNext<distNow)? 4:0; // Heroに寄る
            }
            if(enemyHero){
              const dCur=rules.manhattan(u,enemyHero);
              const dN = rules.manhattan({x:nx,y:ny},enemyHero);
              tact += (dN<dCur)? 2:0;
            }
          }
          else if(u.def.maxRange===2){
            if(enemyHero){
              const dN = rules.manhattan({x:nx,y:ny},enemyHero);
              tact -= Math.abs(dN-2);   // 射程2を維持
            }
            if(getTile(nx,ny)==="H") tact += 3;
          }
          else if(u.def.heal){
            if(ownHero){
              const dN=rules.manhattan({x:nx,y:ny},ownHero);
              tact -= Math.abs(dN-2);  // 射程1で回復しやすい距離2
            }
            if(getTile(nx,ny)==="F") tact += 2;
          }
          else{
            if(enemyHero){
              const dCur=rules.manhattan(u,enemyHero);
              const dN = rules.manhattan({x:nx,y:ny},enemyHero);
              tact += (dN<dCur)? 1:0;
            }
          }
  
          const terr = tileScore(getTile(nx,ny),u);
          const total = terr + tact;
  
          if(total>best.score) Object.assign(best,{score:total,x:nx,y:ny});
        });
  
        if(best.x!==u.x||best.y!==u.y){
          u.x=best.x; u.y=best.y; u.moved=true; actions--;
          log.textContent=`AI：${u.def.name} が (${u.x},${u.y}) へ移動`;
          draw(); await wait(150); acted=true; break;
        }
      }
  
      if(!acted) break;
    }
  
    /* --- helper --------------------------------------------------- */
    function nearestEnemy(unit){
      return units.filter(o=>o.owner===OPP)
                  .sort((a,b)=>rules.manhattan(unit,a)-rules.manhattan(unit,b))[0];
    }
  }
  