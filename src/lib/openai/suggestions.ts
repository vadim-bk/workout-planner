import OpenAI from 'openai';
import type { WeeklyPlan, WorkoutHistory, AISuggestion } from '@/types';

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

  const prompt = `Ти - професійний тренер з фітнесу з 15-річним досвідом. Твоє завдання - проаналізувати історію тренувань користувача та запропонувати оптимальні ваги та повторення для нового тижня.

📊 ІСТОРІЯ ТРЕНУВАНЬ (останні 1-2 місяці):
${historyText}

🎯 НОВИЙ ПЛАН ТРЕНУВАНЬ:
${newPlanText}

КРИТИЧНО ВАЖЛИВІ ПРИНЦИПИ:

1. **ПРАВИЛЬНІ ПОВТОРЕННЯ**: 
   - Завжди використовуй прогресивне зменшення повторень:
     * 2 підходи: 15, 12
     * 3 підходи: 15, 12, 10
     * 4+ підходів: 15, 12, 10, 10
   - НІКОЛИ не використовуй однакові повторення для всіх підходів!

2. **ПРОГРЕСИВНЕ НАВАНТАЖЕННЯ**:
   - Кожен підхід має РІЗНУ вагу: збільшуй вагу з кожним підходом
   - Приклад: 15 кг × 15, 17.5 кг × 12, 20 кг × 10
   - НІКОЛИ не став однакову вагу для всіх підходів!

3. **АНАЛІЗ ІСТОРІЇ**:
   - Знайди останню вагу для кожної вправи
   - Збільши її на 2.5-5 кг для першого підходу
   - Додавай ще 2.5 кг для кожного наступного підходу

4. **СХОЖІ ВПРАВИ** (якщо точної вправи немає):
   - "Тяга однієї гантелі під нахилом" ≈ "Тяга гантелі в нахилі" 
   - "Розгинання ніг у тренажері" ≈ "Розгинання ніг сидячи у тренажері"
   - "Згинання рук з гантелями" ≈ "Молотки" або "Згинання рук зі штангою"
   - "Відведення однією рукою" ≈ "Махи гантелями в сторони"
   - "Розгинання на трицепс" ≈ "Французький жим" або "Жим лежачи вузьким хватом"

5. **ВПРАВИ З ВЛАСНОЮ ВАГОЮ**:
   - Бруси, підтягування, віджимання = 0 кг для всіх підходів
   - Але повторення все одно: 15, 12, 10

6. **СУПЕРСЕТИ/ДРОПСЕТИ**:
   - Зменши вагу на 10-15% порівняно з звичайними вправами
   - Повторення: 15, 12, 10

ПРИКЛАД ПРАВИЛЬНОГО РЕЗУЛЬТАТУ:
- Тяга однієї гантелі під нахилом (3 підходи): [15, 17.5, 20] кг, [15, 12, 10] повторень
- Розгинання ніг у тренажері (3 підходи): [27, 32, 34] кг, [15, 12, 10] повторень
- Згинання рук з гантелями (2 підходи): [8, 9] кг, [15, 12] повторень
- Бруси (3 підходи): [0, 0, 0] кг, [15, 12, 10] повторень (вправа з власною вагою)

ВАЖЛИВО:
- Відповідай ТІЛЬКИ в JSON форматі
- ВСІ ваги та повторення мають бути різними для кожного підходу
- Пояснення має бути коротким але інформативним

ФОРМАТ ВІДПОВІДІ (JSON):
{
  "suggestions": [
    {
      "exerciseName": "Точна назва вправи з нового плану",
      "suggestedWeights": [вага_підходу_1, вага_підходу_2, вага_підходу_3],
      "suggestedReps": [15, 12, 10],
      "reasoning": "Коротке пояснення на основі історії або схожих вправ"
    }
  ]
}

ВАЖЛИВО: Кількість елементів у suggestedWeights та suggestedReps має точно відповідати кількості підходів у плані!`;

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

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Convert to Map of AISuggestions
    if (result.suggestions && Array.isArray(result.suggestions)) {
      result.suggestions.forEach((suggestion: any) => {
        // Validate suggestion data
        if (suggestion.exerciseName && suggestion.suggestedWeights && suggestion.suggestedReps) {
          const aiSuggestion: AISuggestion = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: newPlan.userId,
            weekPlanId: newPlan.id,
            exerciseName: suggestion.exerciseName,
            suggestedWeights: suggestion.suggestedWeights || [],
            suggestedReps: suggestion.suggestedReps || [],
            reasoning: suggestion.reasoning || 'AI підказка на основі аналізу історії тренувань',
            createdAt: new Date(),
          };

          suggestions.set(suggestion.exerciseName, aiSuggestion);
        }
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
    return 'Історія тренувань відсутня. Це перший план користувача.';
  }

  // Get workouts from last 2 months
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const recentHistory = history.filter((workout) => workout.date >= twoMonthsAgo);

  // Sort by date, most recent first
  const sortedHistory = [...recentHistory].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (sortedHistory.length === 0) {
    return 'Історія тренувань за останні 2 місяці відсутня. Це перший план користувача за цей період.';
  }

  let formatted = `Всього тренувань за останні 2 місяці: ${sortedHistory.length}\n\n`;

  // Group exercises by name to show progression
  const exerciseHistory: Map<string, Array<{ date: Date; sets: any[] }>> = new Map();

  sortedHistory.forEach((workout) => {
    workout.exercises.forEach((ex) => {
      if (!exerciseHistory.has(ex.name)) {
        exerciseHistory.set(ex.name, []);
      }
      exerciseHistory.get(ex.name)!.push({
        date: workout.date,
        sets: ex.sets,
      });
    });
  });

  // Show detailed history per exercise
  formatted += '📋 ІСТОРІЯ ПО ВПРАВАХ (останні 5 тренувань):\n\n';
  exerciseHistory.forEach((records, exerciseName) => {
    formatted += `▸ ${exerciseName}:\n`;
    records.slice(0, 5).forEach((record, idx) => {
      // Last 5 occurrences
      const isLatest = idx === 0 ? ' (ОСТАННЄ)' : '';
      formatted += `  ${record.date.toLocaleDateString('uk-UA')}${isLatest}: `;
      const weights = record.sets.map((s) => `${s.weight}кг×${s.reps}`).join(', ');
      formatted += weights + '\n';
    });

    // Add progression analysis
    if (records.length > 1) {
      const latest = records[0];
      const previous = records[1];
      const latestMaxWeight = Math.max(...latest.sets.map((s) => s.weight));
      const previousMaxWeight = Math.max(...previous.sets.map((s) => s.weight));

      if (latestMaxWeight > previousMaxWeight) {
        formatted += `  📈 ПРОГРЕСІЯ: +${(latestMaxWeight - previousMaxWeight).toFixed(1)}кг за останнім тренуванням\n`;
      } else if (latestMaxWeight === previousMaxWeight) {
        formatted += `  📊 СТАБІЛЬНО: та сама максимальна вага\n`;
      } else {
        formatted += `  📉 ЗМЕНШЕННЯ: -${(previousMaxWeight - latestMaxWeight).toFixed(1)}кг за останнім тренуванням\n`;
      }
    }
    formatted += '\n';
  });

  // Show recent workouts chronologically
  formatted += '\n📅 ОСТАННІ ТРЕНУВАННЯ:\n';
  sortedHistory.slice(0, 10).forEach((workout) => {
    formatted += `\nДата: ${workout.date.toLocaleDateString('uk-UA')} (День ${workout.dayNumber}):\n`;
    workout.exercises.forEach((ex) => {
      formatted += `  - ${ex.name}: `;
      const sets = ex.sets.map((s) => `${s.weight}кг×${s.reps}`).join(', ');
      formatted += sets + '\n';
    });
  });

  return formatted;
}

function formatNewPlan(plan: WeeklyPlan): string {
  let formatted = `Тиждень: ${plan.weekStartDate.toLocaleDateString(
    'uk-UA'
  )} - ${plan.weekEndDate.toLocaleDateString('uk-UA')}\n\n`;

  plan.days.forEach((day) => {
    formatted += `ДЕНЬ ${day.day}:\n`;
    day.exercises.forEach((ex, idx) => {
      formatted += `${idx + 1}. ${ex.name}\n`;
      formatted += `   ${ex.sets} підходи по ${ex.reps} повторень\n`;
      if (ex.type && ex.type !== 'normal') {
        formatted += `   Тип: ${ex.type === 'superset' ? 'Суперсет' : 'Дропсет'}\n`;
      }
      formatted += `   Потрібно запропонувати ${ex.sets} різних ваг та повторень для кожного підходу\n`;
    });
    formatted += '\n';
  });

  return formatted;
}
