import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "./globals.css";
import { SCHOOL_NAME } from "@/lib/constants";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3114";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: SCHOOL_NAME, template: `%s | ${SCHOOL_NAME}` },
  description: "مدرسة أهلية في الرياض من رياض الأطفال حتى الثانوية، مع بوابة إلكترونية لأولياء الأمور والمعلمين.",
  openGraph: { type: "website", locale: "ar_SA", siteName: SCHOOL_NAME },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b5d4b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <a href="#main" className="skip-link">
          تخطَّ إلى المحتوى
        </a>
        {children}
      </body>
    </html>
  );
}
