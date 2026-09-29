"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Loader2, Copy, Check, Square, RefreshCw, ShieldCheck } from "lucide-react";
import type { Draw } from "./draw-board";

interface Section {
  heading: string;
  body: string[];
}

function parseReading(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^【(.+?)】/);
    if (m) {
      const heading = m[1].trim();
      current = { heading, body: [] };
      sections.push(current);
      const rest = line.slice(m[0].length).trim();
      if (rest) current.body.push(rest);
    } else if (current) {
      current.body.push(line);
    }
  }
  return sections;
}

export default function ReadingResult({
  reading,
  streaming,
  status,
  error,
  onStop,
  draws,
}: {
  reading: string;
  streaming: boolean;
  status: "idle" | "streaming" | "done" | "error";
  error: string;
  onStop: () => void;
  draws: Draw[];
}) {
  const [copied, setCopied] = useState(false);
  const sections = useMemo(() => parseReading(reading), [reading]);
  const showCursor = streaming && reading.length > 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reading);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="panel-glass rounded-2xl p-6 sm:p-8">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(201,168,106,0.14)] pb-4">
        <div className="flex items-center gap-2">
          <span className="font-serif-display text-lg font-medium gold-grad-text">
            你的塔罗解读
          </span>
          {streaming && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gold-soft">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> 正在倾述
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {streaming ? (
            <button
              onClick={onStop}
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,168,106,0.3)] px-3 py-1.5 text-xs text-gold-soft transition hover:bg-[rgba(201,168,106,0.1)]"
            >
              <Square className="h-3.5 w-3.5" /> 停止
            </button>
          ) : (
            reading.trim() && (
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,168,106,0.3)] px-3 py-1.5 text-xs text-gold-soft transition hover:bg-[rgba(201,168,106,0.1)]"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "已复制" : "复制解读"}
              </button>
            )
          )}
        </div>
      </div>

      {/* 牌面摘要 */}
      {draws.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {draws.map((d, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                d.reversed
                  ? "border-[rgba(192,106,90,0.4)] bg-[rgba(192,106,90,0.1)] text-reactive"
                  : "border-[rgba(201,168,106,0.35)] bg-[rgba(201,168,106,0.08)] text-gold-soft"
              }`}
            >
              <span className="text-[var(--muted-foreground)]">{i + 1}.</span>
              {d.card.name}
              <span className="text-[10px]">{d.reversed ? "逆位" : "正位"}</span>
            </span>
          ))}
        </div>
      )}

      {/* 解读正文 */}
      <div className="mt-5 space-y-7">
        {sections.map((sec, i) => (
          <div key={i} className="reveal-section" style={{ animationDelay: `${i * 0.05}s` }}>
            <h3 className="mb-2 flex items-center gap-2.5">
              <span className="inline-block h-3.5 w-1 rounded-full bg-gradient-to-b from-[#e7d19a] to-[#b08c4f]" />
              <span className="font-serif-display text-lg font-semibold text-gold-soft">
                {sec.heading}
              </span>
            </h3>
            <div className="space-y-2.5">
              {sec.body.map((p, j) => (
                <p
                  key={j}
                  className="text-[15px] leading-7 text-[var(--foreground)]/90"
                >
                  {renderInline(p)}
                </p>
              ))}
            </div>
          </div>
        ))}

        {showCursor && (
          <div className="type-cursor text-[15px] leading-7 text-[var(--foreground)]/70" />
        )}

        {!reading.trim() && status === "streaming" && (
          <div className="flex items-center gap-3 py-6 text-sm text-[var(--muted-foreground)]">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
            正凝神静读手中的牌面…
          </div>
        )}

        {status === "error" && !reading.trim() && (
          <div className="rounded-xl border border-[rgba(192,106,90,0.4)] bg-[rgba(192,106,90,0.08)] px-4 py-3 text-sm text-reactive">
            解读生成失败：{error || "请稍后重试"}
          </div>
        )}
      </div>

      {status === "done" && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-[rgba(201,168,106,0.18)] bg-black/20 px-4 py-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p>
            以上解读旨在唤醒你的自我觉察与视角建议，不代表既定事实。人生方向的选择权始终在你手中；
            若涉及健康、法律、投资等专业事务，请以相应领域专业人士的意见为准。
          </p>
        </div>
      )}
    </div>
  );
}

// 将纯文本中的数字条目/短横线转换为更美观的展示
function renderInline(text: string): ReactNode {
  if (/^[-•*]\s+/.test(text) || /^\d+[.、]\s/.test(text)) {
    return <span className="block pl-1">{text}</span>;
  }
  return text;
}