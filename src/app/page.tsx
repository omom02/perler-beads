'use client';

import React, { useState, useRef, ChangeEvent, DragEvent, useEffect, useMemo } from 'react';
import Script from 'next/script';
import Image from 'next/image'; // 添加导入Image组件
import ColorPalette from '../components/ColorPalette';
// 导入像素化工具和类型
import {
  PixelationMode,
  calculatePixelGrid,
  RgbColor,
  PaletteColor,
  MappedPixel,
  hexToRgb,
  colorDistance,
  findClosestPaletteColor
} from '../utils/pixelation';

import beadPaletteData from './beadPaletteData.json';

// 添加自定义动画样式
const floatAnimation = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
    100% { transform: translateY(0px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;

// Helper function to get contrasting text color (simple version) - 保留原有实现，因为未在utils中导出
function getContrastColor(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#000000'; // Default to black
    // Simple brightness check (Luma formula Y = 0.2126 R + 0.7152 G + 0.0722 B)
    const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    return luma > 0.5 ? '#000000' : '#FFFFFF'; // Dark background -> white text, Light background -> black text
}

// Helper function for sorting color keys - 保留原有实现，因为未在utils中导出
function sortColorKeys(a: string, b: string): number {
  const regex = /^([A-Z]+)(\d+)$/;
  const matchA = a.match(regex);
  const matchB = b.match(regex);

  if (matchA && matchB) {
    const prefixA = matchA[1];
    const numA = parseInt(matchA[2], 10);
    const prefixB = matchB[1];
    const numB = parseInt(matchB[2], 10);

    if (prefixA !== prefixB) {
      return prefixA.localeCompare(prefixB); // Sort by prefix first (A, B, C...)
    }
    return numA - numB; // Then sort by number (1, 2, 10...)
  }
  // Fallback for keys that don't match the standard pattern (e.g., T1, ZG1)
  return a.localeCompare(b);
}

// --- Define available palette key sets ---
const allPaletteKeys = Object.keys(beadPaletteData);

// 144 Color Palette Keys
const palette144Keys = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1", "M1", "A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2", "M2", "A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "M3", "A4", "B4", "C4", "D5", "E4", "F4", "G4", "H4", "M4", "A5", "B5", "C5", "D6", "E5", "F5", "G5", "H5", "M5", "A6", "B6", "C6", "D7", "E6", "F6", "G6", "H6", "M6", "A7", "B7", "C7", "D8", "E7", "F7", "G7", "H7", "M7", "A8", "B8", "C8", "D9", "E8", "F8", "G8", "H8", "M8", "A9", "B10", "C9", "D11", "E9", "F9", "G9", "H9", "M9", "A10", "B11", "C10", "D12", "E10", "F10", "G10", "H10", "M10", "A11", "B12", "C11", "D13", "E11", "F11", "G11", "H11", "M11", "A12", "B13", "C13", "D14", "E12", "F12", "G12", "H12", "M12", "A13", "B14", "C14", "D15", "E13", "F13", "G13", "H13", "M13", "A14", "B15", "C15", "D16", "E14", "F14", "G14", "H14", "M14", "A15", "B16", "C16", "D17", "E15", "G15", "M15", "B17", "C17", "D18", "G16", "B18", "D19", "G17", "B19", "D20", "B20", "D21", "T1"]; // Ensure T1 is present

// 168 Color Palette Keys (from user table)
const palette168Keys = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "M1", "A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2", "M2", "A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "M3", "A4", "B4", "C4", "D5", "E4", "F4", "G4", "H4", "M4", "A5", "B5", "C5", "D6", "E5", "F5", "G5", "H5", "M5", "A6", "B6", "C6", "D7", "E6", "F6", "G6", "H6", "M6", "A7", "B7", "C7", "D8", "E7", "F7", "G7", "H7", "M7", "A8", "B8", "C8", "D9", "E8", "F8", "G8", "H8", "M8", "A9", "B10", "C9", "D11", "E9", "F9", "G9", "H9", "M9", "A10", "B11", "C10", "D12", "E10", "F10", "G10", "H10", "M10", "A11", "B12", "C11", "D13", "E11", "F11", "G11", "H11", "M11", "A12", "B13", "C13", "D14", "E12", "F12", "G12", "H12", "M12", "A13", "B14", "C14", "D15", "E13", "F13", "G13", "H13", "M13", "A14", "B15", "C15", "D16", "E14", "F14", "G14", "H14", "M14", "A15", "B16", "C16", "D17", "E15", "G15", "M15", "B17", "C17", "D18", "G16", "B18", "D19", "G17", "B19", "D20", "B20", "D21", "T1"]; // Ensure T1 is present

// 96 Color Palette Keys (from user table)
const palette96Keys = ["A3", "A4", "A6", "A7", "A10", "A11", "A13", "A14", "B3", "B5", "B7", "B8", "B10", "B12", "B14", "B17", "B18", "B19", "B20", "C2", "C3", "C5", "C6", "C7", "C8", "C10", "C11", "C13", "C16", "D2", "D3", "D5", "D6", "D7", "D8", "D9", "D11", "D12", "D13", "D14", "D15", "D16", "D18", "D19", "D20", "D21", "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12", "E13", "E14", "E15", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "G1", "G2", "G3", "G5", "G7", "G8", "G9", "G13", "G14", "G17", "H1", "H2", "H3", "H4", "H5", "H6", "H7", "M5", "M6", "M9", "M12", "T1"]; // Added T1

// 120 Color Palette Keys (from user table)
const palette120Keys = ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12", "A13", "A14", "A15", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8", "B10", "B11", "B12", "B13", "B14", "B15", "B16", "B17", "B18", "B19", "B20", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C13", "C14", "C15", "C16", "C17", "D1", "D2", "D3", "D5", "D6", "D7", "D8", "D9", "D11", "D12", "D13", "D14", "D15", "D16", "D17", "D18", "D19", "D20", "D21", "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9", "E10", "E11", "E12", "E13", "E14", "E15", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "F13", "F14", "G1", "G2", "G3", "G5", "G6", "G7", "G8", "G9", "G13", "G14", "G17", "H1", "H2", "H3", "H4", "H5", "H6", "H7", "H12", "M5", "M6", "M9", "M12", "T1"]; // Added T1

// 72 Color Palette Keys (from user table)
const palette72Keys = ["A3", "A4", "A6", "A7", "A10", "A11", "A13", "B3", "B5", "B7", "B8", "B10", "B12", "B14", "B17", "B18", "B19", "B20", "C2", "C3", "C5", "C6", "C7", "C8", "C10", "C11", "C13", "C16", "D2", "D3", "D6", "D7", "D8", "D9", "D11", "D12", "D13", "D14", "D15", "D16", "D18", "D19", "D20", "D21", "E1", "E2", "E3", "E4", "E5", "E8", "E12", "E13", "F5", "F7", "F8", "F10", "F13", "G1", "G2", "G3", "G5", "G7", "G8", "G9", "G13", "H1", "H2", "H3", "H4", "H5", "H7", "T1"]; // Added T1

// Placeholder for other palettes
// const palette48Keys = [...];
// const palette24Keys = [...];

const paletteOptions = {
  'all': { name: `全色系291色`, keys: allPaletteKeys },
  '168': { name: '168色', keys: palette168Keys },
  '144': { name: '144色', keys: palette144Keys },
  '120': { name: '120色', keys: palette120Keys },
  '96': { name: '96色', keys: palette96Keys },
  '72': { name: '72色', keys: palette72Keys }, // Added 72
  // Add other palettes here
};

type PaletteOptionKey = keyof typeof paletteOptions;

// Pre-process the FULL palette data once
const fullBeadPalette: PaletteColor[] = Object.entries(beadPaletteData)
  .map(([key, hex]) => {
    const rgb = hexToRgb(hex);
    if (!rgb) {
      console.warn(`Invalid hex code "${hex}" for key "${key}". Skipping.`);
      return null;
    }
    return { key, hex, rgb };
  })
  .filter((color): color is PaletteColor => color !== null);

// ++ 添加透明键定义 ++
const TRANSPARENT_KEY = 'ERASE';

// ++ 添加透明色数据 ++
const transparentColorData: MappedPixel = { key: TRANSPARENT_KEY, color: '#FFFFFF', isExternal: true };

// ++ Add definition for background color keys ++
const BACKGROUND_COLOR_KEYS = ['T1', 'H1', 'H2']; // 可以根据需要调整

// 1. 导入新组件
import PixelatedPreviewCanvas from '../components/PixelatedPreviewCanvas';
import GridTooltip from '../components/GridTooltip';

export default function Home() {
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<number>(50);
  const [granularityInput, setGranularityInput] = useState<string>("50");
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(30);
  // 添加像素化模式状态
  const [pixelationMode, setPixelationMode] = useState<PixelationMode>(PixelationMode.Dominant); // 默认为卡通模式
  const [selectedPaletteKeySet, setSelectedPaletteKeySet] = useState<PaletteOptionKey>('all');
  const [activeBeadPalette, setActiveBeadPalette] = useState<PaletteColor[]>(() => {
      const initialKey = 'all'; // Match the key used above
      const options = paletteOptions[initialKey];
      if (!options) return fullBeadPalette; // Fallback
      const keySet = new Set(options.keys);
      return fullBeadPalette.filter(color => keySet.has(color.key));
  });
  const [excludedColorKeys, setExcludedColorKeys] = useState<Set<string>>(new Set());
  const [initialGridColorKeys, setInitialGridColorKeys] = useState<Set<string> | null>(null);
  const [mappedPixelData, setMappedPixelData] = useState<MappedPixel[][] | null>(null);
  const [gridDimensions, setGridDimensions] = useState<{ N: number; M: number } | null>(null);
  const [colorCounts, setColorCounts] = useState<{ [key: string]: { count: number; color: string } } | null>(null);
  const [totalBeadCount, setTotalBeadCount] = useState<number>(0);
  const [tooltipData, setTooltipData] = useState<{ x: number, y: number, key: string, color: string } | null>(null);
  const [remapTrigger, setRemapTrigger] = useState<number>(0);
  const [isManualColoringMode, setIsManualColoringMode] = useState<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<MappedPixel | null>(null);
  // 新增状态变量：控制打赏弹窗
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const pixelatedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  // ++ Re-add touch refs needed for tooltip logic ++
  //const touchStartPosRef = useRef<{ x: number; y: number; pageX: number; pageY: number } | null>(null);
  //const touchMovedRef = useRef<boolean>(false);

  // ++ Add a ref for the main element ++
  const mainRef = useRef<HTMLElement>(null);

  // --- Derived State ---

  // Update active palette based on selection and exclusions
  useEffect(() => {
    const newActiveBeadPalette = fullBeadPalette.filter(color => {
      const isInSelectedPalette = paletteOptions[selectedPaletteKeySet]?.keys.includes(color.key);
      const isNotExcluded = !excludedColorKeys.has(color.key);
      return isInSelectedPalette && isNotExcluded;
    });
    setActiveBeadPalette(newActiveBeadPalette);
  }, [selectedPaletteKeySet, excludedColorKeys, remapTrigger]); // ++ 添加 remapTrigger 依赖 ++

  // ++ 添加：当granularity状态改变时同步更新输入框的值 ++
  useEffect(() => {
    setGranularityInput(granularity.toString());
  }, [granularity]);

  // ++ Calculate unique colors currently on the grid for the palette ++
  const currentGridColors = useMemo(() => {
    if (!mappedPixelData) return [];
    const uniqueColorsMap = new Map<string, MappedPixel>();
    mappedPixelData.flat().forEach(cell => {
      if (cell && cell.key && !cell.isExternal && !uniqueColorsMap.has(cell.key)) {
        // Store the full MappedPixel object to preserve key and color
        uniqueColorsMap.set(cell.key, { key: cell.key, color: cell.color });
      }
    });
    // Sort colors like the stats list, if desired
    return Array.from(uniqueColorsMap.values()).sort((a, b) => sortColorKeys(a.key, b.key));
  }, [mappedPixelData]); // Recalculate when pixel data changes


  // --- Event Handlers ---

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExcludedColorKeys(new Set()); // ++ 重置排除列表 ++
      processFile(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setExcludedColorKeys(new Set()); // ++ 重置排除列表 ++
        processFile(file);
      } else {
        alert("请拖放图片文件 (JPG, PNG)");
      }
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImageSrc(result);
      setMappedPixelData(null);
      setGridDimensions(null);
      setColorCounts(null);
      setTotalBeadCount(0);
      setInitialGridColorKeys(null); // ++ 重置初始键 ++
      // ++ 重置横轴格子数量为默认值 ++
      const defaultGranularity = 100;
      setGranularity(defaultGranularity);
      setGranularityInput(defaultGranularity.toString());
      setRemapTrigger(prev => prev + 1); // Trigger full remap for new image
    };
    reader.onerror = () => {
        console.error("文件读取失败");
        alert("无法读取文件。");
        setInitialGridColorKeys(null); // ++ 重置初始键 ++
    }
    reader.readAsDataURL(file);
    // ++ Reset manual coloring mode when a new file is processed ++
    setIsManualColoringMode(false);
    setSelectedColor(null);
  };

  // ++ 新增：处理输入框变化的函数 ++
  const handleGranularityInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setGranularityInput(event.target.value);
  };

  // ++ 新增：处理确认按钮点击的函数 ++
  const handleConfirmGranularity = () => {
    const minGranularity = 10;
    const maxGranularity = 300;
    let newGranularity = parseInt(granularityInput, 10);

    if (isNaN(newGranularity) || newGranularity < minGranularity) {
      newGranularity = minGranularity;
    } else if (newGranularity > maxGranularity) {
      newGranularity = maxGranularity;
    }

    // 只有在值确实改变时才触发更新
    if (newGranularity !== granularity) {
      console.log(`Confirming new granularity: ${newGranularity}`);
      setGranularity(newGranularity); // 更新主状态
      setRemapTrigger(prev => prev + 1); // 触发重映射
      // ++ Exit manual coloring mode if parameters change ++
      setIsManualColoringMode(false);
      setSelectedColor(null);
    }

    // 总是将输入框的值同步为验证后的值（避免显示非法值）
    setGranularityInput(newGranularity.toString());
  };

   const handlePaletteChange = (event: ChangeEvent<HTMLSelectElement>) => {
     const newKey = event.target.value as PaletteOptionKey;
     if (paletteOptions[newKey]) {
         setSelectedPaletteKeySet(newKey);
         setExcludedColorKeys(new Set()); // ++ 重置排除列表 ++
         setRemapTrigger(prev => prev + 1); // Trigger full remap
     } else {
         console.warn(`Attempted to select invalid palette key: ${newKey}. Keeping current selection.`);
     }
     // ++ Exit manual coloring mode if palette changes ++
     setIsManualColoringMode(false);
     setSelectedColor(null);
   };

  const handleSimilarityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSimilarityThreshold(parseInt(event.target.value, 10));
    setRemapTrigger(prev => prev + 1); // Trigger full remap
    // ++ Exit manual coloring mode if parameters change ++
    setIsManualColoringMode(false);
    setSelectedColor(null);
  };

  // 添加像素化模式切换处理函数
  const handlePixelationModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newMode = event.target.value as PixelationMode;
    if (Object.values(PixelationMode).includes(newMode)) {
        setPixelationMode(newMode);
        setRemapTrigger(prev => prev + 1); // 触发重新映射
        setIsManualColoringMode(false); // 退出手动模式
        setSelectedColor(null);
    } else {
        console.warn(`无效的像素化模式: ${newMode}`);
    }
  };

  // 修改pixelateImage函数接收模式参数
  const pixelateImage = (imageSrc: string, detailLevel: number, threshold: number, currentPalette: PaletteColor[], mode: PixelationMode) => {
    console.log(`Attempting to pixelate with detail: ${detailLevel}, threshold: ${threshold}, mode: ${mode}`);
    const originalCanvas = originalCanvasRef.current;
    const pixelatedCanvas = pixelatedCanvasRef.current;

    if (!originalCanvas || !pixelatedCanvas) { console.error("Canvas ref(s) not available."); return; }
    const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
    const pixelatedCtx = pixelatedCanvas.getContext('2d');
    if (!originalCtx || !pixelatedCtx) { console.error("Canvas context(s) not found."); return; }
    console.log("Canvas contexts obtained.");

    if (currentPalette.length === 0) {
        console.error("Cannot pixelate: The selected color palette is empty (likely due to exclusions).");
        alert("错误：当前可用颜色板为空（可能所有颜色都被排除了），无法处理图像。请尝试恢复部分颜色。");
        // Clear previous results visually
        pixelatedCtx.clearRect(0, 0, pixelatedCanvas.width, pixelatedCanvas.height);
        setMappedPixelData(null);
        setGridDimensions(null);
        // Keep colorCounts potentially showing the last valid counts? Or clear them too?
        // setColorCounts(null); // Decide if clearing counts is desired when palette is empty
        // setTotalBeadCount(0);
        return; // Stop processing
    }
    const t1FallbackColor = currentPalette.find(p => p.key === 'T1')
                         || currentPalette.find(p => p.hex.toUpperCase() === '#FFFFFF')
                         || currentPalette[0]; // 使用第一个可用颜色作为备用
    console.log("Using fallback color for empty cells:", t1FallbackColor);

    const img = new window.Image();
    
    img.onerror = (error: Event | string) => {
      console.error("Image loading failed:", error); 
      alert("无法加载图片。");
      setOriginalImageSrc(null); 
      setMappedPixelData(null); 
      setGridDimensions(null); 
      setColorCounts(null); 
      setInitialGridColorKeys(null);
    };
    
    img.onload = () => {
      console.log("Image loaded successfully.");
      const aspectRatio = img.height / img.width;
      const N = detailLevel;
      const M = Math.max(1, Math.round(N * aspectRatio));
      if (N <= 0 || M <= 0) { console.error("Invalid grid dimensions:", { N, M }); return; }
      console.log(`Grid size: ${N}x${M}`);

      const outputWidth = 500;
      const outputHeight = Math.round(outputWidth * aspectRatio);
      originalCanvas.width = img.width; originalCanvas.height = img.height;
      pixelatedCanvas.width = outputWidth; pixelatedCanvas.height = outputHeight;
      console.log(`Canvas dimensions: Original ${img.width}x${img.height}, Output ${outputWidth}x${outputHeight}`);

      originalCtx.drawImage(img, 0, 0, img.width, img.height);
      console.log("Original image drawn.");

      // 使用calculatePixelGrid替换原来的颜色映射逻辑
      console.log("Starting initial color mapping using calculatePixelGrid...");
      const initialMappedData = calculatePixelGrid(
          originalCtx,
          img.width,
          img.height,
          N,
          M,
          currentPalette, 
          mode,
          t1FallbackColor
      );
      console.log(`Initial data mapping complete using mode ${mode}. Starting region merging...`);

      // --- Region Merging Step ---
      const keyToRgbMap = new Map<string, RgbColor>();
      currentPalette.forEach(p => keyToRgbMap.set(p.key, p.rgb));
      const visited: boolean[][] = Array(M).fill(null).map(() => Array(N).fill(false));
      const mergedData: MappedPixel[][] = Array(M).fill(null).map(() => Array(N).fill({ key: t1FallbackColor.key, color: t1FallbackColor.hex, isExternal: false }));
      const similarityThresholdValue = threshold;

      for (let j = 0; j < M; j++) {
        for (let i = 0; i < N; i++) {
          if (visited[j][i]) continue;

          const startCellData = initialMappedData[j][i];
          const startRgb = keyToRgbMap.get(startCellData.key);

          if (!startRgb) {
             console.warn(`RGB not found for key ${startCellData.key} at (${j},${i}) during merging. Using fallback.`);
             visited[j][i] = true;
             mergedData[j][i] = { key: t1FallbackColor.key, color: t1FallbackColor.hex, isExternal: false };
             continue;
          }

          const currentRegionCells: { r: number; c: number }[] = [];
          const beadKeyCountsInRegion: { [key: string]: number } = {};
          const queue: { r: number; c: number }[] = [{ r: j, c: i }];
          visited[j][i] = true;

          while (queue.length > 0) {
              const { r, c } = queue.shift()!;
              const currentCellData = initialMappedData[r][c];
              const currentRgb = keyToRgbMap.get(currentCellData.key);

              if (!currentRgb) {
                   console.warn(`RGB not found for key ${currentCellData.key} at (${r},${c}) during BFS. Skipping.`);
                   continue;
              }

              const dist = colorDistance(startRgb, currentRgb);

              if (dist < similarityThresholdValue) {
                  currentRegionCells.push({ r, c });
                  beadKeyCountsInRegion[currentCellData.key] = (beadKeyCountsInRegion[currentCellData.key] || 0) + 1;

                  const neighbors = [ { nr: r + 1, nc: c }, { nr: r - 1, nc: c }, { nr: r, nc: c + 1 }, { nr: r, nc: c - 1 } ];
                  for (const { nr, nc } of neighbors) {
                      if (nr >= 0 && nr < M && nc >= 0 && nc < N && !visited[nr][nc]) {
                          const neighborCellData = initialMappedData[nr][nc];
                          const neighborRgb = keyToRgbMap.get(neighborCellData.key);
                          if (neighborRgb && colorDistance(startRgb, neighborRgb) < similarityThresholdValue) {
                              visited[nr][nc] = true;
                              queue.push({ r: nr, c: nc });
                          }
                      }
                  }
              }
          }

          // --- Determine Dominant Color and Recolor the Region ---
          if (currentRegionCells.length > 0) {
              let dominantKey = '';
              let maxCount = 0;
              for (const key in beadKeyCountsInRegion) {
                  if (beadKeyCountsInRegion[key] > maxCount) {
                      maxCount = beadKeyCountsInRegion[key];
                      dominantKey = key;
                  }
              }
              if (!dominantKey) {
                  dominantKey = startCellData.key;
                  console.warn(`No dominant key found for region starting at (${j},${i}), using start cell key: ${dominantKey}`);
              }

              const dominantColorData = currentPalette.find(p => p.key === dominantKey);
              if (dominantColorData) {
                  const dominantColorHex = dominantColorData.hex;
                  currentRegionCells.forEach(({ r, c }) => {
                      mergedData[r][c] = { key: dominantKey, color: dominantColorHex, isExternal: false };
                  });
              } else {
                   console.warn(`Dominant key "${dominantKey}" determined but not found in *active* palette during merge. Using fallback.`);
                   currentRegionCells.forEach(({ r, c }) => {
                       mergedData[r][c] = { key: t1FallbackColor.key, color: t1FallbackColor.hex, isExternal: false };
                   });
              }
          } else {
              mergedData[j][i] = { ...startCellData, isExternal: false };
          }
        }
      }
      
      console.log("Region merging complete. Starting background removal.");

      // --- Flood Fill Background Process ---
      // ... 保持洪水填充算法不变，但在mergedData上操作 ...
      const visitedForFloodFill: boolean[][] = Array(M).fill(null).map(() => Array(N).fill(false));

      const floodFill = (r: number, c: number) => {
          const cell = mergedData[r]?.[c];
          if (r < 0 || r >= M || c < 0 || c >= N || visitedForFloodFill[r][c] || !cell || !BACKGROUND_COLOR_KEYS.includes(cell.key)) {
              return;
          }
          visitedForFloodFill[r][c] = true;
          cell.isExternal = true;
          floodFill(r + 1, c);
          floodFill(r - 1, c);
          floodFill(r, c + 1);
          floodFill(r, c - 1);
      };

      for (let i = 0; i < N; i++) {
          if (!visitedForFloodFill[0][i] && mergedData[0]?.[i] && BACKGROUND_COLOR_KEYS.includes(mergedData[0][i].key)) floodFill(0, i);
          if (!visitedForFloodFill[M - 1][i] && mergedData[M - 1]?.[i] && BACKGROUND_COLOR_KEYS.includes(mergedData[M - 1][i].key)) floodFill(M - 1, i);
      }
      for (let j = 0; j < M; j++) {
          if (!visitedForFloodFill[j][0] && mergedData[j]?.[0] && BACKGROUND_COLOR_KEYS.includes(mergedData[j][0].key)) floodFill(j, 0);
          if (!visitedForFloodFill[j][N - 1] && mergedData[j]?.[N - 1] && BACKGROUND_COLOR_KEYS.includes(mergedData[j][N - 1].key)) floodFill(j, N - 1);
      }
      console.log("Background flood fill marking complete.");

      // --- 绘制和状态更新 ---
      if (pixelatedCanvasRef.current) {
        setMappedPixelData(mergedData);
        setGridDimensions({ N, M });

        const counts: { [key: string]: { count: number; color: string } } = {};
        let totalCount = 0;
        mergedData.flat().forEach(cell => {
          if (cell && cell.key && !cell.isExternal) {
            if (!counts[cell.key]) {
              counts[cell.key] = { count: 0, color: cell.color };
            }
            counts[cell.key].count++;
            totalCount++;
          }
        });
        setColorCounts(counts);
        setTotalBeadCount(totalCount);
        setInitialGridColorKeys(new Set(Object.keys(counts)));
        console.log("Color counts updated based on merged data (excluding external background):", counts);
        console.log("Total bead count (excluding background):", totalCount);
        console.log("Stored initial grid color keys:", Object.keys(counts));
      } else {
        console.error("Pixelated canvas ref is null, skipping draw call in pixelateImage.");
      }
    }; // 正确闭合 img.onload 函数
    
    console.log("Setting image source...");
    img.src = imageSrc;
    setIsManualColoringMode(false);
    setSelectedColor(null);
  }; // 正确闭合 pixelateImage 函数

  // 修改useEffect中的pixelateImage调用，加入模式参数
  useEffect(() => {
    if (originalImageSrc && activeBeadPalette.length > 0) {
       const timeoutId = setTimeout(() => {
         if (originalImageSrc && originalCanvasRef.current && pixelatedCanvasRef.current && activeBeadPalette.length > 0) {
           console.log("useEffect triggered: Processing image due to src, granularity, threshold, palette selection, mode or remap trigger.");
           pixelateImage(originalImageSrc, granularity, similarityThreshold, activeBeadPalette, pixelationMode);
         } else {
            console.warn("useEffect check failed inside timeout: Refs or active palette not ready/empty.");
         }
       }, 50);
       return () => clearTimeout(timeoutId);
    } else if (originalImageSrc && activeBeadPalette.length === 0) {
        console.warn("Image selected, but the active palette is empty after exclusions. Cannot process. Clearing preview.");
        const pixelatedCanvas = pixelatedCanvasRef.current;
        const pixelatedCtx = pixelatedCanvas?.getContext('2d');
        if (pixelatedCtx && pixelatedCanvas) {
            pixelatedCtx.clearRect(0, 0, pixelatedCanvas.width, pixelatedCanvas.height);
            // Draw a message on the canvas?
            pixelatedCtx.fillStyle = '#6b7280'; // gray-500
            pixelatedCtx.font = '16px sans-serif';
            pixelatedCtx.textAlign = 'center';
            pixelatedCtx.fillText('无可用颜色，请恢复部分排除的颜色', pixelatedCanvas.width / 2, pixelatedCanvas.height / 2);
        }
        setMappedPixelData(null);
        setGridDimensions(null);
        // Keep colorCounts to allow user to un-exclude colors
        // setColorCounts(null);
        // setTotalBeadCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalImageSrc, granularity, similarityThreshold, selectedPaletteKeySet, pixelationMode, remapTrigger]); // 添加pixelationMode到依赖数组

    // --- Download function (ensure filename includes palette) ---
    const handleDownloadImage = () => {
        if (!mappedPixelData || !gridDimensions || gridDimensions.N === 0 || gridDimensions.M === 0 || activeBeadPalette.length === 0) {
            console.error("下载失败: 映射数据或尺寸无效。"); alert("无法下载图纸，数据未生成或无效。"); return;
        }
        const { N, M } = gridDimensions;
        const downloadCellSize = 30;
        const downloadWidth = N * downloadCellSize; const downloadHeight = M * downloadCellSize;
        const downloadCanvas = document.createElement('canvas');
        downloadCanvas.width = downloadWidth; downloadCanvas.height = downloadHeight;
        const ctx = downloadCanvas.getContext('2d');
        if (!ctx) { console.error("下载失败: 无法创建临时 Canvas Context。"); alert("无法下载图纸。"); return; }
        ctx.imageSmoothingEnabled = false;

        // Set a default background color for the entire canvas (usually white for downloads)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, downloadWidth, downloadHeight);

        console.log(`Generating download grid image: ${downloadWidth}x${downloadHeight}`);
        const fontSize = Math.max(8, Math.floor(downloadCellSize * 0.4));
        ctx.font = `bold ${fontSize}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 1; // Set line width for borders

        for (let j = 0; j < M; j++) {
            for (let i = 0; i < N; i++) {
                const cellData = mappedPixelData[j][i];
                const drawX = i * downloadCellSize;
                const drawY = j * downloadCellSize;

                // Determine fill color based on whether it's external background
                if (cellData && !cellData.isExternal) {
                    // Internal cell: fill with bead color and draw text
                    const cellColor = cellData.color || '#FFFFFF';
                    const cellKey = cellData.key || '?';

                    ctx.fillStyle = cellColor;
                    ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);

                    ctx.fillStyle = getContrastColor(cellColor);
                    ctx.fillText(cellKey, drawX + downloadCellSize / 2, drawY + downloadCellSize / 2);

                } else {
                    // External cell: fill with white (or leave transparent if background wasn't filled)
                    // No text needed for external background
                    ctx.fillStyle = '#FFFFFF'; // Ensure background cells are white
                    ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);
                }

                // ++ Draw border for ALL cells ++
                ctx.strokeStyle = '#DDDDDD'; // Grid line color for download
                // Use precise coordinates for sharp lines
                ctx.strokeRect(drawX + 0.5, drawY + 0.5, downloadCellSize, downloadCellSize);
            }
        }
        try {
            const dataURL = downloadCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `bead-grid-${N}x${M}-keys-palette_${selectedPaletteKeySet}.png`; // Filename includes palette
            link.href = dataURL;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            console.log("Grid image download initiated.");
        } catch (e) { console.error("下载图纸失败:", e); alert("无法生成图纸下载链接。"); }
    };

    // --- Download Stats Image function (ensure filename includes palette) ---
    const handleDownloadStatsImage = () => {
        if (!colorCounts || Object.keys(colorCounts).length === 0 || activeBeadPalette.length === 0) {
            console.error("下载统计图失败: 颜色统计数据无效或色板为空。"); alert("无法下载统计图，数据未生成、无效或无可用颜色。"); return;
        }
        const sortedKeys = Object.keys(colorCounts).sort(sortColorKeys);
        const rowHeight = 25; const padding = 10; const swatchSize = 18;
        const textOffsetY = rowHeight / 2; const column1X = padding; const column2X = padding + swatchSize + 10;
        const canvasWidth = 250; const canvasHeight = (sortedKeys.length * rowHeight) + (2 * padding);
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth; canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { console.error("下载失败: 无法创建 Canvas Context。"); alert("无法生成统计图。"); return; }
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.font = '13px sans-serif'; ctx.textBaseline = 'middle';

        sortedKeys.forEach((key, index) => {
            const yPos = padding + (index * rowHeight); const cellData = colorCounts[key];
            ctx.fillStyle = cellData.color; ctx.strokeStyle = '#CCCCCC'; ctx.lineWidth = 1;
            ctx.fillRect(column1X, yPos + (rowHeight - swatchSize) / 2, swatchSize, swatchSize);
            ctx.strokeRect(column1X + 0.5, yPos + (rowHeight - swatchSize) / 2 + 0.5, swatchSize-1, swatchSize-1);
            ctx.fillStyle = '#333333'; ctx.textAlign = 'left'; ctx.fillText(key, column2X, yPos + textOffsetY);
            ctx.textAlign = 'right'; ctx.fillText(`${cellData.count} 颗`, canvasWidth - padding, yPos + textOffsetY);
        });
        try {
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `bead-stats-palette_${selectedPaletteKeySet}.png`; // Filename includes palette
            link.href = dataURL;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            console.log("Statistics image download initiated.");
        } catch (e) { console.error("下载统计图失败:", e); alert("无法生成统计图下载链接。"); }
    };

    // --- Handler to toggle color exclusion ---
    const handleToggleExcludeColor = (key: string) => {
        const currentExcluded = excludedColorKeys;
        const isExcluding = !currentExcluded.has(key);

        if (isExcluding) {
            console.log(`---------\nAttempting to EXCLUDE color: ${key}`); // ++ Log Start ++

            // --- 确保初始颜色键已记录 ---
            if (!initialGridColorKeys) {
                console.error("Cannot exclude color: Initial grid color keys not yet calculated.");
                alert("无法排除颜色，初始颜色数据尚未准备好，请稍候。");
                return;
            }
            console.log("Initial Grid Keys:", Array.from(initialGridColorKeys)); // ++ Log Initial Keys ++
            console.log("Currently Excluded Keys (before this op):", Array.from(currentExcluded)); // ++ Log Current Exclusions ++

            const nextExcludedKeys = new Set(currentExcluded); nextExcludedKeys.add(key);

            // --- 使用初始颜色键进行重映射目标逻辑 ---
            // 1. 从初始网格颜色集合开始
            const potentialRemapKeys = new Set(initialGridColorKeys);
            console.log("Step 1: Potential Keys (from initial):", Array.from(potentialRemapKeys));

            // 2. 移除当前要排除的键
            potentialRemapKeys.delete(key);
            console.log(`Step 2: Potential Keys (after removing ${key}):`, Array.from(potentialRemapKeys));

            // 3. 移除任何*其他*当前也被排除的键
            currentExcluded.forEach(excludedKey => {
                potentialRemapKeys.delete(excludedKey);
            });
            console.log("Step 3: Potential Keys (after removing other current exclusions):", Array.from(potentialRemapKeys)); // ++ Log Final Potential Keys ++

            // 4. 基于剩余的*初始*颜色键创建重映射调色板
            const remapTargetPalette = fullBeadPalette.filter(color => potentialRemapKeys.has(color.key));
            const remapTargetKeys = remapTargetPalette.map(p => p.key); // ++ Log Target Palette Keys ++
            console.log("Step 4: Remap Target Palette Keys:", remapTargetKeys);

            // 5. *** 关键检查 ***：如果在考虑所有排除项后，没有*初始*颜色可供映射，则阻止此次排除
            if (remapTargetPalette.length === 0) {
                console.warn(`Cannot exclude color '${key}'. No other valid colors from the initial grid remain after considering all current exclusions.`);
                alert(`无法排除颜色 ${key}，因为图中最初存在的其他可用颜色也已被排除。请先恢复部分其他颜色。`);
                console.log("---------"); // ++ Log End ++
                return; // 停止排除过程
            }
            console.log(`Remapping target palette (based on initial grid colors minus all exclusions) contains ${remapTargetPalette.length} colors.`);
            // --- 结束修正逻辑 ---

            const excludedColorData = fullBeadPalette.find(p => p.key === key);
            // 检查排除颜色的数据是否存在
             if (!excludedColorData || !mappedPixelData || !gridDimensions) {
                 console.error("Cannot exclude color: Missing data for remapping.");
                 alert("无法排除颜色，缺少必要数据。");
                 console.log("---------"); // ++ Log End ++
                 return;
             }


            console.log(`Remapping cells currently using excluded color: ${key}`);
            // 仅在需要重映射时创建深拷贝
            const newMappedData = mappedPixelData.map(row => row.map(cell => ({...cell})));
            let remappedCount = 0; const { N, M } = gridDimensions;
            let firstReplacementKey: string | null = null; // Log the first replacement

            for (let j = 0; j < M; j++) { for (let i = 0; i < N; i++) {
                const cell = newMappedData[j]?.[i];
                // 此条件正确地仅针对具有排除键的单元格
                if (cell && !cell.isExternal && cell.key === key) {
                    // *** 使用派生的 remapTargetPalette（此处保证非空）查找最接近的颜色 ***
                    const replacementColor = findClosestPaletteColor(excludedColorData.rgb, remapTargetPalette);
                    if (!firstReplacementKey) firstReplacementKey = replacementColor.key; // ++ Log Replacement Key ++
                    newMappedData[j][i] = { ...cell, key: replacementColor.key, color: replacementColor.hex };
                    remappedCount++;
                }
            }}
            console.log(`Remapped ${remappedCount} cells. First replacement key found was: ${firstReplacementKey || 'N/A'}`); // ++ Log Replacement Key ++

            // 同时更新状态
            setExcludedColorKeys(nextExcludedKeys); // 应用此颜色的排除
            setMappedPixelData(newMappedData); // 使用重映射的数据更新

            // 基于*新*映射数据重新计算计数
            const newCounts: { [key: string]: { count: number; color: string } } = {}; let newTotalCount = 0;
            newMappedData.flat().forEach(cell => { if (cell && cell.key && !cell.isExternal) {
                if (!newCounts[cell.key]) {
                    const colorData = fullBeadPalette.find(p => p.key === cell.key);
                    // 确保颜色数据存在
                    newCounts[cell.key] = { count: 0, color: colorData?.hex || '#000000' };
                }
                newCounts[cell.key].count++; newTotalCount++;
            }});
            setColorCounts(newCounts); setTotalBeadCount(newTotalCount);
            console.log("State updated after exclusion and local remap based on initial grid colors.");
            console.log("---------"); // ++ Log End ++

            // ++ 在更新状态后，重新绘制 Canvas ++
            if (pixelatedCanvasRef.current && gridDimensions) { // ++ 添加检查 ++
              setMappedPixelData(newMappedData);
              // 不要调用 setGridDimensions，因为颜色排除不需要改变网格尺寸
            } else {
               console.error("Canvas ref or grid dimensions missing, skipping draw call in handleToggleExcludeColor.");
            }

        } else {
            // --- Re-including ---
            console.log(`---------\nAttempting to RE-INCLUDE color: ${key}`); // ++ Log Start ++
            console.log(`Re-including color: ${key}. Triggering full remap.`);
            const nextExcludedKeys = new Set(currentExcluded); nextExcludedKeys.delete(key);
            setExcludedColorKeys(nextExcludedKeys);
            // 此处无需重置 initialGridColorKeys，完全重映射会通过 pixelateImage 重新计算它
            setRemapTrigger(prev => prev + 1); // *** KEPT setRemapTrigger here for re-inclusion ***
            console.log("---------"); // ++ Log End ++
        }
        // ++ Exit manual mode if colors are excluded/included ++
        setIsManualColoringMode(false);
        setSelectedColor(null);
    };

  // --- Tooltip Logic ---

  // --- Canvas Interaction ---

  // ++ Re-introduce the combined interaction handler ++
  const handleCanvasInteraction = (
    clientX: number, 
    clientY: number, 
    pageX: number, 
    pageY: number, 
    isClick: boolean = false,
    isTouchEnd: boolean = false
  ) => {
    // 如果是触摸结束或鼠标离开事件，隐藏提示
    if (isTouchEnd) {
      setTooltipData(null);
      return;
    }

    const canvas = pixelatedCanvasRef.current;
    if (!canvas || !mappedPixelData || !gridDimensions) {
      setTooltipData(null);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    const { N, M } = gridDimensions;
    const cellWidthOutput = canvas.width / N;
    const cellHeightOutput = canvas.height / M;

    const i = Math.floor(canvasX / cellWidthOutput);
    const j = Math.floor(canvasY / cellHeightOutput);

    if (i >= 0 && i < N && j >= 0 && j < M) {
      const cellData = mappedPixelData[j][i];

      // Manual Coloring Logic - 保持原有的上色逻辑
      if (isClick && isManualColoringMode && selectedColor) {
        // 手动上色模式逻辑保持不变
        // ...现有代码...
        const newPixelData = mappedPixelData.map(row => row.map(cell => ({ ...cell })));
        const currentCell = newPixelData[j]?.[i];

        if (!currentCell) return;

        const previousKey = currentCell.key;
        const wasExternal = currentCell.isExternal;
        
        let newCellData: MappedPixel;
        
        if (selectedColor.key === TRANSPARENT_KEY) {
          newCellData = { ...transparentColorData };
        } else {
          newCellData = { ...selectedColor, isExternal: false };
        }

        // Only update if state changes
        if (newCellData.key !== previousKey || newCellData.isExternal !== wasExternal) {
          newPixelData[j][i] = newCellData;
          setMappedPixelData(newPixelData);

          // Update color counts
          if (colorCounts) {
            const newColorCounts = { ...colorCounts };
            let newTotalCount = totalBeadCount;

            if (!wasExternal && previousKey !== TRANSPARENT_KEY && newColorCounts[previousKey]) {
              newColorCounts[previousKey].count--;
              if (newColorCounts[previousKey].count <= 0) {
                delete newColorCounts[previousKey];
              }
              newTotalCount--;
            }

            if (!newCellData.isExternal && newCellData.key !== TRANSPARENT_KEY) {
              if (!newColorCounts[newCellData.key]) {
                const colorInfo = fullBeadPalette.find(p => p.key === newCellData.key);
                newColorCounts[newCellData.key] = {
                  count: 0,
                  color: colorInfo?.hex || '#000000'
                };
              }
              newColorCounts[newCellData.key].count++;
              newTotalCount++;
            }

            setColorCounts(newColorCounts);
            setTotalBeadCount(newTotalCount);
          }
        }
        
        // 上色操作后隐藏提示
        setTooltipData(null);
      }
      // Tooltip Logic (非手动上色模式点击或悬停)
      else if (!isManualColoringMode) {
        // 只有单元格实际有内容（非背景/外部区域）才会显示提示
        if (cellData && !cellData.isExternal && cellData.key) {
          // 检查是否已经显示了提示框，并且是否点击的是同一个位置
          // 对于移动设备，位置可能有细微偏差，所以我们检查单元格索引而不是具体坐标
          if (tooltipData) {
            // 如果已经有提示框，计算当前提示框对应的格子的索引
            const tooltipRect = canvas.getBoundingClientRect();
            
            // 还原提示框位置为相对于canvas的坐标
            const prevX = tooltipData.x; // 页面X坐标
            const prevY = tooltipData.y; // 页面Y坐标
            
            // 转换为相对于canvas的坐标
            const prevCanvasX = (prevX - tooltipRect.left) * scaleX;
            const prevCanvasY = (prevY - tooltipRect.top) * scaleY;
            
            // 计算之前显示提示框位置对应的网格索引
            const prevCellI = Math.floor(prevCanvasX / cellWidthOutput);
            const prevCellJ = Math.floor(prevCanvasY / cellHeightOutput);
            
            // 如果点击的是同一个格子，则切换tooltip的显示/隐藏状态
            if (i === prevCellI && j === prevCellJ) {
              setTooltipData(null); // 隐藏提示
              return;
            }
          }
          
          // 计算相对于main元素的位置
          const mainElement = mainRef.current;
          if (mainElement) {
            const mainRect = mainElement.getBoundingClientRect();
            // 计算相对于main元素的坐标
            const relativeX = pageX - mainRect.left - window.scrollX;
            const relativeY = pageY - mainRect.top - window.scrollY;
            
            // 如果是移动/悬停到一个新的有效格子，或者点击了不同的格子，则显示提示
            setTooltipData({
              x: relativeX,
              y: relativeY,
              key: cellData.key,
              color: cellData.color,
            });
          } else {
            // 如果没有找到main元素，使用原始坐标
            setTooltipData({
              x: pageX,
              y: pageY,
              key: cellData.key,
              color: cellData.color,
            });
          }
        } else {
          // 如果点击/悬停在外部区域或背景上，隐藏提示
          setTooltipData(null);
        }
      }
    } else {
      // 如果点击/悬停在画布外部，隐藏提示
      setTooltipData(null);
    }
  };

  return (
    <>
    {/* 添加自定义动画样式 */}
    <style dangerouslySetInnerHTML={{ __html: floatAnimation }} />
    
    {/* ++ 修改：添加 onLoad 回调函数 ++ */}
    <Script
      async
      src="//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js"
      strategy="lazyOnload"
      onLoad={() => {
        const basePV = 378536; // ++ 预设 PV 基数 ++
        const baseUV = 257864; // ++ 预设 UV 基数 ++

        const updateCount = (spanId: string, baseValue: number) => {
          const targetNode = document.getElementById(spanId);
          if (!targetNode) return;

          const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
              if (mutation.type === 'childList' || mutation.type === 'characterData') {
                const currentValueText = targetNode.textContent?.trim() || '0';
                if (currentValueText !== '...') {
                  const currentValue = parseInt(currentValueText.replace(/,/g, ''), 10) || 0;
                  targetNode.textContent = (currentValue + baseValue).toLocaleString();
                  observer.disconnect(); // ++ 更新后停止观察 ++ 
                  // console.log(`Updated ${spanId} from ${currentValueText} to ${targetNode.textContent}`);
                  break; // 处理完第一个有效更新即可
                }
              }
            }
          });

          observer.observe(targetNode, { childList: true, characterData: true, subtree: true });

          // ++ 处理初始值已经是数字的情况 (如果脚本加载很快) ++
          const initialValueText = targetNode.textContent?.trim() || '0';
          if (initialValueText !== '...') {
             const initialValue = parseInt(initialValueText.replace(/,/g, ''), 10) || 0;
             targetNode.textContent = (initialValue + baseValue).toLocaleString();
             observer.disconnect(); // 已更新，无需再观察
          }
        };

        updateCount('busuanzi_value_site_pv', basePV);
        updateCount('busuanzi_value_site_uv', baseUV);
      }}
    />

    <div className="min-h-screen p-4 sm:p-6 flex flex-col items-center bg-gradient-to-b from-gray-50 to-white font-[family-name:var(--font-geist-sans)] overflow-x-hidden">
      <header className="w-full md:max-w-4xl text-center mt-6 mb-8 sm:mt-8 sm:mb-10 relative overflow-hidden">
        {/* 装饰背景圆形 - 修改位置确保不超出屏幕 */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-blue-100 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-pink-100 rounded-full opacity-30 blur-3xl"></div>
        
        {/* 装饰点阵图案 - 表示拼豆效果 */}
        <div className="absolute top-0 right-0 grid grid-cols-5 gap-1 opacity-20">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
          ))}
        </div>
        <div className="absolute bottom-0 left-0 grid grid-cols-5 gap-1 opacity-20">
          {[...Array(25)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
          ))}
        </div>
        
        {/* 标题内容 */}
        <div className="relative z-10 py-6">
          {/* 拼豆图标 */}
          <div className="flex justify-center mb-4 animate-float">
            <div className="grid grid-cols-4 gap-1 p-2 bg-white rounded-xl shadow-lg border border-gray-100">
              {['bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400', 
                'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-teal-400',
                'bg-indigo-400', 'bg-cyan-400', 'bg-lime-400', 'bg-amber-400',
                'bg-rose-400', 'bg-sky-400', 'bg-emerald-400', 'bg-violet-400'].map((color, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${color} transition-all duration-500 hover:scale-110 shadow-sm`}
                  style={{animation: `float ${2 + (i % 3)}s ease-in-out infinite ${i * 0.1}s`}}
                ></div>
              ))}
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 tracking-tight drop-shadow-sm">
          七卡瓦 拼豆底稿生成器
          </h1>
          <div className="h-1 w-24 mx-auto my-3 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full"></div>
          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
            上传图片，选择色板，生成带色号的图纸和统计
          </p>
        </div>
      </header>

      <main ref={mainRef} className="w-full md:max-w-4xl flex flex-col items-center space-y-5 sm:space-y-6 relative overflow-hidden"> {/* 添加 overflow-hidden */}
        {/* Drop Zone */}
        <div
          onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 w-full md:max-w-md flex flex-col justify-center items-center shadow-sm hover:shadow-md"
          style={{ minHeight: '130px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-xs sm:text-sm text-gray-500">拖放图片到此处，或<span className="font-medium text-blue-600">点击选择文件</span></p>
          <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG 格式</p>
        </div>
        
        {/* 添加提示信息 - 只在没有图片预览时显示 */}
        {!originalImageSrc && (
          <div className="w-full md:max-w-md bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100 shadow-sm">
            <p className="text-xs text-indigo-700 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>小贴士：使用像素图进行转换前，请确保图片的边缘吻合像素格子的边界线，这样可以获得更精确的切割效果和更好的成品。</span>
            </p>
          </div>
        )}

        <input type="file" accept="image/jpeg, image/png" onChange={handleFileChange} ref={fileInputRef} className="hidden" />

        {/* Controls and Output Area */}
        {originalImageSrc && (
          <div className="w-full flex flex-col items-center space-y-5 sm:space-y-6">
            {/* ++ HIDE Control Row in manual mode ++ */}
            {!isManualColoringMode && (
              <div className="w-full md:max-w-2xl grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-4 sm:p-5 rounded-xl shadow-md border border-gray-100">
                {/* Granularity Input */}
                <div className="flex-1">
                  <label htmlFor="granularityInput" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    横轴格子 (10-300):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      id="granularityInput"
                      value={granularityInput}
                      onChange={handleGranularityInputChange}
                      className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 h-9 shadow-sm"
                      min="10"
                      max="300"
                    />
                    <button 
                      onClick={handleConfirmGranularity}
                      className="h-9 bg-blue-500 hover:bg-blue-600 text-white text-sm px-2.5 rounded-md whitespace-nowrap transition-colors duration-200 shadow-sm"
                    >确认</button>
                  </div>
                </div>

                {/* Similarity Threshold Slider */}
                <div className="flex-1">
                    <label htmlFor="similarityThreshold" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                        区域颜色合并: <span className="font-semibold text-purple-600">{similarityThreshold}</span>
                    </label>
                    <input
                      type="range"
                      id="similarityThreshold"
                      min="0"
                      max="100"
                      value={similarityThreshold}
                      onChange={handleSimilarityChange}
                      className="w-full h-9 accent-purple-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 -mt-1">
                      <span>少</span>
                      <span>多</span>
                    </div>
                </div>

                {/* Palette Selector */}
                <div className="flex-1">
                  <label htmlFor="paletteSelect" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">选择色板:</label>
                  <select
                    id="paletteSelect"
                    value={selectedPaletteKeySet}
                    onChange={handlePaletteChange}
                    className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 h-9 shadow-sm"
                  >
                    {(Object.keys(paletteOptions) as PaletteOptionKey[]).map(key => (
                      <option key={key} value={key}>{paletteOptions[key].name}</option>
                    ))}
                  </select>
                </div>

                {/* 添加像素化模式选择 */}
                <div className="flex-1">
                  <label htmlFor="pixelationModeSelect" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">处理模式:</label>
                  <select
                    id="pixelationModeSelect"
                    value={pixelationMode}
                    onChange={handlePixelationModeChange}
                    className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 h-9 shadow-sm"
                  >
                    <option value={PixelationMode.Dominant}>卡通 (主色)</option>
                    <option value={PixelationMode.Average}>真实 (平均)</option>
                  </select>
                </div>
              </div>
            )} {/* ++ End of HIDE Control Row ++ */}

            {/* Output Section */}
            <div className="w-full md:max-w-2xl">
              <canvas ref={originalCanvasRef} className="hidden"></canvas>

              {/* ++ RENDER Button/Palette ONLY in manual mode above canvas ++ */}
              {isManualColoringMode && mappedPixelData && gridDimensions && (
                <div className="w-full mb-4 p-4 bg-blue-50 rounded-xl shadow-md border border-blue-100">
                  {/* Finish Manual Coloring Button */}
                  <button
                    onClick={() => {
                      setIsManualColoringMode(false); // Always exit mode here
                      setSelectedColor(null);
                      setTooltipData(null);
                    }}
                    className={`w-full py-2.5 px-4 text-sm sm:text-base rounded-lg transition-all duration-200 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> </svg>
                    完成手动上色
                  </button>
                  {/* Color Palette (only in manual mode) */}
                  <div className="mt-4">
                    <p className="text-xs text-center text-gray-600 mb-2">选择颜色或橡皮擦后，点击下方画布格子进行填充或擦除。</p>
                    <p className="text-xs text-center text-gray-600 mb-2">（推荐在电脑上进行上色操作）</p>
                    <ColorPalette
                      colors={[transparentColorData, ...currentGridColors]}
                      selectedColor={selectedColor}
                      onColorSelect={setSelectedColor}
                      transparentKey={TRANSPARENT_KEY}
                    />
                  </div>
                </div>
              )} {/* ++ End of RENDER Button/Palette ++ */}

              {/* Canvas Preview Container */}
              <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                <div className="flex justify-center mb-3 sm:mb-4 bg-gray-100 p-2 rounded-lg overflow-hidden"
                     style={{ minHeight: '150px' }}>
                  <PixelatedPreviewCanvas
                    canvasRef={pixelatedCanvasRef}
                    mappedPixelData={mappedPixelData}
                    gridDimensions={gridDimensions}
                    isManualColoringMode={isManualColoringMode}
                    onInteraction={handleCanvasInteraction}
                  />
                </div>
              </div>
            </div>
          </div> // This closes the main div started after originalImageSrc check
        )}

        {/* ++ HIDE Color Counts in manual mode ++ */}
        {!isManualColoringMode && originalImageSrc && colorCounts && Object.keys(colorCounts).length > 0 && (
          <div className="w-full md:max-w-2xl mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-1 text-gray-700 text-center">
              颜色统计 & 去除杂色 ({paletteOptions[selectedPaletteKeySet]?.name || '未知色板'})
            </h3>
            <p className="text-xs text-center text-gray-500 mb-3">点击下方列表中的颜色可将其从可用列表中排除。总计: {totalBeadCount} 颗</p>
            <ul className="space-y-1 max-h-60 overflow-y-auto pr-2 text-sm">
              {Object.keys(colorCounts)
                .sort(sortColorKeys)
                .map((key) => {
                  const isExcluded = excludedColorKeys.has(key);
                  const count = colorCounts[key].count;
                  const colorHex = colorCounts[key].color;

                  return (
                    <li
                      key={key}
                      onClick={() => handleToggleExcludeColor(key)}
                      className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                        isExcluded
                          ? 'bg-red-100 hover:bg-red-200 opacity-60'
                          : 'hover:bg-gray-100'
                      }`}
                      title={isExcluded ? `点击恢复 ${key}` : `点击排除 ${key}`}
                    >
                      <div className={`flex items-center space-x-2 ${isExcluded ? 'line-through' : ''}`}>
                        <span
                          className="inline-block w-4 h-4 rounded border border-gray-400 flex-shrink-0"
                          style={{ backgroundColor: isExcluded ? '#cccccc' : colorHex }}
                        ></span>
                        <span className={`font-mono font-medium ${isExcluded ? 'text-red-700' : 'text-gray-800'}`}>{key}</span>
                      </div>
                      <span className={`text-xs ${isExcluded ? 'text-red-600 line-through' : 'text-gray-600'}`}>{count} 颗</span>
                    </li>
                  );
                })}
            </ul>
            {excludedColorKeys.size > 0 && (
                <button
                    onClick={() => {
                         setExcludedColorKeys(new Set());
                         setInitialGridColorKeys(null);
                         setRemapTrigger(prev => prev + 1);
                    }}
                    className="mt-3 w-full text-xs py-1.5 px-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                    恢复所有排除的颜色 ({excludedColorKeys.size})
                </button>
            )}
          </div>
        )} {/* ++ End of HIDE Color Counts ++ */}

        {/* Message if palette becomes empty (Also hide in manual mode) */}
         {!isManualColoringMode && originalImageSrc && activeBeadPalette.length === 0 && excludedColorKeys.size > 0 && (
             <div className="w-full md:max-w-2xl mt-6 bg-yellow-100 p-4 rounded-lg shadow text-center text-sm text-yellow-800">
                 当前可用颜色过少或为空。请在上方统计列表中点击恢复部分颜色，或更换色板。
                 {excludedColorKeys.size > 0 && (
                      <button
                          onClick={() => {
                                setExcludedColorKeys(new Set());
                                setInitialGridColorKeys(null);
                                setRemapTrigger(prev => prev + 1);
                           }}
                          className="mt-2 ml-2 text-xs py-1 px-2 bg-yellow-200 text-yellow-900 rounded hover:bg-yellow-300"
                      >
                          恢复所有 ({excludedColorKeys.size})
                      </button>
                  )}
             </div>
         )}

        {/* ++ RENDER Enter Manual Mode Button ONLY when NOT in manual mode (before downloads) ++ */}
        {!isManualColoringMode && originalImageSrc && mappedPixelData && gridDimensions && (
            <div className="w-full md:max-w-2xl mt-4"> {/* Wrapper div */} 
             <button
                onClick={() => {
                  setIsManualColoringMode(true); // Enter mode
                  setSelectedColor(null);
                  setTooltipData(null);
                }}
                className={`w-full py-2.5 px-4 text-sm sm:text-base rounded-lg transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg hover:translate-y-[-1px]`}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"> <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /> </svg>
                 进入手动上色模式
             </button>
            </div>
        )} {/* ++ End of RENDER Enter Manual Mode Button ++ */}

        {/* ++ HIDE Download Buttons in manual mode ++ */}
        {!isManualColoringMode && originalImageSrc && mappedPixelData && (
            <div className="w-full md:max-w-2xl mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Download Grid Button */}
              <button
                onClick={handleDownloadImage}
                disabled={!mappedPixelData || !gridDimensions || gridDimensions.N === 0 || gridDimensions.M === 0 || activeBeadPalette.length === 0}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm sm:text-base rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:translate-y-[-1px] disabled:hover:translate-y-0 disabled:hover:shadow-md"
               >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                下载图纸 (带色号)
              </button>
              {/* Download Stats Button */}
              <button
                onClick={handleDownloadStatsImage}
                disabled={!colorCounts || totalBeadCount === 0 || activeBeadPalette.length === 0}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm sm:text-base rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:translate-y-[-1px] disabled:hover:translate-y-0 disabled:hover:shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                下载数量表 (PNG)
              </button>
            </div>
        )} {/* ++ End of HIDE Download Buttons ++ */}

         {/* Tooltip Display (remains the same) */}
         {tooltipData && (
            <GridTooltip tooltipData={tooltipData} />
          )}

         {/* Cleaned up the previously moved/commented out block */}

      </main>

      <footer className="w-full md:max-w-4xl mt-10 mb-6 py-6 text-center text-xs sm:text-sm text-gray-500 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 rounded-lg shadow-inner">
        {/* ++ 修改：访问统计分行显示 ++ */}
        
        {/* 新增打赏按钮 - 移到版权信息前面，样式优化 */}
        <button
          onClick={() => setIsDonationModalOpen(true)}
          className="mb-5 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] flex items-center justify-center mx-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a2 2 0 0 1 2 2v1c0 1.1-.9 2-2 2h-1" fill="#f9a8d4" />
            <path d="M6 8h12v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V8z" fill="#f9a8d4" />
            <path d="M6 8V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1" fill="#f472b6" />
            <path d="M12 16v-4" stroke="#7d2a5a" />
            <path d="M9.5 14.5L9 16" stroke="#7d2a5a" />
            <path d="M14.5 14.5L15 16" stroke="#7d2a5a" />
          </svg>
          <span className="font-serif italic" style={{ fontFamily: "'Brush Script MT', cursive, serif" }}>Buy Me A Milk Tea</span>
        </button>
        
        <p className="font-medium text-gray-600">
          七卡瓦 拼豆底稿生成器 &copy; {new Date().getFullYear()}
        </p>
        
        <div className="mt-2 flex items-center justify-center gap-4">
          <a href="https://github.com/Zippland/perler-beads.git" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 transition-colors duration-200 hover:underline flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            Github
          </a>

          <a href="https://www.xiaohongshu.com/user/profile/623e8b080000000010007721" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:text-rose-700 transition-colors duration-200 hover:underline flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 1024 1024" fill="currentColor" className="mr-1">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m238.8 360.2l-57.7 93.3c-10.1 16.3-31.5 21.3-47.8 11.2l-112.4-69.5c-16.3-10.1-21.3-31.5-11.2-47.8l57.7-93.3c10.1-16.3 31.5-21.3 47.8-11.2l112.4 69.5c16.3 10.1 21.3 31.5 11.2 47.8zM448 496l-57.7 93.3c-10.1 16.3-31.5 21.3-47.8 11.2l-112.4-69.5c-16.3-10.1-21.3-31.5-11.2-47.8l57.7-93.3c10.1-16.3 31.5-21.3 47.8-11.2l112.4 69.5c16.3 10.1 21.3 31.5 11.2 47.8z m248.9 43.2l-57.7 93.3c-10.1 16.3-31.5 21.3-47.8 11.2l-112.4-69.5c-16.3-10.1-21.3-31.5-11.2-47.8l57.7-93.3c10.1-16.3 31.5-21.3 47.8-11.2l112.4 69.5c16.3 10.1 21.3 31.5 11.2 47.8z"/>
            </svg>
            小红书
          </a>
        </div>
      </footer>

      {/* 打赏弹窗 - 优化设计 */}
      {isDonationModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-full md:max-w-md max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="p-3 sm:p-6">
              <div className="flex justify-between items-center mb-3 sm:mb-5">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent font-serif italic flex items-center" style={{ fontFamily: "'Brush Script MT', cursive, serif" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a2 2 0 0 1 2 2v1c0 1.1-.9 2-2 2h-1" fill="#f9a8d4" />
                    <path d="M6 8h12v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V8z" fill="#f9a8d4" />
                    <path d="M6 8V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v1" fill="#f472b6" />
                    <path d="M12 16v-4" stroke="#7d2a5a" />
                    <path d="M9.5 14.5L9 16" stroke="#7d2a5a" />
                    <path d="M14.5 14.5L15 16" stroke="#7d2a5a" />
                  </svg>
                  Buy Me A Milk Tea
                </h3>
                <button 
                  onClick={() => setIsDonationModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="text-center">
                <p className="mb-3 text-sm sm:text-base text-gray-600 break-words">
                  开源社群是作者和用户共同构建的，如果您希望这个项目继续发展，可以请我喝一杯奶茶。
                </p>
                <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 break-words">
                  您的支持是这个项目继续下去的唯一动力。
                </p>
                
                <div className="flex justify-center mb-4 sm:mb-5">
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 p-1 sm:p-2 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg shadow-md">
                    <Image 
                      src="/donation-qr.jpg" 
                      alt="赞赏码" 
                      fill
                      className="object-contain p-1 sm:p-2"
                    />
                  </div>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-500 bg-gray-50 py-1.5 px-3 sm:py-2 sm:px-4 rounded-full inline-block shadow-sm">
                  微信扫描上方赞赏码，请我喝一杯奶茶。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
   </>
  );
}