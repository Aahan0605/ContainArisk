"use client";

import { motion } from 'framer-motion';
import { X, FileText, Mail, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState } from 'react';

interface DetailedReportModalProps {
  container: any;
  onClose: () => void;
}

export default function DetailedReportModal({ container, onClose }: DetailedReportModalProps) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!container) return null;

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`ContainARisk - Intelligence Report`, 14, 22);
    
    doc.setFontSize(14);
    doc.text(`Container ID: ${container.container_id}`, 14, 32);
    doc.text(`Risk Level: ${container.risk_level.toUpperCase()}`, 14, 40);
    doc.text(`Origin: ${container.origin}`, 14, 48);
    doc.text(`Destination: ${container.destination}`, 14, 56);

    autoTable(doc, {
      startY: 65,
      head: [['Triggered Indicator', 'Severity']],
      body: container.risk_factors?.map((f: string) => [f, 'High']) || [['Value Anomaly', 'High'], ['Route Deviation', 'Medium']],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Recommended Action']],
      body: [['Schedule for immediate physical inspection at port of entry. Ensure customs broker verifies the bill of lading.']],
    });

    doc.save(`${container.container_id}_Risk_Report.pdf`);
  };

  const sendEmail = () => {
    setSendingEmail(true);
    // Mocking an SMTP/Supabase email call
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0d14]/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#131823] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col"
      >
        <div className="sticky top-0 bg-white/90 dark:bg-[#131823]/90 backdrop-blur border-b border-slate-200 dark:border-white/5 p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Intelligence Report: {container.container_id}
            </h2>
            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
              container.risk_level === 'high' ? 'bg-red-500/20 text-red-500' :
              container.risk_level === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-emerald-500/20 text-emerald-500'
            }`}>
              {container.risk_level} Risk
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Actions */}
          <div className="flex gap-4">
            <button 
              onClick={generatePDF}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate PDF Report
            </button>
            <button 
              onClick={sendEmail}
              disabled={sendingEmail || emailSent}
              className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 font-medium transition-colors ${
                emailSent ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <Mail className="w-4 h-4" />
              {sendingEmail ? 'Sending...' : emailSent ? 'Report Sent!' : 'Send Report via Email'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Risk Assessment</h3>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5">
                  <p className="text-slate-700 dark:text-slate-300">
                    The SmartContainer AI has analyzed the shipment and established a confidence score of <strong>{(container.risk_score * 100).toFixed(1)}%</strong> for potential contraband or misdeclaration. 
                    The entity trust network flags the exporter as having a history of anomalies.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Triggered Indicators</h3>
                <ul className="space-y-2">
                  {(container.risk_factors || ['Unusual Route', 'Value Anomaly']).map((factor: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 p-2 rounded border border-red-200 dark:border-red-500/20">
                      <AlertTriangle className="w-4 h-4" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Trade Route Analysis</h3>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-900 dark:text-white font-medium">{container.origin}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-slate-900 dark:text-white font-medium">{container.destination}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Vessel transited through a high-risk transshipment hub not characteristic of this commodity's typical logistics flow.
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-3">Feature Analysis</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Declared Value</span>
                    <span className="text-slate-900 dark:text-slate-100 font-mono">$124,500</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Implied Market Value</span>
                    <span className="text-red-600 dark:text-red-400 font-mono font-bold">$48,000</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-red-500 h-full" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">85% Deviation from expected baseline</p>
                </div>
              </section>
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
