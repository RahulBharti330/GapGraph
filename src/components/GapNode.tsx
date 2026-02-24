import { Handle, Position } from '@xyflow/react';
import { AlertTriangle, Lightbulb } from 'lucide-react';

export default function GapNode({ data }: any) {
  const { gap } = data;
  
  // If the gap indicates an error or unavailable state, style it differently
  const isError = gap.includes("unavailable") || gap.includes("Could not extract");

  return (
    <div className={`border rounded-lg shadow-lg w-64 overflow-hidden transition-all ${
      isError 
        ? 'bg-gray-900/80 border-gray-600/50' 
        : 'bg-red-950/80 border-red-500/50'
    }`}>
      <Handle type="target" position={Position.Top} className={`w-3 h-3 ${isError ? 'bg-gray-500' : 'bg-red-500'}`} />
      
      <div className={`p-2 border-b flex items-center gap-2 ${
        isError ? 'bg-gray-800/50 border-gray-700/50' : 'bg-red-900/50 border-red-500/30'
      }`}>
        {isError ? (
          <Lightbulb size={14} className="text-gray-400" />
        ) : (
          <AlertTriangle size={14} className="text-red-400" />
        )}
        <h3 className={`text-xs font-bold uppercase tracking-wider ${
          isError ? 'text-gray-300' : 'text-red-200'
        }`}>
          {isError ? 'Extraction Note' : 'Research Gap'}
        </h3>
      </div>
      
      <div className="p-3">
        <p className={`text-xs leading-relaxed whitespace-pre-wrap ${
          isError ? 'text-gray-400 italic' : 'text-red-100/80'
        }`}>
          {gap}
        </p>
      </div>
    </div>
  );
}
