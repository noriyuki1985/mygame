// scripts/data/mapLoader.js

/**
 * @typedef {Object} UnitInstance
 * @property {string} instanceId  - ユニットの一意識別子
 * @property {string} type        - units.json のキーに対応するユニット種別
 * @property {number} owner       - 所有プレイヤー番号
 * @property {number} x           - 初期 X 座標（0 から始まる）
 * @property {number} y           - 初期 Y 座標（0 から始まる）
 */

/**
 * @typedef {Object} MapData
 * @property {number} width        - マップ横幅（タイル数）
 * @property {number} height       - マップ縦幅（タイル数）
 * @property {string[][]} tiles     - 地形タイルの2D配列
 * @property {UnitInstance[]} units - ユニット配置情報の配列
 */

/**
 * map.json を取得し、MapData オブジェクトを返す
 * ネットワークエラーやパースエラーは例外をスロー
 * @returns {Promise<MapData>}
 */
export async function loadMap() {
    const URL = 'data/map.json';
    let response;
    try {
      response = await fetch(URL, { cache: 'no-store' });
    } catch (networkError) {
      throw new Error(`ネットワークエラー: ${networkError.message}`);
    }
  
    if (!response.ok) {
      throw new Error(`map.json 読み込み失敗 (HTTP ${response.status} ${response.statusText})`);
    }
  
    let mapData;
    try {
      mapData = await response.json();
    } catch (parseError) {
      throw new Error(`map.json パースエラー: ${parseError.message}`);
    }
  
    // 基本的な構造チェック
    if (typeof mapData.width !== 'number' || typeof mapData.height !== 'number') {
      throw new Error('map.json に width または height が未定義または型不正です');
    }
    if (!Array.isArray(mapData.tiles) || mapData.tiles.length !== mapData.height) {
      throw new Error('map.json の tiles 配列が不正です');
    }
    if (!Array.isArray(mapData.units)) {
      throw new Error('map.json の units プロパティが配列ではありません');
    }
  
    return mapData;
  }
  