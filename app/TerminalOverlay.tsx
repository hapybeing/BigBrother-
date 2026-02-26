"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, X, ChevronRight, AlertTriangle } from 'lucide-react';

export default function TerminalOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ type: 'cmd' | 'out' | 'err' | 'sys' | 'warn', text: string }[]>([
    { type: 'sys', text: 'OVERWATCH KERNEL v1.4 ONLINE.' },
    { type: 'sys', text: 'SUBDOMAIN ENUMERATION UPLINK: ACTIVE.' },
    { type: 'sys', text: 'TYPE "help" FOR PROTOCOLS.' }
  ]);
  
  const endOfTerminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isOpen]);

  const processCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    const rawArgs = cmd.trim().split(/\s+/);
    let baseCmd = rawArgs[0].toLowerCase();
    let targetArg = rawArgs[1];

    if (baseCmd === 'who' && rawArgs[1]?.toLowerCase() === 'is') {
      baseCmd = 'whois';
      targetArg = rawArgs[2];
    }

    setHistory(prev => [...prev, { type: 'cmd', text: `> ${cmd}` }]);

    try {
      switch (baseCmd) {
        case 'help':
          setHistory(prev => [...prev, 
            { type: 'out', text: 'AVAILABLE PROTOCOLS:' },
            { type: 'out', text: '  subs [domain]            - [NEW] Enumerate hidden subdomains & internal IPs' },
            { type: 'out', text: '  scan [target]            - Auto-resolve & trace (Accepts IP or Domain)' },
            { type: 'out', text: '  intel [ip]               - Interrogate open ports & active CVE vulnerabilities' },
            { type: 'out', text: '  whois [ip] / who is [ip] - Instant OSINT geolocation trace' },
            { type: 'out', text: '  ping [domain]            - Resolve domain to IPv4' },
            { type: 'out', text: '  price [pair]             - Live asset telemetry (e.g. price BTCUSDT)' },
            { type: 'out', text: '  clear                    - Wipe terminal history' },
            { type: 'out', text: '  exit                     - Close Overwatch Kernel' }
          ]);
          break;

        case 'clear':
          setHistory([]);
          break;

        case 'exit':
          setIsOpen(false);
          break;

        // THE NEW SUBDOMAIN ENUMERATION ENGINE
        case 'subs':
          if (!targetArg) throw new Error("REQUIRES DOMAIN (e.g., subs tesla.com)");
          setHistory(prev => [...prev, { type: 'sys', text: `INITIATING SUBDOMAIN ENUMERATION FOR [${targetArg.toUpperCase()}]...` }]);
          
          try {
            const subRes = await fetch(`https://api.hackertarget.com/hostsearch/?q=${targetArg}`);
            if (!subRes.ok) throw new Error("API REJECTED REQUEST. RATE LIMIT EXCEEDED.");
            
            const subText = await subRes.text();
            if (subText.includes('error')) throw new Error("NO RECORDS FOUND OR API BLOCKED.");
            
            const lines = subText.split('\n').filter(l => l.trim() !== '');
            setHistory(prev => [...prev, { type: 'out', text: `[+] DISCOVERED ${lines.length} SUBDOMAINS/HOSTS:` }]);
            
            // Limit output to prevent terminal crashing from massive domains
            const displayLines = lines.slice(0, 15);
            displayLines.forEach(line => {
              const [host, ip] = line.split(',');
              setHistory(prev => [...prev, { type: 'out', text: `    ${host} -> ${ip}` }]);
            });
            
            if (lines.length > 15) {
              setHistory(prev => [...prev, { type: 'warn', text: `    ...AND ${lines.length - 15} MORE HIDDEN HOSTS. LIMITING OUTPUT.` }]);
            }
          } catch (e: any) {
             setHistory(prev => [...prev, { type: 'err', text: `[!] ENUMERATION FAILED: ${e.message}` }]);
          }
          break;

        case 'intel':
          if (!targetArg || !/^(\d{1,3}\.){3}\d{1,3}$/.test(targetArg)) {
            throw new Error("REQUIRES VALID IPv4 ADDRESS (e.g., intel 8.8.8.8)");
          }
          setHistory(prev => [...prev, { type: 'sys', text: `INTERROGATING SHODAN INTERNET_DB FOR [${targetArg}]...` }]);
          
          try {
            const shodanRes = await fetch(`https://internetdb.shodan.io/${targetArg}`);
            if (!shodanRes.ok) {
              if (shodanRes.status === 404) throw new Error("TARGET NOT INDEXED IN SHODAN DATABASE. NO OPEN PORTS DETECTED.");
              throw new Error("SHODAN API CONNECTION FAILED.");
            }
            const shodanData = await shodanRes.json();
            
            setHistory(prev => [...prev, 
              { type: 'out', text: `[HOSTNAMES]: ${shodanData.hostnames?.length > 0 ? shodanData.hostnames.join(', ') : 'NONE IDENTIFIED'}` },
              { type: 'out', text: `[OPEN PORTS]: ${shodanData.ports?.length > 0 ? shodanData.ports.join(', ') : 'NONE OPEN'}` },
              { type: 'out', text: `[CPE / TECH STACK]: ${shodanData.cpes?.length > 0 ? shodanData.cpes.slice(0, 5).join(', ') : 'UNKNOWN'}` }
            ]);

            if (shodanData.vulns && shodanData.vulns.length > 0) {
              setHistory(prev => [...prev, { type: 'warn', text: `[!] CRITICAL: ${shodanData.vulns.length} VULNERABILITIES (CVEs) DETECTED:` }]);
              setHistory(prev => [...prev, { type: 'err', text: `    ${shodanData.vulns.slice(0, 5).join(', ')}${shodanData.vulns.length > 5 ? ' ...AND MORE' : ''}` }]);
            } else {
              setHistory(prev => [...prev, { type: 'out', text: `[VULNERABILITIES]: NO KNOWN EXPLOITS DETECTED.` }]);
            }

          } catch (e: any) {
             setHistory(prev => [...prev, { type: 'err', text: `[!] ${e.message}` }]);
          }
          break;

        case 'whois':
          if (!targetArg) throw new Error("REQUIRES TARGET (e.g., who is 8.8.8.8)");
          setHistory(prev => [...prev, { type: 'sys', text: `TRACING ${targetArg}...` }]);
          
          const whoRes = await fetch(`https://get.geojs.io/v1/ip/geo/${targetArg}.json`);
          if (!whoRes.ok) throw new Error("INVALID TARGET OR TRACE FAILED. CHECK IP FORMAT.");
          const whoData = await whoRes.json();
          
          setHistory(prev => [...prev, 
            { type: 'out', text: `[ISP]: ${whoData.organization_name || whoData.organization || 'UNKNOWN'}` },
            { type: 'out', text: `[GEO]: ${whoData.city || 'UNKNOWN'}, ${whoData.country_code || 'UNKNOWN'}` },
            { type: 'out', text: `[LAT/LON]: ${whoData.latitude}, ${whoData.longitude}` }
          ]);
          break;

        case 'ping':
          if (!targetArg) throw new Error("REQUIRES DOMAIN (e.g., ping fbi.gov)");
          setHistory(prev => [...prev, { type: 'sys', text: `RESOLVING ${targetArg}...` }]);
          const dnsRes = await fetch(`https://dns.google/resolve?name=${targetArg}&type=A`);
          const dnsData = await dnsRes.json();
          if (!dnsData.Answer) throw new Error("NO IPv4 RECORD FOUND.");
          dnsData.Answer.forEach((ans: any) => {
            if(ans.type === 1) setHistory(prev => [...prev, { type: 'out', text: `[IPv4]: ${ans.data}` }]);
          });
          break;

        case 'scan':
          if (!targetArg) throw new Error("REQUIRES TARGET (e.g., scan fbi.gov OR scan 8.8.8.8)");
          setHistory(prev => [...prev, { type: 'sys', text: `INITIATING AUTOMATED RECON MACRO ON [${targetArg.toUpperCase()}]...` }]);

          const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(targetArg);
          let ipsToScan: string[] = [];

          if (isIpAddress) {
            setHistory(prev => [...prev, { type: 'out', text: `[+] DIRECT IP DETECTED. BYPASSING DNS RESOLUTION...` }]);
            ipsToScan = [targetArg];
          } else {
            setHistory(prev => [...prev, { type: 'out', text: `[+] DOMAIN DETECTED. QUERYING DNS RECORDS...` }]);
            const scanDnsRes = await fetch(`https://dns.google/resolve?name=${targetArg}&type=A`);
            const scanDnsData = await scanDnsRes.json();
            if (!scanDnsData.Answer) throw new Error("TARGET UNREACHABLE. NO IPv4 RECORDS FOUND.");

            ipsToScan = scanDnsData.Answer.filter((a: any) => a.type === 1).map((a: any) => a.data);
            setHistory(prev => [...prev, { type: 'out', text: `[+] RESOLVED ${ipsToScan.length} EXPOSED HOST(S). COMMENCING DEEP TRACE...` }]);
          }

          for (let i = 0; i < ipsToScan.length; i++) {
            const ip = ipsToScan[i];
            setHistory(prev => [...prev, { type: 'sys', text: `\n--> TRACING HOST ${i + 1}/${ipsToScan.length}: [${ip}]` }]);
            
            try {
              const scanWhoRes = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
              if (scanWhoRes.ok) {
                const scanWhoData = await scanWhoRes.json();
                setHistory(prev => [...prev,
                  { type: 'out', text: `    ISP : ${scanWhoData.organization_name || scanWhoData.organization || 'UNKNOWN'}` },
                  { type: 'out', text: `    GEO : ${scanWhoData.city || 'UNKNOWN'}, ${scanWhoData.country_code || 'UNKNOWN'}` }
                ]);
              } else {
                setHistory(prev => [...prev, { type: 'err', text: `    [!] TRACE FAILED FOR ${ip}` }]);
              }
            } catch (e) {
              setHistory(prev => [...prev, { type: 'err', text: `    [!] TRACE ERROR FOR ${ip}` }]);
            }
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          setHistory(prev => [...prev, { type: 'sys', text: `\n[=== MACRO COMPLETE. TARGET PROFILED ===]` }]);
          break;

        case 'price':
          const pair = targetArg ? targetArg.toUpperCase() : 'BTCUSDT';
          setHistory(prev => [...prev, { type: 'sys', text: `FETCHING MARKET DATA FOR ${pair}...` }]);
          const pxRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
          if (!pxRes.ok) throw new Error("INVALID ASSET PAIR.");
          const pxData = await pxRes.json();
          setHistory(prev => [...prev, { type: 'out', text: `[${pair}]: $${parseFloat(pxData.price).toFixed(2)}` }]);
          break;

        default:
          throw new Error(`COMMAND NOT RECOGNIZED: ${baseCmd}`);
      }
    } catch (err: any) {
      setHistory(prev => [...prev, { type: 'err', text: `[ERROR] ${err.message}` }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processCommand(input);
      setInput('');
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-[#00ffcc]/10 border border-[#00ffcc]/50 text-[#00ffcc] p-3 rounded-full shadow-[0_0_15px_rgba(0,255,204,0.3)] hover:bg-[#00ffcc] hover:text-black transition-all backdrop-blur-md"
      >
        <TerminalIcon size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed bottom-0 left-0 w-full h-[55vh] bg-[#050505]/95 backdrop-blur-xl border-t border-[#333] z-40 flex flex-col font-mono shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
          >
            <div className="flex justify-between items-center bg-[#111] border-b border-[#222] px-4 py-2">
              <div className="flex items-center gap-2 text-[#00ffcc] text-[10px] tracking-widest font-bold">
                <TerminalIcon size={12} /> OVERWATCH KERNEL v1.4
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-[#ff3366] transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 text-xs space-y-1">
              {history.map((line, i) => (
                <div key={i} className={`
                  ${line.type === 'cmd' ? 'text-white font-bold mt-2' : ''}
                  ${line.type === 'out' ? 'text-gray-400 pl-4' : ''}
                  ${line.type === 'sys' ? 'text-[#00ffcc]' : ''}
                  ${line.type === 'warn' ? 'text-[#ffaa00] font-bold' : ''}
                  ${line.type === 'err' ? 'text-[#ff3366]' : ''}
                  whitespace-pre-wrap
                `}>
                  {line.type === 'warn' && <AlertTriangle size={12} className="inline mr-1 mb-0.5" />}
                  {line.text}
                </div>
              ))}
              <div ref={endOfTerminalRef} />
            </div>

            <div className="border-t border-[#222] p-2 bg-black flex items-center gap-2">
              <ChevronRight size={16} className="text-[#00ffcc]" />
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="AWAITING COMMAND..."
                className="w-full bg-transparent border-none outline-none text-[#00ffcc] text-xs tracking-wider placeholder-gray-700"
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
