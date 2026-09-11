import React, { useState } from "react";
import { CADPart } from "../types/cad";
import { 
  Flame, 
  X, 
  Play, 
  Check, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  Maximize2,
  Anchor,
  ArrowDown
} from "lucide-react";

interface SimulationStudyModalProps {
  part: CADPart;
  onClose: () => void;
  onApplyStressView: () => void;
  onUpdatePart: (updated: CADPart) => void;
}

export const SimulationStudyModal: React.FC<SimulationStudyModalProps> = ({
  part,
  onClose,
  onApplyStressView,
  onUpdatePart,
}) => {
  const [loadType, setLoadType] = useState<"force" | "pressure" | "torque">("force");
  const [appliedLoadValue, setAppliedLoadValue] = useState<number>(4800); // 4.8 kN default
  const [fixtureType, setFixtureType] = useState<"fixed" | "pin" | "slider">("fixed");
  const [meshDensity, setMeshDensity] = useState<number>(3); // 1-5
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(true);

  // Mechanical properties
  const yieldStrength = part.material.yieldStrength || 276; // MPa (6061-T6)
  const E = part.material.youngsModulus || 68.9; // GPa

  // Recalculate FEA stress based on applied load and geometry
  const baseStress = (appliedLoadValue / 4800) * 118.4;
  const meshFactor = 1.0 + (meshDensity - 3) * 0.04;
  const vonMisesMax = Math.round(baseStress * meshFactor * 10) / 10;
  const safetyFactor = Math.round((yieldStrength / vonMisesMax) * 100) / 100;
  const maxDisplacementMm = Math.round(((appliedLoadValue / (E * 1000)) * 0.28) * 1000) / 1000;

  const handleRunSimulation = () => {
    setIsSolving(true);
    setTimeout(() => {
      setIsSolving(false);
      setIsSolved(true);

      // Update part engineering analysis
      onUpdatePart({
        ...part,
        engineeringAnalysis: {
          ...part.engineeringAnalysis,
          vonMisesMaxMpa: vonMisesMax,
          safetyFactor: safetyFactor,
          allowableStressMpa: Math.round(yieldStrength / 1.5),
          criticalLoadCondition: `${appliedLoadValue} N ${loadType.toUpperCase()} on Flange Bore`,
        },
      });
    }, 600);
  };

  const handleApplyAndClose = () => {
    onApplyStressView();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-[#15181E] border border-[#282E39] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Title Bar */}
        <div className="h-10 bg-[#101217] border-b border-[#282E39] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-500 flex items-center justify-center text-slate-950">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-white">SolidWorks Simulation — Static FEA Study</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/40">
              von Mises Stress Solver
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#22262F] text-[#A0AEC0] hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Left Column: Boundary Conditions */}
          <div className="space-y-4">
            {/* Material Check */}
            <div className="p-3 bg-[#1A1D23] rounded-lg border border-[#282E39]">
              <span className="text-[10px] text-[#A0AEC0] uppercase font-bold block mb-1">
                1. Material Assigned
              </span>
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-sm">{part.material.name}</span>
                <span className="text-emerald-400 font-bold">σy = {yieldStrength} MPa</span>
              </div>
              <span className="text-[10px] text-[#A0AEC0]">Young's Modulus E: {E} GPa • Poisson: {part.material.poissonsRatio}</span>
            </div>

            {/* Fixtures */}
            <div>
              <span className="text-xs text-[#A0AEC0] uppercase font-bold block mb-2">
                2. Fixture (Constraints)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "fixed", label: "Fixed Geometry", icon: Anchor },
                  { id: "pin", label: "Pin Support", icon: Sliders },
                  { id: "slider", label: "Roller / Slider", icon: Maximize2 },
                ].map((fix) => {
                  const Icon = fix.icon;
                  return (
                    <button
                      key={fix.id}
                      onClick={() => setFixtureType(fix.id as any)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        fixtureType === fix.id
                          ? "bg-[#3182CE]/20 border-[#3182CE] text-white"
                          : "bg-[#1A1D23] border-[#282E39] text-[#A0AEC0] hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 mx-auto mb-1 text-[#63B3ED]" />
                      <div className="font-bold text-[10px]">{fix.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Loads */}
            <div className="space-y-2">
              <span className="text-xs text-[#A0AEC0] uppercase font-bold block">
                3. External Load Conditions
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["force", "pressure", "torque"] as const).map((ld) => (
                  <button
                    key={ld}
                    onClick={() => setLoadType(ld)}
                    className={`py-1.5 text-xs font-bold rounded border uppercase ${
                      loadType === ld
                        ? "bg-amber-500 text-slate-950 border-amber-500"
                        : "bg-[#1A1D23] border-[#282E39] text-[#A0AEC0]"
                    }`}
                  >
                    {ld}
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#A0AEC0]">Applied Magnitude:</span>
                  <span className="text-white font-bold">{appliedLoadValue} {loadType === "force" ? "N" : loadType === "pressure" ? "MPa" : "N·m"}</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={12000}
                  step={200}
                  value={appliedLoadValue}
                  onChange={(e) => setAppliedLoadValue(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            {/* Mesh density */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#A0AEC0]">SolidWorks Parabolic Tetrahedral Mesh:</span>
                <span className="text-[#63B3ED] font-bold">
                  {meshDensity === 1 ? "Coarse (12k elem)" : meshDensity === 3 ? "Standard (48k elem)" : "Fine (115k elem)"}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={meshDensity}
                onChange={(e) => setMeshDensity(Number(e.target.value))}
                className="w-full accent-[#3182CE]"
              />
            </div>
          </div>

          {/* Right Column: FEA Results & Safety Verification */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xs text-[#A0AEC0] uppercase font-bold block">
                Simulation Results &amp; Stress Contours
              </span>

              {/* von Mises stress card */}
              <div className="p-3 bg-[#101217] rounded-lg border border-[#282E39] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#A0AEC0]">Max von Mises Stress (σ_vm):</span>
                  <span className="text-base font-bold text-amber-400">{vonMisesMax} MPa</span>
                </div>
                {/* Rainbow gradient */}
                <div className="h-3 w-full rounded bg-gradient-to-r from-blue-600 via-green-500 via-yellow-400 to-red-600 border border-[#282E39]" />
                <div className="flex justify-between text-[10px] text-[#A0AEC0]">
                  <span>0.0 MPa</span>
                  <span>Yield: {yieldStrength} MPa</span>
                  <span className="text-rose-400 font-bold">{vonMisesMax} MPa</span>
                </div>
              </div>

              {/* Safety Factor Box */}
              <div className={`p-3 rounded-lg border flex items-center justify-between ${
                safetyFactor >= 2.0
                  ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-300"
                  : safetyFactor >= 1.2
                  ? "bg-amber-950/30 border-amber-500/50 text-amber-300"
                  : "bg-rose-950/30 border-rose-500/50 text-rose-300"
              }`}>
                <div>
                  <span className="text-[10px] uppercase font-bold block">Factor of Safety (FOS)</span>
                  <span className="text-xl font-bold">{safetyFactor.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] block">Governing Standard:</span>
                  <span className="text-xs font-bold">ASME BTH-1 (Req: ≥ 2.00)</span>
                </div>
              </div>

              {/* Max Displacement */}
              <div className="p-3 bg-[#1A1D23] rounded-lg border border-[#282E39] flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-[#A0AEC0] block">Max Resultant Displacement (URES)</span>
                  <span className="font-bold text-white text-sm">{maxDisplacementMm} mm</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">Well within 0.050 mm limit</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleRunSimulation}
                disabled={isSolving}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                {isSolving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Assembling Stiffness Matrix &amp; Solving...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Solve FEA Simulation Study</span>
                  </>
                )}
              </button>

              <button
                onClick={handleApplyAndClose}
                className="w-full py-2 bg-[#3182CE] hover:bg-[#2B6CB0] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Flame className="w-3.5 h-3.5" />
                View 3D Stress Plot in Viewport
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
