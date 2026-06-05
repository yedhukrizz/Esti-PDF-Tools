import React, { useState, useRef, useEffect } from 'react';
import { PdfPageRenderer } from './PdfPageRenderer';
import { Annotation } from '../types';

interface InteractiveWorkspaceProps {
  oldPdfDoc: any;
  newPdfDoc: any;
  currentPage: number;
  blinkEnabled: boolean;
  blinkRate: number; // in ms
  tintEnabled: boolean;
  drawMode: 'select' | 'draw' | 'pan';
  annotations: Annotation[];
  onAddAnnotation: (ann: Annotation) => void;
  onUpdateAnnotation: (ann: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onSelectAnnotation: (id: string | null) => void;
  selectedAnnotationId: string | null;
  drawColor: string;
  drawSemiTransparent: boolean;
}

export const InteractiveWorkspace: React.FC<InteractiveWorkspaceProps> = ({
  oldPdfDoc,
  newPdfDoc,
  currentPage,
  blinkEnabled,
  blinkRate,
  tintEnabled,
  drawMode,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onSelectAnnotation,
  selectedAnnotationId,
  drawColor,
  drawSemiTransparent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isOldVisible, setIsOldVisible] = useState(true);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawRect, setCurrentDrawRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  // Blink logic
  useEffect(() => {
    let interval: any;
    if (blinkEnabled) {
      interval = setInterval(() => {
        setIsOldVisible(prev => !prev);
      }, blinkRate);
    } else {
      setIsOldVisible(false); // Default to new doc when not blinking
    }
    return () => clearInterval(interval);
  }, [blinkEnabled, blinkRate]);
  
  // Wheel zoom logic
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomFactor = 1.1;
      const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
      
      if (newZoom < 0.1 || newZoom > 20) return;
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - pan.x;
        const mouseY = e.clientY - rect.top - pan.y;
        
        const newX = e.clientX - rect.left - mouseX * (newZoom / zoom);
        const newY = e.clientY - rect.top - mouseY * (newZoom / zoom);
        
        setZoom(newZoom);
        setPan({ x: newX, y: newY });
      }
    }
  };

  const getPageCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Convert points to 0-1 range
  const getNormalizedCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { nx: 0, ny: 0 };
    const pageContainer = document.getElementById('pdf-page-container');
    if (!pageContainer) return { nx: 0, ny: 0 };
    const rect = pageContainer.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    return { nx, ny };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const pageContainer = document.getElementById('pdf-page-container');
    if (!pageContainer) return;
    const rect = pageContainer.getBoundingClientRect();
    
    if (drawMode === 'pan' || (e.button === 1) || (e.button === 0 && drawMode === 'select' && e.target === containerRef.current)) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (drawMode === 'draw' && e.button === 0) {
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

      setIsDrawing(true);
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      setCurrentDrawRect({ x: nx, y: ny, w: 0, h: 0 });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (isDrawing && currentDrawRect) {
      const pageContainer = document.getElementById('pdf-page-container');
      if (!pageContainer) return;
      const rect = pageContainer.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      
      setCurrentDrawRect(prev => prev ? {
        ...prev,
        w: nx - prev.x,
        h: ny - prev.y
      } : null);
    }
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
    } else if (isDrawing && currentDrawRect) {
      setIsDrawing(false);
      // Normalize width/height (could be negative)
      const x = currentDrawRect.w < 0 ? currentDrawRect.x + currentDrawRect.w : currentDrawRect.x;
      const y = currentDrawRect.h < 0 ? currentDrawRect.y + currentDrawRect.h : currentDrawRect.y;
      const w = Math.abs(currentDrawRect.w);
      const h = Math.abs(currentDrawRect.h);
      
      if (w > 0.01 && h > 0.01) {
        onAddAnnotation({
          id: Math.random().toString(36).substring(2, 9),
          pageIndex: currentPage - 1,
          x, y, width: w, height: h,
          color: drawColor,
          transparent: drawSemiTransparent
        });
      }
      setCurrentDrawRect(null);
    }
  };

  const currentPageAnnotations = annotations.filter(a => a.pageIndex === currentPage - 1);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-gray-100 select-none ${drawMode === 'pan' ? 'cursor-grab' : drawMode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <div 
        className="absolute origin-top-left"
        style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
      >
        <div id="pdf-page-container" className="relative shadow-xl bg-white flex items-center justify-center">
          {/* We'll render Old PDF if it exists and (OldVisible or no NewDoc exists) */}
          {oldPdfDoc && (
            <div className={`absolute top-0 left-0 transition-opacity duration-75 ${(!newPdfDoc || isOldVisible) ? 'opacity-100 z-10' : 'opacity-0 z-0'} ${tintEnabled ? 'mix-blend-multiply' : ''}`}>
              <PdfPageRenderer 
                pdfDoc={oldPdfDoc} 
                pageNumber={currentPage} 
                scale={1.5} 
                tint={tintEnabled ? 'red' : undefined} 
              />
            </div>
          )}
          
          {/* New PDF render */}
          {newPdfDoc && (
            <div className={`relative ${tintEnabled ? 'mix-blend-multiply' : ''}`}>
               <PdfPageRenderer 
                pdfDoc={newPdfDoc} 
                pageNumber={currentPage} 
                scale={1.5} 
                tint={tintEnabled ? 'green' : undefined} 
              />
            </div>
          )}

          {/* If there's no NewPdfDoc but OldPdfDoc exists, we need a placeholder to give the container size, but PdfPageRenderer of old will do it if oldPdfDoc is the only one rendered relative. We handled that by making old relative if no new doc? Wait! */}
          {!newPdfDoc && oldPdfDoc && (
            <div className="invisible">
                <PdfPageRenderer pdfDoc={oldPdfDoc} pageNumber={currentPage} scale={1.5} />
            </div>
          )}

          {/* Annotation Overlay */}
          <div className="absolute top-0 left-0 w-full h-full z-20 pointer-events-none">
             {currentPageAnnotations.map((ann) => {
                const isSelected = selectedAnnotationId === ann.id;
                return (
                  <div 
                    key={ann.id}
                    className={`absolute border-2 pointer-events-auto cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 shadow-sm' : ''}`}
                    style={{
                      left: `${ann.x * 100}%`,
                      top: `${ann.y * 100}%`,
                      width: `${ann.width * 100}%`,
                      height: `${ann.height * 100}%`,
                      borderColor: ann.color,
                      backgroundColor: ann.transparent ? `${ann.color}40` : 'transparent' // 40 is hex for 25% opacity
                    }}
                    onPointerDown={(e) => {
                      if (drawMode === 'select') {
                        e.stopPropagation();
                        onSelectAnnotation(ann.id);
                      }
                    }}
                  >
                  </div>
                );
             })}

             {/* Current drawing rect */}
             {isDrawing && currentDrawRect && (
                <div 
                  className="absolute border-2 pointer-events-none"
                  style={{
                    left: `${(currentDrawRect.w < 0 ? currentDrawRect.x + currentDrawRect.w : currentDrawRect.x) * 100}%`,
                    top: `${(currentDrawRect.h < 0 ? currentDrawRect.y + currentDrawRect.h : currentDrawRect.y) * 100}%`,
                    width: `${Math.abs(currentDrawRect.w) * 100}%`,
                    height: `${Math.abs(currentDrawRect.h) * 100}%`,
                    borderColor: drawColor,
                    backgroundColor: drawSemiTransparent ? `${drawColor}40` : 'transparent'
                  }}
                />
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
