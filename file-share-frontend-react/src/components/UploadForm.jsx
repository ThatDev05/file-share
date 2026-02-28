import { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://filesharebackend.vercel.app';

export default function UploadForm({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const maxAllowedSize = 20 * 1024 * 1024; // 20MB limit

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > maxAllowedSize) {
      setError('Max file size is 20MB');
      return;
    }
    
    setError(null);
    setIsUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      
      if (response.data?.file) {
        onUploadSuccess(response.data);
      } else {
        setError(response.data?.error || 'Upload failed validation');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed due to server error');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <section className="upload-container" style={{ width: 'var(--container-width)'}}>
      <div 
        className={`drop-zone ${isDragging ? 'dragged' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <div className="icon-container" style={{ display: 'flex', justifyContent: 'center' }}>
          <UploadCloud size={64} color="var(--light-blue)" />
        </div>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => handleFile(e.target.files[0])} 
            disabled={isUploading}
        />
        <div className="title" style={{ marginTop: 20 }}>
          {isUploading ? 'Uploading...' : <span>Drop your Files here or, <span id="browseBtn">browse</span></span>}
        </div>
      </div>

      {isUploading && (
        <div className="progress-container" style={{ display: 'block' }}>
          <div className="bg-progress" style={{ transform: `scaleX(${progress / 100})` }}></div>
          <div className="inner-container">
            <div className="status">{progress === 100 ? 'Processing...' : 'Uploading...'}</div>
            <div className="percent-container">
              <span className="percentage">{progress}</span>%
            </div>
            <div className="progress-bar" style={{ transform: `scaleX(${progress / 100})` }}></div>
          </div>
        </div>
      )}

      {error && <div style={{ color: '#ff4d4f', padding: 10 }}>{error}</div>}
    </section>
  );
}
