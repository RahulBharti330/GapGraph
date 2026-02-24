import React, { useState } from 'react';
import { Search, Loader2, Filter, Bookmark, X, BookmarkCheck } from 'lucide-react';
import Graph from './components/Graph';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any[]>([]);
  
  // New state
  const [savedPapers, setSavedPapers] = useState<any[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [paperSummary, setPaperSummary] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setActiveQuery(searchQuery);

    try {
      const response = await fetch('/api/search-gaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchQuery }),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errorMessage = errData.error;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid response from server");
      }
      setGraphData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch data');
      
      // Fallback mock data if backend fails
      setGraphData([
        {
          paperId: 'mock-1',
          title: 'Attention Is All You Need',
          year: 2017,
          authors: [{ name: 'Ashish Vaswani' }, { name: 'Noam Shazeer' }],
          abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
          researchGap: 'Future work could explore extending this model to handle longer sequences more efficiently and applying it to other modalities like images or audio.',
        },
        {
          paperId: 'mock-2',
          title: 'BERT: Pre-training of Deep Bidirectional Transformers',
          year: 2018,
          authors: [{ name: 'Jacob Devlin' }, { name: 'Ming-Wei Chang' }],
          abstract: 'We introduce a new language representation model called BERT...',
          researchGap: 'Limitations include high computational cost during pre-training. Future research might focus on more efficient pre-training objectives.',
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpand = async (paperId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/expand-paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paperId }),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errorMessage = errData.error;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const text = await response.text();
      let newPapers;
      try {
        newPapers = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid response from server");
      }
      
      // Add new papers to graph data, avoiding duplicates
      setGraphData(prev => {
        const existingIds = new Set(prev.map(p => p.paperId));
        const uniqueNewPapers = newPapers.filter((p: any) => !existingIds.has(p.paperId));
        return [...prev, ...uniqueNewPapers];
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to expand paper');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = (paper: any) => {
    setSavedPapers(prev => {
      const isSaved = prev.some(p => p.paperId === paper.paperId);
      if (isSaved) {
        return prev.filter(p => p.paperId !== paper.paperId);
      } else {
        return [...prev, paper];
      }
    });
  };

  const handleRemove = (paperId: string) => {
    setGraphData(prev => prev.filter(p => p.paperId !== paperId));
  };

  const handleSummarize = async () => {
    if (!selectedPaper || !selectedPaper.abstract) return;
    
    setIsSummarizing(true);
    setPaperSummary(null);
    try {
      const response = await fetch('/api/summarize-paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ abstract: selectedPaper.abstract }),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) errorMessage = errData.error;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid response from server");
      }
      setPaperSummary(data.summary);
    } catch (err: any) {
      console.error(err);
      setPaperSummary('Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const closePaperDetails = () => {
    setSelectedPaper(null);
    setPaperSummary(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            G
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">GapGraph</h1>
        </div>
        
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
          <div className="relative flex items-center w-full">
            <div className="absolute left-3 text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for research topics (e.g., 'quantum computing', 'transformers')..."
              className="w-full pl-10 pr-24 py-2.5 bg-gray-800 border border-gray-700 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="absolute right-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 text-white text-sm font-medium rounded-full transition-colors"
            >
              Search
            </button>
          </div>
        </form>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select 
              className="bg-gray-800 border border-gray-700 rounded text-sm text-gray-200 py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={yearFilter || ''}
              onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Years</option>
              <option value="2024">2024+</option>
              <option value="2023">2023+</option>
              <option value="2020">2020+</option>
              <option value="2015">2015+</option>
            </select>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors relative"
          >
            <Bookmark size={16} />
            <span>Saved</span>
            {savedPapers.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {savedPapers.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Graph Area */}
        <main className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-sm">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-300 font-medium animate-pulse">
                Fetching papers and extracting research gaps...
              </p>
              <p className="text-gray-500 text-sm mt-2">This may take a few moments.</p>
            </div>
          )}
          
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <p className="text-sm">{error}. Showing mock data.</p>
            </div>
          )}

          {!activeQuery && !isLoading && graphData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-6 shadow-xl border border-gray-700">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Discover Research Gaps</h2>
              <p className="text-gray-400 max-w-md">
                Enter a topic above to visualize related papers and their extracted limitations, future work, and research gaps.
              </p>
            </div>
          ) : (
            <Graph 
              data={graphData} 
              searchQuery={activeQuery} 
              onExplore={setSelectedPaper}
              onSave={handleSave}
              savedPapers={savedPapers}
              onExpand={handleExpand}
              onRemove={handleRemove}
              yearFilter={yearFilter}
            />
          )}
        </main>

        {/* Saved Papers Sidebar */}
        {isSidebarOpen && (
          <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl z-30">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Bookmark size={18} className="text-blue-500" /> Saved Papers
              </h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            {savedPapers.length > 0 && (
              <div className="px-4 pt-4 flex gap-2">
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedPapers, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href",     dataStr);
                    downloadAnchorNode.setAttribute("download", "saved_papers.json");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                  className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded border border-gray-700 transition-colors"
                >
                  JSON
                </button>
                <button
                  onClick={() => {
                    const headers = ['Title', 'Year', 'Authors', 'Abstract', 'Research Gap'];
                    const csvRows = [headers.join(',')];
                    
                    savedPapers.forEach(paper => {
                      const authors = paper.authors ? paper.authors.map((a: any) => a.name).join('; ') : '';
                      const row = [
                        `"${(paper.title || '').replace(/"/g, '""')}"`,
                        paper.year || '',
                        `"${authors.replace(/"/g, '""')}"`,
                        `"${(paper.abstract || '').replace(/"/g, '""')}"`,
                        `"${(paper.researchGap || '').replace(/"/g, '""')}"`
                      ];
                      csvRows.push(row.join(','));
                    });
                    
                    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join('\n'));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href",     dataStr);
                    downloadAnchorNode.setAttribute("download", "saved_papers.csv");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                  className="flex-1 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded border border-gray-700 transition-colors"
                >
                  CSV
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {savedPapers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-10">No saved papers yet.</p>
              ) : (
                savedPapers.map(paper => (
                  <div key={paper.paperId} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{paper.title}</h3>
                    <p className="text-xs text-gray-400 mb-2">{paper.year}</p>
                    <button 
                      onClick={() => setSelectedPaper(paper)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Paper Details Modal */}
        {selectedPaper && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="p-5 border-b border-gray-800 flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2 pr-8">{selectedPaper.title}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700">{selectedPaper.year || 'N/A'}</span>
                    {selectedPaper.citationCount !== undefined && (
                      <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        {selectedPaper.citationCount} Citations
                      </span>
                    )}
                    {selectedPaper.authors && (
                      <span className="line-clamp-1">{selectedPaper.authors.map((a: any) => a.name).join(', ')}</span>
                    )}
                  </div>
                </div>
                <button onClick={closePaperDetails} className="text-gray-400 hover:text-white absolute top-5 right-5">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Abstract</h3>
                    {selectedPaper.abstract && (
                      <button 
                        onClick={handleSummarize}
                        disabled={isSummarizing || !!paperSummary}
                        className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-2 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {isSummarizing ? <Loader2 size={12} className="animate-spin" /> : null}
                        {paperSummary ? 'Summarized' : 'Summarize with AI'}
                      </button>
                    )}
                  </div>
                  
                  {paperSummary && (
                    <div className="mb-4 bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">AI Summary</h4>
                      <p className="text-blue-100/90 text-sm leading-relaxed">{paperSummary}</p>
                    </div>
                  )}

                  <p className="text-gray-300 text-sm leading-relaxed">
                    {selectedPaper.abstract || 'No abstract available.'}
                  </p>
                </div>
                
                {selectedPaper.researchGap && (
                  <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      Extracted Research Gaps
                    </h3>
                    <p className="text-red-200/90 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedPaper.researchGap}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3 rounded-b-xl">
                {selectedPaper.openAccessPdf?.url && (
                  <a 
                    href={selectedPaper.openAccessPdf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    PDF
                  </a>
                )}
                <button 
                  onClick={() => handleSave(selectedPaper)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {savedPapers.some(p => p.paperId === selectedPaper.paperId) ? (
                    <><BookmarkCheck size={16} className="text-blue-400" /> Saved</>
                  ) : (
                    <><Bookmark size={16} /> Save Paper</>
                  )}
                </button>
                <a 
                  href={`https://www.semanticscholar.org/paper/${selectedPaper.paperId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  View on Semantic Scholar
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
