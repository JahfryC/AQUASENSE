// Reusable UI primitives — Liquid Glass edition. Exported to window for cross-script access.
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------- i18n ----------
// window.__lang is set by App before render; T(es, en) picks the active language.
window.__lang = window.__lang || localStorage.getItem("aqua:lang") || "es";
function T(es, en) {
  return window.__lang === "en" ? en : es;
}

// ---------- status colors (theme-aware via CSS variables where possible) ----------
const STATUS_COLOR = {
  ok:     { fg: "#0E9F6E", border: "rgba(16,185,129,0.30)", bg: "rgba(16,185,129,0.13)", text: "text-[#0E9F6E]" },
  warn:   { fg: "#C77F00", border: "rgba(245,158,11,0.32)", bg: "rgba(245,158,11,0.14)", text: "text-[#C77F00]" },
  danger: { fg: "#DC4458", border: "rgba(225,29,72,0.30)",  bg: "rgba(225,29,72,0.11)",  text: "text-[#DC4458]" },
  info:   { fg: "#3B82F6", border: "rgba(59,130,246,0.30)", bg: "rgba(59,130,246,0.12)", text: "text-[#3B82F6]" },
  teal:   { fg: "#0E9488", border: "rgba(13,148,136,0.30)", bg: "rgba(13,148,136,0.12)", text: "text-[#0E9488]" },
  indigo: { fg: "#6366F1", border: "rgba(99,102,241,0.30)", bg: "rgba(99,102,241,0.12)", text: "text-[#6366F1]" },
};

function L({ name, size = 16, className = "", strokeWidth = 1.6, style, ...rest }) {
  const lib = window.lucide;
  if (!lib) {
    return <span className={className} style={{ width: size, height: size, display: "inline-block", ...style }} />;
  }
  const icon = lib[name];
  if (!icon || !Array.isArray(icon)) {
    return <span className={className} style={{ width: size, height: size, display: "inline-block", ...style }} />;
  }
  const children = typeof icon[0] === "string" ? (icon[2] || []) : (icon[1] || []);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      {...rest}
    >
      {children.map((child, i) => {
        if (!Array.isArray(child)) return null;
        const [tag, attrs] = child;
        return React.createElement(tag, { key: i, ...(attrs || {}) });
      })}
    </svg>
  );
}

// ---------- Card (glass panel) ----------
function Card({ as: As = "div", className = "", children, hover = false, ...rest }) {
  return (
    <As
      className={`glass rounded-3xl ${hover ? "transition-all duration-200 hover:shadow-xl" : ""} ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}

// ---------- Button ----------
function Button({ variant = "secondary", size = "md", icon, iconRight, loading, disabled, className = "", children, ...rest }) {
  const sizes = {
    sm: "px-3 py-1.5 text-[11.5px] gap-1.5 rounded-full",
    md: "px-4 py-2 text-[12.5px] gap-2 rounded-full",
    lg: "px-5 py-2.5 text-[13.5px] gap-2 rounded-full",
  };
  const variants = {
    primary:   "text-white border border-transparent shadow-md",
    secondary: "glass-strong text-[var(--ink)] border border-[var(--glass-border)] hover:brightness-105",
    ghost:     "bg-transparent border border-transparent text-[var(--ink-2)] hover:bg-[var(--hover)] hover:text-[var(--ink)]",
    danger:    "bg-[rgba(225,29,72,0.11)] border border-[rgba(225,29,72,0.30)] text-[#DC4458] hover:bg-[rgba(225,29,72,0.18)]",
    icon:      "bg-transparent border border-transparent text-[var(--ink-2)] hover:bg-[var(--hover)] hover:text-[var(--ink)] !p-2 !rounded-full",
  };
  const primaryStyle = variant === "primary"
    ? { background: "linear-gradient(160deg, var(--accent) 0%, var(--accent-strong) 100%)", boxShadow: "0 6px 18px rgba(13,148,136,0.35), inset 0 1px 0 rgba(255,255,255,0.35)" }
    : undefined;
  const iconSize = size === "sm" ? 13 : size === "lg" ? 16 : 14;
  return (
    <button
      disabled={disabled || loading}
      style={primaryStyle}
      className={`inline-flex items-center justify-center font-medium tracking-normal transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-border)] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variant === "icon" ? "" : sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading ? <L name="Loader2" size={iconSize} className="animate-spin" /> : icon && <L name={icon} size={iconSize} />}
      {children}
      {iconRight && <L name={iconRight} size={iconSize} />}
    </button>
  );
}

