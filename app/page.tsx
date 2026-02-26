"use client";
import { useState, useEffect } from 'react';
import { Activity, Globe, Cpu, Terminal, Crosshair, Radar as RadarIcon, Target, Share2, AlertTriangle } from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup, Line } from "react-simple-maps";
import { ResponsiveContainer, AreaChart, Area, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, YAxis } from 'recharts';
import Link from 'next/link';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export default function Dashboard() {
  const [btcHistory, setBtcHistory] = useState<any[]>([]);
  const [currentBtc, setCurrentBtc] = useState(0);
  const [quakes, setQuakes] = useState<any[]>([]);
  const [cveLogs, setCveLogs] = useState<any[]>([]);
  const [sysTime, setSysTime] = useState('');
  
  // MAP STATE
  const [activeTarget, setActiveTarget] = useState<any>(null); 
  const [osintTarget, setOsintTarget] = useState<any>(null); 
  const [mapPosition, setMapPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
  
  // CYBER WARFARE SIMULATION STATE
  const [attackStreams, setAttackStreams] = useState<any[]>([]);

  const [threatMatrix, setThreatMatrix] = useState([
    { subject: 'DDoS', A: 120, fullMark: 150 },
    { subject: 'Malware', A: 98, fullMark: 150 },
    { subject: 'Phishing', A: 86, fullMark: 150 },
    { subject: 'Zero-Day', A: 99, fullMark: 150 },
    { subject: 'Intrusion', A: 85, fullMark: 150 },
    { subject: 'Exfil', A: 65, fullMark: 150 },
  ]);

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

        const quakeRes = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
        const quakeData = await quakeRes.json();
        setQuakes(quakeData.features.slice(0, 20));

        const cveRes = await fetch('https://api.github.com/search/repositories?q=CVE-2025+OR+CVE-2026&sort=updated&order=desc&per_page=15');
        const cveData = await cveRes.json();
        if (cveData.items) setCveLogs(cveData.items);
      } catch (e) {
        console.error("Telemetry failure", e);
      }
    };

    fetchHeavyTelemetry();
    const macroInterval = setInterval(fetchHeavyTelemetry, 15000); 

    const microInterval = setInterval(() => {
      setSysTime(new Date().toISOString());
      setThreatMatrix(prev => prev.map(t => ({ ...t, A: Math.max(40, Math.min(140, t.A + (Math.random() * 10 - 5))) })));
    }, 1000);

    const streamInterval = setInterval(() => {
      const newStream = {
        id: Math.random().toString(36),
        from: [(Math.random() - 0.5) * 360, (Math.random() - 0.5) * 180] as [number, number],
        to: [(Math.random() - 0.5) * 360, (Math.random() - 0.5) * 180] as [number, number],
        color: Math.random() > 0.7 ? '#ff3366' : '#9933ff'
      };
      setAttackStreams(prev => [...prev.slice(-12), newStream]);
    }, 800);

    return () => {
      clearInterval(macroInterval);
      clearInterval(microInterval);
      clearInterval(streamInterval);
    };
  }, []);

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
              coordinates: [lon, lat]
            });
            
            setMapPosition({ coordinates: [lon, lat], zoom: 3.5 });
            setActiveTarget(null); 
          }
        } catch (err) { console.error(err); }
      }
    };

    window.addEventListener('OVERWATCH_CMD_EXEC', handleTerminalCommand);
    return () => window.removeEventListener('OVERWATCH_CMD_EXEC', handleTerminalCommand);
  }, []);

  return (
    <div className="h-screen w-screen p-2 md:p-4 flex flex-col gap-3 bg-[#020202] text-[#e5e5e5] font-mono overflow-hidden box-border select-none">
      
      <header className="flex-none flex justify-between items-end border-b border-[#333] pb-2 z-10 bg-[#020202]">
        <div className="flex items-center gap-3">
          <Globe className="text-[#00ffcc] animate-pulse" size={24} />
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
            {/* ABSOLUTE SCROLL FIX */}
            <div className="relative flex-grow min-h-0 w-full">
              <div className="absolute inset-0 overflow-y-auto pr-2 custom-scrollbar pb-6">
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

        {/* CENTER COLUMN: THE KINETIC MAP */}
        <div className="col-span-4 lg:col-span-6 border border-[#222] bg-[#030303] relative flex flex-col h-full min-h-0 overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
          <div className="absolute top-3 left-3 flex items-center gap-2 z-10 bg-black/80 p-1.5 border border-[#333] backdrop-blur-sm">
            <Crosshair size={14} className={osintTarget ? "text-[#00ffcc] animate-pulse" : "text-[#555]"} />
            <span className={`text-[10px] uppercase tracking-widest ${osintTarget ? "text-[#00ffcc]" : "text-[#555]"}`}>
              {osintTarget ? `SAT_LOCK: ${osintTarget.ip}` : 'KINETIC TOPOGRAPHY // ACTIVE SCAN'}
            </span>
          </div>
          
          <div className="flex-grow flex items-center justify-center w-full h-full relative mt-4">
            <ComposableMap projectionConfig={{ scale: 140 }} className="w-full h-full absolute inset-0 m-auto cursor-crosshair bg-transparent">
              <ZoomableGroup 
                zoom={mapPosition.zoom} 
                center={mapPosition.coordinates} 
                onMoveEnd={({ coordinates, zoom }) => setMapPosition({ coordinates: coordinates as [number, number], zoom })}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#1c1c1c" /* BRIGHTENED MAP FILL */
                        stroke="#3a3a3a" /* BRIGHTENED MAP BORDERS */
                        strokeWidth={0.5 / mapPosition.zoom}
                        style={{ default: { outline: "none" }, hover: { fill: "#252525", outline: "none" }, pressed: { outline: "none" } }}
                      />
                    ))
                  }
                </Geographies>
                
                {/* CYBER WARFARE DATA STREAMS */}
                {attackStreams.map((stream) => (
                  <Line
                    key={stream.id}
                    from={stream.from}
                    to={stream.to}
                    stroke={stream.color}
                    strokeWidth={1.5 / mapPosition.zoom} /* THICKER STREAMS */
                    strokeLinecap="round"
                    className="opacity-70 animate-[dash_2s_linear_infinite]"
                    strokeDasharray="4 8"
                  />
                ))}

                {/* PASSIVE QUAKE MARKERS */}
                {quakes.map((q, i) => (
                  <Marker key={`quake-${i}`} coordinates={[q.geometry.coordinates[0], q.geometry.coordinates[1]]} onClick={() => { setActiveTarget(q); setOsintTarget(null); }}>
                    <circle r={(q.properties.mag > 4.5 ? 4 : 2) / mapPosition.zoom} fill={q.properties.mag > 4.5 ? "#ff3366" : "#00ffcc"} className="cursor-pointer transition-all opacity-60" />
                  </Marker>
                ))}

                {/* ACTIVE TERMINAL OSINT TARGET */}
                {osintTarget && (
                  <>
                    <Line
                      from={[0, 0]}
                      to={osintTarget.coordinates}
                      stroke="#00ffcc"
                      strokeWidth={2 / mapPosition.zoom}
                      strokeLinecap="round"
                      className="opacity-90 animate-[dash_1s_linear_infinite]"
                      strokeDasharray="5 5"
                    />
                    <Marker coordinates={osintTarget.coordinates}>
                      <g className="animate-spin-slow">
                        <circle r={20 / mapPosition.zoom} fill="rgba(0,255,204,0.15)" stroke="#00ffcc" strokeWidth={1.5 / mapPosition.zoom} strokeDasharray="2 4" />
                        <line x1={-25 / mapPosition.zoom} y1="0" x2={-15 / mapPosition.zoom} y2="0" stroke="#00ffcc" strokeWidth={1.5 / mapPosition.zoom} />
                        <line x1={15 / mapPosition.zoom} y1="0" x2={25 / mapPosition.zoom} y2="0" stroke="#00ffcc" strokeWidth={1.5 / mapPosition.zoom} />
                        <line x1="0" y1={-25 / mapPosition.zoom} x2="0" y2={-15 / mapPosition.zoom} stroke="#00ffcc" strokeWidth={1.5 / mapPosition.zoom} />
                        <line x1="0" y1={15 / mapPosition.zoom} x2="0" y2={25 / mapPosition.zoom} stroke="#00ffcc" strokeWidth={1.5 / mapPosition.zoom} />
                      </g>
                      <circle r={4 / mapPosition.zoom} fill="#fff" className="animate-pulse shadow-[0_0_10px_#00ffcc]" />
                    </Marker>
                  </>
                )}
              </ZoomableGroup>
            </ComposableMap>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,255,204,0.03)] to-transparent h-8 w-full animate-[scan_4s_linear_infinite] pointer-events-none border-b border-[#00ffcc]/10"></div>
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
             <div className={`absolute top-0 left-0 w-full h-0.5 ${osintTarget ? 'bg-[#00ffcc]' : activeTarget ? 'bg-[#ff3366]' : 'bg-gray-600'}`}></div>
             <h2 className={`text-[10px] font-bold uppercase mb-4 flex items-center gap-2 flex-none ${osintTarget ? 'text-[#00ffcc]' : activeTarget ? 'text-[#ff3366]' : 'text-[#555]'}`}>
              {osintTarget || activeTarget ? <Target size={12} className="animate-pulse" /> : <Cpu size={12} />} 
              {osintTarget ? 'OSINT_TARGET_LOCKED' : activeTarget ? 'SEISMIC_EVENT_LOCKED' : 'SYSTEM_DIAGNOSTICS'}
            </h2>
            
            {/* ABSOLUTE SCROLL FIX FOR TELEMETRY */}
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
                      <div className="flex justify-between text-[9px] border-b border-[#111] pb-1"><span className="text-[#555]">LATITUDE:</span><span className="text-white font-mono">{osintTarget.coordinates[1].toFixed(5)}</span></div>
                      <div className="flex justify-between text-[9px] border-b border-[#111] pb-1"><span className="text-[#555]">LONGITUDE:</span><span className="text-white font-mono">{osintTarget.coordinates[0].toFixed(5)}</span></div>
                      <div className="flex justify-between text-[9px] pt-1"><span className="text-[#555]">STATUS:</span><span className="text-[#00ffcc] animate-pulse">ACTIVE TRACKING</span></div>
                    </div>
                  </div>
                ) : activeTarget ? (
                  <div className="space-y-3">
                    <div className="text-white text-xs font-bold border-b border-[#222] pb-2 leading-tight">
                      {activeTarget.properties.place.toUpperCase()}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] tracking-wider text-gray-400 mt-2">
                      <div className="flex flex-col"><span className="text-[#555]">MAGNITUDE</span><span className={`text-lg font-bold ${activeTarget.properties.mag > 4.5 ? 'text-[#ff3366]' : 'text-[#00ffcc]'}`}>{activeTarget.properties.mag.toFixed(1)}</span></div>
                      <div className="flex flex-col"><span className="text-[#555]">DEPTH</span><span className="text-white text-lg">{activeTarget.geometry.coordinates[2].toFixed(1)} <span className="text-[8px]">KM</span></span></div>
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
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(800px); }
        }
        @keyframes spin-slow {
          100% { transform: rotate(360deg); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        .animate-spin-slow {
          transform-origin: center;
          animation: spin-slow 8s linear infinite;
        }
        .text-shadow-glow { text-shadow: 0 0 10px rgba(0, 255, 204, 0.3); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}} />
    </div>
  );
}
