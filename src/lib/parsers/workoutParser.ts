import { Exercise, DayWorkout } from '@/types';

export function parseWorkoutPlan(text: string): DayWorkout[] {
  const days: DayWorkout[] = [];
  
  // Clean up text - remove extra whitespace and normalize
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Split by "День" (Day) to get each day's workout
  const dayRegex = /День\s+(\d+)/gi;
  const dayMatches = [...cleanText.matchAll(dayRegex)];
  
  if (dayMatches.length === 0) {
    return days;
  }
  
  dayMatches.forEach((match, index) => {
    const dayNumber = parseInt(match[1]);
    const startIndex = match.index!;
    const endIndex = index < dayMatches.length - 1 
      ? dayMatches[index + 1].index! 
      : cleanText.length;
    
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
  
  // Split by numbered lines (1. 2. 3. etc.)
  const lines = dayText.split('\n');
  let currentExercise: { name: string; details: string } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this is an exercise line (starts with number and dot)
    const exerciseMatch = line.match(/^(\d+)\.\s+(.+)/);
    
    if (exerciseMatch) {
      // Save previous exercise if exists
      if (currentExercise) {
        exercises.push(parseExercise(currentExercise.name, currentExercise.details));
      }
      
      // Start new exercise
      currentExercise = {
        name: exerciseMatch[2].trim(),
        details: '',
      };
    } else if (currentExercise && line) {
      // This is a details line for current exercise
      currentExercise.details += (currentExercise.details ? ' ' : '') + line;
    }
  }
  
  // Don't forget the last exercise
  if (currentExercise) {
    exercises.push(parseExercise(currentExercise.name, currentExercise.details));
  }
  
  return exercises;
}

function parseExercise(name: string, details: string): Exercise {
  // Check for Superset/Dropset
  const isSuperset = /суперсет/i.test(details);
  const isDropset = /дропсет/i.test(details);
  
  // Extract sets: "3 підходи" or "За потреби беріть додаткову вагу 3 підходів"
  const setsMatch = details.match(/(\d+)\s*підход/i);
  const sets = setsMatch ? parseInt(setsMatch[1]) : 3;
  
  // Extract reps: "по 5-8 повторень" or "6-10 повторень"
  const repsMatch = details.match(/(?:по\s+)?([\d-]+)\s*повторень/i);
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
  result += `${exercise.sets} підходи по ${exercise.reps} повторень`;
  
  if (exercise.type === 'superset') {
    result = `Суперсет - ` + result;
  } else if (exercise.type === 'dropset') {
    result = `Дропсет - ` + result;
  }
  
  return result;
}

