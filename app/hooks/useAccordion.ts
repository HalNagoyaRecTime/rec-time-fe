// === アコーディオン展開状態管理 Hook ===

import { useState, useCallback } from "react";

/**
 * アコーディオンの展開/縮小状態を管理する hook
 * @param initialState - 初期状態（デフォルト: false）
 * @returns 展開状態とトグル関数
 */
export function useAccordion(initialState: boolean = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return {
    isExpanded,
    setIsExpanded,
    toggle,
  };
}
