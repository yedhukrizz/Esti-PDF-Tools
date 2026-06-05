import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { PdfPageRenderer } from './PdfPageRenderer';
import { Annotation } from '../types';

interface InteractiveWorkspaceProps {
  oldPdfDoc: any;
  newPdfDoc: any;
  oldPageNumber: number;
  newPageNumber: number;
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
  qPressed: boolean;
}

export interface WorkspaceHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
}

export const InteractiveWorkspace = forwardRef<WorkspaceHandle, InteractiveWorkspaceProps>(({
  oldPdfDoc,
  newPdfDoc,
  oldPageNumber,
  newPageNumber,
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
  drawSemiTransparent,
  qPressed
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isOldVisible, setIsOldVisible] = useState(true);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawRect, setCurrentDrawRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => setZoom(z => Math.min(20, z * 1.2)),
    zoomOut: () => setZoom(z => Math.max(0.1, z / 1.2)),
    resetView: () => {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }));

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
  
  // Fit to screen initial logic
  useEffect(() => {
    if (!containerRef.current || !pageContainerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === pageContainerRef.current) {
          const containerHeight = containerRef.current!.clientHeight;
          const contentHeight = entry.contentRect.height;
          
          // If the zoom is 1 and the content overflows, fit to screen automatically
          if (contentHeight > 0 && containerHeight > 0) {
            // Apply zoom to fit with 40px margin
            const targetZoom = Math.max(0.1, Math.min(5, (containerHeight - 40) / contentHeight));
            
            // Only auto-fit if we're near zoom 1 to avoid jarring jumps when user is actively zooming
            if (zoom === 1 || Math.abs(zoom - targetZoom) > 0.05) {
                setZoom(targetZoom);
            }
          }
        }
      }
    });

    observer.observe(pageContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Wheel zoom logic
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || qPressed) {
      e.preventDefault();
      const zoomFactor = 1.1;
      const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
      
      if (newZoom < 0.05 || newZoom > 20) return;
      
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
          pageIndex: newPageNumber - 1,
          x, y, width: w, height: h,
          color: drawColor,
          transparent: drawSemiTransparent
        });
      }
      setCurrentDrawRect(null);
    }
  };

  // Annotations are linked to the New Page Index we are comparing against.
  const currentPageAnnotations = annotations.filter(a => a.pageIndex === newPageNumber - 1);

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
        <div id="pdf-page-container" ref={pageContainerRef} className="relative shadow-xl bg-white flex items-center justify-center">
          {/* We'll render Old PDF if it exists and (OldVisible or no NewDoc exists) */}
          {oldPdfDoc && (
            <div className={`absolute top-0 left-0 transition-opacity duration-75 ${(!newPdfDoc || isOldVisible) ? 'opacity-100 z-10' : 'opacity-0 z-0'} ${tintEnabled ? 'mix-blend-multiply' : ''}`}>
              <PdfPageRenderer 
                pdfDoc={oldPdfDoc} 
                pageNumber={oldPageNumber} 
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
                pageNumber={newPageNumber} 
                scale={1.5} 
                tint={tintEnabled ? 'green' : undefined} 
              />
            </div>
          )}

          {/* If there's no NewPdfDoc but OldPdfDoc exists, we need a placeholder to give the container size, but PdfPageRenderer of old will do it if oldPdfDoc is the only one rendered relative. We handled that by making old relative if no new doc? Wait! */}
          {!newPdfDoc && oldPdfDoc && (
            <div className="invisible">
                <PdfPageRenderer pdfDoc={oldPdfDoc} pageNumber={oldPageNumber} scale={1.5} />
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
});

