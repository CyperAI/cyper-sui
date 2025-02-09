import express, { Request, Response } from 'express';
import userService from '../services/UserService.ts';
import { WalrusService } from '../storage/WalrusService.ts';

class UserController {
    // Get user profile
    public async getProfile(req: Request, res: Response) {
        try {
            const email = req.query.email as string;
            const blobId = req.query.blobId as string;

            if(email){
                const profile = await userService.loadProfile(email);
                return res.json(profile);
            }else if(blobId) {
                const walrusService = new WalrusService();
                const profile = await walrusService.fetchJson(blobId);
                return res.json(profile);
            }else{
                return res.status(400).json({ error: 'Missing email or blobId' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Error retrieving profile' });
        }
    }
    

    // Create a new user
    public async createUser(req: Request, res: Response) {
        try {
            const { username, email } = req.body;
            // TODO: Implement user creation
            res.status(201).json({ message: 'User created successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Error creating user' });
        }
    }

    // Update an existing user
    public async updateUser(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            // TODO: Implement user update
            res.status(200).json({ message: 'User updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Error updating user' });
        }
    }
}

export default new UserController();
