'use client';

import React, { useState, useRef, ChangeEvent, DragEvent, useEffect, useMemo } from 'react';
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

// Placeholder for other palettes
// const palette72Keys = [...];
// etc.

const paletteOptions = {
  'all': { name: `221全实色`, keys: allPaletteKeys },
  '168': { name: '168色', keys: palette168Keys },
  '144': { name: '144色', keys: palette144Keys },
  '120': { name: '120色', keys: palette120Keys },
  '96': { name: '96色', keys: palette96Keys },
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
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const pixelatedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mappedPixelData, setMappedPixelData] = useState<{ key: string; color: string }[][] | null>(null);
  const [gridDimensions, setGridDimensions] = useState<{ N: number; M: number } | null>(null);
  const [colorCounts, setColorCounts] = useState<{ [key: string]: { count: number; color: string } } | null>(null);

  // --- Memoize the selected palette ---
  const activeBeadPalette = useMemo(() => {
    console.log(`Recalculating active palette for: ${selectedPaletteKeySet}`);
    const selectedOption = paletteOptions[selectedPaletteKeySet];
    if (!selectedOption) {
        console.error(`Invalid palette key selected: ${selectedPaletteKeySet}. Falling back to 'all'.`);
        setSelectedPaletteKeySet('all'); // Reset to default if key is invalid
        return fullBeadPalette;
    }
    const selectedKeys = selectedOption.keys;
    const keySet = new Set(selectedKeys);

    const filteredPalette = fullBeadPalette.filter(color => keySet.has(color.key));

    // Ensure T1 (white) is always included if it exists in the full data
    const t1Color = fullBeadPalette.find(p => p.key === 'T1');
    if (t1Color && !keySet.has('T1')) {
        if (!filteredPalette.some(p => p.key === 'T1')) {
            filteredPalette.push(t1Color);
            console.log("Added T1 to the active palette as it was missing.");
        }
    } else if (!t1Color) {
         console.warn("T1 color key not found in full beadPaletteData.json. Fallback for empty cells might use another white or the first palette color.");
    }


     if (filteredPalette.length === 0) {
         console.warn(`Palette '${selectedPaletteKeySet}' resulted in an empty set (even after T1 check). Falling back to all colors.`);
         return fullBeadPalette; // Fallback if still empty
     }


    console.log(`Active palette has ${filteredPalette.length} colors.`);
    return filteredPalette;
  }, [selectedPaletteKeySet]);

  // Handle file selection
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
    };
    reader.onerror = () => {
        console.error("文件读取失败");
        alert("无法读取文件。");
    }
    reader.readAsDataURL(file);
  };

  // Handle granularity change
  const handleGranularityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newGranularity = parseInt(event.target.value, 10);
    setGranularity(newGranularity);
  };

   // Handle palette selection change
   const handlePaletteChange = (event: ChangeEvent<HTMLSelectElement>) => {
     const newKey = event.target.value as PaletteOptionKey;
     // Basic validation if needed, though useMemo handles fallback
     if (paletteOptions[newKey]) {
         setSelectedPaletteKeySet(newKey);
     } else {
         console.warn(`Attempted to select invalid palette key: ${newKey}. Keeping current selection.`);
     }
   };

  // Core function: Pixelate the image
  const pixelateImage = (imageSrc: string, detailLevel: number, currentPalette: PaletteColor[]) => {
    console.log("Attempting to pixelate and map colors using selected palette...");
    const originalCanvas = originalCanvasRef.current;
    const pixelatedCanvas = pixelatedCanvasRef.current;

    if (!originalCanvas || !pixelatedCanvas) { console.error("Canvas ref(s) not available."); return; }
    const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
    const pixelatedCtx = pixelatedCanvas.getContext('2d');
    if (!originalCtx || !pixelatedCtx) { console.error("Canvas context(s) not found."); return; }
    console.log("Canvas contexts obtained.");

    if (currentPalette.length === 0) {
        console.error("Cannot pixelate: The selected color palette is empty.");
        alert("错误：选定的颜色板为空，无法处理图像。");
        return;
    }
    // Find T1 or a fallback white/transparent color IN THE CURRENT PALETTE
    // Prefer T1, then any pure white, then the first color as last resort.
    const t1FallbackColor = currentPalette.find(p => p.key === 'T1')
                         || currentPalette.find(p => p.hex.toUpperCase() === '#FFFFFF')
                         || currentPalette[0];
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
      const cellWidthOutput = outputWidth / N; const cellHeightOutput = outputHeight / M;

      pixelatedCtx.clearRect(0, 0, outputWidth, outputHeight);
      console.log("Pixelated canvas cleared. Starting cell processing...");
      let processedCells = 0;
      const newMappedData: { key: string; color: string }[][] = Array(M).fill(null).map(() => Array(N).fill({ key: t1FallbackColor.key, color: t1FallbackColor.hex }));

      for (let j = 0; j < M; j++) {
        for (let i = 0; i < N; i++) {
          const startXOriginal = Math.floor(i * cellWidthOriginal);
          const startYOriginal = Math.floor(j * cellHeightOriginal);
          const currentCellWidth = Math.max(1, Math.min(Math.ceil((i + 1) * cellWidthOriginal), img.width) - startXOriginal);
          const currentCellHeight = Math.max(1, Math.min(Math.ceil((j + 1) * cellHeightOriginal), img.height) - startYOriginal);

          if (currentCellWidth <= 0 || currentCellHeight <= 0) { continue; }

          let imageData;
          try { imageData = originalCtx.getImageData(startXOriginal, startYOriginal, currentCellWidth, currentCellHeight); }
          catch (e) { console.error(`Failed getImageData at (${i},${j}):`, e); continue; }

          const data = imageData.data;
          const colorCountsInCell: { [key: string]: number } = {};
          let dominantColorRgb: { r: number; g: number; b: number } = { r:-1, g:-1, b:-1 };
          let maxCount = 0; let pixelCount = 0;

          for (let p = 0; p < data.length; p += 4) {
             if (data[p + 3] < 128) continue;
             const r = data[p]; const g = data[p + 1]; const b = data[p + 2];
             const colorKey = `${r},${g},${b}`;
             colorCountsInCell[colorKey] = (colorCountsInCell[colorKey] || 0) + 1;
             pixelCount++;
             if (colorCountsInCell[colorKey] > maxCount) {
               maxCount = colorCountsInCell[colorKey];
               dominantColorRgb = { r, g, b };
             }
          }

          let finalCellColorData: { key: string; color: string };
          if (pixelCount > 0 && dominantColorRgb.r !== -1) {
            const closestBead = findClosestPaletteColor(dominantColorRgb, currentPalette);
            finalCellColorData = { key: closestBead.key, color: closestBead.hex };
          } else {
             finalCellColorData = { key: t1FallbackColor.key, color: t1FallbackColor.hex };
          }

          newMappedData[j][i] = finalCellColorData;
          pixelatedCtx.fillStyle = finalCellColorData.color;
          const drawX = i * cellWidthOutput; const drawY = j * cellHeightOutput;
          pixelatedCtx.fillRect(drawX, drawY, cellWidthOutput + 0.5, cellHeightOutput + 0.5);

          pixelatedCtx.strokeStyle = '#EEEEEE'; pixelatedCtx.lineWidth = 1;
          pixelatedCtx.strokeRect(drawX + 0.5, drawY + 0.5, cellWidthOutput, cellHeightOutput);
          processedCells++;
        }
      }
      setMappedPixelData(newMappedData);
      setGridDimensions({ N, M });
      console.log(`Pixelation complete: ${N}x${M} grid, processed ${processedCells} cells`);

      const counts: { [key: string]: { count: number; color: string } } = {};
      newMappedData.flat().forEach(cell => {
        if (cell && cell.key) {
          if (!counts[cell.key]) {
            counts[cell.key] = { count: 0, color: cell.color };
          }
          counts[cell.key].count++;
        }
      });
      setColorCounts(counts);
      console.log("Color counts updated:", counts);
    };
    img.onerror = (error: Event | string) => {
      console.error("Image loading failed:", error); alert("无法加载图片。");
      setOriginalImageSrc(null); setMappedPixelData(null); setGridDimensions(null); setColorCounts(null);
    };
    console.log("Setting image source...");
    img.src = imageSrc;
  };

  // Use useEffect to trigger pixelation
  useEffect(() => {
    if (originalImageSrc && activeBeadPalette.length > 0) {
       const timeoutId = setTimeout(() => {
         if (originalImageSrc && originalCanvasRef.current && pixelatedCanvasRef.current && activeBeadPalette.length > 0) {
           console.log("useEffect triggered: Processing image due to src, granularity, or palette change.");
           pixelateImage(originalImageSrc, granularity, activeBeadPalette);
         } else {
            console.warn("useEffect check failed: Refs or palette not ready.");
         }
       }, 50);
       return () => clearTimeout(timeoutId);
    }
  }, [originalImageSrc, granularity, activeBeadPalette]); // Dependency array is correct

    // --- Download function (ensure filename includes palette) ---
    const handleDownloadImage = () => {
        if (!mappedPixelData || !gridDimensions || gridDimensions.N === 0 || gridDimensions.M === 0) {
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
        console.log(`Generating download grid image: ${downloadWidth}x${downloadHeight}`);
        const fontSize = Math.max(8, Math.floor(downloadCellSize * 0.4));
        ctx.font = `bold ${fontSize}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        for (let j = 0; j < M; j++) {
            for (let i = 0; i < N; i++) {
                const cellData = mappedPixelData[j][i];
                const cellColor = cellData?.color || '#FFFFFF'; const cellKey = cellData?.key || '?';
                const drawX = i * downloadCellSize; const drawY = j * downloadCellSize;
                ctx.fillStyle = cellColor; ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);
                ctx.strokeStyle = '#DDDDDD'; ctx.lineWidth = 1;
                ctx.strokeRect(drawX + 0.5, drawY + 0.5, downloadCellSize -1, downloadCellSize - 1);
                ctx.fillStyle = getContrastColor(cellColor);
                ctx.fillText(cellKey, drawX + downloadCellSize / 2, drawY + downloadCellSize / 2);
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
        if (!colorCounts || Object.keys(colorCounts).length === 0) {
            console.error("下载统计图失败: 颜色统计数据无效。"); alert("无法下载统计图，数据未生成或无效。"); return;
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


  return (
    <div className="min-h-screen p-4 sm:p-6 flex flex-col items-center bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-4xl text-center mt-6 mb-5 sm:mt-8 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">拼豆底稿生成器</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">上传图片，选择色板，生成带色号的图纸和统计</p>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center space-y-5 sm:space-y-6">
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
            <div className="w-full max-w-md flex flex-col sm:flex-row gap-4 bg-white p-3 sm:p-4 rounded-lg shadow">
               {/* Granularity Slider */}
               <div className="flex-1">
                  <label htmlFor="granularity" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    横轴格子: <span className="font-semibold text-blue-600">{granularity}</span>
                  </label>
                  <input type="range" id="granularity" min="10" max="100" step="1" value={granularity} onChange={handleGranularityChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-1"><span>粗</span><span>细</span></div>
                </div>
               {/* Palette Selector */}
               <div className="flex-1">
                 <label htmlFor="paletteSelect" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">选择色板:</label>
                 <select id="paletteSelect" value={selectedPaletteKeySet} onChange={handlePaletteChange} className="w-full p-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                   {/* Use Object.entries for potentially better ordering control if needed later */}
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
                <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-center text-gray-800">图纸预览（下载可看色号）</h2>
                <div className="flex justify-center mb-3 sm:mb-4 bg-gray-100 p-2 rounded overflow-hidden" style={{ minHeight: '150px' }}>
                  <canvas ref={pixelatedCanvasRef} className="border border-gray-300 max-w-full h-auto rounded block" style={{ maxHeight: '60vh', imageRendering: 'pixelated' }}></canvas>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Color Counts Display */}
        {colorCounts && Object.keys(colorCounts).length > 0 && (
          <div className="w-full max-w-2xl mt-6 bg-white p-4 rounded-lg shadow">
            {/* Display selected palette name in the title */}
            <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">颜色统计 ({paletteOptions[selectedPaletteKeySet]?.name || '未知色板'})</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {Object.keys(colorCounts).sort(sortColorKeys).map((key) => (
                  <li key={key} className="flex items-center justify-between text-sm border-b border-gray-200 pb-1">
                    <div className="flex items-center space-x-2">
                      <span className="inline-block w-4 h-4 rounded border border-gray-400" style={{ backgroundColor: colorCounts[key].color }} title={`Hex: ${colorCounts[key].color}`}></span>
                      <span className="font-mono font-medium text-gray-800">{key}</span>
                    </div>
                    <span className="text-gray-600">{colorCounts[key].count} 颗</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Download Buttons */}
        {originalImageSrc && mappedPixelData && (
          <div className="w-full max-w-2xl mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
             <button onClick={handleDownloadImage} className="flex-1 py-2 px-4 bg-green-600 text-white text-sm sm:text-base rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               下载图纸 (带色号)
             </button>
             <button onClick={handleDownloadStatsImage} disabled={!colorCounts} className="flex-1 py-2 px-4 bg-purple-600 text-white text-sm sm:text-base rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
               下载数量表 (PNG)
             </button>
           </div>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-10 mb-6 py-4 text-center text-xs sm:text-sm text-gray-500 border-t border-gray-200">
        <p>拼豆底稿生成器 &copy; {new Date().getFullYear()}</p>
        <p className="mt-1">
          <a href="https://github.com/Zippland/perler-beads.git" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">在 GitHub 上查看源码</a>
        </p>
      </footer>
    </div>
  );
}