import { Request, Response } from 'express';
import { Character } from '@elizaos/core';
import agentService  from '../services/AgentService.ts';

class AgentController {
    // reply to system message
    public async sysReply(req: Request, res: Response) {
        try {
            const { content } = req.body;
            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Content is required'
                });
            }
            const user = req.session.userInfo;

            // Use the agent service to reply the content
            const reply = await agentService.replyToSys({ text: content, user });

            res.json({
                success: true,
                text: reply
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Get all agents
    public async getAgents(req: Request, res: Response) {
        try {
            // TODO: Implement agent listing
            res.status(200).json({ message: 'Agents list endpoint' });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Get specific agent
    public async getAgent(req: Request, res: Response) {
        try {
            const agentId = req.params.id;
            // TODO: Implement single agent retrieval
            res.status(200).json({ message: 'Single agent endpoint' });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Create new agent
    public async createAgent(req: Request, res: Response) {
        try {
            const agentData: Partial<Character> = req.body;
            // TODO: Implement agent creation
            res.status(201).json({ message: 'Agent created successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Update agent
    public async updateAgent(req: Request, res: Response) {
        try {
            const agentId = req.params.id;
            const updateData = req.body;
            // TODO: Implement agent update
            res.status(200).json({ message: 'Agent updated successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default new AgentController();
