import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Scoring Empresarial — Evaluación Crediticia Inteligente",
  description: "Plataforma web académica para evaluación de riesgo crediticio a personas jurídicas en Colombia con modelos ML y SHAP.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          <p>© 2026 Sistema Web Inteligente de Scoring Empresarial — Proyecto Académico y Experimental</p>
        </footer>
      </body>
    </html>
  );
}
