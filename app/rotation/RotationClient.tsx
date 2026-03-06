"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

const QUADRANTS = [
  { key: "leading", label: "Leading", color: "rgba(34, 197, 94, 0.08)" },
  { key: "improving", label: "Improving", color: "rgba(59, 130, 246, 0.08)" },
  { key: "weakening", label: "Weakening", color: "rgba(250, 204, 21, 0.08)" },
  { key: "lagging", label: "Lagging", color: "rgba(248, 113, 113, 0.08)" },
];

const HIGHLIGHT_SYMBOL = "XLY";
const TSLA_SYMBOL = "TSLA";

type RotationPoint = {
  rs: number;
  momentum: number;
  date: string;
};

type RotationSector = {
  symbol: string;
  name: string;
  color: string;
  points: RotationPoint[];
};

type RotationData = {
  sectors: RotationSector[];
  updated_at: string;
};

type HoverPoint = {
  x: number;
  y: number;
  symbol: string;
  name: string;
  rs: number;
  momentum: number;
  date: string;
  quadrant: string;
};

type ViewMode = "weekly" | "monthly";

type RotationClientProps = {
  data?: RotationData | null;
};

function hexToRgba(hex: string, alpha: number) {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getQuadrant(rs: number, momentum: number) {
  if (rs >= 100 && momentum >= 100) return "Leading";
  if (rs < 100 && momentum >= 100) return "Improving";
  if (rs >= 100 && momentum < 100) return "Weakening";
  return "Lagging";
}

function smoothPoints(points: RotationPoint[], windowSize = 4) {
  if (points.length === 0) return points;
  return points.map((point, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const slice = points.slice(start, index + 1);
    const avgRs = slice.reduce((sum, item) => sum + item.rs, 0) / slice.length;
    const avgMomentum = slice.reduce((sum, item) => sum + item.momentum, 0) / slice.length;
    return { ...point, rs: avgRs, momentum: avgMomentum };
  });
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RotationClient({ data }: RotationClientProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hitPointsRef = useRef<HoverPoint[]>([]);

  const [size, setSize] = useState({ width: 0, height: 420 });
  const [hovered, setHovered] = useState<HoverPoint | null>(null);
  const [view, setView] = useState<ViewMode>("weekly");

  const sectors = useMemo(() => {
    if (!data?.sectors) return [] as RotationSector[];
    if (view === "weekly") return data.sectors;
    return data.sectors.map((sector) => ({
      ...sector,
      points: smoothPoints(sector.points, 4),
    }));
  }, [data, view]);

  const latestPoints = useMemo(() => {
    return sectors
      .map((sector) => {
        const point = sector.points[sector.points.length - 1];
        if (!point) return null;
        return {
          symbol: sector.symbol,
          name: sector.name,
          color: sector.color,
          point,
          quadrant: getQuadrant(point.rs, point.momentum),
        };
      })
      .filter(Boolean) as Array<{
      symbol: string;
      name: string;
      color: string;
      point: RotationPoint;
      quadrant: string;
    }>;
  }, [sectors]);

  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.max(280, Math.floor(rect.width));
      const height = Math.max(320, Math.min(520, Math.floor(width * 0.7)));
      setSize({ width, height });
    };

    updateSize();

    const observer = new ResizeObserver(() => updateSize());
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, size.width, size.height);

    const padding = 48;
    const plotX = padding;
    const plotY = padding;
    const plotWidth = size.width - padding * 2;
    const plotHeight = size.height - padding * 2;

    const allPoints = sectors.flatMap((sector) => sector.points);
    const deltas = allPoints.map((point) => [Math.abs(point.rs - 100), Math.abs(point.momentum - 100)]).flat();
    const maxDelta = Math.max(8, ...deltas, 10);

    const domainMin = 100 - maxDelta;
    const domainMax = 100 + maxDelta;

    const scaleX = (value: number) => plotX + ((value - domainMin) / (domainMax - domainMin)) * plotWidth;
    const scaleY = (value: number) => plotY + (1 - (value - domainMin) / (domainMax - domainMin)) * plotHeight;

    const centerX = plotX + plotWidth / 2;
    const centerY = plotY + plotHeight / 2;

    // Quadrant backgrounds
    ctx.fillStyle = "rgba(34, 197, 94, 0.06)";
    ctx.fillRect(centerX, plotY, plotWidth / 2, plotHeight / 2);
    ctx.fillStyle = "rgba(59, 130, 246, 0.06)";
    ctx.fillRect(plotX, plotY, plotWidth / 2, plotHeight / 2);
    ctx.fillStyle = "rgba(250, 204, 21, 0.06)";
    ctx.fillRect(centerX, centerY, plotWidth / 2, plotHeight / 2);
    ctx.fillStyle = "rgba(248, 113, 113, 0.06)";
    ctx.fillRect(plotX, centerY, plotWidth / 2, plotHeight / 2);

    // Crosshair
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(centerX, plotY);
    ctx.lineTo(centerX, plotY + plotHeight);
    ctx.moveTo(plotX, centerY);
    ctx.lineTo(plotX + plotWidth, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Axis labels
    ctx.fillStyle = "rgba(148, 163, 184, 0.7)";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText("RS Ratio", centerX, plotY - 18);
    ctx.save();
    ctx.translate(plotX - 18, centerY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("RS Momentum", 0, 0);
    ctx.restore();

    // Quadrant labels
    ctx.fillStyle = "rgba(148, 163, 184, 0.45)";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
    ctx.textAlign = "left";
    ctx.fillText("Improving", plotX + 12, plotY + 18);
    ctx.textAlign = "right";
    ctx.fillText("Leading", plotX + plotWidth - 12, plotY + 18);
    ctx.textAlign = "left";
    ctx.fillText("Lagging", plotX + 12, plotY + plotHeight - 10);
    ctx.textAlign = "right";
    ctx.fillText("Weakening", plotX + plotWidth - 12, plotY + plotHeight - 10);

    // Border
    ctx.strokeStyle = "rgba(39, 39, 42, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(plotX, plotY, plotWidth, plotHeight);

    const hitPoints: HoverPoint[] = [];

    sectors.forEach((sector) => {
      if (sector.points.length === 0) return;

      const points = sector.points;
      const symbol = sector.symbol;
      const baseColor = sector.color;

      // Lines
      for (let i = 0; i < points.length - 1; i += 1) {
        const start = points[i];
        const end = points[i + 1];
        const alpha = 0.2 + 0.8 * ((i + 1) / (points.length - 1));
        ctx.strokeStyle = hexToRgba(baseColor, alpha);
        ctx.lineWidth = symbol === TSLA_SYMBOL ? 2 : symbol === HIGHLIGHT_SYMBOL ? 2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(scaleX(start.rs), scaleY(start.momentum));
        ctx.lineTo(scaleX(end.rs), scaleY(end.momentum));
        ctx.stroke();
      }

      // Dots
      points.forEach((point, index) => {
        const isLatest = index === points.length - 1;
        const progress = points.length === 1 ? 1 : index / (points.length - 1);
        const alpha = 0.25 + 0.75 * progress;
        const radius = isLatest ? (symbol === TSLA_SYMBOL ? 7 : 6) : 2 + progress * 3;
        const x = scaleX(point.rs);
        const y = scaleY(point.momentum);

        ctx.save();
        ctx.fillStyle = hexToRgba(baseColor, alpha);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        if (symbol === HIGHLIGHT_SYMBOL && isLatest) {
          ctx.strokeStyle = hexToRgba(baseColor, 0.9);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (symbol === TSLA_SYMBOL && isLatest) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();

        if (isLatest) {
          ctx.fillStyle = symbol === TSLA_SYMBOL ? "rgba(255,255,255,0.9)" : hexToRgba(baseColor, 0.9);
          ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
          ctx.textAlign = "left";
          ctx.fillText(symbol, x + radius + 6, y - 6);
        }

        hitPoints.push({
          x,
          y,
          symbol,
          name: sector.name,
          rs: point.rs,
          momentum: point.momentum,
          date: point.date,
          quadrant: getQuadrant(point.rs, point.momentum),
        });
      });
    });

    hitPointsRef.current = hitPoints;
  }, [sectors, size]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let nearest: HoverPoint | null = null;
    let minDistance = 14;

    hitPointsRef.current.forEach((point) => {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    });

    setHovered(nearest);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-200 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="text-lg font-semibold">Sector Rotation</div>
          <p className="text-sm text-zinc-400">Unable to load rotation data right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Sector Rotation</p>
            <h1 className="text-3xl font-semibold tracking-tight">Relative Rotation Graph</h1>
            <p className="text-sm text-zinc-400">11 sectors + TSLA vs VTI benchmark</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-zinc-800/80 bg-zinc-900/40 p-1 text-xs">
            {(["weekly", "monthly"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded-full px-4 py-2 font-medium transition ${
                  view === mode
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {mode === "weekly" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800/80 bg-black/40 p-4 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          <div
            ref={containerRef}
            className="relative w-full"
            style={{ height: `${size.height}px` }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHovered(null)}
          >
            <canvas ref={canvasRef} className="block h-full w-full" />

            {hovered && (
              <div
                className="pointer-events-none absolute z-10 w-48 rounded-lg border border-zinc-700/80 bg-zinc-950/95 px-3 py-2 text-xs text-zinc-200 shadow-lg"
                style={{
                  left: Math.min(hovered.x + 16, size.width - 200),
                  top: Math.max(hovered.y - 12, 12),
                }}
              >
                <div className="text-sm font-semibold text-white">
                  {hovered.symbol} - {hovered.name}
                </div>
                <div className="mt-1 flex flex-col gap-1 text-[11px] text-zinc-400">
                  <span>RS Ratio: {hovered.rs.toFixed(2)}</span>
                  <span>Momentum: {hovered.momentum.toFixed(2)}</span>
                  <span>Quadrant: {hovered.quadrant}</span>
                  <span>Date: {formatDate(hovered.date)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {latestPoints.map((item) => (
            <div
              key={item.symbol}
              className={`flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 text-xs ${
                item.symbol === HIGHLIGHT_SYMBOL ? "shadow-[0_0_18px_rgba(244,114,182,0.2)]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color, boxShadow: `0 0 12px ${item.color}30` }}
                />
                <div>
                  <div className="text-sm font-semibold text-white">{item.symbol}</div>
                  <div className="text-[11px] text-zinc-500">{item.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">{item.quadrant}</div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  RS {item.point.rs.toFixed(2)} | MOM {item.point.momentum.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex flex-wrap gap-3">
            {QUADRANTS.map((quad) => (
              <div key={quad.key} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: quad.color }} />
                <span>{quad.label}</span>
              </div>
            ))}
          </div>
          <div>Updated {formatDate(data.updated_at)}</div>
        </div>
      </div>
    </div>
  );
}
