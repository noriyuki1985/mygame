/* scripts/core/render.js
 * --------------------------------------------------------------
 *   drawUnits(board, units, spritePath)
 *     board       : <div id="mapArea"> 要素
 *     units       : ユニット配列 [{ x,y, owner, hp, def:{…} }, …]
 *     spritePath  : 画像フォルダ (末尾 '/')
 * -------------------------------------------------------------- */

export function drawUnits(board, units, spritePath) {
    /* 旧スプライトを一掃 */
    board.querySelectorAll(".unit-sprite,.hp-wrapper").forEach(n => n.remove());
  
    units.forEach(u => {
      /* マップ外ガード（座標が壊れても落ちない） */
      const cell = board.querySelector(`.grid-cell[data-x="${u.x}"][data-y="${u.y}"]`);
      if (!cell) return;
  
      /* ---------- アイコン ---------- */
      const icon = document.createElement("div");
      icon.className = `unit-sprite owner-${u.owner}`;
  
      const img = document.createElement("img");
      img.src = spritePath + u.def.sprite;
      img.alt = u.def.name;
      img.onerror = () => {
        img.remove();
        icon.textContent = u.def.placeholder;
      };
      icon.appendChild(img);
      cell.appendChild(icon);
  
      /* ---------- HPバー ---------- */
      const barWrap = document.createElement("div");
      barWrap.className = "hp-wrapper " + (u.owner ? "hp-top" : "hp-bottom");
  
      const bar = document.createElement("div");
      bar.className = "hp-value";
  
      const ratio = u.hp / u.def.maxHp;
      bar.style.width = `${ratio * 100}%`;
      bar.style.background =
        ratio <= 0.25 ? "#e74c3c" : ratio <= 0.5 ? "#f39c12" : "#2ecc71";
  
      barWrap.appendChild(bar);
      cell.appendChild(barWrap);
    });
  }
  