import React, { useState } from "react";
import { CADPart, CADPrimitive, HolePattern } from "../types/cad";
import { 
  CircleDot, 
  X, 
  Check, 
  Sliders, 
  Settings2, 
  Layers, 
  ShieldCheck,
  Disc
} from "lucide-react";

interface HoleWizardModalProps {
  part: CADPart;
  onUpdatePart: (updatedPart: CADPart) => void;
  onClose: () => void;
}

export const HoleWizardModal: React.FC<HoleWizardModalProps> = ({
  part,
  onUpdatePart,
  onClose,
}) => {
  const [holeType, setHoleType] = useState<"counterbore" | "countersink" | "tapped" | "clearance">("counterbore");
  const [standard, setStandard] = useState<"ISO" | "ANSI_METRIC" | "DIN">("ISO");
  const [size, setSize] = useState<string>("M6");
  const [endCondition, setEndCondition] = useState<"Through All" | "Blind">("Through All");
  const [blindDepth, setBlindDepth] = useState<number>(20);
  const [isPattern, setIsPattern] = useState<boolean>(true);
  const [patternCount, setPatternCount] = useState<number>(4);
  const [pcdDiameter, setPcdDiameter] = useState<number>(60);
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(10);
  const [posZ, setPosZ] = useState<number>(0);

  // Hole standard sizing table
  const holeData: Record<string, { drillDia: number; cboreDia: number; cboreDepth: number; csinkDia: number; threadPitch: string }> = {
    M3: { drillDia: 3.4, cboreDia: 6.0, cboreDepth: 3.4, csinkDia: 6.5, threadPitch: "M3×0.5 - 6H" },
    M4: { drillDia: 4.5, cboreDia: 7.5, cboreDepth: 4.4, csinkDia: 8.6, threadPitch: "M4×0.7 - 6H" },
    M5: { drillDia: 5.5, cboreDia: 9.0, cboreDepth: 5.4, csinkDia: 10.4, threadPitch: "M5×0.8 - 6H" },
    M6: { drillDia: 6.6, cboreDia: 11.0, cboreDepth: 6.5, csinkDia: 12.4, threadPitch: "M6×1.0 - 6H" },
    M8: { drillDia: 9.0, cboreDia: 14.5, cboreDepth: 8.6, csinkDia: 16.4, threadPitch: "M8×1.25 - 6H" },
    M10: { drillDia: 11.0, cboreDia: 17.5, cboreDepth: 10.6, csinkDia: 20.4, threadPitch: "M10×1.5 - 6H" },
    M12: { drillDia: 13.5, cboreDia: 20.0, cboreDepth: 12.6, csinkDia: 24.5, threadPitch: "M12×1.75 - 6H" },
    M16: { drillDia: 17.5, cboreDia: 26.0, cboreDepth: 16.6, csinkDia: 31.5, threadPitch: "M16×2.0 - 6H" },
  };

  const currentSpec = holeData[size] || holeData.M6;

  const handleInsertHole = () => {
    const newId = `hole-${Date.now().toString().slice(-4)}`;
    const depth = endCondition === "Through All" ? 40 : blindDepth;

    if (isPattern) {
      // Create a SolidWorks circular Hole Pattern
      const newPattern: HolePattern = {
        id: `patt-${Date.now().toString().slice(-4)}`,
        patternType: "circular",
        count: patternCount,
        boltDiameter: currentSpec.drillDia,
        circlePitchDiameter: pcdDiameter,
        center: [posX, posY, posZ],
        threadCallout: `${size} Standard [${currentSpec.threadPitch}]`,
        depth,
        counterboreDiameter: holeType === "counterbore" ? currentSpec.cboreDia : undefined,
        counterboreDepth: holeType === "counterbore" ? currentSpec.cboreDepth : undefined,
      };

      // Also create primitive representations for 3D viewport
      const generatedPrimitives: CADPrimitive[] = [];
      const step = (Math.PI * 2) / patternCount;
      for (let i = 0; i < patternCount; i++) {
        const angle = i * step;
        const hx = posX + (pcdDiameter / 2) * Math.cos(angle);
        const hz = posZ + (pcdDiameter / 2) * Math.sin(angle);

        generatedPrimitives.push({
          id: `${newId}-${i + 1}`,
          name: `${size} Hole (${i + 1}/${patternCount})`,
          type: "cylinder",
          position: [hx, posY, hz],
          rotation: [0, 0, 0],
          dimensions: {
            radius: currentSpec.drillDia / 2,
            height: depth,
          },
          color: "#0f172a",
          isHole: true,
          holeType,
          threadSpec: currentSpec.threadPitch,
          featureDescription: `Hole Wizard ${size} [${currentSpec.threadPitch}]`,
          visible: true,
        });
      }

      onUpdatePart({
        ...part,
        holePatterns: [...part.holePatterns, newPattern],
        primitives: [...part.primitives, ...generatedPrimitives],
      });
    } else {
      // Single hole
      const newPrim: CADPrimitive = {
        id: newId,
        name: `${size} ${holeType.toUpperCase()} Hole`,
        type: "cylinder",
        position: [posX, posY, posZ],
        rotation: [0, 0, 0],
        dimensions: {
          radius: currentSpec.drillDia / 2,
          height: depth,
        },
        color: "#0f172a",
        isHole: true,
        holeType,
        threadSpec: currentSpec.threadPitch,
        featureDescription: `Hole Wizard ${size} [${currentSpec.threadPitch}]`,
        visible: true,
      };

      onUpdatePart({
        ...part,
        primitives: [...part.primitives, newPrim],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-[#15181E] border border-[#282E39] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* SolidWorks-style Window Title Bar */}
        <div className="h-10 bg-[#101217] border-b border-[#282E39] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#3182CE] flex items-center justify-center text-white">
              <CircleDot className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-white">Hole Wizard — PropertyManager</span>
            <span className="text-[10px] bg-[#3182CE]/20 text-[#63B3ED] px-2 py-0.5 rounded border border-[#3182CE]/40">
              ASME / ISO Standard
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
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Hole Type & Standards */}
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[#A0AEC0] uppercase font-bold block mb-2">
                1. Hole Type
              </span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "counterbore", label: "Counterbore", desc: "Socket Head Cap" },
                  { id: "countersink", label: "Countersink", desc: "90° Flat Head" },
                  { id: "tapped", label: "Straight Tap", desc: "ISO Metric Thread" },
                  { id: "clearance", label: "Clearance Hole", desc: "Standard Through" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setHoleType(t.id as any)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      holeType === t.id
                        ? "bg-[#3182CE]/20 border-[#3182CE] text-white shadow-sm"
                        : "bg-[#1A1D23] border-[#282E39] text-[#A0AEC0] hover:text-white"
                    }`}
                  >
                    <div className="font-bold text-xs">{t.label}</div>
                    <div className="text-[10px] text-[#A0AEC0]">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-[#A0AEC0] uppercase font-bold block mb-2">
                2. Standard &amp; Thread Size
              </span>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {(["ISO", "ANSI_METRIC", "DIN"] as const).map((std) => (
                  <button
                    key={std}
                    onClick={() => setStandard(std)}
                    className={`py-1.5 text-xs font-bold rounded border ${
                      standard === std
                        ? "bg-[#3182CE] text-white border-[#3182CE]"
                        : "bg-[#1A1D23] border-[#282E39] text-[#A0AEC0]"
                    }`}
                  >
                    {std}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {Object.keys(holeData).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={`py-1.5 text-xs font-bold rounded border ${
                      size === sz
                        ? "bg-[#38A169] text-white border-[#38A169]"
                        : "bg-[#1A1D23] border-[#282E39] text-[#EDF2F7] hover:bg-[#22262F]"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Hole Dimensions Preview Box */}
            <div className="p-3 bg-[#101217] rounded-lg border border-[#282E39] space-y-1 text-xs">
              <span className="text-[10px] text-[#A0AEC0] uppercase font-bold block mb-1">
                Standard Specs for {size}
              </span>
              <div className="flex justify-between">
                <span className="text-[#A0AEC0]">Drill Diameter:</span>
                <span className="text-white font-bold">⌀{currentSpec.drillDia} mm</span>
              </div>
              {holeType === "counterbore" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#A0AEC0]">Counterbore ⌀:</span>
                    <span className="text-[#63B3ED] font-bold">⌀{currentSpec.cboreDia} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A0AEC0]">Counterbore Depth:</span>
                    <span className="text-[#63B3ED] font-bold">{currentSpec.cboreDepth} mm</span>
                  </div>
                </>
              )}
              {holeType === "countersink" && (
                <div className="flex justify-between">
                  <span className="text-[#A0AEC0]">Countersink ⌀ (90°):</span>
                  <span className="text-amber-400 font-bold">⌀{currentSpec.csinkDia} mm</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#A0AEC0]">Thread Callout:</span>
                <span className="text-emerald-400 font-bold">{currentSpec.threadPitch}</span>
              </div>
            </div>
          </div>

          {/* Right Column: End Condition & Pattern Positions */}
          <div className="space-y-4">
            <div>
              <span className="text-xs text-[#A0AEC0] uppercase font-bold block mb-2">
                3. End Condition
              </span>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {(["Through All", "Blind"] as const).map((cond) => (
                  <button
                    key={cond}
                    onClick={() => setEndCondition(cond)}
                    className={`py-2 text-xs font-bold rounded border ${
                      endCondition === cond
                        ? "bg-[#3182CE] text-white border-[#3182CE]"
                        : "bg-[#1A1D23] border-[#282E39] text-[#A0AEC0]"
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>

              {endCondition === "Blind" && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#A0AEC0]">Blind Hole Depth:</span>
                    <span className="text-white font-bold">{blindDepth} mm</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    value={blindDepth}
                    onChange={(e) => setBlindDepth(Number(e.target.value))}
                    className="w-full accent-[#3182CE]"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#A0AEC0] uppercase font-bold">
                  4. Pattern / Position
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#63B3ED]">
                  <input
                    type="checkbox"
                    checked={isPattern}
                    onChange={(e) => setIsPattern(e.target.checked)}
                    className="rounded accent-[#3182CE]"
                  />
                  <span>Circular Bolt Circle</span>
                </label>
              </div>

              {isPattern ? (
                <div className="space-y-2.5 p-3 bg-[#1A1D23] rounded-lg border border-[#282E39]">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#A0AEC0]">Instances Count:</span>
                      <span className="text-white font-bold">{patternCount} holes</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[3, 4, 6, 8].map((cnt) => (
                        <button
                          key={cnt}
                          onClick={() => setPatternCount(cnt)}
                          className={`py-1 text-xs font-bold rounded border ${
                            patternCount === cnt
                              ? "bg-[#3182CE] text-white border-[#3182CE]"
                              : "bg-[#101217] border-[#282E39] text-[#A0AEC0]"
                          }`}
                        >
                          {cnt}×
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#A0AEC0]">Pitch Circle Diameter (PCD):</span>
                      <span className="text-white font-bold">⌀{pcdDiameter} mm</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={120}
                      step={2}
                      value={pcdDiameter}
                      onChange={(e) => setPcdDiameter(Number(e.target.value))}
                      className="w-full accent-[#3182CE]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-[#1A1D23] rounded-lg border border-[#282E39]">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#A0AEC0] block">Pos X (mm)</span>
                      <input
                        type="number"
                        value={posX}
                        onChange={(e) => setPosX(Number(e.target.value))}
                        className="w-full bg-[#101217] border border-[#282E39] rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A0AEC0] block">Pos Y (mm)</span>
                      <input
                        type="number"
                        value={posY}
                        onChange={(e) => setPosY(Number(e.target.value))}
                        className="w-full bg-[#101217] border border-[#282E39] rounded px-2 py-1 text-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#A0AEC0] block">Pos Z (mm)</span>
                      <input
                        type="number"
                        value={posZ}
                        onChange={(e) => setPosZ(Number(e.target.value))}
                        className="w-full bg-[#101217] border border-[#282E39] rounded px-2 py-1 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="h-14 bg-[#101217] border-t border-[#282E39] px-5 flex items-center justify-between">
          <div className="text-[11px] text-[#A0AEC0]">
            Generates compliant ASME B18.2 / ISO 4762 holes with true pitch circle patterns.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-[#A0AEC0] hover:text-white rounded hover:bg-[#1A1D23] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsertHole}
              className="px-5 py-1.5 text-xs font-bold text-white bg-[#3182CE] hover:bg-[#2B6CB0] rounded-lg shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              Insert Hole Feature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