// ---------- StatusPill ----------
function StatusPill({ status = "ok", label, size = "sm", className = "" }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.ok;
  const labels = {
    ok: T("Óptimo", "Optimal"), warn: T("Atención", "Watch"),
    danger: T("Crítico", "Critical"), info: "Info",
  };
  const padding = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${padding} text-[10px] uppercase tracking-[0.08em] font-semibold ${className}`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.fg, backdropFilter: "blur(8px)" }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: s.fg }} />
      {label || labels[status]}
    </span>
  );
}

// ---------- PulsingDot ----------
function PulsingDot({ color = "#0E9F6E", size = 8 }) {
  return (
    <span className="relative inline-flex" style={{ height: size, width: size }}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
      <span className="relative inline-flex rounded-full" style={{ height: size, width: size, background: color }} />
    </span>
  );
}

// ---------- Sparkline ----------
function Sparkline({ data, color = "#0E9F6E", width = 120, height = 40, filled = true, strokeWidth = 1.5 }) {
  const { polyline, fillPath, lastPoint, gradId } = useMemo(() => {
    if (!data || data.length === 0) return { polyline: "", fillPath: "", lastPoint: { x: 0, y: 0 }, gradId: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 4;
    const points = data.map((v, i) => ({
      x: data.length === 1 ? width / 2 : (i / (data.length - 1)) * width,
      y: height - pad - ((v - min) / range) * (height - pad * 2),
    }));
    const polyline = points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    const fillPath = [
      `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`,
      ...points.slice(1).map(p => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`),
      `L${width},${height}`,
      `L0,${height}`,
      "Z",
    ].join(" ");
    return { polyline, fillPath, lastPoint: points[points.length - 1], gradId: `spark-${color.replace(/[^a-z0-9]/gi, "")}-${Math.round(Math.random() * 1e6)}` };
  }, [data, color, width, height]);

  if (!data || data.length === 0) return null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {filled && <path d={fillPath} fill={`url(#${gradId})`} />}
      <polyline points={polyline} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill={color} />
      <circle cx={lastPoint.x} cy={lastPoint.y} r="6" fill={color} opacity="0.2" />
    </svg>
  );
}

// ---------- RangeBar ----------
function RangeBar({ value, min, max, status = "ok", domainPad = 0.4 }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.ok;
  const span = max - min || 1;
  const domainMin = min - span * domainPad;
  const domainMax = max + span * domainPad;
  const total = domainMax - domainMin;
  const pct = (v) => Math.max(0, Math.min(100, ((v - domainMin) / total) * 100));
  const idealStart = pct(min);
  const idealEnd = pct(max);
  const valuePct = pct(value);
  return (
    <div className="relative h-1 w-full rounded-full bg-[var(--well)] overflow-visible">
      <div
        className="absolute top-0 h-1 rounded-full"
        style={{ left: `${idealStart}%`, width: `${idealEnd - idealStart}%`, background: "rgba(16,185,129,0.30)" }}
      />
      <div
        className="absolute -top-1 h-3 w-[2px] rounded-full"
        style={{ left: `calc(${valuePct}% - 1px)`, background: s.fg, boxShadow: `0 0 8px ${s.fg}` }}
      />
    </div>
  );
}

