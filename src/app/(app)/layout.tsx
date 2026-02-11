import { Sidebar } from "@/components/layout/sidebar";
import { Clock } from "@/components/layout/clock";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:ml-56">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4 py-3 md:px-6">
          <div className="ml-10 md:ml-0" />
          <Clock />
        </header>
        <main className="p-4 md:p-6 max-w-7xl">{children}</main>
      </div>
    </div>
  );
}
