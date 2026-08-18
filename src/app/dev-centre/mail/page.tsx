"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, Clock3, Inbox, LayoutGrid, Mail, Plus, Send, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useDevCentreStore } from "@/lib/dev-centre-store";
import { cn } from "@/lib/utils";

type MailStatus = "Delivered" | "Queued" | "Pending" | "Read";
type MailDirection = "inbound" | "outbound";

type MailItem = {
  id: string;
  direction: MailDirection;
  sender: string;
  recipient: string;
  subject: string;
  preview: string;
  body: string;
  status: MailStatus;
  domain: string;
  createdAt: string;
};

const defaultMessages: MailItem[] = [
  {
    id: "mail-1",
    direction: "inbound",
    sender: "support@acmebuild.io",
    recipient: "hello@xakteir.dev",
    subject: "Welcome to the new Xakteir workspace",
    preview: "We've just completed the migration and the production workspace is ready for review.",
    body: "Hi team,\n\nWe've just completed the migration and the production workspace is ready for review. Please confirm the custom domain and SMTP routing are correct before launch.\n\nThanks,\nSupport",
    status: "Read",
    domain: "xakteir.dev",
    createdAt: "2026-08-18T09:12:00.000Z",
  },
  {
    id: "mail-2",
    direction: "outbound",
    sender: "hello@xakteir.dev",
    recipient: "team@acmebuild.io",
    subject: "Deployment checklist",
    preview: "The build is healthy. Please review the release notes and confirm the final sign-off.",
    body: "The build is healthy. Please review the release notes and confirm the final sign-off.\n\nRegards,\nXakteir Dev Mail",
    status: "Delivered",
    domain: "xakteir.dev",
    createdAt: "2026-08-18T08:43:00.000Z",
  },
  {
    id: "mail-3",
    direction: "inbound",
    sender: "billing@cloudinvoice.net",
    recipient: "billing@hello.acmebuild.io",
    subject: "Invoice received",
    preview: "Your invoice for the Q3 plan is attached and scheduled for payment on Friday.",
    body: "Your invoice for the Q3 plan is attached and scheduled for payment on Friday.\n\nPlease reach out if you need the updated domain verification record.",
    status: "Pending",
    domain: "hello.acmebuild.io",
    createdAt: "2026-08-18T07:04:00.000Z",
  },
];

