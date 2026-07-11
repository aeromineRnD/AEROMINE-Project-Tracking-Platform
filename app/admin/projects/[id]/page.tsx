"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Edit, Trash2, Plus, Box, Check, X, Paperclip, FileText, Image as ImageIcon, Video, Camera, Building2, LayoutGrid, Globe } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedProgress } from "@/components/ui/AnimatedProgress";
import { StageProgressChartDynamic as StageProgressChart } from "@/components/charts/StageProgressChartDynamic";
import { UpdateFeed } from "@/components/updates/UpdateFeed";
import { MilestoneTracker } from "@/components/milestones/MilestoneTracker";
import { ModelViewerClient as ModelViewer } from "@/components/viewer/ModelViewerClient";
import { PhasePhotoGallery } from "@/components/viewer/PhasePhotoGallery";
import { TourViewer } from "@/components/viewer/TourViewer";
import { StageMaterialsCard } from "@/components/stages/StageMaterialsCard";
import { ProjectMessageThread } from "@/components/messaging/ProjectMessageThread";
import { useProject } from "@/lib/hooks/useProjects";
import { useT, useLanguage } from "@/lib/i18n/LanguageContext";
import { calcOverallProgress, STATUS_LABELS, type Project, type Phase, type Stage, type ProjectUpdate } from "@/types";
import { uploadFile } from "@/lib/uploadFile";
import { DatePicker } from "@/components/ui/DatePicker";

