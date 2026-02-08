import { useState, useEffect, useRef, useCallback } from "react";

/*
 ═══════════════════════════════════════════════════════════
 🌍 EcoQuest — Sustainability App for Kids
 Duolingo-inspired: stories, games, lessons, garden, dashboard
 Full auth, database, achievements, XP system
 ═══════════════════════════════════════════════════════════
*/

// ═══ IN-MEMORY DATABASE ═══
const DB = {
  users: {},
  createUser(u, p, av) {
    if (this.users[u]) return null;
    const user = { id: Date.now().toString(36), username: u, password: p, avatar: av || "🌱", level: 1, xp: 0, streak: 1, completedLessons: [], completedStories: [], achievements: [], ecoCoins: 50, garden: [], carbonSaved: 0, joinDate: new Date().toISOString() };
    this.users[u] = user;
    return { ...user };
  },
  login(u, p) {
    const user = this.users[u];
    if (!user || user.password !== p) return null;
    return { ...user };
  },
  addXP(u, amt) {
    const user = this.users[u]; if (!user) return {};
    user.xp += amt; user.ecoCoins += Math.floor(amt / 2); user.carbonSaved += amt * 0.1;
    const nl = Math.floor(user.xp / 100) + 1;
    const lvlUp = nl > user.level; user.level = nl;
    return { ...user, levelUp: lvlUp };
  },
  update(u, data) { if (!this.users[u]) return null; Object.assign(this.users[u], data); return { ...this.users[u] }; },
  get(u) { return this.users[u] ? { ...this.users[u] } : null; }
};

// ═══ CONTENT ═══
const STORIES = [
  { id:"s1", title:"Luna & the Last Bee", emoji:"🐝", xp:25, cat:"biodiversity", color:"#FFB020",
    pages:[
      {t:"Luna loved her garden. Every morning she'd count butterflies and listen to buzzing bees.", img:"🌻🦋🐝"},
      {t:"But one spring, something was wrong. The flowers bloomed, but no bees came. The garden was silent.", img:"🌸😢🤫"},
      {t:"Luna found one tired little bee on a leaf. \"Where are all your friends?\" she whispered.", img:"🍃🐝💬"},
      {t:"The bee danced — bee language! It pointed toward the empty field where wildflowers used to grow.", img:"🐝💃🌾"},
      {t:"\"They paved over your home!\" Luna realized. A parking lot replaced the wildflowers.", img:"🅿️😠🏗️"},
      {t:"Luna planted wildflower seeds in every pot, crack, and corner. Her friends helped too!", img:"🌱🪴✨"},
      {t:"Soon the whole neighborhood was blooming. The bees came back — hundreds of them!", img:"🐝🐝🎉🌺"},
    ],
    quiz:[
      {q:"Why did the bees disappear?", opts:["Too cold","Wildflowers paved over","Moved away","Luna scared them"], ans:1},
      {q:"What did Luna do?", opts:["Called police","Planted wildflowers","Built robot bees","Nothing"], ans:1},
      {q:"How can YOU help bees?", opts:["Use pesticides","Plant bee flowers","Swat them","Ignore them"], ans:1},
    ]},
  { id:"s2", title:"Captain Coral's Ocean Rescue", emoji:"🐙", xp:25, cat:"ocean", color:"#0EA5E9",
    pages:[
      {t:"Deep in the ocean, Captain Coral the octopus guarded the Great Reef — the most colorful place on Earth.", img:"🐙🪸🌊"},
      {t:"But the water was getting warmer. The bright corals started turning white and sad.", img:"🌡️🪸😢"},
      {t:"\"We need to cool things down!\" said Captain Coral. But how do you cool an ocean?", img:"🐙🤔❄️"},
      {t:"She swam to the surface and saw smoke from factories floating into the sky.", img:"🏭💨☁️"},
      {t:"\"That smoke makes a heat blanket around Earth!\" explained Wise Whale.", img:"🐋📚🌍"},
      {t:"Captain Coral organized a beach cleanup. Humans joined in!", img:"🏖️🧹🤝"},
      {t:"Slowly, the reef began healing. New baby corals grew in pinks and purples!", img:"🪸🌈✨"},
    ],
    quiz:[
      {q:"What happened to the coral?", opts:["Grew bigger","Turned white from warm water","Moved","Got painted"], ans:1},
      {q:"What causes ocean warming?", opts:["Fast fish","Greenhouse gases","Bigger sun","Too many boats"], ans:1},
      {q:"How can we help?", opts:["More trash","Less plastic & energy","Boil water","More factories"], ans:1},
    ]},
  { id:"s3", title:"The Tree Who Talked", emoji:"🌳", xp:35, cat:"forests", color:"#22C55E",
    pages:[
      {t:"In an ancient forest lived Elder Oak — a tree so old the mountains forgot its age.", img:"🌳⛰️🌲"},
      {t:"Elder Oak could talk, but only kids heard him. One day, Mia caught his whisper.", img:"🌳👧💬"},
      {t:"\"Help us, Mia. Machines are coming to cut us down for paper.\"", img:"🪓😰📄"},
      {t:"Elder Oak taught her: trees make air, hold soil, and prevent floods.", img:"🌳💨🌬️"},
      {t:"Mia made posters on recycled paper: PLANT MORE TREES, WASTE LESS PAPER!", img:"📋✊🌱"},
      {t:"The town recycled paper, planted 1,000 trees. Elder Oak smiled for the first time in a century.", img:"🌳😊🎉"},
    ],
    quiz:[
      {q:"Trees make what that we breathe?", opts:["CO2","Oxygen","Nitrogen","Smoke"], ans:1},
      {q:"Without trees, what happens?", opts:["Nothing","Floods & erosion","More trees","Soil flies"], ans:1},
      {q:"Best way to save trees?", opts:["Cut more","Recycle & plant","Use more paper","Burn them"], ans:1},
    ]},
  { id:"s4", title:"Sparky's Electric Adventure", emoji:"⚡", xp:35, cat:"energy", color:"#EAB308",
    pages:[
      {t:"Sparky the lightning bolt was tired of just making thunder. He wanted to POWER things!", img:"⚡😤🔌"},
      {t:"He visited a coal plant. \"Yuck!\" he coughed. \"So much smoke for electricity!\"", img:"🏭😷💨"},
      {t:"Then he saw solar panels gleaming. \"You make electricity from SUNSHINE?!\"", img:"☀️🔆✨"},
      {t:"He zoomed to a wind farm. Giant turbines spun gracefully in the breeze.", img:"🌬️💨🎡"},
      {t:"\"So many clean ways to make energy!\" Sparky became the world's first electric superhero!", img:"🦸⚡🌍"},
    ],
    quiz:[
      {q:"What's wrong with coal plants?", opts:["Too quiet","Create pollution","Too colorful","Nothing"], ans:1},
      {q:"Which is clean energy?", opts:["Coal","Oil","Solar panels","Gasoline"], ans:2},
      {q:"Three clean energy sources:", opts:["Coal,oil,gas","Solar,wind,water","Fire,smoke,steam","Paper,wood,plastic"], ans:1},
    ]},
];

