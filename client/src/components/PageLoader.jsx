import './PageLoader.css';

export default function PageLoader({ message = 'Loading data...', fullScreen = false }) {
  return (
    <div className={`page-loader${fullScreen ? ' page-loader-fullscreen' : ''}`}>
      <div className="page-loader-content">
        <div className="page-loader-spinner"></div>
        <p className="page-loader-text">{message}</p>
      </div>
    </div>
  );
}
