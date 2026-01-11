
import React, { useState, useEffect } from 'react';
import { generatePhonicsQuestion, speakText } from '../services/geminiService';
import { sounds } from '../services/soundService';

interface PhonicsQuestion {
  question: string;
  targetSound: string;
  options: string[];
  correctIndex: number;
}

const PhonicsGame: React.FC<{ onCorrect: () => void; onIncorrect: () => void }> = ({ onCorrect, onIncorrect }) => {
  const [current, setCurrent] = useState<PhonicsQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQuestion = async () => {
    setLoading(true);
    setSelected(null);
    setFeedback(null);
    const data = await generatePhonicsQuestion();
    setCurrent(data);
    setLoading(false);
    if (data.question) {
      speakText(data.question);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const handleSelect = (idx: number) => {
    if (feedback || !current) return;
    setSelected(idx);
    if (idx === current.correctIndex) {
      sounds.play('correct');
      setFeedback("Great sound work! 👂✨");
      onCorrect();
      setTimeout(fetchQuestion, 2000);
    } else {
      sounds.play('incorrect');
      setFeedback("Listen closely... try again! 🦉");
      onIncorrect();
      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
      }, 1500);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-xl border-4 border-orange-200 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        <p className="text-orange-600 font-bold text-2xl">Sparky is listening for sounds... 👂</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-orange-200 text-center animate-in fade-in zoom-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-orange-700 mb-4">{current?.question}</h2>
        <div className="inline-block bg-orange-100 px-8 py-4 rounded-full border-2 border-orange-300">
          <span className="text-5xl font-black text-orange-600">"{current?.targetSound}"</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto">
        {current?.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={feedback !== null}
            className={`p-6 rounded-3xl text-3xl font-bold transition-all border-b-8 active:border-b-0 active:translate-y-2 flex items-center justify-center min-h-[120px]
              ${selected === idx && idx === current.correctIndex ? 'bg-green-400 border-green-600 text-white' : 
                selected === idx ? 'bg-red-400 border-red-600 text-white' : 
                'bg-white border-orange-200 hover:bg-orange-50 text-orange-700 shadow-md'}
            `}
          >
            {opt}
          </button>
        ))}
      </div>

      <button 
        onClick={() => { sounds.play('click'); if(current) speakText(current.question); }}
        className="mt-8 text-orange-400 hover:text-orange-600 flex items-center gap-2 mx-auto font-bold"
      >
        <span>🔊</span> Repeat Question
      </button>

      {feedback && (
        <div className={`mt-8 text-2xl font-bold p-6 rounded-2xl ${feedback.includes('Great') ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-red-100 text-red-700 border-2 border-red-200'} animate-bounce`}>
          {feedback}
        </div>
      )}
    </div>
  );
};

export default PhonicsGame;
