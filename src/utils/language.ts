/**
 * Detects whether the text is primarily Hindi (Devanagari) or English (Latin script).
 */
export function detectLanguage(text: string): 'Hindi' | 'English' {
  if (!text) return 'Hindi';
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;
  const latinCount = (text.match(/[a-zA-Z]/g) || []).length;
  
  // If Devanagari presence is substantial (> 15% of latin or > 20 chars), it's Hindi
  if (devanagariCount > 20 || devanagariCount > latinCount * 0.2) {
    return 'Hindi';
  }
  return 'English';
}
