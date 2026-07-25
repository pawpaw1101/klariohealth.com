import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { AmbientEffects } from "@/components/ambient-effects";
import { KlarioApiProvider } from "@/components/klario-api-provider";
import "../styles.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body-next",
  display: "swap",
  weight: ["400", "500", "600", "700"]
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-next",
  display: "swap",
  weight: ["400", "500", "600", "700"]
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
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
      <body>
        <KlarioApiProvider>
          <AmbientEffects />
          {children}
        </KlarioApiProvider>
      </body>
    </html>
  );
}
