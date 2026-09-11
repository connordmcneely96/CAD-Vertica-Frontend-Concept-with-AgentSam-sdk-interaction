import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { CADPart, CADPrimitive, GDTAnnotation, SketchTool } from "../types/cad";
import { 
  Maximize2, 
  RotateCcw, 
  Layers, 
  Eye, 
  EyeOff, 
  Scissors, 
  Flame, 
  Ruler, 
  Download, 
  Camera, 
  Compass,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  X
} from "lucide-react";
import { CADModelingStudio } from "./CADModelingStudio";
import { SolidWorksHeadsUpToolbar } from "./SolidWorksHeadsUpToolbar";
import { MeasureToolModal } from "./MeasureToolModal";

interface CADViewportProps {
  part: CADPart;
  selectedPrimitiveId: string | null;
  onSelectPrimitive: (id: string | null) => void;
  renderMode: "shaded" | "wireframe" | "fea_stress" | "inspection";
  onRenderModeChange: (mode: "shaded" | "wireframe" | "fea_stress" | "inspection") => void;
  sectionCutAxis: "none" | "x" | "y" | "z";
  onSectionCutChange: (axis: "none" | "x" | "y" | "z") => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  showPlanes?: boolean;
  onTogglePlanes?: () => void;
  showCenterOfMass?: boolean;
  onToggleCenterOfMass?: () => void;
  explodedProgress?: number;
  onExplodedChange?: (val: number) => void;
  onUpdatePart?: (updatedPart: CADPart) => void;
  onOpenStandards?: () => void;
  onOpenHoleWizard?: () => void;
  onOpenMassProperties?: () => void;
  onOpenSimulation?: () => void;
  rollbackIndex?: number;
  showModelingStudio?: boolean;
  onToggleModelingStudio?: (show: boolean) => void;
  initialModelingTool?: SketchTool;
  initialModelingTab?: "sketch" | "3d_ops" | "manipulate";
  measurementMode?: boolean;
  onToggleMeasurementMode?: () => void;
}

