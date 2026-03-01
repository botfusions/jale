import { BaseClient } from "./base-client.js";
import type { BedestenSearchRequest, BedestenSearchResponse, BedestenDocumentMarkdown } from "../types/bedesten.js";
export declare class BedestenClient extends BaseClient {
    private static readonly SEARCH_ENDPOINT;
    private static readonly DOCUMENT_ENDPOINT;
    constructor(timeoutMs?: number);
    searchDocuments(request: BedestenSearchRequest): Promise<BedestenSearchResponse>;
    getDocumentAsMarkdown(documentId: string): Promise<BedestenDocumentMarkdown>;
}
