import { Memory, Action, IAgentRuntime, State, stringToUuid, ModelClass, composeContext, generateText } from "@elizaos/core";

export function getSummarizeAction(): Action {
    return {
        name: "summarize",
        description: "Summarize the given text content",
        similes: ["summarize text", "create summary", "generate summary"],
        examples: [
            [
                {
                    user: "user",
                    content: {
                        text: "Please summarize this text",
                        action: "summarize"
                    }
                }
            ]
        ],
        handler: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
            if (!message.content?.text) {
                return ["No text content provided for summarization."];
            }

            const summaryRequest: Memory = {
                id: stringToUuid(`summary_${message.id}`),
                roomId: message.roomId,
                userId: message.userId,
                content: {
                    text: message.content.text
                },
                agentId: message.agentId,
            };

            const summaryState = await runtime.composeState(summaryRequest, { text: message.content.text });
            const summarizationTemplate = `# {{runtime.character.system}}
            {{text}}`;

            const context = composeContext({
                state: summaryState,
                template: summarizationTemplate,
            });

            const summaryResponse = await generateText({
                runtime,
                context: context,
                modelClass: ModelClass.LARGE,
            });

            message.content.summary = summaryResponse;
            return summaryResponse || ["Failed to generate summary."];
        },
        validate: async () => true,
    };
}
