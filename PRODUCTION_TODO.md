# Production Readiness Checklist
> Reference file: everything that is mocked/simplified in the prototype and needs proper implementation before going live.
> App name: **Aeromine SiteView**
> Last updated: 2026-04-26

---

## CONFIRMED DECISIONS

| Decision | Value |
|---|---|
| **3D format** | `.gltf` (drone photogrammetry by Aeromine colleague) |
| **3D model strategy** | One `.gltf` per stage; stages are configurable (preset list + future custom) |
| **Demo 3D models** | Sourced from Sketchfab |
| **Database** | SQLite (local dev) → PostgreSQL (production via Prisma) |
| **Data to migrate** | None — fresh start, demo data only |
| **User roles** | 3 roles: Aeromine Super Admin / Construction Company Admin / Homebuyer Client |
| **Multiple clients per project** | Yes — each person has their own credentials; multiple clients can view same project |
| **Auth (demo)** | Role-switch button (Admin ↔ Client). Super Admin role added later. |
| **Video** | YouTube/Vimeo embed (no self-hosting) |
| **PDF file size limit** | 50 MB |
| **Branding** | Aeromine primary brand; construction company logo shown alongside |
| **Language** | Greek + English (i18n with next-intl) |
| **Testing** | Vitest (unit) + React Testing Library (components) + Playwright (E2E) |
| **Framework** | Next.js 14 App Router + TypeScript |
| **UI** | Tailwind CSS + shadcn/ui |
| **3D Viewer** | React Three Fiber + @react-three/drei |
| **Charts** | Recharts |
| **File uploads** | Local filesystem → S3/Cloudflare R2 in production |
| **ORM** | Prisma |

## PENDING DECISIONS
- Preset stages list: proposed below — awaiting confirmation
- Stage naming in Greek vs English (or both)?

---

## PROPOSED PRESET STAGES (confirm or edit)
Standard Greek residential construction flow:
1. Foundation (Θεμελίωση)
2. Structural Frame (Φέρων Οργανισμός)
3. Roofing (Στέγη)
4. Masonry / Walls (Τοιχοποιία)
5. Plumbing Rough-in (Υδραυλικές Εργασίες)
6. Electrical Rough-in (Ηλεκτρολογικές Εργασίες)
7. Insulation (Μόνωση)
8. Plastering (Σοβάδες)
9. Tiling / Flooring (Πλακάκια / Δάπεδα)
10. Fixtures & Fittings (Εξοπλισμός)
11. Painting / Finishing (Βαφή / Φινίρισμα)
12. External Works / Landscaping (Περιβάλλων Χώρος)
13. Final Inspection (Τελική Επιθεώρηση)

---

## 1. AUTHENTICATION & SECURITY
- [ ] Replace role-switch demo button with real login system (email + password)
- [ ] Implement NextAuth.js with credentials provider
- [ ] Add password hashing (bcrypt)
- [ ] Add email verification on signup
- [ ] Implement forgot password / reset password flow
- [ ] Add rate limiting on login endpoint (brute force protection)
- [ ] HTTPS enforcement in production
- [ ] CSRF protection on all state-mutating endpoints
- [ ] Audit all API routes — server-side auth check on every route
- [ ] Add refresh token logic
- [ ] Aeromine Super Admin role: separate login, full platform visibility

## 2. ROLE & ACCESS CONTROL
- [ ] 3-role RBAC enforced server-side: Super Admin / Admin / Client
- [ ] Multi-tenant isolation: each construction company sees only their own projects and clients
- [ ] Client data isolation: client can only see projects they are explicitly linked to
- [ ] Admin invite flow: Admin sends invite email to client with project link
- [ ] Multiple clients per project: many-to-many relationship (ProjectClient join table)
- [ ] Aeromine can impersonate any role for support purposes (audit logged)

## 3. DATABASE
- [ ] Migrate from SQLite (local dev) to PostgreSQL (production)
- [ ] Automated daily backups
- [ ] Prisma Migrate for schema changes
- [ ] Connection pooling for production (PgBouncer or Prisma Accelerate)
- [ ] Indexes on: project.adminId, projectClient.clientId, projectClient.projectId, update.projectId
- [ ] Soft deletes on projects, users (never hard-delete client data)

## 4. 3D MODEL VIEWER
- [x] Format confirmed: `.gltf`
- [ ] Separate model upload per stage — many-to-many (project → stages → gltf file)
- [ ] Custom stages per project (admin defines stage name + order + gltf)
- [ ] Model versioning: admin can replace/update a stage model over time (drone revisits)
- [ ] Cloud storage for models (S3 / Cloudflare R2) — not local disk
- [ ] Draco compression pipeline for large photogrammetry meshes
- [ ] LOD fallback for mobile
- [ ] Coordinate system / scale convention with colleague generating models
- [ ] Loading progress bar for large file loads
- [ ] Error handling with fallback UI if model fails to load

