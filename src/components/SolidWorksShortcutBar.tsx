import React from "react";
import { 
  Box, 
  Scissors, 
  RotateCw, 
  CircleDot, 
  Ruler, 
  Pencil, 
  Scale, 
  Layers, 
  RefreshCw, 
  Flame, 
  X,
  Compass
} from "lucide-react";

interface SolidWorksShortcutBarProps {
  onSelectAction: (action: string) => void;
  onClose: () => void;
}

export const SolidWorksShortcutBar: React.FC<SolidWorksShortcutBarProps> = ({
  onSelectAction,
  onClose,
}) => {
  const tools = [
    { id: "extrude", name: "Extrude Boss", icon: Box, color: "text-[#3182CE]" },
    { id: "cut", name: "Extrude Cut", icon: Scissors, color: "text-rose-400" },
    { id: "revolve", name: "Revolve", icon: RotateCw, color: "text-[#38A169]" },
    { id: "hole_wizard", name: "Hole Wizard", icon: CircleDot, color: "text-amber-400" },
    { id: "fillet", name: "Fillet", icon: CircleDot, color: "text-indigo-400" },
    { id: "chamfer", name: "Chamfer", icon: Scissors, color: "text-amber-500" },
    { id: "sketch", name: "2D Sketch", icon: Pencil, color: "text-sky-400" },
    { id: "smart_dim", name: "Smart Dimension", icon: Compass, color: "text-emerald-400" },
    { id: "measure", name: "Measure", icon: Ruler, color: "text-yellow-400" },
    { id: "mass_props", name: "Mass Properties", icon: Scale, color: "text-emerald-400" },
    { id: "simulation", name: "FEA Simulation", icon: Flame, color: "text-amber-500" },
    { id: "rebuild", name: "Rebuild (Ctrl+B)", icon: RefreshCw, color: "text-emerald-400" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 select-none font-mono">
      <div className="w-80 bg-[#15181E] border-2 border-[#3182CE] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="h-8 bg-[#101217] border-b border-[#282E39] px-3 flex items-center justify-between text-xs text-white">
          <span className="font-bold flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#3182CE] flex items-center justify-center text-[10px]">S</span>
            SolidWorks Shortcut Bar
          </span>
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-[#22262F] text-[#A0AEC0] hover:text-white rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Shortcut Matrix */}
        <div className="p-3 grid grid-cols-4 gap-2 bg-[#1A1D23]">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onSelectAction(t.id);
                  onClose();
                }}
                className="p-2 bg-[#15181E] hover:bg-[#252A34] border border-[#282E39] hover:border-[#3182CE] rounded-lg flex flex-col items-center justify-center transition-all group"
                title={t.name}
              >
                <Icon className={`w-5 h-5 mb-1 ${t.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[9px] text-[#A0AEC0] group-hover:text-white text-center leading-tight truncate w-full">
                  {t.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-3 py-1.5 bg-[#101217] border-t border-[#282E39] text-[9px] text-[#A0AEC0] flex justify-between">
          <span>Press [S] to toggle</span>
          <span>SolidWorks 2026 UI</span>
        </div>
      </div>
    </div>
  );
};
