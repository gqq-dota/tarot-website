import { SPREADS } from "./tarot-data";
import type { TarotCard } from "./tarot-data";

export interface DrawEntry {
  position?: { key: string; name: string; meaning: string };
  card: TarotCard;
  reversed: boolean;
}

export interface ReadingRequest {
  question: string;
  spreadId: string;
  draws: DrawEntry[];
}

/** 构建发送给 LLM 的完整系统提示词 */
export function buildSystemPrompt(): string {
  return [
    "你是一位专业、温暖而客观的塔罗解读师。你会根据求助者提出的具体问题、所选牌阵以及牌阵中每一张牌（含正位/逆位），提供结构完整、层次分明、充满关怀与启发的解读。",
    "",
    "【解读原则】",
    "- 语气温暖、客观、中立，始终尊重并回扣求助者提出的具体问题。",
    "- 避免宿命论表述：不替求助者断言未来已定；不使用「一定会」「绝对」「注定」等绝对化措辞，强调结果的每一种可能都取决于其选择与行动。",
    "- 强调自愿与选择权：解读用于照亮与陪伴，绝不恐吓或制造焦虑。",
    "- 涉及健康、法律、投资、财务等专业领域时，需明确提示这是解读建议而非专业诊断/意见，建议咨询相应领域的专业人士。",
    "",
    "【输出格式】必须严格依次输出以下五个章节，使用「【】」包裹章节标题，章节内容另起行：",
    "1.【整体能量】用 2-3 句话概括牌阵的核心氛围与总体指向。",
    "2.【逐牌解析】对牌阵中的每一张牌，依次以「位置——牌名（正位/逆位）」为小标题起行，结合牌义、该牌所处位置的含义以及求助者的问题，写出 3-5 句有血有肉的解析（提及牌的关键意象/关键词，联系位置含义与实际问题）。",
    "3.【综合洞察】分析各牌之间的关系（呼应、矛盾、递进），点明求助者当前处境的关键点与内在线索。",
    "4.【行动建议】给出 3 条具体、可执行、贴合问题与牌面的建议，用分条列举。",
    "5.【一句话收束】以一句有力量、有余韵的总结作结。",
    "",
    "正文使用简体中文，正式温和、条理清晰。",
  ].join("\n");
}

/** 构建用户消息：组织问题、牌阵与抽牌结果 */
export function buildUserPrompt(req: ReadingRequest): string {
  const spread = SPREADS.find((s) => s.id === req.spreadId);
  const spreadName = spread?.name ?? "所选牌阵";

  const lines: string[] = [];
  lines.push(`我提出的问题是：${req.question}`);
  lines.push("");
  lines.push(`我选择的牌阵是：${spreadName}（${req.spreadId}）`);
  lines.push("");
  lines.push("以下是按牌阵位置逐张抽到的牌（含正/逆位）：");
  req.draws.forEach((d, i) => {
    const posName = d.position?.name ?? `位置 ${i + 1}`;
    const posMeaning = d.position?.meaning ?? "";
    const orientation = d.reversed ? "逆位" : "正位";
    const card = d.card;
    const keywords = d.reversed ? card.reversed.join("、") : card.upright.join("、");
    const coreMeaning = d.reversed ? card.reversedMeaning : card.meaning;
    lines.push(
      `${i + 1}.【${posName}】${posMeaning}｜牌面：${card.name}（${card.en}，${orientation}）｜元素：${card.element}｜关键词：${keywords}｜核心含义：${coreMeaning}`
    );
  });
  lines.push("");
  lines.push("请依据以上信息，按你的规范格式为我提供完整而温暖的解读。");
  return lines.join("\n");
}