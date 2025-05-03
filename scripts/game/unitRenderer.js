// scripts/game/unitRenderer.js

/**
 * ユニットを描画する
 * @param {HTMLElement} container - #map-area 要素
 * @param {Array} instances       - map.json からのユニット配置情報
 * @param {Object} defs           - units.json からのユニット定義オブジェクト
 */
export function renderUnits(container, instances, defs) {
  instances.forEach(inst => {
    const def = defs[inst.type];
    const img = document.createElement('img');
    img.src = def.sprite;
    img.alt = def.name;
    img.classList.add('unit-sprite');
    // Grid の行列指定（1始まり）
    img.style.gridColumnStart = (inst.x + 1).toString();
    img.style.gridRowStart    = (inst.y + 1).toString();
    // データ属性
    img.dataset.instanceId = inst.instanceId;
    img.dataset.owner      = inst.owner.toString();
    img.dataset.hp         = def.maxHp.toString();
    img.dataset.maxHp      = def.maxHp.toString();
    container.appendChild(img);
  });
}
