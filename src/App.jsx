import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, ArrowRight, Download, LogOut, User, Search, FolderPlus, GripVertical, X, Eraser, Check, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import CustomCursor from './components/CustomCursor';
import AuthModal from './components/AuthModal';
import { supabase } from './lib/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import confetti from 'canvas-confetti';
import Logo from './components/Logo';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("Personal");
  const [customCategories, setCustomCategories] = useState(["Personal", "Work", "Urgent"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showSearch, setShowSearch] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    const timer = setTimeout(() => setIsLaunching(false), 2000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsTasksLoading(true);
      if (user) {
        const { data: taskData } = await supabase.from('tasks').select('*').order('position', { ascending: true });
        const { data: catData } = await supabase.from('categories').select('name');
        if (taskData) setTasks(taskData);
        if (catData) setCustomCategories([...new Set(["Personal", "Work", "Urgent", ...catData.map(c => c.name)])]);
      } else {
        setCustomCategories(["Personal", "Work", "Urgent"]);
        setTasks([
          { id: '1', text: "Complete a task", completed: false, category: "Work", position: 0 },
          { id: '2', text: "Drag to reorder", completed: true, category: "Personal", position: 1 },
          { id: '3', text: "Sign in to sync your tasks", completed: false, category: "Urgent", position: 2 },
          { id: '4', text: "Download today's report", completed: false, category: "Urgent", position: 3 },
        ]);
      }
      setIsTasksLoading(false);
    };
    fetchData();
  }, [user]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newTaskBase = { text: input, completed: false, category: category, position: tasks.length };
    if (user) {
      const { data } = await supabase.from('tasks').insert([{ ...newTaskBase, user_id: user.id }]).select();
      if (data) setTasks([...tasks, data[0]]);
    } else {
      setTasks([...tasks, { id: Date.now().toString(), ...newTaskBase }]);
    }
    setInput("");
  };

  const handleReorder = async (newOrder) => {
    setTasks(newOrder);
    if (user) {
      const updates = newOrder.map((task, index) => ({
        id: task.id, user_id: user.id, text: task.text, category: task.category, completed: task.completed, position: index
      }));
      await supabase.from('tasks').upsert(updates);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName || customCategories.includes(newCatName)) return;
    if (user) await supabase.from('categories').insert([{ name: newCatName, user_id: user.id }]);
    setCustomCategories([...new Set([...customCategories, newCatName])]);
    setCategory(newCatName);
    setNewCatName("");
    setIsCatModalOpen(false);
  };

  const deleteCategory = async (catName) => {
    if (["Personal", "Work", "Urgent"].includes(catName)) return;
    if (user) await supabase.from('categories').delete().eq('name', catName).eq('user_id', user.id);
    setCustomCategories(customCategories.filter(c => c !== catName));
    if (category === catName) setCategory("Personal");
  };

  const toggleTask = async (id) => {
    const target = tasks.find(t => t.id === id);
    const becomingCompleted = !target.completed;
    if (user) await supabase.from('tasks').update({ completed: becomingCompleted }).eq('id', id);
    if (becomingCompleted) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#22d3ee', '#ffffff', '#0891b2'] });
    }
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: becomingCompleted } : t));
  };

  const deleteTask = async (id) => {
    if (user) await supabase.from('tasks').delete().eq('id', id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const clearCompleted = async () => {
    if (user) await supabase.from('tasks').delete().eq('user_id', user.id).eq('completed', true);
    setTasks(tasks.filter(t => !t.completed));
    setShowClearConfirm(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(5, 5, 5);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setDrawColor(34, 211, 238);
    doc.line(14, 25, 196, 25);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("DoIt.", 14, 20);
    const tableRows = tasks.map((t, i) => [i + 1, t.text.toUpperCase(), t.category.toUpperCase(), t.completed ? "DONE" : "PENDING"]);
    autoTable(doc, {
      startY: 40,
      head: [['#', 'TASK', 'CATEGORY', 'STATUS']],
      body: tableRows,
      theme: 'plain',
      headStyles: { textColor: [34, 211, 238], fontStyle: 'bold' },
      bodyStyles: { textColor: [200, 200, 200], fillColor: [5, 5, 5] },
    });
    doc.save(`DoIt_Report.pdf`);
  };

  const filteredTasks = tasks.filter(t => 
    t.text.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (activeFilter === "All" || t.category === activeFilter)
  );

  const categoryColors = {
    Urgent: "text-red-400 bg-red-400/10 border-red-400/20",
    Work: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    Personal: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20",
    Default: "text-slate-300 bg-slate-300/10 border-slate-300/30"  // Improved Grey/Silver
  };

  return (
    <>
      <CustomCursor />
      
      {/* 1. SPLASH SCREEN (Z-Index fix to prevent popping behind search) */}
      <AnimatePresence>
        {isLaunching && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100000 bg-[#0b0c14] flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.8, ease: "anticipate" }}
            >
              <Logo size={120} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen flex flex-col items-center pt-6 pb-20 px-4 md:pt-16">
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

        {/* 2. HEADER SECTION */}
        <div className="w-full max-w-xl flex justify-between items-center mb-6 md:mb-10 px-1">
          <div className="flex items-center gap-4">
            <Logo size={36} /> 
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter bg-linear-to-b from-white to-slate-500 bg-clip-text text-transparent">
                DoIt.
              </h1>
              <p className="text-slate-500 uppercase text-[7px] md:text-[10px] tracking-[0.15em] leading-none mt-1">
                Precision Productivity
              </p>
            </div>
          </div>
          <div>
            {user ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-full pl-3">
                <span className="hidden sm:inline text-[10px] text-slate-400 font-bold uppercase truncate max-w-20">{user.email.split('@')[0]}</span>
                <button onClick={() => supabase.auth.signOut()} className="bg-white/10 p-1.5 rounded-full hover:bg-red-500/20 text-slate-400 transition-all"><LogOut size={14}/></button>
              </div>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 bg-cyan-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                <User size={12}/> Sync
              </button>
            )}
          </div>
        </div>

        {/* 3. SEARCH & FILTER (Now properly positioned) */}
        <div className="w-full max-w-xl isolate">
          <AnimatePresence>
            {showSearch && (
              <motion.div 
                initial={{ height: 0, opacity: 0, y: -10 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -10 }}
                className="overflow-hidden mb-6"
              >
                <div className="glass rounded-3xl p-4 space-y-4 border border-white/10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] uppercase tracking-widest text-slate-500 font-bold px-1">Filters</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setActiveFilter("All")} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all ${activeFilter === "All" ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>All</button>
                      {customCategories.map(cat => (
                        <div key={cat} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
                          <button onClick={() => setActiveFilter(cat)} className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-all ${activeFilter === cat ? 'text-cyan-400' : 'text-slate-400'}`}>{cat}</button>
                          {!["Personal", "Work", "Urgent"].includes(cat) && (
                            <button onClick={() => deleteCategory(cat)} className="text-slate-600 hover:text-red-400 px-1"><X size={10} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. MAIN CARD */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl glass rounded-[2.5rem] p-4 sm:p-6 md:p-8 space-y-5 isolate">
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1 space-y-1.5">
              <div className="flex justify-between text-[8px] md:text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">
                <span>Progress</span>
                <span className="text-cyan-400">{tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }} className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <AnimatePresence mode="wait">
                {tasks.some(t => t.completed) && (
                  !showClearConfirm ? (
                    <motion.button key="eraser" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => setShowClearConfirm(true)} className="p-1.5 sm:p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 transition-all"><Eraser size={16} /></motion.button>
                  ) : (
                    <motion.div key="confirm" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-0.5 overflow-hidden">
                      <button onClick={clearCompleted} className="p-1.5 text-emerald-400 rounded-lg"><Check size={14}/></button>
                      <button onClick={() => setShowClearConfirm(false)} className="p-1.5 text-slate-500 rounded-lg"><RotateCcw size={14}/></button>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
              <button onClick={() => setShowSearch(!showSearch)} className={`p-1.5 sm:p-2 rounded-xl transition-all ${showSearch ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}><Search size={16} /></button>
            </div>
          </div>

          <form onSubmit={addTask} className="space-y-3">
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="What's your next plan..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-cyan-500/50" />
              <button type="submit" className="bg-white text-black p-3 rounded-2xl transition-transform hover:scale-105 active:scale-95"><Plus size={20} /></button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {customCategories.map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)} className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase border transition-all whitespace-nowrap ${category === cat ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>{cat}</button>
              ))}
              <button type="button" onClick={() => setIsCatModalOpen(true)} className="p-1.5 rounded-full bg-white/5 border border-dashed border-white/20 text-slate-500"><FolderPlus size={14} /></button>
            </div>
          </form>

          <div className="relative min-h-37.5">
            {isTasksLoading ? (
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" /></div>
            ) : (
              <Reorder.Group axis="y" values={tasks} onReorder={handleReorder} className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task) => (
                    <Reorder.Item key={task.id} value={task} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="task-item group flex items-center justify-between bg-white/5 p-3.5 sm:p-4 rounded-2xl border border-white/5 active:bg-white/10 transition-all isolate">
                      <div className="flex items-center gap-3 min-w-0">
                        <GripVertical size={14} className="text-slate-700 cursor-grab shrink-0" />
                        <button 
                          onClick={() => toggleTask(task.id)} 
                          className={`shrink-0 relative transition-colors duration-300 ${
                            task.completed ? 'text-emerald-400' : 'text-slate-700 hover:text-cyan-400'
                          }`}
                        >
                          <motion.div 
                            initial={{ scale: 1.1, rotate: 0 }} 
                            whileHover={{ 
                              scale: 1.4, 
                              rotate: 12, // The mechanical "lean"
                              transition: { type: "spring", stiffness: 400, damping: 12 } 
                            }} 
                            whileTap={{ 
                              scale: 0.9, 
                              rotate: 0 // Snaps straight on click
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <CheckCircle 
                              size={20} 
                              className={task.completed ? "text-emerald-400" : ""} 
                            /> 
                          </motion.div>

                          {/* Success Pulse Animation */}
                          <AnimatePresence>
                            {task.completed && (
                              <motion.div 
                                initial={{ scale: 0, opacity: 0.8 }} 
                                animate={{ scale: 2.5, opacity: 0 }} 
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-emerald-400/50 rounded-full pointer-events-none" 
                              />
                            )}
                          </AnimatePresence>
                        </button>
                        <div className="flex flex-col min-w-0">
                          <span className={`${task.completed ? 'line-through text-slate-500' : 'text-slate-200'} truncate text-xs sm:text-sm`}>{task.text}</span>
                          <div className="mt-1"> 
                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${categoryColors[task.category] || categoryColors.Default}`}>
                              {task.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="text-slate-700 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </div>
        </motion.div>

        {/* 5. FOOTER BUTTON */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => !user ? setIsAuthOpen(true) : exportToPDF()} className="mt-8 flex items-center gap-2 text-slate-600 hover:text-cyan-400 text-[9px] font-bold uppercase tracking-[0.2em]">
          <Download size={14} /> Daily Report (PDF)
        </motion.button>

        {/* 6. MODALS */}
        <AnimatePresence>
          {isCatModalOpen && (
            <div className="fixed inset-0 z-100001 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass p-6 rounded-4xl border border-white/10 w-full max-w-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-black uppercase text-xs tracking-widest">New Category</h3>
                  <button onClick={() => setIsCatModalOpen(false)}><X size={16} className="text-slate-500" /></button>
                </div>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <input autoFocus value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Category Name..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-cyan-500" />
                  <button type="submit" className="w-full bg-cyan-500 text-black py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Create</button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}