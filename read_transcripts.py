import json
import sys

paths = [
    r"C:\Users\ridwa\.gemini\antigravity\brain\c573c07f-0c3c-4b23-bbcc-600e69aa6acc\.system_generated\logs\transcript.jsonl",
    r"C:\Users\ridwa\.gemini\antigravity\brain\5bb1c51b-8c8b-42de-84f9-897f30e4095b\.system_generated\logs\transcript.jsonl"
]

for path in paths:
    print(f"=== Conversation: {path} ===")
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                ctype = data.get("type")
                if ctype in ("USER_INPUT", "PLANNER_RESPONSE"):
                    content = data.get("content")
                    if content:
                        print(f"[{ctype}]:\n{content}\n")
    except Exception as e:
        print(f"Error reading {path}: {e}")
