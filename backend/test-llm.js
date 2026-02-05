require('dotenv').config();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

async function test() {
    try {
        console.log("Initializing ChatGoogleGenerativeAI...");
        const llm = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_AI_API_KEY,
            model: "gemini-2.0-flash",
        });
        console.log("Invoking...");
        const res = await llm.invoke("Hi");
        console.log("Response:", res.content);
    } catch (err) {
        console.log("Error Status:", err.status);
        console.log("Error Message:", err.message);
    }
}
test();
