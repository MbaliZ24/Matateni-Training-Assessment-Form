import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useAppStore } from "../../store/app-store";
import type { Role } from "../../types";

type NewUserDraft = {
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  supervisorId: string;
};

const emptyNewUser: NewUserDraft = {
  name: "",
  email: "",
  password: "",
  role: "trainer",
  department: "",
  supervisorId: ""
};

export function AdminSettingsPage() {
  const users = useAppStore((s) => s.users);
  const addUser = useAppStore((s) => s.addUser);
  const updateUser = useAppStore((s) => s.updateUser);
  const [search, setSearch] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<NewUserDraft>(emptyNewUser);
  const [error, setError] = useState("");

  const supervisors = useMemo(() => users.filter((u) => u.role === "supervisor"), [users]);
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

  const handleAddUser = () => {
    setError("");
    if (!newUser.email.trim() || !newUser.password.trim() || !newUser.department.trim()) {
      setError("Email, password and department are required.");
      return;
    }
    if (newUser.role === "trainer" && !newUser.supervisorId) {
      setError("Assign a supervisor for trainer accounts.");
      return;
    }

    const ok = addUser({
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      department: newUser.department,
      supervisorId: newUser.role === "trainer" ? newUser.supervisorId : undefined
    });

    if (!ok) {
      setError("Could not add user. Email may already exist.");
      return;
    }

    setShowAddUser(false);
    setNewUser(emptyNewUser);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="font-medium text-slate-900">Branding</p>
            <p className="mt-1 text-slate-600">Manage company logo, organization name, and platform display labels.</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="font-medium text-slate-900">Assessment Rules</p>
            <p className="mt-1 text-slate-600">Configure draft behavior, sign-off flow, and review status transitions.</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="font-medium text-slate-900">Data Retention</p>
            <p className="mt-1 text-slate-600">Control how long submissions, supervisor reviews, and logs are retained.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>User Roles & Access</CardTitle>
          <Button size="sm" onClick={() => setShowAddUser(true)}>Add User</Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 max-w-md">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users, roles, or department..."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
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
                    <td className="text-slate-700">
                      <select
                        value={user.role}
                        onChange={(event) => updateUser(user.id, { role: event.target.value as Role })}
                        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm"
                      >
                        <option value="trainer">trainer</option>
                        <option value="supervisor">supervisor</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="text-slate-700">
                      <Input
                        value={user.department}
                        onChange={(event) => updateUser(user.id, { department: event.target.value })}
                        className="h-8"
                      />
                    </td>
                    <td className="text-slate-700">
                      {user.role === "trainer" ? (
                        <select
                          value={user.supervisorId ?? ""}
                          onChange={(event) => updateUser(user.id, { supervisorId: event.target.value || undefined })}
                          className="h-8 min-w-[220px] rounded-md border border-slate-300 bg-white px-2 text-sm"
                        >
                          <option value="">Not assigned</option>
                          {supervisors.map((supervisor) => (
                            <option key={supervisor.id} value={supervisor.id}>
                              {supervisor.name || supervisor.email}
                            </option>
                          ))}
                        </select>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showAddUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4" onClick={() => setShowAddUser(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900">Add User</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input placeholder="Name" value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} />
              <Input placeholder="Password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} />
              <Input placeholder="Department" value={newUser.department} onChange={(e) => setNewUser((p) => ({ ...p, department: e.target.value }))} />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as Role }))}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="trainer">trainer</option>
                <option value="supervisor">supervisor</option>
                <option value="admin">admin</option>
              </select>
              {newUser.role === "trainer" ? (
                <select
                  value={newUser.supervisorId}
                  onChange={(e) => setNewUser((p) => ({ ...p, supervisorId: e.target.value }))}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="">Select supervisor</option>
                  {supervisors.map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name || supervisor.email}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
            {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
              <Button onClick={handleAddUser}>Create User</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