export default function AdminProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { project: swrProject, isLoading, mutate } = useProject(id);
  const t = useT();
  const { locale } = useLanguage();
  const [project, setProject]             = useState<Project | null>(null);
  const [contactEnabled, setContactEnabled] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [activeCategory, setActiveCategory] = useState<"EXTERIOR" | "INTERIOR">("EXTERIOR");
  const [postTitle, setPostTitle]         = useState("");
  const [postContent, setPostContent]     = useState("");
  const [posting, setPosting]             = useState(false);
  const [attachments, setAttachments]     = useState<{ name: string; url: string; type: string }[]>([]);
  const [uploading, setUploading]         = useState(false);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  // Milestone add form
  const [msTitle, setMsTitle]       = useState("");
  const [msDueDate, setMsDueDate]   = useState("");
  const [msDesc, setMsDesc]         = useState("");
  const [msStageId, setMsStageId]   = useState("");
  const [showMsForm, setShowMsForm] = useState(false);
  const [addingMs, setAddingMs]     = useState(false);

  // Add 3D phase form
  const [phaseName, setPhaseName]         = useState("Phase 1");
  const [phaseCapturedAt, setPhaseCapturedAt] = useState(new Date().toISOString().split("T")[0]);
  const [phaseModelPath, setPhaseModelPath]   = useState("");
  const [phaseTourUrl, setPhaseTourUrl]       = useState("");
  const [addingPhase, setAddingPhase]         = useState(false);

  // Edit phase inline
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editPhaseName, setEditPhaseName]   = useState("");
  const [editPhaseDate, setEditPhaseDate]   = useState("");
  const [editPhaseModel, setEditPhaseModel] = useState("");
  const [editPhaseTour, setEditPhaseTour]   = useState("");
  const [editPhasePhotos, setEditPhasePhotos] = useState<string[]>([]);
  const [savingPhase, setSavingPhase]       = useState(false);

  // Phase photo upload (shared for add + edit)
  const [phasePhotos, setPhasePhotos]           = useState<string[]>([]);
  const [uploadingPhasePhoto, setUploadingPhasePhoto] = useState(false);
  const phasePhotoRef     = useRef<HTMLInputElement>(null);
  const editPhasePhotoRef = useRef<HTMLInputElement>(null);

  // Viewer mode toggle (photos / 3D model / 360° tour, per selected phase)
  const [viewerMode, setViewerMode] = useState<"photos" | "3d" | "360">("photos");

  // Hydrate local state from SWR on first load
  useEffect(() => {
    if (swrProject && !project) {
      setProject(swrProject);
      setContactEnabled(swrProject.contactEnabled ?? true);
    }
  }, [swrProject]);

  // When the active group changes (or the project first loads), select the
  // latest phase in that group and reset the "next phase" name accordingly.
  useEffect(() => {
    if (!project) return;
    const inGroup = (project.phases ?? [])
      .filter((p) => (p.category ?? "EXTERIOR") === activeCategory)
      .sort((a, b) => a.order - b.order);
    setSelectedPhase(inGroup.length > 0 ? inGroup[inGroup.length - 1] : null);
    setPhaseName(`Phase ${inGroup.length + 1}`);
  }, [activeCategory, project?.id]);

  useEffect(() => {
    if (selectedPhase) {
      const photos: string[] = selectedPhase.photoUrls ? JSON.parse(selectedPhase.photoUrls) : [];
      setViewerMode(
        photos.length > 0 ? "photos"
        : selectedPhase.modelPath ? "3d"
        : selectedPhase.tourUrl ? "360"
        : "3d"
      );
    }
  }, [selectedPhase?.id]);

  async function uploadPhasePhotos(
    files: FileList | null,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) {
    if (!files?.length) return;
    setUploadingPhasePhoto(true);
    for (const file of Array.from(files)) {
      try {
        const url = await uploadFile(file, "phases");
        setter((prev) => [...prev, url]);
      } catch {
        // skip failed file
      }
    }
    if (inputRef.current) inputRef.current.value = "";
    setUploadingPhasePhoto(false);
  }

  async function updateStageProgress(stageId: string, progress: number) {
    await fetch(`/api/projects/${id}/stages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageId, progress }),
    });

    setProject((prev) => {
      if (!prev) return prev;
      const updatedStages = prev.stages!.map((s) =>
        s.id === stageId ? { ...s, progress } : s
      );
      const allDone = updatedStages.every((s) => s.progress === 100);
      const now = new Date().toISOString();

      // When project completes, mark all pending milestones as done instantly
      const updatedMilestones = allDone
        ? ((prev as any).milestones ?? []).map((m: any) =>
            m.completed ? m : { ...m, completed: true, completedAt: now }
          )
        : (prev as any).milestones;

      return {
        ...prev,
        stages: updatedStages,
        status: allDone ? "COMPLETED" : "IN_PROGRESS",
        milestones: updatedMilestones,
      };
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const url = await uploadFile(file, "updates");
        setAttachments((prev) => [...prev, { name: file.name, url, type: file.type }]);
      } catch {
        // skip failed file
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
  }

  async function postUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    setPosting(true);

    const hasVideo = attachments.some((a) => a.type.startsWith("video/"));
    const hasImage = attachments.some((a) => a.type.startsWith("image/"));
    const hasDoc   = attachments.some((a) => !a.type.startsWith("image/") && !a.type.startsWith("video/"));
    const type = hasVideo ? "VIDEO" : hasDoc ? "DOCUMENT" : hasImage ? "PHOTO" : "TEXT";

    const res = await fetch(`/api/projects/${id}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: postTitle,
        content: postContent,
        type,
        mediaUrls: attachments.length ? attachments.map((a) => a.url) : undefined,
      }),
    });
    if (res.ok) {
      const update = await res.json();
      setProject((prev) => prev ? { ...prev, updates: [update, ...(prev as any).updates ?? []] } : prev);
      setPostTitle(""); setPostContent(""); setAttachments([]);
    }
    setPosting(false);
  }

  async function deleteProject() {
    if (!confirm(t("deleteProjectConfirm"))) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/admin/projects");
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!msTitle.trim() || !msDueDate) return;
    setAddingMs(true);
    const res = await fetch(`/api/projects/${id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: msTitle, description: msDesc, dueDate: msDueDate, stageId: msStageId || null }),
    });
    if (res.ok) {
      const ms = await res.json();
      setProject((prev) => prev
        ? { ...prev, milestones: [...((prev as any).milestones ?? []), ms] }
        : prev
      );
      setMsTitle(""); setMsDueDate(""); setMsDesc(""); setMsStageId(""); setShowMsForm(false);
    }
    setAddingMs(false);
  }

  function startEditPhase(phase: Phase) {
    setEditingPhaseId(phase.id);
    setEditPhaseName(phase.name);
    setEditPhaseDate(new Date(phase.capturedAt).toISOString().split("T")[0]);
    setEditPhaseModel(phase.modelPath ?? "");
    setEditPhaseTour(phase.tourUrl ?? "");
    setEditPhasePhotos(phase.photoUrls ? JSON.parse(phase.photoUrls) : []);
  }

  async function savePhase(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPhaseId) return;
    setSavingPhase(true);
    const res = await fetch(`/api/projects/${id}/phases/${editingPhaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editPhaseName.trim(),
        capturedAt: editPhaseDate,
        modelPath: editPhaseModel.trim() || null,
        tourUrl: editPhaseTour.trim() || null,
        photoUrls: editPhasePhotos,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setProject((prev) => prev
        ? { ...prev, phases: (prev.phases ?? []).map((p) => p.id === editingPhaseId ? updated : p) }
        : prev
      );
      if (selectedPhase?.id === editingPhaseId) setSelectedPhase(updated);
      mutate();
    }
    setEditingPhaseId(null);
    setSavingPhase(false);
  }

  async function deletePhase(phaseId: string) {
    if (!confirm(t("deletePhaseConfirm"))) return;
    const res = await fetch(`/api/projects/${id}/phases/${phaseId}`, { method: "DELETE" });
    if (res.ok) {
      const deleted = (project?.phases ?? []).find((p) => p.id === phaseId);
      const cat = deleted?.category ?? "EXTERIOR";

      // Renumber the deleted phase's group consecutively (Phase 1, 2, …);
      // the other group is left untouched.
      const sameGroup = (project?.phases ?? [])
        .filter((p) => p.id !== phaseId && (p.category ?? "EXTERIOR") === cat)
        .sort((a, b) => a.order - b.order)
        .map((p, i) => ({ ...p, name: `Phase ${i + 1}`, order: i + 1 }));
      const otherGroup = (project?.phases ?? [])
        .filter((p) => p.id !== phaseId && (p.category ?? "EXTERIOR") !== cat);
      const remaining = [...otherGroup, ...sameGroup];

      if (sameGroup.length > 0) {
        await fetch(`/api/projects/${id}/phases`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sameGroup.map(({ id: pid, name, order }) => ({ id: pid, name, order }))),
        });
      }

      setProject((prev) => prev ? { ...prev, phases: remaining } : prev);
      if (selectedPhase?.id === phaseId) {
        setSelectedPhase(sameGroup.length > 0 ? sameGroup[sameGroup.length - 1] : null);
      }
      setPhaseName(`Phase ${sameGroup.length + 1}`);
      mutate();
    }
  }

  async function addPhase(e: React.FormEvent) {
    e.preventDefault();
    if (!phaseName.trim() || !phaseCapturedAt) return;

    const groupPhases = (project?.phases ?? []).filter(
      (p) => (p.category ?? "EXTERIOR") === activeCategory
    );
    const duplicate = groupPhases.some(
      (p) => p.name.trim().toLowerCase() === phaseName.trim().toLowerCase()
    );
    if (duplicate) {
      alert(`"${phaseName.trim()}" already exists. Please use a different name.`);
      return;
    }

    setAddingPhase(true);

    const currentStages = project?.stages ?? [];
    const overallProgress = calcOverallProgress(currentStages);
    const stageSnapshot = currentStages.map((s) => ({
      nameEn: s.nameEn, nameEl: s.nameEl, progress: s.progress,
    }));

    const res = await fetch(`/api/projects/${id}/phases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: phaseName.trim(),
        order: groupPhases.length + 1,
        capturedAt: phaseCapturedAt,
        overallProgress,
        category: activeCategory,
        modelPath: phaseModelPath.trim() || null,
        tourUrl: phaseTourUrl.trim() || null,
        photoUrls: phasePhotos,
        stageSnapshot,
      }),
    });

    if (res.ok) {
      const newPhase = await res.json();
      setProject((prev) => prev
        ? { ...prev, phases: [...(prev.phases ?? []), newPhase] }
        : prev
      );
      setSelectedPhase(newPhase);
      mutate();
      setPhaseName(`Phase ${groupPhases.length + 2}`); // +2: +1 for the one just added, +1 for the next
      setPhaseCapturedAt(new Date().toISOString().split("T")[0]);
      setPhaseModelPath("");
      setPhaseTourUrl("");
      setPhasePhotos([]);
    }
    setAddingPhase(false);
  }

  if (isLoading || !project) return <div className="text-sm text-slate-400">{t("loading")}</div>;

  const stages: Stage[]         = project.stages ?? [];
  const phases: Phase[]         = project.phases ?? [];
  const visiblePhases: Phase[]  = phases
    .filter((p) => (p.category ?? "EXTERIOR") === activeCategory)
    .sort((a, b) => a.order - b.order);
  const updates: ProjectUpdate[] = (project as any).updates ?? [];
  const milestones               = (project as any).milestones ?? [];
  const overall                  = calcOverallProgress(stages);
  const statusInfo               = STATUS_LABELS[project.status];

  const categoryToggle = (
    <div className="flex items-center gap-1.5">
      {(["EXTERIOR", "INTERIOR"] as const).map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => setActiveCategory(cat)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
            activeCategory === cat
              ? "bg-aeromine-600 text-slate-900 border-aeromine-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:border-aeromine-400 hover:text-aeromine-600"
          }`}
        >
          {cat === "EXTERIOR" ? <Building2 className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
          {cat === "EXTERIOR" ? t("exterior") : t("interior")}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/projects">
            <button className="mt-1 text-slate-400 hover:text-slate-700"><ArrowLeft className="h-5 w-5" /></button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <Badge variant={project.status === "IN_PROGRESS" ? "inprogress" : project.status === "COMPLETED" ? "completed" : "delayed"}>
                {statusInfo[locale]}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>📍 {project.location}</span>
              <span>📅 {t("started", { date: format(new Date(project.startDate), "MMM d, yyyy") })}</span>
              <span>🎯 {t("target", { date: format(new Date(project.estimatedEnd), "MMM d, yyyy") })}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/projects/${id}/edit`}>
            <Button variant="outline" size="sm"><Edit className="h-4 w-4" /> Edit</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={deleteProject} className="text-red-500 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 3D Viewer — or Add Phase form if the active group has no phases yet */}
      {visiblePhases.length === 0 ? (
        <Card>
          <CardHeader className="border-b space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5 text-aeromine-400" />
                <CardTitle className="text-base">{t("threeConstructionModel")}</CardTitle>
              </div>
              {categoryToggle}
            </div>
          </CardHeader>
          <CardContent className="py-6">
            <form onSubmit={addPhase} className="space-y-3 max-w-md">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("phaseName")}</label>
                  <input
                    value={phaseName}
                    onChange={(e) => setPhaseName(e.target.value)}
                    required
                    placeholder="Phase 1"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{t("captureDate")}</label>
                  <DatePicker
                    value={phaseCapturedAt}
                    onChange={(v) => setPhaseCapturedAt(v ?? "")}
                    className="w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t("modelPath")} <span className="text-slate-400 font-normal">(e.g. /models/Phase_1/scene.gltf)</span>
                </label>
                <input
                  value={phaseModelPath}
                  onChange={(e) => setPhaseModelPath(e.target.value)}
                  placeholder="/models/Phase_1/scene.gltf"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t("tourWalkthrough")} <span className="text-slate-400 font-normal">(Panoee)</span>
                </label>
                <input
                  value={phaseTourUrl}
                  onChange={(e) => setPhaseTourUrl(e.target.value)}
                  placeholder="https://tour.panoee.net/iframe/…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Photos</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {phasePhotos.map((url, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img src={url} alt="" className="h-10 w-14 object-cover rounded border border-slate-200" />
                      <button type="button" onClick={() => setPhasePhotos((p) => p.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-red-500 text-white">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                  <input ref={phasePhotoRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => uploadPhasePhotos(e.target.files, setPhasePhotos, phasePhotoRef)} />
                  <button type="button" onClick={() => phasePhotoRef.current?.click()}
                    disabled={uploadingPhasePhoto}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 hover:border-aeromine-400 hover:text-aeromine-600 disabled:opacity-50 transition-colors">
                    <Camera className="h-4 w-4" />
                    {uploadingPhasePhoto ? "Uploading…" : "Add photos"}
                  </button>
                </div>
              </div>
              <Button type="submit" size="sm" disabled={addingPhase || uploadingPhasePhoto}>
                {addingPhase ? t("adding") : t("addPhase")}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 border-b space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base">{t("threeConstructionModel")}</CardTitle>
              {categoryToggle}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">{t("viewPhase")}</span>
              {visiblePhases.map((phase) =>
                  editingPhaseId === phase.id ? (
                    <form key={phase.id} onSubmit={savePhase} className="flex items-center gap-1.5 flex-wrap">
                      <input
                        value={editPhaseName}
                        onChange={(e) => setEditPhaseName(e.target.value)}
                        required
                        className="rounded-lg border border-aeromine-300 px-2 py-1 text-xs w-24 focus:outline-none focus:ring-2 focus:ring-aeromine-500"
                      />
                      <DatePicker
                        value={editPhaseDate}
                        onChange={(v) => setEditPhaseDate(v ?? "")}
                      />
                      <input
                        value={editPhaseModel}
                        onChange={(e) => setEditPhaseModel(e.target.value)}
                        placeholder="/models/…/scene.gltf"
                        className="rounded-lg border border-aeromine-300 px-2 py-1 text-xs font-mono w-48 focus:outline-none focus:ring-2 focus:ring-aeromine-500"
                      />
                      <input
                        value={editPhaseTour}
                        onChange={(e) => setEditPhaseTour(e.target.value)}
                        placeholder="Panoee 360° link"
                        title={t("tourWalkthrough")}
                        className="rounded-lg border border-aeromine-300 px-2 py-1 text-xs font-mono w-40 focus:outline-none focus:ring-2 focus:ring-aeromine-500"
                      />
                      {/* Photo thumbnails */}
                      {editPhasePhotos.map((url, i) => (
                        <div key={i} className="relative flex-shrink-0">
                          <img src={url} alt="" className="h-7 w-10 object-cover rounded border border-slate-200" />
                          <button type="button" onClick={() => setEditPhasePhotos((p) => p.filter((_, j) => j !== i))}
                            className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-red-500 text-white">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                      <input ref={editPhasePhotoRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={(e) => uploadPhasePhotos(e.target.files, setEditPhasePhotos, editPhasePhotoRef)} />
                      <button type="button" onClick={() => editPhasePhotoRef.current?.click()}
                        disabled={uploadingPhasePhoto}
                        className="h-6 px-2 flex items-center gap-1 rounded-md border border-slate-200 text-slate-400 hover:text-aeromine-600 hover:border-aeromine-400 disabled:opacity-50 transition-colors text-[10px]">
                        <Camera className="h-3 w-3" />
                      </button>
                      <button type="submit" disabled={savingPhase} className="h-6 w-6 flex items-center justify-center rounded-md bg-aeromine-600 text-slate-900 hover:bg-aeromine-700 disabled:opacity-50">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setEditingPhaseId(null)} className="h-6 w-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-slate-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <div key={phase.id} className="flex items-center gap-0.5">
                      <button
                        onClick={() => setSelectedPhase(phase)}
                        className={`rounded-l-lg px-3 py-1.5 text-xs font-semibold transition-all border-y border-l ${
                          selectedPhase?.id === phase.id
                            ? "bg-aeromine-600 text-slate-900 border-aeromine-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:border-aeromine-400 hover:text-aeromine-600"
                        }`}
                      >
                        {phase.name}
                      </button>
                      <button
                        onClick={() => startEditPhase(phase)}
                        title="Edit phase"
                        className="px-1.5 py-1.5 border-y border-slate-200 text-slate-400 hover:text-aeromine-600 hover:bg-aeromine-50 transition-colors text-xs"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deletePhase(phase.id)}
                        title="Delete phase"
                        className="px-1.5 py-1.5 rounded-r-lg border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors text-xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )
                )}
            </div>
            {selectedPhase && (
              <p className="text-xs text-slate-400 mt-0.5">
                Drone capture: {format(new Date(selectedPhase.capturedAt), "MMMM d, yyyy")}
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {(() => {
              const photos: string[] = selectedPhase?.photoUrls ? JSON.parse(selectedPhase.photoUrls) : [];
              const modes = ([
                ["photos", photos.length > 0],
                ["3d", !!selectedPhase?.modelPath],
                ["360", !!selectedPhase?.tourUrl],
              ] as const).filter(([, ok]) => ok).map(([m]) => m);
              const mode = modes.includes(viewerMode) ? viewerMode : (modes[0] ?? "3d");

              return (
                <>
                  {modes.length > 1 && (
                    <div className="flex gap-1 px-4 pt-3">
                      {modes.map((m) => (
                        <button
                          key={m}
                          onClick={() => setViewerMode(m)}
                          className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold border transition-colors ${
                            mode === m
                              ? "bg-aeromine-600 text-slate-900 border-aeromine-600"
                              : "bg-white text-slate-600 border-slate-200 hover:border-aeromine-400"
                          }`}
                        >
                          {m === "360" && <Globe className="h-3.5 w-3.5" />}
                          {m === "photos" ? "Photos" : m === "3d" ? "3D Model" : t("tourWalkthrough")}
                        </button>
                      ))}
                    </div>
                  )}
                  {mode === "360" && selectedPhase?.tourUrl ? (
                    <TourViewer url={selectedPhase.tourUrl} />
                  ) : mode === "photos" ? (
                    <PhasePhotoGallery photos={photos} />
                  ) : (
                    <ModelViewer stages={stages} modelUrl={selectedPhase?.modelPath ?? null} />
                  )}
                </>
              );
            })()}
          </CardContent>
          {/* Add another phase form */}
          <div className="border-t px-5 py-4 bg-slate-50">
            <form onSubmit={addPhase} className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t("newPhaseName")}</label>
                <input
                  value={phaseName}
                  onChange={(e) => setPhaseName(e.target.value)}
                  required
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 w-32"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t("captureDate")}</label>
                <DatePicker
                  value={phaseCapturedAt}
                  onChange={(v) => setPhaseCapturedAt(v ?? "")}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-600 mb-1">{t("modelPath")}</label>
                <input
                  value={phaseModelPath}
                  onChange={(e) => setPhaseModelPath(e.target.value)}
                  placeholder="/models/Phase_2/scene.gltf"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 font-mono"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-600 mb-1">{t("tourWalkthrough")}</label>
                <input
                  value={phaseTourUrl}
                  onChange={(e) => setPhaseTourUrl(e.target.value)}
                  placeholder="https://tour.panoee.net/iframe/…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Photos</label>
                <div className="flex items-center gap-1.5">
                  {phasePhotos.map((url, i) => (
                    <div key={i} className="relative flex-shrink-0">
                      <img src={url} alt="" className="h-8 w-11 object-cover rounded border border-slate-200" />
                      <button type="button" onClick={() => setPhasePhotos((p) => p.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center rounded-full bg-red-500 text-white">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                  <input ref={phasePhotoRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => uploadPhasePhotos(e.target.files, setPhasePhotos, phasePhotoRef)} />
                  <button type="button" onClick={() => phasePhotoRef.current?.click()}
                    disabled={uploadingPhasePhoto}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:border-aeromine-400 hover:text-aeromine-600 disabled:opacity-50 transition-colors">
                    <Camera className="h-3.5 w-3.5" />
                    {uploadingPhasePhoto ? "Uploading…" : "Add photos"}
                  </button>
                </div>
              </div>
              <Button type="submit" size="sm" disabled={addingPhase || uploadingPhasePhoto}>
                {addingPhase ? t("adding") : t("addPhase")}
              </Button>
            </form>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stage Progress + sliders */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("stageProgress")}</CardTitle></CardHeader>
            <CardContent>
              <StageProgressChart stages={stages} />
              <div className="mt-6 space-y-3 border-t pt-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t("updateStageProgress")}</p>
                {stages.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="w-40 flex-shrink-0 truncate text-xs text-slate-600">{s.nameEn}</span>
                    <AnimatedProgress value={s.progress} className="flex-1 h-2.5" />
                    <input
                      key={`${s.id}-${s.progress}`}
                      type="number"
                      min={0} max={100}
                      defaultValue={s.progress}
                      onBlur={(e) => {
                        const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        if (v !== s.progress) updateStageProgress(s.id, v);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-aeromine-500"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Overall Completion */}
          <Card>
            <CardHeader><CardTitle>{t("overallCompletion")}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">Progress</span>
                <span className="font-semibold text-slate-900">{overall}%</span>
              </div>
              <AnimatedProgress value={overall} className="h-3" />
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>{t("started", { date: format(new Date(project.startDate), "MMM d, yyyy") })}</span>
                <span>{t("target", { date: format(new Date(project.estimatedEnd), "MMM d, yyyy") })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Materials & Invoices */}
          <StageMaterialsCard
            stages={stages}
            projectId={id}
            onUpdate={(stageId, materials) => {
              setProject((prev) => prev
                ? { ...prev, stages: (prev.stages ?? []).map((s) =>
                    s.id === stageId ? { ...s, materials: JSON.stringify(materials) } : s
                  )}
                : prev
              );
            }}
          />

          {/* Post Update */}
          <Card>
            <CardHeader><CardTitle>{t("postAnUpdate")}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={postUpdate} className="space-y-3">
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
                  placeholder={t("updateTitlePlaceholder")}
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 resize-none"
                  placeholder={t("describeProgress")}
                  rows={3}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />

                {/* Attachments */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.ppt,.pptx,.doc,.docx,video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((a, i) => {
                      const isImage = a.type.startsWith("image/");
                      const isVideo = a.type.startsWith("video/");
                      const Icon = isImage ? ImageIcon : isVideo ? Video : FileText;
                      return (
                        <div key={i} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 pl-2 pr-1 py-1 text-xs text-slate-700 max-w-[180px]">
                          <Icon className="h-3.5 w-3.5 flex-shrink-0 text-aeromine-500" />
                          <span className="truncate flex-1">{a.name}</span>
                          <button
                            type="button"
                            onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                            className="flex-shrink-0 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" disabled={posting || uploading}>
                    <Plus className="h-4 w-4" /> {posting ? t("posting") : t("postUpdate")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-aeromine-400 hover:text-aeromine-600 disabled:opacity-50 transition-colors"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    {uploading ? t("uploading") : t("attachFiles")}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("projectUpdates")}</CardTitle></CardHeader>
            <CardContent><UpdateFeed updates={updates} /></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("milestones")}</CardTitle>
                <button
                  onClick={() => setShowMsForm((v) => !v)}
                  className="text-xs text-aeromine-600 hover:text-aeromine-800 font-medium transition-colors"
                >
                  {showMsForm ? t("cancel") : t("add")}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Prominent prompt when no milestones yet */}
              {milestones.length === 0 && !showMsForm && (
                <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center">
                  <p className="text-sm text-slate-500 mb-2">{t("noMilestonesYet")}</p>
                  <button
                    onClick={() => setShowMsForm(true)}
                    className="text-xs font-semibold text-aeromine-600 hover:text-aeromine-800 transition-colors"
                  >
                    {t("addFirstMilestone")}
                  </button>
                </div>
              )}

              {/* Inline add form */}
              {showMsForm && (
                <form onSubmit={addMilestone} className="space-y-2 rounded-lg border border-aeromine-200 bg-aeromine-50 p-3">
                  <input
                    required
                    placeholder={t("milestoneTitle")}
                    value={msTitle}
                    onChange={(e) => setMsTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 bg-white"
                  />
                  <DatePicker
                    value={msDueDate}
                    onChange={(v) => setMsDueDate(v ?? "")}
                    className="w-full"
                  />
                  {/* Stage link — auto-completes milestone when stage hits 100% */}
                  <select
                    value={msStageId}
                    onChange={(e) => setMsStageId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 bg-white"
                  >
                    <option value="">{t("noStageLinkOption")}</option>
                    {stages.map((s) => (
                      <option key={s.id} value={s.id}>{s.nameEn}</option>
                    ))}
                  </select>
                  <textarea
                    placeholder={t("descriptionOptional")}
                    value={msDesc}
                    onChange={(e) => setMsDesc(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500 bg-white resize-none"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={addingMs}>
                      {addingMs ? t("saving") : t("saveMilestone")}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowMsForm(false)}>
                      {t("cancel")}
                    </Button>
                  </div>
                </form>
              )}

              <MilestoneTracker milestones={milestones} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("assignedClients")}</CardTitle></CardHeader>
            <CardContent>
              {(project.clients ?? []).length === 0 ? (
                <p className="text-sm text-slate-400">{t("noClientsAssigned")}</p>
              ) : (
                <div className="space-y-2">
                  {(project.clients ?? []).map((c: any) => (
                    <div key={c.client.id} className="flex items-center gap-2 text-sm">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aeromine-100 text-aeromine-700 text-xs font-semibold">
                        {c.client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{c.client.name}</p>
                        <p className="text-xs text-slate-400">{c.client.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {session?.user?.id && (
            <ProjectMessageThread
              projectId={id}
              currentUserId={session.user.id}
              currentUserRole="ADMIN"
              contactEnabled={contactEnabled}
              isAdmin
              onContactToggle={setContactEnabled}
            />
          )}
        </div>
      </div>
    </div>
  );
}
