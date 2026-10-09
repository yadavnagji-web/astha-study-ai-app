import { PDFParse } from 'pdf-parse';

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  hasSelectableText: boolean;
  charCount: number;
}

export async function extractPDFText(buffer: Buffer): Promise<PDFExtractionResult> {
  try {
    const parser = new PDFParse(buffer);
    const result = await parser.getText();
    const cleanedText = (result.text || (result.pages || []).map((p: any) => p.text).join('\n') || '').trim();
    const hasSelectable = cleanedText.length > 50;

    return {
      text: cleanedText,
      pageCount: result.total || 1,
      hasSelectableText: hasSelectable,
      charCount: cleanedText.length,
    };
  } catch (err: any) {
    throw new Error(`Failed to read PDF: ${err?.message || 'Invalid or encrypted file'}`);
  }
}

