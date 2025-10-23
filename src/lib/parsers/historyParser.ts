import { CompletedExercise } from '@/types';

interface ParsedHistoryWorkout {
  date: Date;
  dayNumber: number;
  exercises: CompletedExercise[];
}

/**
 * Парсить історичні дані тренувань з текстового формату
 * 
 * Новий формат:
 * Тиждень: 14.10.2024 - 20.10.2024
 * 
 * День 1
 * 1. Присідання зі штангою
 * 100 кг × 12 повторень
 * 100 кг × 10 повторень
 * 100 кг × 8 повторень
 * 
 * 2. Жим ногами
 * 150 кг × 15 повторень
 * 150 кг × 12 повторень
 * 
 * День 2
 * 1. Жим штанги лежачи
 * 80 кг × 12 повторень
 * 80 кг × 10 повторень
 */
export function parseHistoryWorkouts(text: string): ParsedHistoryWorkout[] {
  const workouts: ParsedHistoryWorkout[] = [];
  
  // Очищаємо текст
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Шукаємо тижні
  const weekRegex = /Тиждень:\s*(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})\s*-\s*(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/gi;
  const weekMatches = [...cleanText.matchAll(weekRegex)];
  
  if (weekMatches.length === 0) {
    throw new Error('Не знайдено тижнів у форматі "Тиждень: ДД.ММ.РРРР - ДД.ММ.РРРР"');
  }
  
  weekMatches.forEach((match, weekIndex) => {
    const startDay = parseInt(match[1]);
    const startMonth = parseInt(match[2]);
    const startYear = parseInt(match[3]);
    const endDay = parseInt(match[4]);
    const endMonth = parseInt(match[5]);
    const endYear = parseInt(match[6]);
    
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    
    const startIndex = match.index!;
    const endIndex = weekIndex < weekMatches.length - 1 
      ? weekMatches[weekIndex + 1].index! 
      : cleanText.length;
    
    const weekText = cleanText.substring(startIndex, endIndex);
    const weekWorkouts = parseWeekBlock(weekText, startDate, endDate);
    
    workouts.push(...weekWorkouts);
  });
  
  return workouts;
}

function parseWeekBlock(text: string, startDate: Date, _endDate: Date): ParsedHistoryWorkout[] {
  const workouts: ParsedHistoryWorkout[] = [];
  
  // Розділяємо по днях
  const dayRegex = /День\s+(\d+)/gi;
  const dayMatches = [...text.matchAll(dayRegex)];
  
  if (dayMatches.length === 0) {
    return workouts;
  }
  
  dayMatches.forEach((match, index) => {
    const dayNumber = parseInt(match[1]);
    const startIndex = match.index!;
    const endIndex = index < dayMatches.length - 1 
      ? dayMatches[index + 1].index! 
      : text.length;
    
    const dayText = text.substring(startIndex, endIndex);
    const exercises = parseHistoryExercises(dayText);
    
    if (exercises.length > 0) {
      // Розраховуємо дату на основі дня тижня
      const workoutDate = new Date(startDate);
      workoutDate.setDate(startDate.getDate() + (dayNumber - 1));
      
      workouts.push({
        date: workoutDate,
        dayNumber,
        exercises,
      });
    }
  });
  
  return workouts;
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
    
    if (exerciseMatch && !line.includes('кг') && !line.includes('повторень')) {
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
      // Перевіряємо чи це підхід (новий формат без "Підхід 1:")
      // Формати: "100 кг × 12 повторень" або "12 повторень" (без ваги)
      const setMatch = line.match(
        /(?:(\d+(?:[.,]\d+)?)\s*кг\s*[×x]\s*)?(\d+)\s*повторень/i
      );
      
      if (setMatch) {
        const weight = setMatch[1] 
          ? parseFloat(setMatch[1].replace(',', '.')) 
          : 0;
        const reps = parseInt(setMatch[2]);
        
        currentExercise.sets.push({
          setNumber: currentExercise.sets.length + 1,
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
      if (set.weight > 0) {
        result += `   ${set.weight} кг × ${set.reps} повторень\n`;
      } else {
        result += `   ${set.reps} повторень\n`;
      }
    });
    result += '\n';
  });
  
  return result;
}

/**
 * Генерує приклад тексту для імпорту
 */
export function getImportExample(): string {
  return `Тиждень: 14.10.2024 - 20.10.2024

День 1
1. Присідання зі штангою
100 кг × 12 повторень
100 кг × 10 повторень
100 кг × 8 повторень

2. Жим ногами
150 кг × 15 повторень
150 кг × 12 повторень
150 кг × 10 повторень

День 2
1. Жим штанги лежачи
80 кг × 12 повторень
80 кг × 10 повторень
80 кг × 8 повторень

2. Розведення гантелей
16 кг × 15 повторень
16 кг × 12 повторень
16 кг × 10 повторень

День 3
1. Віджимання від підлоги
20 повторень
18 повторень
15 повторень

2. Підтягування
10 повторень
8 повторень
6 повторень

---

Тиждень: 21.10.2024 - 27.10.2024

День 1
1. Присідання зі штангою
102.5 кг × 12 повторень
102.5 кг × 10 повторень
102.5 кг × 8 повторень

2. Жим ногами
155 кг × 15 повторень
155 кг × 12 повторень`;
}