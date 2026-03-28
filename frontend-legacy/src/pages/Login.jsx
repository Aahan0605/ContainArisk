import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { loginUser, registerUser } from '../services/api';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    return {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>_]/.test(password)
    };
  };

  const validation = validatePassword(credentials.password);
  const isPasswordValid = Object.values(validation).every(v => v);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Password does not meet requirements');
      setShowValidation(true);
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await registerUser(credentials.username, credentials.password);
        setError('Registration successful! Please sign in.');
        setIsRegistering(false);
      } else {
        await loginUser(credentials.username, credentials.password);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('officerName', credentials.username);
        onLogin();
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center p-6 md:p-16 lg:p-24 overflow-hidden text-white font-sans bg-[#111]">
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="/images/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1B33]/90 via-[#0F1B33]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1B33]/60 via-transparent to-[#0F1B33]/30" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 mt-10 xl:px-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-full md:w-1/2 flex flex-col justify-center xl:pr-20">
          <h1 className="text-6xl md:text-7xl lg:text-[80px] font-bold leading-[1.1] mb-6 tracking-tight">
            WELCOME
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-md leading-relaxed mb-10">
            Our system does not just predict risk. It builds a full customs intelligence platform that prioritizes inspections, detects trade fraud networks, and explains suspicious shipments.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="w-full md:w-1/2 max-w-[440px] bg-black/20 backdrop-blur-xl rounded-3xl p-10 shadow-2xl text-white border border-white/10">
          <h2 className="text-4xl font-bold mb-8 tracking-tight">{isRegistering ? 'Create Account' : 'Sign in'}</h2>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5 uppercase tracking-wider">Email Address</label>
              <input type="text" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} className="w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all placeholder-white/40" placeholder="Enter your officer ID" required />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-gray-300 mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" value={credentials.password} onChange={(e) => { setCredentials({ ...credentials, password: e.target.value }); setShowValidation(true); }} className="w-full px-4 py-3 bg-white/10 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all placeholder-white/40" placeholder="••••••••" required />
              {showValidation && credentials.password && (
                <div className="mt-3 p-3 bg-black/40 border border-white/10 rounded-xl space-y-1.5 text-gray-300 backdrop-blur-md">
                  <ValidationItem valid={validation.minLength} text="At least 8 characters" />
                  <ValidationItem valid={validation.hasNumber} text="Contains a number" />
                  <ValidationItem valid={validation.hasLower} text="Contains lowercase letter" />
                  <ValidationItem valid={validation.hasUpper} text="Contains uppercase letter" />
                  <ValidationItem valid={validation.hasSpecial} text="Contains special character" />
                </div>
              )}
            </div>

            {error && (
              <div className={`p-3 border text-sm ${error.includes('successful') ? 'bg-green-500/20 border-green-500/50 text-green-100' : 'bg-red-500/20 border-red-500/50 text-red-100'}`}>
                {error}
              </div>
            )}

            {!isRegistering && (
              <div className="flex items-center space-x-2 pt-1 pb-1">
                <input type="checkbox" id="remember" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 border-gray-400 cursor-pointer bg-transparent" />
                <label htmlFor="remember" className="text-sm cursor-pointer text-gray-300 hover:text-white transition-colors">Remember Me</label>
              </div>
            )}

            <div className="pt-2">
              <button type="submit" disabled={loading || !isPasswordValid} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3.5 shadow-lg shadow-blue-600/25 font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? 'Authenticating...' : isRegistering ? 'Sign Up' : 'Sign In to Dashboard'}
              </button>
            </div>

            <div className="pt-3 text-center space-y-2">
              <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </button>
            </div>

            <div className="pt-4 text-center text-xs text-gray-400 leading-relaxed font-medium">
              By {isRegistering ? 'signing up' : 'signing in'}, you agree to CONTAIN'A'RISK's<br />
              <a href="#" className="hover:text-gray-200 transition-colors">Terms of Service</a> &middot; <a href="#" className="hover:text-gray-200 transition-colors">Privacy Policy</a>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

const ValidationItem = ({ valid, text }) => (
  <div className="flex items-center space-x-2 text-xs">
    {valid ? (
      <Check className="w-3.5 h-3.5 text-emerald-400" />
    ) : (
      <X className="w-3.5 h-3.5 text-gray-400" />
    )}
    <span className={valid ? 'text-emerald-400' : 'text-gray-400'}>
      {text}
    </span>
  </div>
);

export default Login;
