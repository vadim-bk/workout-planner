# 🎯 ЩО РОБИТИ ЗАРАЗ

## ⚡ Швидкий старт (30 хвилин)

### Крок 1: Налаштування Firebase (10 хвилин)

1. **Перейдіть на Firebase Console:**
   👉 https://console.firebase.google.com/

2. **Створіть проект:**
   - Натисніть "Add project"
   - Назва: `gym-workout-planner`
   - Google Analytics: можна вимкнути
   - Створити проект

3. **Додайте Web App:**
   - На головній сторінці проекту → іконка `</>`
   - Nickname: `Gym Planner`
   - ✅ Реєстрація
   - **ЗБЕРЕЖІТЬ** конфігурацію (знадобиться для .env!)

4. **Увімкніть Google Authentication:**
   - Sidebar → Authentication → Get Started
   - Sign-in method → Google → Enable
   - Project support email → ваш email → Save

5. **Створіть Firestore Database:**
   - Sidebar → Firestore Database → Create database
   - Production mode → Next
   - Location: europe-west3 → Enable

6. **Налаштуйте Rules:**
   - Вкладка Rules
   - Скопіюйте з файлу `firestore.rules`
   - Publish

### Крок 2: OpenAI API Key (5 хвилин)

1. **Перейдіть на OpenAI:**
   👉 https://platform.openai.com/api-keys

2. **Створіть ключ:**
   - Create new secret key
   - Назва: `Gym Planner`
   - **ЗБЕРЕЖІТЬ** ключ (показується раз!)

3. **Поповніть баланс (опціонально):**
   - Якщо є $5 безкоштовних - пропустіть
   - Інакше: Settings → Billing → Add $5

### Крок 3: Створіть .env файл (2 хвилини)

Створіть файл `.env` в корені проекту:

```bash
# З Firebase Console → Project Settings → Your apps → Config
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=gym-workout-planner-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gym-workout-planner-xxx
VITE_FIREBASE_STORAGE_BUCKET=gym-workout-planner-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc123

# З OpenAI Platform → API Keys
VITE_OPENAI_API_KEY=sk-proj-...
```

**💡 Порада:** Скопіюйте з `ENV_TEMPLATE.md` та заповніть значення

### Крок 4: Запуск! (1 хвилина)

```bash
npm run dev
```

Відкрийте: http://localhost:5173

### Крок 5: Тест (10 хвилин)

1. ✅ Увійдіть через Google
2. ✅ Скопіюйте текст з `SAMPLE_PLAN.txt`
3. ✅ "Новий план" → вставте текст
4. ✅ Дати: сьогоднішній понеділок - неділя
5. ✅ "Переглянути план" → перевірте
6. ✅ "Зберегти та отримати AI підказки" → зачекайте 10-20 сек
7. ✅ Головна → День 1 → введіть ваги
8. ✅ "Зберегти тренування"
9. ✅ "Історія" → оберіть вправу → графік

## 🎉 Працює? Вітаю!

Тепер можете:

### Сьогодні:
- 📋 Додати реальний план від тренера
- 💪 Виконати тренування
- 📊 Побачити AI підказки

### Цього тижня:
- 🚀 Задеплоїти на Vercel (безкоштовно)
- 📱 Додати на домашній екран телефону
- 🏋️ Тренуватися з телефону в залі

### Цього місяця:
- 📈 Накопичити історію
- 🤖 Побачити як AI адаптується
- 💪 Побачити реальний прогрес

## ❓ Проблеми?

### "Cannot find module" або схожі помилки
```bash
# Перевстановіть залежності
rm -rf node_modules package-lock.json
npm install
```

### Firebase помилки при вході
1. Перевірте чи увімкнено Google Auth в Firebase Console
2. Перевірте чи правильний файл .env
3. Перезапустіть dev server (Ctrl+C, npm run dev)

### OpenAI помилки
1. Перевірте чи правильний API key
2. Перевірте чи є кредити на акаунті
3. Подивіться консоль браузера (F12) для деталей

### Парсер не розпізнає план
1. Перевірте формат тексту
2. Має бути "День 1", "День 2" і т.д.
3. Кожна вправа: "1. Назва" з нового рядка
4. Підходи/повторення на наступному рядку

## 📞 Ресурси

- 📖 [Детальна документація](./GETTING_STARTED.md)
- 🔧 [Firebase Setup](./FIREBASE_SETUP.md)
- 🚀 [Deployment Guide](./DEPLOYMENT.md)
- ❓ [Troubleshooting](./GETTING_STARTED.md#troubleshooting)

## 🎁 Бонус: Швидкі команди

```bash
# Розробка
npm run dev                    # Запуск dev сервера

# Продакшн
npm run build                  # Збірка
npm run preview                # Перегляд збірки

# Git
git status                     # Статус змін
git log --oneline              # Історія комітів

# Vercel (після встановлення vercel CLI)
vercel                         # Deploy to preview
vercel --prod                  # Deploy to production
```

---

## 🚀 Готові почати?

1. ✅ Створіть Firebase проект → 10 хв
2. ✅ Отримайте OpenAI key → 5 хв
3. ✅ Створіть .env → 2 хв
4. ✅ Запустіть `npm run dev` → 1 хв
5. ✅ Протестуйте з SAMPLE_PLAN.txt → 10 хв

**Загалом: 30 хвилин до готового додатку!**

Успіхів! 💪🚀