// ---------- RingGauge (circular parameter dial, like the reference) ----------
function RingGauge({ value, min, max, idealMin, idealMax, status = "ok", size = 84, label, display, sub }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.ok;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const span = (max - min) || 1;
  const frac = Math.max(0.04, Math.min(1, (value - min) / span));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--well)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={s.fg} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`${(frac * c).toFixed(1)} ${c.toFixed(1)}`}
            style={{ filter: `drop-shadow(0 0 6px ${s.fg}55)`, transition: "stroke-dasharray 0.6s cubic-bezier(.2,.7,.3,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[15px] font-semibold text-[var(--ink)] tabular-nums leading-none" style={{ fontFamily: "var(--font-mono, 'DM Mono')" }}>{display}</span>
          <span className="text-[8.5px] uppercase tracking-[0.1em] text-[var(--ink-3)] mt-0.5">{label}</span>
        </div>
      </div>
      {sub && <span className="text-[9.5px] font-medium" style={{ color: s.fg }}>{sub}</span>}
    </div>
  );
}

// ---------- Section header ----------
function SectionHeader({ title, kicker, action }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        {kicker && (
          <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--ink-3)] font-semibold mb-1">{kicker}</div>
        )}
        <h2 className="text-[15px] font-semibold text-[var(--ink)] tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ---------- Input ----------
function Input({ icon, className = "", ...rest }) {
  return (
    <div className="relative flex-1">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]">
          <L name={icon} size={14} />
        </span>
      )}
      <input
        className={`w-full bg-[var(--well)] border border-[var(--hairline)] rounded-2xl px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-border)] focus:border-[var(--accent-border)] transition-colors ${icon ? "pl-9" : ""} ${className}`}
        {...rest}
      />
    </div>
  );
}

// ---------- AnimatedNumber ----------
function AnimatedNumber({ value, decimals = 0, duration = 600 }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  const startTime = useRef(0);
  const rafId = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    if (from === to) return;
    cancelAnimationFrame(rafId.current);
    startTime.current = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startTime.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafId.current = requestAnimationFrame(tick);
      else prev.current = to;
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [value, duration]);

  return <span className="tabular-nums">{Number(display).toFixed(decimals)}</span>;
}

// ---------- Atmosphere background (floating aqua blobs behind the glass) ----------
function Atmosphere() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <div className="absolute -top-48 -left-40 w-[640px] h-[640px] rounded-full" style={{ background: "var(--blob-a)", filter: "blur(110px)" }} />
      <div className="absolute top-1/4 -right-48 w-[560px] h-[560px] rounded-full" style={{ background: "var(--blob-b)", filter: "blur(120px)" }} />
      <div className="absolute -bottom-40 left-1/4 w-[520px] h-[520px] rounded-full" style={{ background: "var(--blob-c)", filter: "blur(110px)" }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, var(--noise-ink) 1px, transparent 0)",
        backgroundSize: "44px 44px",
      }} />
    </div>
  );
}

