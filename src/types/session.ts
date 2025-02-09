// Extend Express session interface for zkLogin
export interface ZkLoginSession {
    ephemeralKeyPair?: any; // The exported ephemeral key pair details
    nonce?: string;
    randomness?: string;
    maxEpoch?: number;
    suiAddress?: string; // Store the user's Sui address
    userInfo?: {
        name: string;
        email: string;
        picture?: string;
    };
}

// Augment express-session with our custom properties
declare module 'express-session' {
    interface SessionData {
        ephemeralKeyPair?: any;
        nonce?: string;
        randomness?: string;
        maxEpoch?: number;
        suiAddress?: string;
        userInfo?: {
            name: string;
            email: string;
            picture?: string;
        };
    }
}
