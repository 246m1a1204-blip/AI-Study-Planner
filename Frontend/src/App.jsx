import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Added for formatting support
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Book, Trash2, Download, Plus, BrainCircuit, X, Timer,
  Sun, Moon, PlayCircle, Lightbulb, ChevronLeft,
  MessageSquare, Send, User, Bot, Layers,
} from "lucide-react";

function App() {
  const [view, setView] = useState("dashboard");
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({ name: "", exam_date: "", difficulty: "Medium" });
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("explain");
  const [modalContent, setModalContent] = useState("");

  const [showFlashcards, setShowFlashcards] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: "bot", content: "Hi Srinu! Em doubt unna adugu, help chestha. 😊" }]);
  const [userQuery, setUserQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { fetchDashboard(); }, []);
  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      alert("Break Time, Srinu!");
      setTimerActive(false);
      setTimeLeft(1500);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const fetchDashboard = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8001/api/subjects/");
      setSubjects(res.data);
    } catch (err) { console.error("Fetch error"); }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userQuery.trim()) return;
    const newMsg = { role: "user", content: userQuery };
    setChatMessages((prev) => [...prev, newMsg]);
    setUserQuery("");
    setIsTyping(true);
    try {
      const res = await axios.post("http://127.0.0.1:8001/api/ask-ai/", { prompt: userQuery });
      setChatMessages((prev) => [...prev, { role: "bot", content: res.data.answer }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "bot", content: "Connection error!" }]);
    } finally { setIsTyping(false); }
  };

  const handleFlashcards = async (taskText) => {
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8001/api/flashcards/", { topic: taskText });
      const rawLines = res.data.flashcards.split("\n").filter((line) => line.includes("|"));
      const parsedCards = rawLines.map((line) => {
        const parts = line.split("|");
        return {
          q: parts[0].replace(/Question: /i, "").trim(),
          a: parts[1].replace(/Answer: /i, "").trim(),
        };
      });
      setFlashcards(parsedCards);
      setCurrentCardIdx(0);
      setIsFlipped(false);
      setShowFlashcards(true);
    } catch (err) { alert("Flashcards error!"); } finally { setLoading(false); }
  };

  const handleAIAction = async (type, taskText) => {
    setModalType(type);
    setModalContent(type === "quiz" ? "## Generating 5+ Deep Questions for you..." : "## Preparing Detailed AI Explanation...");
    setShowModal(true);
    try {
      const endpoint = type === "quiz" ? "/api/quiz/" : "/api/explain/";
      const res = await axios.post(`http://127.0.0.1:8001${endpoint}`, { topic: taskText });
      setModalContent(res.data.content || res.data.explanation || res.data.quiz);
    } catch (err) { setModalContent(`Error fetching ${type}. Check backend.`); }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete cheyala?")) {
      try {
        await axios.delete(`http://127.0.0.1:8001/api/subjects/${id}/delete/`);
        fetchDashboard();
      } catch (err) { alert("Delete failed!"); }
    }
  };

  const toggleComplete = async (index, taskId) => {
    const newPlan = [...currentPlan];
    const newStatus = !newPlan[index].completed;
    try {
      await axios.post(`http://127.0.0.1:8001/api/task/${taskId}/update/`, { completed: newStatus });
      newPlan[index].completed = newStatus;
      setCurrentPlan(newPlan);
      fetchDashboard();
    } catch (err) { alert("Sync failed!"); }
  };

  const viewSubjectPlan = async (sub) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8001/api/subjects/${sub.id}/tasks/`);
      setCurrentPlan(res.data);
      setSelectedSubject(sub.name);
      setView("view-plan");
    } catch (err) { alert("Data fetch failed!"); }
    setLoading(false);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("STUDY.AI ROADMAP", 15, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Date", "Topic", "Status"]],
      body: currentPlan.map((t) => [t.date || "N/A", t.task, t.completed ? "Done" : "Pending"]),
    });
    doc.save(`${selectedSubject}_Plan.pdf`);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className={`${darkMode ? "bg-[#050505] text-slate-200" : "bg-slate-50 text-slate-900"} min-h-screen relative transition-all`}>
      <nav className={`border-b ${darkMode ? "border-white/5 bg-black/80" : "border-slate-200 bg-white"} backdrop-blur-xl sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView("dashboard")}>
            <BrainCircuit size={28} className="text-blue-500" />
            <span className="text-xl font-black uppercase tracking-tight">STUDY.AI</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200"}`}>
              <Timer size={18} className={timerActive ? "animate-pulse text-red-500" : ""} />
              <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
              <button onClick={() => setTimerActive(!timerActive)} className="text-[10px] font-black text-blue-500 uppercase">{timerActive ? "Stop" : "Start"}</button>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-black/10 rounded-full">{darkMode ? <Sun size={22} /> : <Moon size={22} />}</button>
            <button onClick={() => setView("create")} className="bg-blue-600 px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg active:scale-95 transition-all"><Plus size={18} /> New Plan</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {view === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold">Active Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjects.map((sub) => (
                  <div key={sub.id} onClick={() => viewSubjectPlan(sub)} className={`${darkMode ? "bg-[#0f0f12] border-white/5" : "bg-white border-slate-200"} border p-6 rounded-3xl hover:border-blue-500 transition-all cursor-pointer relative group`}>
                    <button onClick={(e) => handleDelete(e, sub.id)} className="absolute top-4 right-4 text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2"><Trash2 size={18} /></button>
                    <div className="bg-blue-500/10 w-fit p-3 rounded-2xl text-blue-400 mb-4"><Book size={20} /></div>
                    <h3 className="text-xl font-bold mb-1">{sub.name}</h3>
                    <p className="text-[10px] opacity-50 mb-4 tracking-widest uppercase">{sub.exam_date}</p>
                    <div className="w-full h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
                      <div style={{ width: `${sub.progress}%` }} className="h-full bg-blue-500 transition-all duration-1000"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className={`${darkMode ? "bg-[#0f0f12] border-white/5" : "bg-white border-slate-200"} border rounded-3xl p-6 shadow-2xl overflow-hidden`}><Calendar className="custom-calendar" /></div>
              <div className={`${darkMode ? "bg-[#0f0f12] border-white/5" : "bg-white border-slate-200"} border rounded-3xl p-6 shadow-2xl`}>
                <h3 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-6 text-center">Learning Progress</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjects}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#ffffff10" : "#00000010"} vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: darkMode ? "#888" : "#444", fontSize: 10 }} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ backgroundColor: darkMode ? "#1a1a1a" : "#fff", borderRadius: "12px", border: "none" }} />
                      <Bar dataKey="progress" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "view-plan" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button onClick={() => setView("dashboard")} className="p-2 hover:bg-white/10 rounded-full"><ChevronLeft size={32} /></button>
                <h2 className="text-4xl font-black uppercase tracking-tighter">{selectedSubject}</h2>
              </div>
              <button onClick={downloadPDF} className="bg-blue-600/10 text-blue-500 px-8 py-4 rounded-2xl border border-blue-500/20 flex items-center gap-2 font-bold hover:bg-blue-600/20"><Download size={20} /> Export PDF</button>
            </div>
            <div className={`${darkMode ? "bg-[#0f0f12] border-white/5" : "bg-white border-slate-200"} rounded-3xl border overflow-hidden shadow-2xl`}>
              <table className="w-full text-left">
                <thead className="bg-blue-500/5">
                  <tr className="border-b border-white/5">
                    <th className="p-6 text-[10px] uppercase font-black text-slate-500 w-20">Done</th>
                    <th className="p-6 text-[10px] uppercase font-black text-slate-500 w-32">Date</th>
                    <th className="p-6 text-[10px] uppercase font-black text-slate-500">Task</th>
                    <th className="p-6 text-right text-[10px] uppercase font-black text-slate-500">AI Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {currentPlan.map((item, i) => (
                    <tr key={i} className={`hover:bg-blue-500/5 transition-all ${item.completed ? "opacity-40" : ""}`}>
                      <td className="p-6"><input type="checkbox" checked={item.completed} onChange={() => toggleComplete(i, item.id)} className="w-6 h-6 accent-blue-600 cursor-pointer" /></td>
                      <td className="p-6 text-sm font-mono font-bold text-blue-400">{item.date}</td>
                      <td className={`p-6 text-sm font-medium ${item.completed ? "line-through text-slate-500" : ""}`}>{item.task}</td>
                      <td className="p-6 text-right flex gap-3 justify-end">
                        <a href={`https://www.youtube.com/results?search_query=${selectedSubject} ${item.task}`} target="_blank" className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:scale-110 transition-all"><PlayCircle size={20} /></a>
                        <button onClick={() => handleFlashcards(item.task)} className="p-2 bg-purple-500/10 text-purple-400 rounded-xl hover:scale-110 transition-all"><Layers size={20} /></button>
                        <button onClick={() => handleAIAction("quiz", item.task)} className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl hover:scale-110 transition-all"><Lightbulb size={20} /></button>
                        <button onClick={() => handleAIAction("explain", item.task)} className="p-2 bg-blue-500/10 text-blue-400 rounded-xl hover:scale-110 transition-all"><BrainCircuit size={20} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "create" && (
          <div className="max-w-md mx-auto py-10">
            <div className={`${darkMode ? "bg-[#0f0f12] border-white/5" : "bg-white border-slate-200"} p-10 rounded-[2.5rem] border shadow-2xl animate-in zoom-in duration-300`}>
              <button onClick={() => setView("dashboard")} className="mb-4 flex items-center gap-1 text-blue-500 text-xs font-bold uppercase"><ChevronLeft size={16} /> Back</button>
              <h2 className="text-2xl font-bold mb-6">Create Roadmap</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  try {
                    const res = await axios.post("http://127.0.0.1:8001/api/generate/", formData);
                    if (res.data.status === "success") {
                      setCurrentPlan(res.data.plan);
                      setSelectedSubject(formData.name);
                      setView("view-plan");
                      fetchDashboard();
                    }
                  } catch (err) { alert("AI Generation failed!"); }
                  setLoading(false);
                }}
                className="space-y-4"
              >
                <input type="text" placeholder="Subject Name" className="w-full bg-slate-500/10 p-4 rounded-xl outline-none" onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <input type="date" className="w-full bg-slate-500/10 p-4 rounded-xl outline-none text-slate-400" min={new Date().toISOString().split("T")[0]} onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })} required />
                <button className="w-full bg-blue-600 py-4 rounded-xl font-bold text-white shadow-lg hover:bg-blue-700 transition-all">{loading ? "Generating..." : "Build Plan"}</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* --- FLASHCARD MODAL --- */}
      {showFlashcards && flashcards.length > 0 && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[120] flex items-center justify-center p-6">
          <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8 text-white">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tighter text-blue-400">Active Recall</h3>
                <p className="text-xs text-slate-400">Card {currentCardIdx + 1} of {flashcards.length}</p>
              </div>
              <button onClick={() => setShowFlashcards(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
            </div>
            <div className="perspective-1000 w-full h-80 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center backface-hidden shadow-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-4 opacity-50">Question</span>
                  <p className="text-xl font-bold text-white">{flashcards[currentCardIdx].q}</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 shadow-2xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-4 opacity-50">Answer</span>
                  <p className="text-lg font-medium text-white leading-relaxed">{flashcards[currentCardIdx].a}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-10 gap-4">
              <button disabled={currentCardIdx === 0} onClick={() => { setCurrentCardIdx((p) => p - 1); setIsFlipped(false); }} className="flex-1 bg-white/5 py-4 rounded-2xl font-bold text-white disabled:opacity-20 hover:bg-white/10 transition-all">Previous</button>
              <button disabled={currentCardIdx === flashcards.length - 1} onClick={() => { setCurrentCardIdx((p) => p + 1); setIsFlipped(false); }} className="flex-1 bg-blue-600 py-4 rounded-2xl font-bold text-white disabled:opacity-20 shadow-lg">Next Card</button>
            </div>
          </div>
        </div>
      )}

      {/* --- AI QUIZ/EXPLAIN MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-4 md:p-8">
          <div className={`${darkMode ? "bg-[#0a0a0c] border-white/10" : "bg-white border-slate-200"} w-full max-w-5xl h-[85vh] rounded-[3rem] border shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden`}>
            
            <div className="flex justify-between items-center p-8 md:px-12 border-b border-white/5 bg-gradient-to-r from-blue-500/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  {modalType === "quiz" ? <Lightbulb size={36} /> : <BrainCircuit size={36} />}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">AI {modalType}</h3>
                  <p className="text-xs text-blue-400 font-bold tracking-widest uppercase">Comprehensive Study Material</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white/10 rounded-full transition-all group">
                <X size={36} className="group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scroll selection:bg-blue-500/30">
              <div className={`${darkMode ? "text-slate-300" : "text-slate-700"} font-medium markdown-container`}>
                {/* --- FIX FOR OPTIONS ALIGNMENT --- */}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {modalContent.replace(/\n/g, '\n\n')}
                </ReactMarkdown>
              </div>
            </div>

            <div className="p-8 md:px-12 border-t border-white/5 bg-black/20">
              <button 
                onClick={() => setShowModal(false)} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-black text-2xl tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI CHATBOT UI */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className={`${darkMode ? "bg-[#0f0f12] border-white/10" : "bg-white border-slate-200"} w-80 md:w-96 h-[500px] border rounded-3xl shadow-2xl mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300`}>
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2"><Bot size={18} /><span className="font-bold text-sm">Ask Study.AI</span></div>
              <button onClick={() => setIsChatOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-none" : darkMode ? "bg-white/5 text-slate-200 rounded-tl-none" : "bg-slate-100 text-slate-800 rounded-tl-none"}`}>{msg.content}</div>
                </div>
              ))}
              {isTyping && <div className="animate-pulse text-xs text-blue-500 px-4">Study.AI is thinking...</div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/5">
              <div className="flex gap-2">
                <input type="text" placeholder="Subject doubts unnaia?" className={`flex-1 ${darkMode ? "bg-white/5" : "bg-slate-100"} p-3 rounded-xl text-sm outline-none`} value={userQuery} onChange={(e) => setUserQuery(e.target.value)} />
                <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl"><Send size={18} /></button>
              </div>
            </form>
          </div>
        )}
        <button onClick={() => setIsChatOpen(!isChatOpen)} className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all">
          {isChatOpen ? <X size={28} /> : <MessageSquare size={28} />}
        </button>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .custom-calendar { width: 100% !important; border: none !important; background: transparent !important; color: ${darkMode ? "white" : "black"} !important; font-family: inherit !important; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }

        /* THE FIX FOR OPTIONS ALIGNMENT */
        .markdown-container {
          white-space: pre-wrap; /* Preservation of newlines */
          word-wrap: break-word;
          font-size: 1.2rem;
          line-height: 1.8;
        }
        .markdown-container h2 {
          color: #3b82f6;
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
          padding-bottom: 0.5rem;
        }
        .markdown-container h3 { color: #fff; font-size: 1.4rem; margin-top: 2rem; margin-bottom: 1rem; }
        .markdown-container p { margin-bottom: 1.2rem; color: ${darkMode ? "#cbd5e1" : "#334155"}; }
        .markdown-container strong { color: #3b82f6; font-weight: 700; }
        .markdown-container ul { margin-bottom: 1.5rem; list-style-type: none; }
        .markdown-container li { margin-bottom: 0.8rem; padding-left: 1rem; border-left: 3px solid #3b82f6; }
      `}</style>
    </div>
  );
}

export default App;