// ---------- date helpers (locale-aware, anchored to the mock snapshot date) ----------
const __MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const __MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function fmtLongDate(dstr) {
  const d = new Date(dstr + "T00:00:00");
  return window.__lang === "en"
    ? `${__MONTHS_EN[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`
    : `${d.getDate()} ${__MONTHS_ES[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtShortDate(dstr) {
  const d = new Date(dstr + "T00:00:00");
  return window.__lang === "en"
    ? `${__MONTHS_EN[d.getMonth()].slice(0, 3)} ${d.getDate()}`
    : `${d.getDate()} ${__MONTHS_ES[d.getMonth()].slice(0, 3)}`;
}

// "Hoy" / "Mañana" / "21 may" relative to the mock snapshot
function fmtDue(dstr) {
  if (dstr === "today") return T("Hoy", "Today");
  const mock = new Date((window.AQUA?.MOCK_TODAY || "2026-05-20") + "T00:00:00");
  const diff = Math.round((new Date(dstr + "T00:00:00") - mock) / 86400000);
  if (diff === 0) return T("Hoy", "Today");
  if (diff === 1) return T("Mañana", "Tomorrow");
  return fmtShortDate(dstr);
}

// ---------- Escape-to-close for modals/popovers ----------
function useEscape(handler) {
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") handler(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [handler]);
}

// ---------- Toasts ----------
let __toastSeq = 0;
function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    window.toast = (msg, opts = {}) => {
      const t = { id: ++__toastSeq, msg, icon: opts.icon || "Check", tone: opts.tone || "ok" };
      setItems((p) => [...p.slice(-2), t]);
      setTimeout(() => setItems((p) => p.filter((x) => x.id !== t.id)), opts.duration || 3200);
    };
    return () => { delete window.toast; };
  }, []);
  const toneColor = { ok: "#0E9F6E", info: "var(--accent)", warn: "#C77F00", danger: "#DC4458" };
  return (
    <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 pointer-events-none px-4" role="status" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className="glass-strong rounded-full pl-3.5 pr-4 py-2 flex items-center gap-2 text-[12.5px] font-medium text-[var(--ink)]"
          style={{ animation: "fadeUp 0.3s cubic-bezier(.2,.7,.3,1)", boxShadow: "var(--glass-shadow)" }}
        >
          <L name={t.icon} size={14} style={{ color: toneColor[t.tone] || toneColor.ok }} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// Honest placeholder for flows that need a real backend
function demoAction() {
  window.toast?.(
    T("Acción de demo — disponible en la versión final", "Demo action — available in the final version"),
    { icon: "Info", tone: "info" }
  );
}

// ---------- PhotoSlot (fotos del usuario: persisten en local + nube) ----------
function PhotoSlot({ id, placeholder, radius = 18, className = "", style }) {
  const [, setRev] = useState(0);
  useEffect(() => {
    const fn = () => setRev((v) => v + 1);
    window.addEventListener("aqua:data", fn);
    return () => window.removeEventListener("aqua:data", fn);
  }, []);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const src = window.AquaStore?.getPhoto(id);

  const accept = (file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      window.AquaStore?.setPhoto(id, c.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(url);
      window.toast?.(T("Foto guardada", "Photo saved"), { icon: "ImageUp" });
    };
    img.src = url;
  };

  return (
    <div
      className={`relative overflow-hidden group/photo ${className}`}
      style={{ borderRadius: radius, ...style }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDrag(false); accept(e.dataTransfer.files?.[0]); }}
    >
      {src ? (
        <>
          <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
          {/* Hover overlay: change or remove */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover/photo:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              className="flex items-center gap-1 text-[10px] text-white font-medium px-2 py-1 rounded-full transition-colors hover:bg-white/20"
              aria-label={T("Cambiar foto", "Change photo")}
            >
              <L name="Camera" size={11} />
              {T("Cambiar", "Change")}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); window.AquaStore?.setPhoto(id, null); }}
              className="flex items-center gap-1 text-[10px] text-white/70 px-2 py-0.5 hover:text-white transition-colors"
              aria-label={T("Quitar foto", "Remove photo")}
            >
              <L name="X" size={10} />
              {T("Quitar", "Remove")}
            </button>
          </div>
        </>
      ) : (
        /* No photo: transparent so avatar shows through; upload hint appears on hover */
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          aria-label={placeholder || T("Subir foto", "Upload photo")}
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-0.5 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity cursor-pointer"
          style={{ background: drag ? "rgba(13,148,136,0.55)" : "rgba(0,0,0,0.42)", backdropFilter: "blur(3px)", borderRadius: radius }}
        >
          <L name="Camera" size={14} />
          <span className="text-[9px] leading-tight text-center px-1">{placeholder || T("Foto", "Photo")}</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ""; }} />
    </div>
  );
}

Object.assign(window, {
  STATUS_COLOR, T, L, Card, Button, StatusPill, PulsingDot,
  Sparkline, RangeBar, RingGauge, SectionHeader, Input, AnimatedNumber, Atmosphere,
  ToastHost, demoAction, useEscape, fmtLongDate, fmtShortDate, fmtDue, PhotoSlot
});
