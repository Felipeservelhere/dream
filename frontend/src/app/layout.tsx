import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniDesk AI — Atendimento Inteligente',
  description: 'Plataforma de atendimento via WhatsApp com IA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var s = JSON.parse(localStorage.getItem('omni-theme') || '{}');
            document.documentElement.setAttribute('data-theme', s.state?.theme || 'dark');
          } catch(e) {}
        ` }} />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
