# 1. GafferScore

**Live Demo:** [https://www.gafferscore.xyz/](https://www.gafferscore.xyz/)

## 2. Game Mechanics

GafferScore is an English Premier League football prediction game. Players test their football knowledge by predicting the outcomes and exact scorelines of upcoming EPL fixtures. Points are awarded based on the accuracy of these predictions (for example, guessing the correct match result or the precise final score), allowing players to track their performance, climb the global leaderboard, and compete against other fans.

## 3. Tech Stack

- **NextJS**: The core React framework used for building the user interface, handling routing, and server side rendering.
- **Supabase**: The open source backend serving as our PostgreSQL database, handling user authentication, and managing real time data.
- **TypeScript**: Used throughout the codebase to provide static typing, ensuring robust, predictable, and maintainable code.
- **Vercel**: The hosting platform utilized for seamless deployment and delivery of the application.

## 4. Local Setup

To get a local development environment up and running, follow these specific steps:

**Step 1. Clone the repository:**

```bash
git clone https://github.com/Haikeysgit/gafferscore.git
cd gafferscore
```

**Step 2. Install dependencies:**

```bash
npm install
```

**Step 3. Configure environment variables:**
Create a `.env.local` file in the root directory by copying the example file if available or creating a new one. Add the required variables detailed in Section 5.

**Step 4. Start the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 5. Required Environment Variables

To securely connect your local build to your Supabase instance, you must supply the following environment variables in your `.env.local` file. You can find these credentials in your Supabase project dashboard under **Project Settings > API**.

```plaintext
NEXT_PUBLIC_SUPABASE_URL="insert_your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="insert_your_supabase_anon_key"
```
