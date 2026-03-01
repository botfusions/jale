export declare abstract class BaseClient {
    protected baseUrl: string;
    protected timeoutMs: number;
    protected headers: Record<string, string>;
    constructor(baseUrl: string, timeoutMs?: number);
    protected post<T>(endpoint: string, body: unknown): Promise<T>;
}
