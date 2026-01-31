
import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionData, ReportDetail } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMedicalAdvice = async (
  symptomsText: string,
  patientInfo: { 
    name: string; 
    age: string; 
    gender: string;
    selectedSymptoms: string[];
    existingConditions: string[];
    reportDetails: ReportDetail[];
  }
): Promise<PrescriptionData> => {
  const combinedSymptoms = [
    ...patientInfo.selectedSymptoms,
    symptomsText ? `অতিরিক্ত লক্ষণ: ${symptomsText}` : ""
  ].filter(Boolean).join(", ");

  const existingStr = patientInfo.existingConditions.length > 0 
    ? `রোগীর পূর্ববর্তী রোগের ইতিহাস: ${patientInfo.existingConditions.join(", ")}` 
    : "রোগীর পূর্ববর্তী কোনো বড় রোগের ইতিহাস নেই।";

  const reportsDescription = patientInfo.reportDetails.length > 0
    ? "মেডিকেল রিপোর্টের বিবরণ:\n" + patientInfo.reportDetails.map(r => 
        `- ${r.name}: ${r.result || 'ফলাফল টেক্সটে নেই (ছবি দেওয়া হয়েছে)'}`
      ).join("\n")
    : "রোগীর কোনো সাম্প্রতিক মেডিকেল রিপোর্ট নেই।";

  const promptText = `তুমি একজন অভিজ্ঞ ডাক্তার। রোগীর নিম্নোক্ত তথ্যগুলো এবং আপলোড করা রিপোর্টের ছবি (যদি থাকে) বিশ্লেষণ করে রোগ নির্ণয় করো এবং বাংলায় একটি পূর্ণাঙ্গ প্রেসক্রিপশন তৈরি করো।

রোগীর তথ্য:
- নাম: ${patientInfo.name}
- বয়স: ${patientInfo.age}
- লিঙ্গ: ${patientInfo.gender}
- প্রধান লক্ষণসমূহ: ${combinedSymptoms}
- ${existingStr}
- ${reportsDescription}

তোমার কাজ:
১. লক্ষণের উপর ভিত্তি করে এবং রিপোর্টের ছবি/রেজাল্ট বিশ্লেষণ করে সম্ভাব্য রোগ (Diagnosis) নির্ধারণ করো।
২. বাংলাদেশের জনপ্রিয় কোম্পানির (Square, Incepta, Beximco ইত্যাদি) ওযুধের ব্র্যান্ড নাম দাও। 
৩. ওষুধের নামের সাথে অবশ্যই জেনেরিক নাম দিবে, যেমন: Napa (Paracetamol)।
৪. খাবারের আগে না পরে, কতদিন খাবে - এগুলো সহজ বাংলায় লিখবে।
৫. জীবনধারা নিয়ে প্রয়োজনীয় পরামর্শ দিবে।`;

  const parts: any[] = [{ text: promptText }];
  
  patientInfo.reportDetails.forEach(report => {
    if (report.image) {
      const base64Data = report.image.split(',')[1];
      const mimeType = report.image.split(';')[0].split(':')[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      systemInstruction: "You are a senior professional AI Medical Doctor in Bangladesh. Analyze symptoms, history, and medical reports. Provide advice and medicines available in Bangladesh using brand names (Generic names). Output MUST be in valid JSON format in Bengali.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING },
          age: { type: Type.STRING },
          gender: { type: Type.STRING },
          date: { type: Type.STRING },
          symptoms: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          diagnosis: { type: Type.STRING },
          advice: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          medicines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Brand Name (Generic Name)" },
                dosage: { type: Type.STRING },
                duration: { type: Type.STRING },
                instruction: { type: Type.STRING }
              },
              required: ["name", "dosage", "duration", "instruction"]
            }
          },
          precautions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          disclaimer: { type: Type.STRING }
        },
        required: ["patientName", "age", "gender", "date", "symptoms", "diagnosis", "advice", "medicines", "precautions", "disclaimer"]
      }
    }
  });

  try {
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Prescription generation failed.");
  }
};

export const searchMedicineInfo = async (medName: string) => {
  const prompt = `ওষুধের নাম: ${medName}। এই ওষুধের জেনেরিক নাম, প্রস্তুতকারক কোম্পানি, এবং বাংলাদেশের বর্তমান বাজারের আনুমানিক খুচরা মূল্য দাও। এছাড়া একই জেনেরিক নামের ৩টি বিকল্প ওষুধের তালিকা (নাম, কোম্পানি ও আনুমানিক মূল্যসহ) বাংলায় দাও।`;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          originalName: { type: Type.STRING },
          genericName: { type: Type.STRING },
          company: { type: Type.STRING },
          estimatedPrice: { type: Type.STRING },
          alternatives: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                company: { type: Type.STRING },
                estimatedPrice: { type: Type.STRING }
              },
              required: ["name", "company", "estimatedPrice"]
            }
          },
          pharmacistNote: { type: Type.STRING }
        },
        required: ["originalName", "genericName", "company", "estimatedPrice", "alternatives", "pharmacistNote"]
      }
    }
  });
  return JSON.parse(response.text);
};
