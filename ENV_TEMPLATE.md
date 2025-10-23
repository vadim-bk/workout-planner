# Створіть файл .env з наступними змінними

Скопіюйте це та збережіть як `.env` в корені проекту:

```
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENAI_API_KEY=sk-...your_openai_key
```

## Де знайти ці значення:

### Firebase:
1. Перейдіть в [Firebase Console](https://console.firebase.google.com/)
2. Виберіть ваш проект
3. Перейдіть в Project Settings (іконка шестерінки)
4. Прокрутіть до розділу "Your apps"
5. Скопіюйте значення з `firebaseConfig`

### OpenAI:
1. Перейдіть на [OpenAI Platform](https://platform.openai.com/api-keys)
2. Створіть новий API key
3. Скопіюйте ключ (він починається з `sk-`)

**ВАЖЛИВО:** Ніколи не комітьте `.env` файл в git!

