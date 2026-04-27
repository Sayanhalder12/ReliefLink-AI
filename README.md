## ReliefLink AI

ReliefLink AI is a modern full-stack NGO volunteer coordination platform built with Next.js, Tailwind, Firebase, Firestore, and Gemini API.

### Features

- Landing page with premium glassmorphism UI and motion.
- Firebase email/password login system.
- NGO dashboard for incident overview.
- Survey report upload (text/image/pdf) with Gemini urgency classification.
- Volunteer dashboard with profile management and location + skill matching.
- Analytics dashboard for urgency and location trends.
- Responsive and deployment-ready architecture.

## Local Setup

1) Install dependencies:

```bash
npm install
```

2) Copy env vars:

```bash
cp .env.example .env.local
```

3) Fill Firebase + Gemini credentials in `.env.local`.

4) Run dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy to [Vercel](https://vercel.com/) and set all `.env.example` variables in Project Settings > Environment Variables.

Build command: `npm run build`  
Output: default Next.js output.
