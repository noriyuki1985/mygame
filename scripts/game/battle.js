// scripts/game/battle.js

/**
 * @typedef {Object} UnitInstance
 * @property {string} instanceId  - ユニットの一意識別子
 * @property {Object} def         - units.json からロードされるユニット定義
 * @property {number} hp          - 現在のHP
 * @property {string} type        - ユニット種別
 * @property {number} owner       - 所有プレイヤー番号
 * @property {number} x           - X座標
 * @property {number} y           - Y座標
 */

/**
 * 攻撃ユニットが防御ユニットにダメージを与える
 * @param {UnitInstance} attacker - 攻撃を行うユニット
 * @param {UnitInstance} defender - ダメージを受けるユニット
 * @param {HTMLElement} mapArea   - マップ描画エリア要素（画像除去用）
 * @returns {{damage: number, killed: boolean}} 実際に与えたダメージとユニットが倒れたか
 */
export function attackUnit(attacker, defender, mapArea) {
    // 引数チェック
    if (!attacker || typeof attacker.def !== 'object') {
      throw new Error('attackUnit: attacker の定義が不正です');
    }
    if (!defender || typeof defender.def !== 'object') {
      throw new Error('attackUnit: defender の定義が不正です');
    }
    if (!(mapArea instanceof HTMLElement)) {
      throw new Error('attackUnit: mapArea が HTMLElement ではありません');
    }
  
    // ステータス取得
    const attackPower = Number(attacker.def.attack) || 0;
    const defense     = Number(defender.def.defense) || 0;
  
    // ダメージ計算
    const damage = Math.max(attackPower - defense, 0);
  
    // HP更新
    defender.hp -= damage;
  
    // スプライト操作
    const selector = `.unit-sprite[data-instance-id="${defender.instanceId}"]`;
    const sprite = mapArea.querySelector(selector);
    if (defender.hp <= 0) {
      // 死亡時：画面上のスプライトを削除
      if (sprite) {
        sprite.remove();
      }
    } else {
      // 生存時：HP属性を更新
      if (sprite) {
        sprite.dataset.hp = defender.hp.toString();
      }
    }
  
    return { damage, killed: defender.hp <= 0 };
  }
