import type { Metadata } from "next";
import { Nunito, Noto_Sans_TC } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const kainnneBrandImage = "https://kainnne.com/brand/kainnne-mark.png";

/** Rounded, friendly Latin display (less formal than serif) */
const display = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

/** Clean TC body; pair with Nunito for English-heavy lines */
const body = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-tools.kcis.kainnne.com"),
  title: "康橋 AI 工具站",
  description: "為教學、學習與行政工作找到合適的 AI 工具，或建立可直接交給 Kuse 的結構化 Prompt。",
  icons: {
    icon: kainnneBrandImage,
    shortcut: kainnneBrandImage,
    apple: kainnneBrandImage,
  },
  openGraph: {
    title: "康橋 AI 工具站",
    description: "選擇 AI 工具導航，或建立可直接交給 Kuse 的結構化 Prompt。",
    url: "/",
    siteName: "Kang Chiao AI Tools",
    images: [{ url: kainnneBrandImage, width: 1254, height: 1254, alt: "Kainnne flowing ribbon K brand mark" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "康橋 AI 工具站",
    description: "選擇 AI 工具導航，或建立可直接交給 Kuse 的結構化 Prompt。",
    images: [kainnneBrandImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
