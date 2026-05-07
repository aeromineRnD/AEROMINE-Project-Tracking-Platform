"use client";

import { useEffect, useState } from "react";
import { UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoleStore } from "@/lib/store/roleStore";

interface Client {
  id: string;
  name: string;
  email: string;
  clientProjects: { project: { id: string; name: string } }[];
}

export default function AdminClientsPage() {
  const { currentUser } = useRoleStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });
  const [saving, setSaving] = useState(false);

  const headers = { "x-demo-user-id": currentUser.id, "x-demo-role": currentUser.role };

  useEffect(() => {
    fetch("/api/clients", { headers })
      .then((r) => r.json())
      .then((d) => { setClients(d); setLoading(false); });
  }, [currentUser]);

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const c = await res.json();
      setClients((prev) => [...prev, { ...c, clientProjects: [] }]);
      setForm({ name: "", email: "" });
      setShowForm(false);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500">{clients.length} clients</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <UserPlus className="h-4 w-4" /> Add Client
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Client</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={addClient} className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500" />
              </div>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create"}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aeromine-100 text-aeromine-700 font-bold text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{c.name}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Mail className="h-3 w-3" />{c.email}
                    </p>
                  </div>
                </div>
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs text-slate-400 mb-1">Projects</p>
                  {c.clientProjects.length === 0 ? (
                    <p className="text-xs text-slate-400">No projects assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {c.clientProjects.map((cp) => (
                        <span key={cp.project.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {cp.project.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
