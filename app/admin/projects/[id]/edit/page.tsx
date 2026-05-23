"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, UserPlus, X, ImageIcon, ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import { useT } from "@/lib/i18n/LanguageContext";
import { DatePicker } from "@/components/ui/DatePicker";
import { uploadFile } from "@/lib/uploadFile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProject } from "@/lib/hooks/useProjects";

interface ClientOption {
  id: string;
  name: string;
  email: string;
}

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { project, mutate } = useProject(id);
  const t = useT();

  // ── Project details form ────────────────────────────────────────────────
  const [saving, setSaving]             = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl]         = useState("");
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", location: "", startDate: "", estimatedEnd: "",
    status: "IN_PROGRESS", description: "",
  });

  useEffect(() => {
    if (project) {
      setForm({
        name:         project.name,
        location:     project.location,
        startDate:    project.startDate.split("T")[0],
        estimatedEnd: project.estimatedEnd.split("T")[0],
        status:       project.status,
        description:  project.description ?? "",
      });
      // Show existing cover image as preview
      if (project.coverImage) {
        setCoverPreview(project.coverImage);
        setCoverUrl(project.coverImage);
      }
    }
  }, [project?.id]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadFile(file, "covers");
      setCoverUrl(url);
    } catch {
      setCoverPreview(coverUrl || null);
    }
    setUploading(false);
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.estimatedEnd <= form.startDate) return;
    setSaving(true);
    await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, coverImage: coverUrl || null }),
    });
    router.push(`/admin/projects/${id}`);
  }

  // ── Client management ───────────────────────────────────────────────────
  const [assigned, setAssigned]     = useState<ClientOption[]>([]);
  const [allClients, setAllClients] = useState<ClientOption[]>([]);
  const [search, setSearch]         = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [showNewName, setShowNewName] = useState(false);
  const [newName, setNewName]       = useState("");
  const [clientBusy, setClientBusy] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Initialise assigned from SWR project data
  useEffect(() => {
    if (project?.clients) {
      setAssigned(
        project.clients.map((pc: any) => ({
          id:    pc.client.id,
          name:  pc.client.name,
          email: pc.client.email,
        }))
      );
    }
  }, [project?.id]);

  // Load all available clients for search
  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setAllClients)
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.trim()
    ? allClients.filter(
        (c) =>
          !assigned.find((a) => a.id === c.id) &&
          (c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.email.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const exactMatch = allClients.find(
    (c) => c.email.toLowerCase() === search.trim().toLowerCase()
  );
  const showCreate =
    search.trim().length > 0 &&
    !exactMatch &&
    !assigned.find((a) => a.email === search.trim());

  async function addExisting(client: ClientOption) {
    setClientBusy(true);
    const res = await fetch(`/api/projects/${id}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id }),
    });
    if (res.ok) {
      setAssigned((prev) => [...prev, client]);
      mutate();
    }
    setSearch(""); setSearchOpen(false); setShowNewName(false);
    setClientBusy(false);
  }

  async function addNew() {
    if (!search.trim() || !newName.trim()) return;
    setClientBusy(true);

    // 1. Create the client account
    const createRes = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), email: search.trim() }),
    });
    if (!createRes.ok) { setClientBusy(false); return; }
    const created: ClientOption = await createRes.json();

    // 2. Assign to project
    const assignRes = await fetch(`/api/projects/${id}/clients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: created.id }),
    });
    if (assignRes.ok) {
      setAssigned((prev) => [...prev, created]);
      setAllClients((prev) => [...prev, created]);
      mutate();
    }
    setSearch(""); setNewName(""); setShowNewName(false); setSearchOpen(false);
    setClientBusy(false);
  }

  async function removeClient(clientId: string) {
    setClientBusy(true);
    const res = await fetch(`/api/projects/${id}/clients`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    if (res.ok) {
      setAssigned((prev) => prev.filter((c) => c.id !== clientId));
      mutate();
    }
    setClientBusy(false);
  }

  // ── Stage management ────────────────────────────────────────────────────
  interface LocalStage { id: string | null; nameEn: string; nameEl: string; order: number; }
  const [stages, setStages]       = useState<LocalStage[]>([]);
  const [stageBusy, setStageBusy] = useState(false);
  const [newStageEn, setNewStageEn] = useState("");
  const [newStageEl, setNewStageEl] = useState("");

  useEffect(() => {
    if (project?.stages) {
      setStages(
        [...project.stages]
          .sort((a, b) => a.order - b.order)
          .map((s) => ({ id: s.id, nameEn: s.nameEn, nameEl: s.nameEl, order: s.order }))
      );
    }
  }, [project?.id]);

  function moveStage(index: number, dir: -1 | 1) {
    setStages((prev) => {
      const next = [...prev];
      const swap = index + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[index], next[swap]] = [next[swap], next[index]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  }

  async function saveStages() {
    setStageBusy(true);
    // 1. Patch name changes for existing stages
    await Promise.all(
      stages
        .filter((s) => s.id)
        .map((s) =>
          fetch(`/api/projects/${id}/stages/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nameEn: s.nameEn, nameEl: s.nameEl, order: s.order }),
          })
        )
    );
    // 2. Reorder
    await fetch(`/api/projects/${id}/stages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reorder: stages.filter((s) => s.id).map((s) => ({ id: s.id!, order: s.order })) }),
    });
    mutate();
    setStageBusy(false);
  }

  async function deleteStage(stageId: string) {
    if (!confirm(t("deleteStageConfirm"))) return;
    const res = await fetch(`/api/projects/${id}/stages/${stageId}`, { method: "DELETE" });
    if (res.ok) {
      setStages((prev) => prev.filter((s) => s.id !== stageId).map((s, i) => ({ ...s, order: i + 1 })));
      mutate();
    }
  }

  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    if (!newStageEn.trim()) return;
    setStageBusy(true);
    const nextOrder = stages.length + 1;
    const res = await fetch(`/api/projects/${id}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameEn: newStageEn.trim(), nameEl: newStageEl.trim() || newStageEn.trim(), order: nextOrder, progress: 0 }),
    });
    if (res.ok) {
      const created = await res.json();
      setStages((prev) => [...prev, { id: created.id, nameEn: created.nameEn, nameEl: created.nameEl, order: created.order }]);
      setNewStageEn(""); setNewStageEl("");
      mutate();
    }
    setStageBusy(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/admin/projects/${id}`}>
          <button className="text-slate-400 hover:text-slate-700"><ArrowLeft className="h-5 w-5" /></button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Project</h1>
      </div>

      {/* ── Project Details ────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {([
              ["name",     t("projectName"), "text"],
              ["location", t("location"),   "text"],
            ] as [keyof typeof form, string, string][]).map(([key, label, type]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input type={type} value={form[key]} onChange={set(key)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("startDate")}</label>
                <DatePicker
                  value={form.startDate}
                  onChange={(v) => setForm((prev) => ({ ...prev, startDate: v }))}
                  max={form.estimatedEnd || undefined}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t("estimatedCompletion")}</label>
                <DatePicker
                  value={form.estimatedEnd}
                  onChange={(v) => setForm((prev) => ({ ...prev, estimatedEnd: v }))}
                  min={form.startDate || undefined}
                  error={!!(form.startDate && form.estimatedEnd && form.estimatedEnd <= form.startDate)}
                />
                {form.startDate && form.estimatedEnd && form.estimatedEnd <= form.startDate && (
                  <p className="mt-1 text-xs text-red-500">Must be after the start date.</p>
                )}
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image</label>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
              {coverPreview ? (
                <div className="relative">
                  <div className="relative h-48 w-full rounded-lg overflow-hidden border border-slate-200">
                    <Image src={coverPreview} alt="Cover preview" fill className="object-cover" unoptimized />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCoverPreview(null); setCoverUrl(""); }}
                    className="absolute top-2 right-2 h-6 w-6 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-50 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-slate-600" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-aeromine-400 hover:text-aeromine-500 transition-colors"
                >
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm font-medium">Click to upload cover image</span>
                  <span className="text-xs">JPG, PNG or WebP</span>
                </button>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={set("status")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500">
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={form.description} onChange={set("description")} rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? t("saving") : t("save")}</Button>
              <Link href={`/admin/projects/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Assign Clients ─────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle>Assigned Clients</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {/* Current chips */}
          {assigned.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assigned.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 rounded-full bg-aeromine-50 border border-aeromine-200 px-3 py-1 text-xs text-aeromine-700">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-aeromine-400">{c.email}</span>
                  <button
                    type="button"
                    onClick={() => removeClient(c.id)}
                    disabled={clientBusy}
                    className="ml-0.5 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search box */}
          <div className="relative" ref={searchRef}>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:ring-2 focus-within:ring-aeromine-500 bg-white">
              <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name or email to add…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowNewName(false); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                className="flex-1 text-sm outline-none bg-transparent"
              />
              {search && (
                <button type="button" onClick={() => { setSearch(""); setShowNewName(false); setSearchOpen(false); }}>
                  <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>

            {/* Dropdown */}
            {searchOpen && search.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border bg-white shadow-lg z-20 overflow-hidden">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => addExisting(c)}
                    disabled={clientBusy}
                    className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aeromine-100 text-aeromine-700 text-xs font-bold flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.email}</p>
                    </div>
                  </button>
                ))}

                {showCreate && !showNewName && (
                  <button
                    type="button"
                    onClick={() => setShowNewName(true)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-aeromine-50 transition-colors text-left border-t"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 flex-shrink-0">
                      <UserPlus className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-aeromine-600">Create new client</p>
                      <p className="text-xs text-slate-400">{search.trim()}</p>
                    </div>
                  </button>
                )}

                {filtered.length === 0 && !showCreate && (
                  <p className="px-4 py-3 text-sm text-slate-400">No clients found</p>
                )}
              </div>
            )}
          </div>

          {/* New client name field */}
          {showNewName && (
            <div className="rounded-lg border border-aeromine-200 bg-aeromine-50 p-3 space-y-2">
              <p className="text-xs font-medium text-aeromine-700">New client — enter full name</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Full name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 bg-white"
                  autoFocus
                />
                <Button type="button" size="sm" onClick={addNew} disabled={!newName.trim() || clientBusy}>
                  Add
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setShowNewName(false); setNewName(""); }}>
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-slate-400">Email: {search.trim()}</p>
            </div>
          )}

          <p className="text-xs text-slate-400">Changes to clients are saved immediately.</p>
        </CardContent>
      </Card>

      {/* ── Stage Management ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Construction Stages</CardTitle>
            <Button size="sm" onClick={saveStages} disabled={stageBusy}>
              {stageBusy ? t("saving") : t("saveOrderAndNames")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {stages.map((stage, i) => (
            <div key={stage.id ?? i} className="flex items-center gap-2">
              {/* Up / Down */}
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveStage(i, -1)}
                  disabled={i === 0}
                  className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveStage(i, 1)}
                  disabled={i === stages.length - 1}
                  className="h-5 w-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Order badge */}
              <span className="w-5 flex-shrink-0 text-center text-xs font-medium text-slate-400">
                {i + 1}
              </span>

              {/* Name EN */}
              <input
                value={stage.nameEn}
                onChange={(e) => setStages((prev) => prev.map((s, j) => j === i ? { ...s, nameEn: e.target.value } : s))}
                placeholder={t("englishName")}
                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
              />

              {/* Name EL */}
              <input
                value={stage.nameEl}
                onChange={(e) => setStages((prev) => prev.map((s, j) => j === i ? { ...s, nameEl: e.target.value } : s))}
                placeholder={t("greekName")}
                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
              />

              {/* Delete */}
              <button
                type="button"
                onClick={() => stage.id && deleteStage(stage.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add new stage */}
          <form onSubmit={addStage} className="flex items-center gap-2 pt-2 border-t mt-2">
            <span className="w-5 flex-shrink-0" />
            <span className="w-5 flex-shrink-0" />
            <input
              value={newStageEn}
              onChange={(e) => setNewStageEn(e.target.value)}
              placeholder="English name"
              className="flex-1 rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
            />
            <input
              value={newStageEl}
              onChange={(e) => setNewStageEl(e.target.value)}
              placeholder="Greek name (optional)"
              className="flex-1 rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
            />
            <button
              type="submit"
              disabled={!newStageEn.trim() || stageBusy}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-aeromine-600 text-slate-900 hover:bg-aeromine-700 disabled:opacity-40 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
