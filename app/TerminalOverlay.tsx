"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal as TerminalIcon, X, ChevronRight } from 'lucide-react';

export default function TerminalOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ type: 'cmd' | 'out' | 'err' | 'sys', text: string }[]>([
    { type: 'sys', text: 'OVERWATCH KERNEL v1.0 INITIALIZED.' },
    { type: 'sys', text: 'TYPE "help" FOR AVAILABLE COMMANDS.' }
  ]);
  
  const endOfTerminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    endOfTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isOpen]);

  // THE COMMAND PARSER ENGINE
  const processCommand = async (cmd: string) => {
    const args = cmd.trim().split(' ');
    const baseCmd = args[0].toLowerCase();

    setHistory(prev => [...prev, { type: 'cmd', text: `> ${cmd}` }]);

    try {
      switch (baseCmd) {
        case 'help':
          setHistory(prev => [...prev, 
            { type: 'out', text: 'AVAILABLE PROTOCOLS:' },
            { type: 'out', text: '  whois [ip]    - Instant OSINT geolocation trace' },
            { type: 'out', text: '  ping [domain] - Resolve domain to IPv4' },
            { type: 'out', text: '  price [pair]  - Live asset telemetry (e.g. price BTCUSDT)' },
            { type: 'out', text: '  clear         - Wipe terminal history' },
            { type: 'out', text: '  exit          - Close Overwatch Kernel' }
          ]);
          break;

        case 'clear':
          setHistory([]);
          break;

        case 'exit':
          setIsOpen(false);
          break;

        case 'whois':
          if (!args[1]) throw new Error("REQUIRES TARGET (e.g., whois 8.8.8.8)");
          setHistory(prev => [...prev, { type: 'sys', text: `TRACING ${args[1]}...` }]);
          const whoRes = await fetch(`https://ipwho.is/${args[1]}`);
          const whoData = await whoRes.json();
          if (!whoData.success) throw new Error("INVALID TARGET OR TRACE FAILED.");
          setHistory(prev => [...prev, 
            { type: 'out', text: `[ISP]: ${whoData.connection.isp}` },
            { type: 'out', text: `[GEO]: ${whoData.city}, ${whoData.country_code}` },
            { type: 'out', text: `[LAT/LON]: ${whoData.latitude}, ${whoData.longitude}` }
          ]);
          break;

        case 'ping':
          if (!args[1]) throw new Error("REQUIRES DOMAIN (e.g., ping fbi.gov)");
          setHistory(prev => [...prev, { type: 'sys', text: `RESOLVING ${args[1]}...` }]);
          const dnsRes = await fetch(`https://dns.google/resolve?name=${args[1]}&type=A`);
          const dnsData = await dnsRes.json();
          if (!dnsData.Answer) throw new Error("NO IPv4 RECORD FOUND.");
          dnsData.Answer.forEach((ans: any) => {
            if(ans.type === 1) setHistory(prev => [...prev, { type: 'out', text: `[IPv4]: ${ans.data}` }]);
          });
          break;

        case 'price':
          const pair = args[1] ? args[1].toUpperCase() : 'BTCUSDT';
          setHistory(prev => [...prev, { type: 'sys', text: `FETCHING MARKET DATA FOR ${pair}...` }]);
          const pxRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
          if (!pxRes.ok) throw new Error("INVALID ASSET PAIR.");
          const pxData = await pxRes.json();
          setHistory(prev => [...prev, { type: 'out', text: `[${pair}]: $${parseFloat(pxData.price).toFixed(2)}` }]);
          break;

        case '':
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
      {/* GLOBAL FLOATING TOGGLE BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-[#00ffcc]/10 border border-[#00ffcc]/50 text-[#00ffcc] p-3 rounded-full shadow-[0_0_15px_rgba(0,255,204,0.3)] hover:bg-[#00ffcc] hover:text-black transition-all backdrop-blur-md"
      >
        <TerminalIcon size={20} />
      </button>

      {/* THE SLIDING KERNEL INTERFACE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed bottom-0 left-0 w-full h-[50vh] bg-[#050505]/95 backdrop-blur-xl border-t border-[#333] z-40 flex flex-col font-mono shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
          >
            {/* TERMINAL HEADER */}
            <div className="flex justify-between items-center bg-[#111] border-b border-[#222] px-4 py-2">
              <div className="flex items-center gap-2 text-[#00ffcc] text-[10px] tracking-widest font-bold">
                <TerminalIcon size={12} /> OVERWATCH KERNEL
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-[#ff3366] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* TERMINAL OUTPUT STREAM */}
            <div className="flex-grow overflow-y-auto p-4 text-xs space-y-1">
              {history.map((line, i) => (
                <div key={i} className={`
                  ${line.type === 'cmd' ? 'text-white font-bold' : ''}
                  ${line.type === 'out' ? 'text-gray-400 pl-4' : ''}
                  ${line.type === 'sys' ? 'text-[#ffaa00]' : ''}
                  ${line.type === 'err' ? 'text-[#ff3366]' : ''}
                `}>
                  {line.text}
                </div>
              ))}
              <div ref={endOfTerminalRef} />
            </div>

            {/* TERMINAL INPUT PROMPT */}
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
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
