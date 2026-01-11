
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decodeBase64, encodeBase64, decodeAudioData } from '../services/geminiService';

const SparkyLive: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Ready to talk?");
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Microphone access is not supported by your browser.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Setup Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      // Modern browsers require resuming after a user gesture
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      setStatus("Checking microphone...");
      
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          throw new Error("Microphone not found! Please plug one in and try again.");
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error("Microphone permission was denied. Please allow it in your settings!");
        } else {
          throw err;
        }
      }
      
      setIsActive(true);
      setStatus("Sparky is listening...");

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              if (sessionRef.current) {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const base64 = encodeBase64(new Uint8Array(int16.buffer));
                
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: { data: base64, mimeType: 'audio/pcm;rate=16000' } });
                });
              }
            };
            
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live API error:", e);
            setStatus("Oops! Sparky got a bit lost.");
          },
          onclose: () => {
            setIsActive(false);
            setStatus("Ready to talk again?");
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: "You are Sparky, a friendly owl for a 6-year-old child. Speak very simply, use lots of encouragement, and stay in character. You can't see the child, but you love talking to them."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Session initialization failed:", err);
      setStatus(err.message || "Failed to start Sparky Live.");
      setIsActive(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
    setStatus("Talk again soon!");
    
    // Stop any currently playing audio
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
  };

  return (
    <div className="bg-gradient-to-b from-sky-400 to-blue-600 min-h-[60vh] rounded-3xl p-10 flex flex-col items-center justify-between text-white shadow-2xl animate-in zoom-in duration-500 overflow-hidden relative">
      <div className="text-center z-10">
        <h2 className="text-4xl font-bold mb-4 italic">Sparky Live Chat 🦉✨</h2>
        <p className="text-xl font-medium opacity-95">{status}</p>
      </div>

      <div className="relative flex items-center justify-center flex-1 w-full">
        {/* Animated pulse rings */}
        {isActive && (
          <>
            <div className="absolute w-64 h-64 border-4 border-white/20 rounded-full animate-ping"></div>
            <div className="absolute w-80 h-80 border-2 border-white/10 rounded-full animate-ping delay-300"></div>
          </>
        )}
        <div className={`text-9xl transition-transform duration-500 ${isActive ? 'scale-125 animate-bounce' : 'scale-100'}`}>
          🦉
        </div>
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        className={`z-10 px-12 py-6 rounded-full text-3xl font-bold shadow-2xl transition-all active:scale-95 border-4
          ${isActive ? 'bg-red-500 border-red-300 hover:bg-red-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-slate-50'}
        `}
      >
        {isActive ? "Stop Chatting" : "Start Magic Chat!"}
      </button>

      <div className="absolute bottom-0 left-0 w-full h-32 bg-white/10 backdrop-blur-md flex items-center justify-center px-10">
        <p className="text-lg text-center max-w-md">In Magic Chat, you can talk to Sparky just like a real friend. Go ahead, say hello!</p>
      </div>
    </div>
  );
};

export default SparkyLive;
