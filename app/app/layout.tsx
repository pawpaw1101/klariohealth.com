import { AppAuthGuard } from "@/components/app-auth-guard";
import { AppShell } from "@/components/app-shell";

export default function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppAuthGuard>
      <AppShell>{children}</AppShell>
    </AppAuthGuard>
  );
}
