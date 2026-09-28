"use client";

import React from "react";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Deterministic decorative SVG QR code generator
 * Generates an authentic matrix pattern from the input value string.
 */
export function QrCodeSvg({ value, size = 160, className = "" }: QrCodeProps) {
  // Simple deterministic hash to populate 21x21 grid
  const gridSize = 21;
  const cells: boolean[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(false),
  );

  // Helper to mark square pattern (Finder patterns at top-left, top-right, bottom-left)
  const markFinderPattern = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          cells[r0 + r][c0 + c] = true;
        }
      }
    }
  };

  markFinderPattern(0, 0);
  markFinderPattern(0, gridSize - 7);
  markFinderPattern(gridSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  // Populate data area deterministically based on value
  let seed = 0;
  for (let i = 0; i < value.length; i++) {
    seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Skip finder corners
      const isTopLeft = r < 8 && c < 8;
      const isTopRight = r < 8 && c >= gridSize - 8;
      const isBottomLeft = r >= gridSize - 8 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!isTopLeft && !isTopRight && !isBottomLeft && !isTiming) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        cells[r][c] = seed % 3 === 0;
      }
    }
  }

  const cellSize = size / gridSize;

  return (
    <div
      className={`relative inline-block rounded-xl bg-white p-3.5 shadow-lg ${className}`}
      style={{ width: size + 28, height: size + 28 }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="block"
      >
        {cells.map((row, r) =>
          row.map((active, c) => {
            if (!active) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.1}
                height={cellSize + 0.1}
                fill="#05070d"
                rx={0.5}
              />
            );
          }),
        )}
      </svg>
      {/* Central icon badge */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-white bg-navy-950 text-[10px] font-bold text-volt shadow">
          VG
        </div>
      </div>
    </div>
  );
}
