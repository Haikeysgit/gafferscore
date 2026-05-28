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

Create `.env.local` from the included example file:

```bash
cp .env.example .env.local
```

At minimum, local Supabase-backed development needs:

```plaintext
NEXT_PUBLIC_SUPABASE_URL="insert_your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="insert_your_supabase_anon_key"
```

The app also references server-side keys for admin syncs, email, football data, and the AI Gaffer chat. Keep these private and never expose service-role/API keys in client components:

```plaintext
SUPABASE_SERVICE_ROLE_KEY="insert_your_supabase_service_role_key"
SYNC_SECRET="insert_a_long_random_secret"
FOOTBALL_DATA_API_KEY="insert_your_football_data_api_key"
GROQ_API_KEY="insert_your_groq_api_key"
RESEND_API_KEY="insert_your_resend_api_key"
NEXT_PUBLIC_SITE_URL="https://www.gafferscore.xyz"
JWT_SECRET="insert_a_long_random_secret_if_required"
```

## 6. Vanta Notes

A tiny love letter and lightweight code audit were added under `docs/`:

- [`docs/VANTA_LOVE_LETTER.md`](docs/VANTA_LOVE_LETTER.md)
- [`docs/VANTA_CODE_AUDIT.md`](docs/VANTA_CODE_AUDIT.md)
