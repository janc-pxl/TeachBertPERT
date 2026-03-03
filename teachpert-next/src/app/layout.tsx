import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/layout/NavBar";
import { Footer } from "@/components/layout/Footer";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  title: "PERT – Interactief leren",
  description:
    "Interactieve leeromgeving voor PERT (Program Evaluation and Review Technique) — Hogeschool PXL",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body className={raleway.variable}>
        <NavBar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
