import agentService from './AgentService.ts';
import userService from './UserService.ts';

interface ContentSuggestion {
    id: string;
    content: string;
    type: 'text' | 'image' | 'link';
    metadata?: {
        source?: string;
        tags?: string[];
        confidence?: number;
    };
}

interface SuggestionContext {
    userAddress?: string;
    preferences?: string[];
}

class ContentService {
    async summarize(text: string, user): Promise<string> {
        console.log(`userAddress: ${user.email}`);
        // load profile by user email
        const profile = await userService.loadProfile(user.email);
        console.log(`profile: ${JSON.stringify(profile)}`);

        // use profile to generate summary
        return agentService.summarize({ text, profile });
    }

    async suggest(text: string, user): Promise<string> {
        console.log(`userAddress: ${user.email}`);
        // load profile by user email
        const profile = await userService.loadProfile(user.email);
        console.log(`profile: ${JSON.stringify(profile)}`);

        // use profile to generate summary
        return agentService.suggest({ text, profile });
    }

    async mention(text: string, user): Promise<boolean> {
        const profile = await userService.loadProfile(user.email);
        
        return agentService.mention({ text, profile });
    }


    /**
     * Enrich suggestion context with additional information
     * @param context Basic context
     * @returns Enriched context
     */
    private async enrichContext(context: SuggestionContext): Promise<SuggestionContext> {
        // TODO: Implement context enrichment
        // - Load user preferences
        // - Add historical context
        // - Include relevant metadata
        return context;
    }
}

export default new ContentService();
