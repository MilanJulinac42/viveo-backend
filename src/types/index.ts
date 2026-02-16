import type { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: 'fan' | 'star' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: PaginationMeta;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    message: string;
    code: string;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
