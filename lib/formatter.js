const FILLER_WORDS = /\b(um|uh|er|ah|like,?\s*you know|you know,?\s*like|basically,?\s*like)\b/gi;
const REPEATED_SPACES = /\s{2,}/g;
const SPACE_BEFORE_PUNCT = /\s+([.,!?;:])/g;
const MISSING_PERIOD = /([a-zA-Z])$/;

export function formatTranscription(raw) {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw.trim();
  if (!text) return '';

  text = text.replace(FILLER_WORDS, '');
  text = text.replace(REPEATED_SPACES, ' ').trim();
  text = text.replace(SPACE_BEFORE_PUNCT, '$1');

  text = text.charAt(0).toUpperCase() + text.slice(1);

  text = text.replace(/([.!?])\s+([a-z])/g, (_, punct, letter) => {
    return `${punct} ${letter.toUpperCase()}`;
  });

  if (MISSING_PERIOD.test(text)) {
    text += '.';
  }

  return text;
}
