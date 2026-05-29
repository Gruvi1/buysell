import { LogOut, MessageCircle, Package, Plus, UserRound, Users } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuthStatus, useLogout } from "../../features/auth/useAuth";
import { Button } from "../../shared/ui/Button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-ink text-white shadow-sm"
      : "text-muted hover:bg-white/90 hover:text-ink",
  ].join(" ");

export function AppLayout() {
  const navigate = useNavigate();
  const { data: auth } = useAuthStatus();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <NavLink
              to="/products"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-ink via-blue-900 to-accent text-base font-semibold text-white shadow-soft"
              aria-label="BuySell"
            >
              B
            </NavLink>
            <div>
              <NavLink to="/products" className="text-xl font-semibold">
                BuySell
              </NavLink>
              <p className="mt-0.5 text-sm text-muted">
                Marketplace для быстрых сделок
              </p>
            </div>
          </div>

          <nav className="premium-glass flex flex-wrap items-center gap-2 rounded-2xl p-1">
            {auth?.authenticated ? (
              <>
                <NavLink to="/products" className={navLinkClass}>
                  <Package className="h-4 w-4" />
                  Товары
                </NavLink>
                <NavLink to="/products/new" className={navLinkClass}>
                  <Plus className="h-4 w-4" />
                  Создать
                </NavLink>
                <NavLink to="/chats" className={navLinkClass}>
                  <MessageCircle className="h-4 w-4" />
                  Чаты
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  <UserRound className="h-4 w-4" />
                  Профиль
                </NavLink>
                {auth.admin ? (
                  <NavLink to="/users" className={navLinkClass}>
                    <Users className="h-4 w-4" />
                    Пользователи
                  </NavLink>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logout.isPending}
                >
                  <LogOut className="h-4 w-4" />
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Вход
                </NavLink>
                <NavLink to="/register" className={navLinkClass}>
                  Регистрация
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
