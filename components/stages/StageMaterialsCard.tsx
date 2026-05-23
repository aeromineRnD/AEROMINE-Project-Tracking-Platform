"use client";

import { useState, useRef } from "react";
import { ChevronDown, ChevronRight, X, FileText, Download, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stage, StageMaterial } from "@/types";
import { uploadFile } from "@/lib/uploadFile";

const UNITS = ["m³", "kg", "t", "m²", "m", "pcs", "hrs", "L", "boxes"];

interface Props {
  stages: Stage[];
  projectId: string;
  readOnly?: boolean;
  onUpdate?: (stageId: string, materials: StageMaterial[]) => void;
}

function parseMaterials(raw?: string | null): StageMaterial[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function StageMaterialsCard({ stages, projectId, readOnly = false, onUpdate }: Props) {
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [saving, setSaving]         = useState<string | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [uploading, setUploading]   = useState(false);

  // Add material form
  const [formStageId, setFormStageId] = useState(stages[0]?.id ?? "");
  const [newDesc, setNewDesc]         = useState("");
  const [newQty, setNewQty]           = useState("");
  const [newUnit, setNewUnit]         = useState("m³");
  const [newInvoice, setNewInvoice]   = useState<string | null>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);

  const stagesWithMaterials = stages.filter((s) => parseMaterials(s.materials).length > 0);

  async function uploadInvoice(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const url = await uploadFile(file, "invoices");
      setUploading(false);
      return url;
    } catch {
      setUploading(false);
      return null;
    }
  }

  async function saveMaterials(stageId: string, materials: StageMaterial[]): Promise<boolean> {
    setSaving(stageId);
    const res = await fetch(`/api/projects/${projectId}/stages/${stageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materials }),
    });
    setSaving(null);
    if (res.ok) {
      // Use the DB-returned stage to drive the update (source of truth)
      const updated = await res.json();
      const saved: StageMaterial[] = updated.materials ? JSON.parse(updated.materials) : materials;
      onUpdate?.(stageId, saved);
      return true;
    }
    return false;
  }

  async function addMaterial() {
    if (!newDesc.trim() || !newQty.trim() || !formStageId) return;
    const stage    = stages.find((s) => s.id === formStageId)!;
    const current  = parseMaterials(stage.materials);
    const entry: StageMaterial = {
      description: newDesc.trim(),
      quantity:    newQty.trim(),
      unit:        newUnit,
      invoiceUrl:  newInvoice ?? null,
    };
    const ok = await saveMaterials(formStageId, [...current, entry]);
    if (ok) {
      setNewDesc(""); setNewQty(""); setNewUnit("m³"); setNewInvoice(null);
      setShowForm(false);
      setExpanded(formStageId); // auto-expand so the user sees the new entry
    }
  }

  async function deleteMaterial(stage: Stage, index: number) {
    const updated = parseMaterials(stage.materials).filter((_, i) => i !== index);
    await saveMaterials(stage.id, updated);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Materials &amp; Invoices</CardTitle>
          {!readOnly && (
            <button
              onClick={() => { setShowForm((v) => !v); setFormStageId(stages[0]?.id ?? ""); }}
              className="flex items-center gap-1.5 rounded-lg bg-aeromine-600 hover:bg-aeromine-700 text-slate-900 px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Material
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-4">

        {/* Add material form (inline, shown when button clicked) */}
        {showForm && !readOnly && (
          <div className="rounded-lg border border-aeromine-200 bg-aeromine-50 p-3 space-y-3">
            {/* Stage selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Stage</label>
              <select
                value={formStageId}
                onChange={(e) => setFormStageId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.nameEn}</option>
                ))}
              </select>
            </div>

            {/* Description + qty + unit row */}
            <div className="flex flex-wrap gap-2">
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Material (e.g. Concrete)"
                className="flex-1 min-w-[140px] rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
              />
              <input
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                placeholder="Qty"
                className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
              />
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            {/* Invoice upload + actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                ref={invoiceRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setNewInvoice(await uploadInvoice(file));
                  if (invoiceRef.current) invoiceRef.current.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => invoiceRef.current?.click()}
                disabled={uploading}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                  newInvoice
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-dashed border-slate-300 text-slate-500 hover:border-aeromine-400 hover:text-aeromine-600"
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                {uploading ? "Uploading…" : newInvoice ? "Invoice attached ✓" : "Attach invoice PDF"}
              </button>
              {newInvoice && (
                <button type="button" onClick={() => setNewInvoice(null)} className="text-slate-400 hover:text-red-400 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setNewDesc(""); setNewQty(""); setNewInvoice(null); }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addMaterial}
                  disabled={!newDesc.trim() || !newQty.trim() || saving !== null || uploading}
                  className="rounded-lg bg-aeromine-600 text-slate-900 px-3 py-1.5 text-xs font-medium hover:bg-aeromine-700 disabled:opacity-40 transition-colors"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stages that have materials */}
        {stagesWithMaterials.length === 0 && !showForm && (
          <p className="text-sm text-slate-400 py-2">
            {readOnly ? "No materials logged yet." : "No materials logged yet. Click Add Material to start."}
          </p>
        )}

        {stagesWithMaterials.map((stage) => {
          const materials = parseMaterials(stage.materials);
          const isOpen    = expanded === stage.id;

          return (
            <div key={stage.id} className="rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : stage.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
              >
                <span className="text-sm font-medium text-slate-700">{stage.nameEn}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-aeromine-100 text-aeromine-700 text-[10px] font-semibold px-2 py-0.5">
                    {materials.length}
                  </span>
                  {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  }
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {materials.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-white">
                      <span className="flex-1 text-xs font-medium text-slate-700 truncate">{m.description}</span>
                      <span className="text-xs text-slate-500 flex-shrink-0">{m.quantity} {m.unit}</span>
                      {m.invoiceUrl ? (
                        <a
                          href={m.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-md bg-aeromine-50 border border-aeromine-200 px-2 py-0.5 text-[10px] text-aeromine-700 hover:bg-aeromine-100 transition-colors flex-shrink-0"
                        >
                          <Download className="h-2.5 w-2.5" />
                          Invoice
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-300 flex-shrink-0 w-14 text-right">—</span>
                      )}
                      {!readOnly && (
                        <button
                          onClick={() => deleteMaterial(stage, i)}
                          disabled={saving === stage.id}
                          className="text-slate-300 hover:text-red-400 transition-colors disabled:opacity-40 flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
