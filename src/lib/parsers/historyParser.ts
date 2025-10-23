import { CompletedExercise } from '@/types';

interface ParsedHistoryWorkout {
  date: Date;
  dayNumber: number;
  exercises: CompletedExercise[];
}

/**
 * Парсить історичні дані тренувань з текстового формату
 * 
 * Очікуваний формат:
 * Дата: 15.10.2024
 * День 1
 * 
 * 1. Присідання зі штангою
 * Підхід 1: 100 кг × 12 повторень
 * Підхід 2: 100 кг × 10 повторень
 * 
 * 2. Жим ногами
 * Підхід 1: 150 кг × 15 повторень
 * ...
 */
export function parseHistoryWorkouts(text: string): ParsedHistoryWorkout[] {
  const workouts: ParsedHistoryWorkout[] = [];
  
  // Очищаємо текст
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Розділяємо по датам
  const dateRegex = /Дата:\s*(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/gi;
  const dateMatches = [...cleanText.matchAll(dateRegex)];
  
  if (dateMatches.length === 0) {
    // Спробуємо інший формат дати
    const altDateRegex = /(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/g;
    const altMatches = [...cleanText.matchAll(altDateRegex)];
    
    if (altMatches.length === 0) {
      throw new Error('Не знайдено дат у форматі ДД.ММ.РРРР або Дата: ДД.ММ.РРРР');
    }
    
    // Використовуємо альтернативні дати
    altMatches.forEach((match, index) => {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);
      const date = new Date(year, month - 1, day);
      
      const startIndex = match.index!;
      const endIndex = index < altMatches.length - 1 
        ? altMatches[index + 1].index! 
        : cleanText.length;
      
      const workoutText = cleanText.substring(startIndex, endIndex);
      const workout = parseWorkoutBlock(workoutText, date);
      
      if (workout) {
        workouts.push(workout);
      }
    });
  } else {
    // Використовуємо дати з "Дата:"
    dateMatches.forEach((match, index) => {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]);
      const year = parseInt(match[3]);
      const date = new Date(year, month - 1, day);
      
      const startIndex = match.index!;
      const endIndex = index < dateMatches.length - 1 
        ? dateMatches[index + 1].index! 
        : cleanText.length;
      
      const workoutText = cleanText.substring(startIndex, endIndex);
      const workout = parseWorkoutBlock(workoutText, date);
      
      if (workout) {
        workouts.push(workout);
      }
    });
  }
  
  return workouts;
}

function parseWorkoutBlock(text: string, date: Date): ParsedHistoryWorkout | null {
  // Знаходимо номер дня
  const dayMatch = text.match(/День\s+(\d+)/i);
  if (!dayMatch) {
    return null; // Пропускаємо блоки без дня
  }
  
  const dayNumber = parseInt(dayMatch[1]);
  
  // Парсимо вправи
  const exercises = parseHistoryExercises(text);
  
  if (exercises.length === 0) {
    return null;
  }
  
  return {
    date,
    dayNumber,
    exercises,
  };
}

function parseHistoryExercises(text: string): CompletedExercise[] {
  const exercises: CompletedExercise[] = [];
  const lines = text.split('\n');
  
  let currentExercise: {
    name: string;
    sets: Array<{ setNumber: number; weight: number; reps: number }>;
  } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Перевіряємо чи це нова вправа (1. Назва вправи)
    const exerciseMatch = line.match(/^(\d+)\.\s+(.+)/);
    
    if (exerciseMatch && !line.includes('Підхід')) {
      // Зберігаємо попередню вправу
      if (currentExercise && currentExercise.sets.length > 0) {
        exercises.push({
          exerciseId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: currentExercise.name,
          sets: currentExercise.sets,
        });
      }
      
      // Починаємо нову вправу
      currentExercise = {
        name: exerciseMatch[2].trim(),
        sets: [],
      };
    } else if (currentExercise) {
      // Перевіряємо чи це підхід
      // Формати: "Підхід 1: 100 кг × 12 повторень" або "Підхід 1: 12 повторень" (без ваги)
      const setWithWeightMatch = line.match(
        /Підхід\s+(\d+):\s*(?:(\d+(?:[.,]\d+)?)\s*кг\s*[×x]\s*)?(\d+)\s*повторень/i
      );
      
      if (setWithWeightMatch) {
        const setNumber = parseInt(setWithWeightMatch[1]);
        const weight = setWithWeightMatch[2] 
          ? parseFloat(setWithWeightMatch[2].replace(',', '.')) 
          : 0;
        const reps = parseInt(setWithWeightMatch[3]);
        
        currentExercise.sets.push({
          setNumber,
          weight,
          reps,
        });
      }
    }
  }
  
  // Не забуваємо останню вправу
  if (currentExercise && currentExercise.sets.length > 0) {
    exercises.push({
      exerciseId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: currentExercise.name,
      sets: currentExercise.sets,
    });
  }
  
  return exercises;
}

/**
 * Форматує історичне тренування для відображення
 */
export function formatHistoryWorkout(workout: ParsedHistoryWorkout): string {
  let result = `Дата: ${workout.date.toLocaleDateString('uk-UA')}\n`;
  result += `День ${workout.dayNumber}\n\n`;
  
  workout.exercises.forEach((exercise, idx) => {
    result += `${idx + 1}. ${exercise.name}\n`;
    exercise.sets.forEach(set => {
      result += `   Підхід ${set.setNumber}: `;
      if (set.weight > 0) {
        result += `${set.weight} кг × `;
      }
      result += `${set.reps} повторень\n`;
    });
    result += '\n';
  });
  
  return result;
}

/**
 * Генерує приклад тексту для імпорту
 */
export function getImportExample(): string {
  return `Дата: 15.10.2024
День 1

1. Присідання зі штангою
Підхід 1: 100 кг × 12 повторень
Підхід 2: 100 кг × 10 повторень
Підхід 3: 100 кг × 8 повторень

2. Жим ногами
Підхід 1: 150 кг × 15 повторень
Підхід 2: 150 кг × 12 повторень
Підхід 3: 150 кг × 10 повторень

---

Дата: 17.10.2024
День 2

1. Жим штанги лежачи
Підхід 1: 80 кг × 12 повторень
Підхід 2: 80 кг × 10 повторень
Підхід 3: 80 кг × 8 повторень

2. Розведення гантелей
Підхід 1: 16 кг × 15 повторень
Підхід 2: 16 кг × 12 повторень
Підхід 3: 16 кг × 10 повторень`;
}

