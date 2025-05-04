/* scripts/core/ai.js  –  Red 側の簡易 AI + 回復優先版 */

export async function runAITurn(ctx) {
    const { board, units, cfg, draw, rules, log, owner } = ctx;
    let actions = cfg.actionsPerTurn;
    const wait = ms => new Promise(r => setTimeout(r, ms));
  
    while (actions > 0) {
      let acted = false;
  
      /* ① 回復優先（heal プロパティを持つユニット） */
      for (const u of units) {
        if (u.owner !== owner || u.attacked || !u.def.heal) continue;
        const targets = units.filter(
          f =>
            f.owner === owner &&
            f.hp < f.def.maxHp &&
            rules.manhattan(u, f) <= u.def.maxRange
        );
        if (targets.length) {
          const tgt = targets.sort(
            (a, b) => a.hp / a.def.maxHp - b.hp / b.def.maxHp
          )[0];                               // 最も削られている味方
          tgt.hp = Math.min(tgt.def.maxHp, tgt.hp + u.def.heal);
          u.attacked = true;
          actions--;
          log.textContent = `AI：${u.def.name} が ${tgt.def.name} を ${u.def.heal} 回復`;
          draw();
          await wait(300);
          acted = true;
          break;
        }
      }
      if (acted) continue;
  
      /* ② 攻撃（敵が射程内） */
      for (const u of units) {
        if (u.owner !== owner || u.attacked) continue;
        const targets = units.filter(t => rules.canAttack(u, t));
        if (targets.length) {
          const tgt = targets.sort(
            (a, b) => rules.manhattan(u, a) - rules.manhattan(u, b)
          )[0];
          tgt.hp -= u.def.atk;
          u.attacked = true; actions--;
          log.textContent = `AI：${u.def.name} が ${tgt.def.name} を攻撃`;
          if (tgt.hp <= 0) units.splice(units.indexOf(tgt), 1);
          draw(); await wait(300); acted = true; break;
        }
      }
      if (acted) continue;
  
      /* ③ 移動（敵へ近付く） */
      for (const u of units) {
        if (u.owner !== owner || u.moved) continue;
        const dirs=[{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
        const enemyList=units.filter(t=>t.owner!==owner);
        if(!enemyList.length) return;
        const nearest=enemyList.sort(
          (a,b)=>rules.manhattan(u,a)-rules.manhattan(u,b))[0];
        const steps=dirs.map(d=>({x:u.x+d.dx,y:u.y+d.dy})).filter(p=>
          p.x>=0&&p.x<cfg.mapWidth&&p.y>=0&&p.y<cfg.mapHeight&&
          !units.some(o=>o.x===p.x&&o.y===p.y)&&
          rules.manhattan(p,nearest)<rules.manhattan(u,nearest));
        if(steps.length){
          const step=steps[Math.random()*steps.length|0];
          u.x=step.x;u.y=step.y;u.moved=true;actions--;
          log.textContent=`AI：${u.def.name} が (${step.x},${step.y}) へ移動`;
          draw();await wait(300);acted=true;break;
        }
      }
  
      if(!acted) break;
    }
  }
  