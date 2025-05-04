// scripts/game/unitRenderer.js

/**
 * ユニットを描画する
 * @param {HTMLElement} container - #map-area 要素
 * @param {Array} instances       - map.json からのユニット配置情報
 * @param {Object} defs           - units.json からのユニット定義オブジェクト
 */
export function renderUnits(container, instances, defs) {
  if (!(container instanceof HTMLElement)) {
    throw new Error('renderUnits: container が HTMLElement ではありません');
  }
  if (!Array.isArray(instances)) {
    throw new Error('renderUnits: instances は配列である必要があります');
  }
  
  instances.forEach(inst => {
    const def = defs[inst.type];
    if (!def) {
      console.warn(`renderUnits: 定義が見つかりません type=${inst.type}`);
      return;
    }
    
    // プレースホルダー要素作成（画像またはテキスト）
    const el = document.createElement('div');
    
    if (def.sprite && def.sprite.trim() !== '') {
      // スプライト画像がある場合は画像を使用
      const img = document.createElement('img');
      img.src = def.sprite;
      img.alt = def.name;
      el.appendChild(img);
    } else {
      // スプライト画像がない場合は記号を使用
      const char = inst.owner === 1 ? '△' : '▽';
      el.textContent = char;
    }
    
    // 共通クラスとスタイル
    el.classList.add('unit-sprite');
    el.classList.add(inst.owner === 1 ? 'unit-ally' : 'unit-enemy');
    
    // Grid の行列指定（1始まり）
    el.style.gridColumnStart = (inst.x + 1).toString();
    el.style.gridRowStart = (inst.y + 1).toString();
    
    // データ属性
    el.dataset.instanceId = inst.instanceId;
    el.dataset.owner = inst.owner.toString();
    el.dataset.hp = inst.hp ? inst.hp.toString() : def.maxHp.toString();
    el.dataset.maxHp = def.maxHp.toString();
    el.dataset.type = inst.type;
    
    container.appendChild(el);
  });
}
