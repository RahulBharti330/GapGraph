import { Handle, Position } from '@xyflow/react';
import { BookOpen, Plus, Trash2, Bookmark, BookmarkCheck, FileText } from 'lucide-react';

export default function PaperNode({ data }: any) {
  const { paper, isSaved, onSave, onRemove, onExpand, onExplore, onSummarize } = data;

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg w-72 overflow-hidden flex flex-col transition-transform hover:scale-105">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />
      
      <div className="p-3 bg-gray-700 border-b border-gray-600 flex justify-between items-start gap-2">
        <h3 className="text-sm font-bold text-gray-100 leading-tight line-clamp-2" title={paper.title}>
          {paper.title}
        </h3>
        <span className="text-xs font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded border border-gray-600 shrink-0">
          {paper.year || 'N/A'}
        </span>
      </div>
      
      <div className="p-3 flex-1 flex flex-col gap-2">
        {paper.authors && paper.authors.length > 0 && (
          <p className="text-xs text-gray-400 line-clamp-1" title={paper.authors.map((a: any) => a.name).join(', ')}>
            {paper.authors.map((a: any) => a.name).join(', ')}
          </p>
        )}
        
        <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-gray-700">
          <button 
            onClick={() => onExplore(paper)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded text-xs transition-colors"
            title="Explore Details"
          >
            <BookOpen size={14} /> Explore
          </button>
          <button 
            onClick={() => onExpand(paper.paperId)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded text-xs transition-colors"
            title="Find Related Papers"
          >
            <Plus size={14} /> Expand
          </button>
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={() => onSave(paper)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs transition-colors ${
              isSaved 
                ? 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} 
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button 
            onClick={() => onRemove(paper.paperId)}
            className="flex items-center justify-center px-2 py-1.5 bg-red-900/30 hover:bg-red-900/60 text-red-400 rounded transition-colors"
            title="Remove from Graph"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
    </div>
  );
}
