import { NextRequest } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { SPREADS, TAROT_DECK } from "@/lib/tarot-data";
import { buildSystemPrompt, buildUserPrompt, type ReadingRequest } from "@/lib/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Payload {
  question: string;
  spreadId: string;
  draws: { cardId: string; reversed: boolean }[];
}

export async function POST(request: NextRequest) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return new Response("请求体格式错误", { status: 400 });
  }

  const question = (payload.question ?? "").trim();
  const spread = SPREADS.find((s) => s.id === payload.spreadId);

  if (!question) {
    return new Response("请提出你想询问的问题。", { status: 400 });
  }
  if (!spread) {
    return new Response("牌阵不存在，请先选择有效的牌阵。", { status: 400 });
  }
  if (!Array.isArray(payload.draws) || payload.draws.length !== spread.positions.length) {
    return new Response(
      `该牌阵需要抽取 ${spread.positions.length} 张牌，请重新抽牌。`,
      { status: 400 }
    );
  }

  // 组装每张牌
  const draws = payload.draws.map((d, i) => {
    const card = TAROT_DECK.find((c) => c.id === d.cardId);
    if (!card) {
      throw new Error(`未知的塔罗牌：${d.cardId}`);
    }
    return {
      position: spread.positions[i],
      card,
      reversed: !!d.reversed,
    };
  });

  const readingReq: ReadingRequest = { question, spreadId: spread.id, draws };

  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const messages = [
    { role: "system" as const, content: buildSystemPrompt() },
    { role: "user" as const, content: buildUserPrompt(readingReq) },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const push = (text: string) => {
        if (controller.desiredSize == null) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: text })}\n\n`));
        } catch {
          /* ignore closed */
        }
      };
      const pushEvent = (event: string, data = "") => {
        if (controller.desiredSize == null) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* ignore closed */
        }
      };

      try {
        const llmStream = client.stream(messages, {
          model: "doubao-seed-2-0-pro-260215",
          temperature: 0.85,
        });

        for await (const chunk of llmStream) {
          if (chunk.content) {
            push(chunk.content.toString());
          }
        }
        pushEvent("done");
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("reading stream error:", msg);
        pushEvent("error", msg || "解读生成失败，请稍后重试");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}