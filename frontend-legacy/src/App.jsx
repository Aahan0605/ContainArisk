import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { pageVariants } from './utils/animations';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AIChatPanel from './components/AIChatPanel';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import ContainerDetails from './pages/ContainerDetails';
import Insights from './pages/Insights';
import Intelligence from './pages/Intelligence';
import AllContainers from './pages/AllContainers';
import HighRiskContainers from './pages/HighRiskContainers';
import LowRiskContainers from './pages/LowRiskContainers';
import DetectedAnomalies from './pages/DetectedAnomalies';
import ActiveRoutes from './pages/ActiveRoutes';
import HighRiskRoutes from './pages/HighRiskRoutes';
import ImporterDetails from './pages/ImporterDetails';
import LandingPage from './pages/LandingPage';

function AnimatedRoutes({ isAuthenticated }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/dashboard" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <Dashboard />
          </motion.div>
        } />
        <Route path="/upload" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <UploadPage />
          </motion.div>
        } />
        <Route path="/containers" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <AllContainers />
          </motion.div>
        } />
        <Route path="/high-risk" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <HighRiskContainers />
          </motion.div>
        } />
        <Route path="/low-risk" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <LowRiskContainers />
          </motion.div>
        } />
        <Route path="/anomalies" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <DetectedAnomalies />
          </motion.div>
        } />
        <Route path="/active-routes" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <ActiveRoutes />
          </motion.div>
        } />
        <Route path="/high-risk-routes" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <HighRiskRoutes />
          </motion.div>
        } />
        <Route path="/importer/:name" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <ImporterDetails />
          </motion.div>
        } />
        <Route path="/container/:id" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <ContainerDetails />
          </motion.div>
        } />
        <Route path="/insights" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <Insights />
          </motion.div>
        } />
        <Route path="/intelligence" element={
          <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
            <Intelligence />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('officerName');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <AnimatePresence mode="wait">
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
              <LandingPage />
            </motion.div>
          </AnimatePresence>
        } />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> :
            <AnimatePresence mode="wait">
              <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full">
                <Login onLogin={handleLogin} />
              </motion.div>
            </AnimatePresence>
        } />

        <Route path="/*" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <div className="h-screen bg-[#F8F9FB] dark:bg-[#0B1120] text-[#1B2A4A] dark:text-slate-100 overflow-hidden flex flex-col transition-colors duration-200" style={{ fontFamily: "'Inter', sans-serif" }}>
              <div className="flex-none z-50">
                <Navbar darkMode={darkMode} setDarkMode={setDarkMode} onLogout={handleLogout} />
              </div>
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-none z-40 relative">
                  <Sidebar className="h-full" />
                </div>
                <main className="flex-1 p-8 pb-24 overflow-y-auto relative z-10">
                  <AnimatedRoutes isAuthenticated={isAuthenticated} />
                </main>
              </div>
              <AIChatPanel />
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
