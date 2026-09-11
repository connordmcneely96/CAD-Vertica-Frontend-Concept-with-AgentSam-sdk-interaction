import React from "react";
import { CADPart } from "../types/cad";
import { BENCHMARK_PARTS } from "../data/standardParts";
import { 
  Box, 
  Layers, 
  FileText, 
  BookOpen, 
  GitBranch, 
  ShieldCheck, 
  Cpu, 
  ChevronDown,
  Sparkles,
  Award
} from "lucide-react";

interface TopBarProps {
  currentPart: CADPart;
  onSelectPart: (part: CADPart) => void;
  activeView: "cad3d" | "blueprint2d" | "standards" | "textbook" | "lifecycle";
  onSelectView: (view: "cad3d" | "blueprint2d" | "standards" | "textbook" | "lifecycle") => void;
  onNewModel?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentPart,
  onSelectPart,
  activeView,
  onSelectView,
  onNewModel,
}) => {
  return (
    <header id="nexus-topbar" className="h-14 bg-[#15181E] border-b border-[#282E39] px-4 flex items-center justify-between font-mono select-none">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#3182CE] flex items-center justify-center shadow-md shadow-[#3182CE]/20">
            <Cpu className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-wider">
                NEXUS<span className="text-[#3182CE]">CAD</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1D23] text-[#63B3ED] border border-[#282E39] font-medium">
                DELIVERY OS v4.2
              </span>
            </div>
            <div className="text-[10px] text-[#A0AEC0] truncate max-w-xs">
              SYS-ID: NX-AERO-2026 // GATE: <strong className="text-emerald-400">CDR SIGN-OFF</strong>
            </div>
          </div>
        </div>

        {/* Benchmark Part Selector Dropdown & New Model */}
        <div className="relative ml-3 border-l border-[#282E39] pl-3 flex items-center gap-2">
          <select
            id="part-selector-dropdown"
            value={currentPart.id}
            onChange={(e) => {
              const selected = BENCHMARK_PARTS.find((p) => p.id === e.target.value);
              if (selected) onSelectPart(selected);
            }}
            className="bg-[#1A1D23] border border-[#282E39] hover:border-[#3182CE]/60 text-white rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none cursor-pointer transition-colors shadow-sm"
          >
            {BENCHMARK_PARTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.partNumber} • {p.name}
              </option>
            ))}
          </select>

          {onNewModel && (
            <button
              id="nexus-new-model-btn"
              onClick={onNewModel}
              className="px-2.5 py-1.5 bg-[#3182CE]/20 hover:bg-[#3182CE] border border-[#3182CE]/50 hover:border-[#3182CE] text-[#63B3ED] hover:text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow-sm"
              title="Start a new model from scratch or parametric template"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Model</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Mode Navigation Tabs */}
      <div className="flex items-center bg-[#101217] p-1 rounded-xl border border-[#282E39] gap-1">
        <button
          id="nav-cad3d-btn"
          onClick={() => onSelectView("cad3d")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
            activeView === "cad3d"
              ? "bg-[#3182CE] text-white font-bold shadow-sm"
              : "text-[#A0AEC0] hover:text-white hover:bg-[#1A1D23]"
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          3D CAD Space
        </button>

        <button
          id="nav-blueprint-btn"
          onClick={() => onSelectView("blueprint2d")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
            activeView === "blueprint2d"
              ? "bg-[#3182CE] text-white font-bold shadow-sm"
              : "text-[#A0AEC0] hover:text-white hover:bg-[#1A1D23]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          2D Blueprint
        </button>

        <button
          id="nav-standards-btn"
          onClick={() => onSelectView("standards")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
            activeView === "standards"
              ? "bg-[#3182CE] text-white font-bold shadow-sm"
              : "text-[#A0AEC0] hover:text-white hover:bg-[#1A1D23]"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Standards &amp; Design Flows
        </button>

        <button
          id="nav-textbook-btn"
          onClick={() => onSelectView("textbook")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
            activeView === "textbook"
              ? "bg-[#3182CE] text-white font-bold shadow-sm"
              : "text-[#A0AEC0] hover:text-white hover:bg-[#1A1D23]"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Textbook Math
        </button>

        <button
          id="nav-lifecycle-btn"
          onClick={() => onSelectView("lifecycle")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
            activeView === "lifecycle"
              ? "bg-[#3182CE] text-white font-bold shadow-sm"
              : "text-[#A0AEC0] hover:text-white hover:bg-[#1A1D23]"
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          Delivery &amp; ECO Board
        </button>
      </div>

      {/* Right Stats & Standards Badges */}
      <div className="flex items-center gap-3">
        <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono border-r border-[#282E39] pr-3">
          <span className="text-[#A0AEC0]">Material: <strong className="text-white">{currentPart.material.name}</strong></span>
          <span className="text-[#4A5568]">•</span>
          <span className="text-[#A0AEC0]">SF: <strong className="text-emerald-400">{currentPart.engineeringAnalysis.safetyFactor.toFixed(2)}</strong></span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="px-2 py-1 rounded bg-[#1A1D23] border border-[#282E39] text-[10px] text-[#63B3ED] flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            ASME Y14.5
          </div>
          <div className="px-2 py-1 rounded bg-[#1A1D23] border border-[#282E39] text-[10px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            AS9100D
          </div>
        </div>
      </div>
    </header>
  );
};
