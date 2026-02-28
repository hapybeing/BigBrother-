"use client";
import { useState, useEffect, useRef } from 'react';
import { Activity, Globe as GlobeIcon, Cpu, Terminal, Crosshair, Radar as RadarIcon, Target, Share2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, Radar, YAxis } from 'recharts';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

const APT_HUBS = [
  { name: 'Moscow', lat: 55.7558, lng: 37.6173, color: '#ff3366' },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, color: '#ff3366' },
  { name: 'Pyongyang', lat: 39.0392, lng: 125.7625, color: '#ff3366' },
  { name: 'Tehran', lat: 35.6892, lng: 51.3890, color: '#ffaa00' },
  { name: 'Maryland', lat: 39.1066, lng: -76.7772, color: '#00ffcc' }
];

const GLOBAL_TARGETS = [
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 }
];

export default function Dashboard() {
  const [isMobile, setIsMobile] = useState(false);
  const [defconLevel, setDefconLevel] = useState(4);
  const [btcHistory, setBtcHistory] = useState<any[]>([]);
  const [currentBtc, setCurrentBtc] = useState(0);
  const [cveLogs, setCveLogs] = useState<any[]>([]);
  const [sysTime, setSysTime] = useState('');
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>();
  
  const [arcsData, setArcsData] = useState<any[]>([]);
  const [pointsData, setPointsData] = useState<any[]>([]);
  const [osintTarget, setOsintTarget] = useState<any>(null); 
  
  const [threatMatrix, setThreatMatrix] = useState([
    { subject: 'DDoS', A: 120, fullMark: 150 },
    { subject: 'Malware', A: 98, fullMark: 150 },
    { subject: 'Phishing', A: 86, fullMark: 150 },
    { subject: 'Zero-Day', A: 99, fullMark: 150 },
    { subject: 'Intrusion', A: 85, fullMark: 150 }
  ]);

  // HARDWARE DETECTION & RESPONSIVE RESIZING
  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth < 1024;
      setIsMobile(mobileCheck);
      if (globeContainerRef.current) {
        setDimensions({ 
          width: globeContainerRef.current.clientWidth, 
          height: globeContainerRef.current.clientHeight || (mobileCheck ? 400 : 500) 
        });
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
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

        const cveRes = await fetch('https://api.github.com/search/repositories?q=CVE-2025+OR+CVE-2026&sort=updated&order=desc&per_page=10');
        const cveData = await cveRes.json();
        if (cveData.items) {
          setCveLogs(cveData.items);
          // DEFCON LOGIC: If many recent CVEs exist, elevate threat level
          if (cveData.items.length > 5) setDefconLevel(3);
          if (cveData.items.some((i:any) => i.name.toLowerCase().includes('critical'))) setDefconLevel(2);
        }
      } catch (e) { console.error(e); }
    };

    fetchHeavyTelemetry();
    const macroInterval = setInterval(fetchHeavyTelemetry, 30000); // Throttled to 30s

    const microInterval = setInterval(() => {
      setSysTime(new Date().toISOString());
      setThreatMatrix(prev => prev.map(t => ({ ...t, A: Math.max(40, Math.min(140, t.A + (Math.random() * 10 - 5))) })));
    }, 1000);

    // ADAPTIVE KINETIC ENGINE: Slower and fewer arcs on mobile to save CPU/Battery
    const arcIntervalTime = isMobile ? 3000 : 1200;
    const maxArcs = isMobile ? 5 : 15;

    const arcInterval = setInterval(() => {
      const isAPTOrigin = Math.random() > 0.3;
      const originNode = isAPTOrigin ? APT_HUBS[Math.floor(Math.random() * APT_HUBS.length)] : GLOBAL_TARGETS[Math.floor(Math.random() * GLOBAL_TARGETS.length)];
      const targetNode = GLOBAL_TARGETS[Math.floor(Math.random() * GLOBAL_TARGETS.length)];
      
      if (originNode.name === targetNode.name) return;

      const newArc = {
        startLat: originNode.lat, startLng: originNode.lng,
        endLat: targetNode.lat, endLng: targetNode.lng,
        color: (originNode as any).color ? [(originNode as any).color, '#ffffff'] : ['#9933ff', '#00ffcc']
      };
      
      setArcsData(prev => [...prev.slice(-(maxArcs - 1)), newArc]);
    }, arcIntervalTime);

    return () => {
      clearInterval(macroInterval);
      clearInterval(microInterval);
      clearInterval(arcInterval);
    };
  }, [isMobile]);

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
              ip: target, isp: data.organization_name || data.organization || 'UNKNOWN',
              city: data.city || 'UNKNOWN', country: data.country_code || 'UNKNOWN',
              lat, lng: lon
            });
            
            setPointsData([{ lat, lng: lon, size: isMobile ? 1 : 2, color: '#00ffcc' }]);
            
            if (globeRef.current) globeRef.current.pointOfView({ lat, lng: lon, altitude: isMobile ? 1.8 : 1.2 }, 2000);
          }
        } catch (err) { console.error(err); }
      }
    };
    window.addEventListener('OVERWATCH_CMD_EXEC', handleTerminalCommand);
    return () => window.removeEventListener('OVERWATCH_CMD_EXEC', handleTerminalCommand);
  }, [isMobile]);

  useEffect(() => {
    if (globeRef.current && dimensions.width > 0) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.controls().enableZoom = false; 
    }
  }, [dimensions]);

  return (
    <div className="min-h-screen w-full p-2 md:p-4 flex flex-col gap-4 bg-[#020202] text-[#e5e5e5] font-mono box-border select-none crt-overlay overflow-x-hidden overflow-y-auto custom-scrollbar">
      
      {/* HEADER WITH DYNAMIC DEFCON STATUS */}
      <header className="flex-none flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#333] pb-4 z-10 bg-[#020202] gap-4">
        <div className="flex items-center gap-3">
          <GlobeIcon className="text-[#00ffcc] animate-pulse hidden md:block" size={28} />
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-widest text-white uppercase text-shadow-glow flex items-center gap-2">
              OASIS <span className="text-[#333] hidden md:inline"> // </span> <span className="text-gray-300">OMNI-NODE</span>
            </h1>
            <div className="text-[9px] md:text-[10px] text-gray-500 tracking-[0.2em] md:tracking-[0.4em] uppercase mt-1">Distributed Intelligence Fusion Matrix</div>
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
          {/* DYNAMIC DEFCON INDICATOR */}
          <div className={`flex items-center gap-2 px-3 py-1 border ${defconLevel <= 2 ? 'border-[#ff3366] bg-[#ff3366]/10 text-[#ff3366] animate-pulse' : 'border-[#ffaa00] bg-[#ffaa00]/10 text-[#ffaa00]'} text-[10px] tracking-widest uppercase font-bold`}>
            <ShieldAlert size={12} /> 
            SYSTEM STATUS: DEFCON {defconLevel}
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Link href="/recon" className="flex items-center justify-center gap-2 bg-[#111] border border-[#333] text-gray-300 px-3 py-1.5 text-[10px] tracking-widest uppercase hover:border-[#00ffcc] hover:text-[#00ffcc] transition-all flex-grow md:flex-grow-0">
              <Terminal size={12} /> Recon
            </Link>
            <Link href="/nexus" className="flex items-center justify-center gap-2 bg-[#111] border border-[#333] text-gray-300 px-3 py-1.5 text-[10px] tracking-widest uppercase hover:border-[#9933ff] hover:text-[#9933ff] transition-all flex-grow md:flex-grow-0">
              <Share2 size={12} /> Nexus
            </Link>
          </div>
        </div>
      </header>

      {/* RESPONSIVE GRID: Orders change based on screen size so Globe is always at the top on Mobile */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 flex-grow z-0 pb-16">
        
        {/* CENTER COLUMN: 3D WEBGL GLOBE (ORDER 1 ON MOBILE) */}
        <div className="lg:col-span-6 border border-[#222] bg-[#020202] relative flex flex-col h-[45vh] lg:h-auto lg:min-h-[700px] shadow-[inset_0_0_50px_rgba(0,0,0,0.9)] rounded-sm order-1 lg:order-2" ref={globeContainerRef}>
          <div className="absolute top-2 left-2 md:top-4 md:left-4 flex items-center gap-2 z-10 bg-black/80 p-1.5 md:p-2 border border-[#333] backdrop-blur-sm">
            <Crosshair size={14} className={osintTarget ? "text-[#00ffcc] animate-pulse" : "text-[#555]"} />
            <span className={`text-[10px] md:text-xs uppercase tracking-widest font-bold ${osintTarget ? "text-[#00ffcc]" : "text-[#555]"}`}>
              {osintTarget ? `SAT_LOCK: ${osintTarget.ip}` : 'KINETIC TOPOGRAPHY'}
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
                arcDashAnimateTime={isMobile ? 2500 : 1500}
                arcStroke={isMobile ? 0.8 : 0.5} 
                pointsData={pointsData}
                pointColor="color"
                pointAltitude={0.1}
                pointRadius="size"
                pointsMerge={false}
                atmosphereColor="#00ffcc"
                atmosphereAltitude={isMobile ? 0.1 : 0.15}
              />
            )}
          </div>
        </div>

        {/* LEFT FLANK (ORDER 2 ON MOBILE) */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1">
          <div className="border border-[#222] bg-[#050505] p-3 md:p-4 relative flex flex-col min-h-[250px] md:min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#ff3366]"></div>
            <h2 className="text-[#555] text-[10px] md:text-[12px] font-bold uppercase mb-2 flex items-center gap-2">
              <RadarIcon size={12} className="text-[#ff3366]" /> Global Threat Matrix
            </h2>
            <div className="flex-grow w-full h-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "55%" : "65%"} data={threatMatrix}>
                  <PolarGrid stroke="#222" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: isMobile ? 8 : 10 }} />
                  <Radar name="Threat Level" dataKey="A" stroke="#ff3366" fill="#ff3366" fillOpacity={0.2} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-[#222] bg-[#050505] p-3 md:p-4 relative flex flex-col h-[300px] md:h-[400px]">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#ffaa00]"></div>
            <h2 className="text-[#555] text-[10px] md:text-[12px] font-bold uppercase mb-3 flex items-center gap-2 flex-none">
              <Terminal size={12} className="text-[#ffaa00]" /> LIVE_CVE_INTERCEPT
            </h2>
            <div className="overflow-y-auto custom-scrollbar pr-2 flex-grow">
              {cveLogs.map((repo, i) => (
                <div key={i} className="mb-3 border-b border-[#111] pb-2 last:border-0">
                  <div className="text-[#ffaa00] text-[10px] font-bold break-all">[{repo.name.toUpperCase()}]</div>
                  <div className="text-gray-400 text-[9px] mt-1 leading-tight tracking-tight">
                    {repo.description ? repo.description : 'NO_PAYLOAD_DESCRIPTION_PROVIDED'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT FLANK (ORDER 3 ON MOBILE) */}
        <div className="lg:col-span-3 flex flex-col gap-4 order-3">
          <div className="border border-[#222] bg-[#050505] p-3 md:p-4 relative flex flex-col min-h-[250px] md:min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00ffcc]"></div>
            <h2 className="text-[#555] text-[10px] md:text-[12px] font-bold uppercase mb-2 flex justify-between items-center">
              <span className="flex items-center gap-2"><Activity size={12} className="text-[#00ffcc]" /> FININT: BTC</span>
              <span className="text-white text-sm md:text-base font-light">${currentBtc.toFixed(2)}</span>
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

          <div className="border border-[#222] bg-[#050505] p-3 md:p-4 relative flex flex-col min-h-[300px] md:min-h-[400px]">
             <div className={`absolute top-0 left-0 w-full h-0.5 ${osintTarget ? 'bg-[#00ffcc]' : 'bg-gray-600'}`}></div>
             <h2 className={`text-[10px] md:text-[12px] font-bold uppercase mb-4 flex items-center gap-2 flex-none ${osintTarget ? 'text-[#00ffcc]' : 'text-[#555]'}`}>
              {osintTarget ? <Target size={12} className="animate-pulse" /> : <Cpu size={12} />} 
              {osintTarget ? 'OSINT_TARGET_LOCKED' : 'SYSTEM_DIAGNOSTICS'}
            </h2>
            
            <div className="flex-grow">
              {osintTarget ? (
                <div className="space-y-4">
                  <div className="text-[#00ffcc] text-lg font-bold border-b border-[#333] pb-2 break-all">
                    {osintTarget.ip}
                  </div>
                  <div className="bg-[#111] p-2 md:p-3 border border-[#222]">
                    <div className="text-[#555] text-[9px] uppercase tracking-widest mb-1 flex items-center gap-2"><AlertTriangle size={10}/> Network Topology</div>
                    <div className="text-gray-300 text-xs truncate" title={osintTarget.isp}>{osintTarget.isp}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[9px] tracking-wider text-gray-400">
                    <div className="flex flex-col bg-[#111] p-2 border border-[#222]"><span className="text-[#555] mb-1">CITY</span><span className="text-white text-xs truncate">{osintTarget.city}</span></div>
                    <div className="flex flex-col bg-[#111] p-2 border border-[#222]"><span className="text-[#555] mb-1">COUNTRY</span><span className="text-white text-xs">{osintTarget.country}</span></div>
                  </div>
                  <div className="space-y-2 pt-3 border-t border-[#222]">
                    <div className="flex justify-between text-[10px]"><span className="text-[#555]">LATITUDE:</span><span className="text-white font-mono">{osintTarget.lat.toFixed(5)}</span></div>
                    <div className="flex justify-between text-[10px]"><span className="text-[#555]">LONGITUDE:</span><span className="text-white font-mono">{osintTarget.lng.toFixed(5)}</span></div>
                    <div className="flex justify-between text-[10px] pt-1"><span className="text-[#555]">STATUS:</span><span className="text-[#00ffcc] font-bold animate-pulse">ACTIVE TRACKING</span></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 flex flex-col justify-center mt-6">
                  <div>
                    <div className="flex justify-between text-[9px] md:text-[10px] text-gray-500 mb-2"><span>MEMORY_HEAP</span><span>84%</span></div>
                    <div className="w-full bg-[#111] h-1.5 rounded-none"><div className="bg-[#ffaa00] h-full w-[84%]"></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] md:text-[10px] text-gray-500 mb-2"><span>SENSOR_ARRAY</span><span>AWAITING KERNEL INPUT</span></div>
                    <div className="w-full bg-[#111] h-1.5 rounded-none"><div className="bg-gray-700 h-full w-[100%]"></div></div>
                  </div>
                  <div className="text-[9px] text-center text-gray-600 mt-6 animate-pulse border border-[#222] p-3 bg-[#111]">USE THE KERNEL TERMINAL TO INITIATE A TARGET LOCK</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .text-shadow-glow { text-shadow: 0 0 10px rgba(0, 255, 204, 0.3); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
        
        .crt-overlay::before {
          content: " ";
          display: block;
          position: fixed;
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
