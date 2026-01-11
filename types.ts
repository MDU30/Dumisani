
export enum Subject {
  MATH = 'MATH',
  ENGLISH = 'ENGLISH',
  TUTOR = 'TUTOR',
  MAGIC = 'MAGIC'
}

export enum ActivityType {
  COUNTING = 'COUNTING',
  ADDITION = 'ADDITION',
  SUBTRACTION = 'SUBTRACTION',
  VOCABULARY = 'VOCABULARY',
  PHONICS = 'PHONICS',
  STORY = 'STORY',
  TUTOR_SESSION = 'TUTOR_SESSION',
  IMAGE_LAB = 'IMAGE_LAB',
  SPARKY_LIVE = 'SPARKY_LIVE'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export interface UserStats {
  stars: number;
  mathLevel: number;
  englishLevel: number;
  completedActivities: string[];
  learnedWords: string[];
  troubleWords: Record<string, number>;
}

export interface MathProblem {
  question: string;
  visuals: string[];
  options: number[];
  answer: number;
  type: ActivityType;
  imageUrl?: string;
  itemType?: string;
}

export interface PhonicsActivity {
  sound: string;
  words: { word: string; image: string }[];
  type: ActivityType;
}
