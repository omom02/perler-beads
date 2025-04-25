'use client';

import React, { useState, useRef, ChangeEvent, DragEvent, TouchEvent, useEffect, useMemo } from 'react';
// Image component from next/image might not be strictly needed if you only use canvas and basic elements,
// but keep it if you plan to add other images later or use the SVG icon below.
// Removed unused Image import

import beadPaletteData from './beadPaletteData.json';

// Helper function to convert Hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Helper function to calculate Euclidean distance in RGB space
function colorDistance(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// Interface for our palette colors
interface PaletteColor {
  key: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
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
  'all': { name: `221全实色`, keys: allPaletteKeys },
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

// ++ Add definition for background color keys ++
const BACKGROUND_COLOR_KEYS = ['T1', 'H1', 'H2']; // 可以根据需要调整

// Helper function to find the closest color in the *selected* palette
function findClosestPaletteColor(
    avgRgb: { r: number; g: number; b: number },
    palette: PaletteColor[]
): PaletteColor {
    let minDistance = Infinity;
    let closestColor = palette[0];

    if (!closestColor) {
        console.error("Selected bead palette is empty or invalid!");
        const t1Fallback = fullBeadPalette.find(p => p.key === 'T1');
        const blackFallback = fullBeadPalette.find(p => p.hex === '#000000') || { key: 'ERR', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } };
        return t1Fallback || blackFallback;
    }

    for (const paletteColor of palette) {
        const distance = colorDistance(avgRgb, paletteColor.rgb);
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = paletteColor;
        }
        if (distance === 0) break;
    }
    return closestColor;
}

// Helper to get contrasting text color (simple version)
function getContrastColor(hex: string): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#000000'; // Default to black
    // Simple brightness check (Luma formula Y = 0.2126 R + 0.7152 G + 0.0722 B)
    const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    return luma > 0.5 ? '#000000' : '#FFFFFF'; // Dark background -> white text, Light background -> black text
}

// Helper function for sorting color keys (e.g., A1, A2, A10, B1)
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

