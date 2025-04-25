'use client';

import React from 'react';

// Define the structure of the color data expected by the palette
interface ColorData {
  key: string;
  color: string;
}

interface ColorPaletteProps {
  colors: ColorData[];
  selectedColor: ColorData | null;
  onColorSelect: (colorData: ColorData) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ colors, selectedColor, onColorSelect }) => {
  if (!colors || colors.length === 0) {
    return <p className="text-xs text-center text-gray-500 py-2">当前图纸无可用颜色。</p>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2 bg-white rounded border border-blue-200">
      {colors.map((colorData) => (
        <button
          key={colorData.key}
          onClick={() => onColorSelect(colorData)}
          className={`w-8 h-8 rounded border-2 flex-shrink-0 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${
            selectedColor?.key === colorData.key
              ? 'border-black ring-2 ring-offset-1 ring-blue-400 scale-110 shadow-md' // Enhanced selected style
              : 'border-gray-300 hover:border-gray-500'
          }`}
          style={{ backgroundColor: colorData.color }}
          title={`选择 ${colorData.key} (${colorData.color})`} // Add hex to title
          aria-label={`选择颜色 ${colorData.key}`} // Accessibility
        >
          {/* Optional: Display key inside swatch if needed, adjust styles accordingly */}
          {/* <span className="text-xs font-mono mix-blend-difference text-white">{colorData.key}</span> */}
        </button>
      ))}
    </div>
  );
};

export default ColorPalette; 