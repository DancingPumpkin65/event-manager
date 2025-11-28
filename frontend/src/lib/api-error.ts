export class ApiError extends Error {
    statusCode?: number;
    details?: any;

    constructor(message: string, statusCode?: number, details?: any) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.details = details;
    }
}
