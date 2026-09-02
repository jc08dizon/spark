export type MentionCandidate = { id: string; name: string };

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Longest name first so "Sample IT Officer" isn't shadowed by a shorter
// candidate that happens to be a prefix of it.
function byNameLengthDesc(candidates: MentionCandidate[]) {
  return [...candidates].sort((a, b) => b.name.length - a.name.length);
}

// Plain substring match on "@Full Name" — good enough for the small,
// known candidate pool (ticket reporter + officers), no NLP needed.
export function findMentionedUsers(
  body: string,
  candidates: MentionCandidate[],
): MentionCandidate[] {
  return byNameLengthDesc(candidates).filter((c) => body.includes(`@${c.name}`));
}

export type MentionSegment = { text: string; isMention: boolean };

// Splits a comment body into plain-text and mention segments for rendering
// (each mention segment is the literal "@Full Name" substring).
export function splitMentions(
  body: string,
  candidates: MentionCandidate[],
): MentionSegment[] {
  const names = byNameLengthDesc(candidates).map((c) => c.name);
  if (names.length === 0) return [{ text: body, isMention: false }];

  const pattern = new RegExp(`@(?:${names.map(escapeRegExp).join("|")})`, "g");
  const segments: MentionSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body))) {
    if (match.index > lastIndex) {
      segments.push({ text: body.slice(lastIndex, match.index), isMention: false });
    }
    segments.push({ text: match[0], isMention: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) {
    segments.push({ text: body.slice(lastIndex), isMention: false });
  }
  return segments;
}
