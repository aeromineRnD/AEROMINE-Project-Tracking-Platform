# Aeromine SiteView

Aeromine SiteView is a construction project tracking platform built for Greek construction companies and their clients. It gives homebuyers and property investors a real-time, transparent view of their project's progress — from foundation to handover — without requiring phone calls, site visits, or manual reports.

---

## Overview

SiteView connects construction company admins with their clients through a shared, role-based portal. Admins log stage progress, post updates with media attachments, capture 3D drone models of the site, and record materials and invoices per construction stage. Clients see exactly what has been built, when, and with what. The platform supports both English and Greek, reflecting the needs of Greek construction firms working with clients based abroad.

---

## Features

### For Construction Companies (Admin)

- Project creation and lifecycle management with status tracking (In Progress, Completed, Delayed)
- Stage-based progress tracking — 13 preset construction stages with bilingual names (English and Greek), individually adjustable progress percentages
- Materials and invoice logging per stage — log quantities, units, and attach invoice PDFs visible to clients
- 3D model viewer — drone photogrammetry models (.gltf) attached per project phase, rendered in an interactive WebGL viewer
- Phase photo gallery — site photos attached to each capture phase as an alternative or complement to 3D models
- Milestone tracking with optional stage-linked auto-completion
- Progress updates with rich file attachments — photos, PDFs, PowerPoint files, Word documents, and video
- Client management — assign multiple clients to a single project; invite new clients directly from the project page
- In-app notifications delivered to clients on every key event: stage progress updates, new updates, new phases, milestone completions, and material logging

### For Homebuyers and Project Stakeholders (Client)

- Real-time view of all assigned projects from a personal dashboard
- Stage-by-stage progress bars and an overall completion percentage
- Interactive 3D walkthrough viewer or photo gallery per capture phase
- Option to request a 3D drone walkthrough directly from the portal
- Downloadable materials list and invoice documents per construction stage
- Milestone timeline with completion dates
- In-app notification feed with unread count
- Language preference — Greek or English, stored per user account

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14, App Router, TypeScript |
| UI | Tailwind CSS, shadcn/ui, Radix UI |
| Animations | Framer Motion |
| 3D Viewer | React Three Fiber, @react-three/drei, Three.js |
| Authentication | NextAuth v4, bcryptjs |
| ORM | Prisma 5 |
| Database | PostgreSQL (Neon, Frankfurt region) |
| File Storage | Vercel Blob |
| Client State | Zustand, SWR |
| Charts | Recharts |
| Internationalisation | next-intl (English, Greek) |
| Testing | Vitest, React Testing Library, Playwright |
| Deployment | Vercel |

---

## Architecture

SiteView is a multi-tenant SaaS application. Tenancy is enforced server-side on every API route — an admin can only access projects they own, and a client can only access projects they have been explicitly assigned to. Authentication uses NextAuth v4 with JWT sessions. The application is built entirely on Next.js App Router API routes with Prisma as the ORM layer. All file uploads are stored on Vercel Blob and served via public URLs.

---

## Roles

| Role | Description |
|---|---|
| Super Admin | Aeromine platform operator. Full visibility across all companies and projects. |
| Admin | Construction company administrator. Creates and manages projects, stages, phases, clients, and updates. |
| Client | Homebuyer or property stakeholder. Read-only access to assigned projects and all associated data. |

---

## Deployment

The application is hosted on Vercel with automatic deployments from the `main` branch. The database runs on Neon PostgreSQL in the AWS EU Central 1 (Frankfurt) region. File assets are stored on Vercel Blob.

**Required environment variables:**

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
BLOB_READ_WRITE_TOKEN=
```

**Build:**

```bash
npm run build   # runs prisma generate then next build
```

---

## Testing

```bash
npm test                 # run unit tests (Vitest)
npm run test:coverage    # generate coverage report
```

75 unit tests covering authentication, API authorisation, and multi-tenant data isolation. 82% coverage on auth and API logic.

---

## License

Copyright (c) 2025 Aeromine. All rights reserved.

This software is proprietary and confidential. Unauthorised copying, modification, distribution, or use of this software, in whole or in part, is strictly prohibited without the express written permission of Aeromine.
