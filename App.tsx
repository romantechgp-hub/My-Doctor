
import React, { useState, useEffect, useRef } from 'react';
import { generateMedicalAdvice, searchMedicineInfo } from './geminiService';
import { PrescriptionData, Gender, SavedPrescription, AdminConfig, UserProfile, ReportDetail, APP_THEMES } from './types';
import Prescription from './components/Prescription';
import Auth from './components/Auth';
import { 
  Stethoscope, 
  Download, 
  RefreshCw, 
  User as UserIcon, 
  HeartPulse,
  Printer,
  LogOut,
  Plus,
  History,
  Activity,
  Search,
  ArrowLeft,
  Settings,
  ImageIcon,
  Save,
  ChevronLeft,
  Camera,
  X,
  Lock,
  Building2,
  PenTool,
  Fingerprint,
  ClipboardList,
  FileSearch,
  AlertCircle,
  Package,
  TrendingUp,
  Users,
  Key,
  Trash2,
  MapPin,
  Phone,
  Droplets,
  Palette,
  Layout
} from 'lucide-react';

const COMMON_CONDITIONS = ["ডায়াবেটিস", "উচ্চ রক্তচাপ", "হাঁপানি (Asthma)", "হার্টের সমস্যা", "কিডনি সমস্যা", "থাইরয়েড", "গ্যাস্ট্রিক", "অ্যালার্জি", "লিভার সমস্যা"];
const COMMON_SYMPTOMS = ["জ্বর", "কাশি", "মাথাব্যথা", "বুক ব্যথা", "পেট ব্যথা", "দুর্বলতা", "শ্বাসকষ্ট", "বমি বমি ভাব", "শরীরে লাল দাগ", "গলা ব্যথা"];
const COMMON_REPORTS = ["রক্ত পরীক্ষা (CBC)", "এক্স-রে (X-Ray)", "ইসিজি (ECG)", "ইউএসজি (USG)", "প্রস্রাব পরীক্ষা", "সিটি স্ক্যান", "এমআরআই", "লিপিড প্রোফাইল", "হিমোগ্লোবিন এ১সি (HbA1c)"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  clinicName: "আপনার ডিজিটাল ডাক্তার",
  clinicDetails: "আধুনিক এআই চালিত চিকিৎসা পরামর্শ কেন্দ্র",
  bannerImage: null,
  footerBannerImage: null,
  signatureImage: null,
  adminProfileImage: null,
  selectedTheme: 'blue',
  homeFooterBannerTitle: "জরুরী প্রয়োজনে যোগাযোগ করুন",
  homeFooterBannerDescription: "আমাদের দক্ষ ডাক্তাররা আপনার সেবায় সবসময় প্রস্তুত। যে কোন প্রয়োজনে আমাদের হেল্পলাইনে কল করুন।",
  homeFooterBannerProfileImage: null
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [symptomsText, setSymptomsText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(Gender.MALE);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [prescription, setPrescription] = useState<PrescriptionData | null>(null);
  const [view, setView] = useState<'dashboard' | 'form' | 'result' | 'medSearch' | 'adminLogin' | 'adminPanel' | 'profile'>('dashboard');
  const [history, setHistory] = useState<SavedPrescription[]>([]);
  
  const [adminConfig, setAdminConfig] = useState<AdminConfig>(DEFAULT_ADMIN_CONFIG);
  const [tempConfig, setTempConfig] = useState<AdminConfig>(DEFAULT_ADMIN_CONFIG);
  
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  
  const [searchMedName, setSearchMedName] = useState('');
  const [medInfo, setMedInfo] = useState<any>(null);
  const [medLoading, setMedLoading] = useState(false);

  const [editProfileData, setEditProfileData] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');

  const [cropModal, setCropModal] = useState<{ active: boolean; type: 'banner' | 'footerBanner' | 'signature' | 'report' | 'adminProfile' | 'userProfile' | 'homeFooterProfile'; image: string | null; reportIndex?: number }>({ active: false, type: 'signature', image: null });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const navigateTo = (newView: typeof view) => {
    if (newView !== view) {
      window.history.pushState({ view: newView }, '', '');
      setView(newView);
    }
  };

  useEffect(() => {
    const savedConfig = localStorage.getItem('global_admin_medical_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setAdminConfig(parsed);
      setTempConfig(parsed);
    }

    const savedUser = localStorage.getItem('logged_in_user');
    if (savedUser) {
      setIsLoggedIn(true);
      setCurrentUser(savedUser);
      loadUserProfile(savedUser);
      loadHistory(savedUser);
    }
    
    const adminCreds = JSON.parse(localStorage.getItem('admin_credentials') || '{"id":"2","pass":"2"}');
    setNewAdminId(adminCreds.id);
    setNewAdminPass(adminCreds.pass);

    if (!window.history.state) {
      window.history.replaceState({ view: 'dashboard' }, '', '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const activeThemeId = isAdmin ? (tempConfig.selectedTheme || 'blue') : (userProfile?.selectedTheme || adminConfig.selectedTheme || 'blue');
    const theme = APP_THEMES.find(t => t.id === activeThemeId) || APP_THEMES[0];
    
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
  }, [isAdmin, tempConfig.selectedTheme, userProfile?.selectedTheme, adminConfig.selectedTheme]);

  const loadUserProfile = (username: string) => {
    const profiles = JSON.parse(localStorage.getItem('medical_app_user_profiles') || '{}');
    const profile = profiles[username] || { username, fullName: username, profileImage: null, selectedTheme: 'blue' };
    setUserProfile(profile);
    setEditProfileData(profile);
    setNewUsername(username);
    
    const users = JSON.parse(localStorage.getItem('medical_app_users') || '[]');
    const authData = users.find((u: any) => u.username === username);
    if (authData) setNewPassword(authData.password);
  };

  const loadHistory = (username: string) => {
    const allHistory = JSON.parse(localStorage.getItem(`history_${username}`) || '[]');
    setHistory(allHistory);
  };

  const loadAllUsers = () => {
    const users = JSON.parse(localStorage.getItem('medical_app_users') || '[]');
    setAllUsers(users);
  };

  const deleteUser = (username: string) => {
    if (window.confirm(`${username} ইউজারটিকে ডিলিট করতে চান?`)) {
      const users = JSON.parse(localStorage.getItem('medical_app_users') || '[]');
      const filtered = users.filter((u: any) => u.username !== username);
      localStorage.setItem('medical_app_users', JSON.stringify(filtered));
      setAllUsers(filtered);
    }
  };

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
    setCurrentUser(username);
    localStorage.setItem('logged_in_user', username);
    loadUserProfile(username);
    loadHistory(username);
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
    localStorage.removeItem('logged_in_user');
    navigateTo('dashboard');
  };

  const saveProfileChanges = () => {
    if (!currentUser || !editProfileData) return;
    
    const users = JSON.parse(localStorage.getItem('medical_app_users') || '[]');
    const profiles = JSON.parse(localStorage.getItem('medical_app_user_profiles') || '{}');
    
    if (newUsername !== currentUser) {
      if (users.some((u: any) => u.username === newUsername)) {
        alert('এই ইউজার আইডিটি ইতিমধ্যে ব্যবহৃত হচ্ছে।');
        return;
      }
      const userIndex = users.findIndex((u: any) => u.username === currentUser);
      if (userIndex > -1) {
        users[userIndex].username = newUsername;
        users[userIndex].password = newPassword;
      }
      profiles[newUsername] = { ...editProfileData, username: newUsername };
      delete profiles[currentUser];
      const oldHistory = localStorage.getItem(`history_${currentUser}`);
      if (oldHistory) {
        localStorage.setItem(`history_${newUsername}`, oldHistory);
        localStorage.removeItem(`history_${currentUser}`);
      }
      setCurrentUser(newUsername);
      localStorage.setItem('logged_in_user', newUsername);
    } else {
      profiles[currentUser] = editProfileData;
      const userIndex = users.findIndex((u: any) => u.username === currentUser);
      if (userIndex > -1) {
        users[userIndex].password = newPassword;
      }
    }
    
    localStorage.setItem('medical_app_users', JSON.stringify(users));
    localStorage.setItem('medical_app_user_profiles', JSON.stringify(profiles));
    setUserProfile(profiles[newUsername || currentUser]);
    alert('প্রোফাইল সফলভাবে আপডেট হয়েছে।');
    navigateTo('dashboard');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminCreds = JSON.parse(localStorage.getItem('admin_credentials') || '{"id":"2","pass":"2"}');
    if (adminUser === adminCreds.id && adminPass === adminCreds.pass) {
      setIsAdmin(true);
      setIsLoggedIn(false);
      setTempConfig(adminConfig);
      loadAllUsers();
      navigateTo('adminPanel');
    } else {
      alert('ভুল অ্যাডমিন তথ্য!');
    }
  };

  const saveAdminConfig = () => {
    localStorage.setItem('global_admin_medical_config', JSON.stringify(tempConfig));
    setAdminConfig(tempConfig);
    localStorage.setItem('admin_credentials', JSON.stringify({ id: newAdminId, pass: newAdminPass }));
    alert('অ্যাডমিন সেটিংস সফলভাবে সেভ হয়েছে।');
  };

  const toggleCondition = (condition: string) => {
    setSelectedConditions(prev => prev.includes(condition) ? prev.filter(c => c !== condition) : [...prev, condition]);
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
  };

  const addReport = () => {
    setReports([...reports, { name: 'রক্ত পরীক্ষা (CBC)', result: '', image: null }]);
  };

  const removeReport = (index: number) => {
    setReports(reports.filter((_, i) => i !== index));
  };

  const updateReport = (index: number, field: keyof ReportDetail, value: string) => {
    const newReports = [...reports];
    (newReports[index] as any)[field] = value;
    setReports(newReports);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age.trim() || (symptomsText.trim() === '' && selectedSymptoms.length === 0)) {
      alert('দয়া করে রোগীর নাম, বয়স এবং অন্তত একটি লক্ষণ প্রদান করুন।');
      return;
    }
    setLoading(true);
    try {
      const data = await generateMedicalAdvice(symptomsText, { 
        name, age, gender, 
        selectedSymptoms, 
        existingConditions: selectedConditions,
        reportDetails: reports 
      });
      const fullData = { ...data, patientName: name, age, gender };
      setPrescription(fullData);
      if (currentUser) {
        const newEntry = { ...fullData, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
        const updatedHistory = [newEntry, ...history].slice(0, 10);
        localStorage.setItem(`history_${currentUser}`, JSON.stringify(updatedHistory));
        setHistory(updatedHistory);
      }
      navigateTo('result');
    } catch (err) {
      alert('দুঃখিত, কোনো সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleMedSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchMedName.trim()) return;
    setMedLoading(true);
    setMedInfo(null);
    try {
      const info = await searchMedicineInfo(searchMedName);
      setMedInfo(info);
    } catch (err) {
      alert('ওষুধ পাওয়া যায়নি।');
    } finally {
      setMedLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: any, reportIndex?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setCropModal({ active: true, type, image: reader.result as string, reportIndex });
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCrop = () => {
    if (canvasRef.current) {
      const croppedBase64 = canvasRef.current.toDataURL('image/png');
      if (cropModal.type === 'report' && cropModal.reportIndex !== undefined) {
        updateReport(cropModal.reportIndex, 'image', croppedBase64);
      } else if (cropModal.type === 'adminProfile') {
        setTempConfig({...tempConfig, adminProfileImage: croppedBase64});
      } else if (cropModal.type === 'userProfile' && editProfileData) {
        setEditProfileData({...editProfileData, profileImage: croppedBase64});
      } else if (cropModal.type === 'banner') {
        setTempConfig({...tempConfig, bannerImage: croppedBase64});
      } else if (cropModal.type === 'footerBanner') {
        setTempConfig({...tempConfig, footerBannerImage: croppedBase64});
      } else if (cropModal.type === 'signature') {
        setTempConfig({...tempConfig, signatureImage: croppedBase64});
      } else if (cropModal.type === 'homeFooterProfile') {
        setTempConfig({...tempConfig, homeFooterBannerProfileImage: croppedBase64});
      }
      setCropModal({ active: false, type: 'signature', image: null });
    }
  };

  useEffect(() => {
    if (cropModal.active && cropModal.image && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        if (cropModal.type === 'report') { canvas.width = 800; canvas.height = 1000; }
        else if (cropModal.type === 'signature') { canvas.width = 300; canvas.height = 80; }
        else if (cropModal.type === 'adminProfile' || cropModal.type === 'userProfile' || cropModal.type === 'homeFooterProfile') { canvas.width = 400; canvas.height = 400; }
        else { canvas.width = 1200; canvas.height = 300; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const targetAspect = canvas.width / canvas.height;
        const imgAspect = img.width / img.height;
        let drawWidth, drawHeight, initialOffsetX, initialOffsetY;
        if (imgAspect > targetAspect) {
          drawHeight = img.height; drawWidth = img.height * targetAspect;
          initialOffsetX = (img.width - drawWidth) / 2; initialOffsetY = 0;
        } else {
          drawWidth = img.width; drawHeight = img.width / targetAspect;
          initialOffsetX = 0; initialOffsetY = (img.height - drawHeight) / 2;
        }
        const zoomWidth = drawWidth / zoom; const zoomHeight = drawHeight / zoom;
        const finalOffsetX = initialOffsetX + (drawWidth - zoomWidth) / 2 - (offset.x / zoom);
        const finalOffsetY = initialOffsetY + (drawHeight - zoomHeight) / 2 - (offset.y / zoom);
        ctx.drawImage(img, finalOffsetX, finalOffsetY, zoomWidth, zoomHeight, 0, 0, canvas.width, canvas.height);
      };
      img.src = cropModal.image;
    }
  }, [cropModal, zoom, offset]);

  return (
    <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri']">
      <style>{`
        :root {
          --primary-color: #2563eb;
          --secondary-color: #eff6ff;
        }
        .text-primary { color: var(--primary-color); }
        .bg-primary { background-color: var(--primary-color); }
        .bg-secondary { background-color: var(--secondary-color); }
        .border-primary { border-color: var(--primary-color); }
        .focus-border-primary:focus { border-color: var(--primary-color); }
      `}</style>

      {cropModal.active && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[3.5rem] max-w-2xl w-full p-12 space-y-8 shadow-2xl">
            <h3 className="text-3xl font-black text-slate-900">ইমেজ ক্রপ করুন</h3>
            <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-200 overflow-hidden min-h-[350px] flex items-center justify-center relative cursor-move" onMouseDown={(e) => setIsDragging(true)} onMouseMove={(e) => { if(isDragging) setOffset({x: offset.x + e.movementX, y: offset.y + e.movementY}) }} onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}>
              <canvas ref={canvasRef} className={`max-w-full shadow-2xl ${cropModal.type === 'adminProfile' || cropModal.type === 'userProfile' || cropModal.type === 'homeFooterProfile' ? 'rounded-full' : 'rounded-2xl'}`} />
            </div>
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-2">জুম</label>
              <input type="range" min="1" max="5" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full accent-blue-600" />
            </div>
            <div className="flex gap-6">
              <button onClick={applyCrop} className="flex-grow bg-primary text-white py-6 rounded-[2rem] font-black text-xl hover:opacity-90">নিশ্চিত করুন</button>
              <button onClick={() => setCropModal({ active: false, type: 'signature', image: null })} className="px-10 py-6 border-2 border-slate-200 rounded-[2rem] font-black text-slate-500 hover:bg-slate-50 transition-all text-xl">বাতিল</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b py-5 shadow-sm no-print sticky top-0 z-50">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigateTo(isAdmin ? 'adminPanel' : 'dashboard')}>
            <div className="bg-primary p-2.5 rounded-xl text-white"><Stethoscope size={28} /></div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight hidden sm:block">আপনার ডিজিটাল ডাক্তার</h1>
          </div>
          <div className="flex items-center gap-5">
            {isLoggedIn && (
               <button onClick={() => navigateTo('profile')} className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-full border hover:bg-white transition-all group">
                  <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden border-2 border-white shadow-sm">
                    {userProfile?.profileImage ? <img src={userProfile.profileImage} className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-auto mt-2 text-primary" />}
                  </div>
                  <span className="font-black text-sm text-slate-700 group-hover:text-primary transition-colors hidden xs:block">{userProfile?.fullName || currentUser}</span>
               </button>
            )}
            {(isLoggedIn || isAdmin) ? (
              <button onClick={handleLogout} className="bg-red-50 text-red-600 p-2.5 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-100"><LogOut size={22} /></button>
            ) : (
              <button onClick={() => navigateTo('adminLogin')} className="text-xs font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-colors">অ্যাডমিন</button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {!isLoggedIn && !isAdmin && view !== 'adminLogin' ? (
          <Auth onLogin={handleLogin} />
        ) : (
          <>
            {view === 'dashboard' && isLoggedIn && (
              <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden bg-primary rounded-[3.5rem] p-12 md:p-16 text-white shadow-2xl bg-gradient-to-br from-primary to-slate-900">
                  <div className="absolute top-[-20%] right-[-10%] p-20 opacity-10 rotate-12 pointer-events-none float-anim"><HeartPulse className="w-96 h-96" /></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 md:w-44 md:h-44 rounded-[3rem] bg-white/10 border-4 border-white/20 overflow-hidden shadow-2xl cursor-pointer hover:scale-105 transition-transform" onClick={() => navigateTo('profile')}>
                        {userProfile?.profileImage ? <img src={userProfile.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-white/10"><UserIcon size={64} className="opacity-30" /></div>}
                      </div>
                    </div>
                    <div className="text-center md:text-left space-y-8 flex-grow">
                      <div>
                        <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight">স্বাগতম, <br /> {userProfile?.fullName}!</h2>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                          {userProfile?.bloodGroup && <span className="bg-red-500/20 px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-2 border border-red-500/30"><Droplets size={14}/> Blood Group: {userProfile.bloodGroup}</span>}
                          {userProfile?.age && <span className="bg-white/10 px-4 py-1.5 rounded-full text-sm font-black border border-white/20">বয়স: {userProfile.age} বছর</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-5 justify-center md:justify-start">
                        <button onClick={() => navigateTo('form')} className="bg-white text-primary px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-slate-50 transition-all flex items-center gap-3"><Plus size={24} /> নতুন প্রেসক্রিপশন</button>
                        <button onClick={() => navigateTo('medSearch')} className="bg-white/10 text-white border-2 border-white/20 backdrop-blur-md px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-white/20 transition-all flex items-center gap-3"><Search size={24} /> ওষুধ অনুসন্ধান</button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 px-2"><History size={28} className="text-primary" /> সাম্প্রতিক প্রেসক্রিপশন</h3>
                  {history.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {history.map(item => (
                        <div key={item.id} onClick={() => { setPrescription(item); navigateTo('result'); }} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group">
                           <div className="flex justify-between items-start mb-6">
                              <div className="bg-secondary p-4 rounded-2xl text-primary group-hover:bg-primary group-hover:text-white transition-colors"><ClipboardList size={24} /></div>
                              <span className="text-xs font-black text-slate-300 tracking-widest">{new Date(item.timestamp).toLocaleDateString('bn-BD')}</span>
                           </div>
                           <h4 className="text-2xl font-black text-slate-800 mb-2">{item.patientName}</h4>
                           <p className="text-sm text-slate-400 font-bold line-clamp-1">{item.diagnosis}</p>
                        </div>
                      ))}
                    </div>
                  ) : <div className="bg-white p-20 rounded-[4rem] text-center border-2 border-dashed border-slate-200"><p className="text-slate-300 font-black text-xl">কোনো ইতিহাস পাওয়া যায়নি</p></div>}
                </div>

                {/* Dashboard Footer Banner (Admin Controlled - Styled like Welcome Banner) */}
                <div className="pt-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="relative overflow-hidden bg-slate-900 rounded-[3.5rem] p-12 md:p-16 text-white shadow-2xl bg-gradient-to-br from-slate-800 to-black group">
                    {/* Background Image if exists */}
                    {adminConfig.footerBannerImage && (
                      <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <img src={adminConfig.footerBannerImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                      </div>
                    )}
                    
                    <div className="absolute top-[-20%] right-[-10%] p-20 opacity-10 rotate-12 pointer-events-none float-anim"><Activity className="w-96 h-96 text-primary" /></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 md:w-44 md:h-44 rounded-[3rem] bg-white/5 border-4 border-white/10 overflow-hidden shadow-2xl">
                          {adminConfig.homeFooterBannerProfileImage ? (
                            <img src={adminConfig.homeFooterBannerProfileImage} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/10">
                              <Stethoscope size={64} className="opacity-30" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-center md:text-left space-y-6 flex-grow">
                        <div>
                          <h2 className="text-3xl md:text-5xl font-black mb-4 leading-tight">{adminConfig.homeFooterBannerTitle || "আপনার সেবায় আমরা"}</h2>
                          <p className="text-lg md:text-xl text-white/70 font-bold max-w-2xl leading-relaxed">
                            {adminConfig.homeFooterBannerDescription || "সবসময় আপনার সুস্থতা কামনায় কাজ করে যাচ্ছি। যে কোন প্রয়োজনে আমাদের সাথে যোগাযোগ করুন।"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {view === 'profile' && isLoggedIn && editProfileData && (
              <div className="max-w-4xl mx-auto space-y-12 pb-32 animate-in slide-in-from-bottom-6 duration-500">
                <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-3 text-slate-500 font-black hover:text-primary transition-all text-lg"><ArrowLeft size={24} /> ফিরে যান</button>
                
                <div className="bg-white rounded-[4rem] border shadow-2xl overflow-hidden">
                  <div className="bg-primary h-40 relative bg-gradient-to-r from-primary to-indigo-900">
                     <div className="absolute -bottom-16 left-12 flex items-end gap-6">
                        <div className="relative group">
                          <div className="w-40 h-40 rounded-[3rem] border-8 border-white bg-slate-100 overflow-hidden shadow-2xl">
                             {editProfileData.profileImage ? <img src={editProfileData.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><UserIcon size={60} className="text-slate-300" /></div>}
                          </div>
                          <label className="absolute bottom-2 right-2 bg-primary text-white p-3 rounded-2xl shadow-xl cursor-pointer hover:opacity-90 transition-all hover:scale-110 active:scale-95">
                             <input type="file" onChange={e => handleImageUpload(e, 'userProfile')} className="hidden" />
                             <Camera size={24} />
                          </label>
                        </div>
                        <div className="mb-4">
                           <h2 className="text-3xl font-black text-white drop-shadow-md">{editProfileData.fullName || currentUser}</h2>
                           <p className="text-white/80 font-bold">লগইন আইডি: @{currentUser}</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-12 pt-24 space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-4 border-b pb-4"><Palette className="text-primary" /> থিম পরিবর্তন করুন (২০টি থিম)</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {APP_THEMES.map(theme => (
                          <button 
                            key={theme.id}
                            onClick={() => setEditProfileData({...editProfileData, selectedTheme: theme.id})}
                            className={`p-4 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-2 ${editProfileData.selectedTheme === theme.id ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-105' : 'border-slate-100 hover:border-slate-200'}`}
                          >
                            <div className="w-10 h-10 rounded-full shadow-inner" style={{ backgroundColor: theme.primary }} />
                            <span className="text-[10px] font-black text-slate-600 line-clamp-1">{theme.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-8">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-4 border-b pb-4"><UserIcon className="text-primary" /> ব্যক্তিগত তথ্য</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">আপনার পূর্ণ নাম</label>
                           <input type="text" value={editProfileData.fullName || ''} onChange={e => setEditProfileData({...editProfileData, fullName: e.target.value})} className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black outline-none focus-border-primary transition-all" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">রক্তের গ্রুপ</label>
                           <select value={editProfileData.bloodGroup || ''} onChange={e => setEditProfileData({...editProfileData, bloodGroup: e.target.value})} className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black outline-none focus-border-primary transition-all">
                              <option value="">নির্বাচন করুন</option>
                              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                           </select>
                        </div>
                        <div className="space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">বয়স</label>
                           <input type="number" value={editProfileData.age || ''} onChange={e => setEditProfileData({...editProfileData, age: e.target.value})} className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black outline-none focus-border-primary transition-all" placeholder="বছর" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">মোবাইল নম্বর</label>
                           <div className="relative">
                             <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                             <input type="text" value={editProfileData.mobile || ''} onChange={e => setEditProfileData({...editProfileData, mobile: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black outline-none focus-border-primary transition-all" />
                           </div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">বর্তমান ঠিকানা</label>
                           <div className="relative">
                             <MapPin className="absolute left-6 top-6 text-slate-300" size={18} />
                             <textarea value={editProfileData.address || ''} onChange={e => setEditProfileData({...editProfileData, address: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none focus-border-primary transition-all h-32" />
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem]">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-4 border-b pb-4"><Fingerprint className="text-primary" /> অ্যাকাউন্ট সিকিউরিটি</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">ইউজার আইডি (Username)</label>
                           <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black outline-none focus-border-primary transition-all" />
                        </div>
                        <div className="space-y-3">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">নতুন পাসওয়ার্ড</label>
                           <div className="relative">
                             <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                             <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black outline-none focus-border-primary transition-all" />
                           </div>
                        </div>
                      </div>
                    </div>

                    <button onClick={saveProfileChanges} className="w-full bg-primary text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:opacity-90 transition-all flex items-center justify-center gap-4 active:scale-[0.98]">
                      <Save size={24} /> সকল তথ্য সেভ করুন
                    </button>
                  </div>
                </div>
              </div>
            )}

            {view === 'adminPanel' && isAdmin && (
              <div className="max-w-7xl mx-auto space-y-12 pb-32 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-6">
                      <div className="bg-slate-900 p-4 rounded-[2rem] text-white shadow-2xl shadow-slate-200"><Settings size={40} /></div>
                      <div>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tight">অ্যাডমিন প্যানেল</h2>
                        <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">ক্লিনিক ও ডিজাইন ম্যানেজমেন্ট</p>
                      </div>
                   </div>
                   <button onClick={saveAdminConfig} className="bg-primary text-white px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:opacity-90 transition-all flex items-center gap-3"><Save size={24} /> সেটিংস সেভ করুন</button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-10">
                    <div className="bg-white p-12 rounded-[4rem] border shadow-sm space-y-10">
                      <h3 className="text-2xl font-black text-slate-800 border-b pb-6 flex items-center gap-4"><Building2 className="text-primary" /> ক্লিনিক ব্র্যান্ডিং ও থিম</h3>
                      
                      <div className="space-y-6 pt-4">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">ক্লিনিক গ্লোবাল থিম (Rx থিম)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                          {APP_THEMES.map(theme => (
                            <button 
                              key={theme.id}
                              onClick={() => setTempConfig({...tempConfig, selectedTheme: theme.id})}
                              className={`p-4 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-2 ${tempConfig.selectedTheme === theme.id ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: theme.primary }} />
                              <span className="text-[10px] font-black text-slate-600 line-clamp-1">{theme.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        <div className="space-y-4"><label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">ক্লিনিকের নাম</label><input type="text" value={tempConfig.clinicName} onChange={e => setTempConfig({...tempConfig, clinicName: e.target.value})} className="w-full px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black outline-none focus-border-primary transition-all" /></div>
                        <div className="space-y-4"><label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">ক্লিনিকের ঠিকানা ও তথ্য</label><textarea value={tempConfig.clinicDetails} onChange={e => setTempConfig({...tempConfig, clinicDetails: e.target.value})} className="w-full px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold outline-none focus-border-primary transition-all h-[60px]" /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4"><label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">হেডার ব্যানার ইমেজ</label><div className="relative h-40 bg-slate-100 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center group overflow-hidden">{tempConfig.bannerImage ? <img src={tempConfig.bannerImage} className="w-full h-full object-cover" /> : <ImageIcon size={48} className="text-slate-300" />}<label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"><input type="file" onChange={e => handleImageUpload(e, 'banner')} className="hidden" /><Camera size={32} /></label></div></div>
                        <div className="space-y-4"><label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">ফুটার ব্যানার ইমেজ (Rx-এর জন্য)</label><div className="relative h-40 bg-slate-100 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center group overflow-hidden">{tempConfig.footerBannerImage ? <img src={tempConfig.footerBannerImage} className="w-full h-full object-cover" /> : <ImageIcon size={48} className="text-slate-300" />}<label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"><input type="file" onChange={e => handleImageUpload(e, 'footerBanner')} className="hidden" /><Camera size={32} /></label></div></div>
                        <div className="space-y-4"><label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">ডিজিটাল স্বাক্ষর (৩০০x৮০)</label><div className="relative h-40 bg-white border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center group overflow-hidden">{tempConfig.signatureImage ? <img src={tempConfig.signatureImage} className="h-full object-contain p-4" /> : <PenTool size={48} className="text-slate-300" />}<label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"><input type="file" onChange={e => handleImageUpload(e, 'signature')} className="hidden" /><Camera size={32} /></label></div></div>
                      </div>
                    </div>

                    {/* Dashboard Footer Banner Settings */}
                    <div className="bg-white p-12 rounded-[4rem] border shadow-sm space-y-10">
                      <h3 className="text-2xl font-black text-slate-800 border-b pb-6 flex items-center gap-4"><Layout className="text-primary" /> ড্যাশবোর্ড ফুটার ব্যানার সেটিংস</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="space-y-4">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">ফুটার ব্যানার টাইটেল</label>
                              <input type="text" value={tempConfig.homeFooterBannerTitle} onChange={e => setTempConfig({...tempConfig, homeFooterBannerTitle: e.target.value})} className="w-full px-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black outline-none focus-border-primary" />
                           </div>
                           <div className="space-y-4">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">ফুটার ব্যানার বর্ণনা</label>
                              <textarea value={tempConfig.homeFooterBannerDescription} onChange={e => setTempConfig({...tempConfig, homeFooterBannerDescription: e.target.value})} className="w-full px-8 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus-border-primary h-32" />
                           </div>
                        </div>
                        <div className="space-y-4">
                           <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-2">ফুটার ব্যানার প্রোফাইল ছবি</label>
                           <div className="relative h-[240px] bg-slate-100 border-2 border-dashed border-slate-200 rounded-[3rem] flex items-center justify-center group overflow-hidden">
                              {tempConfig.homeFooterBannerProfileImage ? (
                                <img src={tempConfig.homeFooterBannerProfileImage} className="w-full h-full object-cover" />
                              ) : (
                                <UserIcon size={60} className="text-slate-300" />
                              )}
                              <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <input type="file" onChange={e => handleImageUpload(e, 'homeFooterProfile')} className="hidden" />
                                <Camera size={32} />
                              </label>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-12 rounded-[4rem] border shadow-sm space-y-10">
                      <div className="flex justify-between items-center border-b pb-6"><h3 className="text-2xl font-black text-slate-800 flex items-center gap-4"><Users className="text-primary" /> ইউজার ম্যানেজমেন্ট</h3><span className="bg-secondary text-primary px-6 py-2 rounded-full font-black text-sm">{allUsers.length} জন ইউজার</span></div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-y-4">
                          <thead><tr className="text-left text-xs font-black uppercase tracking-widest text-slate-400"><th className="px-6 pb-2">ইউজার আইডি</th><th className="px-6 pb-2">পাসওয়ার্ড</th><th className="px-6 pb-2 text-right">অ্যাকশন</th></tr></thead>
                          <tbody>{allUsers.length > 0 ? allUsers.map((user, idx) => (<tr key={idx} className="bg-slate-50 rounded-2xl overflow-hidden group"><td className="px-6 py-5 first:rounded-l-[1.5rem] font-black text-slate-800 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary"><UserIcon size={16} /></div>{user.username}</td><td className="px-6 py-5 font-bold text-slate-500"><div className="flex items-center gap-2"><Key size={14} className="text-slate-300" /><span>{user.password}</span></div></td><td className="px-6 py-5 last:rounded-r-[1.5rem] text-right"><button onClick={() => deleteUser(user.username)} className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="ইউজার ডিলিট করুন"><Trash2 size={20} /></button></td></tr>)) : (<tr><td colSpan={3} className="text-center py-10 text-slate-300 font-bold">কোনো ইউজার পাওয়া যায়নি</td></tr>)}</tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-10">
                    <div className="bg-white p-10 rounded-[4rem] border shadow-sm text-center space-y-6"><div className="relative mx-auto w-40 h-40 group"><div className="w-full h-full rounded-[3.5rem] bg-slate-100 border-4 border-white shadow-2xl overflow-hidden ring-4 ring-slate-50">{tempConfig.adminProfileImage ? <img src={tempConfig.adminProfileImage} className="w-full h-full object-cover" /> : <UserIcon size={64} className="m-8 text-slate-300" />}</div><label className="absolute bottom-2 right-2 bg-primary text-white p-3 rounded-2xl shadow-xl cursor-pointer hover:opacity-90 transition-all"><input type="file" onChange={e => handleImageUpload(e, 'adminProfile')} className="hidden" /><Camera size={20} /></label></div><div><h4 className="text-xl font-black text-slate-800">অ্যাডমিন প্রোফাইল</h4><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">প্রোফাইল ছবি পরিবর্তন করুন</p></div></div>
                    <div className="bg-slate-900 p-10 rounded-[4rem] text-white space-y-8 shadow-2xl"><h3 className="text-xl font-black border-b border-white/10 pb-4 flex items-center gap-3"><Fingerprint size={24} className="text-primary" /> অ্যাকাউন্ট সেটিংস</h3><div className="space-y-6"><div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">অ্যাডমিন ইউজার আইডি</label><input type="text" value={newAdminId} onChange={e => setNewAdminId(e.target.value)} className="w-full pl-6 pr-6 py-4 bg-white border-0 rounded-[1.5rem] font-black text-slate-800" placeholder="নতুন আইডি" /></div><div className="space-y-3"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">অ্যাডমিন পাসওয়ার্ড</label><input type="password" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} className="w-full pl-6 pr-6 py-4 bg-white border-0 rounded-[1.5rem] font-black text-slate-800" placeholder="নতুন পাসওয়ার্ড" /></div></div></div>
                  </div>
                </div>
              </div>
            )}
            
            {view === 'form' && isLoggedIn && (
              <div className="max-w-4xl mx-auto pb-20 animate-in zoom-in-95 duration-300">
                <button onClick={() => navigateTo('dashboard')} className="mb-10 flex items-center gap-3 text-slate-500 font-black hover:text-primary transition-all text-lg"><ArrowLeft size={24} /> ড্যাশবোর্ড</button>
                <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
                  <div className="bg-primary px-14 py-16 text-white"><h2 className="text-4xl font-black mb-3">পরামর্শের আবেদন</h2><p className="text-white/80 text-lg font-bold">আপনার তথ্য এবং রিপোর্ট প্রদান করুন</p></div>
                  <form onSubmit={handleSubmit} className="p-14 space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 border-b pb-4"><UserIcon className="text-primary" /> ১. রোগীর সাধারণ তথ্য</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-6 py-4 rounded-2xl border-2 font-black bg-white focus-border-primary outline-none" placeholder="নাম" />
                        <input type="text" value={age} onChange={e => setAge(e.target.value)} className="w-full px-6 py-4 rounded-2xl border-2 font-black bg-white focus-border-primary outline-none" placeholder="বয়স" />
                        <select value={gender} onChange={e => setGender(e.target.value as Gender)} className="w-full px-6 py-4 rounded-2xl border-2 font-black bg-white focus-border-primary outline-none"><option value={Gender.MALE}>পুরুষ</option><option value={Gender.FEMALE}>মহিলা</option></select>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 border-b pb-4"><Activity className="text-primary" /> ২. বর্তমান লক্ষণসমূহ</h3>
                      <div className="flex flex-wrap gap-3 mb-6">{COMMON_SYMPTOMS.map(symptom => (<button key={symptom} type="button" onClick={() => toggleSymptom(symptom)} className={`px-6 py-3 rounded-2xl font-black text-sm transition-all border-2 ${selectedSymptoms.includes(symptom) ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-primary/20'}`}>{symptom}</button>))}</div>
                      <textarea value={symptomsText} onChange={e => setSymptomsText(e.target.value)} rows={3} className="w-full px-8 py-6 rounded-[2.5rem] border-2 font-medium bg-white focus-border-primary outline-none" placeholder="অতিরিক্ত কোনো সমস্যা থাকলে এখানে লিখুন..."></textarea>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 border-b pb-4"><HeartPulse className="text-primary" /> ৩. পূর্ববর্তী রোগের ইতিহাস</h3>
                      <div className="flex flex-wrap gap-3">{COMMON_CONDITIONS.map(condition => (<button key={condition} type="button" onClick={() => toggleCondition(condition)} className={`px-6 py-3 rounded-2xl font-black text-sm transition-all border-2 ${selectedConditions.includes(condition) ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-red-200'}`}>{condition}</button>))}</div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b pb-4"><h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><FileSearch className="text-primary" /> ৪. মেডিকেল রিপোর্ট</h3><button type="button" onClick={addReport} className="text-primary font-black text-sm flex items-center gap-2 px-4 py-2 rounded-xl transition-all"><Plus size={18} /> যোগ করুন</button></div>
                      <div className="space-y-6">{reports.map((report, index) => (<div key={index} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center gap-6 relative animate-in slide-in-from-right-4"><button type="button" onClick={() => removeReport(index)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500"><X size={18} /></button><div className="flex-grow"><select value={report.name} onChange={e => updateReport(index, 'name', e.target.value)} className="w-full px-4 py-2 bg-white border-2 rounded-xl font-black mb-2 text-sm">{COMMON_REPORTS.map(r => <option key={r} value={r}>{r}</option>)}<option value="অন্যান্য">অন্যান্য</option></select><input type="text" value={report.result} onChange={e => updateReport(index, 'result', e.target.value)} className="w-full px-4 py-2 bg-white border-2 rounded-xl text-sm font-bold" placeholder="ফলাফল (যেমন: Normal)" /></div><div className="w-20 h-20 bg-white rounded-xl border-2 border-dashed flex items-center justify-center group/img overflow-hidden relative">{report.image ? <img src={report.image} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-slate-200" />}<label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/50 text-white opacity-0 group-hover/img:opacity-100 transition-opacity"><input type="file" onChange={e => handleImageUpload(e, 'report', index)} className="hidden" /><Camera size={20} /></label></div></div>))}</div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-primary text-white py-8 rounded-[3rem] font-black text-2xl shadow-2xl hover:opacity-90 transition-all flex items-center justify-center gap-6 active:scale-95">{loading ? <RefreshCw className="animate-spin w-10 h-10" /> : <Stethoscope size={40} />} Rx জেনারেট করুন</button>
                  </form>
                </div>
              </div>
            )}

            {view === 'result' && prescription && (
              <div className="max-w-5xl mx-auto space-y-10 pb-32 animate-in fade-in duration-500">
                <div className="flex flex-wrap gap-4 justify-between items-center no-print"><button onClick={() => navigateTo('dashboard')} className="flex items-center gap-4 text-slate-500 font-black hover:text-primary transition-all text-xl"><ChevronLeft size={32} /> ফিরে যান</button><div className="flex gap-4"><button onClick={() => { const opt = { margin: 10, filename: `Rx_${prescription.patientName}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } }; // @ts-ignore
                      window.html2pdf().from(document.getElementById('prescription-to-download')).set(opt).save(); }} className="bg-primary text-white px-10 py-5 rounded-[2rem] font-black hover:opacity-90 transition-all flex items-center gap-4 text-xl shadow-lg active:scale-95"><Download size={28} /> PDF ডাউনলোড</button><button onClick={() => window.print()} className="bg-white border-2 px-10 py-5 rounded-[2rem] font-black text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-4 text-xl shadow-sm"><Printer size={28} /> প্রিন্ট</button></div></div>
                <div id="prescription-to-download" className="bg-white shadow-2xl rounded-[3rem] border-2 border-slate-100 overflow-hidden"><Prescription data={prescription} config={adminConfig} /></div>
              </div>
            )}
            
            {view === 'medSearch' && isLoggedIn && (
              <div className="max-w-4xl mx-auto pb-20 animate-in zoom-in-95 duration-300">
                <button onClick={() => navigateTo('dashboard')} className="mb-6 md:mb-10 flex items-center gap-3 text-slate-500 font-black hover:text-primary transition-all text-lg"><ArrowLeft size={24} /> ড্যাশবোর্ড</button>
                <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 p-6 md:p-12">
                  <h2 className="text-2xl md:text-4xl font-black mb-6 md:mb-8 flex items-center gap-4 text-slate-800"><Search size={32} className="text-primary" /> ওষুধ অনুসন্ধান</h2>
                  <form onSubmit={handleMedSearch} className="flex flex-col sm:flex-row gap-4 mb-8 md:mb-10">
                    <input type="text" value={searchMedName} onChange={e => setSearchMedName(e.target.value)} placeholder="ওষুধের নাম লিখুন..." className="flex-grow px-6 md:px-8 py-4 md:py-5 rounded-[1.5rem] md:rounded-[2rem] border-2 font-black outline-none focus-border-primary text-base md:text-lg bg-white transition-all" />
                    <button type="submit" className="bg-primary text-white py-4 sm:py-0 px-10 rounded-[1.5rem] md:rounded-[2rem] font-black hover:opacity-90 transition-all shadow-xl active:scale-95">খুঁজুন</button>
                  </form>
                  {medLoading && <div className="flex flex-col items-center justify-center py-16 md:py-20 gap-4"><RefreshCw className="animate-spin text-primary w-12 h-12 md:w-[60px] md:h-[60px]" /><p className="font-black text-slate-400 text-lg md:text-xl">ওষুধের তথ্য সংগ্রহ করা হচ্ছে...</p></div>}
                  {medInfo && (
                    <div className="space-y-10 md:space-y-12 animate-in fade-in duration-500">
                      <div className="bg-secondary p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border-2 border-primary/20 shadow-sm relative overflow-hidden">
                        <div className="absolute top-[-10%] right-[-5%] opacity-5 pointer-events-none"><Package className="w-[150px] h-[150px] md:w-[200px] md:h-[200px]" /></div>
                        <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary mb-4 md:mb-6 flex items-center gap-2"><Activity size={14}/> মূল ওষুধের তথ্য</h3>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
                          <div>
                            <h4 className="text-3xl md:text-5xl font-black text-slate-800 mb-2 md:mb-3">{medInfo.originalName}</h4>
                            <div className="flex flex-wrap gap-2 md:gap-4 items-center">
                               <p className="text-lg md:text-xl font-black text-primary bg-white px-3 md:px-4 py-1 md:py-1.5 rounded-xl border border-primary/20">{medInfo.genericName}</p>
                               <span className="hidden sm:block w-1.5 h-1.5 bg-slate-300 rounded-full" />
                               <p className="text-base md:text-lg font-bold text-slate-500">{medInfo.company}</p>
                            </div>
                          </div>
                          <div className="bg-white w-full md:w-auto px-6 md:px-10 py-4 md:py-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-primary/10 text-center"><p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">বাজার মূল্য (প্রায়)</p><p className="text-3xl md:text-4xl font-black text-primary">৳ {medInfo.estimatedPrice}</p></div>
                        </div>
                      </div>
                      <div className="space-y-6 md:space-y-8">
                        <div className="flex items-center gap-3 md:gap-4"><TrendingUp className="text-primary w-7 h-7 md:w-8 md:h-8" /><h3 className="text-xl md:text-2xl font-black text-slate-800">বিকল্প ওষুধ (একই জেনেরিক)</h3></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                          {medInfo.alternatives.map((alt: any, i: number) => (
                            <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-2 border-slate-50 shadow-sm hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 transition-all flex flex-col group">
                              <div className="bg-secondary w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-primary mb-4 md:mb-6 group-hover:bg-primary group-hover:text-white transition-colors"><Package size={24} /></div>
                              <h5 className="text-xl md:text-2xl font-black text-slate-800 mb-1">{alt.name}</h5>
                              <p className="text-xs md:font-bold text-slate-400 mb-4 md:mb-6">{alt.company}</p>
                              <div className="mt-auto pt-4 md:pt-6 border-t flex justify-between items-center"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">খুচরা মূল্য</span><span className="text-lg md:text-xl font-black text-primary bg-secondary px-3 md:px-4 py-1.5 md:py-2 rounded-xl md:rounded-2xl">৳ {alt.estimatedPrice}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {!medInfo && !medLoading && <div className="text-center py-16 md:py-20 space-y-4"><Search className="mx-auto text-slate-100 w-16 h-16 md:w-20 md:h-20" /><p className="text-slate-300 font-black text-lg md:text-xl px-4">যেকোনো ওষুধের নাম লিখে অনুসন্ধান করুন</p></div>}
                </div>
              </div>
            )}

            {view === 'adminLogin' && (
              <div className="max-w-md mx-auto mt-20 px-4">
                 <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border">
                  <div className="bg-slate-800 p-10 text-white text-center relative"><div className="bg-white/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4"><Lock size={32} /></div><h2 className="text-3xl font-black tracking-tight">অ্যাডমিন লগইন</h2></div>
                  <form onSubmit={handleAdminLogin} className="p-10 space-y-6"><input type="text" value={adminUser} onChange={e => setAdminUser(e.target.value)} className="w-full px-6 py-4 rounded-2xl border-2 font-black outline-none focus-border-primary bg-white transition-all" placeholder="ইউজার আইডি" /><input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} className="w-full px-6 py-4 rounded-2xl border-2 font-black outline-none focus-border-primary bg-white transition-all" placeholder="পাসওয়ার্ড" /><button type="submit" className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl">প্রবেশ করুন</button><button type="button" onClick={() => navigateTo('dashboard')} className="w-full text-slate-400 font-bold text-sm text-center">ফিরে যান</button></form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;
