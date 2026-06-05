import React from 'react';
import { PdfPageRenderer } from './PdfPageRenderer';
import { UploadCloud, File as FileIcon } from 'lucide-react';

interface SidebarProps {
  oldPdfFile: File | string | null;
  newPdfFile: File | string | null;
  oldPdfDoc: any;
  newPdfDoc: any;
  numPages: number;
  currentPage: number;
  onSelectOldFile: (file: File) => void;
  onSelectNewFile: (file: File) => void;
  onSelectPage: (idx: number) => void;
  oldPdfNameLabel?: string | null;
  newPdfNameLabel?: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  oldPdfFile,
  newPdfFile,
  oldPdfDoc,
  newPdfDoc,
  numPages,
  currentPage,
  onSelectOldFile,
  onSelectNewFile,
  onSelectPage,
  oldPdfNameLabel,
  newPdfNameLabel
}) => {
  const triggerFileInput = (id: string) => {
    document.getElementById(id)?.click();
  };

  return (
    <div className="flex flex-col h-full w-64 bg-white border-r border-gray-200 overflow-hidden shadow-sm">
       {/* File inputs */}
       <div className="p-4 border-b border-gray-200 space-y-4 shrink-0">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Old PDF (Base)</label>
            <input 
              type="file" 
              id="old-pdf-upload" 
              accept="application/pdf" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onSelectOldFile(e.target.files[0]);
                }
              }} 
            />
            <button 
              onClick={() => triggerFileInput('old-pdf-upload')}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${oldPdfFile ? 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100' : 'border-dashed border-gray-400 bg-white text-gray-600 hover:border-gray-500'}`}
            >
              {oldPdfFile ? <FileIcon className="w-4 h-4 text-gray-500" /> : <UploadCloud className="w-4 h-4" />}
              <span className="truncate">{oldPdfNameLabel || (oldPdfFile instanceof File ? oldPdfFile.name : 'Old PDF Loaded') || 'Select Old PDF'}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">New PDF (Changes)</label>
            <input 
              type="file" 
              id="new-pdf-upload" 
              accept="application/pdf" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onSelectNewFile(e.target.files[0]);
                }
              }} 
            />
            <button 
              onClick={() => triggerFileInput('new-pdf-upload')}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${newPdfFile ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-dashed border-gray-400 bg-white text-gray-600 hover:border-gray-500'}`}
            >
              {newPdfFile ? <FileIcon className="w-4 h-4 text-blue-500" /> : <UploadCloud className="w-4 h-4" />}
              <span className="truncate">{newPdfNameLabel || (newPdfFile instanceof File ? newPdfFile.name : 'New PDF Loaded') || 'Select New PDF'}</span>
            </button>
          </div>
       </div>

       {/* Thumbnails */}
       <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
         {numPages > 0 ? Array.from({ length: numPages }).map((_, i) => {
           const pNum = i + 1;
           const isSelected = pNum === currentPage;
           return (
             <div 
               key={pNum} 
               className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors duration-200 ${isSelected ? 'bg-blue-100 ring-1 ring-blue-400' : 'hover:bg-gray-200'}`}
               onClick={() => onSelectPage(pNum)}
             >
                <div className="text-xs font-medium text-gray-500 mb-1">Page {pNum}</div>
                <div className="relative shadow-sm bg-white p-1 rounded-sm border border-gray-200 w-full flex justify-center">
                   {/* We prioritize rendering the new doc thumbnail if it exists, else old */}
                   {newPdfDoc ? (
                      <PdfPageRenderer pdfDoc={newPdfDoc} pageNumber={pNum} width={150} className="w-full h-auto object-contain" />
                   ) : oldPdfDoc ? (
                      <PdfPageRenderer pdfDoc={oldPdfDoc} pageNumber={pNum} width={150} className="w-full h-auto object-contain" />
                   ) : null}
                </div>
             </div>
           );
         }) : (
            <div className="text-center text-sm text-gray-400 mt-10">
              Load a PDF to preview pages.
            </div>
         )}
       </div>
    </div>
  );
};
