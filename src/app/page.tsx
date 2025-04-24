'use client';

import React, { useState, useRef, ChangeEvent, DragEvent, useEffect } from 'react';
// Image component from next/image might not be strictly needed if you only use canvas and basic elements,
// but keep it if you plan to add other images later or use the SVG icon below.
// Removed unused Image import

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

// The Bead Palette (parsed from your table - ensure accuracy!)
// IMPORTANT: Corrected ZG5 hex value assuming typo. Manually verify all values.
// Added T1 (White) as it's often crucial. Add H7 (Black) if it wasn't just a mix placeholder.
const beadPaletteData: { [key: string]: string } = {
  "ZG1": "#DAABB3", "B16": "#C5ED9C", "D4": "#182A84", "F3": "#F74941", "H6": "#2F2B2F", "P17": "#FEA324",
  "ZG2": "#D6AA87", "B17": "#9BB13A", "D5": "#B843C5", "F4": "#FC283C", "H7": "#000000", "P18": "#FEB89F", // Assuming H7 mix is Black
  "ZG3": "#C1BD8D", "B18": "#E6EE49", "D6": "#AC7BDE", "F5": "#E7002F", "H8": "#E7D6DB", "P19": "#FFFEEC", // Corrected P19? was FFE0E9
  "ZG4": "#96869F", "B19": "#24B88C", "D7": "#8854B3", "F6": "#943630", "H9": "#EDEDED", "P20": "#FEBECF",
  "ZG5": "#8490A6", "B20": "#C2F0CC", "D8": "#E2D3FF", "F7": "#971937", "H10": "#EEE9EA", "P21": "#ECBEBF", // Corrected ZG5 from 8490.6
  "ZG6": "#94BFE2", "B21": "#156A6B", "D9": "#D5B9F8", "F8": "#BC0028", "H11": "#CECDD5", "P22": "#E4A89F",
  "ZG7": "#E2A9D2", "B22": "#0B3C43", "D10": "#361851", "F9": "#E2677A", "H12": "#FFF5ED", "P23": "#A56268",
  "ZG8": "#AB91C0", "B23": "#303A21", "D11": "#B9BAE1", "F10": "#8A4526", "H13": "#F5ECD2", "Q1": "#F2A5E8", // Duplicated H13 key? Using first definition.
  "A1": "#FAF4C8", "B24": "#EEFCA5", "D12": "#DE9AD4", "F11": "#5A2121", "H14": "#CFD7D3", "Q2": "#E9EC91",
  "A2": "#FFFFD5", "B25": "#4E846D", "D13": "#B90095", "F12": "#FD4E6A", "H15": "#98A6A8", "Q3": "#FFFF00",
  "A3": "#FEFF8B", "B26": "#8D7A35", "D14": "#8B279B", "F13": "#F35744", "H16": "#1D1414", "Q4": "#FFEBFA",
  "A4": "#FBED56", "B27": "#CCE1AF", "D15": "#2F1F90", "F14": "#FFA9AD", "H17": "#F1EDED", "Q5": "#76CEDE",
  "A5": "#F4D738", "B28": "#9EE5B9", "D16": "#E3E1EE", "F15": "#D30022", "H18": "#FFFDF0", "R1": "#D50D21",
  "A6": "#FEAC4C", "B29": "#C5E254", "D17": "#C4D4F6", "F16": "#FEC2A6", "H19": "#F6EFE2", "R2": "#F92F83",
  "A7": "#FE8B4C", "B30": "#E2FCB1", "D18": "#A45EC7", "F17": "#E69C79", "H20": "#949FA3", "R3": "#FD8324",
  "A8": "#FFDA45", "B31": "#B0E792", "D19": "#D8C3D7", "F18": "#D37C46", "H21": "#FFFBE1", "R4": "#F8EC31",
  "A9": "#FF995B", "B32": "#9CAB5A", "D20": "#9C32B2", "F19": "#C1444A", "H22": "#CACAD4", "R5": "#35C75B",
  "A10": "#F77C31", "C1": "#E8FFE7", "D21": "#9A009B", "F20": "#CD9391", "H23": "#9A9D94", "R6": "#238891",
  "A11": "#FFDD99", "C2": "#A9F9FC", "D22": "#333A95", "F21": "#F7B4C6", "M1": "#BCC6B8", "R7": "#19779D",
  "A12": "#FE9F72", "C3": "#A0E2FB", "D23": "#EBDAFC", "F22": "#FDC0D0", "M2": "#8AA386", "R8": "#1A60C3",
  "A13": "#FFC365", "C4": "#41CCFF", "D24": "#7786E5", "F23": "#F67E66", "M3": "#697D80", "R9": "#9A56B4",
  "A14": "#FD543D", "C5": "#01ACEB", "D25": "#494FC7", "F24": "#E698AA", "M4": "#E3D2BC", "R10": "#FFDB4C",
  "A15": "#FFF365", "C6": "#50AAF0", "D26": "#DFC2F8", "F25": "#E54B4F", "M5": "#D0CCAA", "R11": "#FFEBFA", // Duplicate Q4
  "A16": "#FFFF9F", "C7": "#3677D2", "E1": "#FDD3CC", "G1": "#FFE2CE", "M6": "#B0A782", "R12": "#D8D5CE",
  "A17": "#FFE36E", "C8": "#0F54C0", "E2": "#FEC0DF", "G2": "#FFC4AA", "M7": "#B4A497", "R13": "#55514C",
  "A18": "#FEBE7D", "C9": "#324BCA", "E3": "#FFB7E7", "G3": "#F4C3A5", "M8": "#B38281", "R14": "#9FE4DF",
  "A19": "#FD7C72", "C10": "#3EBCE2", "E4": "#E8649E", "G4": "#E1B383", "M9": "#A58767", "R15": "#77CEE9",
  "A20": "#FFD568", "C11": "#28DDDE", "E5": "#F551A2", "G5": "#EDB045", "M10": "#C5B2BC", "R16": "#3ECFCA",
  "A21": "#FFE395", "C12": "#1C334D", "E6": "#F13D74", "G6": "#E99C17", "M11": "#9F7594", "R17": "#4A867A",
  "A22": "#F4F57D", "C13": "#CDE8FF", "E7": "#C63478", "G7": "#9D5B3E", "M12": "#644749", "R18": "#7FCD9D",
  "A23": "#E6C9B7", "C14": "#D5FDFF", "E8": "#FFDBE9", "G8": "#753832", "M13": "#D19066", "R19": "#CDE55D",
  "A24": "#F7F8A2", "C15": "#22C4C6", "E9": "#E970CC", "G9": "#E6B483", "M14": "#C77362", "R20": "#E8C7B4",
  "A25": "#FFD67D", "C16": "#1557A8", "E10": "#D33793", "G10": "#D98C39", "M15": "#757D78", "R21": "#AD6F3C",
  "A26": "#FFC830", "C17": "#04D1F6", "E11": "#FCDDD2", "G11": "#E0C593", "P1": "#FCF7F8", "R22": "#6C372F",
  "B1": "#E6EE31", "C18": "#1D3344", "E12": "#F78FC3", "G12": "#FFC890", "P2": "#B0A9AC", "R23": "#FEB872",
  "B2": "#63F347", "C19": "#1887A2", "E13": "#B5006D", "G13": "#B7714A", "P3": "#AFDCAB", "R24": "#F3C1C0",
  "B3": "#9EF780", "C20": "#176DAF", "E14": "#FFD1BA", "G14": "#8D614C", "P4": "#FEA49F", "R25": "#C9675E",
  "B4": "#5DE035", "C21": "#BEDDFF", "E15": "#F8C7C9", "G15": "#FCF9E0", "P5": "#EE8C3E", "R26": "#D293BE",
  "B5": "#35E352", "C22": "#67B4BE", "E16": "#FFF3EB", "G16": "#F2D9BA", "P6": "#5FD0A7", "R27": "#EA8CB1", // Corrected P6 from 5FDOA7
  "B6": "#65E2A6", "C23": "#C8E2FF", "E17": "#FFE2EA", "G17": "#78524B", "P7": "#EB9270", "R28": "#9C87D6",
  "B7": "#3DAF80", "C24": "#7CC4FF", "E18": "#FFC7DB", "G18": "#FFE4CC", "P8": "#F0D958", "T1": "#FFFFFF", // Added T1 White
  "B8": "#1C9C4F", "C25": "#A9E5E5", "E19": "#FEBAD5", "G19": "#E07935", "P9": "#D9D9D9", "Y1": "#FD6FB4",
  "B9": "#27523A", "C26": "#3CAED8", "E20": "#D8C7D1", "G20": "#A94023", "P10": "#D9C7EA", "Y2": "#FEB481",
  "B10": "#95D3C2", "C27": "#D3DFFA", "E21": "#BD9DA1", "G21": "#B88558", "P11": "#F3ECC9", "Y3": "#D7FAA0", // Corrected Y3 from D7FAAO
  "B11": "#5D722A", "C28": "#BBCFED", "E22": "#B785A1", /*H13: "#FDFBFF", Duplicate*/ "H2": "#FEFFFF", "P12": "#E6EEF2", "Y4": "#8BDBFA",
  "B12": "#166F41", "C29": "#34488E", "E23": "#937A8D", /*H2: "#FEFFFF", Duplicate*/ "H3": "#B6B1BA", "P13": "#AACBEF", "Y5": "#E987EA",
  "B13": "#CAEB7B", "D1": "#AEB4F2", "E24": "#E1BCE8", "H4": "#89858C", "P14": "#337680",
  "B14": "#ADE946", "D2": "#858EDD", "F1": "#FD957B", "H5": "#48464E", "P15": "#668575",
  "B15": "#2E5132", "D3": "#2F54AF", "F2": "#FC3D46", /*H5: "#48464E", Duplicate*/ "P16": "#FEBF45",
};

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
          let r = 0, g = 0, b = 0, a = 0;
          let pixelCount = 0;

          // Calculate average RGBA for the cell
          for (let p = 0; p < data.length; p += 4) {
             // Option: skip fully transparent pixels if desired
             // if (data[p + 3] === 0) continue;
            r += data[p];
            g += data[p + 1];
            b += data[p + 2];
            a += data[p + 3]; // Averaging alpha channel as well
            pixelCount++;
          }

          if (pixelCount > 0) {
            r = Math.round(r / pixelCount);
            g = Math.round(g / pixelCount);
            b = Math.round(b / pixelCount);
            a = Math.round(a / pixelCount); // Calculate average alpha
            // Alternative: Force opaque: a = 255;

            const avgRgb = { r, g, b };
            // Find closest bead color
            const closestBead = findClosestPaletteColor(avgRgb, beadPalette);

            // Store mapped data
            newMappedData[j][i] = { key: closestBead.key, color: closestBead.hex };

            // 7. Draw the averaged color block onto the output canvas
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
    const column3X = 150;         // X position for Count text (adjust as needed)
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
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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