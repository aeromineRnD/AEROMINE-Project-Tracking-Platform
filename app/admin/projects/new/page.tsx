"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoleStore } from "@/lib/store/roleStore";

export default function NewProjectPage() {
  const router = useRouter();
  const { currentUser } = useRoleStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    startDate: "",
    estimatedEnd: "",
    status: "IN_PROGRESS",
    coverImage: "",
    description: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-demo-user-id": currentUser.id, "x-demo-role": currentUser.role },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const project = await res.json();
      router.push(`/admin/projects/${project.id}`);
    } else {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/projects">
          <button className="text-slate-400 hover:text-slate-700"><ArrowLeft className="h-5 w-5" /></button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">New Project</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {([
              ["name", "Project Name", "text", "e.g. Glyfada Villa"],
              ["location", "Location", "text", "e.g. Glyfada, Athens, Greece"],
              ["startDate", "Start Date", "date", ""],
              ["estimatedEnd", "Estimated Completion", "date", ""],
              ["coverImage", "Cover Image URL", "url", "https://…"],
            ] as [keyof typeof form, string, string, string][]).map(([key, label, type, placeholder]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  type={type}
                  required={["name", "location", "startDate", "estimatedEnd"].includes(key)}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={set(key)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELAYED">Delayed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create Project"}</Button>
              <Link href="/admin/projects">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
