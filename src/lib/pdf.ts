import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

export const loadPdfMap = async (file: File | string): Promise<any> => {
  let source: any;
  if (typeof file === 'string') {
    source = { url: file };
  } else {
    const arrayBuffer = await file.arrayBuffer();
    source = { data: new Uint8Array(arrayBuffer) };
  }
  const loadingTask = pdfjsLib.getDocument(source);
  const pdfDoc = await loadingTask.promise;
  return pdfDoc;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const createDataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};
