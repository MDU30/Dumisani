
import { GoogleGenAI, Type, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getEncouragement = async (subject: string, performance: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are Sparky, a friendly owl tutor for 6-year-olds. The student just ${performance} in ${subject}. Give a short, very enthusiastic, and encouraging message (max 2 sentences). Use child-friendly emojis.`,
    });
    return response.text || "You're doing great, superstar! 🌟 Keep going!";
  } catch (error) {
    return "Amazing job! You are so smart! 🚀";
  }
};

export const editImage = async (base64Data: string, mimeType: string, prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: `Edit this image for a 6-year-old child's educational app. Requirement: ${prompt}. Keep it colorful, safe, and friendly. Output only the new image.` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image editing error", error);
    return null;
  }
};

export const generateStory = async (theme: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a very short, 4-sentence story for a Grade 1 learner about ${theme}. Use simple words. Make it fun and educational.`,
    });
    return response.text || "Once upon a time, there was a happy little friend who loved to learn every day!";
  } catch (error) {
    return "Let's read a fun story together!";
  }
};

export const tutorChat = async (agentName: string, role: string, userMessage: string, history: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are ${agentName}, ${role} for a 6-year-old child. 
      Keep your response very short (1-2 sentences), extremely simple, and very encouraging.
      Use lots of emojis.
      If the child asks "What is [something]", explain it like they are 6.
      Child says: "${userMessage}"`,
      config: {
        systemInstruction: `You are a helpful, friendly, and safe AI tutor for Grade 1 children. Your name is ${agentName}.`
      }
    });
    return response.text;
  } catch (error) {
    console.error("Tutor chat error", error);
    return "That's a great question! I'm still learning too, but you are doing wonderful! 🌟";
  }
};

export const generateExplanationImage = async (topic: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A clear, simple, educational illustration for a 6-year-old about ${topic}. Friendly cartoon style, bright colors, white background, no complex text.` }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const generateVocabQuestion = async (specificWord?: string) => {
  try {
    const prompt = specificWord 
      ? `Generate a vocabulary question for a 6-year-old Grade 1 student focusing specifically on the word "${specificWord}". The question should ask 'Which of these is a [word]?' or 'What is this? [emoji]'. Return the word, a hint, 4 options (emojis or words), and the correct index.`
      : "Generate a vocabulary question for a 6-year-old Grade 1 student. The question should ask 'Which of these is a [word]?' or 'What is this? [emoji]'. Return the word, a hint, 4 options (emojis or words), and the correct index.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctIndex: { type: Type.INTEGER },
            emoji: { type: Type.STRING, description: "Main emoji if the question is 'What is this?'" },
            answerWord: { type: Type.STRING, description: "The single word answer for speech recognition and image generation" }
          },
          required: ["question", "options", "correctIndex", "answerWord"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Vocab gen error", error);
    return {
      question: specificWord ? `Which one is a ${specificWord}?` : "Which one is an Apple?",
      options: ["🍌", "🍎", "🍇", "🍊"],
      correctIndex: 1,
      answerWord: specificWord || "apple"
    };
  }
};

export const generatePhonicsQuestion = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a phonics question for a 6-year-old. Focus on beginning sounds (e.g., 'What starts with B?'). Return the target sound, 4 word options as emojis or short words, and the correct index.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            targetSound: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctIndex: { type: Type.INTEGER }
          },
          required: ["question", "targetSound", "options", "correctIndex"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return {
      question: "Which word starts with the 'S' sound?",
      targetSound: "S",
      options: ["🐶 Dog", "🍎 Apple", "☀️ Sun", "🐱 Cat"],
      correctIndex: 2
    };
  }
};

export const generateMathImage = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `${prompt}. Clear, vibrant 3D cartoon style, high contrast, objects are separate and easy to count, simple flat background.` }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Math image gen error", error);
    return null;
  }
};

export const generateVocabImage = async (word: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A clear, beautiful, and friendly illustration of a ${word}. 3D cartoon style, high quality, vibrant colors, simple bright background, educational and child-friendly.` }],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Vocab image gen error", error);
    return null;
  }
};

export const speakText = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      await playRawPCM(base64Audio);
    }
  } catch (err) {
    console.error("Speech error", err);
  }
};

const playRawPCM = async (base64: string) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const data = decodeBase64(base64);
  const audioBuffer = await decodeAudioData(data, audioContext, 24000, 1);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
};

export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
