import { useState } from 'react';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const CALENDAR_COLORS = [
  '#3b82f6', // blue
  '#0d9488', // teal
  '#16a34a', // green
  '#ca8a04', // yellow
  '#dc2626', // red
  '#7c3aed', // purple
  '#64748b', // slate
  '#60a5fa', // light blue
  '#2dd4bf', // light teal
  '#4ade80', // light green
  '#facc15', // light yellow
  '#fb7185', // light red
  '#a78bfa', // light purple
  '#94a3b8', // light slate
];

export function ColorPicker({ selectedColor, onColorSelect }: ColorPickerProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {CALENDAR_COLORS.map((color) => (
        <button
          key={color}
          className={`w-5 h-5 rounded-sm border-2 ${
            selectedColor === color ? 'border-gray-600' : 'border-transparent'
          } hover:scale-110 transition-transform`}
          style={{ backgroundColor: color }}
          onClick={() => onColorSelect(color)}
          aria-label={`Select color ${color}`}
        >
          {selectedColor === color && (
            <svg 
              className="w-4 h-4 text-white" 
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
} 