import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Send a system notification to a specific user on Xakteir.",
  inputSchema: z.object({
    userId: z.string().describe("ID of the user to notify"),
    title: z.string().describe("Notification title"),
    message: z.string().describe("Notification content body"),
  }),
  execute: async ({ userId, title, message }) => {
    console.log(`[EVE] Sent notification to ${userId}: [${title}] ${message}`);
    return {
      success: true,
      message: `Notification sent to user.`,
    };
  },
});
