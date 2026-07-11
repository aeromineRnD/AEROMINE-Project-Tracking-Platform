"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { Send, MessageSquare, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/lib/i18n/LanguageContext";
import type { ProjectMessage } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

interface Props {
  projectId: string;
  currentUserId: string;
  currentUserRole: string;
  contactEnabled: boolean;
  isAdmin?: boolean;
  onContactToggle?: (enabled: boolean) => void;
}

export function ProjectMessageThread({
  projectId,
  currentUserId,
  currentUserRole,
  contactEnabled,
  isAdmin = false,
  onContactToggle,
}: Props) {
  const t = useT();
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: messages, mutate } = useSWR<ProjectMessage[]>(
    contactEnabled || isAdmin ? `/api/projects/${projectId}/messages` : null,
    fetcher,
    { refreshInterval: 15000 },
  );

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function toggleContact() {
    setToggling(true);
    const res = await fetch(`/api/projects/${projectId}/contact`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactEnabled: !contactEnabled }),
    });
    setToggling(false);
    if (res.ok) onContactToggle?.(!contactEnabled);
  }

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    const res = await fetch(`/api/projects/${projectId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    });
    setSending(false);
    if (res.ok) {
      setText("");
      mutate();
    }
  }

  if (!contactEnabled && !isAdmin) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-aeromine-600" />
            {t("contactForm")}
          </CardTitle>
          {isAdmin && (
            <button
              onClick={toggleContact}
              disabled={toggling}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-aeromine-600 transition-colors disabled:opacity-50"
            >
              {contactEnabled
                ? <><ToggleRight className="h-4 w-4 text-aeromine-600" />{t("disableContact")}</>
                : <><ToggleLeft className="h-4 w-4" />{t("enableContact")}</>
              }
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        {!contactEnabled && isAdmin && (
          <p className="text-sm text-slate-400 py-1">{t("contactDisabled")}</p>
        )}

        {(contactEnabled || isAdmin) && (
          <>
            {/* Message history */}
            <div ref={listRef} className="rounded-lg border border-slate-100 bg-slate-50 max-h-72 overflow-y-auto p-3 space-y-2.5">
              {!messages || messages.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">{t("noMessagesYet")}</p>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.authorId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-snug ${
                          isMine
                            ? "bg-aeromine-600 text-slate-900 rounded-br-sm"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-slate-400 px-1">
                        {msg.author.name} · {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={t("messagePlaceholder")}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aeromine-500"
              />
              <button
                onClick={sendMessage}
                disabled={!text.trim() || sending}
                className="flex items-center gap-1.5 rounded-lg bg-aeromine-600 hover:bg-aeromine-700 text-slate-900 px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                {sending ? t("sending") : t("sendMessage")}
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
