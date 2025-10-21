import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Temporal Home",
  description: "App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Workaround: limpia el atributo inyectado por extensiones (ej. ColorZilla) antes de hidratar */}
        <Script id="cz-fix" strategy="beforeInteractive">
          {`
            try {
              const clean = () => {
                if (document?.body?.hasAttribute('cz-shortcut-listen')) {
                  document.body.removeAttribute('cz-shortcut-listen');
                }
              };
              // Limpieza inicial
              clean();
              // Por si la extensión lo vuelve a agregar
              const obs = new MutationObserver((muts) => {
                for (const m of muts) {
                  if (m.type === 'attributes' && m.attributeName === 'cz-shortcut-listen') {
                    clean();
                  }
                }
              });
              obs.observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['cz-shortcut-listen'] });
            } catch {}
          `}
        </Script>
      </head>
      <body className="min-h-dvh bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
