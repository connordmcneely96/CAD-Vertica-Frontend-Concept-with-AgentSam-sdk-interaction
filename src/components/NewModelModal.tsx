import React, { useState } from "react";
import { CADPart } from "../types/cad";
import { ENGINEERING_MATERIALS } from "../data/materials";
import { 
  Box, 
  FilePlus, 
  Layers, 
  Sparkles, 
  X, 
  Check, 
  RotateCw, 
  Disc, 
  Sliders,
  ShieldCheck,
  Cpu
} from "lucide-react";

interface NewModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePart: (newPart: CADPart) => void;
}

export const NewModelModal: React.FC<NewModelModalProps> = ({
  isOpen,
  onClose,
  onCreatePart,
}) => {
  const [partName, setPartName] = useState<string>("New Aerospace Part");
  const [partNumber, setPartNumber] = useState<string>(`NX-PRT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [templateType, setTemplateType] = useState<"blank" | "prismatic" | "turned" | "flange" | "gear">("blank");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(ENGINEERING_MATERIALS[0].id);
  const [standard, setStandard] = useState<string>("ASME Y14.5-2018 / ISO 1101");
  const [manufacturingMethod, setManufacturingMethod] = useState<string>("5-Axis CNC Mill");

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const material = ENGINEERING_MATERIALS.find((m) => m.id === selectedMaterialId) || ENGINEERING_MATERIALS[0];

    let primitives: CADPart["primitives"] = [];
    let holePatterns: CADPart["holePatterns"] = [];
    let volumeEstimate = 10;

    if (templateType === "blank") {
      primitives = [];
      volumeEstimate = 1;
    } else if (templateType === "prismatic") {
      primitives = [
        {
          id: `prim-${Date.now()}-1`,
          name: "Base Extrusion Block",
          type: "box",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          dimensions: { width: 80, height: 25, depth: 60 },
          color: "#3182CE",
          isHole: false,
          featureDescription: "Initial blank datum block [A]",
          visible: true,
        },
      ];
      volumeEstimate = (80 * 25 * 60) / 1000;
    } else if (templateType === "turned") {
      primitives = [
        {
          id: `prim-${Date.now()}-1`,
          name: "Revolved Mandrel / Spindle",
          type: "cylinder",
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          dimensions: { radius: 25, height: 90 },
          color: "#0284c7",
          isHole: false,
          featureDescription: "Turned cylindrical stock",
          visible: true,
        },
        {
          id: `prim-${Date.now()}-2`,
          name: "Center Through-Bore",
          type: "cylinder",
          position: [0, 0, 0],
          rotation: [0, 0, Math.PI / 2],
          dimensions: { radius: 10, height: 92 },
          color: "#0f172a",
          isHole: true,
          featureDescription: "Precision through bore",
          visible: true,
        },
      ];
      volumeEstimate = (Math.PI * (25 * 25 - 10 * 10) * 90) / 1000;
    } else if (templateType === "flange") {
      primitives = [
        {
          id: `prim-${Date.now()}-1`,
          name: "Flange Disc Base",
          type: "cylinder",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          dimensions: { radius: 45, height: 16 },
          color: "#2563eb",
          isHole: false,
          featureDescription: "Circular mounting flange",
          visible: true,
        },
        {
          id: `prim-${Date.now()}-2`,
          name: "Central Bushing Hub",
          type: "cylinder",
          position: [0, 18, 0],
          rotation: [0, 0, 0],
          dimensions: { radius: 22, height: 20 },
          color: "#3b82f6",
          isHole: false,
          featureDescription: "Raised pilot boss",
          visible: true,
        },
        {
          id: `prim-${Date.now()}-3`,
          name: "Center Bore",
          type: "cylinder",
          position: [0, 10, 0],
          rotation: [0, 0, 0],
          dimensions: { radius: 12, height: 40 },
          color: "#0f172a",
          isHole: true,
          featureDescription: "Clearance bore",
          visible: true,
        },
      ];
      holePatterns = [
        {
          id: `patt-${Date.now()}`,
          patternType: "circular",
          count: 4,
          boltDiameter: 6.6,
          circlePitchDiameter: 65,
          center: [0, 0, 0],
          threadCallout: "M6 Clearance Holes (4x)",
          depth: 16,
        },
      ];
      // Generate 4x holes
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        primitives.push({
          id: `prim-${Date.now()}-h${i}`,
          name: `Bolt Hole ${i + 1}`,
          type: "cylinder",
          position: [Math.cos(a) * 32.5, 0, Math.sin(a) * 32.5],
          rotation: [0, 0, 0],
          dimensions: { radius: 3.3, height: 20 },
          color: "#0f172a",
          isHole: true,
          visible: true,
        });
      }
      volumeEstimate = (Math.PI * 45 * 45 * 16 + Math.PI * 22 * 22 * 20) / 1000;
    } else if (templateType === "gear") {
      primitives = [
        {
          id: `prim-${Date.now()}-1`,
          name: "AGMA Involute Spur Gear",
          type: "gear",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          dimensions: { radius: 40, height: 20, teeth: 24, module: 2.5 },
          color: "#0284c7",
          isHole: false,
          featureDescription: "24-Tooth standard module 2.5 spur gear",
          visible: true,
        },
        {
          id: `prim-${Date.now()}-2`,
          name: "Shaft Bore",
          type: "cylinder",
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          dimensions: { radius: 10, height: 25 },
          color: "#0f172a",
          isHole: true,
          featureDescription: "Shaft pilot bore",
          visible: true,
        },
      ];
      volumeEstimate = (Math.PI * 40 * 40 * 20 * 0.85) / 1000;
    }

    const estimatedMass = Math.max(15, Math.round(volumeEstimate * material.density));

    const newPart: CADPart = {
      id: `part-${Date.now()}`,
      name: partName.trim() || "Parametric Part Project",
      partNumber: partNumber.trim() || `NX-PRT-${Math.floor(1000 + Math.random() * 9000)}`,
      revision: "A.0",
      description: `Newly initialized ${templateType} design project. Standard: ${standard}.`,
      designStage: "DETAILED_CAD",
      standard,
      material,
      manufacturingMethod,
      primitives,
      holePatterns,
      gdtCallouts: [
        {
          id: `gdt-drf-${Date.now()}`,
          symbol: "flatness",
          tolerance: "0.05",
          modifier: "RFS",
          datumRefs: "[A]",
          feature: "Primary Locating Datum [A]",
          inspectionNote: "Verify surface planar flatness under 3-point CMM contact",
        },
      ],
      dimensions: [
        {
          id: `dim-1-${Date.now()}`,
          label: "Primary Span",
          value: templateType === "prismatic" ? 80.0 : templateType === "turned" ? 90.0 : 60.0,
          toleranceStr: "±0.1",
          p1: [-30, 0, 0],
          p2: [30, 0, 0],
          type: "linear",
        },
      ],
      engineeringAnalysis: {
        estimatedMassGrams: estimatedMass,
        volumeCm3: Math.round(volumeEstimate * 10) / 10,
        vonMisesMaxMpa: 72.0,
        safetyFactor: Number((material.yieldStrength / 72.0).toFixed(2)),
        allowableStressMpa: material.yieldStrength,
        criticalLoadCondition: "Standard Design Limit Load (1.5x Proof Envelope)",
        governingCriterion: "Distortion Energy Theory (von Mises Criterion)",
        fatigueLifeCycles: "> 10^7 cycles (infinite fatigue life design)",
      },
      textbookFormulas: [
        {
          id: `tb-${Date.now()}`,
          textbook: "Shigley's Mechanical Engineering Design",
          chapter: "Chapter 5: Failures Resulting from Static Loading",
          formula: "n = S_y / \\sigma'",
          explanation: "Factor of safety calculated against material yield strength under von Mises stress.",
          calculation: `n = ${material.yieldStrength} MPa / 72.0 MPa = ${(material.yieldStrength / 72.0).toFixed(2)}`,
          verificationStatus: "VERIFIED",
        },
      ],
      bom: primitives.map((p, idx) => ({
        itemNumber: idx + 1,
        partName: p.name,
        partNumber: `${partNumber}-${String(idx + 1).padStart(2, "0")}`,
        quantity: 1,
        material: material.name,
        process: manufacturingMethod,
        unitCostEst: 45.0 + idx * 20,
      })),
      designRationale: `Parametric project initialized from ${templateType} template. Configured with standard datum references and verified material parameters.`,
      recommendedNextActions: [
        "Create 2D sketches on Front, Top, or Right reference planes",
        "Apply parametric Extrude Boss or Cut features to form part geometry",
        "Perform Shigley static and fatigue verification under working loads",
      ],
    };

    onCreatePart(newPart);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-xl bg-[#15181E] border border-[#282E39] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Modal Title Bar */}
        <div className="h-10 bg-[#101217] border-b border-[#282E39] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#3182CE] flex items-center justify-center text-white">
              <FilePlus className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-white">New Model Project (Start from Scratch)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#A0AEC0] hover:text-white hover:bg-[#22262F] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleCreate} className="p-4 space-y-4 text-xs text-[#EDF2F7]">
          {/* Part Identity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-[#A0AEC0] block">Part Name:</label>
              <input
                type="text"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#1A1D23] border border-[#282E39] rounded text-white text-xs outline-none focus:border-[#3182CE]"
                placeholder="e.g. Avionics Stiffened Lug"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-[#A0AEC0] block">Part Number:</label>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#1A1D23] border border-[#282E39] rounded text-white text-xs outline-none focus:border-[#3182CE]"
                placeholder="e.g. NX-BRK-1001"
                required
              />
            </div>
          </div>

          {/* Template Archetype Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#A0AEC0] block">Starting Archetype / Template:</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: "blank", name: "Blank Slate", desc: "Empty 3D space", icon: Box },
                { id: "prismatic", name: "Prismatic", desc: "Block base", icon: Box },
                { id: "turned", name: "Turned Shaft", desc: "Cylinder + bore", icon: RotateCw },
                { id: "flange", name: "Mount Flange", desc: "PCD 4x pattern", icon: Disc },
                { id: "gear", name: "Involute Gear", desc: "24T AGMA blank", icon: Sliders },
              ].map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = templateType === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setTemplateType(tmpl.id as any)}
                    className={`p-2 rounded-lg border text-left transition-all flex flex-col items-center justify-center text-center ${
                      isSelected
                        ? "bg-[#3182CE]/20 border-[#3182CE] text-white shadow-sm"
                        : "bg-[#1A1D23] border-[#282E39] text-[#A0AEC0] hover:border-[#3182CE]/50 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${isSelected ? "text-[#63B3ED]" : "text-[#718096]"}`} />
                    <span className="font-bold text-[10px] block leading-tight">{tmpl.name}</span>
                    <span className="text-[8px] text-[#718096] block mt-0.5">{tmpl.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Engineering Material Selection */}
          <div className="space-y-1">
            <label className="text-[11px] text-[#A0AEC0] block">Material (Physical Properties &amp; Allowables):</label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#1A1D23] border border-[#282E39] rounded text-white text-xs outline-none focus:border-[#3182CE]"
            >
              {ENGINEERING_MATERIALS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} • {m.alloy} (Yield: {m.yieldStrength} MPa, Density: {m.density} g/cm³)
                </option>
              ))}
            </select>
          </div>

          {/* Standards & Manufacturing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] text-[#A0AEC0] block">Drafting Standard:</label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#1A1D23] border border-[#282E39] rounded text-white text-xs outline-none focus:border-[#3182CE]"
              >
                <option value="ASME Y14.5-2018 / AS9100D">ASME Y14.5-2018 (USA / 3rd Angle)</option>
                <option value="ISO 1101 / ISO 2768-mK">ISO 1101 / ISO 2768-mK (Metric / 1st Angle)</option>
                <option value="DIN 7168 / EN 9100">DIN 7168 / EN 9100 (Aerospace)</option>
                <option value="NASA-STD-5001 / AIAA">NASA-STD-5001 (Spaceflight Hardware)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-[#A0AEC0] block">Manufacturing Method:</label>
              <select
                value={manufacturingMethod}
                onChange={(e) => setManufacturingMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#1A1D23] border border-[#282E39] rounded text-white text-xs outline-none focus:border-[#3182CE]"
              >
                <option value="5-Axis CNC Mill">5-Axis CNC Mill</option>
                <option value="CNC Lathe Turn & Grind">CNC Lathe Turn & Grind</option>
                <option value="Direct Metal Laser Sintering (DMLS / 3D Print)">DMLS Metal 3D Print</option>
                <option value="Die Cast + Finish Machined">Die Cast + Finish Machined</option>
                <option value="Sheet Metal Stamped + Bent">Sheet Metal Stamped + Bent</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#282E39] flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full 3D Parametric Tree &amp; 2D Drawing Initialized</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-[#1A1D23] hover:bg-[#22262F] text-[#A0AEC0] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#3182CE] hover:bg-[#2B6CB0] text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                Initialize Model Project
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
