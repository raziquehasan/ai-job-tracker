const { StateGraph, START, END } = require("@langchain/langgraph");
const { ChatOpenAI } = require("@langchain/openai");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { ASSISTANT_SYSTEM_PROMPT } = require("../prompts/assistant.prompt");
const { z } = require("zod");

// Define the state schema
const StateAnnotation = {
    messages: {
        value: (x, y) => x.concat(y),
        default: () => [],
    },
    intent: { value: (x, y) => y ?? x, default: () => "NONE" },
    filters: { value: (x, y) => y ?? x, default: () => ({}) },
    responseMessage: { value: (x, y) => y ?? x, default: () => "" },
};

// Initialize the model (Gemini preferred)
let model;
if (process.env.GOOGLE_AI_API_KEY) {
    model = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_AI_API_KEY,
        model: "gemini-2.0-flash",
        temperature: 0.1,
        convertSystemMessageToHumanContent: true,
    });
    console.log("✅ Assistant using: Google Gemini 2.0");
} else if (process.env.OPENAI_API_KEY) {
    model = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo",
        temperature: 0,
    });
    console.log("✅ Assistant using: OpenAI GPT-3.5");
} else {
    throw new Error("No LLM API key configured");
}

/**
 * Node: Intent Classifier & Filter Extractor
 * We'll combine them into one smart node for efficiency as they share context.
 */
async function processQuery(state) {
    console.log("🤖 Assistant Node: Processing query...");
    const lastMessage = state.messages[state.messages.length - 1].content;
    console.log("User Message:", lastMessage);

    const response = await model.invoke([
        ["system", ASSISTANT_SYSTEM_PROMPT],
        ["user", lastMessage]
    ]);
    console.log("🤖 AI Response received");
    let content = response.content;

    // Clean the response
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    try {
        const parsed = JSON.parse(content);
        return {
            intent: parsed.intent || "NONE",
            filters: parsed.filters || {},
            responseMessage: parsed.message || "How can I help you?",
        };
    } catch (e) {
        console.error("Failed to parse AI response:", content);
        return {
            intent: "NONE",
            filters: {},
            responseMessage: "I'm sorry, I couldn't understand that. Could you rephrase?",
        };
    }
}

// Build the graph
const workflow = new StateGraph({ channels: StateAnnotation })
    .addNode("assistant", processQuery)
    .addEdge(START, "assistant")
    .addEdge("assistant", END);

// Compile the graph
const assistantGraph = workflow.compile();

module.exports = {
    assistantGraph,
};
