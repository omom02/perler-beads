'use client';

import React, { useRef, useEffect, TouchEvent, MouseEvent, useState } from 'react';
import { MappedPixel } from '../utils/pixelation';

interface PixelatedPreviewCanvasProps {
  mappedPixelData: MappedPixel[][] | null;
  gridDimensions: { N: number; M: number } | null;
  isManualColoringMode: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onInteraction: (
    clientX: number,
    clientY: number,
    pageX: number,
    pageY: number,
    isClick: boolean,
    isTouchEnd?: boolean
  ) => void;
}

// 绘制像素化画布的函数
const drawPixelatedCanvas = (
  dataToDraw: MappedPixel[][],
  canvas: HTMLCanvasElement | null,
  dims: { N: number; M: number } | null
) => {
  if (!canvas || !dims || dims.N <= 0 || dims.M <= 0) {
    console.warn("无法绘制Canvas：参数无效或数据未准备好");
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  
  const pixelatedCtx = canvas.getContext('2d');
  if (!pixelatedCtx) {
    console.error("无法获取Canvas绘图上下文");
    return;
  }

  // Check if dark mode is active on the HTML element
  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  // Define colors based on mode
  const externalBackgroundColor = isDarkMode ? '#374151' : '#F3F4F6'; // gray-700 : gray-100
  const gridLineColor = isDarkMode ? '#4B5563' : '#DDDDDD'; // gray-600 : lighter gray

  const { N, M } = dims;
  const outputWidth = canvas.width;
  const outputHeight = canvas.height;
  const cellWidthOutput = outputWidth / N;
  const cellHeightOutput = outputHeight / M;

  pixelatedCtx.clearRect(0, 0, outputWidth, outputHeight);
  pixelatedCtx.lineWidth = 0.5; // Keep line width thin

  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const cellData = dataToDraw[j]?.[i];
      if (!cellData) continue;

      const drawX = i * cellWidthOutput;
      const drawY = j * cellHeightOutput;

      // Fill cell color using mode-specific background for external cells
      if (cellData.isExternal) {
        pixelatedCtx.fillStyle = externalBackgroundColor;
      } else {
        pixelatedCtx.fillStyle = cellData.color;
      }
      pixelatedCtx.fillRect(drawX, drawY, cellWidthOutput, cellHeightOutput);

      // Draw grid lines using mode-specific color
      pixelatedCtx.strokeStyle = gridLineColor;
      pixelatedCtx.strokeRect(drawX + 0.5, drawY + 0.5, cellWidthOutput, cellHeightOutput);
    }
  }
};

const PixelatedPreviewCanvas: React.FC<PixelatedPreviewCanvasProps> = ({
  mappedPixelData,
  gridDimensions,
  isManualColoringMode,
  canvasRef,
  onInteraction,
}) => {
  // Add a state to trigger redraw when dark mode changes
  const [darkModeState, setDarkModeState] = useState<boolean | null>(null);

  // Effect to detect dark mode changes and update state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDarkMode = () => {
        const isDark = document.documentElement.classList.contains('dark');
        // Only update state if it actually changes
        if (isDark !== darkModeState) {
            setDarkModeState(isDark);
        }
    };

    // Initial check
    checkDarkMode();

    // Use MutationObserver to watch for class changes on <html>
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Cleanup observer on component unmount
    return () => observer.disconnect();

  }, [darkModeState]); // Depend on darkModeState to re-run if needed externally

  // Update useEffect for drawing to depend on darkModeState as well
  useEffect(() => {
    // Ensure darkModeState is not null before drawing
    if (mappedPixelData && gridDimensions && canvasRef.current && darkModeState !== null) {
      console.log(`Redrawing canvas, dark mode: ${darkModeState}`); // Log redraw trigger
      drawPixelatedCanvas(mappedPixelData, canvasRef.current, gridDimensions);
    }
  }, [mappedPixelData, gridDimensions, canvasRef, darkModeState]); // Add darkModeState dependency

  // --- 鼠标事件处理 ---
  
  // 鼠标移动时显示提示
  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    onInteraction(event.clientX, event.clientY, event.pageX, event.pageY, false);
  };

  // 鼠标离开时隐藏提示
  const handleMouseLeave = () => {
    onInteraction(0, 0, 0, 0, false, true);
  };

  // 鼠标点击处理（用于手动上色模式）
  const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (isManualColoringMode) {
      onInteraction(event.clientX, event.clientY, event.pageX, event.pageY, true);
    } else {
      // 在非手动上色模式下，鼠标点击也会切换 Tooltip 的显示状态
      // 主要用于笔记本电脑或带鼠标的平板，主要显示/隐藏逻辑在 page.tsx 处理
      onInteraction(event.clientX, event.clientY, event.pageX, event.pageY, false);
    }
  };

  // --- 触摸事件处理 ---
  // 用于检测触摸移动的参考
  const touchStartPosRef = useRef<{ x: number; y: number; pageX: number; pageY: number } | null>(null);
  const touchMovedRef = useRef<boolean>(false);
  
  // 触摸开始时立即显示提示，无需长按
  const handleTouchStart = (event: TouchEvent<HTMLCanvasElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    
    // 记录起始位置以检测移动
    touchStartPosRef.current = { 
      x: touch.clientX, 
      y: touch.clientY, 
      pageX: touch.pageX, 
      pageY: touch.pageY 
    };
    touchMovedRef.current = false;
    
    // 如果是手动上色模式，立即执行上色操作
    if (isManualColoringMode) {
      onInteraction(touch.clientX, touch.clientY, touch.pageX, touch.pageY, true);
    } else {
      // 如果不是手动上色模式，触发交互以显示/隐藏提示
      // 参数 isClick = false 仅表示这是 Tooltip 相关交互，非着色操作
      // 实际的显示/隐藏/切换逻辑放在 page.tsx 的 handleCanvasInteraction 处理
      onInteraction(touch.clientX, touch.clientY, touch.pageX, touch.pageY, false);
    }
  };
  
  // 触摸移动时检测是否需要隐藏提示
  const handleTouchMove = (event: TouchEvent<HTMLCanvasElement>) => {
    const touch = event.touches[0];
    if (!touch || !touchStartPosRef.current) return;
    
    // 检测触摸是否移动了足够的距离
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    
    if (dx > 5 || dy > 5) {
      touchMovedRef.current = true;
      // 如果移动了，隐藏提示
      onInteraction(0, 0, 0, 0, false, true);
    }
  };
  
  // 触摸结束时不再自动隐藏提示框
  const handleTouchEnd = () => {
    // 不再隐藏提示框，让用户可以查看提示内容
    // 只重置触摸状态
    touchStartPosRef.current = null;
    touchMovedRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`border border-gray-300 dark:border-gray-600 max-w-full h-auto rounded block ${
        isManualColoringMode ? 'cursor-pointer' : 'cursor-crosshair'
      }`}
      style={{ 
        imageRendering: 'pixelated', 
        touchAction: 'none' // 防止触摸时页面滚动
      }}
    />
  );
};

export default PixelatedPreviewCanvas; 