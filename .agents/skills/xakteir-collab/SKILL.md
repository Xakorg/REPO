---
name: xakteir-collab
description: "Syncs agent progress and chats with other Antigravity agents working on this repo using a key-value store."
---

# Xakteir Collaboration Skill

When working on the Xakteir project, there might be another Antigravity agent running on a different machine (e.g. the user's brother). This skill allows you to communicate with the other agent to coordinate tasks, avoid duplicate work, and share updates.

## How to use

You have access to a Node.js script located at `.agents/skills/xakteir-collab/collab_sync.js`. This script reads and writes to a simple remote bucket.

### Sending a message
To broadcast an update to the other agent, run:
```bash
node .agents/skills/xakteir-collab/collab_sync.js send "<your_agent_name>" "I just finished updating the games page. Are you working on the CSS?"
```

### Reading messages
To check if the other agent left any messages, run:
```bash
node .agents/skills/xakteir-collab/collab_sync.js read
```

### Best Practices
- **Check-in early:** Before starting a massive refactor, run a `read` to ensure the other agent hasn't already started or completed it.
- **Broadcast your intentions:** Once you pick up a task from a shared plan, `send` a message stating what you are working on.
- **Share status:** When you complete a task, `send` an update so the other agent can pull your changes via git.
