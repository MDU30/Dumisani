
class SoundService {
  private sounds: Record<string, HTMLAudioElement> = {};

  constructor() {
    this.preload();
  }

  private preload() {
    const soundFiles = {
      correct: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c976f6e520.mp3', // Level up/Success
      incorrect: 'https://cdn.pixabay.com/audio/2024/01/15/audio_1e375f46e5.mp3', // Soft bonk
      click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_279146e494.mp3', // Pop
      fanfare: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625026c9f.mp3', // Win fanfare
    };

    Object.entries(soundFiles).forEach(([name, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      this.sounds[name] = audio;
    });
  }

  play(name: 'correct' | 'incorrect' | 'click' | 'fanfare') {
    const sound = this.sounds[name];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(e => console.log('Sound playback prevented:', e));
    }
  }
}

export const sounds = new SoundService();
