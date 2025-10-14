import React, { useState } from 'react';
import { filesAPI } from '../../services/api';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

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
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content glass">
          <div className="modal-header border-bottom border-secondary">
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
                <div className="alert alert-danger glass d-flex align-items-center" role="alert">
                  <AlertCircle className="me-2" size={16} />
                  {error}
                </div>
              )}

              {/* File Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-3 p-4 text-center mb-4 ${
                  dragOver ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {selectedFile ? (
                  <div className="d-flex align-items-center justify-content-center">
                    <FileText className="text-primary me-3" size={32} />
                    <div className="text-start">
                      <div className="fw-semibold">{selectedFile.name}</div>
                      <small className="text-muted">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                      </small>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="text-muted mb-3" size={48} />
                    <h6>Drop your file here or click to browse</h6>
                    <p className="text-muted mb-0">
                      Maximum file size: 50MB
                    </p>
                  </div>
                )}
                
                <input
                  type="file"
                  className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                  style={{ cursor: 'pointer' }}
                  onChange={handleFileInputChange}
                  disabled={uploading}
                />
              </div>

              {/* Custom Filename */}
              <div className="mb-3">
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

              {/* File Info */}
              {selectedFile && (
                <div className="card glass-strong p-3">
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

            <div className="modal-footer border-top border-secondary">
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