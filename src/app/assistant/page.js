"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { ref, set } from "firebase/database";
import { Moon, Sun, ArrowLeft, Send, Check, Sprout } from "lucide-react";
import Logo from "@/components/Logo";
import { findPlant, listPlantNames } from "@/lib/plantData";

export default function Assistant() {
  const [darkMode, setDarkMode] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Tell me what crop you're growing, and I'll suggest moisture settings and watering guidance for it. Try something like \"tomato\" or \"how often should I water okra?\".",
    },
  ]);
  const [applied, setApplied] = useState(false);
  const router = useRouter();
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("root-theme");
    if (saved === "dark") setDarkMode(true);
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("root-theme", next ? "dark" : "light");
      return next;
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setApplied(false);

    const match = findPlant(text);

    setTimeout(() => {
      if (match) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: `${match.name} (${match.stage})`,
            plant: match,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "I don't have data on that one yet. Crops I know about: " + listPlantNames().join(", ") + ".",
          },
        ]);
      }
    }, 300);
  };

  const applySettings = async (plant) => {
    try {
      await set(ref(db, "devices/frame01/settings/minMoisture"), plant.minMoisture);
      await set(ref(db, "devices/frame01/settings/maxMoisture"), plant.maxMoisture);
      setApplied(true);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `Applied — minimum ${plant.minMoisture}%, target ${plant.maxMoisture}% for ${plant.name}.` },
      ]);
    } catch (err) {
      console.error("Failed to apply settings:", err);
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-6 py-6 flex flex-col h-screen">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft size={16} /> Back to dashboard
            </button>
            <button
              onClick={toggleTheme}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Sprout size={20} className="text-[var(--accent)]" />
            <h1 className="text-lg font-medium">Plant assistant</h1>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-3 pb-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-[var(--accent)] text-[#04150B]"
                      : "bg-[var(--bg-card)] border border-[var(--border-color)]"
                  }`}
                >
                  <p className="font-medium">{m.text}</p>

                  {m.plant && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-color)] flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-[var(--text-muted)]">
                        <span>Minimum: <span className="font-mono text-[#E2A93E]">{m.plant.minMoisture}%</span></span>
                        <span>Target: <span className="font-mono text-[var(--accent)]">{m.plant.maxMoisture}%</span></span>
                      </div>

                      <p className="text-xs">
                        <span className="text-[var(--text-muted)]">Watering: </span>
                        {m.plant.frequency}
                      </p>
                      <p className="text-xs">
                        <span className="text-[var(--text-muted)]">Tip: </span>
                        {m.plant.tips}
                      </p>
                      <p className="text-xs">
                        <span className="text-[var(--text-muted)]">Watch for: </span>
                        {m.plant.issues}
                      </p>

                      <button
                        onClick={() => applySettings(m.plant)}
                        className="w-full bg-[var(--accent)] text-[#04150B] rounded-lg py-2 text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 mt-1"
                      >
                        {applied ? (
                          <>
                            <Check size={14} /> Applied to Settings
                          </>
                        ) : (
                          `Apply these settings for ${m.plant.name}`
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-[var(--border-color)]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. how often should I water tomato?"
              className="flex-1 border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="bg-[var(--accent)] text-[#04150B] rounded-lg px-4 flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Send size={16} />
            </button>
          </form>
        </div>

        <style jsx global>{`
          :root {
            --bg-page: #eaf3ed;
            --bg-card: #ffffff;
            --border-color: #c7ddd0;
            --text-primary: #10201a;
            --text-muted: #3d5c4c;
            --accent: #1f9d5c;
          }
          .dark {
            --bg-page: #070a08;
            --bg-card: #0f1712;
            --border-color: #1e2b22;
            --text-primary: #e8fff0;
            --text-muted: #8fe3b0;
            --accent: #39ff88;
          }
        `}</style>
      </div>
    </div>
  );
}