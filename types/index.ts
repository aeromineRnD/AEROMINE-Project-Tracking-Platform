export type Role = "SUPER_ADMIN" | "ADMIN" | "CLIENT";
export type ProjectStatus = "IN_PROGRESS" | "COMPLETED" | "DELAYED";
export type UpdateType = "TEXT" | "PHOTO" | "VIDEO" | "DOCUMENT" | "MILESTONE";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StageMaterial {
  description: string;
  quantity: string;
  unit: string;
  invoiceUrl?: string | null;
}

export interface Stage {
  id: string;
  projectId: string;
  nameEn: string;
  nameEl: string;
  order: number;
  progress: number;
  modelPath?: string | null;
  materials?: string | null; // JSON string — parse with JSON.parse()
  createdAt: string;
  updatedAt: string;
}

export interface PhaseStageSnapshot {
  nameEn: string;
  nameEl: string;
  progress: number;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  order: number;
  capturedAt: string;
  overallProgress: number;
  modelPath?: string | null;
  photoUrls?: string | null; // JSON string — parse with JSON.parse()
  stageSnapshot: string; // JSON string — parse with JSON.parse()
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  startDate: string;
  estimatedEnd: string;
  status: ProjectStatus;
  coverImage?: string | null;
  description?: string | null;
  adminId: string;
  createdAt: string;
  updatedAt: string;
  stages?: Stage[];
  phases?: Phase[];
  admin?: User;
  clients?: { client: User }[];
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  authorId: string;
  title: string;
  content: string;
  type: UpdateType;
  mediaUrls?: string | null;
  createdAt: string;
  author?: User;
  project?: { id: string; name: string };
}

export interface Milestone {
  id: string;
  projectId: string;
  stageId?: string | null;
  title: string;
  description?: string | null;
  dueDate: string;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  stage?: { id: string; nameEn: string } | null;
}

export function calcOverallProgress(stages: Stage[]): number {
  if (!stages.length) return 0;
  const total = stages.reduce((sum, s) => sum + s.progress, 0);
  return Math.round(total / stages.length);
}

export function stageColor(progress: number): string {
  if (progress === 100) return "#22c55e";
  if (progress > 0)    return "#f59e0b";
  return "#94a3b8";
}

export const STATUS_LABELS: Record<ProjectStatus, { en: string; el: string; color: string }> = {
  IN_PROGRESS: { en: "In Progress", el: "Σε Εξέλιξη",  color: "#3b82f6" },
  COMPLETED:   { en: "Completed",   el: "Ολοκληρώθηκε", color: "#22c55e" },
  DELAYED:     { en: "Delayed",     el: "Καθυστέρηση",  color: "#ef4444" },
};

export const UPDATE_TYPE_ICONS: Record<UpdateType, string> = {
  TEXT:      "FileText",
  PHOTO:     "Image",
  VIDEO:     "Video",
  DOCUMENT:  "FileText",
  MILESTONE: "Flag",
};
