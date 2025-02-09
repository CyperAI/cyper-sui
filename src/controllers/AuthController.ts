import { Request, Response } from 'express';
import { generateNonce, generateRandomness, jwtToAddress } from '@mysten/sui/zklogin';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient } from '@mysten/sui/client';
import { ZkLoginSession } from '../types/session.ts';
import { jwtDecode } from 'jwt-decode';

interface GoogleUserInfo {
    name: string;
    email: string;
    picture?: string;
    sub: string;  // Google's user ID
}

const FULLNODE_URL: string = 'https://fullnode.testnet.sui.io';
const GOOGLE_REDIRECT_URI: string = 'http://localhost:3000/auth/callback/google'; 
const GOOGLE_OAUTH2_URL: string = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_CLIENT_ID: string = ''; 

class AuthController {
    // login endpoint: generate ephemeral key pair and nonce, then redirect to Google OAuth login URL
    public async login(req: Request, res: Response) {
        const suiClient = new SuiClient({ url: FULLNODE_URL });
        const { epoch} = await suiClient.getLatestSuiSystemState();
        
        const maxEpoch = Number(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
        const ephemeralKeyPair = new Ed25519Keypair();
        const randomness = generateRandomness();
        const nonce = generateNonce(ephemeralKeyPair.getPublicKey(), maxEpoch, randomness);
      
        // Save ephemeral key data in session for later use (e.g. in signing)
        // Extend the session object to our defined type
        (req.session as ZkLoginSession).ephemeralKeyPair = ephemeralKeyPair;
        (req.session as ZkLoginSession).nonce = nonce;
        (req.session as ZkLoginSession).randomness = randomness;
        (req.session as ZkLoginSession).maxEpoch = maxEpoch;

        // Construct OAuth URL parameters
        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_REDIRECT_URI,
            response_type: 'id_token',
            scope: 'openid email',
            nonce: nonce, // Pass the generated nonce to the OAuth provider
            response_mode: 'query'
        });

        // Construct the Google OAuth login URL
        const oauthUrl: string = `${GOOGLE_OAUTH2_URL}?${params.toString()}`;

        // Redirect user to Google OAuth login page
        res.redirect(oauthUrl);
    }

    //  handle OAuth callback and derive Sui address via zkLogin
    public async authGoogleCallback(req: Request, res: Response) {
        // If id_token is not present in query, serve an HTML page with JS to extract it from URL fragment.
        if (!req.query.id_token) {
            return res.send(`
            <!DOCTYPE html>
            <html>
                <head>
                <meta charset="UTF-8">
                <title>Processing OAuth Callback</title>
                </head>
                <body>
                <script>
                    // Extract id_token from the URL fragment
                    const hash = window.location.hash;
                    if (hash) {
                    const params = new URLSearchParams(hash.substring(1));
                    const id_token = params.get('id_token');
                    if (id_token) {
                        // Redirect to the same URL with id_token as a query parameter
                        window.location.href = window.location.pathname + '?id_token=' + encodeURIComponent(id_token);
                    } else {
                        document.body.innerText = 'Error: id_token not found in URL fragment.';
                    }
                    } else {
                    document.body.innerText = 'Error: URL fragment is empty.';
                    }
                </script>
                </body>
            </html>
            `);
        }

        // Now id_token(jwtToken) is expected to be in the query parameter
        const id_token = req.query.id_token;
        if (!id_token || typeof id_token !== 'string') {
            return res.status(400).send("Error: Invalid id_token received from OAuth provider.");
        }

        try {
            // Decode the id_token to get user info
            const userInfo = jwtDecode(id_token as string) as GoogleUserInfo;
            console.log('User info from Google:', userInfo);

            // In production, the user salt should be securely obtained or stored.
            const userSalt = '123456';
            
            // Derive the zkLogin Sui address using the id_token and userSalt
            const suiAddress = jwtToAddress(id_token, userSalt);
            
            // Store both the Sui address and user info in session
            req.session.suiAddress = suiAddress;
            req.session.userInfo = {
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture
            };

            console.log('Session after storing user info:', req.session);
            
            res.redirect('/');
        } catch (error) {
            console.error('Error processing Google callback:', error);
            res.status(500).send('Error processing Google authentication');
        }
    }

    logout(req: Request, res: Response) {
        // Clear the session
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Error logging out');
            }
            res.redirect('/');
        });
    }
}

export default new AuthController();
