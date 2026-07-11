# CampusConnect

CampusConnect is a full-stack smart campus platform for students, faculty, admins, and campus services. The current MVP includes:

- a polished landing page
- authentication screens
- a student dashboard
- a Node.js/Express backend health API

## Project structure

- frontend/: Vite + React + TypeScript + Tailwind
- backend/: Express + TypeScript API server

## Getting started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx ts-node src/server.ts
```

## Notes

- The backend is configured as an MVP API server and can be extended with MongoDB, authentication, and full modules.
- The frontend is ready for further module expansion such as lost & found, events, marketplace, and chat.
