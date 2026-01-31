
import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionData, ReportDetail } from "./types";

/**
 * AI থেকে আসা রেসপন্স অনেক সময় Markdown (```json ... ```) আকারে আসে।
 * এই ফাংশনটি সেই অতিরিক্ত টেক্সট বাদ দিয়ে পিওর JSON স্ট্রিং বের করে আনে।
 */
const sanitizeJson = (text: string): string => {
  if (!text) return "";
  // Remove markdown code blocks if present
  let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  // Find the first '{' and the last '}' to get the JSON object
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  }
  return cleanText;
};

const getAIClient = () => {
  // Use a fallback for process.env to avoid reference errors
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || 
                 (window as any).process?.env?.API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

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
  const ai = getAIClient();
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

  const promptText = `তুমি একজন অভিজ্ঞ ডাক্তার। রোগীর নিম্নোক্ত তথ্যগুলো বিশ্লেষণ করে বাংলায় একটি পূর্ণাঙ্গ প্রেসক্রিপশন তৈরি করো।

রোগীর তথ্য:
- নাম: ${patientInfo.name}
- বয়স: ${patientInfo.age}
- লিঙ্গ: ${patientInfo.gender}
- প্রধান লক্ষণসমূহ: ${combinedSymptoms}
- ${existingStr}
- ${reportsDescription}

তোমার কাজ:
১. লক্ষণের উপর ভিত্তি করে রোগ নির্ণয় (Diagnosis) করো।
২. ওযুধের ব্র্যান্ড নাম (যেমন Napa) এবং জেনেরিক নাম (যেমন Paracetamol) দাও। 
৩. খাবারের আগে না পরে, কতদিন খাবে - এগুলো সহজ বাংলায় লিখবে।`;

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
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      systemInstruction: "You are a senior professional AI Medical Doctor in Bangladesh. Provide clinical advice in Bengali. Output MUST be in valid JSON format in Bengali.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          patientName: { type: Type.STRING },
          age: { type: Type.STRING },
          gender: { type: Type.STRING },
          date: { type: Type.STRING },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          diagnosis: { type: Type.STRING },
          advice: { type: Type.ARRAY, items: { type: Type.STRING } },
          medicines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                dosage: { type: Type.STRING },
                duration: { type: Type.STRING },
                instruction: { type: Type.STRING }
              },
              required: ["name", "dosage", "duration", "instruction"]
            }
          },
          precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
          disclaimer: { type: Type.STRING }
        },
        required: ["patientName", "age", "gender", "date", "symptoms", "diagnosis", "advice", "medicines", "precautions", "disclaimer"]
      }
    }
  });

  try {
    const rawText = response.text || "";
    const cleanJson = sanitizeJson(rawText);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("প্রেসক্রিপশন তৈরি করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
  }
};

export const searchMedicineInfo = async (medName: string) => {
  const ai = getAIClient();
  const prompt = `ওষুধের নাম: ${medName}। এই ওষুধের জেনেরিক নাম, প্রস্তুতকারক কোম্পানি, এবং বাংলাদেশের বাজারের আনুমানিক মূল্য দাও। এছাড়া ৩টি বিকল্প ওষুধের তালিকা দাও।`;
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
  
  try {
    const rawText = response.text || "";
    return JSON.parse(sanitizeJson(rawText));
  } catch (e) {
    console.error("Medicine search failed", e);
    throw e;
  }
};
