
import React from 'react';
import { UserStats } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  stats: UserStats;
  onHome: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, stats, onHome }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 p-4 border-b-4 border-yellow-200 shadow-sm flex justify-between items-center">
        <button 
          onClick={onHome}
          className="flex items-center gap-2 text-2xl font-bold text-orange-500 hover:scale-105 transition-transform"
        >
          <span className="text-4xl">🦉</span>
          <span className="hidden sm:inline">SparkyLearning</span>
        </button>
        
        <div className="flex gap-4">
          <div className="bg-yellow-100 px-4 py-2 rounded-full border-2 border-yellow-400 flex items-center gap-2 shadow-inner">
            <span className="text-xl">⭐</span>
            <span className="font-bold text-yellow-700">{stats.stars}</span>
          </div>
          <div className="bg-blue-100 px-4 py-2 rounded-full border-2 border-blue-400 flex items-center gap-2 shadow-inner">
            <span className="text-xl">🏆</span>
            <span className="font-bold text-blue-700">Lvl {Math.max(stats.mathLevel, stats.englishLevel)}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {children}
      </main>

      <footer className="p-4 text-center text-slate-400 text-sm">
        Sparky the Owl is cheering for you! 🦉✨
      </footer>
    </div>
  );
};

export default Layout;
