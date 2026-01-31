
export interface Medicine {
  name: string;
  dosage: string;
  duration: string;
  instruction: string;
}

export interface ReportDetail {
  name: string;
  result: string;
  image: string | null;
}

export interface PrescriptionData {
  patientName: string;
  age: string;
  gender: string;
  date: string;
  symptoms: string[];
  diagnosis: string;
  advice: string[];
  medicines: Medicine[];
  precautions: string[];
  disclaimer: string;
}

export interface SavedPrescription extends PrescriptionData {
  id: string;
  timestamp: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  secondary: string;
}

export const APP_THEMES: ThemeConfig[] = [
  { id: 'blue', name: 'মেডিকেল ব্লু', primary: '#2563eb', secondary: '#eff6ff' },
  { id: 'emerald', name: 'হিলিং গ্রিন', primary: '#059669', secondary: '#ecfdf5' },
  { id: 'rose', name: 'রোজ কেয়ার', primary: '#e11d48', secondary: '#fff1f2' },
  { id: 'amber', name: 'ভাইটাল গোল্ড', primary: '#d97706', secondary: '#fffbeb' },
  { id: 'violet', name: 'রয়্যাল পার্পল', primary: '#7c3aed', secondary: '#f5f3ff' },
  { id: 'teal', name: 'ট্রাস্ট টিল', primary: '#0d9488', secondary: '#f0fdfa' },
  { id: 'indigo', name: 'ডিপ ইন্ডিগো', primary: '#4f46e5', secondary: '#eef2ff' },
  { id: 'orange', name: 'এনার্জি অরেঞ্জ', primary: '#ea580c', secondary: '#fff7ed' },
  { id: 'cyan', name: 'স্কাই ব্রাইট', primary: '#0891b2', secondary: '#ecfeff' },
  { id: 'fuchsia', name: 'ম্যাজেন্টা হার্ট', primary: '#c026d3', secondary: '#fdf4ff' },
  { id: 'slate', name: 'স্লিট মডার্ন', primary: '#475569', secondary: '#f8fafc' },
  { id: 'lime', name: 'লাইম ফ্রেশ', primary: '#65a30d', secondary: '#f7fee7' },
  { id: 'crimson', name: 'ক্লাসিক রেড', primary: '#dc2626', secondary: '#fef2f2' },
  { id: 'brown', name: 'আর্থ ব্রাউন', primary: '#92400e', secondary: '#fffbeb' },
  { id: 'navy', name: 'প্রফেশনাল নেভি', primary: '#1e3a8a', secondary: '#eff6ff' },
  { id: 'purple', name: 'ল্যাভেন্ডার', primary: '#9333ea', secondary: '#faf5ff' },
  { id: 'black', name: 'ডার্ক নাইট', primary: '#111827', secondary: '#f3f4f6' },
  { id: 'mint', name: 'মিন্ট কুল', primary: '#10b981', secondary: '#f0fdf4' },
  { id: 'maroon', name: 'মেরুন হেলথ', primary: '#800000', secondary: '#fff5f5' },
  { id: 'orchid', name: 'বিউটি অর্কিড', primary: '#991b1b', secondary: '#fef2f2' },
];

export interface UserProfile {
  username: string;
  fullName: string;
  profileImage: string | null;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  mobile?: string;
  selectedTheme?: string;
}

export interface AdminConfig {
  clinicName: string;
  clinicDetails: string;
  bannerImage: string | null;
  footerBannerImage: string | null;
  signatureImage: string | null;
  adminProfileImage: string | null;
  selectedTheme?: string;
  // Home Dashboard Footer Banner Specifics
  homeFooterBannerTitle?: string;
  homeFooterBannerDescription?: string;
  homeFooterBannerProfileImage?: string | null;
}

export enum Gender {
  MALE = 'পুরুষ',
  FEMALE = 'মহিলা',
  OTHER = 'অন্যান্য'
}
