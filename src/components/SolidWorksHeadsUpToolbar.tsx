import React, { useState } from "react";
import { 
  Maximize2, 
  RotateCcw, 
  Scissors, 
  Layers, 
  Eye, 
  EyeOff, 
  Camera, 
  Download, 
  ChevronDown, 
  Crosshair, 
  Compass, 
  Box,
  Flame,
  Grid,
  Sparkles,
  Sliders,
  Check
} from "lucide-react";

interface SolidWorksHeadsUpToolbarProps {
  onZoomToFit: () => void;
  onViewPreset: (preset: "iso" | "top" | "front" | "right" | "bottom" | "left" | "back") => void;
  renderMode: "shaded" | "wireframe" | "fea_stress" | "inspection";
  onRenderModeChange: (mode: "shaded" | "wireframe" | "fea_stress" | "inspection") => void;
  sectionCutAxis: "none" | "x" | "y" | "z";
  onSectionCutChange: (axis: "none" | "x" | "y" | "z") => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  showPlanes: boolean;
  onTogglePlanes: () => void;
  showCenterOfMass: boolean;
  onToggleCenterOfMass: () => void;
  explodedProgress: number;
  onExplodedChange: (progress: number) => void;
  onCaptureSnapshot: () => void;
  onExportSTL: () => void;
}

