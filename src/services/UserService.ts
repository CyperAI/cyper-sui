import fs from 'fs/promises';
import path from 'path';
import { WalrusService } from '../storage/WalrusService.ts';

class UserService {
    private readonly charactersDir: string;

    constructor() {
        this.charactersDir = path.join(process.cwd(), 'characters');
    }

    /**
     * Load a user profile by email
     * @param email The user's email address
     * @returns The user profile data
     * @throws Error if profile cannot be found or loaded
     */
    async loadProfile(email: string): Promise<any> {
        try {
            const walrusService = new WalrusService();

            // mapping email to a profileID
            const profileBlobId = await this.getProfileBlobId(email);

            // load profile from walrus
            const profile = await walrusService.fetchJson<Record<string, any>>(profileBlobId);
            (profile as any).blobId = profileBlobId;
            
            return profile;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to load profile for ${email}: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Get the blob id of the profile for the given email
     * if a profile exists for the given email, return its blob id
     * if not, create a new profile and return its blob id
     * TODO: this is for demo, production should be migrated to database or other storage service
     * @param email 
     */
    async getProfileBlobId(email: string): Promise<string> {
        try {
            const walrusService = new WalrusService();
            const blobFilePath = path.join(process.cwd(), 'src', 'services', 'UserBlob.json');
            
            // Read existing mappings
            let userBlobs: Record<string, string> = {};
            try {
                const content = await fs.readFile(blobFilePath, 'utf-8');
                userBlobs = JSON.parse(content);
            } catch (err) {
                // File doesn't exist or is invalid, start with empty mapping
            }

            // Check if profile exists
            if (userBlobs[email]) {
                return userBlobs[email];
            }

            // If no profile exists, create a new one
            const defaultProfile = {
                name: email,
                plugins: [],
                clients: [],
                modelProvider: "openai",
                settings: {
                },
                bio: [],
                lore: [],
                messageExamples: [[]],
                postExamples: [],
                adjectives: []
            };

            // Upload the default profile to Walrus
            const uploadResult = await walrusService.uploadJson(defaultProfile);
            const blobId = uploadResult.info.alreadyCertified ? uploadResult.info.alreadyCertified.blobId : uploadResult.info.newlyCreated.blobObject.blobId;

            // Store the mapping in JSON file
            userBlobs[email] = blobId;
            await fs.writeFile(blobFilePath, JSON.stringify(userBlobs, null, 2), 'utf-8');

            return blobId;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to get or create profile blob ID: ${errorMessage}`);
        }
    }
}

export default new UserService();
