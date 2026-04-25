import { useState, useRef, useEffect } from "react";

// ── Brand ────────────────────────────────────────────────────────────────────
const LIGHT = { dark:"#1C1410",amber:"#C97B2A",warm:"#E8A44A",cream:"#FAF3E8",mist:"#F0E8D8",ink:"#2D2017",soft:"#7A6652",border:"#DDD0BC",bg:"#FAF3E8" };
const DARK  = { dark:"#FAF3E8",amber:"#C97B2A",warm:"#E8A44A",cream:"#1C1410",mist:"#231A13",ink:"#F0E8D8",soft:"#C4A882",border:"#3D2E22",bg:"#141008" };
let C = { ...LIGHT };

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { zoom: 1.5; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; transition: background 0.3s ease; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse { 0%,100%{opacity:.4;transform:scale(.95);}50%{opacity:1;transform:scale(1.05);} }
  .fade-up { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
  .fade-in { animation: fadeIn 0.35s ease both; }
  textarea,input[type=text],input[type=email],input[type=tel],input[type=number],select {
    font-family:'Plus Jakarta Sans',sans-serif; font-size:16px; color:var(--ink,#2D2017);
    background:var(--mist,#F0E8D8); border:1.5px solid var(--border,#DDD0BC);
    border-radius:12px; padding:13px 16px; width:100%; outline:none;
    transition:border-color .2s,box-shadow .2s,background .3s;
  }
  textarea { resize:none; line-height:1.65; }
  textarea:focus,input:focus,select:focus { border-color:var(--amber,#C97B2A); box-shadow:0 0 0 3px rgba(201,123,42,.1); }
  textarea::placeholder,input::placeholder { color:var(--border,#DDD0BC); }
  button { cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; font-weight:500; }
  ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:var(--cream,#FAF3E8); } ::-webkit-scrollbar-thumb { background:var(--border,#DDD0BC); border-radius:3px; }
`;

// ── UI Atoms ─────────────────────────────────────────────────────────────────
const Lbl = ({children,note}) => (
  <div style={{marginBottom:"8px"}}>
    <label style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:C.soft,letterSpacing:"0.08em",textTransform:"uppercase"}}>{children}</label>
    {note && <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.border,marginLeft:"8px"}}>{note}</span>}
  </div>
);
const Btn = ({children,onClick,disabled,full,small}) => (
  <button onClick={onClick} disabled={disabled}
    style={{background:disabled?C.border:C.amber,color:disabled?C.soft:C.cream,border:"none",borderRadius:"12px",padding:small?"9px 18px":"14px 28px",fontSize:small?"13px":"15px",fontWeight:600,cursor:disabled?"not-allowed":"pointer",boxShadow:disabled?"none":"0 4px 14px rgba(201,123,42,.25)",transition:"all .2s",width:full?"100%":"auto",minHeight:small?"36px":"48px"}}
    onMouseEnter={e=>{if(!disabled){e.currentTarget.style.background=C.warm;e.currentTarget.style.transform="translateY(-1px)";}}}
    onMouseLeave={e=>{if(!disabled){e.currentTarget.style.background=C.amber;e.currentTarget.style.transform="translateY(0)";}}}>{children}</button>
);
const Ghost = ({children,onClick,small}) => (
  <button onClick={onClick} style={{background:"transparent",color:C.soft,border:"1.5px solid "+C.border,borderRadius:"12px",padding:small?"8px 16px":"13px 22px",fontSize:small?"12px":"14px",transition:"all .2s"}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=C.soft;e.currentTarget.style.color=C.ink;}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.soft;}}>{children}</button>
);
const Pulse = ({msg}) => (
  <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 0"}}>
    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:C.amber,animation:"pulse 1.4s ease-in-out infinite",flexShrink:0}}/>
    <span style={{fontSize:"13px",color:C.soft,fontStyle:"italic"}}>{msg||"One moment…"}</span>
  </div>
);
const SectionCard = ({children,style}) => (
  <div style={{background:C.mist,border:"1.5px solid "+C.border,borderRadius:"16px",padding:"22px 24px",...style}}>{children}</div>
);
const SectionTitle = ({children}) => (
  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.amber,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:"16px"}}>{children}</div>
);

function useIsMobile() {
  const [m,setM] = useState(()=>window.innerWidth<768);
  useEffect(()=>{const fn=()=>setM(window.innerWidth<768);window.addEventListener("resize",fn,{passive:true});return()=>window.removeEventListener("resize",fn);},[]);
  return m;
}
function useRazorpay() {
  const [loaded,setLoaded] = useState(false);
  useEffect(()=>{if(window.Razorpay){setLoaded(true);return;}const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=()=>setLoaded(true);document.body.appendChild(s);},[]);
  return loaded;
}

// ── Voice Input Component ────────────────────────────────────────────────────
function VoiceInput({ value, onChange, placeholder, rows=4, onlyVoice=false, muted=false }) {
  const [phase, setPhase] = useState(null); // null | recording | playback
  const [liveText, setLiveText] = useState("");
  const [interim, setInterim] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [showType, setShowType] = useState(false);
  const recognitionRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const finalRef = useRef(value || "");
  const supported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // preferred Indian voice ref — load once
  const voiceRef = useRef(null);
  useEffect(() => {
    const pick = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      if (voiceRef.current?.lang === "en-IN") return;
      voiceRef.current = voices.find(v => v.lang === "en-IN")
        || voices.find(v => v.name.includes("Rishi") || v.name.includes("Neel") || v.name.includes("Veena"))
        || voices.find(v => v.lang.startsWith("en")) || null;
    };
    pick();
    window.speechSynthesis?.addEventListener("voiceschanged", pick);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", pick);
  }, []);

  const startRecording = async () => {
    window.speechSynthesis?.cancel();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    finalRef.current = value || "";
    chunksRef.current = [];

    const recognition = new SR();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-US";
    recognition.onresult = (e) => {
      let interimT = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current = (finalRef.current + " " + e.results[i][0].transcript).trim();
        else interimT += e.results[i][0].transcript;
      }
      setLiveText(finalRef.current);
      setInterim(interimT);
      onChange(finalRef.current + (interimT ? " " + interimT : ""));
    };
    recognition.onend = () => { setInterim(""); };
    recognitionRef.current = recognition;

    if (window.MediaRecorder && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setAudioUrl(URL.createObjectURL(blob));
          stream.getTracks().forEach(t => t.stop());
        };
        mediaRef.current = mr;
        mr.start();
      } catch {}
    }

    recognition.start();
    setPhase("recording"); setLiveText(finalRef.current); setInterim("");
  };

  const stopRecording = () => {
    try { recognitionRef.current?.stop(); } catch {}
    if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    else setAudioUrl(null);
    onChange(finalRef.current);
    setPhase("playback"); setInterim("");
  };

  const reRecord = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null); setPhase(null); setLiveText(""); onChange("");
    finalRef.current = "";
  };

  const playback = () => { if (audioUrl) { const a = new Audio(audioUrl); a.play(); } };

  if (!supported) {
    return <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{minHeight: rows*24+"px"}}/>;
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      {/* Recording state */}
      {phase === "recording" && (
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <div style={{background:C.cream,border:"1.5px solid "+C.amber,borderRadius:"12px",padding:"14px 16px",minHeight:"80px"}}>
            <p style={{fontSize:"14px",color:C.ink,lineHeight:1.65}}>{liveText}<span style={{color:C.soft,fontStyle:"italic"}}>{interim?" "+interim:""}</span></p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{display:"flex",gap:"3px",alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:"3px",borderRadius:"2px",background:C.amber,animation:`pulse 1.2s ease ${i*.2}s infinite`,height:`${8+i*3}px`}}/>)}
            </div>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.soft}}>Still listening…</span>
            <button onClick={stopRecording} style={{marginLeft:"auto",background:"#c0392b",color:"#fff",border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"12px",fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:"6px"}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>Stop
            </button>
          </div>
        </div>
      )}

      {/* Playback state */}
      {phase === "playback" && (
        <div style={{background:C.mist,border:"1.5px solid "+C.amber,borderRadius:"12px",padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",color:C.amber,letterSpacing:"0.1em",textTransform:"uppercase"}}>Recorded ✓</span>
            <div style={{display:"flex",gap:"8px"}}>
              {audioUrl && <button onClick={playback} style={{background:"transparent",color:C.amber,border:"1px solid "+C.amber,borderRadius:"7px",padding:"5px 12px",fontSize:"12px",cursor:"pointer"}}>▶ Play back</button>}
              <button onClick={reRecord} style={{background:"transparent",color:C.soft,border:"1px solid "+C.border,borderRadius:"7px",padding:"5px 10px",fontSize:"11px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>Re-record</button>
            </div>
          </div>
          <p style={{fontSize:"13px",color:C.ink,lineHeight:1.65}}>{value}</p>
        </div>
      )}

      {/* Idle — big mic button */}
      {!phase && (
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          <button onClick={startRecording} style={{background:C.amber,border:"none",borderRadius:"14px",padding:"20px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",width:"100%",boxShadow:"0 4px 14px rgba(201,123,42,.25)",transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.warm;e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.amber;e.currentTarget.style.transform="translateY(0)";}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FAF3E8" strokeWidth="1.8" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            <span style={{fontSize:"14px",fontWeight:600,color:"#FAF3E8"}}>{placeholder || "Speak your answer"}</span>
          </button>
          {!showType && (
            <button onClick={()=>setShowType(true)} style={{background:"transparent",border:"none",fontSize:"12px",color:C.soft,cursor:"pointer",textDecoration:"underline",textAlign:"center"}}>Prefer to type?</button>
          )}
        </div>
      )}

      {/* Typing fallback */}
      {showType && !phase && (
        <div className="fade-in">
          <textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{minHeight:rows*28+"px"}}/>
        </div>
      )}
    </div>
  );
}

// ── Repeatable block controls ────────────────────────────────────────────────
const AddBtn = ({label,onClick}) => (
  <button onClick={onClick} style={{background:"transparent",color:C.amber,border:"1.5px dashed "+C.amber,borderRadius:"10px",padding:"10px 20px",fontSize:"13px",cursor:"pointer",width:"100%",transition:"all .2s"}}
    onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,123,42,.06)";}}
    onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>+ {label}</button>
);
const RemoveBtn = ({onClick}) => (
  <button onClick={onClick} style={{background:"transparent",color:C.border,border:"none",fontSize:"12px",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}
    onMouseEnter={e=>e.currentTarget.style.color="#c0392b"}
    onMouseLeave={e=>e.currentTarget.style.color=C.border}>Remove</button>
);

// ── buildResumeHTML (shared with rewriter) ───────────────────────────────────
function buildResumeHTML(resume, cl=0) {
  const h = resume;
  const fs=cl===1?"8.5pt":cl===2?"9.5pt":"10.5pt", fsS=cl===1?"7.5pt":cl===2?"8.5pt":"9.5pt";
  const lh=cl===1?"1.2":cl===2?"1.4":"1.5", mbR=cl===1?"3pt":cl===2?"7pt":"12pt";
  const mbSH=cl===1?"3pt":cl===2?"8pt":"14pt", padP=cl===1?"12pt 18pt":cl===2?"22pt 28pt":"36pt 40pt";
  const padPr=cl===1?"8pt 14pt":cl===2?"16pt 22pt":"24pt 28pt";
  const sH = (t) => `<div style="margin-top:${mbSH};margin-bottom:3pt;border-bottom:1pt solid #2D2017;padding-bottom:1pt;"><span style="font-size:9pt;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#2D2017;">${t}</span></div>`;
  const rExp = () => (h.experience||[]).map(r=>`<div style="margin-bottom:${mbR};"><div style="display:flex;justify-content:space-between;margin-bottom:2pt;"><strong style="font-size:${fs};">${r.company}</strong><span style="font-size:${fsS};color:#555;">${r.startDate}–${r.endDate}|${r.location}</span></div><em style="font-size:${fsS};color:#555;">${r.title}</em><ul style="margin:2pt 0 0;padding-left:14pt;">${(r.bullets||[]).map(b=>`<li style="font-size:${fs};line-height:${lh};margin-bottom:1pt;">${b}</li>`).join("")}</ul></div>`).join("");
  const rEdu = () => (h.education||[]).map(e=>`<div style="display:flex;justify-content:space-between;margin-bottom:3pt;"><div><strong style="font-size:${fs};">${e.degree}</strong>, <em style="font-size:${fsS};">${e.institution}</em></div><span style="font-size:${fsS};color:#555;">${e.endYear}</span></div>`).join("");
  const rCerts = () => (h.certifications||[]).map(c=>`<div style="display:flex;justify-content:space-between;margin-bottom:3pt;"><div><strong style="font-size:${fs};">${c.name}</strong>, <em style="font-size:${fsS};">${c.provider}</em></div><span style="font-size:${fsS};color:#555;">${c.year}</span></div>`).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${h.name||"Resume"}</title><style>*{box-sizing:border-box;}body{font-family:Calibri,Georgia,serif;font-size:${fs};color:#2D2017;margin:0;padding:0;}.page{max-width:680px;margin:0 auto;padding:${padP};}ul{margin:0;padding:0;}@page{size:A4;margin:0;}@media print{.no-print{display:none!important;}.page{padding:${padPr};}}</style></head><body><div class="page"><div class="no-print" style="text-align:right;margin-bottom:8pt;"><button onclick="window.print()" style="background:#C97B2A;color:white;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:12px;">Print / PDF</button></div><div style="text-align:center;margin-bottom:10pt;"><div style="font-size:16pt;font-weight:700;color:#1C1410;">${h.name||""}</div><div style="font-size:10pt;color:#C97B2A;margin-top:2pt;">${h.tagline||""}</div><div style="font-size:8pt;color:#555;margin-top:4pt;display:flex;justify-content:center;gap:10pt;flex-wrap:wrap;">${[h.contact?.email,h.contact?.phone,h.contact?.location,h.contact?.linkedin].filter(Boolean).map(v=>`<span>${v}</span>`).join("")}</div></div>${h.summary?`${sH("Profile Summary")}<p style="font-size:${fs};line-height:1.6;margin:0;">${h.summary}</p>`:""}${(h.competencies||[]).length?`${sH("Core Competencies")}<div style="font-size:${fs};line-height:1.6;">${h.competencies.join(" · ")}</div>`:""}${(h.education||[]).length?`${sH("Education")}${rEdu()}`:""}${(h.experience||[]).length?`${sH("Employment History")}${rExp()}`:""}${(h.certifications||[]).length?`${sH("Courses / Certifications")}${rCerts()}`:""}${(h.languages||[]).length?`${sH("Languages")}<div style="font-size:${fs};">${h.languages.map(l=>`<strong>${l.language}:</strong> ${l.level}`).join(" · ")}</div>`:""}</div></body></html>`;
}

// ── Main App ──────────────────────────────────────────────────────────────────
const SESSION_KEY = "tcb_builder_v1";

export default function App() {
  const isMobile = useIsMobile();
  const razorpayLoaded = useRazorpay();
  const topRef = useRef(null);

  // Theme
  const [isDark,setIsDark] = useState(()=>{ try{const t=localStorage.getItem("tcb_theme");return t===null?true:t==="dark";}catch{return true;} });
  const themeColors = isDark?DARK:LIGHT;
  Object.assign(C, themeColors);
  const toggleTheme = ()=>setIsDark(d=>{const n=!d;try{localStorage.setItem("tcb_theme",n?"dark":"light");}catch{}return n;});
  useEffect(()=>{ document.body.style.background=themeColors.bg; },[isDark]);
  const cssVars = `:root{--ink:${themeColors.ink};--mist:${themeColors.mist};--border:${themeColors.border};--cream:${themeColors.cream};--soft:${themeColors.soft};--amber:${themeColors.amber};}body{color:${themeColors.ink};}`;

  // Restore session
  const savedSession = (()=>{ try{const r=localStorage.getItem(SESSION_KEY);return r?JSON.parse(r):null;}catch{return null;} })();

  // Pre-fill from URL params (when coming from Brief)
  const urlParams = new URLSearchParams(window.location.search);
  const urlJobTitle = urlParams.get("jobTitle") || "";
  const urlCompany  = urlParams.get("company") || "";

  // State
  const [step, setStep] = useState(savedSession?.step || 0);
  const [formData, setFormData] = useState(savedSession?.formData || {
    name:"", email:"", phone:"", location:"", linkedin:"",
    headline:"", summary:"", summaryVoice:"",
    targetTitle: urlJobTitle, targetCompany: urlCompany, jobDescription:"", forSpecificRole: urlJobTitle?"yes":null,
    experience:[{ company:"", title:"", startDate:"", endDate:"", location:"", voiceText:"", notes:"" }],
    education:[{ degree:"", institution:"", startYear:"", endYear:"", location:"", grade:"" }],
    certifications:[], skills:"", skillsVoice:"",
    languages:[{ language:"", level:"Native" }],
  });
  const [briefData, setBriefData] = useState(savedSession?.briefData || null);
  const [leadId, setLeadId] = useState(savedSession?.leadId || null);
  const [paymentState, setPay] = useState(savedSession?.paymentDone ? "success" : null);
  const [generatedResume, setGeneratedResume] = useState(savedSession?.generatedResume || null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [compactLevel, setCompactLevel] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const briefRef = useRef(null);

  // Persist
  useEffect(()=>{
    if(step>0){
      try{ localStorage.setItem(SESSION_KEY, JSON.stringify({ step, formData, briefData, leadId, paymentDone: paymentState==="success", generatedResume })); }catch{}
    } else {
      try{ localStorage.removeItem(SESSION_KEY); }catch{}
    }
  },[step,formData,briefData,leadId,paymentState,generatedResume]);

  const set = (k,v) => setFormData(p=>({...p,[k]:v}));
  const goTo = (s) => { if(topRef.current) topRef.current.scrollIntoView({behavior:"smooth"}); setTimeout(()=>setStep(s),80); };
  const clearAll = () => { try{localStorage.removeItem(SESSION_KEY);}catch{} setStep(0); setFormData({name:"",email:"",phone:"",location:"",linkedin:"",headline:"",summary:"",summaryVoice:"",targetTitle:"",targetCompany:"",jobDescription:"",experience:[{company:"",title:"",startDate:"",endDate:"",location:"",voiceText:"",notes:""}],education:[{degree:"",institution:"",startYear:"",endYear:"",location:"",grade:""}],certifications:[],skills:"",skillsVoice:"",languages:[{language:"",level:"Native"}]}); setBriefData(null); setLeadId(null); setPay(null); setGeneratedResume(null); };

  // Brief upload
  const handleBriefUpload = async (file) => {
    if(!file||!file.name.endsWith(".html")) return;
    try {
      const text = await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej();r.readAsText(file);});
      const match = text.match(/<script[^>]+id="tcb-brief-data"[^>]*>([\s\S]*?)<\/script>/);
      if(!match) return;
      const parsed = JSON.parse(JSON.parse(match[1]));
      setBriefData(parsed);
      if(parsed.jobTitle&&!formData.targetTitle) set("targetTitle",parsed.jobTitle);
      if(parsed.company&&!formData.targetCompany) set("targetCompany",parsed.company);
      if(parsed.jobDescription&&!formData.jobDescription) set("jobDescription",parsed.jobDescription);
    } catch {}
  };

  // Payment
  const handlePayment = async () => {
    if(!window.Razorpay){
      await new Promise(res=>{const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=res;document.body.appendChild(s);});
    }
    setPay("processing");
    try {
      const or=await fetch("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:formData.email,name:formData.name,jobTitle:formData.targetTitle,company:formData.targetCompany})});
      const order=await or.json();
      if(!or.ok||!order.orderId){setPay("failed");return;}
      const ivRef={current:"processing"};
      new window.Razorpay({
        key:order.keyId,amount:order.amount,currency:order.currency,
        name:"The Career Breweries",
        description:`Resume Build — ${formData.targetTitle||""}`,
        order_id:order.orderId,
        prefill:{email:formData.email},
        theme:{color:C.amber},
        handler:async(response)=>{
          try{
            const vr=await fetch("/api/verify-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({razorpay_order_id:response.razorpay_order_id,razorpay_payment_id:response.razorpay_payment_id,razorpay_signature:response.razorpay_signature,email:formData.email,phone:formData.phone,name:formData.name,jobTitle:formData.targetTitle,company:formData.targetCompany,leadId})});
            const vd=await vr.json();
            if(vr.ok&&vd.success) setPay("success");
            else setPay("failed");
          }catch{setPay("failed");}
        },
        modal:{ondismiss:()=>{if(ivRef.current==="processing")setPay(null);}},
      }).open();
    }catch{setPay("failed");}
  };

  // Generate
  const handleGenerate = async () => {
    setGenerating(true); setGenError("");
    try {
      const res=await fetch("/api/build-resume",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({formData,briefData,jobTitle:formData.forSpecificRole==="yes"?formData.targetTitle:"",company:formData.forSpecificRole==="yes"?formData.targetCompany:"",jobDescription:formData.forSpecificRole==="yes"?formData.jobDescription:""})});
      const d=await res.json();
      if(!res.ok||!d.resume){setGenError(d.error||"Generation failed. Please try again.");setGenerating(false);return;}
      setGeneratedResume(d.resume);
      // Measure for compact level
      const html=buildResumeHTML(d.resume,0);
      const iframe=document.createElement("iframe");
      iframe.style.cssText="position:fixed;top:-9999px;left:-9999px;width:794px;height:5000px;border:none;visibility:hidden;";
      document.body.appendChild(iframe);
      iframe.onload=()=>setTimeout(()=>{
        try{
          const h=iframe.contentDocument?.body?.scrollHeight||0;
          document.body.removeChild(iframe);
          if(h<=1123) setCompactLevel(0);
          else if(h<=1123*1.25) setCompactLevel(1);
          else setCompactLevel(2);
        }catch{try{document.body.removeChild(iframe);}catch{}}
      },100);
      iframe.srcdoc=html;
      setShowPreview(true);
    }catch{setGenError("Something went wrong. Please try again.");}
    setGenerating(false);
  };

  const downloadWord = () => {
    if(!generatedResume) return;
    const blob=new Blob(["\ufeff",buildResumeHTML(generatedResume,compactLevel)],{type:"application/vnd.ms-word"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a");
    a.href=url; a.download="resume.doc"; document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},1000);
  };
  const downloadPDF = () => {
    if(!generatedResume) return;
    const blob=new Blob([buildResumeHTML(generatedResume,compactLevel)],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob); const tab=window.open(url,"_blank");
    if(tab) tab.addEventListener("load",()=>URL.revokeObjectURL(url),{once:true});
  };

  // Helpers for repeatable sections
  const addExp = () => set("experience",[...formData.experience,{company:"",title:"",startDate:"",endDate:"",location:"",voiceText:"",notes:""}]);
  const setExp = (i,k,v) => { const a=[...formData.experience]; a[i]={...a[i],[k]:v}; set("experience",a); };
  const removeExp = (i) => set("experience",formData.experience.filter((_,idx)=>idx!==i));
  const addEdu = () => set("education",[...formData.education,{degree:"",institution:"",startYear:"",endYear:"",location:"",grade:""}]);
  const setEdu = (i,k,v) => { const a=[...formData.education]; a[i]={...a[i],[k]:v}; set("education",a); };
  const removeEdu = (i) => set("education",formData.education.filter((_,idx)=>idx!==i));
  const addCert = () => set("certifications",[...formData.certifications,{name:"",provider:"",year:"",voiceText:""}]);
  const setCert = (i,k,v) => { const a=[...formData.certifications]; a[i]={...a[i],[k]:v}; set("certifications",a); };
  const removeCert = (i) => set("certifications",formData.certifications.filter((_,idx)=>idx!==i));
  const addLang = () => set("languages",[...formData.languages,{language:"",level:"Professional"}]);
  const setLang = (i,k,v) => { const a=[...formData.languages]; a[i]={...a[i],[k]:v}; set("languages",a); };
  const removeLang = (i) => set("languages",formData.languages.filter((_,idx)=>idx!==i));

  const G = (pad="0 24px") => ({ maxWidth:"680px",margin:"0 auto",padding:isMobile?`0 16px`:`${pad}` });

  // ── Header ──────────────────────────────────────────────────────────────────
  const Header = () => (
    <header style={{padding:isMobile?"13px 0":"18px 0",borderBottom:"1px solid "+C.border,marginBottom:isMobile?"28px":"44px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <img src={isDark?"/favicon-dark.png":"/favicon-light.png"} alt="TCB" style={{width:"34px",height:"34px",objectFit:"contain",mixBlendMode:isDark?"normal":"multiply"}}/>
        <div>
          <div style={{fontFamily:"'Fraunces',serif",fontSize:"13px",fontWeight:500,color:C.dark}}>The Career Breweries</div>
          {!isMobile&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",color:C.soft,letterSpacing:"0.08em",marginTop:"2px"}}>Resume Builder</div>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>

        {step>0&&<button onClick={clearAll} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.soft,background:"transparent",border:"1px solid "+C.border,borderRadius:"8px",padding:"5px 10px",cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.color=C.amber;e.currentTarget.style.borderColor=C.amber;}} onMouseLeave={e=>{e.currentTarget.style.color=C.soft;e.currentTarget.style.borderColor=C.border;}}>+ New Build</button>}
        <button onClick={toggleTheme} style={{display:"flex",alignItems:"center",gap:"4px",background:isDark?"rgba(255,255,255,0.08)":"rgba(28,20,16,0.07)",border:"1.5px solid "+C.border,borderRadius:"20px",padding:"4px 9px 4px 6px",cursor:"pointer"}}>
          <div style={{width:"22px",height:"13px",borderRadius:"7px",background:isDark?C.amber:C.border,position:"relative",flexShrink:0,transition:"background .25s"}}>
            <div style={{position:"absolute",top:"2px",left:isDark?"11px":"2px",width:"9px",height:"9px",borderRadius:"50%",background:"#fff",transition:"left .25s"}}/>
          </div>
          {!isMobile&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",color:C.soft}}>{isDark?"Dark":"Light"}</span>}
        </button>
      </div>
    </header>
  );

  // ── Sticky mobile bottom bar ─────────────────────────────────────────────────
  const MobileBar = ({onBack,onNext,nextLabel,nextDisabled}) => isMobile ? (
    <div style={{position:"fixed",bottom:0,left:0,right:0,padding:"12px 16px",background:themeColors.bg,borderTop:"1px solid "+C.border,zIndex:100,display:"flex",gap:"10px"}}>
      {onBack&&<button onClick={onBack} style={{background:"transparent",color:C.soft,border:"1.5px solid "+C.border,borderRadius:"12px",padding:"13px 18px",fontSize:"15px",cursor:"pointer",flexShrink:0}}>←</button>}
      <button onClick={onNext} disabled={nextDisabled} style={{flex:1,background:nextDisabled?C.border:C.amber,color:nextDisabled?C.soft:C.cream,border:"none",borderRadius:"12px",padding:"13px",fontSize:"15px",fontWeight:600,cursor:nextDisabled?"not-allowed":"pointer",transition:"all .2s"}}>{nextLabel||"Continue →"}</button>
    </div>
  ) : null;

  // ── STEPS ────────────────────────────────────────────────────────────────────

  // Step 0 — Landing
  if(step===0) return (
    <>
      <style>{globalStyles}</style><style>{cssVars}</style>
      <div ref={topRef} style={{minHeight:"100vh",background:themeColors.bg}}>
        <div style={G()}>
          <Header/>
          <div className="fade-up" style={{paddingBottom:"60px"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:C.amber,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:"20px"}}>Resume Builder</div>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?"clamp(30px,8vw,40px)":"clamp(34px,6vw,50px)",fontWeight:400,color:C.dark,lineHeight:1.15,marginBottom:"16px"}}>Build your resume<br/><em style={{color:C.amber}}>from scratch.</em></h1>
            <p style={{fontSize:isMobile?"14px":"16px",color:C.soft,lineHeight:1.75,maxWidth:"480px",marginBottom:"12px"}}>No template. No guesswork. You speak your experience, we write the resume.</p>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"13px",color:C.amber,letterSpacing:"0.04em",marginBottom:"24px"}}>₹2,499 · Pay only when you're ready to generate</div>
            <div style={{display:"flex",gap:"12px",flexDirection:isMobile?"column":"row",marginBottom:"32px"}}>
              <Btn onClick={()=>goTo(1)} full={isMobile}>Start building →</Btn>
              <a href="https://tcb-application-brief.vercel.app" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",fontSize:"13px",color:C.soft,textDecoration:"none",padding:"13px 20px",border:"1px solid "+C.border,borderRadius:"12px"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.amber;e.currentTarget.style.color=C.amber;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.soft;}}>Write a brief first →</a>
            </div>
            <SectionCard>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"16px"}}>
                {[{n:"01",t:"Your story",d:"Speak your experience out loud. We transcribe and write the bullets."},
                  {n:"02",t:"AI-written",d:"Summary, competencies, bullets — all generated from your voice and the JD."},
                  {n:"03",t:"Download",d:"Word and PDF. 1 page or 1.75 pages. Compact automatically."}].map(item=>(
                  <div key={item.n}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.amber,marginBottom:"6px"}}>{item.n}</div>
                    <div style={{fontSize:"13px",fontWeight:600,color:C.dark,marginBottom:"4px"}}>{item.t}</div>
                    <div style={{fontSize:"12px",color:C.soft,lineHeight:1.55}}>{item.d}</div>
                  </div>
                ))}
              </div>
            </SectionCard>
            {/* Brief upload on landing */}
            <div style={{marginTop:"16px",background:C.mist,border:"1px solid "+C.border,borderRadius:"12px",padding:"16px 20px"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",color:C.amber,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"8px"}}>Have an Application Brief?</div>
              <p style={{fontSize:"13px",color:C.soft,lineHeight:1.6,marginBottom:"10px"}}>Upload it and your answers will inform the resume — sharper summary, better bullets.</p>
              <input ref={briefRef} type="file" accept=".html" style={{display:"none"}} onChange={e=>handleBriefUpload(e.target.files[0])}/>
              {briefData ? (
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}><span>✅</span><span style={{fontSize:"13px",color:C.amber}}>Brief loaded — {briefData.jobTitle} at {briefData.company}</span></div>
              ) : (
                <button onClick={()=>briefRef.current?.click()} style={{background:"transparent",color:C.amber,border:"1px solid "+C.amber,borderRadius:"8px",padding:"7px 14px",fontSize:"12px",cursor:"pointer"}}>Upload brief (.html)</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Step 1 — Personal details + Target role
  if(step===1) return (
    <>
      <style>{globalStyles}</style><style>{cssVars}</style>
      <div ref={topRef} style={{minHeight:"100vh",background:themeColors.bg}}>
        <div style={G()}>
          <Header/>
          <div className="fade-up" style={{paddingBottom:isMobile?"100px":"40px",display:"flex",flexDirection:"column",gap:"20px"}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.amber,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"6px"}}>01 / 05 — The Basics</div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?"22px":"28px",fontWeight:400,color:C.dark,lineHeight:1.25}}>Who are you, and what role are you targeting?</h2></div>

            <SectionCard>
              <SectionTitle>Personal Details</SectionTitle>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"14px"}}>
                <div><Lbl>Full Name</Lbl><input type="text" value={formData.name} onChange={e=>set("name",e.target.value)} placeholder="Priya Sharma"/></div>
                <div><Lbl>Email</Lbl><input type="email" value={formData.email} onChange={e=>set("email",e.target.value)} placeholder="priya@example.com"/></div>
                <div><Lbl>Phone</Lbl><input type="tel" value={formData.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91 98765 43210"/></div>
                <div><Lbl>Location</Lbl><input type="text" value={formData.location} onChange={e=>set("location",e.target.value)} placeholder="Bengaluru, India"/></div>
                <div style={{gridColumn:isMobile?"1":"1/-1"}}><Lbl note="optional">LinkedIn URL</Lbl><input type="text" value={formData.linkedin} onChange={e=>set("linkedin",e.target.value)} placeholder="linkedin.com/in/priyasharma"/></div>
              </div>
            </SectionCard>

            {/* Role toggle */}
            <SectionCard>
              <SectionTitle>Are you building this resume for a specific role?</SectionTitle>
              <div style={{display:"flex",gap:"10px",marginBottom: formData.forSpecificRole ? "20px" : "0"}}>
                {["yes","no"].map(v => (
                  <button key={v} onClick={()=>{ set("forSpecificRole", v); if(v==="no"){ set("targetTitle",""); set("targetCompany",""); set("jobDescription",""); } }}
                    style={{flex:1,padding:"13px",borderRadius:"12px",border:"1.5px solid "+(formData.forSpecificRole===v?C.amber:C.border),background:formData.forSpecificRole===v?"rgba(201,123,42,0.08)":"transparent",color:formData.forSpecificRole===v?C.amber:C.soft,fontSize:"14px",fontWeight:formData.forSpecificRole===v?600:400,cursor:"pointer",transition:"all .2s"}}>
                    {v==="yes"?"Yes, I have a role in mind":"No, building a general resume"}
                  </button>
                ))}
              </div>

              {formData.forSpecificRole==="yes" && (
                <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                  <div style={{background:"rgba(201,123,42,0.06)",border:"1px solid rgba(201,123,42,0.2)",borderRadius:"10px",padding:"12px 16px"}}>
                    <p style={{fontSize:"13px",color:C.ink,lineHeight:1.6}}>Good. The JD will shape your summary, bullets, and skills — making this resume specific to this role. This is The Brief + Resume Build in one.</p>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"14px"}}>
                    <div><Lbl>Job Title</Lbl><input type="text" value={formData.targetTitle||""} onChange={e=>set("targetTitle",e.target.value)} placeholder="Senior Trainer"/></div>
                    <div><Lbl>Company <span style={{fontWeight:400,color:C.soft,fontSize:"10px"}}>optional</span></Lbl><input type="text" value={formData.targetCompany||""} onChange={e=>set("targetCompany",e.target.value)} placeholder="Acme Inc."/></div>
                  </div>
                  <div>
                    <Lbl note="paste the full JD for best results">Job Description</Lbl>
                    <textarea rows={6} value={formData.jobDescription||""} onChange={e=>set("jobDescription",e.target.value)} placeholder="Paste the full job description here…" style={{minHeight:"130px"}}/>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"11px",color:C.soft,textAlign:"right",marginTop:"4px"}}>{(formData.jobDescription||"").trim().length} chars</div>
                  </div>
                </div>
              )}

              {formData.forSpecificRole==="no" && (
                <div className="fade-in" style={{background:C.mist,borderRadius:"10px",padding:"12px 16px"}}>
                  <p style={{fontSize:"13px",color:C.soft,lineHeight:1.6}}>We'll build a strong general resume from your experience and voice inputs. You can always use the Rewriter later to tailor it to a specific role.</p>
                </div>
              )}
            </SectionCard>

            {/* Headline — voice first */}
            <SectionCard>
              <SectionTitle>Your Headline</SectionTitle>
              <p style={{fontSize:"13px",color:C.soft,marginBottom:"12px",lineHeight:1.6}}>One sentence — who you are professionally, and what you bring. Speak it naturally.</p>
              <VoiceInput
                value={formData.headline||""}
                onChange={v=>set("headline",v)}
                placeholder="Speak your headline…"
                rows={2}
              />
            </SectionCard>

            {!isMobile&&<div style={{display:"flex",gap:"12px"}}><Btn onClick={()=>goTo(2)} disabled={!formData.name||!formData.email||!formData.forSpecificRole}>Continue →</Btn></div>}
          </div>
        </div>
      </div>
      <MobileBar onBack={()=>goTo(0)} onNext={()=>goTo(2)} nextDisabled={!formData.name||!formData.email||!formData.forSpecificRole}/>
    </>
  );

  // Step 2 — Professional Summary (voice)
  if(step===2) return (
    <>
      <style>{globalStyles}</style><style>{cssVars}</style>
      <div ref={topRef} style={{minHeight:"100vh",background:themeColors.bg}}>
        <div style={G()}>
          <Header/>
          <div className="fade-up" style={{paddingBottom:isMobile?"100px":"40px",display:"flex",flexDirection:"column",gap:"20px"}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.amber,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"6px"}}>02 / 05 — Your Story</div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?"22px":"28px",fontWeight:400,color:C.dark,lineHeight:1.25}}>Tell me about yourself.</h2>
            <p style={{fontSize:"14px",color:C.soft,lineHeight:1.65,marginTop:"8px",maxWidth:"480px"}}>This becomes your professional summary. Speak naturally — why you do what you do, what you're best at, and what you bring to this role. 60–90 seconds is ideal.</p>
            {briefData&&<div style={{marginTop:"10px",background:C.mist,border:"1px solid "+C.border,borderRadius:"10px",padding:"12px 16px"}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",color:C.amber,letterSpacing:"0.1em",textTransform:"uppercase"}}>Brief context loaded</span><p style={{fontSize:"12px",color:C.soft,marginTop:"4px",lineHeight:1.5}}>Your brief answers will also shape this summary.</p></div>}
            </div>
            <SectionCard>
              <SectionTitle>Professional Summary</SectionTitle>
              <VoiceInput value={formData.summaryVoice||formData.summary} onChange={v=>{set("summaryVoice",v);set("summary",v);}} placeholder="Speak your professional story…" rows={5}/>
            </SectionCard>
            {!isMobile&&<div style={{display:"flex",gap:"12px"}}><Ghost onClick={()=>goTo(1)}>← Back</Ghost><Btn onClick={()=>goTo(3)} disabled={!(formData.summaryVoice||formData.summary)}>Continue →</Btn></div>}
          </div>
        </div>
      </div>
      <MobileBar onBack={()=>goTo(1)} onNext={()=>goTo(3)} nextDisabled={!(formData.summaryVoice||formData.summary)}/>
    </>
  );

  // Step 3 — Work Experience
  if(step===3) return (
    <>
      <style>{globalStyles}</style><style>{cssVars}</style>
      <div ref={topRef} style={{minHeight:"100vh",background:themeColors.bg}}>
        <div style={G()}>
          <Header/>
          <div className="fade-up" style={{paddingBottom:isMobile?"100px":"40px",display:"flex",flexDirection:"column",gap:"20px"}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.amber,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"6px"}}>03 / 05 — Experience & Education</div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?"22px":"28px",fontWeight:400,color:C.dark,lineHeight:1.25}}>Your work history.</h2>
            <p style={{fontSize:"14px",color:C.soft,lineHeight:1.65,marginTop:"8px",maxWidth:"480px"}}>Fill in the facts. Then speak what you actually did — we'll turn that into sharp bullet points.</p></div>

            {formData.experience.map((exp,i)=>(
              <SectionCard key={i}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
                  <SectionTitle>Role {i+1}</SectionTitle>
                  {formData.experience.length>1&&<RemoveBtn onClick={()=>removeExp(i)}/>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px",marginBottom:"14px"}}>
                  <div><Lbl>Job Title</Lbl><input value={exp.title} onChange={e=>setExp(i,"title",e.target.value)} placeholder="Senior Trainer"/></div>
                  <div><Lbl>Company</Lbl><input value={exp.company} onChange={e=>setExp(i,"company",e.target.value)} placeholder="PolicyBazaar"/></div>
                  <div><Lbl>Start Date</Lbl><input value={exp.startDate} onChange={e=>setExp(i,"startDate",e.target.value)} placeholder="MM/YYYY"/></div>
                  <div><Lbl>End Date</Lbl><input value={exp.endDate} onChange={e=>setExp(i,"endDate",e.target.value)} placeholder="Present or MM/YYYY"/></div>
                  <div style={{gridColumn:isMobile?"1":"1/-1"}}><Lbl>Location</Lbl><input value={exp.location} onChange={e=>setExp(i,"location",e.target.value)} placeholder="Bengaluru"/></div>
                </div>
                <Lbl>What did you actually do in this role? <span style={{color:C.soft,fontWeight:400,fontFamily:"normal"}}>Speak freely.</span></Lbl>
                <VoiceInput value={exp.voiceText} onChange={v=>setExp(i,"voiceText",v)} placeholder="Describe what you did, what you achieved, what you're proud of…" rows={4}/>
              </SectionCard>
            ))}
            <AddBtn label="Add another role" onClick={addExp}/>

            {/* Education inline */}
            <div style={{marginTop:"8px"}}><h3 style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?"18px":"22px",fontWeight:400,color:C.dark,marginBottom:"14px"}}>Education</h3>
            {formData.education.map((edu,i)=>(
              <SectionCard key={i} style={{marginBottom:"12px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
                  <SectionTitle>Degree {i+1}</SectionTitle>
                  {formData.education.length>1&&<RemoveBtn onClick={()=>removeEdu(i)}/>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px"}}>
                  <div><Lbl>Degree / Course</Lbl><input value={edu.degree} onChange={e=>setEdu(i,"degree",e.target.value)} placeholder="B.Com"/></div>
                  <div><Lbl>Institution</Lbl><input value={edu.institution} onChange={e=>setEdu(i,"institution",e.target.value)} placeholder="Bangalore University"/></div>
                  <div><Lbl>Start Year</Lbl><input value={edu.startYear} onChange={e=>setEdu(i,"startYear",e.target.value)} placeholder="YYYY"/></div>
                  <div><Lbl>End Year</Lbl><input value={edu.endYear} onChange={e=>setEdu(i,"endYear",e.target.value)} placeholder="YYYY or Present"/></div>
                  <div><Lbl note="optional">Location</Lbl><input value={edu.location} onChange={e=>setEdu(i,"location",e.target.value)} placeholder="Bengaluru"/></div>
                  <div><Lbl note="optional">Grade / CGPA</Lbl><input value={edu.grade} onChange={e=>setEdu(i,"grade",e.target.value)} placeholder="8.2 / 10"/></div>
                </div>
              </SectionCard>
            ))}
            <AddBtn label="Add another degree" onClick={addEdu}/></div>

            {!isMobile&&<div style={{display:"flex",gap:"12px",marginTop:"8px"}}><Ghost onClick={()=>goTo(2)}>← Back</Ghost><Btn onClick={()=>goTo(4)} disabled={!formData.experience[0]?.company||!formData.experience[0]?.title}>Continue →</Btn></div>}
          </div>
        </div>
      </div>
      <MobileBar onBack={()=>goTo(2)} onNext={()=>goTo(4)} nextDisabled={!formData.experience[0]?.company||!formData.experience[0]?.title}/>
    </>
  );

  // Step 4 — Certifications, Skills, Languages
  if(step===4) return (
    <>
      <style>{globalStyles}</style><style>{cssVars}</style>
      <div ref={topRef} style={{minHeight:"100vh",background:themeColors.bg}}>
        <div style={G()}>
          <Header/>
          <div className="fade-up" style={{paddingBottom:isMobile?"100px":"40px",display:"flex",flexDirection:"column",gap:"20px"}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.amber,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"6px"}}>04 / 05 — Skills & More</div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?"22px":"28px",fontWeight:400,color:C.dark,lineHeight:1.25}}>What else makes you you?</h2></div>

            {/* Certifications */}
            <div>
              <h3 style={{fontFamily:"'Fraunces',serif",fontSize:"18px",fontWeight:400,color:C.dark,marginBottom:"14px"}}>Certifications & Trainings <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.soft,letterSpacing:"0.06em"}}>(optional)</span></h3>
              {formData.certifications.map((cert,i)=>(
                <SectionCard key={i} style={{marginBottom:"12px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
                    <SectionTitle>Certification {i+1}</SectionTitle>
                    <RemoveBtn onClick={()=>removeCert(i)}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
                    <div><Lbl>Name</Lbl><input value={cert.name} onChange={e=>setCert(i,"name",e.target.value)} placeholder="Certified L&D Professional"/></div>
                    <div><Lbl>Provider</Lbl><input value={cert.provider} onChange={e=>setCert(i,"provider",e.target.value)} placeholder="Mindler"/></div>
                    <div><Lbl>Year</Lbl><input value={cert.year} onChange={e=>setCert(i,"year",e.target.value)} placeholder="MM/YYYY"/></div>
                  </div>
                  <Lbl note="optional">Any context to add? <span style={{fontWeight:400}}>Speak freely.</span></Lbl>
                  <VoiceInput value={cert.voiceText} onChange={v=>setCert(i,"voiceText",v)} placeholder="What this certification means for you…" rows={3}/>
                </SectionCard>
              ))}
              <AddBtn label="Add certification" onClick={addCert}/>
            </div>

            {/* Skills */}
            <SectionCard>
              <SectionTitle>Skills</SectionTitle>
              <p style={{fontSize:"13px",color:C.soft,marginBottom:"14px",lineHeight:1.6}}>Speak your skills — tools you use, domains you know, soft skills that matter. AI will categorise them.</p>
              <VoiceInput value={formData.skillsVoice||formData.skills} onChange={v=>{set("skillsVoice",v);set("skills",v);}} placeholder="Speak your skills, tools, and strengths…" rows={3}/>
            </SectionCard>

            {/* Languages */}
            <SectionCard>
              <SectionTitle>Languages</SectionTitle>
              {formData.languages.map((lang,i)=>(
                <div key={i} style={{display:"flex",gap:"10px",alignItems:"flex-end",marginBottom:"10px"}}>
                  <div style={{flex:1}}><Lbl>Language</Lbl><input value={lang.language} onChange={e=>setLang(i,"language",e.target.value)} placeholder="Kannada"/></div>
                  <div style={{flex:1}}><Lbl>Level</Lbl>
                    <select value={lang.level} onChange={e=>setLang(i,"level",e.target.value)} style={{appearance:"none"}}>
                      {["Native","Professional","Proficient","Conversational"].map(l=><option key={l}>{l}</option>)}
                    </select>
                  </div>
                  {formData.languages.length>1&&<RemoveBtn onClick={()=>removeLang(i)}/>}
                </div>
              ))}
              <div style={{marginTop:"6px"}}><AddBtn label="Add language" onClick={addLang}/></div>
            </SectionCard>

            {!isMobile&&<div style={{display:"flex",gap:"12px"}}><Ghost onClick={()=>goTo(3)}>← Back</Ghost><Btn onClick={()=>goTo(5)}>Continue →</Btn></div>}
          </div>
        </div>
      </div>
      <MobileBar onBack={()=>goTo(3)} onNext={()=>goTo(5)} nextLabel="Continue →"/>
    </>
  );

  // Step 5 — Contact capture + Payment + Generate
  if(step===5) return (
    <>
      <style>{globalStyles}</style><style>{cssVars}</style>
      <div ref={topRef} style={{minHeight:"100vh",background:themeColors.bg}}>
        <div style={G()}>
          <Header/>
          <div className="fade-up" style={{paddingBottom:isMobile?"100px":"40px",display:"flex",flexDirection:"column",gap:"20px"}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.amber,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:"6px"}}>05 / 05 — Almost there</div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:isMobile?"22px":"28px",fontWeight:400,color:C.dark,lineHeight:1.25}}>Ready to build. Pay once, download your resume.</h2>
            <p style={{fontSize:"14px",color:C.soft,lineHeight:1.65,marginTop:"8px",maxWidth:"480px"}}>We've collected everything we need. One payment unlocks the generation — your complete resume, written by AI from your inputs, ready to download in under a minute.</p></div>

            {/* Summary of what they've filled */}
            <SectionCard>
              <SectionTitle>What you've built</SectionTitle>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {[
                  {l:"Name",v:formData.name},
                  {l:"Role",v:formData.forSpecificRole==="yes"&&formData.targetTitle?(formData.targetTitle+(formData.targetCompany?" at "+formData.targetCompany:"")):(formData.forSpecificRole==="no"?"General resume":"—")},
                  {l:"Summary",v:formData.summaryVoice?"✓ Voice recorded":"—"},
                  {l:"Roles",v:`${formData.experience.filter(e=>e.company).length} role(s)`},
                  {l:"Education",v:`${formData.education.filter(e=>e.institution).length} degree(s)`},
                  {l:"Skills",v:formData.skillsVoice?"✓ Voice recorded":"—"},
                ].map(row=>(
                  <div key={row.l} style={{display:"flex",gap:"12px",alignItems:"baseline"}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.soft,minWidth:"80px",letterSpacing:"0.06em"}}>{row.l}</span>
                    <span style={{fontSize:"14px",color:C.ink}}>{row.v||"—"}</span>
                  </div>
                ))}
                {briefData&&<div style={{display:"flex",gap:"8px",alignItems:"center",marginTop:"4px"}}><span style={{fontSize:"12px",color:C.amber}}>✓ Brief loaded — answers will enrich the result</span></div>}
              </div>
            </SectionCard>

            {/* Contact */}
            {!paymentState && (
              <SectionCard>
                <SectionTitle>Send confirmation to</SectionTitle>
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  <div><Lbl>Email</Lbl><input type="email" value={formData.email} onChange={e=>set("email",e.target.value)} placeholder="you@example.com"/></div>
                  <div><Lbl>Phone</Lbl><input type="tel" value={formData.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91 98765 43210"/></div>
                  <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.soft}}>We don't share your details. We don't spam.</p>
                </div>
              </SectionCard>
            )}

            {/* Payment / Generate */}
            {!paymentState && (
              <div>
                <SectionCard style={{background:"#1C1410",border:"none"}}>
                  <SectionTitle>What you get</SectionTitle>
                  {["Complete resume built from your voice inputs and the JD","Profile summary, competencies, and experience bullets — AI-written","Certifications, skills, languages — all formatted","Download as Word (editable) and PDF (print-ready)","Auto-fitted to 1 page or 1.75 pages"].map((pt,i)=>(
                    <div key={i} style={{display:"flex",gap:"10px",marginBottom:"8px"}}>
                      <span style={{color:C.amber,flexShrink:0}}>·</span>
                      <span style={{fontSize:"13px",color:"rgba(255,255,255,0.8)",lineHeight:1.6}}>{pt}</span>
                    </div>
                  ))}
                </SectionCard>
                <div style={{marginTop:"14px",display:"flex",gap:"12px",flexDirection:isMobile?"column":"row",alignItems:isMobile?"stretch":"center"}}>
                  <Btn onClick={async()=>{
                    // Save lead first
                    if(!leadId){
                      const lr=await fetch("/api/save-lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:formData.email,phone:formData.phone,name:formData.name,jobTitle:formData.targetTitle,company:formData.targetCompany})}).then(r=>r.json()).catch(()=>({}));
                      if(lr.leadId) setLeadId(lr.leadId);
                    }
                    handlePayment();
                  }} disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email||"")||paymentState==="processing"} full={isMobile}>
                    {paymentState==="processing"?"Opening payment…":"Pay ₹2,499 and build resume →"}
                  </Btn>
                  {!isMobile&&<Ghost onClick={()=>goTo(4)}>← Back</Ghost>}
                </div>
                {paymentState==="failed"&&<p style={{fontSize:"13px",color:"#c0392b",marginTop:"10px"}}>Payment didn't go through. <button onClick={()=>setPay(null)} style={{background:"none",border:"none",color:C.amber,cursor:"pointer",fontSize:"13px",textDecoration:"underline"}}>Try again</button></p>}
              </div>
            )}

            {/* After payment */}
            {paymentState==="success" && !generatedResume && (
              <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                <div style={{background:C.mist,border:"1.5px solid "+C.amber,borderRadius:"12px",padding:"16px 20px"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.amber,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"6px"}}>Payment confirmed — ₹2,499</div>
                  <p style={{fontSize:"14px",color:C.ink,lineHeight:1.6}}>Ready to generate your resume. This takes about 20–30 seconds.</p>
                </div>
                {!generating&&<Btn onClick={handleGenerate} full={isMobile}>Generate my resume →</Btn>}
                {generating&&<Pulse msg="Reading your inputs and writing your resume…"/>}
                {genError&&<p style={{fontSize:"13px",color:"#c0392b"}}>{genError} <button onClick={handleGenerate} style={{background:"none",border:"none",color:C.amber,cursor:"pointer",fontSize:"13px",textDecoration:"underline"}}>Try again</button></p>}
              </div>
            )}

            {/* Generated — preview + download */}
            {generatedResume && (
              <div className="fade-in" style={{display:"flex",flexDirection:"column",gap:"14px"}}>
                <div style={{background:C.mist,border:"1.5px solid "+C.amber,borderRadius:"12px",padding:"16px 20px"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"10px",color:C.amber,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"8px"}}>
                    Done ✓ {compactLevel>0&&<span style={{color:C.soft}}>{compactLevel===1?"· Tightened to 1 page":"· Formatted for 1.75 pages"}</span>}
                  </div>
                  <p style={{fontSize:"14px",color:C.ink,lineHeight:1.6,marginBottom:"14px"}}><strong>{generatedResume.name}</strong> · {generatedResume.tagline}</p>
                  <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                    <Btn onClick={downloadWord}>↓ Download Word</Btn>
                    <Ghost onClick={downloadPDF}>↓ Download PDF</Ghost>
                  </div>
                </div>
                {/* Smart next steps — never show Builder again */}
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>

                  {/* Rewriter — general resume path */}
                  {formData.forSpecificRole !== "yes" && (
                    <div className="fade-in" style={{background:C.mist,border:"1px solid "+C.border,borderRadius:"14px",padding:"18px 22px"}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",color:C.amber,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"8px"}}>Ready to apply for a specific role?</div>
                      <p style={{fontSize:"14px",color:C.ink,lineHeight:1.6,marginBottom:"12px"}}>Your resume is built. Now tailor it to the role you're targeting — every section rewritten to match the JD.</p>
                      <a href={"https://tcb-resume-rewrite.vercel.app?from=builder"} target="_blank" rel="noreferrer"
                        style={{display:"inline-flex",alignItems:"center",gap:"6px",color:C.amber,fontSize:"13px",fontWeight:600,textDecoration:"none"}}>
                        Rewrite for a specific role — ₹1,499 →
                      </a>
                    </div>
                  )}

                  {/* Rewriter — specific role path */}
                  {formData.forSpecificRole === "yes" && (
                    <div className="fade-in" style={{background:C.mist,border:"1px solid "+C.border,borderRadius:"14px",padding:"18px 22px"}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",color:C.amber,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"8px"}}>Applying elsewhere too?</div>
                      <p style={{fontSize:"14px",color:C.ink,lineHeight:1.6,marginBottom:"12px"}}>Each role deserves its own version. Upload this resume to the Rewriter and tailor it to a different JD in minutes.</p>
                      <a href={"https://tcb-resume-rewrite.vercel.app?from=builder&jobTitle="+encodeURIComponent(formData.targetTitle||"")+"&company="+encodeURIComponent(formData.targetCompany||"")} target="_blank" rel="noreferrer"
                        style={{display:"inline-flex",alignItems:"center",gap:"6px",color:C.amber,fontSize:"13px",fontWeight:600,textDecoration:"none"}}>
                        Rewrite for another role — ₹1,499 →
                      </a>
                    </div>
                  )}

                  {/* Interview Simulation */}
                  <div className="fade-in" style={{background:"#1C1410",borderRadius:"14px",padding:"20px 24px"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",color:C.amber,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"8px"}}>You have the resume. Now prepare for the interview.</div>
                    <p style={{fontSize:"14px",color:"rgba(255,255,255,0.75)",lineHeight:1.65,marginBottom:"14px"}}>AI-calibrated questions based on your role and resume. Practice your answers, get feedback, walk in prepared.</p>
                    <a href={"https://tcb-interview-simulator.vercel.app?from=builder&jobTitle="+encodeURIComponent(formData.targetTitle||"")+"&company="+encodeURIComponent(formData.targetCompany||"")} target="_blank" rel="noreferrer"
                      style={{display:"inline-flex",alignItems:"center",background:C.amber,color:C.cream,borderRadius:"10px",padding:"10px 20px",fontSize:"13px",fontWeight:600,textDecoration:"none",gap:"6px"}}>
                      Start interview simulation — ₹999 →
                    </a>
                  </div>

                  {/* The Brief — for next application */}
                  <div className="fade-in" style={{background:C.mist,border:"1px solid "+C.border,borderRadius:"14px",padding:"16px 20px"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"9px",color:C.soft,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:"6px"}}>Next time you apply for a new role</div>
                    <p style={{fontSize:"13px",color:C.soft,lineHeight:1.6,marginBottom:"10px"}}>The Application Brief asks you five questions before you apply — so you know exactly how to position yourself, what to emphasise, and the angle to lead with. Free.</p>
                    <a href="https://tcb-application-brief.vercel.app" target="_blank" rel="noreferrer"
                      style={{fontSize:"13px",color:C.amber,fontWeight:600,textDecoration:"none"}}>
                      Start your brief →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {isMobile&&!paymentState&&<MobileBar onBack={()=>goTo(4)} onNext={()=>{}} nextLabel="Pay ₹2,499 →" nextDisabled={paymentState==="processing"}/>}
    </>
  );

  return null;
}