export default function Home() {
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<number>(50);
  const [selectedPaletteKeySet, setSelectedPaletteKeySet] = useState<PaletteOptionKey>('all'); // Default to 'all'
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(35); // ++ Add state for similarity threshold ++
  const [excludedColorKeys, setExcludedColorKeys] = useState<Set<string>>(new Set()); // ++ 新增：用于存储排除的颜色 Key
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const pixelatedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mappedPixelData, setMappedPixelData] = useState<{ key: string; color: string; isExternal?: boolean }[][] | null>(null);
  const [gridDimensions, setGridDimensions] = useState<{ N: number; M: number } | null>(null);
  const [colorCounts, setColorCounts] = useState<{ [key: string]: { count: number; color: string } } | null>(null);
  const [totalBeadCount, setTotalBeadCount] = useState<number>(0); // ++ 添加总数状态 ++
  // ++ 新增: Tooltip 状态 ++
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; key: string; color: string } | null>(null);
  const [remapTrigger, setRemapTrigger] = useState(0); // ++ NEW: Trigger for full remap
  const [initialGridColorKeys, setInitialGridColorKeys] = useState<Set<string> | null>(null); // ++ 新增：存储初始颜色键

  // ++ Refs for touch handling ++
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number; pageX: number; pageY: number } | null>(null);
  const touchMovedRef = useRef<boolean>(false);

  // --- Memoize the selected palette ---
  const activeBeadPalette = useMemo(() => {
    console.log(`Recalculating active palette for: ${selectedPaletteKeySet}, excluding ${excludedColorKeys.size} keys.`);
    const selectedOption = paletteOptions[selectedPaletteKeySet];
    if (!selectedOption) {
      console.error(`Invalid palette key selected: ${selectedPaletteKeySet}. Falling back to 'all'.`);
      const filteredFullPalette = fullBeadPalette.filter(color => !excludedColorKeys.has(color.key));
      return filteredFullPalette.length > 0 ? filteredFullPalette : fullBeadPalette;
    }
    const selectedKeys = selectedOption.keys;
    const keySet = new Set(selectedKeys);
    const filteredPalette = fullBeadPalette.filter(color => keySet.has(color.key));
    const t1Color = fullBeadPalette.find(p => p.key === 'T1');
    if (t1Color && !keySet.has('T1')) {
        if (!filteredPalette.some(p => p.key === 'T1')) {
             console.log("T1 was not in the base palette, but exists. It can be excluded if needed.");
        }
    } else if (!t1Color) {
         console.warn("T1 color key not found in full beadPaletteData.json.");
    }
     let finalPalette = filteredPalette.filter(color => !excludedColorKeys.has(color.key));
     if (finalPalette.length === 0 && filteredPalette.length > 0) {
         console.warn(`Palette '${selectedPaletteKeySet}' became empty after excluding colors. Falling back to the original selected set.`);
         finalPalette = filteredPalette;
     } else if (finalPalette.length === 0 && filteredPalette.length === 0) {
          console.warn(`Palette '${selectedPaletteKeySet}' was empty initially or became empty after exclusions. Falling back to all colors (minus exclusions).`);
          finalPalette = fullBeadPalette.filter(color => !excludedColorKeys.has(color.key));
          if (finalPalette.length === 0) {
              console.error("All colors including fallbacks seem to be excluded. Using the entire bead palette.");
              finalPalette = fullBeadPalette;
          }
     }
    console.log(`Active palette has ${finalPalette.length} colors after exclusions.`);
    return finalPalette;
  }, [selectedPaletteKeySet, excludedColorKeys]);

  // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExcludedColorKeys(new Set()); // ++ 重置排除列表 ++
      processFile(file);
    }
  };

  // Handle file drop
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

  // Handle drag over
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Process file
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
      setRemapTrigger(prev => prev + 1); // Trigger full remap for new image
    };
    reader.onerror = () => {
        console.error("文件读取失败");
        alert("无法读取文件。");
        setInitialGridColorKeys(null); // ++ 重置初始键 ++
    }
    reader.readAsDataURL(file);
  };

  // Handle granularity change
  const handleGranularityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newGranularity = parseInt(event.target.value, 10);
    setGranularity(newGranularity);
    setRemapTrigger(prev => prev + 1); // Trigger full remap
  };

   // Handle palette selection change
   const handlePaletteChange = (event: ChangeEvent<HTMLSelectElement>) => {
     const newKey = event.target.value as PaletteOptionKey;
     if (paletteOptions[newKey]) {
         setSelectedPaletteKeySet(newKey);
         setExcludedColorKeys(new Set()); // ++ 重置排除列表 ++
         setRemapTrigger(prev => prev + 1); // Trigger full remap
     } else {
         console.warn(`Attempted to select invalid palette key: ${newKey}. Keeping current selection.`);
     }
   };

  // ++ Add handler for similarity threshold change ++
  const handleSimilarityChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSimilarityThreshold(parseInt(event.target.value, 10));
    setRemapTrigger(prev => prev + 1); // Trigger full remap
  };

  // Core function: Pixelate the image
  const pixelateImage = (imageSrc: string, detailLevel: number, threshold: number, currentPalette: PaletteColor[]) => {
    console.log(`Attempting to pixelate with threshold: ${threshold}`);
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
                         || currentPalette[0]; // Use the first available color as fallback
    console.log("Using fallback color for empty cells:", t1FallbackColor);

    const img = new window.Image();
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

      const cellWidthOriginal = img.width / N; const cellHeightOriginal = img.height / M;
      // const cellWidthOutput = outputWidth / N; const cellHeightOutput = outputHeight / M; // ++ REMOVED unused variables ++

      console.log("Starting initial color mapping...");
      let processedCells = 0;
      const initialMappedData: { key: string; color: string }[][] = Array(M).fill(null).map(() => Array(N).fill({ key: t1FallbackColor.key, color: t1FallbackColor.hex }));

      // --- First Loop: Map Colors and Data (using DOMINANT color) ---
      for (let j = 0; j < M; j++) {
        for (let i = 0; i < N; i++) {
          const startXOriginal = Math.floor(i * cellWidthOriginal);
          const startYOriginal = Math.floor(j * cellHeightOriginal);
          const endXOriginal = Math.min(img.width, Math.ceil((i + 1) * cellWidthOriginal));
          const endYOriginal = Math.min(img.height, Math.ceil((j + 1) * cellHeightOriginal));
          const currentCellWidth = Math.max(1, endXOriginal - startXOriginal);
          const currentCellHeight = Math.max(1, endYOriginal - startYOriginal);

          if (currentCellWidth <= 0 || currentCellHeight <= 0) { continue; }

          let imageData;
          try { imageData = originalCtx.getImageData(startXOriginal, startYOriginal, currentCellWidth, currentCellHeight); }
          catch (e) { console.error(`Failed getImageData at (${i},${j}):`, e); continue; }

          const data = imageData.data;
          // ++ Use an object to count color frequencies ++
          const colorCountsInCell: { [key: string]: number } = {};
          let dominantColorRgb: { r: number; g: number; b: number } | null = null;
          let maxCount = 0;
          let totalPixelCount = 0; // Count valid pixels in the cell

          // ++ Count frequency of each color ++
          for (let p = 0; p < data.length; p += 4) {
             if (data[p + 3] < 128) continue; // Ignore transparent/semi-transparent pixels
             const r = data[p];
             const g = data[p + 1];
             const b = data[p + 2];
             const colorKey = `${r},${g},${b}`;
             colorCountsInCell[colorKey] = (colorCountsInCell[colorKey] || 0) + 1;
             totalPixelCount++;

             // ++ Keep track of the dominant color found so far ++
             if (colorCountsInCell[colorKey] > maxCount) {
               maxCount = colorCountsInCell[colorKey];
               dominantColorRgb = { r, g, b };
             }
          }

          let finalCellColorData: { key: string; color: string };
          // ++ Map based on dominant color if found, else use fallback ++
          if (totalPixelCount > 0 && dominantColorRgb) {
            const closestBead = findClosestPaletteColor(dominantColorRgb, currentPalette);
            finalCellColorData = { key: closestBead.key, color: closestBead.hex };
          } else {
             // Use fallback if cell was empty or only contained transparent pixels
             finalCellColorData = { key: t1FallbackColor.key, color: t1FallbackColor.hex };
          }

          initialMappedData[j][i] = finalCellColorData; // Store in initial data
          processedCells++;
        }
      }
      console.log(`Initial data mapping complete (using dominant cell color). Processed ${processedCells} cells. Starting region merging...`);


      // --- Region Merging Step ---
      const keyToRgbMap = new Map<string, { r: number; g: number; b: number }>();
      currentPalette.forEach(p => keyToRgbMap.set(p.key, p.rgb));
      const visited: boolean[][] = Array(M).fill(null).map(() => Array(N).fill(false));
      const mergedData: { key: string; color: string; isExternal: boolean }[][] = Array(M).fill(null).map(() => Array(N).fill({ key: t1FallbackColor.key, color: t1FallbackColor.hex, isExternal: false }));
      const similarityThresholdValue = threshold;

      for (let j = 0; j < M; j++) {
        for (let i = 0; i < N; i++) {
          if (visited[j][i]) continue;

          const startCellData = initialMappedData[j][i];
          const startRgb = keyToRgbMap.get(startCellData.key);

          if (!startRgb) {
             console.warn(`RGB not found for key ${startCellData.key} at (${j},${i}) during merging (might be excluded?). Using fallback for this cell.`);
             visited[j][i] = true;
             mergedData[j][i] = { key: t1FallbackColor.key, color: t1FallbackColor.hex, isExternal: false };
             continue; // Skip BFS starting from this invalid cell
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
                   console.warn(`RGB not found for key ${currentCellData.key} at (${r},${c}) during BFS. Skipping neighbor.`);
                   continue;
              }

              const dist = colorDistance(startRgb, currentRgb);

              if (dist < similarityThresholdValue) {
                  currentRegionCells.push({ r, c });
                  beadKeyCountsInRegion[currentCellData.key] = (beadKeyCountsInRegion[currentCellData.key] || 0) + 1;

                  const neighbors = [ { nr: r + 1, nc: c }, { nr: r - 1, nc: c }, { nr: r, nc: c + 1 }, { nr: r, nc: c - 1 } ];
                  for (const { nr, nc } of neighbors) {
                      if (nr >= 0 && nr < M && nc >= 0 && nc < N && !visited[nr][nc]) {
                          // Check similarity *before* adding to queue to prevent exploring unrelated branches that happen to be near the start cell
                          const neighborCellData = initialMappedData[nr][nc];
                          const neighborRgb = keyToRgbMap.get(neighborCellData.key);
                          if (neighborRgb && colorDistance(startRgb, neighborRgb) < similarityThresholdValue) {
                              visited[nr][nc] = true;
                              queue.push({ r: nr, c: nc });
                          }
                      }
                  }
              }
          } // End of while loop (BFS for one region)

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
              if (!dominantKey) { // Fallback if region was empty or only had issues
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
               // If the region only contained the start cell and it had issues
               mergedData[j][i] = { ...startCellData, isExternal: false };
          }
        } // End of inner loop (i)
      } // End of outer loop (j) for region merging
      console.log("Region merging complete. Starting background removal.");


      // --- Flood Fill: Mark External Background (Uses mergedData) ---
      const visitedForFloodFill: boolean[][] = Array(M).fill(null).map(() => Array(N).fill(false));
      const floodFill = (r: number, c: number) => {
          // ++ Check mergedData for background key and update its isExternal flag ++
          if (r < 0 || r >= M || c < 0 || c >= N || visitedForFloodFill[r][c] || !BACKGROUND_COLOR_KEYS.includes(mergedData[r][c].key)) {
              return;
          }
          visitedForFloodFill[r][c] = true;
          mergedData[r][c].isExternal = true; // Mark as external background in mergedData
          floodFill(r + 1, c);
          floodFill(r - 1, c);
          floodFill(r, c + 1);
          floodFill(r, c - 1);
      };

      // Start flood fill from all border cells using mergedData
      for (let i = 0; i < N; i++) {
          if (!visitedForFloodFill[0][i] && BACKGROUND_COLOR_KEYS.includes(mergedData[0][i].key)) floodFill(0, i);
          if (!visitedForFloodFill[M - 1][i] && BACKGROUND_COLOR_KEYS.includes(mergedData[M - 1][i].key)) floodFill(M - 1, i);
      }
      for (let j = 0; j < M; j++) {
          if (!visitedForFloodFill[j][0] && BACKGROUND_COLOR_KEYS.includes(mergedData[j][0].key)) floodFill(j, 0);
          if (!visitedForFloodFill[j][N - 1] && BACKGROUND_COLOR_KEYS.includes(mergedData[j][N - 1].key)) floodFill(j, N - 1);
      }
      console.log("Background flood fill marking complete.");


      // --- Second Loop: Draw Cells and Borders using mergedData ---
      // console.log("Starting final drawing loop on pixelated canvas..."); // ++ 移除日志 ++
      // pixelatedCtx.clearRect(0, 0, outputWidth, outputHeight); // Clear canvas before drawing // ++ 移除 ++
      // pixelatedCtx.lineWidth = 1; // Set line width once // ++ 移除 ++
      /* ++ 移除整个绘制循环 ++
      for (let j = 0; j < M; j++) {
          for (let i = 0; i < N; i++) {
              // ... (original drawing code) ...
          }
      }
      */
      // console.log("Final drawing loop complete."); // ++ 移除日志 ++

      // ++ 在设置状态之前调用新的绘制函数 ++
      if (pixelatedCanvasRef.current) { // ++ 添加检查 ++
        drawPixelatedCanvas(mergedData, pixelatedCanvasRef, { N, M });
      } else {
        console.error("Pixelated canvas ref is null, skipping draw call in pixelateImage.");
      }

      // Update state and counts using mergedData (excluding external)
      setMappedPixelData(mergedData);
      setGridDimensions({ N, M });

      const counts: { [key: string]: { count: number; color: string } } = {};
      let totalCount = 0; // ++ 初始化总数计数器 ++
      // ++ Iterate over mergedData for final counts ++
      mergedData.flat().forEach(cell => {
        // Only count cells that are not marked as external background
        if (cell && cell.key && !cell.isExternal) {
          if (!counts[cell.key]) {
            // Use the color from mergedData which corresponds to the dominant key
            counts[cell.key] = { count: 0, color: cell.color };
          }
          counts[cell.key].count++;
          totalCount++; // ++ 累加总数 ++
        }
      });
      setColorCounts(counts);
      setTotalBeadCount(totalCount); // ++ 更新总数状态 ++
      setInitialGridColorKeys(new Set(Object.keys(counts))); // ++ 存储初始颜色键 ++
      console.log("Color counts updated based on merged data (excluding external background):", counts);
      console.log("Total bead count (excluding background):", totalCount); // ++ 打印总数 ++
      console.log("Stored initial grid color keys:", Object.keys(counts)); // ++ 记录初始键日志 ++

    };
    img.onerror = (error: Event | string) => {
      console.error("Image loading failed:", error); alert("无法加载图片。");
      setOriginalImageSrc(null); setMappedPixelData(null); setGridDimensions(null); setColorCounts(null); setInitialGridColorKeys(null); // ++ 清空初始键 ++
    };
    console.log("Setting image source...");
    img.src = imageSrc;
  };

  // Use useEffect to trigger pixelation
  useEffect(() => {
    if (originalImageSrc && activeBeadPalette.length > 0) { // Keep activeBeadPalette check here to prevent running if empty
       const timeoutId = setTimeout(() => {
         // Add internal check for activeBeadPalette length again just before calling pixelate
         if (originalImageSrc && originalCanvasRef.current && pixelatedCanvasRef.current && activeBeadPalette.length > 0) {
           console.log("useEffect triggered: Processing image due to src, granularity, threshold, palette selection, or remap trigger.");
           pixelateImage(originalImageSrc, granularity, similarityThreshold, activeBeadPalette); // Pass activeBeadPalette here
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
    // *** REMOVED activeBeadPalette from dependency array ***
  }, [originalImageSrc, granularity, similarityThreshold, selectedPaletteKeySet, remapTrigger]); // Dependencies controlling full remap

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
              drawPixelatedCanvas(newMappedData, pixelatedCanvasRef, gridDimensions);
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
    };

  // --- Tooltip Logic ---

  // Function to calculate cell and update tooltip
  const updateTooltip = (clientX: number, clientY: number, pageX: number, pageY: number) => {
    const canvas = pixelatedCanvasRef.current;
    if (!canvas || !mappedPixelData || !gridDimensions) {
      setTooltipData(null);
      return false; // Indicate failure or no action
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
      if (cellData && !cellData.isExternal && cellData.key) {
        setTooltipData({
          x: pageX, // Use page coordinates for positioning
          y: pageY,
          key: cellData.key,
          color: cellData.color,
        });
        return true; // Indicate success
      }
    }

    setTooltipData(null); // Hide if outside bounds or on background
    return false;
  };

  // Clear any active long press timer and hide tooltip
  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
     // Also hide tooltip when clearing, e.g., on touch end or move
     // setTooltipData(null); // Let mouseLeave/touchEnd handle hiding specifically
  };

  // ++ Updated: Mouse move handler ++
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Prevent mouse events from interfering during touch interactions
    if (touchStartPosRef.current) return;
     clearLongPress(); // Clear any potential lingering timer
    updateTooltip(event.clientX, event.clientY, event.pageX, event.pageY);
  };

  // ++ Updated: Mouse leave handler ++
  const handleCanvasMouseLeave = () => {
     // Prevent mouse events from interfering during touch interactions
     if (touchStartPosRef.current) return;
    clearLongPress();
    setTooltipData(null);
  };

  // ++ 新增: Touch start handler ++
  const handleTouchStart = (event: TouchEvent<HTMLCanvasElement>) => {
    clearLongPress(); // Clear previous timer just in case
    setTooltipData(null); // Hide any existing tooltip immediately on new touch
    touchMovedRef.current = false; // Reset move flag

    const touch = event.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY, pageX: touch.pageX, pageY: touch.pageY };

    // Set timer for long press
    longPressTimerRef.current = setTimeout(() => {
       // If touch hasn't moved significantly, show tooltip at start position
      if (!touchMovedRef.current && touchStartPosRef.current) {
         updateTooltip(touchStartPosRef.current.x, touchStartPosRef.current.y, touchStartPosRef.current.pageX, touchStartPosRef.current.pageY);
      }
      longPressTimerRef.current = null; // Timer has fired
    }, 500); // 500ms delay for long press
  };

  // ++ 新增: Touch move handler ++
  const handleTouchMove = (event: TouchEvent<HTMLCanvasElement>) => {
     if (!touchStartPosRef.current) return;

     const touch = event.touches[0];
     const moveThreshold = 10; // Pixels threshold to detect movement

     // Calculate distance moved
     const dx = touch.clientX - touchStartPosRef.current.x;
     const dy = touch.clientY - touchStartPosRef.current.y;
     const distance = Math.sqrt(dx * dx + dy * dy);

     if (distance > moveThreshold) {
       touchMovedRef.current = true; // Mark as moved
       clearLongPress(); // Cancel long press if finger moves too much
       setTooltipData(null); // Hide tooltip if it was shown by long press
     }

     // Optional: Update tooltip while dragging (like mouse move)
     // if (distance > moveThreshold) { // Or maybe always update while dragging?
     //   updateTooltip(touch.clientX, touch.clientY, touch.pageX, touch.pageY);
     // }
  };

  // ++ 新增: Touch end handler ++
  const handleTouchEnd = () => {
    clearLongPress();
    // Hide tooltip only if it wasn't triggered by long press *just now*
    // If the timer is already null (meaning it fired or was cleared by move), hide tooltip.
    if (!longPressTimerRef.current) {
        // Add a small delay before hiding to allow user to see info briefly after lifting finger
        setTimeout(() => setTooltipData(null), 300);
    }
    touchStartPosRef.current = null; // Clear touch start position
    touchMovedRef.current = false;
  };

  // ++ 新增：绘制像素化 Canvas 的函数 ++
  const drawPixelatedCanvas = (
      dataToDraw: { key: string; color: string; isExternal?: boolean }[][],
      canvasRef: React.RefObject<HTMLCanvasElement | null>, // ++ 修改类型定义 ++
      dims: { N: number; M: number } | null
  ) => {
      const canvas = canvasRef.current; // canvas 现在可能是 null
      if (!canvas || !dims || dims.N <= 0 || dims.M <= 0) { // 这里的 !canvas 检查会处理 null 情况
          console.warn("无法绘制 Canvas：Ref 为 null、尺寸无效或数据未准备好。");
          // Optionally clear canvas if dimensions are invalid?
          const ctx = canvas?.getContext('2d'); // 使用 optional chaining
          if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
          return;
      }
      // 从这里开始，我们知道 canvas 不是 null
      const pixelatedCtx = canvas.getContext('2d');
      if (!pixelatedCtx) {
          console.error("无法获取 Pixelated Canvas Context。");
          return;
      }

      const { N, M } = dims;
      const outputWidth = canvas.width; // Use actual canvas size
      const outputHeight = canvas.height;
      const cellWidthOutput = outputWidth / N;
      const cellHeightOutput = outputHeight / M;

      console.log("Redrawing pixelated canvas...");
      pixelatedCtx.clearRect(0, 0, outputWidth, outputHeight); // 清除旧内容
      pixelatedCtx.lineWidth = 1; // 设置线宽

      for (let j = 0; j < M; j++) {
          for (let i = 0; i < N; i++) {
              const cellData = dataToDraw[j]?.[i]; // Use optional chaining for safety
              if (!cellData) continue; // Skip if cell data is missing

              const drawX = i * cellWidthOutput;
              const drawY = j * cellHeightOutput;

              // 填充单元格背景
              if (cellData.isExternal) {
                  pixelatedCtx.fillStyle = '#F3F4F6'; // 外部单元格的预览背景色
              } else {
                  pixelatedCtx.fillStyle = cellData.color; // 内部单元格的珠子颜色
              }
              pixelatedCtx.fillRect(drawX, drawY, cellWidthOutput, cellHeightOutput);

              // 绘制所有单元格的边框
              pixelatedCtx.strokeStyle = '#EEEEEE'; // 网格线颜色
              pixelatedCtx.strokeRect(drawX + 0.5, drawY + 0.5, cellWidthOutput, cellHeightOutput);
          }
      }
      console.log("Pixelated canvas redraw complete.");
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 flex flex-col items-center bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-4xl text-center mt-6 mb-5 sm:mt-8 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">拼豆底稿生成器</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">上传图片，选择色板，生成带色号的图纸和统计</p>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center space-y-5 sm:space-y-6 relative"> {/* 添加 relative 定位 */}
        {/* Drop Zone */}
        <div
          onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors w-full max-w-md flex flex-col justify-center items-center"
          style={{ minHeight: '130px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-2 sm:mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-xs sm:text-sm text-gray-500">拖放图片到此处，或<span className="font-medium text-blue-600">点击选择文件</span></p>
          <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG 格式</p>
        </div>

        <input type="file" accept="image/jpeg, image/png" onChange={handleFileChange} ref={fileInputRef} className="hidden" />

        {/* Controls and Output Area */}
        {originalImageSrc && (
          <div className="w-full flex flex-col items-center space-y-5 sm:space-y-6">
            {/* Control Row */}
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-3 sm:p-4 rounded-lg shadow">
               {/* Granularity Slider */}
               <div className="flex-1">
                  <label htmlFor="granularity" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                    横轴格子: <span className="font-semibold text-blue-600">{granularity}</span>
                  </label>
                  <input type="range" id="granularity" min="10" max="100" step="1" value={granularity} onChange={handleGranularityChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-0.5 px-1"><span>粗</span><span>细</span></div>
                </div>
                {/* ++ Similarity Threshold Slider ++ */}
                <div className="flex-1">
                    <label htmlFor="similarityThreshold" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                        颜色合并: <span className="font-semibold text-purple-600">{similarityThreshold}</span>
                    </label>
                    <input type="range" id="similarityThreshold" min="0" max="200" step="1" value={similarityThreshold} onChange={handleSimilarityChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                    <div className="flex justify-between text-xs text-gray-500 mt-0.5 px-1"><span>少</span><span>多</span></div>
                </div>
               {/* Palette Selector */}
               <div className="flex-1">
                 <label htmlFor="paletteSelect" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">选择色板:</label>
                 <select id="paletteSelect" value={selectedPaletteKeySet} onChange={handlePaletteChange} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 h-9"> {/* Adjust height if needed */}
                   {(Object.keys(paletteOptions) as PaletteOptionKey[]).map(key => (
                     <option key={key} value={key}>{paletteOptions[key].name}</option>
                   ))}
                 </select>
               </div>
            </div>

            {/* Output Section */}
            <div className="w-full max-w-2xl">
              <canvas ref={originalCanvasRef} className="hidden"></canvas>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-center text-gray-800">图纸预览（悬停或长按查看颜色）</h2>
                <div className="flex justify-center mb-3 sm:mb-4 bg-gray-100 p-2 rounded overflow-hidden touch-none"
                     style={{ minHeight: '150px' }}>
                  <canvas
                    ref={pixelatedCanvasRef}
                    // Mouse events
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={handleCanvasMouseLeave}
                    // Touch events
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd} // Also clear on cancel
                    className="border border-gray-300 max-w-full h-auto rounded block cursor-crosshair"
                    style={{ maxHeight: '60vh', imageRendering: 'pixelated' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ++ Combined Color Counts and Exclusion Area ++ */}
        {originalImageSrc && colorCounts && Object.keys(colorCounts).length > 0 && (
          <div className="w-full max-w-2xl mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-1 text-gray-700 text-center">
              颜色统计与排除 ({paletteOptions[selectedPaletteKeySet]?.name || '未知色板'})
            </h3>
            <p className="text-xs text-center text-gray-500 mb-3">点击下方列表中的颜色可将其从可用列表中排除/恢复。总计: {totalBeadCount} 颗</p>
            <ul className="space-y-1 max-h-60 overflow-y-auto pr-2 text-sm">
              {Object.keys(colorCounts)
                .sort(sortColorKeys)
                .map((key) => {
                  const isExcluded = excludedColorKeys.has(key);
                  const count = colorCounts[key].count;
                  const colorHex = colorCounts[key].color; // Get color from counts data

                  return (
                    <li
                      key={key}
                      onClick={() => handleToggleExcludeColor(key)}
                      className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                        isExcluded
                          ? 'bg-red-100 hover:bg-red-200 opacity-60' // Adjusted style for excluded items in this list
                          : 'hover:bg-gray-100'
                      }`}
                      title={isExcluded ? `点击恢复 ${key}` : `点击排除 ${key}`}
                    >
                      <div className={`flex items-center space-x-2 ${isExcluded ? 'line-through' : ''}`}>
                        <span
                          className="inline-block w-4 h-4 rounded border border-gray-400 flex-shrink-0"
                          style={{ backgroundColor: isExcluded ? '#cccccc' : colorHex }} // Gray out swatch if excluded
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
                         console.log("Restoring all excluded colors. Triggering full remap.");
                         setExcludedColorKeys(new Set()); // Update exclusion set first
                         setInitialGridColorKeys(null); // ++ 重置初始键 - 它们将在完全重映射后重新计算 ++
                         setRemapTrigger(prev => prev + 1); // Then trigger full remap
                    }}
                    className="mt-3 w-full text-xs py-1.5 px-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                    恢复所有排除的颜色 ({excludedColorKeys.size})
                </button>
            )}
          </div>
        )}
        {/* Message if palette becomes empty */}
         {originalImageSrc && activeBeadPalette.length === 0 && excludedColorKeys.size > 0 && (
             <div className="w-full max-w-2xl mt-6 bg-yellow-100 p-4 rounded-lg shadow text-center text-sm text-yellow-800">
                 当前可用颜色过少或为空。请在上方统计列表中点击恢复部分颜色，或更换色板。
                 {excludedColorKeys.size > 0 && (
                      <button
                          onClick={() => {
                                console.log("Restoring all excluded colors from empty message. Triggering full remap.");
                                setExcludedColorKeys(new Set());
                                setInitialGridColorKeys(null); // ++ 重置初始键 ++
                                setRemapTrigger(prev => prev + 1);
                           }}
                          className="mt-2 ml-2 text-xs py-1 px-2 bg-yellow-200 text-yellow-900 rounded hover:bg-yellow-300"
                      >
                          恢复所有 ({excludedColorKeys.size})
                      </button>
                  )}
             </div>
         )}

        {/* Download Buttons */}
        {originalImageSrc && mappedPixelData && (
            <div className="w-full max-w-2xl mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleDownloadImage}
                disabled={!mappedPixelData || !gridDimensions || gridDimensions.N === 0 || gridDimensions.M === 0 || activeBeadPalette.length === 0}
                className="flex-1 py-2 px-4 bg-green-600 text-white text-sm sm:text-base rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                下载图纸 (带色号)
              </button>
              <button
                onClick={handleDownloadStatsImage}
                disabled={!colorCounts || totalBeadCount === 0 || activeBeadPalette.length === 0}
                className="flex-1 py-2 px-4 bg-purple-600 text-white text-sm sm:text-base rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                下载数量表 (PNG)
              </button>
            </div>
        )}

         {/* Tooltip Display (remains the same) */}
         {tooltipData && (
            <div
              className="absolute bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none flex items-center space-x-1.5 z-50"
              style={{
                left: `${tooltipData.x + 15}px`,
                top: `${tooltipData.y + 15}px`,
                transform: 'translate(-50%, -100%)',
                whiteSpace: 'nowrap',
              }}
            >
               <span
                 className="inline-block w-3 h-3 rounded-sm border border-gray-400 flex-shrink-0"
                 style={{ backgroundColor: tooltipData.color }}
               ></span>
               <span className="font-mono font-semibold">{tooltipData.key}</span>
            </div>
          )}

      </main>

      <footer className="w-full max-w-4xl mt-10 mb-6 py-4 text-center text-xs sm:text-sm text-gray-500 border-t border-gray-200">
        <p>拼豆底稿生成器 &copy; {new Date().getFullYear()}</p>
        <p className="mt-1">
          <a href="https://github.com/Zippland/perler-beads.git" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">有用可以给github项目一个Star</a>
        </p>
      </footer>
    </div>
  );
}