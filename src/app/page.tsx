'use client';

import React, { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
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

// Pre-process the palette for easier use
const beadPalette: PaletteColor[] = Object.entries(beadPaletteData)
  .map(([key, hex]) => {
    const rgb = hexToRgb(hex);
    // Filter out invalid hex codes during processing
    if (!rgb) {
      console.warn(`Invalid hex code "${hex}" for key "${key}". Skipping.`);
      return null;
    }
    return { key, hex, rgb };
  })
  .filter((color): color is PaletteColor => color !== null); // Type guard to remove nulls

// Helper function to find the closest color in the palette
function findClosestPaletteColor(
    avgRgb: { r: number; g: number; b: number },
    palette: PaletteColor[]
): PaletteColor {
    let minDistance = Infinity;
    let closestColor = palette[0]; // Default to the first color

    if (!closestColor) {
        // Handle case where palette might be empty after filtering
        // Return a default or throw an error
        console.error("Bead palette is empty or invalid!");
        // Returning a dummy black color to prevent crashes downstream
        return { key: 'ERR', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } };
    }

    for (const paletteColor of palette) {
        const distance = colorDistance(avgRgb, paletteColor.rgb);
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = paletteColor;
        }
        // Optimization: if distance is 0, we found an exact match
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
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const pixelatedCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 新增状态：存储映射后的像素数据 { key: string, color: string (hex) }
  const [mappedPixelData, setMappedPixelData] = useState<{ key: string; color: string }[][] | null>(null);
  const [gridDimensions, setGridDimensions] = useState<{ N: number; M: number } | null>(null);
  const [colorCounts, setColorCounts] = useState<{ [key: string]: { count: number; color: string } } | null>(null);

  // Handle file selection via input click
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

  // Handle drag over event
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation(); // Necessary to allow dropping
  };

  // Process the selected/dropped file
  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImageSrc(result);
      setMappedPixelData(null); // Clear mapped data on new file
      setGridDimensions(null);
    };
    reader.onerror = () => {
        console.error("文件读取失败");
        alert("无法读取文件。");
    }
    reader.readAsDataURL(file);
  };

  // Handle granularity slider change
  const handleGranularityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newGranularity = parseInt(event.target.value, 10);
    setGranularity(newGranularity);
  };

  // Core function: Pixelate the image
  const pixelateImage = (imageSrc: string, detailLevel: number) => {
    console.log("Attempting to pixelate and map colors...");
    const originalCanvas = originalCanvasRef.current;
    const pixelatedCanvas = pixelatedCanvasRef.current;

    // Enhanced checks for refs
    if (!originalCanvas) {
      console.error("Original canvas ref is not available.");
      return;
    }
    if (!pixelatedCanvas) {
      console.error("Pixelated canvas ref is not available.");
      return;
    }

    const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
    const pixelatedCtx = pixelatedCanvas.getContext('2d');

    // Enhanced checks for contexts
    if (!originalCtx) {
        console.error("Original canvas context not found.");
        return;
    }
    if (!pixelatedCtx) {
        console.error("Pixelated canvas context not found.");
        return;
    }
    console.log("Canvas contexts obtained.");

    const img = new window.Image(); // Use window.Image for clarity in browser environment
    img.onload = () => {
      console.log("Image loaded successfully.");
      // 1. Determine grid dimensions (N x M)
      const aspectRatio = img.height / img.width;
      const N = detailLevel; // Number of cells horizontally
      const M = Math.max(1, Math.round(N * aspectRatio)); // Number of cells vertically, ensure at least 1

      if (N <= 0 || M <= 0) {
        console.error("Invalid grid dimensions calculated:", { N, M });
        return;
      }
      console.log(`Grid size calculated: ${N}x${M}`);

      // 2. Set Canvas dimensions
      // Output size can be fixed or dynamic. Fixed makes UI predictable.
      const outputWidth = 500; // Example fixed output width
      const outputHeight = Math.round(outputWidth * aspectRatio);
      originalCanvas.width = img.width; // Use original size for accurate color sampling
      originalCanvas.height = img.height;
      pixelatedCanvas.width = outputWidth;
      pixelatedCanvas.height = outputHeight;
      console.log(`Canvas dimensions set: Original ${img.width}x${img.height}, Output ${outputWidth}x${outputHeight}`);

      // 3. Draw original image onto the hidden canvas for pixel reading
      originalCtx.drawImage(img, 0, 0, img.width, img.height);
      console.log("Original image drawn on hidden canvas.");

      // 4. Calculate cell dimensions in the original image coordinate system
      const cellWidthOriginal = img.width / N;
      const cellHeightOriginal = img.height / M;

      // 5. Calculate cell dimensions in the output canvas coordinate system
      const cellWidthOutput = outputWidth / N;
      const cellHeightOutput = outputHeight / M;

      // 6. Iterate through each cell, calculate average color, and draw
      pixelatedCtx.clearRect(0, 0, outputWidth, outputHeight); // Clear previous result
      console.log("Pixelated canvas cleared. Starting cell processing...");

      let processedCells = 0;
      // 创建一个新的二维数组来存储颜色
      const newMappedData: { key: string; color: string }[][] = Array(M).fill(null).map(() => Array(N).fill({ key: '?', color: '#FFFFFF' }));

      for (let j = 0; j < M; j++) { // Rows (y)
        for (let i = 0; i < N; i++) { // Columns (x)
          // Calculate the pixel region in the original image for the current cell
          const startXOriginal = Math.floor(i * cellWidthOriginal);
          const startYOriginal = Math.floor(j * cellHeightOriginal);
          // Use Math.ceil for end coordinates and clamp to image bounds to avoid errors
          // Ensure width/height are at least 1 pixel to avoid getImageData errors
          const currentCellWidth = Math.max(1, Math.min(Math.ceil((i + 1) * cellWidthOriginal), img.width) - startXOriginal);
          const currentCellHeight = Math.max(1, Math.min(Math.ceil((j + 1) * cellHeightOriginal), img.height) - startYOriginal);

          if (currentCellWidth <= 0 || currentCellHeight <= 0) {
              console.warn(`Skipping invalid cell at (${i},${j}) with dimensions ${currentCellWidth}x${currentCellHeight}`);
              continue; // Skip empty or invalid cells
          }

          let imageData;
          try {
            // Get pixel data for the current cell from the hidden canvas
            imageData = originalCtx.getImageData(startXOriginal, startYOriginal, currentCellWidth, currentCellHeight);
          } catch (e) {
            console.error(`Failed to getImageData for cell (${i},${j}):`, e, { startXOriginal, startYOriginal, currentCellWidth, currentCellHeight, imgWidth: img.width, imgHeight: img.height });
            continue; // Skip this cell if data cannot be retrieved
          }

          const data = imageData.data;
          // ---- MODIFIED: Calculate dominant color instead of average ----
          const colorCountsInCell: { [key: string]: number } = {};
          let dominantColorRgb: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 }; // Default to white if no pixels
          let maxCount = 0;
          let pixelCount = 0;

          for (let p = 0; p < data.length; p += 4) {
            // Option: Skip fully transparent pixels if needed (alpha = data[p + 3])
            // if (data[p + 3] < 128) continue; // Example threshold

            const r = data[p];
            const g = data[p + 1];
            const b = data[p + 2];
            const colorKey = `${r},${g},${b}`; // Use RGB string as key

            colorCountsInCell[colorKey] = (colorCountsInCell[colorKey] || 0) + 1;
            pixelCount++;

            if (colorCountsInCell[colorKey] > maxCount) {
              maxCount = colorCountsInCell[colorKey];
              dominantColorRgb = { r, g, b };
            }
          }
          // ---- END MODIFICATION ----

          if (pixelCount > 0) {
            // Use the dominant color found
            const targetRgb = dominantColorRgb;

            // Find closest bead color to the dominant color
            const closestBead = findClosestPaletteColor(targetRgb, beadPalette);

            // Store mapped data
            newMappedData[j][i] = { key: closestBead.key, color: closestBead.hex };

            // 7. Draw the closest bead color block onto the output canvas
            pixelatedCtx.fillStyle = closestBead.hex;
            const drawX = i * cellWidthOutput;
            const drawY = j * cellHeightOutput;
            pixelatedCtx.fillRect(drawX, drawY, cellWidthOutput + 0.5, cellHeightOutput + 0.5);

            // --- ADD GRID LINES FOR PREVIEW ---
            pixelatedCtx.strokeStyle = '#EEEEEE'; // Very light gray for preview grid
            pixelatedCtx.lineWidth = 1;
            // Offset by 0.5 for crisp 1px lines
            pixelatedCtx.strokeRect(drawX + 0.5, drawY + 0.5, cellWidthOutput, cellHeightOutput);
            // --- END ADD GRID LINES ---

            processedCells++;
          } else {
             // Handle case of fully transparent cell (draw as white/transparent?)
             // Define a fallback structure consistent with mappedPixelData state
             const fallbackColorData = { key: 'T1', color: '#FFFFFF' };
             // Find the actual T1 color from the palette if it exists
             const t1PaletteColor = beadPalette.find(p => p.key === 'T1');
             // Use T1 if found, otherwise use the fallback. Ensure structure has .key and .color
             const defaultColor = t1PaletteColor
                 ? { key: t1PaletteColor.key, color: t1PaletteColor.hex }
                 : fallbackColorData;

             newMappedData[j][i] = { key: defaultColor.key, color: defaultColor.color };
             pixelatedCtx.fillStyle = defaultColor.color;
             const drawX = i * cellWidthOutput;
             const drawY = j * cellHeightOutput;
             pixelatedCtx.fillRect(drawX, drawY, cellWidthOutput + 0.5, cellHeightOutput + 0.5);
             // --- ADD GRID LINES FOR DEFAULT CELLS IN PREVIEW ---
             pixelatedCtx.strokeStyle = '#EEEEEE'; // Very light gray
             pixelatedCtx.lineWidth = 1;
             pixelatedCtx.strokeRect(drawX + 0.5, drawY + 0.5, cellWidthOutput, cellHeightOutput);
             // --- END ADD GRID LINES ---
          }
        }
      }
      // 更新颜色网格状态
      setMappedPixelData(newMappedData);
      setGridDimensions({ N, M }); // 存储网格尺寸
      console.log(`Pixelation complete: ${N}x${M} grid, processed ${processedCells} cells`);

      // --- Add Color Count Logic ---
      const counts: { [key: string]: { count: number; color: string } } = {};
      newMappedData.flat().forEach(cell => {
        if (cell && cell.key) { // Ensure cell and key exist
          if (!counts[cell.key]) {
            counts[cell.key] = { count: 0, color: cell.color };
          }
          counts[cell.key].count++;
        }
      });
      setColorCounts(counts); // Update the state with the calculated counts
      console.log("Color counts updated:", counts);
      // --- End Color Count Logic ---
    };
    img.onerror = (error: Event | string) => {
      console.error("Image loading failed:", error);
      alert("无法加载图片，请检查文件格式或网络连接。");
      setOriginalImageSrc(null); // Reset state on error
      setMappedPixelData(null);
      setGridDimensions(null);
    };
    console.log("Setting image source...");
    img.src = imageSrc; // Start loading the image
  };

  // Use useEffect to trigger pixelation when image or granularity changes
  useEffect(() => {
    if (originalImageSrc) {
      // Ensure canvas refs are available before proceeding
      if (originalCanvasRef.current && pixelatedCanvasRef.current) {
        console.log("useEffect triggered: Processing image due to src or granularity change.");
        pixelateImage(originalImageSrc, granularity);
      } else {
        // This case should be rare after initial mount, log it if it happens.
        console.warn("useEffect triggered, but canvas refs are not ready yet. Pixelation might be delayed.");
        // Consider a small delay/retry if this proves problematic, but usually unnecessary.
         const timeoutId = setTimeout(() => {
           if (originalImageSrc && originalCanvasRef.current && pixelatedCanvasRef.current) {
             console.log("Retrying pixelation after short delay.");
             pixelateImage(originalImageSrc, granularity);
           }
         }, 100); // 100ms delay
         return () => clearTimeout(timeoutId); // Cleanup timeout on unmount or change
      }
    }
  }, [originalImageSrc, granularity]); // Dependencies: run when image or granularity changes

  // Download function
  const handleDownloadImage = () => {
    if (!mappedPixelData || !gridDimensions || gridDimensions.N === 0 || gridDimensions.M === 0) {
        console.error("下载失败: 映射数据或尺寸无效。");
        alert("无法下载图纸，数据未生成或无效。");
        return;
    }
    const { N, M } = gridDimensions;
    const downloadCellSize = 30; // 每个格子在下载图片中的像素边长 (调大以容纳文字)
    const downloadWidth = N * downloadCellSize;
    const downloadHeight = M * downloadCellSize;
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = downloadWidth;
    downloadCanvas.height = downloadHeight;
    const ctx = downloadCanvas.getContext('2d');

    if (!ctx) {
      console.error("下载失败: 无法创建临时 Canvas Context。");
      alert("无法下载图纸。");
      return;
    }

    ctx.imageSmoothingEnabled = false; // 保证边缘清晰

    console.log(`Generating download grid image: ${downloadWidth}x${downloadHeight} (Cell Size: ${downloadCellSize}px)`);

    // 设置字体样式 (稍后会用到)
    const fontSize = Math.max(8, Math.floor(downloadCellSize * 0.4)); // 动态计算字体大小，最小8px
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 遍历映射数据，绘制每个格子和 Key
    for (let j = 0; j < M; j++) {
        for (let i = 0; i < N; i++) {
            const cellData = mappedPixelData[j][i];
            const cellColor = cellData?.color || '#FFFFFF'; // 默认为白色
            const cellKey = cellData?.key || '?'; // 默认为 '?'

            const drawX = i * downloadCellSize;
            const drawY = j * downloadCellSize;

            // 1. 绘制背景色块
            ctx.fillStyle = cellColor;
            ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);

            // 2. 绘制边框 (浅灰色) - 可选
            ctx.strokeStyle = '#DDDDDD'; // 浅灰色边框
            ctx.lineWidth = 1; // 1像素宽
            ctx.strokeRect(drawX + 0.5, drawY + 0.5, downloadCellSize -1, downloadCellSize - 1); // 偏移0.5px使线宽为1px

            // 3. 绘制 Key 文字
            ctx.fillStyle = getContrastColor(cellColor); // 获取对比色
            ctx.fillText(cellKey, drawX + downloadCellSize / 2, drawY + downloadCellSize / 2);
        }
    }

    // 生成并下载图片
    try {
        const dataURL = downloadCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        // 更新文件名以反映内容
        link.download = `bead-grid-${N}x${M}-keys.png`;
        link.href = dataURL;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        console.log("Grid image with keys download initiated.");
    } catch (e) {
        console.error("下载图纸失败:", e); alert("无法生成图纸下载链接。");
    }
  };

  // Function to handle downloading color statistics as an IMAGE (PNG)
  const handleDownloadStatsImage = () => {
    // Check if colorCounts data is available
    if (!colorCounts || Object.keys(colorCounts).length === 0) {
      console.error("下载统计图失败: 颜色统计数据无效。");
      alert("无法下载统计图，数据未生成或无效。");
      return;
    }

    // --- Canvas Drawing Settings ---
    const sortedKeys = Object.keys(colorCounts).sort(sortColorKeys);
    const rowHeight = 25;         // Height of each row in pixels
    const padding = 10;          // Padding around the table
    const swatchSize = 18;       // Size of the color swatch square
    const textOffsetY = rowHeight / 2; // Vertical center alignment for text
    const column1X = padding;       // X position for swatch
    const column2X = padding + swatchSize + 10; // X position for Key text
    const canvasWidth = 250;       // Width of the canvas (adjust as needed)
    const canvasHeight = (sortedKeys.length * rowHeight) + (2 * padding); // Calculate total height

    // --- Create Canvas and Context ---
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error("下载失败: 无法创建 Canvas Context。");
      alert("无法生成统计图。");
      return;
    }

    // --- Draw Background ---
    ctx.fillStyle = '#FFFFFF'; // White background
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // --- Draw Header (Optional) ---
    // ctx.fillStyle = '#333333';
    // ctx.font = 'bold 14px sans-serif';
    // ctx.textAlign = 'center';
    // ctx.fillText('颜色统计', canvasWidth / 2, padding + textOffsetY - (rowHeight / 2)); // Adjust position if header added

    // --- Draw Table Rows ---
    ctx.font = '13px sans-serif'; // Font for table content
    ctx.textBaseline = 'middle'; // Align text vertically

    sortedKeys.forEach((key, index) => {
      const yPos = padding + (index * rowHeight); // Top position of the current row
      const cellData = colorCounts[key];

      // 1. Draw Color Swatch
      ctx.fillStyle = cellData.color;
      ctx.strokeStyle = '#CCCCCC'; // Light gray border for swatch
      ctx.lineWidth = 1;
      ctx.fillRect(column1X, yPos + (rowHeight - swatchSize) / 2, swatchSize, swatchSize);
      ctx.strokeRect(column1X + 0.5, yPos + (rowHeight - swatchSize) / 2 + 0.5, swatchSize-1, swatchSize-1); // Inset border slightly

      // 2. Draw Key Text
      ctx.fillStyle = '#333333'; // Dark gray text
      ctx.textAlign = 'left';
      ctx.fillText(key, column2X, yPos + textOffsetY);

      // 3. Draw Count Text
      ctx.textAlign = 'right'; // Align count to the right
      ctx.fillText(`${cellData.count} 颗`, canvasWidth - padding, yPos + textOffsetY); // Draw count near the right edge
    });

    // --- Generate and Download Image ---
    try {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `bead-stats.png`; // Set the filename
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Statistics image download initiated.");
    } catch (e) {
      console.error("下载统计图失败:", e);
      alert("无法生成统计图下载链接。");
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 flex flex-col items-center bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full max-w-4xl text-center mt-6 mb-5 sm:mt-8 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">拼豆底稿生成器</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">上传图片，生成带Mard色号的图纸和JSON</p>
      </header>

      <main className="w-full max-w-4xl flex flex-col items-center space-y-5 sm:space-y-6">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver} // Optional: Add visual feedback on drag enter
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

        <input
          type="file"
          accept="image/jpeg, image/png"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
        />

        {/* Controls and Output Area - Shown only after image upload */}
        {originalImageSrc && (
          <div className="w-full flex flex-col items-center space-y-5 sm:space-y-6">
            {/* Granularity Slider */}
            <div className="w-full max-w-md bg-white p-3 sm:p-4 rounded-lg shadow">
              <label htmlFor="granularity" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                横轴格子数量: <span className="font-semibold text-blue-600">{granularity}</span>
              </label>
              <input
                type="range"
                id="granularity"
                min="10"  // Min grid width
                max="100" // Max grid width
                step="1"  // Adjust step as needed
                value={granularity}
                onChange={handleGranularityChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" // Style for modern browsers
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                <span>粗糙</span>
                <span>精细</span>
              </div>
            </div>

            {/* Output Section */}
            <div className="w-full max-w-2xl">
              {/* Hidden Canvas for original image sampling */}
              <canvas ref={originalCanvasRef} className="hidden"></canvas>

              {/* Visible Canvas for pixelated result */}
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-center text-gray-800">图纸预览（下载可看色号）</h2>
                {/* Container to center canvas and provide background */}
                <div className="flex justify-center mb-3 sm:mb-4 bg-gray-100 p-2 rounded overflow-hidden" style={{ minHeight: '150px' }}>
                  <canvas
                    ref={pixelatedCanvasRef}
                    className="border border-gray-300 max-w-full h-auto rounded block" // Use block to prevent extra space below canvas
                    style={{
                      maxHeight: '60vh', // Limit height for large aspect ratios
                      imageRendering: 'pixelated', // Crucial for sharp pixels
                     // background: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'10\'><rect width=\'5\' height=\'5\' style=\'fill:rgb(200,200,200)\'/><rect x=\'5\' y=\'5\' width=\'5\' height=\'5\' style=\'fill:rgb(200,200,200)\'/></svg>")' // Optional checkerboard background
                    }}
                  ></canvas>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Color Counts Display Area */}
        {colorCounts && Object.keys(colorCounts).length > 0 && (
          <div className="w-full max-w-2xl mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 text-center">颜色统计</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2"> {/* Added max height and scroll */}
              {Object.keys(colorCounts)
                .sort(sortColorKeys) // Use the custom sort function
                .map((key) => (
                  <li key={key} className="flex items-center justify-between text-sm border-b border-gray-200 pb-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className="inline-block w-4 h-4 rounded border border-gray-400"
                        style={{ backgroundColor: colorCounts[key].color }}
                        title={`Hex: ${colorCounts[key].color}`} // Add tooltip for hex color
                      ></span>
                      <span className="font-mono font-medium text-gray-800">{key}</span>
                    </div>
                    <span className="text-gray-600">{colorCounts[key].count} 颗</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Download Buttons Container - Moved Here */}
        {originalImageSrc && ( // Keep the condition to only show buttons when there's an image
          <div className="w-full max-w-2xl mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
             <button
               onClick={handleDownloadImage}
               disabled={!mappedPixelData}
               className="flex-1 py-2 px-4 bg-green-600 text-white text-sm sm:text-base rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               下载图纸 (带色号)
             </button>
             <button
               onClick={handleDownloadStatsImage}
               disabled={!colorCounts}
               className="flex-1 py-2 px-4 bg-purple-600 text-white text-sm sm:text-base rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               下载数量表（PNG）
             </button>
           </div>
        )}
      </main>

      <footer className="w-full max-w-4xl mt-10 mb-6 py-4 text-center text-xs sm:text-sm text-gray-500 border-t border-gray-200">
        <p>拼豆底稿生成器 &copy; {new Date().getFullYear()}</p>
        {/* Optional: Add link to source code or your website */}
        <p className="mt-1">
          <a href="https://github.com/Zippland/perler-beads.git" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
            在 GitHub 上查看源码
          </a>
        </p>
      </footer>
    </div>
  );
}