"use client";
import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, Share2, ShieldAlert, Cpu, Activity, Fingerprint, Lock } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

// CRITICAL: We must dynamically import the physics engine to bypass Server-Side Rendering (SSR)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

// Algorithmic Syndicate Generator (Generates a massive 80-node knowledge graph)
const generateSyndicateGraph = () => {
  const nodes: any[] = [];
  const links: any[] = [];
  
  // Core Threat Actors (The Apex Nodes)
  const actors = ['APT-29', 'LAZARUS_GRP', 'FIN7'];
  actors.forEach((id, i) => nodes.push({ id, group: 1, name: `Threat Syndicate: ${id}`, val: 12, type: 'THREAT_ACTOR' }));

  // Generate sub-nodes (Wallets, IPs, Exploits, Emails)
  const types = [
    { group: 2, type: 'C2_SERVER', prefix: 'IP:', val: 6 },
    { group: 3, type: 'EXPLOIT', prefix: 'CVE-', val: 5 },
    { group: 4, type: 'CRYPTO_WALLET', prefix: 'BTC:', val: 4 },
    { group: 5, type: 'COMPROMISED_ID', prefix: 'USR:', val: 3 }
  ];

  let nodeId = 3;
  actors.forEach(actor => {
    // Each actor has 3-5 campaigns (C2 Servers)
    const numC2 = Math.floor(Math.random() * 3) + 3;
    for(let i=0; i<numC2; i++) {
      const c2Id = `node_${nodeId++}`;
      nodes.push({ id: c2Id, group: 2, name: `185.10.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`, val: 6, type: 'C2_SERVER' });
      links.push({ source: actor, target: c2Id });

      // Each C2 Server connects to exploits, wallets, and victims
      const numBranches = Math.floor(Math.random() * 6) + 4;
      for(let j=0; j<numBranches; j++) {
        const t = types[Math.floor(Math.random() * types.length)];
        const branchId = `node_${nodeId++}`;
        const nameVal = t.type === 'EXPLOIT' ? `2024-${Math.floor(Math.random()*9000)+1000}` : 
                        t.type === 'CRYPTO_WALLET' ? `bc1q${Math.random().toString(36).substring(2, 8)}...` : 
                        `target_${Math.floor(Math.random()*999)}@corp.com`;
        
        nodes.push({ id: branchId, group: t.group, name: `${t.prefix}${nameVal}`, val: t.val, type: t.type });
        links.push({ source: c2Id, target: branchId });
        
        // Occasionally cross-link to build web density
        if (Math.random() > 0.8 && nodes.length > 10) {
          links.push({ source: branchId, target: nodes[Math.floor(Math.random() * (nodes.length - 1))].id });
        }
      }
    }
  });

  return { nodes, links };
};

