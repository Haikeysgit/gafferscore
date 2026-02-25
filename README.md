# 1. GafferScore

**Live Demo:** [https://www.gafferscore.xyz/](https://www.gafferscore.xyz/)

## 2. Game Mechanics

GafferScore is an English Premier League football prediction game. Players test their football knowledge by predicting the outcomes and exact scorelines of upcoming EPL fixtures. Points are awarded based on the accuracy of these predictions (e.g., guessing the correct match result or the precise final score), allowing players to track their performance, climb the global leaderboard, and compete against other fans.

## 3. Tech Stack

- **NextJS**: The core React framework used for building the user interface, handling routing, and server-side rendering.
- **Supabase**: The open-source backend serving as our PostgreSQL database, handling user authentication, and managing real-time data.
- **TypeScript**: Used throughout the codebase to provide static typing, ensuring robust, predictable, and maintainable code.
- **Vercel**: The hosting platform utilized for seamless deployment and delivery of the application.

## 4. Local Setup

To get a local development environment up and running, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/gafferscore.git
   cd gafferscore
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *(Note: You can also use `yarn` or `pnpm` if preferred).*

3. **Configure environment variables:**
   Create a `.env.local` file in the root directory by copying the example file (if available) or creating a new one. Add the required variables detailed in Section 5.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 5. Required Environment Variables

To securely connect your local build to your Supabase instance, you must supply the following environment variables in your `.env.local` file. You can find these credentials in your Supabase project dashboard under **Project Settings > API**.

```env
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```
