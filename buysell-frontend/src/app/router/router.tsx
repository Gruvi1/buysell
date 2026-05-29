import { Navigate, createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { ForbiddenPage } from "../../pages/ForbiddenPage";
import { NotFoundPage } from "../../pages/NotFoundPage";
import { LoginPage } from "../../pages/auth/LoginPage";
import { RegisterPage } from "../../pages/auth/RegisterPage";
import { ChatPage } from "../../pages/chats/ChatPage";
import { ChatsPage } from "../../pages/chats/ChatsPage";
import { ProfilePage } from "../../pages/profile/ProfilePage";
import { ProductCreatePage } from "../../pages/products/ProductCreatePage";
import { ProductDetailPage } from "../../pages/products/ProductDetailPage";
import { ProductEditPage } from "../../pages/products/ProductEditPage";
import { ProductListPage } from "../../pages/products/ProductListPage";
import { UserEditPage } from "../../pages/users/UserEditPage";
import { UsersPage } from "../../pages/users/UsersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/products" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "forbidden", element: <ForbiddenPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "products", element: <ProductListPage /> },
          { path: "products/new", element: <ProductCreatePage /> },
          { path: "products/:productId/edit", element: <ProductEditPage /> },
          { path: "products/:productId", element: <ProductDetailPage /> },
          { path: "chats", element: <ChatsPage /> },
          { path: "chats/:dialogId", element: <ChatPage /> },
          { path: "profile", element: <ProfilePage /> },
        ],
      },
      {
        element: <ProtectedRoute adminOnly />,
        children: [
          { path: "users", element: <UsersPage /> },
          { path: "users/:userId/edit", element: <UserEditPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
