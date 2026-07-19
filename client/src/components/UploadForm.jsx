import { useState, useRef } from 'react';
import './UploadForm.css';

export default function UploadForm({ onUpload, loading }) {
  const [file, setFile] = useState(null);
  const [testName, setTestName] = useState('');
  const [recordId, setRecordId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (testName) formData.append('testName', testName);
    if (recordId) formData.append('recordId', recordId);
    if (doctorId) formData.append('doctorId', doctorId);

    try {
      await onUpload(formData);
      setSuccess('File uploaded successfully!');
      setFile(null);
      setTestName('');
      setRecordId('');
      setDoctorId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    }
  };

  return (
    <div className="upload-form-card">
      <h2 className="upload-form-title">Upload Lab Result</h2>

      <form onSubmit={handleSubmit}>
        {/* Drag & Drop Zone */}
        <div
          className={`upload-dropzone${dragOver ? ' drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-dropzone-icon">
            <span className="material-symbols-outlined">cloud_upload</span>
          </div>
          <p className="upload-dropzone-text">
            Drop your file here or <span onClick={() => fileInputRef.current?.click()}>browse</span>
          </p>
          <p className="upload-dropzone-hint">PDF, JPG, PNG up to 10MB</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </div>

        {/* Selected File */}
        {file && (
          <div className="upload-selected-file">
            <span className="material-symbols-outlined">description</span>
            <span className="upload-selected-file-name">{file.name}</span>
            <button type="button" className="upload-selected-file-remove" onClick={removeFile}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* Form Fields */}
        <div className="upload-form-fields">
          <div className="upload-form-field">
            <label className="upload-form-label" htmlFor="upload-test-name">Test Name</label>
            <input
              id="upload-test-name"
              className="upload-form-input"
              type="text"
              placeholder="e.g. Complete Blood Count"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>

          <div className="upload-form-field">
            <label className="upload-form-label" htmlFor="upload-record-id">Related Record ID</label>
            <input
              id="upload-record-id"
              className="upload-form-input"
              type="text"
              placeholder="Enter record ID (optional)"
              value={recordId}
              onChange={(e) => setRecordId(e.target.value)}
            />
          </div>

          <div className="upload-form-field">
            <label className="upload-form-label" htmlFor="upload-doctor-id">Doctor ID</label>
            <input
              id="upload-doctor-id"
              className="upload-form-input"
              type="text"
              placeholder="Enter doctor ID (optional)"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="upload-form-submit" disabled={loading}>
          {loading ? (
            <>
              <span className="upload-btn-spinner" />
              Uploading...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">upload</span>
              Upload Result
            </>
          )}
        </button>
      </form>

      {/* Messages */}
      {success && (
        <div className="upload-success">
          <span className="material-symbols-outlined">check_circle</span>
          {success}
        </div>
      )}
      {error && (
        <div className="upload-error">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}
    </div>
  );
}
