/* scripts/services/spawn.js
 * --------------------------------------------------------------
 *  createInitialUnits(cfg, types)  →  Unit 配列
 *    - cfg  : game-config.json の内容
 *    - types: units.json の内容
 * -------------------------------------------------------------- */

export function createInitialUnits(cfg, types) {
    const units = [];
    const rand  = arr => arr[Math.random() * arr.length | 0];
  
    const make = (id, type, owner, x, y) => {
      const base = types[type];
      return {
        id, owner, x, y,
        moved: false,
        attacked: false,
        hp: base.maxHp,
        def: {
          ...base,
          placeholder: base.placeholder[owner],
          sprite: base.sprite[owner]
        }
      };
    };
  
    const free = (x, y) => !units.some(u => u.x === x && u.y === y);
  
    cfg.initial.sides.forEach(side => {
      const prefix = side.owner ? "P2" : "P1";
  
      /* --- Hero を配置 ------------------------------------ */
      units.push(
        make(`${prefix}-H`, "Hero", side.owner, side.hero.x, side.hero.y)
      );
  
      /* --- Hero 隣接 4 マスをシャッフルし extra 体置く ------ */
      const adj = [
        { x: side.hero.x - 1, y: side.hero.y },
        { x: side.hero.x + 1, y: side.hero.y },
        { x: side.hero.x,     y: side.hero.y - 1 },
        { x: side.hero.x,     y: side.hero.y + 1 }
      ].filter(
        p =>
          p.x >= 0 &&
          p.x < cfg.mapWidth &&
          p.y >= 0 &&
          p.y < cfg.mapHeight
      );
  
      shuffle(adj).forEach(pos => {
        if (count(side.owner) >= side.extra + 1) return;
        if (!free(pos.x, pos.y)) return;
  
        units.push(
          make(
            genId(prefix, side.owner),
            rand(cfg.initial.randomPool),
            side.owner,
            pos.x,
            pos.y
          )
        );
      });
  
      /* --- 足りなければ盤内ランダムで補充 -------------------- */
      while (count(side.owner) < side.extra + 1) {
        const x = (Math.random() * cfg.mapWidth)  | 0;
        const y = (Math.random() * cfg.mapHeight) | 0;
        if (!free(x, y)) continue;
  
        units.push(
          make(
            genId(prefix, side.owner),
            rand(cfg.initial.randomPool),
            side.owner,
            x,
            y
          )
        );
      }
    });
  
    return units;
  
    /* ---------- 内部ユーティリティ ---------- */
    function count(owner) {
      return units.filter(u => u.owner === owner).length;
    }
    function genId(prefix, owner) {
      return `${prefix}-${count(owner)}`;
    }
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
  }
  