## 5. FILE UPLOADS (IMAGES, DOCUMENTS, PLANS)
- [ ] Move from local disk to cloud storage (S3 / Cloudflare R2)
- [ ] File type validation (whitelist: jpg, png, pdf, mp4 links, gltf)
- [ ] Virus scanning on upload
- [ ] 50MB max per file (confirmed)
- [ ] Signed / private URLs — clients only access files for their own projects
- [ ] Image optimization on upload (Sharp)
- [ ] Video: embed only (YouTube/Vimeo URL stored, not file)

## 6. NOTIFICATIONS
- [ ] Email notification when admin posts a progress update (Resend / SendGrid)
- [ ] In-app notification bell with unread count
- [ ] Notification preferences per user
- [ ] Milestone reached notification
- [ ] (Optional) Push notifications via PWA

## 7. ADMIN PANEL — FULL FUNCTIONALITY
- [ ] Full CRUD for projects with validation
- [ ] Stage management: add/remove/reorder stages per project
- [ ] User management: create client accounts, link to projects (many-to-many)
- [ ] Audit log: who changed what and when
- [ ] Milestone CRUD
- [ ] Progress update post: text + photos + embedded video URL + PDF
- [ ] Preview mode: admin sees the client view of a project

## 8. ANALYTICS
- [ ] Progress snapshot stored on each update (for over-time chart)
- [ ] Admin analytics: on-time %, delayed %, avg completion across all projects
- [ ] Export project status report as PDF for client

## 9. TESTING (IMPORTANT — added per user requirement)
- [ ] **Unit tests (Vitest)**: all utility functions, data transformations, permission helpers
- [ ] **Component tests (React Testing Library)**: all page-level components, role-conditional rendering
- [ ] **API route tests**: every API endpoint — correct auth check, correct data scoping
- [ ] **Data isolation tests (critical)**: verify Client A cannot access Client B's data under any request
- [ ] **Role escalation tests**: verify Client cannot access Admin routes, Admin cannot access Super Admin routes
- [ ] **E2E tests (Playwright)**: login flow, project view, role switch, file upload, 3D viewer load
- [ ] **Test coverage target**: 80% minimum on API routes and auth logic
- [ ] Set up CI to run tests on every commit (GitHub Actions)

## 10. PERFORMANCE & RELIABILITY
- [ ] API response caching (SWR or React Query on frontend)
- [ ] Pagination on project lists and update feeds
- [ ] Loading skeletons / optimistic UI
- [ ] Error boundaries with user-friendly fallback pages
- [ ] Sentry (or similar) for error tracking
- [ ] Health check endpoint

## 11. DEPLOYMENT
- [ ] Vercel for Next.js (frontend + API routes)
- [ ] Railway or Supabase for PostgreSQL
- [ ] GitHub Actions CI/CD pipeline
- [ ] Environment variable management
- [ ] Custom domain + SSL
- [ ] Zero-downtime database migrations on deploy
- [ ] CDN for static assets and gltf model files

## 12. INTERNATIONALISATION (i18n)
- [ ] Full Greek + English translations for all UI strings
- [ ] Language switcher in settings per user
- [ ] Date/number formatting per locale (Greek: DD/MM/YYYY)
- [ ] Email notifications in user's preferred language
- [ ] RTL not required (neither Greek nor English is RTL)

## 13. LEGAL / COMPLIANCE
- [ ] Terms of Service (Greek + English)
- [ ] Privacy Policy (Greek + English)
- [ ] GDPR compliance (EU — Greek homebuyers): right to deletion, data export
- [ ] Cookie consent banner
- [ ] Data processing agreements with construction companies

## 14. BILLING (future SaaS)
- [ ] Stripe integration for subscription billing
- [ ] Plan tiers (number of projects, storage, users)
- [ ] Trial period logic
- [ ] Invoice generation (with Greek VAT number support)

---

## NOTES
- Preset stages: proposed 13-stage list above — awaiting user confirmation/edits
- Super Admin (Aeromine) role: UI-only in demo, real implementation deferred
- Multi-tenant: each construction company is an isolated tenant — critical for data security
- 3D models from drone will be large; Vercel free tier handles serving static files up to 100MB; revisit if needed

---
*This file is maintained by Claude Code. Update as decisions are made.*
