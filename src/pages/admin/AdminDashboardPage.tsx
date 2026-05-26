import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAppStore } from "../../store/app-store";
import { useState } from "react";

export function AdminDashboardPage() {
  const users = useAppStore((s) => s.users);
  const forms = useAppStore((s) => s.forms);
  const [search, setSearch] = useState("");
  const filtered = users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-slate-500">Trainers</p><p className="text-3xl font-bold">{users.filter((u) => u.role === "trainer").length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Supervisors</p><p className="text-3xl font-bold">{users.filter((u) => u.role === "supervisor").length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Departments</p><p className="text-3xl font-bold">4</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Audit logs</p><p className="text-3xl font-bold">128</p></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between"><CardTitle>User Management</CardTitle><Button>Add User</Button></CardHeader>
        <CardContent>
          <div className="mb-3 max-w-md"><Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead><tr className="border-b text-left text-slate-500"><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th><th className="pb-2">Department</th><th className="pb-2">Actions</th></tr></thead>
              <tbody>{filtered.map((u) => <tr key={u.id} className="border-b border-slate-100"><td className="py-3 font-medium">{u.name}</td><td>{u.email}</td><td className="capitalize">{u.role}</td><td>{u.department}</td><td><Button size="sm" variant="outline">Manage</Button></td></tr>)}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Audit Logs</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          {forms.slice(0, 5).map((f) => <p key={f.id}>[{f.createdAt}] Form {f.id} created for {f.title}.</p>)}
        </CardContent>
      </Card>
    </div>
  );
}
