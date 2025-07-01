import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../../lib/trpc';
import { FileText, User, Upload, X, Loader2, RefreshCw, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

// Form validation schema
const analysisSchema = z.object({
  jobDescription: z.instanceof(File).optional(),
  cv: z.instanceof(File).optional(),
});

type AnalysisFormData = z.infer<typeof analysisSchema>;

interface ProfileAnalyzerProps {
  className?: string;
}

// File Upload Component
const FileUploadArea: React.FC<{
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  error?: string;
  accept?: string;
  maxSize?: number;
  label: string;
  icon: React.ReactNode;
  iconClass: string;
}> = ({ onFileSelect, selectedFile, error, accept = '.pdf', maxSize = 10 * 1024 * 1024, label, icon, iconClass }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleClick = () => {
    const input = document.getElementById(`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`);
    input?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-item">
      <div className="upload-label">
        <div className={`icon ${iconClass}`}>
          {icon}
        </div>
        {label}
      </div>

      <div
        className={`upload-area ${isDragOver ? 'dragover' : ''} ${error ? 'error' : ''} ${selectedFile ? 'file-selected' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          id={`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="file-input"
        />

        {!selectedFile ? (
          <>
            <Upload className="upload-icon" />
            <div className="upload-text">Click to upload or drag and drop</div>
            <div className="upload-hint">{accept} files up to {Math.round(maxSize / (1024 * 1024))}MB</div>
          </>
        ) : (
          <div className="file-info">
            <div className="file-details">
              <div className="file-icon">
                <FileText size={20} />
              </div>
              <div>
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">{formatFileSize(selectedFile.size)}</div>
              </div>
            </div>
            <button
              type="button"
              className="remove-btn"
              onClick={handleRemove}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
    </div>
  );
};

// Score Visualization Component
const ScoreVisualization: React.FC<{ score: number }> = ({ score }) => {
  const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-poor';
  };



  return (
    <div className="score-section">
      <div className={`score-circle ${getScoreClass(score)}`}>
        <div className="score-number">{score}%</div>
      </div>
    </div>
  );
};

// Analysis Results Component
const AnalysisResults: React.FC<{
  analysis: {
    strengths: string[];
    weaknesses: string[];
    alignment: {
      score: number;
      explanation: string;
    };
    recommendations: string[];
  };
  onReset: () => void;
}> = ({ analysis, onReset }) => {
  return (
    <div className="results-container fade-in">
      <div className="results-header">
        <h2 className="results-title">Analysis Results</h2>
        <button className="btn btn-secondary" onClick={onReset}>
          <RefreshCw size={20} />
          New Analysis
        </button>
      </div>

      <ScoreVisualization score={analysis.alignment.score} />

      <div className="result-card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div className="card-icon" style={{ background: '#f3f4f6', color: '#374151' }}>
            <FileText size={24} />
          </div>
          <h3 className="card-title">Assessment Summary</h3>
        </div>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>{analysis.alignment.explanation}</p>
      </div>

      <div className="results-grid">
        {/* Key Strengths */}
        <div className="result-card">
          <div className="card-header">
            <div className="card-icon strength-icon">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="card-title">Key Strengths</h3>
          </div>
          <ul className="result-list">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="result-item">
                <div className="item-bullet strength-bullet"></div>
                <div className="item-text">{strength}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="result-card">
          <div className="card-header">
            <div className="card-icon weakness-icon">
              <AlertTriangle size={24} />
            </div>
            <h3 className="card-title">Areas for Improvement</h3>
          </div>
          <ul className="result-list">
            {analysis.weaknesses.map((weakness, index) => (
              <li key={index} className="result-item">
                <div className="item-bullet weakness-bullet"></div>
                <div className="item-text">{weakness}</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendations */}
        <div className="result-card">
          <div className="card-header">
            <div className="card-icon recommendation-icon">
              <Lightbulb size={24} />
            </div>
            <h3 className="card-title">Recommendations</h3>
          </div>
          <ul className="result-list">
            {analysis.recommendations.map((recommendation, index) => (
              <li key={index} className="result-item">
                <div className="item-bullet recommendation-bullet"></div>
                <div className="item-text">{recommendation}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Main ProfileAnalyzer Component
export const ProfileAnalyzer: React.FC<ProfileAnalyzerProps> = ({ className }) => {
  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [fileErrors, setFileErrors] = useState<{ jobDescription?: string; cv?: string }>({});

  const { handleSubmit, setValue, reset } = useForm<AnalysisFormData>({
    resolver: zodResolver(analysisSchema),
  });

  const analyzeProfileMutation = trpc.profile.analyzeProfile.useMutation();

  // Convert File to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = (type: 'jobDescription' | 'cv') => (file: File | null) => {
    if (!file) {
      if (type === 'jobDescription') {
        setJobDescriptionFile(null);
        setValue('jobDescription', undefined);
      } else {
        setCvFile(null);
        setValue('cv', undefined);
      }
      setFileErrors(prev => ({ ...prev, [type]: undefined }));
      return;
    }

    // Validate file
    if (!file.type.includes('pdf')) {
      setFileErrors(prev => ({ ...prev, [type]: 'File must be a PDF' }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileErrors(prev => ({ ...prev, [type]: 'File size must be less than 10MB' }));
      return;
    }

    // Set file
    if (type === 'jobDescription') {
      setJobDescriptionFile(file);
      setValue('jobDescription', file);
    } else {
      setCvFile(file);
      setValue('cv', file);
    }
    setFileErrors(prev => ({ ...prev, [type]: undefined }));
  };

  const onSubmit = async (data: AnalysisFormData) => {
    if (!jobDescriptionFile || !cvFile) {
      setFileErrors({
        jobDescription: !jobDescriptionFile ? 'Job description is required' : undefined,
        cv: !cvFile ? 'CV is required' : undefined,
      });
      return;
    }

    try {
      setFileErrors({});

      // Convert files to base64
      const [jobDescriptionData, cvData] = await Promise.all([
        fileToBase64(jobDescriptionFile),
        fileToBase64(cvFile),
      ]);

      // Call the tRPC mutation
      await analyzeProfileMutation.mutateAsync({
        jobDescription: {
          name: jobDescriptionFile.name,
          type: jobDescriptionFile.type,
          size: jobDescriptionFile.size,
          data: jobDescriptionData,
        },
        cv: {
          name: cvFile.name,
          type: cvFile.type,
          size: cvFile.size,
          data: cvData,
        },
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as any).message
        : 'Analysis failed. Please try again.';

      setFileErrors(prev => ({ ...prev, jobDescription: errorMessage }));
    }
  };

  const handleReset = () => {
    setJobDescriptionFile(null);
    setCvFile(null);
    setFileErrors({});
    reset();
    analyzeProfileMutation.reset();
  };

  // Show results if analysis is successful
  if (analyzeProfileMutation.isSuccess && analyzeProfileMutation.data?.analysis) {
    return (
      <AnalysisResults
        analysis={analyzeProfileMutation.data.analysis}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="upload-section">
          <h2 className="upload-title">Upload Documents</h2>
          <p className="upload-subtitle">Upload both documents to begin the AI analysis</p>

          <div className="upload-grid">
            <FileUploadArea
              onFileSelect={handleFileSelect('jobDescription')}
              selectedFile={jobDescriptionFile}
              error={fileErrors.jobDescription}
              label="Job Description"
              icon={<FileText size={20} />}
              iconClass="job-icon"
            />

            <FileUploadArea
              onFileSelect={handleFileSelect('cv')}
              selectedFile={cvFile}
              error={fileErrors.cv}
              label="Candidate CV"
              icon={<User size={20} />}
              iconClass="cv-icon"
            />
          </div>
        </div>

        <div className="action-section">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!jobDescriptionFile || !cvFile || analyzeProfileMutation.isPending}
          >
            {analyzeProfileMutation.isPending ? (
              <>
                <Loader2 size={20} className="spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FileText size={20} />
                Analyze Match
              </>
            )}
          </button>

          {(jobDescriptionFile || cvFile) && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={analyzeProfileMutation.isPending}
            >
              <RefreshCw size={20} />
              Reset
            </button>
          )}
        </div>

        {/* Loading State */}
        {analyzeProfileMutation.isPending && (
          <div className="status-card status-loading">
            <Loader2 size={24} className="status-icon spin" />
            <div className="status-content">
              <h4>AI Analysis in Progress</h4>
              <p>This may take 10-30 seconds while our AI analyzes the documents...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {analyzeProfileMutation.isError && (
          <div className="status-card status-error">
            <AlertTriangle size={24} className="status-icon" />
            <div className="status-content">
              <h4>Analysis Failed</h4>
              <p>{analyzeProfileMutation.error?.message || 'An unexpected error occurred. Please try again.'}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileAnalyzer;
