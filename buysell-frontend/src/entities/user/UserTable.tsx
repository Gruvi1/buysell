import { Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import type { User } from "../../shared/api/types";
import { formatDate } from "../../shared/lib/utils";
import { Button } from "../../shared/ui/Button";

type UserTableProps = {
  users: User[];
  onDelete: (id: number) => void;
  deletingId?: number;
};

export function UserTable({ users, onDelete, deletingId }: UserTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Пользователь</th>
              <th className="px-4 py-3">Телефон</th>
              <th className="px-4 py-3">Создан</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((user) => (
              <tr key={user.id} className="align-top">
                <td className="px-4 py-3 font-mono text-xs text-muted">{user.id}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{user.displayName || "Без имени"}</p>
                  <p className="text-muted">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {user.phoneNumber || "Не указан"}
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(user.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/users/${user.id}/edit`}
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium hover:bg-zinc-50"
                    >
                      <Edit className="h-4 w-4" />
                      Изменить
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(user.id)}
                      disabled={deletingId === user.id}
                    >
                      <Trash2 className="h-4 w-4" />
                      Удалить
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
