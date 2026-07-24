"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "@/firebase";
import { ref, onValue, get } from "firebase/database";
import { Moon, Sun, Settings, Droplets, Activity, ChevronLeft, ChevronRight, ChevronDown, Radio, Sprout, AlertTriangle, Download, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  const [moisture, setMoisture] = useState(0);
  const [displayMoisture, setDisplayMoisture] = useState(0);
  const [pumpStatus, setPumpStatus] = useState("off");
  const [lastEvent, setLastEvent] = useState("Waiting for device...");
  const [reservoirLow, setReservoirLow] = useState(false);
  const prevReservoirLow = useRef(false);

  const [lastSeen, setLastSeen] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const [notifPermission, setNotifPermission] = useState("default");

  const [trendPoints, setTrendPoints] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [logsForDate, setLogsForDate] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logExpanded, setLogExpanded] = useState(false);
  const logScrollRef = useRef(null);

  const COLLAPSED_HEIGHT = 120;
  const EXPANDED_MAX_HEIGHT = 360;

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
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const enableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  };

  // Live device data
  useEffect(() => {
    const moistureRef = ref(db, "devices/frame01/moisture");
    const pumpRef = ref(db, "devices/frame01/pumpStatus");
    const eventRef = ref(db, "devices/frame01/lastEvent");
    const reservoirRef = ref(db, "devices/frame01/reservoirLow");
    const lastSeenRef = ref(db, "devices/frame01/lastSeen");

    const unsubMoisture = onValue(moistureRef, (snapshot) => {
      if (snapshot.exists()) setMoisture(Number(snapshot.val()));
    });
    const unsubPump = onValue(pumpRef, (snapshot) => {
      if (snapshot.exists()) setPumpStatus(snapshot.val());
    });
    const unsubEvent = onValue(eventRef, (snapshot) => {
      if (snapshot.exists()) setLastEvent(snapshot.val());
    });
    const unsubReservoir = onValue(reservoirRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const low = Boolean(snapshot.val());
      setReservoirLow(low);

      if (low && !prevReservoirLow.current && notifPermission === "granted") {
        new Notification("Roots — Reservoir low", {
          body: "Please refill the water reservoir. Watering is paused until it's topped up.",
        });
      }
      prevReservoirLow.current = low;
    });
    const unsubLastSeen = onValue(lastSeenRef, (snapshot) => {
      if (snapshot.exists()) setLastSeen(Number(snapshot.val()));
    });

    return () => {
      unsubMoisture();
      unsubPump();
      unsubEvent();
      unsubReservoir();
      unsubLastSeen();
    };
  }, [notifPermission]);

  // Re-check connection freshness every few seconds, since Firebase only
  // fires when the value changes — a stalled device won't push a new value
  useEffect(() => {
    const checkOnline = () => {
      if (!lastSeen) {
        setIsOnline(false);
        return;
      }
      const nowSec = Math.floor(Date.now() / 1000);
      setIsOnline(nowSec - lastSeen < 90);
    };
    checkOnline();
    const interval = setInterval(checkOnline, 5000);
    return () => clearInterval(interval);
  }, [lastSeen]);

  // Activity log for the selected date
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

  // Real 7-day moisture trend, built from stored history
  useEffect(() => {
    const fetchTrend = async () => {
      setTrendLoading(true);
      const results = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", { weekday: "short" });

        try {
          const snap = await get(ref(db, `history/${dateStr}`));
          if (snap.exists()) {
            const vals = [];
            snap.forEach((child) => {
              const v = child.val()?.moisture;
              if (typeof v === "number") vals.push(v);
            });
            const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
            results.push({ label, value: avg });
          } else {
            results.push({ label, value: null });
          }
        } catch (err) {
          results.push({ label, value: null });
        }
      }
      setTrendPoints(results);
      setTrendLoading(false);
    };
    fetchTrend();
  }, []);

  useEffect(() => {
    if (!logScrollRef.current) return;
    if (!logExpanded) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logsForDate, logExpanded]);

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

  const downloadLogCSV = () => {
    if (logsForDate.length === 0) return;
    const header = "Time,Event,Moisture (%)";
    const rows = logsForDate.map(
      (log) => `${log.time},"${log.event.replace(/"/g, '""')}",${log.moisture}`
    );
    const csvContent = [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `roots-log-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const gaugeRadius = 42;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const moistureOffset = gaugeCircumference * (1 - moisture / 100);

  // Chart layout — left gutter reserved for the y-axis title + tick labels
  const graphW = 300;
  const graphH = 100;
  const maxVal = 100;
  const axisGutter = 34;
  const chartTotalW = graphW + axisGutter;

  const validCount = trendPoints.filter((p) => p.value !== null).length;
  const points = trendPoints.map((p, i) => {
    const x = axisGutter + (i / (trendPoints.length - 1 || 1)) * graphW;
    const y = p.value === null ? null : graphH - (p.value / maxVal) * graphH;
    return { x, y, label: p.label, value: p.value };
  });
  const drawablePoints = points.filter((p) => p.y !== null);
  const linePoints = drawablePoints.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints =
    drawablePoints.length > 0
      ? `${drawablePoints[0].x},${graphH} ${linePoints} ${drawablePoints[drawablePoints.length - 1].x},${graphH}`
      : "";

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 py-8 lg:px-10 lg:py-10">
          <div className="flex flex-wrap justify-between items-center gap-y-3 mb-8 pb-5 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <Logo size={30} />
              <span className="text-sm text-[var(--text-muted)] hidden sm:inline">Frame 01</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className={`flex items-center gap-1.5 text-sm ${isOnline ? "text-[var(--accent)]" : "text-[#E2554A]"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-[var(--accent)] animate-pulse" : "bg-[#E2554A]"}`} />
                <span className="hidden sm:inline">{isOnline ? "CONNECTED" : "OFFLINE"}</span>
              </span>
              {notifPermission === "default" && (
                <button
                  onClick={enableNotifications}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[var(--border-color)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  <Bell size={13} /> Enable alerts
                </button>
              )}
              <button onClick={toggleTheme} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" aria-label="Toggle dark mode">
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button onClick={() => router.push("/settings")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                <Settings size={17} />
              </button>
            </div>
          </div>

          {reservoirLow && (
            <div className="flex items-center gap-3 bg-[#E2A93E]/10 border border-[#E2A93E]/40 text-[#E2A93E] rounded-xl px-5 py-3.5 mb-6">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="text-sm">
                <span className="font-medium">Reservoir low</span> — please refill. Watering is paused until water is added.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-7 pl-8 overflow-hidden flex flex-col items-center justify-center">
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)]" />
              <p className="w-full flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-muted)] mb-6 font-medium">
                <Droplets size={14} /> Water system
              </p>

              <svg width="130" height="130" viewBox="0 0 96 96">
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
                <text x="48" y="45" textAnchor="middle" fontSize="22" fontWeight="600" fontFamily="monospace" fill="var(--text-primary)">
                  {Math.round(displayMoisture)}
                </text>
                <text x="48" y="60" textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                  %
                </text>
              </svg>
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mt-3 font-medium">Soil moisture</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] mt-1.5 font-medium">
                {moisture < 30 ? "Low" : "Normal"}
              </span>
            </div>

            <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-7 pl-8 overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#3E6E8E]" />
              <div className="flex justify-between items-center mb-5">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">
                  <Activity size={14} /> OLED mirror
                </p>
                <span className="flex items-center gap-1 text-xs text-[#E2554A] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E2554A] animate-pulse" /> LIVE
                </span>
              </div>
              <div className="bg-[#050705] border border-[#1E2B22] rounded-lg p-5 font-mono text-sm text-[var(--accent)] min-h-[130px] flex flex-col justify-center">
                <p>MOIST: {moisture}%</p>
                <p>PUMP: {pumpStatus.toUpperCase()}</p>
                <p className="text-[var(--text-muted)] text-xs mt-2 break-words">{lastEvent}</p>
              </div>
            </div>

            <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-7 pl-8 overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#8B6FE8]" />
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-muted)] mb-5 font-medium">
                <Radio size={14} /> Device status
              </p>

              <div className="flex items-center justify-between py-3.5 border-b border-[var(--border-color)]">
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

              <div className="flex items-center justify-between py-3.5 border-b border-[var(--border-color)]">
                <p className="text-sm">Watering mode</p>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
                  Automatic
                </span>
              </div>

              <div className="flex items-center justify-between py-3.5">
                <p className="text-sm">Reservoir</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    reservoirLow
                      ? "bg-[#E2A93E]/15 text-[#E2A93E]"
                      : "bg-[var(--accent)]/15 text-[var(--accent)]"
                  }`}
                >
                  {reservoirLow ? "Low — refill" : "OK"}
                </span>
              </div>

              <p className="text-xs text-[var(--text-muted)] mt-4">
                Watering settings are managed on the Settings page — this panel reflects live status only.
              </p>
            </div>
          </div>

          <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-7 pl-8 mt-6 overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#3E6E8E]" />
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-4 font-medium">Moisture, 7 days</p>

            {trendLoading ? (
              <p className="text-sm text-[var(--text-muted)] py-6 text-center">Loading history...</p>
            ) : validCount === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-6 text-center">
                No history yet — this fills in as the device runs and collects real readings.
              </p>
            ) : (
              <>
                <svg viewBox={`0 0 ${chartTotalW} ${graphH + 20}`} className="w-full h-32">
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3E6E8E" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3E6E8E" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Y-axis title, rotated to run vertically along the left edge */}
                  <text
                    x={12}
                    y={graphH / 2}
                    fontSize="10"
                    fill="var(--text-muted)"
                    textAnchor="middle"
                    transform={`rotate(-90 12 ${graphH / 2})`}
                  >
                    Moisture (%)
                  </text>

                  {/* Gridlines + y-axis tick labels */}
                  {yTicks.map((tick, i) => {
                    const y = graphH - (tick / maxVal) * graphH;
                    return (
                      <g key={i}>
                        <line
                          x1={axisGutter}
                          y1={y}
                          x2={chartTotalW}
                          y2={y}
                          stroke="var(--border-color)"
                          strokeWidth="1"
                        />
                        <text
                          x={axisGutter - 6}
                          y={y + 3}
                          fontSize="9"
                          fill="var(--text-muted)"
                          textAnchor="end"
                        >
                          {tick}
                        </text>
                      </g>
                    );
                  })}

                  {areaPoints && <polygon points={areaPoints} fill="url(#areaFill)" />}
                  {linePoints && (
                    <polyline
                      points={linePoints}
                      fill="none"
                      stroke="#3E6E8E"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {points.map((p, i) =>
                    p.y !== null ? <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3E6E8E" /> : null
                  )}
                  {points.map((p, i) => (
                    <text key={i} x={p.x} y={graphH + 16} fontSize="10" fill="var(--text-muted)" textAnchor="middle">
                      {p.label}
                    </text>
                  ))}
                </svg>
                {validCount < 7 && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Showing {validCount} of 7 days — the rest will fill in as more history is collected.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-7 pl-8 mt-6 overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)]" />

            <div
              onClick={() => setLogExpanded((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setLogExpanded((prev) => !prev);
                }
              }}
              className="w-full flex justify-between items-center mb-4 cursor-pointer select-none"
              aria-expanded={logExpanded}
            >
              <span className="text-xs uppercase tracking-wide text-[var(--text-muted)] font-medium">Activity log</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--text-muted)]">{logExpanded ? "Collapse" : "Expand"}</span>
                <span
                  role="presentation"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2"
                >
                  <button
                    onClick={downloadLogCSV}
                    disabled={logsForDate.length === 0}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Download log as CSV"
                    title="Download CSV"
                  >
                    <Download size={16} />
                  </button>
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
                </span>
                <ChevronDown
                  size={16}
                  className="text-[var(--text-muted)] transition-transform duration-200"
                  style={{ transform: logExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </div>
            </div>

            {logsLoading ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">Loading...</p>
            ) : logsForDate.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">No activity recorded for this date.</p>
            ) : (
              <div
                ref={logScrollRef}
                className="flex flex-col overflow-y-auto transition-[max-height] duration-300 ease-in-out"
                style={{
                  maxHeight: logExpanded ? EXPANDED_MAX_HEIGHT : COLLAPSED_HEIGHT,
                }}
              >
                {logsForDate.map((log, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 text-sm border-b border-[var(--border-color)] last:border-none">
                    <span className="font-mono text-[var(--text-muted)] w-14">{log.time}</span>
                    <span className="flex-1 px-3">{log.event}</span>
                    <span className="text-[var(--text-muted)]">{log.moisture}% moisture</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => router.push("/assistant")}
          aria-label="Open plant assistant"
          title="Plant assistant"
          className="fixed z-[9999] flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent)] text-[#04150B] shadow-lg hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-150"
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
            right: "calc(env(safe-area-inset-right, 0px) + 1.5rem)",
          }}
        >
          <Sprout size={24} />
        </button>

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