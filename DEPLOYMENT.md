# Деплой на Vercel

## Крок 1: Підготовка репозиторію

1. Ініціалізуйте Git репозиторій (якщо ще не зроблено):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Створіть репозиторій на GitHub:
   - Перейдіть на [GitHub](https://github.com/new)
   - Створіть новий репозиторій (наприклад, "gym-workout-planner")
   - НЕ додавайте README, .gitignore чи LICENSE (вони вже є)

3. Підключіть локальний репозиторій до GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/gym-workout-planner.git
git branch -M main
git push -u origin main
```

## Крок 2: Деплой на Vercel

### Варіант А: Через Vercel Dashboard (Рекомендовано)

1. Перейдіть на [Vercel](https://vercel.com/)
2. Увійдіть через GitHub
3. Натисніть "Add New..." → "Project"
4. Імпортуйте ваш GitHub репозиторій "gym-workout-planner"
5. Налаштування будуть визначені автоматично (Vite)
6. Додайте Environment Variables (змінні середовища):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_OPENAI_API_KEY`
7. Натисніть "Deploy"

### Варіант Б: Через Vercel CLI

1. Встановіть Vercel CLI:
```bash
npm install -g vercel
```

2. Увійдіть:
```bash
vercel login
```

3. Деплой:
```bash
vercel
```

4. Додайте змінні середовища:
```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_OPENAI_API_KEY
```

5. Задеплойте на production:
```bash
vercel --prod
```

## Крок 3: Налаштуйте Firebase для вашого домену

1. У Firebase Console → Authentication → Settings
2. У розділі "Authorized domains" додайте ваш Vercel домен
   - Наприклад: `your-app.vercel.app`

## Автоматичні деплої

Після налаштування, кожен push до GitHub автоматично задеплоїть оновлення на Vercel!

## Перевірка

Відкрийте ваш Vercel URL та перевірте:
- ✅ Чи працює вхід через Google
- ✅ Чи можна додати план
- ✅ Чи генеруються AI підказки
- ✅ Чи зберігається історія тренувань

