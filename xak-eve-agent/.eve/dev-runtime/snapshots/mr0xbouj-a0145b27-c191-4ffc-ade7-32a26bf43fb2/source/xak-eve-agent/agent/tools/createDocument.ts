import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Create a new document in XakDocs.",
  inputSchema: z.object({
    title: z.string().describe("Title of the document"),
    content: z.string().describe("Content in markdown format"),
    userId: z.string().describe("ID of the user creating the document"),
  }),
  execute: async ({ title, content, userId }) => {
    // We would use firebase-admin here to write to firestore
    // For now, return a placeholder success since the Eve integration is local
    console.log(`Creating document for user ${userId}: ${title}`);
    return {
      success: true,
      documentId: "doc_" + Math.random().toString(36).substr(2, 9),
      message: `Successfully created document "${title}"!`,
    };
  },
});
