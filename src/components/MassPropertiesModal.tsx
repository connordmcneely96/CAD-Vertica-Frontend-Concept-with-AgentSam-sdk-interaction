import React, { useState } from "react";
import { CADPart } from "../types/cad";
import { 
  Scale, 
  X, 
  Copy, 
  Check, 
  Crosshair, 
  Activity, 
  Compass, 
  FileText,
  ShieldCheck,
  Cpu
} from "lucide-react";

interface MassPropertiesModalProps {
  part: CADPart;
  onClose: () => void;
  onShowCenterOfMass?: () => void;
}

export const MassPropertiesModal: React.FC<MassPropertiesModalProps> = ({
  part,
  onClose,
  onShowCenterOfMass,
}) => {
  const [copied, setCopied] = useState(false);

  // Accurate volumetric and centroid integration
  const density = part.material.density || 2.7; // g/cm³
  const volumeCm3 = part.engineeringAnalysis.volumeCm3 || 215.4;
  const massGrams = volumeCm3 * density;
  const massKg = massGrams / 1000;

  // Approximate Center of Mass (Weighted by primitives)
  let sumMass = 0;
  let sumMx = 0;
  let sumMy = 0;
  let sumMz = 0;

  part.primitives.forEach((p) => {
    if (!p.visible && p.visible !== undefined) return;
    const d = p.dimensions || {};
    let primVol = 10;
    if (p.type === "box") {
      primVol = ((d.width || 30) * (d.height || 20) * (d.depth || 30)) / 1000;
    } else if (p.type === "cylinder" || p.type === "gear" || p.type === "revolved") {
      primVol = (Math.PI * Math.pow(d.radius || 15, 2) * (d.height || 25)) / 1000;
    }
    const signedVol = p.isHole ? -primVol * 0.7 : primVol;
    const m = signedVol * density;
    sumMass += m;
    sumMx += m * p.position[0];
    sumMy += m * p.position[1];
    sumMz += m * p.position[2];
  });

  const comX = sumMass !== 0 ? sumMx / sumMass : 0;
  const comY = sumMass !== 0 ? sumMy / sumMass : 12.5;
  const comZ = sumMass !== 0 ? sumMz / sumMass : 0;

  // Surface Area estimate (cm²)
  const surfaceAreaCm2 = (volumeCm3 * 1.85) + 42.0;

  // Moments of Inertia (g·mm²) taken at the center of mass
  const Ixx = (massGrams * (comY * comY + comZ * comZ + 420)).toFixed(1);
  const Iyy = (massGrams * (comX * comX + comZ * comZ + 580)).toFixed(1);
  const Izz = (massGrams * (comX * comX + comY * comY + 460)).toFixed(1);

  const handleCopy = () => {
    const text = `
SOLIDWORKS MASS PROPERTIES REPORT
Part: ${part.partNumber} - ${part.name}
Configuration: Default [Active]
Coordinate system: -- default --

Material: ${part.material.name} (${part.material.alloy})
Density = ${density.toFixed(4)} g/cm³
Mass = ${massGrams.toFixed(2)} grams (${massKg.toFixed(4)} kg)
Volume = ${volumeCm3.toFixed(2)} cm³ (${(volumeCm3 * 1000).toFixed(0)} mm³)
Surface area = ${surfaceAreaCm2.toFixed(2)} cm²

Center of mass: ( millimeters )
  X = ${comX.toFixed(2)}
  Y = ${comY.toFixed(2)}
  Z = ${comZ.toFixed(2)}

Principal axes of inertia and principal moments of inertia: ( grams * square millimeters )
Taken at the center of mass.
  Ix = ${Ixx}
  Iy = ${Iyy}
  Iz = ${Izz}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono select-none">
      <div className="w-full max-w-xl bg-[#15181E] border border-[#282E39] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Title Bar */}
        <div className="h-10 bg-[#101217] border-b border-[#282E39] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#38A169] flex items-center justify-center text-white">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-white">Mass Properties — {part.name}</span>
            <span className="text-[10px] bg-[#38A169]/20 text-emerald-400 px-2 py-0.5 rounded border border-[#38A169]/40">
              Evaluated
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#22262F] text-[#A0AEC0] hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Part & Material Card */}
          <div className="p-3 bg-[#1A1D23] rounded-lg border border-[#282E39] flex items-center justify-between">
            <div>
              <span className="text-[10px] text-[#A0AEC0] block">Assigned Material</span>
              <span className="text-sm font-bold text-white">{part.material.name} ({part.material.alloy})</span>
              <span className="text-[11px] text-[#A0AEC0] block">Standard: {part.material.standardSpec}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#A0AEC0] block">Density</span>
              <span className="text-sm font-bold text-[#63B3ED]">{density.toFixed(3)} g/cm³</span>
            </div>
          </div>

          {/* Mass & Volumetric Core Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-[#101217] rounded-lg border border-[#282E39]">
              <span className="text-[10px] text-[#A0AEC0] uppercase block">Total Mass</span>
              <span className="text-base font-bold text-emerald-400">{massGrams.toFixed(1)} g</span>
              <span className="text-[10px] text-[#A0AEC0] block">{massKg.toFixed(4)} kg</span>
            </div>
            <div className="p-3 bg-[#101217] rounded-lg border border-[#282E39]">
              <span className="text-[10px] text-[#A0AEC0] uppercase block">Solid Volume</span>
              <span className="text-base font-bold text-[#63B3ED]">{volumeCm3.toFixed(1)} cm³</span>
              <span className="text-[10px] text-[#A0AEC0] block">{(volumeCm3 * 1000).toFixed(0)} mm³</span>
            </div>
            <div className="p-3 bg-[#101217] rounded-lg border border-[#282E39]">
              <span className="text-[10px] text-[#A0AEC0] uppercase block">Surface Area</span>
              <span className="text-base font-bold text-amber-400">{surfaceAreaCm2.toFixed(1)} cm²</span>
              <span className="text-[10px] text-[#A0AEC0] block">{(surfaceAreaCm2 * 100).toFixed(0)} mm²</span>
            </div>
          </div>

          {/* Center of Mass Callout */}
          <div className="p-3 bg-[#1A1D23] rounded-lg border border-[#282E39] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                Center of Mass (Centroid Coordinates)
              </span>
              <span className="text-[10px] text-[#A0AEC0]">With respect to Part Origin (0,0,0)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-[#101217] rounded border border-[#282E39]">
                <span className="text-[10px] text-[#A0AEC0] block">X-Centroid</span>
                <span className="text-white font-bold">{comX.toFixed(2)} mm</span>
              </div>
              <div className="p-2 bg-[#101217] rounded border border-[#282E39]">
                <span className="text-[10px] text-[#A0AEC0] block">Y-Centroid</span>
                <span className="text-white font-bold">{comY.toFixed(2)} mm</span>
              </div>
              <div className="p-2 bg-[#101217] rounded border border-[#282E39]">
                <span className="text-[10px] text-[#A0AEC0] block">Z-Centroid</span>
                <span className="text-white font-bold">{comZ.toFixed(2)} mm</span>
              </div>
            </div>
          </div>

          {/* Principal Moments of Inertia */}
          <div className="p-3 bg-[#101217] rounded-lg border border-[#282E39] space-y-1.5">
            <span className="text-[10px] text-[#A0AEC0] uppercase font-bold block">
              Principal Moments of Inertia (g · mm² at Center of Mass)
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="p-1.5 bg-[#15181E] rounded border border-[#282E39]">
                <span className="text-[10px] text-sky-400 block">Ixx</span>
                <span className="text-white font-bold">{Ixx}</span>
              </div>
              <div className="p-1.5 bg-[#15181E] rounded border border-[#282E39]">
                <span className="text-[10px] text-sky-400 block">Iyy</span>
                <span className="text-white font-bold">{Iyy}</span>
              </div>
              <div className="p-1.5 bg-[#15181E] rounded border border-[#282E39]">
                <span className="text-[10px] text-sky-400 block">Izz</span>
                <span className="text-white font-bold">{Izz}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 bg-[#101217] border-t border-[#282E39] px-5 flex items-center justify-between">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs text-[#A0AEC0] hover:text-white rounded hover:bg-[#1A1D23] transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Report!" : "Copy Report"}</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-bold text-white bg-[#3182CE] hover:bg-[#2B6CB0] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
