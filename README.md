# Rally Interface

Frontend for **Rally** — a mobile-first web app that helps friend groups go from "what should we do?" to a concrete plan in under two minutes. Create a rally, share a hex code, vote on preferences (budget, vibe, distance), and get AI-powered venue recommendations.

## Tech Stack

| Category           | Technology                                     |
| ------------------ | ---------------------------------------------- |
| Framework          | React 19 + TypeScript                          |
| Build Tool         | Vite 7                                         |
| Styling            | Tailwind CSS 4 + shadcn/ui                     |
| Routing            | React Router DOM 7                             |
| Data Fetching      | TanStack React Query 5                         |
| Animations         | Framer Motion                                  |
| Maps               | Leaflet + react-leaflet                        |
| Icons              | lucide-react                                   |
| Fonts              | Space Grotesk, Inter, Geist, Caveat, DM Serif Display |
| Unit Testing       | Vitest + Testing Library                       |
| E2E Testing        | Playwright                                     |

## Prerequisites

- **Node.js** >= 18 (v20 recommended)
- **rally-reactor** backend running on `localhost:3000` (for API calls)

## Getting Started

```bash
# Install dependencies
npm install

# Copy the env template
cp .env.example .env

# Start the dev server
npm run dev
```

The app runs at `http://localhost:5173`. In development, Vite proxies all `/rally-api` requests to `http://localhost:3000` (the backend).

## Environment Variables

| Variable         | Default       | Description                                                                 |
| ---------------- | ------------- | --------------------------------------------------------------------------- |
| `VITE_API_BASE`  | `/rally-api`  | API base path. Proxied to `localhost:3000` in dev. Set to the full backend URL in production. |

## Scripts

| Command                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `npm run dev`            | Start Vite dev server with hot reload          |
| `npm run build`          | Type-check and build for production            |
| `npm run preview`        | Serve the production build locally             |
| `npm run lint`           | Run ESLint                                     |
| `npm test`               | Run unit tests (single run)                    |
| `npm run test:watch`     | Run unit tests in watch mode                   |
| `npm run test:e2e`       | Run Playwright E2E tests (headless)            |
| `npm run test:e2e:headed`| Run Playwright E2E tests with visible browser  |

## Project Structure

```
src/
├── main.tsx                   # App entry — providers (QueryClient, Router, Auth, Toast)
├── App.tsx                    # Route definitions + auth guards
├── api.ts                     # API client — all backend calls, JWT handling, 401 redirect
├── types.ts                   # Shared TypeScript types
├── index.css                  # Global styles, CSS variables, design tokens
├── contexts/
│   └── AuthContext.tsx         # Auth state (login/logout, localStorage persistence)
├── pages/
│   ├── Home.tsx               # Landing page (scroll-snap hero + how-it-works)
│   ├── Login.tsx              # Phone OTP login flow
│   ├── Dashboard.tsx          # User's rallies, drafts, join by code
│   ├── CreateRallyWizard.tsx  # 4-step creation wizard with draft auto-save
│   ├── EditRally.tsx          # Edit rally details
│   ├── JoinRally.tsx          # Join a rally via hex code
│   ├── Vote.tsx               # 3-step voting (budget, vibe, distance)
│   ├── WaitingRoom.tsx        # Live vote count + participant list
│   ├── Recommendations.tsx    # AI recommendations — owner picks the winner
│   ├── Result.tsx             # Winner reveal with confetti + map + feedback
│   └── NotFound.tsx           # 404 page
├── components/
│   ├── ErrorBoundary.tsx      # React error boundary
│   ├── LocationMap.tsx        # Static Leaflet map display
│   ├── PinDropMap.tsx         # Interactive pin-drop map with reverse geocoding
│   ├── ShareSheet.tsx         # Post-creation share UI (code, link, SMS)
│   ├── Skeleton.tsx           # Loading skeleton components
│   ├── TicketCode.tsx         # Animated hex code character display
│   ├── Toast.tsx              # Toast notification system
│   ├── motion.tsx             # Framer Motion primitives (page transitions, stagger)
│   └── ui/                    # shadcn/ui primitives (button, card, input, badge, separator)
├── utils/
│   └── analytics.ts           # Event tracking stub (ready for PostHog/Mixpanel)
├── lib/
│   └── utils.ts               # cn() utility (clsx + tailwind-merge)
└── __tests__/
    ├── setup.ts               # Vitest setup (jest-dom matchers)
    ├── AuthContext.test.tsx    # Auth context unit tests
    └── ErrorBoundary.test.tsx  # Error boundary unit tests

e2e/
└── rally-lifecycle.spec.ts    # Full lifecycle E2E test (8 serial tests)
```

## User Flow

```
Home ──> Login ──> Dashboard ──> Create Rally ──> Share Hex Code
                                                        │
                     ┌──────────────────────────────────┘
                     v
               Join Rally ──> Vote ──> Waiting Room ──> Recommendations ──> Result
```

1. **Home** — Landing page with app overview and a field to join by hex code
2. **Login** — Phone number + OTP verification via Twilio
3. **Dashboard** — View your rallies, drafts, and join others by code
4. **Create Rally** — 4-step wizard: name, when, message, where (with optional pin-drop map)
5. **Share** — Copy the 6-character hex code, share via link or SMS
6. **Join** — Enter display name and join the rally session
7. **Vote** — Pick preferences across budget, vibe, and distance
8. **Waiting Room** — Live participant count and sharing prompts while votes come in
9. **Recommendations** — Rally owner picks the winning venue from AI suggestions
10. **Result** — Winner reveal with confetti, map, directions link, and feedback form

## Testing

### Unit Tests (Vitest)

```bash
npm test            # Single run
npm run test:watch  # Watch mode
```

Tests live in `src/__tests__/` and use Testing Library + jest-dom matchers.

### E2E Tests (Playwright)

```bash
npm run test:e2e          # Headless
npm run test:e2e:headed   # With visible browser
```

E2E tests cover the complete rally lifecycle (create, join, vote, recommend, result). They require the **rally-reactor backend running on `localhost:3000`**.

## Related

- **[rally-reactor](https://github.com/klmrmt/rally-reactor)** — Backend API (Express + PostgreSQL)
