"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { ArrowLeft, Upload, X, Search, UserPlus, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientOption {
  id: string;
  name: string;
  email: string;
  isNew?: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving]           = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl]       = useState("");

  // Client search state
  const [allClients, setAllClients]   = useState<ClientOption[]>([]);
  const [search, setSearch]           = useState("");
  const [newName, setNewName]         = useState("");
  const [showNewName, setShowNewName] = useState(false);
  const [selected, setSelected]       = useState<ClientOption[]>([]);
  const [searchOpen, setSearchOpen]   = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    startDate: "",
    estimatedEnd: "",
    description: "",
  });

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((data: ClientOption[]) => setAllClients(data))
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  // Filter clients by search, exclude already selected
  const filtered = search.trim()
    ? allClients.filter(
        (c) =>
          !selected.find((s) => s.id === c.id) &&
          (c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const searchIsEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(search.trim());
  const exactMatch    = allClients.find((c) => c.email.toLowerCase() === search.trim().toLowerCase());
  const showCreate    = search.trim().length > 0 && !exactMatch && !selected.find((s) => s.email === search.trim());

  function addExisting(client: ClientOption) {
    setSelected((prev) => [...prev, client]);
    setSearch("");
    setShowNewName(false);
    setSearchOpen(false);
  }

  function addNew() {
    if (!search.trim() || !newName.trim()) return;
    const newClient: ClientOption = { id: `new_${Date.now()}`, name: newName.trim(), email: search.trim(), isNew: true };
    setSelected((prev) => [...prev, newClient]);
    setSearch("");
    setNewName("");
    setShowNewName(false);
    setSearchOpen(false);
  }

  function removeSelected(id: string) {
    setSelected((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", "covers");

    const res = await fetch("/api/uploads", {
      method: "POST",
      body: fd,
    });

    if (res.ok) {
      const { url } = await res.json();
      setCoverUrl(url);
    } else {
      setCoverPreview(null);
    }
    setUploading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // 1. Create the project
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "IN_PROGRESS", coverImage: coverUrl || null }),
    });

    if (!res.ok) { setSaving(false); return; }
    const project = await res.json();

    // 2. Create any new clients, then assign all to the project
    await Promise.all(
      selected.map(async (client) => {
        let clientId = client.id;

        if (client.isNew) {
          const created = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: client.name, email: client.email }),
          }).then((r) => r.json());
          clientId = created.id;
        }

        await fetch(`/api/projects/${project.id}/clients`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        });
      })
    );

    await mutate("/api/projects"); // invalidate projects list cache
    router.push(`/admin/projects/${project.id}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/projects">
          <button className="text-slate-400 hover:text-slate-700"><ArrowLeft className="h-5 w-5" /></button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Project</h1>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* ── Project Details ─────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {([
              ["name",         "Project Name",         "text", "e.g. Glyfada Villa",           true],
              ["location",     "Location",             "text", "e.g. Glyfada, Athens, Greece", true],
              ["startDate",    "Start Date",           "date", "",                              true],
              ["estimatedEnd", "Estimated Completion", "date", "",                              true],
            ] as [keyof typeof form, string, string, string, boolean][]).map(([key, label, type, placeholder, required]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  type={type}
                  required={required}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={set(key)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={form.description} onChange={set("description")} rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 resize-none" />
            </div>
          </CardContent>
        </Card>

        {/* ── Cover Image ─────────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Cover Image</CardTitle></CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />

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
                {!uploading && coverUrl && (
                  <p className="mt-1.5 text-xs text-green-600 font-medium">Image uploaded successfully</p>
                )}
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
          </CardContent>
        </Card>

        {/* ── Assign Clients ──────────────────────────────── */}
        <Card>
          <CardHeader><CardTitle>Assign Clients</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 rounded-full bg-aeromine-50 border border-aeromine-200 px-3 py-1 text-xs text-aeromine-700">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-aeromine-400">{c.email}</span>
                    {c.isNew && <span className="text-[10px] bg-aeromine-100 rounded-full px-1">new</span>}
                    <button type="button" onClick={() => removeSelected(c.id)} className="ml-0.5 hover:text-red-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search box */}
            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:ring-2 focus-within:ring-aeromine-500 bg-white">
                <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
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
                      className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
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
                  <Button type="button" size="sm" onClick={addNew} disabled={!newName.trim()}>
                    Add
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setShowNewName(false); setNewName(""); }}>
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-slate-400">Email: {search.trim()}</p>
              </div>
            )}

            <p className="text-xs text-slate-400">
              You can also assign clients from the project detail page later.
            </p>
          </CardContent>
        </Card>

        {/* ── Actions ─────────────────────────────────────── */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving || uploading}>
            {saving ? "Creating…" : "Create Project"}
          </Button>
          <Link href="/admin/projects">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
