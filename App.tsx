
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Play, Sparkles, Loader2, RefreshCw, Camera, Upload, Trash2, 
  Wand2, ChevronRight, Info, X, Check, RotateCcw, Image as ImageIcon, 
  Moon, Sun, ClipboardList, Mic, MessageSquare, Video, Layout, ShoppingBag, Star,
  Plus, Calendar as CalendarIcon, Smile, Meh, Frown, BookOpen, ExternalLink, ArrowRight,
  Filter, Search, Bell, BellRing, Clock, ShoppingCart, Heart, Droplets, Zap, Shield, Waves,
  Camera as CameraIcon, X as CloseIcon
} from 'lucide-react';
import { AppView, RoutineStep, DiaryEntry, ReminderSettings } from './types';
import RoutineCard from './components/RoutineCard';
import BottomNav from './components/BottomNav';
import { 
  getSkinAdvice, editImageWithGemini, generateSkinVideo, 
  generateProductImage, startLiveAssistant, expertChat 
} from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.ANALYSIS);
  const [showSplash, setShowSplash] = useState(true);
  const [isAM, setIsAM] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAIHub, setShowAIHub] = useState(false);
  const [activeAIModal, setActiveAIModal] = useState<'chat' | 'voice' | 'creative' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Reminders state with deeper customization
  const [reminders, setReminders] = useState<ReminderSettings>({
    amEnabled: false,
    amTime: "08:00",
    amDays: [1, 2, 3, 4, 5], // Weekdays by default
    pmEnabled: false,
    pmTime: "21:00",
    pmDays: [1, 2, 3, 4, 5]
  });

  // Diary state
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([
    { id: '1', date: 'Oct 24, 2024', note: 'Skin felt a bit dry this morning after using the new serum.', mood: 'meh' },
    { id: '2', date: 'Oct 23, 2024', note: 'Woke up with a glow! The night repair cream is really working.', mood: 'smile' }
  ]);
  const [newDiaryNote, setNewDiaryNote] = useState("");
  const [newDiaryMood, setNewDiaryMood] = useState("smile");
  const [isDiaryAdding, setIsDiaryAdding] = useState(false);

  // Camera & Image states
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Routine state
  const [amRoutine, setAmRoutine] = useState<RoutineStep[]>([]);
  const [pmRoutine, setPmRoutine] = useState<RoutineStep[]>([]);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedReminders = localStorage.getItem('skinwise_reminders_v2');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
    
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Sync Reminders to LocalStorage
  useEffect(() => {
    localStorage.setItem('skinwise_reminders_v2', JSON.stringify(reminders));
  }, [reminders]);

  const toggleStep = (id: string) => {
    const update = (list: RoutineStep[]) => 
      list.map(s => s.id === id ? { ...s, completed: !s.completed } : s);
    if (isAM) setAmRoutine(update);
    else setPmRoutine(update);
  };

  const handleAnalysis = async () => {
    setIsLoading(true);
    try {
      const result = await getSkinAdvice(analysisText, selectedImage);
      setAiAnalysis(result);
      setAmRoutine(result.amRoutine.map((s: any, i: number) => ({ ...s, id: `am-${i}`, completed: false })));
      setPmRoutine(result.pmRoutine.map((s: any, i: number) => ({ ...s, id: `pm-${i}`, completed: false })));
    } catch (e) {
      alert("Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    const tracks = stream?.getTracks();
    tracks?.forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelectedImage(dataUrl);
      stopCamera();
    }
  };

  const handleGetSkinRoutine = () => {
    const hour = new Date().getHours();
    setIsAM(hour >= 5 && hour < 17);
    setCurrentView(AppView.ROUTINE);
    window.scrollTo(0, 0);
  };

  const handleGetSuggestions = () => {
    setCurrentView(AppView.SHOP);
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

  const updateReminder = (key: keyof ReminderSettings, value: any) => {
    setReminders(prev => ({ ...prev, [key]: value }));
  };

  const toggleDay = (type: 'am' | 'pm', dayIndex: number) => {
    const key = type === 'am' ? 'amDays' : 'pmDays';
    const currentDays = [...reminders[key]];
    if (currentDays.includes(dayIndex)) {
      updateReminder(key, currentDays.filter(d => d !== dayIndex));
    } else {
      updateReminder(key, [...currentDays, dayIndex].sort());
    }
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between px-6 pt-6 pb-2 relative z-10">
      <div className="flex items-center space-x-2">
        {currentView !== AppView.ANALYSIS && (
          <button 
            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-[#2E2A25]'}`} 
            onClick={() => {
              if (currentView === AppView.DIARY || currentView === AppView.REMINDERS) {
                setCurrentView(AppView.PROFILE);
              } else {
                setCurrentView(AppView.ANALYSIS);
              }
            }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>
      <h1 className={`text-lg font-medium transition-colors ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>SkinWise</h1>
      <div className="flex items-center space-x-3">
        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-100 text-[#2E2A25]'}`}>
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <div className="w-10 h-10 rounded-full bg-[#EAE2D6] overflow-hidden border border-white">
          <img src="https://picsum.photos/seed/skin/100/100" alt="Profile" />
        </div>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="relative min-h-screen px-6 pt-4 pb-32 overflow-hidden">
      {/* Abstract Background Aura */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className={`absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px] transition-colors duration-1000 ${
            isDarkMode ? 'bg-[#D4C4A8]/10' : 'bg-[#D4C4A8]/20'
          }`} 
        />
        <div 
          className={`absolute top-1/2 -right-20 w-96 h-96 rounded-full blur-[120px] transition-colors duration-1000 ${
            isDarkMode ? 'bg-[#2E2A25]/30' : 'bg-[#EAE2D6]/40'
          }`} 
        />
        <div 
          className={`absolute -bottom-20 left-1/4 w-72 h-72 rounded-full blur-[90px] transition-colors duration-1000 ${
            isDarkMode ? 'bg-[#D4C4A8]/5' : 'bg-[#F5E6D3]/30'
          }`} 
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-6">
          <h2 className={`serif text-4xl mb-2 ${isDarkMode ? 'text-white' : ''}`}>Skin Analysis</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Let AI guide your skincare journey with deep analysis.</p>
        </div>

        {!aiAnalysis ? (
          <div className={`p-6 rounded-3xl border backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/70 border-gray-100'}`}>
            
            <button 
              onClick={startCamera}
              className={`w-full py-6 mb-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all hover:bg-[#D4C4A8]/10 group ${
                isDarkMode ? 'border-gray-700 text-gray-500 hover:border-[#D4C4A8]' : 'border-[#D4C4A8] text-[#D4C4A8]'
              }`}
            >
              <div className="p-4 bg-[#D4C4A8]/20 rounded-full mb-3 group-hover:scale-110 transition-transform">
                <CameraIcon size={32} />
              </div>
              <span className="font-black text-sm uppercase tracking-widest">Scan Face</span>
              <p className="text-[10px] opacity-60 mt-1">Start AI-Powered Visual Analysis</p>
            </button>

            <div className="flex items-center space-x-4 mb-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
            </div>

            <textarea 
              className={`w-full h-32 p-4 rounded-2xl border-none focus:ring-2 focus:ring-[#D4C4A8] text-sm resize-none mb-4 ${isDarkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-[#FDFBF7]/80 text-[#2E2A25] placeholder-gray-400'}`}
              placeholder="Describe your concerns (optional)..."
              value={analysisText}
              onChange={(e) => setAnalysisText(e.target.value)}
            />
            
            <div className="grid grid-cols-1 gap-3 mb-6">
              <button onClick={() => fileInputRef.current?.click()} className={`p-4 border-2 border-dashed rounded-2xl flex items-center justify-center space-x-3 ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-400'}`}>
                <Upload size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Upload Existing Photo</span>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setSelectedImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
            </div>

            {selectedImage && (
              <div className="relative mb-6 rounded-2xl overflow-hidden group shadow-lg">
                <img src={selectedImage} alt="Preview" className="w-full h-48 object-cover" />
                <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-2 bg-red-500/80 backdrop-blur-sm text-white rounded-full hover:bg-red-600 transition-colors"><Trash2 size={16} /></button>
              </div>
            )}

            <button 
              onClick={handleAnalysis} 
              disabled={isLoading} 
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 transition-all ${
                isLoading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#2E2A25] dark:bg-[#D4C4A8] text-white dark:text-[#1A1816] hover:opacity-90'
              }`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              <span>{isLoading ? 'Processing...' : 'Generate Expert Report'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Skin Metrics Section */}
            <div className={`p-6 rounded-3xl border backdrop-blur-md ${isDarkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-100'}`}>
              <div className="flex items-center space-x-2 text-[#D4C4A8] mb-6">
                 <Layout size={18} />
                 <span className="text-xs font-bold uppercase tracking-widest">Skin Profile Details</span>
               </div>
               
               <div className="grid grid-cols-2 gap-6 mb-6">
                  <MetricItem label="Hydration" value={aiAnalysis.skinMetrics.hydration} icon={Droplets} color="blue" isDarkMode={isDarkMode} />
                  <MetricItem label="Oil Level" value={aiAnalysis.skinMetrics.oiliness} icon={Zap} color="yellow" isDarkMode={isDarkMode} />
                  <MetricItem label="Sensitivity" value={aiAnalysis.skinMetrics.sensitivity} icon={Shield} color="red" isDarkMode={isDarkMode} />
                  <MetricItem label="Smoothness" value={aiAnalysis.skinMetrics.texture} icon={Waves} color="green" isDarkMode={isDarkMode} />
               </div>

               <div className="space-y-3">
                 <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Identified Concerns</span>
                 <div className="flex flex-wrap gap-2">
                   {aiAnalysis.concerns.map((concern: string, idx: number) => (
                     <span key={idx} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-[#EAE2D6]/20 border-[#D4C4A8]/20 text-[#2E2A25]'}`}>
                       {concern}
                     </span>
                   ))}
                 </div>
               </div>
            </div>

            <div className={`p-8 rounded-3xl border backdrop-blur-md ${isDarkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-100'}`}>
               <div className="flex items-center space-x-2 text-[#D4C4A8] mb-4">
                 <Info size={16} />
                 <span className="text-xs font-bold uppercase tracking-widest">AI Expert Summary</span>
               </div>
               <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{aiAnalysis.analysis}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <button onClick={handleGetSkinRoutine} className="w-full py-5 bg-[#2E2A25] dark:bg-[#D4C4A8] dark:text-gray-900 text-white rounded-2xl flex items-center justify-center space-x-3 shadow-xl hover:scale-[1.02] transition-transform">
                <Sparkles size={20} />
                <span className="font-bold">Get Skin Routine</span>
              </button>

              <button 
                onClick={handleGetSuggestions} 
                className="w-full py-5 bg-gradient-to-r from-[#EAE2D6] to-[#D4C4A8] text-[#2E2A25] rounded-2xl flex items-center justify-center space-x-4 shadow-lg hover:scale-[1.02] transition-transform border border-[#D4C4A8]/40"
              >
                <ShoppingBag size={20} />
                <div className="text-left">
                  <span className="font-bold block leading-tight">Skin Care Suggestions</span>
                  <span className="text-[10px] opacity-70 block uppercase tracking-tighter">AI Curated For Your Skin</span>
                </div>
                <Sparkles size={16} className="text-[#2E2A25]/50 animate-pulse ml-auto" />
              </button>
            </div>

            <button onClick={() => setAiAnalysis(null)} className="w-full py-4 border-2 rounded-2xl text-sm font-semibold text-gray-400">Restart Analysis</button>
          </div>
        )}
      </div>

      {/* Camera Interface Overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-between p-6">
          <div className="w-full flex justify-between items-center text-white">
            <button onClick={stopCamera} className="p-3 bg-white/10 rounded-full">
              <CloseIcon size={24} />
            </button>
            <span className="font-black text-xs uppercase tracking-widest">Align Face in Frame</span>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <div className="relative w-full aspect-[3/4] max-h-[60vh] rounded-[40px] overflow-hidden border-2 border-[#D4C4A8]">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {/* Guidelines */}
            <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-dashed border-[#D4C4A8]/60 rounded-full" />
            </div>
          </div>

          <div className="flex flex-col items-center space-y-6 w-full">
            <p className="text-white/60 text-center text-xs px-8">Ensure good lighting for the most accurate AI skin analysis results.</p>
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            >
              <div className="w-16 h-16 border-4 border-black/5 rounded-full bg-white shadow-inner flex items-center justify-center">
                 <CameraIcon size={32} className="text-[#2E2A25]" />
              </div>
            </button>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </div>
  );

  const renderRoutine = () => (
    <div className="px-6 pt-4 pb-32">
      <h2 className={`serif text-4xl mb-2 ${isDarkMode ? 'text-white' : ''}`}>My Routine</h2>
      <div className={`mt-6 flex p-1.5 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-[#EAE2D6]/40'}`}>
        <button onClick={() => setIsAM(true)} className={`flex-1 py-3 rounded-xl text-sm font-semibold ${isAM ? 'bg-white shadow text-[#2E2A25]' : 'text-gray-500'}`}>AM</button>
        <button onClick={() => setIsAM(false)} className={`flex-1 py-3 rounded-xl text-sm font-semibold ${!isAM ? 'bg-white shadow text-[#2E2A25]' : 'text-gray-500'}`}>PM</button>
      </div>
      <div className="mt-8 space-y-4">
        {(isAM ? amRoutine : pmRoutine).length > 0 ? (
          (isAM ? amRoutine : pmRoutine).map(step => (
            <RoutineCard key={step.id} step={step} onToggle={toggleStep} isDarkMode={isDarkMode} />
          ))
        ) : (
          <div className="py-20 text-center">
            <Sparkles size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 text-sm">No routine generated yet.<br/>Perform an analysis to get started.</p>
          </div>
        )}
      </div>

      <div className="mt-12 space-y-4">
        {aiAnalysis && (
          <button 
            onClick={handleGetSkinRoutine} 
            className="w-full py-5 rounded-2xl flex items-center justify-center space-x-3 shadow-md hover:scale-[1.02] transition-transform bg-[#D4C4A8] text-white"
          >
            <RotateCcw size={20} />
            <span className="font-bold">Get Skin Routine</span>
          </button>
        )}

        <button 
          onClick={handleGetSuggestions} 
          className={`w-full py-5 rounded-2xl flex items-center justify-center space-x-3 shadow-md hover:scale-[1.02] transition-transform border ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#EAE2D6] border-[#D4C4A8]/20 text-[#2E2A25]'
          }`}
        >
          <ShoppingBag size={20} />
          <span className="font-bold">Skin Care Suggestions</span>
          <Sparkles size={16} className="text-[#D4C4A8]" />
        </button>
      </div>
    </div>
  );

  const renderProductDetail = () => {
    if (!selectedProduct) return null;
    const isRecommended = aiAnalysis?.productRecommendations?.some((r: any) => r.name === selectedProduct.name);

    return (
      <div className="fixed inset-0 z-[100] bg-black/80 flex items-end justify-center">
        <div 
          className={`w-full max-w-md h-[92vh] rounded-t-[40px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300 ${isDarkMode ? 'bg-[#1A1816]' : 'bg-white'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative h-[45%] overflow-hidden">
             <img src={`https://picsum.photos/seed/${selectedProduct.imageSeed}/800/800`} className="w-full h-full object-cover" alt={selectedProduct.name} />
             <div className="absolute top-6 left-6 flex space-x-3">
               <button onClick={() => setSelectedProduct(null)} className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg hover:scale-110 transition-transform">
                 <ArrowLeft size={20} className="text-gray-900" />
               </button>
             </div>
             <div className="absolute top-6 right-6">
                <button className="p-3 bg-white/90 backdrop-blur rounded-2xl shadow-lg hover:scale-110 transition-transform">
                  <Heart size={20} className="text-red-500" />
                </button>
             </div>
             {isRecommended && (
               <div className="absolute bottom-6 left-6 px-4 py-2 bg-[#D4C4A8] text-white rounded-full flex items-center space-x-2 shadow-xl border border-white/20">
                 <Sparkles size={14} />
                 <span className="text-[10px] font-black uppercase tracking-widest">AI Expert Recommendation</span>
               </div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto px-8 pt-8 pb-32">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-black text-[#D4C4A8] uppercase tracking-[0.25em]">{selectedProduct.category}</span>
              <div className="flex items-center space-x-1 bg-[#EAE2D6]/20 px-2 py-1 rounded-lg">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProduct.rating}</span>
              </div>
            </div>
            
            <h2 className={`serif text-3xl mb-1 leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProduct.name}</h2>
            <p className="text-gray-400 font-bold text-sm mb-6">{selectedProduct.brand}</p>

            <div className="space-y-6">
               <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-100 shadow-sm'}`}>
                 <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Detailed Description</h4>
                 <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                   {selectedProduct.description || `Formulated specifically for your skin profile. This ${selectedProduct.category.toLowerCase()} utilizes advanced botanical extracts to address the specific concerns identified in your analysis. Dermatologist tested and cruelty-free.`}
                 </p>
               </div>

               {isRecommended && (
                 <div className={`p-6 rounded-3xl border border-[#D4C4A8]/30 ${isDarkMode ? 'bg-[#D4C4A8]/10' : 'bg-[#D4C4A8]/5'}`}>
                   <h4 className="text-[10px] font-black text-[#D4C4A8] uppercase tracking-widest mb-3 flex items-center space-x-2">
                     <Sparkles size={12} />
                     <span>Clinical Insights</span>
                   </h4>
                   <p className={`text-sm leading-relaxed italic font-medium ${isDarkMode ? 'text-gray-300' : 'text-[#7D7058]'}`}>
                     "This formula specifically targets the markers found in your skin scan, offering optimized bio-availability for faster results."
                   </p>
                 </div>
               )}

               <div className="grid grid-cols-2 gap-4">
                 <div className={`p-5 rounded-[24px] ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                   <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">Quantity</span>
                   <span className={`font-bold ${isDarkMode ? 'text-white' : ''}`}>1.7 fl. oz / 50ml</span>
                 </div>
                 <div className={`p-5 rounded-[24px] ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                   <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest block mb-1">Efficacy</span>
                   <span className={`font-bold ${isDarkMode ? 'text-white' : ''}`}>High Bio-Match</span>
                 </div>
               </div>
            </div>
          </div>

          <div className={`p-8 border-t flex items-center justify-between backdrop-blur-xl absolute bottom-0 left-0 right-0 ${isDarkMode ? 'bg-[#1A1816]/95 border-gray-800 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]' : 'bg-white/95 border-gray-100 shadow-[0_-20px_40px_rgba(234,226,214,0.3)]'}`}>
            <div className="flex flex-col">
               <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Investment</span>
               <span className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProduct.price}</span>
            </div>
            <button className="px-10 py-5 bg-[#2E2A25] dark:bg-[#D4C4A8] text-white dark:text-gray-900 rounded-[24px] font-black text-sm flex items-center space-x-3 shadow-2xl active:scale-95 transition-all hover:bg-[#3D3831] dark:hover:bg-[#c4b498]">
              <ShoppingCart size={20} strokeWidth={2.5} />
              <span className="tracking-wide">Purchase Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderShop = () => {
    const defaultProducts = [
      { name: "Hydrating Cleanser", brand: "SkinWise Essentials", description: "A creamy, non-foaming cleanser that removes impurities while maintaining the skin's natural moisture barrier.", price: "$24.00", rating: 4.8, category: "Cleanser", imageSeed: "cleanser" },
      { name: "Vitamin C Glow", brand: "LumiSkin", description: "Stabilized 15% Vitamin C serum with ferulic acid to brighten dull complexions and protect against daily pollutants.", price: "$42.00", rating: 4.9, category: "Serum", imageSeed: "serum1" },
      { name: "Retinol Night Repair", brand: "PureDerma", description: "Encapsulated 0.5% retinol combined with soothing squalane for overnight cellular turnover without irritation.", price: "$55.00", rating: 4.7, category: "Treatment", imageSeed: "night" },
      { name: "Sun Guard SPF 50", brand: "DailyProtect", description: "Ultra-lightweight mineral sunscreen with hyaluronic acid. Leaves no white cast and works perfectly under makeup.", price: "$18.00", rating: 4.6, category: "Sunscreen", imageSeed: "sun" },
      { name: "Soothe Mask", brand: "EcoSkin", description: "Cooling gel mask infused with aloe vera and cucumber extract to instantly calm redness and soothe tired skin.", price: "$15.00", rating: 4.5, category: "Mask", imageSeed: "mask" },
      { name: "Rose Water Mist", brand: "FloralMist", description: "Organic Bulgarian rose water mist for instant hydration and PH balancing. Refreshing anytime throughout the day.", price: "$22.00", rating: 4.9, category: "Toner", imageSeed: "toner" },
    ];

    const recommended = aiAnalysis?.productRecommendations || [];
    const allProducts = [...recommended, ...defaultProducts.filter(p => !recommended.some((r: any) => r.name === p.name))];

    return (
      <div className="px-6 pt-4 pb-32" onClick={() => setSelectedProduct(null)}>
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className={`serif text-4xl mb-1 ${isDarkMode ? 'text-white' : ''}`}>Skin Shop</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {aiAnalysis ? "AI-filtered products for your skin profile." : "Best-selling skincare and tools."}
            </p>
          </div>
          <button className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-[#EAE2D6] text-[#2E2A25]'}`}>
            <Search size={20} />
          </button>
        </div>

        {/* AI Top Picks Carousel */}
        {aiAnalysis && recommended.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-right-10">
            <div className="flex items-center justify-between mb-4 px-1">
               <div className="flex items-center space-x-2">
                 <Sparkles className="text-[#D4C4A8]" size={20} />
                 <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>AI Top Picks</h3>
               </div>
               <span className="text-[10px] font-black uppercase text-[#D4C4A8] tracking-widest">Curated</span>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto pb-6 scrollbar-hide -mx-6 px-6">
              {recommended.map((p: any, idx: number) => (
                <div 
                  key={`rec-${idx}`} 
                  onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}
                  className={`flex-shrink-0 w-64 p-4 rounded-[32px] border relative transition-all hover:scale-[1.02] shadow-xl cursor-pointer ${isDarkMode ? 'bg-gray-900 border-[#D4C4A8]/20' : 'bg-white border-[#EAE2D6]'}`}
                >
                  <div className="aspect-[4/5] rounded-[24px] bg-[#FDFBF7] mb-4 overflow-hidden relative">
                    <img src={`https://picsum.photos/seed/${p.imageSeed}/400/500`} alt={p.name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-black text-[#2E2A25]">{p.rating}</span>
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-black text-[#D4C4A8] uppercase tracking-widest mb-1">{p.category}</p>
                    <h4 className={`font-bold text-base mb-1 ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>{p.name}</h4>
                    <p className="text-xs text-gray-400 mb-4">{p.brand}</p>
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>{p.price}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); /* Add to cart logic */ }} 
                        className="py-2.5 px-5 bg-[#2E2A25] dark:bg-[#D4C4A8] text-white dark:text-gray-900 rounded-full font-bold text-xs shadow-lg transition-transform active:scale-95"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 p-1 bg-[#D4C4A8] rounded-full text-white">
                    <Check size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-4 mb-6 overflow-x-auto scrollbar-hide py-2 px-1">
           {['All', 'Cleansers', 'Serums', 'Moisturizers', 'SPF', 'Tools'].map((cat) => (
             <button key={cat} onClick={(e) => e.stopPropagation()} className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${cat === 'All' ? 'bg-[#D4C4A8] text-white shadow-md' : (isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-[#EAE2D6]/40 text-gray-500')}`}>
               {cat}
             </button>
           ))}
        </div>

        <h3 className={`font-bold text-lg mb-4 px-1 ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>
          {aiAnalysis ? "All Recommendations" : "Discover"}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {allProducts.map((p: any, idx: number) => (
            <div 
              key={idx} 
              onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}
              className={`p-4 rounded-[28px] border transition-all hover:shadow-xl group cursor-pointer ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}
            >
              <div className="aspect-square rounded-[20px] bg-[#FDFBF7] mb-3 overflow-hidden relative">
                <img src={`https://picsum.photos/seed/${p.imageSeed}/300/300`} alt={p.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                  <Star size={10} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] font-bold text-[#2E2A25]">{p.rating}</span>
                </div>
                {aiAnalysis && recommended.some((r: any) => r.name === p.name) && (
                   <div className="absolute bottom-2 left-2">
                     <div className="bg-[#D4C4A8] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm border border-white/20">AI Recommended</div>
                   </div>
                )}
              </div>
              <p className="text-[10px] font-bold text-[#D4C4A8] uppercase tracking-widest mb-0.5">{p.category}</p>
              <h4 className={`font-bold text-xs truncate mb-0.5 ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>{p.name}</h4>
              <p className="text-[10px] text-gray-400 mb-3 truncate">{p.brand}</p>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>{p.price}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); /* Add to cart logic */ }} 
                  className="p-2 bg-[#2E2A25] dark:bg-[#D4C4A8] text-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {selectedProduct && renderProductDetail()}
      </div>
    );
  };

  const renderProfile = () => {
    const activeDaysText = (days: number[]) => {
      if (days.length === 7) return "Daily";
      if (days.length === 0) return "Never";
      const names = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      return days.map(d => names[d]).join('');
    };

    const reminderSummary = reminders.amEnabled || reminders.pmEnabled 
      ? `${reminders.amEnabled ? `AM: ${reminders.amTime} (${activeDaysText(reminders.amDays)})` : ''} ${reminders.pmEnabled ? `PM: ${reminders.pmTime} (${activeDaysText(reminders.pmDays)})` : ''}`
      : 'Off';

    return (
      <div className="px-6 pt-12 pb-32 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden mb-6">
          <img src="https://picsum.photos/seed/sarah/200/200" alt="Profile" />
        </div>
        <h2 className={`serif text-3xl mb-1 ${isDarkMode ? 'text-white' : ''}`}>Sarah Miller</h2>
        <p className="text-gray-400 text-sm font-medium mb-8">SkinWise Member Since 2024</p>
        
        <div className="w-full space-y-3">
          {[
            { label: 'Routine Reminders', count: reminderSummary, id: 'reminders', icon: Bell },
            { label: 'Skin Diary', count: `${diaryEntries.length} Entries`, id: 'diary', icon: BookOpen },
            { label: 'My Subscriptions', count: 'Active', id: 'subs', icon: Star },
            { label: 'Routine Settings', count: 'Customized', id: 'routine', icon: ClipboardList },
            { label: 'Help & Support', count: '', id: 'help', icon: Info },
          ].map((item, idx) => (
            <button 
              key={idx} 
              onClick={() => {
                if (item.id === 'diary') setCurrentView(AppView.DIARY);
                if (item.id === 'reminders') setCurrentView(AppView.REMINDERS);
              }}
              className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}
            >
              <div className="flex items-center space-x-3 text-left">
                 <div className={`p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-gray-800 text-[#D4C4A8]' : 'bg-[#EAE2D6]/40 text-[#D4C4A8]'}`}>
                   {item.icon && <item.icon size={18} />}
                 </div>
                 <div className="flex flex-col">
                   <span className={`font-semibold text-sm ${isDarkMode ? 'text-white' : ''}`}>{item.label}</span>
                   {item.count && (
                     <span className="text-[10px] text-gray-400 font-bold truncate max-w-[180px]">
                       {item.count}
                     </span>
                   )}
                 </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderRemindersView = () => (
    <div className="px-6 pt-4 pb-32">
      <div className="mb-8">
        <h2 className={`serif text-4xl mb-2 ${isDarkMode ? 'text-white' : ''}`}>Reminders</h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customize your routine alerts for ultimate consistency.</p>
      </div>

      <div className="space-y-6">
        {/* AM Reminder */}
        <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'} ${reminders.amEnabled ? 'ring-2 ring-[#D4C4A8]/20' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-2xl">
                <Sun size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : ''}`}>AM Routine</h3>
                <p className="text-xs text-gray-400">Morning ritual</p>
              </div>
            </div>
            <button 
              onClick={() => updateReminder('amEnabled', !reminders.amEnabled)}
              className={`w-14 h-8 rounded-full transition-colors relative ${reminders.amEnabled ? 'bg-[#D4C4A8]' : 'bg-gray-200 dark:bg-gray-800'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${reminders.amEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className={`space-y-6 transition-opacity ${reminders.amEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                 <Clock size={14} />
                 <span>Reminder Time</span>
               </div>
               <input 
                 type="time" 
                 value={reminders.amTime}
                 onChange={(e) => updateReminder('amTime', e.target.value)}
                 className={`px-3 py-1.5 rounded-xl border-none font-black text-xl outline-none shadow-inner ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-[#FDFBF7] text-[#2E2A25]'}`}
               />
             </div>

             <div className="space-y-3">
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Repeat Days</span>
               <div className="flex justify-between">
                 {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                   <button 
                     key={i} 
                     onClick={() => toggleDay('am', i)}
                     className={`w-8 h-8 rounded-full text-[10px] font-black transition-all ${reminders.amDays.includes(i) ? 'bg-[#D4C4A8] text-white shadow-md scale-110' : (isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400')}`}
                   >
                     {day}
                   </button>
                 ))}
               </div>
             </div>
          </div>
        </div>

        {/* PM Reminder */}
        <div className={`p-6 rounded-3xl border transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'} ${reminders.pmEnabled ? 'ring-2 ring-[#D4C4A8]/20' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <Moon size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : ''}`}>PM Routine</h3>
                <p className="text-xs text-gray-400">Night recovery</p>
              </div>
            </div>
            <button 
              onClick={() => updateReminder('pmEnabled', !reminders.pmEnabled)}
              className={`w-14 h-8 rounded-full transition-colors relative ${reminders.pmEnabled ? 'bg-[#D4C4A8]' : 'bg-gray-200 dark:bg-gray-800'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${reminders.pmEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className={`space-y-6 transition-opacity ${reminders.pmEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                 <Clock size={14} />
                 <span>Reminder Time</span>
               </div>
               <input 
                 type="time" 
                 value={reminders.pmTime}
                 onChange={(e) => updateReminder('pmTime', e.target.value)}
                 className={`px-3 py-1.5 rounded-xl border-none font-black text-xl outline-none shadow-inner ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-[#FDFBF7] text-[#2E2A25]'}`}
               />
             </div>

             <div className="space-y-3">
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Repeat Days</span>
               <div className="flex justify-between">
                 {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                   <button 
                     key={i} 
                     onClick={() => toggleDay('pm', i)}
                     className={`w-8 h-8 rounded-full text-[10px] font-black transition-all ${reminders.pmDays.includes(i) ? 'bg-[#D4C4A8] text-white shadow-md scale-110' : (isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400')}`}
                   >
                     {day}
                   </button>
                 ))}
               </div>
             </div>
          </div>
        </div>

        <div className={`p-6 rounded-3xl flex items-center space-x-4 border border-dashed ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-[#D4C4A8] text-[#D4C4A8]'}`}>
           <Info size={20} className="flex-shrink-0" />
           <p className="text-[11px] leading-relaxed font-medium italic">Customized schedules help you maintain a perfect skin barrier. We'll alert you at your preferred times.</p>
        </div>
      </div>
    </div>
  );

  const renderDiaryView = () => (
    <div className="px-6 pt-4 pb-32 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`serif text-4xl mb-2 ${isDarkMode ? 'text-white' : ''}`}>Skin Diary</h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Track your skin journey day by day.</p>
        </div>
        <button 
          onClick={() => setIsDiaryAdding(!isDiaryAdding)}
          className={`p-3 rounded-full shadow-lg transition-transform ${isDiaryAdding ? 'bg-red-500 text-white rotate-45' : 'bg-[#D4C4A8] text-white'}`}
        >
          <Plus size={24} />
        </button>
      </div>

      {isDiaryAdding && (
        <div className={`p-6 rounded-3xl mb-8 border animate-in slide-in-from-top-4 ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-xl' : 'bg-white border-gray-100 shadow-xl'}`}>
          <div className="flex items-center space-x-2 mb-4 text-[#D4C4A8]">
            <BookOpen size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">New Log Entry</span>
          </div>
          <textarea 
            className={`w-full h-32 p-4 rounded-2xl border-none focus:ring-2 focus:ring-[#D4C4A8] text-sm resize-none mb-4 ${isDarkMode ? 'bg-gray-800 text-white placeholder-gray-500' : 'bg-[#FDFBF7] text-[#2E2A25] placeholder-gray-400'}`}
            placeholder="How is your skin feeling today? Notice any changes?"
            value={newDiaryNote}
            onChange={(e) => setNewDiaryNote(e.target.value)}
          />
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-xs font-bold text-gray-400 uppercase">Status:</span>
            <div className="flex space-x-2">
              {[
                { mood: 'smile', icon: Smile, color: 'text-green-500' },
                { mood: 'meh', icon: Meh, color: 'text-yellow-500' },
                { mood: 'frown', icon: Frown, color: 'text-red-500' }
              ].map((m) => (
                <button 
                  key={m.mood}
                  onClick={() => setNewDiaryMood(m.mood)}
                  className={`p-2 rounded-xl border transition-all ${newDiaryMood === m.mood ? 'bg-[#EAE2D6]/20 border-[#D4C4A8]' : 'border-transparent opacity-40'}`}
                >
                  <m.icon className={m.color} size={24} />
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={handleAddDiaryEntry}
            disabled={!newDiaryNote.trim()}
            className={`w-full py-4 rounded-full font-bold shadow-lg transition-all ${!newDiaryNote.trim() ? 'bg-gray-200 text-gray-400' : 'bg-[#D4C4A8] text-white'}`}
          >
            Save Entry
          </button>
        </div>
      )}

      <div className="space-y-4">
        {diaryEntries.map((entry) => (
          <div 
            key={entry.id} 
            className={`p-5 rounded-3xl border transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-sm' : 'bg-white border-gray-100 shadow-sm'}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon size={14} className="text-gray-400" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{entry.date}</span>
              </div>
              <div>
                {entry.mood === 'smile' && <Smile className="text-green-500" size={18} />}
                {entry.mood === 'meh' && <Meh className="text-yellow-500" size={18} />}
                {entry.mood === 'frown' && <Frown className="text-red-500" size={18} />}
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {entry.note}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case AppView.ROUTINE: return renderRoutine();
      case AppView.ANALYSIS: return renderAnalysis();
      case AppView.SHOP: return renderShop();
      case AppView.PROFILE: return renderProfile();
      case AppView.DIARY: return renderDiaryView();
      case AppView.REMINDERS: return renderRemindersView();
      default: return renderAnalysis();
    }
  };

  return (
    <div className={`max-w-md mx-auto min-h-screen relative overflow-x-hidden ${isDarkMode ? 'bg-[#1A1816]' : 'bg-[#FDFBF7]'}`}>
      {showSplash && (
        <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center ${isDarkMode ? 'bg-[#1A1816]' : 'bg-[#FDFBF7]'}`}>
          <Sparkles size={64} className="text-[#D4C4A8] animate-pulse" />
          <h1 className="serif text-5xl text-[#2E2A25] mt-4 dark:text-white">SkinWise</h1>
          <Loader2 className="animate-spin text-[#D4C4A8] mt-8" />
        </div>
      )}

      {renderHeader()}
      {renderContent()}
      
      <button 
        onClick={() => setShowAIHub(!showAIHub)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#D4C4A8] rounded-full shadow-2xl flex items-center justify-center text-white z-50 hover:scale-110 transition-transform"
      >
        {showAIHub ? <X /> : <Sparkles size={28} />}
      </button>

      {showAIHub && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end p-6">
          <div className={`w-full p-6 rounded-3xl space-y-4 animate-in slide-in-from-bottom-10 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
            <h3 className="font-bold text-lg mb-4">AI Assistant Hub</h3>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => setActiveAIModal('chat')} className="flex items-center p-4 rounded-2xl bg-[#EAE2D6]/20 hover:bg-[#EAE2D6]/40">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl mr-4"><MessageSquare /></div>
                <div className="text-left"><p className="font-bold">Expert Chat</p><p className="text-xs text-gray-500">Ask any skincare questions (Thinking AI)</p></div>
              </button>
              <button onClick={() => setActiveAIModal('voice')} className="flex items-center p-4 rounded-2xl bg-[#EAE2D6]/20 hover:bg-[#EAE2D6]/40">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl mr-4"><Mic /></div>
                <div className="text-left"><p className="font-bold">Live Voice</p><p className="text-xs text-gray-500">Speak to your skin coach in real-time</p></div>
              </button>
              <button onClick={() => setActiveAIModal('creative')} className="flex items-center p-4 rounded-2xl bg-[#EAE2D6]/20 hover:bg-[#EAE2D6]/40">
                <div className="p-3 bg-pink-100 text-pink-600 rounded-xl mr-4"><Video /></div>
                <div className="text-left"><p className="font-bold">Creative Studio</p><p className="text-xs text-gray-500">Generate skin care videos & photos</p></div>
              </button>
            </div>
            <button onClick={() => setShowAIHub(false)} className="w-full py-3 mt-4 text-gray-400 font-bold">Close Hub</button>
          </div>
        </div>
      )}

      {activeAIModal && <AIModal type={activeAIModal} onClose={() => setActiveAIModal(null)} isDarkMode={isDarkMode} />}

      <BottomNav currentView={currentView} setView={setCurrentView} isDarkMode={isDarkMode} />
    </div>
  );
};

const MetricItem = ({ label, value, icon: Icon, color, isDarkMode }: any) => {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500',
    yellow: 'text-yellow-500 bg-yellow-500',
    red: 'text-red-500 bg-red-500',
    green: 'text-green-500 bg-green-500'
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Icon size={12} className={colors[color].split(' ')[0]} />
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">{label}</span>
        </div>
        <span className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-[#2E2A25]'}`}>{value}%</span>
      </div>
      <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${colors[color].split(' ')[1]}`} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
};

const AIModal = ({ type, onClose, isDarkMode }: { type: string, onClose: () => void, isDarkMode: boolean }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const handleChat = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsBusy(true);
    try {
      const response = await expertChat(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to Gemini Expert." }]);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className={`w-full max-w-md h-[80vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="p-4 border-b flex justify-between items-center bg-[#D4C4A8]/10">
          <h2 className="font-bold capitalize">{type} Assistant</h2>
          <button onClick={onClose} className="p-2"><X /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {type === 'chat' && (
            <>
              {messages.length === 0 && <p className="text-center text-gray-400 mt-20">Start a deep conversation with our AI expert.</p>}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'bg-[#D4C4A8] text-white' : (isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800')}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isBusy && <Loader2 className="animate-spin text-[#D4C4A8] mx-auto" />}
            </>
          )}
          {type === 'voice' && (
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center bg-[#D4C4A8]/20 ${isLive ? 'animate-pulse' : ''}`}>
                <Mic size={48} className={isLive ? 'text-red-500' : 'text-[#D4C4A8]'} />
              </div>
              <p className="text-center font-bold">{isLive ? 'Listening...' : 'Ready to Talk'}</p>
              <button 
                onClick={async () => {
                  if (isLive) return setIsLive(false);
                  setIsLive(true);
                  await startLiveAssistant();
                }}
                className="px-8 py-3 bg-[#D4C4A8] text-white rounded-full font-bold"
              >
                {isLive ? 'Stop' : 'Start Live Session'}
              </button>
            </div>
          )}
          {type === 'creative' && <CreativeStudio isDarkMode={isDarkMode} />}
        </div>
        {type === 'chat' && (
          <div className="p-4 border-t flex space-x-2">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)}
              className={`flex-1 p-3 rounded-xl outline-none ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100'}`} 
              placeholder="Ask anything..."
              onKeyDown={e => e.key === 'Enter' && handleChat()}
            />
            <button onClick={handleChat} className="p-3 bg-[#D4C4A8] text-white rounded-xl"><Sparkles size={20}/></button>
          </div>
        )}
      </div>
    </div>
  );
};

const CreativeStudio = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [type, setType] = useState<'image' | 'video'>('image');
  const [config, setConfig] = useState({ size: '1K', ratio: '1:1' });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      if (type === 'image') {
        const url = await generateProductImage(prompt, config.ratio, config.size as any);
        setResult(url);
      } else {
        const url = await generateSkinVideo(prompt, config.ratio as any);
        setResult(url);
      }
    } catch (e) {
      alert("Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-[#EAE2D6]/20 rounded-xl">
        <button onClick={() => setType('image')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${type === 'image' ? 'bg-white shadow' : ''}`}>Image</button>
        <button onClick={() => setType('video')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${type === 'video' ? 'bg-white shadow' : ''}`}>Video (Veo)</button>
      </div>
      <textarea 
        className={`w-full p-3 rounded-xl h-24 text-sm ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100'}`} 
        placeholder={`Describe your ${type}...`}
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <select value={config.ratio} onChange={e => setConfig({ ...config, ratio: e.target.value })} className={`p-2 rounded-lg text-xs ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <option value="1:1">1:1 Square</option>
          <option value="16:9">16:9 Landscape</option>
          <option value="9:16">9:16 Portrait</option>
        </select>
        {type === 'image' && (
          <select value={config.size} onChange={e => setConfig({ ...config, size: e.target.value })} className={`p-2 rounded-lg text-xs ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <option value="1K">1K HD</option>
            <option value="2K">2K QHD</option>
            <option value="4K">4K UHD</option>
          </select>
        )}
      </div>
      <button onClick={handleGenerate} disabled={isGenerating || !prompt} className="w-full py-4 bg-[#2E2A25] text-white rounded-xl font-bold flex items-center justify-center space-x-2">
        {isGenerating ? <Loader2 className="animate-spin" /> : type === 'image' ? <Sparkles size={18} /> : <Video size={18} />}
        <span>{isGenerating ? 'Generating...' : `Create ${type}`}</span>
      </button>
      {result && (
        <div className="mt-4 rounded-xl overflow-hidden border">
          {type === 'image' ? <img src={result} /> : <video src={result} controls autoPlay className="w-full" />}
        </div>
      )}
    </div>
  );
}

export default App;
