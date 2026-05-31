import { AdminCard } from "@/components/admin-card";
import { PageHeader, TableShell } from "@/components/ui";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requirePermission("audit.view");
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="app-page text-stone-950">
      <div className="grid gap-4">
        <PageHeader
          eyebrow="Audit"
          title="Sensitive Action Logs"
          subtitle="Tracks offer edits, commission changes, discounts, complimentary additions, expenses, advances, settlements, and settings changes."
        />

        <AdminCard title="Recent Audit Events" eyebrow={`${logs.length} logs`}>
          <TableShell>
            <table className="premium-table min-w-[860px] text-left">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th>New Value</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.createdAt.toLocaleString("en-AE")}</td>
                    <td className="font-bold">{log.action.replaceAll("_", " ")}</td>
                    <td>{log.entityType}</td>
                    <td>{log.user?.name ?? "System/Admin"}</td>
                    <td>{log.newValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        </AdminCard>
      </div>
    </div>
  );
}
