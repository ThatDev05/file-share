import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Download from './pages/Download';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <a href="/">
          <img src="https://raw.githubusercontent.com/ThatDev05/file-share/main/file-share-frontend-react/public/img/logo.png" alt="Inshare logo" className="logo" />
        </a>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/download" element={<Download />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