const LESSONS = [
  { id:"l1", title:"What is Recycling?", emoji:"♻️", cat:"waste", xp:20, color:"#22C55E",
    content:"Recycling means turning old things into new things! A plastic bottle can become a toy, bench, or t-shirt!",
    qs:[
      {q:"What does recycling mean?", opts:["Throwing away","Making old→new","Buying new","Breaking things"], ans:1},
      {q:"Plastic bottles can become:", opts:["A new toy","Nothing useful","More trash","A rock"], ans:0},
      {q:"Which bin for paper?", opts:["Landfill","Recycling","Compost","Ocean"], ans:1},
      {q:"Glass can be recycled forever!", type:"tf", ans:true},
    ]},
  { id:"l2", title:"Save Water!", emoji:"💧", cat:"water", xp:20, color:"#0EA5E9",
    content:"Only 1% of Earth's water is drinkable! A running tap wastes 8 liters per minute while brushing!",
    qs:[
      {q:"How much water can we drink?", opts:["All","Half","About 1%","None"], ans:2},
      {q:"Save water by:", opts:["Leave taps on","1-hour showers","Turn off tap when brushing","Water sidewalk"], ans:2},
      {q:"A dripping tap wastes thousands of liters/year", type:"tf", ans:true},
      {q:"Which uses LESS water?", opts:["Bath","Quick shower","Running hose","Filling pool"], ans:1},
    ]},
  { id:"l3", title:"Climate Change Basics", emoji:"🌡️", cat:"climate", xp:30, color:"#EF4444",
    content:"Earth has a gas blanket (atmosphere). Burning fossil fuels thickens it, trapping heat — like too many blankets!",
    qs:[
      {q:"What thickens Earth's blanket?", opts:["Planting trees","Burning fossil fuels","Wind","Rain"], ans:1},
      {q:"Fossil fuels are:", opts:["Dinosaur bones","Coal, oil & gas","Rocks","Plants"], ans:1},
      {q:"Trees remove CO2 from the air", type:"tf", ans:true},
      {q:"A warmer planet means:", opts:["Better weather","Rising seas & extreme weather","More snow","Nothing"], ans:1},
    ]},
  { id:"l4", title:"Composting Magic", emoji:"🪱", cat:"waste", xp:20, color:"#A16207",
    content:"Composting turns food scraps into super-soil! Worms eat banana peels and make nutrient-rich compost!",
    qs:[
      {q:"What is composting?", opts:["Burning trash","Food scraps→soil","Throwing food away","Cooking"], ans:1},
      {q:"Which can be composted?", opts:["Plastic bags","Apple cores","Metal cans","Glass"], ans:1},
      {q:"Compost helps plants grow better", type:"tf", ans:true},
    ]},
  { id:"l5", title:"Renewable Energy", emoji:"☀️", cat:"energy", xp:30, color:"#F59E0B",
    content:"Renewable energy never runs out — sun, wind, water! One hour of sunlight could power the whole world for a year!",
    qs:[
      {q:"'Renewable' means:", opts:["Expensive","Never runs out","Comes in boxes","Rare"], ans:1},
      {q:"Which is NOT renewable?", opts:["Solar","Wind","Coal","Hydro"], ans:2},
      {q:"Wind turbines create pollution", type:"tf", ans:false},
      {q:"Solar panels turn ___ into electricity", opts:["Wind","Rain","Sunlight","Soil"], ans:2},
    ]},
  { id:"l6", title:"Plastic Planet", emoji:"🥤", cat:"ocean", xp:30, color:"#6366F1",
    content:"8 million tons of plastic enters the ocean yearly — a garbage truck every minute! Animals mistake it for food.",
    qs:[
      {q:"Yearly ocean plastic:", opts:["A little","8 million tons","None","1 bag"], ans:1},
      {q:"Why is it dangerous?", opts:["Too colorful","Animals eat it","Too heavy","Floats away"], ans:1},
      {q:"Plastic takes 400+ years to decompose", type:"tf", ans:true},
      {q:"Reduce plastic by:", opts:["Use more","Reusable bags/bottles","Throw in river","Ignore"], ans:1},
    ]},
];

const GARDEN_SHOP = [
  {id:"p1",name:"Sunflower",emoji:"🌻",cost:20,type:"flower"},{id:"p2",name:"Oak Tree",emoji:"🌳",cost:50,type:"tree"},
  {id:"p3",name:"Cactus",emoji:"🌵",cost:15,type:"plant"},{id:"p4",name:"Rose",emoji:"🌹",cost:25,type:"flower"},
  {id:"p5",name:"Mushroom",emoji:"🍄",cost:10,type:"fungi"},{id:"p6",name:"Palm",emoji:"🌴",cost:60,type:"tree"},
  {id:"p7",name:"Tulip",emoji:"🌷",cost:20,type:"flower"},{id:"p8",name:"Cherry",emoji:"🌸",cost:40,type:"tree"},
  {id:"p9",name:"Butterfly",emoji:"🦋",cost:35,type:"creature"},{id:"p10",name:"Ladybug",emoji:"🐞",cost:30,type:"creature"},
  {id:"p11",name:"Frog",emoji:"🐸",cost:45,type:"creature"},{id:"p12",name:"Bee Hive",emoji:"🐝",cost:55,type:"creature"},
];

const TIPS = [
  "💡 Turn off lights when leaving a room!","🚰 5-min shower saves 40L vs a bath!",
  "🚶 Walking to school saves ~1kg CO2!","🌱 One tree absorbs 22kg CO2/year!",
  "♻️ Recycling 1 can = 3 hours of TV energy!","🐝 1/3 of food depends on bees!",
  "📦 Reusing a bag 5x cuts impact by 80%!","🍎 Local food = less transport pollution!",
];

const AVATARS = ["🌱","🌍","🌊","🦁","🐢","🦋","🌺","🐝","🦊","🐧","🦉","🐬"];

