import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { PDFService } from '../../services/pdf.service';
import { AIService } from '../../services/ai.service';
import { TRPCError } from '@trpc/server';
import { AnalyzeProfileInput, AnalyzeProfileOutput } from '../../types/ai.types';

// Input validation schemas
const FileUploadSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  type: z.string().refine(
    (type) => type.includes('pdf'),
    'File must be a PDF'
  ),
  size: z.number().positive('File size must be positive').max(
    parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    'File size exceeds maximum allowed size'
  ),
  data: z.string().min(1, 'File data is required'),
});

const AnalyzeProfileInputSchema = z.object({
  jobDescription: FileUploadSchema,
  cv: FileUploadSchema,
});

export const profileRouter = router({
  // Health check endpoint
  health: publicProcedure.query(() => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'profile-analyzer',
    };
  }),

  // Test AI connection
  testAI: publicProcedure.query(async () => {
    try {
      const isConnected = await AIService.testConnection();
      return {
        connected: isConnected,
        timestamp: new Date().toISOString(),
        apiUrl: process.env.GEMINI_API_URL,
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to test AI connection',
        cause: error,
      });
    }
  }),



  // Main analysis endpoint
  analyzeProfile: protectedProcedure
    .input(AnalyzeProfileInputSchema)
    .mutation(async ({ input }): Promise<AnalyzeProfileOutput> => {
      try {
        console.log('Starting profile analysis...');

        // Validate that both files are PDFs
        if (!PDFService.isValidPDF(input.jobDescription.data)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Job description file is not a valid PDF',
          });
        }

        if (!PDFService.isValidPDF(input.cv.data)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'CV file is not a valid PDF',
          });
        }

        console.log('PDFs validated, extracting text...');

        // Extract text from both PDFs
        const [jobDescriptionText, cvText] = await Promise.all([
          PDFService.extractTextFromBase64(input.jobDescription.data),
          PDFService.extractTextFromBase64(input.cv.data),
        ]);

        // Validate that we got meaningful text content
        if (jobDescriptionText.trim().length < 10) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Job description PDF appears to be empty or unreadable',
          });
        }

        if (cvText.trim().length < 10) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'CV PDF appears to be empty or unreadable',
          });
        }

        console.log(`Extracted ${jobDescriptionText.length} chars from job description, ${cvText.length} chars from CV`);

        // Perform AI analysis
        console.log('Sending to AI for analysis...');
        const analysis = await AIService.analyzeProfile(cvText, jobDescriptionText);

        console.log('Analysis completed successfully');

        return {
          success: true,
          analysis,
        };

      } catch (error) {
        console.error('Error in analyzeProfile:', error);

        // Handle specific error types
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle PDF processing errors
        if (error instanceof Error && error.message.includes('PDF')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `PDF processing error: ${error.message}`,
            cause: error,
          });
        }

        // Handle AI service errors
        if (error instanceof Error && error.message.includes('API')) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `AI service error: ${error.message}`,
            cause: error,
          });
        }

        // Generic error handler
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          cause: error,
        });
      }
    }),


});
