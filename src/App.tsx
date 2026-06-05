import React, { useState, useEffect, useRef } from 'react';
import { loadPdfMap, fileToBase64, createDataURLtoBlob } from './lib/pdf';
import { Toolbar } from './components/Toolbar';
import { InteractiveWorkspace, WorkspaceHandle } from './components/InteractiveWorkspace';
import { SetupScreen } from './components/SetupScreen';
import { Annotation, SessionFile } from './types';
import { PDFDocument, rgb } from 'pdf-lib';

function App() {
  const [viewMode, setViewMode] = useState<'setup' | 'compare'>('setup');
  
  const [oldPdfFile, setOldPdfFile] = useState<File | string | null>(null);
  const [newPdfFile, setNewPdfFile] = useState<File | string | null>(null);
  
  const [oldPdfDoc, setOldPdfDoc] = useState<any>(null);
  const [newPdfDoc, setNewPdfDoc] = useState<any>(null);
  const [oldPdfName, setOldPdfName] = useState<string | null>(null);
  const [newPdfName, setNewPdfName] = useState<string | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [oldPageNumber, setOldPageNumber] = useState(1);
  const [newPageNumber, setNewPageNumber] = useState(1);

  // App State
  const [blinkEnabled, setBlinkEnabled] = useState(false);
  const [blinkRate, setBlinkRate] = useState(500);
  const [tintEnabled, setTintEnabled] = useState(false);
  
  const [drawMode, setDrawMode] = useState<'select' | 'draw' | 'pan'>('pan');
  const [drawColor, setDrawColor] = useState('#e11d48');
  const [drawSemiTransparent, setDrawSemiTransparent] = useState(true);
  
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);

  const workspaceRef = useRef<WorkspaceHandle>(null);
  const [qPressed, setQPressed] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q') setQPressed(true);
      if (e.code === 'Space' && drawMode !== 'pan') {
        setDrawMode('pan');
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        setAnnotations(prev => prev.filter(a => a.id !== selectedAnnotationId));
        setSelectedAnnotationId(null);
      }
      
      if (viewMode === 'compare') {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setOldPageNumber(p => Math.min(numPages, p + 1));
          setNewPageNumber(p => Math.min(numPages, p + 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setOldPageNumber(p => Math.max(1, p - 1));
          setNewPageNumber(p => Math.max(1, p - 1));
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'q') setQPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [drawMode, selectedAnnotationId, viewMode, numPages]);

  const [loadError, setLoadError] = useState<string | null>(null);

  // Load old PDF
  useEffect(() => {
    if (!oldPdfFile) return;
    const load = async () => {
      try {
        setLoadError(null);
        const doc = await loadPdfMap(oldPdfFile);
        setOldPdfDoc(doc);
        if (doc.numPages) setNumPages(doc.numPages);
      } catch (err: any) {
        setLoadError(err?.message || String(err));
        console.error("Error loading old PDF", err);
      }
    };
    load();
  }, [oldPdfFile]);

  // Load new PDF
  useEffect(() => {
    if (!newPdfFile) return;
    const load = async () => {
      try {
        setLoadError(null);
        const doc = await loadPdfMap(newPdfFile);
        setNewPdfDoc(doc);
        if (doc.numPages > numPages) setNumPages(doc.numPages);
      } catch (err: any) {
        setLoadError(err?.message || String(err));
        console.error("Error loading new PDF", err);
      }
    };
    load();
  }, [newPdfFile, numPages]);

  const handleSelectOldFile = (f: File) => {
    setOldPdfFile(f);
    setOldPdfName(f.name);
    setOldPageNumber(1);
  };
  
  const handleSelectNewFile = (f: File) => {
    setNewPdfFile(f);
    setNewPdfName(f.name);
    setNewPageNumber(1);
  };

  const hexToRgbArr = (hex: string) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ] : [0, 0, 0];
  };

  const handleExportPdf = async () => {
    const targetFile = newPdfFile || oldPdfFile;
    if (!targetFile) {
      alert("No PDF loaded to export.");
      return;
    }

    try {
      let arrayBuffer: ArrayBuffer;
      if (typeof targetFile === 'string') {
        const response = await fetch(targetFile);
        arrayBuffer = await response.arrayBuffer();
      } else {
        arrayBuffer = await targetFile.arrayBuffer();
      }

      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      annotations.forEach((ann) => {
        if (ann.pageIndex < pages.length) {
          const page = pages[ann.pageIndex];
          const { width, height } = page.getSize();
          
          const rgbArr = hexToRgbArr(ann.color);
          const color = rgb(rgbArr[0], rgbArr[1], rgbArr[2]);
          
          const options: any = {
            x: ann.x * width,
            y: height - ((ann.y + ann.height) * height), 
            width: ann.width * width,
            height: ann.height * height,
            borderColor: color,
            borderWidth: 2,
          };
          
          if (ann.transparent) {
            options.color = color;
            options.opacity = 0.25;
          }
          
          page.drawRectangle(options);
        }
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exported_${newPdfName || 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error("Export error", err);
      alert("Error exporting PDF: " + (err.message || String(err)));
    }
  };

  const handleSaveSession = async () => {
    try {
      const session: SessionFile = {
        oldPdfDataUrl: oldPdfFile instanceof File ? await fileToBase64(oldPdfFile) : oldPdfFile,
        newPdfDataUrl: newPdfFile instanceof File ? await fileToBase64(newPdfFile) : newPdfFile,
        oldPdfName,
        newPdfName,
        annotations
      };
      const blob = new Blob([JSON.stringify(session)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${new Date().getTime()}.ecmp`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Failed to save session: " + String(e));
    }
  };

  const handleLoadSession = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const session: SessionFile = JSON.parse(text);
        
        if (session.oldPdfDataUrl) {
          setOldPdfFile(session.oldPdfDataUrl);
          setOldPdfName(session.oldPdfName);
        }
        if (session.newPdfDataUrl) {
          setNewPdfFile(session.newPdfDataUrl);
          setNewPdfName(session.newPdfName);
        }
        if (session.annotations) {
          setAnnotations(session.annotations);
        }
        setViewMode('setup'); // Force user to confirm pages after loading session
      } catch (err) {
        console.error(err);
        alert("Failed to load session file.");
      }
    };
    reader.readAsText(file);
  };

  if (viewMode === 'setup') {
    return (
      <SetupScreen 
        oldPdfFile={oldPdfFile}
        newPdfFile={newPdfFile}
        oldPdfDoc={oldPdfDoc}
        newPdfDoc={newPdfDoc}
        oldPdfName={oldPdfName}
        newPdfName={newPdfName}
        oldPageNumber={oldPageNumber}
        newPageNumber={newPageNumber}
        onSelectOldFile={handleSelectOldFile}
        onSelectNewFile={handleSelectNewFile}
        onSelectOldPage={setOldPageNumber}
        onSelectNewPage={setNewPageNumber}
        onCompare={() => setViewMode('compare')}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden text-gray-900 font-sans">
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar 
          blinkEnabled={blinkEnabled}
          onToggleBlink={() => setBlinkEnabled(p => !p)}
          blinkRate={blinkRate}
          onChangeBlinkRate={(val) => setBlinkRate(2100 - val)}
          tintEnabled={tintEnabled}
          onToggleTint={() => setTintEnabled(p => !p)}
          drawMode={drawMode}
          onChangeDrawMode={setDrawMode}
          drawColor={drawColor}
          onChangeDrawColor={setDrawColor}
          drawSemiTransparent={drawSemiTransparent}
          onToggleSemiTransparent={() => setDrawSemiTransparent(p => !p)}
          hasSelection={!!selectedAnnotationId}
          onDeleteSelected={() => {
            if (selectedAnnotationId) {
              setAnnotations(prev => prev.filter(a => a.id !== selectedAnnotationId));
              setSelectedAnnotationId(null);
            }
          }}
          onExportPdf={handleExportPdf}
          onSaveSession={handleSaveSession}
          onLoadSession={handleLoadSession}
          onBackToSetup={() => setViewMode('setup')}
          onZoomIn={() => workspaceRef.current?.zoomIn()}
          onZoomOut={() => workspaceRef.current?.zoomOut()}
          onResetZoom={() => workspaceRef.current?.resetView()}
        />
        
        <div className="flex-1 relative overflow-hidden bg-gray-200 shadow-inner">
          {(!oldPdfDoc && !newPdfDoc) ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <div className="text-center">
                 {loadError ? (
                    <div className="bg-red-100 text-red-600 p-4 rounded-md shadow-sm border border-red-200">
                      <p className="font-semibold mb-1">Error Loading PDF:</p>
                      <p className="text-sm font-mono max-w-md break-words">{loadError}</p>
                    </div>
                 ) : (
                    <>
                       <p className="text-lg font-medium mb-2">Welcome to Esti PDF Tools</p>
                       <p className="text-sm">Load Old and New PDFs from the sidebar to begin comparison.</p>
                       <p className="text-xs mt-4">Debug: oldDoc={oldPdfDoc ? 'yes' : 'no'}, numPages={numPages}</p>
                    </>
                 )}
              </div>
            </div>
          ) : (
            <InteractiveWorkspace 
              ref={workspaceRef}
              oldPdfDoc={oldPdfDoc}
              newPdfDoc={newPdfDoc}
              oldPageNumber={oldPageNumber}
              newPageNumber={newPageNumber}
              blinkEnabled={blinkEnabled}
              blinkRate={blinkRate}
              tintEnabled={tintEnabled}
              drawMode={drawMode}
              annotations={annotations}
              qPressed={qPressed}
              onAddAnnotation={(ann) => {
                setAnnotations(prev => [...prev, ann]);
                setSelectedAnnotationId(ann.id);
                setDrawMode('select');
              }}
              onUpdateAnnotation={(ann) => {
                setAnnotations(prev => prev.map(a => a.id === ann.id ? ann : a));
              }}
              onDeleteAnnotation={(id) => {
                setAnnotations(prev => prev.filter(a => a.id !== id));
                if (selectedAnnotationId === id) setSelectedAnnotationId(null);
              }}
              onSelectAnnotation={setSelectedAnnotationId}
              selectedAnnotationId={selectedAnnotationId}
              drawColor={drawColor}
              drawSemiTransparent={drawSemiTransparent}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;


