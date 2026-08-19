import type { Metadata } from "next";
import localFont from "next/font/local";
import { AmbientEffects } from "@/components/ambient-effects";
import { KlarioApiProvider } from "@/components/klario-api-provider";
import { SplashGate } from "@/components/splash-gate";
import "../styles.css";

const inter = localFont({
  variable: "--font-body-next",
  display: "swap",
  src: [
    { path: "../public/fonts/Inter-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Inter-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Inter-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Inter-Bold.ttf", weight: "700", style: "normal" }
  ]
});

const plusJakartaSans = localFont({
  variable: "--font-display-next",
  display: "swap",
  src: [
    { path: "../public/fonts/PlusJakartaSans-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/PlusJakartaSans-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/PlusJakartaSans-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/PlusJakartaSans-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/PlusJakartaSans-ExtraBold.ttf", weight: "800", style: "normal" }
  ]
});

export const metadata: Metadata = {
  title: {
    default: "Klario | Medical Clarity",
    template: "%s | Klario"
  },
  description: "Klario turns medical reports into clear charts, timelines, and actionable health insights for you and your family."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body>
        <KlarioApiProvider>
          <SplashGate />
          <AmbientEffects />
          {children}
        </KlarioApiProvider>
      </body>
    </html>
  );
}
