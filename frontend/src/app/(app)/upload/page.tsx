"use client";

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertTriangle, X, ArrowLeft, Database, Zap, Plus, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { uploadContainers, createContainer } from '@/lib/services/api';

type UploadStatus = 'idle' | 'parsing' | 'uploading' | 'success' | 'error';
type ActiveTab = 'csv' | 'manual';

const EMPTY_FORM = {
  Container_ID: '', Declaration_Date: '', Trade_Regime: 'Import',
  Origin_Country: '', Destination_Country: '', Destination_Port: '',
  HS_Code: '', Importer_ID: '', Exporter_ID: '',
  Declared_Value: '', Declared_Weight: '', Measured_Weight: '',
  Shipping_Line: '', Dwell_Time_Hours: '', Clearance_Status: 'Clear',
};

export default function UploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<ActiveTab>('csv');

  // CSV state
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  // Manual form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [manualStatus, setManualStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [manualError, setManualError] = useState('');
  const [manualResult, setManualResult] = useState<any>(null);

  const handleFile = (f: File) => {
    setFile(f); setStatus('parsing'); setError('');
    Papa.parse(f, {
      header: true, preview: 5,
      complete: (res) => { setHeaders(res.meta.fields || []); setPreview(res.data as any[]); setStatus('idle'); },
      error: () => { setError('Failed to parse CSV.'); setStatus('error'); }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) handleFile(f);
    else setError('Only CSV files are supported.');
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      const res = await uploadContainers(file);
      setResult(res); setStatus('success');
    } catch {
      setError('Upload failed. Please ensure the backend is running.');
      setStatus('error');
    }
  };

  const reset = () => {
    setFile(null); setPreview([]); setHeaders([]);
    setStatus('idle'); setResult(null); setError('');
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualStatus('submitting'); setManualError('');
    try {
      const payload = {
        ...form,
        Declared_Value: parseFloat(form.Declared_Value) || 0,
        Declared_Weight: parseFloat(form.Declared_Weight) || 0,
        Measured_Weight: parseFloat(form.Measured_Weight) || 0,
        Dwell_Time_Hours: parseFloat(form.Dwell_Time_Hours) || 0,
        HS_Code: form.HS_Code || undefined,
      };
      const res = await createContainer(payload);
      setManualResult(res);
      setManualStatus('success');
      setTimeout(() => setForm(EMPTY_FORM), 1000);
    } catch (err: any) {
      const errorMsg = err?.detail || err?.message || 'Failed to add container. Ensure all required fields are filled.';
      setManualError(errorMsg);
      setManualStatus('error');
    }
  };

  const field = (label: string, key: keyof typeof EMPTY_FORM, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.06] rounded-xl text-slate-200 placeholder-slate-600 outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500/25 transition-all"
      />
    </div>
  );

  const selectField = (label: string, key: keyof typeof EMPTY_FORM, options: string[]) => (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</label>
      <select
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 text-sm bg-[#0e1628] border border-white/[0.06] rounded-xl text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Upload Container Data</h1>
          <p className="text-xs text-slate-500 mt-0.5">Import CSV datasets or add containers manually</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['csv', 'CSV Upload', Upload], ['manual', 'Manual Entry', Plus]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
              tab === key
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'csv' && (
        <>
          {/* Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`glass-panel rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all border-2 border-dashed ${
              dragging ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/[0.08] hover:border-emerald-500/30 hover:bg-white/[0.02]'
            }`}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Upload className="w-7 h-7 text-emerald-400" />
            </div>
            {file ? (
              <div className="text-center">
                <p className="text-slate-200 font-semibold flex items-center gap-2 justify-center"><FileText className="w-4 h-4 text-emerald-400" />{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB · {preview.length}+ rows previewed</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-slate-300 font-semibold">Drop your CSV file here</p>
                <p className="text-xs text-slate-500 mt-1">or click to browse · CSV format only</p>
              </div>
            )}
          </div>

          {/* Expected Format */}
          <div className="glass-panel rounded-2xl p-5">
            <h3 className="panel-title mb-3"><Database className="w-4 h-4 text-emerald-400" />Expected CSV Columns</h3>
            <div className="flex flex-wrap gap-2">
              {['Container_ID', 'Declaration_Date', 'Trade_Regime', 'Origin_Country', 'Destination_Country', 'HS_Code', 'Importer_ID', 'Exporter_ID', 'Declared_Value', 'Declared_Weight', 'Measured_Weight', 'Shipping_Line', 'Dwell_Time_Hours', 'Clearance_Status'].map(col => (
                <span key={col} className="text-[11px] font-mono px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-slate-400">{col}</span>
              ))}
            </div>
          </div>

          {/* Preview Table */}
          <AnimatePresence>
            {preview.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl overflow-hidden">
                <div className="panel-header px-5 pt-5">
                  <h3 className="panel-title"><FileText className="w-4 h-4 text-emerald-400" />Preview (first 5 rows)</h3>
                  <button onClick={reset} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-all">
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                <div className="overflow-x-auto px-5 pb-5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.05]">
                        {headers.map(h => <th key={h} className="px-3 py-2 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b border-white/[0.03]">
                          {headers.map(h => <td key={h} className="px-3 py-2 text-slate-400 whitespace-nowrap">{String(row[h] ?? '—')}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {status === 'success' && result && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 px-5 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-emerald-300 font-semibold">Upload Successful</p>
                <p className="text-xs text-slate-400 mt-0.5">{result.processed || result.total || 'All'} containers processed · {result.anomalies_detected ?? 0} anomalies detected · Data added to historical & real-time datasets</p>
              </div>
            </motion.div>
          )}

          {file && status !== 'success' && (
            <button
              onClick={handleUpload}
              disabled={status === 'uploading' || status === 'parsing'}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 self-start"
            >
              <Zap className="w-4 h-4" />
              {status === 'uploading' ? 'Uploading...' : 'Run Risk Analysis & Save'}
            </button>
          )}
        </>
      )}

      {tab === 'manual' && (
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="panel-title mb-5"><User className="w-4 h-4 text-emerald-400" />Add Container Manually</h3>
          <p className="text-xs text-slate-500 mb-5">Container data will be saved to the database and appended to both historical and real-time datasets. The ML model uses an 80/20 train/test split.</p>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {field('Container ID *', 'Container_ID', 'text', 'e.g. MSCU1234567')}
              {field('Declaration Date *', 'Declaration_Date', 'date', '')}
              {selectField('Trade Regime', 'Trade_Regime', ['Import', 'Export', 'Transit'])}
              {field('Origin Country', 'Origin_Country', 'text', 'e.g. CN')}
              {field('Destination Country', 'Destination_Country', 'text', 'e.g. US')}
              {field('Destination Port', 'Destination_Port', 'text', 'e.g. Los Angeles Port')}
              {field('HS Code', 'HS_Code', 'text', 'e.g. 847330')}
              {field('Importer ID', 'Importer_ID', 'text', 'e.g. IMP_0001')}
              {field('Exporter ID', 'Exporter_ID', 'text', 'e.g. EXP_0001')}
              {field('Declared Value (USD)', 'Declared_Value', 'number', '0.00')}
              {field('Declared Weight (kg)', 'Declared_Weight', 'number', '0')}
              {field('Measured Weight (kg)', 'Measured_Weight', 'number', '0')}
              {field('Shipping Line', 'Shipping_Line', 'text', 'e.g. Maersk')}
              {field('Dwell Time (hours)', 'Dwell_Time_Hours', 'number', '0')}
              {selectField('Clearance Status', 'Clearance_Status', ['Clear', 'Hold', 'High Risk', 'Low Risk', 'Held', 'Pending'])}
            </div>

            {manualError && (
              <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />{manualError}
              </div>
            )}

            {manualStatus === 'success' && manualResult && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4 px-5 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-emerald-300 font-semibold">Container Added Successfully</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ID: {manualResult.container_id} · Risk: {manualResult.risk_level} · Score: {Math.round((manualResult.risk_score || 0) * 100)}%
                  </p>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={manualStatus === 'submitting' || !form.Container_ID || !form.Declaration_Date}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              {manualStatus === 'submitting' ? 'Saving...' : 'Add Container & Run Risk Analysis'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
