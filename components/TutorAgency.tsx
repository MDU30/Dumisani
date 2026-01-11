
import React, { useState, useEffect, useRef } from 'react';
import { tutorChat, speakText, generateExplanationImage } from '../services/geminiService';

interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const agents: Agent[] = [
  { id: 'sparky', name: 'Sparky the Owl', role: 'your main learning buddy', icon: '🦉', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { id: 'lexi', name: 'Lexi the Lion', role: 'the word and spelling expert', icon: '🦁', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { id: 'penny', name: 'Penny the Penguin', role: 'the numbers and math teacher', icon: '🐧', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { id: 'george', name: 'George the Giraffe', role: 'the science and nature guide', icon: '🦒', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' }
];

const TutorAgency: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [explainingImage, setExplainingImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const startTutoring = (agent: Agent) => {
    setSelectedAgent(agent);
    setErrorMessage(null);
    const initialMsg = `Hi there! I'm ${agent.name}, ${agent.role}. What would you like to learn about today? 🌟`;
    setMessages([{ role: 'ai', text: initialMsg }]);
    speakText(initialMsg);
  };

  const handleSpeech = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Please use Chrome for speech recognition!");
      return;
    }

    setErrorMessage(null);
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      if (!transcript.trim()) return;

      const userMsg = { role: 'user' as const, text: transcript };
      setMessages(prev => [...prev, userMsg]);
      
      setIsTyping(true);
      const aiResponse = await tutorChat(
        selectedAgent!.name, 
        selectedAgent!.role, 
        transcript, 
        messages
      );
      
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
      speakText(aiResponse);

      // Check if we should generate an image for explanation
      if (transcript.toLowerCase().includes('what is') || transcript.toLowerCase().includes('tell me about')) {
        const topic = transcript.toLowerCase().replace(/what is|tell me about/g, '').trim();
        if (topic.length > 2) {
            const url = await generateExplanationImage(topic);
            setExplainingImage(url);
        }
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'no-speech') {
        setErrorMessage("I didn't hear anything! Try again?");
      } else if (event.error === 'not-allowed') {
        setErrorMessage("Mic is blocked. Please allow it!");
      } else {
        setErrorMessage("Mic error: " + event.error);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      setIsListening(false);
      setErrorMessage("Could not start microphone.");
    }
  };

  if (!selectedAgent) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-5xl font-bold text-slate-800 mb-4">Sparky's Tutor Agency</h1>
          <p className="text-xl text-slate-500">Pick a friendly teacher to talk to!</p>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-8">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => startTutoring(agent)}
              className={`${agent.bgColor} border-4 ${agent.borderColor} rounded-3xl p-8 hover:scale-105 transition-all text-left group relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform text-8xl">
                {agent.icon}
              </div>
              <span className="text-6xl mb-4 block">{agent.icon}</span>
              <h2 className={`text-3xl font-bold ${agent.color} mb-2`}>{agent.name}</h2>
              <p className="text-slate-600 font-medium">I am {agent.role}!</p>
              <div className="mt-6 inline-block bg-white/50 px-6 py-2 rounded-full font-bold text-slate-700">Talk to me! 💬</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[70vh] flex flex-col animate-in fade-in zoom-in duration-500">
      <div className={`${selectedAgent.bgColor} ${selectedAgent.borderColor} border-4 rounded-t-3xl p-4 flex justify-between items-center shadow-sm`}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{selectedAgent.icon}</span>
          <div>
            <h2 className={`font-bold ${selectedAgent.color}`}>{selectedAgent.name}</h2>
            <p className="text-xs text-slate-500 font-medium capitalize">{selectedAgent.role}</p>
          </div>
        </div>
        <button 
          onClick={() => { setSelectedAgent(null); setMessages([]); setExplainingImage(null); }}
          className="text-slate-400 hover:text-slate-600 font-bold px-3 py-1 bg-white/50 rounded-full text-xs"
        >
          Close Agency
        </button>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-white border-x-4 border-slate-100 overflow-y-auto p-6 space-y-6"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-5 rounded-3xl font-medium text-lg shadow-sm ${
              m.role === 'user' 
                ? 'bg-blue-500 text-white rounded-tr-none' 
                : `${selectedAgent.bgColor} ${selectedAgent.color} rounded-tl-none border-2 ${selectedAgent.borderColor}`
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex justify-start">
             <div className={`${selectedAgent.bgColor} p-4 rounded-3xl rounded-tl-none animate-pulse flex gap-2`}>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
             </div>
           </div>
        )}

        {explainingImage && (
            <div className="flex justify-start animate-in zoom-in duration-500">
                <div className="bg-slate-50 p-3 rounded-3xl border-2 border-slate-100 shadow-lg max-w-[90%]">
                    <img src={explainingImage} alt="Explanation" className="rounded-2xl w-full h-auto" />
                    <button 
                        onClick={() => setExplainingImage(null)}
                        className="text-xs text-slate-400 mt-2 block mx-auto hover:text-slate-600"
                    >
                        Close Image
                    </button>
                </div>
            </div>
        )}
      </div>

      <div className="bg-slate-50 border-4 border-t-0 border-slate-100 rounded-b-3xl p-6 flex flex-col items-center gap-4">
        {errorMessage && (
          <p className="text-red-500 font-bold text-sm bg-red-50 px-4 py-1 rounded-full animate-bounce">
            ⚠️ {errorMessage}
          </p>
        )}
        <button
          onClick={handleSpeech}
          disabled={isListening || isTyping}
          className={`group w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all relative
            ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:scale-110 active:scale-95'}
          `}
        >
          <span className="text-4xl text-white">{isListening ? '⏹️' : '🎤'}</span>
          {!isListening && (
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-100 text-blue-600 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Tap to speak!
              </span>
          )}
        </button>
        <p className="text-slate-400 font-bold text-sm">
          {isListening ? 'Listening to your voice...' : 'Tap the microphone and ask me anything!'}
        </p>
      </div>
    </div>
  );
};

export default TutorAgency;
