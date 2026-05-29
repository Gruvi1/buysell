export type ApiErrorPayload = {
  status: number;
  message: string;
  path: string;
  timestamp: string;
};

export type ValidationErrorPayload = Record<string, string>;

export type GrantedAuthority = {
  authority: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  displayName?: string;
  phoneNumber?: string;
};

export type AuthResponse = {
  token: string;
};

export type AuthStatus = {
  authenticated: boolean;
  username: string | null;
  userId: number | null;
  admin: boolean;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type Product = {
  id: number;
  sellerName?: string | null;
  cityName?: string | null;
  createdAt?: string | null;
  title: string;
  description?: string | null;
  price: number;
  sold?: boolean;
  imageIds?: number[];
  imagePaths?: string[];
  owner?: boolean;
  isOwner?: boolean;
};

export type ProductCreatePayload = {
  title: string;
  description?: string;
  price: number;
  cityId: number;
  images: File[];
  mainImageIndex?: number;
};

export type ProductUpdatePayload = {
  title: string;
  description?: string;
  price: number;
  cityId: number;
  images?: File[];
  mainImageIndex?: number;
};

export type ProductFilters = {
  title?: string;
  cityId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
};

export type User = {
  id: number;
  imagePath?: string | null;
  createdAt?: string | null;
  email: string;
  displayName?: string | null;
  phoneNumber?: string | null;
};

export type UserUpdatePayload = {
  displayName?: string;
  phoneNumber?: string;
  avatar?: File | null;
};

export type Dialog = {
  id: number;
  productId: number;
  productTitle?: string | null;
  buyerId: number;
  buyerName?: string | null;
  sellerId: number;
  sellerName?: string | null;
  updatedAt?: string | null;
  unreadCount: number;
};

export type Message = {
  id: number;
  content: string;
  senderId: number;
  senderName?: string | null;
  isRead: boolean;
  createdAt?: string | null;
};

export type MessageCreatePayload = {
  content: string;
};
