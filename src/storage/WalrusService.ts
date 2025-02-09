/**
 * Storage service for handling file uploads and downloads
 */
export class WalrusService {
    private static readonly DEFAULT_PUBLISHER_URL = 'https://publisher.walrus-testnet.walrus.space';
    private static readonly DEFAULT_AGGREGATOR_URL = 'https://aggregator.walrus-testnet.walrus.space';

    private publisherUrl: string;
    private aggregatorUrl: string;

    constructor(
        publisherUrl: string = WalrusService.DEFAULT_PUBLISHER_URL,
        aggregatorUrl: string = WalrusService.DEFAULT_AGGREGATOR_URL
    ) {
        this.publisherUrl = publisherUrl;
        this.aggregatorUrl = aggregatorUrl;
    }

    /**
     * Get the default publisher URL
     */
    static getDefaultPublisherUrl(): string {
        return WalrusService.DEFAULT_PUBLISHER_URL;
    }

    /**
     * Get the default aggregator URL
     */
    static getDefaultAggregatorUrl(): string {
        return WalrusService.DEFAULT_AGGREGATOR_URL;
    }

    /**
     * Uploads a file to the storage service
     * @param file The file to upload
     * @param numEpochs Number of epochs to store the file
     * @param sendTo Optional recipient address
     * @returns Promise with storage info, media type and any error information
     */
    async uploadFile(file: File, numEpochs: number, sendTo?: string): Promise<{info: any, media_type: string, error?: string}> {
        let sendToParam = sendTo ? `&send_object_to=${sendTo.trim()}` : "";
        const url = `${this.publisherUrl}/v1/blobs?epochs=${numEpochs}${sendToParam}`;
        
        try {
            const response = await fetch(url, {
                method: "PUT",
                body: file,
            });

            if (response.status === 200) {
                const info = await response.json();
                return { 
                    info: info, 
                    media_type: file.type 
                };
            } else {
                const errorText = await response.text().catch(() => 'No error details available');
                return {
                    info: null,
                    media_type: file.type,
                    error: `Upload failed with status ${response.status}: ${errorText}`
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return {
                info: null,
                media_type: file.type,
                error: `Failed to upload file: ${errorMessage}`
            };
        }
    }

    /**
     * Downloads a blob from storage using its ID
     * @param blobId The ID of the blob to download
     * @returns Promise with the blob data
     */
    async downloadBlob(blobId: string): Promise<Blob> {
        const response = await fetch(`${this.aggregatorUrl}/v1/blobs/${blobId}`, {
            method: "GET"
        });

        if (response.status === 200) {
            return await response.blob();
        } else {
            throw new Error("Failed to download the blob");
        }
    }

    /**
     * Downloads and parses a JSON blob from storage
     * @param blobId The ID of the blob to download
     * @returns Promise with the parsed JSON data
     */
    async fetchJson<T = any>(blobId: string): Promise<{data?: T, error?: string}> {
        try {
            const blob = await this.downloadBlob(blobId);
            const text = await blob.text();
            const data = JSON.parse(text);
            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return { error: `Failed to fetch or parse JSON: ${errorMessage}` };
        }
    }

    /**
     * Uploads a JSON object to the storage service
     * @param jsonData The JSON object to upload
     * @param numEpochs Number of epochs to store the data
     * @param sendTo Optional recipient address
     * @returns Promise with storage info and media type
     */
    async uploadJson<T>(jsonData: T, numEpochs: number = 1, sendTo?: string): Promise<{info: any, media_type: string}> {
        // Convert JSON to Blob
        const jsonBlob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
        
        // Create a File object from the Blob
        const jsonFile = new File([jsonBlob], 'data.json', { type: 'application/json' });
        
        // Upload the file using uploadFile
        return this.uploadFile(jsonFile, numEpochs, sendTo);
    }
}
