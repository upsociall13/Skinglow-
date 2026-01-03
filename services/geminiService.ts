
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * Expert skin analysis using Gemini 3 Pro with Thinking Mode.
 */
export const getSkinAdvice = async (skinDescription: string, base64Image?: string | null) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents: any[] = [];
  
  if (skinDescription.trim()) {
    contents.push({ text: `Deep analysis of concerns: "${skinDescription}"` });
  } else {
    contents.push({ text: "Perform a deep skin assessment based primarily on the visual evidence provided in the image. If no image is provided, offer general expert skincare routine best practices." });
  }

  if (base64Image) {
    contents.push({
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType: 'image/jpeg'
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: contents },
      config: {
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking for expert advice
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            skinMetrics: {
              type: Type.OBJECT,
              properties: {
                hydration: { type: Type.INTEGER, description: "Hydration percentage 0-100" },
                oiliness: { type: Type.INTEGER, description: "Oiliness percentage 0-100" },
                sensitivity: { type: Type.INTEGER, description: "Sensitivity percentage 0-100" },
                texture: { type: Type.INTEGER, description: "Texture smoothness percentage 0-100" }
              },
              required: ["hydration", "oiliness", "sensitivity", "texture"]
            },
            concerns: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key skin concerns identified (e.g., Redness, Acne, Dryness)"
            },
            amRoutine: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  icon: { type: Type.STRING }
                },
                required: ["title", "description", "icon"]
              }
            },
            pmRoutine: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  icon: { type: Type.STRING }
                },
                required: ["title", "description", "icon"]
              }
            },
            productRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  description: { type: Type.STRING },
                  price: { type: Type.STRING },
                  rating: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  imageSeed: { type: Type.STRING, description: "A unique seed for a placeholder image" }
                },
                required: ["name", "brand", "description", "price", "rating", "category", "imageSeed"]
              }
            }
          },
          required: ["analysis", "skinMetrics", "concerns", "amRoutine", "pmRoutine", "productRecommendations"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Expert Analysis Error:", error);
    throw error;
  }
};

/**
 * High-quality image generation with Imagen 3 Pro.
 */
export const generateProductImage = async (prompt: string, aspectRatio: any, imageSize: "1K" | "2K" | "4K" = "1K") => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: `Skincare product photo: ${prompt}` }] },
    config: {
      imageConfig: { aspectRatio, imageSize }
    },
  });

  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error("No image generated");
  return `data:image/png;base64,${part.inlineData.data}`;
};

/**
 * Veo video generation for skin tutorials or atmosphere.
 */
export const generateSkinVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '9:16') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic skincare tutorial: ${prompt}`,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

/**
 * Live Assistant with Native Audio API.
 */
export const startLiveAssistant = async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let nextStartTime = 0;
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const outputNode = audioCtx.createGain();
  outputNode.connect(audioCtx.destination);

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => console.log("Live Connected"),
      onmessage: async (message) => {
        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audioData) {
          nextStartTime = Math.max(nextStartTime, audioCtx.currentTime);
          const buffer = await decodeAudio(audioData, audioCtx);
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(outputNode);
          source.start(nextStartTime);
          nextStartTime += buffer.duration;
        }
      },
      onerror: (e) => console.error("Live Error", e),
      onclose: () => console.log("Live Closed")
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
      systemInstruction: 'You are a friendly skin care coach from SkinWise. Speak naturally and help users with their routine.'
    }
  });

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
};

/**
 * Chat with expert reasoning and Google Search Grounding.
 */
export const expertChat = async (message: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      tools: [{ googleSearch: {} }] // Mandatory grounding for accurate data
    }
  });
  return response.text || "I'm thinking...";
};

// Utils
async function decodeAudio(base64: string, ctx: AudioContext) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

export const editImageWithGemini = async (base64Image: string, prompt: string, mimeType: string = 'image/jpeg') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    }
  });
  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  return part ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
};
