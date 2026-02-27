import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://file-shareing-backend.vercel.app';

export default function ReceiveForm() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReceive = async (e) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/api/files/pin/${pin}`);
      if (response.data?.uuid) {
        navigate(`/download?uuid=${response.data.uuid}`);
      } else {
        setError('Invalid PIN');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid PIN or Server Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="receive-container">
      <h2>Receive File</h2>
      <form className="receive-form" onSubmit={handleReceive}>
        <input 
          type="text" 
          placeholder="Enter 6-Digit PIN" 
          maxLength={6} 
          required 
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Checking...' : 'Download'}
        </button>
      </form>
      {error && <div style={{ color: '#ff4d4f', marginTop: 10 }}>{error}</div>}
    </div>
  );
}
