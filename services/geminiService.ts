
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Helper for base64 encoding/decoding as per guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Custom audio decoding for raw PCM data as per guidelines
async function decodeAudioData(
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

/**
 * Expert skin analysis using Gemini 3 Pro with Thinking Mode.
 */
export const getSkinAdvice = async (skinDescription: string, base64Image?: string | null) => {
  // Always create a new instance right before use to ensure latest API key
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
                  matchReason: { type: Type.STRING, description: "Short sentence explaining why this specific product matches the user's skin analysis." },
                  imageSeed: { type: Type.STRING, description: "A unique seed for a placeholder image" }
                },
                required: ["name", "brand", "description", "price", "rating", "category", "matchReason", "imageSeed"]
              }
            }
          },
          required: ["analysis", "skinMetrics", "concerns", "amRoutine", "pmRoutine", "productRecommendations"]
        }
      }
    });
    // Use .text getter directly as per guidelines
    return JSON.parse(response.text?.trim() || "{}");
  } catch (error) {
    console.error("Expert Analysis Error:", error);
    throw error;
  }
};

/**
 * High-quality image generation with Gemini 3 Pro Image Preview.
 */
export const generateProductImage = async (prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9", imageSize: "1K" | "2K" | "4K" = "1K") => {
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
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  // Always append API key when using download links as per guidelines
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

/**
 * Live Assistant with Native Audio API.
 * Uses sessionPromise to avoid race conditions and stale closures.
 */
export const startLiveAssistant = async (onTranscription?: (text: string) => void) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let nextStartTime = 0;
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);
  const sources = new Set<AudioBufferSourceNode>();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        console.log("Live Connected");
        // Stream audio from microphone to model
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
            int16[i] = inputData[i] * 32768;
          }
          const pcmBlob = {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
          };
          // Always use sessionPromise to ensure data is sent to the resolved session
          sessionPromise.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (message) => {
        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audioData) {
          nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
          const buffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
          const source = outputAudioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(outputNode);
          source.addEventListener('ended', () => sources.delete(source));
          source.start(nextStartTime);
          nextStartTime += buffer.duration;
          sources.add(source);
        }

        if (message.serverContent?.interrupted) {
          for (const s of sources) {
            s.stop();
          }
          sources.clear();
          nextStartTime = 0;
        }

        if (message.serverContent?.outputTranscription && onTranscription) {
          onTranscription(message.serverContent.outputTranscription.text);
        }
      },
      onerror: (e) => console.error("Live Error", e),
      onclose: () => {
        console.log("Live Closed");
        stream.getTracks().forEach(t => t.stop());
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
      systemInstruction: 'You are a friendly skin care coach from SkinWise. Speak naturally and help users with their routine.',
      outputAudioTranscription: {}
    }
  });

  return sessionPromise;
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
