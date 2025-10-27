# Prysm - Football Prediction Platform

A point-based football prediction platform built with Nuxt 3, Supabase, and TypeScript.

## Features

- **User Authentication**: Email/password and magic link authentication
- **Point-Based Betting**: Bet points (not money) on football match predictions
- **Room System**: Create public or private prediction rooms
- **Smart Scoring**: Points awarded based on prediction accuracy:
  - Exact score: 100 points × bet multiplier
  - Correct goal difference: 50 points × bet multiplier
  - Correct winner: 30 points × bet multiplier
  - Wrong prediction: Lose all bet points
- **Leaderboards**: Global and room-specific rankings
- **Friends System**: Connect with other players (coming soon)
- **History**: Track your past predictions and performance

## Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: TailwindCSS via @nuxt/ui
- **Deployment**: Ready for Vercel, Netlify, or similar

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Prysm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Copy `.env.example` to `.env`
4. Fill in your Supabase credentials in `.env`

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
FOOTBALL_API_KEY=your_api_key
```

### 4. Run Database Migration

In your Supabase dashboard:
1. Go to SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Execute the migration

Or use the Supabase CLI:

```bash
supabase db push
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   └── app.vue              # Root component
├── pages/
│   ├── index.vue            # Home dashboard
│   ├── login.vue            # Login page
│   ├── register.vue         # Registration page
│   ├── profile.vue          # User profile
│   ├── rooms/
│   │   ├── index.vue        # Rooms listing
│   │   ├── create.vue       # Create room
│   │   └── [id].vue         # Room detail
│   ├── friends.vue          # Friends page
│   └── leaderboard.vue      # Global leaderboard
├── layouts/
│   └── default.vue          # Main layout with navigation
├── composables/
│   ├── useAuth.ts           # Authentication logic
│   ├── useSupabase.ts       # Supabase client
│   ├── useRooms.ts          # Room operations
│   ├── useScoring.ts        # Points calculation
│   └── useFriends.ts        # Friends management
├── middleware/
│   └── auth.ts              # Route protection
├── plugins/
│   └── supabase.client.ts   # Supabase plugin
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # Database schema
```

## Database Schema

### Core Tables

- **users**: User profiles with point balances
- **rooms**: Prediction rooms (public/private)
- **room_participants**: User predictions and results
- **friendships**: Friend connections
- **room_invites**: Private room invitations

## Scoring System

The scoring system rewards both accuracy and risk:

- **Exact Score Match** (e.g., predicted 2-1, result 2-1)
  - Points: 100 × bet amount
  
- **Correct Goal Difference** (e.g., predicted 2-0, result 3-1)
  - Points: 50 × bet amount
  
- **Correct Winner** (e.g., predicted 2-1, result 3-2 or 1-0)
  - Points: 30 × bet amount
  
- **Wrong Prediction**
  - Points lost: Entire bet amount

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel settings
4. Deploy

### Netlify

1. Push your code to GitHub
2. Import the project in Netlify
3. Add environment variables in Netlify settings
4. Deploy

## Environment Variables

Required variables in production:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/public key
- `FOOTBALL_API_KEY`: (Optional) For team search integration

## Security

- Row Level Security (RLS) enabled on all tables
- User authentication required for protected routes
- Points can only be modified through authorized functions
- Room creators can only submit results for their own rooms

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
