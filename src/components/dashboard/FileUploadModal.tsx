import React, { useState } from 'react';
import { filesAPI } from '../../services/api';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import './FileUploadModal.css';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded: () => void;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileUploaded
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFilename, setCustomFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const { theme } = useTheme();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCustomFilename(file.name);
    setError('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !customFilename.trim()) {
      setError('Please select a file and provide a custom filename');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customFilename', customFilename.trim());

      await filesAPI.upload(formData);
      
      // Reset form
      setSelectedFile(null);
      setCustomFilename('');
      
      onFileUploaded();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setCustomFilename('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`file-upload-modal-overlay ${theme}`} onClick={handleClose}>
      <div className="file-upload-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <Upload className="me-2" size={20} />
              Upload File
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={uploading}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <AlertCircle className="me-2" size={16} />
                  {error}
                </div>
              )}

              <div
                className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                {selectedFile ? (
                  <div className="file-preview">
                    <FileText className="file-preview-icon" size={48} />
                    <div className="file-preview-info">
                      <div className="fw-semibold">{selectedFile.name}</div>
                      <small>
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                      </small>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="drop-zone-icon" size={48} />
                    <h6>Drop your file here or click to browse</h6>
                    <p>Maximum file size: 50MB</p>
                  </div>
                )}
                
                <input
                  type="file"
                  id="fileInput"
                  className="d-none"
                  onChange={handleFileInputChange}
                  disabled={uploading}
                />
              </div>

              <div className="my-3">
                <label htmlFor="customFilename" className="form-label">
                  Custom Filename <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="customFilename"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder="Enter a custom name for your file"
                  required
                  disabled={uploading}
                />
                <div className="form-text">
                  This name will be used to identify your file in the system.
                </div>
              </div>

              {selectedFile && (
                <div className="card glass p-3">
                  <h6 className="mb-2">File Information</h6>
                  <div className="row">
                    <div className="col-sm-6">
                      <small className="text-muted d-block">Original Name</small>
                      <small>{selectedFile.name}</small>
                    </div>
                    <div className="col-sm-3">
                      <small className="text-muted d-block">Size</small>
                      <small>{formatFileSize(selectedFile.size)}</small>
                    </div>
                    <div className="col-sm-3">
                      <small className="text-muted d-block">Type</small>
                      <small>{selectedFile.type || 'Unknown'}</small>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!selectedFile || !customFilename.trim() || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="me-2" size={16} />
                    Upload File
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;