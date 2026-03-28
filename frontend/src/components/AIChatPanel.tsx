"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X } from 'lucide-react';
// Assuming askAI was ported or we use a basic mock
import { askAI } from '@/lib/services/api';

const AIChatPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await askAI(input);
      const aiMessage = { role: 'ai', content: response.answer };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      // Fallback
      setMessages(prev => [...prev, { role: 'ai', content: "I'm experiencing connectivity issues right now. How else can I assist?" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300, y: 150, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 150 }}
            className="fixed right-6 bottom-24 w-96 h-[500px] bg-white/95 dark:bg-[#131823]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col z-[100] transition-colors"
          >
            <div className="p-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between transition-colors bg-slate-50 dark:bg-black/20 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                  <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">SmartContainer AI</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 dark:text-slate-400 mt-12 flex flex-col items-center">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-20 text-emerald-500" />
                  <p className="font-medium text-slate-700 dark:text-slate-300">ContainARisk Assistant</p>
                  <p className="text-xs mt-1">Ask me about containers, anomalies, or risk predictions.</p>
                </div>
              )}

              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : 'bg-slate-100 dark:bg-black/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/5 rounded-bl-sm'
                    }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-black/40 p-4 rounded-2xl rounded-bl-sm border border-slate-200 dark:border-white/5">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-white/5 bg-white dark:bg-[#131823] rounded-b-2xl transition-colors">
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  className="flex-1 pl-4 pr-10 py-3 bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-gray-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1.5 bottom-1.5 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-0 transition-all flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 bottom-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:bg-emerald-500 z-[90] transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </>
  );
};

export default AIChatPanel;
