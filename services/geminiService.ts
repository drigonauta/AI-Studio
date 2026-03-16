
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { CampaignContent, ImageSize, Language } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const generateEmailCampaign = async (prompt: string, lang: Language, templateId?: string): Promise<CampaignContent> => {
  const ai = getAIClient();
  const langContext = lang === 'pt' ? "em Português do Brasil" : "in English";
  const templateContext = templateId ? ` Follow the structure and tone suitable for a ${templateId} campaign type.` : "";
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a complete email marketing campaign based on this request: "${prompt}". 
    The campaign must be written ${langContext}.${templateContext}
    The response must be in JSON format with fields: subject, headline, body, ctaText, ctaUrl (a relevant placeholder URL), and visualPrompt (a detailed prompt in English for an image generator to create a banner visual for this email).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          headline: { type: Type.STRING },
          body: { type: Type.STRING },
          ctaText: { type: Type.STRING },
          ctaUrl: { type: Type.STRING, description: "A logical placeholder URL for the campaign, e.g., https://yourbrand.com/promo" },
          visualPrompt: { type: Type.STRING }
        },
        required: ["subject", "headline", "body", "ctaText", "ctaUrl", "visualPrompt"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    throw new Error("Failed to parse campaign JSON");
  }
};

export const generateCampaignImage = async (prompt: string, size: ImageSize, styleInstructions?: string): Promise<string> => {
  const ai = getAIClient();
  
  const finalPrompt = styleInstructions 
    ? `${prompt}. Style instructions: ${styleInstructions}. Ensure the image looks professional and marketing-ready.`
    : prompt;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: finalPrompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: size
      }
    }
  });

  const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (imagePart?.inlineData) {
    return `data:image/png;base64,${imagePart.inlineData.data}`;
  }
  throw new Error("No image was generated");
};

export const getGeminiChatStream = async (message: string, lang: Language) => {
  const ai = getAIClient();
  const langContext = lang === 'pt' ? "Responda sempre em Português do Brasil." : "Always respond in English.";
  
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are EmailGenius Assistant, a world-class marketing expert. 
      Your goal is to help users optimize their email campaigns, improve conversion rates, and provide creative copy advice. 
      Be professional, concise, and insightful. ${langContext}`
    }
  });

  return await chat.sendMessageStream({ message });
};

// Live API Helper Functions
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
