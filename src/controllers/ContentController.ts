import { Request, Response } from 'express';
import contentService from '../services/ContentService.ts';

const SYSTEM_AGENT_HANDLES = ['@AssetsManager'];

class ContentController {
    /**
     * Suggest content based on user input
     * @param req Request containing content to suggest upon
     * @param res Response with suggested content
     */
    async suggest(req: Request, res: Response) {
        try {
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Content is required'
                });
            }
            const user = req.session.userInfo;

            // Use the agent service to suggest the content
            const suggestion = await contentService.suggest(content, user);

            res.json({
                success: true,
                text: suggestion
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

    /**
     * reply post, check if it mentioned a system agent and if so call the system agent
     * And then persist the reply( this is a demo, and will not implement)
     * @param req Request containing content to rely upon
     * @param res Response with generated content
     */
    async reply(req: Request, res: Response) {
        const { post, reply } = req.body;
        // check if rely mentioned a system agent
        const agents = SYSTEM_AGENT_HANDLES.filter(handle => reply.includes(handle));

        const user = req.session.userInfo;


        // Save to db, this demo will not do this


        if (agents.length === 0) {
            res.json({
                success: true
            });
        }else {
            agents.forEach(async (agent) => {
                contentService.mention(reply, user);
            })
            res.json({
                msg: "MENTIONED_SYS_AGENT",
                success: true
            });
        }
       
    }
}

export default new ContentController();