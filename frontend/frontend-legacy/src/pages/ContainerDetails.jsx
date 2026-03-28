import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download, Mail, Shield, AlertTriangle, CheckCircle, X, Brain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ComparisonCharts from '../components/ComparisonCharts';
import { getContainerDetails, getRiskAnalysis, downloadReport, sendReportEmail, getAIExplanation } from '../services/api';

const ContainerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setAiLoading(true);
      const [data, analysis] = await Promise.all([
        getContainerDetails(id),
        getRiskAnalysis(id),
      ]);
      setContainer(data);
      setRiskAnalysis(analysis);
      setLoading(false);
      // Fetch AI explanation after main data loads (non-blocking)
      const aiData = await getAIExplanation(id);
      setAiExplanation(aiData);
      setAiLoading(false);
    };
    fetchDetails();
  }, [id]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/container/${searchId.trim()}`);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    await downloadReport(id);
    setDownloading(false);
  };

  const handleSendEmail = async () => {
    if (!email.trim()) return;
    setEmailStatus('sending');
    const result = await sendReportEmail(id, email);
    setEmailStatus(result.success ? 'sent' : 'error');
    setTimeout(() => {
      if (result.success) {
        setShowEmailModal(false);
        setEmailStatus(null);
        setEmail('');
      }
    }, 2000);
  };

  if (loading) return <LoadingSpinner />;

  const riskPercentage = (container.risk_score * 100).toFixed(0);

  const infoFields = [
    { label: 'Container ID', value: container.container_id },
    { label: 'Declaration Date', value: container.declaration_date },
    { label: 'Trade Regime', value: container.trade_regime },
    { label: 'Origin Country', value: container.origin },
    { label: 'Destination Country', value: container.destination },
    { label: 'Destination Port', value: container.destination_port },
    { label: 'HS Code', value: container.hs_code },
    { label: 'Importer', value: container.importer },
    { label: 'Exporter', value: container.exporter },
    { label: 'Declared Value', value: container.declared_value != null ? `$${Number(container.declared_value).toLocaleString()}` : 'N/A' },
    { label: 'Declared Weight', value: container.declared_weight != null ? `${Number(container.declared_weight).toLocaleString()} kg` : 'N/A' },
    { label: 'Measured Weight', value: container.weight != null ? `${Number(container.weight).toLocaleString()} kg` : 'N/A' },
    { label: 'Shipping Line', value: container.shipping_line },
    { label: 'Dwell Time', value: container.dwell_time_hours != null ? `${container.dwell_time_hours} hrs` : 'N/A' },
    { label: 'Clearance Status', value: container.clearance_status },
  ];

  const severityColors = {
    CRITICAL: 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300',
    HIGH: 'bg-orange-100 dark:bg-orange-900/30 border-orange-500 text-orange-700 dark:text-orange-300',
    MEDIUM: 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-700 dark:text-amber-300',
    LOW: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-700 dark:text-emerald-300',
  };

  const SeverityIcon = ({ severity }) => {
    if (severity === 'CRITICAL' || severity === 'HIGH') return <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
    if (severity === 'MEDIUM') return <Shield className="w-4 h-4 flex-shrink-0" />;
    return <CheckCircle className="w-4 h-4 flex-shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Search Bar + Actions */}
      <motion.form
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSearch}
        className="flex items-center space-x-3 flex-wrap gap-y-2"
      >
        <motion.button
          type="button"
          whileHover={{ x: -4 }}
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="container-search"
            type="text"
            placeholder="Search Container ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-[#1B2A4A] dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
          />
        </div>
        <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          Search
        </button>
        <div className="flex space-x-2 ml-auto">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Generating...' : 'PDF Report'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Mail className="w-4 h-4" />
            <span>Email Report</span>
          </button>
        </div>
      </motion.form>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#1B2A4A] dark:text-slate-100 tracking-tight">Container Details</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{container.container_id}</p>
      </motion.div>

      {/* Main Grid: Info + Risk Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 card-premium p-6">
          <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-4">Shipment Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {infoFields.map((field) => (
              <div key={field.label} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">{field.label}</p>
                <p className="font-bold text-[#1B2A4A] dark:text-slate-100 text-sm truncate">{field.value || 'N/A'}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium p-6">
          <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-4">Risk Assessment</h3>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              <svg className="transform -rotate-90 w-40 h-40">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100 dark:text-slate-700" />
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - container.risk_score)}`}
                  className={`${container.risk_level === 'Critical' || container.risk_level === 'CRITICAL' ? 'text-red-500' :
                    container.risk_level === 'High' || container.risk_level === 'HIGH' ? 'text-orange-500' :
                      container.risk_level === 'Medium' || container.risk_level === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500'}`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-[#1B2A4A] dark:text-slate-100">{riskPercentage}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Risk Score</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center mb-4">
            <RiskBadge level={container.risk_level} />
          </div>

          {/* Recommendation */}
          {riskAnalysis?.recommendation && (
            <div className={`mt-4 p-4 rounded-xl border-l-4 ${riskAnalysis.recommendation.action === 'INSPECT' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
              riskAnalysis.recommendation.action === 'MONITOR' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500' :
                'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
              }`}>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">RECOMMENDED ACTION</p>
              <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100">{riskAnalysis.recommendation.action}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{riskAnalysis.recommendation.description}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Risk Indicators (Feature 2) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-premium p-6">
        <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-4">Triggered Risk Indicators</h3>
        <div className="space-y-3">
          {riskAnalysis?.indicators?.map((indicator, index) => (
            <div key={index} className={`flex items-start space-x-3 p-4 rounded-xl border border-l-[4px] shadow-sm ${severityColors[indicator.severity] || severityColors.LOW}`}>
              <SeverityIcon severity={indicator.severity} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{indicator.indicator}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/60 dark:bg-black/20">{indicator.severity}</span>
                </div>
                <p className="text-xs mt-1 opacity-80">{indicator.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Comparison Charts (Feature 7) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <ComparisonCharts containerId={id} />
      </motion.div>

      {/* AI Risk Intelligence Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-premium overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center space-x-3 p-5 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-indigo-900/5 via-blue-900/5 to-purple-900/5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100">AI Risk Intelligence</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Automated customs intelligence analysis</p>
          </div>
          {aiExplanation && (
            <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${aiExplanation.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                aiExplanation.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                  aiExplanation.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}>
              {aiExplanation.risk_level} RISK
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {aiLoading ? (
            <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Generating AI investigation analysis...</span>
            </div>
          ) : aiExplanation ? (
            <div className="space-y-4">
              {/* Recommendation Badge */}
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Recommended Action</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-md">
                  {aiExplanation.explanation?.recommendation || 'REVIEW'}
                </span>
              </div>

              {/* Full Explanation */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                {(aiExplanation.explanation?.full_explanation || '').split('\n\n').map((para, idx) => (
                  para.trim() && (
                    <p key={idx} className={`text-sm leading-relaxed text-slate-700 dark:text-slate-300 ${idx > 0 ? 'mt-3' : ''}`}>
                      {para.trim()}
                    </p>
                  )
                ))}
              </div>

              {/* Signal Summary Grid */}
              {aiExplanation.signals_summary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {aiExplanation.signals_summary.weight_deviation_pct > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Weight Deviation</p>
                      <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100 mt-0.5">
                        {aiExplanation.signals_summary.weight_deviation_pct.toFixed(1)}%
                      </p>
                    </div>
                  )}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dwell Time</p>
                    <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100 mt-0.5">
                      {aiExplanation.signals_summary.dwell_hours?.toFixed(0) || '0'} hrs
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Clearance</p>
                    <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100 mt-0.5">
                      {aiExplanation.signals_summary.clearance_status || 'Clear'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Origin</p>
                    <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100 mt-0.5">
                      {aiExplanation.signals_summary.origin_country || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Triggered Flags</p>
                    <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100 mt-0.5">
                      {aiExplanation.signals_summary.triggered_count || 0}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Risk Score</p>
                    <p className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100 mt-0.5">
                      {aiExplanation.risk_score?.toFixed(1) || '0.0'} / 100
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Generated at {new Date(aiExplanation.explanation?.generated_at || Date.now()).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">AI explanation unavailable for this container.</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#1B2A4A] dark:text-slate-100">Email Investigation Report</h3>
                <button onClick={() => setShowEmailModal(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Send the PDF investigation report for container <strong>{container.container_id}</strong> to:
              </p>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm text-[#1B2A4A] dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all mb-4"
              />
              {emailStatus === 'sent' && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  ✅ Report sent successfully!
                </div>
              )}
              {emailStatus === 'error' && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-xl text-sm text-red-700 dark:text-red-300 font-medium">
                  ❌ Failed to send. Check SMTP configuration.
                </div>
              )}
              <button
                onClick={handleSendEmail}
                disabled={emailStatus === 'sending' || !email.trim()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {emailStatus === 'sending' ? 'Sending...' : 'Send Report'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContainerDetails;
