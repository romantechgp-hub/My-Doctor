
import React from 'react';
import { PrescriptionData, AdminConfig, APP_THEMES } from '../types';
import { AlertCircle, Stethoscope, Activity } from 'lucide-react';

interface PrescriptionProps {
  data: PrescriptionData;
  config?: AdminConfig;
}

const Prescription: React.FC<PrescriptionProps> = ({ data, config }) => {
  const selectedTheme = APP_THEMES.find(t => t.id === config?.selectedTheme) || APP_THEMES[0];
  const primaryColor = selectedTheme.primary;
  const accentColor = selectedTheme.secondary;

  const clinicName = config?.clinicName || "আপনার ডিজিটাল ডাক্তার";
  const clinicDetails = config?.clinicDetails || "আধুনিক চিকিৎসা পরামর্শ কেন্দ্র";

  return (
    <div className="bg-white w-full font-['Hind_Siliguri'] relative overflow-hidden flex flex-col min-h-[1100px]">
      {/* Top Border */}
      <div className="h-3 w-full shrink-0" style={{ backgroundColor: primaryColor }} />

      {/* Header Banner */}
      {config?.bannerImage && (
        <div className="w-full border-b overflow-hidden bg-slate-50 shrink-0">
          <img src={config.bannerImage} alt="Clinic Header Banner" className="w-full max-h-[150px] object-cover" />
        </div>
      )}
      
      <div className="p-8 md:p-12 flex flex-col flex-grow relative z-10">
        {/* Header Section */}
        <div className="flex justify-between items-start border-b-2 pb-6 mb-10 shrink-0">
          <div className="flex-grow max-w-[75%]">
            <h1 className="text-3xl font-black text-slate-800 mb-2 leading-tight" style={{ color: primaryColor }}>{clinicName}</h1>
            <p className="text-xs font-semibold text-slate-500 whitespace-pre-line leading-relaxed">{clinicDetails}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-white px-5 py-2 text-2xl font-black rounded-xl mb-3 inline-block shadow-md" style={{ backgroundColor: primaryColor }}>Rx</div>
            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">তারিখ</p>
               <p className="font-black text-slate-800 text-xs">{data.date}</p>
            </div>
          </div>
        </div>

        {/* Patient Info Section */}
        <div 
          className="p-6 rounded-[2rem] flex flex-wrap justify-between gap-4 border shadow-sm mb-10 shrink-0"
          style={{ backgroundColor: accentColor, borderColor: primaryColor, opacity: 0.9 }}
        >
          <div className="flex-grow min-w-[200px]">
            <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5 tracking-widest">রোগীর নাম</span>
            <span className="text-xl font-black text-slate-800">{data.patientName}</span>
          </div>
          <div className="w-20">
            <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5 tracking-widest">বয়স</span>
            <span className="text-lg font-black text-slate-800">{data.age}</span>
          </div>
          <div className="w-24">
            <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5 tracking-widest">লিঙ্গ</span>
            <span className="text-lg font-black text-slate-800">{data.gender}</span>
          </div>
        </div>

        {/* Main Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 flex-grow">
          <div className="md:col-span-4 border-r pr-6 space-y-8">
            <div>
              <h3 className="font-black text-[10px] uppercase tracking-[0.15em] mb-4 px-3 py-1 bg-slate-100 rounded text-slate-500 inline-block">উপসর্গ/লক্ষণ</h3>
              <ul className="space-y-2 px-1">
                {data.symptoms.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                    <span className="text-xs font-bold text-slate-600 leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h3 className="font-black text-[9px] uppercase tracking-widest mb-2 text-slate-400">রোগ নির্ণয় (Diagnosis)</h3>
              <p className="text-sm font-black text-slate-900">{data.diagnosis}</p>
            </div>

            <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100">
              <h3 className="font-black text-[10px] uppercase tracking-[0.15em] mb-4 text-red-500 flex items-center gap-2">
                <AlertCircle size={14} /> সতর্কতা
              </h3>
              <ul className="space-y-2 px-1">
                {data.precautions.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0 bg-red-400" />
                    <span className="text-xs font-bold text-red-700">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="flex items-center gap-3 mb-6">
               <h2 className="text-5xl font-black opacity-10" style={{ color: primaryColor }}>Rx</h2>
               <div className="h-[1px] flex-grow opacity-10 rounded-full" style={{ backgroundColor: primaryColor }} />
            </div>
            
            <div className="space-y-8 mb-10">
              {data.medicines.map((med, i) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute left-0 top-0 bottom-0 w-1 opacity-20 rounded-full" style={{ backgroundColor: primaryColor }} />
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-lg text-slate-900">{i + 1}. {med.name}</h4>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-200">{med.duration}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">সেবনবিধি</p>
                      <p className="text-xs font-black text-slate-700">{med.dosage}</p>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">নির্দেশনা</p>
                      <p className="text-xs font-black text-slate-700">{med.instruction}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div 
              className="p-6 rounded-[2.5rem] text-white shadow-lg relative overflow-hidden bg-gradient-to-br"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, #1e293b)` }}
            >
              <div className="absolute top-[-10%] right-[-5%] opacity-10 pointer-events-none">
                <Activity size={100} />
              </div>
              <h3 className="font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2 text-white/70">জীবনধারা ও পরামর্শ:</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {data.advice.map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-white/40 font-black text-xs">{i + 1}.</span>
                    <span className="text-xs font-bold text-white leading-snug">{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row justify-between items-end gap-6 shrink-0">
          <div className="max-w-md">
            <p className="text-[8px] text-red-400 font-black mb-1 flex items-center gap-1"><AlertCircle size={10}/> আইনি সতর্কতা</p>
            <p className="text-[8px] text-slate-400 font-bold leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{data.disclaimer}</p>
          </div>
          
          <div className="text-center">
            <div className="w-[180px] h-[50px] bg-slate-50/30 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
              {config?.signatureImage ? (
                <img src={config.signatureImage} alt="Signature" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-full h-full border-b border-dashed border-slate-200" />
              )}
            </div>
            <div className="space-y-0.5">
               <p className="text-[10px] font-black text-slate-800">কর্তৃপক্ষের স্বাক্ষর</p>
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Authorized Sign</p>
            </div>
          </div>
        </div>

        {/* Brand Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none">
           <Stethoscope size={500} strokeWidth={1} style={{ color: primaryColor }} />
        </div>
      </div>

      {/* Footer Banner */}
      {config?.footerBannerImage && (
        <div className="w-full border-t overflow-hidden bg-slate-50 shrink-0">
          <img src={config.footerBannerImage} alt="Clinic Footer Banner" className="w-full max-h-[100px] object-cover" />
        </div>
      )}
    </div>
  );
};

export default Prescription;
