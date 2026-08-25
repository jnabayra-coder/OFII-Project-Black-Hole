import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Trash2, 
  Edit3, 
  Check, 
  Search, 
  Filter, 
  Building2, 
  User, 
  Clock, 
  Layers, 
  RefreshCw,
  CopyCheck,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { 
  ForwardingProgressiveRecord, 
  ClientSummary, 
  DispatchRecord, 
  OFIIFieldKey, 
  ImportHistoryRecord 
} from '../types';
import { 
  readExcelFile, 
  autoMapHeaders, 
  downloadSampleExcelTemplate, 
  OFII_FIELD_DEFINITIONS 
} from '../utils/excelParser';
import { 
  validateImportRows, 
  ValidationSummary, 
  ValidatedImportRow,
  RowValidationStatus 
} from '../utils/excelValidation';
import { EditImportRowModal } from './EditImportRowModal';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientSummary[];
  existingForwardingRecords: ForwardingProgressiveRecord[];
  existingDispatches: DispatchRecord[];
  currentUserName: string;
  onConfirmBulkImport: (
    recordsToImport: ForwardingProgressiveRecord[],
    summary: {
      fileName: string;
      fileSize: string;
      totalRows: number;
      importedCount: number;
      warningCount: number;
      skippedCount: number;
    }
  ) => Promise<void>;
  onOpenAddClientModal?: (initialName: string) => void;
}

