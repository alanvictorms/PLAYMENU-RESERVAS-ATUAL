# PlayMenu - PRD

## Problem Statement
Clone and run the PlayMenu FastAPI 2 project from https://github.com/alanvictorms/PLAYMENU-FASTAPI-2.git
Set all user passwords (including admin) to: 123456

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB) on port 8001
- **Frontend**: React 19 + React Router 7 + Tailwind CSS + Shadcn UI on port 3000
- **Database**: MongoDB (MONGO_URL from .env)
- **Auth**: JWT-based with bcrypt password hashing

## User Personas
- **SuperAdmin**: Platform administrator (admin@playmenu.app)
- **Restaurant Owner**: Manages menu, categories, products, settings
- **Gerente (Manager)**: Manages representatives and clients
- **Representante (Representative)**: Manages assigned restaurants

## Core Requirements
- Multi-role authentication system (superadmin, restaurant, gerente, representante)
- Restaurant menu management (categories, products, images, videos)
- Public menu view with QR code access
- Commission system for agents
- Video request management
- Bio/Link-in-bio page builder
- AI-powered menu import
- Subscription & payment management (Asaas integration)

## What's Been Implemented (Aug 2, 2026)
- Full project migrated from GitHub to Emergent environment
- All passwords reset to 123456 on startup
- Backend: 12 Python modules (server, auth, routes, services)
- Frontend: Complete React app with all pages and components
- Legacy data seeded from SQL dump (4 restaurants, 6 agents, 1 admin)
- 22/22 backend tests passing, 100% frontend flows working

## Prioritized Backlog
- P0: Project running successfully ✅
- P1: User awaiting instructions for modifications
- P2: Remove password reset on startup for production
- P2: Update external script references to local paths

## Next Tasks
- Awaiting user instructions for specific modifications
