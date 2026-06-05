import React, { useRef } from 'react';
import { 
  Eye, EyeOff, MousePointer2, Square, Hand, 
  Trash2, Download, Save, UploadCloud, Settings, ZoomIn, ZoomOut, Maximize
} from 'lucide-react';

interface ToolbarProps {
  blinkEnabled: boolean;
  onToggleBlink: () => void;
  blinkRate: number;
  onChangeBlinkRate: (val: number) => void;
  
  tintEnabled: boolean;
  oldTint: string;
  newTint: string;
  onChangeOldTint: (val: string) => void;
  onChangeNewTint: (val: string) => void;
  onToggleTint: () => void;
  
  drawMode: 'select' | 'draw' | 'pan';
  onChangeDrawMode: (mode: 'select' | 'draw' | 'pan') => void;
  
  drawColor: string;
  onChangeDrawColor: (c: string) => void;
  
  drawSemiTransparent: boolean;
  onToggleSemiTransparent: () => void;
  
  hasSelection: boolean;
  onDeleteSelected: () => void;
  
  onExportPdf: () => void;
  onSaveSession: () => void;
  onLoadSession: (file: File) => void;
  
  onBackToSetup: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

const colors = ['#e11d48', '#16a34a', '#2563eb', '#ca8a04', '#9333ea', '#000000'];

// Simple Slider Component
const Slider = ({ value, min, max, onChange, label }: any) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-gray-600 font-medium whitespace-nowrap">{label}</span>
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))} 
      className="w-24 accent-blue-600"
    />
  </div>
);

export const Toolbar: React.FC<ToolbarProps> = (props) => {
  const sessionInputRef = useRef<HTMLInputElement>(null);

  const ModeButton = ({ mode, icon: Icon, label }: { mode: 'select' | 'draw' | 'pan', icon: any, label: string }) => {
    const active = props.drawMode === mode;
    return (
      <button 
        onClick={() => props.onChangeDrawMode(mode)}
        className={`p-2 rounded-md flex items-center justify-center transition-colors ${active ? 'bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-300' : 'text-gray-600 hover:bg-gray-100'}`}
        title={label}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  };

  return (
    <div className="w-full h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
      
      {/* Left side tools (Comparison) */}
      <div className="flex items-center gap-4">
        <button onClick={props.onBackToSetup} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition border border-transparent hover:border-gray-200">
          <Settings className="w-4 h-4" /> Setup
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <div className="flex items-center gap-3">
          <button 
            onClick={props.onToggleBlink}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${props.blinkEnabled ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {props.blinkEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Blink {props.blinkEnabled ? 'On' : 'Off'}
          </button>
          
          <Slider 
            label="Rate" 
            min={100} 
            max={2000} 
            value={props.blinkRate} 
            onChange={(val: number) => props.onChangeBlinkRate(2100 - val)} // Invert for slider intuition (faster slider = lower ms)
          />
        </div>

        <div className="h-6 w-px bg-gray-300"></div>

        <button 
          onClick={props.onToggleTint}
          className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors ${props.tintEnabled ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          {props.tintEnabled ? 'Untint' : 'Tint Diff'}
        </button>
        
        {props.tintEnabled && (
          <div className="flex items-center gap-2 px-2">
            <input type="color" value={props.oldTint} onChange={(e) => props.onChangeOldTint(e.target.value)} className="w-6 h-6 p-0 border-0 cursor-pointer" title="Old Page Tint" />
            <span className="text-xs text-gray-500">v</span>
            <input type="color" value={props.newTint} onChange={(e) => props.onChangeNewTint(e.target.value)} className="w-6 h-6 p-0 border-0 cursor-pointer" title="New Page Tint" />
          </div>
        )}
      </div>

      {/* Middle tools (Drawing) */}
      <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
        <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200 mr-2">
          <button onClick={props.onZoomOut} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Zoom Out"><ZoomOut className="w-4 h-4"/></button>
          <button onClick={props.onResetZoom} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Reset View"><Maximize className="w-4 h-4"/></button>
          <button onClick={props.onZoomIn} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Zoom In"><ZoomIn className="w-4 h-4"/></button>
        </div>
      
        <ModeButton mode="pan" icon={Hand} label="Pan (Hold Space or Middle Click)" />
        <ModeButton mode="select" icon={MousePointer2} label="Select" />
        <ModeButton mode="draw" icon={Square} label="Draw Rectangle" />
        
        <div className="h-4 w-px bg-gray-300 mx-1"></div>
        
        {colors.map(c => (
          <button 
            key={c}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${props.drawColor === c ? 'scale-110 border-gray-400' : 'border-transparent hover:scale-105'}`}
            style={{ backgroundColor: c }}
            onClick={() => props.onChangeDrawColor(c)}
          />
        ))}

        <div className="h-4 w-px bg-gray-300 mx-1"></div>

        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 cursor-pointer">
          <input 
            type="checkbox" 
            checked={props.drawSemiTransparent} 
            onChange={props.onToggleSemiTransparent}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          Fill
        </label>

        {props.hasSelection && (
          <>
            <div className="h-4 w-px bg-gray-300 mx-1"></div>
            <button 
              onClick={props.onDeleteSelected}
              className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors"
              title="Delete Selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Right side tools (Save/Export) */}
      <div className="flex items-center gap-2">
        <input 
          type="file" 
          accept=".ecmp" 
          className="hidden" 
          ref={sessionInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              props.onLoadSession(e.target.files[0]);
            }
          }}
        />
        <button 
          onClick={() => sessionInputRef.current?.click()}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Load Session (.ecmp)"
        >
          <UploadCloud className="w-5 h-5" />
        </button>
        <button 
          onClick={props.onSaveSession}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Save Session (.ecmp)"
        >
          <Save className="w-5 h-5" />
        </button>
        
        <button 
          onClick={props.onExportPdf}
          className="flex items-center gap-2 px-4 py-1.5 ml-2 bg-blue-600 text-white font-medium text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Annotated PDF
        </button>
      </div>

    </div>
  );
};
