// scripts/data/unitLoader.js

/**
 * @typedef {Object} UnitDef
 * @property {string} id           - ユニット種別の一意識別子
 * @property {string} name         - ユニット表示名
 * @property {number} maxHp        - 最大HP
 * @property {number} attack       - 攻撃力
 * @property {number} move         - 移動力（マス数）
 * @property {number[]} range      - 攻撃可能距離 [最小距離, 最大距離]
 * @property {string} sprite       - スプライト画像のパス
 * @property {string} type         - 種別（近接、遠距離、ヒーローなど）
 * @property {string} description  - ユニット説明文
 */

/**
 * units.json を取得し、ユニット定義オブジェクトを返す
 * ネットワークエラーやパースエラーは例外をスロー
 * @returns {Promise<Record<string, UnitDef>>}
 */
export async function loadUnitDefs() {
    const URL = 'data/units.json';
    let response;
  
    // ネットワーク読み込み
    try {
      response = await fetch(URL, { cache: 'no-store' });
    } catch (networkError) {
      throw new Error(`ネットワークエラー: ${networkError.message}`);
    }
  
    // HTTPステータスチェック
    if (!response.ok) {
      throw new Error(`units.json 読み込み失敗 (HTTP ${response.status} ${response.statusText})`);
    }
  
    // JSONパース
    let unitDefs;
    try {
      unitDefs = await response.json();
    } catch (parseError) {
      throw new Error(`units.json パースエラー: ${parseError.message}`);
    }
  
    // フォーマット検証
    if (typeof unitDefs !== 'object' || unitDefs === null || Array.isArray(unitDefs)) {
      throw new Error('units.json の形式が不正です (オブジェクトを期待)');
    }
    for (const [key, def] of Object.entries(unitDefs)) {
      if (typeof def.id !== 'string' || typeof def.name !== 'string') {
        throw new Error(`units.json の定義 '${key}' が不正です (id/name を確認してください)`);
      }
      if (typeof def.maxHp !== 'number' || typeof def.attack !== 'number' || typeof def.move !== 'number') {
        throw new Error(`units.json の定義 '${key}' に数値パラメータの不正があります`);
      }
      if (!Array.isArray(def.range) || def.range.length !== 2) {
        throw new Error(`units.json の定義 '${key}' の range が不正です ([min, max] を指定)`);
      }
      if (typeof def.sprite !== 'string') {
        throw new Error(`units.json の定義 '${key}' に sprite パスがありません`);
      }
    }
  
    return unitDefs;
  }
  