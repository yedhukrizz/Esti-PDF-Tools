import React, { useEffect, useRef, useState } from 'react';

export interface PdfPageRendererProps {
  pdfDoc: any;
  pageNumber: number;
  scale?: number;
  renderScaleMultiplier?: number;
  width?: number; // Target width, overrides scale
  className?: string;
  tint?: string; // 'red' or 'green' or null
}

export const PdfPageRenderer: React.FC<PdfPageRendererProps> = ({
  pdfDoc,
  pageNumber,
  scale = 1,
  renderScaleMultiplier = 1,
  width,
  className = '',
  tint
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [renderedSrc, setRenderedSrc] = useState<string | null>(null);

  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        setRenderError(null);
        const page = await pdfDoc.getPage(pageNumber);
        
        let viewport = page.getViewport({ scale });
        if (width) {
          const ratio = width / viewport.width;
          viewport = page.getViewport({ scale: ratio });
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;

        // Better handling of canvas sizing for high DPI
        const baseDpr = window.devicePixelRatio || 1;
        const outputScale = baseDpr * renderScaleMultiplier;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: context,
          transform: transform || undefined,
          viewport: viewport,
        };

        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
        }

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        renderTaskRef.current = null;

        if (!active) return;

        // Apply tint
        if (tint === 'red' || tint === 'green') {
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
             const r = data[i];
             const g = data[i+1];
             const b = data[i+2];
             
             // Simple greyscale conversion then tint
             const luma = 0.299 * r + 0.587 * g + 0.114 * b;
             
             if (tint === 'red') {
               data[i] = 255;
               data[i+1] = luma;
               data[i+2] = luma;
             } else if (tint === 'green') {
               data[i] = luma;
               data[i+1] = 255;
               data[i+2] = luma;
             }
          }
          context.putImageData(imageData, 0, 0);
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error("PDF Render error", err);
          if (active) setRenderError(String(err));
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale, width, tint]);

  if (renderError) {
    return <div className={`flex items-center justify-center bg-red-50 text-red-600 text-xs text-center border border-red-200 p-2 \${className}`} style={{ width: width || '100%', minHeight: 150 }}>Render Error: {renderError}</div>;
  }

  return <canvas ref={canvasRef} className={className} />;
};
