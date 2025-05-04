// scripts/data/mapLoader.js

/**
 * map.json を取得し、MapData を返す
 * @returns {Promise<MapData>}
 */
export async function loadMap() {
  const url = new URL('../../data/map.json', import.meta.url).href;
  console.debug('loadMap: fetching', url);

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`map.json 読み込み失敗 (HTTP ${res.status})`);

  const data = await res.json();

  // 簡易バリデーション
  if (typeof data.width !== 'number' || typeof data.height !== 'number') {
    throw new Error('map.json validation error: width/height is not number');
  }
  if (!Array.isArray(data.tiles) || data.tiles.length !== data.height) {
    throw new Error('map.json validation error: tiles mismatch height');
  }
  if (!data.tiles.every(row => Array.isArray(row) && row.length === data.width)) {
    throw new Error('map.json validation error: each tiles row mismatch width');
  }
  if (!Array.isArray(data.units)) {
    throw new Error('map.json validation error: units is not array');
  }

  return data;
}
