"use client";

import React, { memo, useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap, Geographies, Geography, Line, Marker, ZoomableGroup,
} from "react-simple-maps";
import axios from "axios";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

interface RouteWithCoords {
  id?: string; from?: string; to?: string;
  origin?: string; destination?: string;
  risk?: string;
  coords?: [[number, number], [number, number]];
  lat1?: number; lon1?: number; lat2?: number; lon2?: number;
}

interface MapComponentProps { routes?: RouteWithCoords[]; }

const STATIC_ROUTES = [
  { id: "r1",  fromC: [121.47, 31.23] as [number,number], toC: [72.88,  19.08] as [number,number], from: "CN", to: "IN",  risk: "critical" },
  { id: "r2",  fromC: [55.27,  25.20] as [number,number], toC: [80.27,  13.08] as [number,number], from: "AE", to: "IN",  risk: "high"     },
  { id: "r3",  fromC: [103.82,  1.35] as [number,number], toC: [88.37,  22.57] as [number,number], from: "SG", to: "IN",  risk: "medium"   },
  { id: "r4",  fromC: [114.17, 22.32] as [number,number], toC: [-95.71, 37.09] as [number,number], from: "CN", to: "US",  risk: "critical" },
  { id: "r5",  fromC: [138.25, 36.20] as [number,number], toC: [133.78,-25.27] as [number,number], from: "JP", to: "AU",  risk: "medium"   },
  { id: "r6",  fromC: [127.77, 35.91] as [number,number], toC: [-95.71, 37.09] as [number,number], from: "KR", to: "US",  risk: "high"     },
  { id: "r7",  fromC: [108.28, 14.06] as [number,number], toC: [2.21,   46.23] as [number,number], from: "VN", to: "FR",  risk: "medium"   },
  { id: "r8",  fromC: [10.45,  51.17] as [number,number], toC: [-95.71, 37.09] as [number,number], from: "DE", to: "US",  risk: "critical" },
];

const RISK_COLOR: Record<string, string> = {
  critical: "#ff2d55", high: "#f43f5e", medium: "#f59e0b", low: "#10b981",
};

const RISK_LEVELS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
type RiskFilter = typeof RISK_LEVELS[number];

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", DE: "Germany", IN: "India", AU: "Australia",
  FR: "France", ZA: "South Africa", CN: "China", AE: "UAE",
  SG: "Singapore", JP: "Japan", KR: "South Korea", VN: "Vietnam",
};

const normalizeRisk = (r: string) => {
  const l = (r || "").toLowerCase();
  if (l === "critical") return "critical";
  if (l === "high")     return "high";
  if (l === "medium" || l === "med") return "medium";
  return "low";
};

