import React, { useState, useMemo, useEffect } from "react";
import { CADPart, CADPrimitive } from "../types/cad";
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  FileText, 
  Maximize2,
  Table,
  CheckCircle2
} from "lucide-react";

interface BlueprintSheetProps {
  part: CADPart;
  onBackTo3D: () => void;
  initialTab?: "drawing" | "bom";
}

export const BlueprintSheet: React.FC<BlueprintSheetProps> = ({ part, onBackTo3D, initialTab }) => {
  const [projectionAngle, setProjectionAngle] = useState<"third" | "first">("third");
  const [showHiddenLines, setShowHiddenLines] = useState<boolean>(true);
  const [showCenterlines, setShowCenterlines] = useState<boolean>(true);
  const [activeSheetTab, setActiveSheetTab] = useState<"drawing" | "bom">(initialTab || "drawing");

  useEffect(() => {
    if (initialTab) {
      setActiveSheetTab(initialTab);
    }
  }, [initialTab]);

  // Calculate Part Bounding Box
  const bounds = useMemo(() => {
    let minX = -30, maxX = 30, minY = -15, maxY = 15, minZ = -20, maxZ = 20;

    part.primitives.forEach((prim) => {
      const [px, py, pz] = prim.position;
      const dims = prim.dimensions || {};
      const hw = (dims.width || dims.radius || 20) / 2;
      const hh = (dims.height || 20) / 2;
      const hd = (dims.depth || dims.radius || 20) / 2;

      minX = Math.min(minX, px - hw);
      maxX = Math.max(maxX, px + hw);
      minY = Math.min(minY, py - hh);
      maxY = Math.max(maxY, py + hh);
      minZ = Math.min(minZ, pz - hd);
      maxZ = Math.max(maxZ, pz + hd);
    });

    const width = Math.max(20, maxX - minX);
    const height = Math.max(10, maxY - minY);
    const depth = Math.max(20, maxZ - minZ);

    return { minX, maxX, minY, maxY, minZ, maxZ, width, height, depth };
  }, [part.primitives]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportSVG = () => {
    const svgElement = document.getElementById("blueprint-sheet-svg-frame");
    if (!svgElement) {
      window.print();
      return;
    }
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${part.partNumber}_2D_Drawing.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="blueprint-sheet-view" className="h-full flex flex-col bg-[#0F1115] p-3 overflow-y-auto font-mono select-none">
      {/* Top Action & Configuration Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-[#282E39] pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackTo3D}
            className="px-3 py-1.5 bg-[#1A1D23] hover:bg-[#22262F] border border-[#282E39] text-[#63B3ED] rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to 3D Space
          </button>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3182CE]" />
              2D Technical Drawing • {part.partNumber} [REV {part.revision}]
            </h2>
            <span className="text-[11px] text-[#A0AEC0]">
              Standard: ASME Y14.5M-2018 / Third-Angle Projection • Scale 1:1
            </span>
          </div>
        </div>

        {/* Controls: Projection Angle, Hidden Lines, Print */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-[#15181E] border border-[#282E39] rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setActiveSheetTab("drawing")}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeSheetTab === "drawing" ? "bg-[#3182CE] text-white font-bold" : "text-[#A0AEC0] hover:text-white"
              }`}
            >
              Drawing Views
            </button>
            <button
              onClick={() => setActiveSheetTab("bom")}
              className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
                activeSheetTab === "bom" ? "bg-[#3182CE] text-white font-bold" : "text-[#A0AEC0] hover:text-white"
              }`}
            >
              <Table className="w-3 h-3" />
              BOM Table ({part.primitives.length})
            </button>
          </div>

          <div className="flex items-center bg-[#15181E] border border-[#282E39] rounded-lg p-0.5 text-[11px]">
            <button
              onClick={() => setProjectionAngle("third")}
              className={`px-2 py-1 rounded transition-colors ${
                projectionAngle === "third" ? "bg-[#252A34] text-sky-400 font-bold" : "text-[#A0AEC0] hover:text-white"
              }`}
              title="Third Angle Projection (USA / ASME)"
            >
              3rd Angle
            </button>
            <button
              onClick={() => setProjectionAngle("first")}
              className={`px-2 py-1 rounded transition-colors ${
                projectionAngle === "first" ? "bg-[#252A34] text-sky-400 font-bold" : "text-[#A0AEC0] hover:text-white"
              }`}
              title="First Angle Projection (ISO / DIN)"
            >
              1st Angle
            </button>
          </div>

          <button
            onClick={() => setShowHiddenLines(!showHiddenLines)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1 transition-colors ${
              showHiddenLines 
                ? "bg-[#1A1D23] border-[#3182CE]/60 text-sky-400" 
                : "bg-[#15181E] border-[#282E39] text-[#718096]"
            }`}
            title="Toggle Hidden Feature Lines"
          >
            {showHiddenLines ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Hidden
          </button>

          <button
            onClick={() => setShowCenterlines(!showCenterlines)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border flex items-center gap-1 transition-colors ${
              showCenterlines 
                ? "bg-[#1A1D23] border-[#3182CE]/60 text-sky-400" 
                : "bg-[#15181E] border-[#282E39] text-[#718096]"
            }`}
            title="Toggle Axis Centerlines"
          >
            Centerlines
          </button>

          <button
            onClick={handleExportSVG}
            className="px-3 py-1.5 bg-[#1A1D23] hover:bg-[#22262F] border border-[#282E39] text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            title="Export Vector SVG Drawing"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export SVG
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-[#3182CE] hover:bg-[#2B6CB0] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Drawing
          </button>
        </div>
      </div>

      {activeSheetTab === "bom" ? (
        /* Bill of Materials (BOM) View */
        <div className="flex-1 bg-[#15181E] border border-[#282E39] rounded-xl p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between border-b border-[#282E39] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Table className="w-4 h-4 text-emerald-400" />
                Parametric Bill of Materials (BOM) • {part.partNumber}
              </h3>
              <p className="text-xs text-[#A0AEC0]">
                Engineering decomposition of all active solid primitives, features, and mechanical constraints.
              </p>
            </div>
            <span className="text-xs font-mono text-sky-400 bg-[#1A1D23] px-2.5 py-1 rounded border border-[#282E39]">
              Total Features: {part.primitives.length}
            </span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#282E39] bg-[#101217] text-[#A0AEC0]">
                <th className="p-2.5 font-mono">ITEM NO.</th>
                <th className="p-2.5 font-mono">FEATURE NAME</th>
                <th className="p-2.5 font-mono">PRIMITIVE TYPE</th>
                <th className="p-2.5 font-mono">ROLE</th>
                <th className="p-2.5 font-mono">DIMENSIONS (MM)</th>
                <th className="p-2.5 font-mono">MATERIAL</th>
                <th className="p-2.5 font-mono">MASS CONTRIBUTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#282E39] text-[#EDF2F7]">
              {part.primitives.map((prim, idx) => {
                const dims = prim.dimensions || {};
                const dimStr = prim.type === "cylinder"
                  ? `Ø${((dims.radius || 15) * 2).toFixed(1)} × L${dims.height || 30}`
                  : prim.type === "box"
                  ? `${dims.width || 40} × ${dims.height || 20} × ${dims.depth || 30}`
                  : prim.type === "revolved"
                  ? `Revolved 360° Profile`
                  : `Parametric Feature`;

                const estPrimMass = prim.isHole ? "-" : `${Math.round(((dims.width || 30) * (dims.height || 20) * (dims.depth || 20) * 0.0027))}g`;

                return (
                  <tr key={prim.id} className="hover:bg-[#1A1D23]/50 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-sky-400">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold">{prim.name}</td>
                    <td className="p-2.5 font-mono uppercase text-[#A0AEC0]">{prim.type}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        prim.isHole ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      }`}>
                        {prim.isHole ? "CUT / HOLE" : "BOSS / SOLID"}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-emerald-400">{dimStr}</td>
                    <td className="p-2.5 font-mono text-slate-300">{part.material.name}</td>
                    <td className="p-2.5 font-mono text-slate-400">{estPrimMass}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Classic ANSI / ISO Engineering Drawing Paper Frame */
        <div 
          id="blueprint-sheet-svg-frame"
          className="flex-1 bg-[#FBF9F5] text-slate-900 border-[3px] border-slate-900 rounded-lg p-3 shadow-2xl relative flex flex-col min-h-[720px]"
        >
          {/* Drawing Border Coordinate Zones (8 to 1, A to D) */}
          <div className="absolute top-1 left-6 right-6 flex justify-between text-[9px] font-bold text-slate-500 select-none">
            <span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
          </div>
          <div className="absolute top-6 bottom-6 left-1.5 flex flex-col justify-between text-[9px] font-bold text-slate-500 select-none">
            <span>A</span><span>B</span><span>C</span><span>D</span>
          </div>
          <div className="absolute top-6 bottom-6 right-1.5 flex flex-col justify-between text-[9px] font-bold text-slate-500 select-none">
            <span>A</span><span>B</span><span>C</span><span>D</span>
          </div>
          <div className="absolute bottom-1 left-6 right-6 flex justify-between text-[9px] font-bold text-slate-500 select-none">
            <span>8</span><span>7</span><span>6</span><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
          </div>

          {/* Inner Border Line */}
          <div className="flex-1 border-[1.5px] border-slate-800 p-3 flex flex-col justify-between relative bg-white/90">
            {/* Drawing Views Grid (Top Plan, Isometric Pictorial, Front Elevation, Right / GD&T) */}
            <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-3 min-h-0">
              {/* 1. Top Plan View (X-Z Projection) */}
              <div className="col-span-6 row-span-3 border border-dashed border-slate-300 p-2 relative flex flex-col justify-between bg-white">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 uppercase">
                  <span>TOP PLAN VIEW [SCALE 1:1]</span>
                  <span className="text-[9px] text-slate-400">X-Z DATUMS</span>
                </div>

                <div className="flex-1 flex items-center justify-center p-2">
                  <svg viewBox="-80 -60 160 120" className="w-full h-full max-h-48 overflow-visible">
                    {/* Centerlines */}
                    {showCenterlines && (
                      <g stroke="#0284c7" strokeWidth="0.8" strokeDasharray="6,2,1.5,2">
                        <line x1="-75" y1="0" x2="75" y2="0" />
                        <line x1="0" y1="-55" x2="0" y2="55" />
                      </g>
                    )}

                    {/* Primitives Projected on Top View (X vs Z) */}
                    {part.primitives.map((prim) => {
                      const [px, , pz] = prim.position;
                      const dims = prim.dimensions || {};

                      if (prim.type === "cylinder") {
                        const r = dims.radius || 15;
                        return (
                          <g key={prim.id}>
                            <circle
                              cx={px}
                              cy={pz}
                              r={r}
                              fill={prim.isHole ? "#f8fafc" : "none"}
                              stroke="#0f172a"
                              strokeWidth={prim.isHole ? "1.5" : "2"}
                              strokeDasharray={prim.isHole && showHiddenLines ? "3,2" : undefined}
                            />
                            {showCenterlines && (
                              <g stroke="#0284c7" strokeWidth="0.6">
                                <line x1={px - r - 3} y1={pz} x2={px + r + 3} y2={pz} />
                                <line x1={px} y1={pz - r - 3} x2={px} y2={pz + r + 3} />
                              </g>
                            )}
                          </g>
                        );
                      }

                      // Box / Default
                      const w = dims.width || 40;
                      const d = dims.depth || 30;
                      return (
                        <rect
                          key={prim.id}
                          x={px - w / 2}
                          y={pz - d / 2}
                          width={w}
                          height={d}
                          fill={prim.isHole ? "#f1f5f9" : "none"}
                          stroke="#0f172a"
                          strokeWidth="2"
                          strokeDasharray={prim.isHole && showHiddenLines ? "3,2" : undefined}
                        />
                      );
                    })}

                    {/* Overall Width Dimension Callout */}
                    <line x1="-40" y1="45" x2="40" y2="45" stroke="#0f172a" strokeWidth="1" />
                    <line x1="-40" y1="40" x2="-40" y2="50" stroke="#0f172a" strokeWidth="1" />
                    <line x1="40" y1="40" x2="40" y2="50" stroke="#0f172a" strokeWidth="1" />
                    <text x="0" y="42" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#0f172a">
                      {bounds.width.toFixed(1)} ±0.1
                    </text>
                  </svg>
                </div>

                <div className="text-[9px] text-slate-500 flex justify-between">
                  <span>OVERALL WIDTH: {bounds.width.toFixed(1)} mm</span>
                  <span>DEPTH: {bounds.depth.toFixed(1)} mm</span>
                </div>
              </div>

              {/* 2. Isometric Pictorial Projection */}
              <div className="col-span-6 row-span-3 border border-dashed border-slate-300 p-2 relative flex flex-col justify-between bg-white">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 uppercase">
                  <span>ISOMETRIC PICTORIAL PROJECTION</span>
                  <span className="text-[9px] text-sky-600 font-semibold">SHIGLEY SYNTHESIS STAGE 4</span>
                </div>

                <div className="flex-1 flex items-center justify-center p-2">
                  <svg viewBox="-80 -60 160 120" className="w-full h-full max-h-48 overflow-visible">
                    {/* Isometric Base Plate */}
                    <path
                      d="M -50 15 L 0 40 L 50 15 L 0 -10 Z"
                      fill="#e2e8f0"
                      stroke="#0f172a"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M -50 15 L -50 25 L 0 50 L 0 40 Z"
                      fill="#cbd5e1"
                      stroke="#0f172a"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M 0 50 L 50 25 L 50 15 L 0 40 Z"
                      fill="#94a3b8"
                      stroke="#0f172a"
                      strokeWidth="1.8"
                    />

                    {/* Isometric Cylinder / Boss Profile */}
                    <ellipse cx="0" cy="5" rx="22" ry="11" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.6" />
                    <path
                      d="M -22 5 L -22 -15 A 22 11 0 0 1 22 -15 L 22 5 A 22 11 0 0 1 -22 5"
                      fill="#e0f2fe"
                      stroke="#0284c7"
                      strokeWidth="1.6"
                    />
                    <ellipse cx="0" cy="-15" rx="22" ry="11" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.6" />

                    {/* Center Bore */}
                    <ellipse cx="0" cy="-15" rx="9" ry="4.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />

                    {/* Leader Callout */}
                    <line x1="12" y1="-15" x2="35" y2="-35" stroke="#0f172a" strokeWidth="1" />
                    <line x1="35" y1="-35" x2="65" y2="-35" stroke="#0f172a" strokeWidth="1" />
                    <text x="38" y="-38" fontSize="7" fontWeight="bold" fill="#0f172a">
                      {part.name}
                    </text>
                  </svg>
                </div>

                <div className="text-[9px] text-slate-500 flex justify-between">
                  <span>THIRD ANGLE (USA / ISO)</span>
                  <span>FINISH: Ra 1.6 μm ALL OVER</span>
                </div>
              </div>

              {/* 3. Front Elevation View (X-Y Projection) */}
              <div className="col-span-6 row-span-3 border border-dashed border-slate-300 p-2 relative flex flex-col justify-between bg-white">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 uppercase">
                  <span>FRONT ELEVATION VIEW</span>
                  <span className="text-[9px] text-slate-400">DATUM [A] REF</span>
                </div>

                <div className="flex-1 flex items-center justify-center p-2">
                  <svg viewBox="-80 -50 160 100" className="w-full h-full max-h-40 overflow-visible">
                    {/* Base Datum Face [A] Line */}
                    <line x1="-60" y1="30" x2="60" y2="30" stroke="#0f172a" strokeWidth="2.5" />

                    {/* Datum [A] Feature Symbol */}
                    <rect x="-55" y="32" width="12" height="10" fill="#0f172a" />
                    <text x="-49" y="40" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">A</text>
                    <line x1="-49" y1="30" x2="-49" y2="32" stroke="#0f172a" strokeWidth="1.5" />

                    {/* Projected Primitives */}
                    {part.primitives.map((prim) => {
                      const [px, py] = prim.position;
                      const dims = prim.dimensions || {};
                      const w = dims.width || (dims.radius ? dims.radius * 2 : 30);
                      const h = dims.height || 20;

                      return (
                        <rect
                          key={prim.id}
                          x={px - w / 2}
                          y={-py - h / 2 + 10}
                          width={w}
                          height={h}
                          fill={prim.isHole ? "#ffffff" : "#f1f5f9"}
                          stroke="#0f172a"
                          strokeWidth={prim.isHole ? "1.5" : "2"}
                          strokeDasharray={prim.isHole && showHiddenLines ? "3,2" : undefined}
                        />
                      );
                    })}

                    {/* Height Dimension Leader */}
                    <line x1="55" y1="-25" x2="55" y2="30" stroke="#0f172a" strokeWidth="1" />
                    <line x1="50" y1="-25" x2="60" y2="-25" stroke="#0f172a" strokeWidth="1" />
                    <line x1="50" y1="30" x2="60" y2="30" stroke="#0f172a" strokeWidth="1" />
                    <text x="58" y="5" fontSize="7" fontWeight="bold" fill="#0f172a">
                      {bounds.height.toFixed(1)}
                    </text>
                  </svg>
                </div>

                <div className="text-[9px] text-slate-500 flex justify-between">
                  <span>PRIMARY DATUM [A] MOUNTING FACE</span>
                  <span>HEIGHT: {bounds.height.toFixed(1)} mm</span>
                </div>
              </div>

              {/* 4. GD&T Feature Control Frames & ASME Notes */}
              <div className="col-span-6 row-span-3 border border-dashed border-slate-300 p-2 relative flex flex-col justify-between bg-white overflow-hidden">
                <div className="text-[10px] font-bold text-slate-700 uppercase flex items-center justify-between">
                  <span>GD&amp;T FEATURE CONTROL FRAMES</span>
                  <span className="text-[9px] text-emerald-600 font-bold">ASME Y14.5M</span>
                </div>

                <div className="space-y-1.5 my-1 overflow-y-auto max-h-36 pr-1">
                  {part.gdtCallouts.map((g, idx) => (
                    <div key={idx} className="flex items-center text-[9px] font-mono border border-slate-800 bg-white">
                      <div className="px-2 py-0.5 border-r border-slate-800 font-black bg-slate-100 uppercase">
                        {g.symbol}
                      </div>
                      <div className="px-2 py-0.5 border-r border-slate-800 text-sky-800 font-bold">
                        {g.tolerance} {g.modifier && `Ⓢ${g.modifier}`}
                      </div>
                      <div className="px-2 py-0.5 border-r border-slate-800 text-slate-700 font-bold">
                        {g.datumRefs}
                      </div>
                      <div className="px-2 py-0.5 text-slate-600 text-[8px] truncate">
                        {g.feature}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-300 pt-1 text-[8px] text-slate-600 space-y-0.5">
                  <div>1. INTERPRET DIMENSIONS PER ASME Y14.5M-2018.</div>
                  <div>2. UNLESS OTHERWISE SPECIFIED: ANGULARITY ±0.5°, LINEAR ±0.1mm.</div>
                  <div>3. REMOVE BURRS AND SHARP EDGES 0.2-0.4mm MAX.</div>
                </div>
              </div>
            </div>

            {/* Master SolidWorks / ANSI Engineering Title Block */}
            <div className="mt-2 border-[2px] border-slate-900 grid grid-cols-12 text-[9px] bg-slate-100 shrink-0">
              <div className="col-span-5 p-2 border-r border-slate-900 flex flex-col justify-between">
                <div>
                  <span className="text-[7px] text-slate-500 uppercase block">COMPANY / DESIGN AUTHORITY</span>
                  <span className="font-black text-xs text-slate-900 tracking-wide">NEXUSCAD AEROSPACE SYSTEMS</span>
                </div>
                <div className="mt-1">
                  <span className="text-[7px] text-slate-500 uppercase block">DRAWING TITLE</span>
                  <span className="font-bold text-slate-900 text-[10px]">{part.name}</span>
                </div>
              </div>

              <div className="col-span-4 p-2 border-r border-slate-900 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <span className="text-[7px] text-slate-500 uppercase block">PART NUMBER</span>
                    <span className="font-bold text-slate-900">{part.partNumber}</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-slate-500 uppercase block">REVISION</span>
                    <span className="font-bold text-amber-700">{part.revision}</span>
                  </div>
                </div>
                <div className="mt-1">
                  <span className="text-[7px] text-slate-500 uppercase block">MATERIAL &amp; FINISH</span>
                  <span className="font-bold text-slate-800 text-[8px] truncate block">
                    {part.material.name} ({part.material.standardSpec})
                  </span>
                </div>
              </div>

              <div className="col-span-3 p-2 flex flex-col justify-between bg-slate-200/60">
                <div className="flex justify-between">
                  <span>SCALE: <strong>1:1</strong></span>
                  <span>MASS: <strong>{part.engineeringAnalysis.estimatedMassGrams}g</strong></span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[7px] text-slate-500 uppercase">PROJECTION</span>
                  <span className="font-bold text-slate-900">
                    {projectionAngle === "third" ? "3RD ANGLE" : "1ST ANGLE"}
                  </span>
                </div>
                <div className="mt-0.5">
                  <span className="font-bold text-emerald-700 flex items-center gap-1 text-[8px]">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    PE SIGN-OFF (PDR/CDR)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
