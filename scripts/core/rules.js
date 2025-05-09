/* scripts/core/rules.js
 * ----------------------------------------------------------------
 *  汎用ユーティリティ
 *    • manhattan(a,b)           : マンハッタン距離
 *    • isEnemy(unit, turnOwner) : 敵判定
 *    • canAttack(attacker, target)
 *    • resetTurnFlags(units, turnOwner)
 * ----------------------------------------------------------------*/

/* --- 距離 ------------------------------------------------------ */
export function manhattan(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
  
  /* --- 敵味方判定 ------------------------------------------------ */
  export function isEnemy(unit, turnOwner) {
    return unit.owner !== turnOwner;
  }
  
  /* --- 射程内か？  ------------------------------------------------ */
  export function canAttack(attacker, target) {
    const d = manhattan(attacker, target);
    return (
      d >= attacker.def.minRange &&
      d <= attacker.def.maxRange &&
      attacker.owner !== target.owner
    );
  }
  
  /* --- ターン開始時にフラグをリセット --------------------------- */
  export function resetTurnFlags(units, turnOwner) {
    units.forEach(u => {
      if (u.owner === turnOwner) {
        u.moved    = false;
        u.attacked = false;
      }
    });
  }
  