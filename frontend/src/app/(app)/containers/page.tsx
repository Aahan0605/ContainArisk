"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertTriangle, CheckCircle, Activity, Flame, Search, ArrowLeft, ChevronRight } from 'lucide-react';

const RISK_COLOR: Record<string, string> = {
  CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  HIGH:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  MEDIUM:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  LOW:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const FILTER_TABS = [
  { key: 'all',      label: 'All Containers', icon: Package,       color: 'text-sky-400'     },
  { key: 'critical', label: 'Critical',        icon: Flame,         color: 'text-rose-400'    },
  { key: 'high',     label: 'High Risk',       icon: AlertTriangle, color: 'text-orange-400'  },
  { key: 'medium',   label: 'Medium Risk',     icon: Activity,      color: 'text-amber-400'   },
  { key: 'low',      label: 'Low Risk',        icon: CheckCircle,   color: 'text-emerald-400' },
];

const PAGE_SIZE = 200;
const BASE = 'http://localhost:8000';

function normalize(r: any) {
  if (!r) return r;
  const raw = r.risk_score ?? r.Risk_Score ?? 0;
  const score = raw > 1 ? raw / 100 : raw;
  const derived = score >= 0.85 ? 'CRITICAL' : score >= 0.70 ? 'HIGH' : score >= 0.40 ? 'MEDIUM' : 'LOW';
  return {
    ...r,
    container_id:   r.container_id   ?? r.Container_ID   ?? '—',
    importer:       r.importer       ?? r.importer_id    ?? '—',
    exporter:       r.exporter       ?? r.exporter_id    ?? '—',
    origin:         r.origin         ?? r.origin_country  ?? '—',
    destination:    r.destination    ?? r.destination_country ?? '—',
    hs_code:        r.hs_code        ?? r.HS_Code         ?? '—',
    weight:         r.weight         ?? r.measured_weight ?? 0,
    declared_value: r.declared_value ?? r.value ?? r.Declared_Value ?? 0,
    risk_score:     score,
    risk_level:     derived,
  };
}

function getUrl(filter: string, page: number) {
  const p = `page=${page}&limit=${PAGE_SIZE}`;
  if (filter === 'critical') return `${BASE}/containers/critical?${p}`;
  if (filter === 'high')     return `${BASE}/containers/high-risk?${p}`;
  if (filter === 'medium')   return `${BASE}/containers/medium-risk?${p}`;
  if (filter === 'low')      return `${BASE}/containers/low-risk?${p}`;
  return `${BASE}/containers?${p}`;
}

function ContainersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlFilter = searchParams.get('filter') || 'all';

  const [filter, setFilter]   = useState(urlFilter);
  const [page, setPage]       = useState(1);
  const [rows, setRows]       = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => { setFilter(urlFilter); setPage(1); }, [urlFilter]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetch(getUrl(filter, page))
      .then(r => r.json())
      .then(data => {
        if (!alive) return;
        const list = (data.data || []).map(normalize);
        setRows(list);
        setTotal(data.total || list.length);
        setLoading(false);
      })
      .catch(err => {
        if (!alive) return;
        setError(err?.message || String(err));
        setRows([]);
        setLoading(false);
      });
    return () => { alive = false; };
  }, [filter, page]);

  function handleFilter(key: string) {
    setFilter(key);
    setPage(1);
    setRows([]);
    router.push(`/containers?filter=${key}`, { scroll: false });
  }

  const filtered = rows.filter(c => {
    const q = search.toLowerCase();
    return !q
      || (c.container_id || '').toLowerCase().includes(q)
      || (c.importer || '').toLowerCase().includes(q)
      || (c.exporter || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Container Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Loading...' : `${total.toLocaleString()} containers`} · {filter} · page {page}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map(tab => {
          const Icon = tab.icon;
          const active = filter === tab.key;
          return (
            <button key={tab.key} onClick={() => handleFilter(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${active ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'}`}>
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-400' : tab.color}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by ID, importer, exporter..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all" />
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {['Container ID','Importer','Exporter','Origin','Destination','HS Code','Weight','Value','Risk Score','Risk Level',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.03]">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-white/[0.05] rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : error ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center text-rose-400 text-sm">Error: {error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center text-slate-500 text-sm">No containers found.</td></tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((c, i) => {
                    const score = Math.round(c.risk_score * 100);
                    const lvl = c.risk_level;
                    const cc = RISK_COLOR[lvl] || RISK_COLOR.LOW;
                    return (
                      <motion.tr key={c.container_id || i}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(i * 0.005, 0.15) }}
                        className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors cursor-pointer group"
                        onClick={() => router.push(`/container/${c.container_id}`)}>
                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-200">{c.container_id}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">{c.importer}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate">{c.exporter}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{c.origin}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{c.destination}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs font-mono">{c.hs_code}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{c.weight ? `${Number(c.weight).toLocaleString()} kg` : '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{c.declared_value ? `$${Number(c.declared_value).toLocaleString()}` : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden w-16">
                              <div className={`h-full rounded-full ${score >= 85 ? 'bg-rose-500' : score >= 70 ? 'bg-orange-500' : score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${score}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-300 tabular-nums">{score}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg border font-bold tracking-widest uppercase ${cc}`}>{lvl}</span>
                        </td>
                        <td className="px-4 py-3">
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-slate-500">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-all">← Prev</button>
            <span className="text-xs text-slate-500 font-mono">{page} / {Math.ceil(total / PAGE_SIZE)}</span>
            <button disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-all">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContainersPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" /></div>}>
      <ContainersContent />
    </Suspense>
  );
}
