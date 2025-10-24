import OpenAI from "openai";
import { WeeklyPlan, WorkoutHistory, AISuggestion } from "@/types";

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

  const prompt = `Ти - експерт з фітнесу та персональний тренер з багаторічним досвідом. Твоє завдання - проаналізувати історію тренувань користувача та запропонувати оптимальні ваги для нового тижня.

📊 ІСТОРІЯ ТРЕНУВАНЬ (останні 1-2 місяці):
${historyText}

🎯 НОВИЙ ПЛАН ТРЕНУВАНЬ:
${newPlanText}

ЗАВДАННЯ:
Проаналізуй історію тренувань користувача та запропонуй оптимальну вагу для КОЖНОЇ вправи в новому плані.

ПРИНЦИПИ АНАЛІЗУ:
1. **Прогресивне перевантаження**: Якщо користувач стабільно виконує вправу з певною вагою, збільшуй вагу на:
   - Базові вправи (присідання, становая, жим): +2.5-5 кг
   - Допоміжні вправи (жим ногами, тяга): +2.5 кг
   - Ізоляція (розведення, згинання): +1-2.5 кг
   - Вправи з власною вагою/без обтяження: 0 кг

2. **Аналіз тренду**: 
   - Якщо в останніх 3-4 тренуваннях вага росла → продовжуй прогресію
   - Якщо вага стагнувала → зроби невеликий крок вперед
   - Якщо  падає → залиш вагу або трохи зменш

3. **Нові вправи**: 
   - Якщо вправи немає в історії, але є схожа → використай близьку вагу
   - Якщо вправа зовсім нова → запропонуй консервативну вагу (краще менше, ніж більше)

4. **Врахування об'єму**:
   - Більше підходів → менша вага
   - Більше  → менша вага
   - Суперсети/дропсети → менша вага

5. **Безпека**: Краще прогресувати повільно, ніж ризикувати травмою.

ВАЖЛИВО:
- Відповідай ТІЛЬКИ в JSON форматі
- Для кожної вправи запропонуй масив ваг (по одній для кожного підходу)
- Якщо вправа без обтяження (плавання, віджимання від підлоги тощо) → 0 кг для всіх підходів
- Пояснення має бути коротким але інформативним (1-2 речення)

ФОРМАТ ВІДПОВІДІ (JSON):
{
  "suggestions": [
    {
      "exerciseName": "Точна назва вправи з нового плану",
      "suggestedWeights": [вага підходу 1, вага підходу 2, вага підходу 3, ...],
      "reasoning": "Коротке пояснення: чому ця вага, на основі чого (останні показники, прогресія, нова вправа тощо)"
    }
  ]
}

Приклад:
{
  "suggestions": [
    {
      "exerciseName": "Присідання зі штангою",
      "suggestedWeights": [102.5, 102.5, 102.5],
      "reasoning": "Остання вага 100 кг виконана впевнено. Додаємо +2.5 кг для прогресії."
    },
    {
      "exerciseName": "Віджимання від підлоги",
      "suggestedWeights": [0, 0, 0],
      "reasoning": "Вправа з власною вагою, обтяження не потрібне."
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Ти - професійний тренер з фітнесу. Відповідай завжди українською мовою та тільки в JSON форматі.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
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
    console.error("Error generating AI suggestions:", error);
    throw error;
  }

  return suggestions;
}

function formatWorkoutHistory(history: WorkoutHistory[]): string {
  if (history.length === 0) {
    return "Історія тренувань відсутня. Це перший план користувача.";
  }

  // Get workouts from last 2 months
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const recentHistory = history.filter(
    (workout) => workout.date >= twoMonthsAgo
  );

  // Sort by date, most recent first
  const sortedHistory = [...recentHistory].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  if (sortedHistory.length === 0) {
    return "Історія тренувань за останні 2 місяці відсутня. Це перший план користувача за цей період.";
  }

  let formatted = `Всього тренувань за останні 2 місяці: ${sortedHistory.length}\n\n`;

  // Group exercises by name to show progression
  const exerciseHistory: Map<
    string,
    Array<{ date: Date; sets: any[] }>
  > = new Map();

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
  formatted += "📋 ІСТОРІЯ ПО ВПРАВАХ:\n\n";
  exerciseHistory.forEach((records, exerciseName) => {
    formatted += `▸ ${exerciseName}:\n`;
    records.slice(0, 5).forEach((record) => {
      // Last 5 occurrences
      formatted += `  ${record.date.toLocaleDateString("uk-UA")}: `;
      const weights = record.sets
        .map((s) => `${s.weight}кг×${s.reps}`)
        .join(", ");
      formatted += weights + "\n";
    });
    formatted += "\n";
  });

  // Show recent workouts chronologically
  formatted += "\n📅 ОСТАННІ ТРЕНУВАННЯ:\n";
  sortedHistory.slice(0, 10).forEach((workout) => {
    formatted += `\nДата: ${workout.date.toLocaleDateString("uk-UA")} (День ${
      workout.dayNumber
    }):\n`;
    workout.exercises.forEach((ex) => {
      formatted += `  - ${ex.name}: `;
      const sets = ex.sets.map((s) => `${s.weight}кг×${s.reps}`).join(", ");
      formatted += sets + "\n";
    });
  });

  return formatted;
}

function formatNewPlan(plan: WeeklyPlan): string {
  let formatted = `Тиждень: ${plan.weekStartDate.toLocaleDateString(
    "uk-UA"
  )} - ${plan.weekEndDate.toLocaleDateString("uk-UA")}\n\n`;

  plan.days.forEach((day) => {
    formatted += `ДЕНЬ ${day.day}:\n`;
    day.exercises.forEach((ex, idx) => {
      formatted += `${idx + 1}. ${ex.name}\n`;
      formatted += `   ${ex.sets} підходи по ${ex.reps} \n`;
      if (ex.type && ex.type !== "normal") {
        formatted += `   Тип: ${
          ex.type === "superset" ? "Суперсет" : "Дропсет"
        }\n`;
      }
    });
    formatted += "\n";
  });

  return formatted;
}
