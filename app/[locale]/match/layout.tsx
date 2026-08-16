// Pages « lien email → app » : pas d'indexation moteur.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Trokacha · Match',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
