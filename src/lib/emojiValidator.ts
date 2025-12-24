// Validate content for forbidden emojis
const FORBIDDEN_EMOJI = '🤔';

export function validateContent(content: string): { valid: boolean; error?: string } {
  if (content.includes(FORBIDDEN_EMOJI)) {
    return { valid: false, error: '内容中不能包含 🤔 表情' };
  }
  return { valid: true };
}