type ImportStep = 'UPLOAD' | 'MAPPING' | 'PREVIEW' | 'IMPORTING' | 'COMPLETE';

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  clients,
  existingForwardingRecords,
  existingDispatches,
  currentUserName,
  onConfirmBulkImport,
  onOpenAddClientModal,
}) => {
  if (!isOpen) return null;

  // Multi-step State
  const [currentStep, setCurrentStep] = useState<ImportStep>('UPLOAD');

  // Step 1: Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSizeFormatted, setFileSizeFormatted] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Raw file parsed data
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelRawRows, setExcelRawRows] = useState<Record<string, any>[]>([]);

  // Step 2: Column Mapping state
  const [columnMapping, setColumnMapping] = useState<Record<string, OFIIFieldKey>>({});

  // Step 3: Validation & Preview state
  const [validatedRows, setValidatedRows] = useState<ValidatedImportRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'WARNING' | 'INVALID' | 'DUPLICATE'>('ALL');
  const [previewSearch, setPreviewSearch] = useState('');
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // Step 4 & 5: Progress & Final Summary
  const [importProgress, setImportProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [finalImportStats, setFinalImportStats] = useState<{
    totalProcessed: number;
    imported: number;
    warnings: number;
    skipped: number;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // STEP 1 HANDLERS: FILE UPLOAD & PARSING
  // ---------------------------------------------------------------------------
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setUploadError('Unsupported file format. Please upload .xlsx or .xls.');
      return;
    }

    setUploadError(null);
    setIsReadingFile(true);
    setSelectedFile(file);

    try {
      const { headers, rows, fileName: fName, fileSizeFormatted: fSize } = await readExcelFile(file);
      setFileName(fName);
      setFileSizeFormatted(fSize);
      setExcelHeaders(headers);
      setExcelRawRows(rows);

      // Intelligent Auto-Mapping
      const autoMap = autoMapHeaders(headers);
      setColumnMapping(autoMap);
      setIsReadingFile(false);
    } catch (err: any) {
      setIsReadingFile(false);
      setUploadError(err.message || 'Unable to read this Excel file.');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileName('');
    setFileSizeFormatted('');
    setExcelHeaders([]);
    setExcelRawRows([]);
    setColumnMapping({});
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------------------------------------------------------------------------
  // STEP 2 HANDLERS: COLUMN MAPPING & PROCEED TO VALIDATION
  // ---------------------------------------------------------------------------
  const handleMappingChange = (header: string, field: OFIIFieldKey) => {
    setColumnMapping((prev) => ({
      ...prev,
      [header]: field,
    }));
  };

  const requiredFields = useMemo(() => {
    return OFII_FIELD_DEFINITIONS.filter((d) => d.required);
  }, []);

  const unmappedRequiredFields = useMemo(() => {
    const mappedFieldValues = new Set(Object.values(columnMapping));
    return requiredFields.filter((req) => !mappedFieldValues.has(req.key));
  }, [columnMapping, requiredFields]);

  const handleProceedToValidation = () => {
    const summary = validateImportRows(
      excelRawRows,
      columnMapping,
      clients,
      existingForwardingRecords,
      existingDispatches
    );
    setValidatedRows(summary.rows);
    setCurrentStep('PREVIEW');
  };

  // ---------------------------------------------------------------------------
  // STEP 3 HANDLERS: PREVIEW, EDITING, & DUPLICATE ACTIONS
  // ---------------------------------------------------------------------------
  const handleToggleRowSelect = (rowIndex: number) => {
    setValidatedRows((prev) =>
      prev.map((r) => {
        if (r.rowIndex === rowIndex) {
          return { ...r, isSelectedForImport: !r.isSelectedForImport };
        }
        return r;
      })
    );
  };

  const handleDuplicateActionChange = (rowIndex: number, action: 'skip' | 'import_anyway') => {
    setValidatedRows((prev) =>
      prev.map((r) => {
        if (r.rowIndex === rowIndex) {
          return {
            ...r,
            duplicateAction: action,
            isSelectedForImport: action === 'import_anyway',
          };
        }
        return r;
      })
    );
  };

  const handleMapRowClient = (rowIndex: number, clientName: string) => {
    const matched = clients.find(
      (c) => c.name.trim().toLowerCase() === clientName.trim().toLowerCase()
    );
    const coordinator = matched?.assignedCoordinator || matched?.accountManager || 'Alodia Manalansan';

    setValidatedRows((prev) =>
      prev.map((r) => {
        if (r.rowIndex === rowIndex) {
          const updatedRecord = {
            ...r.mappedRecord,
            client: clientName,
            clientId: matched?.id,
            coordinator,
          };
          const cleanWarnings = r.warnings.filter((w) => !w.toLowerCase().includes('unknown client'));
          const newStatus: RowValidationStatus = r.errors.length > 0 ? 'INVALID' : (r.isDuplicate ? 'DUPLICATE' : (cleanWarnings.length > 0 ? 'WARNING' : 'VALID'));
          return {
            ...r,
            mappedRecord: updatedRecord,
            isClientRecognized: !!matched,
            recognizedClient: matched,
            assignedCoordinator: coordinator,
            warnings: cleanWarnings,
            status: newStatus,
            isSelectedForImport: newStatus !== 'INVALID',
          };
        }
        return r;
      })
    );
  };

  const handleSaveEditedRow = (updatedRecord: ForwardingProgressiveRecord, isRecognized: boolean) => {
    if (editingRowIndex === null) return;

    setValidatedRows((prev) =>
      prev.map((r) => {
        if (r.rowIndex === editingRowIndex) {
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!updatedRecord.client) errors.push('Missing Client Name');
          if (!updatedRecord.consignee) errors.push('Missing Consignee');
          if (!updatedRecord.modeOfShipment) errors.push('Missing Mode');
          if (!updatedRecord.area) errors.push('Missing Area');
          if (!updatedRecord.referenceNumber) errors.push('Missing Reference Number');
          if (!updatedRecord.actualDispatchDate) errors.push('Missing Dispatch Date');

          if (!isRecognized) {
            warnings.push(`Unknown Client: "${updatedRecord.client}". Map to existing client or register.`);
          }

          let newStatus: RowValidationStatus = 'VALID';
          if (errors.length > 0) newStatus = 'INVALID';
          else if (r.isDuplicate && r.duplicateAction === 'skip') newStatus = 'DUPLICATE';
          else if (warnings.length > 0) newStatus = 'WARNING';

          return {
            ...r,
            mappedRecord: updatedRecord,
            status: newStatus,
            errors,
            warnings,
            isClientRecognized: isRecognized,
            assignedCoordinator: updatedRecord.coordinator,
            isSelectedForImport: newStatus !== 'INVALID',
          };
        }
        return r;
      })
    );
    setEditingRowIndex(null);
  };

  // Preview Filtered Rows
  const filteredPreviewRows = useMemo(() => {
    return validatedRows.filter((r) => {
      // 1. Status Tab Filter
      if (previewFilter === 'VALID' && r.status !== 'VALID') return false;
      if (previewFilter === 'WARNING' && r.status !== 'WARNING') return false;
      if (previewFilter === 'INVALID' && r.status !== 'INVALID') return false;
      if (previewFilter === 'DUPLICATE' && r.status !== 'DUPLICATE') return false;

      // 2. Search Filter
      if (previewSearch.trim()) {
        const q = previewSearch.toLowerCase();
        const matches =
          r.mappedRecord.client.toLowerCase().includes(q) ||
          r.mappedRecord.consignee.toLowerCase().includes(q) ||
          r.mappedRecord.referenceNumber.toLowerCase().includes(q) ||
          r.mappedRecord.podNumber.toLowerCase().includes(q) ||
          r.mappedRecord.coordinator.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [validatedRows, previewFilter, previewSearch]);

  // Statistics
  const previewStats = useMemo(() => {
    const total = validatedRows.length;
    const valid = validatedRows.filter((r) => r.status === 'VALID').length;
    const warning = validatedRows.filter((r) => r.status === 'WARNING').length;
    const invalid = validatedRows.filter((r) => r.status === 'INVALID').length;
    const duplicate = validatedRows.filter((r) => r.status === 'DUPLICATE').length;
    const readyToImport = validatedRows.filter((r) => r.isSelectedForImport && r.status !== 'INVALID').length;

    return { total, valid, warning, invalid, duplicate, readyToImport };
  }, [validatedRows]);

  // ---------------------------------------------------------------------------
  // STEP 4 & 5: CONFIRM BULK IMPORT EXECUTION
  // ---------------------------------------------------------------------------
  const handleConfirmImport = async () => {
    const validRecords = validatedRows
      .filter((r) => r.isSelectedForImport && r.status !== 'INVALID')
      .map((r) => r.mappedRecord);

    if (validRecords.length === 0) return;

    setCurrentStep('IMPORTING');
    setImportProgress(10);
    setProcessedCount(0);

    const totalToProcess = validRecords.length;

    // Simulate animated processing steps
    for (let i = 1; i <= totalToProcess; i++) {
      await new Promise((resolve) => setTimeout(resolve, Math.max(15, 600 / totalToProcess)));
      setProcessedCount(i);
      setImportProgress(Math.round((i / totalToProcess) * 100));
    }

    const skippedCount = validatedRows.length - validRecords.length;
    const warningImported = validatedRows.filter(
      (r) => r.isSelectedForImport && r.status === 'WARNING'
    ).length;

    // Execute through DataContext
    await onConfirmBulkImport(validRecords, {
      fileName: fileName || 'Imported_Shipments.xlsx',
      fileSize: fileSizeFormatted,
      totalRows: validatedRows.length,
      importedCount: validRecords.length,
      warningCount: warningImported,
      skippedCount: skippedCount,
    });

    setFinalImportStats({
      totalProcessed: validatedRows.length,
      imported: validRecords.length,
      warnings: warningImported,
      skipped: skippedCount,
    });

    setCurrentStep('COMPLETE');
  };

  const currentlyEditingRow = editingRowIndex !== null
    ? validatedRows.find((r) => r.rowIndex === editingRowIndex) || null
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight uppercase">IMPORT SHIPMENT DATA</h2>
                <p className="text-xs text-slate-400">
                  Upload an Excel file to import multiple shipment records at once.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={currentStep === 'IMPORTING'}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors disabled:opacity-40 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Wizard Bar */}
          <div className="bg-slate-800/80 px-6 py-2.5 border-b border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-1.5 ${currentStep === 'UPLOAD' ? 'text-white font-bold' : (currentStep !== 'UPLOAD' ? 'text-emerald-400 font-semibold' : '')}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 'UPLOAD' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  1
                </span>
                <span>Upload Excel</span>
              </div>

              <div className="w-4 h-px bg-slate-600" />

              <div className={`flex items-center gap-1.5 ${currentStep === 'MAPPING' ? 'text-white font-bold' : (['PREVIEW', 'IMPORTING', 'COMPLETE'].includes(currentStep) ? 'text-emerald-400 font-semibold' : '')}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 'MAPPING' ? 'bg-blue-600 text-white' : (['PREVIEW', 'IMPORTING', 'COMPLETE'].includes(currentStep) ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400')}`}>
                  2
                </span>
                <span>Column Mapping</span>
              </div>

              <div className="w-4 h-px bg-slate-600" />

              <div className={`flex items-center gap-1.5 ${currentStep === 'PREVIEW' ? 'text-white font-bold' : (['IMPORTING', 'COMPLETE'].includes(currentStep) ? 'text-emerald-400 font-semibold' : '')}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 'PREVIEW' ? 'bg-blue-600 text-white' : (['IMPORTING', 'COMPLETE'].includes(currentStep) ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400')}`}>
                  3
                </span>
                <span>Validation & Preview</span>
              </div>

              <div className="w-4 h-px bg-slate-600" />

              <div className={`flex items-center gap-1.5 ${['IMPORTING', 'COMPLETE'].includes(currentStep) ? 'text-white font-bold' : ''}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === 'COMPLETE' ? 'bg-emerald-600 text-white' : (currentStep === 'IMPORTING' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400')}`}>
                  4
                </span>
                <span>Import Execution</span>
              </div>
            </div>

            <button
              type="button"
              onClick={downloadSampleExcelTemplate}
              className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-700/80 hover:bg-slate-700 border border-slate-600 transition-colors cursor-pointer"
              title="Download standardized .xlsx template with sample OFII data"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Download Excel Template</span>
            </button>
          </div>

          {/* Modal Main Body */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* ------------------------------------------------------------- */}
            {/* STEP 1: UPLOAD FILE */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'UPLOAD' && (
              <div className="max-w-2xl mx-auto space-y-6 py-4">
                
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileInputChange}
                    className="hidden"
                    id="excel-file-input"
                  />

                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4 shadow-xs">
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 mb-1">
                    Drop your Excel file here
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    or click the button below to browse from your computer
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isReadingFile}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Browse Files</span>
                  </button>

                  <p className="text-[11px] text-slate-400 mt-3 font-medium">
                    Supported formats: <strong className="text-slate-600">.xlsx</strong> and <strong className="text-slate-600">.xls</strong>
                  </p>
                </div>

                {/* Error Banner */}
                {uploadError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Upload Error</span>
                      <span>{uploadError}</span>
                    </div>
                  </div>
                )}

                {/* Selected File Card */}
                {selectedFile && !uploadError && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{fileName}</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Ready
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {fileSizeFormatted} • <strong className="text-slate-800">{excelRawRows.length} rows</strong> detected • {excelHeaders.length} columns
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Information Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span>Safe 6-Step Bulk Import Guarantee</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Uploading an Excel file will <strong>never save records immediately</strong>. You will have full control to review column recognition, verify client matches with auto-assigned coordinators, check duplicates, and resolve any warnings prior to final database commit.
                  </p>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 2: COLUMN MAPPING */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'MAPPING' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recognize & Map Excel Columns</h3>
                    <p className="text-xs text-slate-500">
                      Verify how the columns in <strong className="text-slate-700">{fileName}</strong> correspond to OFII shipment fields.
                    </p>
                  </div>

                  <div className="text-xs text-slate-600">
                    Total Columns: <span className="font-bold text-slate-900">{excelHeaders.length}</span>
                  </div>
                </div>

                {/* Unmapped Required Fields Alert */}
                {unmappedRequiredFields.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-900 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Required Fields Attention</span>
                      <span>The following required fields are not yet mapped: </span>
                      <strong className="text-amber-950 font-bold">
                        {unmappedRequiredFields.map((f) => f.label).join(', ')}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Mapping Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-4 w-1/3">Excel Column Header</th>
                        <th className="py-2.5 px-2 text-center w-12"></th>
                        <th className="py-2.5 px-4 w-1/3">OFII Target Field</th>
                        <th className="py-2.5 px-4">Recognition Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {excelHeaders.map((header) => {
                        const currentMappedKey = columnMapping[header] || 'none';
                        const isMapped = currentMappedKey !== 'none';
                        const def = OFII_FIELD_DEFINITIONS.find((d) => d.key === currentMappedKey);

                        return (
                          <tr key={header} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-4">
                              <div className="font-bold text-slate-900 font-mono">{header}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                                Sample: "{String(excelRawRows[0]?.[header] ?? '') || '—'}"
                              </div>
                            </td>

                            <td className="py-2.5 px-2 text-center text-slate-400">
                              <ArrowRight className="w-3.5 h-3.5 inline-block text-blue-600" />
                            </td>

                            <td className="py-2.5 px-4">
                              <select
                                value={currentMappedKey}
                                onChange={(e) => handleMappingChange(header, e.target.value as OFIIFieldKey)}
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none cursor-pointer"
                              >
                                <option value="none">-- Do Not Import / Ignore --</option>
                                <optgroup label="Required OFII Fields">
                                  {OFII_FIELD_DEFINITIONS.filter((d) => d.required).map((d) => (
                                    <option key={d.key} value={d.key}>
                                      {d.label} (Required)
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Optional OFII Fields">
                                  {OFII_FIELD_DEFINITIONS.filter((d) => !d.required).map((d) => (
                                    <option key={d.key} value={d.key}>
                                      {d.label}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>
                            </td>

                            <td className="py-2.5 px-4">
                              {isMapped ? (
                                <div className="flex items-center gap-1.5">
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded ${
                                    def?.required
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}>
                                    <Check className="w-3 h-3" />
                                    {def?.required ? 'Required Field' : 'Mapped'}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                  Unmapped / Ignored
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 3: VALIDATION & PREVIEW */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'PREVIEW' && (
              <div className="space-y-4">
                
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Rows</span>
                    <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">{previewStats.total}</span>
                  </div>

                  <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Valid Rows</span>
                    <span className="text-xl font-bold font-mono text-emerald-800 mt-0.5 block">{previewStats.valid}</span>
                  </div>

                  <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Warnings</span>
                    <span className="text-xl font-bold font-mono text-amber-800 mt-0.5 block">{previewStats.warning}</span>
                  </div>

                  <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Invalid Rows</span>
                    <span className="text-xl font-bold font-mono text-rose-800 mt-0.5 block">{previewStats.invalid}</span>
                  </div>

                  <div className="bg-purple-50/60 p-3 rounded-lg border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Duplicates</span>
                    <span className="text-xl font-bold font-mono text-purple-800 mt-0.5 block">{previewStats.duplicate}</span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                  
                  {/* Status Tabs */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setPreviewFilter('ALL')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        previewFilter === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                      }`}
                    >
                      All Rows ({previewStats.total})
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewFilter('VALID')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        previewFilter === 'VALID'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
                      }`}
                    >
                      Valid ({previewStats.valid})
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewFilter('WARNING')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        previewFilter === 'WARNING'
                          ? 'bg-amber-600 text-white'
                          : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-300'
                      }`}
                    >
                      Warnings ({previewStats.warning})
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewFilter('INVALID')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        previewFilter === 'INVALID'
                          ? 'bg-rose-700 text-white'
                          : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-300'
                      }`}
                    >
                      Invalid ({previewStats.invalid})
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreviewFilter('DUPLICATE')}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        previewFilter === 'DUPLICATE'
                          ? 'bg-purple-700 text-white'
                          : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-300'
                      }`}
                    >
                      Duplicates ({previewStats.duplicate})
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      placeholder="Search preview rows..."
                      className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-300 rounded font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2 px-3 text-center w-10">#</th>
                        <th className="py-2 px-3">Validation Status</th>
                        <th className="py-2 px-3">Client & Auto-Coordinator</th>
                        <th className="py-2 px-3">Consignee</th>
                        <th className="py-2 px-3">Dispatch Date</th>
                        <th className="py-2 px-3">POD Number</th>
                        <th className="py-2 px-3">Reference No.</th>
                        <th className="py-2 px-3">Mode & Area</th>
                        <th className="py-2 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredPreviewRows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500 font-medium">
                            No rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredPreviewRows.map((r) => {
                          const isSelected = r.isSelectedForImport;
                          const isInvalid = r.status === 'INVALID';

                          return (
                            <tr
                              key={`preview-row-${r.rowIndex}`}
                              className={`hover:bg-slate-50 transition-colors ${
                                isInvalid ? 'bg-rose-50/40' : (r.status === 'WARNING' ? 'bg-amber-50/30' : '')
                              }`}
                            >
                              {/* Row Number & Checkbox */}
                              <td className="py-2.5 px-3 text-center">
                                <span className="font-mono text-slate-500 text-[11px]">
                                  {r.rowIndex}
                                </span>
                              </td>

                              {/* Status Badge */}
                              <td className="py-2.5 px-3">
                                {r.status === 'VALID' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3" /> Valid
                                  </span>
                                )}
                                {r.status === 'WARNING' && (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                                      <AlertTriangle className="w-3 h-3" /> Warning
                                    </span>
                                    {r.warnings.map((w, i) => (
                                      <div key={i} className="text-[10px] text-amber-700 max-w-[180px] truncate" title={w}>
                                        {w}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {r.status === 'INVALID' && (
                                  <div className="space-y-0.5">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                                      <AlertCircle className="w-3 h-3" /> Invalid
                                    </span>
                                    {r.errors.map((e, i) => (
                                      <div key={i} className="text-[10px] font-semibold text-rose-600 max-w-[180px] truncate" title={e}>
                                        {e}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {r.status === 'DUPLICATE' && (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                                      <CopyCheck className="w-3 h-3" /> Duplicate
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <select
                                        value={r.duplicateAction}
                                        onChange={(e) => handleDuplicateActionChange(r.rowIndex, e.target.value as any)}
                                        className="text-[10px] font-bold bg-white border border-purple-300 rounded px-1 py-0.5"
                                      >
                                        <option value="skip">Skip Row</option>
                                        <option value="import_anyway">Import Anyway</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Client & Auto Coordinator */}
                              <td className="py-2.5 px-3">
                                {r.isClientRecognized ? (
                                  <div>
                                    <span className="font-bold text-slate-900 block truncate max-w-[180px]" title={r.mappedRecord.client}>
                                      {r.mappedRecord.client}
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] text-blue-800 font-semibold mt-0.5">
                                      <User className="w-2.5 h-2.5 text-blue-600" />
                                      <span className="bg-blue-50 px-1 py-0.2 rounded border border-blue-200 truncate max-w-[140px]">
                                        {r.assignedCoordinator}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-1 text-amber-800 font-bold text-[11px]">
                                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                      <span className="truncate max-w-[140px]">{r.mappedRecord.client || 'Unknown'}</span>
                                    </div>
                                    <select
                                      onChange={(e) => handleMapRowClient(r.rowIndex, e.target.value)}
                                      defaultValue=""
                                      className="text-[10px] font-semibold bg-white border border-amber-300 rounded px-1 py-0.5 mt-1 max-w-[160px]"
                                    >
                                      <option value="" disabled>Map to Client...</option>
                                      {clients.map((c) => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </td>

                              {/* Consignee */}
                              <td className="py-2.5 px-3">
                                <span className="font-medium text-slate-800 block truncate max-w-[150px]" title={r.mappedRecord.consignee}>
                                  {r.mappedRecord.consignee || '—'}
                                </span>
                              </td>

                              {/* Dispatch Date */}
                              <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-mono">
                                {r.mappedRecord.actualDispatchDate || '—'}
                              </td>

                              {/* POD Number */}
                              <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-slate-800">
                                {r.mappedRecord.podNumber || '—'}
                              </td>

                              {/* Reference No */}
                              <td className="py-2.5 px-3 whitespace-nowrap font-mono font-bold text-blue-800">
                                {r.mappedRecord.referenceNumber || '—'}
                              </td>

                              {/* Mode & Area */}
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="font-semibold text-slate-800 block">{r.mappedRecord.modeOfShipment}</span>
                                <span className="text-[10px] text-slate-500">{r.mappedRecord.area}</span>
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setEditingRowIndex(r.rowIndex)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3 text-blue-700" />
                                  <span>Edit</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Attention Indicator */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-700 flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      {previewStats.readyToImport} records ready to import
                    </span>
                    {previewStats.invalid > 0 && (
                      <span className="font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                        {previewStats.invalid} invalid rows will be skipped
                      </span>
                    )}
                    {previewStats.duplicate > 0 && (
                      <span className="font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                        {previewStats.duplicate} duplicate records detected
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Auto-Lead Time SLA & Coordinator Rules will be applied automatically upon import.
                  </span>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 4: IMPORTING PROGRESS */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'IMPORTING' && (
              <div className="max-w-md mx-auto py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-700" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">Importing records...</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Processing: <strong className="text-slate-900 font-mono">{processedCount}</strong> / {previewStats.readyToImport}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden border border-slate-300">
                  <div
                    className="bg-blue-600 h-full transition-all duration-150 ease-out rounded-full"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 font-medium">
                  Applying company business rules, lead time SLAs, and creating dispatch completion alerts...
                </p>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* STEP 5: IMPORT COMPLETE */}
            {/* ------------------------------------------------------------- */}
            {currentStep === 'COMPLETE' && finalImportStats && (
              <div className="max-w-xl mx-auto py-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">IMPORT COMPLETE</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    <strong className="text-slate-900">{finalImportStats.totalProcessed} records</strong> processed from <span className="font-semibold text-slate-800">{fileName}</span>
                  </p>
                </div>

                {/* Stat Breakdown Card */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-emerald-50/80 p-3 rounded-lg border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Imported</span>
                    <span className="text-2xl font-bold font-mono text-emerald-800 mt-0.5 block">
                      {finalImportStats.imported}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">Successfully Added</span>
                  </div>

                  <div className="bg-amber-50/80 p-3 rounded-lg border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Warnings</span>
                    <span className="text-2xl font-bold font-mono text-amber-800 mt-0.5 block">
                      {finalImportStats.warnings}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">With Flags</span>
                  </div>

                  <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Skipped</span>
                    <span className="text-2xl font-bold font-mono text-slate-700 mt-0.5 block">
                      {finalImportStats.skipped}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Invalid / Duplicates</span>
                  </div>
                </div>

                {/* Notifications & Dispatch notice */}
                <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 text-left text-xs text-blue-950 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Clock className="w-4 h-4 text-blue-700" />
                    <span>Next Operational Steps</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    • <strong>Forwarding Progressive Report</strong> and <strong>Dashboard</strong> have been updated instantly.
                  </p>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    • <strong>Dispatch Action Notifications</strong> have been created for imported shipments requiring dispatch completion.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
            {/* Left Back / Cancel */}
            {currentStep === 'UPLOAD' && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep === 'MAPPING' && (
              <button
                type="button"
                onClick={() => setCurrentStep('UPLOAD')}
                className="px-4 py-2 rounded text-xs font-bold text-slate-700 hover:bg-slate-200 border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Upload</span>
              </button>
            )}

            {currentStep === 'PREVIEW' && (
              <button
                type="button"
                onClick={() => setCurrentStep('MAPPING')}
                className="px-4 py-2 rounded text-xs font-bold text-slate-700 hover:bg-slate-200 border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Mapping</span>
              </button>
            )}

            {(currentStep === 'IMPORTING' || currentStep === 'COMPLETE') && <div />}

            {/* Right Action Button */}
            {currentStep === 'UPLOAD' && (
              <button
                type="button"
                onClick={() => setCurrentStep('MAPPING')}
                disabled={!selectedFile || excelRawRows.length === 0}
                className="px-5 py-2 rounded text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Continue to Column Mapping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 'MAPPING' && (
              <button
                type="button"
                onClick={handleProceedToValidation}
                className="px-5 py-2 rounded text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Validate & Preview ({excelRawRows.length} Rows)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 'PREVIEW' && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={previewStats.readyToImport === 0}
                  className="px-5 py-2 rounded text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>IMPORT {previewStats.readyToImport} VALID RECORDS</span>
                </button>
              </div>
            )}

            {currentStep === 'COMPLETE' && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-sm transition-colors cursor-pointer"
              >
                View in Forwarding Progressive Report
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Row Edit Modal */}
      {editingRowIndex !== null && currentlyEditingRow && (
        <EditImportRowModal
          isOpen={true}
          row={currentlyEditingRow}
          clients={clients}
          onClose={() => setEditingRowIndex(null)}
          onSaveRow={handleSaveEditedRow}
          onOpenAddClientModal={onOpenAddClientModal}
        />
      )}
    </>
  );
};
