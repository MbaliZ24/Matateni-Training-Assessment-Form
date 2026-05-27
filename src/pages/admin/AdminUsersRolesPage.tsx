import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAppStore } from "../../store/app-store";

export function AdminUsersRolesPage() {
  const users = useAppStore((s) => s.users);
  const [search, setSearch] = useState("");

  const supervisorsById = useMemo(
    () => Object.fromEntries(users.filter((u) => u.role === "supervisor").map((u) => [u.id, u])),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Users & Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-md">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search user, role, or department..."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Department</th>
                  <th className="pb-2">Assigned Supervisor</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="py-3 font-medium text-slate-900">{user.name || "-"}</td>
                    <td className="text-slate-700">{user.email}</td>
                    <td className="capitalize text-slate-700">{user.role}</td>
                    <td className="text-slate-700">{user.department}</td>
                    <td className="text-slate-700">
                      {user.role === "trainer"
                        ? supervisorsById[user.supervisorId ?? ""]?.name ||
                          supervisorsById[user.supervisorId ?? ""]?.email ||
                          "Not assigned"
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

