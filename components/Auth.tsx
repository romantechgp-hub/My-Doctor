
import React, { useState } from 'react';
import { User, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthProps {
  onLogin: (username: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username || !password) {
      setError('তথ্য প্রদান করা আবশ্যক।');
      return;
    }

    const users = JSON.parse(localStorage.getItem('medical_app_users') || '[]');

    if (isLoginView) {
      const user = users.find((u: any) => u.username === username && u.password === password);
      if (user) {
        onLogin(username);
      } else {
        setError('ভুল ইউজার আইডি বা পাসওয়ার্ড।');
      }
    } else {
      const userExists = users.some((u: any) => u.username === username);
      if (userExists) {
        setError('এই ইউজার আইডিটি ইতিমধ্যে আছে।');
      } else {
        users.push({ username, password });
        localStorage.setItem('medical_app_users', JSON.stringify(users));
        setSuccess('রেজিস্ট্রেশন সফল! এখন লগইন করুন।');
        setIsLoginView(true);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 px-4">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {isLoginView ? <LogIn size={32} /> : <UserPlus size={32} />}
          </div>
          <h2 className="text-2xl font-bold">{isLoginView ? 'লগইন করুন' : 'নতুন অ্যাকাউন্ট'}</h2>
        </div>

        <form onSubmit={handleAuth} className="p-8 space-y-6">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 font-bold"><AlertCircle size={16}/> {error}</div>}
          {success && <div className="p-4 bg-green-50 text-green-600 rounded-xl text-sm flex items-center gap-2 font-bold"><CheckCircle2 size={16}/> {success}</div>}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">ইউজার আইডি</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold" placeholder="আপনার আইডি" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">পাসওয়ার্ড</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold" placeholder="গোপন পাসওয়ার্ড" />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg transition-all active:scale-95">
            {isLoginView ? 'প্রবেশ করুন' : 'রেজিস্ট্রেশন করুন'}
          </button>

          <button type="button" onClick={() => setIsLoginView(!isLoginView)} className="w-full text-blue-600 font-bold text-sm text-center hover:underline">
            {isLoginView ? 'অ্যাকাউন্ট নেই? নতুন অ্যাকাউন্ট খুলুন' : 'অ্যাকাউন্ট আছে? লগইন করুন'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
