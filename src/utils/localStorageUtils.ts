const STORAGE_KEY = 'customPerlerPaletteSelections';

export interface PaletteSelections {
  [key: string]: boolean;
}

/**
 * 保存自定义色板选择状态到localStorage
 */
export function savePaletteSelections(selections: PaletteSelections): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  } catch (error) {
    console.error("无法保存色板选择到本地存储:", error);
  }
}

/**
 * 从localStorage加载自定义色板选择状态
 */
export function loadPaletteSelections(): PaletteSelections | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("无法从本地存储加载色板选择:", error);
    localStorage.removeItem(STORAGE_KEY); // 清除无效数据
  }
  return null;
}

/**
 * 将预设色板转换为选择状态对象
 */
export function presetToSelections(allKeys: string[], presetKeys: string[]): PaletteSelections {
  const presetSet = new Set(presetKeys);
  const selections: PaletteSelections = {};
  
  allKeys.forEach(key => {
    selections[key] = presetSet.has(key);
  });
  
  return selections;
} 