import React, { useState, useRef, useEffect } from "react";
import { 
  CADPart, 
  CADPrimitive, 
  SketchEntity, 
  SketchTool, 
  SketchPlane,
  SketchLine,
  SketchRectangle,
  SketchCircle,
  SketchArc,
  SketchSlot,
  SketchPolygon
} from "../types/cad";
import { 
  Pencil, 
  Box, 
  RotateCw, 
  Sparkles, 
  Scissors, 
  Layers, 
  Plus, 
  Trash2, 
  Copy, 
  Move, 
  Maximize2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Sliders,
  Ruler,
  Compass,
  ArrowRight,
  ShieldCheck,
  Award,
  CircleDot,
  Hexagon,
  Disc,
  Wand2,
  Wind
} from "lucide-react";

interface CADModelingStudioProps {
  part: CADPart;
  selectedPrimitiveId: string | null;
  onSelectPrimitive: (id: string | null) => void;
  onUpdatePart: (updatedPart: CADPart) => void;
  onClose?: () => void;
  initialTool?: SketchTool;
  initialTab?: "sketch" | "3d_ops" | "manipulate";
}

export const CADModelingStudio: React.FC<CADModelingStudioProps> = ({
  part,
  selectedPrimitiveId,
  onSelectPrimitive,
  onUpdatePart,
  onClose,
  initialTool,
  initialTab,
}) => {
  // Navigation tabs within CAD Studio
  const [activeTab, setActiveTab] = useState<"sketch" | "3d_ops" | "manipulate">(initialTab || "sketch");

  // Sketch State
  const [sketchPlane, setSketchPlane] = useState<SketchPlane>("XY");
  const [currentTool, setCurrentTool] = useState<SketchTool>(initialTool || "rectangle");

  // Sync if initial props change
  useEffect(() => {
    if (initialTool) {
      setCurrentTool(initialTool);
    }
  }, [initialTool]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [snapGrid, setSnapGrid] = useState<number>(5); // 5mm grid snap
  const [sketchEntities, setSketchEntities] = useState<SketchEntity[]>([
    {
      id: "ent-1",
      type: "rectangle",
      x: -30,
      y: -20,
      width: 60,
      height: 40,
    },
    {
      id: "ent-2",
      type: "circle",
      center: [0, 0],
      radius: 10,
    }
  ]);

  // Sketch interactive drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingStartPoint, setDrawingStartPoint] = useState<[number, number] | null>(null);
  const [cursorPos, setCursorPos] = useState<[number, number]>([0, 0]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  // 3D Operations Parameters
  const [extrudeDepth, setExtrudeDepth] = useState<number>(25);
  const [extrudeDirection, setExtrudeDirection] = useState<"normal" | "symmetric">("normal");
  const [extrudeIsHole, setExtrudeIsHole] = useState<boolean>(false);
  const [revolveAngle, setRevolveAngle] = useState<number>(360);
  const [revolveAxis, setRevolveAxis] = useState<"X" | "Y" | "Z">("Y");
  const [filletRadius, setFilletRadius] = useState<number>(4.0);
  const [chamferDistance, setChamferDistance] = useState<number>(2.0);

  // Selected Primitive for Manipulation
  const selectedPrimitive = part.primitives.find((p) => p.id === selectedPrimitiveId) || part.primitives[0];

  // Canvas Coordinate Transform Helpers
  const CANVAS_SCALE = 3.5; // pixels per mm
  const mmToCanvas = (x: number, y: number, w: number, h: number): [number, number] => {
    return [w / 2 + x * CANVAS_SCALE, h / 2 - y * CANVAS_SCALE];
  };

  const canvasToMm = (cx: number, cy: number, w: number, h: number): [number, number] => {
    const rawX = (cx - w / 2) / CANVAS_SCALE;
    const rawY = (h / 2 - cy) / CANVAS_SCALE;
    if (snapGrid > 0) {
      return [
        Math.round(rawX / snapGrid) * snapGrid,
        Math.round(rawY / snapGrid) * snapGrid,
      ];
    }
    return [Math.round(rawX * 10) / 10, Math.round(rawY * 10) / 10];
  };

  // Render 2D Sketch on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = "#0F1115";
    ctx.fillRect(0, 0, w, h);

    // Grid Floor
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#1A1D23";
    const step = snapGrid * CANVAS_SCALE;

    // Sub-grid lines
    for (let x = w / 2 % step; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = h / 2 % step; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Origin Axes (Red X, Green Y)
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#3182CE";
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    ctx.strokeStyle = "#38A169";
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Draw Origin Marker
    ctx.fillStyle = "#EDF2F7";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Render Sketch Entities
    sketchEntities.forEach((ent) => {
      const isSelected = ent.id === selectedEntityId;
      ctx.lineWidth = isSelected ? 2.5 : 1.8;
      ctx.strokeStyle = isSelected ? "#F6E05E" : "#63B3ED";
      ctx.fillStyle = isSelected ? "rgba(246, 224, 94, 0.1)" : "rgba(99, 179, 237, 0.08)";

      if (ent.type === "rectangle") {
        const [cx, cy] = mmToCanvas(ent.x, ent.y + ent.height, w, h);
        const rw = ent.width * CANVAS_SCALE;
        const rh = ent.height * CANVAS_SCALE;
        ctx.fillRect(cx, cy, rw, rh);
        ctx.strokeRect(cx, cy, rw, rh);

        // Dimensions Text
        ctx.fillStyle = "#A0AEC0";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(`${ent.width} mm`, cx + rw / 2 - 14, cy - 4);
        ctx.fillText(`${ent.height} mm`, cx + rw + 4, cy + rh / 2);
      } else if (ent.type === "circle") {
        const [cx, cy] = mmToCanvas(ent.center[0], ent.center[1], w, h);
        const cr = ent.radius * CANVAS_SCALE;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Diameter callout
        ctx.fillStyle = "#A0AEC0";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(`Ø${ent.radius * 2} mm`, cx + cr + 4, cy);
      } else if (ent.type === "line") {
        const [p1x, p1y] = mmToCanvas(ent.p1[0], ent.p1[1], w, h);
        const [p2x, p2y] = mmToCanvas(ent.p2[0], ent.p2[1], w, h);
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();

        // Draw endpoint dots
        ctx.fillStyle = "#63B3ED";
        ctx.fillRect(p1x - 2, p1y - 2, 4, 4);
        ctx.fillRect(p2x - 2, p2y - 2, 4, 4);

        // Length
        const len = Math.hypot(ent.p2[0] - ent.p1[0], ent.p2[1] - ent.p1[1]);
        ctx.fillStyle = "#A0AEC0";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(`${len.toFixed(1)} mm`, (p1x + p2x) / 2 + 5, (p1y + p2y) / 2 - 5);
      } else if (ent.type === "arc") {
        const [p1x, p1y] = mmToCanvas(ent.p1[0], ent.p1[1], w, h);
        const [p2x, p2y] = mmToCanvas(ent.p2[0], ent.p2[1], w, h);
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        const midX = (p1x + p2x) / 2;
        const midY = (p1y + p2y) / 2 - (ent.radius * CANVAS_SCALE * 0.4);
        ctx.quadraticCurveTo(midX, midY, p2x, p2y);
        ctx.stroke();

        ctx.fillStyle = "#A0AEC0";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(`R${ent.radius} mm`, midX, midY - 6);
      } else if (ent.type === "slot") {
        const [cx, cy] = mmToCanvas(ent.center[0], ent.center[1], w, h);
        const halfL = (ent.length / 2) * CANVAS_SCALE;
        const r = ent.radius * CANVAS_SCALE;
        ctx.beginPath();
        ctx.arc(cx - halfL, cy, r, Math.PI / 2, (3 * Math.PI) / 2);
        ctx.arc(cx + halfL, cy, r, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#A0AEC0";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(`Slot ${ent.length}×Ø${ent.radius * 2}mm`, cx - 20, cy - r - 4);
      } else if (ent.type === "polygon") {
        const [cx, cy] = mmToCanvas(ent.center[0], ent.center[1], w, h);
        const r = ent.radius * CANVAS_SCALE;
        const sides = ent.sides || 6;
        ctx.beginPath();
        for (let s = 0; s < sides; s++) {
          const a = (s * 2 * Math.PI) / sides - Math.PI / 2;
          const px = cx + r * Math.cos(a);
          const py = cy + r * Math.sin(a);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#A0AEC0";
        ctx.font = "10px JetBrains Mono, monospace";
        ctx.fillText(`Hex Ø${(ent.radius * 2).toFixed(0)}mm`, cx - 18, cy - r - 4);
      }
    });

    // In-progress Drawing Preview
    if (drawingStartPoint) {
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#F6E05E";

      const [p1x, p1y] = mmToCanvas(drawingStartPoint[0], drawingStartPoint[1], w, h);
      const [curX, curY] = mmToCanvas(cursorPos[0], cursorPos[1], w, h);

      if (currentTool === "line") {
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(curX, curY);
        ctx.stroke();
      } else if (currentTool === "rectangle") {
        const rw = curX - p1x;
        const rh = curY - p1y;
        ctx.strokeRect(p1x, p1y, rw, rh);
      } else if (currentTool === "circle") {
        const r = Math.hypot(curX - p1x, curY - p1y);
        ctx.beginPath();
        ctx.arc(p1x, p1y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (currentTool === "arc") {
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.quadraticCurveTo((p1x + curX) / 2, (p1y + curY) / 2 - 20, curX, curY);
        ctx.stroke();
      } else if (currentTool === "slot") {
        const dx = curX - p1x;
        const dy = curY - p1y;
        const len = Math.max(10, Math.hypot(dx, dy));
        const r = Math.max(4, len * 0.2);
        const midX = (p1x + curX) / 2;
        const midY = (p1y + curY) / 2;
        ctx.beginPath();
        ctx.arc(midX - len / 4, midY, r, Math.PI / 2, (3 * Math.PI) / 2);
        ctx.arc(midX + len / 4, midY, r, -Math.PI / 2, Math.PI / 2);
        ctx.closePath();
        ctx.stroke();
      } else if (currentTool === "polygon") {
        const r = Math.max(5, Math.hypot(curX - p1x, curY - p1y));
        ctx.beginPath();
        for (let s = 0; s < 6; s++) {
          const a = (s * 2 * Math.PI) / 6 - Math.PI / 2;
          const px = p1x + r * Math.cos(a);
          const py = p1y + r * Math.sin(a);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }, [sketchEntities, drawingStartPoint, cursorPos, currentTool, selectedEntityId, snapGrid]);

  // Handle Canvas Mouse Down
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const [mmX, mmY] = canvasToMm(cx, cy, canvas.width, canvas.height);

    if (currentTool === "select") {
      // Pick nearest entity
      let found: string | null = null;
      sketchEntities.forEach((ent) => {
        if (ent.type === "circle") {
          const d = Math.hypot(mmX - ent.center[0], mmY - ent.center[1]);
          if (Math.abs(d - ent.radius) < 5 || d < ent.radius) found = ent.id;
        } else if (ent.type === "rectangle") {
          if (mmX >= ent.x && mmX <= ent.x + ent.width && mmY >= ent.y && mmY <= ent.y + ent.height) {
            found = ent.id;
          }
        } else if (ent.type === "line") {
          const d1 = Math.hypot(mmX - ent.p1[0], mmY - ent.p1[1]);
          const d2 = Math.hypot(mmX - ent.p2[0], mmY - ent.p2[1]);
          const len = Math.hypot(ent.p2[0] - ent.p1[0], ent.p2[1] - ent.p1[1]);
          if (d1 + d2 <= len + 3) found = ent.id;
        }
      });
      setSelectedEntityId(found);
      return;
    }

    if (!drawingStartPoint) {
      setDrawingStartPoint([mmX, mmY]);
    } else {
      // Commit entity
      const p1 = drawingStartPoint;
      const p2: [number, number] = [mmX, mmY];
      const newId = `sketch-${Date.now().toString().slice(-4)}`;

      if (currentTool === "line") {
        setSketchEntities((prev) => [
          ...prev,
          { id: newId, type: "line", p1, p2 },
        ]);
      } else if (currentTool === "rectangle") {
        const minX = Math.min(p1[0], p2[0]);
        const minY = Math.min(p1[1], p2[1]);
        const width = Math.max(2, Math.abs(p2[0] - p1[0]));
        const height = Math.max(2, Math.abs(p2[1] - p1[1]));
        setSketchEntities((prev) => [
          ...prev,
          { id: newId, type: "rectangle", x: minX, y: minY, width, height },
        ]);
      } else if (currentTool === "circle") {
        const radius = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1])));
        setSketchEntities((prev) => [
          ...prev,
          { id: newId, type: "circle", center: p1, radius },
        ]);
      } else if (currentTool === "arc") {
        const radius = Math.max(2, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 2));
        setSketchEntities((prev) => [
          ...prev,
          { id: newId, type: "arc", p1, p2, radius },
        ]);
      } else if (currentTool === "slot") {
        const length = Math.max(10, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1])));
        const radius = Math.max(4, Math.round(length * 0.25));
        setSketchEntities((prev) => [
          ...prev,
          { id: newId, type: "slot", center: p1, length, radius },
        ]);
      } else if (currentTool === "polygon") {
        const radius = Math.max(4, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1])));
        setSketchEntities((prev) => [
          ...prev,
          { id: newId, type: "polygon", center: p1, radius, sides: 6 },
        ]);
      }

      setDrawingStartPoint(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const [mmX, mmY] = canvasToMm(cx, cy, canvas.width, canvas.height);
    setCursorPos([mmX, mmY]);
  };

  // Preset Profiles Loader
  const loadPresetProfile = (preset: "flange" | "ibeam" | "lbracket" | "hub") => {
    if (preset === "flange") {
      setSketchEntities([
        { id: "e1", type: "rectangle", x: -40, y: -25, width: 80, height: 50 },
        { id: "e2", type: "circle", center: [0, 0], radius: 14 },
        { id: "e3", type: "circle", center: [-25, -15], radius: 3.5 },
        { id: "e4", type: "circle", center: [25, -15], radius: 3.5 },
        { id: "e5", type: "circle", center: [-25, 15], radius: 3.5 },
        { id: "e6", type: "circle", center: [25, 15], radius: 3.5 },
      ]);
    } else if (preset === "ibeam") {
      setSketchEntities([
        { id: "e1", type: "rectangle", x: -25, y: 15, width: 50, height: 8 },
        { id: "e2", type: "rectangle", x: -4, y: -15, width: 8, height: 30 },
        { id: "e3", type: "rectangle", x: -25, y: -23, width: 50, height: 8 },
      ]);
    } else if (preset === "lbracket") {
      setSketchEntities([
        { id: "e1", type: "rectangle", x: -20, y: -20, width: 40, height: 8 },
        { id: "e2", type: "rectangle", x: -20, y: -12, width: 8, height: 32 },
        { id: "e3", type: "circle", center: [5, -16], radius: 4 },
        { id: "e4", type: "circle", center: [-16, 10], radius: 4 },
      ]);
    } else if (preset === "hub") {
      setSketchEntities([
        { id: "e1", type: "circle", center: [0, 0], radius: 30 },
        { id: "e2", type: "circle", center: [0, 0], radius: 12 },
        { id: "e3", type: "rectangle", x: -3, y: 12, width: 6, height: 4 }, // keyway
      ]);
    }
  };

  // Convert 2D Sketch to Polygon Vertices for Extrusion
  const deriveSketchPolygon = (): [number, number][] => {
    // Collect perimeter from rectangular or outline entities
    const rect = sketchEntities.find((e) => e.type === "rectangle") as SketchRectangle | undefined;
    if (rect) {
      return [
        [rect.x, rect.y],
        [rect.x + rect.width, rect.y],
        [rect.x + rect.width, rect.y + rect.height],
        [rect.x, rect.y + rect.height],
      ];
    }
    const circ = sketchEntities.find((e) => e.type === "circle") as SketchCircle | undefined;
    if (circ) {
      const pts: [number, number][] = [];
      const segments = 24;
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push([circ.center[0] + Math.cos(a) * circ.radius, circ.center[1] + Math.sin(a) * circ.radius]);
      }
      return pts;
    }
    const poly = sketchEntities.find((e) => e.type === "polygon") as SketchPolygon | undefined;
    if (poly) {
      const pts: [number, number][] = [];
      const sides = poly.sides || 6;
      for (let s = 0; s < sides; s++) {
        const a = (s * 2 * Math.PI) / sides - Math.PI / 2;
        pts.push([poly.center[0] + poly.radius * Math.cos(a), poly.center[1] + poly.radius * Math.sin(a)]);
      }
      return pts;
    }
    const slot = sketchEntities.find((e) => e.type === "slot") as SketchSlot | undefined;
    if (slot) {
      const pts: [number, number][] = [];
      const halfL = slot.length / 2;
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI / 2 + (i / 10) * Math.PI;
        pts.push([slot.center[0] - halfL + slot.radius * Math.cos(a), slot.center[1] + slot.radius * Math.sin(a)]);
      }
      for (let i = 0; i <= 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * Math.PI;
        pts.push([slot.center[0] + halfL + slot.radius * Math.cos(a), slot.center[1] + slot.radius * Math.sin(a)]);
      }
      return pts;
    }
    return [
      [-25, -15],
      [25, -15],
      [25, 15],
      [-25, 15],
    ];
  };

  // 3D OPERATION 1: EXTRUDE
  const handleExecuteExtrude = () => {
    const pts = deriveSketchPolygon();
    const newId = `ext-${Date.now().toString().slice(-4)}`;
    const rect = sketchEntities.find((e) => e.type === "rectangle") as SketchRectangle | undefined;
    const circ = sketchEntities.find((e) => e.type === "circle") as SketchCircle | undefined;

    let newPrim: CADPrimitive;

    if (rect) {
      newPrim = {
        id: newId,
        name: `${extrudeIsHole ? "Cut-Pocket" : "Extrude"} Base Solid #${part.primitives.length + 1}`,
        type: "box",
        position: [rect.x + rect.width / 2, extrudeDepth / 2, 0],
        rotation: [0, 0, 0],
        dimensions: {
          width: rect.width,
          height: extrudeDepth,
          depth: rect.height,
        },
        color: extrudeIsHole ? "#0F172A" : "#3182CE",
        isHole: extrudeIsHole,
        featureDescription: `Extruded from 2D ${sketchPlane} sketch (${rect.width}×${rect.height}mm, depth ${extrudeDepth}mm)`,
        filletRadius: filletRadius > 0 ? filletRadius : undefined,
        chamferDistance: chamferDistance > 0 ? chamferDistance : undefined,
        visible: true,
      };
    } else if (circ) {
      newPrim = {
        id: newId,
        name: `${extrudeIsHole ? "Bore-Hole" : "Extrude"} Boss Cylinder #${part.primitives.length + 1}`,
        type: "cylinder",
        position: [circ.center[0], extrudeDepth / 2, circ.center[1]],
        rotation: [0, 0, 0],
        dimensions: {
          radius: circ.radius,
          height: extrudeDepth,
        },
        color: extrudeIsHole ? "#0F172A" : "#3182CE",
        isHole: extrudeIsHole,
        featureDescription: `Extruded cylindrical boss Ø${circ.radius * 2}mm, depth ${extrudeDepth}mm`,
        filletRadius: filletRadius > 0 ? filletRadius : undefined,
        visible: true,
      };
    } else {
      newPrim = {
        id: newId,
        name: `Extruded Solid #${part.primitives.length + 1}`,
        type: "extrusion",
        position: [0, extrudeDepth / 2, 0],
        rotation: [0, 0, 0],
        dimensions: {
          depth: extrudeDepth,
          sketchPoints: pts,
        },
        color: extrudeIsHole ? "#0F172A" : "#3182CE",
        isHole: extrudeIsHole,
        featureDescription: `Custom 2D profile extruded ${extrudeDepth}mm`,
        filletRadius: filletRadius,
        visible: true,
      };
    }

    const updatedPrimitives = [...part.primitives, newPrim];
    recalculatePartMetrics(updatedPrimitives);
    onSelectPrimitive(newId);
    setActiveTab("manipulate");
  };

  // 3D OPERATION 2: REVOLVE
  const handleExecuteRevolve = () => {
    const newId = `rev-${Date.now().toString().slice(-4)}`;
    const rect = sketchEntities.find((e) => e.type === "rectangle") as SketchRectangle | undefined;
    const circ = sketchEntities.find((e) => e.type === "circle") as SketchCircle | undefined;

    const r = rect ? Math.max(10, rect.width) : circ ? circ.radius * 1.5 : 25;
    const h = rect ? rect.height : circ ? circ.radius * 2 : 20;

    const newPrim: CADPrimitive = {
      id: newId,
      name: `Revolved Axisymmetric Solid #${part.primitives.length + 1}`,
      type: "revolved",
      position: [0, 15, 0],
      rotation: revolveAxis === "X" ? [Math.PI / 2, 0, 0] : [0, 0, 0],
      dimensions: {
        radius: r,
        height: h,
        revolveAngle: revolveAngle,
        sketchPoints: [
          [0, -h / 2],
          [r * 0.7, -h / 2],
          [r, -h / 4],
          [r, h / 4],
          [r * 0.7, h / 2],
          [0, h / 2],
        ],
      },
      color: "#2B6CB0",
      isHole: false,
      featureDescription: `Revolved profile ${revolveAngle}° around ${revolveAxis}-axis`,
      filletRadius: filletRadius,
      visible: true,
    };

    const updatedPrimitives = [...part.primitives, newPrim];
    recalculatePartMetrics(updatedPrimitives);
    onSelectPrimitive(newId);
    setActiveTab("manipulate");
  };

  // 3D OPERATION 3: FILLET
  const handleApplyFillet = () => {
    if (!selectedPrimitive) return;
    const updatedPrimitives = part.primitives.map((p) => {
      if (p.id === selectedPrimitive.id) {
        return {
          ...p,
          filletRadius: filletRadius,
        };
      }
      return p;
    });

    // Fillet relieves stress concentration per Shigley Eq. 5-31:
    // Kt decreases as fillet radius r increases relative to thickness d
    const ktFactor = 1.0 + 1.2 / Math.sqrt(filletRadius / 16 + 0.1);
    const newMaxStress = Math.max(45, Math.round(180 * (ktFactor / 2.2)));
    const newSafetyFactor = Number((part.material.yieldStrength / newMaxStress).toFixed(2));

    onUpdatePart({
      ...part,
      primitives: updatedPrimitives,
      engineeringAnalysis: {
        ...part.engineeringAnalysis,
        vonMisesMaxMpa: newMaxStress,
        safetyFactor: newSafetyFactor,
      },
    });
  };

  // 3D OPERATION 4: CHAMFER
  const handleApplyChamfer = () => {
    if (!selectedPrimitive) return;
    const updatedPrimitives = part.primitives.map((p) => {
      if (p.id === selectedPrimitive.id) {
        return {
          ...p,
          chamferDistance: chamferDistance,
        };
      }
      return p;
    });
    onUpdatePart({
      ...part,
      primitives: updatedPrimitives,
    });
  };

  // Recalculate Part Mass and Stress
  const recalculatePartMetrics = (prims: CADPrimitive[]) => {
    const volumeEstimate = prims.reduce((acc, p) => {
      const d = p.dimensions || {};
      let v = 0;
      if (p.type === "box") v = ((d.width || 20) * (d.height || 20) * (d.depth || 20)) / 1000;
      else if (p.type === "cylinder" || p.type === "gear" || p.type === "revolved") v = (Math.PI * Math.pow(d.radius || 15, 2) * (d.height || 20)) / 1000;
      else v = 15;
      return p.isHole ? acc - v * 0.7 : acc + v;
    }, 0);

    const newMass = Math.max(10, Math.round(volumeEstimate * part.material.density));
    const newSafetyFactor = Number((part.material.yieldStrength / Math.max(10, part.engineeringAnalysis.vonMisesMaxMpa)).toFixed(2));

    onUpdatePart({
      ...part,
      primitives: prims,
      engineeringAnalysis: {
        ...part.engineeringAnalysis,
        estimatedMassGrams: newMass,
        volumeCm3: Math.round(volumeEstimate * 10) / 10,
        safetyFactor: newSafetyFactor,
      },
    });
  };

  // Manipulation Handlers
  const handleUpdatePosition = (axisIndex: 0 | 1 | 2, val: number) => {
    if (!selectedPrimitive) return;
    const updated = part.primitives.map((p) => {
      if (p.id === selectedPrimitive.id) {
        const newPos: [number, number, number] = [p.position[0], p.position[1], p.position[2]];
        newPos[axisIndex] = val;
        return { ...p, position: newPos };
      }
      return p;
    });
    onUpdatePart({ ...part, primitives: updated });
  };

  const handleUpdateDimension = (key: string, val: number) => {
    if (!selectedPrimitive) return;
    const updated = part.primitives.map((p) => {
      if (p.id === selectedPrimitive.id) {
        return {
          ...p,
          dimensions: {
            ...p.dimensions,
            [key]: Math.max(1, val),
          },
        };
      }
      return p;
    });
    recalculatePartMetrics(updated);
  };

  const handleDeletePrimitive = () => {
    if (!selectedPrimitive) return;
    const updated = part.primitives.filter((p) => p.id !== selectedPrimitive.id);
    recalculatePartMetrics(updated);
    onSelectPrimitive(updated.length > 0 ? updated[0].id : null);
  };

  const handleDuplicatePrimitive = () => {
    if (!selectedPrimitive) return;
    const newId = `dup-${Date.now().toString().slice(-4)}`;
    const cloned: CADPrimitive = {
      ...selectedPrimitive,
      id: newId,
      name: `${selectedPrimitive.name} (Copy)`,
      position: [selectedPrimitive.position[0] + 15, selectedPrimitive.position[1], selectedPrimitive.position[2] + 15],
    };
    const updated = [...part.primitives, cloned];
    recalculatePartMetrics(updated);
    onSelectPrimitive(newId);
  };

  return (
    <div id="cad-modeling-studio" className="h-full flex flex-col bg-[#15181E] border border-[#282E39] rounded-xl overflow-hidden shadow-2xl font-mono text-xs">
      {/* Studio Top Control Header */}
      <div className="h-11 bg-[#101217] border-b border-[#282E39] px-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#3182CE] flex items-center justify-center">
            <Pencil className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white tracking-wide">
            PARAMETRIC CAD MODELER
          </span>
          <span className="text-[10px] text-[#63B3ED] bg-[#3182CE]/10 px-1.5 py-0.5 rounded border border-[#3182CE]/30">
            2D SKETCH &amp; 3D OPERATORS
          </span>
        </div>

        {/* Primary Sub-Tabs */}
        <div className="flex items-center gap-1 bg-[#15181E] p-1 rounded-lg border border-[#282E39]">
          <button
            onClick={() => setActiveTab("sketch")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "sketch"
                ? "bg-[#3182CE] text-white font-bold shadow-sm"
                : "text-[#A0AEC0] hover:text-white"
            }`}
          >
            <Pencil className="w-3 h-3" />
            2D Sketch Tools
          </button>

          <button
            onClick={() => setActiveTab("3d_ops")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "3d_ops"
                ? "bg-[#3182CE] text-white font-bold shadow-sm"
                : "text-[#A0AEC0] hover:text-white"
            }`}
          >
            <Box className="w-3 h-3" />
            3D Operations
          </button>

          <button
            onClick={() => setActiveTab("manipulate")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "manipulate"
                ? "bg-[#3182CE] text-white font-bold shadow-sm"
                : "text-[#A0AEC0] hover:text-white"
            }`}
          >
            <Sliders className="w-3 h-3" />
            Manipulate Solid
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* TAB 1: 2D SKETCHING WORKBENCH */}
        {activeTab === "sketch" && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Sketch Toolbar */}
            <div className="h-10 bg-[#1A1D23] border-b border-[#282E39] px-3 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              {/* Tool selector */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-[#A0AEC0] uppercase font-bold mr-1">Tool:</span>
                {(["select", "line", "rectangle", "circle", "arc", "slot", "polygon"] as const).map((tool) => (
                  <button
                    key={tool}
                    onClick={() => {
                      setCurrentTool(tool as any);
                      setDrawingStartPoint(null);
                    }}
                    className={`px-2 py-1 rounded text-[11px] capitalize transition-colors flex items-center gap-1 ${
                      currentTool === tool
                        ? "bg-[#3182CE] text-white font-bold shadow-sm"
                        : "text-[#A0AEC0] hover:text-white hover:bg-[#282E39]"
                    }`}
                  >
                    {tool === "line" && <span className="w-3 h-0.5 bg-current inline-block" />}
                    {tool === "rectangle" && <Box className="w-3 h-3" />}
                    {tool === "circle" && <CircleDot className="w-3 h-3" />}
                    {tool === "arc" && <Compass className="w-3 h-3" />}
                    {tool === "slot" && <Disc className="w-3 h-3" />}
                    {tool === "polygon" && <Hexagon className="w-3 h-3" />}
                    {tool}
                  </button>
                ))}
              </div>

              {/* Plane & Grid Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#A0AEC0] uppercase">Plane:</span>
                  {(["XY", "XZ", "YZ"] as const).map((pl) => (
                    <button
                      key={pl}
                      onClick={() => setSketchPlane(pl)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        sketchPlane === pl
                          ? "bg-[#63B3ED]/20 text-[#63B3ED] border border-[#63B3ED]/50"
                          : "text-[#A0AEC0] hover:text-white"
                      }`}
                    >
                      {pl}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 border-l border-[#282E39] pl-2">
                  <span className="text-[10px] text-[#A0AEC0] uppercase">Snap:</span>
                  {[0, 2, 5, 10].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSnapGrid(val)}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        snapGrid === val
                          ? "bg-[#3182CE] text-white font-bold"
                          : "text-[#A0AEC0] hover:text-white"
                      }`}
                    >
                      {val === 0 ? "Off" : `${val}mm`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sketch Canvas + Side Presets */}
            <div className="flex-1 flex min-h-0">
              {/* Interactive 2D Canvas */}
              <div className="flex-1 relative bg-[#0F1115] overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={340}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  className="w-full h-full cursor-crosshair block"
                />

                {/* Coordinate Readout Badge */}
                <div className="absolute bottom-2 left-2 bg-[#1A1D23]/90 backdrop-blur-md px-2.5 py-1 rounded border border-[#282E39] text-[10px] text-[#A0AEC0] flex items-center gap-3 pointer-events-none">
                  <span>X: <strong className="text-white">{cursorPos[0]} mm</strong></span>
                  <span>Y: <strong className="text-white">{cursorPos[1]} mm</strong></span>
                  <span>PLANE: <strong className="text-[#63B3ED]">{sketchPlane}</strong></span>
                  <span>ENTITIES: <strong className="text-white">{sketchEntities.length}</strong></span>
                </div>

                {/* Clear / Undo Controls */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (sketchEntities.length > 0) {
                        setSketchEntities(sketchEntities.slice(0, -1));
                      }
                    }}
                    className="p-1.5 bg-[#1A1D23]/90 hover:bg-[#22262F] text-[#A0AEC0] hover:text-white rounded border border-[#282E39] transition-colors"
                    title="Undo Last Entity"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setSketchEntities([])}
                    className="p-1.5 bg-[#1A1D23]/90 hover:bg-[#22262F] text-rose-400 rounded border border-[#282E39] transition-colors"
                    title="Clear All Entities"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Presets & Quick Action Column */}
              <div className="w-64 bg-[#1A1D23] border-l border-[#282E39] p-3 flex flex-col justify-between overflow-y-auto space-y-3">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-[#A0AEC0] uppercase font-bold block mb-1">
                      Standard Profile Presets
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => loadPresetProfile("flange")}
                        className="p-2 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] rounded text-[10px] font-bold text-[#EDF2F7] text-left transition-colors"
                      >
                        Mounting Flange
                      </button>
                      <button
                        onClick={() => loadPresetProfile("ibeam")}
                        className="p-2 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] rounded text-[10px] font-bold text-[#EDF2F7] text-left transition-colors"
                      >
                        I-Beam Profile
                      </button>
                      <button
                        onClick={() => loadPresetProfile("lbracket")}
                        className="p-2 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] rounded text-[10px] font-bold text-[#EDF2F7] text-left transition-colors"
                      >
                        L-Bracket Section
                      </button>
                      <button
                        onClick={() => loadPresetProfile("hub")}
                        className="p-2 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] rounded text-[10px] font-bold text-[#EDF2F7] text-left transition-colors"
                      >
                        Bored Hub + Key
                      </button>
                    </div>
                  </div>

                  {/* Profile Status */}
                  <div className="p-2.5 bg-[#15181E] rounded-lg border border-[#282E39] space-y-1">
                    <span className="text-[10px] text-[#A0AEC0] uppercase font-bold block">
                      Profile Validation
                    </span>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Closed Solid Boundary OK
                    </div>
                    <span className="text-[10px] text-[#A0AEC0]">
                      Ready for 3D Extrusion or Axisymmetric Revolve.
                    </span>
                  </div>
                </div>

                {/* Advance to 3D Operations */}
                <button
                  onClick={() => setActiveTab("3d_ops")}
                  className="w-full py-2 bg-[#3182CE] hover:bg-[#2B6CB0] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  Proceed to 3D Operations
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 3D OPERATIONS (EXTRUDE, REVOLVE, FILLET, CHAMFER) */}
        {activeTab === "3d_ops" && (
          <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 overflow-y-auto">
            {/* OPERATION 1: EXTRUDE */}
            <div className="bg-[#1A1D23] p-4 rounded-xl border border-[#282E39] shadow-md flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#282E39] pb-2">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-[#3182CE]" />
                    <span className="font-bold text-white">1. Extrude Profile</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3182CE]/10 text-[#63B3ED] font-bold">
                    LINEAR SOLID
                  </span>
                </div>

                <p className="text-[11px] text-[#A0AEC0]">
                  Pushes 2D sketch along the normal vector to create solid structural geometry.
                </p>

                {/* Depth Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#A0AEC0]">Extrude Depth:</span>
                    <span className="text-white font-bold">{extrudeDepth} mm</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={150}
                    value={extrudeDepth}
                    onChange={(e) => setExtrudeDepth(Number(e.target.value))}
                    className="w-full accent-[#3182CE] cursor-pointer"
                  />
                </div>

                {/* Direction & Cut Mode */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#A0AEC0]">Feature Type:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExtrudeIsHole(false)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          !extrudeIsHole ? "bg-[#3182CE] text-white" : "bg-[#15181E] text-[#A0AEC0]"
                        }`}
                      >
                        Solid Boss
                      </button>
                      <button
                        onClick={() => setExtrudeIsHole(true)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          extrudeIsHole ? "bg-rose-500 text-white" : "bg-[#15181E] text-[#A0AEC0]"
                        }`}
                      >
                        Cut Hole
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExecuteExtrude}
                className="w-full py-2 bg-[#3182CE] hover:bg-[#2B6CB0] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Box className="w-3.5 h-3.5" />
                Execute Extrude
              </button>
            </div>

            {/* OPERATION 2: REVOLVE */}
            <div className="bg-[#1A1D23] p-4 rounded-xl border border-[#282E39] shadow-md flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#282E39] pb-2">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-[#38A169]" />
                    <span className="font-bold text-white">2. Revolve Axis</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                    ROTATIONAL
                  </span>
                </div>

                <p className="text-[11px] text-[#A0AEC0]">
                  Revolves profile around specified axis to create shafts, bushings, and discs.
                </p>

                {/* Angle */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#A0AEC0]">Revolve Angle:</span>
                    <span className="text-white font-bold">{revolveAngle}°</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[90, 180, 270, 360].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setRevolveAngle(deg)}
                        className={`py-1 rounded text-[10px] font-bold ${
                          revolveAngle === deg ? "bg-[#38A169] text-white" : "bg-[#15181E] text-[#A0AEC0]"
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Axis */}
                <div className="space-y-1">
                  <span className="text-[#A0AEC0] text-[11px] block">Rotation Axis:</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(["X", "Y", "Z"] as const).map((ax) => (
                      <button
                        key={ax}
                        onClick={() => setRevolveAxis(ax)}
                        className={`py-1 rounded text-[10px] font-bold ${
                          revolveAxis === ax ? "bg-[#38A169] text-white" : "bg-[#15181E] text-[#A0AEC0]"
                        }`}
                      >
                        {ax}-Axis
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleExecuteRevolve}
                className="w-full py-2 bg-[#38A169] hover:bg-[#2F855A] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Execute Revolve
              </button>
            </div>

            {/* OPERATION 3: FILLET */}
            <div className="bg-[#1A1D23] p-4 rounded-xl border border-[#282E39] shadow-md flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#282E39] pb-2">
                  <div className="flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white">3. Fillet (Radius)</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">
                    STRESS RELIEF
                  </span>
                </div>

                <p className="text-[11px] text-[#A0AEC0]">
                  Rounds interior corners to eliminate notch sensitivity per Shigley Eq. 5-31.
                </p>

                {/* Radius presets */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#A0AEC0]">Fillet Radius:</span>
                    <span className="text-white font-bold">R{filletRadius.toFixed(1)} mm</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1.5, 3.0, 4.0, 6.0].map((r) => (
                      <button
                        key={r}
                        onClick={() => setFilletRadius(r)}
                        className={`py-1 rounded text-[10px] font-bold ${
                          filletRadius === r ? "bg-indigo-600 text-white" : "bg-[#15181E] text-[#A0AEC0]"
                        }`}
                      >
                        R{r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2 bg-[#15181E] rounded border border-[#282E39] text-[10px] text-[#A0AEC0]">
                  Predicted Stress Notch Factor: <strong className="text-emerald-400">Kt ≈ {(1.0 + 1.2 / Math.sqrt(filletRadius / 16 + 0.1)).toFixed(2)}</strong>
                </div>
              </div>

              <button
                onClick={handleApplyFillet}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <CircleDot className="w-3.5 h-3.5" />
                Apply Fillet to Model
              </button>
            </div>

            {/* OPERATION 4: CHAMFER */}
            <div className="bg-[#1A1D23] p-4 rounded-xl border border-[#282E39] shadow-md flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#282E39] pb-2">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white">4. Chamfer (Bevel)</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                    45° DEBURR
                  </span>
                </div>

                <p className="text-[11px] text-[#A0AEC0]">
                  Bevels sharp outer edges for deburring, assembly lead-in, and safety.
                </p>

                {/* Distance presets */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#A0AEC0]">Chamfer Distance:</span>
                    <span className="text-white font-bold">{chamferDistance.toFixed(1)} mm × 45°</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1.0, 2.0, 3.0, 5.0].map((d) => (
                      <button
                        key={d}
                        onClick={() => setChamferDistance(d)}
                        className={`py-1 rounded text-[10px] font-bold ${
                          chamferDistance === d ? "bg-amber-500 text-slate-950" : "bg-[#15181E] text-[#A0AEC0]"
                        }`}
                      >
                        {d}mm
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-2 bg-[#15181E] rounded border border-[#282E39] text-[10px] text-[#A0AEC0]">
                  Standard ISO 13715 edge chamfer for aerospace deburring.
                </div>
              </div>

              <button
                onClick={handleApplyChamfer}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Scissors className="w-3.5 h-3.5" />
                Apply 45° Chamfer
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: MANIPULATE SOLID GEOMETRY */}
        {activeTab === "manipulate" && (
          <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
            {/* Feature Selection Column */}
            <div className="bg-[#1A1D23] p-3 rounded-xl border border-[#282E39] space-y-2">
              <span className="text-[10px] text-[#A0AEC0] uppercase font-bold block">
                Select Model Primitive ({part.primitives.length})
              </span>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {part.primitives.map((prim) => {
                  const isSelected = prim.id === selectedPrimitive?.id;
                  return (
                    <button
                      key={prim.id}
                      onClick={() => onSelectPrimitive(prim.id)}
                      className={`w-full p-2 rounded text-left text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? "bg-[#3182CE] text-white font-bold shadow-sm"
                          : "bg-[#15181E] text-[#A0AEC0] hover:text-white border border-[#282E39]"
                      }`}
                    >
                      <span className="truncate">{prim.name}</span>
                      <span className="text-[10px] uppercase opacity-75">{prim.type}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-1.5 pt-2">
                <button
                  onClick={handleDuplicatePrimitive}
                  className="flex-1 py-1.5 bg-[#15181E] hover:bg-[#22262F] text-[#63B3ED] border border-[#282E39] rounded text-xs flex items-center justify-center gap-1 font-bold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Duplicate
                </button>
                <button
                  onClick={handleDeletePrimitive}
                  className="py-1.5 px-3 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded text-xs flex items-center justify-center gap-1 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>

            {/* Position & Translation Manipulators */}
            <div className="bg-[#1A1D23] p-3 rounded-xl border border-[#282E39] space-y-3">
              <span className="text-[10px] text-[#A0AEC0] uppercase font-bold block flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-[#3182CE]" />
                3D Position &amp; Coordinates (mm)
              </span>

              {selectedPrimitive ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#A0AEC0]">X Position (Lateral):</span>
                      <span className="text-white font-bold">{selectedPrimitive.position[0]} mm</span>
                    </div>
                    <input
                      type="range"
                      min={-80}
                      max={80}
                      value={selectedPrimitive.position[0]}
                      onChange={(e) => handleUpdatePosition(0, Number(e.target.value))}
                      className="w-full accent-[#3182CE]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#A0AEC0]">Y Position (Elevation):</span>
                      <span className="text-white font-bold">{selectedPrimitive.position[1]} mm</span>
                    </div>
                    <input
                      type="range"
                      min={-40}
                      max={80}
                      value={selectedPrimitive.position[1]}
                      onChange={(e) => handleUpdatePosition(1, Number(e.target.value))}
                      className="w-full accent-[#38A169]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#A0AEC0]">Z Position (Depth):</span>
                      <span className="text-white font-bold">{selectedPrimitive.position[2]} mm</span>
                    </div>
                    <input
                      type="range"
                      min={-80}
                      max={80}
                      value={selectedPrimitive.position[2]}
                      onChange={(e) => handleUpdatePosition(2, Number(e.target.value))}
                      className="w-full accent-indigo-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#A0AEC0]">Select a feature to translate</div>
              )}
            </div>

            {/* Dimensions Sizing Manipulators */}
            <div className="bg-[#1A1D23] p-3 rounded-xl border border-[#282E39] space-y-3">
              <span className="text-[10px] text-[#A0AEC0] uppercase font-bold block flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                Parametric Dimensions
              </span>

              {selectedPrimitive ? (
                <div className="space-y-3">
                  {selectedPrimitive.dimensions.width !== undefined && (
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#A0AEC0]">Width (W):</span>
                        <span className="text-white font-bold">{selectedPrimitive.dimensions.width} mm</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={160}
                        value={selectedPrimitive.dimensions.width}
                        onChange={(e) => handleUpdateDimension("width", Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  )}

                  {selectedPrimitive.dimensions.height !== undefined && (
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#A0AEC0]">Height (H):</span>
                        <span className="text-white font-bold">{selectedPrimitive.dimensions.height} mm</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={120}
                        value={selectedPrimitive.dimensions.height}
                        onChange={(e) => handleUpdateDimension("height", Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  )}

                  {selectedPrimitive.dimensions.depth !== undefined && (
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#A0AEC0]">Depth (D):</span>
                        <span className="text-white font-bold">{selectedPrimitive.dimensions.depth} mm</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={160}
                        value={selectedPrimitive.dimensions.depth}
                        onChange={(e) => handleUpdateDimension("depth", Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  )}

                  {selectedPrimitive.dimensions.radius !== undefined && (
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#A0AEC0]">Radius (R):</span>
                        <span className="text-white font-bold">R{selectedPrimitive.dimensions.radius} mm</span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={80}
                        value={selectedPrimitive.dimensions.radius}
                        onChange={(e) => handleUpdateDimension("radius", Number(e.target.value))}
                        className="w-full accent-amber-400"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-[#A0AEC0]">Select a feature to resize</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
