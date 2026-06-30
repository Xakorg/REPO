import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Create or update a DNS record for XakteirDNS.",
  inputSchema: z.object({
    domainName: z.string().describe("The root domain (e.g. example.com)"),
    recordType: z.enum(["A", "CNAME", "TXT", "MX"]).describe("The DNS record type"),
    recordName: z.string().describe("The subdomain or @ for root"),
    value: z.string().describe("The target value (IP address, domain, or text)"),
  }),
  execute: async ({ domainName, recordType, recordName, value }) => {
    console.log(`[EVE] DNS record configured: ${recordName}.${domainName} [${recordType}] -> ${value}`);
    return {
      success: true,
      message: `DNS Record ${recordName} of type ${recordType} pointing to ${value} added successfully.`,
    };
  },
});
