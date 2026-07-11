"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { Moon, Sun, Settings, Droplets, Activity, ChevronLeft, ChevronRight, Radio, Sprout } from "lucide-react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  const [moisture, setMoisture] = useState(0);
  const [displayMoisture, setDisplayMoisture] = useState(0);
  const [pumpStatus, setPumpStatus] = useState("off");
  const [lastEvent, setLastEvent] = useState("Waiting for device...");
  const reservoirLevel = 68;

  const trend = [22, 30, 18, 26, 15, 24, 19];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [logsForDate, setLogsForDate] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const changeDate = (offsetDays) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

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
    const moistureRef = ref(db, "devices/frame01/moisture");
    const pumpRef = ref(db, "devices/frame01/pumpStatus");
    const eventRef = ref(db, "devices/frame01/lastEvent");

    const unsubMoisture = onValue(moistureRef, (snapshot) => {
      if (snapshot.exists()) setMoisture(Number(snapshot.val()));
    });
    const unsubPump = onValue(pumpRef, (snapshot) => {
      if (snapshot.exists()) setPumpStatus(snapshot.val());
    });
    const unsubEvent = onValue(eventRef, (snapshot) => {
      if (snapshot.exists()) setLastEvent(snapshot.val());
    });

    return () => {
      unsubMoisture();
      unsubPump();
      unsubEvent();
    };
  }, []);

  useEffect(() => {
    setLogsLoading(true);
    const logsRef = ref(db, `logs/${selectedDate}`);
    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setLogsForDate([]);
        setLogsLoading(false);
        return;
      }
      const entries = [];
      snapshot.forEach((child) => {
        entries.push(child.val());
      });
      entries.sort((a, b) => (a.time > b.time ? 1 : -1));
      setLogsForDate(entries);
      setLogsLoading(false);
    });
    return () => unsubscribe();
  }, [selectedDate]);

  useEffect(() => {
    let raf;
    const step = () => {
      setDisplayMoisture((prev) => {
        if (Math.abs(prev - moisture) < 1) return moisture;
        const next = prev + (moisture - prev) * 0.15;
        raf = requestAnimationFrame(step);
        return next;
      });
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [moisture]);

  const gaugeRadius = 42;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const moistureOffset = gaugeCircumference * (1 - moisture / 100);
  const reservoirOffset = gaugeCircumference * (1 - reservoirLevel / 100);

  const graphW = 300;
  const graphH = 100;
  const maxVal = 50;
  const points = trend.map((v, i) => {
    const x = (i / (trend.length - 1)) * graphW;
    const y = graphH - (v / maxVal) * graphH;
    return { x, y };
  });
  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `0,${graphH} ${linePoints} ${graphW},${graphH}`;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex flex-wrap justify-between items-center gap-y-3 mb-6 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <Logo size={28} />
              <span className="text-sm text-[var(--text-muted)] hidden sm:inline">Frame 01</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              <span className="flex items-center gap-1.5 text-sm text-[var(--accent)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="hidden sm:inline">CONNECTED</span>
              </span>
              <button onClick={() => router.push("/assistant")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <Sprout size={17} />
              </button>
              <button onClick={toggleTheme} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" aria-label="Toggle dark mode">
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button onClick={() => router.push("/settings")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <Settings size={17} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 pl-6 overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)]" />
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-muted)] mb-5 font-medium">
                <Droplets size={14} /> Water system
              </p>

              <div className="flex justify-around">
                <div className="flex flex-col items-center">
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={gaugeRadius} fill="none" stroke="var(--border-color)" strokeWidth="7" />
                    <circle
                      cx="48"
                      cy="48"
                      r={gaugeRadius}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={gaugeCircumference}
                      strokeDashoffset={moistureOffset}
                      transform="rotate(-90 48 48)"
                      style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                    <text x="48" y="45" textAnchor="middle" fontSize="20" fontWeight="600" fontFamily="monospace" fill="var(--text-primary)">
                      {Math.round(displayMoisture)}
                    </text>
                    <text x="48" y="59" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                      %
                    </text>
                  </svg>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mt-1 font-medium">Soil moisture</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] mt-1 font-medium">
                    {moisture < 30 ? "Low" : "Normal"}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={gaugeRadius} fill="none" stroke="var(--border-color)" strokeWidth="7" />
                    <circle
                      cx="48"
                      cy="48"
                      r={gaugeRadius}
                      fill="none"
                      stroke="#3E6E8E"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={gaugeCircumference}
                      strokeDashoffset={reservoirOffset}
                      transform="rotate(-90 48 48)"
                      style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                    <text x="48" y="45" textAnchor="middle" fontSize="20" fontWeight="600" fontFamily="monospace" fill="var(--text-primary)">
                      {reservoirLevel}
                    </text>
                    <text x="48" y="59" textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                      %
                    </text>
                  </svg>
                  <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mt-1 font-medium">Reservoir</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#3E6E8E]/15 text-[#3E6E8E] mt-1 font-medium">
                    {reservoirLevel < 20 ? "Low" : "Normal"}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 pl-6 overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#3E6E8E]" />
              <div className="flex justify-between items-center mb-4">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">
                  <Activity size={14} /> OLED mirror
                </p>
                <span className="flex items-center gap-1 text-xs text-[#E2554A] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E2554A] animate-pulse" /> LIVE
                </span>
              </div>
              <div className="bg-[#050705] border border-[#1E2B22] rounded-lg p-4 font-mono text-sm text-[var(--accent)] min-h-[120px] flex flex-col justify-center">
                <p>MOIST: {moisture}%</p>
                <p>PUMP: {pumpStatus.toUpperCase()}</p>
                <p className="text-[var(--text-muted)] text-xs mt-2 break-words">{lastEvent}</p>
              </div>
            </div>

            <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 pl-6 overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#8B6FE8]" />
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-muted)] mb-4 font-medium">
                <Radio size={14} /> Device status
              </p>

              <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
                <p className="text-sm">Pump</p>
                <span
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${
                    pumpStatus === "on"
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "bg-[var(--border-color)] text-[var(--text-muted)]"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      pumpStatus === "on" ? "bg-[var(--accent)] animate-pulse" : "bg-[var(--text-muted)]"
                    }`}
                  />
                  {pumpStatus === "on" ? "Watering" : "Idle"}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
                <p className="text-sm">Watering mode</p>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
                  Automatic
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <p className="text-sm">Device</p>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
                  Online
                </span>
              </div>

              <p className="text-xs text-[var(--text-muted)] mt-3">
                Watering settings are managed on the Settings page — this panel reflects live status only.
              </p>
            </div>
          </div>

          <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 pl-6 mt-4 overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#3E6E8E]" />
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-3 font-medium">Moisture, 7 days</p>
            <svg viewBox={`0 0 ${graphW} ${graphH + 20}`} className="w-full h-28">
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3E6E8E" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3E6E8E" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((f, i) => (
                <line key={i} x1="0" y1={graphH * f} x2={graphW} y2={graphH * f} stroke="var(--border-color)" strokeWidth="1" />
              ))}
              <polygon points={areaPoints} fill="url(#areaFill)" />
              <polyline
                points={linePoints}
                fill="none"
                stroke="#3E6E8E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3E6E8E" />
              ))}
              {points.map((p, i) => (
                <text key={i} x={p.x} y={graphH + 16} fontSize="10" fill="var(--text-muted)" textAnchor="middle">
                  {days[i]}
                </text>
              ))}
            </svg>
            <p className="text-xs text-[var(--text-muted)] mt-2">
              This chart is still sample data — connecting it to real history is a separate step.
            </p>
          </div>

          <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 pl-6 mt-4 overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)]" />
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">Activity log</p>
              <div className="flex items-center gap-2">
                <button onClick={() => changeDate(-1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <ChevronLeft size={16} />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md px-2 py-1 outline-none"
                />
                <button onClick={() => changeDate(1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {logsLoading ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">Loading...</p>
            ) : logsForDate.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">No activity recorded for this date.</p>
            ) : (
              <div className="flex flex-col">
                {logsForDate.map((log, i) => (
                  <div key={i} className="flex justify-between items-center py-2 text-sm border-b border-[var(--border-color)] last:border-none">
                    <span className="font-mono text-[var(--text-muted)] w-14">{log.time}</span>
                    <span className="flex-1 px-3">{log.event}</span>
                    <span className="text-[var(--text-muted)]">{log.moisture}% moisture</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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