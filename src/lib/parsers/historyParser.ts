import type { CompletedExercise } from '@/types';

interface ParsedHistoryWorkout {
  date: Date;
  dayNumber: number;
  exercises: CompletedExercise[];
}

/**
 * Парсить історичні дані тренувань з текстового формату
 *
 * Підтримуваний формат:
 * Тиждень: 25.08.2024 - 31.08.2024
 *
 * День 1
 * 1. Присідання зі штангою – 3×8-12
 * 100 кг × 12
 * 100 кг × 10
 * 100 кг × 8
 *
 * 2. Жим ногами – 3×10-15
 * 150 кг × 15
 * 150 кг × 12
 *
 * 3. Віджимання від підлоги – 3×макс
 * 20
 * 18
 * 15
 *
 * День 2
 * 1. Жим штанги лежачи – 3×8-12
 * 80 кг × 12
 * 80 кг × 10
 */
export function parseHistoryWorkouts(text: string): ParsedHistoryWorkout[] {
  const workouts: ParsedHistoryWorkout[] = [];

  // Очищаємо текст
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Шукаємо тижні
  const weekRegex = /Тиждень:\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})\s*-\s*(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})/gi;
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
    const endIndex = weekIndex < weekMatches.length - 1 ? weekMatches[weekIndex + 1].index! : cleanText.length;

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
    const endIndex = index < dayMatches.length - 1 ? dayMatches[index + 1].index! : text.length;

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
    // Підтримуємо формат з описом підходів: "1. Присідання зі штангою – 3×8-12"
    const exerciseMatch = line.match(/^(\d+)\.\s+(.+?)(?:\s*[–-]\s*.*)?$/);

    if (exerciseMatch) {
      // Перевіряємо чи це дійсно назва вправи, а не підхід
      const isExerciseName =
        !line.includes('кг') && !line.includes(' × ') && !/^\d+$/.test(line) && !line.match(/^\d+\s*кг/);

      if (isExerciseName) {
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
      }
    } else if (currentExercise && line.trim() !== '') {
      // Перевіряємо чи це підхід
      // Формати: "100 кг × 12" або "12" (без ваги) або "макс" для максимальних повторень
      const setMatch = line.match(/^(?:(\d+(?:[.,]\d+)?)\s*кг\s*[×x]\s*)?(\d+)(?:\s*$|$)/i);

      // Додаткова перевірка: рядок повинен бути простим числом або містити кг та ×
      const isValidSet =
        setMatch &&
        (line.match(/^\d+$/) || // Просто число (наприклад, "20")
          line.match(/^\d+(?:[.,]\d+)?\s*кг\s*[×x]\s*\d+$/i)); // Вага та повторення

      if (isValidSet) {
        const weight = setMatch[1] ? parseFloat(setMatch[1].replace(',', '.')) : 0;
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
    exercise.sets.forEach((set) => {
      if (set.weight > 0) {
        result += `   ${set.weight} кг × ${set.reps} \n`;
      } else {
        result += `   ${set.reps} \n`;
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
  return `Тиждень: 25.08.2024 - 31.08.2024

День 1
1. Присідання зі штангою – 3×8-12
100 кг × 12
100 кг × 10
100 кг × 8

2. Жим ногами – 3×10-15
150 кг × 15
150 кг × 12
150 кг × 10

3. Згинання ніг сидячи у тренажері – 3×10-15
27 кг × 12
32 кг × 10
32 кг × 10

4. Випади з гантелями – 3×10-12
14 кг × 12
16 кг × 10
16 кг × 10

5. Підйом на носки стоячи (ікра) – 3×15-20
40 кг × 20
50 кг × 18
50 кг × 15

День 2
1. Жим штанги лежачи – 3×8-12
80 кг × 12
80 кг × 10
80 кг × 8

2. Розведення гантелей лежачи – 3×10-15
16 кг × 15
16 кг × 12
16 кг × 10

3. Жим гантелей сидячи – 3×8-12
15 кг × 12
17.5 кг × 10
17.5 кг × 8

4. Махи гантелями в сторони – 3×12-15
5 кг × 15
5 кг × 12
5 кг × 12

5. Французький жим лежачи – 3×8-12
15 кг × 12
17.5 кг × 10
17.5 кг × 8

День 3
1. Віджимання від підлоги – 3×макс
20
18
15

2. Підтягування – 3×макс
10
8
6

3. Тяга верхнього блока – 3×10-12
41 кг × 12
45 кг × 10
50 кг × 8

4. Тяга однієї гантелі під нахилом – 3×8-12
17.5 кг × 12
20 кг × 10
22.5 кг × 8

5. Молотки – 3×8-12
8 кг × 12
10 кг × 10
10 кг × 8`;
}
