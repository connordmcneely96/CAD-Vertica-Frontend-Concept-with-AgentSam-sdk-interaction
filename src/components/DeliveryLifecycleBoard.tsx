import React, { useState } from "react";
import { CADPart, EngineeringChangeOrder } from "../types/cad";
import { 
  GitCommit, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Plus, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  Cpu,
  BadgeCheck
} from "lucide-react";

interface DeliveryLifecycleBoardProps {
  part: CADPart;
  onUpdatePart: (updatedPart: CADPart) => void;
}

export const DeliveryLifecycleBoard: React.FC<DeliveryLifecycleBoardProps> = ({
  part,
  onUpdatePart,
}) => {
  const [ecos, setEcos] = useState<EngineeringChangeOrder[]>([
    {
      id: "eco-1048",
      ecoNumber: "ECO-1048",
      title: "Add R4.0mm stress-relief fillets at bulkhead intersection",
      author: "C. McNeely (Chief Mechanical PE)",
      date: "2026-08-28",
      priority: "HIGH",
      status: "RELEASED",
      description: "Implemented Pahl & Beitz minimum notch sensitivity rules to eliminate 84 MPa peak stress concentration.",
      reasonForChange: "FEA von Mises stress exceeded 110 MPa during 30g flight qualification.",
      affectedPartRev: "D.1 -> D.2",
    },
    {
      id: "eco-1049",
      ecoNumber: "ECO-1049",
      title: "Transition mounting fasteners to titanium NAS1351 socket caps",
      author: "E. Vance (Lead Materials Engineer)",
      date: "2026-09-01",
      priority: "ROUTINE",
      status: "APPROVED",
      description: "Specified A286 high-strength fasteners to eliminate galvanic coupling with anodized 6061-T6 plate.",
      reasonForChange: "ASTM B117 salt fog corrosion protection requirements.",
      affectedPartRev: "D.2",
    },
    {
      id: "eco-1052",
      ecoNumber: "ECO-1052",
      title: "Recess base pocket for 68g weight reduction per Ashby index",
      author: "NexusCAD Copilot (AI Synthesis)",
      date: "2026-09-03",
      priority: "ROUTINE",
      status: "IN_REVIEW",
      description: "Automated topology optimization reduced non-structural web thickness from 12mm to 6mm.",
      reasonForChange: "Aerospace mass budget surplus reduction.",
      affectedPartRev: "D.2 -> D.3",
    },
  ]);

  const [newEcoModal, setNewEcoModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"CRITICAL" | "HIGH" | "ROUTINE">("HIGH");

  const gateStages = [
    { code: "SRR", name: "System Requirements Review", status: "PASSED", date: "2026-07-14", notes: "Flight load envelope 4.8 kN approved" },
    { code: "PDR", name: "Preliminary Design Review", status: "PASSED", date: "2026-08-02", notes: "Embodiment layout & 6061-T6 baseline locked" },
    { code: "CDR", name: "Critical Design Review", status: "CURRENT", date: "2026-09-03", notes: "ASME Y14.5 GD&T and FEA stress signoff" },
    { code: "TRR", name: "Test Readiness Review", status: "PENDING", date: "2026-09-18", notes: "Shaker table fixturing in fab" },
    { code: "PRR", name: "Production Readiness Review", status: "PENDING", date: "2026-10-05", notes: "5-Axis CNC CAM toolpath verification" },
  ];

  const dvprItems = [
    { id: "dvp-1", testName: "Static Proof Load (1.5x Limit Load)", spec: "NASA-STD-5001", requirement: "Zero permanent yield @ 7.2 kN", result: "7.8 kN Held (SF 2.93)", status: "PASS" },
    { id: "dvp-2", testName: "Random Vibration (GEVS)", spec: "GSFC-STD-7000", requirement: "14.1 grms, 20-2000 Hz, 3 axes", result: "1st Resonant Mode 680 Hz", status: "PASS" },
    { id: "dvp-3", testName: "Thermal Vacuum Cycle", spec: "MIL-STD-810H", requirement: "-40°C to +85°C (12 cycles)", result: "Thermal expansion within fit", status: "IN_PROGRESS" },
    { id: "dvp-4", testName: "Salt Fog Environmental Test", spec: "ASTM B117", requirement: "168 Hours continuous exposure", result: "Scheduled for TRR", status: "PENDING" },
  ];

  const advanceEcoStatus = (ecoId: string) => {
    setEcos((prev) =>
      prev.map((e) => {
        if (e.id !== ecoId) return e;
        let nextStatus: EngineeringChangeOrder["status"] = "DRAFT";
        if (e.status === "DRAFT") nextStatus = "IN_REVIEW";
        else if (e.status === "IN_REVIEW") nextStatus = "APPROVED";
        else if (e.status === "APPROVED") {
          nextStatus = "RELEASED";
          // Bump part revision when released
          const nextRevLetter = String.fromCharCode(part.revision.charCodeAt(0) + 1);
          onUpdatePart({
            ...part,
            revision: `${nextRevLetter}.0`,
          });
        } else {
          nextStatus = "IN_REVIEW";
        }
        return { ...e, status: nextStatus };
      })
    );
  };

  const handleCreateEco = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newEco: EngineeringChangeOrder = {
      id: `eco-${Date.now()}`,
      ecoNumber: `ECO-${Math.floor(1000 + Math.random() * 9000)}`,
      title: newTitle,
      author: "Chief Engineer",
      date: new Date().toISOString().split("T")[0],
      priority: newPriority,
      status: "DRAFT",
      description: newDesc,
      reasonForChange: "Engineering optimization request",
      affectedPartRev: `${part.revision} -> Rev Next`,
    };

    setEcos([newEco, ...ecos]);
    setNewTitle("");
    setNewDesc("");
    setNewEcoModal(false);
  };

  return (
    <div id="delivery-lifecycle-view" className="h-full flex flex-col bg-[#0F1115] p-4 overflow-y-auto font-mono text-xs text-[#EDF2F7] space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#282E39] pb-3">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#63B3ED]" />
            Engineering Delivery OS • Lifecycle Governance
          </h2>
          <span className="text-[11px] text-[#A0AEC0]">
            NASA Systems Engineering Handbook &amp; AS9100D Configuration Management
          </span>
        </div>

        <button
          onClick={() => setNewEcoModal(true)}
          className="px-3 py-1.5 bg-[#3182CE] hover:bg-[#2B6CB0] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Create ECO (Change Order)
        </button>
      </div>

      {/* Stage Gate Pipeline (NASA Systems Engineering V-Model) */}
      <div className="bg-[#1A1D23] p-4 rounded-xl border border-[#282E39] shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <BadgeCheck className="w-4 h-4 text-[#63B3ED]" />
            Stage Gate Delivery Pipeline
          </span>
          <span className="text-[10px] text-[#63B3ED] bg-[#3182CE]/10 px-2 py-0.5 rounded border border-[#3182CE]/30 font-bold">
            CURRENT GATE: CDR IN PROGRESS
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {gateStages.map((gate) => {
            const isPassed = gate.status === "PASSED";
            const isCurrent = gate.status === "CURRENT";
            return (
              <div
                key={gate.code}
                className={`p-3 rounded-lg border flex flex-col justify-between ${
                  isCurrent
                    ? "bg-[#3182CE]/15 border-[#3182CE] shadow-md"
                    : isPassed
                    ? "bg-[#15181E] border-emerald-500/40"
                    : "bg-[#15181E] border-[#282E39] opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">{gate.code}</span>
                    {isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <Clock className="w-3.5 h-3.5 text-[#63B3ED] animate-spin" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-[#4A5568]" />
                    )}
                  </div>
                  <span className="text-[11px] text-[#EDF2F7] block font-medium mb-1">
                    {gate.name}
                  </span>
                  <span className="text-[10px] text-[#A0AEC0] block mb-2">{gate.notes}</span>
                </div>
                <div className="text-[9px] text-[#A0AEC0] border-t border-[#282E39] pt-1.5 flex justify-between">
                  <span>Target: {gate.date}</span>
                  <span className={isPassed ? "text-emerald-400 font-bold" : isCurrent ? "text-[#63B3ED] font-bold" : ""}>
                    {gate.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: ECO Management & DVP&R Verification Matrix */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Engineering Change Orders (ECO) */}
        <div className="col-span-7 bg-[#1A1D23] p-4 rounded-xl border border-[#282E39] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-amber-400" />
              Engineering Change Orders (ECO Audit Trail)
            </span>
            <span className="text-[10px] text-[#A0AEC0]">Total ECOs: {ecos.length}</span>
          </div>

          <div className="space-y-2">
            {ecos.map((eco) => (
              <div
                key={eco.id}
                className="p-3 bg-[#15181E] rounded-lg border border-[#282E39] hover:border-[#3182CE]/50 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{eco.ecoNumber}</span>
                    <button
                      onClick={() => advanceEcoStatus(eco.id)}
                      title="Click to advance ECO governance status (Draft → In Review → Approved → Released)"
                      className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 ${
                        eco.status === "RELEASED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : eco.status === "APPROVED"
                          ? "bg-[#3182CE]/20 text-[#63B3ED] border border-[#3182CE]/30 hover:bg-[#3182CE]/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                      }`}
                    >
                      <span>{eco.status}</span>
                      <span className="text-[9px] opacity-70">↻</span>
                    </button>
                    <span className="text-[10px] text-[#A0AEC0]">Rev {eco.affectedPartRev}</span>
                  </div>
                  <span className="text-[10px] text-[#A0AEC0]">{eco.date}</span>
                </div>

                <div className="font-medium text-[#EDF2F7]">{eco.title}</div>
                <div className="text-[11px] text-[#A0AEC0]">{eco.description}</div>

                <div className="text-[10px] text-[#A0AEC0] pt-1 flex items-center justify-between border-t border-[#282E39]">
                  <span>Author: {eco.author}</span>
                  <span>Priority: <strong className={eco.priority === "HIGH" ? "text-amber-400" : "text-[#EDF2F7]"}>{eco.priority}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: DVP&R Testing Matrix */}
        <div className="col-span-5 bg-[#1A1D23] p-4 rounded-xl border border-[#282E39] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              DVP&amp;R Verification Matrix
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">AS9100 Compliant</span>
          </div>

          <div className="space-y-2">
            {dvprItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-[#15181E] rounded-lg border border-[#282E39] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#EDF2F7] text-xs">{item.testName}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    item.status === "PASS"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : item.status === "IN_PROGRESS"
                      ? "bg-[#3182CE]/20 text-[#63B3ED] border border-[#3182CE]/30"
                      : "bg-[#1A1D23] border border-[#282E39] text-[#A0AEC0]"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <div className="text-[10px] text-[#A0AEC0]">
                  <strong className="text-white">Spec:</strong> {item.spec} • {item.requirement}
                </div>
                <div className="text-[10px] text-[#63B3ED] font-mono">
                  <strong className="text-white">Verification Output:</strong> {item.result}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New ECO Modal */}
      {newEcoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1D23] border border-[#282E39] rounded-xl p-5 max-w-md w-full shadow-2xl space-y-3 font-mono">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-[#63B3ED]" />
              Initiate Engineering Change Order (ECO)
            </h3>
            <form onSubmit={handleCreateEco} className="space-y-3">
              <div>
                <label className="text-[11px] text-[#A0AEC0] block mb-1">ECO Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Increase wall thickness at cross-bore to 14mm"
                  className="w-full bg-[#15181E] border border-[#282E39] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#3182CE]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-[#A0AEC0] block mb-1">Engineering Justification</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  placeholder="Citing Shigley Lamé cylinder formula or fatigue limit calculation..."
                  className="w-full bg-[#15181E] border border-[#282E39] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#3182CE]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#A0AEC0] block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-[#15181E] border border-[#282E39] rounded px-2.5 py-1.5 text-xs text-white outline-none"
                >
                  <option value="CRITICAL">CRITICAL (Flight Safety)</option>
                  <option value="HIGH">HIGH (Design Yield Margin)</option>
                  <option value="ROUTINE">ROUTINE (DFMA / Cost Reduction)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#282E39]">
                <button
                  type="button"
                  onClick={() => setNewEcoModal(false)}
                  className="px-3 py-1.5 bg-[#15181E] hover:bg-[#22262F] border border-[#282E39] text-[#A0AEC0] hover:text-white rounded text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#3182CE] hover:bg-[#2B6CB0] text-white font-bold rounded text-xs transition-colors shadow-sm"
                >
                  Submit ECO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
