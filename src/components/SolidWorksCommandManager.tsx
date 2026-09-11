import React, { useState } from "react";
import { CADPart } from "../types/cad";
import { 
  Box, 
  RotateCw, 
  CircleDot, 
  Scissors, 
  Pencil, 
  Compass, 
  Ruler, 
  Scale, 
  Flame, 
  Layers, 
  FileText, 
  Copy, 
  RefreshCw, 
  ShieldCheck, 
  Maximize2, 
  Activity, 
  CheckCircle2,
  Sliders,
  ChevronDown,
  Sparkles,
  Search,
  Grid
} from "lucide-react";

export type SolidWorksTab = "features" | "sketch" | "evaluate" | "simulation" | "dimxpert" | "drawing";

interface SolidWorksCommandManagerProps {
  part: CADPart;
  activeCommandTab: SolidWorksTab;
  onSelectCommandTab: (tab: SolidWorksTab) => void;
  onExecuteTool: (tool: string, param?: any) => void;
  onRebuild: () => void;
  onOpenShortcutBar: () => void;
  renderMode: string;
}

export const SolidWorksCommandManager: React.FC<SolidWorksCommandManagerProps> = ({
  part,
  activeCommandTab,
  onSelectCommandTab,
  onExecuteTool,
  onRebuild,
  onOpenShortcutBar,
  renderMode,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const ALL_COMMANDS = [
    { id: "extrude", name: "Extruded Boss/Base", category: "Features", desc: "Adds 3D material via linear extrusion" },
    { id: "revolve", name: "Revolved Boss/Base", category: "Features", desc: "Revolves a sketch 360° around an axis" },
    { id: "sweep", name: "Swept Boss/Base", category: "Features", desc: "Sweeps a profile along a 3D guide path" },
    { id: "cut", name: "Extruded Cut", category: "Features", desc: "Removes material from solid via sketch profile" },
    { id: "hole_wizard", name: "Hole Wizard", category: "Features", desc: "Standard ISO/ANSI tapped/cbore hole patterns" },
    { id: "fillet", name: "Fillet", category: "Features", desc: "Adds smooth radius blend to sharp edges" },
    { id: "chamfer", name: "Chamfer", category: "Features", desc: "Bevels edges at 45° angle" },
    { id: "rib", name: "Rib", category: "Features", desc: "Adds structural stiffener web" },
    { id: "shell", name: "Shell", category: "Features", desc: "Hollows out the solid with thin walls" },
    { id: "circular_pattern", name: "Circular Pattern", category: "Features", desc: "Duplicates feature around circular PCD" },
    { id: "linear_pattern", name: "Linear Pattern", category: "Features", desc: "Array duplicate along X/Z axis" },
    { id: "mirror", name: "Mirror Feature", category: "Features", desc: "Reflects feature across datum plane" },
    { id: "open_sketch_studio", name: "2D Sketch Canvas", category: "Sketch", desc: "Open parametric 2D sketch canvas" },
    { id: "smart_dimension", name: "Smart Dimension", category: "Sketch", desc: "Toggle parametric dimension annotations" },
    { id: "sketch_line", name: "Line Tool", category: "Sketch", desc: "Sketch point-to-point lines" },
    { id: "sketch_rectangle", name: "Corner Rectangle", category: "Sketch", desc: "Sketch 2-point parametric rectangle" },
    { id: "sketch_circle", name: "Circle Tool", category: "Sketch", desc: "Sketch center-radius circle" },
    { id: "sketch_arc", name: "3-Point Arc", category: "Sketch", desc: "Sketch curvature arc" },
    { id: "sketch_slot", name: "Straight Slot", category: "Sketch", desc: "Sketch elongated slot profile" },
    { id: "sketch_polygon", name: "Polygon Hex", category: "Sketch", desc: "Sketch hex bolt head profile" },
    { id: "trim_entities", name: "Power Trim", category: "Sketch", desc: "Trim overlapping sketch entities" },
    { id: "offset_entities", name: "Offset Entities", category: "Sketch", desc: "Create parallel offset curve loop" },
    { id: "measure", name: "Measure Tool", category: "Evaluate", desc: "Measure distance, ΔX, ΔY, ΔZ between points" },
    { id: "mass_properties", name: "Mass Properties", category: "Evaluate", desc: "Calculate volume, mass, center of mass" },
    { id: "section_properties", name: "Section View", category: "Evaluate", desc: "Cycle dynamic cutting planes (X, Y, Z)" },
    { id: "interference_check", name: "Interference Detection", category: "Evaluate", desc: "Verify clearance between components" },
    { id: "zebra_stripes", name: "Zebra Stripes", category: "Evaluate", desc: "Inspect surface curvature continuity" },
    { id: "open_standards", name: "Engineering Standards & DFM", category: "Evaluate", desc: "Audit ISO 2768, ASME Y14.5 rules" },
    { id: "simulation_study", name: "Static FEA Study Setup", category: "Simulation", desc: "Set fixtures, loads, run von Mises solver" },
    { id: "toggle_stress_view", name: "von Mises Stress Plot", category: "Simulation", desc: "Toggle FEA stress contour overlay" },
    { id: "toggle_dimensions", name: "Auto DimXpert", category: "DimXpert", desc: "ASME Y14.5 datum & tolerance dimensioning" },
    { id: "add_datum", name: "Datum Targets", category: "DimXpert", desc: "Toggle datum references [A, B, C]" },
    { id: "gdt_tolerance", name: "Geometric Tolerancing (GD&T)", category: "DimXpert", desc: "Feature control frames & true position" },
    { id: "surface_finish", name: "Surface Finish Callout", category: "DimXpert", desc: "Ra 0.8 µm ground spec inspection" },
    { id: "open_blueprint", name: "2D Drawing Sheet", category: "Drawing", desc: "Generate ANSI/ISO engineering drawing" },
    { id: "standard_3_views", name: "Standard 3 Views", category: "Drawing", desc: "Front, Top, Right orthographic projections" },
    { id: "drawing_section", name: "Section View A-A", category: "Drawing", desc: "Internal cross-sectional technical drawing" },
    { id: "bom_table", name: "Bill of Materials (BOM)", category: "Drawing", desc: "Itemized hierarchical parts table" },
  ];

  const filteredCommands = searchQuery.trim()
    ? ALL_COMMANDS.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleCommandSelect = (cmdId: string) => {
    onExecuteTool(cmdId);
    setSearchQuery("");
    setActiveMenu(null);
  };

  return (
    <div id="solidworks-command-manager" className="bg-[#15181E] border-b border-[#282E39] font-mono select-none flex flex-col relative">
      {/* Top File / Menu Strip & Rebuild / Search bar */}
      <div className="h-8 bg-[#101217] border-b border-[#282E39] px-3 flex items-center justify-between text-xs text-[#A0AEC0]">
        {/* SolidWorks Menu Names */}
        <div className="flex items-center gap-3 relative">
          <span className="font-bold text-white flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveMenu(activeMenu === "File" ? null : "File")}>
            <span className="w-4 h-4 rounded bg-rose-600 flex items-center justify-center text-[10px] text-white font-extrabold shadow-sm">
              SW
            </span>
            <span className="text-[11px] tracking-wider text-slate-200">SOLIDWORKS 2026</span>
          </span>

          <div className="hidden sm:flex items-center gap-1 text-[11px]">
            {[
              { id: "File", label: "File" },
              { id: "Edit", label: "Edit" },
              { id: "View", label: "View" },
              { id: "Insert", label: "Insert" },
              { id: "Tools", label: "Tools" },
              { id: "Simulation", label: "Simulation" },
              { id: "Help", label: "Help" },
            ].map((menu) => (
              <button
                key={menu.id}
                onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  activeMenu === menu.id ? "bg-[#3182CE] text-white font-bold" : "hover:text-white hover:bg-[#22262F]"
                }`}
              >
                {menu.label}
              </button>
            ))}
          </div>

          {/* SolidWorks Top Dropdown Menus */}
          {activeMenu && (
            <div
              className="absolute top-7 left-12 w-60 bg-[#15181E] border border-[#282E39] rounded-lg shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 text-xs text-[#EDF2F7]"
              onMouseLeave={() => setActiveMenu(null)}
            >
              {activeMenu === "File" && (
                <>
                  <button onClick={() => { onRebuild(); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>Rebuild Model</span>
                    <span className="text-[10px] text-[#A0AEC0]">Ctrl+B</span>
                  </button>
                  <button onClick={() => { onExecuteTool("open_blueprint"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>Open 2D Drawing Sheet</span>
                    <span className="text-[10px] text-[#A0AEC0]">ASME Y14.5</span>
                  </button>
                  <button onClick={() => { onExecuteTool("bom_table"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>Bill of Materials (BOM)</span>
                    <span className="text-[10px] text-[#A0AEC0]">Table</span>
                  </button>
                </>
              )}

              {activeMenu === "Edit" && (
                <>
                  <button onClick={() => { onRebuild(); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>Rebuild Feature Tree</span>
                    <span className="text-[10px] text-[#A0AEC0]">Ctrl+B</span>
                  </button>
                  <button onClick={() => { onOpenShortcutBar(); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>SolidWorks Shortcut Bar</span>
                    <span className="text-[10px] text-[#A0AEC0]">S</span>
                  </button>
                </>
              )}

              {activeMenu === "View" && (
                <>
                  <button onClick={() => { onExecuteTool("section_properties"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>Section View (Cut Planes)</span>
                    <span className="text-[10px] text-[#A0AEC0]">X / Y / Z</span>
                  </button>
                  <button onClick={() => { onExecuteTool("toggle_stress_view"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>von Mises Stress Heatmap</span>
                    <span className="text-[10px] text-amber-400">FEA</span>
                  </button>
                  <button onClick={() => { onExecuteTool("zebra_stripes"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>Tolerance Inspection / Zebra</span>
                    <span className="text-[10px] text-[#A0AEC0]">G1/G2</span>
                  </button>
                  <button onClick={() => { onExecuteTool("smart_dimension"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>Toggle Dimensions</span>
                    <span className="text-[10px] text-[#A0AEC0]">DimXpert</span>
                  </button>
                </>
              )}

              {activeMenu === "Insert" && (
                <>
                  <button onClick={() => { onExecuteTool("extrude"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Boss / Extrude Solid
                  </button>
                  <button onClick={() => { onExecuteTool("revolve"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Revolved Boss / Base
                  </button>
                  <button onClick={() => { onExecuteTool("cut"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Extruded Cut
                  </button>
                  <button onClick={() => { onExecuteTool("hole_wizard"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded text-amber-400 font-bold">
                    Hole Wizard (ISO/ANSI)...
                  </button>
                  <button onClick={() => { onExecuteTool("fillet"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Fillet (Edge Blend)
                  </button>
                  <button onClick={() => { onExecuteTool("chamfer"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Chamfer (Bevel)
                  </button>
                  <button onClick={() => { onExecuteTool("circular_pattern"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Circular Pattern
                  </button>
                  <button onClick={() => { onExecuteTool("linear_pattern"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Linear Pattern
                  </button>
                  <button onClick={() => { onExecuteTool("mirror"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Mirror Feature
                  </button>
                </>
              )}

              {activeMenu === "Tools" && (
                <>
                  <button onClick={() => { onExecuteTool("measure"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>Measure Tool</span>
                    <span className="text-[10px] text-amber-400">ΔX, ΔY, ΔZ</span>
                  </button>
                  <button onClick={() => { onExecuteTool("mass_properties"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>Mass Properties</span>
                    <span className="text-[10px] text-emerald-400">COM &amp; Inertia</span>
                  </button>
                  <button onClick={() => { onExecuteTool("open_sketch_studio"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>2D Sketch &amp; 3D Modeler</span>
                    <span className="text-[10px] text-[#63B3ED]">Studio</span>
                  </button>
                  <button onClick={() => { onExecuteTool("open_standards"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex justify-between">
                    <span>Standards &amp; DFM Guidance</span>
                    <span className="text-[10px] text-purple-400">ISO/ASME</span>
                  </button>
                </>
              )}

              {activeMenu === "Simulation" && (
                <>
                  <button onClick={() => { onExecuteTool("simulation_study"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded text-amber-400 font-bold">
                    Static FEA Study Setup...
                  </button>
                  <button onClick={() => { onExecuteTool("toggle_stress_view"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Toggle von Mises Stress Plot
                  </button>
                </>
              )}

              {activeMenu === "Help" && (
                <>
                  <button onClick={() => { onExecuteTool("open_standards"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    ASME Y14.5 / ISO 1101 GD&amp;T Reference
                  </button>
                  <button onClick={() => { onExecuteTool("open_standards"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Shigley Mechanical Engineering Design Formulas
                  </button>
                  <button onClick={() => { onExecuteTool("open_standards"); setActiveMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded">
                    Pahl &amp; Beitz Systematic Engineering Flow
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Center/Right: Rebuild Traffic Light + Shortcut Launcher + Command Search */}
        <div className="flex items-center gap-2 relative">
          {/* SolidWorks Iconic Rebuild Traffic Light Button (Ctrl+B) */}
          <button
            onClick={onRebuild}
            className="px-2 py-0.5 bg-[#1A1D23] hover:bg-[#252A34] text-emerald-400 hover:text-emerald-300 border border-[#282E39] hover:border-emerald-500/50 rounded flex items-center gap-1 text-[11px] transition-all shadow-sm"
            title="Rebuild Model (Ctrl+B)"
          >
            <RefreshCw className="w-3 h-3 text-emerald-400" />
            <span className="font-bold text-[10px]">Rebuild</span>
          </button>

          {/* S Shortcut Key Button */}
          <button
            onClick={onOpenShortcutBar}
            className="px-2 py-0.5 bg-[#3182CE]/20 hover:bg-[#3182CE]/30 text-[#63B3ED] border border-[#3182CE]/40 rounded flex items-center gap-1 text-[10px] font-bold transition-all"
            title="Open Shortcut Bar (Press S)"
          >
            <span>[S] Bar</span>
          </button>

          {/* Command Search */}
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-[#A0AEC0] absolute left-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search commands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredCommands.length > 0) {
                  handleCommandSelect(filteredCommands[0].id);
                }
              }}
              className="bg-[#1A1D23] border border-[#282E39] focus:border-[#3182CE] rounded pl-7 pr-2 py-0.5 text-[10px] text-white placeholder-[#718096] w-36 sm:w-48 outline-none transition-all"
            />

            {/* Live Search Results Dropdown */}
            {searchQuery.trim() && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-[#15181E] border border-[#282E39] rounded-lg shadow-2xl p-1 z-50 max-h-64 overflow-y-auto text-xs animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] text-[#A0AEC0] uppercase font-bold border-b border-[#282E39] flex justify-between">
                  <span>Matching Commands</span>
                  <span>{filteredCommands.length} found</span>
                </div>
                {filteredCommands.length > 0 ? (
                  filteredCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => handleCommandSelect(cmd.id)}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-[#3182CE] hover:text-white rounded flex flex-col group transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px] group-hover:text-white">{cmd.name}</span>
                        <span className="text-[9px] px-1 bg-[#1A1D23] group-hover:bg-[#2B6CB0] rounded text-[#A0AEC0] group-hover:text-white">
                          {cmd.category}
                        </span>
                      </div>
                      <span className="text-[9px] text-[#A0AEC0] group-hover:text-white/80 truncate">{cmd.desc}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-[#718096] text-[11px]">
                    No matching command found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SolidWorks CommandManager Ribbon Tabs */}
      <div className="flex items-center border-b border-[#282E39] px-2 bg-[#13151A] gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: "features", label: "Features", icon: Box },
          { id: "sketch", label: "Sketch", icon: Pencil },
          { id: "evaluate", label: "Evaluate", icon: Scale },
          { id: "simulation", label: "Simulation", icon: Flame },
          { id: "dimxpert", label: "DimXpert / MBD", icon: Compass },
          { id: "drawing", label: "2D Drawing", icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCommandTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectCommandTab(tab.id as SolidWorksTab)}
              className={`px-3 py-1.5 text-xs font-mono font-medium transition-all flex items-center gap-1.5 border-b-2 ${
                isActive
                  ? "border-[#3182CE] text-white font-bold bg-[#1A1D23]"
                  : "border-transparent text-[#A0AEC0] hover:text-white hover:bg-[#1A1D23]/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#3182CE]" : "text-[#A0AEC0]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SolidWorks Command Toolbar Strip (Action Buttons for Selected Ribbon Tab) */}
      <div className="h-16 px-3 bg-[#171A21] flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {/* TAB 1: FEATURES */}
        {activeCommandTab === "features" && (
          <>
            {/* Extruded Boss/Base */}
            <button
              onClick={() => onExecuteTool("extrude")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Extruded Boss/Base"
            >
              <Box className="w-5 h-5 text-[#3182CE] group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Extruded Boss</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Base</span>
            </button>

            {/* Revolved Boss/Base */}
            <button
              onClick={() => onExecuteTool("revolve")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Revolved Boss/Base"
            >
              <RotateCw className="w-5 h-5 text-[#38A169] group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Revolved Boss</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">360° Axis</span>
            </button>

            {/* Swept Boss/Base */}
            <button
              onClick={() => onExecuteTool("sweep")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Swept Boss/Base"
            >
              <Sparkles className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Swept Boss</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Path Sweep</span>
            </button>

            <div className="h-10 w-[1px] bg-[#282E39] mx-1 shrink-0" />

            {/* Extruded Cut */}
            <button
              onClick={() => onExecuteTool("cut")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Extruded Cut"
            >
              <Scissors className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Extruded Cut</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Pocket</span>
            </button>

            {/* Hole Wizard */}
            <button
              onClick={() => onExecuteTool("hole_wizard")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-[#3182CE]/40 bg-[#3182CE]/10 flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Hole Wizard (ISO/ANSI Standards)"
            >
              <CircleDot className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-amber-300 font-bold block leading-none">Hole Wizard</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Standard Holes</span>
            </button>

            <div className="h-10 w-[1px] bg-[#282E39] mx-1 shrink-0" />

            {/* Fillet */}
            <button
              onClick={() => onExecuteTool("fillet")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Fillet (Blend Radius)"
            >
              <CircleDot className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Fillet</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Edge Blend</span>
            </button>

            {/* Chamfer */}
            <button
              onClick={() => onExecuteTool("chamfer")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Chamfer (45° Bevel)"
            >
              <Scissors className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Chamfer</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">45° Angle</span>
            </button>

            {/* Rib */}
            <button
              onClick={() => onExecuteTool("rib")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Rib (Structural Stiffener Web)"
            >
              <Sliders className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Rib</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Stiffener</span>
            </button>

            {/* Shell */}
            <button
              onClick={() => onExecuteTool("shell")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Shell (Hollow Solid with Uniform Wall)"
            >
              <Layers className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Shell</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Wall Thin</span>
            </button>

            <div className="h-10 w-[1px] bg-[#282E39] mx-1 shrink-0" />

            {/* Circular Pattern */}
            <button
              onClick={() => onExecuteTool("circular_pattern")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Circular Pattern"
            >
              <RotateCw className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Circular</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Pattern</span>
            </button>

            {/* Linear Pattern */}
            <button
              onClick={() => onExecuteTool("linear_pattern")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Linear Pattern"
            >
              <Grid className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Linear</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Pattern</span>
            </button>

            {/* Mirror */}
            <button
              onClick={() => onExecuteTool("mirror")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Mirror Feature"
            >
              <Copy className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Mirror</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Plane Copy</span>
            </button>
          </>
        )}

        {/* TAB 2: SKETCH */}
        {activeCommandTab === "sketch" && (
          <>
            {/* 2D Sketch Modeler Toggle */}
            <button
              onClick={() => onExecuteTool("open_sketch_studio")}
              className="h-full px-3 hover:bg-[#22262F] rounded border border-[#3182CE]/50 bg-[#3182CE]/10 flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Open 2D Sketch Canvas"
            >
              <Pencil className="w-5 h-5 text-[#3182CE] group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-[#63B3ED] font-bold block leading-none">Sketch Canvas</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">XY / XZ / YZ</span>
            </button>

            {/* Smart Dimension */}
            <button
              onClick={() => onExecuteTool("smart_dimension")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Smart Dimension"
            >
              <Compass className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Smart Dimension</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Parametric</span>
            </button>

            <div className="h-10 w-[1px] bg-[#282E39] mx-1 shrink-0" />

            {/* Line / Centerline */}
            <button
              onClick={() => onExecuteTool("sketch_line")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <div className="w-5 h-0.5 bg-white mb-2" />
              <span className="text-[10px] text-white font-bold block leading-none">Line</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Point-Point</span>
            </button>

            {/* Rectangle */}
            <button
              onClick={() => onExecuteTool("sketch_rectangle")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <Box className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Corner Rect</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">2-Points</span>
            </button>

            {/* Circle */}
            <button
              onClick={() => onExecuteTool("sketch_circle")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <CircleDot className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Circle</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Center-Radius</span>
            </button>

            {/* 3-Point Arc */}
            <button
              onClick={() => onExecuteTool("sketch_arc")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <RotateCw className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">3-Point Arc</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Curvature R</span>
            </button>

            {/* Straight Slot */}
            <button
              onClick={() => onExecuteTool("sketch_slot")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <Sliders className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Straight Slot</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Elongated</span>
            </button>

            {/* Polygon Hex */}
            <button
              onClick={() => onExecuteTool("sketch_polygon")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <Box className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Polygon</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Hex Bolt</span>
            </button>

            <div className="h-10 w-[1px] bg-[#282E39] mx-1 shrink-0" />

            {/* Trim Entities */}
            <button
              onClick={() => onExecuteTool("trim_entities")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <Scissors className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Power Trim</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Trim to Close</span>
            </button>

            {/* Offset Entities */}
            <button
              onClick={() => onExecuteTool("offset_entities")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <Maximize2 className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Offset</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Parallel Loop</span>
            </button>
          </>
        )}

        {/* TAB 3: EVALUATE */}
        {activeCommandTab === "evaluate" && (
          <>
            {/* Measure Tool */}
            <button
              onClick={() => onExecuteTool("measure")}
              className="h-full px-3 hover:bg-[#22262F] rounded border border-amber-500/40 bg-amber-500/10 flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Measure Tool (Distance, ΔX, ΔY, ΔZ, Angles)"
            >
              <Ruler className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-amber-300 font-bold block leading-none">Measure</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Delta X,Y,Z</span>
            </button>

            {/* Mass Properties */}
            <button
              onClick={() => onExecuteTool("mass_properties")}
              className="h-full px-3 hover:bg-[#22262F] rounded border border-[#38A169]/40 bg-[#38A169]/10 flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Mass Properties (Volume, Mass, Centroid, Inertia)"
            >
              <Scale className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-emerald-300 font-bold block leading-none">Mass Properties</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Center of Mass</span>
            </button>

            <div className="h-10 w-[1px] bg-[#282E39] mx-1 shrink-0" />

            {/* Section Properties */}
            <button
              onClick={() => onExecuteTool("section_properties")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Section Properties & Cut Planes"
            >
              <Scissors className="w-5 h-5 text-[#63B3ED] group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Section View</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Cut Planes</span>
            </button>

            {/* Interference Detection */}
            <button
              onClick={() => onExecuteTool("interference_check")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Interference Detection & Clearance Check"
            >
              <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Interference</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Clearance OK</span>
            </button>

            {/* Zebra Stripes */}
            <button
              onClick={() => onExecuteTool("zebra_stripes")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Zebra Stripes (Surface Curvature Continuity G1/G2)"
            >
              <Layers className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Zebra Stripes</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Curvature</span>
            </button>

            {/* DFM Rules & Standards */}
            <button
              onClick={() => onExecuteTool("open_standards")}
              className="h-full px-3 hover:bg-[#22262F] rounded border border-[#3182CE]/40 bg-[#3182CE]/10 flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="DFM & Engineering Standards Audit"
            >
              <ShieldCheck className="w-5 h-5 text-[#63B3ED] group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-[#63B3ED] font-bold block leading-none">Standards &amp; DFM</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">ISO / ASME Rules</span>
            </button>
          </>
        )}

        {/* TAB 4: SIMULATION */}
        {activeCommandTab === "simulation" && (
          <>
            {/* New Study / Run FEA */}
            <button
              onClick={() => onExecuteTool("simulation_study")}
              className="h-full px-3 hover:bg-[#22262F] rounded border border-amber-500/50 bg-amber-500/10 flex flex-col items-center justify-center text-center transition-all group shrink-0"
              title="Open SolidWorks Simulation Study Setup"
            >
              <Flame className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-amber-300 font-bold block leading-none">Study Setup</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Static FEA</span>
            </button>

            {/* Stress Contour Toggle */}
            <button
              onClick={() => onExecuteTool("toggle_stress_view")}
              className={`h-full px-2.5 rounded border transition-all flex flex-col items-center justify-center text-center shrink-0 ${
                renderMode === "fea_stress"
                  ? "bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-md"
                  : "hover:bg-[#22262F] border-transparent hover:border-[#282E39] text-white"
              }`}
              title="Toggle von Mises Stress Heatmap"
            >
              <Activity className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold block leading-none">von Mises Plot</span>
              <span className="text-[9px] opacity-75 block leading-none">Color Legend</span>
            </button>

            <div className="h-10 w-[1px] bg-[#282E39] mx-1 shrink-0" />

            {/* Fixture Info */}
            <div className="h-full px-3 bg-[#101217] rounded border border-[#282E39] flex flex-col justify-center text-left shrink-0">
              <span className="text-[9px] text-[#A0AEC0] uppercase block">Fixture Constraints</span>
              <span className="text-[11px] font-bold text-white block">Fixed Base / Mounting Bore</span>
              <span className="text-[9px] text-emerald-400">6 DOF Constrained</span>
            </div>

            {/* Load Info */}
            <div className="h-full px-3 bg-[#101217] rounded border border-[#282E39] flex flex-col justify-center text-left shrink-0">
              <span className="text-[9px] text-[#A0AEC0] uppercase block">Design Load</span>
              <span className="text-[11px] font-bold text-amber-400 block">4.8 kN Bearing Thrust</span>
              <span className="text-[9px] text-[#A0AEC0]">Axial + Radial Combined</span>
            </div>

            {/* Factor of Safety Result */}
            <div className="h-full px-3 bg-[#101217] rounded border border-[#282E39] flex flex-col justify-center text-left shrink-0">
              <span className="text-[9px] text-[#A0AEC0] uppercase block">Safety Factor n</span>
              <span className="text-[11px] font-bold text-emerald-400 block">
                {part.engineeringAnalysis.safetyFactor.toFixed(2)} (Req: 2.00)
              </span>
              <span className="text-[9px] text-emerald-400">PASSED ASME BTH-1</span>
            </div>
          </>
        )}

        {/* TAB 5: DIMXPERT / MBD */}
        {activeCommandTab === "dimxpert" && (
          <>
            {/* Auto Dimension Scheme */}
            <button
              onClick={() => onExecuteTool("toggle_dimensions")}
              className="h-full px-3 hover:bg-[#22262F] rounded border border-[#3182CE]/50 bg-[#3182CE]/10 flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <Compass className="w-5 h-5 text-[#63B3ED] group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-[#63B3ED] font-bold block leading-none">Auto DimXpert</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">ASME Y14.5</span>
            </button>

            {/* Datum Target */}
            <button
              onClick={() => onExecuteTool("add_datum")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <div className="w-5 h-5 rounded border border-amber-400 flex items-center justify-center text-[10px] font-bold text-amber-400 mb-0.5">
                A
              </div>
              <span className="text-[10px] text-white font-bold block leading-none">Datum Target</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">[A | B | C]</span>
            </button>

            {/* Geometric Tolerance (True Position, etc.) */}
            <button
              onClick={() => onExecuteTool("gdt_tolerance")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Geom Tolerance</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">True Position</span>
            </button>

            {/* Surface Finish */}
            <button
              onClick={() => onExecuteTool("surface_finish")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <Activity className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Surface Finish</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Ra 0.8 µm</span>
            </button>
          </>
        )}

        {/* TAB 6: 2D DRAWING */}
        {activeCommandTab === "drawing" && (
          <>
            {/* Open 2D Blueprint View */}
            <button
              onClick={() => onExecuteTool("open_blueprint")}
              className="h-full px-3 hover:bg-[#22262F] rounded border border-[#3182CE]/50 bg-[#3182CE]/10 flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <FileText className="w-5 h-5 text-[#3182CE] group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-[#63B3ED] font-bold block leading-none">Drawing Sheet</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">ANSI/ISO Format</span>
            </button>

            {/* Standard 3 Views */}
            <button
              onClick={() => onExecuteTool("standard_3_views")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <Layers className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Standard 3 Views</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Front/Top/Right</span>
            </button>

            {/* Section View */}
            <button
              onClick={() => onExecuteTool("drawing_section")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <Scissors className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">Section View</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Section A-A</span>
            </button>

            {/* Bill of Materials Table */}
            <button
              onClick={() => onExecuteTool("bom_table")}
              className="h-full px-2.5 hover:bg-[#22262F] rounded border border-transparent hover:border-[#282E39] flex flex-col items-center justify-center text-center transition-all group shrink-0"
            >
              <FileText className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform mb-0.5" />
              <span className="text-[10px] text-white font-bold block leading-none">BOM Table</span>
              <span className="text-[9px] text-[#A0AEC0] block leading-none">Parts List</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
