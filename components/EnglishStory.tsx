
import React, { useState, useEffect } from 'react';
import { generateStory, speakText } from '../services/geminiService';

const EnglishStory: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [theme, setTheme] = useState<string | null>(null);
  const [story, setStory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const themes = [
    { name: 'Space Adventure', icon: '🚀' },
    { name: 'Magic Forest', icon: '🌲' },
    { name: 'Ocean Fun', icon: '🌊' },
    { name: 'Dinosaur Party', icon: '🦖' }
  ];

  const startStory = async (selectedTheme: string) => {
    setTheme(selectedTheme);
    setLoading(true);
    const newStory = await generateStory(selectedTheme);
    setStory(newStory);
    setLoading(false);
  };

  const readAloud = () => {
    if (story) speakText(story);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-pink-200 text-center animate-in fade-in zoom-in duration-500">
      {!theme ? (
        <>
          <h2 className="text-3xl font-bold mb-6 text-pink-600">Pick a Story Theme!</h2>
          <div className="grid grid-cols-2 gap-6">
            {themes.map(t => (
              <button
                key={t.name}
                onClick={() => startStory(t.name)}
                className="p-8 rounded-3xl border-4 border-pink-100 hover:border-pink-300 hover:bg-pink-50 transition-all flex flex-col items-center gap-4 group"
              >
                <span className="text-6xl group-hover:scale-125 transition-transform">{t.icon}</span>
                <span className="text-xl font-bold text-pink-700">{t.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-pink-600">Our {theme}!</h3>
            <button onClick={() => setTheme(null)} className="text-slate-400 hover:text-pink-600 font-bold">Try another theme</button>
          </div>
          
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
              <p className="text-pink-400 font-medium">Sparky is writing your story...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <p className="text-3xl leading-relaxed text-slate-700 bg-pink-50 p-8 rounded-2xl italic">
                "{story}"
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={readAloud}
                  className="bg-pink-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span>🔊</span> Listen Now
                </button>
                <button
                  onClick={onComplete}
                  className="bg-green-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span>✅</span> Done!
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnglishStory;
