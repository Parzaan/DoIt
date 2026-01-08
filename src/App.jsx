import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, ArrowRight, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomCursor from './components/CustomCursor'; //

export default function App() {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Explore the DoIt dashboard", completed: false },
    { id: 2, text: "Try adding a custom task below", completed: true },
  ]);
  const [input, setInput] = useState("");

  const addTask = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newTask = { id: Date.now(), text: input, completed: false };
    setTasks([newTask, ...tasks]);
    setInput("");
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-20 px-4">
      <CustomCursor />
      {/* Branding Section with Framer Motion */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="text-6xl font-black tracking-tighter bg-linear-to-b from-white to-slate-500 bg-clip-text text-transparent">
          DoIt.
        </h1>
        <p className="text-slate-400 mt-2 tracking-widest uppercase text-xs">Precision Productivity</p>
      </motion.div>

      {/* Main Glass Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-xl glass rounded-3xl p-8 space-y-6"
      >
        
        {/* Input Form */}
        <form onSubmit={addTask} className="flex gap-2">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What's the next move?"
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-500"
          />
          <button type="submit" className="bg-white text-black p-4 rounded-2xl hover:scale-105 active:scale-95 transition-transform">
            <Plus size={24} />
          </button>
        </form>

        {/* Task List with AnimatePresence */}
        <div className="space-y-3">
          <AnimatePresence mode='popLayout'>
            {tasks.map((task) => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                layout
                className="task-item group flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleTask(task.id)} 
                    className={`${task.completed ? 'text-emerald-400' : 'text-slate-600'} transition-colors hover:text-emerald-300`}
                  >
                    <CheckCircle size={22} />
                  </button>
                  <span className={`${task.completed ? 'line-through text-slate-500' : 'text-slate-200'} transition-all`}>
                    {task.text}
                  </span>
                </div>
                <button 
                  onClick={() => deleteTask(task.id)} 
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tasks.length === 0 && (
            <p className="text-center text-slate-600 py-10 italic">No tasks yet. Start with your first move.</p>
          )}
        </div>

        {/* Upsell / CTA Section */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 italic text-center sm:text-left">
            Sign in to sync across devices & export PDF
          </p>
          <button className="flex items-center gap-2 bg-purple-600/20 text-purple-300 px-6 py-2 rounded-full border border-purple-500/30 hover:bg-purple-600/40 transition-all text-sm font-medium whitespace-nowrap">
            Sync Account <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>

      {/* Footer Hint */}
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 flex items-center gap-2 text-slate-600 hover:text-slate-400 transition-colors text-sm"
      >
        <Download size={16} /> Preview Daily Report (PDF)
      </motion.button>
    </div>
  );
}