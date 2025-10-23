import OpenAI from 'openai';
import { WeeklyPlan, WorkoutHistory, AISuggestion } from '@/types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
});

export async function generateWeightSuggestions(
  newPlan: WeeklyPlan,
  workoutHistory: WorkoutHistory[]
): Promise<Map<string, AISuggestion>> {
  const suggestions = new Map<string, AISuggestion>();
  
  // Format workout history for the prompt
  const historyText = formatWorkoutHistory(workoutHistory);
  const newPlanText = formatNewPlan(newPlan);
  
  const prompt = `Ти - експерт з фітнесу та планування тренувань. 

ПОПЕРЕДНІ ТРЕНУВАННЯ:
${historyText}

НОВИЙ ПЛАН ТРЕНУВАНЬ:
${newPlanText}

ЗАВДАННЯ:
На основі історії тренувань користувача, запропонуй оптимальну вагу для кожної вправи в новому плані.

ПРАВИЛА:
1. Використовуй принцип прогресивного перевантаження
2. Збільшуй вагу поступово (максимум 2.5-5 кг за тиждень для базових вправ, 1-2.5 кг для ізоляції)
3. Якщо вправа нова (не було в історії), запропонуй консервативну вагу
4. Враховуй кількість підходів і повторень
5. Відповідай ТІЛЬКИ в JSON форматі

ФОРМАТ ВІДПОВІДІ (JSON):
{
  "suggestions": [
    {
      "exerciseName": "Назва вправи",
      "suggestedWeights": [вага для підходу 1, вага для підходу 2, ...],
      "reasoning": "Коротке пояснення українською"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Ти - професійний тренер з фітнесу. Відповідай завжди українською мовою та тільки в JSON форматі.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);
    
    // Convert to Map of AISuggestions
    if (result.suggestions && Array.isArray(result.suggestions)) {
      result.suggestions.forEach((suggestion: any) => {
        const aiSuggestion: AISuggestion = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: newPlan.userId,
          weekPlanId: newPlan.id,
          exerciseName: suggestion.exerciseName,
          suggestedWeights: suggestion.suggestedWeights || [],
          reasoning: suggestion.reasoning,
          createdAt: new Date(),
        };
        
        suggestions.set(suggestion.exerciseName, aiSuggestion);
      });
    }
    
  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    throw error;
  }
  
  return suggestions;
}

function formatWorkoutHistory(history: WorkoutHistory[]): string {
  if (history.length === 0) {
    return 'Історія тренувань відсутня.';
  }
  
  // Sort by date, most recent first
  const sortedHistory = [...history].sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  ).slice(0, 20); // Last 20 workouts
  
  let formatted = '';
  sortedHistory.forEach(workout => {
    formatted += `\nДата: ${workout.date.toLocaleDateString('uk-UA')}\n`;
    formatted += `День ${workout.dayNumber}:\n`;
    
    workout.exercises.forEach(ex => {
      formatted += `  - ${ex.name}:\n`;
      ex.sets.forEach(set => {
        formatted += `    Підхід ${set.setNumber}: ${set.weight} кг × ${set.reps} повторень\n`;
      });
    });
  });
  
  return formatted;
}

function formatNewPlan(plan: WeeklyPlan): string {
  let formatted = `Тиждень: ${plan.weekStartDate.toLocaleDateString('uk-UA')} - ${plan.weekEndDate.toLocaleDateString('uk-UA')}\n\n`;
  
  plan.days.forEach(day => {
    formatted += `ДЕНЬ ${day.day}:\n`;
    day.exercises.forEach((ex, idx) => {
      formatted += `${idx + 1}. ${ex.name}\n`;
      formatted += `   ${ex.sets} підходи по ${ex.reps} повторень\n`;
      if (ex.type && ex.type !== 'normal') {
        formatted += `   Тип: ${ex.type === 'superset' ? 'Суперсет' : 'Дропсет'}\n`;
      }
    });
    formatted += '\n';
  });
  
  return formatted;
}

