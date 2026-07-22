# 🏥 Curaflow

![Curaflow Banner](https://via.placeholder.com/1000x300.png?text=Curaflow+-+Intelligent+Clinic+Management)

> **Curaflow** is a modern, modular monolithic clinic appointment and live queue management platform supercharged with AI Agents.

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2014-black)](https://curaflow-web.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Express%2BNode.js-green)](https://curaflow-api.onrender.com)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-blue)](https://neon.tech/)
[![AI](https://img.shields.io/badge/AI-LangGraph%20%7C%20LangChain-orange)](https://langchain.com/)

## 🚀 Live Demo

- **Frontend Application:** [https://curaflow-web.vercel.app](https://curaflow-web.vercel.app)
- **Backend API Server:** [https://curaflow-api.onrender.com](https://curaflow-api.onrender.com) *(Serves GraphQL/REST and WebSockets)*

---

## ✨ Features

- **👥 Multi-Role Dashboards:** Distinct interfaces and capabilities for Patients, Doctors, and Administrators.
- **📅 Smart Appointments:** Effortlessly book, reschedule, or cancel clinic appointments.
- **⏱️ Live Queue Tracking:** Real-time Socket.io-powered live queue tracking. Patients know exactly when to walk into the clinic.
- **🤖 AI Agent Assistants:** Integrated LangGraph/LangChain agents that assist patients with scheduling, summarize doctor notes, and analyze admin metrics safely via strict tool constraints.
- **🔔 Multi-channel Notifications:** Automated SMS (Twilio) and Email (Resend) reminders for bookings and queue delays.
- **🔐 Secure Authentication:** Seamless Google OAuth and JWT-based local authentication.

---

## 🏗️ System Architecture

Curaflow is structured as a powerful monorepo using `pnpm` workspaces:

- `apps/web` — **Frontend:** Next.js application tailored with Tailwind CSS and shadcn/ui components.
- `apps/api` — **Backend:** Express.js REST API and Socket.io WebSocket server. Built for production deployment via `tsup`.
- `apps/worker` — **Background Processing:** Handles asynchronous AI tasks, notifications, and scheduled jobs using BullMQ & Redis.
- `packages/*` — Shared domain logic, infrastructure, Prisma schemas, and observability tools.

### Tech Stack Highlights
- **Language:** TypeScript
- **Frontend:** Next.js, React, Tailwind, Framer Motion
- **Backend:** Node.js, Express, Socket.io
- **Database:** Prisma ORM, Neon PostgreSQL
- **Caching & Pub/Sub:** Upstash Redis
- **AI/LLMs:** Groq / OpenAI via LangChain & LangGraph

---

## 💻 Getting Started (Local Development)

### 1. Prerequisites
- Node.js (v20+)
- `pnpm` package manager
- A PostgreSQL database (e.g., local Docker or Neon)
- A Redis instance (e.g., Upstash)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/phantomgamer378-ship-it/curaflow.git
cd curaflow
pnpm install
```

### 3. Environment Variables

Create `.env` files in `apps/api` and `apps/web` referencing the required tokens. Critical variables include:
- `DATABASE_URL` (PostgreSQL connection string)
- `UPSTASH_REDIS_URL` (Redis connection)
- `GOOGLE_OAUTH_CLIENT_ID` & `GOOGLE_OAUTH_CLIENT_SECRET`
- `JWT_SECRET`
- `GROQ_API_KEY` or `OPENAI_API_KEY` for Agents
- `RESEND_API_KEY` & `TWILIO_ACCOUNT_SID`

### 4. Database Setup

Push the Prisma schema to your database and generate the client:

```bash
pnpm --filter @clinic/db run db:push
pnpm --filter @clinic/db run generate
```

### 5. Running the Application

Start all services (Frontend, API, and Worker) concurrently:

```bash
pnpm dev
```

- Web App runs at `http://localhost:3000`
- API Server runs at `http://localhost:4000`

---

## 🌐 Deployment Guidelines

This monorepo uses isolated build targets for deployment:
- **Vercel** deploys `apps/web` using standard Next.js build presets.
- **Render / Railway** deploys `apps/api`. The backend relies on a flattened `tsup` bundle (`dist/index.js`) to minimize deployment size and circumvent standard monorepo hoisting issues in constrained environments.

---

## 🛡️ License & Acknowledgements

Built for modern healthcare clinics requiring high-reliability, real-time insights, and secure agentic AI integrations.
