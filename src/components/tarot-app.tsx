"use client";

import { useRef, useState } from "react";
import { SPREADS, TAROT_DECK, type Spread, type TarotCard } from "@/lib/tarot-data";
import DrawBoard, { type Draw } from "./draw-board";
import ReadingResult from "./reading-result";
import { Sparkles, Loader2 } from "lucide-react";

export default function TarotApp() {
  const [question, setQuestion] = useState("");
  const [spread, setSpread] = useState<Spread>(SPREADS[1]); // 默认三张时间之流
  const [draws, setDraws] = useState<(Draw | null)[]>(() =>
    SPREADS[1].positions.map(() => null)
  );
  const [reading, setReading] = useState("");
  const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const allDrawn = draws.every((d) => d !== null);

  const chooseSpread = (s: Spread) => {
    setSpread(s);
    setDraws(s.positions.map(() => null));
    setReading("");
    setStatus("idle");
    setError("");
  };

  const handleResetDraws = () => {
    setDraws(spread.positions.map(() => null));
  };

  const startReading = async () => {
    if (!question.trim()) return;
    if (!allDrawn) return;
    setReading("");
    setError("");
    setStatus("streaming");
    scrollToResult();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: question.trim(),
          spreadId: spread.id,
          draws: draws.map((d) => ({ cardId: d!.card.id, reversed: d!.reversed })),
        }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || `请求失败（${res.status}）`);
      }

      const reader = res.body.getReader();
      let buffer = "";
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += new TextDecoder().decode(value, { stream: true });
        // 解析 SSE 事件
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const evt of events) {
          const dataLine = evt.split("\n").find((l) => l.startsWith("data: "));
          const eventLine = evt.split("\n").find((l) => l.startsWith("event: "))?.slice(7);
          if (!dataLine) continue;
          const payload = dataLine.slice(6).trim();
          if (eventLine === "done") continue;
          if (eventLine === "error") {
            try {
              streamError = JSON.parse(payload);
            } catch {
              streamError = payload;
            }
            continue;
          }
          try {
            const { t } = JSON.parse(payload);
            if (t) {
              setReading((prev) => prev + t);
              scrollToResult();
            }
          } catch {
            /* ignore malformed */
          }
        }
      }

      if (streamError) {
        setError(streamError);
        setStatus("error");
      } else {
        setStatus("done");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    }
  };

  const stopReading = () => {
    abortRef.current?.abort();
    if (reading.trim()) setStatus("done");
  };

  const scrollToResult = () => {
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <main className="relative z-10 mx-auto max-w-5xl px-5 pb-28 pt-12 sm:px-8">
      {/* 顶部 */}
      <header className="text-center reveal-section">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(201,168,106,0.35)] bg-black/30 shadow-[0_0_40px_rgba(201,168,106,0.2)]">
          <Sparkles className="h-6 w-6 text-gold" />
        </div>
        <h1 className="font-serif-display text-3xl font-semibold tracking-wide gold-grad-text sm:text-4xl">
          命运牌阵
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
          静下心来，提出你真正关心的问题。<br className="hidden sm:block" />
          选择牌阵，抽取塔罗牌，让我为你与牌展开一次温暖的对话。
        </p>
      </header>

      {/* 第一步：问题 */}
      <section className="mt-12 panel-glass rounded-2xl p-6 sm:p-8 reveal-section">
        <SectionTitle index="01" title="你的问题" hint="以开放而具体的口吻提问，越清晰，解读越贴近你。" />
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          maxLength={300}
          placeholder="例如：我该不该接受这次转职的机会？它可能对我意味着什么？"
          className="mt-4 w-full resize-none rounded-xl border border-[rgba(201,168,106,0.2)] bg-black/25 px-4 py-3 text-[15px] leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/70 outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)]/30"
        />
        <div className="mt-2 text-right text-xs text-[var(--muted-foreground)]">
          {question.length}/300
        </div>
      </section>

      {/* 第二步：牌阵 */}
      <section className="mt-6 panel-glass rounded-2xl p-6 sm:p-8 reveal-section">
        <SectionTitle index="02" title="选择牌阵" hint="不同牌阵纵深不同，可依问题复杂程度选择。" />
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SPREADS.map((s) => {
            const active = s.id === spread.id;
            return (
              <button
                key={s.id}
                onClick={() => chooseSpread(s)}
                className={`group relative overflow-hidden rounded-xl border p-5 text-left transition ${
                  active
                    ? "border-[var(--ring)] bg-[rgba(201,168,106,0.1)] shadow-[0_0_24px_rgba(201,168,106,0.12)]"
                    : "border-[rgba(201,168,106,0.14)] bg-black/20 hover:border-[rgba(201,168,106,0.4)] hover:bg-black/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-serif-display text-lg font-medium text-gold-soft">
                    {s.name}
                  </span>
                  <span className="rounded-full border border-[rgba(201,168,106,0.3)] px-2 py-0.5 text-xs text-gold-soft/90">
                    {s.positions.length} 张
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                  {s.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 第三步：抽牌 */}
      <section className="mt-6 panel-glass rounded-2xl p-6 sm:p-8 reveal-section">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionTitle index="03" title="抽取塔罗牌" hint="点击牌堆逐张翻牌，点击已翻牌可切换正/逆位。" />
          <button
            onClick={handleResetDraws}
            className="text-sm text-gold-soft underline-offset-4 transition hover:text-[var(--foreground)] hover:underline"
          >
            重新洗牌
          </button>
        </div>
        <DrawBoard spread={spread} draws={draws} setDraws={setDraws} />
      </section>

      {/* 生成 */}
      <section className="mt-8 flex flex-col items-center gap-2 reveal-section">
        <button
          onClick={startReading}
          disabled={!question.trim() || !allDrawn || status === "streaming"}
          className={`group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-[15px] font-medium transition ${
            status === "streaming"
              ? "cursor-not-allowed bg-[var(--secondary)] text-[var(--muted-foreground)]"
              : "pulse-gold bg-[linear-gradient(110deg,#e7d19a,#b08c4f)] text-[#151022] hover:brightness-110"
          } disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none`}
        >
          {status === "streaming" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> 正在为你解读…
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" /> 生成我的塔罗解读
            </>
          )}
        </button>
        {(!question.trim() || !allDrawn) && (
          <p className="text-xs text-[var(--muted-foreground)]">
            {!question.trim() ? "请输入你的问题" : "请完成抽牌后再生成解读"}
          </p>
        )}
      </section>

      {/* 解读结果 */}
      {(reading || status !== "idle") && (
        <section ref={resultRef} className="mt-10 reveal-section">
          <ReadingResult
            reading={reading}
            streaming={status === "streaming"}
            status={status}
            error={error}
            onStop={stopReading}
            draws={draws.filter((d): d is Draw => d !== null)}
          />
        </section>
      )}

      {/* 页脚 */}
      <footer className="mt-16 border-t border-[rgba(201,168,106,0.12)] pt-6 text-center text-xs leading-relaxed text-[var(--muted-foreground)]">
        <p>
          塔罗解读旨在自我觉察与启发，不构成宿命结论，最终选择权始终在你手中。
        </p>
        <p className="mt-1">
          健康、法律、投资等专业领域议题，请以 / 咨询相应领域的专业人士为准。
        </p>
      </footer>
    </main>
  );
}

function SectionTitle({
  index,
  title,
  hint,
}: {
  index: string;
  title: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="font-serif-display text-sm tracking-widest text-gold/70">{index}</span>
        <span className="font-serif-display text-xl font-medium text-[var(--foreground)]">
          {title}
        </span>
      </div>
      {hint && <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">{hint}</p>}
    </div>
  );
}

export type { TarotCard };