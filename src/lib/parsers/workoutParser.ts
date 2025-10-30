import type { Exercise, DayWorkout } from '@/types';

export function parseWorkoutPlan(text: string): DayWorkout[] {
  const days: DayWorkout[] = [];

  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const dayRegex = /День\s+(\d+)/gi;
  const dayMatches = [...cleanText.matchAll(dayRegex)];

  if (dayMatches.length === 0) {
    return days;
  }

  dayMatches.forEach((match, index) => {
    const dayNumber = parseInt(match[1]);
    const startIndex = match.index!;
    const endIndex = index < dayMatches.length - 1 ? dayMatches[index + 1].index! : cleanText.length;

    const dayText = cleanText.substring(startIndex, endIndex);
    const exercises = parseExercises(dayText);

    if (exercises.length > 0) {
      days.push({
        day: dayNumber,
        exercises,
      });
    }
  });

  return days;
}

function parseExercises(dayText: string): Exercise[] {
  const exercises: Exercise[] = [];

  const lines = dayText.split('\n');
  let currentExercise: { name: string; details: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const exerciseMatch = line.match(/^(\d+)\.\s+(.+)/);

    if (exerciseMatch) {
      if (currentExercise) {
        exercises.push(parseExercise(currentExercise.name, currentExercise.details));
      }

      currentExercise = {
        name: exerciseMatch[2].trim(),
        details: '',
      };
    } else if (currentExercise && line) {
      currentExercise.details += (currentExercise.details ? ' ' : '') + line;
    }
  }

  if (currentExercise) {
    exercises.push(parseExercise(currentExercise.name, currentExercise.details));
  }

  return exercises;
}

function parseExercise(name: string, details: string): Exercise {
  const isSuperset = /суперсет/i.test(details);
  const isDropset = /дропсет/i.test(details);

  const setsMatch = details.match(/(\d+)\s*підход/i);
  const sets = setsMatch ? parseInt(setsMatch[1]) : 3;

  const repsMatch = details.match(/(?:по\s+)?([\d-]+)\s*/i);
  const reps = repsMatch ? repsMatch[1] : '8-12';

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    sets,
    reps,
    type: isSuperset ? 'superset' : isDropset ? 'dropset' : 'normal',
    notes: details,
  };
}

export function formatExerciseForDisplay(exercise: Exercise): string {
  let result = `${exercise.name}\n`;
  result += `${exercise.sets} підходи по ${exercise.reps} `;

  if (exercise.type === 'superset') {
    result = `Суперсет - ` + result;
  } else if (exercise.type === 'dropset') {
    result = `Дропсет - ` + result;
  }

  return result;
}
