import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Field normalizer — backend uses snake_case with _id / _country suffixes
// frontend components expect: container_id, importer, exporter, origin,
// destination, risk_score (0-1), risk_level, weight, declared_value, hs_code
// ---------------------------------------------------------------------------
export const normalizeContainer = (r: any) => {
  if (!r) return r;
  const riskRaw = r.risk_score ?? r.Risk_Score ?? r.risk_assessment?.[0]?.risk_score ?? 0;
  const riskScore = riskRaw > 1 ? riskRaw / 100 : riskRaw;
  const normalizedLevel = riskScore >= 0.85 ? 'CRITICAL' : riskScore >= 0.70 ? 'HIGH' : riskScore >= 0.40 ? 'MEDIUM' : 'LOW';
  return {
    ...r,
    container_id:    r.container_id   ?? r.Container_ID   ?? r.id ?? '—',
    importer:        r.importer       ?? r.importer_id    ?? r.Importer_ID   ?? '—',
    exporter:        r.exporter       ?? r.exporter_id    ?? r.Exporter_ID   ?? '—',
    origin:          r.origin         ?? r.origin_country ?? r.Origin_Country ?? '—',
    destination:     r.destination    ?? r.destination_country ?? r.Destination_Country ?? '—',
    hs_code:         r.hs_code        ?? r.HS_Code        ?? '—',
    weight:          r.weight         ?? r.measured_weight ?? r.Measured_Weight ?? 0,
    declared_weight: r.declared_weight ?? r.Declared_Weight ?? 0,
    declared_value:  r.declared_value ?? r.value          ?? r.Declared_Value ?? 0,
    risk_score:      riskScore,
    risk_level:      normalizedLevel,
    entity_trust_score:       r.entity_trust_score       ?? null,
    weight_deviation_percent: r.weight_deviation_percent ?? null,
    seal_tamper_prob:         r.seal_tamper_prob         ?? null,
    tax_evasion_prob:         r.tax_evasion_prob         ?? null,
  };
};

