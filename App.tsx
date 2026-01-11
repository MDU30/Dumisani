
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import MathGame from './components/MathGame';
import EnglishStory from './components/EnglishStory';
import VocabularyGame from './components/VocabularyGame';
import PhonicsGame from './components/PhonicsGame';
import TutorAgency from './components/TutorAgency';
import ImageLab from './components/ImageLab';
import SparkyLive from './components/SparkyLive';
import { UserStats, ActivityType, Subject } from './types';
import { getEncouragement } from './services/geminiService';
import { sounds } from './services/soundService';

const App: React.FC = () => {
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('sparky_stats');
    return saved ? JSON.parse(saved) : {
      stars: 0,
      mathLevel: 1,
      englishLevel: 1,
      completedActivities: [],
      learnedWords: [],
      troubleWords: {}
    };
  });

  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentActivity, setCurrentActivity] = useState<ActivityType | null>(null);
  const [encouragement, setEncouragement] = useState<string>('');
  const [showEncouragement, setShowEncouragement] = useState(false);

  useEffect(() => {
    localStorage.setItem('sparky_stats', JSON.stringify(stats));
  }, [stats]);

  const triggerEncouragement = async (sub: string, perf: string) => {
    const msg = await getEncouragement(sub, perf);
    setEncouragement(msg);
    setShowEncouragement(true);
    setTimeout(() => setShowEncouragement(false), 5000);
  };

  const handleCorrect = (subjectLabel: string, wordLearned?: string) => {
    setStats(prev => {
      const isMath = subjectLabel === "Math";
      const newLearnedWords = wordLearned && !prev.learnedWords.includes(wordLearned) 
        ? [...prev.learnedWords, wordLearned] 
        : prev.learnedWords;

      const newTroubleWords = { ...prev.troubleWords };
      if (wordLearned && newTroubleWords[wordLearned]) {
        newTroubleWords[wordLearned] = Math.max(0, newTroubleWords[wordLearned] - 1);
      }

      return { 
        ...prev, 
        stars: prev.stars + 5,
        mathLevel: isMath ? prev.mathLevel + (prev.stars > 0 && prev.stars % 50 === 0 ? 1 : 0) : prev.mathLevel,
        englishLevel: !isMath ? prev.englishLevel + (prev.stars > 0 && prev.stars % 50 === 0 ? 1 : 0) : prev.englishLevel,
        learnedWords: newLearnedWords,
        troubleWords: newTroubleWords
      };
    });
    
    if (stats.stars > 0 && stats.stars % 15 === 0) {
      triggerEncouragement(subjectLabel, "did an amazing job playing!");
    }
  };

  const handleIncorrect = (wordMissed?: string) => {
    if (!wordMissed) return;
    setStats(prev => {
      const newTroubleWords = { ...prev.troubleWords };
      newTroubleWords[wordMissed] = (newTroubleWords[wordMissed] || 0) + 1;
      return { ...prev, troubleWords: newTroubleWords };
    });
  };

  const handleEnglishComplete = () => {
    sounds.play('fanfare');
    setStats(prev => ({ 
      ...prev, 
      stars: prev.stars + 20,
      englishLevel: prev.englishLevel + 1
    }));
    triggerEncouragement("English", "completed a whole story adventure");
    setCurrentActivity(null);
  };

  const getActivityLabel = (type: ActivityType | null) => {
    switch(type) {
      case ActivityType.COUNTING: return "Counting";
      case ActivityType.ADDITION: return "Addition";
      case ActivityType.SUBTRACTION: return "Subtraction";
      case ActivityType.STORY: return "Story Time";
      case ActivityType.VOCABULARY: return "Word Explorer";
      case ActivityType.PHONICS: return "Sound Safari";
      case ActivityType.TUTOR_SESSION: return "Tutor Agency";
      case ActivityType.IMAGE_LAB: return "Magic Picture Lab";
      case ActivityType.SPARKY_LIVE: return "Sparky Live";
      default: return "";
    }
  };

  const navigateToSubject = (sub: Subject) => {
    sounds.play('click');
    setCurrentSubject(sub);
  };

  const navigateToActivity = (act: ActivityType) => {
    sounds.play('click');
    setCurrentActivity(act);
  };

  return (
    <Layout stats={stats} onHome={() => { sounds.play('click'); setCurrentSubject(null); setCurrentActivity(null); }}>
      
      {!currentSubject && (
        <div className="space-y-12 py-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => navigateToSubject(Subject.MATH)}
              className="group relative overflow-hidden bg-white rounded-3xl p-10 shadow-2xl border-4 border-blue-200 hover:border-blue-400 transition-all text-left"
            >
              <div className="absolute top-0 right-0 p-4 text-7xl opacity-20 group-hover:scale-125 transition-transform">➕</div>
              <h2 className="text-4xl font-bold text-blue-600 mb-4">Mathematics</h2>
              <p className="text-slate-500 text-xl mb-6">Learn numbers, addition, and subtraction!</p>
              <span className="inline-block bg-blue-500 text-white px-8 py-4 rounded-full font-bold">Let's Play!</span>
            </button>

            <button 
              onClick={() => navigateToSubject(Subject.ENGLISH)}
              className="group relative overflow-hidden bg-white rounded-3xl p-10 shadow-2xl border-4 border-pink-200 hover:border-pink-400 transition-all text-left"
            >
              <div className="absolute top-0 right-0 p-4 text-7xl opacity-20 group-hover:scale-125 transition-transform">📖</div>
              <h2 className="text-4xl font-bold text-pink-600 mb-4">English</h2>
              <p className="text-slate-500 text-xl mb-6">Discover new words and enjoy magical stories!</p>
              <span className="inline-block bg-pink-500 text-white px-8 py-4 rounded-full font-bold">Let's Read!</span>
            </button>

            <button 
              onClick={() => navigateToSubject(Subject.MAGIC)}
              className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-10 shadow-2xl border-4 border-purple-300 hover:scale-[1.02] transition-all text-left"
            >
              <div className="absolute top-0 right-0 p-4 text-7xl opacity-20 group-hover:scale-125 transition-transform">✨</div>
              <h2 className="text-4xl font-bold text-white mb-4">Magic World</h2>
              <p className="text-purple-100 text-xl mb-6">Real-time chats and magic image editing!</p>
              <span className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-bold">Enter World</span>
            </button>
          </div>

          <button 
            onClick={() => { sounds.play('click'); setCurrentSubject(Subject.TUTOR); setCurrentActivity(ActivityType.TUTOR_SESSION); }}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-orange-400 to-yellow-400 rounded-3xl p-10 shadow-2xl border-4 border-orange-200 hover:scale-[1.01] transition-all text-left animate-in fade-in slide-in-from-bottom-8 delay-200 duration-700"
          >
            <div className="absolute top-0 right-0 p-8 text-9xl opacity-10 group-hover:scale-125 transition-transform">🦉</div>
            <div className="relative z-10">
                <h2 className="text-5xl font-bold text-white mb-4">AI Tutor Agency</h2>
                <p className="text-orange-900/70 text-2xl mb-8 max-w-2xl">Talk to Sparky and his friends!</p>
                <span className="inline-flex items-center gap-3 bg-white text-orange-500 px-10 py-5 rounded-full text-2xl font-bold shadow-xl group-hover:bg-orange-50 transition-colors">
                  <span>💬</span> Start Talking
                </span>
            </div>
          </button>
        </div>
      )}

      {currentSubject === Subject.MATH && !currentActivity && (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-blue-700">Math Adventures</h2>
            <button onClick={() => { sounds.play('click'); setCurrentSubject(null); }} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-full font-bold transition-colors">← Back</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[{ type: ActivityType.COUNTING, label: "Counting", icon: "🔢" }, { type: ActivityType.ADDITION, label: "Addition", icon: "➕" }, { type: ActivityType.SUBTRACTION, label: "Subtraction", icon: "➖" }].map(act => (
              <button key={act.type} onClick={() => navigateToActivity(act.type)} className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-100 hover:border-blue-400 transition-all text-center flex flex-col items-center gap-4">
                <span className="text-5xl">{act.icon}</span>
                <span className="text-2xl font-bold text-blue-600">{act.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {currentSubject === Subject.ENGLISH && !currentActivity && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-pink-700">English Island</h2>
            <button onClick={() => { sounds.play('click'); setCurrentSubject(null); }} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-full font-bold transition-colors">← Back</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[{ type: ActivityType.STORY, label: "Story Time", icon: "🦉" }, { type: ActivityType.VOCABULARY, label: "Word Explorer", icon: "🔍" }, { type: ActivityType.PHONICS, label: "Sound Safari", icon: "🎵" }].map(act => (
              <button key={act.type} onClick={() => navigateToActivity(act.type)} className="bg-white p-10 rounded-2xl shadow-lg border-2 border-pink-100 hover:border-pink-400 transition-all text-center flex flex-col items-center gap-4 group">
                <span className="text-6xl group-hover:scale-110 transition-transform">{act.icon}</span>
                <span className="text-2xl font-bold text-pink-600">{act.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {currentSubject === Subject.MAGIC && !currentActivity && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-purple-700">Magic World</h2>
            <button onClick={() => { sounds.play('click'); setCurrentSubject(null); }} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-full font-bold transition-colors">← Back</button>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <button onClick={() => navigateToActivity(ActivityType.SPARKY_LIVE)} className="bg-white p-10 rounded-2xl shadow-lg border-2 border-purple-100 hover:border-purple-400 transition-all text-center flex flex-col items-center gap-4 group">
                <span className="text-7xl group-hover:scale-110 transition-transform">🎙️</span>
                <span className="text-3xl font-bold text-purple-600">Sparky Live Chat</span>
                <p className="text-slate-400">Have a real conversation with Sparky!</p>
            </button>
            <button onClick={() => navigateToActivity(ActivityType.IMAGE_LAB)} className="bg-white p-10 rounded-2xl shadow-lg border-2 border-purple-100 hover:border-purple-400 transition-all text-center flex flex-col items-center gap-4 group">
                <span className="text-7xl group-hover:scale-110 transition-transform">🪄</span>
                <span className="text-3xl font-bold text-purple-600">Magic Picture Lab</span>
                <p className="text-slate-400">Change any picture with AI magic!</p>
            </button>
          </div>
        </div>
      )}

      {currentActivity && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4">
             <div className="flex items-center gap-3">
               <span className="text-3xl">✨</span>
               <h2 className="text-2xl font-bold text-slate-600">{getActivityLabel(currentActivity)}</h2>
             </div>
             <button 
               onClick={() => { sounds.play('click'); setCurrentActivity(null); if (currentSubject === Subject.TUTOR) setCurrentSubject(null); }}
               className="px-6 py-2 bg-white border-2 border-slate-200 text-slate-500 rounded-full font-bold transition-all shadow-sm"
             >
               Exit Game
             </button>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {currentActivity === ActivityType.COUNTING && <MathGame type={ActivityType.COUNTING} onCorrect={() => handleCorrect("Math")} onIncorrect={() => {}} />}
            {currentActivity === ActivityType.ADDITION && <MathGame type={ActivityType.ADDITION} onCorrect={() => handleCorrect("Math")} onIncorrect={() => {}} />}
            {currentActivity === ActivityType.SUBTRACTION && <MathGame type={ActivityType.SUBTRACTION} onCorrect={() => handleCorrect("Math")} onIncorrect={() => {}} />}
            {currentActivity === ActivityType.STORY && <EnglishStory onComplete={handleEnglishComplete} />}
            {currentActivity === ActivityType.VOCABULARY && <VocabularyGame learnedWords={stats.learnedWords} troubleWords={stats.troubleWords} onCorrect={(word) => handleCorrect("English", word)} onIncorrect={(word) => handleIncorrect(word)} />}
            {currentActivity === ActivityType.PHONICS && <PhonicsGame onCorrect={() => handleCorrect("English")} onIncorrect={() => {}} />}
            {currentActivity === ActivityType.TUTOR_SESSION && <TutorAgency />}
            {currentActivity === ActivityType.IMAGE_LAB && <ImageLab />}
            {currentActivity === ActivityType.SPARKY_LIVE && <SparkyLive />}
          </div>
        </div>
      )}

      {showEncouragement && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-full duration-500">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border-4 border-yellow-400 flex items-start gap-4 max-w-sm">
            <span className="text-5xl bounce-slow">🦉</span>
            <div><p className="font-bold text-slate-800 text-lg">{encouragement}</p></div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
