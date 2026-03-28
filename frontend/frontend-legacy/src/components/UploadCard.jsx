import { useState, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { uploadContainers } from '../services/api';

const UploadCard = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleUpload(file);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setProgress(0);
    setStatus(null);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await uploadContainers(file);
      setProgress(100);
      setStatus('success');
      clearInterval(interval);
      setTimeout(() => {
        if (onUploadSuccess) onUploadSuccess();
      }, 1500);
    } catch (error) {
      setStatus('error');
      clearInterval(interval);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card-premium p-8"
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 ${isDragging
          ? 'border-blue-500/50 bg-blue-50'
          : 'border-gray-200 dark:border-slate-700 hover:border-blue-500/30 hover:bg-gray-50 dark:bg-slate-800/50'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!uploading && !status && (
          <>
            <div className="w-16 h-16 mx-auto mb-5 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
              <Upload className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1B2A4A] dark:text-slate-100 mb-2">Upload Container Data</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Drag and drop your CSV file here, or click to browse</p>
            <div className="inline-flex items-center space-x-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
              <FileText className="w-3.5 h-3.5" />
              <span>Supports .csv files</span>
            </div>
          </>
        )}

        {uploading && (
          <div className="space-y-5">
            <div className="w-12 h-12 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-2 border-gray-100 dark:border-slate-700/50" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-[#1B2A4A] dark:text-slate-100">Processing your file...</p>
            <div className="max-w-xs mx-auto">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-3"
          >
            <div className="w-14 h-14 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1B2A4A] dark:text-slate-100">Upload Successful!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to dashboard...</p>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-3"
          >
            <div className="w-14 h-14 mx-auto bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#1B2A4A] dark:text-slate-100">Upload Failed</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please try again</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default UploadCard;
