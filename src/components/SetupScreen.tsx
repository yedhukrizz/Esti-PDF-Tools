import React from 'react';
import { File as FileIcon, UploadCloud } from 'lucide-react';
import { PdfPageRenderer } from './PdfPageRenderer';

interface SetupScreenProps {
  oldPdfFile: File | string | null;
  newPdfFile: File | string | null;
  oldPdfName: string | null;
  newPdfName: string | null;
  oldPdfDoc: any;
  newPdfDoc: any;
  oldPageNumber: number;
  newPageNumber: number;
  onSelectOldFile: (f: File) => void;
  onSelectNewFile: (f: File) => void;
  onSelectOldPage: (p: number) => void;
  onSelectNewPage: (p: number) => void;
  onCompare: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = (props) => {
  const renderThumbnails = (doc: any, currentPage: number, onSelect: (p: number) => void) => {
    if (!doc) return <div className="text-gray-400 text-center mt-10">No PDF Loaded</div>;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        {Array.from({ length: doc.numPages }).map((_, i) => {
          const pNum = i + 1;
          const isSelected = pNum === currentPage;
          return (
            <div 
              key={pNum}
              className={`flex flex-col items-center cursor-pointer p-2 rounded-lg border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105' : 'border-transparent hover:bg-gray-100 hover:border-gray-300'}`}
              onClick={() => onSelect(pNum)}
            >
              <div className="text-xs font-semibold text-gray-600 mb-2">Page {pNum}</div>
              <div className="bg-white p-1 rounded border border-gray-200 shadow-sm w-full flex justify-center h-48 overflow-hidden relative">
                <PdfPageRenderer pdfDoc={doc} pageNumber={pNum} width={150} className="w-full h-full object-contain" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white relative font-sans">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Old PDF */}
        <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white shrink-0 shadow-sm z-10">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">Old PDF (Base)</h2>
            <button 
              onClick={() => document.getElementById('setup-old-upload')?.click()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition font-medium ${props.oldPdfFile ? 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100' : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'}`}
            >
              {props.oldPdfFile ? <FileIcon className="w-5 h-5 text-gray-500"/> : <UploadCloud className="w-5 h-5" />}
              <span className="truncate">{props.oldPdfName || 'Upload Old PDF'}</span>
            </button>
            <input id="setup-old-upload" type="file" className="hidden" accept=".pdf" onChange={(e) => {
              if (e.target.files?.[0]) props.onSelectOldFile(e.target.files[0]);
            }} />
          </div>
          <div className="flex-1 overflow-y-auto relative">
             {renderThumbnails(props.oldPdfDoc, props.oldPageNumber, props.onSelectOldPage)}
          </div>
        </div>

        {/* Right Pane - New PDF */}
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white shrink-0 shadow-sm z-10">
            <h2 className="text-lg font-bold text-blue-700 mb-2 flex items-center gap-2">New PDF (Changes)</h2>
            <button 
              onClick={() => document.getElementById('setup-new-upload')?.click()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition font-medium ${props.newPdfFile ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'}`}
            >
              {props.newPdfFile ? <FileIcon className="w-5 h-5 text-blue-500"/> : <UploadCloud className="w-5 h-5" />}
              <span className="truncate">{props.newPdfName || 'Upload New PDF'}</span>
            </button>
            <input id="setup-new-upload" type="file" className="hidden" accept=".pdf" onChange={(e) => {
              if (e.target.files?.[0]) props.onSelectNewFile(e.target.files[0]);
            }} />
          </div>
          <div className="flex-1 overflow-y-auto relative">
             {renderThumbnails(props.newPdfDoc, props.newPageNumber, props.onSelectNewPage)}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-[72px] bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex items-center justify-between px-6 shrink-0 z-20">
         <div className="text-gray-700 font-medium text-sm md:text-base">
            Ready to compare? 
            {(props.oldPdfDoc || props.newPdfDoc) ? (
              <span className="ml-2 inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-indigo-700 font-semibold border border-indigo-100">
                {props.oldPdfDoc ? `Old Pg ${props.oldPageNumber}` : 'None'} <span className="text-gray-400">vs</span> {props.newPdfDoc ? `New Pg ${props.newPageNumber}` : 'None'}
              </span>
            ) : (
              <span className="ml-2 text-gray-500 font-normal">Load PDFs to select pages.</span>
            )}
         </div>
         <button 
           disabled={!props.oldPdfDoc && !props.newPdfDoc}
           onClick={props.onCompare}
           className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-md shadow-sm hover:bg-blue-700 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95"
         >
           Go to Compare View →
         </button>
      </div>
    </div>
  );
};
