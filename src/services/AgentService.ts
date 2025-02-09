import { AgentRuntime, Character, Memory, State, Action, ModelClass,
    stringToUuid, elizaLogger, generateText, composeContext } from "@elizaos/core";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
    getTokenForProvider,
    loadCharacters,
} from "../config/index.ts";
import { initializeDatabase } from "../database/index.ts";
import { initializeDbCache } from "../cache/index.ts";
import { initializeClients } from "../clients/index.ts";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import { createNodePlugin } from "@elizaos/plugin-node";
import { suiPlugin } from "@elizaos/plugin-sui";
import { solanaPlugin } from "@elizaos/plugin-solana";
import { getSummarizeAction } from "./actions/SummarizeAction.ts";
import { getSuggestAction } from "./actions/SuggestAction.ts";
import { getSysReplyAction } from "./actions/SysReplyAction.ts";
import userService from './UserService.ts';


class AgentService {
    private nodePlugin: any;
    private runtime: AgentRuntime | null = null;

    constructor() {
        this.nodePlugin = createNodePlugin();
    }

    /**
     * Initialize the agent runtime
     * @param characterPath Path to the character configuration file
     */
    private async initializeRuntime(characterPath: string): Promise<AgentRuntime> {
        if (this.runtime) {
            return this.runtime;
        }

        const characters = await loadCharacters(characterPath);
        if (!characters || characters.length === 0) {
            throw new Error('No characters found in configuration');
        }

        const character = characters[0];
        return this.initializeRuntimeByCharacter(character);
    }

    private async initializeRuntimeByCharacter(character: Character): Promise<AgentRuntime> {
        character.id ??= stringToUuid(character.name);
        character.username ??= character.name;

        const token = getTokenForProvider(character.modelProvider, character);
        const dataDir = path.join(process.cwd(), "data");

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const db = initializeDatabase(dataDir);
        await db.init();

        const cache = initializeDbCache(character, db);
        this.runtime = this.createAgent(character, db, cache, token);

        await this.runtime.initialize();
        this.runtime.clients = await initializeClients(character, this.runtime);

        // Register the summarize action, the next should be refactored
        this.runtime.registerAction(getSummarizeAction());
        this.runtime.registerAction(getSuggestAction());
        this.runtime.registerAction(getSysReplyAction());

        elizaLogger.debug(`Started ${character.name} as ${this.runtime.agentId}`);
        return this.runtime;
    }

    private createAgent(
        character: Character,
        db: any,
        cache: any,
        token: string
    ): AgentRuntime {
        elizaLogger.success(
            elizaLogger.successesTitle,
            "Creating runtime for character",
            character.name,
        );

        return new AgentRuntime({
            databaseAdapter: db,
            token,
            modelProvider: character.modelProvider,
            evaluators: [],
            character,
            plugins: [
                bootstrapPlugin,
                this.nodePlugin,
                suiPlugin,
                character.settings?.secrets?.WALLET_PUBLIC_KEY ? solanaPlugin : null,
            ].filter(Boolean),
            providers: [],
            actions: [],
            services: [],
            managers: [],
            cacheManager: cache,
        });
    }

    // demo for cyper console reply
    async replyToSys(options: { text: string, user: any }): Promise<string> {
        const profile = await userService.loadProfile(options.user.email);

        const runtime = await this.initializeRuntimeByCharacter(profile);
        const message: Memory = {
            id: stringToUuid(`input_${Date.now()}`),
            agentId: runtime.agentId,
            userId: runtime.agentId,
            roomId: runtime.agentId,
            content: {
                text: options.text,
                action: "SYS_REPLY",
            },
        };

        runtime.messageManager.createMemory(message);
        let state: State = await runtime.composeState(message);

        try {
            const responses: Memory[] = [message];
            await runtime.processActions(message, responses,state);
            if (responses.length > 0) {
                console.log(responses[0].content.sysReply);
                return responses[0].content.sysReply as string;
            } else {
                return "";
            }
        } catch (error) {
            elizaLogger.error('Error during sys reply:', error);
            throw new Error('Failed to call sys reply');
        }
    }

