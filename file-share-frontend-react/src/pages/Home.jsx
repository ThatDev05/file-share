import { useState } from 'react';
import UploadForm from '../components/UploadForm';
import ShareLink from '../components/ShareLink';
import ReceiveForm from '../components/ReceiveForm';

export default function Home() {
  const [fileData, setFileData] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      
      {!fileData ? (
        <UploadForm onUploadSuccess={setFileData} />
      ) : (
        <ShareLink 
           fileUrl={fileData.file} 
           pin={fileData.pin} 
           qrCode={fileData.qrCode} 
           uuid={fileData.uuid}
           onReset={() => setFileData(null)}
        />
      )}

      <ReceiveForm />
    </div>
  );
}
