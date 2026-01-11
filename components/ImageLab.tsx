
import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { sounds } from '../services/soundService';

const ImageLab: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setOriginalImage(ev.target?.result as string);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMagic = async () => {
    if (!originalImage || !prompt) return;
    sounds.play('click');
    setIsProcessing(true);
    
    const base64 = originalImage.split(',')[1];
    const mimeType = originalImage.split(';')[0].split(':')[1];
    
    const result = await editImage(base64, mimeType, prompt);
    if (result) {
      setEditedImage(result);
      sounds.play('fanfare');
    }
    setIsProcessing(false);
  };

  const handleSpeech = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event: any) => {
      setPrompt(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-purple-200 animate-in zoom-in duration-500 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-purple-600 mb-2">Magic Picture Lab ✨</h2>
        <p className="text-slate-500">Upload a picture and tell Sparky what to change!</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <div className="aspect-square bg-slate-50 rounded-3xl border-4 border-dashed border-purple-100 flex items-center justify-center overflow-hidden relative group">
            {originalImage ? (
              <img src={originalImage} alt="Original" className="w-full h-full object-cover" />
            ) : (
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-4 text-purple-300 hover:text-purple-500 transition-colors">
                <span className="text-6xl">🖼️</span>
                <span className="font-bold">Tap to add a picture</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
          </div>
          <p className="text-center font-bold text-slate-400">Your Picture</p>
        </div>

        <div className="space-y-4">
          <div className="aspect-square bg-purple-50 rounded-3xl border-4 border-purple-100 flex items-center justify-center overflow-hidden">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-purple-600 font-bold animate-pulse">Sparky is working magic...</p>
              </div>
            ) : editedImage ? (
              <img src={editedImage} alt="Magic Result" className="w-full h-full object-cover animate-in zoom-in duration-700" />
            ) : (
              <div className="text-purple-200 text-8xl opacity-30">✨</div>
            )}
          </div>
          <p className="text-center font-bold text-purple-400">Magic Result</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <input 
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g. Add a red hat or Make it look like space"
            className="w-full p-6 pr-20 bg-slate-50 border-4 border-purple-100 rounded-3xl text-xl font-medium focus:border-purple-300 focus:outline-none shadow-inner"
          />
          <button 
            onClick={handleSpeech}
            className={`absolute right-4 top-4 p-3 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
          >
            <span className="text-2xl">🎤</span>
          </button>
        </div>

        <button
          onClick={handleMagic}
          disabled={isProcessing || !originalImage || !prompt}
          className="w-full py-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-3xl text-3xl font-bold shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
        >
          {isProcessing ? "✨ Casting Spell..." : "🪄 Do Magic!"}
        </button>
      </div>
    </div>
  );
};

export default ImageLab;
