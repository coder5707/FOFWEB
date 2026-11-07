import React, { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { downloadExcel } from '../api';

export default function ExcelExportButton({
  endpoint,
  filename,
  params = {},
  label = 'Export to Excel',
  className = '',
  onSuccess,
  onError
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      await downloadExcel(endpoint, filename, params);
      if (onSuccess) onSuccess(`Successfully exported ${filename || 'Excel file'}`);
    } catch (err) {
      console.error('Export error:', err);
      if (onError) onError(err.message || 'Failed to export Excel file');
      else alert(`Export failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className={`btn btn-excel ${className}`}
      title="Download formatted genuine Excel (.xlsx) file with all records"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <FileSpreadsheet size={17} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
