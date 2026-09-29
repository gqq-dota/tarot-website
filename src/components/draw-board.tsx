"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import type { Spread, TarotCard } from "@/lib/tarot-data";
import { TAROT_DECK } from "@/lib/tarot-data";
import { RotateCcw, RefreshCw } from "lucide-react";

export interface Draw {
  card: TarotCard;
  reversed: boolean;
}

const SUIT_SYMBOL: Record<string, string> = {
  wands: "卍",
  cups: "◠",
  swords: "⚔",
  pentacles: "◉",
};
const SUIT_COLOR: Record<string, string> = {
  wands: "#e08a5a",
  cups: "#7fb6d6",
  swords: "#c9c9cf",
  pentacles: "#c9a86a",
};
const ARCANA_MAP: Record<string, string> = {
  major: "大阿卡纳",
  minor: "数字牌",
  court: "宫廷牌",
};

export default function DrawBoard({
  spread,
  draws,
  setDraws,
}: {
  spread: Spread;
  draws: (Draw | null)[];
  setDraws: (fn: (prev: (Draw | null)[]) => (Draw | null)[]) => void;
}) {
  const [flipping, setFlipping] = useState(false);
  const drawnCount = draws.filter((d) => d !== null).length;
  const remaining = spread.positions.length - drawnCount;

  const handleDraw = () => {
    if (remaining <= 0 || flipping) return;
    const firstEmpty = draws.findIndex((d) => d === null);
    if (firstEmpty < 0) return;
    setFlipping(true);
    setTimeout(() => {
      const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5);
      const card = shuffled[0];
      const reversed = Math.random() < 0.4;
      setDraws((prev) => {
        const next = [...prev];
        next[firstEmpty] = { card, reversed };
        return next;
      });
      setFlipping(false);
    }, 260);
  };

  const toggleOrientation = (idx: number) => {
    setDraws((prev) => {
      if (!prev[idx]) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx]!, reversed: !next[idx]!.reversed };
      return next;
    });
  };

  const redrawOne = (idx: number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setDraws((prev) => {
      const used = new Set(prev.filter((d) => d !== null).map((d) => d!.card.id));
      const pool = TAROT_DECK.filter((c) => !used.has(c.id));
      const card = pool[Math.floor(Math.random() * pool.length)];
      const next = [...prev];
      next[idx] = { card, reversed: Math.random() < 0.4 };
      return next;
    });
  };

  return (
    <div className="mt-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {spread.positions.map((pos, i) => {
          const draw = draws[i];
          return (
            <div key={pos.key} className="flex flex-col items-center text-center">
              <div className="mb-2 flex items-center gap-1 sm:gap-2">
                <span className="text-xs text-gold/60">{i + 1}.</span>
                <span className="font-serif-display text-sm text-gold-soft sm:text-[15px]">
                  {pos.name}
                </span>
              </div>

              {draw ? (
                <div
                  onClick={() => toggleOrientation(i)}
                  className="reveal-card group relative w-full max-w-[150px] cursor-pointer"
                  style={{ perspective: "900px" }}
                >
                  <div className="relative aspect-[3/4.6] w-full overflow-hidden rounded-lg border border-[rgba(201,168,106,0.35)] tarot-card-shadow transition group-hover:border-[var(--ring)] group-hover:shadow-[0_0_22px_rgba(201,168,106,0.25)]">
                    <div
                      className="flex h-full w-full flex-col items-center justify-between p-2.5"
                      style={{
                        background: `linear-gradient(160deg, #191530, #110d20)`,
                      }}
                    >
                      <div className="w-full text-left">
                        <div
                          className="font-serif-display text-lg leading-none"
                          style={{ color: SUIT_COLOR[draw.card.suit ?? ""] ?? "#c9a86a" }}
                        >
                          {draw.card.suit ? SUIT_SYMBOL[draw.card.suit] : "✦"}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[var(--muted-foreground)]">
                          {ARCANA_MAP[draw.card.arcana]}
                        </div>
                      </div>

                      <div className="px-1 text-center">
                        <div
                          className="font-serif-display text-[17px] font-semibold leading-tight"
                          style={{ color: "#e8e4da" }}
                        >
                          {draw.card.name}
                        </div>
                        <div className="mt-1 text-[11px] text-gold/80">{draw.card.en}</div>
                      </div>

                      <div
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
                          draw.reversed
                            ? "border-[rgba(192,106,90,0.45)] bg-[rgba(192,106,90,0.12)] text-reactive"
                            : "border-[rgba(201,168,106,0.4)] bg-[rgba(201,168,106,0.1)] text-gold-soft"
                        }`}
                      >
                        {draw.reversed ? "逆位" : "正位"}
                      </div>
                    </div>

                    <button
                      onClick={(e) => redrawOne(i, e)}
                      title="重抽此张"
                      className="absolute right-1.5 top-1.5 hidden h-6 w-6 items-center justify-center rounded-full bg-black/50 text-gold-soft transition group-hover:flex hover:bg-black/75"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={handleDraw}
                  className="flex aspect-[3/4.6] w-full max-w-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[rgba(201,168,106,0.3)] bg-black/20 text-[var(--muted-foreground)] transition hover:border-[var(--ring)] hover:bg-[rgba(201,168,106,0.06)]"
                >
                  <RotateCcw className="h-5 w-5 text-gold/50" />
                  <span className="text-xs">未抽</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {remaining > 0 && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={handleDraw}
            disabled={flipping}
            className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,168,106,0.4)] bg-black/25 px-6 py-2.5 text-sm font-medium text-gold-soft transition hover:bg-[rgba(201,168,106,0.12)] disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            {flipping ? "正在翻转…" : `点击抽取下一张（剩余 ${remaining}）`}
          </button>
          <p className="text-xs text-[var(--muted-foreground)]">
            点击已翻开的牌可切换正位/逆位，悬停牌角可重抽该张。
          </p>
        </div>
      )}
    </div>
  );
}