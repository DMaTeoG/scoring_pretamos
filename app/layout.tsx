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
      <body className="antialiased min-h-screen flex flex-col font-sans selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        <footer className="backdrop-blur-2xl bg-white/60 dark:bg-[#0c0e14]/60 border-t border-black/5 dark:border-white/10 py-6 text-center text-xs text-[#6e6e73] dark:text-[#a1a1a6] transition-colors">
          <div className="max-w-7xl mx-auto px-4 space-y-1">
            <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              &copy; 2026 BANCO CORP &bull; División de Riesgo Crediticio y Finanzas Cuantitativas
            </p>
            <p className="text-[11px] text-[#86868b]">
              Sistema Web Inteligente de Scoring Empresarial &bull; Fines Académicos y Experimentales
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
