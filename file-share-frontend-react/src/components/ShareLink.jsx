import { useState } from 'react';
import axios from 'axios';
import { Copy, Mail } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://filesharebackend.vercel.app';

export default function ShareLink({ fileUrl, pin, qrCode, uuid, onReset }) {
  const [emailTo, setEmailTo] = useState('');
  const [emailFrom, setEmailFrom] = useState('fileshare.too@gmail.com');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fileUrl);
    setMessage('Copied to clipboard!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEmailSend = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setMessage('');
    try {
      await axios.post(`${API_BASE_URL}/api/files/send`, {
        uuid, emailTo, emailFrom
      });
      setMessage('Email Sent Successfully');
      setEmailTo('');
      setEmailFrom('');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="sharing-container" style={{ background: '#121212', padding: 20 }}>
      {qrCode && (
        <div className="qr-code-container">
          <img src={qrCode} alt="QR Code" style={{ width: 150 }} />
          {pin && <div className="pin-display">PIN: <span>{pin}</span></div>}
        </div>
      )}

      <div className="input-container">
        <input type="text" value={fileUrl} readOnly onClick={(e) => e.target.select()} />
        <Copy className="copy-icon" onClick={copyToClipboard} />
      </div>

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <p>Or Send via Email</p>
        <form onSubmit={handleEmailSend} className="email-container" style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <input 
            type="email" 
            placeholder="Your Email" 
            required 
            readOnly
            value={emailFrom} 
            onChange={(e) => setEmailFrom(e.target.value)}
            style={{ padding: 10, borderRadius: 5, width: 300, background: '#1a1a1a', color: 'gray', border: '1px solid #333', pointerEvents: 'none' }}
          />
          <input 
            type="email" 
            placeholder="Your Email" 
            required 
            value={emailTo} 
            onChange={(e) => setEmailTo(e.target.value)}
            style={{ padding: 10, borderRadius: 5, width: 300, background: '#1a1a1a', color: 'white', border: '1px solid var(--light-blue)' }}
          />
          <button type="submit" disabled={isSending} style={{ padding: '10px 30px', background: 'var(--light-blue)', border: 'none', color: 'black', borderRadius: 5, cursor: isSending ? 'not-allowed' : 'pointer' }}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      {message && <div style={{ textAlign: 'center', color: 'var(--light-blue)', marginTop: 10 }}>{message}</div>}

      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <button onClick={onReset} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid var(--light-blue)', color: 'var(--light-blue)', borderRadius: 5, cursor: 'pointer' }}>
          Upload Another File
        </button>
      </div>
    </div>
  );
}
