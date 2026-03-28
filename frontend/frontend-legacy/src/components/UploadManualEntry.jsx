import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, FileText, Send } from 'lucide-react';
import { createContainer } from '../services/api';

const UploadManualEntry = ({ onUploadSuccess }) => {
    const [formData, setFormData] = useState({
        Container_ID: '',
        Declaration_Date: '',
        Declaration_Time: '',
        Trade_Regime: '',
        Origin_Country: '',
        Destination_Port: '',
        Destination_Country: '',
        HS_Code: '',
        Importer_ID: '',
        Exporter_ID: '',
        Declared_Value: '',
        Declared_Weight: '',
        Measured_Weight: '',
        Shipping_Line: '',
        Dwell_Time_Hours: '',
        Clearance_Status: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus(null);

        try {
            const payload = {
                ...formData,
                Declared_Value: parseFloat(formData.Declared_Value) || 0,
                Declared_Weight: parseFloat(formData.Declared_Weight) || 0,
                Measured_Weight: parseFloat(formData.Measured_Weight) || 0,
                Dwell_Time_Hours: parseFloat(formData.Dwell_Time_Hours) || 0,
            };
            await createContainer(payload);
            setSubmitting(false);
            setStatus('success');
            setTimeout(() => {
                if (onUploadSuccess) onUploadSuccess();
            }, 1500);
        } catch (error) {
            console.error('Error creating container:', error);
            setSubmitting(false);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium p-12 text-center space-y-4"
            >
                <div className="w-16 h-16 mx-auto bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center border border-emerald-100 dark:border-emerald-800/50">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-[#1B2A4A] dark:text-slate-100">Container Added Successfully!</h3>
                <p className="text-gray-500 dark:text-gray-400">Redirecting to dashboard...</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="card-premium p-6 md:p-8"
        >
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                    <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-[#1B2A4A] dark:text-slate-100">Manual Container Entry</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enter shipment details manually</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <InputField label="Container ID" name="Container_ID" value={formData.Container_ID} onChange={handleChange} placeholder="e.g. MSKU1234567" required />
                    <InputField label="Declaration Date" type="date" name="Declaration_Date" value={formData.Declaration_Date} onChange={handleChange} required />
                    <InputField label="Declaration Time" type="time" name="Declaration_Time" value={formData.Declaration_Time} onChange={handleChange} required />

                    <SelectField label="Trade Regime" name="Trade_Regime" value={formData.Trade_Regime} onChange={handleChange} options={['Import', 'Export', 'Transit']} required />
                    <InputField label="Origin Country" name="Origin_Country" value={formData.Origin_Country} onChange={handleChange} placeholder="e.g. China" required />
                    <InputField label="Destination Country" name="Destination_Country" value={formData.Destination_Country} onChange={handleChange} placeholder="e.g. USA" required />

                    <InputField label="Destination Port" name="Destination_Port" value={formData.Destination_Port} onChange={handleChange} placeholder="e.g. Port of LA" required />
                    <InputField label="HS Code" name="HS_Code" value={formData.HS_Code} onChange={handleChange} placeholder="e.g. 854231" required />
                    <InputField label="Importer ID" name="Importer_ID" value={formData.Importer_ID} onChange={handleChange} placeholder="e.g. IMP-9021" required />

                    <InputField label="Exporter ID" name="Exporter_ID" value={formData.Exporter_ID} onChange={handleChange} placeholder="e.g. EXP-1002" required />
                    <InputField label="Declared Value (USD)" type="number" step="0.01" name="Declared_Value" value={formData.Declared_Value} onChange={handleChange} placeholder="0.00" required />
                    <InputField label="Declared Weight (kg)" type="number" step="0.1" name="Declared_Weight" value={formData.Declared_Weight} onChange={handleChange} placeholder="0.0" required />

                    <InputField label="Measured Weight (kg)" type="number" step="0.1" name="Measured_Weight" value={formData.Measured_Weight} onChange={handleChange} placeholder="0.0" required />
                    <InputField label="Shipping Line" name="Shipping_Line" value={formData.Shipping_Line} onChange={handleChange} placeholder="e.g. Maersk" required />
                    <InputField label="Dwell Time (Hours)" type="number" name="Dwell_Time_Hours" value={formData.Dwell_Time_Hours} onChange={handleChange} placeholder="0" required />

                    <SelectField label="Clearance Status" name="Clearance_Status" value={formData.Clearance_Status} onChange={handleChange} options={['Pending', 'Cleared', 'Inspected', 'Hold']} required />
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25"
                    >
                        {submitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                <span>Submit Container</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

const InputField = ({ label, type = "text", ...props }) => (
    <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
        <input
            type={type}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 text-[#1B2A4A] dark:text-slate-100 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
            {...props}
        />
    </div>
);

const SelectField = ({ label, options, ...props }) => (
    <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{label}</label>
        <select
            defaultValue=""
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800/50 text-[#1B2A4A] dark:text-slate-100 border border-gray-200 dark:border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all appearance-none"
            {...props}
        >
            <option value="" disabled hidden>Select an option</option>
            {options.map(opt => (
                <option key={opt} value={opt} className="text-[#1B2A4A] dark:text-slate-100 bg-white dark:bg-slate-800">{opt}</option>
            ))}
        </select>
    </div>
);

export default UploadManualEntry;