export const SolidWorksHeadsUpToolbar: React.FC<SolidWorksHeadsUpToolbarProps> = ({
  onZoomToFit,
  onViewPreset,
  renderMode,
  onRenderModeChange,
  sectionCutAxis,
  onSectionCutChange,
  showDimensions,
  onToggleDimensions,
  showPlanes,
  onTogglePlanes,
  showCenterOfMass,
  onToggleCenterOfMass,
  explodedProgress,
  onExplodedChange,
  onCaptureSnapshot,
  onExportSTL,
}) => {
  const [showOrientationMenu, setShowOrientationMenu] = useState(false);
  const [showDisplayStyleMenu, setShowDisplayStyleMenu] = useState(false);
  const [showHideItemsMenu, setShowHideItemsMenu] = useState(false);
  const [showExplodedSlider, setShowExplodedSlider] = useState(false);

  return (
    <div className="flex items-center gap-1 p-1 bg-[#1A1D23]/95 backdrop-blur-md rounded-xl border border-[#282E39] shadow-2xl font-mono select-none pointer-events-auto">
      {/* 1. Zoom to Fit */}
      <button
        onClick={onZoomToFit}
        className="p-1.5 hover:bg-[#252A34] text-[#A0AEC0] hover:text-white rounded transition-colors"
        title="Zoom to Fit [F]"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* 2. Previous View */}
      <button
        onClick={onZoomToFit}
        className="p-1.5 hover:bg-[#252A34] text-[#A0AEC0] hover:text-white rounded transition-colors"
        title="Previous View Orientation"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      <div className="h-4 w-[1px] bg-[#282E39] mx-0.5" />

      {/* 3. Section View Toggle */}
      <div className="relative flex items-center">
        <button
          onClick={() => onSectionCutChange(sectionCutAxis === "none" ? "y" : "none")}
          className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${
            sectionCutAxis !== "none"
              ? "bg-[#3182CE] text-white shadow-sm"
              : "hover:bg-[#252A34] text-[#A0AEC0] hover:text-white"
          }`}
          title="Section View [Cut Plane]"
        >
          <Scissors className="w-4 h-4" />
        </button>

        {sectionCutAxis !== "none" && (
          <div className="flex items-center gap-0.5 ml-1 bg-[#101217] p-0.5 rounded border border-[#282E39]">
            {(["x", "y", "z"] as const).map((axis) => (
              <button
                key={axis}
                onClick={() => onSectionCutChange(axis)}
                className={`px-1.5 py-0.5 text-[10px] uppercase font-bold rounded ${
                  sectionCutAxis === axis ? "bg-[#3182CE] text-white" : "text-[#A0AEC0] hover:text-white"
                }`}
              >
                {axis}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-[1px] bg-[#282E39] mx-0.5" />

      {/* 4. View Orientation Dropdown (SolidWorks Orientation Palette) */}
      <div className="relative">
        <button
          onClick={() => {
            setShowOrientationMenu(!showOrientationMenu);
            setShowDisplayStyleMenu(false);
            setShowHideItemsMenu(false);
          }}
          className={`p-1.5 rounded flex items-center gap-0.5 transition-colors ${
            showOrientationMenu ? "bg-[#252A34] text-white" : "hover:bg-[#252A34] text-[#A0AEC0] hover:text-white"
          }`}
          title="View Orientation"
        >
          <Compass className="w-4 h-4" />
          <ChevronDown className="w-3 h-3" />
        </button>

        {showOrientationMenu && (
          <div className="absolute top-full mt-2 -left-12 w-48 bg-[#15181E] border border-[#282E39] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs">
            <span className="text-[10px] text-[#A0AEC0] uppercase font-bold block mb-1.5 px-1">
              Standard Views
            </span>
            <div className="grid grid-cols-3 gap-1 mb-2">
              <button
                onClick={() => { onViewPreset("top"); setShowOrientationMenu(false); }}
                className="py-1 bg-[#1A1D23] hover:bg-[#3182CE] text-[#EDF2F7] hover:text-white rounded text-center text-[10px] font-bold"
              >
                Top
              </button>
              <button
                onClick={() => { onViewPreset("front"); setShowOrientationMenu(false); }}
                className="py-1 bg-[#1A1D23] hover:bg-[#3182CE] text-[#EDF2F7] hover:text-white rounded text-center text-[10px] font-bold"
              >
                Front
              </button>
              <button
                onClick={() => { onViewPreset("right"); setShowOrientationMenu(false); }}
                className="py-1 bg-[#1A1D23] hover:bg-[#3182CE] text-[#EDF2F7] hover:text-white rounded text-center text-[10px] font-bold"
              >
                Right
              </button>
              <button
                onClick={() => { onViewPreset("bottom"); setShowOrientationMenu(false); }}
                className="py-1 bg-[#1A1D23] hover:bg-[#3182CE] text-[#EDF2F7] hover:text-white rounded text-center text-[10px] font-bold"
              >
                Bottom
              </button>
              <button
                onClick={() => { onViewPreset("back"); setShowOrientationMenu(false); }}
                className="py-1 bg-[#1A1D23] hover:bg-[#3182CE] text-[#EDF2F7] hover:text-white rounded text-center text-[10px] font-bold"
              >
                Back
              </button>
              <button
                onClick={() => { onViewPreset("left"); setShowOrientationMenu(false); }}
                className="py-1 bg-[#1A1D23] hover:bg-[#3182CE] text-[#EDF2F7] hover:text-white rounded text-center text-[10px] font-bold"
              >
                Left
              </button>
            </div>

            <div className="border-t border-[#282E39] pt-1.5 space-y-1">
              <button
                onClick={() => { onViewPreset("iso"); setShowOrientationMenu(false); }}
                className="w-full py-1 px-2 text-left bg-[#1A1D23] hover:bg-[#3182CE] text-white rounded text-[11px] font-bold flex justify-between items-center"
              >
                <span>Isometric (Ctrl+7)</span>
                <Box className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Display Style Dropdown */}
      <div className="relative">
        <button
          onClick={() => {
            setShowDisplayStyleMenu(!showDisplayStyleMenu);
            setShowOrientationMenu(false);
            setShowHideItemsMenu(false);
          }}
          className={`p-1.5 rounded flex items-center gap-0.5 transition-colors ${
            showDisplayStyleMenu ? "bg-[#252A34] text-white" : "hover:bg-[#252A34] text-[#A0AEC0] hover:text-white"
          }`}
          title="Display Style (Shaded With Edges, Wireframe, FEA)"
        >
          <Layers className="w-4 h-4" />
          <ChevronDown className="w-3 h-3" />
        </button>

        {showDisplayStyleMenu && (
          <div className="absolute top-full mt-2 -left-12 w-52 bg-[#15181E] border border-[#282E39] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs space-y-1">
            <button
              onClick={() => { onRenderModeChange("shaded"); setShowDisplayStyleMenu(false); }}
              className={`w-full py-1.5 px-2 rounded text-left flex items-center justify-between ${
                renderMode === "shaded" ? "bg-[#3182CE] text-white font-bold" : "text-[#A0AEC0] hover:bg-[#22262F] hover:text-white"
              }`}
            >
              <span>Shaded With Edges</span>
              {renderMode === "shaded" && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { onRenderModeChange("wireframe"); setShowDisplayStyleMenu(false); }}
              className={`w-full py-1.5 px-2 rounded text-left flex items-center justify-between ${
                renderMode === "wireframe" ? "bg-[#3182CE] text-white font-bold" : "text-[#A0AEC0] hover:bg-[#22262F] hover:text-white"
              }`}
            >
              <span>Wireframe</span>
              {renderMode === "wireframe" && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { onRenderModeChange("fea_stress"); setShowDisplayStyleMenu(false); }}
              className={`w-full py-1.5 px-2 rounded text-left flex items-center justify-between ${
                renderMode === "fea_stress" ? "bg-amber-500 text-slate-950 font-bold" : "text-amber-400 hover:bg-[#22262F]"
              }`}
            >
              <span>von Mises FEA Stress</span>
              {renderMode === "fea_stress" && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { onRenderModeChange("inspection"); setShowDisplayStyleMenu(false); }}
              className={`w-full py-1.5 px-2 rounded text-left flex items-center justify-between ${
                renderMode === "inspection" ? "bg-cyan-500 text-slate-950 font-bold" : "text-cyan-400 hover:bg-[#22262F]"
              }`}
            >
              <span>Tolerance Inspection</span>
              {renderMode === "inspection" && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* 6. Hide/Show Items (Eye menu) */}
      <div className="relative">
        <button
          onClick={() => {
            setShowHideItemsMenu(!showHideItemsMenu);
            setShowOrientationMenu(false);
            setShowDisplayStyleMenu(false);
          }}
          className={`p-1.5 rounded flex items-center gap-0.5 transition-colors ${
            showHideItemsMenu ? "bg-[#252A34] text-white" : "hover:bg-[#252A34] text-[#A0AEC0] hover:text-white"
          }`}
          title="Hide/Show Items (Planes, Dimensions, Center of Mass)"
        >
          <Eye className="w-4 h-4" />
          <ChevronDown className="w-3 h-3" />
        </button>

        {showHideItemsMenu && (
          <div className="absolute top-full mt-2 -left-16 w-56 bg-[#15181E] border border-[#282E39] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 text-xs space-y-1">
            <button
              onClick={onToggleDimensions}
              className="w-full py-1.5 px-2 rounded text-left flex items-center justify-between hover:bg-[#22262F]"
            >
              <span className={showDimensions ? "text-white font-bold" : "text-[#A0AEC0]"}>View Sketch Dimensions</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${showDimensions ? "bg-[#3182CE] text-white" : "bg-[#282E39] text-[#A0AEC0]"}`}>
                {showDimensions ? "ON" : "OFF"}
              </span>
            </button>
            <button
              onClick={onTogglePlanes}
              className="w-full py-1.5 px-2 rounded text-left flex items-center justify-between hover:bg-[#22262F]"
            >
              <span className={showPlanes ? "text-white font-bold" : "text-[#A0AEC0]"}>View Reference Planes</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${showPlanes ? "bg-[#3182CE] text-white" : "bg-[#282E39] text-[#A0AEC0]"}`}>
                {showPlanes ? "ON" : "OFF"}
              </span>
            </button>
            <button
              onClick={onToggleCenterOfMass}
              className="w-full py-1.5 px-2 rounded text-left flex items-center justify-between hover:bg-[#22262F]"
            >
              <span className={showCenterOfMass ? "text-white font-bold" : "text-[#A0AEC0]"}>View Center of Mass (COM)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${showCenterOfMass ? "bg-rose-500 text-white" : "bg-[#282E39] text-[#A0AEC0]"}`}>
                {showCenterOfMass ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="h-4 w-[1px] bg-[#282E39] mx-0.5" />

      {/* 7. Exploded View Slider Button */}
      <div className="relative">
        <button
          onClick={() => setShowExplodedSlider(!showExplodedSlider)}
          className={`px-2 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
            explodedProgress > 0 || showExplodedSlider
              ? "bg-purple-600 text-white shadow-sm"
              : "hover:bg-[#252A34] text-[#A0AEC0] hover:text-white"
          }`}
          title="SolidWorks Exploded View"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Explode</span>
        </button>

        {showExplodedSlider && (
          <div className="absolute top-full mt-2 -left-12 w-56 bg-[#15181E] border border-[#282E39] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 text-xs space-y-2">
            <div className="flex justify-between items-center text-[10px] text-[#A0AEC0]">
              <span className="font-bold text-white uppercase">Exploded Assembly</span>
              <span className="text-purple-400 font-bold">{Math.round(explodedProgress * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={explodedProgress}
              onChange={(e) => onExplodedChange(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-[9px] text-[#718096]">
              <span>Collapsed (0%)</span>
              <span>Fully Exploded (100%)</span>
            </div>
          </div>
        )}
      </div>

      <div className="h-4 w-[1px] bg-[#282E39] mx-0.5" />

      {/* 8. Snapshot */}
      <button
        onClick={onCaptureSnapshot}
        className="p-1.5 hover:bg-[#252A34] text-[#A0AEC0] hover:text-white rounded transition-colors"
        title="Capture High-Res Viewport Snapshot"
      >
        <Camera className="w-4 h-4" />
      </button>

      {/* 9. STL Export */}
      <button
        onClick={onExportSTL}
        className="px-2 py-1 bg-[#3182CE] hover:bg-[#2B6CB0] text-white rounded text-[10px] font-bold transition-colors flex items-center gap-1 shadow-sm"
        title="Export ASCII STL for 3D Printing / CAM"
      >
        <Download className="w-3 h-3" />
        <span>STL</span>
      </button>
    </div>
  );
};
