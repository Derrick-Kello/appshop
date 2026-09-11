"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";

interface AgentPromptCardProps {
  promptContent: string;
}

export function AgentPromptCard({ promptContent }: AgentPromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = promptContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-surface-container-low to-surface-container p-6 sm:p-8 shadow-sm relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                  AI Agent Setup Prompt (<code className="text-primary font-mono text-xs sm:text-sm">prompt.md</code>)
                </h2>
                <span className="bg-primary-container text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Ready to copy
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
                Give this prompt directly to your AI agent (Cursor, Claude Code, Antigravity, Copilot, or ChatGPT) in your repository. It will automatically organize your artwork folders, icons, screenshot gallery, and release asset naming schemes.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(0,74,198,0.25)] active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-4 w-4 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="h-4 w-4" />
                  <span>Copy prompt.md</span>
                </>
              )}
            </button>

            <a
              href="/prompt.md"
              download="appshop-prompt.md"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-container-highest/80 hover:bg-surface-container-highest text-on-surface font-semibold text-xs transition-all border border-line/60 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* Code Snippet Box with Toggle */}
        <div className="rounded-xl border border-line/80 bg-surface-container-lowest overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2 bg-surface-container border-b border-line/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              <span className="text-[11px] font-mono text-muted ml-2">prompt.md</span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{expanded ? "Collapse preview" : "View full prompt"}</span>
              <span className="material-symbols-outlined text-[14px]">
                {expanded ? "expand_less" : "expand_more"}
              </span>
            </button>
          </div>

          <div
            className={`p-4 font-mono text-xs text-on-surface-variant leading-relaxed overflow-x-auto whitespace-pre-wrap transition-all ${
              expanded ? "max-h-[500px] overflow-y-auto" : "max-h-[160px] overflow-hidden relative"
            }`}
          >
            {promptContent}
            {!expanded && (
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-container-lowest to-transparent pointer-events-none flex items-end justify-center pb-2">
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="pointer-events-auto text-[11px] font-bold text-primary bg-surface-container px-3 py-1 rounded-full shadow-sm hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Click to expand full prompt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low/60 border border-line/40">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <p className="text-xs text-on-surface-variant leading-5">
              Click <strong>Copy prompt.md</strong> above to copy the instructions.
            </p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low/60 border border-line/40">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <p className="text-xs text-on-surface-variant leading-5">
              Paste it into <strong>Cursor, Claude, Antigravity, or Copilot</strong> inside your project repo.
            </p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low/60 border border-line/40">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <p className="text-xs text-on-surface-variant leading-5">
              Push changes to GitHub and connect the repository on Appshop!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
