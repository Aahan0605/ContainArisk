"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Plus, Database } from 'lucide-react';
import Papa from 'papaparse';
import { saveContainer } from '@/lib/services/supabase';

interface AddContainerModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddContainerModal({ onClose, onAdded }: AddContainerModalProps) {
  const [tab, setTab] = useState<'manual' | 'csv'>('manual');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    containerId: '',
    importer: '',
    exporter: '',
    commodity: '',
    weight: '',
    value: '',
    origin: '',
    destination: ''
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveContainer(formData);
      onAdded();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            // Process bulk
            await Promise.all(results.data.map((row: any) => saveContainer(row)));
            onAdded();
            onClose();
          } catch (err) {
            console.error(err);
          } finally {
             setLoading(false);
          }
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0d14]/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-[#131823] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-transparent">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500" />
            Add New Container Data
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 dark:border-white/5">
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'manual' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            onClick={() => setTab('manual')}
          >
            Manual Entry
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'csv' ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            onClick={() => setTab('csv')}
          >
            CSV Bulk Upload
          </button>
        </div>

        <div className="p-6 h-[400px] overflow-y-auto">
          {tab === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-1">Container ID</label>
                  <input required value={formData.containerId} onChange={e => setFormData({...formData, containerId: e.target.value})} type="text" className="w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" placeholder="MSCU1234567" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-1">Commodity</label>
                  <input required value={formData.commodity} onChange={e => setFormData({...formData, commodity: e.target.value})} type="text" className="w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" placeholder="Electronics" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-1">Importer</label>
                  <input required value={formData.importer} onChange={e => setFormData({...formData, importer: e.target.value})} type="text" className="w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" placeholder="Global Imports Inc" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-1">Exporter</label>
                  <input required value={formData.exporter} onChange={e => setFormData({...formData, exporter: e.target.value})} type="text" className="w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" placeholder="EuroTech Ltd" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-1">Origin Port</label>
                  <input required value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} type="text" className="w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" placeholder="Shenzhen" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-1">Destination Port</label>
                  <input required value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} type="text" className="w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" placeholder="Los Angeles" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-1">Weight (kg)</label>
                  <input required value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} type="number" className="w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" placeholder="12500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-gray-400 uppercase mb-1">Value ($)</label>
                  <input required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} type="number" className="w-full bg-slate-100 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white" placeholder="75000" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button disabled={loading} type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50">
                  {loading ? 'Processing...' : <><Plus className="w-4 h-4" /> Save Container</>}
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/20 rounded-xl">
              <Upload className="w-12 h-12 text-slate-400 mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">Drag and drop your dataset CSV here</p>
              <label className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer transition-colors relative transition-opacity">
                {loading ? 'Processing...' : 'Browse Files'}
                <input 
                  type="file" 
                  accept=".csv" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleFileUpload}
                  disabled={loading}
                />
              </label>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
