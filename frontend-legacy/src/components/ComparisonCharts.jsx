import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getContainerComparison } from '../services/api';

const ComparisonCharts = ({ containerId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!containerId) return;
            setLoading(true);
            const result = await getContainerComparison(containerId);
            setData(result);
            setLoading(false);
        };
        fetchData();
    }, [containerId]);

    if (loading || !data || !data.metrics || data.metrics.length === 0) {
        return null;
    }

    // Normalize data for radar chart (0-100 scale)
    const maxValues = data.metrics.map(m => Math.max(m.container, m.average, 1));
    const radarData = data.metrics.map((m, i) => ({
        name: m.name.split(' (')[0],
        container: Math.min((m.container / maxValues[i]) * 100, 100),
        average: Math.min((m.average / maxValues[i]) * 100, 100),
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="card-premium p-6">
                <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-4">
                    Container vs Dataset Average
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.metrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: '#6B7280' }}
                            angle={-20}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: '1px solid #E5E7EB',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                        />
                        <Legend />
                        <Bar dataKey="container" name="This Container" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="average" name="Dataset Avg" fill="#94A3B8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Radar Chart */}
            <div className="card-premium p-6">
                <h3 className="text-base font-bold text-[#1B2A4A] dark:text-slate-100 mb-4">
                    Risk Profile Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                        <Radar name="This Container" dataKey="container" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                        <Radar name="Dataset Avg" dataKey="average" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.2} />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ComparisonCharts;
