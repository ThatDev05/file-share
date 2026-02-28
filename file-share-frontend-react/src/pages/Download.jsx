import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://filesharebackend.vercel.app';

export default function Download() {
  const [searchParams] = useSearchParams();
  const uuid = searchParams.get('uuid');
  
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uuid) {
      setError('No file ID provided');
      setIsLoading(false);
      return;
    }

    axios.get(`${API_BASE_URL}/api/files/info/${uuid}`)
      .then(res => {
        setFileData(res.data);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Link has expired or file not found');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [uuid]);

  if (isLoading) {
    return (
      <section className="download">
        <h2>Loading file info...</h2>
      </section>
    );
  }

  if (error) {
    return (
      <section className="download">
        <img className="download__icon" src="/img/download-sd.svg" alt="inshare-download" />
        <div id="error-container">
          <h4 id="error-msg">{error} 😏</h4>
        </div>
      </section>
    );
  }

  return (
    <section className="download">
      <img className="download__icon" src="/img/download-sd.svg" alt="inshare-download" />
      <div id="success-container">
        <h2>Your file is ready to download</h2>
        <p>Link expires in 24 hours</p>
        <div className="download__meta">
          <h4>{fileData?.fileName}</h4>
          <small>{Math.round((fileData?.fileSize || 0) / 1000)} KB</small>
        </div>
        <div className="send-btn-container">
          <a href={`${API_BASE_URL}/files/download/${uuid}`}>Download file</a>
        </div>
      </div>
    </section>
  );
}
