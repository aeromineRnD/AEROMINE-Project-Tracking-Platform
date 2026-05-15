"use client";

import useSWR from "swr";
import type { Project } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>("/api/projects", fetcher, {
    revalidateOnFocus: false,
  });
  return { projects: data ?? [], error, isLoading, mutate };
}

export function useProject(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Project>(
    id ? `/api/projects/${id}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { project: data ?? null, error, isLoading, mutate };
}

export function useClients() {
  const { data, error, isLoading } = useSWR("/api/clients", fetcher, {
    revalidateOnFocus: false,
  });
  return { clients: data ?? [], error, isLoading };
}

export function useUpdates() {
  const { data, error, isLoading, mutate } = useSWR("/api/updates", fetcher, {
    revalidateOnFocus: false,
  });
  return { updates: data ?? [], error, isLoading, mutate };
}