const normalizePage = (res: any) => ({
  ...res,
  data: (res.data || []).map(normalizeContainer),
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const loginUser = async (username: string, password: string) => {
  try {
    const r = await api.post('/login', { username, password });
    return r.data;
  } catch (e: any) {
    throw e.response?.data || { detail: 'Login failed' };
  }
};

export const registerUser = async (username: string, password: string) => {
  try {
    const r = await api.post('/register', { username, password });
    return r.data;
  } catch (e: any) {
    throw e.response?.data || { detail: 'Registration failed' };
  }
};

// ---------------------------------------------------------------------------
// Dashboard summary
// ---------------------------------------------------------------------------
export const getSummary = async () => {
  try {
    const r = await api.get('/summary');
    return r.data;
  } catch {
    return { total_containers: 54000, high_risk: 4200, low_risk: 49800, anomalies: 1800 };
  }
};

export const getRiskDistribution = async () => {
  try {
    const r = await api.get('/risk-distribution');
    return r.data;
  } catch {
    return { low: 38000, medium: 12000, high: 3200, critical: 800 };
  }
};

// ---------------------------------------------------------------------------
// Containers — high limit so all 54k rows are accessible via pagination
// ---------------------------------------------------------------------------
export const getShipments = async (page = 1, limit = 500) => {
  try {
    const r = await api.get(`/containers?page=${page}&limit=${limit}`);
    return normalizePage(r.data);
  } catch {
    return { data: [], total: 0, page, limit, total_pages: 0 };
  }
};

export const getCriticalContainersList = async (page = 1, limit = 500) => {
  try {
    const r = await api.get('/containers/critical', { params: { page, limit } });
    const result = normalizePage(r.data);
    result.data = result.data.map((c: any) => ({ ...c, risk_level: 'CRITICAL' }));
    return result;
  } catch {
    return { data: [], total: 0, page, limit, total_pages: 0 };
  }
};

export const getHighRiskContainersList = async (page = 1, limit = 500) => {
  try {
    const r = await api.get('/containers/high-risk', { params: { page, limit } });
    const result = normalizePage(r.data);
    result.data = result.data.map((c: any) => ({ ...c, risk_level: 'HIGH' }));
    return result;
  } catch {
    return { data: [], total: 0, page, limit, total_pages: 0 };
  }
};

export const getMediumRiskContainersList = async (page = 1, limit = 500) => {
  try {
    const r = await api.get('/containers/medium-risk', { params: { page, limit } });
    return normalizePage(r.data);
  } catch {
    return { data: [], total: 0, page, limit, total_pages: 0 };
  }
};

export const getLowRiskContainersList = async (page = 1, limit = 500) => {
  try {
    const r = await api.get('/containers/low-risk', { params: { page, limit } });
    return normalizePage(r.data);
  } catch {
    return { data: [], total: 0, page, limit, total_pages: 0 };
  }
};

export const getHighRiskContainers = async () => {
  try {
    const r = await api.get('/high-risk-containers');
    return (r.data || []).map(normalizeContainer);
  } catch {
    return [];
  }
};

export const getContainerDetails = async (id: string) => {
  try {
    const r = await api.get(`/container/${id}`);
    return normalizeContainer(r.data);
  } catch {
    return normalizeContainer({ container_id: id, risk_score: 0.5, risk_level: 'MEDIUM' });
  }
};

export const getImporterContainers = async (importerName: string) => {
  try {
    const r = await api.get(`/importer/${encodeURIComponent(importerName)}/containers`);
    return {
      containers: (r.data.containers || []).map(normalizeContainer),
      alerts: r.data.alerts || [],
    };
  } catch {
    return { containers: [], alerts: [] };
  }
};

export const createContainer = async (containerData: any) => {
  try {
    // Normalize the data with proper field names and types
    const normalizedData = {
      Container_ID: String(containerData.Container_ID || containerData.container_id || '').trim(),
      Declaration_Date: String(containerData.Declaration_Date || containerData.declaration_date || new Date().toISOString().split('T')[0]).trim(),
      Trade_Regime: String(containerData.Trade_Regime || containerData.trade_regime || 'Import').trim(),
      Origin_Country: String(containerData.Origin_Country || containerData.origin_country || '').trim(),
      Destination_Country: String(containerData.Destination_Country || containerData.destination_country || '').trim(),
      Destination_Port: String(containerData.Destination_Port || containerData.destination_port || '').trim(),
      HS_Code: String(containerData.HS_Code || containerData.hs_code || '').trim(),
      Importer_ID: String(containerData.Importer_ID || containerData.importer_id || '').trim(),
      Exporter_ID: String(containerData.Exporter_ID || containerData.exporter_id || '').trim(),
      Declared_Value: parseFloat(containerData.Declared_Value || containerData.declared_value || '0') || 0,
      Declared_Weight: parseFloat(containerData.Declared_Weight || containerData.declared_weight || '0') || 0,
      Measured_Weight: parseFloat(containerData.Measured_Weight || containerData.measured_weight || '0') || 0,
      Shipping_Line: String(containerData.Shipping_Line || containerData.shipping_line || '').trim(),
      Dwell_Time_Hours: parseFloat(containerData.Dwell_Time_Hours || containerData.dwell_time_hours || '0') || 0,
      Clearance_Status: String(containerData.Clearance_Status || containerData.clearance_status || 'Clear').trim(),
    };
    
    const r = await api.post('/container', normalizedData);
    return r.data;
  } catch (e: any) {
    console.error('Container creation error:', {
      status: e.response?.status,
      data: e.response?.data,
      message: e.message,
    });
    throw e.response?.data || { detail: e.message || 'Failed to create container' };
  }
};

// ---------------------------------------------------------------------------
// Anomalies
// ---------------------------------------------------------------------------
export const getAnomalies = async (page = 1, limit = 100) => {
  try {
    const r = await api.get('/anomalies', { params: { page, limit } });
    return normalizePage(r.data);
  } catch {
    return { data: [], total: 0, page, limit, total_pages: 0 };
  }
};

export const analyzeBatch = async (shipments: any[]) => {
  try {
    const r = await api.post('/analyze', { shipments });
    return r.data;
  } catch {
    return { total_analyzed: 0, anomalies_detected: 0, normal_count: 0, results: [] };
  }
};

export const predictRisk = async (shipmentData: any) => {
  try {
    const r = await api.post('/predict', shipmentData);
    return r.data;
  } catch {
    return { prediction: 'unknown', risk_score: 0, risk_level: 'Unknown' };
  }
};

// ---------------------------------------------------------------------------
// Trade routes, network, trends
// ---------------------------------------------------------------------------
export const getTradeRoutes = async () => {
  try {
    const r = await api.get('/trade-routes');
    if (Array.isArray(r.data)) {
      return { routes: r.data, stats: { active_routes: r.data.length, high_risk_routes: 0, tracked_countries: 0 } };
    }
    return r.data;
  } catch {
    return {
      routes: [
        { origin: 'CN', destination: 'IN', risk: 'high',   lat1: 31.23, lon1: 121.47, lat2: 19.08, lon2: 72.88 },
        { origin: 'AE', destination: 'IN', risk: 'medium', lat1: 25.20, lon1: 55.27,  lat2: 13.08, lon2: 80.27 },
        { origin: 'SG', destination: 'IN', risk: 'low',    lat1: 1.35,  lon1: 103.82, lat2: 22.57, lon2: 88.37 },
      ],
      stats: { active_routes: 3, high_risk_routes: 1, tracked_countries: 3 },
    };
  }
};

export const getTradeNetwork = async () => {
  try {
    const r = await api.get('/trade-network');
    return r.data;
  } catch {
    return { nodes: [], edges: [] };
  }
};

export const getRiskTrends = async () => {
  try {
    const r = await api.get('/risk-trends');
    // Backend returns [{date, total, high_risk}] — map to chart format
    if (Array.isArray(r.data) && r.data.length > 0 && r.data[0].date) {
      return r.data.map((d: any) => ({
        month:     d.date?.slice(0, 7) ?? d.month ?? '',
        risk:      d.avg_risk ?? 0,
        volume:    d.total ?? 0,
        anomalies: d.high_risk ?? 0,
      }));
    }
    return r.data;
  } catch {
    return [];
  }
};

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
export const getCountryRisk = async () => {
  try {
    const r = await api.get('/country-risk');
    return r.data;
  } catch {
    return [
      { country: 'CN', risk_count: 45 }, { country: 'AE', risk_count: 30 },
      { country: 'SG', risk_count: 20 }, { country: 'HK', risk_count: 15 },
    ];
  }
};

export const getImporterRisk = async () => {
  try {
    const r = await api.get('/importer-risk');
    return r.data;
  } catch {
    return [
      { importer: 'ABC Imports', risk_count: 12 },
      { importer: 'Global Trade', risk_count: 10 },
    ];
  }
};

export const getRiskHeatmap = async () => {
  try {
    const r = await api.get('/risk-heatmap');
    return r.data;
  } catch {
    return {};
  }
};

// ---------------------------------------------------------------------------
// Reports & AI
// ---------------------------------------------------------------------------
export const getRiskAnalysis = async (id: string) => {
  try {
    const r = await api.get(`/container/${id}/risk-analysis`);
    return r.data;
  } catch {
    return { indicators: [], recommendation: { action: 'AUTO_CLEAR', description: 'Unable to analyze', priority: 'NORMAL' } };
  }
};

export const downloadReport = async (id: string) => {
  try {
    const r = await api.get(`/container/${id}/report`, {
      responseType: 'blob',
      headers: { 'Content-Type': undefined },
    });
    const blob = new Blob([r.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `container_report_${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return { success: true };
  } catch {
    return { success: false };
  }
};

export const sendReportEmail = async (id: string, email: string) => {
  try {
    const r = await api.post(`/container/${id}/send-report`, { email });
    return r.data;
  } catch (e: any) {
    return { success: false, message: e.response?.data?.detail || 'Failed to send email' };
  }
};

export const getContainerComparison = async (id: string) => {
  try {
    const r = await api.get(`/container/${id}/comparison`);
    return r.data;
  } catch {
    return { metrics: [] };
  }
};

export const getAIExplanation = async (id: string) => {
  try {
    const r = await api.get(`/container/${id}/ai-explanation`);
    return r.data;
  } catch {
    return null;
  }
};

export const askAI = async (question: string) => {
  try {
    const r = await api.post('/ai-explain', { question });
    return r.data;
  } catch {
    return { answer: 'AI service unavailable. Please ensure the backend is running.' };
  }
};

export const getRiskAlerts = async () => {
  try {
    const r = await api.get('/risk-alerts');
    return (r.data || []).map(normalizeContainer);
  } catch {
    return [];
  }
};

export const getIntelligenceInsights = async () => {
  try {
    const r = await api.get('/intelligence-insights');
    return r.data;
  } catch {
    return [];
  }
};

export const uploadContainers = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const r = await api.post('/upload-containers', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return r.data;
  } catch (e) {
    throw e;
  }
};

export default api;
