import { Exercise, DayWorkout } from '@/types';

export function parseWorkoutPlan(text: string): DayWorkout[] {
  const days: DayWorkout[] = [];
  
  // Split by "День" (Day) to get each day's workout
  const dayRegex = /День\s+(\d+)/gi;
  const dayMatches = [...text.matchAll(dayRegex)];
  
  if (dayMatches.length === 0) {
    return days;
  }
  
  dayMatches.forEach((match, index) => {
    const dayNumber = parseInt(match[1]);
    const startIndex = match.index!;
    const endIndex = index < dayMatches.length - 1 
      ? dayMatches[index + 1].index! 
      : text.length;
    
    const dayText = text.substring(startIndex, endIndex);
    const exercises = parseExercises(dayText);
    
    days.push({
      day: dayNumber,
      exercises,
    });
  });
  
  return days;
}

function parseExercises(dayText: string): Exercise[] {
  const exercises: Exercise[] = [];
  
  // Regex to match exercise patterns like:
  // "1. Бруси"
  // "За потреби беріть додаткову вагу 3 підходів по 5-8 повторень"
  const exerciseRegex = /(\d+)\.\s+([^\n]+)\n([^\n]*підход[^\n]*повторень[^\n]*)/gi;
  const matches = [...dayText.matchAll(exerciseRegex)];
  
  matches.forEach(match => {
    const name = match[2].trim();
    const detailsLine = match[3];
    
    // Check for Superset/Dropset
    const isSuperset = /суперсет/i.test(detailsLine);
    const isDropset = /дропсет/i.test(detailsLine);
    
    // Extract sets: "3 підходи" or "За потреби беріть додаткову вагу 3 підходів"
    const setsMatch = detailsLine.match(/(\d+)\s*підход/i);
    const sets = setsMatch ? parseInt(setsMatch[1]) : 3;
    
    // Extract reps: "по 5-8 повторень" or "по 6-10 повторень"
    const repsMatch = detailsLine.match(/по\s+([\d-]+)\s*повторень/i);
    const reps = repsMatch ? repsMatch[1] : '8-12';
    
    exercises.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      sets,
      reps,
      type: isSuperset ? 'superset' : isDropset ? 'dropset' : 'normal',
      notes: detailsLine,
    });
  });
  
  return exercises;
}

export function formatExerciseForDisplay(exercise: Exercise): string {
  let result = `${exercise.name}\n`;
  result += `${exercise.sets} підходи по ${exercise.reps} повторень`;
  
  if (exercise.type === 'superset') {
    result = `Суперсет - ` + result;
  } else if (exercise.type === 'dropset') {
    result = `Дропсет - ` + result;
  }
  
  return result;
}

