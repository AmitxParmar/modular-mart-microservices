"use client";

import { useAdminUsers } from "@/features/admin/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">View and manage platform users and their roles.</p>
      </div>

      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            All Registered Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase border-b border-border/40">
                <tr>
                  <th className="px-4 py-3 font-bold">User</th>
                  <th className="px-4 py-3 font-bold">Roles</th>
                  <th className="px-4 py-3 font-bold">Joined</th>
                  <th className="px-4 py-3 font-bold text-right">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  users?.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          {user.roles.map(role => (
                            <span key={role} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-[10px] text-muted-foreground">
                        {user.id.slice(0, 8)}...
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
