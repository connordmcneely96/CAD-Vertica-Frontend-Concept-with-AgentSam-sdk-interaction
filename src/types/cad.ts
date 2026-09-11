export type DesignStage = 
  | "TASK_CLARIFICATION" 
  | "CONCEPTUAL" 
  | "EMBODIMENT" 
  | "DETAILED_CAD" 
  | "FEA_VERIFIED" 
  | "RELEASED_ECO";

export interface MaterialData {
  id: string;
  name: string;
  alloy: string;
  density: number; // g/cm³
  yieldStrength: number; // MPa
  tensileStrength: number; // MPa
  youngsModulus: number; // GPa
  poissonsRatio: number;
  thermalConductivity: number; // W/m·K
  costIndex: number; // 1-10 relative
  machinabilityRating: number; // % relative to 1212 steel
  ashbyIndexStrengthDensity: number; // sigma_y / rho
  standardSpec: string;
}

export type PrimitiveType = 
  | "box" 
  | "cylinder" 
  | "ring" 
  | "gear" 
  | "rib" 
  | "cone" 
  | "torus" 
  | "hexNut"
  | "extrusion"
  | "revolved"
  | "sweep"
  | "loft"
  | "holeWizard"
  | "shell";

export type SketchTool = 
  | "select" 
  | "smartDimension"
  | "line" 
  | "centerline"
  | "circle" 
  | "perimeterCircle"
  | "arc" 
  | "rectangle" 
  | "centerRectangle"
  | "slot" 
  | "polygon" 
  | "fillet" 
  | "trim" 
  | "offset";

export type SketchPlane = "XY" | "XZ" | "YZ";

export interface SketchLine {
  id: string;
  type: "line" | "centerline";
  p1: [number, number];
  p2: [number, number];
}

export interface SketchRectangle {
  id: string;
  type: "rectangle" | "centerRectangle";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SketchCircle {
  id: string;
  type: "circle";
  center: [number, number];
  radius: number;
}

export interface SketchArc {
  id: string;
  type: "arc";
  p1: [number, number];
  p2: [number, number];
  radius: number;
  bulge?: number;
}

export interface SketchSlot {
  id: string;
  type: "slot";
  center: [number, number];
  length: number;
  radius: number;
}

export interface SketchPolygon {
  id: string;
  type: "polygon";
  center: [number, number];
  radius: number;
  sides: number;
}

export type SketchEntity = 
  | SketchLine 
  | SketchRectangle 
  | SketchCircle 
  | SketchArc 
  | SketchSlot 
  | SketchPolygon;

export interface SketchData {
  plane: SketchPlane;
  entities: SketchEntity[];
}

export interface StandardRule {
  id: string;
  standard: "ISO" | "ANSI" | "ASME" | "ASTM" | "DIN" | "NASA";
  code: string;
  title: string;
  category: "Tolerance & Fits" | "GD&T" | "Stress & Notches" | "Machinability & DFM" | "Materials" | "Fasteners";
  description: string;
  targetMetric: string;
  currentValue: string;
  status: "COMPLIANT" | "WARNING" | "NON_COMPLIANT";
  explanation: string;
  recommendation: string;
  fixAction?: {
    label: string;
    type: "adjust_fillet" | "adjust_wall" | "set_material" | "set_tolerance" | "fix_edge_margin";
    payload?: any;
  };
}

export interface CADPrimitive {
  id: string;
  name: string;
  type: PrimitiveType;
  position: [number, number, number]; // mm [x, y, z]
  rotation: [number, number, number]; // rad [rx, ry, rz]
  dimensions: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
    innerRadius?: number;
    teeth?: number;
    module?: number;
    radiusTop?: number;
    radiusBottom?: number;
    revolveAngle?: number;
    sketchPoints?: [number, number][];
  };
  color: string;
  isHole?: boolean;
  featureDescription?: string;
  filletRadius?: number;
  chamferDistance?: number;
  shellThickness?: number;
  draftAngle?: number;
  patternCount?: number;
  patternSpacing?: number;
  patternType?: "linear" | "circular";
  mirrorPlane?: "XY" | "XZ" | "YZ";
  holeType?: "tapped" | "clearance" | "counterbore" | "countersink";
  threadSpec?: string;
  suppressed?: boolean;
  visible?: boolean;
}

export interface HolePattern {
  id: string;
  patternType: "circular" | "linear";
  count: number;
  boltDiameter: number; // mm
  circlePitchDiameter?: number;
  spacing?: number;
  center: [number, number, number];
  threadCallout: string;
  depth?: number;
  counterboreDiameter?: number;
  counterboreDepth?: number;
}

export interface GDTAnnotation {
  id: string;
  symbol: "position" | "flatness" | "perpendicularity" | "cylindricity" | "concentricity" | "runout" | "profile";
  tolerance: string;
  modifier: "MMC" | "LMC" | "RFS";
  datumRefs: string; // e.g. "[A|B|C]"
  feature: string;
  inspectionNote: string;
}

export interface CADDimension {
  id: string;
  label: string;
  value: number; // in mm
  toleranceStr: string; // e.g. "±0.05" or "H7 (+0.018/-0)"
  p1: [number, number, number];
  p2: [number, number, number];
  type: "linear" | "diameter" | "radius";
}

export interface TextbookReference {
  id: string;
  textbook: string;
  chapter: string;
  formula: string;
  explanation: string;
  calculation: string;
  verificationStatus: "VERIFIED" | "MARGINAL" | "FAIL";
}

export interface EngineeringAnalysis {
  estimatedMassGrams: number;
  volumeCm3: number;
  vonMisesMaxMpa: number;
  safetyFactor: number;
  allowableStressMpa: number;
  criticalLoadCondition: string;
  governingCriterion: string;
  naturalFrequencyHz?: number;
  fatigueLifeCycles?: string;
}

export interface BOMItem {
  itemNumber: number;
  partName: string;
  partNumber: string;
  quantity: number;
  material: string;
  process: string;
  unitCostEst: number;
}

export interface CADPart {
  id: string;
  name: string;
  partNumber: string;
  revision: string;
  description: string;
  designStage: DesignStage;
  standard: string;
  material: MaterialData;
  manufacturingMethod: string;
  primitives: CADPrimitive[];
  holePatterns: HolePattern[];
  gdtCallouts: GDTAnnotation[];
  dimensions: CADDimension[];
  engineeringAnalysis: EngineeringAnalysis;
  textbookFormulas: TextbookReference[];
  bom: BOMItem[];
  designRationale: string;
  recommendedNextActions: string[];
}

export interface EngineeringChangeOrder {
  id: string;
  ecoNumber: string;
  title: string;
  author: string;
  date: string;
  priority: "CRITICAL" | "HIGH" | "ROUTINE";
  status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "RELEASED";
  description: string;
  reasonForChange: string;
  affectedPartRev: string;
}
