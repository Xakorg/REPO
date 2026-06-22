import json
import os

transcript_path = r"C:\Users\ridwa\.gemini\antigravity\brain\b58aa781-1ad9-44e2-9291-87f5931a7ebe\.system_generated\logs\transcript.jsonl"
if os.path.exists(transcript_path):
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get('type') == 'USER_INPUT':
                    print(f"=== STEP {data.get('step_index')} ===")
                    print(data.get('content'))
                    print("-" * 50)
            except Exception as e:
                pass
else:
    print("Transcript file not found.")
