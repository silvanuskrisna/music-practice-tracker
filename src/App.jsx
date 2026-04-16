import { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "mpt_v6";
const INSTRUMENTS = ["Gitar", "Piano", "Drum"];
const INST_ICON = { Gitar: "🎸", Piano: "🎹", Drum: "🥁" };

const MATERI = {
  Gitar: {
    "Teknik Dasar": ["Chord open","Chord barre","Scale pentatonik","Scale mayor/minor","Fingerpicking","Alternate picking","Legato & bending","Sweep picking"],
    "Repertoire": ["Lagu baru (belajar)","Lagu dihapal (review)","Lagu performa (polish)"],
    "Teori": ["Interval & harmoni","Progresi chord","Analisis lagu","Rhythm & time feel","Mode & skala lanjut"],
  },
  Piano: {
    "Teknik Dasar": ["Posisi tangan & jari","Tangga nada (C, G, F)","Chord triad","Chord inversi","Arpegio","Hands together","Pedal teknik","Sight reading"],
    "Repertoire": ["Lagu baru (belajar)","Lagu dihapal (review)","Lagu performa (polish)"],
    "Teori": ["Interval","Progresi chord","Harmoni fungsional","Analisis partitur","Improvisasi"],
  },
  Drum: {
    "Teknik Dasar": ["Rudiment dasar (single stroke, double stroke)","Paradiddle","Hi-hat control","Bass drum teknik","Independence tangan-kaki","Groove & fill","Polyrhythm","Odd time signature"],
    "Repertoire": ["Lagu baru (belajar)","Lagu dihapal (review)","Lagu performa (polish)"],
    "Teori": ["Notasi drum","Time feel & groove","Dinamika","Gaya & genre (rock, jazz, funk)"],
  },
};

const KAT_COLORS = {
  "Teknik Dasar": { bg:"var(--color-background-info)", text:"var(--color-text-info)", bar:"#378ADD" },
  "Repertoire":   { bg:"var(--color-background-success)", text:"var(--color-text-success)", bar:"#1D9E75" },
  "Teori":        { bg:"var(--color-background-warning)", text:"var(--color-text-warning)", bar:"#BA7517" },
};

const TABS = ["Latihan","Metronome","Log","Progress","Report"];

function defaultData() {
  return { profiles: [], activeId: null };
}

function loadData() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : defaultData();
  } catch(e) {
    return defaultData();
  }
}

function saveData(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch(e) {}
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
}

function formatMin(sec) {
  return Math.round(sec / 60) + " menit";
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function getKategori(inst, materi) {
  if (!inst || !materi) return null;
  const m = MATERI[inst];
  if (!m) return null;
  for (const kat of Object.keys(m)) {
    if (m[kat].includes(materi)) return kat;
  }
  return null;
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0,0,0,0);
  return d.toISOString().split("T")[0];
}

function getWeekLabel(mondayStr) {
  const mon = new Date(mondayStr);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString("id-ID", { day:"numeric", month:"short" });
  return fmt(mon) + " – " + fmt(sun);
}

function sessionsInWeek(sessions, mondayStr) {
  const mon = new Date(mondayStr);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23,59,59);
  return sessions.filter(function(s) {
    const d = new Date(s.date);
    return d >= mon && d <= sun;
  });
}

