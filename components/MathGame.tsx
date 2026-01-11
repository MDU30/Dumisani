
import React, { useState, useEffect, useCallback } from 'react';
import { ActivityType, MathProblem, Difficulty } from '../types';
import { generateMathImage, speakText } from '../services/geminiService';
import { sounds } from '../services/soundService';

interface MathGameProps {
  type: ActivityType;
  onCorrect: () => void;
  onIncorrect: () => void;
}

const MathGame: React.FC<MathGameProps> = ({ type, onCorrect, onIncorrect }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const generateProblem = useCallback(async (forcedDifficulty?: Difficulty) => {
    const currentDiff = forcedDifficulty || difficulty;
    if (!currentDiff) return;

    let q = "";
    let ans = 0;
    let opts: number[] = [];
    let imagePrompt = "";
    const items = ["shiny stars", "yummy red apples", "friendly blue dinosaurs", "yellow rubber ducks", "green balloons", "purple butterflies", "tiny ladybugs", "colorful crayons"];
    const item = items[Math.floor(Math.random() * items.length)];

    // Range Logic based on Difficulty
    if (type === ActivityType.COUNTING) {
      const ranges = {
        [Difficulty.EASY]: { min: 1, max: 5 },
        [Difficulty.MEDIUM]: { min: 6, max: 12 },
        [Difficulty.HARD]: { min: 13, max: 20 }
      };
      const range = ranges[currentDiff];
      ans = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
      q = `How many ${item} can you count?`;
      imagePrompt = `A group of exactly ${ans} ${item} in a simple, clear arrangement. Each object should be easy for a child to count one by one.`;
    } else if (type === ActivityType.ADDITION) {
      const ranges = {
        [Difficulty.EASY]: { maxA: 3, maxB: 2 },
        [Difficulty.MEDIUM]: { maxA: 6, maxB: 6 },
        [Difficulty.HARD]: { maxA: 15, maxB: 15 }
      };
      const range = ranges[currentDiff];
      const a = Math.floor(Math.random() * range.maxA) + 1;
      const b = Math.floor(Math.random() * range.maxB) + 1;
      ans = a + b;
      q = `What is ${a} + ${b}?`;
      imagePrompt = `A picture showing ${a} ${item} on the left side and ${b} of the same items on the right side. Clearly show they are being added together for a child.`;
    } else { // SUBTRACTION
      const ranges = {
        [Difficulty.EASY]: { startMin: 3, startMax: 5 },
        [Difficulty.MEDIUM]: { startMin: 6, startMax: 12 },
        [Difficulty.HARD]: { startMin: 15, startMax: 25 }
      };
      const range = ranges[currentDiff];
      const a = Math.floor(Math.random() * (range.startMax - range.startMin + 1)) + range.startMin;
      const b = Math.floor(Math.random() * (a - 1)) + 1;
      ans = a - b;
      q = `What is ${a} - ${b}?`;
      imagePrompt = `A picture with exactly ${a} ${item} where ${b} of them are clearly being crossed out or taken away.`;
    }

    // Generate options
    opts = [ans, ans + 1, ans + 2, ans - 1, ans - 2, 0].filter(n => n >= 0 && n !== ans);
    opts = [ans, ...opts.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
    
    setProblem({ question: q, visuals: [], options: opts, answer: ans, type, itemType: item });
    setSelected(null);
    setFeedback(null);
    setIsImageLoading(true);

    speakText(q);

    const generatedUrl = await generateMathImage(imagePrompt);
    if (generatedUrl) {
      setProblem(prev => prev ? ({ ...prev, imageUrl: generatedUrl }) : null);
    }
    setIsImageLoading(false);
  }, [type, difficulty]);

  useEffect(() => {
    if (difficulty) {
      generateProblem();
    }
  }, [difficulty, generateProblem]);

  const handleChoice = (val: number) => {
    if (feedback) return;
    setSelected(val);
    if (val === problem?.answer) {
      sounds.play('correct');
      setFeedback("That's right! You are a superstar! 🌟");
      onCorrect();
      setTimeout(() => generateProblem(), 2500);
    } else {
      sounds.play('incorrect');
      setFeedback("Not quite, let's try again! 💪");
      onIncorrect();
      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
      }, 2000);
    }
  };

  if (!difficulty) {
    return (
      <div className="bg-white rounded-3xl p-10 shadow-xl border-4 border-blue-200 text-center animate-in zoom-in duration-300">
        <h2 className="text-4xl font-bold text-blue-600 mb-8">Choose Your Level!</h2>
        <div className="grid gap-6 max-w-sm mx-auto">
          <button 
            onClick={() => { sounds.play('click'); setDifficulty(Difficulty.EASY); }}
            className="p-6 bg-green-100 border-b-8 border-green-500 rounded-2xl text-2xl font-bold text-green-700 hover:scale-105 transition-transform"
          >
            🌱 Easy (Numbers 1-5)
          </button>
          <button 
            onClick={() => { sounds.play('click'); setDifficulty(Difficulty.MEDIUM); }}
            className="p-6 bg-yellow-100 border-b-8 border-yellow-500 rounded-2xl text-2xl font-bold text-yellow-700 hover:scale-105 transition-transform"
          >
            🚀 Medium (Numbers 1-12)
          </button>
          <button 
            onClick={() => { sounds.play('click'); setDifficulty(Difficulty.HARD); }}
            className="p-6 bg-red-100 border-b-8 border-red-500 rounded-2xl text-2xl font-bold text-red-700 hover:scale-105 transition-transform"
          >
            🔥 Hard (Numbers 1-25)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-blue-200 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <button 
        onClick={() => { sounds.play('click'); setDifficulty(null); setProblem(null); }}
        className="absolute top-4 left-4 text-blue-300 hover:text-blue-500 font-bold text-sm"
      >
        ← Change Level
      </button>

      <div className="mb-6">
        <h2 className="text-4xl font-bold text-blue-600 mb-2">{problem?.question}</h2>
        <div className="flex justify-center gap-2">
           <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
             difficulty === Difficulty.EASY ? 'bg-green-100 text-green-600' :
             difficulty === Difficulty.MEDIUM ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
           }`}>
             Level: {difficulty}
           </span>
        </div>
      </div>
      
      <div className="flex justify-center mb-8 relative min-h-[300px]">
        {isImageLoading && !problem?.imageUrl ? (
          <div className="w-full max-w-lg h-[300px] bg-slate-50 border-4 border-dashed border-blue-100 rounded-3xl flex flex-col items-center justify-center gap-4 animate-pulse">
            <span className="text-6xl animate-bounce">🎨</span>
            <p className="text-blue-300 font-bold text-xl">Sparky is painting your {problem?.itemType}...</p>
          </div>
        ) : problem?.imageUrl ? (
          <div className="relative group">
             <img 
              src={problem.imageUrl} 
              alt="Math visual" 
              className="w-full max-w-lg h-auto rounded-3xl shadow-lg border-4 border-blue-50 transition-all duration-300" 
            />
            {isImageLoading && (
               <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-blue-200">
            <span className="text-8xl">🦉</span>
            <p className="mt-4 font-bold">Waiting for Sparky...</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
        {problem?.options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrect = opt === problem.answer;
          const showAsCorrect = selected !== null && isCorrect;
          const showAsIncorrect = isSelected && !isCorrect;

          return (
            <button
              key={opt}
              onClick={() => handleChoice(opt)}
              disabled={selected !== null}
              className={`relative py-8 rounded-2xl text-5xl font-bold transition-all border-b-8 active:border-b-0 active:translate-y-2
                ${showAsCorrect ? 'bg-green-400 border-green-600 text-white shadow-[0_0_20px_rgba(74,222,128,0.7)] scale-110 z-10' : 
                  showAsIncorrect ? 'bg-red-400 border-red-600 text-white shadow-[0_0_20px_rgba(248,113,113,0.7)] animate-shake' : 
                  'bg-white border-blue-200 hover:bg-blue-50 text-blue-600 shadow-sm'}
              `}
            >
              {opt}
              {showAsCorrect && (
                <span className="absolute -top-3 -right-3 bg-white border-2 border-green-500 rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow-lg animate-bounce">
                  ✅
                </span>
              )}
              {showAsIncorrect && (
                <span className="absolute -top-3 -right-3 bg-white border-2 border-red-500 rounded-full w-10 h-10 flex items-center justify-center text-2xl shadow-lg">
                  ❌
                </span>
              )}
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={`mt-8 text-2xl font-bold p-6 rounded-2xl ${feedback.includes('right') ? 'bg-green-100 text-green-700 border-2 border-green-200' : 'bg-orange-100 text-orange-700 border-2 border-orange-200'} animate-bounce shadow-md`}>
          {feedback}
        </div>
      )}
    </div>
  );
};

export default MathGame;
