<!-- 598085d8-26c6-4adc-80fe-37af2b4684f9 9136a50d-1573-4692-9c65-685d7726ca29 -->
# Gym Workout Planner Web App

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Firebase (Firestore for database, Auth for authentication)
- **AI**: OpenAI API for weight suggestions
- **Deployment**: Vercel (free tier)
- **Scraping**: Manual copy/paste for MVP (authenticated scraping is complex and may violate ToS, can be added later if needed)

## Database Schema (Firestore)

### Collections:

1. **users** - user profiles and settings
2. **workout_plans** - weekly workout plans from trainer
3. **workout_history** - completed workouts with actual weights/reps
4. **ai_suggestions** - cached AI suggestions for performance

## Core Features

### 1. Authentication

- Firebase Auth with Google Sign-in
- User profile management

### 2. Workout Plan Management

- Manual input: Paste workout plan text from trainer's website
- Parse Ukrainian text to extract:
  - Day number (День 1, 2, 3)
  - Exercise name
  - Sets (підходи)
  - Reps ()
  - Special notes (Суперсет, Дропсет)
- Store parsed plan in Firestore

### 3. AI Weight Suggestion

- When user inputs new plan, system:

  1. Fetches workout history from Firestore
  2. Sends to OpenAI API with prompt:

     - Previous workout data (exercises, sets, reps, weights)
     - New workout plan structure
     - Request: suggest appropriate weights for each exercise

  1. Display AI suggestions to user
  2. Allow manual adjustment

### 4. Workout Execution & Tracking

- Display current week's workout
- For each exercise:
  - Show AI-suggested weights
  - Input actual weight used per set
  - Input actual reps per set
  - Real-time editing during workout
- Save completed workout to history

### 5. Progress Tracking

- View workout history by exercise
- Charts showing weight progression over time
- Stats: total workouts completed, current vs starting weights

## Project Structure

```
/src
  /components
    /auth - Login, signup components
    /workout - Plan display, exercise cards
    /tracking - History, charts, stats
    /ai - Weight suggestion UI
  /lib
    /firebase - Firebase config and utils
    /openai - OpenAI API integration
    /parsers - Text parsing for Ukrainian workout plans
  /hooks - Custom React hooks
  /pages - Main app pages
  /types - TypeScript types
```

## Key Implementation Details

### Localization

- **Entire app in Ukrainian language**
- All UI labels, buttons, messages in Ukrainian
- OpenAI responses requested in Ukrainian
- Date formatting in Ukrainian style

### Text Parser for Ukrainian Workouts

Create parser to handle formats like:

- "3 підходи по 6-10 " → {sets: 3, reps: "6-10"}
- "Суперсет 2 підходи по 8-12 " → {type: "superset", sets: 2, reps: "8-12"}
- Extract exercise names like "Бруси", "Тяга однієї гантелі під нахилом"

### OpenAI Prompt Engineering

Craft prompt that:

- **Requests response in Ukrainian**
- Includes user's last 4-8 weeks of workout history
- Analyzes exercise-specific weight progression patterns
- Applies progressive overload principles
- Considers safety (max 2.5-5kg increases per week)
- Returns suggestions in same format as input

### Firebase Security Rules

- Users can only read/write their own data
- Validate data structure on write

### Offline Support

- Use Firebase offline persistence
- Allow workout editing even without connection
- Sync when back online

## Deployment

- Connect GitHub repo to Vercel
- Set environment variables for Firebase and OpenAI API keys
- Automatic deployments on push to main branch

### To-dos

- [ ] Initialize React + TypeScript + Vite project with Tailwind CSS and install dependencies (Firebase, OpenAI SDK, shadcn/ui, recharts for charts)
- [ ] Set up Firebase project, configure Firestore database, Authentication (Google provider), and create security rules
- [ ] Build authentication UI and logic - login/signup with Google, protected routes, user context
- [ ] Create Ukrainian text parser to extract exercises, sets, reps from trainer's workout plan format
- [ ] Build workout plan input page - textarea for pasting plan, preview parsed exercises, save to Firestore
- [ ] Implement OpenAI API integration for weight suggestions based on workout history
- [ ] Create UI to display AI weight suggestions when new plan is added, allow manual editing
- [ ] Build workout execution page - display exercises, input actual weights/reps per set, save to history
- [ ] Create progress tracking dashboard with exercise history, weight progression charts, and statistics
- [ ] Configure Vercel deployment, set environment variables, connect GitHub repo, deploy to production