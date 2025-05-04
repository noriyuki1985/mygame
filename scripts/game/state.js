// scripts/game/state.js

/**
 * ゲーム全体の状態を保持するシングルトン。
 * - currentPlayer : 現在のプレイヤー番号 (1 | 2)
 * - units         : ユニットインスタンス配列
 * - selectedUnit  : 現在選択されているユニット (null なら未選択)
 * - mode          : 'move' | 'attack'
 */
export const state = {
    currentPlayer: 1,
    units:        /** @type {Array} */ ([]),
    selectedUnit: null,
    mode:         'move'
  };
  
  /**
   * ユニット配列を初期化／更新する
   * @param {Array} newUnits
   */
  export function setUnits(newUnits) {
    state.units = newUnits;
  }
  
  /**
   * アクティブプレイヤーを切り替え、選択情報・モードを初期化する
   */
  export function nextTurn() {
    state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
    state.selectedUnit  = null;
    state.mode          = 'move';
  }
  
  /**
   * 選択を解除する
   */
  export function clearSelection() {
    state.selectedUnit = null;
  }
  