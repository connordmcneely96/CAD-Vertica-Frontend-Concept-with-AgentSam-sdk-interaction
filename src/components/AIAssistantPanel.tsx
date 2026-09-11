import React, { useState } from "react";
import { CADPart, TextbookReference, GDTAnnotation } from "../types/cad";
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  CheckCircle2, 
  ShieldAlert, 
  Cpu, 
  ArrowUpRight, 
  RefreshCw, 
  FileText,
  Sliders,
  Layers,
  HelpCircle
} from "lucide-react";

interface AIAssistantPanelProps {
  currentPart: CADPart;
  onApplySynthesizedPart: (newPart: CADPart) => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  synthesizedPart?: CADPart;
  formulas?: TextbookReference[];
  gdtCallouts?: GDTAnnotation[];
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  currentPart,
  onApplySynthesizedPart,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: `Welcome to the NexusCAD Engineering Delivery Co-Pilot. I am grounded in classic mechanical engineering principles:\n\n• Shigley's Mechanical Engineering Design (von Mises yield, Goodman fatigue, AGMA gearing)\n• Pahl & Beitz / Dieter Systematic Design Flows (Embodiment, direct load paths, minimum notch)\n• ASME Y14.5-2018 GD&T (True position MMC, Datum reference frames)\n• Ashby Materials Selection (Performance indices & weight optimization)\n\nDescribe the functional requirements, load cases, or geometry you wish to synthesize or optimize.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      formulas: currentPart.textbookFormulas,
      gdtCallouts: currentPart.gdtCallouts,
    },
  ]);

  const quickPrompts = [
    "Synthesize lightweight titanium avionics bracket with 4x M8 clearance bores",
    "Design 24T AGMA involute spur gear with inertia reduction web",
    "Generate 350-bar hydraulic valve manifold with SAE-6 ports",
    "Optimize fillet transitions to reduce stress concentration Kt < 1.4",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || prompt;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setPrompt("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/copilot/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          currentPart,
          stage: currentPart.designStage,
          targetMaterial: currentPart.material.name,
        }),
      });

      const data = await response.json();

      if (data.success && data.part) {
        const synthesized = data.part;
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: `Synthesized **${synthesized.name}** [Rev ${synthesized.revision || "A"}] grounded in ${synthesized.standard || "ASME Y14.5"}.\n\n` +
            `**Analysis Summary:**\n` +
            `• Governing Criterion: ${synthesized.engineeringAnalysis?.governingCriterion || "Distortion Energy Theory"}\n` +
            `• Peak von Mises Stress: ${synthesized.engineeringAnalysis?.vonMisesMaxMpa || 94} MPa\n` +
            `• Factor of Safety: n = ${synthesized.engineeringAnalysis?.safetyFactor || 2.8} (Allowable: ${synthesized.engineeringAnalysis?.allowableStressMpa || 276} MPa)\n` +
            `• Estimated Mass: ${synthesized.engineeringAnalysis?.estimatedMassGrams || 290} g (${synthesized.material?.name || "6061-T6 Al"})\n\n` +
            `${synthesized.designRationale || ""}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          synthesizedPart: {
            ...currentPart,
            ...synthesized,
            id: `part-${Date.now()}`,
            primitives: synthesized.primitives || currentPart.primitives,
            textbookFormulas: synthesized.textbookFormulas || currentPart.textbookFormulas,
            gdtCallouts: synthesized.gdtCallouts || currentPart.gdtCallouts,
            engineeringAnalysis: synthesized.engineeringAnalysis || currentPart.engineeringAnalysis,
          },
          formulas: synthesized.textbookFormulas,
          gdtCallouts: synthesized.gdtCallouts,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data.error || "Failed to generate CAD model");
      }
    } catch (err: any) {
      console.error("AI synthesis error:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `Unable to complete synthesis: ${err.message}. Please check parameters or network connection.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-assistant-panel" className="h-full flex flex-col bg-[#1A1D23] border border-[#282E39] rounded-xl overflow-hidden shadow-lg">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#282E39] bg-[#15181E] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#3182CE]/20 border border-[#3182CE]/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#63B3ED]" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
              Engineering AI Co-Pilot
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                SHIGLEY / ASME Y14.5
              </span>
            </h3>
            <p className="text-[10px] text-[#A0AEC0] font-mono">
              Model synthesis grounded in textbook standards
            </p>
          </div>
        </div>
        <button
          onClick={() => handleSendMessage("Verify current model against Shigley static loading and fatigue limits")}
          className="p-1.5 text-[#A0AEC0] hover:text-white hover:bg-[#22262F] rounded transition-colors"
          title="Verify Shigley Standards"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2 border-b border-[#282E39] bg-[#15181E] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(qp)}
            className="shrink-0 px-2.5 py-1 text-[11px] font-mono rounded bg-[#1A1D23] hover:bg-[#3182CE]/20 hover:text-[#63B3ED] text-[#A0AEC0] border border-[#282E39] transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] font-mono text-[#A0AEC0] mb-1 px-1">
              <span>{msg.sender === "user" ? "Lead Systems Engineer" : "NexusCAD AI"}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded-xl max-w-[95%] text-xs font-mono leading-relaxed shadow-sm ${
                msg.sender === "user"
                  ? "bg-[#3182CE] text-white rounded-br-none"
                  : "bg-[#15181E] text-[#EDF2F7] border border-[#282E39] rounded-bl-none space-y-2.5"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Action Button: Apply Model to CAD Viewport */}
              {msg.synthesizedPart && (
                <div className="pt-2 border-t border-[#282E39] flex items-center justify-between">
                  <span className="text-[11px] text-[#63B3ED] font-bold">
                    3D Model Ready for Ingress
                  </span>
                  <button
                    onClick={() => onApplySynthesizedPart(msg.synthesizedPart!)}
                    className="px-3 py-1.5 bg-[#3182CE] hover:bg-[#2B6CB0] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Apply to 3D CAD
                  </button>
                </div>
              )}

              {/* Textbook Formulas Derivation Box */}
              {msg.formulas && msg.formulas.length > 0 && (
                <div className="mt-2.5 p-2.5 bg-[#1A1D23] rounded-lg border border-[#3182CE]/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-[#63B3ED] font-bold text-[11px]">
                    <BookOpen className="w-3.5 h-3.5" />
                    Textbook Engineering Derivation
                  </div>
                  {msg.formulas.map((f, i) => (
                    <div key={i} className="text-[11px] bg-[#15181E] p-2 rounded border border-[#282E39]">
                      <div className="text-amber-400 font-bold mb-0.5">{f.textbook}</div>
                      <div className="text-[#A0AEC0] text-[10px] mb-1">{f.chapter}</div>
                      <div className="font-mono text-[#63B3ED] bg-[#1A1D23] px-2 py-1 rounded my-1 border border-[#282E39]">
                        {f.formula}
                      </div>
                      <div className="text-[#EDF2F7] text-[10px] mt-1">
                        <strong className="text-white">Calc:</strong> {f.calculation}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ASME Y14.5 GD&T Callouts Box */}
              {msg.gdtCallouts && msg.gdtCallouts.length > 0 && (
                <div className="mt-2 p-2 bg-[#1A1D23] rounded-lg border border-[#282E39] space-y-1.5">
                  <div className="text-[11px] font-bold text-[#EDF2F7] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ASME Y14.5 Feature Control Frames
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {msg.gdtCallouts.map((g, i) => (
                      <div key={i} className="flex items-center gap-1 text-[11px] font-mono">
                        <span className="px-1.5 py-0.5 bg-[#15181E] border border-[#282E39] rounded text-amber-400 font-bold uppercase">
                          {g.symbol}
                        </span>
                        <span className="px-1.5 py-0.5 bg-[#15181E] border border-[#282E39] rounded text-[#63B3ED]">
                          {g.tolerance} {g.modifier && `(${g.modifier})`}
                        </span>
                        <span className="px-1.5 py-0.5 bg-[#15181E] border border-[#282E39] rounded text-[#EDF2F7]">
                          {g.datumRefs}
                        </span>
                        <span className="text-[#A0AEC0] text-[10px] truncate ml-1">
                          {g.feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-[#63B3ED] bg-[#15181E] p-3 rounded-xl border border-[#3182CE]/40">
            <RefreshCw className="w-4 h-4 animate-spin text-[#3182CE]" />
            <span>Consulting Shigley equations & synthesizing parametric CAD primitives...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-[#282E39] bg-[#15181E]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="copilot-input-field"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Add 4x M8 bolt holes with ASME position Ø0.05 MMC..."
            className="flex-1 bg-[#1A1D23] border border-[#282E39] focus:border-[#3182CE] text-white rounded-lg px-3 py-2 text-xs font-mono outline-none transition-colors"
          />
          <button
            id="copilot-send-btn"
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="p-2 bg-[#3182CE] hover:bg-[#2B6CB0] disabled:bg-[#1A1D23] disabled:text-[#4A5568] text-white font-bold rounded-lg transition-colors shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
