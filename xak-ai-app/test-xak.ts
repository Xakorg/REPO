import { chatWithXakAI } from "./src/ai/flows/xak-ai-chat-assistant-flow";

async function test() {
    try {
        console.log("Calling chatWithXakAI...");
        const result = await chatWithXakAI({
            message: "Hello world!",
            userId: "test-user-123"
        });
        console.log("RESULT:", result);
    } catch (e) {
        console.error("CAUGHT ERROR:", e);
    }
}
test();
