"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Share2, Server, Globe, Mail, Network, ShieldAlert, Crosshair, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function NexusGraph() {
  const [target, setTarget] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [] as any[], links: [] as any[] });
  const [activeNode, setActiveNode] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [sysTime, setSysTime] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>();

  useEffect(() => {
    const clock = setInterval(() => setSysTime(new Date().toISOString()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // PHYSICS ENGINE TWEAKS: Repel nodes to create a sprawling web
  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-400); // Stronger repulsion
      fgRef.current.d3Force('link').distance(60);     // Longer links
    }
  }, [graphData]);

  const buildLiveInfrastructureGraph = async () => {
    if (!target) return;
    setIsScanning(true);
    setActiveNode(null);
    
    const cleanTarget = target.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    let liveNodes: any[] = [{ id: cleanTarget, name: cleanTarget, type: 'ROOT_DOMAIN', group: 1, val: 15 }];
    let liveLinks: any[] = [];

    try {
      const [aRes, mxRes, nsRes, txtRes] = await Promise.all([
        fetch(`https://dns.google/resolve?name=${cleanTarget}&type=A`).then(r => r.json()),
        fetch(`https://dns.google/resolve?name=${cleanTarget}&type=MX`).then(r => r.json()),
        fetch(`https://dns.google/resolve?name=${cleanTarget}&type=NS`).then(r => r.json()),
        fetch(`https://dns.google/resolve?name=${cleanTarget}&type=TXT`).then(r => r.json()),
      ]);

      if (aRes.Answer) {
        aRes.Answer.forEach((record: any) => {
          if (record.type === 1) { 
            const ipId = `IP: ${record.data}`;
            if (!liveNodes.find(n => n.id === ipId)) {
              liveNodes.push({ id: ipId, name: record.data, type: 'IPv4_HOST', group: 2, val: 8, expanded: false });
              liveLinks.push({ source: cleanTarget, target: ipId });
            }
          }
        });
      }

      if (mxRes.Answer) {
        mxRes.Answer.forEach((record: any) => {
          const mxData = record.data.split(' ')[1] || record.data;
          const mxId = `MX: ${mxData}`;
          if (!liveNodes.find(n => n.id === mxId)) {
            liveNodes.push({ id: mxId, name: mxData, type: 'MAIL_SERVER', group: 3, val: 6 });
            liveLinks.push({ source: cleanTarget, target: mxId });
          }
        });
      }

      if (nsRes.Answer) {
        nsRes.Answer.forEach((record: any) => {
          const nsId = `NS: ${record.data}`;
          if (!liveNodes.find(n => n.id === nsId)) {
            liveNodes.push({ id: nsId, name: record.data, type: 'NAME_SERVER', group: 4, val: 6 });
            liveLinks.push({ source: cleanTarget, target: nsId });
          }
        });
      }

      if (txtRes.Answer) {
        txtRes.Answer.forEach((record: any) => {
          if (record.data.includes('v=spf') || record.data.includes('v=DMARC')) {
            const secId = `SEC: ${record.data.substring(0, 20)}...`;
            if (!liveNodes.find(n => n.id === secId)) {
               liveNodes.push({ id: secId, name: 'TXT Security Policy', type: 'SEC_POLICY', group: 5, val: 4, fullData: record.data });
               liveLinks.push({ source: cleanTarget, target: secId });
            }
          }
        });
      }

      setGraphData({ nodes: liveNodes, links: liveLinks });
    } catch (error) {
      console.error("Ontology Construction Failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  // RECURSIVE EXPANSION ENGINE
  const expandNode = async (node: any) => {
    if (node.type !== 'IPv4_HOST' || node.expanded) return;
    
    setIsExpanding(true);
    try {
      const res = await fetch(`https://ipwho.is/${node.name}`);
      const data = await res.json();
      
      if (data.success) {
        const newNodes = [...graphData.nodes];
        const newLinks = [...graphData.links];

        // Mark parent as expanded
        const parentIdx = newNodes.findIndex(n => n.id === node.id);
        if (parentIdx > -1) newNodes[parentIdx].expanded = true;

        // Spawn ISP Node
        const ispId = `ISP_${data.connection.isp}`;
        if (!newNodes.find(n => n.id === ispId)) {
          newNodes.push({ id: ispId, name: data.connection.isp, type: 'ISP_PROVIDER', group: 6, val: 5 });
        }
        newLinks.push({ source: node.id, target: ispId });

        // Spawn Geo Node
        const geoId = `GEO_${data.city}_${data.country_code}`;
        if (!newNodes.find(n => n.id === geoId)) {
          newNodes.push({ id: geoId, name: `${data.city}, ${data.country_code}`, type: 'GEO_LOCATION', group: 7, val: 5 });
        }
        newLinks.push({ source: node.id, target: geoId });

        setGraphData({ nodes: newNodes, links: newLinks });
      }
    } catch (e) {
      console.error("Expansion trace failed", e);
    } finally {
      setIsExpanding(false);
    }
  };

  const handleNodeClick = useCallback((node: any) => {
    setActiveNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(3, 1000);
    }
    // Automatically trigger deep trace on IPs
    if (node.type === 'IPv4_HOST' && !node.expanded) {
      expandNode(node);
    }
  }, [graphData]);

  const getNodeColor = (group: number) => {
    switch(group) {
      case 1: return '#ffaa00'; // Root (Orange)
      case 2: return '#00ffcc'; // IP (Neon Green)
      case 3: return '#ff3366'; // MX (Red)
      case 4: return '#9933ff'; // NS (Purple)
      case 5: return '#555555'; // TXT/Sec (Gray)
      case 6: return '#ff00aa'; // ISP (Pink)
      case 7: return '#3388ff'; // Geo (Blue)
      default: return '#ffffff';
    }
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'ROOT_DOMAIN': return <Globe size={14} className="text-[#ffaa00]" />;
      case 'IPv4_HOST': return <Server size={14} className="text-[#00ffcc]" />;
      case 'MAIL_SERVER': return <Mail size={14} className="text-[#ff3366]" />;
      case 'NAME_SERVER': return <Network size={14} className="text-[#9933ff]" />;
      case 'SEC_POLICY': return <ShieldAlert size={14} className="text-gray-400" />;
      case 'ISP_PROVIDER': return <Share2 size={14} className="text-[#ff00aa]" />;
      case 'GEO_LOCATION': return <Crosshair size={14} className="text-[#3388ff]" />;
      default: return <Share2 size={14} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#020202] text-[#e5e5e5] font-mono flex flex-col box-border overflow-hidden select-none relative">
      
      <header className="absolute top-0 left-0 w-full z-10 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-[#00ffcc] transition-colors w-max">
            <ArrowLeft size={16} /> <span className="text-[10px] tracking-widest uppercase">RETURN TO OMNI-NODE</span>
          </Link>
          <div className="flex items-center gap-3 bg-black/80 border border-[#333] p-2 backdrop-blur-md">
            <Share2 className="text-[#9933ff] animate-pulse" size={20} />
            <div>
              <h1 className="text-sm font-bold tracking-[0.3em] uppercase text-white shadow-[#9933ff] drop-shadow-md">
                NEXUS // Ontology Engine
              </h1>
              <div className="text-[8px] text-[#00ffcc] tracking-widest mt-0.5 flex items-center gap-2">
                LIVE INFRASTRUCTURE MAPPING 
                {isExpanding && <span className="text-[#ff3366] animate-pulse flex items-center gap-1"><Zap size={8}/> DEEP TRACING</span>}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-black/80 border border-[#333] p-2 backdrop-blur-md pointer-events-auto w-full md:w-auto">
          <input 
            type="text" 
            placeholder="TARGET DOMAIN (e.g. mit.edu)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={isScanning}
            className="bg-transparent border-none text-[#ffaa00] text-xs font-bold tracking-widest focus:outline-none placeholder-gray-600 w-48 md:w-64"
          />
          <button 
            onClick={buildLiveInfrastructureGraph}
            disabled={isScanning || !target}
            className="bg-[#9933ff]/20 text-[#9933ff] px-3 py-1 text-[10px] tracking-widest uppercase hover:bg-[#9933ff] hover:text-white transition-all border border-[#9933ff]/50 disabled:opacity-50 flex items-center gap-2"
          >
            {isScanning ? <><Loader2 size={12} className="animate-spin"/> TRACING...</> : <><Crosshair size={12}/> DEPLOY</>}
          </button>
        </div>
      </header>

      <div className="flex-grow w-full h-full cursor-crosshair" ref={containerRef}>
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(node: any) => getNodeColor(node.group)}
            nodeRelSize={5}
            linkColor={() => 'rgba(255,255,255,0.15)'}
            linkWidth={1.5}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={() => '#00ffcc'}
            linkDirectionalParticleSpeed={0.008}
            onNodeClick={handleNodeClick}
            backgroundColor="#020202"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#333] tracking-[0.3em] text-xs uppercase">
            AWAITING TARGET DESIGNATION FOR ONTOLOGY BUILD
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeNode && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="absolute top-24 right-4 w-72 bg-[#050505]/95 border border-[#333] backdrop-blur-md flex flex-col z-20 shadow-2xl"
          >
            <div className="h-1 w-full" style={{ backgroundColor: getNodeColor(activeNode.group) }}></div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h2 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-white">
                  {getIconForType(activeNode.type)} {activeNode.type.replace('_', ' ')}
                </h2>
                <button onClick={() => setActiveNode(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
              </div>

              <div className="text-sm font-bold tracking-wider text-white break-all border-b border-[#222] pb-3" style={{ color: getNodeColor(activeNode.group) }}>
                {activeNode.name}
              </div>

              {activeNode.type === 'SEC_POLICY' && (
                <div className="text-[8px] text-gray-400 font-mono break-all leading-tight bg-[#111] p-2 border border-[#222]">
                  {activeNode.fullData}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[9px] tracking-widest text-gray-400">
                <div className="flex flex-col"><span className="text-[#555]">NODE_CLASS</span><span className="text-white uppercase">{activeNode.type}</span></div>
                <div className="flex flex-col"><span className="text-[#555]">STATUS</span><span className="text-[#00ffcc] animate-pulse">RESOLVED</span></div>
              </div>

              {activeNode.type === 'IPv4_HOST' && !activeNode.expanded && (
                <div className="mt-2 text-[8px] text-[#ffaa00] border border-[#ffaa00]/30 bg-[#ffaa00]/10 p-2 text-center uppercase tracking-widest flex items-center justify-center gap-2">
                  <Loader2 size={10} className="animate-spin" /> EXECUTING DEEP TRACE...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
    </div>
  );
}
