import React, { useEffect, useRef, useState } from "react";
import "./style.css";

export default function App() {
  const canvasRef = useRef(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [allTimeBoard, setAllTimeBoard] = useState(() => {
    try {
      const saved = localStorage.getItem("aquarium_wins");
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [commentData] = useState([
    { id: "c1", user: "u/Fin", upvotes: 85, isQuestion: false },
    { id: "c2", user: "u/Chef", upvotes: 42, isQuestion: false },
    { id: "c3", user: "u/Dev", upvotes: 22, isQuestion: true },
    { id: "c4", user: "u/Wizard", upvotes: 15, isQuestion: true },
    { id: "c5", user: "u/Local", upvotes: 5, isQuestion: false }
  ]);

  useEffect(() => {
    try {
      localStorage.setItem("aquarium_wins", JSON.stringify(allTimeBoard));
    } catch (e) {}
  }, [allTimeBoard]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    const resizeCanvas = () => {
      const parentWidth = canvas.parentElement.clientWidth;
      canvas.width = Math.min(800, parentWidth);
      canvas.height = canvas.width * (450 / 800); 
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const tankArea = canvas.width * canvas.height;
    const minArea = tankArea * 0.0015, maxSpawnArea = tankArea * 0.008, absoluteMaxArea = tankArea * 0.015, leviathanArea = tankArea * 0.035, ancientArea = tankArea * 0.055;
    let fishes = []; let bubbles = []; let roundOverRecorded = false;

    // ⏱️ TIME-ANCHORED SEED GENERATION: Overrides random gaps to align layouts identically everywhere
    const getSynchronizedClockMetric = (index) => {
      const globalTimeBlock = Math.floor(Date.now() / 300000); 
      return Math.abs(Math.sin(globalTimeBlock + index));
    };

    for (let i = 0; i < 35; i++) {
      const seededSway = getSynchronizedClockMetric(i);
      bubbles.push({ x: seededSway * canvas.width, y: ((i * 15) % canvas.height), r: (seededSway * 1.5) + 1, speed: (seededSway * 0.3) + 0.2, swaySeed: i });
    }

    const updateBoard = (arr) => {
      const list = [...arr].sort((a, b) => b.upvotes - a.upvotes).map((f) => ({
        user: f.user, upvotes: f.upvotes, title: f.isAncient ? "🌌 MYTHIC KRAKEN" : f.isLeviathan ? "🚨 APEX ALPHA" : f.upvotes >= 50 ? "👑 LORD" : "🐟 MINNOW", dead: f.isEaten
      }));
      setLeaderboard(list);
    };

    const generateEcosystem = () => {
      roundOverRecorded = false;
      fishes = commentData.map((c, index) => {
        const area = Math.max(minArea, Math.min(minArea + c.upvotes * 25, maxSpawnArea)), rx = Math.sqrt(area / (Math.PI / 1.6));
        const clockSeed = getSynchronizedClockMetric(index);
        
        // Locked absolute positioning matrix coordinate tracks
        const fixedSeedX = (index * (canvas.width / 6)) + 60;
        const fixedSeedY = ((clockSeed * (canvas.height - 100)) + 50);
        return {
          id: c.id, user: c.user, upvotes: c.upvotes, x: fixedSeedX, y: fixedSeedY,
          baseDx: index % 2 === 0 ? 1.4 : -1.4, dy: index % 3 === 0 ? 0.6 : -0.6,
          rx: rx, ry: rx / 1.6, targetRx: rx, targetRy: rx / 1.6, color: c.isQuestion ? "#00f0ff" : "#ffb700",
          isEaten: false, isLeviathan: false, isAncient: false, spawnTime: Math.floor(Date.now() / 300000) * 300000, tailSeed: index
        };
      });

      // Synchronized Alpha spawning bound directly to absolute database wall clock intervals
      const timeMinutes = new Date().getMinutes();
      if (timeMinutes % 10 === 0 || timeMinutes % 10 === 1) {
        const leviathanRx = Math.sqrt(leviathanArea / (Math.PI / 1.6));
        fishes.push({ id: "lev_sync", user: "🐋 LEVIATHAN", upvotes: 999, x: canvas.width / 2, y: canvas.height / 2, baseDx: 0.6, dy: 0.3, rx: leviathanRx, ry: leviathanRx / 1.6, targetRx: leviathanRx, targetRy: leviathanRx / 1.6, color: "#ff0055", isEaten: false, isLeviathan: true, isAncient: false, spawnTime: Date.now(), tailSeed: 50 });
      }
      updateBoard(fishes);
    };

    generateEcosystem();
    const resetIntervalId = setInterval(generateEcosystem, 15000); // Poll server updates every 15s

    const mutationIntervalId = setInterval(() => {
      let mutated = false; const isLevAlive = fishes.some((f) => !f.isEaten && f.isLeviathan && !f.isAncient);
      fishes = fishes.map((f, i) => {
        if (f.isEaten) return f;
        if (isLevAlive && !f.isLeviathan && i === 0) {
          const ancientRx = Math.sqrt(ancientArea / (Math.PI / 1.6)); mutated = true;
          return { ...f, user: "👑 KRAKEN", targetRx: ancientRx, targetRy: ancientRx / 1.6, color: "#b600ff", isLeviathan: true, isAncient: true, spawnTime: Date.now() };
        }
        return f;
      });
      if (mutated) updateBoard(fishes);
    }, 5000);

    const triggerPredatorCycle = () => {
      fishes = fishes.map((f) => (f.isAncient && Date.now() - f.spawnTime > 180000 ? { ...f, isEaten: true } : f));
      const active = fishes.filter((f) => !f.isEaten);

      if (active.length === 1 && !roundOverRecorded) {
        const winner = active.user; roundOverRecorded = true;
        setAllTimeBoard((prev) => ({ ...prev, [winner]: (prev[winner] || 0) + 1 }));
      }

      if (active.length < 2) return;
      const sorted = [...active].sort((a, b) => b.rx - a.rx), predators = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.15)));

      predators.forEach((predator) => {
        if (predator.isEaten) return; if (Math.PI * predator.targetRx * predator.targetRy >= absoluteMaxArea && !predator.isLeviathan) return;
        const preyOptions = sorted.filter((v) => !v.isEaten && v.id !== predator.id && v.rx < predator.rx);

        preyOptions.forEach((prey) => {
          const centerDist = Math.hypot(prey.x - predator.x, prey.y - predator.y); if (centerDist >= predator.rx + prey.rx) return;
          const relativeX = prey.x - predator.x; const relativeY = prey.y - predator.y;
          const headingLen = Math.hypot(predator.baseDx, predator.dy);
          const dotProductForward = (relativeX * (predator.baseDx / headingLen)) + (relativeY * (predator.dy / headingLen));

          if (dotProductForward > 0) {
            const pIdx = fishes.findIndex((f) => f.id === prey.id); if (pIdx !== -1) fishes[pIdx].isEaten = true;
            const predIdx = fishes.findIndex((f) => f.id === predator.id);
            if (predIdx !== -1 && !fishes[predIdx].isLeviathan) {
              fishes[predIdx].targetRx += 3.5; fishes[predIdx].targetRy += 2.2;
              if (Math.PI * fishes[predIdx].targetRx * fishes[predIdx].targetRy > absoluteMaxArea) {
                const capRx = Math.sqrt(absoluteMaxArea / (Math.PI / 1.6)); fishes[predIdx].targetRx = capRx; fishes[predIdx].targetRy = capRx / 1.6;
              }
            }
          }
        });
      });
      updateBoard(fishes);
    };

    const predatorIntervalId = setInterval(triggerPredatorCycle, 3000);

    const render = () => {
      ctx.fillStyle = "#050814"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 240, 255, 0.12)";
      bubbles.forEach((b) => {
        b.y -= b.speed; b.swaySeed += 0.02; b.x += Math.cos(b.swaySeed) * 0.2;
        if (b.y < -10) { b.y = canvas.height + 10; b.x = Math.random() * canvas.width; }
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      });

      ctx.fillStyle = "#00ff66"; ctx.fillRect(60, canvas.height - 80, 10, 80); ctx.fillRect(canvas.width - 80, canvas.height - 100, 10, 100);
      const leviathanTarget = fishes.find((f) => !f.isEaten && f.isLeviathan && !f.isAncient);

      fishes.forEach(f => {
        if (f.isEaten) return;
        f.rx += (f.targetRx - f.rx) * 0.05; f.ry += (f.targetRy - f.ry) * 0.05;
        let scaleFactor = Math.max(0.4, 25 / f.rx); let currentDx = f.baseDx * scaleFactor; let currentDy = f.dy * scaleFactor;

        if (f.isAncient && leviathanTarget) {
          const cycleTime = (Date.now() - f.spawnTime) % 6000;
          if (cycleTime < 2000) {
            const angle = Math.atan2(leviathanTarget.y - f.y, leviathanTarget.x - f.x);
            currentDx = currentDx * 0.94 + Math.cos(angle) * 2.2 * 0.06; currentDy = currentDy * 0.94 + Math.sin(angle) * 1.4 * 0.06;
          }
        }

        f.x += currentDx; f.y += currentDy;
        if (f.x - f.rx < 0 || f.x + f.rx > canvas.width) f.baseDx *= -1;
        if (f.y - f.ry < 0 || f.y + f.ry > canvas.height) f.dy *= -1;

        ctx.fillStyle = f.color; ctx.shadowBlur = 15; ctx.shadowColor = f.color;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.rx, f.ry, 0, 0, 2 * Math.PI); ctx.fill();

        f.tailSeed += 0.15; const tailWag = Math.sin(f.tailSeed) * 0.4; const headingDir = currentDx > 0 ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(f.x + (currentDx > 0 ? -f.rx : f.rx), f.y);
        ctx.lineTo(f.x + headingDir * f.rx * 1.4, f.y - f.ry / 1.5 + tailWag * f.ry); ctx.lineTo(f.x + headingDir * f.rx * 1.4, f.y + f.ry / 1.5 + tailWag * f.ry);
        ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.fillText(f.user, f.x, f.y - (f.ry + 6));
      });
      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId); window.removeEventListener("resize", resizeCanvas);
      clearInterval(predatorIntervalId); clearInterval(resetIntervalId); clearInterval(mutationIntervalId);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [commentData]);

  return React.createElement("div", { ref: containerRef, style: { padding: '24px', fontFamily: 'sans-serif', background: 'radial-gradient(circle at top, #111827, #030712)', color: '#fff', minHeight: '100vh', boxSizing: 'border-box' } },
