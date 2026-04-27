import { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseExcelFile } from '../utils/excelParser';

export default function UploadScreen({ onFileUploaded }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await parseExcelFile(file);
      onFileUploaded(data);
    } catch (err) {
      setError(err.message || 'Failed to parse the Excel file. Please check the format and try again.');
      setIsLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
    e.target.value = '';
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo / header */}
        <div style={s.brand}>
          <div style={s.logoBox}>
            <FileSpreadsheet size={34} color="#fff" />
          </div>
          <h1 style={s.title}>WSR Compliance Analyser</h1>
          <p style={s.subtitle}>
            Upload your WSR Excel file to generate a detailed compliance report
          </p>
        </div>

        {/* Drop zone */}
        <div
          style={{
            ...s.dropZone,
            ...(isDragOver ? s.dropZoneActive : {}),
            ...(isLoading ? s.dropZoneDisabled : {}),
          }}
          onDragOver={(e) => { e.preventDefault(); if (!isLoading) setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {isLoading ? (
            <div style={s.loadingWrap}>
              <div style={s.spinner} />
              <p style={s.loadingText}>Parsing Excel file…</p>
              <p style={s.loadingHint}>Extracting projects and week data</p>
            </div>
          ) : (
            <div style={s.dropContent}>
              <div style={s.uploadIconWrap}>
                <UploadCloud
                  size={52}
                  color={isDragOver ? '#1e4d8c' : '#94a3b8'}
                  strokeWidth={1.5}
                />
              </div>
              <p style={s.dropMain}>
                {isDragOver ? 'Release to upload' : 'Drag & drop your Excel file here'}
              </p>
              <p style={s.dropOr}>— or —</p>
              <button style={s.browseBtn} type="button" tabIndex={-1}>
                Choose File
              </button>
              <p style={s.formatHint}>.xlsx and .xls formats supported</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <AlertCircle size={17} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={s.errorText}>{error}</span>
          </div>
        )}

        {/* Expected format info */}
        <div style={s.infoBox}>
          <div style={s.infoHeader}>
            <CheckCircle2 size={15} color="#2563eb" />
            <span style={s.infoHeaderText}>Expected file structure</span>
          </div>
          <ul style={s.infoList}>
            <li><strong>Row 1:</strong> Month names (starting at column I)</li>
            <li><strong>Row 2:</strong> Week labels – Week-1, Week-2, … (starting at column I)</li>
            <li><strong>Row 3+:</strong> Project data with GDL, Account, Project, DA, Frequency, Status</li>
            <li><strong>Column H:</strong> Status (YES / NO) • <strong>Column G:</strong> Frequency</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(150deg, #e8eef5 0%, #dde6f0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    boxShadow: '0 8px 40px rgba(12,35,64,0.13)',
    padding: '48px 44px',
    width: '100%',
    maxWidth: '540px',
    animation: 'fadeIn 0.4s ease',
  },
  brand: {
    textAlign: 'center',
    marginBottom: '36px',
  },
  logoBox: {
    width: '68px',
    height: '68px',
    background: 'linear-gradient(135deg, #0c2340 0%, #1e4d8c 100%)',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 18px',
    boxShadow: '0 4px 16px rgba(12,35,64,0.25)',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0c2340',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.6',
  },
  dropZone: {
    border: '2px dashed #cbd5e1',
    borderRadius: '14px',
    padding: '44px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f8fafc',
    marginBottom: '16px',
    outline: 'none',
  },
  dropZoneActive: {
    border: '2px dashed #1e4d8c',
    background: '#eff6ff',
    transform: 'scale(1.01)',
  },
  dropZoneDisabled: {
    cursor: 'not-allowed',
    opacity: 0.75,
  },
  dropContent: {},
  uploadIconWrap: {
    marginBottom: '14px',
  },
  dropMain: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#334155',
    marginBottom: '8px',
  },
  dropOr: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '14px',
  },
  browseBtn: {
    background: 'linear-gradient(135deg, #0c2340 0%, #1e4d8c 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 28px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '14px',
    boxShadow: '0 2px 8px rgba(12,35,64,0.25)',
  },
  formatHint: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #1e4d8c',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#334155',
  },
  loadingHint: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 16px',
    marginBottom: '16px',
  },
  errorText: {
    fontSize: '13px',
    color: '#dc2626',
    lineHeight: '1.5',
  },
  infoBox: {
    background: '#f0f7ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '16px',
    marginTop: '8px',
  },
  infoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    marginBottom: '10px',
  },
  infoHeaderText: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1e40af',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  infoList: {
    margin: 0,
    paddingLeft: '18px',
    fontSize: '12px',
    color: '#475569',
    lineHeight: '1.9',
  },
};
