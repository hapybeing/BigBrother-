"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, X, ChevronRight, AlertTriangle } from 'lucide-react';

export default function TerminalOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ type: 'cmd' | 'out' | 'err' | 'sys' | 'warn', text: string }[]>([
    { type: 'sys', text: 'OVERWATCH KERNEL v3.0 ONLINE.' },
    { type: 'sys', text: 'AUTOMATED DOSSIER COMPILER: ACTIVE.' },
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

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('OVERWATCH_CMD_EXEC', { 
        detail: { command: baseCmd, target: targetArg } 
      }));
    }

    try {
      switch (baseCmd) {
        case 'help':
          setHistory(prev => [...prev, 
            { type: 'out', text: 'AVAILABLE PROTOCOLS:' },
            { type: 'out', text: '  dossier [target]         - [MACRO] Compile all OSINT vectors into downloadable report' },
            { type: 'out', text: '  breach [email]           - Cross-reference email against dark-web leaks' },
            { type: 'out', text: '  ledger [btc_address]     - Interrogate Bitcoin wallet balances & tx logs' },
            { type: 'out', text: '  subs [domain]            - Enumerate hidden subdomains & internal IPs' },
            { type: 'out', text: '  scan [target]            - Auto-resolve & trace hosts (Accepts IP or Domain)' },
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

        // ==========================================
        // THE AUTOMATED DOSSIER GENERATOR
        // ==========================================
        case 'dossier':
          if (!targetArg) throw new Error("REQUIRES TARGET (e.g., dossier tesla.com)");
          setHistory(prev => [...prev, { type: 'sys', text: `INITIATING MASTER DOSSIER COMPILATION FOR [${targetArg.toUpperCase()}]...` }]);

          let dossierContent = `========================================\n`;
          dossierContent += `       OASIS THREAT INTELLIGENCE DOSSIER\n`;
          dossierContent += `       TARGET: ${targetArg.toUpperCase()}\n`;
          dossierContent += `       TIMESTAMP: ${new Date().toISOString()}\n`;
          dossierContent += `========================================\n\n`;

          const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(targetArg);
          let primaryIp = targetArg;

          // STEP 1: DNS RESOLUTION
          if (!isIp) {
            setHistory(prev => [...prev, { type: 'out', text: `[*] RESOLVING DNS TOPOLOGY...` }]);
            try {
              const dnsRes = await fetch(`https://dns.google/resolve?name=${targetArg}&type=A`);
              const dnsData = await dnsRes.json();
              if (dnsData.Answer) {
                const ips = dnsData.Answer.filter((a: any) => a.type === 1).map((a: any) => a.data);
                primaryIp = ips[0];
                dossierContent += `[DNS RESOLUTION]\n`;
                ips.forEach((ip: string) => { dossierContent += `- EXPOSED IPv4: ${ip}\n`; });
                dossierContent += `\n`;
              }
            } catch (e) { dossierContent += `[DNS RESOLUTION]: FAILED\n\n`; }
          }

          // STEP 2: GEOIP METADATA
          setHistory(prev => [...prev, { type: 'out', text: `[*] EXTRACTING GEOLOCATION METADATA...` }]);
          try {
            const geoRes = await fetch(`https://get.geojs.io/v1/ip/geo/${primaryIp}.json`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              dossierContent += `[GEOLOCATION & TOPOLOGY]\n`;
              dossierContent += `- PRIMARY IP : ${primaryIp}\n`;
              dossierContent += `- ISP        : ${geoData.organization_name || geoData.organization || 'UNKNOWN'}\n`;
              dossierContent += `- CITY       : ${geoData.city || 'UNKNOWN'}\n`;
              dossierContent += `- COUNTRY    : ${geoData.country_code || 'UNKNOWN'}\n`;
              dossierContent += `- COORDS     : ${geoData.latitude}, ${geoData.longitude}\n\n`;
            }
          } catch (e) { dossierContent += `[GEOLOCATION]: FAILED\n\n`; }

          // STEP 3: VULNERABILITY MAPPING
          setHistory(prev => [...prev, { type: 'out', text: `[*] INTERROGATING SHODAN DATABASE...` }]);
          try {
            const shodanRes = await fetch(`https://internetdb.shodan.io/${primaryIp}`);
            if (shodanRes.ok) {
              const shodanData = await shodanRes.json();
              dossierContent += `[ATTACK SURFACE & EXPLOITS]\n`;
              dossierContent += `- HOSTNAMES  : ${shodanData.hostnames?.length > 0 ? shodanData.hostnames.join(', ') : 'NONE'}\n`;
              dossierContent += `- OPEN PORTS : ${shodanData.ports?.length > 0 ? shodanData.ports.join(', ') : 'NONE'}\n`;
              if (shodanData.vulns?.length > 0) {
                dossierContent += `- ACTIVE CVEs: ${shodanData.vulns.join(', ')}\n`;
              } else {
                dossierContent += `- ACTIVE CVEs: NONE DETECTED\n`;
              }
              dossierContent += `\n`;
            }
          } catch (e) { dossierContent += `[ATTACK SURFACE]: NO SHODAN DATA EXPOSED\n\n`; }

          // STEP 4: SUBDOMAIN ENUMERATION
          if (!isIp) {
            setHistory(prev => [...prev, { type: 'out', text: `[*] SCRAPING HIDDEN SUBDOMAINS...` }]);
            try {
              const subRes = await fetch(`https://api.hackertarget.com/hostsearch/?q=${targetArg}`);
              if (subRes.ok) {
                const subText = await subRes.text();
                if (!subText.includes('error')) {
                  dossierContent += `[SUBDOMAIN ARCHITECTURE (SHADOW IT)]\n`;
                  const lines = subText.split('\n').filter((l: string) => l.trim() !== '');
                  lines.forEach((line: string) => { dossierContent += `- ${line}\n`; });
                  dossierContent += `\n`;
                }
              }
            } catch (e) { dossierContent += `[SUBDOMAINS]: ENUMERATION FAILED\n\n`; }
          }

          dossierContent += `========================================\n`;
          dossierContent += `END OF REPORT\n`;

          // STEP 5: BROWSER INJECTION (Force Download)
          setHistory(prev => [...prev, { type: 'sys', text: `[+] DOSSIER COMPILED SUCCESSFULLY. INITIATING SECURE DOWNLOAD...` }]);
          
          try {
            const blob = new Blob([dossierContent], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `OASIS_${targetArg.replace(/[^a-z0-9]/gi, '_').toUpperCase()}_DOSSIER.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (err) {
            setHistory(prev => [...prev, { type: 'err', text: `[!] FAILED TO WRITE FILE TO LOCAL STORAGE.` }]);
          }
          break;

        case 'breach':
          if (!targetArg || !targetArg.includes('@')) throw new Error("REQUIRES VALID EMAIL");
          setHistory(prev => [...prev, { type: 'sys', text: `CROSS-REFERENCING [${targetArg}] AGAINST GLOBAL LEAK REGISTRIES...` }]);
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); 
            const breachRes = await fetch(`https://api.xposedornot.com/v1/check-email/${targetArg}`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (breachRes.status === 404) {
              setHistory(prev => [...prev, { type: 'out', text: `[SECURE]: TARGET EMAIL NOT FOUND IN ANY KNOWN DARK WEB DATABASES.` }]);
              break;
            }
            if (!breachRes.ok) throw new Error(`API REJECTED REQUEST. STATUS: ${breachRes.status}`);
            
            const breachData = await breachRes.json();
            let leaks: string[] = [];
            if (breachData.breaches) {
              if (Array.isArray(breachData.breaches[0])) leaks = breachData.breaches[0];
              else if (Array.isArray(breachData.breaches)) leaks = breachData.breaches;
            }

            if (leaks.length > 0) {
              setHistory(prev => [...prev, { type: 'warn', text: `[!] CRITICAL COMPROMISE DETECTED: TARGET APPEARS IN ${leaks.length} DATABASE LEAKS.` }]);
              setHistory(prev => [...prev, { type: 'out', text: `[KNOWN COMPROMISED PLATFORMS]:` }]);
              const displayLeaks = leaks.slice(0, 10);
              setHistory(prev => [...prev, { type: 'err', text: `    ${displayLeaks.join(', ')}` }]);
              if (leaks.length > 10) setHistory(prev => [...prev, { type: 'warn', text: `    ...AND ${leaks.length - 10} MORE. IDENTITY IS HIGHLY EXPOSED.` }]);
            } else {
              setHistory(prev => [...prev, { type: 'out', text: `[SECURE]: TARGET EMAIL NOT FOUND.` }]);
            }
          } catch (e: any) {
             if (e.name === 'AbortError') setHistory(prev => [...prev, { type: 'err', text: `[!] OSINT FAILURE: CONNECTION TIMED OUT.` }]);
             else setHistory(prev => [...prev, { type: 'err', text: `[!] OSINT FAILURE: ${e.message}` }]);
          }
          break;

        case 'ledger':
          if (!targetArg) throw new Error("REQUIRES BITCOIN WALLET ADDRESS");
          setHistory(prev => [...prev, { type: 'sys', text: `INTERROGATING BLOCKCHAIN FOR WALLET [${targetArg}]...` }]);
          try {
            const btcRes = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${targetArg}`);
            if (!btcRes.ok) throw new Error("INVALID WALLET ADDRESS OR API RATE LIMIT EXCEEDED.");
            const btcData = await btcRes.json();
            const btcBalance = (btcData.balance / 100000000).toFixed(4); 
            const btcReceived = (btcData.total_received / 100000000).toFixed(4);
            const btcSent = (btcData.total_sent / 100000000).toFixed(4);

            setHistory(prev => [...prev, 
              { type: 'out', text: `[WALLET LIFETIME FOOTPRINT]:` },
              { type: 'warn', text: `    TOTAL RECEIVED : ${btcReceived} BTC` },
              { type: 'warn', text: `    TOTAL SENT     : ${btcSent} BTC` },
              { type: 'out', text: `[CURRENT ACTIVE BALANCE]:` },
              { type: 'err', text: `    ${btcBalance} BTC` },
              { type: 'out', text: `[TRANSACTION METRICS]:` },
              { type: 'out', text: `    TOTAL TX COUNT : ${btcData.n_tx}` },
              { type: 'out', text: `    UNCONFIRMED TX : ${btcData.unconfirmed_n_tx}` }
            ]);
            if (btcData.n_tx > 0 && btcData.txrefs) {
              const lastTx = btcData.txrefs[0];
              setHistory(prev => [...prev, { type: 'sys', text: `[LATEST DETECTED MOVEMENT]: ${new Date(lastTx.confirmed).toLocaleString()} (HASH: ${lastTx.tx_hash.substring(0,16)}...)` }]);
            }
          } catch (e: any) { setHistory(prev => [...prev, { type: 'err', text: `[!] FININT FAILURE: ${e.message}` }]); }
          break;

        case 'subs':
          if (!targetArg) throw new Error("REQUIRES DOMAIN");
          setHistory(prev => [...prev, { type: 'sys', text: `INITIATING SUBDOMAIN ENUMERATION FOR [${targetArg.toUpperCase()}]...` }]);
          try {
            const subRes = await fetch(`https://api.hackertarget.com/hostsearch/?q=${targetArg}`);
            if (!subRes.ok) throw new Error("API REJECTED REQUEST.");
            const subText = await subRes.text();
            if (subText.includes('error')) throw new Error("NO RECORDS FOUND.");
            const lines = subText.split('\n').filter(l => l.trim() !== '');
            setHistory(prev => [...prev, { type: 'out', text: `[+] DISCOVERED ${lines.length} SUBDOMAINS/HOSTS:` }]);
            lines.slice(0, 15).forEach(line => {
              const [host, ip] = line.split(',');
              setHistory(prev => [...prev, { type: 'out', text: `    ${host} -> ${ip}` }]);
            });
            if (lines.length > 15) setHistory(prev => [...prev, { type: 'warn', text: `    ...AND ${lines.length - 15} MORE HIDDEN HOSTS.` }]);
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('OVERWATCH_DATA_SUBS', { detail: { target: targetArg, data: lines } }));
          } catch (e: any) { setHistory(prev => [...prev, { type: 'err', text: `[!] ${e.message}` }]); }
          break;

        case 'intel':
          if (!targetArg || !/^(\d{1,3}\.){3}\d{1,3}$/.test(targetArg)) throw new Error("REQUIRES VALID IPv4 ADDRESS");
          setHistory(prev => [...prev, { type: 'sys', text: `INTERROGATING SHODAN FOR [${targetArg}]...` }]);
          try {
            const shodanRes = await fetch(`https://internetdb.shodan.io/${targetArg}`);
            if (!shodanRes.ok) throw new Error(shodanRes.status === 404 ? "NO OPEN PORTS DETECTED." : "SHODAN CONNECTION FAILED.");
            const shodanData = await shodanRes.json();
            setHistory(prev => [...prev, 
              { type: 'out', text: `[HOSTNAMES]: ${shodanData.hostnames?.length > 0 ? shodanData.hostnames.join(', ') : 'NONE'}` },
              { type: 'out', text: `[PORTS]: ${shodanData.ports?.length > 0 ? shodanData.ports.join(', ') : 'NONE'}` },
            ]);
            if (shodanData.vulns && shodanData.vulns.length > 0) {
              setHistory(prev => [...prev, { type: 'warn', text: `[!] CRITICAL: ${shodanData.vulns.length} VULNERABILITIES DETECTED:` }]);
              setHistory(prev => [...prev, { type: 'err', text: `    ${shodanData.vulns.slice(0, 5).join(', ')}...` }]);
            }
          } catch (e: any) { setHistory(prev => [...prev, { type: 'err', text: `[!] ${e.message}` }]); }
          break;

        case 'whois':
          if (!targetArg) throw new Error("REQUIRES TARGET");
          setHistory(prev => [...prev, { type: 'sys', text: `TRACING ${targetArg}...` }]);
          const whoRes = await fetch(`https://get.geojs.io/v1/ip/geo/${targetArg}.json`);
          if (!whoRes.ok) throw new Error("INVALID TARGET OR TRACE FAILED.");
          const whoData = await whoRes.json();
          setHistory(prev => [...prev, 
            { type: 'out', text: `[ISP]: ${whoData.organization_name || whoData.organization || 'UNKNOWN'}` },
            { type: 'out', text: `[GEO]: ${whoData.city || 'UNKNOWN'}, ${whoData.country_code || 'UNKNOWN'}` },
            { type: 'out', text: `[LAT/LON]: ${whoData.latitude}, ${whoData.longitude}` }
          ]);
          break;

        case 'ping':
          if (!targetArg) throw new Error("REQUIRES DOMAIN");
          setHistory(prev => [...prev, { type: 'sys', text: `RESOLVING ${targetArg}...` }]);
          const dnsRes = await fetch(`https://dns.google/resolve?name=${targetArg}&type=A`);
          const dnsData = await dnsRes.json();
          if (!dnsData.Answer) throw new Error("NO IPv4 RECORD FOUND.");
          dnsData.Answer.forEach((ans: any) => { if(ans.type === 1) setHistory(prev => [...prev, { type: 'out', text: `[IPv4]: ${ans.data}` }]); });
          break;

        case 'scan':
          if (!targetArg) throw new Error("REQUIRES TARGET");
          setHistory(prev => [...prev, { type: 'sys', text: `INITIATING AUTOMATED RECON ON [${targetArg.toUpperCase()}]...` }]);
          const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(targetArg);
          let ipsToScan: string[] = isIpAddress ? [targetArg] : [];
          if (!isIpAddress) {
            const scanDnsRes = await fetch(`https://dns.google/resolve?name=${targetArg}&type=A`);
            const scanDnsData = await scanDnsRes.json();
            if (!scanDnsData.Answer) throw new Error("TARGET UNREACHABLE.");
            ipsToScan = scanDnsData.Answer.filter((a: any) => a.type === 1).map((a: any) => a.data);
          }
          for (let i = 0; i < ipsToScan.length; i++) {
            const ip = ipsToScan[i];
            setHistory(prev => [...prev, { type: 'sys', text: `\n--> TRACING HOST ${i + 1}/${ipsToScan.length}: [${ip}]` }]);
            try {
              const scanWhoRes = await fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`);
              if (scanWhoRes.ok) {
                const scanWhoData = await scanWhoRes.json();
                setHistory(prev => [...prev,
                  { type: 'out', text: `    ISP : ${scanWhoData.organization_name || 'UNKNOWN'}` },
                  { type: 'out', text: `    GEO : ${scanWhoData.city || 'UNKNOWN'}, ${scanWhoData.country_code || 'UNKNOWN'}` }
                ]);
              }
            } catch (e) {}
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          setHistory(prev => [...prev, { type: 'sys', text: `\n[=== MACRO COMPLETE ===]` }]);
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
                <TerminalIcon size={12} /> OVERWATCH KERNEL v3.0
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
                  ${line.type === 'warn' ? 'text-[#ffaa00] font-bold pl-4' : ''}
                  ${line.type === 'err' ? 'text-[#ff3366] pl-4' : ''}
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