const ACHIEVEMENTS = [
  {id:"a1",title:"First Steps",emoji:"👣",desc:"Complete 1 lesson",check:u=>u.completedLessons.length>=1},
  {id:"a2",title:"Story Lover",emoji:"📚",desc:"Read 1 story",check:u=>u.completedStories.length>=1},
  {id:"a3",title:"Eco Warrior",emoji:"🛡️",desc:"Reach Level 3",check:u=>u.level>=3},
  {id:"a4",title:"Knowledge",emoji:"🧠",desc:"Complete 3 lessons",check:u=>u.completedLessons.length>=3},
  {id:"a5",title:"Green Thumb",emoji:"🌿",desc:"Plant 3 items",check:u=>u.garden.length>=3},
  {id:"a6",title:"Protector",emoji:"🌍",desc:"Earn 200 XP",check:u=>u.xp>=200},
  {id:"a7",title:"All Stories",emoji:"📖",desc:"Read all stories",check:u=>u.completedStories.length>=STORIES.length},
  {id:"a8",title:"Master",emoji:"👑",desc:"Complete all lessons",check:u=>u.completedLessons.length>=LESSONS.length},
];

// ═══ SMALL COMPONENTS ═══
const XPBar = ({cur,max,color="#22C55E",h=12}) => (
  <div style={{width:"100%",height:h,background:"rgba(0,0,0,0.15)",borderRadius:h,overflow:"hidden",position:"relative"}}>
    <div style={{width:`${Math.min((cur/max)*100,100)}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}cc)`,borderRadius:h,transition:"width 0.8s cubic-bezier(.34,1.56,.64,1)",boxShadow:`0 0 8px ${color}55`}}/>
    {h >= 10 && <span style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:8,fontWeight:700,color:"#fff",textShadow:"0 1px 2px rgba(0,0,0,.4)"}}>{cur}/{max}</span>}
  </div>
);

const Btn = ({children,onClick,v="primary",sz="md",disabled,style:sx,...p}) => {
  const bg = {primary:"linear-gradient(135deg,#22C55E,#16A34A)",secondary:"rgba(255,255,255,0.1)",danger:"linear-gradient(135deg,#EF4444,#DC2626)",gold:"linear-gradient(135deg,#F59E0B,#D97706)",ghost:"transparent"}[v];
  const pd = {sm:"8px 16px",md:"12px 24px",lg:"16px 32px"}[sz];
  const fs = {sm:13,md:15,lg:17}[sz];
  return <button onClick={disabled?undefined:onClick} {...p} style={{padding:pd,fontSize:fs,background:bg,color:v==="ghost"?"#94A3B8":"#fff",border:v==="secondary"?"2px solid rgba(255,255,255,.2)":v==="ghost"?"2px solid #334155":"none",borderRadius:14,fontFamily:"'Fredoka',sans-serif",fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,transition:"all .2s",boxShadow:v==="primary"?"0 4px 14px #22C55E44":"none",letterSpacing:.5,...sx}}>{children}</button>;
};

const Card = ({children,style:sx,onClick}) => (
  <div onClick={onClick} style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(12px)",borderRadius:20,padding:20,border:"1px solid rgba(255,255,255,0.08)",transition:"all .3s",cursor:onClick?"pointer":"default",...sx}}>{children}</div>
);

const Modal = ({open,onClose,children,title}) => {
  if (!open) return null;
  return <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)"}}/>
    <div style={{position:"relative",background:"linear-gradient(145deg,#1E293B,#0F172A)",borderRadius:24,padding:28,maxWidth:460,width:"100%",maxHeight:"80vh",overflow:"auto",border:"1px solid rgba(255,255,255,.1)",boxShadow:"0 24px 48px rgba(0,0,0,.4)"}}>
      {title && <h2 style={{margin:"0 0 16px",fontSize:20,color:"#F8FAFC"}}>{title}</h2>}
      <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"rgba(255,255,255,.1)",border:"none",color:"#94A3B8",fontSize:16,width:30,height:30,borderRadius:10,cursor:"pointer"}}>✕</button>
      {children}
    </div>
  </div>;
};

