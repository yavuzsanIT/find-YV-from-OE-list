import React, { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFilename(res.data.filename);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = () => {
    if (!filename) return;
    window.location.href = `${API_URL}/api/download/${filename}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Excel File Processor</h2>
        <div
          className="border-2 border-dashed border-gray-300 rounded p-4 mb-4 text-center cursor-pointer"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          {file ? (
            <span className="text-green-600">{file.name}</span>
          ) : (
            <span className="text-gray-500">Drag & drop your Excel file here</span>
          )}
        </div>
        <input
          type="file"
          accept=".xlsx,.xls"
          className="mb-4 w-full"
          onChange={handleFileChange}
        />
        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleUpload}
          disabled={uploading || !file}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        {filename && (
          <button
            className="w-full mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            onClick={handleDownload}
          >
            Download Processed Excel
          </button>
        )}
        {error && (
          <div className="mt-4 text-red-600 text-center">{error}</div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
