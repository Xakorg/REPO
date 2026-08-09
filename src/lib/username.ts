// Utility for username normalization and offensive-word detection
const BLACKLIST = [
  "fuck",
  "fucker",
  "fucking",
  "shit",
  "bitch",
  "ass",
  "asshole",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "whore",
  "slut",
  "bastard",
  "motherfucker",
  "nigger",
  "nigga",
  "faggot",
  "fag",
  "retard"
];

export function normalizeUsername(name: string) {
  return (name || "").toLowerCase().trim();
}

export function isOffensive(name: string) {
  const n = normalizeUsername(name);
  if (!n) return false;
  // Word boundary regex check to avoid false positives on words like "class", "grass", "assign", "password"
  for (const bad of BLACKLIST) {
    const regex = new RegExp(`\\b${bad}\\b`, "i");
    if (regex.test(n)) return true;
  }
  return false;
}


export function sanitizeForId(name: string) {
  // remove spaces and suspicious chars for safe ids
  return (name || "").replace(/[^a-zA-Z0-9_\-\.]/g, "_");
}

export default { normalizeUsername, isOffensive, sanitizeForId };
