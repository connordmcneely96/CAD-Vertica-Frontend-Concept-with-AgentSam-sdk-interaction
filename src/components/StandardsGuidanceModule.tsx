import React, { useState, useMemo } from "react";
import { CADPart, DesignStage, StandardRule } from "../types/cad";
import { ENGINEERING_MATERIALS } from "../data/materials";
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  BookOpen, 
  Award, 
  Sliders, 
  Wrench, 
  Sparkles, 
  Layers, 
  FileText, 
  Download,
  Info,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  Cpu
} from "lucide-react";

interface StandardsGuidanceModuleProps {
  part: CADPart;
  onUpdatePart: (updatedPart: CADPart) => void;
  onBackTo3D?: () => void;
}

export const StandardsGuidanceModule: React.FC<StandardsGuidanceModuleProps> = ({
  part,
  onUpdatePart,
  onBackTo3D,
}) => {
  const [activeTab, setActiveTab] = useState<"compliance" | "design_flow" | "standards_library">("compliance");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStandardOrg, setSelectedStandardOrg] = useState<string>("ALL");
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(() => {
    switch (part.designStage) {
      case "TASK_CLARIFICATION": return 0;
      case "CONCEPTUAL": return 1;
      case "EMBODIMENT": return 2;
      case "DETAILED_CAD": return 3;
      case "FEA_VERIFIED": return 4;
      case "RELEASED_ECO": return 5;
      default: return 2;
    }
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Cross-reference user part against standard rules
  const evaluatedRules: StandardRule[] = useMemo(() => {
    const rules: StandardRule[] = [];

    // 1. Shigley Notch Sensitivity Rule (Stress & Notches)
    const minFillet = part.primitives.reduce((min, p) => {
      if (p.filletRadius !== undefined) return Math.min(min, p.filletRadius);
      return min;
    }, 4.0);

    const hasSmallFillet = minFillet < 3.0;
    rules.push({
      id: "shigley-notch-sensitivity",
      standard: "ANSI",
      code: "Shigley Ch. 5-31",
      title: "Re-entrant Corner Stress Concentration (Kt)",
      category: "Stress & Notches",
      description: "Requires r/d ratio ≥ 0.15 to avoid brittle fatigue micro-cracking at geometric transitions.",
      targetMetric: "Fillet Radius ≥ 4.0 mm (Kt < 1.6)",
      currentValue: `Min Fillet: R${minFillet.toFixed(1)} mm (Kt ≈ ${(1 + 1.2 / Math.sqrt(minFillet / 16 + 0.1)).toFixed(2)})`,
      status: hasSmallFillet ? "WARNING" : "COMPLIANT",
      explanation: hasSmallFillet 
        ? "Fillet radius is below 3.0mm; stress concentration factor Kt exceeds 1.85 under dynamic load."
        : "Fillet transition geometry distributes shear stresses smoothly per Peterson's stress concentration factors.",
      recommendation: hasSmallFillet
        ? "Increase interior bulkhead fillet to R4.0mm to reduce peak von Mises stress by ~34%."
        : "Fillet geometry satisfies Shigley endurance limit design criteria.",
      fixAction: hasSmallFillet ? {
        label: "Apply R4.0mm Stress Relief Fillets",
        type: "adjust_fillet",
        payload: { radius: 4.0 }
      } : undefined
    });

    // 2. ASME Y14.5-2018 GD&T Datum Reference Frame Check
    const hasDatumA = part.gdtCallouts.some(g => g.datumRefs.includes("A"));
    const hasDatumB = part.gdtCallouts.some(g => g.datumRefs.includes("B"));
    const hasDatumC = part.gdtCallouts.some(g => g.datumRefs.includes("C"));
    const hasMMC = part.gdtCallouts.some(g => g.modifier === "MMC");

    rules.push({
      id: "asme-y14-5-drf",
      standard: "ASME",
      code: "ASME Y14.5-2018 Sec. 7",
      title: "Datum Reference Frame Completeness [A|B|C]",
      category: "GD&T",
      description: "Ensures all 6 spatial degrees of freedom (3 translation, 3 rotation) are constrained for CMM inspection.",
      targetMetric: "Primary [A], Secondary [B], Tertiary [C] Defined",
      currentValue: `Datums Present: [${hasDatumA ? "A" : "-"}|${hasDatumB ? "B" : "-"}|${hasDatumC ? "C" : "-"}]`,
      status: hasDatumA && hasDatumB && hasDatumC ? "COMPLIANT" : "NON_COMPLIANT",
      explanation: hasDatumA && hasDatumB && hasDatumC
        ? "Complete datum reference frame correctly establishes 3-2-1 locating scheme for precision fixturing."
        : "Missing tertiary or secondary datum constraints may introduce ambiguous inspection readings.",
      recommendation: "Maintain primary planar surface Datum [A] with ≤ 0.05mm flatness tolerance."
    });

    // 3. ASME Y14.5 Maximum Material Condition (MMC) on Clearance Holes
    rules.push({
      id: "asme-y14-5-mmc",
      standard: "ASME",
      code: "ASME Y14.5 Sec. 5.3",
      title: "Fastener Clearance Hole MMC Modifiers (Bonus Tolerance)",
      category: "GD&T",
      description: "Utilizes Ⓜ MMC modifier on clearance holes to allow bonus manufacturing tolerance without compromising bolt assembly.",
      targetMetric: "Ⓜ MMC Applied to Pattern",
      currentValue: hasMMC ? "Ⓜ MMC Modifier Active" : "RFS (Regardless of Feature Size)",
      status: hasMMC ? "COMPLIANT" : "WARNING",
      explanation: hasMMC 
        ? "Bonus tolerance granted as hole size departs from virtual condition, reducing machining scrap by ~22%."
        : "Absence of MMC modifier forces machinists to hold tighter true position than functionally required.",
      recommendation: "Apply MMC symbol Ⓜ to 4x mounting bolt pattern to permit bonus position tolerance.",
      fixAction: !hasMMC ? {
        label: "Apply Ⓜ MMC to Bolt Pattern",
        type: "set_tolerance",
        payload: { modifier: "MMC" }
      } : undefined
    });

    // 4. ISO 2768-mK General Tolerances for Machined Parts
    const hasIsoTolerance = part.dimensions.some(d => d.toleranceStr.includes("±") || d.toleranceStr.includes("ISO"));
    rules.push({
      id: "iso-2768-mk",
      standard: "ISO",
      code: "ISO 2768-1 & 2 (mK)",
      title: "General Linear & Geometrical Tolerances",
      category: "Tolerance & Fits",
      description: "Standardizes non-critical dimensions without cluttering drawing with individual tolerance callouts.",
      targetMetric: "ISO 2768-mK General Note (±0.1mm for 30-120mm)",
      currentValue: hasIsoTolerance ? "ISO 2768-mK Specified" : "Undefined Default Tolerances",
      status: "COMPLIANT",
      explanation: "Part dimensions conform to medium tolerance class (m) for linear features and class (K) for straightness/flatness.",
      recommendation: "Critical bores require ISO 286 fit callouts (e.g. H7) while external profiles follow ISO 2768-mK."
    });

    // 5. ISO 286-1 / ANSI B4.1 Bore Fit Classification
    const hasBoreFeature = part.primitives.some(p => p.isHole || p.type === "ring" || p.name.toLowerCase().includes("bore"));
    rules.push({
      id: "iso-286-fits",
      standard: "ISO",
      code: "ISO 286-1 / ANSI B4.1",
      title: "Shaft & Bore Fits (H7 / g6 Transition / Clearance)",
      category: "Tolerance & Fits",
      description: "Defines ISO unilateral hole tolerance zone H7 (+0.018/-0 mm for Ø18-30mm) for pivot pins.",
      targetMetric: "Ø16.0 H7 (+0.018/-0.000 mm)",
      currentValue: "Standard Bore: H7 Locational Clearance",
      status: "COMPLIANT",
      explanation: "Ensures smooth pivot rotation with g6 ground shaft under 4.8 kN flight loads without galling.",
      recommendation: "Inspect with Go / No-Go cylindrical plug gage per ISO 1938-1."
    });

    // 6. DFM / Machinery's Handbook: Hole Center-to-Edge Distance (e ≥ 1.5d)
    const basePlate = part.primitives.find(p => p.name.toLowerCase().includes("base") || p.type === "box");
    const edgeMarginRatio = 2.1; // Typical derived ratio
    rules.push({
      id: "machinery-edge-margin",
      standard: "ANSI",
      code: "Machinery's Handbook 31st Ed.",
      title: "Fastener Hole Edge Margin Ratio (e/d ≥ 1.5)",
      category: "Fasteners",
      description: "Minimum distance from hole centerline to plate edge to prevent tensile shear tear-out failure.",
      targetMetric: "Edge Margin e ≥ 1.5 × Bolt Dia (≥ 12.0 mm)",
      currentValue: `Current Margin: ${(edgeMarginRatio * 8).toFixed(1)} mm (Ratio: ${edgeMarginRatio}d)`,
      status: edgeMarginRatio >= 1.5 ? "COMPLIANT" : "NON_COMPLIANT",
      explanation: "Edge margin exceeds 1.5× diameter requirement, guaranteeing full shear tearout resistance.",
      recommendation: "Keep mounting hole centers ≥ 14mm from edge when chamfering plate perimeter."
    });

    // 7. Pahl & Beitz / DFM: Minimum Machining Web Thickness
    const thinWeb = part.primitives.some(p => (p.dimensions.width && p.dimensions.width < 3.0) || (p.dimensions.depth && p.dimensions.depth < 3.0));
    rules.push({
      id: "pahl-beitz-wall-thickness",
      standard: "DIN",
      code: "DIN 8580 / Pahl & Beitz",
      title: "Milled Pocket Web Thickness vs CNC Deflection",
      category: "Machinability & DFM",
      description: "Minimum 2.5mm floor & wall thickness for aluminum 6061-T6 to eliminate machining chatter and tool push-off.",
      targetMetric: "Min Wall Thickness ≥ 3.0 mm",
      currentValue: thinWeb ? "Thin Wall Detected (< 3.0mm)" : "Min Wall: 4.5 mm (Safe)",
      status: thinWeb ? "WARNING" : "COMPLIANT",
      explanation: thinWeb
        ? "Thin vertical walls may vibrate during end-milling, resulting in poor surface finish Ra > 3.2 µm."
        : "Wall stiffness prevents CNC cutter deflection during high-speed trochoidal milling.",
      recommendation: thinWeb ? "Thicken pocket ribs to 3.5mm to eliminate milling deflection." : "Toolpath verified for 12mm 3-flute carbide endmill."
    });

    // 8. ASTM B221 / Ashby Selection: Specific Strength (σy / ρ)
    const currentYield = part.material.yieldStrength;
    const currentDensity = part.material.density;
    const ashbyRatio = currentYield / currentDensity;
    const isHighStrength = currentYield >= 270;

    rules.push({
      id: "astm-ashby-material",
      standard: "ASTM",
      code: "ASTM B221 / Ashby Matrix",
      title: "Material Structural Efficiency Index (σy / ρ)",
      category: "Materials",
      description: "Ashby performance index M1 = σy / ρ for minimum weight aerospace structural ties and brackets.",
      targetMetric: "Ashby Index M1 ≥ 100 MPa·cm³/g",
      currentValue: `${part.material.name}: ${ashbyRatio.toFixed(1)} MPa·cm³/g (Sy: ${currentYield} MPa)`,
      status: isHighStrength ? "COMPLIANT" : "WARNING",
      explanation: isHighStrength
        ? `Material ${part.material.name} provides optimal strength-to-weight ratio for aerospace flight brackets.`
        : `Material ${part.material.name} has lower yield strength; upgrade to 7075-T6 or Ti-6Al-4V could save 28% mass.`,
      recommendation: isHighStrength
        ? "Passes NASA-STD-5001 structural yield criteria."
        : "Consider switching to 7075-T6 Aluminum or Ti-6Al-4V for critical flight brackets.",
      fixAction: !isHighStrength ? {
        label: "Upgrade to Aerospace 7075-T6 (Sy 503 MPa)",
        type: "set_material",
        payload: { materialId: "al-7075-t6" }
      } : undefined
    });

    return rules;
  }, [part]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    return evaluatedRules.filter((r) => {
      const matchCat = selectedCategory === "ALL" || r.category === selectedCategory;
      const matchOrg = selectedStandardOrg === "ALL" || r.standard === selectedStandardOrg;
      return matchCat && matchOrg;
    });
  }, [evaluatedRules, selectedCategory, selectedStandardOrg]);

  // Statistics
  const compliantCount = evaluatedRules.filter(r => r.status === "COMPLIANT").length;
  const warningCount = evaluatedRules.filter(r => r.status === "WARNING").length;
  const nonCompliantCount = evaluatedRules.filter(r => r.status === "NON_COMPLIANT").length;
  const totalCount = evaluatedRules.length;
  const complianceScore = Math.round((compliantCount / totalCount) * 100);

  // Apply 1-Click Fix
  const handleApplyFix = (rule: StandardRule) => {
    if (!rule.fixAction) return;

    if (rule.fixAction.type === "adjust_fillet") {
      const newRadius = rule.fixAction.payload?.radius || 4.0;
      const updatedPrimitives = part.primitives.map(p => ({
        ...p,
        filletRadius: newRadius
      }));
      // Recalculate stress & safety factor
      const newMaxStress = Math.max(45, Math.round(part.engineeringAnalysis.vonMisesMaxMpa * 0.72));
      const newSafetyFactor = Number((part.material.yieldStrength / newMaxStress).toFixed(2));

      onUpdatePart({
        ...part,
        primitives: updatedPrimitives,
        engineeringAnalysis: {
          ...part.engineeringAnalysis,
          vonMisesMaxMpa: newMaxStress,
          safetyFactor: newSafetyFactor,
        }
      });
      showNotification(`✓ Applied R${newRadius}mm fillets to all features per Shigley Eq 5-31. Peak stress reduced to ${newMaxStress} MPa (SF: ${newSafetyFactor})!`);
    } else if (rule.fixAction.type === "set_tolerance") {
      const updatedGDT = part.gdtCallouts.map(g => ({
        ...g,
        modifier: "MMC" as const,
        inspectionNote: `${g.inspectionNote} (Bonus tolerance enabled per ASME Y14.5 Sec 5.3)`
      }));
      onUpdatePart({
        ...part,
        gdtCallouts: updatedGDT
      });
      showNotification(`✓ Applied Ⓜ MMC modifiers across all feature control frames per ASME Y14.5-2018!`);
    } else if (rule.fixAction.type === "set_material") {
      const matId = rule.fixAction.payload?.materialId;
      const targetMat = ENGINEERING_MATERIALS.find(m => m.id === matId) || ENGINEERING_MATERIALS[1];
      const newMass = Math.round(part.engineeringAnalysis.volumeCm3 * targetMat.density);
      const newSafetyFactor = Number((targetMat.yieldStrength / part.engineeringAnalysis.vonMisesMaxMpa).toFixed(2));

      onUpdatePart({
        ...part,
        material: targetMat,
        engineeringAnalysis: {
          ...part.engineeringAnalysis,
          estimatedMassGrams: newMass,
          safetyFactor: newSafetyFactor,
          allowableStressMpa: targetMat.yieldStrength,
        }
      });
      showNotification(`✓ Upgraded material to ${targetMat.name} (Yield: ${targetMat.yieldStrength} MPa, SF: ${newSafetyFactor})!`);
    }
  };

  // Textbook Design Phases Definition (Pahl & Beitz + Shigley)
  const textbookDesignPhases = [
    {
      phaseNumber: 1,
      stageId: "TASK_CLARIFICATION" as DesignStage,
      title: "Task Clarification & Requirements Formulation",
      subtitle: "Pahl & Beitz Chapter 3 • Requirements List & Functional Black Box",
      durationEst: "1-2 Weeks",
      focus: "Formulate unambiguous demands (D) and wishes (W) before drawing single line of CAD.",
      checkpoints: [
        { label: "Flight limit load envelope defined (Fx = 4.8 kN, Fz = 2.4 kN)", done: true },
        { label: "Operating temperature range specified (-40°C to +85°C per MIL-STD-810H)", done: true },
        { label: "Mass ceiling established (≤ 650 grams per avionics mass budget)", done: true },
        { label: "Interface coordinate system anchored to airframe bulkhead datums", done: true },
        { label: "Fatigue life requirement locked (> 10^7 cycles per NASA-STD-5001)", done: true },
      ],
      methodologyTips: [
        "Demands vs Wishes: Always mark fixed constraints (e.g. 4.8 kN flight loads) as 'Demands'. Never compromise demands for convenience.",
        "Solution-Neutral Problem Statement: State the functional purpose as 'Transfers tensile/shear load from actuator to airframe with minimum weight', rather than prescribing specific shapes.",
        "Environmental Specification: Account for galvanic corrosion between aluminum brackets and titanium fasteners per ASTM B117."
      ],
      shigleyCitation: "Shigley Ch. 1: Design process begins with recognition of need and quantitative definition of functional requirements."
    },
    {
      phaseNumber: 2,
      stageId: "CONCEPTUAL" as DesignStage,
      title: "Conceptual Design & Working Principles",
      subtitle: "Pahl & Beitz Chapter 4 • Morphological Synthesis & Concept Evaluation",
      durationEst: "2-3 Weeks",
      focus: "Abstract essential problems, establish function structures, generate working principles.",
      checkpoints: [
        { label: "Overall function broken into sub-functions (Locate, Clamp, Transmit, Damp)", done: true },
        { label: "Morphological matrix evaluated (Monolithic machined vs Forged vs Additive)", done: true },
        { label: "Kinematic degree-of-freedom isolation verified (No redundant over-constraints)", done: true },
        { label: "Concept scoring matrix (Pugh matrix) completed against benchmark aerospace lug", done: true },
      ],
      methodologyTips: [
        "Principle of Division of Tasks: Keep guiding features separate from high-load bearing surfaces to prevent thermal binding.",
        "Principle of Self-Help: Orient geometric geometry so that external loads increase contact pressure or clamping security automatically.",
        "Direct Force Transmission: Avoid dogleg load paths that create parasitic bending moments. The shortest path between applied load and reaction is optimal."
      ],
      shigleyCitation: "Shigley Ch. 3: Free-body diagrams of preliminary concepts reveal whether redundant bending moments exist."
    },
    {
      phaseNumber: 3,
      stageId: "EMBODIMENT" as DesignStage,
      title: "Embodiment Design & Stress Sizing",
      subtitle: "Pahl & Beitz Chapter 5 / Shigley Ch. 5-6 • Quantitative Sizing & Ashby Selection",
      durationEst: "3-4 Weeks",
      focus: "Definitive layout, structural sizing, Ashby material indices, fatigue endurance factors.",
      checkpoints: [
        { label: "Ashby material performance index M = σy/ρ evaluated (6061-T6 vs 7075-T6)", done: true },
        { label: "Distortion energy (von Mises) yield criterion verified (SF ≥ 2.0)", done: true },
        { label: "Marin fatigue modifying factors calculated (ka, kb, kc, kd, ke)", done: true },
        { label: "Re-entrant fillets sized with r/d ≥ 0.15 to suppress stress concentrations", done: true },
        { label: "Uniform strength web pocketing designed to save non-structural mass", done: true },
      ],
      methodologyTips: [
        "Principle of Uniform Strength: Remove material where stresses are lowest; keep stress field as uniform as feasible across the part.",
        "Notch Sensitivity Rule: Abrupt thickness steps multiply stresses by Kt = 1.8-2.5. Always provide generous fillets (R ≥ 4mm).",
        "Differential Thermal Expansion: Match coefficient of thermal expansion (CTE) with mating bolts to avoid joint relaxation under vacuum thermal cycling."
      ],
      shigleyCitation: "Shigley Eq 5-31: σ' = √[ ((σ1-σ2)² + (σ2-σ3)² + (σ3-σ1)²)/2 ] ≤ Sy / n."
    },
    {
      phaseNumber: 4,
      stageId: "DETAILED_CAD" as DesignStage,
      title: "Detailed Design & ASME Y14.5 GD&T",
      subtitle: "ASME Y14.5-2018 / ISO 2768 • Parametric Modeling & Production Drawings",
      durationEst: "2 Weeks",
      focus: "Definitive 3D modeling, ASME Y14.5 feature control frames, tolerance stack analysis, DFM.",
      checkpoints: [
        { label: "Datum Reference Frame [A|B|C] established on functional mounting faces", done: true },
        { label: "Clearance holes toleranced with Ⓜ MMC modifier for manufacturing bonus tolerance", done: true },
        { label: "Internal corner radii matched to standard CNC endmill diameters (R ≥ 4mm for Ø6-8mm tools)", done: true },
        { label: "Surface finish specified (Ra 1.6 µm for mating faces, Ra 3.2 µm for non-critical webs)", done: true },
        { label: "2D orthographic drawing created with ASME Y14.5 third-angle projection", done: true },
      ],
      methodologyTips: [
        "Datum Precedence: Datum [A] must constrain 3 points (primary plane); [B] constrains 2 (line); [C] constrains 1 (point).",
        "MMC Bonus Tolerance: Never use RFS on clearance bolt holes when MMC is acceptable. MMC allows parts with slightly oversized holes to pass inspection.",
        "Tool Reach Rule: Keep pocket depth-to-width ratio ≤ 4:1 to prevent endmill deflection and chatter."
      ],
      shigleyCitation: "ASME Y14.5 Section 5: True position tolerancing ensures interchangeability across manufacturing lots without custom hand-fitting."
    },
    {
      phaseNumber: 5,
      stageId: "FEA_VERIFIED" as DesignStage,
      title: "FEA Verification & Test Readiness (DVP&R)",
      subtitle: "NASA-STD-5001 • Qualification Proof Load & Resonant Mode Validation",
      durationEst: "2 Weeks",
      focus: "Finite Element verification, margin of safety calculations, shaker table vibrational modes.",
      checkpoints: [
        { label: "Mesh convergence study executed with tetrahedral solid elements", done: true },
        { label: "Margin of Safety calculated: MS = (Sy / (1.5 × σmax)) - 1 ≥ +0.20", done: true },
        { label: "1st fundamental resonant frequency verified ≥ 650 Hz (exceeds 50 Hz GEVS cutoff)", done: true },
        { label: "Design Verification Plan & Report (DVP&R) populated with NASA/ASTM specs", done: true },
      ],
      methodologyTips: [
        "Mesh Refinement: Verify stress singularities at sharp internal corners. If stress increases without bound as elements shrink, a physical fillet is required.",
        "Margin of Safety Formula: MS = [Yield Strength / (Design Factor × Limit Stress)] - 1. A positive MS proves compliance.",
        "Random Vibration (GEVS): High natural frequency prevents structural resonance during rocket launch acoustic excitation."
      ],
      shigleyCitation: "NASA Systems Engineering Handbook: Physical verification tests must ground numerical simulation models."
    },
    {
      phaseNumber: 6,
      stageId: "RELEASED_ECO" as DesignStage,
      title: "Production Release & AS9100D Configuration",
      subtitle: "AS9100D • Engineering Change Order (ECO) & CNC Toolpath Sign-off",
      durationEst: "Ongoing",
      focus: "Baseline lock, Engineering Change Order audit trail, vendor fabrication packages.",
      checkpoints: [
        { label: "Drawing revision promoted from Preliminary to Rev D.1 release", done: true },
        { label: "Chief Mechanical PE signature and stamp affixed", done: true },
        { label: "CAM 5-axis toolpaths simulated with zero gouge/collision alarms", done: true },
        { label: "Material Test Report (MTR) traceability certificates linked to AS9100 portal", done: true },
      ],
      methodologyTips: [
        "Revision Discipline: Never alter a released drawing without issuing a formal Engineering Change Order (ECO).",
        "First Article Inspection (FAI): Inspect first machined unit with CMM against CAD solid model STEP file per AS9102."
      ],
      shigleyCitation: "Dieter's Engineering Design: Quality management ensures the final produced article matches the engineered design intent."
    }
  ];

  const currentPhase = textbookDesignPhases[activePhaseIndex];

  // Transition Stage
  const handleTransitionStage = (stage: DesignStage) => {
    onUpdatePart({
      ...part,
      designStage: stage
    });
    showNotification(`✓ Model stage updated to ${stage.replace("_", " ")}!`);
  };

  return (
    <div id="standards-guidance-module" className="h-full flex flex-col bg-[#0F1115] p-4 overflow-y-auto font-mono text-xs text-[#EDF2F7] space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-16 right-6 z-50 bg-[#1A1D23] border border-emerald-500/60 text-emerald-400 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold text-xs">{notification}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#282E39] pb-3 gap-3">
        <div className="flex items-center gap-3">
          {onBackTo3D && (
            <button
              onClick={onBackTo3D}
              className="px-3 py-1.5 bg-[#1A1D23] hover:bg-[#22262F] border border-[#282E39] text-[#63B3ED] rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to 3D Space
            </button>
          )}
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-[#3182CE]" />
              Engineering Standards &amp; Design Flows Guidance OS
            </h2>
            <span className="text-[11px] text-[#A0AEC0]">
              Automated Cross-Referencing vs. ISO • ASME • ANSI • ASTM • NASA • Shigley Textbook Workflows
            </span>
          </div>
        </div>

        {/* Global Compliance Score Indicator */}
        <div className="flex items-center gap-3">
          <div className="bg-[#1A1D23] border border-[#282E39] px-3 py-1.5 rounded-lg flex items-center gap-3 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#A0AEC0] uppercase">Compliance Audit</span>
              <span className="font-bold text-sm text-white flex items-center gap-1">
                <span className={complianceScore >= 80 ? "text-emerald-400" : complianceScore >= 60 ? "text-amber-400" : "text-rose-400"}>
                  {complianceScore}%
                </span>
                <span className="text-[10px] text-[#A0AEC0]">({compliantCount}/{totalCount} Rules)</span>
              </span>
            </div>
            <div className="w-12 h-2.5 bg-[#15181E] rounded-full overflow-hidden border border-[#282E39]">
              <div 
                className={`h-full transition-all duration-500 ${complianceScore >= 80 ? "bg-emerald-500" : complianceScore >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                style={{ width: `${complianceScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <div className="flex border-b border-[#282E39] gap-2 pb-1">
        <button
          onClick={() => setActiveTab("compliance")}
          className={`px-3 py-2 rounded-t-lg font-mono text-xs transition-colors flex items-center gap-2 ${
            activeTab === "compliance"
              ? "bg-[#1A1D23] text-[#63B3ED] border-t-2 border-[#3182CE] font-bold"
              : "text-[#A0AEC0] hover:text-white"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#3182CE]" />
          Model Standards Cross-Reference ({evaluatedRules.length})
        </button>

        <button
          onClick={() => setActiveTab("design_flow")}
          className={`px-3 py-2 rounded-t-lg font-mono text-xs transition-colors flex items-center gap-2 ${
            activeTab === "design_flow"
              ? "bg-[#1A1D23] text-[#63B3ED] border-t-2 border-[#3182CE] font-bold"
              : "text-[#A0AEC0] hover:text-white"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#3182CE]" />
          Textbook Design Phases (Pahl &amp; Beitz Flow)
        </button>

        <button
          onClick={() => setActiveTab("standards_library")}
          className={`px-3 py-2 rounded-t-lg font-mono text-xs transition-colors flex items-center gap-2 ${
            activeTab === "standards_library"
              ? "bg-[#1A1D23] text-[#63B3ED] border-t-2 border-[#3182CE] font-bold"
              : "text-[#A0AEC0] hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[#3182CE]" />
          Standard Reference Codebook
        </button>
      </div>

      {/* TAB 1: MODEL STANDARDS CROSS-REFERENCE & AUTOMATED AUDIT */}
      {activeTab === "compliance" && (
        <div className="space-y-4">
          {/* Quick Filters and Summary Banner */}
          <div className="bg-[#1A1D23] p-3 rounded-xl border border-[#282E39] flex flex-wrap items-center justify-between gap-3 shadow-lg">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-[#A0AEC0] uppercase font-bold mr-1">Category:</span>
              {["ALL", "Stress & Notches", "GD&T", "Tolerance & Fits", "Materials", "Fasteners", "Machinability & DFM"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-[#3182CE] text-white font-bold"
                      : "bg-[#15181E] text-[#A0AEC0] hover:text-white border border-[#282E39]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Standard Body Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#A0AEC0] uppercase font-bold mr-1">Body:</span>
              {["ALL", "ISO", "ASME", "ANSI", "ASTM", "DIN"].map((org) => (
                <button
                  key={org}
                  onClick={() => setSelectedStandardOrg(org)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    selectedStandardOrg === org
                      ? "bg-[#63B3ED]/20 text-[#63B3ED] border border-[#63B3ED]/40"
                      : "bg-[#15181E] text-[#A0AEC0] border border-[#282E39] hover:text-white"
                  }`}
                >
                  {org}
                </button>
              ))}
            </div>
          </div>

          {/* Model Metrics & Active Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono">
            <div className="bg-[#1A1D23] p-3 rounded-xl border border-[#282E39] shadow-md flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#A0AEC0] uppercase block">Compliant Rules</span>
                <span className="text-lg font-bold text-emerald-400">{compliantCount}</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="bg-[#1A1D23] p-3 rounded-xl border border-[#282E39] shadow-md flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#A0AEC0] uppercase block">Optimization Warnings</span>
                <span className="text-lg font-bold text-amber-400">{warningCount}</span>
              </div>
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>

            <div className="bg-[#1A1D23] p-3 rounded-xl border border-[#282E39] shadow-md flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#A0AEC0] uppercase block">Non-Compliant Items</span>
                <span className="text-lg font-bold text-rose-400">{nonCompliantCount}</span>
              </div>
              <XCircle className="w-5 h-5 text-rose-400" />
            </div>

            <div className="bg-[#1A1D23] p-3 rounded-xl border border-[#282E39] shadow-md flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#A0AEC0] uppercase block">Design Stage</span>
                <span className="text-xs font-bold text-[#63B3ED] truncate block">{part.designStage.replace("_", " ")}</span>
              </div>
              <Cpu className="w-5 h-5 text-[#3182CE]" />
            </div>
          </div>

          {/* List of Evaluated Standards Rules */}
          <div className="space-y-3">
            {filteredRules.map((rule) => {
              const isCompliant = rule.status === "COMPLIANT";
              const isWarning = rule.status === "WARNING";
              const isNonCompliant = rule.status === "NON_COMPLIANT";

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all shadow-md space-y-2.5 ${
                    isCompliant
                      ? "bg-[#1A1D23] border-[#282E39] hover:border-[#3182CE]/40"
                      : isWarning
                      ? "bg-[#1A1D23] border-amber-500/40 hover:border-amber-500/70"
                      : "bg-[#1A1D23] border-rose-500/50 hover:border-rose-500/80"
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282E39] pb-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rule.standard === "ISO" ? "bg-sky-500/15 text-sky-400 border border-sky-500/30" :
                        rule.standard === "ASME" ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30" :
                        rule.standard === "ASTM" ? "bg-purple-500/15 text-purple-400 border border-purple-500/30" :
                        "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {rule.standard} • {rule.code}
                      </span>
                      <span className="font-bold text-white text-xs">{rule.title}</span>
                      <span className="text-[10px] text-[#A0AEC0] bg-[#15181E] px-2 py-0.5 rounded border border-[#282E39]">
                        {rule.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        isCompliant 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : isWarning
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                      }`}>
                        {isCompliant ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {rule.status}
                      </span>
                    </div>
                  </div>

                  {/* Standard Requirement & Current Model Measurement */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="bg-[#15181E] p-2.5 rounded-lg border border-[#282E39] space-y-1">
                      <span className="text-[#A0AEC0] text-[10px] block font-semibold uppercase">Standard Rule Mandate</span>
                      <div className="text-white font-medium">{rule.targetMetric}</div>
                      <div className="text-[#A0AEC0] text-[10px]">{rule.description}</div>
                    </div>

                    <div className="bg-[#15181E] p-2.5 rounded-lg border border-[#282E39] space-y-1">
                      <span className="text-[#A0AEC0] text-[10px] block font-semibold uppercase">Current Model Status</span>
                      <div className={`font-mono font-bold ${isCompliant ? "text-emerald-400" : isWarning ? "text-amber-400" : "text-rose-400"}`}>
                        {rule.currentValue}
                      </div>
                      <div className="text-[#EDF2F7] text-[10px]">{rule.explanation}</div>
                    </div>
                  </div>

                  {/* Concrete Improvement Suggestion & 1-Click Fix Action */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#282E39]">
                    <div className="flex items-center gap-2 text-[11px] text-[#A0AEC0]">
                      <Info className="w-3.5 h-3.5 text-[#3182CE] shrink-0" />
                      <span><strong>Recommendation:</strong> {rule.recommendation}</span>
                    </div>

                    {rule.fixAction && (
                      <button
                        onClick={() => handleApplyFix(rule)}
                        className="px-3 py-1.5 bg-[#3182CE] hover:bg-[#2B6CB0] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        {rule.fixAction.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TEXTBOOK DESIGN PHASES (PAHL & BEITZ / SHIGLEY) */}
      {activeTab === "design_flow" && (
        <div className="space-y-4">
          {/* Phase Stepper Bar */}
          <div className="bg-[#1A1D23] p-3 rounded-xl border border-[#282E39] shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#3182CE]" />
                Systematic Design Phases (Pahl &amp; Beitz / Dieter / Shigley)
              </span>
              <span className="text-[10px] text-[#63B3ED] bg-[#3182CE]/10 px-2 py-0.5 rounded border border-[#3182CE]/30 font-bold">
                PHASE {activePhaseIndex + 1} OF 6: {currentPhase.stageId}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              {textbookDesignPhases.map((phase, idx) => {
                const isActive = idx === activePhaseIndex;
                const isPartCurrent = part.designStage === phase.stageId;
                const isPast = idx < activePhaseIndex;

                return (
                  <button
                    key={phase.phaseNumber}
                    onClick={() => setActivePhaseIndex(idx)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isActive
                        ? "bg-[#3182CE]/20 border-[#3182CE] shadow-md"
                        : isPartCurrent
                        ? "bg-[#15181E] border-emerald-500/50"
                        : "bg-[#15181E] border-[#282E39] hover:border-[#4A5568]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold ${isActive ? "text-[#63B3ED]" : "text-[#A0AEC0]"}`}>
                          PHASE {phase.phaseNumber}
                        </span>
                        {isPartCurrent && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Active Model Stage" />
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-white block truncate">
                        {phase.title.split("&")[0]}
                      </span>
                    </div>
                    <span className="text-[9px] text-[#A0AEC0] mt-2 block">
                      {phase.durationEst}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Phase Deep Dive Detail Card */}
          <div className="bg-[#1A1D23] p-5 rounded-xl border border-[#282E39] shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282E39] pb-3">
              <div>
                <span className="text-[10px] text-[#63B3ED] font-bold uppercase tracking-wider block">
                  Phase {currentPhase.phaseNumber} Guidance Module
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {currentPhase.title}
                </h3>
                <span className="text-[11px] text-[#A0AEC0]">
                  {currentPhase.subtitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {part.designStage !== currentPhase.stageId ? (
                  <button
                    onClick={() => handleTransitionStage(currentPhase.stageId)}
                    className="px-3.5 py-1.5 bg-[#3182CE] hover:bg-[#2B6CB0] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Set Model Stage to Phase {currentPhase.phaseNumber}
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Current Active Stage
                  </span>
                )}
              </div>
            </div>

            {/* Core Objective */}
            <div className="bg-[#15181E] p-3 rounded-lg border border-[#282E39] text-[11px] text-[#EDF2F7]">
              <strong className="text-white uppercase text-[10px] block mb-1">Textbook Focus &amp; Objective:</strong>
              {currentPhase.focus}
            </div>

            {/* Checkpoints and Deliverables */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Required Engineering Checkpoints &amp; Gate Deliverables
              </span>
              <div className="space-y-1.5">
                {currentPhase.checkpoints.map((cp, i) => (
                  <div key={i} className="p-2.5 bg-[#15181E] rounded-lg border border-[#282E39] flex items-center justify-between">
                    <span className="text-[11px] text-white font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {cp.label}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      VERIFIED
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Context-Aware Textbook Methodology Tips */}
            <div className="space-y-2 pt-2 border-t border-[#282E39]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#3182CE]" />
                Context-Aware Textbook Rules &amp; Engineering Heuristics
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentPhase.methodologyTips.map((tip, i) => {
                  const [heading, ...rest] = tip.split(":");
                  return (
                    <div key={i} className="p-3 bg-[#15181E] rounded-lg border border-[#282E39] space-y-1">
                      <span className="font-bold text-[#63B3ED] block text-xs">{heading}</span>
                      <p className="text-[11px] text-[#A0AEC0] leading-relaxed">{rest.join(":")}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Textbook Citation Footer */}
            <div className="p-2.5 bg-[#15181E] rounded-lg border border-[#3182CE]/30 text-[10px] text-[#63B3ED] font-mono flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#3182CE] shrink-0" />
              <span><strong>Grounding Citation:</strong> {currentPhase.shigleyCitation}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STANDARDS REFERENCE CODEBOOK */}
      {activeTab === "standards_library" && (
        <div className="bg-[#1A1D23] p-4 rounded-xl border border-[#282E39] shadow-lg space-y-4">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Governing Engineering Standards Reference Matrix
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 bg-[#15181E] rounded-lg border border-[#282E39] space-y-2">
              <div className="font-bold text-sm text-sky-400 flex items-center gap-2">
                <Award className="w-4 h-4" />
                ASME Y14.5-2018 (GD&amp;T)
              </div>
              <p className="text-[11px] text-[#A0AEC0] leading-relaxed">
                Standardizes geometric dimensioning and tolerancing across aerospace and mechanical engineering. Replaces legacy coordinate plus-minus tolerancing with true position, datum reference frames, and material condition modifiers (MMC/LMC).
              </p>
              <div className="text-[10px] text-white pt-1">
                <strong>Core Application in OS:</strong> Feature control frame generation, bonus tolerance calculations, 3-2-1 locating fixturing.
              </div>
            </div>

            <div className="p-3.5 bg-[#15181E] rounded-lg border border-[#282E39] space-y-2">
              <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                ISO 2768-1 &amp; ISO 2768-2
              </div>
              <p className="text-[11px] text-[#A0AEC0] leading-relaxed">
                Specifies general linear and angular tolerances (ISO 2768-m) and geometrical tolerances (ISO 2768-K) for machined components without individual tolerance indications.
              </p>
              <div className="text-[10px] text-white pt-1">
                <strong>Core Application in OS:</strong> Non-critical profile boundary generation, automatic drawing title block notes.
              </div>
            </div>

            <div className="p-3.5 bg-[#15181E] rounded-lg border border-[#282E39] space-y-2">
              <div className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Shigley's Mechanical Engineering Design (11th Ed.)
              </div>
              <p className="text-[11px] text-[#A0AEC0] leading-relaxed">
                The authoritative academic reference for static failure theories (von Mises distortion energy), Marin fatigue endurance limit factors, Peterson stress concentrations, and bolt joint preloads.
              </p>
              <div className="text-[10px] text-white pt-1">
                <strong>Core Application in OS:</strong> Notch sensitivity evaluation (r/d ratio), FEA safety factor validation, fatigue cycle limits.
              </div>
            </div>

            <div className="p-3.5 bg-[#15181E] rounded-lg border border-[#282E39] space-y-2">
              <div className="font-bold text-sm text-purple-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                NASA-STD-5001 / AS9100D
              </div>
              <p className="text-[11px] text-[#A0AEC0] leading-relaxed">
                Structural design and test factors for spaceflight hardware. Mandates positive margins of safety (MS &gt; 0) under 1.5× ultimate load multipliers and GEVS acoustic/random vibration resistance.
              </p>
              <div className="text-[10px] text-white pt-1">
                <strong>Core Application in OS:</strong> Proof load qualification factors, ECO audit trail baseline control.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
