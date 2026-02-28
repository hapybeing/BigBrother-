"use client";
import { useState, useEffect, useRef } from 'react';
import { Activity, Globe as GlobeIcon, Cpu, Terminal, Crosshair, Radar as RadarIcon, Target, Share2, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, YAxis } from 'recharts';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

// GEOPOLITICAL TARGET CAPITALS & DATACENTERS
const THREAT_NODES = [
  { name: 'Washington DC, USA', lat: 38.8951, lng: -77.0364 },
  { name: 'Silicon Valley, USA', lat: 37.3875, lng: -122.0575 },
  { name: 'Beijing, China', lat: 39.9042, lng: 116.4074 },
  { name: 'Shenzhen, China', lat: 22.5431, lng: 114.0579 },
  { name: 'Moscow, Russia', lat: 55.7558, lng: 37.6173 },
  { name: 'St. Petersburg, Russia', lat: 59.9311, lng: 30.3609 },
  { name: 'Tehran, Iran', lat: 35.6892, lng: 51.3890 },
  { name: 'Pyongyang, North Korea', lat: 39.0392, lng: 125.7625 },
  { name: 'Frankfurt, Germany', lat: 50.1109, lng: 8.6821 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Sao Paulo, Brazil', lat: -23.5505, lng: -46.6333 },
  { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
  { name: 'Tel Aviv, Israel', lat: 32.0853, lng: 34.7818 }
];

export default function Dashboard() {
  const [btcHistory, setBtcHistory] = useState<any[]>([]);
  const [currentBtc, setCurrentBtc] = useState(0);
  const [cveLogs, setCveLogs] = useState<any[]>([]);
  const [sysTime, setSysTime] = useState('');
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
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
    { subject: 'Intrusion', A: 85, fullMark: 150 },
    { subject: 'Exfil', A: 65, fullMark: 150 },
  ]);

  useEffect(() => {
    if (globeContainerRef.current) {
      setDimensions({ width: globeContainerRef.current.clientWidth, height: globeContainerRef.current.clientHeight || 500 });
    }
    const handleResize = () => {
      if (globeContainerRef.current) {
        setDimensions({ width: globeContainerRef.current.clientWidth, height: globeContainerRef.current.clientHeight || 500 });
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

    // =========================================================
    // THE STOCHASTIC THREAT ENGINE (REALISTIC GEO-TARGETING)
    // =========================================================
    const arcInterval = setInterval(() => {
      // Pick random source and destination from known global hubs
      const src = THREAT_NODES[Math.floor(Math.random() * THREAT_NODES.length)];
      let dst = THREAT_NODES[Math.floor(Math.random() * THREAT_NODES.length)];
      while (src.name === dst.name) {
        dst = THREAT_NODES[Math.floor(Math.random() * THREAT_NODES.length)];
      }

      // Add a tiny bit of jitter so attacks hit different datacenters within the country
      const jitter = () => (Math.random() * 4) - 2; 

      const newArc = {
        id: Math.random().toString(36),
        startLat: src.lat + jitter(),
        startLng: src.lng + jitter(),
        endLat: dst.lat + jitter(),
        endLng: dst.lng + jitter(),
        // Red/Orange for heavy DDoS, Cyan/Purple for exfiltration probes
        color: Math.random() > 0.4 ? ['#ff3366', '#ffaa00'] : ['#00ffcc', '#9933ff'] 
      };
      
      setArcsData(prev => [...prev.slice(-25), newArc]); // Increased density to 25 simultaneous arcs
    }, 400); // Firing much faster for kinetic effect

    return () => {
      clearInterval(macroInterval);
      clearInterval(microInterval);
      clearInterval(arcInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleTerminalCommand = async (e: any) => {
      const { command, target } = e.detail;
      if ((command === 'whois' || command === 'intel' || command === 'dossier') && target) {
        
        // Handle direct IP resolution bypassing
        let targetIp = target;
        const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(target);
        
        if (!isIp) {
          try {
            const dnsRes = await fetch(`https://dns.google/resolve?name=${target}&type=A`);
            const dnsData = await dnsRes.json();
            if (dnsData.Answer) {
              targetIp = dnsData.Answer.filter((a: any) => a.type === 1)[0]?.data || target;
            }
          } catch(e) {}
        }

        try {
          const res = await fetch(`https://get.geojs.io/v1/ip/geo/${targetIp}.json`);
          if (res.ok) {
            const data = await res.json();
            const lon = parseFloat(data.longitude);
            const lat = parseFloat(data.latitude);
            
            setOsintTarget({
              ip: targetIp,
              domain: !isIp ? target : null,
              isp: data.organization_name || data.organization || 'UNKNOWN',
              city: data.city || 'UNKNOWN',
              country: data.country_code || 'UNKNOWN',
              lat: lat,
              lng: lon
            });
            
            // Render the glowing target spike
            setPointsData([{ lat, lng: lon, size: 2.0, color: '#ffaa00' }]);
            
            // Snap camera to target
            if (globeRef.current) {
              globeRef.current.pointOfView({ lat, lng: lon, altitude: 1.2 }, 1500);
            }
          }
        } catch (err) { console.error(err); }
      }
    };

    window.addEventListener('OVERWATCH_CMD_EXEC', handleTerminalCommand);
    return () => window.removeEventListener('OVERWATCH_CMD_EXEC', handleTerminalCommand);
  }, []);

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.8;
      globeRef.current.controls().enableZoom = false; 
    }
  }, [dimensions]);

  return (
    <div className="min-h-screen w-full p-4 flex flex-col gap-6 bg-[#020202] text-[#e5e5e5] font-mono box-border select-none crt-overlay">
      
      <header className="flex-none flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#333] pb-4 z-10 bg-[#020202] gap-4">
        <div className="flex items-center gap-3">
          <GlobeIcon className="text-[#00ffcc] animate-pulse" size={28} />
          <div>
            <h1 className="text-xl md:text-3xl font-bold tracking-widest text-white uppercase text-shadow-glow flex items-center gap-3">
              OASIS // OMNI-NODE
            </h1>
            <div className="text-[10px] text-gray-500 tracking-[0.4em] uppercase mt-1">Distributed Intelligence Fusion Matrix</div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Link href="/recon" className="flex items-center justify-center gap-2 bg-[#ffaa00]/10 border border-[#ffaa00]/50 text-[#ffaa00] px-4 py-2 text-[10px] tracking-widest uppercase hover:bg-[#ffaa00] hover:text-black transition-all rounded-sm shadow-[0_0_10px_rgba(255,170,0,0.2)] flex-grow md:flex-grow-0">
            <Terminal size={14} /> Recon Node
          </Link>
          <Link href="/nexus" className="flex items-center justify-center gap-2 bg-[#9933ff]/10 border border-[#9933ff]/50 text-[#9933ff] px-4 py-2 text-[10px] tracking-widest uppercase hover:bg-[#9933ff] hover:text-white transition-all rounded-sm shadow-[0_0_10px_rgba(153,51,255,0.2)] flex-grow md:flex-grow-0">
            <Share2 size={14} /> Nexus Graph
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow z-0">
        
        {/* LEFT FLANK */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
          <div className="border border-[#222] bg-[#050505] p-4 relative flex flex-col min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#ff3366]"></div>
            <h2 className="text-[#555] text-[12px] font-bold uppercase mb-4 flex items-center gap-2">
              <RadarIcon size={14} className="text-[#ff3366]" /> Global Threat Matrix
            </h2>
            <div className="flex-grow w-full h-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={threatMatrix}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                  <Radar name="Threat Level" dataKey="A" stroke="#ff3366" fill="#ff3366" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border border-[#222] bg-[#050505] p-4 relative flex flex-col h-[400px]">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#ffaa00]"></div>
            <h2 className="text-[#555] text-[12px] font-bold uppercase mb-4 flex items-center gap-2 flex-none">
              <Terminal size={14} className="text-[#ffaa00]" /> LIVE_CVE_INTERCEPT
            </h2>
            <div className="overflow-y-auto custom-scrollbar pr-2 flex-grow">
              {cveLogs.map((repo, i) => (
                <div key={i} className="mb-4 border-b border-[#111] pb-3 last:border-0">
                  <div className="text-[#ffaa00] text-[11px] font-bold break-all">[{repo.name.toUpperCase()}]</div>
                  <div className="text-gray-400 text-[10px] mt-2 leading-tight tracking-tight">
                    {repo.description ? repo.description : 'NO_PAYLOAD_DESCRIPTION_PROVIDED'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: UPGRADED 3D WEBGL GLOBE */}
        <div className="col-span-1 lg:col-span-6 border border-[#222] bg-[#020202] relative flex flex-col min-h-[500px] lg:min-h-[700px] shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] rounded-sm" ref={globeContainerRef}>
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10 bg-black/80 p-2 border border-[#333] backdrop-blur-sm">
            <Crosshair size={16} className={osintTarget ? "text-[#ffaa00] animate-pulse" : "text-[#555]"} />
            <span className={`text-xs uppercase tracking-widest font-bold ${osintTarget ? "text-[#ffaa00]" : "text-[#555]"}`}>
              {osintTarget ? `SAT_LOCK: ${osintTarget.domain || osintTarget.ip}` : 'STOCHASTIC THREAT SIMULATOR // ACTIVE SCAN'}
            </span>
          </div>
          
          <div className="flex-grow flex items-center justify-center w-full h-full relative cursor-crosshair">
            {dimensions.width > 0 && (
              <Globe
                ref={globeRef}
                width={dimensions.width}
                height={dimensions.height}
                // High-fidelity topographical earth maps
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                arcsData={arcsData}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashInitialGap={() => Math.random()}
                arcDashAnimateTime={1200}
                arcStroke={0.8}
                pointsData={pointsData}
                pointColor="color"
                pointAltitude={0.15}
                pointRadius="size"
                pointsMerge={false}
                atmosphereColor="#00ffcc"
                atmosphereAltitude={0.15}
              />
            )}
          </div>
        </div>

        {/* RIGHT FLANK */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
          <div className="border border-[#222] bg-[#050505] p-4 relative flex flex-col min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#00ffcc]"></div>
            <h2 className="text-[#555] text-[12px] font-bold uppercase mb-4 flex justify-between items-center">
              <span className="flex items-center gap-2"><Activity size={14} className="text-[#00ffcc]" /> FININT: BTC</span>
              <span className="text-white text-base font-light">${currentBtc.toFixed(2)}</span>
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

          <div className="border border-[#222] bg-[#050505] p-4 relative flex flex-col min-h-[400px]">
             <div className={`absolute top-0 left-0 w-full h-0.5 ${osintTarget ? 'bg-[#ffaa00]' : 'bg-gray-600'}`}></div>
             <h2 className={`text-[12px] font-bold uppercase mb-6 flex items-center gap-2 flex-none ${osintTarget ? 'text-[#ffaa00]' : 'text-[#555]'}`}>
              {osintTarget ? <Target size={14} className="animate-pulse" /> : <Cpu size={14} />} 
              {osintTarget ? 'OSINT_TARGET_LOCKED' : 'SYSTEM_DIAGNOSTICS'}
            </h2>
            
            <div className="flex-grow">
              {osintTarget ? (
                <div className="space-y-6">
                  <div className="text-[#ffaa00] text-xl font-bold border-b border-[#333] pb-3 break-all">
                    {osintTarget.ip}
                  </div>
                  
                  {osintTarget.domain && (
                    <div className="text-gray-400 text-xs uppercase tracking-widest border border-[#222] p-2 bg-[#111] break-all">
                      DOMAIN: {osintTarget.domain}
                    </div>
                  )}

                  <div className="bg-[#111] p-3 border border-[#222]">
                    <div className="text-[#555] text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={12}/> Network Topology</div>
                    <div className="text-gray-300 text-sm truncate" title={osintTarget.isp}>{osintTarget.isp}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[10px] tracking-wider text-gray-400">
                    <div className="flex flex-col bg-[#111] p-3 border border-[#222]"><span className="text-[#555] mb-1">CITY</span><span className="text-white text-sm truncate">{osintTarget.city}</span></div>
                    <div className="flex flex-col bg-[#111] p-3 border border-[#222]"><span className="text-[#555] mb-1">COUNTRY</span><span className="text-white text-sm">{osintTarget.country}</span></div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-[#222]">
                    <div className="flex justify-between text-[11px]"><span className="text-[#555]">LATITUDE:</span><span className="text-white font-mono">{osintTarget.lat.toFixed(5)}</span></div>
                    <div className="flex justify-between text-[11px]"><span className="text-[#555]">LONGITUDE:</span><span className="text-white font-mono">{osintTarget.lng.toFixed(5)}</span></div>
                    <div className="flex justify-between text-[11px] pt-2"><span className="text-[#555]">STATUS:</span><span className="text-[#ffaa00] font-bold animate-pulse">ACTIVE TRACKING</span></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 flex flex-col justify-center mt-8">
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-2"><span>MEMORY_HEAP</span><span>84%</span></div>
                    <div className="w-full bg-[#111] h-1.5 rounded-none"><div className="bg-[#ffaa00] h-full w-[84%]"></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-2"><span>SENSOR_ARRAY</span><span>AWAITING KERNEL INPUT</span></div>
                    <div className="w-full bg-[#111] h-1.5 rounded-none"><div className="bg-gray-700 h-full w-[100%]"></div></div>
                  </div>
                  <div className="text-[10px] text-center text-gray-600 mt-8 animate-pulse border border-[#222] p-4 bg-[#111]">USE THE KERNEL TERMINAL TO INITIATE A TARGET LOCK</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .text-shadow-glow { text-shadow: 0 0 10px rgba(0, 255, 204, 0.3); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
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