export default function NexusGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [activeNode, setActiveNode] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [sysTime, setSysTime] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>();

  useEffect(() => {
    setGraphData(generateSyndicateGraph() as any);
    const clock = setInterval(() => setSysTime(new Date().toISOString()), 1000);
    return () => clearInterval(clock);
  }, []);

  // Responsive canvas sizing
  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNodeClick = (node: any) => {
    setActiveNode(node);
    // Center physics engine on clicked node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(2.5, 1000);
    }
  };

  // Node Styling Engine
  const getNodeColor = (group: number) => {
    switch(group) {
      case 1: return '#ff3366'; // Threat Actor (Red)
      case 2: return '#ffaa00'; // Server (Orange)
      case 3: return '#00ffcc'; // Exploit (Neon Green)
      case 4: return '#9933ff'; // Wallet (Purple)
      case 5: return '#555555'; // Identity (Gray)
      default: return '#ffffff';
    }
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'THREAT_ACTOR': return <ShieldAlert size={14} className="text-[#ff3366]" />;
      case 'C2_SERVER': return <Cpu size={14} className="text-[#ffaa00]" />;
      case 'EXPLOIT': return <Activity size={14} className="text-[#00ffcc]" />;
      case 'CRYPTO_WALLET': return <Lock size={14} className="text-[#9933ff]" />;
      case 'COMPROMISED_ID': return <Fingerprint size={14} className="text-gray-400" />;
      default: return <Share2 size={14} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#020202] text-[#e5e5e5] font-mono flex flex-col box-border overflow-hidden select-none relative">
      
      {/* HUD HEADER */}
      <header className="absolute top-0 left-0 w-full z-10 p-4 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#00ffcc] transition-colors w-max">
            <ArrowLeft size={16} /> <span className="text-[10px] tracking-widest uppercase">RETURN TO OMNI-NODE</span>
          </Link>
          <div className="flex items-center gap-3 bg-black/50 border border-[#333] p-2 backdrop-blur-md">
            <Share2 className="text-[#9933ff] animate-pulse" size={20} />
            <div>
              <h1 className="text-sm font-bold tracking-[0.3em] uppercase text-white shadow-[#9933ff] drop-shadow-md">
                NEXUS // Link Analysis
              </h1>
              <div className="text-[8px] text-gray-400 tracking-widest mt-0.5">FORCE-DIRECTED ENTITY GRAPH</div>
            </div>
          </div>
        </div>
        
        <div className="text-right bg-black/50 border border-[#333] p-2 backdrop-blur-md pointer-events-auto hidden md:block">
          <div className="text-[10px] tracking-widest text-[#9933ff]">SYS_CLOCK: {sysTime}</div>
          <div className="text-[8px] text-gray-500 tracking-widest mt-0.5">NODES: {graphData.nodes.length} | EDGES: {graphData.links.length}</div>
        </div>
      </header>

      {/* THE PHYSICS ENGINE (CANVAS) */}
      <div className="flex-grow w-full h-full cursor-crosshair" ref={containerRef}>
        {graphData.nodes.length > 0 && (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(node: any) => getNodeColor(node.group)}
            nodeRelSize={4}
            linkColor={() => 'rgba(255,255,255,0.05)'}
            linkWidth={1}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleColor={() => '#00ffcc'}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={handleNodeClick}
            backgroundColor="#020202"
          />
        )}
      </div>

      {/* TARGET DATA FUSION PANEL (SLIDES IN WHEN NODE IS CLICKED) */}
      <AnimatePresence>
        {activeNode && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="absolute top-20 right-4 w-72 bg-[#050505]/95 border border-[#333] backdrop-blur-md flex flex-col z-20 shadow-2xl"
          >
            <div className="h-1 w-full" style={{ backgroundColor: getNodeColor(activeNode.group) }}></div>
            <div className="p-4 flex flex-col gap-4">
              
              <div className="flex justify-between items-start">
                <h2 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                  {getIconForType(activeNode.type)} {activeNode.type.replace('_', ' ')}
                </h2>
                <button onClick={() => setActiveNode(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
              </div>

              <div className="text-sm font-bold tracking-wider text-[#00ffcc] break-all border-b border-[#222] pb-3">
                {activeNode.name}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px] tracking-widest text-gray-400">
                <div className="flex flex-col"><span className="text-[#555]">ENTITY_ID</span><span className="text-white truncate" title={activeNode.id}>{activeNode.id}</span></div>
                <div className="flex flex-col"><span className="text-[#555]">WEIGHT</span><span className="text-white">{activeNode.val * 10} TB</span></div>
                <div className="flex flex-col"><span className="text-[#555]">STATUS</span><span className="text-[#ff3366] animate-pulse">ACTIVE</span></div>
                <div className="flex flex-col"><span className="text-[#555]">RISK_SCORE</span><span className="text-white">CRITICAL</span></div>
              </div>

              <div className="mt-2 space-y-1">
                <div className="text-[8px] text-[#555] uppercase tracking-widest mb-1">Known Associations</div>
                {graphData.links
                  .filter((l: any) => (l.source.id || l.source) === activeNode.id || (l.target.id || l.target) === activeNode.id)
                  .slice(0, 5)
                  .map((link: any, idx) => {
                    const relatedNodeId = (link.source.id || link.source) === activeNode.id ? (link.target.id || link.target) : (link.source.id || link.source);
                    return (
                      <div key={idx} className="text-[8px] text-gray-400 border-l-2 border-[#333] pl-2 py-0.5 truncate">
                        {relatedNodeId}
                      </div>
                    );
                  })}
              </div>

              <button className="w-full mt-2 bg-[#ffaa00]/10 border border-[#ffaa00]/50 text-[#ffaa00] py-2 text-[8px] tracking-[0.3em] uppercase hover:bg-[#ffaa00] hover:text-black transition-all">
                Extract Telemetry
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
    </div>
  );
}
