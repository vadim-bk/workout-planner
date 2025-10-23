# Планувальник Тренувань

Веб-додаток для керування тижневими планами тренувань та відстеження прогресу з AI-підказками для ваги.

## Налаштування

1. Встановіть залежності:
```bash
npm install
```

2. Створіть файл `.env` з наступними змінними:
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENAI_API_KEY=your_openai_api_key
```

3. Запустіть додаток:
```bash
npm run dev
```

## Деплой на Vercel

1. Підключіть GitHub репозиторій до Vercel
2. Додайте змінні середовища в налаштуваннях Vercel
3. Деплой відбувається автоматично при push до main

## Функціонал

- 📝 Вставка планів тренувань від тренера
- 🤖 AI підказки ваги на основі історії
- 📊 Відстеження прогресу та графіки
- 💪 Редагування під час тренування
- 🔥 Синхронізація між пристроями

