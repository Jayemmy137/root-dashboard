"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/firebase";
import { ref, onValue, set } from "firebase/database";
import { Moon, Sun, ArrowLeft, Check, Droplets, Bell } from "lucide-react";
import Logo from "@/components/Logo";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const [deviceName, setDeviceName] = useState("Frame 01");
  const [minMoisture, setMinMoisture] = useState(25);
  const [maxMoisture, setMaxMoisture] = useState(65);
  const [lowReservoirAlert, setLowReservoirAlert] = useState(true);
  const [reservoirAlertLevel, setReservoirAlertLevel] = useState(20);
  const [pumpAlerts, setPumpAlerts] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("root-theme");
    if (savedTheme === "dark") setDarkMode(true);
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("root-theme", next ? "dark" : "light");
      return next;
    });
  };

  useEffect(() => {
    const settingsRef = ref(db, "devices/frame01/settings");
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.deviceName) setDeviceName(data.deviceName);
        if (typeof data.minMoisture === "number") setMinMoisture(data.minMoisture);
        if (typeof data.maxMoisture === "number") setMaxMoisture(data.maxMoisture);
        if (typeof data.reservoirAlertLevel === "number") setReservoirAlertLevel(data.reservoirAlertLevel);
        if (typeof data.lowReservoirAlert === "boolean") setLowReservoirAlert(data.lowReservoirAlert);
        if (typeof data.pumpAlerts === "boolean") setPumpAlerts(data.pumpAlerts);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleMinChange = (value) => {
    const v = Number(value);
    if (v >= maxMoisture - 5) {
      setMinMoisture(maxMoisture - 5);
    } else {
      setMinMoisture(v);
    }
  };

  const handleMaxChange = (value) => {
    const v = Number(value);
    if (v <= minMoisture + 5) {
      setMaxMoisture(minMoisture + 5);
    } else {
      setMaxMoisture(v);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsRef = ref(db, "devices/frame01/settings");
      await set(settingsRef, {
        deviceName,
        minMoisture,
        maxMoisture,
        lowReservoirAlert,
        reservoirAlertLevel,
        pumpAlerts,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300">
        <div className="max-w-2xl mx-auto px-6 py-6">
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

          <div className="mb-5">
            <Logo size={32} />
          </div>

          <section className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 pl-7 mb-4 overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)]" />
            <h2 className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-muted)] mb-4 font-medium">
              <Droplets size={14} /> Watering range
            </h2>

            <div className="mb-5">
              <label className="block text-sm mb-1">Device name</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="mb-5 px-1">
              <div className="relative h-2 rounded-full bg-[var(--border-color)] mb-2">
                <div
                  className="absolute top-0 h-full rounded-full bg-[var(--accent)]/40"
                  style={{ left: `${minMoisture}%`, width: `${maxMoisture - minMoisture}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#E2A93E] border-2 border-[var(--bg-card)]"
                  style={{ left: `calc(${minMoisture}% - 6px)` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--accent)] border-2 border-[var(--bg-card)]"
                  style={{ left: `calc(${maxMoisture}% - 6px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <label className="text-sm">Minimum moisture</label>
                <span className="text-sm font-mono text-[#E2A93E]">{minMoisture}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                value={minMoisture}
                onChange={(e) => handleMinChange(e.target.value)}
                className="w-full accent-[#E2A93E]"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Pump turns ON when soil moisture drops to this level.
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm">Target moisture</label>
                <span className="text-sm font-mono text-[var(--accent)]">{maxMoisture}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                value={maxMoisture}
                onChange={(e) => handleMaxChange(e.target.value)}
                className="w-full accent-[var(--accent)]"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Pump turns OFF once soil moisture rises back up to this level.
              </p>
            </div>
          </section>

          <section className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 pl-7 mb-4 overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#3E6E8E]" />
            <h2 className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-muted)] mb-4 font-medium">
              <Bell size={14} /> Notifications
            </h2>

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm">Low reservoir alert</p>
                <p className="text-xs text-[var(--text-muted)]">Notify when water is running low</p>
              </div>
              <button
                onClick={() => setLowReservoirAlert(!lowReservoirAlert)}
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  lowReservoirAlert ? "bg-[#3E6E8E]" : "bg-[var(--border-color)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    lowReservoirAlert ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {lowReservoirAlert && (
              <div className="mb-4 pl-1">
                <div className="flex justify-between mb-1">
                  <label className="text-xs text-[var(--text-muted)]">Alert threshold</label>
                  <span className="text-xs font-mono text-[#3E6E8E]">{reservoirAlertLevel}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={reservoirAlertLevel}
                  onChange={(e) => setReservoirAlertLevel(Number(e.target.value))}
                  className="w-full accent-[#3E6E8E]"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Pump activity alerts</p>
                <p className="text-xs text-[var(--text-muted)]">Notify every time the pump runs</p>
              </div>
              <button
                onClick={() => setPumpAlerts(!pumpAlerts)}
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  pumpAlerts ? "bg-[#3E6E8E]" : "bg-[var(--border-color)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                    pumpAlerts ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[var(--accent)] text-[#04150B] rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saved ? (
              <>
                <Check size={16} /> Saved
              </>
            ) : saving ? (
              "Saving..."
            ) : (
              "Save changes"
            )}
          </button>
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