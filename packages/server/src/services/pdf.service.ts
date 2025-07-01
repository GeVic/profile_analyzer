import pdfParse from "pdf-parse";

export class PDFService {
  /**
   * Extract text content from a base64 encoded PDF
   * @param base64Data - Base64 encoded PDF data
   * @returns Promise<string> - Extracted text content
   */
  static async extractTextFromBase64(base64Data: string): Promise<string> {
    try {
      // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
      const cleanBase64 = base64Data.replace(
        /^data:application\/pdf;base64,/,
        "",
      );

      // Convert base64 to buffer
      const pdfBuffer = Buffer.from(cleanBase64, "base64");

      // Parse PDF and extract text
      const data = await pdfParse(pdfBuffer);

      // Return cleaned text (remove extra whitespace and normalize)
      return this.cleanText(data.text);
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      throw new Error(
        `Failed to extract text from PDF: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Clean and normalize extracted text
   * @param text - Raw extracted text
   * @returns string - Cleaned text
   */
  private static cleanText(text: string): string {
    return (
      text
        // Remove excessive whitespace
        .replace(/\s+/g, " ")
        // Remove leading/trailing whitespace
        .trim()
        // Remove common PDF artifacts
        .replace(/\f/g, "") // Form feed characters
        .replace(/\r\n/g, "\n") // Normalize line endings
        .replace(/\r/g, "\n")
        // Remove multiple consecutive newlines
        .replace(/\n{3,}/g, "\n\n")
    );
  }

  /**
   * Validate if the provided data appears to be a valid PDF
   * @param base64Data - Base64 encoded data
   * @returns boolean - True if appears to be valid PDF
   */
  static isValidPDF(base64Data: string): boolean {
    try {
      // Remove data URL prefix if present
      const cleanBase64 = base64Data.replace(
        /^data:application\/pdf;base64,/,
        "",
      );

      // Convert to buffer
      const buffer = Buffer.from(cleanBase64, "base64");

      // Check PDF magic number (PDF files start with %PDF-)
      const pdfHeader = buffer.subarray(0, 4).toString();
      return pdfHeader === "%PDF";
    } catch (error) {
      console.error("Error validating PDF:", error);
      return false;
    }
  }

  /**
   * Get basic PDF metadata
   * @param base64Data - Base64 encoded PDF data
   * @returns Promise<object> - PDF metadata
   */
  static async getPDFMetadata(base64Data: string): Promise<{
    pages: number;
    textLength: number;
    title?: string;
    author?: string;
  }> {
    try {
      const cleanBase64 = base64Data.replace(
        /^data:application\/pdf;base64,/,
        "",
      );
      const pdfBuffer = Buffer.from(cleanBase64, "base64");

      const data = await pdfParse(pdfBuffer);

      return {
        pages: data.numpages,
        textLength: data.text.length,
        title: data.info?.Title,
        author: data.info?.Author,
      };
    } catch (error) {
      console.error("Error getting PDF metadata:", error);
      throw new Error(
        `Failed to get PDF metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
