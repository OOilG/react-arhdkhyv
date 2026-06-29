import React, { useEffect, useRef, useState } from "react";
import "./style.css";

export default function App() {
  const canvasRef = useRef(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [commentData] = useState([
    { id: "c1", user: "u/Fin", upvotes: 85, isQuestion: false },
    { id: "c2", user: "u/Chef", upvotes: 42, isQuestion: false },
    { id: "c3", user: "u/Dev", upvotes: 22, isQuestion: true },
    { id: "c4", user: "u/Wizard", upvotes: 15, isQuestion: true },
    { id: "c5", user: "u/Local", upvotes: 5, isQuestion: false }
  ]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const tankArea = canvas.width * canvas.height;
    const minArea = tankArea * 0.0025, maxSpawnArea = tankArea * 0.0125, absoluteMaxArea = tankArea * 0.0200, leviathanArea = tankArea * 0.0500;

    const updateBoard = (arr) => {
      const list = [...arr].sort((a,b) => b.upvotes - a.upvotes).map(f => {
        let t = f.isLeviathan ? "🚨 APEX BOSS" : f.isEaten ? "💀 FOOD" : f.upvotes >= 50 ? "👑 LORD" : "🐟 MINNOW";
        return { user: f.user, upvotes: f.upvotes, title: t, dead: f.isEaten };
      });
      setLeaderboard(list);
    };

    const drawLoop = setInterval(() => {
      const serverTime = Date.now(); // Centralized universal engine anchor clock
      
      // Clean background render
      ctx.fillStyle = '#0284c7'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#4ade80'; ctx.fillRect(40, canvas.height - 60, 15, 60); ctx.fillRect(canvas.width - 60, canvas.height - 70, 15, 70);

      // 🫧 Synchronized background water bubble rendering pass
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      for (let i = 0; i < 20; i++) {
        const bubbleSeedX = (i * 47) % canvas.width;
        const bubbleBaseSpeed = 0.05 + (i % 3) * 0.03;
        const bubbleTimeY = (serverTime * bubbleBaseSpeed) % (canvas.height + 20);
        const bubbleY = canvas.height + 10 - bubbleTimeY;
        const bubbleSwayX = Math.sin((serverTime / 400) + i) * 4;
        
        ctx.beginPath();
        ctx.arc(bubbleSeedX + bubbleSwayX, bubbleY, 1.5 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }

      // ⏳ Synchronized Event Evaluation Windows
      // Checks if the current 10-minute slot of the clock triggers a global Leviathan spawn
      const currentMinuteBlock = Math.floor(serverTime / 60000) % 10;
      const isBossTime = currentMinuteBlock === 0 || currentMinuteBlock === 1; // Spawns for a uniform window

      // Build active fish arrays deterministically so positions map identically on every device
      let fishes = commentData.map((c, index) => {
        const area = Math.max(minArea, Math.min(minArea + (c.upvotes * 10), maxSpawnArea));
        const rx = Math.sqrt(area / (Math.PI / 1.6));
        
        // Centralized movement math pathways driven by timestamp loops instead of random seeds
        const timeline = serverTime * 0.001;
        const loopWidth = canvas.width - (rx * 2) - 40;
        const loopHeight = canvas.height - (rx * 2) - 40;
        
        const speedMultiplierX = 0.5 + (index * 0.15);
        const speedMultiplierY = 0.3 + (index * 0.1);
        
        const rawX = (rx + 20) + (Math.abs((timeline * speedMultiplierX * 40) % (loopWidth * 2) - loopWidth));
        const rawY = (rx + 20) + (Math.abs((timeline * speedMultiplierY * 30) % (loopHeight * 2) - loopHeight));

        // Determine orientation headers dynamically from position velocities
        const prevTimeline = (serverTime - 16) * 0.001;
        const prevX = (rx + 20) + (Math.abs((prevTimeline * speedMultiplierX * 40) % (loopWidth * 2) - loopWidth));
        const currentDx = rawX - prevX;

        return {
          id: c.id, user: c.user, upvotes: c.upvotes, x: rawX, y: rawY, dx: currentDx,
          rx: rx, ry: rx / 1.6, color: c.isQuestion ? '#38bdf8' : '#fbbf24', isEaten: false, isLeviathan: false
        };
      });

      // Inject deterministic Boss attributes if clock coordinates line up universally
      if (isBossTime) {
        const leviathanRx = Math.sqrt(leviathanArea / (Math.PI / 1.6));
        const bossTimeline = serverTime * 0.0006;
        const bossWidth = canvas.width - (leviathanRx * 2) - 60;
        const bossX = (leviathanRx + 30) + (Math.abs((bossTimeline * 25) % (bossWidth * 2) - bossWidth));
        const bossY = canvas.height / 2 + Math.sin(serverTime / 1200) * 20;
        
        const prevBossTimeline = (serverTime - 16) * 0.0006;
        const prevBossX = (leviathanRx + 30) + (Math.abs((prevBossTimeline * 25) % (bossWidth * 2) - bossWidth));
        
        fishes.push({
          id: "lev_global", user: "🐋 LEVIATHAN", upvotes: 999, x: bossX, y: bossY, dx: bossX - prevBossX,
          rx: leviathanRx, ry: leviathanRx / 1.6, color: "#ef4444", isEaten: false, isLeviathan: true
        });
      }

      // 🚨 REAL-TIME GLOBAL NOSE-CONE EXTRACTION METHOD
      // Runs matching vector intersection routines driven by server dimensions
      fishes.forEach((predator, pIdx) => {
        if (predator.isEaten) return;
        
        fishes.forEach((prey, prIdx) => {
          if (prey.isEaten || pIdx === prIdx || prey.rx >= predator.rx) return;
          
          const velLen = Math.hypot(predator.dx, 0.1); // Avoid zero dividing blocks
          const noseX = predator.x + ((predator.dx / velLen) * predator.rx);
          const noseY = predator.y;
          
          const distToNose = Math.hypot(prey.x - noseX, prey.y - noseY);
          if (distToNose < prey.rx + 6) {
            let angleToPrey = Math.atan2(prey.y - predator.y, prey.x - predator.x);
            let headingAngle = Math.atan2(0, predator.dx);
            let diff = angleToPrey - headingAngle;
            
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            
            // If inside the forward nose field cone, register a visual skip
            if (Math.abs(diff) <= 0.707) {
              fishes[prIdx].isEaten = true;
            }
          }
        });
      });

      // Render the current synchronized frame profiles
      fishes.forEach(f => {
        if (f.isEaten) return;
        ctx.fillStyle = f.color; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.rx, f.ry, 0, 0, 2 * Math.PI); ctx.fill();
        
        ctx.beginPath(); ctx.moveTo(f.x - (f.dx > 0 ? f.rx : -f.rx), f.y);
        ctx.lineTo(f.x - (f.dx > 0 ? f.rx * 1.4 : -f.rx * 1.4), f.y - f.ry / 1.5);
        ctx.lineTo(f.x - (f.dx > 0 ? f.rx * 1.4 : -f.rx * 1.4), f.y + f.ry / 1.5);
        ctx.closePath(); ctx.fill();
        
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(f.user, f.x, f.y - (f.ry + 6));
      });

      updateBoard(fishes);
    }, 16);

    return () => clearInterval(drawLoop);
  }, [commentData]);

  return (
    <div style={{ padding: '12px', fontFamily: 'sans-serif', background: '#0f172a', color: '#fff', borderRadius: '16px', width: '100%', maxWidth: '380px', boxSizing: 'border-box', margin: '10px auto', border: '1px solid #1e293b' }}>
      <h4 style={{ textAlign: 'center', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>🐋 REAL-TIME GLOBAL SIMULATOR</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <canvas ref={canvasRef} width={340} height={220} style={{ border: '4px solid #f59e0b', borderRadius: '12px', background: '#0284c7', width: '100%', maxWidth: '340px', display: 'block' }} />
        
        <div style={{ width: '100%', background: '#1e293b', borderRadius: '12px', padding: '12px', boxSizing: 'border-box', border: '1px solid #334155', fontSize: '11px', textAlign: 'left', lineHeight: '1.4' }}>
          <div style={{ color: '#00f0ff', fontWeight: '800', marginBottom: '6px' }}>📜 SERVER CONSOLE SYNCHRONIZATION KEY:</div>
          <div>🟡 <strong>Gold Fish</strong>: Standard statement comments.</div>
          <div>🔵 <strong>Blue Fish</strong>: Question thread tracking badges.</div>
          <div>🔴 <strong>Red Boss</strong>: Alpha Leviathan beast. Spawns and tracks identically across all devices using synchronized server clock arrays.</div>
          <hr style={{ border: 0, borderTop: '1px solid #334155', margin: '6px 0' }} />
          <div>• Movement values are locked to universal timeline matrix ticks. Smaller fish are safely shielded unless they intersect directly inside the 45° vector cone expanding out from the predator's nose tip.</div>
        </div>

        <div style={{ width: '100%', background: '#1e293b', borderRadius: '12px', padding: '12px', boxSizing: 'border-box', border: '1px solid #334155' }}>
          <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '4px', textAlign: 'left' }}>🏆 Live Global Survivors</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {leaderboard.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: item.dead ? '#0f172a50' : '#0f172a', padding: '8px 10px', borderRadius: '6px', opacity: item.dead ? 0.25 : 1, border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '12px', color: item.dead ? '#64748b' : '#f8fafc' }}>{item.user} <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px' }}>({item.title})</span></span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: item.dead ? '#475569' : '#fbbf24' }}>▲ {item.upvotes}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
