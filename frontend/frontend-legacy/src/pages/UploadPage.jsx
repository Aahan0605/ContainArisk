import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileSpreadsheet, Keyboard } from 'lucide-react';
import UploadCard from '../components/UploadCard';
import UploadManualEntry from '../components/UploadManualEntry';

const UploadPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' or 'manual'

  const handleUploadSuccess = () => {
    navigate('/dashboard');
  };

  const fields = ['Container ID', 'Importer Name', 'Exporter Name', 'Origin Country', 'Destination Country', 'Weight (kg)', 'Declared Value (USD)', 'HS Code'];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-[#1B2A4A] dark:text-slate-100 tracking-tight">Add Container Data</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload files or manually insert container shipment information for risk analysis</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex space-x-2 bg-gray-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit"
      >
        <button
          onClick={() => setActiveTab('csv')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'csv' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-[#1B2A4A] dark:hover:text-slate-200'}`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>CSV Upload</span>
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-[#1B2A4A] dark:hover:text-slate-200'}`}
        >
          <Keyboard className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'csv' ? (
          <motion.div
            key="csv"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <UploadCard onUploadSuccess={handleUploadSuccess} />

            <div className="bg-blue-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-blue-100 dark:border-slate-700/50">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-[#1B2A4A] dark:text-slate-100">CSV Format Requirements</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {fields.map((field) => (
                  <div key={field} className="flex items-center space-x-2 text-sm text-[#1B2A4A] dark:text-slate-100 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                    <span>{field}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <UploadManualEntry onUploadSuccess={handleUploadSuccess} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadPage;
