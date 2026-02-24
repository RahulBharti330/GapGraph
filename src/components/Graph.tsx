import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import PaperNode from './PaperNode';
import GapNode from './GapNode';

interface PaperData {
  paperId: string;
  title: string;
  year: number;
  authors: { authorId: string; name: string }[];
  abstract: string;
  researchGap: string;
}

interface GraphProps {
  data: PaperData[];
  searchQuery: string;
  onExplore: (paper: PaperData) => void;
  onSave: (paper: PaperData) => void;
  savedPapers: PaperData[];
  onExpand: (paperId: string) => void;
  onRemove: (paperId: string) => void;
  yearFilter: number | null;
}

export default function Graph({ 
  data, 
  searchQuery, 
  onExplore, 
  onSave, 
  savedPapers, 
  onExpand, 
  onRemove,
  yearFilter
}: GraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const nodeTypes = useMemo(() => ({ paper: PaperNode, gap: GapNode }), []);

  useEffect(() => {
    if (!data || data.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Filter data based on year
    const filteredData = yearFilter 
      ? data.filter(p => p.year && p.year >= yearFilter)
      : data;

    // Node Type 1 (Center): The original searchQuery
    const centerNodeId = 'center-node';
    newNodes.push({
      id: centerNodeId,
      position: { x: 400, y: 300 },
      data: { label: `Query: ${searchQuery}` },
      style: {
        background: '#1f2937',
        color: '#f3f4f6',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '10px 20px',
        fontWeight: 'bold',
        fontSize: '16px',
        width: 200,
        textAlign: 'center',
      },
    });

    const radius = 350;
    const angleStep = (2 * Math.PI) / Math.max(filteredData.length, 1);

    filteredData.forEach((paper, index) => {
      const angle = index * angleStep;
      // Position papers in a circle around the center
      const paperX = 400 + radius * Math.cos(angle);
      const paperY = 300 + radius * Math.sin(angle);
      
      const paperNodeId = `paper-${paper.paperId}`;
      const isSaved = savedPapers.some(p => p.paperId === paper.paperId);

      // Node Type 2 (Papers): Custom PaperNode
      newNodes.push({
        id: paperNodeId,
        type: 'paper',
        position: { x: paperX, y: paperY },
        data: { 
          paper,
          isSaved,
          onSave: () => onSave(paper),
          onRemove: () => onRemove(paper.paperId),
          onExpand: () => onExpand(paper.paperId),
          onExplore: () => onExplore(paper)
        },
      });

      // Connect Paper to Center
      newEdges.push({
        id: `edge-center-${paper.paperId}`,
        source: centerNodeId,
        target: paperNodeId,
        animated: true,
        style: { stroke: '#6b7280', strokeWidth: 2 },
      });

      if (paper.researchGap) {
        // Position gaps further out from the paper
        const gapRadius = 250;
        const gapX = paperX + gapRadius * Math.cos(angle);
        const gapY = paperY + gapRadius * Math.sin(angle);
        
        const gapNodeId = `gap-${paper.paperId}`;

        // Node Type 3 (Gaps): Custom GapNode
        newNodes.push({
          id: gapNodeId,
          type: 'gap',
          position: { x: gapX, y: gapY },
          data: { gap: paper.researchGap },
        });

        // Connect Gap to Paper
        newEdges.push({
          id: `edge-paper-gap-${paper.paperId}`,
          source: paperNodeId,
          target: gapNodeId,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#ef4444',
          },
          style: { stroke: '#ef4444', strokeWidth: 1.5, strokeDasharray: '5,5' },
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [data, searchQuery, savedPapers, yearFilter, onSave, onRemove, onExpand, onExplore, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="w-full h-full bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        colorMode="dark"
      >
        <Controls />
        <MiniMap nodeStrokeColor={(n) => {
          if (n.type === 'paper') return '#3b82f6';
          if (n.type === 'gap') return '#ef4444';
          return '#fff';
        }} nodeColor={(n) => {
          if (n.type === 'paper') return '#1f2937';
          if (n.type === 'gap') return '#451a1a';
          return '#1f2937';
        }} />
        <Background gap={12} size={1} color="#374151" />
      </ReactFlow>
    </div>
  );
}
