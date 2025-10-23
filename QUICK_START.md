# 🚀 Швидкий старт

## Крок 1: Налаштування Firebase (5 хвилин)

1. Відкрийте [Firebase Console](https://console.firebase.google.com/)
2. Натисніть "Add project"
3. Назвіть проект "gym-workout-planner"
4. Увімкніть Google Analytics (опціонально)
5. Створіть проект

### Додайте веб-додаток:
1. На головній Firebase → іконка `</>` (Web)
2. Назвіть додаток "Gym Planner Web"
3. **СКОПІЮЙТЕ** конфігурацію (знадобиться для .env)

### Увімкніть Authentication:
1. Sidebar → Authentication → Get Started
2. Sign-in method → Google → Enable
3. Введіть email підтримки → Save

### Створіть Firestore:
1. Sidebar → Firestore Database → Create database
2. Production mode → Next
3. Локація: europe-west → Enable
4. Rules → вставте правила з `FIREBASE_SETUP.md` → Publish

## Крок 2: Налаштування OpenAI (3 хвилини)

1. Відкрийте [OpenAI Platform](https://platform.openai.com/api-keys)
2. Увійдіть / створіть акаунт
3. API Keys → Create new secret key
4. **СКОПІЮЙТЕ** ключ (показується лише раз!)

## Крок 3: Створіть .env файл (1 хвилина)

Створіть файл `.env` в корені проекту:

```bash
# Вставте значення з Firebase
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

# Вставте ваш OpenAI ключ
VITE_OPENAI_API_KEY=sk-proj-...
```

## Крок 4: Запуск (1 хвилина)

```bash
npm run dev
```

Відкрийте браузер на `http://localhost:5173`

## Крок 5: Перший запуск ✅

1. Увійдіть через Google
2. Натисніть "Додати новий план"
3. Вставте текст плану від тренера
4. Отримайте AI підказки
5. Почніть тренуватися!

## Деплой на Vercel (10 хвилин)

Детальні інструкції в `DEPLOYMENT.md`

Коротко:
1. Push код на GitHub
2. Підключіть репозиторій до Vercel
3. Додайте змінні з .env в Vercel
4. Deploy!

---

**Потрібна допомога?** Дивіться детальні інструкції:
- Firebase: `FIREBASE_SETUP.md`
- Використання: `USAGE_GUIDE.md`
- Деплой: `DEPLOYMENT.md`