function prevWeekStr(mondayStr) {
  const d = new Date(mondayStr);
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function getWeeksWithSessions(sessions) {
  const keys = [];
  const seen = {};
  sessions.forEach(function(s) {
    const k = getWeekKey(s.date);
    if (!seen[k]) { seen[k] = true; keys.push(k); }
  });
  return keys.sort().reverse();
}

// ─── HOME ───────────────────────────────────────────────────────────────────

function HomeScreen({ data, onSelect, onAdd, onDelete }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  function handleAdd() {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName("");
    setShowAdd(false);
  }

  return (
    <div style={{ fontFamily:"var(--font-sans)", maxWidth:480, margin:"0 auto", padding:"1rem" }}>
      <h2 style={{ fontSize:18, fontWeight:500, margin:"0 0 1.25rem", color:"var(--color-text-primary)" }}>Music Practice Tracker</h2>

      {data.profiles.length === 0 && !showAdd && (
        <div style={{ textAlign:"center", padding:"2.5rem 0", color:"var(--color-text-tertiary)", fontSize:14 }}>
          Belum ada murid. Tambah profil dulu.
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:"1rem" }}>
        {data.profiles.map(function(p) {
          const total = p.sessions.reduce(function(a,s) { return a + s.duration; }, 0);
          const week = sessionsInWeek(p.sessions, getWeekKey(todayStr())).reduce(function(a,s) { return a + s.duration; }, 0);
          const lastInst = p.sessions.length ? p.sessions[p.sessions.length - 1].instrument : null;
          return (
            <div key={p.id} onClick={function() { onSelect(p.id); }}
              style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"0.9rem 1rem", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"var(--color-background-secondary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                {lastInst ? (INST_ICON[lastInst] || "🎵") : "🎵"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:500, fontSize:15, color:"var(--color-text-primary)" }}>{p.name}</div>
                <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginTop:2 }}>
                  Minggu ini: {formatTime(week)} · Total: {formatTime(total)}
                </div>
              </div>
              <button onClick={function(e) { e.stopPropagation(); onDelete(p.id); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", fontSize:18, padding:"4px" }}>×</button>
            </div>
          );
        })}
      </div>

      {showAdd ? (
        <div style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)", padding:"1rem", display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>Nama murid</div>
          <input value={newName} onChange={function(e) { setNewName(e.target.value); }}
            onKeyDown={function(e) { if (e.key === "Enter") handleAdd(); }}
            placeholder="Masukkan nama..." style={{ width:"100%", boxSizing:"border-box" }} autoFocus />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={handleAdd} style={{ flex:1, padding:"9px", background:"#1D9E75", color:"#fff", border:"none", borderRadius:"var(--border-radius-md)", fontSize:13, cursor:"pointer" }}>Tambah</button>
            <button onClick={function() { setShowAdd(false); setNewName(""); }}
              style={{ flex:1, padding:"9px", background:"transparent", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", fontSize:13, color:"var(--color-text-secondary)", cursor:"pointer" }}>Batal</button>
          </div>
        </div>
      ) : (
        <button onClick={function() { setShowAdd(true); }}
          style={{ width:"100%", padding:"11px", background:"transparent", border:"0.5px dashed var(--color-border-secondary)", borderRadius:"var(--border-radius-lg)", fontSize:13, color:"var(--color-text-secondary)", cursor:"pointer" }}>
          + Tambah murid
        </button>
      )}
    </div>
  );
}

// ─── TRACKER ────────────────────────────────────────────────────────────────

function TrackerScreen({ profile, updateProfile, onBack }) {
  const [tab, setTab] = useState(0);
  return (
    <div style={{ fontFamily:"var(--font-sans)", maxWidth:480, margin:"0 auto", padding:"1rem" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:"1rem" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-secondary)", fontSize:18, padding:0 }}>←</button>
        <div style={{ fontWeight:500, fontSize:16, color:"var(--color-text-primary)", flex:1 }}>{profile.name}</div>
      </div>
      <div style={{ display:"flex", gap:4, marginBottom:"1.25rem", background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:4 }}>
        {TABS.map(function(t, i) {
          return (
            <button key={t} onClick={function() { setTab(i); }}
              style={{ flex:1, padding:"6px 2px", fontSize:11, fontWeight:tab===i?500:400, borderRadius:"var(--border-radius-md)", border:"none", cursor:"pointer", background:tab===i?"var(--color-background-primary)":"transparent", color:tab===i?"var(--color-text-primary)":"var(--color-text-secondary)", boxShadow:tab===i?"0 0.5px 2px rgba(0,0,0,0.08)":"none" }}>
              {t}
            </button>
          );
        })}
      </div>
      {tab === 0 && <TimerTab profile={profile} updateProfile={updateProfile} />}
      {tab === 1 && <MetronomeTab />}
      {tab === 2 && <LogTab profile={profile} updateProfile={updateProfile} />}
      {tab === 3 && <ProgressTab profile={profile} updateProfile={updateProfile} />}
      {tab === 4 && <ReportTab profile={profile} />}
    </div>
  );
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────

export default function App() {
  const [data, setData] = useState(loadData);

  const update = useCallback(function(fn) {
    setData(function(prev) {
      const next = fn(prev);
      saveData(next);
      return next;
    });
  }, []);

  function handleSelect(id) {
    update(function(prev) { return Object.assign({}, prev, { activeId: id }); });
  }

  function handleAdd(name) {
    const id = Date.now();
    update(function(prev) {
      return {
        profiles: prev.profiles.concat([{ id:id, name:name, sessions:[], weeklyTarget:300 }]),
        activeId: id,
      };
    });
  }

  function handleDelete(id) {
    update(function(prev) {
      return {
        profiles: prev.profiles.filter(function(p) { return p.id !== id; }),
        activeId: prev.activeId === id ? null : prev.activeId,
      };
    });
  }

  const updateProfile = useCallback(function(fn) {
    update(function(prev) {
      return Object.assign({}, prev, {
        profiles: prev.profiles.map(function(p) {
          return p.id === prev.activeId ? fn(p) : p;
        }),
      });
    });
  }, [update]);

  const activeProfile = data.profiles.find(function(p) { return p.id === data.activeId; });

  if (activeProfile) {
    return (
      <TrackerScreen
        profile={activeProfile}
        updateProfile={updateProfile}
        onBack={function() { update(function(prev) { return Object.assign({}, prev, { activeId: null }); }); }}
      />
    );
  }

  return (
    <HomeScreen
      data={data}
      onSelect={handleSelect}
      onAdd={handleAdd}
      onDelete={handleDelete}
    />
  );
}

// ─── MATERI PICKER ──────────────────────────────────────────────────────────

function MateriPicker({ instrument, value, onChange }) {
  const [kategori, setKategori] = useState(null);
  const materiMap = instrument ? MATERI[instrument] : null;

  if (!materiMap) {
    return <div style={{ fontSize:12, color:"var(--color-text-tertiary)", padding:"8px 0" }}>Pilih instrumen dulu.</div>;
  }

  return (
    <div>
      <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:6 }}>Materi latihan</div>
      {!kategori ? (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {Object.keys(materiMap).map(function(kat) {
            const c = KAT_COLORS[kat] || {};
            const active = materiMap[kat].includes(value);
            return (
              <button key={kat} onClick={function() { setKategori(kat); }}
                style={{ textAlign:"left", padding:"9px 12px", fontSize:13, background:active?c.bg:"var(--color-background-secondary)", color:active?c.text:"var(--color-text-primary)", border:"0.5px solid " + (active?"transparent":"var(--color-border-tertiary)"), borderRadius:"var(--border-radius-md)", cursor:"pointer", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontWeight:500 }}>{kat}</span>
                {active && <span style={{ fontSize:11 }}>✓ {value}</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <button onClick={function() { setKategori(null); }}
            style={{ fontSize:12, color:"var(--color-text-secondary)", background:"none", border:"none", cursor:"pointer", padding:"0 0 8px" }}>
            ← {kategori}
          </button>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {materiMap[kategori].map(function(item) {
              return (
                <button key={item} onClick={function() { onChange(item); setKategori(null); }}
                  style={{ textAlign:"left", padding:"8px 12px", fontSize:13, background:value===item?"var(--color-background-info)":"var(--color-background-secondary)", color:value===item?"var(--color-text-info)":"var(--color-text-primary)", border:"0.5px solid " + (value===item?"var(--color-border-info)":"var(--color-border-tertiary)"), borderRadius:"var(--border-radius-md)", cursor:"pointer" }}>
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TIMER TAB ───────────────────────────────────────────────────────────────

function TimerTab({ profile, updateProfile }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [instrument, setInstrument] = useState("");
  const [currentMateri, setCurrentMateri] = useState("");
  const [materiStart, setMateriStart] = useState(0);
  const [segments, setSegments] = useState([]);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [showMateriPicker, setShowMateriPicker] = useState(false);
  const tickRef = useRef(null);
  const startRef = useRef(null);

  useEffect(function() {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000;
      tickRef.current = setInterval(function() {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 500);
    } else {
      clearInterval(tickRef.current);
    }
    return function() { clearInterval(tickRef.current); };
  }, [running]);

  function handleStart() {
    if (!instrument) return;
    setSaved(false);
    setMateriStart(elapsed);
    setRunning(true);
  }

  function handleStop() {
    setRunning(false);
    if (currentMateri && elapsed > materiStart) {
      setSegments(function(prev) {
        return prev.concat([{ materi: currentMateri, duration: elapsed - materiStart }]);
      });
      setMateriStart(elapsed);
    }
  }

  function handleGantiMateri(newMateri) {
    if (currentMateri && elapsed > materiStart) {
      setSegments(function(prev) {
        return prev.concat([{ materi: currentMateri, duration: elapsed - materiStart }]);
      });
    }
    setCurrentMateri(newMateri);
    setMateriStart(elapsed);
    setShowMateriPicker(false);
  }

  function handleReset() {
    setRunning(false); setElapsed(0); setSegments([]);
    setCurrentMateri(""); setMateriStart(0); setSaved(false); setNotes("");
  }

  function handleSave() {
    if (!instrument || segments.length === 0) return;
    const newSessions = segments.map(function(seg, i) {
      return {
        id: Date.now() + i, date: todayStr(), instrument: instrument,
        materi: seg.materi, notes: i === 0 ? notes.trim() : "",
        duration: seg.duration,
      };
    });
    updateProfile(function(p) {
      return Object.assign({}, p, { sessions: p.sessions.concat(newSessions) });
    });
    setSaved(true);
    setTimeout(handleReset, 1200);
  }

  const kat = currentMateri ? getKategori(instrument, currentMateri) : null;
  const katColor = kat ? KAT_COLORS[kat] : null;
  const canSave = instrument && segments.length > 0;

  return (
    <div>
      <div style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)", padding:"1rem", marginBottom:"1rem" }}>
        <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:6 }}>Instrumen</div>
        <div style={{ display:"flex", gap:8 }}>
          {INSTRUMENTS.map(function(inst) {
            return (
              <button key={inst} onClick={function() { if (!running) { setInstrument(inst); setCurrentMateri(""); setSegments([]); } }}
                style={{ flex:1, padding:"9px 0", fontSize:13, background:instrument===inst?"var(--color-background-primary)":"transparent", border:"0.5px solid "+(instrument===inst?"var(--color-border-secondary)":"var(--color-border-tertiary)"), borderRadius:"var(--border-radius-md)", cursor:running?"not-allowed":"pointer", color:instrument===inst?"var(--color-text-primary)":"var(--color-text-secondary)", display:"flex", flexDirection:"column", alignItems:"center", gap:2, opacity:running&&instrument!==inst?0.4:1 }}>
                <span style={{ fontSize:20 }}>{INST_ICON[inst]}</span>
                <span style={{ fontSize:11 }}>{inst}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ textAlign:"center", margin:"1.25rem 0" }}>
        <div style={{ fontSize:52, fontWeight:500, letterSpacing:2, color:"var(--color-text-primary)", fontVariantNumeric:"tabular-nums" }}>{formatTime(elapsed)}</div>
        {currentMateri && (
          <div style={{ marginTop:8, display:"inline-block", padding:"4px 12px", borderRadius:"var(--border-radius-md)", background:katColor?katColor.bg:"var(--color-background-secondary)", color:katColor?katColor.text:"var(--color-text-secondary)", fontSize:12 }}>
            {currentMateri}
          </div>
        )}
        {!currentMateri && running && (
          <div style={{ marginTop:8, fontSize:12, color:"var(--color-text-tertiary)" }}>Pilih materi untuk mulai mencatat</div>
        )}
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:"1rem" }}>
        {!running ? (
          <button onClick={handleStart} disabled={!instrument}
            style={{ padding:"10px 28px", background:instrument?"#1D9E75":"var(--color-background-secondary)", color:instrument?"#fff":"var(--color-text-tertiary)", border:"none", borderRadius:"var(--border-radius-md)", fontSize:14, cursor:instrument?"pointer":"not-allowed" }}>Mulai</button>
        ) : (
          <button onClick={handleStop}
            style={{ padding:"10px 28px", background:"var(--color-background-danger)", color:"var(--color-text-danger)", border:"0.5px solid var(--color-border-danger)", borderRadius:"var(--border-radius-md)", fontSize:14, cursor:"pointer" }}>Stop</button>
        )}
        {running && (
          <button onClick={function() { setShowMateriPicker(function(v) { return !v; }); }}
            style={{ padding:"10px 16px", background:"#378ADD", color:"#fff", border:"none", borderRadius:"var(--border-radius-md)", fontSize:13, cursor:"pointer", fontWeight:500 }}>
            Ganti Materi
          </button>
        )}
        <button onClick={handleReset}
          style={{ padding:"10px 16px", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", background:"transparent", color:"var(--color-text-secondary)", fontSize:13, cursor:"pointer" }}>Reset</button>
      </div>

      {showMateriPicker && running && (
        <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-lg)", padding:"1rem", marginBottom:"1rem" }}>
          <div style={{ fontSize:12, fontWeight:500, color:"var(--color-text-primary)", marginBottom:8 }}>Pilih materi berikutnya</div>
          <MateriPicker instrument={instrument} value={currentMateri} onChange={handleGantiMateri} />
        </div>
      )}

      {segments.length > 0 && (
        <div style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)", padding:"1rem", marginBottom:"1rem" }}>
          <div style={{ fontSize:12, fontWeight:500, color:"var(--color-text-secondary)", marginBottom:8 }}>Sesi ini</div>
          {segments.map(function(seg, i) {
            const k = getKategori(instrument, seg.materi);
            const c = k ? KAT_COLORS[k] : null;
            return (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom: i < segments.length-1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
                <div>
                  {k && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:"var(--border-radius-md)", background:c.bg, color:c.text, marginRight:6 }}>{k}</span>}
                  <span style={{ fontSize:13, color:"var(--color-text-primary)" }}>{seg.materi}</span>
                </div>
                <span style={{ fontSize:13, fontWeight:500, color:"#1D9E75", flexShrink:0, marginLeft:8 }}>{formatTime(seg.duration)}</span>
              </div>
            );
          })}
          {currentMateri && running && (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", marginTop:4, opacity:0.6 }}>
              <span style={{ fontSize:12, color:"var(--color-text-secondary)", fontStyle:"italic" }}>{currentMateri} (berjalan...)</span>
              <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{formatTime(elapsed - materiStart)}</span>
            </div>
          )}
        </div>
      )}

      {!running && segments.length === 0 && instrument && (
        <div style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)", padding:"1rem", marginBottom:"1rem" }}>
          <MateriPicker instrument={instrument} value={currentMateri} onChange={function(m) { setCurrentMateri(m); }} />
        </div>
      )}

      <div style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)", padding:"1rem", display:"flex", flexDirection:"column", gap:10 }}>
        <div>
          <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>Catatan sesi</div>
          <input value={notes} onChange={function(e) { setNotes(e.target.value); }} placeholder="Progress, kendala..." style={{ width:"100%", boxSizing:"border-box" }} />
        </div>
        <button onClick={handleSave} disabled={!canSave}
          style={{ padding:"10px", fontSize:13, fontWeight:500, background:canSave?"#1D9E75":"var(--color-background-secondary)", color:canSave?"#fff":"var(--color-text-tertiary)", border:"none", borderRadius:"var(--border-radius-md)", cursor:canSave?"pointer":"not-allowed" }}>
          {saved ? "Tersimpan!" : "Simpan Sesi"}
        </button>
      </div>
    </div>
  );
}

// ─── METRONOME TAB ───────────────────────────────────────────────────────────

function MetronomeTab() {
  const [bpm, setBpm] = useState(80);
  const [beat, setBeat] = useState(4);
  const [volume, setVolume] = useState(0.8);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(-1);
  const [tapTimes, setTapTimes] = useState([]);
  const timerRef = useRef(null);
  const ctxRef = useRef(null);

  function playClick(accent) {
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      osc.frequency.value = accent ? 1200 : 800;
      const compressor = ctx.createDynamicsCompressor();
      gain.connect(compressor); compressor.connect(ctx.destination);
      gain.gain.setValueAtTime(accent ? volume * 3 : volume * 2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    } catch(e) {}
  }

  useEffect(function() {
    if (running) {
      let cur = 0;
      playClick(true); setTick(0);
      timerRef.current = setInterval(function() {
        cur = (cur + 1) % beat;
        setTick(cur);
        playClick(cur === 0);
      }, (60 / bpm) * 1000);
    } else {
      clearInterval(timerRef.current);
      setTick(-1);
    }
    return function() { clearInterval(timerRef.current); };
  }, [running, bpm, beat]);

  function handleTap() {
    const now = Date.now();
    const times = tapTimes.concat([now]).slice(-6);
    setTapTimes(times);
    if (times.length >= 2) {
      const diffs = times.slice(1).map(function(t, i) { return t - times[i]; });
      const avg = diffs.reduce(function(a, b) { return a + b; }) / diffs.length;
      setBpm(Math.round(60000 / avg));
    }
  }

  return (
    <div>
      <div style={{ textAlign:"center", margin:"1.5rem 0" }}>
        <div style={{ fontSize:56, fontWeight:500, color:"var(--color-text-primary)", lineHeight:1 }}>{bpm}</div>
        <div style={{ fontSize:13, color:"var(--color-text-secondary)", marginTop:4 }}>BPM</div>
      </div>
      <div style={{ margin:"0 0 1.25rem" }}>
        <input type="range" min={30} max={240} step={1} value={bpm} onChange={function(e) { setBpm(+e.target.value); }} style={{ width:"100%" }} />
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--color-text-tertiary)" }}><span>30</span><span>240</span></div>
      </div>
      <div style={{ margin:"0 0 1.25rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>
          <span>Volume</span><span>{Math.round(volume * 100)}%</span>
        </div>
        <input type="range" min={0.1} max={1.5} step={0.05} value={volume} onChange={function(e) { setVolume(+e.target.value); }} style={{ width:"100%" }} />
      </div>
      <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:"1.5rem" }}>
        {Array.from({ length: beat }).map(function(_, i) {
          return (
            <div key={i} style={{ width:40, height:40, borderRadius:"50%", background:tick===i?(i===0?"#1D9E75":"#378ADD"):"var(--color-background-secondary)", border:"0.5px solid " + (tick===i?"transparent":"var(--color-border-tertiary)"), transition:"background 0.05s" }} />
          );
        })}
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:"1rem", alignItems:"center" }}>
        <div style={{ fontSize:13, color:"var(--color-text-secondary)", whiteSpace:"nowrap" }}>Ketukan:</div>
        {[2,3,4,6].map(function(b) {
          return (
            <button key={b} onClick={function() { setBeat(b); }}
              style={{ flex:1, padding:"7px", fontSize:13, background:beat===b?"var(--color-background-info)":"transparent", color:beat===b?"var(--color-text-info)":"var(--color-text-secondary)", border:"0.5px solid " + (beat===b?"var(--color-border-info)":"var(--color-border-tertiary)"), borderRadius:"var(--border-radius-md)", cursor:"pointer" }}>
              {b}/4
            </button>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={function() { setRunning(function(r) { return !r; }); }}
          style={{ flex:2, padding:"11px", fontSize:14, fontWeight:500, background:running?"var(--color-background-danger)":"#1D9E75", color:running?"var(--color-text-danger)":"#fff", border:running?"0.5px solid var(--color-border-danger)":"none", borderRadius:"var(--border-radius-md)", cursor:"pointer" }}>
          {running ? "Stop" : "Start"}
        </button>
        <button onClick={handleTap}
          style={{ flex:1, padding:"11px", fontSize:13, border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", background:"transparent", color:"var(--color-text-secondary)", cursor:"pointer" }}>
          Tap
        </button>
      </div>
      <div style={{ marginTop:"1.5rem", display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {[60,80,100,120,140,160].map(function(b) {
          return (
            <button key={b} onClick={function() { setBpm(b); }}
              style={{ padding:"8px", fontSize:12, border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-md)", background:bpm===b?"var(--color-background-secondary)":"transparent", color:"var(--color-text-secondary)", cursor:"pointer" }}>
              {b} bpm
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── LOG TAB ─────────────────────────────────────────────────────────────────

function LogTab({ profile, updateProfile }) {
  const sessions = profile.sessions.slice().reverse();

  function handleDelete(id) {
    updateProfile(function(p) {
      return Object.assign({}, p, { sessions: p.sessions.filter(function(s) { return s.id !== id; }) });
    });
  }

  if (!sessions.length) {
    return <div style={{ textAlign:"center", padding:"3rem 0", color:"var(--color-text-tertiary)", fontSize:14 }}>Belum ada sesi latihan.</div>;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {sessions.map(function(s) {
        const kat = getKategori(s.instrument, s.materi);
        const c = kat ? KAT_COLORS[kat] : null;
        return (
          <div key={s.id} style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"0.85rem 1rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:18 }}>{INST_ICON[s.instrument] || "🎵"}</span>
                  <span style={{ fontWeight:500, fontSize:15, color:"var(--color-text-primary)" }}>{s.instrument}</span>
                </div>
                {kat && <div style={{ display:"inline-block", marginTop:4, fontSize:11, padding:"2px 8px", borderRadius:"var(--border-radius-md)", background:c.bg, color:c.text }}>{kat}</div>}
                {s.materi && <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginTop:4 }}>{s.materi}</div>}
                {s.notes && <div style={{ fontSize:12, color:"var(--color-text-tertiary)", marginTop:2 }}>{s.notes}</div>}
              </div>
              <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                <div style={{ fontSize:14, fontWeight:500, color:"#1D9E75" }}>{formatTime(s.duration)}</div>
                <div style={{ fontSize:11, color:"var(--color-text-tertiary)", marginTop:2 }}>{s.date}</div>
              </div>
            </div>
            <button onClick={function() { handleDelete(s.id); }} style={{ marginTop:8, fontSize:11, color:"var(--color-text-tertiary)", background:"none", border:"none", cursor:"pointer", padding:0 }}>Hapus</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── PROGRESS TAB ────────────────────────────────────────────────────────────

function ProgressTab({ profile, updateProfile }) {
  const [editTarget, setEditTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(Math.round(profile.weeklyTarget / 60)));
  const sessions = profile.sessions;
  const weekKey = getWeekKey(todayStr());
  const weekSessions = sessionsInWeek(sessions, weekKey);
  const weekTotal = weekSessions.reduce(function(a,s) { return a + s.duration; }, 0);
  const totalAll = sessions.reduce(function(a,s) { return a + s.duration; }, 0);
  const todaySecs = sessions.filter(function(s) { return s.date === todayStr(); }).reduce(function(a,s) { return a + s.duration; }, 0);

  const streak = (function() {
    const days = [];
    const seen = {};
    sessions.forEach(function(s) { if (!seen[s.date]) { seen[s.date]=true; days.push(s.date); } });
    days.sort().reverse();
    if (!days.length) return 0;
    let count = 0, cur = new Date();
    for (let i = 0; i < days.length; i++) {
      const diff = Math.round((cur - new Date(days[i])) / 86400000);
      if (diff <= 1) { count++; cur = new Date(days[i]); } else break;
    }
    return count;
  })();

  const pct = Math.min(100, Math.round((weekTotal / profile.weeklyTarget) * 100));

  const byKatInst = {};
  sessions.forEach(function(s) {
    const key = s.instrument + "|" + (getKategori(s.instrument, s.materi) || "Lainnya");
    byKatInst[key] = (byKatInst[key] || 0) + s.duration;
  });

  function saveTarget() {
    const m = parseInt(targetInput) || 60;
    updateProfile(function(p) { return Object.assign({}, p, { weeklyTarget: m * 60 }); });
    setEditTarget(false);
  }

  const stats = [
    { label:"Hari ini", val:formatTime(todaySecs) },
    { label:"Streak", val:streak + " hari" },
    { label:"Minggu ini", val:formatTime(weekTotal) },
    { label:"Total", val:formatTime(totalAll) },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {stats.map(function(c) {
          return (
            <div key={c.label} style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:"0.85rem" }}>
              <div style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{c.label}</div>
              <div style={{ fontSize:22, fontWeight:500, marginTop:4, color:"var(--color-text-primary)" }}>{c.val}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)" }}>Target mingguan</div>
          {!editTarget ? (
            <button onClick={function() { setEditTarget(true); }} style={{ fontSize:12, color:"var(--color-text-info)", background:"none", border:"none", cursor:"pointer" }}>Ubah</button>
          ) : (
            <div style={{ display:"flex", gap:6, alignItems:"center" }}>
              <input value={targetInput} onChange={function(e) { setTargetInput(e.target.value); }} style={{ width:50, textAlign:"center" }} />
              <span style={{ fontSize:12, color:"var(--color-text-secondary)" }}>menit</span>
              <button onClick={saveTarget} style={{ fontSize:12, color:"#1D9E75", background:"none", border:"none", cursor:"pointer" }}>Simpan</button>
            </div>
          )}
        </div>
        <div style={{ height:8, background:"var(--color-background-secondary)", borderRadius:4 }}>
          <div style={{ width:pct+"%", height:"100%", background:"#1D9E75", borderRadius:4, transition:"width 0.4s" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--color-text-secondary)", marginTop:6 }}>
          <span>{formatTime(weekTotal)}</span>
          <span>{pct}% dari {Math.round(profile.weeklyTarget/60)} menit</span>
        </div>
      </div>

      {Object.keys(byKatInst).length > 0 && (
        <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", padding:"1rem" }}>
          <div style={{ fontSize:14, fontWeight:500, color:"var(--color-text-primary)", marginBottom:12 }}>Breakdown latihan</div>
          {Object.entries(byKatInst).sort(function(a,b) { return b[1]-a[1]; }).map(function(entry) {
            const key = entry[0], sec = entry[1];
            const parts = key.split("|");
            const inst = parts[0], kat = parts[1];
            const p = Math.round((sec / totalAll) * 100);
            const c = KAT_COLORS[kat];
            return (
              <div key={key} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:4, alignItems:"center" }}>
                  <span style={{ color:"var(--color-text-primary)", display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ fontSize:14 }}>{INST_ICON[inst] || "🎵"}</span>{inst} — {kat}
                  </span>
                  <span style={{ color:"var(--color-text-secondary)" }}>{formatTime(sec)} ({p}%)</span>
                </div>
                <div style={{ height:6, background:"var(--color-background-secondary)", borderRadius:3 }}>
                  <div style={{ width:p+"%", height:"100%", background:c?c.bar:"#888780", borderRadius:3 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── REPORT TAB ──────────────────────────────────────────────────────────────

function ReportTab({ profile }) {
  const weeks = getWeeksWithSessions(profile.sessions);
  const [selectedWeek, setSelectedWeek] = useState(weeks[0] || getWeekKey(todayStr()));

  const curSessions = sessionsInWeek(profile.sessions, selectedWeek);
  const prevSessions = sessionsInWeek(profile.sessions, prevWeekStr(selectedWeek));
  const curTotal = curSessions.reduce(function(a,s) { return a + s.duration; }, 0);
  const prevTotal = prevSessions.reduce(function(a,s) { return a + s.duration; }, 0);
  const diff = curTotal - prevTotal;

  const days = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
  const mon = new Date(selectedWeek);
  const dayTotals = days.map(function(_, i) {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    const ds = d.toISOString().split("T")[0];
    return curSessions.filter(function(s) { return s.date === ds; }).reduce(function(a,s) { return a + s.duration; }, 0);
  });
  const maxDay = Math.max.apply(null, dayTotals.concat([1]));

  function printReport() {
    const dateNow = new Date().toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" });
    const weekLabel = getWeekLabel(selectedWeek);
    const diffText = diff === 0 ? "Sama dengan minggu sebelumnya" : diff > 0 ? "Naik " + formatMin(Math.abs(diff)) + " dari minggu sebelumnya" : "Turun " + formatMin(Math.abs(diff)) + " dari minggu sebelumnya";

    const rows = curSessions.map(function(s) {
      return "<tr><td>" + s.date + "</td><td>" + (INST_ICON[s.instrument]||"") + " " + s.instrument + "</td><td>" + (getKategori(s.instrument,s.materi)||"-") + "</td><td>" + (s.materi||"-") + "</td><td>" + formatTime(s.duration) + "</td><td>" + (s.notes||"-") + "</td></tr>";
    }).join("");

    const barChart = dayTotals.map(function(sec, i) {
      const p = Math.round((sec / maxDay) * 80);
      return "<div style='display:flex;align-items:center;gap:8px;margin-bottom:6px;'><div style='width:28px;font-size:11px;color:#666;'>" + days[i] + "</div><div style='flex:1;background:#f0f0f0;border-radius:3px;height:18px;'><div style='width:" + p + "%;background:#1D9E75;height:100%;border-radius:3px;'></div></div><div style='width:50px;font-size:11px;color:#444;text-align:right;'>" + (sec > 0 ? formatMin(sec) : "-") + "</div></div>";
    }).join("");

    const html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Laporan Latihan - " + profile.name + "</title><style>body{font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:32px;color:#222;font-size:13px;}h1{font-size:20px;font-weight:600;margin:0 0 4px;}.sub{color:#666;font-size:13px;margin-bottom:24px;}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;}.card{background:#f8f8f8;border-radius:8px;padding:12px 16px;}.card-label{font-size:11px;color:#888;margin-bottom:4px;}.card-val{font-size:20px;font-weight:600;}.diff{font-size:12px;margin-bottom:24px;padding:8px 12px;background:#f0fdf4;border-left:3px solid #1D9E75;color:#333;}table{width:100%;border-collapse:collapse;margin-bottom:24px;}th{background:#f8f8f8;padding:8px 10px;text-align:left;font-size:11px;color:#666;font-weight:600;border-bottom:1px solid #eee;}td{padding:8px 10px;border-bottom:1px solid #f0f0f0;font-size:12px;vertical-align:top;}.notes-box{border:1px solid #ddd;border-radius:8px;padding:16px;min-height:80px;}.notes-label{font-size:11px;color:#888;margin-bottom:8px;font-weight:600;}.footer{margin-top:32px;font-size:11px;color:#aaa;text-align:center;}@media print{body{padding:16px;}}</style></head><body><h1>Laporan Latihan Musik</h1><div class='sub'>" + profile.name + " &nbsp;·&nbsp; " + weekLabel + " &nbsp;·&nbsp; Dicetak " + dateNow + "</div><div class='grid'><div class='card'><div class='card-label'>Total latihan</div><div class='card-val'>" + formatMin(curTotal) + "</div></div><div class='card'><div class='card-label'>Jumlah sesi</div><div class='card-val'>" + curSessions.length + "</div></div><div class='card'><div class='card-label'>Minggu sebelumnya</div><div class='card-val'>" + formatMin(prevTotal) + "</div></div></div><div class='diff'>" + diffText + "</div><div style='margin-bottom:24px;'><div style='font-size:12px;font-weight:600;margin-bottom:10px;color:#444;'>Durasi per hari</div>" + barChart + "</div>" + (curSessions.length > 0 ? "<table><thead><tr><th>Tanggal</th><th>Instrumen</th><th>Kategori</th><th>Materi</th><th>Durasi</th><th>Catatan</th></tr></thead><tbody>" + rows + "</tbody></table>" : "<p style='color:#999;font-size:13px;'>Tidak ada sesi di minggu ini.</p>") + "<div class='notes-box'><div class='notes-label'>Catatan Guru</div><div style='color:#ccc;font-size:12px;font-style:italic;'>(tulis tangan setelah print)</div></div><div class='footer'>Music Practice Tracker &nbsp;·&nbsp; " + profile.name + "</div></body></html>";

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Laporan_" + profile.name.replace(/\s+/g,"_") + "_" + selectedWeek + ".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ marginBottom:"1rem" }}>
        <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:6 }}>Pilih minggu</div>
        {weeks.length === 0 ? (
          <div style={{ fontSize:13, color:"var(--color-text-tertiary)", padding:"1rem 0" }}>Belum ada sesi untuk di-report.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {weeks.map(function(w) {
              const wSessions = sessionsInWeek(profile.sessions, w);
              const wTotal = wSessions.reduce(function(a,s) { return a + s.duration; }, 0);
              return (
                <button key={w} onClick={function() { setSelectedWeek(w); }}
                  style={{ textAlign:"left", padding:"10px 14px", fontSize:13, background:selectedWeek===w?"var(--color-background-info)":"var(--color-background-secondary)", color:selectedWeek===w?"var(--color-text-info)":"var(--color-text-primary)", border:"0.5px solid " + (selectedWeek===w?"var(--color-border-info)":"var(--color-border-tertiary)"), borderRadius:"var(--border-radius-md)", cursor:"pointer" }}>
                  {getWeekLabel(w)}
                  <span style={{ marginLeft:8, fontSize:11, color:selectedWeek===w?"var(--color-text-info)":"var(--color-text-tertiary)" }}>
                    {wSessions.length} sesi · {formatMin(wTotal)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {weeks.length > 0 && (
        <div>
          <div style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-lg)", padding:"1rem", marginBottom:"1rem" }}>
            <div style={{ fontSize:13, fontWeight:500, color:"var(--color-text-primary)", marginBottom:10 }}>{getWeekLabel(selectedWeek)}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
              <div style={{ background:"var(--color-background-primary)", borderRadius:"var(--border-radius-md)", padding:"10px" }}>
                <div style={{ fontSize:11, color:"var(--color-text-secondary)" }}>Total</div>
                <div style={{ fontSize:18, fontWeight:500, color:"var(--color-text-primary)", marginTop:2 }}>{formatMin(curTotal)}</div>
              </div>
              <div style={{ background:"var(--color-background-primary)", borderRadius:"var(--border-radius-md)", padding:"10px" }}>
                <div style={{ fontSize:11, color:"var(--color-text-secondary)" }}>vs minggu lalu</div>
                <div style={{ fontSize:18, fontWeight:500, color:diff>=0?"#1D9E75":"var(--color-text-danger)", marginTop:2 }}>
                  {diff === 0 ? "=" : (diff > 0 ? "+" : "") + formatMin(diff)}
                </div>
              </div>
            </div>
            <div style={{ marginBottom:8, fontSize:12, fontWeight:500, color:"var(--color-text-secondary)" }}>Durasi per hari</div>
            {days.map(function(d, i) {
              return (
                <div key={d} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                  <div style={{ width:28, fontSize:11, color:"var(--color-text-tertiary)" }}>{d}</div>
                  <div style={{ flex:1, background:"var(--color-background-tertiary)", borderRadius:3, height:14 }}>
                    <div style={{ width:Math.round((dayTotals[i]/maxDay)*100)+"%", background:"#1D9E75", height:"100%", borderRadius:3 }} />
                  </div>
                  <div style={{ width:52, fontSize:11, color:"var(--color-text-secondary)", textAlign:"right" }}>{dayTotals[i]>0?formatMin(dayTotals[i]):"-"}</div>
                </div>
              );
            })}
          </div>
          <button onClick={printReport}
            style={{ width:"100%", padding:"12px", background:"#1D9E75", color:"#fff", border:"none", borderRadius:"var(--border-radius-lg)", fontSize:14, fontWeight:500, cursor:"pointer" }}>
            Cetak / Export PDF
          </button>
        </div>
      )}
    </div>
  );
}
