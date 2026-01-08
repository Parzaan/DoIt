import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, ArrowRight, Download, LogOut, User, Search, FolderPlus, GripVertical, X, Eraser } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import CustomCursor from './components/CustomCursor';
import AuthModal from './components/AuthModal';
import { supabase } from './lib/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import confetti from 'canvas-confetti'; // Ensure you've run: npm install canvas-confetti

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsTasksLoading(true);
      if (user) {
        const { data: taskData } = await supabase.from('tasks').select('*').order('position', { ascending: true });
        const { data: catData } = await supabase.from('categories').select('name');
        if (taskData) setTasks(taskData);
        if (catData) {
          const names = catData.map(c => c.name);
          setCustomCategories([...new Set(["Personal", "Work", "Urgent", ...names])]);
        }
      } else {
        setCustomCategories(["Personal", "Work", "Urgent"]);
        setTasks([
          { id: '1', text: "Drag the grip icon to reorder", completed: false, category: "Work", position: 0 },
          { id: '2', text: "Try the search icon above", completed: true, category: "Personal", position: 1 },
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
    if (activeFilter === catName) setActiveFilter("All");
  };

  const toggleTask = async (id) => {
    const target = tasks.find(t => t.id === id);
    const becomingCompleted = !target.completed;
    
    if (user) await supabase.from('tasks').update({ completed: becomingCompleted }).eq('id', id);
    
    // Celebrate with confetti on completion
    if (becomingCompleted) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22d3ee', '#ffffff', '#0891b2']
      });
    }

    setTasks(tasks.map(t => t.id === id ? { ...t, completed: becomingCompleted } : t));
  };

  const deleteTask = async (id) => {
    if (user) await supabase.from('tasks').delete().eq('id', id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  // Logic to remove all completed tasks from DB and state
  const clearCompleted = async () => {
    if (user) {
      await supabase.from('tasks').delete().eq('user_id', user.id).eq('completed', true);
    }
    setTasks(tasks.filter(t => !t.completed));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(5, 5, 5);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
    doc.setDrawColor(8, 145, 178);
    doc.line(14, 25, pageWidth - 14, 25);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("DoIt.", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`PRECISION REPORT: ${user?.email || 'GUEST'}`, 14, 32);
    const tableRows = tasks.map((t, i) => [i + 1, t.text.toUpperCase(), t.category.toUpperCase(), t.completed ? "DONE" : "PENDING"]);
    autoTable(doc, {
      startY: 40,
      head: [['#', 'TASK', 'CATEGORY', 'STATUS']],
      body: tableRows,
      theme: 'plain',
      headStyles: { textColor: [34, 211, 238], fontStyle: 'bold' },
      bodyStyles: { textColor: [200, 200, 200], fillColor: [5, 5, 5] },
      alternateRowStyles: { fillColor: [10, 10, 15] }
    });
    doc.save(`DoIt_Report.pdf`);
  };

  const filteredTasks = tasks.filter(t => 
    t.text.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (activeFilter === "All" || t.category === activeFilter)
  );

  return (
    <>
      <CustomCursor />
      <div className="min-h-screen flex flex-col items-center py-20 px-4">
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

        <AnimatePresence>
          {isCatModalOpen && (
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCatModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm glass rounded-3xl p-8">
                <h3 className="text-xl font-black mb-4 text-white">Create Category</h3>
                <form onSubmit={handleCreateCategory}>
                  <input autoFocus value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Category Name..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 mb-6 outline-none focus:ring-2 focus:ring-cyan-500/50" />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsCatModalOpen(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-slate-400 font-bold uppercase text-xs">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-cyan-500 rounded-xl text-black font-bold uppercase text-xs">Create</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-6xl font-black tracking-tighter bg-linear-to-b from-white to-slate-500 bg-clip-text text-transparent uppercase">DoIt.</h1>
          <p className="text-slate-400 mt-2 tracking-widest uppercase text-xs">Precision Productivity</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl glass rounded-3xl p-8 space-y-6">
          
          <div className="flex justify-between items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                <span>Progress</span>
                <span className="text-cyan-400">{tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%` }} className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]" />
              </div>
            </div>
            
            {/* Actions group: Clear All (Conditional) + Search Toggle */}
            <div className="flex gap-2">
              {tasks.some(t => t.completed) && (
                <button 
                  onClick={clearCompleted} 
                  title="Clear Completed"
                  className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all"
                >
                  <Eraser size={18} />
                </button>
              )}
              <button 
                onClick={() => setShowSearch(!showSearch)} 
                className={`p-2 rounded-xl transition-all ${showSearch ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}
              >
                <Search size={18} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showSearch && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4">
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-cyan-500" />
                <div className="flex gap-3 overflow-x-auto pb-4 pt-4 no-scrollbar px-1">
                  {["All", ...customCategories].map(cat => (
                    <div key={cat} className="relative group/cat shrink-0 flex items-center">
                      <button onClick={() => setActiveFilter(cat)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all whitespace-nowrap ${activeFilter === cat ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10' : 'border-white/5 text-slate-500'}`}>{cat}</button>
                      {!["Personal", "Work", "Urgent"].includes(cat) && (
                        <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat); }} className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 opacity-0 group-hover/cat:opacity-100 bg-red-500 text-white rounded-full p-1 shadow-2xl hover:bg-red-400 transition-all z-30 flex items-center justify-center border-2 border-black">
                          <X size={10} strokeWidth={4} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={addTask} className="space-y-4">
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Next move..." className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-cyan-500/50" />
              <button type="submit" className="bg-white text-black p-4 rounded-2xl transition-transform hover:scale-105"><Plus size={24} /></button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1">
              {customCategories.map(cat => (
                <button key={cat} type="button" onClick={() => setCategory(cat)} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all whitespace-nowrap ${category === cat ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>{cat}</button>
              ))}
              <button type="button" onClick={() => setIsCatModalOpen(true)} className="p-1.5 rounded-full bg-white/5 border border-dashed border-white/20 text-slate-500 hover:text-white transition-all"><FolderPlus size={14} /></button>
            </div>
          </form>

          <div className="relative min-h-[200px]">
            {isTasksLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full" />
              </div>
            ) : (
              <Reorder.Group axis="y" values={tasks} onReorder={handleReorder} className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task) => (
                    <Reorder.Item 
                      key={task.id} value={task} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="task-item group flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical size={16} className="text-slate-700 cursor-grab group-hover:text-slate-400" />
                        <button 
                          onClick={() => toggleTask(task.id)} 
                          className={`${task.completed ? 'text-emerald-400' : 'text-slate-600'} transition-colors relative`}
                        >
                          <motion.div
                            whileHover={{ scale: 1.3, rotate: 10 }}
                            whileTap={{ scale: 0.8, rotate: -20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <CheckCircle size={22} />
                          </motion.div>
                          {task.completed && (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1.5, opacity: 0 }}
                              className="absolute inset-0 bg-emerald-400/50 rounded-full"
                            />
                          )}
                        </button>
                        <div className="flex flex-col">
                          <span className={`${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.text}</span>
                          <span className={`text-[8px] w-fit mt-1 px-2 py-0.5 rounded-full uppercase font-bold border ${task.category === 'Urgent' ? 'border-red-500 text-red-400 bg-red-500/10' : task.category === 'Work' ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-slate-500 text-slate-400 bg-white/5'}`}>{task.category || 'General'}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition-all"><Trash2 size={18} /></button>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
            {!isTasksLoading && filteredTasks.length === 0 && <p className="text-center text-slate-600 py-10 italic">No tasks found.</p>}
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30"><User size={16} /></div>
                  <p className="text-sm text-slate-300 truncate max-w-[150px]">{user.email}</p>
                </div>
                <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 bg-white/5 text-slate-400 px-4 py-2 rounded-full border border-white/10 hover:bg-red-500/10 hover:text-red-400 text-xs font-medium transition-all">Sign Out <LogOut size={14} /></button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500 italic">Sign in to sync & export</p>
                <button onClick={() => setIsAuthOpen(true)} className="flex items-center gap-2 bg-cyan-600/20 text-cyan-300 px-6 py-2 rounded-full border border-cyan-500/30 hover:bg-cyan-600/40 text-sm font-medium transition-all">Sync Account <ArrowRight size={16} /></button>
              </>
            )}
          </div>
        </motion.div>

        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          onClick={() => !user ? setIsAuthOpen(true) : exportToPDF()}
          className="mt-8 flex items-center gap-2 text-slate-600 hover:text-cyan-400 transition-colors text-sm"
        >
          <Download size={16} /> {user ? "Download Daily Report (PDF)" : "Preview Daily Report (PDF)"}
        </motion.button>
      </div>
    </>
  );
}