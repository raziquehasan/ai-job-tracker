const { assistantGraph } = require('../ai/agents/filterAssistant.graph');
const { HumanMessage } = require("@langchain/core/messages");

async function assistantRoutes(fastify, options) {

    /**
     * POST /api/assistant/chat
     * Interaction with the AI Assistant
     */
    fastify.post('/chat', async (request, reply) => {
        try {
            const { message } = request.body;

            if (!message) {
                return reply.code(400).send({
                    success: false,
                    message: "Message is required"
                });
            }

            // Run the LangGraph assistant
            const result = await assistantGraph.invoke({
                messages: [new HumanMessage(message)]
            });

            return reply.code(200).send({
                success: true,
                data: {
                    intent: result.intent,
                    filters: result.filters,
                    message: result.responseMessage
                }
            });

        } catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                success: false,
                message: "Error processing assistant message",
                error: error.message
            });
        }
    });
}

module.exports = assistantRoutes;
