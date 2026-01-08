import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Github, Chrome } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (isSignUp) {
      // Logic for new users
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert(error.message);
      } else {
        // Since Confirm Email is ON, the user is created but can't login yet
        alert('Check your email for the confirmation link to join the club!');
        onClose(); 
      }
    } else {
      // Logic for existing users
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else onClose();
    }
    setLoading(false);
  };

  const loginWithProvider = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) alert(error.message);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md glass rounded-3xl p-8 overflow-hidden"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
              <X size={20} />
            </button>

            <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              {isSignUp ? 'Join the Club.' : 'Welcome Back.'}
            </h2>
            <p className="text-slate-400 text-sm mb-8">Precision productivity starts here.</p>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button onClick={() => loginWithProvider('google')} className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 p-3 rounded-2xl hover:bg-white/10 transition-all">
                <Chrome size={20} className="text-blue-400" /> <span className="text-xs font-bold uppercase tracking-wider">Google</span>
              </button>
              <button onClick={() => loginWithProvider('github')} className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 p-3 rounded-2xl hover:bg-white/10 transition-all">
                <Github size={20} /> <span className="text-xs font-bold uppercase tracking-wider">GitHub</span>
              </button>
            </div>

            <div className="relative mb-8 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <span className="relative bg-[#0b0c14] px-4 text-xs text-slate-500 uppercase tracking-widest">or email</span>
            </div>

            {/* Custom Email Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-slate-500" size={18} />
                  <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-slate-500" size={18} />
                  <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 rounded-2xl transition-all uppercase tracking-widest">
                {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-slate-500">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-cyan-400 hover:underline">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}