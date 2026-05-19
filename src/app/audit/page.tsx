import { AdminCard } from "@/components/admin-card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-stone-100 p-4 text-stone-950 sm:p-6">
      <div className="mx-auto grid max-w-7xl gap-5">
        <header>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
            Audit
          </p>
          <h1 className="mt-2 text-3xl font-black">Sensitive Action Logs</h1>
          <p className="mt-2 text-stone-600">
            Tracks offer edits, commission changes, discounts, complimentary
            additions, expenses, advances, settlements, and settings changes.
          </p>
        </header>

        <AdminCard title="Recent Audit Events" eyebrow={`${logs.length} logs`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-3">{log.createdAt.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-3 font-bold">{log.action.replaceAll("_", " ")}</td>
                    <td className="px-3 py-3">{log.entityType}</td>
                    <td className="px-3 py-3">{log.user?.name ?? "System/Admin"}</td>
                    <td className="px-3 py-3">{log.newValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </main>
  );
}
