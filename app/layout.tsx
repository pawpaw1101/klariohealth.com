import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AmbientEffects } from "@/components/ambient-effects";
import { KlarioApiProvider } from "@/components/klario-api-provider";
import "../styles.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body-next",
  display: "swap"
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display-next",
  display: "swap"
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
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <KlarioApiProvider>
          <AmbientEffects />
          {children}
        </KlarioApiProvider>
      </body>
    </html>
  );
}