export const CADViewport: React.FC<CADViewportProps> = ({
  part,
  selectedPrimitiveId,
  onSelectPrimitive,
  renderMode,
  onRenderModeChange,
  sectionCutAxis,
  onSectionCutChange,
  showDimensions,
  onToggleDimensions,
  showPlanes = false,
  onTogglePlanes,
  showCenterOfMass = false,
  onToggleCenterOfMass,
  explodedProgress = 0,
  onExplodedChange,
  onUpdatePart,
  onOpenStandards,
  onOpenHoleWizard,
  onOpenMassProperties,
  onOpenSimulation,
  rollbackIndex,
  showModelingStudio: controlledShowModeling,
  onToggleModelingStudio,
  initialModelingTool,
  initialModelingTab,
  measurementMode: controlledMeasurementMode,
  onToggleMeasurementMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localShowModeling, setLocalShowModeling] = useState<boolean>(false);
  const showModelingStudio = typeof controlledShowModeling === "boolean" ? controlledShowModeling : localShowModeling;
  const setShowModelingStudio = (val: boolean) => {
    setLocalShowModeling(val);
    if (onToggleModelingStudio) onToggleModelingStudio(val);
  };

  // Three.js instances ref
  const threeState = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    meshGroup: THREE.Group | null;
    dimensionGroup: THREE.Group | null;
    planesGroup: THREE.Group | null;
    comGroup: THREE.Group | null;
    gridHelper: THREE.GridHelper | null;
    clippingPlane: THREE.Plane | null;
    isDragging: boolean;
    isPanning: boolean;
    prevMouseX: number;
    prevMouseY: number;
    dragStartX: number;
    dragStartY: number;
    cameraRadius: number;
    cameraTheta: number; // azimuth
    cameraPhi: number; // elevation
    target: THREE.Vector3;
    animationFrameId: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    meshGroup: null,
    dimensionGroup: null,
    planesGroup: null,
    comGroup: null,
    gridHelper: null,
    clippingPlane: null,
    isDragging: false,
    isPanning: false,
    prevMouseX: 0,
    prevMouseY: 0,
    dragStartX: 0,
    dragStartY: 0,
    cameraRadius: 160,
    cameraTheta: Math.PI / 4,
    cameraPhi: Math.PI / 3,
    target: new THREE.Vector3(0, 10, 0),
    animationFrameId: null,
  });

  const [localMeasurementMode, setLocalMeasurementMode] = useState(false);
  const measurementMode = typeof controlledMeasurementMode === "boolean" ? controlledMeasurementMode : localMeasurementMode;
  const setMeasurementMode = (val: boolean) => {
    setLocalMeasurementMode(val);
    if (onToggleMeasurementMode) onToggleMeasurementMode();
  };
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [measuredDistance, setMeasuredDistance] = useState<number | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Update Camera Orbit position
  const updateCameraPosition = () => {
    const s = threeState.current;
    if (!s.camera) return;
    const r = s.cameraRadius;
    const phi = Math.max(0.01, Math.min(Math.PI - 0.01, s.cameraPhi));
    const theta = s.cameraTheta;

    s.camera.position.x = s.target.x + r * Math.sin(phi) * Math.sin(theta);
    s.camera.position.y = s.target.y + r * Math.cos(phi);
    s.camera.position.z = s.target.z + r * Math.sin(phi) * Math.cos(theta);
    s.camera.lookAt(s.target);
  };

  // Zoom to Fit
  const handleZoomToFit = () => {
    const s = threeState.current;
    s.cameraRadius = 160;
    s.target.set(0, 10, 0);
    s.cameraTheta = Math.PI / 4;
    s.cameraPhi = Math.PI / 3;
    updateCameraPosition();
  };

  // View Presets (Standard SolidWorks 7-View Orientation)
  const setViewPreset = (preset: "iso" | "top" | "front" | "right" | "bottom" | "left" | "back") => {
    const s = threeState.current;
    if (preset === "iso") {
      s.cameraTheta = Math.PI / 4;
      s.cameraPhi = Math.PI / 3;
    } else if (preset === "top") {
      s.cameraTheta = 0;
      s.cameraPhi = 0.05;
    } else if (preset === "bottom") {
      s.cameraTheta = 0;
      s.cameraPhi = Math.PI - 0.05;
    } else if (preset === "front") {
      s.cameraTheta = 0;
      s.cameraPhi = Math.PI / 2;
    } else if (preset === "back") {
      s.cameraTheta = Math.PI;
      s.cameraPhi = Math.PI / 2;
    } else if (preset === "right") {
      s.cameraTheta = Math.PI / 2;
      s.cameraPhi = Math.PI / 2;
    } else if (preset === "left") {
      s.cameraTheta = -Math.PI / 2;
      s.cameraPhi = Math.PI / 2;
    }
    updateCameraPosition();
  };

  // Generate gear geometry helper
  const createGearGeometry = (radius: number, height: number, teeth: number) => {
    const shape = new THREE.Shape();
    const toothCount = teeth || 20;
    const addendum = radius + 4;
    const dedendum = Math.max(6, radius - 4);
    const step = (Math.PI * 2) / toothCount;

    for (let i = 0; i < toothCount; i++) {
      const a1 = i * step;
      const a2 = a1 + step * 0.3;
      const a3 = a1 + step * 0.6;
      const a4 = a1 + step * 0.85;

      const p1 = new THREE.Vector2(Math.cos(a1) * dedendum, Math.sin(a1) * dedendum);
      const p2 = new THREE.Vector2(Math.cos(a2) * addendum, Math.sin(a2) * addendum);
      const p3 = new THREE.Vector2(Math.cos(a3) * addendum, Math.sin(a3) * addendum);
      const p4 = new THREE.Vector2(Math.cos(a4) * dedendum, Math.sin(a4) * dedendum);

      if (i === 0) shape.moveTo(p1.x, p1.y);
      else shape.lineTo(p1.x, p1.y);

      shape.lineTo(p2.x, p2.y);
      shape.lineTo(p3.x, p3.y);
      shape.lineTo(p4.x, p4.y);
    }
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.8,
      bevelThickness: 0.8,
    });
  };

  // Generate Rib / Gusset Wedge Geometry
  const createRibGeometry = (width: number, height: number, depth: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(depth, 0);
    shape.lineTo(0, height);
    shape.closePath();

    return new THREE.ExtrudeGeometry(shape, {
      depth: width,
      bevelEnabled: false,
    });
  };

  // Generate Rounded / Filleted Box Geometry helper
  const createRoundedBoxGeometry = (w: number, h: number, d: number, r: number, isChamfer: boolean) => {
    const shape = new THREE.Shape();
    const hw = w / 2;
    const hh = h / 2;
    const radius = Math.min(r, hw * 0.45, hh * 0.45);

    if (isChamfer) {
      shape.moveTo(-hw + radius, -hh);
      shape.lineTo(hw - radius, -hh);
      shape.lineTo(hw, -hh + radius);
      shape.lineTo(hw, hh - radius);
      shape.lineTo(hw - radius, hh);
      shape.lineTo(-hw + radius, hh);
      shape.lineTo(-hw, hh - radius);
      shape.lineTo(-hw, -hh + radius);
      shape.closePath();
    } else {
      shape.moveTo(-hw + radius, -hh);
      shape.lineTo(hw - radius, -hh);
      shape.quadraticCurveTo(hw, -hh, hw, -hh + radius);
      shape.lineTo(hw, hh - radius);
      shape.quadraticCurveTo(hw, hh, hw - radius, hh);
      shape.lineTo(-hw + radius, hh);
      shape.quadraticCurveTo(-hw, hh, -hw, hh - radius);
      shape.lineTo(-hw, -hh + radius);
      shape.quadraticCurveTo(-hw, -hh, -hw + radius, -hh);
      shape.closePath();
    }

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelSegments: isChamfer ? 1 : 3,
      steps: 1,
      bevelSize: Math.min(radius, 2),
      bevelThickness: Math.min(radius, 2),
    });
    geo.center();
    return geo;
  };

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1115); // Professional Polish deep slate background

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    threeState.current.camera = camera;
    threeState.current.scene = scene;
    threeState.current.renderer = renderer;

    updateCameraPosition();

    // Lighting setup for high-precision engineering inspection
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainKeyLight.position.set(120, 200, 150);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 2048;
    mainKeyLight.shadow.mapSize.height = 2048;
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-150, -80, -100);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa5f3fc, 0.5);
    rimLight.position.set(0, -150, 120);
    scene.add(rimLight);

    // Dynamic Grid Floor
    const grid = new THREE.GridHelper(240, 48, 0x3182ce, 0x282e39);
    grid.position.y = -25;
    scene.add(grid);
    threeState.current.gridHelper = grid;

    // Coordinate Triad Axes
    const axesHelper = new THREE.AxesHelper(30);
    axesHelper.position.set(-80, -24, -80);
    scene.add(axesHelper);

    // Model Groups
    const meshGroup = new THREE.Group();
    scene.add(meshGroup);
    threeState.current.meshGroup = meshGroup;

    const dimensionGroup = new THREE.Group();
    scene.add(dimensionGroup);
    threeState.current.dimensionGroup = dimensionGroup;

    const planesGroup = new THREE.Group();
    scene.add(planesGroup);
    threeState.current.planesGroup = planesGroup;

    const comGroup = new THREE.Group();
    scene.add(comGroup);
    threeState.current.comGroup = comGroup;

    // Animation loop
    const animate = () => {
      threeState.current.animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (threeState.current.animationFrameId) {
        cancelAnimationFrame(threeState.current.animationFrameId);
      }
      renderer.dispose();
    };
  }, []);

  // Update Meshes when Part, RenderMode, or SectionCut changes
  useEffect(() => {
    const s = threeState.current;
    if (!s.scene || !s.meshGroup) return;

    // Clear previous meshes
    while (s.meshGroup.children.length > 0) {
      const obj = s.meshGroup.children[0];
      s.meshGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }

    // Configure Section Clipping Plane
    let clippingPlanes: THREE.Plane[] = [];
    if (sectionCutAxis === "x") {
      clippingPlanes = [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)];
    } else if (sectionCutAxis === "y") {
      clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)];
    } else if (sectionCutAxis === "z") {
      clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
    }

    // Build Primitives (respecting rollbackIndex)
    const activePrimitives = typeof rollbackIndex === "number"
      ? part.primitives.slice(0, rollbackIndex)
      : part.primitives;

    activePrimitives.forEach((prim) => {
      if (prim.visible === false) return;

      let geo: THREE.BufferGeometry;
      const dims = prim.dimensions || {};

      switch (prim.type) {
        case "box": {
          const w = dims.width || 40;
          const h = dims.height || 20;
          const d = dims.depth || 30;
          const fRadius = prim.filletRadius || 0;
          const cDist = prim.chamferDistance || 0;
          if (fRadius > 0 || cDist > 0) {
            geo = createRoundedBoxGeometry(w, h, d, fRadius > 0 ? fRadius : cDist, cDist > 0);
          } else {
            geo = new THREE.BoxGeometry(w, h, d);
          }
          break;
        }
        case "cylinder": {
          const r = dims.radius || 15;
          const h = dims.height || 30;
          geo = new THREE.CylinderGeometry(r, r, h, 36);
          break;
        }
        case "gear": {
          const r = dims.radius || 40;
          const h = dims.height || 20;
          const teeth = dims.teeth || 24;
          geo = createGearGeometry(r, h, teeth);
          // center gear extrusion
          geo.center();
          break;
        }
        case "rib": {
          const w = dims.width || 6;
          const h = dims.height || 30;
          const d = dims.depth || 30;
          geo = createRibGeometry(w, h, d);
          geo.center();
          break;
        }
        case "cone": {
          const rBottom = dims.radiusBottom || 20;
          const rTop = dims.radiusTop || 0;
          const h = dims.height || 30;
          geo = new THREE.CylinderGeometry(rTop, rBottom, h, 32);
          break;
        }
        case "extrusion": {
          const shape = new THREE.Shape();
          const pts = dims.sketchPoints || [
            [-30, -15], [30, -15], [30, 15], [-30, 15]
          ];
          if (pts.length >= 3) {
            shape.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) {
              shape.lineTo(pts[i][0], pts[i][1]);
            }
            shape.closePath();
            const depth = dims.depth || dims.height || 25;
            const bevel = (prim.filletRadius || 0) > 0 || (prim.chamferDistance || 0) > 0;
            geo = new THREE.ExtrudeGeometry(shape, {
              depth,
              bevelEnabled: bevel,
              bevelSegments: (prim.filletRadius || 0) > 0 ? 4 : 1,
              steps: 1,
              bevelSize: prim.filletRadius || prim.chamferDistance || 1.5,
              bevelThickness: prim.filletRadius || prim.chamferDistance || 1.5,
            });
            geo.center();
          } else {
            geo = new THREE.BoxGeometry(40, 20, 30);
          }
          break;
        }
        case "revolved": {
          const pts = dims.sketchPoints || [
            [0, -20], [15, -20], [20, -10], [20, 10], [15, 20], [0, 20]
          ];
          const lathePoints = pts.map(p => new THREE.Vector2(Math.max(0.1, p[0]), p[1]));
          const phiLength = ((dims.revolveAngle || 360) * Math.PI) / 180;
          geo = new THREE.LatheGeometry(lathePoints, 36, 0, phiLength);
          geo.center();
          break;
        }
        case "ring": {
          const rOut = dims.radius || 30;
          const rIn = dims.innerRadius || 18;
          const h = dims.height || 15;
          const shape = new THREE.Shape();
          shape.absarc(0, 0, rOut, 0, Math.PI * 2, false);
          const holePath = new THREE.Path();
          holePath.absarc(0, 0, rIn, 0, Math.PI * 2, true);
          shape.holes.push(holePath);
          geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
          geo.center();
          break;
        }
        case "sweep": {
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-25, -10, -15),
            new THREE.Vector3(-10, 15, 0),
            new THREE.Vector3(15, 5, 15),
            new THREE.Vector3(30, 25, 5),
          ]);
          geo = new THREE.TubeGeometry(curve, 32, dims.radius || 6, 16, false);
          geo.center();
          break;
        }
        case "loft": {
          geo = new THREE.CylinderGeometry(dims.radius || 12, (dims.radius || 18) * 1.3, dims.height || 35, 32);
          break;
        }
        case "holeWizard": {
          const drillR = (dims.drillDiameter || 6.6) / 2;
          const h = dims.height || 25;
          geo = new THREE.CylinderGeometry(drillR, drillR, h, 24);
          break;
        }
        case "shell": {
          const w = dims.width || 40;
          const h = dims.height || 25;
          const d = dims.depth || 30;
          geo = new THREE.BoxGeometry(w, h, d);
          break;
        }
        default: {
          geo = new THREE.BoxGeometry(20, 20, 20);
        }
      }

      // Material Selection based on Render Mode
      const isSelected = prim.id === selectedPrimitiveId;
      let mat: THREE.Material;

      if (renderMode === "fea_stress") {
        // Simulated FEA Von Mises stress contour shader
        // Vertex coloring based on height and distance from root
        const positions = geo.attributes.position;
        const colors = new Float32Array(positions.count * 3);
        const maxStress = part.engineeringAnalysis.vonMisesMaxMpa || 200;

        for (let i = 0; i < positions.count; i++) {
          const py = positions.getY(i);
          const px = positions.getX(i);
          // Stress concentration at fillets, notches, and load points
          const normalizedStress = Math.min(1.0, Math.max(0.05, (py + 20) / 70 + Math.abs(px) / 100));

          // Rainbow gradient from Blue (0) -> Cyan -> Green -> Yellow -> Red (Max)
          const color = new THREE.Color();
          color.setHSL(0.66 * (1.0 - normalizedStress), 1.0, 0.5);
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }
        geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        mat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.35,
          metalness: 0.2,
          clippingPlanes,
          clipShadows: true,
        });
      } else if (renderMode === "wireframe") {
        mat = new THREE.MeshStandardMaterial({
          color: isSelected ? 0x38bdf8 : 0x0284c7,
          wireframe: true,
          roughness: 0.4,
          clippingPlanes,
        });
      } else {
        // Shaded PBR Realistic Engineering Material
        const baseColor = isSelected
          ? new THREE.Color(0x38bdf8)
          : prim.isHole
          ? new THREE.Color(0x0f172a)
          : new THREE.Color(prim.color || 0x2563eb);

        mat = new THREE.MeshStandardMaterial({
          color: baseColor,
          roughness: prim.isHole ? 0.8 : 0.25,
          metalness: prim.isHole ? 0.0 : 0.75,
          clippingPlanes,
          clipShadows: true,
        });
      }

      const mesh = new THREE.Mesh(geo, mat);

      // Exploded View Radial Displacement
      const comX = part.primitives.reduce((acc, p) => acc + p.position[0], 0) / (part.primitives.length || 1);
      const comY = part.primitives.reduce((acc, p) => acc + p.position[1], 0) / (part.primitives.length || 1);
      const comZ = part.primitives.reduce((acc, p) => acc + p.position[2], 0) / (part.primitives.length || 1);

      let posX = prim.position[0];
      let posY = prim.position[1];
      let posZ = prim.position[2];

      if (explodedProgress > 0.01) {
        const dirX = prim.position[0] - comX;
        const dirY = prim.position[1] - comY;
        const dirZ = prim.position[2] - comZ;
        const len = Math.hypot(dirX, dirY, dirZ) || 1;
        const explodeDist = explodedProgress * 70;
        const offX = (dirX / len) * explodeDist;
        const offY = (dirY / len) * explodeDist;
        const offZ = (dirZ / len) * explodeDist;

        posX += offX;
        posY += offY;
        posZ += offZ;

        // Trail line showing original path
        const trailGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...prim.position),
          new THREE.Vector3(posX, posY, posZ),
        ]);
        const trailMat = new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 2, gapSize: 1.5 });
        const trailLine = new THREE.Line(trailGeo, trailMat);
        trailLine.computeLineDistances();
        s.meshGroup?.add(trailLine);
      }

      mesh.position.set(posX, posY, posZ);
      mesh.rotation.set(prim.rotation[0], prim.rotation[1], prim.rotation[2]);
      mesh.castShadow = !prim.isHole;
      mesh.receiveShadow = true;
      mesh.userData = { primitiveId: prim.id, name: prim.name, isHole: prim.isHole };

      // Add crisp geometric edge outlines (CAD look)
      if (renderMode !== "wireframe" && !prim.isHole) {
        const edges = new THREE.EdgesGeometry(geo, 24);
        const lineMat = new THREE.LineBasicMaterial({
          color: isSelected ? 0x93c5fd : 0x0f172a,
          linewidth: 1.5,
          clippingPlanes,
        });
        const line = new THREE.LineSegments(edges, lineMat);
        mesh.add(line);
      }

      s.meshGroup?.add(mesh);
    });

    // Render Hole Patterns (Visual Bolt Clearance Rings & Centerlines)
    part.holePatterns.forEach((pattern) => {
      if (pattern.patternType === "circular" && pattern.circlePitchDiameter) {
        const radius = pattern.circlePitchDiameter / 2;
        const boltCount = pattern.count || 4;
        const step = (Math.PI * 2) / boltCount;

        // Pitch Circle Phantom Line
        const pcdGeo = new THREE.BufferGeometry();
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * Math.PI * 2;
          pts.push(new THREE.Vector3(pattern.center[0] + Math.cos(a) * radius, pattern.center[1], pattern.center[2] + Math.sin(a) * radius));
        }
        pcdGeo.setFromPoints(pts);
        const pcdMat = new THREE.LineDashedMaterial({
          color: 0x38bdf8,
          dashSize: 2,
          gapSize: 1,
        });
        const pcdLine = new THREE.Line(pcdGeo, pcdMat);
        pcdLine.computeLineDistances();
        s.meshGroup?.add(pcdLine);

        // Circular Holes
        for (let b = 0; b < boltCount; b++) {
          const a = b * step;
          const hx = pattern.center[0] + Math.cos(a) * radius;
          const hz = pattern.center[2] + Math.sin(a) * radius;
          const holeGeo = new THREE.CylinderGeometry(pattern.boltDiameter / 2, pattern.boltDiameter / 2, 28, 24);
          const holeMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.9,
            metalness: 0.1,
            clippingPlanes,
          });
          const holeMesh = new THREE.Mesh(holeGeo, holeMat);
          holeMesh.position.set(hx, pattern.center[1], hz);
          s.meshGroup?.add(holeMesh);
        }
      }
    });
  }, [part, selectedPrimitiveId, renderMode, sectionCutAxis, explodedProgress, rollbackIndex]);

  // Reference Datum Planes (Front XY, Top XZ, Right YZ)
  useEffect(() => {
    const s = threeState.current;
    if (!s.planesGroup) return;

    while (s.planesGroup.children.length > 0) {
      const obj = s.planesGroup.children[0];
      s.planesGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }

    if (!showPlanes) return;

    const planeSize = 140;

    // Front Plane (XY)
    const frontGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const frontMat = new THREE.MeshBasicMaterial({ color: 0x3182ce, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    const frontEdges = new THREE.LineSegments(new THREE.EdgesGeometry(frontGeo), new THREE.LineBasicMaterial({ color: 0x63b3ed }));
    frontMesh.add(frontEdges);
    s.planesGroup.add(frontMesh);

    // Top Plane (XZ)
    const topGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const topMat = new THREE.MeshBasicMaterial({ color: 0x38a169, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.rotation.x = Math.PI / 2;
    const topEdges = new THREE.LineSegments(new THREE.EdgesGeometry(topGeo), new THREE.LineBasicMaterial({ color: 0x68d391 }));
    topMesh.add(topEdges);
    s.planesGroup.add(topMesh);

    // Right Plane (YZ)
    const rightGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const rightMat = new THREE.MeshBasicMaterial({ color: 0xd97706, transparent: true, opacity: 0.12, side: THREE.DoubleSide });
    const rightMesh = new THREE.Mesh(rightGeo, rightMat);
    rightMesh.rotation.y = Math.PI / 2;
    const rightEdges = new THREE.LineSegments(new THREE.EdgesGeometry(rightGeo), new THREE.LineBasicMaterial({ color: 0xfbbf24 }));
    rightMesh.add(rightEdges);
    s.planesGroup.add(rightMesh);
  }, [showPlanes]);

  // Center of Mass (COM) Triad & Quadrant Marker
  useEffect(() => {
    const s = threeState.current;
    if (!s.comGroup) return;

    while (s.comGroup.children.length > 0) {
      const obj = s.comGroup.children[0];
      s.comGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }

    if (!showCenterOfMass) return;

    const comX = part.primitives.reduce((acc, p) => acc + p.position[0], 0) / (part.primitives.length || 1);
    const comY = part.primitives.reduce((acc, p) => acc + p.position[1], 0) / (part.primitives.length || 1);
    const comZ = part.primitives.reduce((acc, p) => acc + p.position[2], 0) / (part.primitives.length || 1);

    // Sphere Marker
    const sphereGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.2, metalness: 0.7 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(comX, comY, comZ);
    s.comGroup.add(sphere);

    // RGB Triad Axes at COM
    const triad = new THREE.AxesHelper(18);
    triad.position.set(comX, comY, comZ);
    s.comGroup.add(triad);
  }, [showCenterOfMass, part]);

  // Dimension & Inspection Overlays
  useEffect(() => {
    const s = threeState.current;
    if (!s.dimensionGroup) return;

    while (s.dimensionGroup.children.length > 0) {
      const obj = s.dimensionGroup.children[0];
      s.dimensionGroup.remove(obj);
    }

    if (!showDimensions) return;

    // Build dimension leader lines and markers
    part.dimensions.forEach((dim) => {
      const p1 = new THREE.Vector3(...dim.p1);
      const p2 = new THREE.Vector3(...dim.p2);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
      const line = new THREE.Line(lineGeo, lineMat);
      s.dimensionGroup?.add(line);

      // Arrowheads / End tick marks
      const tick1Geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p1.x, p1.y - 3, p1.z),
        new THREE.Vector3(p1.x, p1.y + 3, p1.z),
      ]);
      const tick2Geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p2.x, p2.y - 3, p2.z),
        new THREE.Vector3(p2.x, p2.y + 3, p2.z),
      ]);
      s.dimensionGroup?.add(new THREE.Line(tick1Geo, lineMat));
      s.dimensionGroup?.add(new THREE.Line(tick2Geo, lineMat));
    });
  }, [part.dimensions, showDimensions]);

  // Mouse Interactivity (Pan, Orbit, Zoom, Pick)
  const handleMouseDown = (e: React.MouseEvent) => {
    const s = threeState.current;
    s.prevMouseX = e.clientX;
    s.prevMouseY = e.clientY;
    s.dragStartX = e.clientX;
    s.dragStartY = e.clientY;

    if (e.button === 2 || e.shiftKey) {
      s.isPanning = true;
    } else if (e.button === 0) {
      s.isDragging = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const s = threeState.current;
    const dx = e.clientX - s.prevMouseX;
    const dy = e.clientY - s.prevMouseY;
    s.prevMouseX = e.clientX;
    s.prevMouseY = e.clientY;

    if (s.isPanning && s.camera) {
      const factor = s.cameraRadius * 0.0015;
      const right = new THREE.Vector3();
      s.camera.getWorldDirection(right);
      right.cross(s.camera.up).normalize();

      s.target.addScaledVector(right, -dx * factor);
      s.target.y += dy * factor;
      updateCameraPosition();
    } else if (s.isDragging) {
      s.cameraTheta -= dx * 0.008;
      s.cameraPhi -= dy * 0.008;
      updateCameraPosition();
    } else {
      // Raycast hover check
      if (!canvasRef.current || !s.camera || !s.meshGroup) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, s.camera);
      const intersects = raycaster.intersectObjects(s.meshGroup.children, true);

      if (intersects.length > 0) {
        let parentMesh: THREE.Object3D | null = intersects[0].object;
        while (parentMesh && !parentMesh.userData.primitiveId && parentMesh.parent) {
          parentMesh = parentMesh.parent;
        }
        if (parentMesh && parentMesh.userData.name) {
          setHoveredFeature(parentMesh.userData.name);
        }
      } else {
        setHoveredFeature(null);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const s = threeState.current;
    const wasDragging = s.isDragging;
    s.isDragging = false;
    s.isPanning = false;

    // Detect click selection if mouse did not drag
    const dragDistance = Math.hypot(e.clientX - s.dragStartX, e.clientY - s.dragStartY);
    if (wasDragging && dragDistance < 6) {
      if (!canvasRef.current || !s.camera || !s.meshGroup) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, s.camera);
      const intersects = raycaster.intersectObjects(s.meshGroup.children, true);

      if (intersects.length > 0) {
        let parentMesh: THREE.Object3D | null = intersects[0].object;
        while (parentMesh && !parentMesh.userData.primitiveId && parentMesh.parent) {
          parentMesh = parentMesh.parent;
        }

        if (parentMesh && parentMesh.userData.primitiveId) {
          onSelectPrimitive(parentMesh.userData.primitiveId);
        }

        if (measurementMode) {
          const hitPoint = intersects[0].point;
          if (measurePoints.length === 0) {
            setMeasurePoints([hitPoint]);
            setMeasuredDistance(null);
          } else {
            const p1 = measurePoints[0];
            const dist = p1.distanceTo(hitPoint);
            setMeasurePoints([p1, hitPoint]);
            setMeasuredDistance(dist);
          }
        }
      } else {
        onSelectPrimitive(null);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const s = threeState.current;
    s.cameraRadius = Math.max(30, Math.min(800, s.cameraRadius + e.deltaY * 0.15));
    updateCameraPosition();
  };

  // Export ASCII STL
  const handleExportSTL = () => {
    const s = threeState.current;
    if (!s.meshGroup) return;

    let stlString = `solid ${part.partNumber}\n`;
    s.meshGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && !child.userData.isHole) {
        const geo = child.geometry.clone().toNonIndexed();
        const pos = geo.attributes.position;
        const norm = geo.attributes.normal;

        child.updateMatrixWorld(true);
        const matrix = child.matrixWorld;

        for (let i = 0; i < pos.count; i += 3) {
          const v1 = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(matrix);
          const v2 = new THREE.Vector3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)).applyMatrix4(matrix);
          const v3 = new THREE.Vector3(pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2)).applyMatrix4(matrix);

          const normal = new THREE.Vector3(norm.getX(i), norm.getY(i), norm.getZ(i)).transformDirection(matrix);

          stlString += `  facet normal ${normal.x.toExponential(6)} ${normal.y.toExponential(6)} ${normal.z.toExponential(6)}\n`;
          stlString += `    outer loop\n`;
          stlString += `      vertex ${v1.x.toExponential(6)} ${v1.y.toExponential(6)} ${v1.z.toExponential(6)}\n`;
          stlString += `      vertex ${v2.x.toExponential(6)} ${v2.y.toExponential(6)} ${v2.z.toExponential(6)}\n`;
          stlString += `      vertex ${v3.x.toExponential(6)} ${v3.y.toExponential(6)} ${v3.z.toExponential(6)}\n`;
          stlString += `    endloop\n`;
          stlString += `  endfacet\n`;
        }
        geo.dispose();
      }
    });
    stlString += `endsolid ${part.partNumber}\n`;

    const blob = new Blob([stlString], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${part.partNumber}_3D.stl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Snapshot capture
  const handleCaptureSnapshot = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${part.partNumber}_CAD_Snapshot.png`;
    a.click();
  };

  return (
    <div 
      id="cad-viewport-container" 
      ref={containerRef} 
      className="relative w-full h-full min-h-[500px] bg-[#0F1115] select-none overflow-hidden rounded-xl border border-[#282E39] shadow-xl flex flex-col"
    >
      {/* SolidWorks Heads-Up View Toolbar (Centered) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <SolidWorksHeadsUpToolbar
          onZoomToFit={handleZoomToFit}
          onViewPreset={setViewPreset}
          renderMode={renderMode}
          onRenderModeChange={onRenderModeChange}
          sectionCutAxis={sectionCutAxis}
          onSectionCutChange={onSectionCutChange}
          showDimensions={showDimensions}
          onToggleDimensions={onToggleDimensions}
          showPlanes={showPlanes}
          onTogglePlanes={onTogglePlanes || (() => {})}
          showCenterOfMass={showCenterOfMass}
          onToggleCenterOfMass={onToggleCenterOfMass || (() => {})}
          explodedProgress={explodedProgress}
          onExplodedChange={onExplodedChange || (() => {})}
          onCaptureSnapshot={handleCaptureSnapshot}
          onExportSTL={handleExportSTL}
        />
      </div>

      {/* Top Left Quick Action: 2D Sketcher & 3D Modeler Drawer Toggle */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          id="toggle-cad-modeler-btn"
          onClick={() => setShowModelingStudio(!showModelingStudio)}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-lg ${
            showModelingStudio
              ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20 ring-1 ring-emerald-400"
              : "bg-[#1A1D23]/95 text-[#63B3ED] border border-[#3182CE]/50 hover:bg-[#22262F]"
          }`}
          title="Open Parametric 2D Sketching & 3D Feature Modeler"
        >
          <Pencil className="w-3.5 h-3.5 text-emerald-400" />
          Feature Modeler
        </button>

        <button
          id="toggle-standards-btn"
          onClick={onOpenStandards}
          className="px-2.5 py-1.5 text-xs font-mono bg-[#1A1D23]/95 text-[#A0AEC0] hover:text-white border border-[#282E39] rounded-lg transition-colors flex items-center gap-1.5 shadow-lg hover:border-[#3182CE]/50"
          title="Open ISO / ANSI Engineering Standards Guidance"
        >
          <Compass className="w-3.5 h-3.5 text-[#3182CE]" />
          Standards
        </button>
      </div>

      {/* Measure Tool Modal */}
      {measurementMode && (
        <MeasureToolModal
          part={part}
          onClose={() => {
            setMeasurementMode(false);
            setMeasurePoints([]);
            setMeasuredDistance(null);
          }}
          measuredDistance={measuredDistance}
          measurePoints={measurePoints.map(p => [p.x, p.y, p.z] as [number, number, number])}
          onClearMeasure={() => {
            setMeasurePoints([]);
            setMeasuredDistance(null);
          }}
        />
      )}

      {/* 3D Canvas */}
      <canvas
        id="cad-webgl-canvas"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full flex-1 cursor-grab active:cursor-grabbing block"
      />

      {/* Bottom Overlay: Telemetry, FEA Legend & Feature Probing */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none">
        {/* Left: Coordinate readout & Hovered feature */}
        <div className="flex flex-col gap-1.5">
          {hoveredFeature && (
            <div className="bg-[#1A1D23]/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#3182CE]/50 text-xs font-mono text-[#63B3ED] shadow-xl flex items-center gap-2 pointer-events-auto">
              <Compass className="w-3.5 h-3.5 text-[#3182CE] animate-spin" />
              <span>Target: <strong className="text-white">{hoveredFeature}</strong></span>
            </div>
          )}

          {measuredDistance !== null && (
            <div className="bg-[#1A1D23]/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/60 text-xs font-mono text-amber-200 shadow-xl pointer-events-auto">
              <span>Span Distance: <strong className="text-white">{measuredDistance.toFixed(3)} mm</strong></span>
            </div>
          )}

          <div className="bg-[#1A1D23]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#282E39] text-[11px] font-mono text-[#A0AEC0] flex items-center gap-3">
            <span>GRID: <strong className="text-white">5.0 mm</strong></span>
            <span>UNITS: <strong className="text-white">METRIC (mm)</strong></span>
            <span>PROJECTION: <strong className="text-white">3RD ANGLE</strong></span>
          </div>
        </div>

        {/* Right: FEA Stress Legend (Visible when FEA mode active) */}
        {renderMode === "fea_stress" && (
          <div className="bg-[#1A1D23]/95 backdrop-blur-md p-2.5 rounded-lg border border-[#282E39] shadow-xl pointer-events-auto flex flex-col gap-1.5 w-56">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#EDF2F7]">
              <span className="flex items-center gap-1 text-amber-400">
                <Flame className="w-3 h-3" />
                von Mises Stress
              </span>
              <span className="font-bold text-[#63B3ED]">{part.engineeringAnalysis.vonMisesMaxMpa} MPa</span>
            </div>

            {/* Rainbow Gradient Bar */}
            <div className="h-3 w-full rounded bg-gradient-to-r from-blue-600 via-green-500 via-yellow-400 to-red-600 border border-[#282E39]" />

            <div className="flex justify-between text-[10px] font-mono text-[#A0AEC0]">
              <span>0 MPa</span>
              <span>{(part.engineeringAnalysis.vonMisesMaxMpa * 0.5).toFixed(0)}</span>
              <span className="text-rose-400 font-bold">{part.engineeringAnalysis.vonMisesMaxMpa} MPa</span>
            </div>

            <div className="pt-1 border-t border-[#282E39] flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#A0AEC0]">Safety Factor n:</span>
              <span className={`font-bold ${part.engineeringAnalysis.safetyFactor >= 2.0 ? "text-emerald-400" : "text-amber-400"}`}>
                {part.engineeringAnalysis.safetyFactor.toFixed(2)} (Req: 2.00)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Docked CAD Modeling Studio Drawer (2D Sketching & 3D Operations) */}
      {showModelingStudio && (
        <div className="absolute inset-x-2 bottom-2 top-16 z-20 flex flex-col bg-[#15181E] rounded-xl border border-[#3182CE]/60 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#101217] border-b border-[#282E39]">
            <span className="font-mono font-bold text-xs text-white flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-[#3182CE]" />
              Interactive CAD Modeling Space • 2D Sketching &amp; 3D Solid Operations
            </span>
            <button
              onClick={() => setShowModelingStudio(false)}
              className="p-1 hover:bg-[#22262F] text-[#A0AEC0] hover:text-white rounded transition-colors"
              title="Close Modeler"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <CADModelingStudio
              part={part}
              selectedPrimitiveId={selectedPrimitiveId}
              onSelectPrimitive={onSelectPrimitive}
              onUpdatePart={(updated) => {
                if (onUpdatePart) onUpdatePart(updated);
              }}
              onClose={() => setShowModelingStudio(false)}
              initialTool={initialModelingTool}
              initialTab={initialModelingTab}
            />
          </div>
        </div>
      )}
    </div>
  );
};
