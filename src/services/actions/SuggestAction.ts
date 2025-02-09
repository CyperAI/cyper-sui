import { Memory, Action, IAgentRuntime, State, stringToUuid, ModelClass, composeContext, generateText } from "@elizaos/core";

export function getSuggestAction(): Action {
    return {
        name: "suggest",
        description: "Suggest the given text content",
        similes: ["suggest text", "create suggestion", "generate suggestion"],
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
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
            if (!message.content?.text) {
                return ["No text content provided for suggestion."];
            }

            const suggestionRequest: Memory = {
                id: stringToUuid(`suggestion_${message.id}`),
                roomId: message.roomId,
                userId: message.userId,
                content: {
                    text: message.content.text
                },
                agentId: message.agentId,
            };

            const suggestionState = await runtime.composeState(suggestionRequest, { 
                text: message.content.text,
                style: runtime.character.style?.post,
                adjectives: runtime.character.adjectives,
                bio: runtime.character.bio,
                topics: runtime.character.topics,
                lore: runtime.character.lore,
            });
            const wordLimit = 20;
            const suggestionTemplate = `Refine a social media post under ${wordLimit} words that aligns with the draft post’s intent and purpose. 
            Draft post is : {{text}} .
            ---
            The tone should be {{style.chat}}, reflecting {{adjectives}} and keeping it relevant from {{bio}} and {{topics}}. 
            if appropriate, incorporate elements of {{lore}} to support the message.
            Give your response directly, without any additional text or formatting and no quotes`;

            const context = composeContext({
                state: suggestionState,
                template: suggestionTemplate,
            });

            const suggestionResponse = await generateText({
                runtime,
                context: context,
                modelClass: ModelClass.LARGE,
            });

            message.content.suggestion = suggestionResponse;
            return suggestionResponse || ["Failed to generate suggestion."];
        },
        validate: async () => true,
    };
}
