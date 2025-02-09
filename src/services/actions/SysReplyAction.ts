import { Memory, Action, IAgentRuntime, State, stringToUuid, ModelClass, composeContext, generateText } from "@elizaos/core";

// demo for cyper console only
// production will be refactored to an agentic flow
export function getSysReplyAction(): Action {
    return {
        name: "SYS_REPLY",
        description: "System reply of Cyper, often used in Cyper console and core logic of Cyper agentic flows",
        similes: ["sys reply text", "create sys reply", "generate sys reply"],
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
            if (!message.content?.text) {
                return ["No text content provided for SYS_REPLY."];
            }

            const sysRequest: Memory = {
                id: stringToUuid(`SYS_REPLY_${message.id}`),
                roomId: message.roomId,
                userId: message.userId,
                content: {
                    text: message.content.text
                },
                agentId: message.agentId,
            };

            const sysState = await runtime.composeState(sysRequest, { 
                text: message.content.text,
                style: runtime.character.style?.post,
                adjectives: runtime.character.adjectives,
                bio: runtime.character.bio,
                topics: runtime.character.topics,
                lore: runtime.character.lore,
            });
            const wordLimit = 30;
            const sysTemplate = `You are the system agent of Cyper. User send you a message in cyper console. Reply to user under ${wordLimit} words that aligns with the draft post’s intent and purpose. 
            Draft request is : {{text}} .
            ---
            Recent messages : {{recentUserMessage}}
            ---
            User's bio : {{bio}}
            User's topics : {{topics}}
            User's lore : {{lore}}
            Give your response directly, without any additional text or formatting and no quotes`;

            const context = composeContext({
                state: sysState,
                template: sysTemplate,
            });

            const sysResponse = await generateText({
                runtime,
                context: context,
                modelClass: ModelClass.LARGE,
            });

            message.content.sysReply = sysResponse;
            return sysResponse || ["Failed to generate sys reply."];
        },
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Please suggest this text",
                        action: "suggest"
                    }
                }
            ]
        ],
        validate: async () => true,
    };
}
