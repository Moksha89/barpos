import { AppShell } from "@/components/app-shell";
import { getPermissionKeys, requireUser } from "@/lib/auth";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireUser();

  return (
    <AppShell
      user={{
        name: user.name,
        role: {
          name: user.role.name,
          label: user.role.label,
        },
        permissions: getPermissionKeys(user),
      }}
    >
      {children}
    </AppShell>
  );
}