    /**
     * Summarize the given text
     * @param options Options for summarization
     * @returns Summary of the text
     */
    async summarize(options: { text: string, profile: Character }): Promise<string> {
        //const characterPath = options.characterPath || path.join(process.cwd(), "characters", "summarizer.json");
        //const runtime = await this.initializeRuntime(characterPath);
        const runtime = await this.initializeRuntimeByCharacter(options.profile);

        const message: Memory = {
            id: stringToUuid(`input_${Date.now()}`),
            agentId: runtime.agentId,
            userId: runtime.agentId,
            roomId: runtime.agentId,
            content: {
                text: options.text,
                action: "summarize"
            },
        };

        const state: State = await runtime.composeState(message, {
            additionalContext: {
                text: message.content.text
            },
        });

        try {
            const responses: Memory[] = [message];
            await runtime.processActions(message, responses,state);
            if (responses.length > 0) {
                console.log("\nSummary:");
                console.log(responses[0].content.summary);
                return responses[0].content.summary as string;
            } else {
                console.log("\nNo summary generated.");
                return "";
            }
        } catch (error) {
            elizaLogger.error('Error during summarization:', error);
            throw new Error('Failed to summarize text');
        }
    }

    async suggest(options: { text: string, profile: Character }): Promise<string> {
        const runtime = await this.initializeRuntimeByCharacter(options.profile);

        const message: Memory = {
            id: stringToUuid(`input_${Date.now()}`),
            agentId: runtime.agentId,
            userId: runtime.agentId,
            roomId: runtime.agentId,
            content: {
                text: options.text,
                action: "suggest"
            },
        };
        runtime.messageManager.createMemory(message);

        const state: State = await runtime.composeState(message, {
            additionalContext: {
                text: message.content.text
            },
        });

        try {
            const responses: Memory[] = [message];
            await runtime.processActions(message, responses,state);
            if (responses.length > 0) {
                console.log(responses[0].content.suggestion);
                return responses[0].content.suggestion as string;
            } else {
                console.log("\nNo suggestion generated.");
                return "";
            }
        } catch (error) {
            elizaLogger.error('Error during suggestion:', error);
            throw new Error('Failed to suggest text');
        }
    }

    async sendSUI(options: { amount: number, recipient: string, profile: Character }){
        const runtime = await this.initializeRuntimeByCharacter(options.profile);
        const message: Memory = {
            id: stringToUuid(`input_${Date.now()}`),
            agentId: runtime.agentId,
            userId: runtime.agentId,
            roomId: runtime.agentId,
            content: {
                text: `${options.amount} SUI sent to ${options.recipient}`,
                action: "SEND_TOKEN"
            },
        };

        runtime.messageManager.createMemory(message);

        let state: State = await runtime.composeState(message, {
            additionalContext: {
                amount: options.amount,
                recipient: options.recipient,
            },
        });

        try {
            const responses: Memory[] = [message];
            let transactionResult: any = null;

            await new Promise((resolve) => {
                runtime.processActions(message, responses, state, async (callbackData: any): Promise<Memory[]> => {
                    if (callbackData.content?.hash) {
                        transactionResult = {
                            text: callbackData.text,
                            hash: callbackData.content.hash,
                            amount: callbackData.content.amount,
                            recipient: callbackData.content.recipient
                        };
                    }
                    resolve(null);
                    return responses;
                });
            });

            if (responses.length > 0) {
                return {
                    suggestion: responses[0].content.suggestion,
                    ...transactionResult
                };
            }
            return "";
        } catch (error) {
            elizaLogger.error('Error during suggestion:', error);
            throw new Error('Failed to suggest text');
        }
    }

    async mention(options: { text: string, profile: Character }){
        const runtime = await this.initializeRuntimeByCharacter(options.profile);
        const message: Memory = {
            id: stringToUuid(`input_${Date.now()}`),
            agentId: runtime.agentId,
            userId: runtime.agentId,
            roomId: runtime.agentId,
            content: {
                text: options.text,
                action: "SEND_TOKEN"
            },
        };

        runtime.messageManager.createMemory(message);
        let state: State = await runtime.composeState(message);

        try {
            const responses: Memory[] = [message];
            let transactionResult: any = null;

            await new Promise((resolve) => {
                runtime.processActions(message, responses, state, async (callbackData: any): Promise<Memory[]> => {
                    if (callbackData.content?.hash) {
                        transactionResult = {
                            text: callbackData.text,
                            hash: callbackData.content.hash,
                            amount: callbackData.content.amount,
                            recipient: callbackData.content.recipient
                        };
                    }
                    resolve(null);
                    return responses;
                });
            });

            if (responses.length > 0) {
                return true; 
                // here we can't return rich data since the sui plugin has bug
                // return {
                //     ...transactionResult
                // };
            }
            return false;
        } catch (error) {
            elizaLogger.error('Error during suggestion:', error);
            throw new Error('Failed to suggest text');
        }
    }

}

export default new AgentService();
