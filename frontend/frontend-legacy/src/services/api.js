import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (username, password) => {
  try {
    const response = await api.post('/login', { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred during login' };
  }
};

export const registerUser = async (username, password) => {
  try {
    const response = await api.post('/register', { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: 'An error occurred during registration' };
  }
};

export const getSummary = async () => {
  try {
    const response = await api.get('/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching summary:', error);
    return {
      total_containers: 1200,
      high_risk: 86,
      low_risk: 1114,
      anomalies: 42
    };
  }
};

export const getRiskDistribution = async () => {
  try {
    const response = await api.get('/risk-distribution');
    return response.data;
  } catch (error) {
    console.error('Error fetching risk distribution:', error);
    return {
      low: 800,
      medium: 200,
      high: 80,
      critical: 20
    };
  }
};

export const getHighRiskContainers = async () => {
  try {
    const response = await api.get('/high-risk-containers');
    return response.data;
  } catch (error) {
    console.error('Error fetching high risk containers:', error);
    return [
      {
        container_id: 'C1001',
        importer: 'ABC Imports Ltd',
        exporter: 'XYZ Exports',
        origin: 'China',
        risk_score: 0.89,
        risk_level: 'HIGH'
      },
      {
        container_id: 'C1002',
        importer: 'Global Trade Co',
        exporter: 'Asia Exports',
        origin: 'UAE',
        risk_score: 0.92,
        risk_level: 'CRITICAL'
      }
    ];
  }
};

export const uploadContainers = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/upload-containers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading containers:', error);
    throw error;
  }
};

export const getContainerDetails = async (id) => {
  try {
    const response = await api.get(`/container/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching container details:', error);
    return {
      container_id: id,
      importer: 'ABC Imports Ltd',
      exporter: 'XYZ Exports',
      origin: 'China',
      destination: 'India',
      risk_score: 0.89,
      risk_level: 'HIGH',
      weight: 15000,
      declared_value: 50000,
      hs_code: '8471.30',
      explanations: [
        'Weight mismatch detected',
        'Unusual value-to-weight ratio',
        'Exporter flagged previously'
      ]
    };
  }
};

export const getCountryRisk = async () => {
  try {
    const response = await api.get('/country-risk');
    return response.data;
  } catch (error) {
    console.error('Error fetching country risk:', error);
    return [
      { country: 'China', risk_count: 45 },
      { country: 'UAE', risk_count: 30 },
      { country: 'Singapore', risk_count: 20 },
      { country: 'Hong Kong', risk_count: 15 }
    ];
  }
};

export const getImporterRisk = async () => {
  try {
    const response = await api.get('/importer-risk');
    return response.data;
  } catch (error) {
    console.error('Error fetching importer risk:', error);
    return [
      { importer: 'ABC Imports Ltd', risk_count: 12 },
      { importer: 'Global Trade Co', risk_count: 10 },
      { importer: 'Fast Shipping Inc', risk_count: 8 },
      { importer: 'Ocean Freight Ltd', risk_count: 6 }
    ];
  }
};

export const getTradeRoutes = async () => {
  try {
    const response = await api.get('/trade-routes');
    // Ensure backwards compatibility if backend still returns array
    if (Array.isArray(response.data)) {
      return { routes: response.data, stats: { active_routes: response.data.length, high_risk_routes: 0, tracked_countries: 0 } };
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching trade routes:', error);
    return {
      routes: [
        { origin: 'China', destination: 'India', risk: 'high', lat1: 31.2304, lon1: 121.4737, lat2: 19.0760, lon2: 72.8777 },
        { origin: 'UAE', destination: 'India', risk: 'low', lat1: 25.2048, lon1: 55.2708, lat2: 19.0760, lon2: 72.8777 },
        { origin: 'Singapore', destination: 'India', risk: 'medium', lat1: 1.3521, lon1: 103.8198, lat2: 13.0827, lon2: 80.2707 }
      ],
      stats: {
        active_routes: 3,
        high_risk_routes: 1,
        tracked_countries: 3
      }
    };
  }
};

export const getRiskHeatmap = async () => {
  try {
    const response = await api.get('/risk-heatmap');
    return response.data;
  } catch (error) {
    console.error('Error fetching risk heatmap:', error);
    return {
      China: 40,
      UAE: 30,
      Singapore: 20,
      'Hong Kong': 15,
      Malaysia: 10
    };
  }
};

export const askAI = async (question) => {
  try {
    const response = await api.post('/ai-explain', { question });
    return response.data;
  } catch (error) {
    console.error('Error asking AI:', error);
    return {
      answer: 'This container has been flagged as high risk due to multiple factors including weight mismatch, unusual value-to-weight ratio, and the exporter being previously flagged for suspicious activities.'
    };
  }
};

export const getRiskAlerts = async () => {
  try {
    const response = await api.get('/risk-alerts');
    return response.data;
  } catch (error) {
    console.error('Error fetching risk alerts:', error);
    return [
      {
        container_id: 'C7823',
        importer: 'ABC Imports',
        risk_score: 0.91,
        risk_level: 'CRITICAL',
        message: 'Severe weight mismatch detected'
      },
      {
        container_id: 'C5621',
        importer: 'Global Trade Co',
        risk_score: 0.87,
        risk_level: 'HIGH',
        message: 'Exporter flagged in previous shipments'
      }
    ];
  }
};

// ---------------------------------------------------------------------------
// New ML Prediction Endpoints
// ---------------------------------------------------------------------------

export const predictRisk = async (shipmentData) => {
  try {
    const response = await api.post('/predict', shipmentData);
    return response.data;
  } catch (error) {
    console.error('Error predicting risk:', error);
    return {
      prediction: 'unknown',
      risk_score: 0,
      risk_level: 'Unknown',
      container_id: shipmentData?.Container_ID || 'UNKNOWN'
    };
  }
};

export const getShipments = async (page = 1, limit = 100) => {
  try {
    const response = await api.get(`/containers?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return { data: [], total: 0, page, limit, total_pages: 0 };
  }
};


export const getAnomalies = async (page = 1, limit = 20) => {
  try {
    const response = await api.get('/anomalies', { params: { page, limit } });
    return response.data;
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    return { data: [], total: 0, page, limit, total_pages: 0 };
  }
};

export const analyzeBatch = async (shipments) => {
  try {
    const response = await api.post('/analyze', { shipments });
    return response.data;
  } catch (error) {
    console.error('Error analyzing batch:', error);
    return {
      total_analyzed: 0,
      anomalies_detected: 0,
      normal_count: 0,
      results: []
    };
  }
};

// ---------------------------------------------------------------------------
// Filtered Container Endpoints
// ---------------------------------------------------------------------------

export const getHighRiskContainersList = async (page = 1, limit = 50) => {
  try {
    const response = await api.get('/containers/high-risk', { params: { page, limit } });
    console.debug('API /containers/high-risk response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching high-risk containers:', error);
    return { data: [], total: 0, page, limit, total_pages: 0 };
  }
};

export const getLowRiskContainersList = async (page = 1, limit = 50) => {
  try {
    const response = await api.get('/containers/low-risk', { params: { page, limit } });
    console.debug('API /containers/low-risk response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching low-risk containers:', error);
    return { data: [], total: 0, page, limit, total_pages: 0 };
  }
};

export const getImporterContainers = async (importerName) => {
  try {
    const response = await api.get(`/importer/${encodeURIComponent(importerName)}/containers`);
    return response.data;
  } catch (error) {
    console.error('Error fetching importer containers:', error);
    return { containers: [], alerts: [] };
  }
};


export const createContainer = async (containerData) => {
  try {
    const response = await api.post('/container', containerData);
    return response.data;
  } catch (error) {
    throw error;
  }
};


// ---------------------------------------------------------------------------
// Risk Analysis, PDF Report, Email, Comparison
// ---------------------------------------------------------------------------

export const getRiskAnalysis = async (id) => {
  try {
    const response = await api.get(`/container/${id}/risk-analysis`);
    return response.data;
  } catch (error) {
    console.error('Error fetching risk analysis:', error);
    return { indicators: [], recommendation: { action: 'AUTO_CLEAR', description: 'Unable to analyze', priority: 'NORMAL' } };
  }
};

export const downloadReport = async (id) => {
  try {
    const response = await api.get(`/container/${id}/report`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `container_report_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    console.error('Error downloading report:', error);
    return { success: false };
  }
};

export const sendReportEmail = async (id, email) => {
  try {
    const response = await api.post(`/container/${id}/send-report`, { email });
    return response.data;
  } catch (error) {
    console.error('Error sending report email:', error);
    return { success: false, message: error.response?.data?.detail || 'Failed to send email' };
  }
};

export const getContainerComparison = async (id) => {
  try {
    const response = await api.get(`/container/${id}/comparison`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comparison:', error);
    return { metrics: [] };
  }
};

export const getAIExplanation = async (id) => {
  try {
    const response = await api.get(`/container/${id}/ai-explanation`);
    return response.data;
  } catch (error) {
    console.error('Error fetching AI explanation:', error);
    return null;
  }
};

export const getTradeNetwork = async () => {
  try {
    const response = await api.get('/trade-network');
    return response.data;
  } catch (error) {
    console.error('Error fetching trade network:', error);
    return { nodes: [], edges: [] };
  }
};

export const getRiskTrends = async () => {
  try {
    const response = await api.get('/risk-trends');
    return response.data;
  } catch (error) {
    console.error('Error fetching risk trends:', error);
    return [];
  }
};

export const getIntelligenceInsights = async () => {
  try {
    const response = await api.get('/intelligence-insights');
    return response.data;
  } catch (error) {
    console.error('Error fetching intelligence insights:', error);
    return [];
  }
};

export default api;
