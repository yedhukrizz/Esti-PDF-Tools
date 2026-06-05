export interface PDFDocumentContext {
  file: File;
  dataUrl: string;
  pdfjsDoc: any; // PDFDocumentProxy
  numPages: number;
}

export interface Annotation {
  id: string;
  pageIndex: number;
  x: number; // 0 to 1 relative to page width
  y: number; // 0 to 1 relative to page height
  width: number; // 0 to 1 relative to page width
  height: number; // 0 to 1 relative to page height
  color: string;
  transparent: boolean;
}

export interface SessionFile {
  oldPdfDataUrl: string | null;
  newPdfDataUrl: string | null;
  oldPdfName: string | null;
  newPdfName: string | null;
  annotations: Annotation[];
}
