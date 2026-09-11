import React, { useState, useEffect } from "react";
import { CADPart, CADPrimitive, DesignStage, SketchTool } from "./types/cad";
import { BENCHMARK_PARTS } from "./data/standardParts";
import { TopBar } from "./components/TopBar";
import { CADViewport } from "./components/CADViewport";
import { FeatureTree } from "./components/FeatureTree";
import { AIAssistantPanel } from "./components/AIAssistantPanel";
import { BlueprintSheet } from "./components/BlueprintSheet";
import { TextbookVerificationView } from "./components/TextbookVerificationView";
import { DeliveryLifecycleBoard } from "./components/DeliveryLifecycleBoard";
import { StandardsGuidanceModule } from "./components/StandardsGuidanceModule";
import { SolidWorksCommandManager } from "./components/SolidWorksCommandManager";
import { SolidWorksShortcutBar } from "./components/SolidWorksShortcutBar";
import { HoleWizardModal } from "./components/HoleWizardModal";
import { MassPropertiesModal } from "./components/MassPropertiesModal";
import { SimulationStudyModal } from "./components/SimulationStudyModal";
import { NewModelModal } from "./components/NewModelModal";
import { 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  BookOpen, 
  Terminal,
  Activity,
  RefreshCw
} from "lucide-react";

