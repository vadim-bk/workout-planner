# Налаштування Firebase

## 1. Створіть Firebase проект

1. Перейдіть на [Firebase Console](https://console.firebase.google.com/)
2. Натисніть "Add project" (Додати проект)
3. Введіть назву проекту (наприклад, "gym-workout-planner")
4. Виберіть налаштування за замовчуванням

## 2. Налаштуйте веб-додаток

1. У Firebase Console оберіть ваш проект
2. Натисніть іконку `</>` (Web) щоб додати веб-додаток
3. Введіть назву додатку
4. Скопіюйте конфігурацію Firebase

## 3. Налаштуйте Authentication

1. У боковому меню виберіть "Authentication"
2. Натисніть "Get Started"
3. Увімкніть "Google" провайдер
4. Введіть email підтримки проекту
5. Збережіть

## 4. Налаштуйте Firestore Database

1. У боковому меню виберіть "Firestore Database"
2. Натисніть "Create database"
3. Виберіть "Start in production mode"
4. Виберіть локацію (europe-west)
5. Після створення, перейдіть до вкладки "Rules"
6. Вставте наступні правила:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /workout_plans/{planId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    match /workout_history/{historyId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    match /ai_suggestions/{suggestionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

7. Натисніть "Publish"

## 5. Створіть файл .env

Створіть файл `.env` в корені проекту з наступним вмістом:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENAI_API_KEY=your_openai_api_key
```

Замініть значення на ваші з Firebase Console.

## 6. OpenAI API Key

1. Перейдіть на [OpenAI Platform](https://platform.openai.com/)
2. Створіть аккаунт або увійдіть
3. Перейдіть до API Keys
4. Створіть новий секретний ключ
5. Скопіюйте його та додайте до `.env` файлу

## Готово!

Тепер ви можете запустити додаток:

```bash
npm run dev
```

