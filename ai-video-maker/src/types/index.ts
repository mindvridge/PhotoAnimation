// Re-export database types
export * from './database';

// API Response type
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// File upload types
export interface UploadedFile {
  url: string;
  path: string;
  size: number;
  mimeType: string;
}

// Kling API types
export interface KlingAnimationRequest {
  imageUrl: string;
  expression?: 'smile' | 'neutral' | 'surprised' | 'sad';
  movement?: 'subtle' | 'moderate' | 'dynamic';
}

export interface KlingAnimationResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}