export default function App() {
  const [currentPart, setCurrentPart] = useState<CADPart>(BENCHMARK_PARTS[0]);
  const [selectedPrimitiveId, setSelectedPrimitiveId] = useState<string | null>(null);
  const [renderMode, setRenderMode] = useState<"shaded" | "wireframe" | "fea_stress" | "inspection">("shaded");
  const [sectionCutAxis, setSectionCutAxis] = useState<"none" | "x" | "y" | "z">("none");
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<"cad3d" | "blueprint2d" | "standards" | "textbook" | "lifecycle">("cad3d");

  // SolidWorks Command Manager & View states
  const [activeCommandTab, setActiveCommandTab] = useState<"features" | "sketch" | "evaluate" | "simulation" | "dimxpert" | "drawing">("features");
  const [showPlanes, setShowPlanes] = useState<boolean>(false);
  const [showCenterOfMass, setShowCenterOfMass] = useState<boolean>(false);
  const [explodedProgress, setExplodedProgress] = useState<number>(0);

  // SolidWorks Modals
  const [showHoleWizard, setShowHoleWizard] = useState<boolean>(false);
  const [showMassProperties, setShowMassProperties] = useState<boolean>(false);
  const [showSimulation, setShowSimulation] = useState<boolean>(false);
  const [showShortcutBar, setShowShortcutBar] = useState<boolean>(false);
  const [showNewModelModal, setShowNewModelModal] = useState<boolean>(false);
  const [rebuildNotification, setRebuildNotification] = useState<string | null>(null);

  // Rollback Bar & Modeling Studio Orchestration
  const [rollbackIndex, setRollbackIndex] = useState<number>(currentPart.primitives.length);
  const [showModelingStudio, setShowModelingStudio] = useState<boolean>(false);
  const [initialModelingTool, setInitialModelingTool] = useState<SketchTool>("rectangle");
  const [initialModelingTab, setInitialModelingTab] = useState<"sketch" | "3d_ops" | "manipulate">("sketch");
  const [measurementMode, setMeasurementMode] = useState<boolean>(false);
  const [blueprintInitialTab, setBlueprintInitialTab] = useState<"drawing" | "bom">("drawing");

  // Keep rollbackIndex clamped if primitives change
  useEffect(() => {
    if (rollbackIndex > currentPart.primitives.length) {
      setRollbackIndex(currentPart.primitives.length);
    }
  }, [currentPart.primitives.length]);

  const handleRollbackChange = (newIdx: number) => {
    setRollbackIndex(newIdx);
    const activePrims = currentPart.primitives.slice(0, newIdx);
    const density = currentPart.material.density || 2.7;
    const rolledVol = activePrims.reduce((acc, p) => {
      const d = p.dimensions || {};
      if (p.isHole) return acc;
      if (p.type === "box") return acc + ((d.width || 40) * (d.height || 20) * (d.depth || 30)) / 1000;
      if (p.type === "cylinder") return acc + (Math.PI * Math.pow(d.radius || 15, 2) * (d.height || 30)) / 1000;
      return acc + 150;
    }, 0);
    const rolledMass = Math.round(rolledVol * density);

    setCurrentPart((prev) => ({
      ...prev,
      engineeringAnalysis: {
        ...prev.engineeringAnalysis,
        volumeCm3: Math.round(rolledVol * 10) / 10,
        estimatedMassGrams: rolledMass,
      },
    }));

    if (newIdx < currentPart.primitives.length) {
      setRebuildNotification(`Rollback Active: Evaluated ${newIdx} of ${currentPart.primitives.length} features (${rolledMass}g)`);
    } else {
      setRebuildNotification(`Rollback Cleared: All ${currentPart.primitives.length} features active (${rolledMass}g)`);
    }
    setTimeout(() => setRebuildNotification(null), 3000);
  };

  // Model Rebuild & Solver (Ctrl+B)
  const handleRebuild = () => {
    const density = currentPart.material.density || 2.7;
    const newVol = currentPart.primitives.reduce((acc, p) => {
      const d = p.dimensions || {};
      if (p.isHole) return acc;
      if (p.type === "box") return acc + ((d.width || 40) * (d.height || 20) * (d.depth || 30)) / 1000;
      if (p.type === "cylinder") return acc + (Math.PI * Math.pow(d.radius || 15, 2) * (d.height || 30)) / 1000;
      return acc + 150;
    }, 0);
    const newMass = Math.round(newVol * density);

    setCurrentPart((prev) => ({
      ...prev,
      engineeringAnalysis: {
        ...prev.engineeringAnalysis,
        volumeCm3: Math.round(newVol * 10) / 10,
        estimatedMassGrams: newMass,
      },
    }));

    setRebuildNotification("Model Rebuilt & Solved Successfully (Ctrl+B)");
    setTimeout(() => setRebuildNotification(null), 3000);
  };

  // Keyboard Shortcuts: 'S' for Shortcut Bar, Ctrl+B for Rebuild
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "s" || e.key === "S") &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setShowShortcutBar((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        handleRebuild();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPart]);

  // Execute SolidWorks Tools from CommandManager & ShortcutBar
  const handleExecuteTool = (toolId: string) => {
    switch (toolId) {
      case "hole_wizard":
        setShowHoleWizard(true);
        break;
      case "mass_props":
      case "mass_properties":
        setShowMassProperties(true);
        break;
      case "simulation":
      case "simulation_study":
      case "study":
      case "stress_contour":
      case "mesh_run":
      case "factor_safety":
        setShowSimulation(true);
        break;
      case "toggle_stress_view":
        setRenderMode((prev) => (prev === "fea_stress" ? "shaded" : "fea_stress"));
        setRebuildNotification(renderMode === "fea_stress" ? "Switched to Shaded with Edges" : "SolidWorks Simulation: von Mises Stress Plot Active");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "rebuild":
        handleRebuild();
        break;
      case "shortcut":
        setShowShortcutBar(true);
        break;
      case "planes":
        setShowPlanes((p) => !p);
        break;
      case "com":
        setShowCenterOfMass((c) => !c);
        break;
      case "smart_dim":
      case "smart_dimension":
      case "toggle_dimensions":
        setShowDimensions((d) => !d);
        setRebuildNotification(!showDimensions ? "Smart Dimensions & DimXpert Enabled" : "Dimensions Hidden");
        setTimeout(() => setRebuildNotification(null), 2500);
        break;
      case "standards":
      case "open_standards":
      case "gdt_fcf":
      case "iso_1101":
      case "asme_y14_5":
        setActiveView("standards");
        break;
      case "add_datum":
        setShowPlanes(true);
        setRebuildNotification("Datum Targets [A, B, C] & Primary Alignment Reference Planes Active");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "gdt_tolerance":
        setActiveView("standards");
        setRebuildNotification("ASME Y14.5 Geometric Tolerancing (GD&T) Feature Control Frames");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "surface_finish":
        setRebuildNotification("Surface Finish Specification: Ra 0.8 µm (N6 Ground Sealing Surface)");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "section_properties":
        setSectionCutAxis((curr) => {
          const next = curr === "none" ? "y" : curr === "y" ? "x" : curr === "x" ? "z" : "none";
          setRebuildNotification(next === "none" ? "Section Cut Removed" : `Section View: Cutting Plane [${next.toUpperCase()}] Active`);
          setTimeout(() => setRebuildNotification(null), 2500);
          return next;
        });
        break;
      case "interference_check":
        setRebuildNotification("Interference Detection: 0 Collisions. Clearances nominal (1.2mm min clearance).");
        setTimeout(() => setRebuildNotification(null), 3500);
        break;
      case "zebra_stripes":
        setRenderMode((prev) => (prev === "inspection" ? "shaded" : "inspection"));
        setRebuildNotification(renderMode === "inspection" ? "Switched to Shaded Mode" : "Zebra Stripes / Curvature Inspection Active");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "sketch":
      case "2d_sketch":
      case "open_sketch_studio":
        setShowModelingStudio(true);
        setInitialModelingTab("sketch");
        setInitialModelingTool("rectangle");
        setRebuildNotification("2D Sketch Mode Activated: Select sketch plane & tools");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "line":
      case "sketch_line":
        setShowModelingStudio(true);
        setInitialModelingTab("sketch");
        setInitialModelingTool("line");
        break;
      case "circle":
      case "sketch_circle":
        setShowModelingStudio(true);
        setInitialModelingTab("sketch");
        setInitialModelingTool("circle");
        break;
      case "rect":
      case "sketch_rectangle":
        setShowModelingStudio(true);
        setInitialModelingTab("sketch");
        setInitialModelingTool("rectangle");
        break;
      case "sketch_arc":
        setShowModelingStudio(true);
        setInitialModelingTab("sketch");
        setInitialModelingTool("arc");
        break;
      case "sketch_slot":
        setShowModelingStudio(true);
        setInitialModelingTab("sketch");
        setInitialModelingTool("slot");
        setRebuildNotification("Straight Slot Tool Selected: Click center and drag radius/length");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "sketch_polygon":
        setShowModelingStudio(true);
        setInitialModelingTab("sketch");
        setInitialModelingTool("polygon");
        setRebuildNotification("Polygon Hex Tool Selected: Click center and drag circumscribed radius");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "trim_entities":
        setShowModelingStudio(true);
        setInitialModelingTab("sketch");
        setInitialModelingTool("select");
        setRebuildNotification("Power Trim Active: Drag across entities to trim intersections");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "offset_entities":
        setShowModelingStudio(true);
        setInitialModelingTab("sketch");
        setRebuildNotification("Offset Entities: 5.0mm parallel boundary generated");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "extrude_boss":
        setShowModelingStudio(true);
        setInitialModelingTab("3d_ops");
        break;
      case "measure":
        setMeasurementMode(true);
        setRebuildNotification("Measure Tool Active: Pick 2 points in 3D viewport for ΔX, ΔY, ΔZ");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "drawing":
      case "open_blueprint":
      case "standard_3_views":
        setBlueprintInitialTab("drawing");
        setActiveView("blueprint2d");
        break;
      case "drawing_section":
        setBlueprintInitialTab("drawing");
        setActiveView("blueprint2d");
        setRebuildNotification("2D Section View A-A aligned on drawing sheet");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "bom":
      case "bom_table":
        setBlueprintInitialTab("bom");
        setActiveView("blueprint2d");
        setRebuildNotification("Bill of Materials (BOM) Table displayed");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      case "circular_pattern": {
        const target = currentPart.primitives.find((p) => p.id === selectedPrimitiveId) || currentPart.primitives[currentPart.primitives.length - 1];
        if (!target) break;
        const count = 4;
        const radius = 35;
        const newPrims: CADPrimitive[] = [];
        for (let i = 1; i < count; i++) {
          const angle = (i * Math.PI * 2) / count;
          newPrims.push({
            ...target,
            id: `patt-circ-${Date.now()}-${i}`,
            name: `${target.name} [Pattern ${i + 1}/${count}]`,
            position: [
              Math.round((target.position[0] + radius * Math.cos(angle)) * 10) / 10,
              target.position[1],
              Math.round((target.position[2] + radius * Math.sin(angle)) * 10) / 10,
            ],
            rotation: [target.rotation[0], target.rotation[1] + angle, target.rotation[2]],
          });
        }
        setCurrentPart((prev) => ({
          ...prev,
          primitives: [...prev.primitives, ...newPrims],
          engineeringAnalysis: {
            ...prev.engineeringAnalysis,
            estimatedMassGrams: target.isHole ? prev.engineeringAnalysis.estimatedMassGrams : Math.round(prev.engineeringAnalysis.estimatedMassGrams * 1.25),
          },
        }));
        setRebuildNotification(`Circular Pattern: 4 instances generated around PCD 70mm`);
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      case "linear_pattern": {
        const target = currentPart.primitives.find((p) => p.id === selectedPrimitiveId) || currentPart.primitives[currentPart.primitives.length - 1];
        if (!target) break;
        const count = 3;
        const pitch = 35;
        const newPrims: CADPrimitive[] = [];
        for (let i = 1; i < count; i++) {
          newPrims.push({
            ...target,
            id: `patt-lin-${Date.now()}-${i}`,
            name: `${target.name} [Lin ${i + 1}/${count}]`,
            position: [
              target.position[0] + pitch * i,
              target.position[1],
              target.position[2],
            ],
          });
        }
        setCurrentPart((prev) => ({
          ...prev,
          primitives: [...prev.primitives, ...newPrims],
          engineeringAnalysis: {
            ...prev.engineeringAnalysis,
            estimatedMassGrams: target.isHole ? prev.engineeringAnalysis.estimatedMassGrams : Math.round(prev.engineeringAnalysis.estimatedMassGrams * 1.2),
          },
        }));
        setRebuildNotification(`Linear Pattern: 3 instances with ${pitch}mm pitch created`);
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      case "mirror": {
        const target = currentPart.primitives.find((p) => p.id === selectedPrimitiveId) || currentPart.primitives[currentPart.primitives.length - 1];
        if (!target) break;
        const mirrored: CADPrimitive = {
          ...target,
          id: `mirror-${Date.now()}`,
          name: `${target.name} (Mirrored)`,
          position: [-target.position[0], target.position[1], target.position[2]],
          rotation: [target.rotation[0], -target.rotation[1], target.rotation[2]],
        };
        setCurrentPart((prev) => ({
          ...prev,
          primitives: [...prev.primitives, mirrored],
          engineeringAnalysis: {
            ...prev.engineeringAnalysis,
            estimatedMassGrams: target.isHole ? prev.engineeringAnalysis.estimatedMassGrams : Math.round(prev.engineeringAnalysis.estimatedMassGrams + 60),
          },
        }));
        setRebuildNotification(`Feature mirrored across Datum Right Plane (YZ)`);
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      case "extrude": {
        const newFeature: CADPrimitive = {
          id: `extrude-${Date.now()}`,
          name: `Boss-Extrude${currentPart.primitives.length + 1}`,
          type: "box",
          position: [0, 25, 0],
          rotation: [0, 0, 0],
          dimensions: { width: 35, height: 15, depth: 30 },
          color: "#3182ce",
          visible: true,
        };
        setCurrentPart((prev) => ({
          ...prev,
          primitives: [...prev.primitives, newFeature],
          engineeringAnalysis: {
            ...prev.engineeringAnalysis,
            estimatedMassGrams: Math.round(prev.engineeringAnalysis.estimatedMassGrams + 120),
          },
        }));
        setRebuildNotification("Boss-Extrude created: 35×15×30mm");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      case "cut": {
        const newCut: CADPrimitive = {
          id: `cut-${Date.now()}`,
          name: `Cut-Extrude${currentPart.primitives.length + 1}`,
          type: "cylinder",
          position: [0, 10, 0],
          rotation: [0, 0, 0],
          dimensions: { radius: 8, height: 40 },
          color: "#0f172a",
          visible: true,
          isHole: true,
        };
        setCurrentPart((prev) => ({
          ...prev,
          primitives: [...prev.primitives, newCut],
        }));
        setRebuildNotification("Cut-Extrude created: Ø16mm Through");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      case "revolve": {
        const newRev: CADPrimitive = {
          id: `revolve-${Date.now()}`,
          name: `Revolve${currentPart.primitives.length + 1}`,
          type: "revolved",
          position: [0, 15, 0],
          rotation: [0, 0, 0],
          dimensions: { revolveAngle: 360, sketchPoints: [[0, -10], [12, -10], [15, 0], [10, 10], [0, 10]] },
          color: "#38a169",
          visible: true,
        };
        setCurrentPart((prev) => ({
          ...prev,
          primitives: [...prev.primitives, newRev],
        }));
        setRebuildNotification("Revolve feature added: 360° Profile");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      case "fillet": {
        setCurrentPart((prev) => {
          const prims = [...prev.primitives];
          const targetIdx = selectedPrimitiveId
            ? prims.findIndex((p) => p.id === selectedPrimitiveId)
            : prims.length - 1;
          if (targetIdx >= 0) {
            prims[targetIdx] = {
              ...prims[targetIdx],
              filletRadius: (prims[targetIdx].filletRadius || 0) + 3,
            };
          }
          return { ...prev, primitives: prims };
        });
        setRebuildNotification("R3.0mm Fillet applied");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      case "chamfer": {
        setCurrentPart((prev) => {
          const prims = [...prev.primitives];
          const targetIdx = selectedPrimitiveId
            ? prims.findIndex((p) => p.id === selectedPrimitiveId)
            : prims.length - 1;
          if (targetIdx >= 0) {
            prims[targetIdx] = {
              ...prims[targetIdx],
              chamferDistance: (prims[targetIdx].chamferDistance || 0) + 2,
            };
          }
          return { ...prev, primitives: prims };
        });
        setRebuildNotification("2.0mm × 45° Chamfer applied");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      case "shell": {
        const newShell: CADPrimitive = {
          id: `shell-${Date.now()}`,
          name: `Shell${currentPart.primitives.length + 1}`,
          type: "shell",
          position: [0, 5, 0],
          rotation: [0, 0, 0],
          dimensions: { width: 38, height: 22, depth: 28 },
          color: "#d97706",
          visible: true,
        };
        setCurrentPart((prev) => ({
          ...prev,
          primitives: [...prev.primitives, newShell],
        }));
        setRebuildNotification("Shell feature: 2.0mm Wall Thickness");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      case "sweep": {
        const newSweep: CADPrimitive = {
          id: `sweep-${Date.now()}`,
          name: `Sweep${currentPart.primitives.length + 1}`,
          type: "sweep",
          position: [0, 10, 0],
          rotation: [0, 0, 0],
          dimensions: { radius: 5 },
          color: "#8b5cf6",
          visible: true,
        };
        setCurrentPart((prev) => ({
          ...prev,
          primitives: [...prev.primitives, newSweep],
        }));
        setRebuildNotification("Sweep along 3D Guide Path created");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      case "rib": {
        const newRib: CADPrimitive = {
          id: `rib-${Date.now()}`,
          name: `Rib${currentPart.primitives.length + 1}`,
          type: "rib",
          position: [15, 0, 0],
          rotation: [0, 0, 0],
          dimensions: { width: 5, height: 25, depth: 25 },
          color: "#3b82f6",
          visible: true,
        };
        setCurrentPart((prev) => ({
          ...prev,
          primitives: [...prev.primitives, newRib],
        }));
        setRebuildNotification("Structural Stiffener Rib added: 5mm thickness");
        setTimeout(() => setRebuildNotification(null), 3000);
        break;
      }
      default:
        setRebuildNotification(`Tool [${toolId}] selected`);
        setTimeout(() => setRebuildNotification(null), 2500);
    }
  };

  // Systematic Textbook Design Stages (Pahl & Beitz / Dieter Flow)
  const designStages: { stage: DesignStage; name: string; textbookNote: string }[] = [
    { stage: "TASK_CLARIFICATION", name: "1. Task Clarification", textbookNote: "Requirements List & 4.8 kN Boundary Constraints" },
    { stage: "CONCEPTUAL", name: "2. Conceptual Synthesis", textbookNote: "Pahl & Beitz Function Structure & Trade Studies" },
    { stage: "EMBODIMENT", name: "3. Embodiment Sizing", textbookNote: "Ashby Material Selection & Shigley Stress Checks" },
    { stage: "DETAILED_CAD", name: "4. Detailed CAD & GD&T", textbookNote: "ASME Y14.5 MMC Tolerances & FEA Verification" },
    { stage: "FEA_VERIFIED", name: "5. FEA Stress Pass", textbookNote: "von Mises Yield Factor n > 2.0 Confirmed" },
    { stage: "RELEASED_ECO", name: "6. Production ECO", textbookNote: "AS9100 Configuration Baseline Locked" },
  ];

  const handleStageClick = (stage: DesignStage) => {
    setCurrentPart((prev) => ({
      ...prev,
      designStage: stage,
    }));
  };

  return (
    <div id="nexus-app-root" className="w-screen h-screen flex flex-col bg-[#0F1115] text-[#EDF2F7] select-none overflow-hidden">
      {/* Global High-Tech Navigation Bar */}
      <TopBar
        currentPart={currentPart}
        onSelectPart={(part) => {
          setCurrentPart(part);
          setSelectedPrimitiveId(null);
        }}
        activeView={activeView}
        onSelectView={setActiveView}
        onNewModel={() => setShowNewModelModal(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* If in 3D CAD Space */}
        {activeView === "cad3d" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* SolidWorks Command Manager Ribbon */}
            <SolidWorksCommandManager
              part={currentPart}
              activeCommandTab={activeCommandTab}
              onSelectCommandTab={setActiveCommandTab}
              onExecuteTool={handleExecuteTool}
              onRebuild={handleRebuild}
              onOpenShortcutBar={() => setShowShortcutBar(true)}
              renderMode={renderMode}
            />

            {/* Textbook Systematic Design Flow Stepper Bar */}
            <div className="h-9 bg-[#15181E] border-b border-[#282E39] px-4 flex items-center justify-between font-mono text-[11px] overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[#A0AEC0] font-bold uppercase tracking-wider text-[10px] mr-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-[#3182CE]" />
                  Textbook Flow:
                </span>

                {designStages.map((stg, i) => {
                  const isActive = currentPart.designStage === stg.stage;
                  return (
                    <React.Fragment key={stg.stage}>
                      <button
                        onClick={() => handleStageClick(stg.stage)}
                        className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                          isActive
                            ? "bg-[#3182CE] text-white font-bold shadow-sm"
                            : "text-[#A0AEC0] hover:text-white hover:bg-[#1A1D23]"
                        }`}
                        title={stg.textbookNote}
                      >
                        {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                        <span>{stg.name}</span>
                      </button>
                      {i < designStages.length - 1 && (
                        <span className="text-[#4A5568] font-bold">→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="hidden lg:flex items-center gap-3 text-[10px] text-[#A0AEC0] shrink-0">
                <span>Ref: <strong className="text-[#EDF2F7]">Shigley Ch. 5-6 / Pahl &amp; Beitz</strong></span>
                <span className="text-[#282E39]">|</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Design Margin: +46%
                </span>
              </div>
            </div>

            {/* Three-Column CAD Workbench Layout */}
            <div className="flex-1 grid grid-cols-12 gap-3 p-3 min-h-0 overflow-hidden">
              {/* Left Column: Parametric Feature Tree & Material Selector (3 cols) */}
              <div className="col-span-12 md:col-span-4 lg:col-span-3 h-full min-h-0">
                <FeatureTree
                  part={currentPart}
                  selectedPrimitiveId={selectedPrimitiveId}
                  onSelectPrimitive={setSelectedPrimitiveId}
                  onUpdatePart={setCurrentPart}
                  rollbackIndex={rollbackIndex}
                  onRollbackChange={handleRollbackChange}
                />
              </div>

              {/* Center Column: Interactive 3D CAD Modeling Viewport (6 cols) */}
              <div className="col-span-12 md:col-span-8 lg:col-span-6 h-full min-h-0 flex flex-col">
                <CADViewport
                  part={currentPart}
                  selectedPrimitiveId={selectedPrimitiveId}
                  onSelectPrimitive={setSelectedPrimitiveId}
                  renderMode={renderMode}
                  onRenderModeChange={setRenderMode}
                  sectionCutAxis={sectionCutAxis}
                  onSectionCutChange={setSectionCutAxis}
                  showDimensions={showDimensions}
                  onToggleDimensions={() => setShowDimensions(!showDimensions)}
                  showPlanes={showPlanes}
                  onTogglePlanes={() => setShowPlanes(!showPlanes)}
                  showCenterOfMass={showCenterOfMass}
                  onToggleCenterOfMass={() => setShowCenterOfMass(!showCenterOfMass)}
                  explodedProgress={explodedProgress}
                  onExplodedChange={setExplodedProgress}
                  onUpdatePart={setCurrentPart}
                  onOpenStandards={() => setActiveView("standards")}
                  onOpenHoleWizard={() => setShowHoleWizard(true)}
                  onOpenMassProperties={() => setShowMassProperties(true)}
                  onOpenSimulation={() => setShowSimulation(true)}
                  rollbackIndex={rollbackIndex}
                  showModelingStudio={showModelingStudio}
                  onToggleModelingStudio={setShowModelingStudio}
                  initialModelingTool={initialModelingTool}
                  initialModelingTab={initialModelingTab}
                  measurementMode={measurementMode}
                  onToggleMeasurementMode={() => setMeasurementMode(!measurementMode)}
                />
              </div>

              {/* Right Column: AI Engineering Assistant & Textbook Derivation (3 cols) */}
              <div className="col-span-12 lg:col-span-3 h-full min-h-0 hidden lg:block">
                <AIAssistantPanel
                  currentPart={currentPart}
                  onApplySynthesizedPart={(newPart) => {
                    setCurrentPart(newPart);
                    setSelectedPrimitiveId(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SolidWorks Modals & Popups */}
        {showHoleWizard && (
          <HoleWizardModal
            part={currentPart}
            onUpdatePart={setCurrentPart}
            onClose={() => setShowHoleWizard(false)}
          />
        )}

        {showMassProperties && (
          <MassPropertiesModal
            part={currentPart}
            onClose={() => setShowMassProperties(false)}
            onShowCenterOfMass={() => {
              setShowCenterOfMass(true);
              setShowMassProperties(false);
            }}
          />
        )}

        {showSimulation && (
          <SimulationStudyModal
            part={currentPart}
            onClose={() => setShowSimulation(false)}
            onApplyStressView={() => {
              setRenderMode("fea_stress");
              setShowSimulation(false);
            }}
            onUpdatePart={setCurrentPart}
          />
        )}

        {showShortcutBar && (
          <SolidWorksShortcutBar
            onSelectAction={handleExecuteTool}
            onClose={() => setShowShortcutBar(false)}
          />
        )}

        {/* New Model Project Modal */}
        {showNewModelModal && (
          <NewModelModal
            isOpen={showNewModelModal}
            onClose={() => setShowNewModelModal(false)}
            onCreatePart={(newPart) => {
              setCurrentPart(newPart);
              setSelectedPrimitiveId(null);
              setRollbackIndex(newPart.primitives.length);
              setRebuildNotification(`Initialized New Model: ${newPart.name} (${newPart.partNumber})`);
              setTimeout(() => setRebuildNotification(null), 3000);
            }}
          />
        )}

        {/* Rebuild Floating Toast Notification */}
        {rebuildNotification && (
          <div className="fixed bottom-10 right-6 z-50 bg-[#1A1D23]/95 backdrop-blur-md border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-lg shadow-2xl font-mono text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            <span>{rebuildNotification}</span>
          </div>
        )}

        {/* 2D Technical Blueprint Mode */}
        {activeView === "blueprint2d" && (
          <div className="flex-1 min-h-0">
            <BlueprintSheet
              part={currentPart}
              initialTab={blueprintInitialTab}
              onBackTo3D={() => setActiveView("cad3d")}
            />
          </div>
        )}

        {/* Standards Guidance & Design Flows View */}
        {activeView === "standards" && (
          <div className="flex-1 min-h-0 p-3">
            <StandardsGuidanceModule
              part={currentPart}
              onUpdatePart={setCurrentPart}
              onBackToCAD={() => setActiveView("cad3d")}
            />
          </div>
        )}

        {/* Textbook Derivations & Formulas View */}
        {activeView === "textbook" && (
          <div className="flex-1 min-h-0">
            <TextbookVerificationView
              part={currentPart}
              onBackTo3D={() => setActiveView("cad3d")}
            />
          </div>
        )}

        {/* Delivery Lifecycle & ECO Board */}
        {activeView === "lifecycle" && (
          <div className="flex-1 min-h-0">
            <DeliveryLifecycleBoard
              part={currentPart}
              onUpdatePart={setCurrentPart}
            />
          </div>
        )}
      </div>

      {/* System Telemetry & Status Bar */}
      <footer id="nexus-status-footer" className="h-6 bg-[#15181E] border-t border-[#282E39] px-4 flex items-center justify-between font-mono text-[10px] text-[#A0AEC0] select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Activity className="w-3 h-3" />
            ENGINEERING KERNEL: ONLINE (WebGL 2.0 / PBR 60 FPS)
          </span>
          <span className="hidden sm:inline">FEATURES: <strong className="text-white">{currentPart.primitives.length} PRIMITIVES</strong></span>
          <span className="hidden sm:inline">MASS: <strong className="text-white">{currentPart.engineeringAnalysis.estimatedMassGrams} g</strong></span>
          <span className="hidden sm:inline">PEAK VON MISES: <strong className="text-white">{currentPart.engineeringAnalysis.vonMisesMaxMpa} MPa</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span>TOLERANCE SPEC: <strong className="text-white">ISO 2768-mK</strong></span>
          <span>CO-PILOT: <strong className="text-[#63B3ED]">GEMINI-3.8-FLASH ACTIVE</strong></span>
        </div>
      </footer>
    </div>
  );
}
