/* scripts/services/mapLoader.js */
export async function loadMap(path = "data/map-default.json") {
    const res = await fetch(path);
    if (!res.ok) throw new Error("map JSON 読み込み失敗");
    return await res.json();             // ["PPPP...", ...]
  }
  