const MapComponent = ({ routes = [] }: MapComponentProps) => {
  const router = useRouter();
  const [tooltip, setTooltip]           = useState<{ text: string; x: number; y: number } | null>(null);
  const [riskFilter, setRiskFilter]     = useState<RiskFilter>("ALL");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryContainers, setCountryContainers] = useState<any[]>([]);
  const [loadingContainers, setLoadingContainers] = useState(false);
  const [containerRiskFilter, setContainerRiskFilter] = useState<RiskFilter>("ALL");

  // Fetch containers when country or risk filter changes
  useEffect(() => {
    if (!selectedCountry) return;
    setLoadingContainers(true);
    const rl = containerRiskFilter === "ALL" ? "" : containerRiskFilter;
    const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    axios.get(`${baseURL}/containers/by-country`, {
      params: { country: selectedCountry, ...(rl ? { risk_level: rl } : {}), limit: 50 },
    })
      .then(r => setCountryContainers(r.data.data || []))
      .catch(() => setCountryContainers([]))
      .finally(() => setLoadingContainers(false));
  }, [selectedCountry, containerRiskFilter]);

  const displayRoutes = useMemo(() => {
    if (Array.isArray(routes) && routes.length > 0) {
      return routes.map((r, i) => {
        let fromC: [number, number] | null = null;
        let toC:   [number, number] | null = null;
        if (r.coords?.length === 2) { fromC = r.coords[0]; toC = r.coords[1]; }
        else if (r.lon1 != null)    { fromC = [r.lon1, r.lat1!]; toC = [r.lon2!, r.lat2!]; }
        if (!fromC || !toC) return null;
        return { id: r.id || `r${i}`, from: r.origin || r.from || "?", to: r.destination || r.to || "?", fromC, toC, risk: normalizeRisk(r.risk || "low") };
      }).filter(Boolean) as typeof STATIC_ROUTES;
    }
    return STATIC_ROUTES;
  }, [routes]);

  // Whether a route matches the active filter
  const isRouteActive = useCallback((risk: string) =>
    riskFilter === "ALL" || risk === riskFilter.toLowerCase()
  , [riskFilter]);

  const handleCountryClick = useCallback((countryCode: string) => {
    setSelectedCountry(prev => prev === countryCode ? null : countryCode);
    setContainerRiskFilter("ALL");
  }, []);

  const riskBadgeColor: Record<string, string> = {
    CRITICAL: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    HIGH:     "bg-orange-500/20 text-orange-400 border-orange-500/30",
    MEDIUM:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
    LOW:      "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };

  // Collect destination countries from routes for clickable markers
  const destCountries = useMemo(() => {
    const map: Record<string, { coords: [number, number]; risk: string }> = {};
    displayRoutes.forEach(r => {
      if (!map[r.to] || r.risk === "critical") map[r.to] = { coords: r.toC, risk: r.risk };
    });
    return map;
  }, [displayRoutes]);

  return (
    <div className="w-full h-full relative" style={{ background: "#060912" }}>
      {/* Risk filter bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-[#060912]/90 backdrop-blur-sm border border-white/[0.07] rounded-xl px-3 py-1.5">
        {RISK_LEVELS.map(lvl => (
          <button
            key={lvl}
            onClick={() => setRiskFilter(lvl)}
            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
              riskFilter === lvl
                ? lvl === "ALL"      ? "bg-slate-600/60 text-slate-200 border-slate-500/50"
                : lvl === "CRITICAL" ? "bg-rose-500/30 text-rose-300 border-rose-500/50"
                : lvl === "HIGH"     ? "bg-orange-500/30 text-orange-300 border-orange-500/50"
                : lvl === "MEDIUM"   ? "bg-amber-500/30 text-amber-300 border-amber-500/50"
                :                      "bg-emerald-500/30 text-emerald-300 border-emerald-500/50"
                : "text-slate-500 border-transparent hover:text-slate-300"
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>

      <ComposableMap
        projectionConfig={{ scale: 155, center: [20, 10] }}
        width={900} height={480}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={4}>
          <Geographies geography={geoUrl}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#0e1628"
                  stroke="#1a2540"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: "none" },
                    hover:   { fill: "#162035", outline: "none", cursor: "pointer" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Routes */}
          {displayRoutes.map((route) => {
            const color = RISK_COLOR[route.risk] || RISK_COLOR.low;
            const isHigh   = route.risk === "critical" || route.risk === "high";
            const active   = isRouteActive(route.risk);
            const opacity  = active ? (route.risk === "critical" ? 1 : route.risk === "high" ? 0.85 : 0.55) : 0.1;
            return (
              <g key={route.id} style={{ cursor: "pointer" }}
                onClick={() => handleCountryClick(route.to)}>
                <Line from={route.fromC} to={route.toC} stroke={color} strokeWidth={3}
                  strokeLinecap="round" style={{ opacity: active ? 0.1 : 0.03, filter: "blur(3px)" }} />
                <Line from={route.fromC} to={route.toC} stroke={active ? color : "#334155"}
                  strokeWidth={active && isHigh ? 1.8 : 1.2} strokeLinecap="round"
                  strokeDasharray={active && isHigh ? "4 3" : undefined}
                  style={{ opacity }} />
              </g>
            );
          })}

          {/* Origin markers */}
          {displayRoutes.map((route) => (
            <Marker key={`orig-${route.id}`} coordinates={route.fromC}
              onMouseEnter={(e: any) => setTooltip({ text: COUNTRY_NAMES[route.from] || route.from, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}>
              <circle r={2.5} fill="#94a3b8" stroke="#1e293b" strokeWidth={0.8} style={{ cursor: "pointer" }}
                onClick={() => handleCountryClick(route.from)} />
            </Marker>
          ))}

          {/* Destination markers — clickable, highlighted when selected */}
          {Object.entries(destCountries).map(([code, { coords, risk }]) => {
            const color = RISK_COLOR[risk] || RISK_COLOR.low;
            const isSelected = selectedCountry === code;
            const active = isRouteActive(risk);
            return (
              <Marker key={`dest-${code}`} coordinates={coords}
                onMouseEnter={(e: any) => setTooltip({ text: `${COUNTRY_NAMES[code] || code} — click to view containers`, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}>
                <circle
                  r={isSelected ? 8 : risk === "critical" ? 5.5 : risk === "high" ? 4.5 : 3.5}
                  fill={isSelected ? "#fff" : active ? color : "#1e293b"}
                  stroke={isSelected ? color : active ? "#060912" : "#334155"}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ filter: active ? `drop-shadow(0 0 ${isSelected ? 8 : 5}px ${color})` : "none", cursor: "pointer", transition: "all 0.2s" }}
                  onClick={() => handleCountryClick(code)}
                />
                {isSelected && (
                  <text y={-10} textAnchor="middle" fill="#fff" fontSize="5" fontWeight="bold"
                    style={{ pointerEvents: "none" }}>
                    {COUNTRY_NAMES[code] || code}
                  </text>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 px-2.5 py-1.5 bg-[#0e1628]/95 border border-white/10 rounded-lg text-xs text-slate-200 pointer-events-none shadow-xl"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}>
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 bg-[#060912]/80 backdrop-blur-sm border border-white/[0.06] rounded-xl px-3 py-2.5">
        {[["critical","#ff2d55","Critical"],["high","#f43f5e","High Risk"],["medium","#f59e0b","Medium"],["low","#10b981","Low Risk"]].map(([,c,l]) => (
          <div key={l} className="flex items-center gap-2">
            <div className="w-5 h-[2px] rounded-full" style={{ background: c as string }} />
            <span className="text-[10px] text-slate-400 font-medium">{l}</span>
          </div>
        ))}
        <div className="mt-1 pt-1 border-t border-white/5 text-[9px] text-slate-600">Click destination to view containers</div>
      </div>

      {/* Live badge */}
      <div className="absolute top-3 right-4 flex items-center gap-1.5 bg-[#060912]/80 backdrop-blur-sm border border-white/[0.06] rounded-xl px-3 py-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Live</span>
      </div>

      {/* Country containers panel */}
      {selectedCountry && (
        <div className="absolute bottom-4 right-4 z-30 w-80 max-h-80 flex flex-col bg-[#060912]/97 backdrop-blur-md border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div>
              <p className="text-xs font-bold text-slate-100">
                {COUNTRY_NAMES[selectedCountry] || selectedCountry}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Inbound containers</p>
            </div>
            <button onClick={() => setSelectedCountry(null)}
              className="text-slate-500 hover:text-slate-300 text-lg leading-none transition-colors">×</button>
          </div>

          {/* Risk filter tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.04]">
            {RISK_LEVELS.map(lvl => (
              <button key={lvl}
                onClick={() => setContainerRiskFilter(lvl)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all border ${
                  containerRiskFilter === lvl
                    ? lvl === "ALL"      ? "bg-slate-600/60 text-slate-200 border-slate-500/40"
                    : lvl === "CRITICAL" ? "bg-rose-500/25 text-rose-300 border-rose-500/40"
                    : lvl === "HIGH"     ? "bg-orange-500/25 text-orange-300 border-orange-500/40"
                    : lvl === "MEDIUM"   ? "bg-amber-500/25 text-amber-300 border-amber-500/40"
                    :                      "bg-emerald-500/25 text-emerald-300 border-emerald-500/40"
                    : "text-slate-600 border-transparent hover:text-slate-400"
                }`}>
                {lvl}
              </button>
            ))}
          </div>

          {/* Container list */}
          <div className="flex-1 overflow-y-auto">
            {loadingContainers ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : countryContainers.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-xs">No containers found</div>
            ) : (
              countryContainers.map((c, i) => {
                const rl = (c.risk_level || "LOW").toUpperCase() as keyof typeof riskBadgeColor;
                return (
                  <div key={c.container_id || i}
                    onClick={() => router.push(`/container/${c.container_id}`)}
                    className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors group">
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                        {c.container_id}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {c.origin} → {c.destination} · {c.importer || "—"}
                      </p>
                    </div>
                    <span className={`ml-2 flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold border ${riskBadgeColor[rl] || riskBadgeColor.LOW}`}>
                      {rl}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {countryContainers.length > 0 && (
            <div className="px-4 py-2 border-t border-white/[0.04]">
              <button
                onClick={() => router.push(`/containers?destination=${selectedCountry}&risk=${containerRiskFilter}`)}
                className="w-full text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors text-center">
                View all in Containers →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(MapComponent);
