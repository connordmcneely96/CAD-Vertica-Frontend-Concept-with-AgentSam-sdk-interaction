import React, { useState } from "react";
import { CADPart } from "../types/cad";
import { 
  Ruler, 
  X, 
  Check, 
  RotateCcw, 
  Compass, 
  Maximize2,
  Box,
  Layers
} from "lucide-react";

interface MeasureToolModalProps {
  part: CADPart;
  onClose: () => void;
  measuredDistance: number | null;
  measurePoints: [number, number, number][];
  onClearMeasure: () => void;
}

export const MeasureToolModal: React.FC<MeasureToolModalProps> = ({
  part,
  onClose,
  measuredDistance,
  measurePoints,
  onClearMeasure,
}) => {
  const p1 = measurePoints[0];
  const p2 = measurePoints[1];

  const dx = p1 && p2 ? Math.abs(p2[0] - p1[0]) : null;
  const dy = p1 && p2 ? Math.abs(p2[1] - p1[1]) : null;
  const dz = p1 && p2 ? Math.abs(p2[2] - p1[2]) : null;

  return (
    <div className="absolute top-16 right-4 z-40 w-80 bg-[#15181E]/95 backdrop-blur-md border border-[#3182CE]/50 rounded-xl shadow-2xl overflow-hidden font-mono select-none">
      {/* Title Bar */}
      <div className="h-9 bg-[#101217] border-b border-[#282E39] px-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-white font-bold">
          <Ruler className="w-3.5 h-3.5 text-amber-400" />
          <span>SolidWorks Measure</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClearMeasure}
            className="p-1 hover:bg-[#22262F] text-[#A0AEC0] hover:text-white rounded transition-colors"
            title="Clear Current Measurement"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#22262F] text-[#A0AEC0] hover:text-white rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Measurement Metrics */}
      <div className="p-3 space-y-2.5 text-xs">
        <div className="p-2.5 bg-[#1A1D23] rounded-lg border border-[#282E39]">
          <span className="text-[10px] text-[#A0AEC0] uppercase block">Point-to-Point Distance</span>
          <div className="text-lg font-bold text-amber-300">
            {measuredDistance !== null ? `${measuredDistance.toFixed(3)} mm` : "Select two points in 3D scene"}
          </div>
        </div>

        {p1 && p2 ? (
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="p-1.5 bg-[#101217] rounded border border-[#282E39]">
              <span className="text-[9px] text-[#63B3ED] block">ΔX</span>
              <span className="text-white font-bold">{dx?.toFixed(2)} mm</span>
            </div>
            <div className="p-1.5 bg-[#101217] rounded border border-[#282E39]">
              <span className="text-[9px] text-[#63B3ED] block">ΔY</span>
              <span className="text-white font-bold">{dy?.toFixed(2)} mm</span>
            </div>
            <div className="p-1.5 bg-[#101217] rounded border border-[#282E39]">
              <span className="text-[9px] text-[#63B3ED] block">ΔZ</span>
              <span className="text-white font-bold">{dz?.toFixed(2)} mm</span>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-[#A0AEC0] italic bg-[#101217] p-2 rounded border border-[#282E39]">
            Click any vertex, edge, or face in the 3D CAD viewport to measure exact dimensions and spatial deltas.
          </div>
        )}

        {/* Selected Point Telemetry */}
        {p1 && (
          <div className="text-[10px] text-[#A0AEC0] space-y-1">
            <div className="flex justify-between">
              <span>Point 1:</span>
              <span className="text-white">({p1[0].toFixed(1)}, {p1[1].toFixed(1)}, {p1[2].toFixed(1)}) mm</span>
            </div>
            {p2 && (
              <div className="flex justify-between">
                <span>Point 2:</span>
                <span className="text-white">({p2[0].toFixed(1)}, {p2[1].toFixed(1)}, {p2[2].toFixed(1)}) mm</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
