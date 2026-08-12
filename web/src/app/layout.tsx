import type { Metadata } from "next";
import { Nunito, Noto_Sans_TC } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

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
  title: "Kang Chiao AI Tools",
  description: "Find the right AI tool or build a structured, Kuse-ready prompt.",
  openGraph: {
    title: "Kang Chiao AI Tools",
    description: "Choose the AI Tool Navigator or build a structured, Kuse-ready prompt.",
    url: "/",
    siteName: "Kang Chiao AI Tools",
    images: [{ url: "/og-tools.png", width: 1662, height: 946, alt: "Kang Chiao AI Tools" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kang Chiao AI Tools",
    description: "Choose the AI Tool Navigator or build a structured, Kuse-ready prompt.",
    images: ["/og-tools.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
