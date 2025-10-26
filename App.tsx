
import React, { useState, useCallback } from 'react';
import type { VerificationResult } from './types';
import { verifyDocument } from './services/geminiService';
import FileUpload from './components/FileUpload';
import VerificationResultDisplay from './components/VerificationResultDisplay';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreviewUrl(null);
    }
  }, []);

  const handleVerification = async () => {
    if (!file) {
      setError('Please select a file to verify.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const verificationResult = await verifyDocument(file);
      setResult(verificationResult);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Verification failed: ${err.message}`);
      } else {
        setError('An unknown error occurred during verification.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  };


  return (
    <div className="min-h-screen bg-slate-100/50 font-sans text-slate-800">
      <main className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            AI Document Verification System
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Upload an official document to instantly analyze its authenticity, extract key information, and identify potential inconsistencies.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Upload and Controls */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">Upload Document</h2>
            <FileUpload onFileSelect={handleFileChange} file={file} previewUrl={previewUrl} />
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleVerification}
                disabled={!file || isLoading}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Spinner /> : 'Verify Document'}
              </button>
              <button
                onClick={handleClear}
                disabled={isLoading}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200/80 min-h-[300px] flex flex-col justify-center">
            <h2 className="text-2xl font-semibold mb-4 text-slate-800">Verification Results</h2>
            {isLoading && (
              <div className="flex flex-col items-center justify-center text-center text-slate-500">
                <Spinner size="lg"/>
                <p className="mt-4 font-medium">Analyzing document...</p>
                <p className="text-sm">This may take a moment.</p>
              </div>
            )}
            {error && (
              <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}
            {!isLoading && !error && result && <VerificationResultDisplay result={result} />}
            {!isLoading && !error && !result && (
              <div className="text-center text-slate-500">
                <p>Results will be displayed here after verification.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
