"use client";
import { useState, useEffect } from 'react';
import { Terminal, Crosshair, Server, Lock, Globe, ArrowLeft, ShieldAlert, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const SCAN_PHASES = [
  { id: 'DNS', label: 'RESOLVING_DNS_TOPOLOGY', duration: 1500 },
  { id: 'PING', label: 'MEASURING_NODE_LATENCY', duration: 1200 },
  { id: 'PORTS', label: 'ENUMERATING_OPEN_PORTS', duration: 2500 },
  { id: 'SSL', label: 'INTERCEPTING_SSL_HANDSHAKE', duration: 1800 },
  { id: 'VULN', label: 'CROSS_REFERENCING_CVE_DATABASE', duration: 2000 },
];

export default function ReconTerminal() {
  const [target, setTarget] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [sysTime, setSysTime] = useState('');
  
  // LIVE OSINT DATA STATE
  const [targetData, setTargetData] = useState<any>(null);

  useEffect(() => {
    const clock = setInterval(() => setSysTime(new Date().toISOString()), 1000);
    return () => clearInterval(clock);
  }, []);

  const initiateRecon = () => {
    if (!target) return;
    setIsScanning(true);
    setScanComplete(false);
    setCurrentPhase(0);
    setTargetData(null);
    setLogs([`> INITIATING DEEP SCAN ON: ${target}`]);

    let phaseIndex = 0;

    const runPhase = async () => {
      // Upon final phase, fetch real OSINT data
      if (phaseIndex >= SCAN_PHASES.length) {
        setLogs(prev => [...prev, '> PULLING LIVE GEO-REGISTRY DATA...']);
        try {
          // LIVE API UPLINK
          const res = await fetch(`https://ipwho.is/${target}`);
          const data = await res.json();
          setTargetData(data);
        } catch (error) {
          console.error("OSINT API Failure", error);
        }

        setIsScanning(false);
        setScanComplete(true);
        setLogs(prev => [...prev, '> RECONNAISSANCE COMPLETE. TARGET PROFILED.']);
        return;
      }

      setCurrentPhase(phaseIndex);
      setLogs(prev => [...prev, `> [EXEC] ${SCAN_PHASES[phaseIndex].label}...`]);

      setTimeout(() => {
        setLogs(prev => [...prev, `    -> RECEIVED PACKET FRAGMENTS: ${Math.floor(Math.random() * 9000) + 1000} BYTES`]);
      }, SCAN_PHASES[phaseIndex].duration / 2);

      setTimeout(() => {
        setLogs(prev => [...prev, `    -> STATUS: OK [${(Math.random() * 0.5).toFixed(3)}s]`]);
        phaseIndex++;
        runPhase();
      }, SCAN_PHASES[phaseIndex].duration);
    };

    runPhase();
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#e5e5e5] font-mono p-4 md:p-8 flex flex-col box-border selection:bg-[#00ffcc] selection:text-black">
      
      <header className="flex justify-between items-center border-b border-[#222] pb-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-[#00ffcc] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 text-[#ffaa00]">
            <Crosshair className="animate-pulse" size={24} />
            <h1 className="text-xl font-bold tracking-[0.2em] uppercase">Tactical Recon Node</h1>
          </div>
        </div>
        <div className="text-[10px] tracking-widest text-gray-500">SYS_CLOCK: {sysTime}</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full flex-grow">
        
        <div className="flex flex-col gap-6">
          <div className="border border-[#222] bg-[#080808] p-6 relative">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#ffaa00]"></div>
            <h2 className="text-[#555] text-xs font-bold uppercase mb-4 flex items-center gap-2">
              <Server size={14} className="text-[#ffaa00]" /> Target Parameters
            </h2>
            
            <div className="flex flex-col gap-4">
              <input 
                type="text" 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                disabled={isScanning}
                placeholder="ENTER IP OR DOMAIN (e.g., 8.8.8.8)"
                className="w-full bg-black border border-[#333] p-3 text-sm text-[#00ffcc] font-bold tracking-widest focus:outline-none focus:border-[#ffaa00] transition-colors disabled:opacity-50"
              />
              <button 
                onClick={initiateRecon}
                disabled={isScanning || !target}
                className="w-full bg-[#ffaa00]/10 border border-[#ffaa00] text-[#ffaa00] p-3 text-xs font-bold tracking-[0.3em] uppercase hover:bg-[#ffaa00] hover:text-black transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#ffaa00]"
              >
                {isScanning ? 'TRACE IN PROGRESS...' : 'INITIATE ACTIVE TRACE'}
              </button>
            </div>
          </div>

          <div className="border border-[#222] bg-[#050505] p-4 relative flex-grow min-h-[300px] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#333]"></div>
            <h2 className="text-[#555] text-[10px] font-bold uppercase mb-2 flex items-center gap-2">
              <Terminal size={12} className="text-gray-500" /> EVENT_LOG
            </h2>
            <div className="flex-grow overflow-y-auto text-[10px] text-gray-400 font-mono tracking-tight leading-loose">
              {logs.map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  key={i}
                  className={log.includes('OK') ? 'text-[#00ffcc]' : log.includes('COMPLETE') ? 'text-[#ffaa00] font-bold mt-4' : ''}
                >
                  {log}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-[#222] bg-black relative flex items-center justify-center p-6 overflow-hidden min-h-[500px]">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Zap size={14} className="text-[#555]" />
            <span className="text-[10px] text-[#555] uppercase tracking-widest">Forensic Profile</span>
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

          <AnimatePresence mode="wait">
            {!isScanning && !scanComplete && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[#333] text-xs tracking-widest uppercase animate-pulse"
              >
                AWAITING TARGET DESIGNATION
              </motion.div>
            )}

            {isScanning && (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center gap-8 w-full max-w-md relative z-10"
              >
                <div className="relative w-32 h-32 flex items-center justify-center">
                   <div className="absolute inset-0 border border-[#ffaa00] rounded-full animate-[spin_3s_linear_infinite]"></div>
                   <div className="absolute inset-2 border border-[#ffaa00]/30 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                   <ShieldAlert size={32} className="text-[#ffaa00] animate-pulse" />
                </div>
                
                <div className="w-full space-y-4">
                  <div className="text-[#ffaa00] text-xs font-bold tracking-widest text-center uppercase">
                    {SCAN_PHASES[currentPhase]?.label}
                  </div>
                  <div className="h-1 w-full bg-[#222] overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#ffaa00]"
                      initial={{ width: '0%' }}
                      animate={{ width: `${((currentPhase + 1) / SCAN_PHASES.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {scanComplete && targetData && (
              <motion.div 
                key="complete"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full h-full flex flex-col gap-4 relative z-10"
              >
                <div className="text-[#00ffcc] text-lg font-bold tracking-widest border-b border-[#333] pb-2 uppercase">
                  PROFILE: {targetData.success ? targetData.ip : target}
                </div>
                
                {targetData.success ? (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* LIVE DATA PANELS */}
                    <div className="bg-[#111] p-4 border border-[#222]">
                      <div className="text-[#555] text-[9px] mb-2 uppercase flex items-center gap-2"><Globe size={10}/> Host Topology</div>
                      <div className="text-white text-xs tracking-wider space-y-2">
                        <div className="flex justify-between"><span>ISP:</span> <span className="text-gray-400 text-right max-w-[120px] truncate" title={targetData.connection?.isp}>{targetData.connection?.isp || 'UNKNOWN'}</span></div>
                        <div className="flex justify-between"><span>GEO:</span> <span className="text-gray-400 text-right max-w-[120px] truncate">{targetData.country_code} / {targetData.city?.toUpperCase()}</span></div>
                        <div className="flex justify-between"><span>ASN:</span> <span className="text-gray-400">AS{targetData.connection?.asn || '---'}</span></div>
                      </div>
                    </div>

                    <div className="bg-[#111] p-4 border border-[#222]">
                      <div className="text-[#555] text-[9px] mb-2 uppercase flex items-center gap-2"><Lock size={10}/> Coordinates</div>
                      <div className="text-white text-xs tracking-wider space-y-2">
                        <div className="flex justify-between"><span>LAT:</span> <span className="text-[#ffaa00]">{targetData.latitude}</span></div>
                        <div className="flex justify-between"><span>LON:</span> <span className="text-[#ffaa00]">{targetData.longitude}</span></div>
                        <div className="flex justify-between"><span>TYPE:</span> <span className="text-gray-400">{targetData.type}</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#220000] border border-[#ff3366] p-4 text-[#ff3366] text-xs text-center tracking-widest mt-4">
                    TARGET OBFUSCATED OR INVALID IP DETECTED.
                  </div>
                )}
                
                <div className="mt-auto bg-[#ff3366]/10 border border-[#ff3366]/30 p-3 text-center text-[#ff3366] text-[10px] tracking-widest uppercase">
                  WARNING: TRACE LOGGED BY TARGET. MAINTAIN OPSEC.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
