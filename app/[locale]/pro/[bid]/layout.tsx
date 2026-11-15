import { ProDeskShell } from '@/components/pro/ProDeskShell';

export default async function DeskLayout({ children, params }: { children: React.ReactNode; params: Promise<{ bid: string }> }) {
  const { bid } = await params;
  return <ProDeskShell bid={bid}>{children}</ProDeskShell>;
}
