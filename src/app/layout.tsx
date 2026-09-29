import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "命运牌阵 · 专业塔罗解读",
  description:
    "针对你的问题、牌阵与抽取的塔罗牌，提供温暖客观、结构完整的专业解读：整体能量、逐牌解析、综合洞察、行动建议与一句话收束。",
  keywords: ["塔罗", "塔罗解读", "塔罗牌阵", "塔罗牌", "占卜", "命运牌阵"],
  openGraph: {
    title: "命运牌阵 · 专业塔罗解读",
    description: "温暖客观的专业塔罗解读应用，倾听你的问题，照亮你的选择。",
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased starfield">{children}</body>
    </html>
  );
}