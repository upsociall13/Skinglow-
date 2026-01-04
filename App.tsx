
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Play, Sparkles, Loader2, RefreshCw, Camera, Upload, Trash2, 
  Wand2, ChevronRight, Info, X, Check, RotateCcw, Image as ImageIcon, 
  Moon, Sun, ClipboardList, Mic, MessageSquare, Video, Layout, ShoppingBag, Star,
  Plus, Calendar as CalendarIcon, Smile, Meh, Frown, BookOpen, ExternalLink, ArrowRight,
  Filter, Search, Bell, BellRing, Clock, ShoppingCart, Heart, Droplets, Zap, Shield, Waves,
  Camera as CameraIcon, X as CloseIcon, Share2, LogOut, Mail, GripVertical, Send
} from 'lucide-react';
import { AppView, RoutineStep, DiaryEntry, ReminderSettings, User } from './types';
import RoutineCard from './components/RoutineCard';
import BottomNav from './components/BottomNav';
import { 
  getSkinAdvice, editImageWithGemini, generateSkinVideo, 
  generateProductImage, startLiveAssistant, expertChat 
} from './services/geminiService';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

// Moved MetricItem to top level
const MetricItem = ({ label, value, icon: Icon, color, isDarkMode }: any) => (
  <div className="flex flex-col space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1.5"><Icon size={12} className="text-gray-400"/><span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{label}</span></div>
      <span className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>{value}%</span>
    </div>
    <div className={`h-1.5 w-full rounded-full overflow-hidden transition-colors ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div className={`h-full rounded-full transition-all duration-1000 ${color === 'blue' ? 'bg-blue-500' : color === 'yellow' ? 'bg-yellow-500' : color === 'red' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

// Moved AIModal to top level to avoid re-creation on every render
const AIModal = ({ type, onClose, isDarkMode, messages, onSendMessage, input, setInput, isLoading }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-md h-[80vh] flex flex-col rounded-[32px] overflow-hidden transition-all shadow-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-800' : 'border-gray-50'}`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#D4C4A8]/20 rounded-xl text-[#D4C4A8]">
              {type === 'chat' ? <MessageSquare size={20} /> : <Sparkles size={20} />}
            </div>
            <div>
              <h2 className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>{type} Assistant</h2>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-gray-400 font-bold uppercase">Expert Online</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-50 text-gray-400'}`}><X size={20}/></button>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
              <MessageSquare size={48} className="text-[#D4C4A8]" />
              <p className="text-sm px-10">Ask me anything about your routine or skin analysis results.</p>
            </div>
          )}
          
          {messages.map((m: ChatMessage, idx: number) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-[#D4C4A8] text-white rounded-tr-none shadow-md font-medium' 
                  : (isDarkMode ? 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700' : 'bg-[#FDFBF7] text-gray-600 rounded-tl-none border border-gray-100 shadow-sm')
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className={`p-4 rounded-2xl rounded-tl-none text-sm italic ${isDarkMode ? 'bg-gray-800 text-gray-500' : 'bg-gray-50 text-gray-400'}`}>
                Gemini is reasoning...
              </div>
            </div>
          )}
        </div>

        <div className={`p-5 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-50'}`}>
          <div className="relative">
            <input 
              type="text"
              placeholder="Ask about your skin..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
              className={`w-full pl-5 pr-14 py-4 rounded-2xl text-sm border-none focus:ring-2 focus:ring-[#D4C4A8] transition-all ${isDarkMode ? 'bg-gray-800 text-white placeholder-gray-600' : 'bg-[#FDFBF7] text-[#2E2A25] placeholder-gray-400 shadow-inner'}`}
            />
            <button 
              onClick={() => onSendMessage()}
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 top-2 p-2.5 rounded-xl transition-all ${input.trim() && !isLoading ? 'bg-[#D4C4A8] text-white shadow-lg scale-100 active:scale-90' : 'bg-gray-100 text-gray-300 scale-90'}`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.AUTH);
  const [showSplash, setShowSplash] = useState(true);
  const [isAM, setIsAM] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('skinwise_darkmode') === 'true';
  });
  const [showAIHub, setShowAIHub] = useState(false);
  const [activeAIModal, setActiveAIModal] = useState<'chat' | 'voice' | 'creative' | null>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  const [reminders, setReminders] = useState<ReminderSettings>({
    amEnabled: false,
    amTime: "08:00",
    amDays: [1, 2, 3, 4, 5],
    pmEnabled: false,
    pmTime: "21:00",
    pmDays: [1, 2, 3, 4, 5]
  });

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([
    { id: '1', date: 'Oct 24, 2024', note: 'Skin felt a bit dry this morning after using the new serum.', mood: 'meh' },
    { id: '2', date: 'Oct 23, 2024', note: 'Woke up with a glow! The night repair cream is really working.', mood: 'smile' }
  ]);
  const [newDiaryNote, setNewDiaryNote] = useState("");
  const [newDiaryMood, setNewDiaryMood] = useState("smile");
  const [isDiaryAdding, setIsDiaryAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [amRoutine, setAmRoutine] = useState<RoutineStep[]>([]);
  const [pmRoutine, setPmRoutine] = useState<RoutineStep[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('skinwise_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentView(AppView.ANALYSIS);
    }
    const savedReminders = localStorage.getItem('skinwise_reminders_v2');
    if (savedReminders) setReminders(JSON.parse(savedReminders));

    const checkKey = async () => {
      const anyWindow = window as any;
      if (anyWindow.aistudio && typeof anyWindow.aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await anyWindow.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('skinwise_darkmode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('skinwise_reminders_v2', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('skinwise_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('skinwise_user');
    }
  }, [currentUser]);

  const handleOpenKey = async () => {
    const anyWindow = window as any;
    if (anyWindow.aistudio && typeof anyWindow.aistudio.openSelectKey === 'function') {
      await anyWindow.aistudio.openSelectKey();
      setHasApiKey(true); 
    }
  };

  const handleGoogleLogin = () => {
    setIsAuthLoading(true);
    setTimeout(() => {
      const mockUser: User = {
        name: "Sarah Miller",
        email: "sarah.m@gmail.com",
        photo: "https://picsum.photos/seed/sarah/200/200"
      };
      setCurrentUser(mockUser);
      setCurrentView(AppView.ANALYSIS);
      setIsAuthLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(AppView.AUTH);
  };

  const toggleStep = (id: string) => {
    const update = (list: RoutineStep[]) => 
      list.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    if (isAM) setAmRoutine(update);
    else setPmRoutine(update);
  };

  const onDragStart = (index: number) => setDraggedItemIndex(index);
  const onDragEnter = (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const routine = isAM ? [...amRoutine] : [...pmRoutine];
    const draggedItem = routine[draggedItemIndex];
    routine.splice(draggedItemIndex, 1);
    routine.splice(index, 0, draggedItem);
    setDraggedItemIndex(index);
    if (isAM) setAmRoutine(routine); else setPmRoutine(routine);
  };
  const onDragEnd = () => setDraggedItemIndex(null);

  const handleAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await getSkinAdvice(analysisText, selectedImage);
      setAiAnalysis(result);
      setAmRoutine(result.amRoutine.map((s: any, i: number) => ({ ...s, id: `am-${i}`, completed: false })));
      setPmRoutine(result.pmRoutine.map((s: any, i: number) => ({ ...s, id: `pm-${i}`, completed: false })));
      setChatMessages([{
        role: 'ai',
        text: `Analysis complete! I've noted some ${result.concerns.join(' and ')} concerns. Your hydration is at ${result.skinMetrics.hydration}%. Do you have any questions about these results or your new routine?`
      }]);
    } catch (e: any) {
      if (e?.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        const anyWindow = window as any;
        if (anyWindow.aistudio) await anyWindow.aistudio.openSelectKey();
      }
      console.error("Analysis error:", e);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || chatInput;
    if (!textToSend.trim() || isChatLoading) return;
    const userMsg: ChatMessage = { role: 'user', text: textToSend };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);
    try {
      const context = aiAnalysis ? `Context: Latest skin analysis shows hydration ${aiAnalysis.skinMetrics.hydration}%, oiliness ${aiAnalysis.skinMetrics.oiliness}%, smoothness ${aiAnalysis.skinMetrics.texture}%. Concerns: ${aiAnalysis.concerns.join(', ')}.\n` : "";
      const history = chatMessages.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.text}`).join("\n");
      const fullPrompt = `${context}\n${history}\nUSER: ${textToSend}`;
      const response = await expertChat(fullPrompt);
      setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "I'm sorry, I'm having trouble connecting to my reasoning engine. Please try again in a moment." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleShare = async () => {
    if (!aiAnalysis) return;
    const shareText = `✨ SkinWise Expert Report ✨\n\nExpert Summary: ${aiAnalysis.analysis}\n\nSkin Profile:\n- Hydration: ${aiAnalysis.skinMetrics.hydration}%\n- Smoothness: ${aiAnalysis.skinMetrics.texture}%\n- Sensitivity: ${aiAnalysis.skinMetrics.sensitivity}%\n- Balanced: ${aiAnalysis.skinMetrics.oiliness}%\n\nConcerns Identified: ${aiAnalysis.concerns.join(', ')}\n\nReport generated by SkinWise AI.`;
    const shareData = { title: 'SkinWise Analysis Report', text: shareText, url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}`);
        triggerToast();
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') console.error('Error sharing:', err);
    }
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Could not access camera.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      setSelectedImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGetSkinRoutine = () => {
    setIsAM(new Date().getHours() >= 5 && new Date().getHours() < 17);
    setCurrentView(AppView.ROUTINE);
    window.scrollTo(0, 0);
  };

  const handleAddDiaryEntry = () => {
    if (!newDiaryNote.trim()) return;
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      note: newDiaryNote,
      mood: newDiaryMood
    };
    setDiaryEntries([newEntry, ...diaryEntries]);
    setNewDiaryNote("");
    setIsDiaryAdding(false);
  };

  // Render Helpers
  const renderHeader = () => (
    <header className={`px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md transition-colors ${isDarkMode ? 'bg-[#1A1816]/80 text-white' : 'bg-[#FDFBF7]/80 text-[#2E2A25]'}`}>
      <div className="flex items-center space-x-2">
        <Sparkles className="text-[#D4C4A8]" size={24} />
        <h1 className="serif text-2xl font-bold">SkinWise</h1>
      </div>
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-400 shadow-sm'}`}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button onClick={handleShare} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-gray-800 text-[#D4C4A8]' : 'bg-white text-[#D4C4A8] shadow-sm'}`}>
          <Share2 size={20} />
        </button>
        <button onClick={handleLogout} className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-gray-800 text-red-400' : 'bg-white text-red-400 shadow-sm'}`}>
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );

  const renderAuth = () => (
    <div className={`min-h-screen flex flex-col px-8 relative overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#1A1816]' : 'bg-[#FDFBF7]'}`}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute -top-20 -right-20 w-96 h-96 rounded-full blur-[120px] ${isDarkMode ? 'bg-[#D4C4A8]/10' : 'bg-[#EAE2D6]/40'}`} />
        <div className={`absolute bottom-20 -left-20 w-80 h-80 rounded-full blur-[100px] ${isDarkMode ? 'bg-[#D4C4A8]/5' : 'bg-[#F5E6D3]/30'}`} />
      </div>
      <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10 pt-20">
        <div className={`p-5 rounded-full mb-8 animate-in fade-in zoom-in duration-700 ${isDarkMode ? 'bg-gray-800/50' : 'bg-[#D4C4A8]/20'}`}>
          <Sparkles size={64} className="text-[#D4C4A8]" />
        </div>
        <h1 className={`serif text-6xl mb-4 transition-colors ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>SkinWise</h1>
        <p className={`text-lg max-w-[280px] leading-relaxed transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Your personalized journey to radiant, healthy skin starts here.
        </p>
      </div>
      <div className="pb-24 relative z-10 w-full max-sm mx-auto space-y-4 animate-in slide-in-from-bottom-10 duration-500">
        <button 
          onClick={handleGoogleLogin}
          disabled={isAuthLoading}
          className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-4 shadow-xl transition-all active:scale-95 border ${
            isDarkMode ? 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100' : 'bg-white text-gray-900 border-gray-200 hover:shadow-2xl'
          }`}
        >
          {isAuthLoading ? (
            <Loader2 className="animate-spin text-blue-500" />
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span className="font-bold text-sm">Continue with Google</span>
        </button>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="relative min-h-screen px-6 pt-4 pb-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px] ${isDarkMode ? 'bg-[#D4C4A8]/10' : 'bg-[#D4C4A8]/20'}`} />
        <div className={`absolute top-1/2 -right-20 w-96 h-96 rounded-full blur-[120px] ${isDarkMode ? 'bg-[#2E2A25]/30' : 'bg-[#EAE2D6]/40'}`} />
      </div>

      <div className="relative z-10">
        <div className="mb-6">
          <h2 className={`serif text-4xl mb-2 ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>Skin Analysis</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hello, {currentUser?.name.split(' ')[0]}. Let AI analyze your skin.</p>
        </div>

        {!aiAnalysis ? (
          <div className={`p-6 rounded-3xl border backdrop-blur-sm transition-colors ${isDarkMode ? 'bg-gray-900/80 border-gray-800 shadow-2xl' : 'bg-white/70 border-gray-100'}`}>
            {!selectedImage ? (
              <div className="grid grid-cols-1 gap-4 mb-6">
                <button 
                  onClick={startCamera}
                  className={`py-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all hover:bg-[#D4C4A8]/10 group ${isDarkMode ? 'border-gray-700 text-gray-500 hover:border-[#D4C4A8]' : 'border-[#D4C4A8] text-[#D4C4A8]'}`}
                >
                  <div className={`p-4 rounded-full mb-3 group-hover:scale-110 transition-transform ${isDarkMode ? 'bg-gray-800' : 'bg-[#D4C4A8]/20'}`}>
                    <CameraIcon size={32} />
                  </div>
                  <span className="font-black text-sm uppercase tracking-widest">Scan Face</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`py-5 rounded-2xl border-2 border-dashed flex items-center justify-center space-x-3 transition-all hover:bg-[#D4C4A8]/5 group ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-[#EAE2D6] text-gray-400'}`}
                >
                  <Upload size={20} />
                  <span className="font-bold text-sm uppercase tracking-wider">Upload Photo</span>
                </button>
              </div>
            ) : (
              <div className={`relative mb-6 rounded-3xl overflow-hidden shadow-2xl border-4 transition-all duration-500 animate-in zoom-in-95 ${isDarkMode ? 'border-gray-800' : 'border-white'}`}>
                <img src={selectedImage} alt="Preview" className="w-full h-64 object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex justify-between items-end">
                   <button onClick={() => setSelectedImage(null)} className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-xl transition-all active:scale-90"><Trash2 size={20} /></button>
                </div>
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            <textarea 
              className={`w-full h-32 p-4 rounded-2xl border-none focus:ring-2 focus:ring-[#D4C4A8] text-sm resize-none mb-4 transition-colors ${isDarkMode ? 'bg-gray-800 text-white placeholder-gray-600' : 'bg-[#FDFBF7]/80'}`}
              placeholder="Describe any skin concerns (optional)..."
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
            />
            <button 
              onClick={handleAnalysis} 
              disabled={isLoading} 
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center space-x-3 transition-all ${isLoading ? 'bg-gray-200 text-gray-400' : 'bg-[#2E2A25] dark:bg-[#D4C4A8] text-white dark:text-gray-900 shadow-xl active:scale-[0.98]'}`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              <span>{isLoading ? 'Scanning Skin...' : 'Generate Expert Report'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {selectedImage && (
              <div className={`p-1 rounded-[32px] border transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-xl' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="relative aspect-video rounded-[28px] overflow-hidden">
                   <img src={selectedImage} alt="Analyzed Skin" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div className={`p-6 rounded-3xl border backdrop-blur-md transition-colors ${isDarkMode ? 'bg-gray-900/80 border-gray-800 shadow-xl' : 'bg-white/80 border-gray-100'}`}>
               <div className="grid grid-cols-2 gap-6 mb-6">
                  <MetricItem label="Hydration" value={aiAnalysis.skinMetrics.hydration} icon={Droplets} color="blue" isDarkMode={isDarkMode} />
                  <MetricItem label="Oil Level" value={aiAnalysis.skinMetrics.oiliness} icon={Zap} color="yellow" isDarkMode={isDarkMode} />
                  <MetricItem label="Sensitivity" value={aiAnalysis.skinMetrics.sensitivity} icon={Shield} color="red" isDarkMode={isDarkMode} />
                  <MetricItem label="Smoothness" value={aiAnalysis.skinMetrics.texture} icon={Waves} color="green" isDarkMode={isDarkMode} />
               </div>
            </div>
            <div className={`p-8 rounded-3xl border transition-colors ${isDarkMode ? 'bg-gray-900/80 border-gray-800 shadow-xl' : 'bg-white/80 border-gray-100'}`}>
               <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{aiAnalysis.analysis}</p>
            </div>
            <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-gray-900/40 border-gray-800' : 'bg-[#EAE2D6]/20 border-[#D4C4A8]/20'}`}>
              <div ref={chatScrollRef} className="max-h-[300px] overflow-y-auto mb-4 space-y-3 pr-2 custom-scrollbar">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-[#D4C4A8] text-white rounded-tr-none' : (isDarkMode ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-white text-gray-600 border border-gray-100 shadow-sm')}`}>{msg.text}</div>
                  </div>
                ))}
              </div>
              <div className="relative">
                <input type="text" placeholder="Ask about your report..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className={`w-full pl-4 pr-12 py-3.5 rounded-2xl text-xs border-none focus:ring-2 focus:ring-[#D4C4A8] transition-all ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-[#2E2A25] shadow-inner'}`} />
                <button onClick={() => handleSendMessage()} disabled={!chatInput.trim() || isChatLoading} className="absolute right-2 top-2 p-2 text-[#D4C4A8]"><Send size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={handleGetSkinRoutine} className="w-full py-5 bg-[#2E2A25] dark:bg-[#D4C4A8] text-white dark:text-gray-900 rounded-2xl flex items-center justify-center space-x-3 shadow-xl active:scale-95 transition-all"><Sparkles size={20}/><span>Get Skin Routine</span></button>
            </div>
            <button onClick={() => { setAiAnalysis(null); setChatMessages([]); }} className="w-full py-4 border-2 border-dashed rounded-2xl text-sm font-semibold text-gray-400 border-gray-200 dark:border-gray-800 hover:text-gray-500 transition-colors">Restart Analysis</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderRoutine = () => (
    <div className="px-6 pt-4 pb-40">
      <div className={`mt-6 flex p-1.5 rounded-2xl transition-colors ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-[#EAE2D6]/40'}`}>
        <button onClick={() => setIsAM(true)} className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${isAM ? 'bg-white shadow text-[#2E2A25]' : (isDarkMode ? 'text-gray-600' : 'text-gray-500')}`}>AM</button>
        <button onClick={() => setIsAM(false)} className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${!isAM ? 'bg-white shadow text-[#2E2A25]' : (isDarkMode ? 'text-gray-600' : 'text-gray-500')}`}>PM</button>
      </div>
      <div className="mt-8 space-y-4">
        {(isAM ? amRoutine : pmRoutine).map((step, index) => (
          <RoutineCard key={step.id} step={step} index={index} onToggle={toggleStep} isDarkMode={isDarkMode} onDragStart={onDragStart} onDragEnter={onDragEnter} onDragEnd={onDragEnd} isDragging={draggedItemIndex === index} />
        ))}
        <button onClick={() => setCurrentView(AppView.SHOP)} className={`w-full p-6 rounded-3xl border-2 border-dashed flex items-center justify-between transition-all ${isDarkMode ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-[#D4C4A8]/30 shadow-sm hover:shadow-xl'}`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-[#D4C4A8]/10'} text-[#D4C4A8]`}><Sparkles size={24} /></div>
            <div className="text-left"><h4 className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>Skincare Suggestions</h4><p className="text-xs text-gray-400">Products for your skin type</p></div>
          </div>
          <ArrowRight size={20} className="text-[#D4C4A8]" />
        </button>
      </div>
    </div>
  );

  const renderShop = () => (
    <div className="px-6 pt-4 pb-32">
      <h2 className={`serif text-4xl mb-8 ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>Curated Shop</h2>
      {aiAnalysis?.productRecommendations ? (
        <div className="grid grid-cols-1 gap-8">
          {aiAnalysis.productRecommendations.map((product: any, idx: number) => (
            <div key={idx} onClick={() => setSelectedProductForDetail(product)} className={`p-5 rounded-[32px] border cursor-pointer active:scale-[0.98] transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-xl' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="aspect-[4/3] rounded-[24px] mb-5 overflow-hidden relative bg-gray-50">
                <img src={`https://picsum.photos/seed/${product.imageSeed}/600/450`} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <h3 className={`font-bold text-xl mb-2 ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>{product.name}</h3>
              <p className="text-xs text-gray-500 mb-4">{product.matchReason}</p>
              <div className="flex items-center justify-between"><span className="text-lg font-black text-[#D4C4A8]">{product.price}</span><button className="px-6 py-3 bg-[#D4C4A8] text-gray-900 rounded-2xl font-black text-xs uppercase"><ShoppingBag size={14} /></button></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center text-gray-400">Analyze your skin to see products.</div>
      )}
      {selectedProductForDetail && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col p-8">
          <button onClick={() => setSelectedProductForDetail(null)} className="self-end p-2 bg-white/10 rounded-full text-white mb-4"><X /></button>
          <div className={`p-8 rounded-[40px] flex-1 overflow-auto ${isDarkMode ? 'bg-[#1A1816]' : 'bg-white'}`}>
            <h2 className="serif text-3xl mb-4">{selectedProductForDetail.name}</h2>
            <p className="text-sm leading-relaxed mb-6">{selectedProductForDetail.description}</p>
            <button className="w-full py-4 bg-[#D4C4A8] text-gray-900 rounded-2xl font-black uppercase">Buy Now - {selectedProductForDetail.price}</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderDiary = () => (
    <div className="px-6 pt-4 pb-32">
      <h2 className={`serif text-4xl mb-6 ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>Skin Diary</h2>
      <button onClick={() => setIsDiaryAdding(true)} className="w-full py-4 mb-8 border-2 border-dashed rounded-2xl text-[#D4C4A8] font-bold"><Plus className="inline mr-2" />New Entry</button>
      <div className="space-y-4">
        {diaryEntries.map(entry => (
          <div key={entry.id} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-50'}`}>
            <div className="flex justify-between items-start mb-2"><span className="text-[10px] uppercase text-gray-400">{entry.date}</span></div>
            <p className="text-sm leading-relaxed">{entry.note}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReminders = () => (
    <div className="px-6 pt-4 pb-32">
      <h2 className={`serif text-4xl mb-6 ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>Reminders</h2>
      <div className="space-y-4">
        <div className={`p-6 rounded-3xl border flex items-center justify-between ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center space-x-4"><Sun className="text-orange-500" /><span>Morning</span></div>
          <button onClick={() => setReminders({...reminders, amEnabled: !reminders.amEnabled})} className={`w-12 h-6 rounded-full relative ${reminders.amEnabled ? 'bg-[#D4C4A8]' : 'bg-gray-300'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${reminders.amEnabled ? 'left-7' : 'left-1'}`} /></button>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="px-6 pt-12 pb-32 flex flex-col items-center">
      <div className="w-24 h-24 rounded-full border-4 overflow-hidden mb-6"><img src={currentUser?.photo || "https://picsum.photos/seed/sarah/200/200"} alt="Profile" /></div>
      <h2 className="serif text-3xl mb-1">{currentUser?.name || "User"}</h2>
      <div className="w-full space-y-3 mt-8">
        <button onClick={() => setCurrentView(AppView.DIARY)} className="w-full p-4 rounded-2xl border flex items-center justify-between"><span>Skin Diary</span><ChevronRight size={16} /></button>
        <button onClick={() => setCurrentView(AppView.REMINDERS)} className="w-full p-4 rounded-2xl border flex items-center justify-between"><span>Reminders</span><ChevronRight size={16} /></button>
        <button onClick={handleLogout} className="w-full p-4 rounded-2xl border-2 border-dashed text-red-400 mt-10">Sign Out</button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case AppView.AUTH: return renderAuth();
      case AppView.ROUTINE: return renderRoutine();
      case AppView.SHOP: return renderShop();
      case AppView.PROFILE: return renderProfile();
      case AppView.DIARY: return renderDiary();
      case AppView.REMINDERS: return renderReminders();
      default: return renderAnalysis();
    }
  };

  return (
    <div className={`max-w-md mx-auto min-h-screen relative overflow-x-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#1A1816]' : 'bg-[#FDFBF7]'}`}>
      {showSplash && (
        <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center ${isDarkMode ? 'bg-[#1A1816]' : 'bg-[#FDFBF7]'}`}>
          <Sparkles size={64} className="text-[#D4C4A8] animate-pulse" />
          <h1 className="serif text-5xl mt-4">SkinWise</h1>
          <Loader2 className="animate-spin text-[#D4C4A8] mt-8" />
        </div>
      )}
      {currentView !== AppView.AUTH && renderHeader()}
      {renderContent()}
      {currentView !== AppView.AUTH && (
        <>
          {showAIHub && (
            <div className="fixed bottom-40 right-6 z-50 animate-in slide-in-from-bottom-4"><div className={`p-3 rounded-3xl shadow-2xl border space-y-2 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}><button onClick={() => { setActiveAIModal('chat'); setShowAIHub(false); }} className="w-full p-4 rounded-2xl hover:bg-gray-100 flex items-center space-x-3"><MessageSquare size={18} /><span>Expert Chat</span></button></div></div>
          )}
          <button onClick={() => setShowAIHub(!showAIHub)} className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#D4C4A8] shadow-2xl flex items-center justify-center text-white z-50"><Sparkles size={28} /></button>
          <BottomNav currentView={currentView} setView={setCurrentView} isDarkMode={isDarkMode} />
        </>
      )}
      {activeAIModal && <AIModal type={activeAIModal} onClose={() => setActiveAIModal(null)} isDarkMode={isDarkMode} messages={chatMessages} onSendMessage={handleSendMessage} input={chatInput} setInput={setChatInput} isLoading={isChatLoading} />}
      {showToast && <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[300] bg-black text-white px-6 py-3 rounded-full">Copied to Clipboard</div>}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-between p-6">
          <div className="w-full flex justify-between text-white"><button onClick={stopCamera}><X /></button><span>Scan Face</span><div className="w-10" /></div>
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-[40px] aspect-[3/4] object-cover" />
          <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full flex items-center justify-center"><div className="w-16 h-16 border-4 rounded-full" /></button>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default App;
