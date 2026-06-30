import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Add or remove XakCoins from a user's balance. Use this to reward users (e.g. Creator Fund).",
  inputSchema: z.object({
    userId: z.string().describe("ID of the user"),
    amount: z.number().describe("Amount of XakCoins to add (positive) or remove (negative)"),
    reason: z.string().describe("Reason for the balance change"),
  }),
  execute: async ({ userId, amount, reason }) => {
    // In a real environment with Firebase Admin, we would do:
    // const db = getFirestore();
    // await db.collection('users').doc(userId).update({ currencyBalance: FieldValue.increment(amount) });
    console.log(`[EVE] Updated balance for ${userId}: ${amount > 0 ? '+' : ''}${amount} XakCoins. Reason: ${reason}`);
    
    return {
      success: true,
      message: `Successfully adjusted balance by ${amount}.`,
    };
  },
});