// ═══ AUTH SCREEN ═══
const AuthScreen = ({onLogin}) => {
  const [mode,setMode] = useState("login");
  const [u,setU] = useState("");
  const [p,setP] = useState("");
  const [av,setAv] = useState("🌱");
  const [err,setErr] = useState("");
  const [showAv,setShowAv] = useState(false);

  const submit = () => {
    if (!u.trim()||!p.trim()) {setErr("Fill in all fields!");return;}
    if (mode==="signup") {
      const user = DB.createUser(u.trim(),p,av);
      if (!user) {setErr("Username taken!");return;}
      onLogin(user);
    } else {
      const user = DB.login(u.trim(),p);
      if (!user) {setErr("Wrong credentials!");return;}
      onLogin(user);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#064E3B 0%,#0F172A 40%,#1E1B4B 100%)",fontFamily:"'Fredoka',sans-serif",padding:20,position:"relative",overflow:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap');
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}`}</style>

      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:56,marginBottom:6,animation:"float 3s ease-in-out infinite"}}>🌍</div>
          <h1 style={{fontSize:34,margin:0,fontWeight:700,background:"linear-gradient(135deg,#22C55E,#4ADE80,#86EFAC)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>EcoQuest</h1>
          <p style={{color:"#94A3B8",margin:"4px 0 0",fontSize:14,fontFamily:"'Quicksand',sans-serif"}}>Learn to save the planet! 🌱</p>
        </div>

        <div style={{display:"flex",background:"rgba(255,255,255,.05)",borderRadius:14,padding:4,marginBottom:20,border:"1px solid rgba(255,255,255,.08)"}}>
          {["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setErr("")}} style={{flex:1,padding:"10px 0",borderRadius:11,border:"none",fontFamily:"'Fredoka',sans-serif",fontSize:14,fontWeight:600,cursor:"pointer",background:mode===m?"linear-gradient(135deg,#22C55E,#16A34A)":"transparent",color:mode===m?"#fff":"#64748B",transition:"all .3s"}}>{m==="login"?"Log In":"Sign Up"}</button>)}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {mode==="signup"&&<div style={{textAlign:"center"}}>
            <div onClick={()=>setShowAv(!showAv)} style={{cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.06)",padding:"8px 16px",borderRadius:14,border:"1px solid rgba(255,255,255,.1)"}}>
              <span style={{fontSize:30}}>{av}</span>
              <span style={{color:"#94A3B8",fontSize:12}}>Pick avatar ▾</span>
            </div>
            {showAv&&<div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginTop:8}}>
              {AVATARS.map(a=><span key={a} onClick={()=>{setAv(a);setShowAv(false)}} style={{fontSize:26,cursor:"pointer",padding:5,borderRadius:10,background:av===a?"rgba(34,197,94,.3)":"rgba(255,255,255,.05)",border:av===a?"2px solid #22C55E":"2px solid transparent"}}>{a}</span>)}
            </div>}
          </div>}

          {[["Username",u,setU,"text"],["Password",p,setP,"password"]].map(([ph,val,set,type])=>
            <input key={ph} value={val} onChange={e=>{set(e.target.value);setErr("")}} placeholder={ph} type={type} onKeyDown={e=>e.key==="Enter"&&submit()}
              style={{width:"100%",padding:"13px 16px",borderRadius:14,border:"2px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#F8FAFC",fontSize:14,fontFamily:"'Quicksand',sans-serif",outline:"none",boxSizing:"border-box"}}/>
          )}

          {err&&<p style={{color:"#EF4444",margin:0,fontSize:12,textAlign:"center"}}>⚠️ {err}</p>}
          <Btn onClick={submit} sz="lg" style={{width:"100%",marginTop:4}}>{mode==="login"?"🚀 Let's Go!":"🌱 Join EcoQuest!"}</Btn>
        </div>
        <p style={{color:"#475569",fontSize:11,textAlign:"center",marginTop:16}}>First time? Sign up to create your eco-hero! 🦸</p>
      </div>
    </div>
  );
};

// ═══ NAV ═══
const tabs = [{id:"home",emoji:"🏠",label:"Home"},{id:"learn",emoji:"📚",label:"Learn"},{id:"stories",emoji:"📖",label:"Stories"},{id:"games",emoji:"🎮",label:"Games"},{id:"garden",emoji:"🌻",label:"Garden"},{id:"profile",emoji:"👤",label:"Me"}];

const Nav = ({active,setActive}) => (
  <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"linear-gradient(180deg,rgba(15,23,42,.92),rgba(15,23,42,.98))",backdropFilter:"blur(20px)",borderTop:"1px solid rgba(255,255,255,.06)",display:"flex",justifyContent:"space-around",padding:"5px 0 env(safe-area-inset-bottom,8px)"}}>
    {tabs.map(t=><button key={t.id} onClick={()=>setActive(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"5px 0",background:"none",border:"none",cursor:"pointer",minWidth:48}}>
      <span style={{fontSize:active===t.id?21:17,transition:"all .3s",filter:active===t.id?"drop-shadow(0 2px 8px rgba(34,197,94,.5))":"none"}}>{t.emoji}</span>
      <span style={{fontSize:9,fontWeight:600,fontFamily:"'Quicksand',sans-serif",color:active===t.id?"#22C55E":"#475569"}}>{t.label}</span>
      {active===t.id&&<div style={{width:16,height:2.5,borderRadius:2,background:"#22C55E",marginTop:1}}/>}
    </button>)}
  </nav>
);

// ═══ HEADER ═══
const Header = ({user}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px 10px",position:"sticky",top:0,zIndex:50,background:"linear-gradient(180deg,rgba(15,23,42,.95),rgba(15,23,42,.8))",backdropFilter:"blur(16px)"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:26}}>{user.avatar}</span>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:"#F8FAFC"}}>{user.username}</div>
        <div style={{fontSize:10,color:"#22C55E",fontWeight:600}}>Lv.{user.level} • {user.xp}XP</div>
      </div>
    </div>
    <div style={{display:"flex",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:3,background:"rgba(245,158,11,.12)",padding:"5px 10px",borderRadius:16}}>
        <span style={{fontSize:13}}>🪙</span><span style={{fontSize:12,fontWeight:700,color:"#F59E0B"}}>{user.ecoCoins}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:3,background:"rgba(239,68,68,.12)",padding:"5px 10px",borderRadius:16}}>
        <span style={{fontSize:13}}>🔥</span><span style={{fontSize:12,fontWeight:700,color:"#EF4444"}}>{user.streak}</span>
      </div>
    </div>
  </div>
);

// ═══ HOME DASHBOARD ═══
const Home = ({user,setPage}) => {
  const tip = TIPS[new Date().getDate()%TIPS.length];
  const xpInLevel = user.xp % 100;

  return <div style={{padding:"0 16px 90px"}}>
    <Card style={{background:"linear-gradient(135deg,rgba(34,197,94,.12),rgba(34,197,94,.04))",border:"1px solid rgba(34,197,94,.12)",marginBottom:16}}>
      <h2 style={{margin:"0 0 4px",fontSize:20,color:"#F8FAFC"}}>Welcome back! 👋</h2>
      <p style={{margin:"0 0 14px",fontSize:12,color:"#94A3B8"}}>Keep learning to save the planet 🌍</p>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:11,color:"#94A3B8"}}>Level {user.level} → {user.level+1}</span>
        <span style={{fontSize:11,color:"#22C55E",fontWeight:600}}>{100-xpInLevel} XP to go</span>
      </div>
      <XPBar cur={xpInLevel} max={100}/>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
      {[{e:"📚",v:user.completedLessons.length,l:"Lessons",c:"#22C55E"},{e:"📖",v:user.completedStories.length,l:"Stories",c:"#0EA5E9"},{e:"🌍",v:`${user.carbonSaved.toFixed(0)}kg`,l:"CO₂ Saved",c:"#A855F7"}].map((s,i)=>
        <Card key={i} style={{textAlign:"center",padding:12}}>
          <div style={{fontSize:22}}>{s.e}</div>
          <div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
          <div style={{fontSize:9,color:"#64748B",fontWeight:600}}>{s.l}</div>
        </Card>
      )}
    </div>

    <Card style={{marginBottom:16,background:"linear-gradient(135deg,rgba(59,130,246,.08),rgba(139,92,246,.08))",border:"1px solid rgba(99,102,241,.12)"}}>
      <div style={{fontSize:11,fontWeight:700,color:"#818CF8",marginBottom:4}}>🌟 ECO TIP</div>
      <p style={{margin:0,fontSize:13,color:"#CBD5E1",lineHeight:1.5}}>{tip}</p>
    </Card>

    <h3 style={{color:"#F8FAFC",fontSize:15,margin:"0 0 10px"}}>Continue Learning</h3>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {LESSONS.filter(l=>!user.completedLessons.includes(l.id)).slice(0,2).map(l=>
        <Card key={l.id} onClick={()=>setPage("learn")} style={{display:"flex",alignItems:"center",gap:12,padding:14,background:`linear-gradient(135deg,${l.color}12,${l.color}06)`,border:`1px solid ${l.color}20`,cursor:"pointer"}}>
          <span style={{fontSize:32}}>{l.emoji}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"#F8FAFC"}}>{l.title}</div>
            <div style={{fontSize:11,color:"#94A3B8"}}>{l.cat} • +{l.xp}XP</div>
          </div>
          <span style={{fontSize:18,color:"#22C55E"}}>▶</span>
        </Card>
      )}
      {STORIES.filter(s=>!user.completedStories.includes(s.id)).slice(0,1).map(s=>
        <Card key={s.id} onClick={()=>setPage("stories")} style={{display:"flex",alignItems:"center",gap:12,padding:14,background:`linear-gradient(135deg,${s.color}12,${s.color}06)`,border:`1px solid ${s.color}20`,cursor:"pointer"}}>
          <span style={{fontSize:32}}>{s.emoji}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"#F8FAFC"}}>{s.title}</div>
            <div style={{fontSize:11,color:"#94A3B8"}}>Story • +{s.xp}XP</div>
          </div>
          <span style={{fontSize:18,color:"#F59E0B"}}>📖</span>
        </Card>
      )}
    </div>
  </div>;
};

// ═══ QUIZ ENGINE (shared by lessons & stories) ═══
const Quiz = ({questions,onDone,color="#22C55E",label="Quiz"}) => {
  const [qi,setQi] = useState(0);
  const [sel,setSel] = useState(null);
  const [score,setScore] = useState(0);
  const [show,setShow] = useState(false);
  const [done,setDone] = useState(false);

  if (done) {
    const pct = Math.round(score/questions.length*100);
    return <div style={{textAlign:"center",padding:20}}>
      <div style={{fontSize:64,marginBottom:12}}>{pct>=60?"🎉":"🌱"}</div>
      <h2 style={{color:"#F8FAFC",fontSize:22}}>{pct>=60?"Amazing!":"Keep trying!"}</h2>
      <p style={{color:"#94A3B8"}}>{score}/{questions.length} correct ({pct}%)</p>
      <Btn onClick={()=>onDone(score,pct>=60)} sz="lg" style={{marginTop:16}}>
        {pct>=60?"Continue 🚀":"Try Again 🔄"}
      </Btn>
    </div>;
  }

  const q = questions[qi];
  const isTF = q.type === "tf";
  const opts = isTF ? [["✅ True",true],["❌ False",false]] : q.opts.map((o,i)=>[o,i]);
  const correct = isTF ? sel===q.ans : sel===q.ans;

  const pick = (val) => { if(show) return; setSel(val); if((isTF&&val===q.ans)||(!isTF&&val===q.ans)) setScore(s=>s+1); setShow(true); };
  const next = () => { setShow(false);setSel(null); if(qi+1<questions.length) setQi(qi+1); else setDone(true); };

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
      <span style={{color:"#94A3B8",fontSize:12,fontWeight:600}}>{label}</span>
      <span style={{color:"#94A3B8",fontSize:12}}>{qi+1}/{questions.length}</span>
    </div>
    <XPBar cur={qi+1} max={questions.length} color={color} h={6}/>
    <h3 style={{color:"#F8FAFC",fontSize:17,margin:"18px 0 16px",lineHeight:1.4}}>{q.q}</h3>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {opts.map(([label,val],i)=>{
        let bg="rgba(255,255,255,.05)",brd="1px solid rgba(255,255,255,.08)";
        if(show){
          const isAns = isTF?val===q.ans:val===q.ans;
          if(isAns){bg="rgba(34,197,94,.12)";brd="2px solid #22C55E";}
          else if(val===sel){bg="rgba(239,68,68,.12)";brd="2px solid #EF4444";}
        }
        return <button key={i} onClick={()=>pick(val)} style={{padding:"12px 16px",borderRadius:13,background:bg,border:brd,color:"#E2E8F0",fontSize:14,textAlign:"left",cursor:show?"default":"pointer",fontFamily:"'Fredoka',sans-serif",transition:"all .2s"}}>
          {show&&(isTF?val===q.ans:val===q.ans)&&"✅ "}{show&&val===sel&&(isTF?val!==q.ans:val!==q.ans)&&"❌ "}{label}
        </button>;
      })}
    </div>
    {show&&<div style={{marginTop:14}}>
      <Card style={{background:correct?"rgba(34,197,94,.08)":"rgba(239,68,68,.08)",border:`1px solid ${correct?"#22C55E":"#EF4444"}30`,padding:12,marginBottom:12}}>
        <p style={{margin:0,color:correct?"#4ADE80":"#FCA5A5",fontSize:14,fontWeight:600}}>{correct?"🎉 Correct!":"😕 Not quite!"}</p>
      </Card>
      <Btn onClick={next} sz="lg" style={{width:"100%"}}>{qi+1<questions.length?"Next →":"See Results 🏆"}</Btn>
    </div>}
  </div>;
};

// ═══ LEARN PAGE ═══
const Learn = ({user,setUser}) => {
  const [active,setActive] = useState(null);

  if (active) {
    const lesson = active;
    return <div style={{padding:"16px 16px 90px"}}>
      <button onClick={()=>setActive(null)} style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginBottom:12}}>← Back</button>
      <div style={{textAlign:"center",marginBottom:20}}>
        <span style={{fontSize:48}}>{lesson.emoji}</span>
        <h2 style={{color:"#F8FAFC",margin:"8px 0 6px",fontSize:22}}>{lesson.title}</h2>
      </div>
      <Card style={{marginBottom:20,background:`linear-gradient(135deg,${lesson.color}12,${lesson.color}06)`,border:`1px solid ${lesson.color}20`}}>
        <p style={{color:"#CBD5E1",fontSize:15,lineHeight:1.6,margin:0}}>{lesson.content}</p>
      </Card>
      <Quiz questions={lesson.qs} color={lesson.color} label={lesson.title} onDone={(score,passed)=>{
        if(passed&&!user.completedLessons.includes(lesson.id)){
          const updated = DB.addXP(user.username,lesson.xp);
          DB.update(user.username,{completedLessons:[...user.completedLessons,lesson.id]});
          setUser(DB.get(user.username));
        }
        if(!passed) return; // Quiz component shows retry
        setActive(null);
      }}/>
    </div>;
  }

  const cats = [...new Set(LESSONS.map(l=>l.cat))];
  return <div style={{padding:"0 16px 90px"}}>
    <h2 style={{color:"#F8FAFC",fontSize:20,margin:"0 0 4px"}}>Learn & Grow 📚</h2>
    <p style={{color:"#64748B",fontSize:12,margin:"0 0 16px"}}>Complete lessons to earn XP!</p>
    {cats.map(c=><div key={c} style={{marginBottom:20}}>
      <h3 style={{color:"#94A3B8",fontSize:11,textTransform:"uppercase",letterSpacing:1.5,margin:"0 0 8px"}}>{c}</h3>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {LESSONS.filter(l=>l.cat===c).map(l=>{
          const done=user.completedLessons.includes(l.id);
          return <Card key={l.id} onClick={()=>setActive(l)} style={{display:"flex",alignItems:"center",gap:12,padding:14,cursor:"pointer",background:done?"rgba(34,197,94,.06)":`linear-gradient(135deg,${l.color}10,${l.color}05)`,border:done?"1px solid rgba(34,197,94,.15)":`1px solid ${l.color}18`,opacity:done?.7:1}}>
            <div style={{width:44,height:44,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:done?"rgba(34,197,94,.15)":`${l.color}18`,fontSize:24}}>{done?"✅":l.emoji}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,color:"#F8FAFC"}}>{l.title}</div>
              <div style={{fontSize:11,color:"#64748B"}}>{l.cat} • +{l.xp}XP</div>
            </div>
            <span style={{fontSize:16,color:done?"#22C55E":"#64748B"}}>{done?"↺":"▶"}</span>
          </Card>;
        })}
      </div>
    </div>)}
  </div>;
};

// ═══ STORIES PAGE ═══
const Stories = ({user,setUser}) => {
  const [active,setActive] = useState(null);
  const [page,setPage] = useState(0);
  const [phase,setPhase] = useState("read");

  if (active) {
    const s = active;
    if (phase==="quiz") return <div style={{padding:"16px 16px 90px"}}>
      <button onClick={()=>{setActive(null);setPhase("read");setPage(0)}} style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginBottom:12}}>← Back</button>
      <h3 style={{color:"#F8FAFC",textAlign:"center",marginBottom:16}}>📝 {s.title} Quiz</h3>
      <Quiz questions={s.quiz} color={s.color} label="Story Quiz" onDone={(score,passed)=>{
        if(!user.completedStories.includes(s.id)){
          DB.addXP(user.username,s.xp);
          DB.update(user.username,{completedStories:[...user.completedStories,s.id]});
          setUser(DB.get(user.username));
        }
        setActive(null);setPhase("read");setPage(0);
      }}/>
    </div>;

    const pg = s.pages[page];
    return <div style={{padding:"16px 16px 90px",minHeight:"70vh",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <button onClick={()=>{setActive(null);setPage(0)}} style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>← Back</button>
        <span style={{color:"#94A3B8",fontSize:11}}>{page+1}/{s.pages.length}</span>
      </div>
      <XPBar cur={page+1} max={s.pages.length} color={s.color} h={5}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",textAlign:"center",padding:"16px 0"}}>
        <div style={{fontSize:56,marginBottom:20,letterSpacing:10}}>{pg.img}</div>
        <p style={{color:"#E2E8F0",fontSize:17,lineHeight:1.7,maxWidth:360}}>{pg.t}</p>
      </div>
      <div style={{display:"flex",gap:10}}>
        {page>0&&<Btn onClick={()=>setPage(page-1)} v="ghost" sz="lg" style={{flex:1}}>← Back</Btn>}
        <Btn onClick={()=>{if(page+1<s.pages.length)setPage(page+1);else setPhase("quiz")}} sz="lg" style={{flex:1}}>
          {page+1<s.pages.length?"Next →":"Take Quiz 🧠"}
        </Btn>
      </div>
    </div>;
  }

  return <div style={{padding:"0 16px 90px"}}>
    <h2 style={{color:"#F8FAFC",fontSize:20,margin:"0 0 4px"}}>Eco Stories 📖</h2>
    <p style={{color:"#64748B",fontSize:12,margin:"0 0 16px"}}>Beautiful tales about nature!</p>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {STORIES.map(s=>{
        const done=user.completedStories.includes(s.id);
        return <Card key={s.id} onClick={()=>{setActive(s);setPage(0);setPhase("read")}} style={{display:"flex",alignItems:"center",gap:14,padding:16,cursor:"pointer",border:`1px solid ${s.color}20`}}>
          <div style={{width:52,height:52,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",background:`${s.color}20`,fontSize:28,flexShrink:0}}>{done?"✅":s.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,color:"#F8FAFC"}}>{s.title}</div>
            <div style={{fontSize:11,color:"#94A3B8"}}>{s.pages.length} pages • {s.cat} • +{s.xp}XP</div>
          </div>
          <span style={{fontSize:18,color:done?"#22C55E":"#64748B"}}>{done?"↺":"▶"}</span>
        </Card>;
      })}
    </div>
  </div>;
};

// ═══ GAMES PAGE ═══
const EcoSorter = ({onDone,onBack}) => {
  const items = [{n:"Plastic Bottle",e:"🧴",b:"recycle"},{n:"Banana Peel",e:"🍌",b:"compost"},{n:"Newspaper",e:"📰",b:"recycle"},{n:"Glass Jar",e:"🫙",b:"recycle"},{n:"Apple Core",e:"🍎",b:"compost"},{n:"Chip Bag",e:"📦",b:"trash"},{n:"Egg Shells",e:"🥚",b:"compost"},{n:"Cardboard",e:"📦",b:"recycle"},{n:"Styrofoam",e:"🥡",b:"trash"},{n:"Tea Bag",e:"🍵",b:"compost"}];
  const [q,setQ] = useState(()=>[...items].sort(()=>Math.random()-.5));
  const [score,setScore] = useState(0);
  const [fb,setFb] = useState(null);

  if(!q.length) return <div style={{textAlign:"center",padding:30}}>
    <div style={{fontSize:64}}>{score>=7?"🎉":"🌱"}</div>
    <h2 style={{color:"#F8FAFC"}}>{score}/{items.length} sorted correctly!</h2>
    {score>=7&&<p style={{color:"#22C55E",fontWeight:700}}>+15 XP! 🌟</p>}
    <Btn onClick={()=>onDone(score>=7?15:0)} sz="lg" style={{marginTop:16}}>Done</Btn>
  </div>;

  const cur=q[0];
  const sort=(bin)=>{
    if(fb) return;
    const ok=bin===cur.b;
    if(ok) setScore(s=>s+1);
    setFb({ok,msg:ok?"✅ Correct!":`❌ → ${cur.b}`});
    setTimeout(()=>{setFb(null);setQ(q=>q.slice(1))},700);
  };

  return <div style={{padding:"16px 16px 90px"}}>
    <button onClick={onBack} style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginBottom:12}}>← Back</button>
    <h3 style={{color:"#F8FAFC",textAlign:"center"}}>🗑️ Eco Sorter</h3>
    <XPBar cur={items.length-q.length} max={items.length} color="#22C55E" h={6}/>
    <div style={{textAlign:"center",margin:"28px 0"}}>
      <div style={{fontSize:56}}>{cur.e}</div>
      <div style={{color:"#F8FAFC",fontSize:16,fontWeight:600,marginTop:6}}>{cur.n}</div>
      {fb&&<div style={{marginTop:8,padding:"6px 14px",borderRadius:10,display:"inline-block",background:fb.ok?"rgba(34,197,94,.15)":"rgba(239,68,68,.15)",color:fb.ok?"#4ADE80":"#FCA5A5",fontSize:13,fontWeight:600}}>{fb.msg}</div>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
      {[{id:"recycle",e:"♻️",l:"Recycle",c:"#22C55E"},{id:"compost",e:"🪱",l:"Compost",c:"#A16207"},{id:"trash",e:"🗑️",l:"Trash",c:"#64748B"}].map(b=>
        <button key={b.id} onClick={()=>sort(b.id)} style={{padding:"18px 6px",borderRadius:16,border:`2px solid ${b.c}35`,background:`${b.c}12`,cursor:"pointer",textAlign:"center",fontFamily:"'Fredoka',sans-serif"}}>
          <div style={{fontSize:28}}>{b.e}</div>
          <div style={{fontSize:12,color:b.c,fontWeight:600,marginTop:3}}>{b.l}</div>
        </button>
      )}
    </div>
  </div>;
};

const WaterDrop = ({onDone,onBack}) => {
  const [score,setScore] = useState(0);
  const [time,setTime] = useState(15);
  const [drops,setDrops] = useState([]);
  const over = time<=0;

  useEffect(()=>{if(over) return; const t=setInterval(()=>setTime(t=>t-1),1000); return ()=>clearInterval(t);},[over]);
  useEffect(()=>{if(over) return; const t=setInterval(()=>setDrops(d=>[...d,{id:Date.now(),x:5+Math.random()*85}]),900); return ()=>clearInterval(t);},[over]);

  if(over) return <div style={{textAlign:"center",padding:30}}>
    <div style={{fontSize:64}}>💧</div>
    <h2 style={{color:"#F8FAFC"}}>Caught {score} drops!</h2>
    {score>=8&&<p style={{color:"#22C55E",fontWeight:700}}>+15 XP! 🌟</p>}
    <Btn onClick={()=>onDone(score>=8?15:0)} sz="lg" style={{marginTop:16}}>Done</Btn>
  </div>;

  return <div style={{padding:"16px 16px 90px"}}>
    <button onClick={onBack} style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginBottom:8}}>← Back</button>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
      <span style={{color:"#0EA5E9",fontWeight:700}}>💧 {score}</span>
      <span style={{color:"#F8FAFC",fontWeight:700}}>⏱ {time}s</span>
    </div>
    <style>{`@keyframes dfall{0%{top:-30px;opacity:1}100%{top:100%;opacity:.2}}`}</style>
    <div style={{position:"relative",width:"100%",height:320,borderRadius:18,background:"linear-gradient(180deg,rgba(14,165,233,.08),rgba(14,165,233,.02))",border:"1px solid rgba(14,165,233,.12)",overflow:"hidden"}}>
      {drops.map(d=><button key={d.id} onClick={()=>{setScore(s=>s+1);setDrops(ds=>ds.filter(x=>x.id!==d.id))}} style={{position:"absolute",left:`${d.x}%`,fontSize:26,background:"none",border:"none",cursor:"pointer",animation:"dfall 2.5s linear forwards",padding:3}}>💧</button>)}
    </div>
    <p style={{color:"#64748B",fontSize:11,textAlign:"center",marginTop:6}}>Tap drops before they fall!</p>
  </div>;
};

const Games = ({user,setUser}) => {
  const [active,setActive] = useState(null);
  const done = (xp) => { if(xp>0){DB.addXP(user.username,xp);setUser(DB.get(user.username));} setActive(null); };

  if(active==="sort") return <EcoSorter onDone={done} onBack={()=>setActive(null)}/>;
  if(active==="water") return <WaterDrop onDone={done} onBack={()=>setActive(null)}/>;

  const games = [
    {id:"sort",title:"Eco Sorter",emoji:"🗑️",desc:"Sort waste into the right bins!",color:"#22C55E",xp:15},
    {id:"water",title:"Water Drop Quest",emoji:"💧",desc:"Catch falling water drops!",color:"#0EA5E9",xp:15},
  ];

  return <div style={{padding:"0 16px 90px"}}>
    <h2 style={{color:"#F8FAFC",fontSize:20,margin:"0 0 4px"}}>Mini Games 🎮</h2>
    <p style={{color:"#64748B",fontSize:12,margin:"0 0 16px"}}>Learn while having fun!</p>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {games.map(g=><Card key={g.id} onClick={()=>setActive(g.id)} style={{display:"flex",alignItems:"center",gap:14,padding:16,cursor:"pointer",background:`linear-gradient(135deg,${g.color}12,${g.color}06)`,border:`1px solid ${g.color}20`}}>
        <div style={{width:52,height:52,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",background:`${g.color}18`,fontSize:26,flexShrink:0}}>{g.emoji}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,color:"#F8FAFC"}}>{g.title}</div>
          <div style={{fontSize:12,color:"#94A3B8"}}>{g.desc}</div>
          <span style={{fontSize:11,color:"#22C55E",fontWeight:600}}>+{g.xp}XP</span>
        </div>
        <span style={{fontSize:22}}>▶</span>
      </Card>)}
    </div>
  </div>;
};

// ═══ GARDEN ═══
const Garden = ({user,setUser}) => {
  const [shop,setShop] = useState(false);
  const buy = (item) => {
    if(user.ecoCoins<item.cost) return;
    const u = DB.update(user.username,{ecoCoins:user.ecoCoins-item.cost,garden:[...user.garden,{...item,at:Date.now()}]});
    setUser(u);
  };

  return <div style={{padding:"0 16px 90px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
      <div>
        <h2 style={{color:"#F8FAFC",fontSize:20,margin:0}}>My Eco Garden 🌻</h2>
        <p style={{color:"#64748B",fontSize:12,margin:"2px 0 0"}}>Spend EcoCoins to grow!</p>
      </div>
      <Btn onClick={()=>setShop(true)} v="gold" sz="sm">🛒 Shop</Btn>
    </div>

    {!user.garden.length?
      <Card style={{textAlign:"center",padding:36}}>
        <div style={{fontSize:44,marginBottom:10}}>🌱</div>
        <p style={{color:"#94A3B8",fontSize:14}}>Your garden is empty!</p>
        <p style={{color:"#64748B",fontSize:12}}>Earn EcoCoins from lessons & games!</p>
        <Btn onClick={()=>setShop(true)} v="gold" sz="md" style={{marginTop:10}}>🛒 Shop</Btn>
      </Card>
    :
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,background:"linear-gradient(135deg,rgba(34,197,94,.06),rgba(34,197,94,.02))",borderRadius:20,padding:12,border:"1px solid rgba(34,197,94,.1)",minHeight:180}}>
        {user.garden.map((it,i)=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:6,borderRadius:12,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.05)",aspectRatio:"1"}}>
          <span style={{fontSize:28}}>{it.emoji}</span>
          <span style={{fontSize:8,color:"#94A3B8",marginTop:1}}>{it.name}</span>
        </div>)}
        {Array.from({length:Math.max(0,12-user.garden.length)}).map((_,i)=><div key={`e${i}`} onClick={()=>setShop(true)} style={{display:"flex",alignItems:"center",justifyContent:"center",borderRadius:12,background:"rgba(255,255,255,.02)",border:"1px dashed rgba(255,255,255,.05)",aspectRatio:"1",cursor:"pointer"}}><span style={{fontSize:16,opacity:.25}}>+</span></div>)}
      </div>
    }

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:14}}>
      {[{e:"🌳",v:user.garden.filter(g=>g.type==="tree").length,l:"Trees",c:"#22C55E"},{e:"🌺",v:user.garden.filter(g=>g.type==="flower").length,l:"Flowers",c:"#F472B6"},{e:"🦋",v:user.garden.filter(g=>g.type==="creature").length,l:"Creatures",c:"#A855F7"}].map((s,i)=>
        <Card key={i} style={{textAlign:"center",padding:10}}>
          <div style={{fontSize:18}}>{s.e}</div>
          <div style={{fontSize:15,fontWeight:700,color:s.c}}>{s.v}</div>
          <div style={{fontSize:9,color:"#64748B"}}>{s.l}</div>
        </Card>
      )}
    </div>

    <Modal open={shop} onClose={()=>setShop(false)} title="🛒 Eco Shop">
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14,padding:"7px 12px",background:"rgba(245,158,11,.1)",borderRadius:10}}>
        <span style={{fontSize:18}}>🪙</span><span style={{color:"#F59E0B",fontWeight:700,fontSize:15}}>{user.ecoCoins} EcoCoins</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {GARDEN_SHOP.map(it=>{
          const ok=user.ecoCoins>=it.cost;
          return <button key={it.id} onClick={()=>ok&&buy(it)} style={{padding:12,borderRadius:14,textAlign:"center",background:ok?"rgba(255,255,255,.05)":"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.07)",cursor:ok?"pointer":"not-allowed",opacity:ok?1:.4,fontFamily:"'Fredoka',sans-serif"}}>
            <div style={{fontSize:28}}>{it.emoji}</div>
            <div style={{fontSize:12,color:"#F8FAFC",fontWeight:600,marginTop:3}}>{it.name}</div>
            <div style={{fontSize:11,color:"#F59E0B",fontWeight:600}}>🪙 {it.cost}</div>
          </button>;
        })}
      </div>
    </Modal>
  </div>;
};

// ═══ PROFILE ═══
const Profile = ({user,setUser,onLogout}) => {
  const earned = ACHIEVEMENTS.filter(a=>a.check(user));
  const locked = ACHIEVEMENTS.filter(a=>!a.check(user));

  return <div style={{padding:"0 16px 90px"}}>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{fontSize:56,marginBottom:6}}>{user.avatar}</div>
      <h2 style={{color:"#F8FAFC",margin:"0 0 2px",fontSize:22}}>{user.username}</h2>
      <p style={{color:"#22C55E",margin:0,fontSize:13,fontWeight:600}}>Level {user.level} Eco Hero</p>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
      {[{l:"Total XP",v:user.xp,c:"#22C55E"},{l:"EcoCoins",v:user.ecoCoins,c:"#F59E0B"},{l:"CO₂ Saved",v:`${user.carbonSaved.toFixed(0)}kg`,c:"#0EA5E9"},{l:"Streak",v:`${user.streak}🔥`,c:"#EF4444"}].map((s,i)=>
        <Card key={i} style={{textAlign:"center",padding:12}}>
          <div style={{fontSize:18,fontWeight:700,color:s.c}}>{s.v}</div>
          <div style={{fontSize:10,color:"#64748B"}}>{s.l}</div>
        </Card>
      )}
    </div>

    <h3 style={{color:"#F8FAFC",fontSize:15,margin:"0 0 10px"}}>🏆 Achievements ({earned.length}/{ACHIEVEMENTS.length})</h3>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
      {earned.map(a=><Card key={a.id} style={{padding:12,textAlign:"center",background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.15)"}}>
        <div style={{fontSize:28}}>{a.emoji}</div>
        <div style={{fontSize:12,fontWeight:700,color:"#F8FAFC",marginTop:3}}>{a.title}</div>
        <div style={{fontSize:10,color:"#22C55E"}}>{a.desc}</div>
      </Card>)}
      {locked.map(a=><Card key={a.id} style={{padding:12,textAlign:"center",opacity:.4}}>
        <div style={{fontSize:28,filter:"grayscale(1)"}}>🔒</div>
        <div style={{fontSize:12,fontWeight:700,color:"#64748B",marginTop:3}}>{a.title}</div>
        <div style={{fontSize:10,color:"#475569"}}>{a.desc}</div>
      </Card>)}
    </div>

    <Btn onClick={onLogout} v="danger" sz="md" style={{width:"100%"}}>Log Out</Btn>
  </div>;
};

// ═══ MAIN APP ═══
export default function App() {
  const [user,setUser] = useState(null);
  const [page,setPage] = useState("home");
  const [lvlUp,setLvlUp] = useState(false);
  const prevLevel = useRef(1);

  useEffect(()=>{
    if(user && user.level > prevLevel.current){
      setLvlUp(true);
      setTimeout(()=>setLvlUp(false),2500);
    }
    if(user) prevLevel.current = user.level;
  },[user]);

  if (!user) return <AuthScreen onLogin={u=>setUser(u)}/>;

  const pages = {home:<Home user={user} setPage={setPage}/>,learn:<Learn user={user} setUser={setUser}/>,stories:<Stories user={user} setUser={setUser}/>,games:<Games user={user} setUser={setUser}/>,garden:<Garden user={user} setUser={setUser}/>,profile:<Profile user={user} setUser={setUser} onLogout={()=>{setUser(null);setPage("home")}}/>};

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#0F172A 0%,#1E1B4B 50%,#0F172A 100%)",fontFamily:"'Fredoka',sans-serif",color:"#F8FAFC",maxWidth:480,margin:"0 auto",position:"relative",overflow:"hidden"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Quicksand:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#334155;border-radius:4px}
        @keyframes lvlPop{0%{transform:scale(0);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes lvlFade{0%{opacity:1}80%{opacity:1}100%{opacity:0}}`}</style>

      <Header user={user}/>
      {pages[page]}
      <Nav active={page} setActive={setPage}/>

      {/* Level Up Toast */}
      {lvlUp&&<div style={{position:"fixed",top:"30%",left:"50%",transform:"translateX(-50%)",zIndex:9999,animation:"lvlPop .5s ease-out, lvlFade 2.5s ease-in",textAlign:"center",background:"linear-gradient(135deg,rgba(34,197,94,.95),rgba(22,163,74,.95))",padding:"24px 40px",borderRadius:24,boxShadow:"0 16px 48px rgba(34,197,94,.5)"}}>
        <div style={{fontSize:48}}>🎉</div>
        <div style={{fontSize:24,fontWeight:700,color:"#fff"}}>Level Up!</div>
        <div style={{fontSize:16,color:"#D1FAE5"}}>You reached Level {user.level}!</div>
      </div>}
    </div>
  );
}
