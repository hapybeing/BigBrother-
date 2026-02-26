"use client";
import { useState, useEffect, useRef } from 'react';
import { Activity, Globe as GlobeIcon, Cpu, Terminal, Crosshair, Radar as RadarIcon, Target, Share2, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, YAxis } from 'recharts';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Force client-side rendering for the WebGL engine
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export default function Dashboard() {
  const [btcHistory, setBtcHistory] = useState<any[]>([]);
  const [currentBtc, setCurrentBtc] = useState(0);
  const [cveLogs, setCveLogs] = useState<any[]>([]);
  const [sysTime, setSysTime] = useState('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>();
  
  // CYBER WARFARE DATA ARRAYS
  const [arcsData, setArcsData] = useState<any[]>([]);
  const [pointsData, setPointsData] = useState<any[]>([]);
  
  const [osintTarget, setOsintTarget] = useState<any>(null); 
  
  const [threatMatrix, setThreatMatrix] = useState([
    { subject: 'DDoS', A: 120, fullMark: 150 },
    { subject: 'Malware', A: 98, fullMark: 150 },
    { subject: 'Phishing', A: 86, fullMark: 150 },
    { subject: 'Zero-Day', A: 99, fullMark: 150 },
    { subject: 'Intrusion', A: 85, fullMark: 150 },
    { subject: 'Exfil', A: 65, fullMark: 150 },
  ]);

  useEffect(() => {
    // Dynamic resizing for the 3D canvas
    if (globeContainerRef.current) {
      setDimensions({ width: globeContainerRef.current.clientWidth, height: globeContainerRef.current.clientHeight });
    }
    const handleResize = () => {
      if (globeContainerRef.current) {
        setDimensions({ width: globeContainerRef.current.clientWidth, height: globeContainerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);

    const fetchHeavyTelemetry = async () => {
      try {
        const btcRes = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=25');
        const btcData = await btcRes.json();
        const formattedBtc = btcData.map((d: any) => ({
          time: new Date(d[0]).toLocaleTimeString([], { hour12: false, minute: '2-digit', second:'2-digit' }),
          price: parseFloat(d[4])
        }));
        setBtcHistory(formattedBtc);
        setCurrentBtc(formattedBtc[formattedBtc.length - 1].price);

        const cveRes = await fetch('https://api.github.com/search/repositories?q=CVE-2025+OR+CVE-2026&sort=updated&order=desc&per_page=15');
        const cveData = await cveRes.json();
        if (cveData.items) setCveLogs(cveData.items);
      } catch (e) { console.error(e); }
    };

    fetchHeavyTelemetry();
    const macroInterval = setInterval(fetchHeavyTelemetry, 15000); 

    const microInterval = setInterval(() => {
      setSysTime(new Date().toISOString());
      setThreatMatrix(prev => prev.map(t => ({ ...t, A: Math.max(40, Math.min(140, t.A + (Math.random() * 10 - 5))) })));
    }, 1000);

    // Generate random background cyber-attacks for the 3D globe
    const arcInterval = setInterval(() => {
      const newArc = {
        startLat: (Math.random() - 0.5) * 180,
        startLng: (Math.random() - 0.5) * 360,
        endLat: (Math.random() - 0.5) * 180,
        endLng: (Math.random() - 0.5) * 360,
        color: Math.random() > 0.5 ? ['#ff3366', '#ffaa00'] : ['#00ffcc', '#9933ff']
      };
      setArcsData(prev => [...prev.slice(-15), newArc]);
    }, 1500);

    return () => {
      clearInterval(macroInterval);
      clearInterval(microInterval);
      clearInterval(arcInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // OVERWATCH KERNEL EVENT LISTENER
  useEffect(() => {
    const handleTerminalCommand = async (e: any) => {
      const { command, target } = e.detail;
      if ((command === 'whois' || command === 'intel') && target) {
        try {
          const res = await fetch(`https://get.geojs.io/v1/ip/geo/${target}.json`);
          if (res.ok) {
            const data = await res.json();
            const lon = parseFloat(data.longitude);
            const lat = parseFloat(data.latitude);
            
            setOsintTarget({
              ip: target,
              isp: data.organization_name || data.organization || 'UNKNOWN',
              city: data.city || 'UNKNOWN',
              country: data.country_code || 'UNKNOWN',
              lat: lat,
              lng: lon
            });
            
            // Inject target into 3D space
            setPointsData([{ lat, lng: lon, size: 1.5, color: '#00ffcc' }]);
            
            // Physically rotate the camera to face the target
            if (globeRef.current) {
              globeRef.current.pointOfView({ lat, lng: lon, altitude: 1.5 }, 2000);
            }
          }
        } catch (err) { console.error(err); }
      }
    };

    window.addEventListener('OVERWATCH_CMD_EXEC', handleTerminalCommand);
    return () => window.removeEventListener('OVERWATCH_CMD_EXEC', handleTerminalCommand);
  }, []);

  // Configure WebGL renderer on mount
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, [dimensions]);

  return (
    <div className="h-screen w-screen p-2 md:p-4 flex flex-col gap-3 bg-[#020202] text-[#e5e5e5] font-mono overflow-hidden box-border select-none crt-overlay">
      
      {/* HEADER */}
      <header className="flex-none flex justify-between items-end border-b border-[#333] pb-2 z-10 bg-[#020202]">
        <div className="flex items-center gap-3">
          <GlobeIcon className="text-[#00ffcc] animate-pulse" size={24} />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-widest text-white uppercase text-shadow-glow flex items-center gap-3">
              OASIS // OMNI-NODE
              <div className="hidden md:flex gap-2 ml-2">
                <Link href="/recon" className="flex items-center gap-2 bg-[#ffaa00]/10 border border-[#ffaa00]/50 text-[#ffaa00] px-3 py-1 text-[10px] tracking-widest uppercase hover:bg-[#ffaa00] hover:text-black transition-all rounded-sm shadow-[0_0_10px_rgba(255,170,0,0.2)]">
                  <Terminal size={12} /> Recon Node
                </Link>
                <Link href="/nexus" className="flex items-center gap-2 bg-[#9933ff]/10 border border-[#9933ff]/50 text-[#9933ff] px-3 py-1 text-[10px] tracking-widest uppercase hover:bg-[#9933ff] hover:text-white transition-all rounded-sm shadow-[0_0_10px_rgba(153,51,255,0.2)]">
                  <Share2 size={12} /> Nexus Graph
                </Link>
              </div>
            </h1>
            <div className="text-[9px] text-gray-500 tracking-[0.4em] uppercase mt-1">Distributed Intelligence Fusion Matrix</div>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-[10px] tracking-widest text-[#00ffcc]">SYS_CLOCK: {sysTime}</div>
          <div className="text-[9px] text-gray-500 tracking-widest">SAT_UPLINK: ACTIVE | ENCRYPTION: AES-256</div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-3 flex-grow min-h-0 relative z-0">
        
        {/* LEFT FLANK */}
        <div className="col-span-4 lg:col-span-3 flex flex-col gap-3 h-full min-h-0">
          <div className="border border-[#222] bg-[#050505] p-2 relative flex-none h-[40%] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#ff3366]"></div>
            <h2 className="text-[#555] text-[10px] font-bold uppercase mb-1 flex items-center gap-2">
              <RadarIcon size={12} className="text-[#ff3366]" /> Global Threat Matrix
            </h2>
            <div className="flex-grow w-full h-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={threatMatrix}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 8 }} />
                  <Radar name="Threat Level" dataKey="A" stroke="#ff3366" fill="#ff3366" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-[#222] bg-[#050505] p-2 relative flex-grow flex flex-col min-h-0">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#ffaa00]"></div>
            <h2 className="text-[#555] text-[10px] font-bold uppercase mb-2 flex items-center gap-2 flex-none">
              <Terminal size={12} className="text-[#ffaa00]" /> LIVE_CVE_INTERCEPT
            </h2>
            <div className="relative flex-grow min-h-0 w-full">
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 pb-6">
                {cveLogs.map((repo, i) => (
                  <div key={i} className="mb-3 border-b border-[#111] pb-2 last:border-0">
                    <div className="text-[#ffaa00] text-[10px] font-bold break-all">[{repo.name.toUpperCase()}]</div>
                    <div className="text-gray-400 text-[8px] mt-1 leading-tight tracking-tight">
                      {repo.description ? repo.description.substring(0, 80) + '...' : 'NO_PAYLOAD_DESCRIPTION_PROVIDED'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: 3D WEBGL GLOBE */}
        <div className="col-span-4 lg:col-span-6 border border-[#222] bg-[#020202] relative flex flex-col h-full min-h-0 overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] rounded-sm" ref={globeContainerRef}>
          <div className="absolute top-3 left-3 flex items-center gap-2 z-10 bg-black/80 p-1.5 border border-[#333] backdrop-blur-sm">
            <Crosshair size={14} className={osintTarget ? "text-[#00ffcc] animate-pulse" : "text-[#555]"} />
            <span className={`text-[10px] uppercase tracking-widest ${osintTarget ? "text-[#00ffcc]" : "text-[#555]"}`}>
              {osintTarget ? `SAT_LOCK: ${osintTarget.ip}` : 'KINETIC TOPOGRAPHY // 3D RENDER ENGINE'}
            </span>
          </div>
          
          <div className="flex-grow flex items-center justify-center w-full h-full relative cursor-crosshair">
            {dimensions.width > 0 && (
              <Globe
                ref={globeRef}
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                backgroundColor="rgba(0,0,0,0)"
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={1500}
                pointsData={pointsData}
                pointColor="color"
                pointAltitude={0.1}
                pointRadius="size"
                pointsMerge={false}
                atmosphereColor="#00ffcc"
                atmosphereAltitude={0.15}
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,255,204,0.02)] to-transparent h-8 w-full animate-[scan_4s_linear_infinite] pointer-events-none border-b border-[#00ffcc]/10"></div>
        </div>

        {/* RIGHT FLANK */}
        <div className="col-span-4 lg:col-span-3 flex flex-col gap-3 h-full min-h-0">
          <div className="border border-[#222] bg-[#050505] p-2 relative flex-none h-[35%] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00ffcc]"></div>
            <h2 className="text-[#555] text-[10px] font-bold uppercase mb-2 flex justify-between items-center">
              <span className="flex items-center gap-2"><Activity size={12} className="text-[#00ffcc]" /> FININT: BTC</span>
              <span className="text-white text-sm font-light">${currentBtc.toFixed(2)}</span>
            </h2>
            <div className="flex-grow w-full h-full -ml-4">
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={btcHistory} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#00ffcc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <YAxis type="number" domain={['dataMin', 'dataMax']} hide />
                  <Area type="monotone" dataKey="price" stroke="#00ffcc" strokeWidth={1.5} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-[#222] bg-[#050505] p-3 relative flex-grow flex flex-col min-h-0">
             <div className={`absolute top-0 left-0 w-full h-0.5 ${osintTarget ? 'bg-[#00ffcc]' : 'bg-gray-600'}`}></div>
             <h2 className={`text-[10px] font-bold uppercase mb-4 flex items-center gap-2 flex-none ${osintTarget ? 'text-[#00ffcc]' : 'text-[#555]'}`}>
              {osintTarget ? <Target size={12} className="animate-pulse" /> : <Cpu size={12} />} 
              {osintTarget ? 'OSINT_TARGET_LOCKED' : 'SYSTEM_DIAGNOSTICS'}
            </h2>
            
            <div className="relative flex-grow min-h-0 w-full">
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-2 pb-8">
                {osintTarget ? (
                  <div className="space-y-4">
                    <div className="text-[#00ffcc] text-lg font-bold border-b border-[#333] pb-2 break-all">
                      {osintTarget.ip}
                    </div>
                    
                    <div className="bg-[#111] p-2 border border-[#222]">
                      <div className="text-[#555] text-[8px] uppercase tracking-widest mb-1 flex items-center gap-2"><AlertTriangle size={10}/> Network Topology</div>
                      <div className="text-gray-400 text-xs truncate" title={osintTarget.isp}>{osintTarget.isp}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] tracking-wider text-gray-400">
                      <div className="flex flex-col bg-[#111] p-2 border border-[#222]"><span className="text-[#555] mb-1">CITY</span><span className="text-white truncate">{osintTarget.city}</span></div>
                      <div className="flex flex-col bg-[#111] p-2 border border-[#222]"><span className="text-[#555] mb-1">COUNTRY</span><span className="text-white">{osintTarget.country}</span></div>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-[9px] border-b border-[#111] pb-1"><span className="text-[#555]">LATITUDE:</span><span className="text-white font-mono">{osintTarget.lat.toFixed(5)}</span></div>
                      <div className="flex justify-between text-[9px] border-b border-[#111] pb-1"><span className="text-[#555]">LONGITUDE:</span><span className="text-white font-mono">{osintTarget.lng.toFixed(5)}</span></div>
                      <div className="flex justify-between text-[9px] pt-1"><span className="text-[#555]">STATUS:</span><span className="text-[#00ffcc] animate-pulse">ACTIVE TRACKING</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 flex flex-col justify-center mt-4">
                    <div>
                      <div className="flex justify-between text-[9px] text-gray-500 mb-1"><span>MEMORY_HEAP</span><span>84%</span></div>
                      <div className="w-full bg-[#111] h-1 rounded-none"><div className="bg-[#ffaa00] h-full w-[84%]"></div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[9px] text-gray-500 mb-1"><span>SENSOR_ARRAY</span><span>AWAITING KERNEL INPUT</span></div>
                      <div className="w-full bg-[#111] h-1 rounded-none"><div className="bg-gray-700 h-full w-[100%]"></div></div>
                    </div>
                    <div className="text-[8px] text-center text-gray-600 mt-6 animate-pulse border border-[#222] p-2 bg-[#111]">USE THE KERNEL TERMINAL TO INITIATE A TARGET LOCK</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(800px); } }
        .text-shadow-glow { text-shadow: 0 0 10px rgba(0, 255, 204, 0.3); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        
        /* THE CRT EFFECT */
        .crt-overlay::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%);
          background-size: 100% 4px;
          z-index: 100;
          pointer-events: none;
        }
      `}} />
    </div>
  );
}

