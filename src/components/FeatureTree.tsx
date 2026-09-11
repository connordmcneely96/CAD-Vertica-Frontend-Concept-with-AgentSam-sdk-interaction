import React, { useState } from "react";
import { CADPart, CADPrimitive, MaterialData } from "../types/cad";
import { ENGINEERING_MATERIALS } from "../data/materials";
import { 
  FolderTree, 
  Box, 
  CircleDot, 
  Settings2, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Layers, 
  Scale, 
  Cpu, 
  Sparkles,
  ShieldCheck,
  RotateCw,
  Scissors,
  Pencil
} from "lucide-react";

interface FeatureTreeProps {
  part: CADPart;
  selectedPrimitiveId: string | null;
  onSelectPrimitive: (id: string | null) => void;
  onUpdatePart: (updatedPart: CADPart) => void;
  rollbackIndex?: number;
  onRollbackChange?: (index: number) => void;
}

export const FeatureTree: React.FC<FeatureTreeProps> = ({
  part,
  selectedPrimitiveId,
  onSelectPrimitive,
  onUpdatePart,
  rollbackIndex: controlledRollbackIndex,
  onRollbackChange,
}) => {
  const [activeTab, setActiveTab] = useState<"features" | "material" | "add">("features");
  const [localRollbackIndex, setLocalRollbackIndex] = useState<number>(part.primitives.length);

  const rollbackIndex = typeof controlledRollbackIndex === "number" ? controlledRollbackIndex : localRollbackIndex;
  const setRollbackIndex = (index: number) => {
    setLocalRollbackIndex(index);
    if (onRollbackChange) {
      onRollbackChange(index);
    }
  };

  // Selected Primitive
  const selectedPrimitive = part.primitives.find((p) => p.id === selectedPrimitiveId);

  // Toggle Visibility
  const toggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedPrimitives = part.primitives.map((p) => {
      if (p.id === id) {
        return { ...p, visible: p.visible !== false ? false : true };
      }
      return p;
    });
    onUpdatePart({ ...part, primitives: updatedPrimitives });
  };

  // Update Primitive Dimensions
  const handleDimensionChange = (key: string, value: number) => {
    if (!selectedPrimitive) return;
    const updatedPrimitives = part.primitives.map((p) => {
      if (p.id === selectedPrimitive.id) {
        return {
          ...p,
          dimensions: {
            ...p.dimensions,
            [key]: value,
          },
        };
      }
      return p;
    });

    // Recompute approximate mass and stress
    const volumeEstimate = updatedPrimitives.reduce((acc, p) => {
      const d = p.dimensions || {};
      let v = 0;
      if (p.type === "box") v = ((d.width || 20) * (d.height || 20) * (d.depth || 20)) / 1000;
      else if (p.type === "cylinder" || p.type === "gear" || p.type === "revolved") v = (Math.PI * Math.pow(d.radius || 10, 2) * (d.height || 20)) / 1000;
      else v = 10;
      return p.isHole ? acc - v * 0.7 : acc + v;
    }, 0);

    const newMass = Math.max(10, Math.round(volumeEstimate * part.material.density));
    const newSafetyFactor = Number((part.material.yieldStrength / Math.max(10, part.engineeringAnalysis.vonMisesMaxMpa)).toFixed(2));

    onUpdatePart({
      ...part,
      primitives: updatedPrimitives,
      engineeringAnalysis: {
        ...part.engineeringAnalysis,
        estimatedMassGrams: newMass,
        volumeCm3: Math.round(volumeEstimate * 10) / 10,
        safetyFactor: newSafetyFactor,
      },
    });
  };

  const handleFilletChange = (val: number) => {
    if (!selectedPrimitive) return;
    const updatedPrimitives = part.primitives.map((p) => {
      if (p.id === selectedPrimitive.id) {
        return { ...p, filletRadius: val > 0 ? val : undefined };
      }
      return p;
    });
    onUpdatePart({ ...part, primitives: updatedPrimitives });
  };

  const handleChamferChange = (val: number) => {
    if (!selectedPrimitive) return;
    const updatedPrimitives = part.primitives.map((p) => {
      if (p.id === selectedPrimitive.id) {
        return { ...p, chamferDistance: val > 0 ? val : undefined };
      }
      return p;
    });
    onUpdatePart({ ...part, primitives: updatedPrimitives });
  };

  // Switch Material
  const handleMaterialChange = (matId: string) => {
    const mat = ENGINEERING_MATERIALS.find((m) => m.id === matId);
    if (!mat) return;

    const newMass = Math.round(part.engineeringAnalysis.volumeCm3 * mat.density);
    const newSafetyFactor = Number((mat.yieldStrength / part.engineeringAnalysis.vonMisesMaxMpa).toFixed(2));

    onUpdatePart({
      ...part,
      material: mat,
      engineeringAnalysis: {
        ...part.engineeringAnalysis,
        estimatedMassGrams: newMass,
        allowableStressMpa: mat.yieldStrength,
        safetyFactor: newSafetyFactor,
      },
    });
  };

  // Add Feature
  const handleAddFeature = (type: "box" | "cylinder" | "rib" | "gear" | "extrusion" | "revolved", isHole = false) => {
    const newId = `prim-${Date.now().toString().slice(-4)}`;
    let dims: CADPrimitive["dimensions"] = { width: 35, height: 20, depth: 35 };

    if (type === "cylinder") {
      dims = { radius: 12, height: 25 };
    } else if (type === "gear") {
      dims = { radius: 35, height: 18, teeth: 20, module: 2.5 };
    } else if (type === "rib") {
      dims = { width: 6, height: 28, depth: 28 };
    } else if (type === "extrusion") {
      dims = {
        depth: 25,
        sketchPoints: [
          [-25, -15],
          [25, -15],
          [25, 15],
          [-25, 15],
        ],
      };
    } else if (type === "revolved") {
      dims = {
        radius: 20,
        height: 25,
        revolveAngle: 360,
        sketchPoints: [
          [0, -12],
          [15, -12],
          [18, 0],
          [15, 12],
          [0, 12],
        ],
      };
    }

    const newPrim: CADPrimitive = {
      id: newId,
      name: `${isHole ? "Hole Cut" : "Solid"} ${type.toUpperCase()} #${part.primitives.length + 1}`,
      type,
      position: [0, 20, 0],
      rotation: [0, 0, 0],
      dimensions: dims,
      color: isHole ? "#0f172a" : "#3182CE",
      isHole,
      featureDescription: `User created ${type} feature`,
      visible: true,
    };

    onUpdatePart({
      ...part,
      primitives: [...part.primitives, newPrim],
    });
    onSelectPrimitive(newId);
  };

  // Delete Primitive
  const handleDeletePrimitive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedPrimitives = part.primitives.filter((p) => p.id !== id);
    onUpdatePart({ ...part, primitives: updatedPrimitives });
    if (selectedPrimitiveId === id) onSelectPrimitive(null);
  };

  return (
    <div id="feature-tree-panel" className="h-full flex flex-col bg-[#1A1D23] border border-[#282E39] rounded-xl overflow-hidden shadow-lg">
      {/* Header Tabs */}
      <div className="flex border-b border-[#282E39] bg-[#15181E] p-1.5 gap-1">
        <button
          id="tab-features-btn"
          onClick={() => setActiveTab("features")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "features" ? "bg-[#3182CE]/15 text-[#63B3ED] border border-[#3182CE]/40" : "text-[#A0AEC0] hover:text-white"
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          Feature Tree
        </button>
        <button
          id="tab-material-btn"
          onClick={() => setActiveTab("material")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === "material" ? "bg-[#3182CE]/15 text-[#63B3ED] border border-[#3182CE]/40" : "text-[#A0AEC0] hover:text-white"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Material
        </button>
        <button
          id="tab-add-btn"
          onClick={() => setActiveTab("add")}
          className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center justify-center gap-1 ${
            activeTab === "add" ? "bg-[#3182CE] text-white font-bold" : "text-[#63B3ED] hover:bg-[#3182CE]/10"
          }`}
          title="Add New Parametric Feature"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
        {activeTab === "features" && (
          <div className="space-y-2.5">
            {/* SolidWorks FeatureManager Design Tree Root Structure */}
            <div className="bg-[#15181E] p-2 rounded-lg border border-[#282E39] font-mono text-xs space-y-1">
              {/* Part Root Node */}
              <div className="flex items-center gap-1.5 p-1 rounded hover:bg-[#1A1D23] text-white font-bold cursor-default">
                <div className="w-4 h-4 rounded bg-[#3182CE] flex items-center justify-center text-[9px] text-white">
                  SW
                </div>
                <span className="truncate">{part.partNumber}.SLDPRT</span>
                <span className="text-[10px] text-[#A0AEC0] font-normal">[Default]</span>
              </div>

              {/* Standard Folders */}
              <div className="pl-3 space-y-0.5 border-l border-[#282E39] ml-2 text-[11px] text-[#A0AEC0]">
                <div className="flex items-center gap-1.5 py-0.5 hover:text-white cursor-pointer">
                  <FolderTree className="w-3 h-3 text-[#63B3ED]" />
                  <span>History</span>
                </div>
                <div className="flex items-center gap-1.5 py-0.5 hover:text-white cursor-pointer">
                  <Cpu className="w-3 h-3 text-amber-400" />
                  <span>Sensors</span>
                </div>
                <div className="flex items-center gap-1.5 py-0.5 hover:text-white cursor-pointer">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Annotations</span>
                </div>
                <div 
                  onClick={() => setActiveTab("material")}
                  className="flex items-center gap-1.5 py-0.5 hover:text-white cursor-pointer text-[#63B3ED] hover:bg-[#1A1D23] px-1 rounded"
                  title="Click to edit Part Material"
                >
                  <Scale className="w-3 h-3 text-emerald-400" />
                  <span>Material &lt;{part.material.name}&gt;</span>
                </div>
                <div className="flex items-center gap-1.5 py-0.5 hover:text-white cursor-pointer">
                  <div className="w-2.5 h-2.5 rounded-sm border border-sky-400 bg-sky-400/20" />
                  <span>Front Plane</span>
                </div>
                <div className="flex items-center gap-1.5 py-0.5 hover:text-white cursor-pointer">
                  <div className="w-2.5 h-2.5 rounded-sm border border-emerald-400 bg-emerald-400/20" />
                  <span>Top Plane</span>
                </div>
                <div className="flex items-center gap-1.5 py-0.5 hover:text-white cursor-pointer">
                  <div className="w-2.5 h-2.5 rounded-sm border border-amber-400 bg-amber-400/20" />
                  <span>Right Plane</span>
                </div>
                <div className="flex items-center gap-1.5 py-0.5 hover:text-white cursor-pointer">
                  <CircleDot className="w-3 h-3 text-rose-400" />
                  <span>Origin (0,0,0)</span>
                </div>
              </div>
            </div>

            {/* Datum Reference Frame */}
            <div className="bg-[#15181E] p-2.5 rounded-lg border border-[#282E39]">
              <span className="text-[11px] font-mono text-[#A0AEC0] uppercase tracking-wider block mb-1.5">
                Datum Reference Frame [ASME Y14.5]
              </span>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                <div className="bg-[#1A1D23] p-1.5 rounded text-center border border-[#282E39]">
                  <span className="text-amber-400 font-bold block">Datum [A]</span>
                  <span className="text-[10px] text-[#A0AEC0]">Primary XY</span>
                </div>
                <div className="bg-[#1A1D23] p-1.5 rounded text-center border border-[#282E39]">
                  <span className="text-amber-400 font-bold block">Datum [B]</span>
                  <span className="text-[10px] text-[#A0AEC0]">YZ Planar</span>
                </div>
                <div className="bg-[#1A1D23] p-1.5 rounded text-center border border-[#282E39]">
                  <span className="text-amber-400 font-bold block">Datum [C]</span>
                  <span className="text-[10px] text-[#A0AEC0]">XZ Axis</span>
                </div>
              </div>
            </div>

            {/* Feature List with SolidWorks Rollback Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#A0AEC0] uppercase tracking-wider">
                  Features ({part.primitives.length})
                </span>
                <span className="text-[10px] font-mono text-[#63B3ED]">
                  {rollbackIndex < part.primitives.length ? `Rolled back to ${rollbackIndex}` : "Active"}
                </span>
              </div>

              {part.primitives.map((prim, idx) => {
                const isSelected = prim.id === selectedPrimitiveId;
                const isRolledBack = idx >= rollbackIndex;

                return (
                  <React.Fragment key={prim.id}>
                    {/* Rollback Bar Indicator */}
                    {idx === rollbackIndex && (
                      <div 
                        onClick={() => setRollbackIndex(part.primitives.length)}
                        className="h-2 bg-amber-500 rounded cursor-pointer hover:h-2.5 transition-all flex items-center justify-center text-[8px] font-bold text-slate-950 uppercase"
                        title="Click to restore all features"
                      >
                        Rollback Bar (Active)
                      </div>
                    )}

                    <div
                      id={`feature-item-${prim.id}`}
                      onClick={() => onSelectPrimitive(isSelected ? null : prim.id)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        isRolledBack
                          ? "opacity-40 bg-[#15181E]/60 border-[#282E39] text-[#718096]"
                          : isSelected
                          ? "bg-[#3182CE]/15 border-[#3182CE] text-white shadow-sm"
                          : "bg-[#15181E] border-[#282E39] hover:border-[#3182CE]/50 text-[#EDF2F7]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {prim.isHole ? (
                          <CircleDot className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : prim.type === "revolved" ? (
                          <RotateCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Box className="w-3.5 h-3.5 text-[#3182CE] shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="text-xs font-mono font-medium block truncate">
                            {prim.name}
                          </span>
                          <span className="text-[10px] text-[#A0AEC0] font-mono block">
                            {prim.type.toUpperCase()} • {prim.isHole ? "CUT" : "BOSS"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRollbackIndex(idx);
                          }}
                          className="px-1 py-0.5 text-[9px] text-[#A0AEC0] hover:text-amber-400 rounded hover:bg-[#1A1D23]"
                          title="Roll back model before this feature"
                        >
                          Roll
                        </button>
                        <button
                          onClick={(e) => toggleVisibility(prim.id, e)}
                          className="p-1 text-[#A0AEC0] hover:text-white rounded"
                          title={prim.visible !== false ? "Hide feature" : "Show feature"}
                        >
                          {prim.visible !== false ? (
                            <Eye className="w-3.5 h-3.5 text-[#63B3ED]" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-[#4A5568]" />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleDeletePrimitive(prim.id, e)}
                          className="p-1 text-[#A0AEC0] hover:text-rose-400 rounded"
                          title="Delete feature"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Bottom Rollback Bar */}
              {rollbackIndex === part.primitives.length && (
                <div 
                  onClick={() => setRollbackIndex(Math.max(0, part.primitives.length - 1))}
                  className="h-1.5 bg-[#282E39] hover:bg-amber-500 rounded cursor-pointer transition-colors"
                  title="Drag or click to roll back features"
                />
              )}
            </div>

            {/* Selected Primitive Parameter Editor */}
            {selectedPrimitive && (
              <div className="bg-[#15181E] p-3 rounded-lg border border-[#3182CE]/40 space-y-2.5 mt-2 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#282E39] pb-1.5">
                  <span className="text-xs font-mono font-bold text-[#63B3ED] flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-[#3182CE]" />
                    {selectedPrimitive.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#3182CE]/10 text-[#63B3ED] border border-[#3182CE]/30">
                    LIVE PARAMETRIC
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {selectedPrimitive.dimensions.width !== undefined && (
                    <div>
                      <label className="text-[10px] text-[#A0AEC0] block mb-1">Width (mm)</label>
                      <input
                        type="number"
                        value={selectedPrimitive.dimensions.width}
                        onChange={(e) => handleDimensionChange("width", parseFloat(e.target.value) || 1)}
                        className="w-full bg-[#1A1D23] border border-[#282E39] rounded px-2 py-1 text-white text-xs focus:border-[#3182CE] outline-none"
                      />
                    </div>
                  )}
                  {selectedPrimitive.dimensions.height !== undefined && (
                    <div>
                      <label className="text-[10px] text-[#A0AEC0] block mb-1">Height (mm)</label>
                      <input
                        type="number"
                        value={selectedPrimitive.dimensions.height}
                        onChange={(e) => handleDimensionChange("height", parseFloat(e.target.value) || 1)}
                        className="w-full bg-[#1A1D23] border border-[#282E39] rounded px-2 py-1 text-white text-xs focus:border-[#3182CE] outline-none"
                      />
                    </div>
                  )}
                  {selectedPrimitive.dimensions.depth !== undefined && (
                    <div>
                      <label className="text-[10px] text-[#A0AEC0] block mb-1">Depth (mm)</label>
                      <input
                        type="number"
                        value={selectedPrimitive.dimensions.depth}
                        onChange={(e) => handleDimensionChange("depth", parseFloat(e.target.value) || 1)}
                        className="w-full bg-[#1A1D23] border border-[#282E39] rounded px-2 py-1 text-white text-xs focus:border-[#3182CE] outline-none"
                      />
                    </div>
                  )}
                  {selectedPrimitive.dimensions.radius !== undefined && (
                    <div>
                      <label className="text-[10px] text-[#A0AEC0] block mb-1">Radius (mm)</label>
                      <input
                        type="number"
                        value={selectedPrimitive.dimensions.radius}
                        onChange={(e) => handleDimensionChange("radius", parseFloat(e.target.value) || 1)}
                        className="w-full bg-[#1A1D23] border border-[#282E39] rounded px-2 py-1 text-white text-xs focus:border-[#3182CE] outline-none"
                      />
                    </div>
                  )}
                  {selectedPrimitive.dimensions.teeth !== undefined && (
                    <div>
                      <label className="text-[10px] text-[#A0AEC0] block mb-1">Teeth Count (z)</label>
                      <input
                        type="number"
                        value={selectedPrimitive.dimensions.teeth}
                        onChange={(e) => handleDimensionChange("teeth", parseInt(e.target.value) || 12)}
                        className="w-full bg-[#1A1D23] border border-[#282E39] rounded px-2 py-1 text-white text-xs focus:border-[#3182CE] outline-none"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] text-[#A0AEC0] block mb-1">Fillet Radius (mm)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={selectedPrimitive.filletRadius || 0}
                      onChange={(e) => handleFilletChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#1A1D23] border border-[#282E39] rounded px-2 py-1 text-white text-xs focus:border-[#3182CE] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#A0AEC0] block mb-1">Chamfer (mm × 45°)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={selectedPrimitive.chamferDistance || 0}
                      onChange={(e) => handleChamferChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#1A1D23] border border-[#282E39] rounded px-2 py-1 text-white text-xs focus:border-[#3182CE] outline-none"
                    />
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#A0AEC0] pt-1">
                  <em>{selectedPrimitive.featureDescription}</em>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "material" && (
          <div className="space-y-3">
            <span className="text-[11px] font-mono text-[#A0AEC0] uppercase tracking-wider block">
              Alloy & Property Selection
            </span>

            <div className="space-y-2">
              {ENGINEERING_MATERIALS.map((mat) => {
                const isSelected = mat.id === part.material.id;
                return (
                  <div
                    key={mat.id}
                    onClick={() => handleMaterialChange(mat.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#3182CE]/15 border-[#3182CE] text-white shadow-sm"
                        : "bg-[#15181E] border-[#282E39] hover:border-[#3182CE]/50 text-[#EDF2F7]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-white">{mat.name}</span>
                      <span className="text-[10px] font-mono text-[#63B3ED]">
                        Ashby: {mat.ashbyIndexStrengthDensity.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#A0AEC0] font-mono mb-2">{mat.alloy}</div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-[#A0AEC0]">
                      <div>Yield: <strong className="text-white">{mat.yieldStrength} MPa</strong></div>
                      <div>Density: <strong className="text-white">{mat.density} g/cc</strong></div>
                      <div>E: <strong className="text-white">{mat.youngsModulus} GPa</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "add" && (
          <div className="space-y-3">
            <span className="text-[11px] font-mono text-[#A0AEC0] uppercase tracking-wider block">
              Parametric Primitive Builder
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddFeature("box", false)}
                className="p-3 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] hover:border-[#3182CE]/50 rounded-lg text-left transition-all group"
              >
                <Box className="w-5 h-5 text-[#3182CE] mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono font-bold text-white block">Extrude Box</span>
                <span className="text-[10px] text-[#A0AEC0] font-mono">Machined Boss / Rib</span>
              </button>

              <button
                onClick={() => handleAddFeature("cylinder", false)}
                className="p-3 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] hover:border-[#3182CE]/50 rounded-lg text-left transition-all group"
              >
                <CircleDot className="w-5 h-5 text-[#3182CE] mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono font-bold text-white block">Cylinder Boss</span>
                <span className="text-[10px] text-[#A0AEC0] font-mono">Shaft / Spigot</span>
              </button>

              <button
                onClick={() => handleAddFeature("extrusion", false)}
                className="p-3 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] hover:border-[#3182CE]/50 rounded-lg text-left transition-all group"
              >
                <Pencil className="w-5 h-5 text-[#3182CE] mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono font-bold text-white block">2D Extrusion</span>
                <span className="text-[10px] text-[#A0AEC0] font-mono">Extruded Profile</span>
              </button>

              <button
                onClick={() => handleAddFeature("revolved", false)}
                className="p-3 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] hover:border-[#38A169]/50 rounded-lg text-left transition-all group"
              >
                <RotateCw className="w-5 h-5 text-[#38A169] mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono font-bold text-white block">Revolved Solid</span>
                <span className="text-[10px] text-[#A0AEC0] font-mono">360° Axisymmetric</span>
              </button>

              <button
                onClick={() => handleAddFeature("cylinder", true)}
                className="p-3 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] hover:border-rose-500/50 rounded-lg text-left transition-all group"
              >
                <CircleDot className="w-5 h-5 text-rose-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono font-bold text-white block">Cutout Bore</span>
                <span className="text-[10px] text-[#A0AEC0] font-mono">Bearing / Pin Bore</span>
              </button>

              <button
                onClick={() => handleAddFeature("rib", false)}
                className="p-3 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] hover:border-[#3182CE]/50 rounded-lg text-left transition-all group"
              >
                <Layers className="w-5 h-5 text-[#3182CE] mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-mono font-bold text-white block">Gusset Rib</span>
                <span className="text-[10px] text-[#A0AEC0] font-mono">Structural Stiffener</span>
              </button>

              <button
                onClick={() => handleAddFeature("gear", false)}
                className="col-span-2 p-3 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] hover:border-[#3182CE]/50 rounded-lg text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-white block">Involute Spur Gear</span>
                  <span className="text-[10px] text-[#A0AEC0] font-mono">Parametric 20° Pressure Angle (AGMA)</span>
                </div>
                <Cpu className="w-5 h-5 text-[#3182CE] group-hover:rotate-45 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Mass & Safety Factor Summary */}
      <div className="p-3 border-t border-[#282E39] bg-[#15181E] font-mono text-xs">
        <div className="flex items-center justify-between mb-1 text-[#A0AEC0] text-[11px]">
          <span>Mass: <strong className="text-white">{part.engineeringAnalysis.estimatedMassGrams} g</strong></span>
          <span>Vol: <strong className="text-white">{part.engineeringAnalysis.volumeCm3} cm³</strong></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#A0AEC0] text-[11px]">Yield SF (n):</span>
          <span className={`font-bold flex items-center gap-1 ${
            part.engineeringAnalysis.safetyFactor >= 2.0 ? "text-emerald-400" : "text-amber-400"
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {part.engineeringAnalysis.safetyFactor.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
