import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

const TradeRouteMap = ({ routes = [] }) => {
  const safeRoutes = Array.isArray(routes) ? routes : [];

  const getColor = (risk) => {
    switch (risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#22c55e';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-premium p-6 bg-gradient-to-br from-[#0B1221] to-[#070B14] border-t border-white/10 shadow-glass"
    >
      <h3 className="text-base font-bold text-white tracking-widest uppercase mb-1">Global Trade Routes</h3>
      <p className="text-xs text-gray-400 mb-4">Real-time route monitoring ({safeRoutes.length} routes)</p>
      <div className="h-[500px] rounded-xl overflow-hidden border border-white/10 shadow-inner">
        <MapContainer
          center={[20, 80]}
          zoom={3}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
          />

          {safeRoutes.map((route, index) => (
            <div key={index}>
              {route.lat1 && route.lon1 && route.lat2 && route.lon2 ? (
                <>
                  <Polyline
                    positions={[
                      [route.lat1, route.lon1],
                      [route.lat2, route.lon2]
                    ]}
                    color={getColor(route.risk)}
                    weight={3}
                    opacity={0.6}
                  />
                  <CircleMarker
                    center={[route.lat1, route.lon1]}
                    radius={5}
                    fillColor={getColor(route.risk)}
                    color="#ffffff"
                    weight={2}
                    fillOpacity={0.9}
                  >
                    <Popup className="custom-popup">
                      <div className="font-sans">
                        <p className="font-bold text-[#1B2A4A] mb-1">{route.container_id}</p>
                        <p className="text-xs text-gray-600"><strong>Origin:</strong> {route.origin}</p>
                        <p className="text-xs text-gray-600"><strong>Dest:</strong> {route.destination}</p>
                        <p className="text-xs text-gray-600"><strong>Risk Score:</strong> {(route.risk_score * 100).toFixed(1)}%</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                  <CircleMarker
                    center={[route.lat2, route.lon2]}
                    radius={5}
                    fillColor={getColor(route.risk)}
                    color="#ffffff"
                    weight={2}
                    fillOpacity={0.9}
                  >
                    <Popup className="custom-popup">
                      <div className="font-sans">
                        <p className="font-bold text-[#1B2A4A] mb-1">{route.container_id}</p>
                        <p className="text-xs text-gray-600"><strong>Origin:</strong> {route.origin}</p>
                        <p className="text-xs text-gray-600"><strong>Dest:</strong> {route.destination}</p>
                        <p className="text-xs text-gray-600"><strong>Risk Score:</strong> {(route.risk_score * 100).toFixed(1)}%</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                </>
              ) : null}
            </div>
          ))}
        </MapContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
          <span className="text-xs text-gray-400 font-medium">Low Risk</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
          <span className="text-xs text-gray-400 font-medium">Medium Risk</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-xs text-gray-400 font-medium">High Risk</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TradeRouteMap;