export default function DevMailPage() {
  const { activeProjectId } = useDevCentreStore();
  const { toast } = useToast();

  const storageKey = useMemo(() => (activeProjectId ? `xakteir-dev-mail-${activeProjectId}` : "xakteir-dev-mail-demo"), [activeProjectId]);

  const [messages, setMessages] = useState<MailItem[]>(defaultMessages);
  const [selectedId, setSelectedId] = useState<string>(defaultMessages[0].id);
  const [composeTo, setComposeTo] = useState("team@acmebuild.io");
  const [composeSubject, setComposeSubject] = useState("Project launch update");
  const [composeBody, setComposeBody] = useState("Hi there,\n\nThe production launch is locked and the domain routing is healthy. Please confirm release notes before we push the final announcement.\n\nThanks,\nXakteir Dev");
  const [composeFrom, setComposeFrom] = useState("hello@xakteir.dev");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        window.localStorage.setItem(storageKey, JSON.stringify(defaultMessages));
        return;
      }

      const parsed = JSON.parse(raw) as MailItem[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setMessages(parsed);
        setSelectedId(parsed[0].id);
      }
    } catch (error) {
      console.error("Error loading Xakteir Dev Mail state", error);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const selectedMessage = messages.find((message) => message.id === selectedId) ?? messages[0];

  const stats = useMemo(() => {
    const inbound = messages.filter((message) => message.direction === "inbound").length;
    const outbound = messages.filter((message) => message.direction === "outbound").length;
    const delivered = messages.filter((message) => message.status === "Delivered").length;
    const pending = messages.filter((message) => message.status === "Pending").length;

    return {
      inbound,
      outbound,
      delivered,
      pending,
    };
  }, [messages]);

  const handleSend = () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast({ variant: "destructive", title: "Message incomplete", description: "Add a recipient and subject before sending." });
      return;
    }

    const newMessage: MailItem = {
      id: `mail-${Date.now()}`,
      direction: "outbound",
      sender: composeFrom,
      recipient: composeTo,
      subject: composeSubject,
      preview: composeBody.trim().slice(0, 100),
      body: composeBody,
      status: "Queued",
      domain: composeFrom.split("@")[1] ?? "xakteir.dev",
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [newMessage, ...current]);
    setSelectedId(newMessage.id);
    setComposeBody("");
    setComposeSubject("");
    toast({ title: "Email queued", description: `A message was queued from ${composeFrom}.` });
  };

  const handleDelete = (id: string) => {
    const next = messages.filter((message) => message.id !== id);
    setMessages(next);
    if (selectedId === id) {
      setSelectedId(next[0]?.id ?? "");
    }
    toast({ title: "Email removed", description: "The message was removed from your mailbox." });
  };

  if (!activeProjectId) {
    return (
      <div className="space-y-8 pb-20">
        <header className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
            <Mail className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Mail infrastructure</p>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Mail</h1>
          </div>
        </header>

        <Card className="rounded-[2rem] border border-white/10 bg-black/40 p-12 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-900/60">
            <LayoutGrid className="h-10 w-10 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-300">No Project Selected</h2>
          <p className="mt-3 text-sm text-zinc-500">Select or create a project in the Dev Centre sidebar to enable mail routing.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shadow-[0_0_35px_rgba(59,130,246,0.25)]">
            <Mail className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Mail infrastructure</p>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Mail</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="rounded-2xl bg-sky-500 hover:bg-sky-400 px-4 py-3 text-xs font-black uppercase tracking-widest text-white">
            <Plus className="mr-2 h-4 w-4" /> Add domain
          </Button>
          <Button variant="outline" className="rounded-2xl border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-white">
            <ShieldCheck className="mr-2 h-4 w-4" /> Verify DNS
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Inbound", value: stats.inbound, accent: "text-sky-400", icon: Inbox },
          { label: "Outbound", value: stats.outbound, accent: "text-violet-400", icon: Send },
          { label: "Delivered", value: stats.delivered, accent: "text-emerald-400", icon: CheckCircle2 },
          { label: "Pending", value: stats.pending, accent: "text-amber-400", icon: Clock3 },
        ].map(({ label, value, accent, icon: Icon }) => (
          <Card key={label} className="rounded-[2rem] border border-white/10 bg-black/40 p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">{label}</span>
              <Icon className={cn("h-5 w-5", accent)} />
            </div>
            <div className={cn("mt-6 text-3xl font-black tracking-tighter text-white", accent)}>{value}</div>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_2fr]">
        <Card className="rounded-[2rem] border border-white/10 bg-black/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Inbox</p>
              <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white">Recent activity</h2>
            </div>
            <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-300">Live</Badge>
          </div>

          <div className="space-y-3">
            {messages.map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => setSelectedId(message.id)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-all",
                  selectedMessage?.id === message.id
                    ? "border-sky-500/40 bg-sky-500/10"
                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex h-2.5 w-2.5 rounded-full", message.direction === "inbound" ? "bg-emerald-400" : "bg-violet-400")} />
                    <span className="text-sm font-black uppercase tracking-wider text-white">{message.direction === "inbound" ? "Inbound" : "Outbound"}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{message.status}</span>
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-white">{message.subject}</div>
                  <div className="mt-1 text-xs text-zinc-400">{message.direction === "inbound" ? message.sender : message.recipient}</div>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{message.preview}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-white/10 bg-black/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Message</p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white">{selectedMessage?.subject}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => selectedMessage && handleDelete(selectedMessage.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {selectedMessage ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-300">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
                    <span>{selectedMessage.direction === "inbound" ? "From" : "To"}</span>
                    <span className="text-white">{selectedMessage.direction === "inbound" ? selectedMessage.sender : selectedMessage.recipient}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Domain</span>
                    <span className="font-bold text-sky-300">{selectedMessage.domain}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Status</span>
                    <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-300">{selectedMessage.status}</Badge>
                  </div>
                </div>

                <div className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#070b14] p-4 text-sm leading-7 text-zinc-200">
                  {selectedMessage.body}
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">Select an email to preview it here.</div>
            )}
          </Card>

          <Card className="rounded-[2rem] border border-white/10 bg-black/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Compose</p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white">New message</h2>
              </div>
              <Sparkles className="h-5 w-5 text-violet-400" />
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                <input
                  value={composeTo}
                  onChange={(event) => setComposeTo(event.target.value)}
                  placeholder="recipient@example.com"
                  className="h-12 rounded-2xl border border-white/10 bg-[#090d16] px-4 text-sm text-white outline-none ring-0 placeholder:text-zinc-500"
                />
                <select
                  value={composeFrom}
                  onChange={(event) => setComposeFrom(event.target.value)}
                  className="h-12 rounded-2xl border border-white/10 bg-[#090d16] px-4 text-sm text-white outline-none"
                >
                  <option value="hello@xakteir.dev">hello@xakteir.dev</option>
                  <option value="team@hello.acmebuild.io">team@hello.acmebuild.io</option>
                </select>
              </div>

              <input
                value={composeSubject}
                onChange={(event) => setComposeSubject(event.target.value)}
                placeholder="Subject"
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#090d16] px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />

              <textarea
                value={composeBody}
                onChange={(event) => setComposeBody(event.target.value)}
                rows={8}
                placeholder="Write your message..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-[#090d16] p-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Resend ready
                </div>
                <Button onClick={handleSend} className="rounded-2xl bg-violet-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-violet-400">
                  <Send className="mr-2 h-4 w-4" /> Send
                </Button>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border border-white/10 bg-black/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Domains</p>
                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-white">DNS & delivery</h2>
              </div>
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Healthy</Badge>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-black uppercase tracking-widest text-white">xakteir.dev</div>
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Active</Badge>
                </div>

                <div className="mt-3 space-y-2 text-sm text-zinc-400">
                  <div className="flex items-center justify-between gap-4">
                    <span>MX</span>
                    <span className="font-mono text-xs text-zinc-200">10 routing.cloudflare.net</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>SPF</span>
                    <span className="font-mono text-xs text-zinc-200">v=spf1 include:resend.net ~all</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>DKIM</span>
                    <span className="font-mono text-xs text-zinc-200">dkim._domainkey.xakteir.dev -> dkim.resend.com</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
