// frontEnd/src/types/pagination.ts

export interface PaginationResponse<T> {
    items: T[]; 
    total: number; 
    page?: number; 
    limit?: number;
    total_pages?: number; 
}

export interface PaginationParams {
    skip?: number;
    limit?: number;
}