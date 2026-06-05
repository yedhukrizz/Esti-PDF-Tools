import * as pdfjsLib from 'pdfjs-dist';
// Standard Vite way to import a web worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const loadPdfMap = async (file: File | string): Promise<any> => {
  let url = '';
  if (typeof file === 'string') {
    url = file;
  } else {
    url = URL.createObjectURL(file);
  }
  const loadingTask = pdfjsLib.getDocument(url);
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
