/* scripts/services/config.js
 * --------------------------------------------------------------
 *  loadGameData()  →  Promise<{ cfg, types }>
 * -------------------------------------------------------------- */

export async function loadGameData() {
    const [cfgRes, typesRes] = await Promise.all([
      fetch("data/game-config.json"),
      fetch("data/units.json")
    ]);
  
    if (!cfgRes.ok || !typesRes.ok) {
      throw new Error("JSON ファイルの読み込みに失敗しました");
    }
  
    return {
      cfg:   await cfgRes.json(),
      types: await typesRes.json()
    };
  }
  