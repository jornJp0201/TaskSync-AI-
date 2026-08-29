import { Sidebar } from '@/components/app/sidebar';
import { AppHeader } from '@/components/app/app-header';
import { RouteGuard } from '@/components/auth/route-guard';

export const dynamic = 'force-dynamic';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <aside className="hidden w-64 shrink-0 border-r border-border/60 bg-card md:block">
          <Sidebar />
        </aside>
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
        </div>
      </div>
    </RouteGuard>
  );
}
