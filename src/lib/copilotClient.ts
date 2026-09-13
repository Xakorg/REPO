export async function askCopilot(prompt: string, code?: string) {
  const r = await fetch('/api/copilot/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, code }),
  });
  if (!r.ok) throw new Error('Copilot request failed');
  return r.json();
}
