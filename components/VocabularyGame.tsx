
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { generateVocabQuestion, speakText, generateVocabImage } from '../services/geminiService';
import { sounds } from '../services/soundService';

interface VocabQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  emoji?: string;
  answerWord: string;
}

interface VocabularyGameProps {
  learnedWords: string[];
  troubleWords: Record<string, number>;
  onCorrect: (word: string) => void;
  onIncorrect: (word: string) => void;
}

const Confetti: React.FC = () => {
  const particles = useMemo(() => {
    const colors = ['#A855F7', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: `${Math.random() * 10 + 5}px`,
      duration: `${Math.random() * 2 + 2}s`,
      delay: `${Math.random() * 0.5}s`,
      shape: Math.random() > 0.5 ? 'rounded-full' : 'rounded-sm',
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`confetti-particle ${p.shape}`}
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

const VocabularyGame: React.FC<VocabularyGameProps> = ({ learnedWords, troubleWords, onCorrect, onIncorrect }) => {
  const [current, setCurrent] = useState<VocabQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const recognitionRef = useRef<any>(null);

  const troubleWordsList = useMemo(() => {
    return Object.entries(troubleWords)
      .filter(([_, count]) => count > 0)
      .map(([word]) => word);
  }, [troubleWords]);

  const fetchQuestion = async () => {
    setLoading(true);
    setSelected(null);
    setFeedback(null);
    setImageUrl(null);
    setIsCorrect(false);
    setIsIncorrect(false);
    setInterimTranscript("");
    setIsImageLoading(false);
    
    let targetWord: string | undefined = undefined;
    if (troubleWordsList.length > 0 && Math.random() < 0.3) {
      targetWord = troubleWordsList[Math.floor(Math.random() * troubleWordsList.length)];
      setIsPracticeMode(true);
    } else {
      setIsPracticeMode(false);
    }

    const data = await generateVocabQuestion(targetWord);
    setCurrent(data);
    setLoading(false);
    
    if (data.question) {
      await speakText(data.question);
      // Auto-trigger speech recognition after reading the question
      setTimeout(() => handleSpeech(), 500);
    }
  };

  useEffect(() => {
    fetchQuestion();
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const handleSpeech = () => {
    if (feedback !== null || isListening) return;
    
    if (!('webkitSpeechRecognition' in window)) {
      alert("Please use Chrome for voice features!");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      setInterimTranscript(currentTranscript);

      if (event.results[0].isFinal) {
        const finalWord = event.results[0][0].transcript.toLowerCase().trim();
        setIsListening(false);
        processSpeechResult(finalWord);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processSpeechResult = async (spoken: string) => {
    if (!current) return;
    
    const target = current.answerWord.toLowerCase().trim();
    // Allow fuzzy matching (if transcript contains target word)
    if (spoken.includes(target) || (target.includes(spoken) && spoken.length > 2)) {
      handleSuccess();
    } else {
      sounds.play('incorrect');
      setIsIncorrect(true);
      setFeedback(`Sparky heard "${spoken}"... Let's try saying "${current.answerWord}" again!`);
      onIncorrect(current.answerWord);
      setTimeout(() => {
        setFeedback(null);
        setIsIncorrect(false);
        setInterimTranscript("");
      }, 3000);
    }
  };

  const handleSuccess = async () => {
    if (!current) return;
    sounds.play('correct');
    setIsCorrect(true);
    setFeedback(`Wonderful! That's a ${current.answerWord}! 🎤✨`);
    
    // Generate reinforcement image as a reward
    setIsImageLoading(true);
    const reinforcementUrl = await generateVocabImage(`A beautiful, happy ${current.answerWord} for a child's prize`);
    if (reinforcementUrl) {
      setImageUrl(reinforcementUrl);
    }
    setIsImageLoading(false);

    onCorrect(current.answerWord);
    // Allow more time to see the beautiful reinforcement image
    setTimeout(fetchQuestion, 5000);
  };

  const handleSelect = (idx: number) => {
    if (feedback || !current) return;
    if (recognitionRef.current) recognitionRef.current.stop();
    
    setSelected(idx);
    if (idx === current.correctIndex) {
      handleSuccess();
    } else {
      sounds.play('incorrect');
      setIsIncorrect(true);
      setFeedback("Not quite, but you're getting closer! Try again! 💪");
      onIncorrect(current.answerWord);
      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
        setIsIncorrect(false);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-xl border-4 border-purple-200 text-center flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-purple-600 font-bold text-2xl">Sparky is searching for a fun word... 🔍</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {isCorrect && <Confetti />}
      
      <div className="flex justify-between items-center px-4">
        <button 
          onClick={() => { sounds.play('click'); setShowCollection(!showCollection); }}
          className="bg-purple-100 text-purple-700 px-6 py-2 rounded-full font-bold border-2 border-purple-200 hover:bg-purple-200 transition-colors shadow-sm"
        >
          {showCollection ? "Back to Game" : `My Word Bank (${learnedWords.length})`}
        </button>

        {isPracticeMode && !showCollection && (
          <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold border-2 border-orange-200 flex items-center gap-2 animate-pulse">
            <span>🔄</span> Practice Mode
          </div>
        )}
      </div>

      {showCollection ? (
        <div className="bg-white rounded-3xl p-8 shadow-xl border-4 border-purple-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
              <span>📚</span> My Learned Words
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {learnedWords.map((word, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-2xl border-2 text-center hover:scale-105 transition-transform ${troubleWords[word] > 0 ? 'bg-orange-50 border-orange-200' : 'bg-purple-50 border-purple-100'}`}
              >
                <span className={`font-bold text-xl capitalize ${troubleWords[word] > 0 ? 'text-orange-700' : 'text-purple-700'}`}>{word}</span>
                <button onClick={() => { sounds.play('click'); speakText(word); }} className="block mx-auto mt-2 text-purple-300 hover:text-purple-500 text-xl">🔊</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`bg-white rounded-3xl p-8 shadow-xl border-4 border-purple-200 text-center animate-in fade-in zoom-in duration-500 relative transition-transform ${isIncorrect ? 'animate-shake' : ''}`}>
          <h2 className="text-4xl font-bold mb-8 text-purple-700 leading-tight">{current?.question}</h2>
          
          <div className="flex justify-center mb-10 min-h-[300px] relative">
            {/* Real-time speech bubble */}
            {isListening && interimTranscript && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-xl border-2 border-purple-200 z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white"></div>
                <p className="text-purple-600 font-bold text-xl italic">"{interimTranscript}..."</p>
              </div>
            )}

            {isImageLoading ? (
              <div className="w-full max-w-md h-[300px] bg-purple-50 border-4 border-dashed border-purple-100 rounded-3xl flex flex-col items-center justify-center gap-4 animate-pulse">
                <span className="text-6xl animate-bounce">🎨</span>
                <p className="text-purple-300 font-bold text-xl">Sparky is drawing your prize...</p>
              </div>
            ) : imageUrl ? (
              <img 
                src={imageUrl} 
                alt={current?.answerWord} 
                className="w-full max-w-md h-auto rounded-3xl shadow-lg border-4 border-purple-50 transition-all duration-300 hover:scale-[1.05]" 
              />
            ) : (
              <div className="text-[12rem] mb-10 animate-bounce">{current?.emoji || '❓'}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto mb-10">
            {current?.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={feedback !== null}
                className={`p-6 rounded-3xl text-3xl font-bold transition-all border-b-8 active:border-b-0 active:translate-y-2 flex items-center justify-center min-h-[100px]
                  ${selected === idx && idx === current.correctIndex ? 'bg-green-400 border-green-600 text-white' : 
                    selected === idx ? 'bg-red-400 border-red-600 text-white' : 
                    'bg-white border-purple-200 hover:bg-purple-50 text-purple-700 shadow-md'}
                `}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative inline-block">
              {isListening && (
                <>
                  <div className="voice-wave"></div>
                  <div className="voice-wave voice-wave-delayed"></div>
                </>
              )}
              <button
                onClick={handleSpeech}
                disabled={isListening || feedback !== null}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90
                  ${isListening ? 'bg-red-500' : 'bg-purple-600 hover:bg-purple-700 hover:scale-110'}
                `}
              >
                <span className="text-4xl text-white">{isListening ? '🛑' : '🎤'}</span>
              </button>
            </div>
            <p className={`font-bold text-xl ${isListening ? 'text-red-500 animate-pulse' : 'text-purple-400'}`}>
              {isListening ? "I'm listening! Say the word!" : "Tap to Speak!"}
            </p>
          </div>

          {feedback && (
            <div className={`mt-10 text-3xl font-bold p-8 rounded-3xl ${isCorrect ? 'bg-green-100 text-green-700 border-4 border-green-200' : 'bg-orange-100 text-orange-700 border-4 border-orange-200'} animate-bounce shadow-xl`}>
              {feedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VocabularyGame;
