import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "BANCO CORP — Sistema Corporativo de Scoring Empresarial & Riesgo",
  description:
    "Plataforma institucional de evaluación crediticia para personas jurídicas en Colombia mediante modelos calibrados XGBoost y explicabilidad local SHAP.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-700 dark:selection:text-amber-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 dark:border-[#132240] bg-white dark:bg-[#050914] py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              &copy; 2026 BANCO CORP &bull; División de Riesgo Crediticio y Finanzas Cuantitativas
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              Sistema Web Inteligente de Scoring Empresarial &bull; Fines Académicos y Experimentales
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
