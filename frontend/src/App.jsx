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
    const user = { id: Date.now().toString(36), username: u, password: p, avatar: av || "🌱", level: 1, xp: 0, streak: 1, completedLessons: [], completedStories: [], completedChallenges: [], achievements: [], ecoCoins: 50, garden: [], carbonSaved: 0, gamesPlayed: 0, pet: null, petName: "", petHappiness: 100, craftedItems: [], quizBest: 0, joinDate: new Date().toISOString() };
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
  {id:"s5",title:"Naya and the Melting Mountain",emoji:"🏔️",xp:40,cat:"climate",color:"#818CF8",
    pages:[{t:"Naya lived at the foot of Mount Glacia — crowned with ancient ice.",img:"🏔️🏘️❄️"},{t:"Every summer, glacier meltwater filled the streams. Life depended on it.",img:"💧🌊🏡"},{t:"But this year streams ran dry. The glacier was shrinking — fast.",img:"☀️🏔️😰"},{t:"\"The world is warming,\" said her teacher. \"Glaciers melt everywhere.\"",img:"🌍🌡️📚"},{t:"Naya started a climate club. Kids worldwide joined as Glacier Guardians!",img:"👧👦🌍✊"},{t:"Their movement gave the mountain a fighting chance.",img:"🏔️💚🕊️"}],
    quiz:[{q:"Why was glacier shrinking?",opts:["Earthquake","Global warming","Animals","Wind"],ans:1},{q:"Glaciers provide:",opts:["Gold","Fresh water","Electricity","Nothing"],ans:1},{q:"Naya started:",opts:["Nothing","Climate movement","Restaurant","Bank"],ans:1}]},
  {id:"s6",title:"The Plastic Island Mystery",emoji:"🏝️",xp:40,cat:"ocean",color:"#F472B6",
    pages:[{t:"Sailor Sam found an island not on any map — made entirely of trash!",img:"⛵🏝️🗑️"},{t:"The Great Pacific Garbage Patch — twice the size of Texas!",img:"🧴🥤📦"},{t:"Turtles trapped in rings. Birds tangled in plastic. A crisis!",img:"🐟🐦🐢"},{t:"Sam told everyone. Schools banned single-use plastic!",img:"🏫📄💪"},{t:"The island stopped growing. Every piece of plastic saved a life.",img:"🌊💚🐢"}],
    quiz:[{q:"Island made of:",opts:["Sand","Plastic trash","Coral","Seaweed"],ans:1},{q:"Garbage patch size:",opts:["Tiny","2x Texas","1 field","1 mile"],ans:1},{q:"Stop it by:",opts:["More plastic","Reduce single-use","Ignore","Burn"],ans:1}]},
  {id:"s7",title:"The Seed Vault Keepers",emoji:"🌾",xp:45,cat:"biodiversity",color:"#A3E635",
    pages:[{t:"In an Arctic mountain lies the Seed Vault — Earth's food backup!",img:"🏔️❄️🌱"},{t:"Seeds from every food plant. Millions of varieties protected!",img:"🌾🍅🌽"},{t:"75% of food plant varieties are lost forever. Diversity = survival.",img:"📉😢🌱"},{t:"Twins Aya and Zara grew rare heritage veggies at school.",img:"🥕🍅🏫"},{t:"Kids worldwide joined. Forgotten foods saved, one seed at a time!",img:"🌍👧👦🌻"}],
    quiz:[{q:"Vault stores:",opts:["Money","Food plant seeds","Ice cream","Animals"],ans:1},{q:"Diversity matters for:",opts:["Looks","Disease resistance","Fun","Nothing"],ans:1},{q:"Variety lost:",opts:["0%","25%","75%","100%"],ans:2}]},
  {id:"s8",title:"Zephyr the Wind Turbine",emoji:"🌬️",xp:45,cat:"energy",color:"#06B6D4",
    pages:[{t:"Zephyr the new turbine spun her blades — 500 homes lit up!",img:"🌬️💡✨"},{t:"No smoke, no pollution. Clean energy from the wind!",img:"🏠🏠💚"},{t:"The old coal plant got quieter as families chose wind power.",img:"🏭📉🌬️"},{t:"It shut down for good. Bluer sky, cleaner air, happy kids!",img:"☀️👧💙"}],
    quiz:[{q:"One turbine powers:",opts:["5","50","500","5000"],ans:2},{q:"Coal plant:",opts:["Grew","Shut down","Moved","Nothing"],ans:1},{q:"Wind advantage:",opts:["Expensive","No pollution","Loud","Ugly"],ans:1}]},
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
  {id:"l7",title:"Endangered Animals",emoji:"🐼",cat:"biodiversity",xp:35,color:"#EC4899",
    content:"Over 40,000 species face extinction! Habitat loss, pollution, and climate change are the main causes. Losing one species affects the whole ecosystem — like removing a piece from a puzzle.",
    qs:[{q:"Main cause of endangerment?",opts:["Zoos","Habitat loss","Fighting","Cold"],ans:1},{q:"Threatened species:",opts:["100","1,000","40,000+","10"],ans:2},{q:"Pandas are endangered",type:"tf",ans:true},{q:"Losing one species affects:",opts:["Nothing","Whole ecosystem","Just that animal","Only zoos"],ans:1}]},
  {id:"l8",title:"Carbon Footprint",emoji:"👣",cat:"climate",xp:35,color:"#8B5CF6",
    content:"Your carbon footprint = total CO2 from your activities. Driving = ~4.6 tons/year. A burger = ~3kg CO2! Flying NY→London = 1 ton. Small changes: walk more, eat local, reduce waste.",
    qs:[{q:"Carbon footprint measures:",opts:["Shoe size","Your CO2 output","Walking distance","Paper use"],ans:1},{q:"Biggest footprint?",opts:["Walking","Cycling","Driving","Reading"],ans:2},{q:"A burger = ~3kg CO2",type:"tf",ans:true},{q:"Reduce by:",opts:["Drive more","Fly lots","Eat local, walk more","Buy more"],ans:2}]},
  {id:"l9",title:"Fast Fashion",emoji:"👕",cat:"waste",xp:35,color:"#F97316",
    content:"Fashion = 10% of global CO2! One t-shirt uses 2,700 liters of water — what you'd drink in 2.5 years! Buying secondhand and wearing clothes longer makes a huge difference.",
    qs:[{q:"Fashion's CO2 share:",opts:["0.1%","10%","50%","90%"],ans:1},{q:"Water per t-shirt:",opts:["1L","100L","2,700L","1M L"],ans:2},{q:"Fast fashion is sustainable",type:"tf",ans:false},{q:"Better choice:",opts:["Buy new weekly","Secondhand/thrift","Throw away","Hoard"],ans:1}]},
  {id:"l10",title:"Food Waste",emoji:"🍕",cat:"waste",xp:35,color:"#14B8A6",
    content:"1/3 of all food produced is wasted — 1.3 billion tons/year! If food waste were a country, it'd be the 3rd largest CO2 emitter! Plan meals, eat leftovers, compost scraps.",
    qs:[{q:"Food wasted:",opts:["1%","10%","About 1/3","All"],ans:2},{q:"Food waste CO2 ranking:",opts:["Last","10th","3rd","1st"],ans:2},{q:"Leftovers should be trashed",type:"tf",ans:false},{q:"Reduce by:",opts:["Cook excess","Plan & eat leftovers","Only candy","Skip meals"],ans:1}]},
];

const GARDEN_SHOP = [
  {id:"p1",name:"Sunflower",emoji:"🌻",cost:20,type:"flower"},{id:"p2",name:"Oak Tree",emoji:"🌳",cost:50,type:"tree"},
  {id:"p3",name:"Cactus",emoji:"🌵",cost:15,type:"plant"},{id:"p4",name:"Rose",emoji:"🌹",cost:25,type:"flower"},
  {id:"p5",name:"Mushroom",emoji:"🍄",cost:10,type:"fungi"},{id:"p6",name:"Palm",emoji:"🌴",cost:60,type:"tree"},
  {id:"p7",name:"Tulip",emoji:"🌷",cost:20,type:"flower"},{id:"p8",name:"Cherry",emoji:"🌸",cost:40,type:"tree"},
  {id:"p9",name:"Butterfly",emoji:"🦋",cost:35,type:"creature"},{id:"p10",name:"Ladybug",emoji:"🐞",cost:30,type:"creature"},
  {id:"p11",name:"Frog",emoji:"🐸",cost:45,type:"creature"},{id:"p12",name:"Bee Hive",emoji:"🐝",cost:55,type:"creature"},
  {id:"p13",name:"Pond",emoji:"🪷",cost:70,type:"feature"},{id:"p14",name:"Bird House",emoji:"🏠",cost:40,type:"feature"},
  {id:"p15",name:"Hedge",emoji:"🌿",cost:30,type:"plant"},{id:"p16",name:"Deer",emoji:"🦌",cost:80,type:"creature"},
  {id:"p17",name:"Owl",emoji:"🦉",cost:65,type:"creature"},{id:"p18",name:"Rabbit",emoji:"🐇",cost:35,type:"creature"},
  {id:"p13",name:"Pond",emoji:"🪷",cost:70,type:"feature"},{id:"p14",name:"Bird House",emoji:"🏠",cost:40,type:"feature"},
  {id:"p15",name:"Hedge",emoji:"🌿",cost:30,type:"plant"},{id:"p16",name:"Deer",emoji:"🦌",cost:80,type:"creature"},
  {id:"p17",name:"Owl",emoji:"🦉",cost:65,type:"creature"},{id:"p18",name:"Rabbit",emoji:"🐇",cost:35,type:"creature"},
];

const TIPS = [
  "💡 Turn off lights when leaving a room!","🚰 5-min shower saves 40L vs a bath!",
  "🚶 Walking to school saves ~1kg CO2!","🌱 One tree absorbs 22kg CO2/year!",
  "♻️ Recycling 1 can = 3 hours of TV energy!","🐝 1/3 of food depends on bees!",
  "📦 Reusing a bag 5x cuts impact by 80%!","🍎 Local food = less transport pollution!",
  "👕 Buying secondhand saves 6kg CO2/item!","🥤 1 reusable bottle = 167 plastic/year!","🚲 10km cycling saves 2.6kg CO2 vs car!","🌍 Earth warmed 1.1°C since 1880!","🪱 Composting cuts landfill waste 30%!","🐋 Oceans absorb 30% of human CO2!",
  "👕 Buying secondhand saves 6kg CO2 per item!","🥤 1 reusable bottle replaces 167 plastic ones/year!",
  "🚲 Cycling 10km saves 2.6kg CO2 vs driving!","🌍 Earth has warmed 1.1°C since 1880!",
  "🪱 Composting reduces landfill waste by 30%!","🐋 Oceans absorb 30% of human CO2!",
];

const DAILY_CHALLENGES = [
  {id:"dc1",title:"Turn off 3 lights",emoji:"💡",xp:10,desc:"Find lights left on and turn them off!"},
  {id:"dc2",title:"Reusable bottle day",emoji:"🧴",xp:10,desc:"Skip plastic — use reusable all day!"},
  {id:"dc3",title:"Walk don't drive",emoji:"🚶",xp:15,desc:"Walk or bike somewhere you'd normally drive!"},
  {id:"dc4",title:"Zero food waste",emoji:"🍽️",xp:15,desc:"Eat everything — no waste today!"},
  {id:"dc5",title:"5-min shower",emoji:"🚿",xp:10,desc:"Time your shower — under 5 minutes!"},
  {id:"dc6",title:"Pick up litter",emoji:"🗑️",xp:20,desc:"Pick up 5 pieces of litter outside!"},
  {id:"dc7",title:"Learn eco-fact",emoji:"🧠",xp:10,desc:"Research one new environment fact!"},
];

const AVATARS = ["🌱","🌍","🌊","🦁","🐢","🦋","🌺","🐝","🦊","🐧","🦉","🐬","🌸","🐳","🦎","🌈"];

const ACHIEVEMENTS = [
  {id:"a1",title:"First Steps",emoji:"👣",desc:"Complete 1 lesson",check:u=>u.completedLessons.length>=1},
  {id:"a2",title:"Story Lover",emoji:"📚",desc:"Read 1 story",check:u=>u.completedStories.length>=1},
  {id:"a3",title:"Eco Warrior",emoji:"🛡️",desc:"Reach Level 3",check:u=>u.level>=3},
  {id:"a4",title:"Knowledge",emoji:"🧠",desc:"Complete 5 lessons",check:u=>u.completedLessons.length>=5},
  {id:"a5",title:"Green Thumb",emoji:"🌿",desc:"Plant 3 items",check:u=>u.garden.length>=3},
  {id:"a6",title:"Protector",emoji:"🌍",desc:"Earn 200 XP",check:u=>u.xp>=200},
  {id:"a7",title:"All Stories",emoji:"📖",desc:"Read all stories",check:u=>u.completedStories.length>=STORIES.length},
  {id:"a8",title:"Master",emoji:"👑",desc:"All lessons",check:u=>u.completedLessons.length>=LESSONS.length},
  {id:"a9",title:"Game King",emoji:"🎮",desc:"Play 10 games",check:u=>(u.gamesPlayed||0)>=10},
  {id:"a10",title:"Carbon Hero",emoji:"💚",desc:"Save 100kg CO2",check:u=>u.carbonSaved>=100},
  {id:"a11",title:"Rich!",emoji:"💰",desc:"Earn 500 coins",check:u=>u.ecoCoins>=500},
  {id:"a12",title:"Gardener",emoji:"🏡",desc:"Plant 10 items",check:u=>u.garden.length>=10},
  {id:"a13",title:"Legend",emoji:"⭐",desc:"Reach Level 10",check:u=>u.level>=10},
  {id:"a14",title:"Challenger",emoji:"🎯",desc:"5 challenges done",check:u=>(u.completedChallenges||[]).length>=5},
];


// ═══ V3: ECO PETS ═══
const PETS = [
  {id:"pet1",name:"Sprout",emoji:"🌱",cost:0,desc:"A seedling that grows with you!",evo:["🌱","🌿","🌳"]},
  {id:"pet2",name:"Coral",emoji:"🐠",cost:100,desc:"A colorful reef fish!",evo:["🐠","🐟","🐬"]},
  {id:"pet3",name:"Buzz",emoji:"🐛",cost:80,desc:"Dreams of beautiful wings!",evo:["🐛","🐝","🦋"]},
  {id:"pet4",name:"Droplet",emoji:"💧",cost:110,desc:"A raindrop's ocean journey!",evo:["💧","🌊","🌈"]},
  {id:"pet5",name:"Rocky",emoji:"🪨",cost:90,desc:"A pebble becoming a mountain!",evo:["🪨","⛰️","🏔️"]},
];

// ═══ V3: CRAFTING RECIPES ═══
const RECIPES = [
  {id:"c1",name:"Bird Feeder",emoji:"🪺",need:["🌻","🌳"],xp:15},
  {id:"c2",name:"Butterfly Garden",emoji:"🦋",need:["🌹","🌷"],xp:15},
  {id:"c3",name:"Fairy Ring",emoji:"🧚",need:["🍄","🍄"],xp:20},
  {id:"c4",name:"Tree House",emoji:"🏡",need:["🌳","🏠"],xp:25},
  {id:"c5",name:"Enchanted Pond",emoji:"✨",need:["🪷","🐸"],xp:25},
  {id:"c6",name:"Nature Reserve",emoji:"🏞️",need:["🌳","🦌","🦉"],xp:50},
];

// ═══ V3: WORD SCRAMBLE ═══
const ECO_WORDS = [
  {word:"RECYCLE",hint:"Turn old into new ♻️"},{word:"OCEAN",hint:"71% of Earth 🌊"},
  {word:"SOLAR",hint:"Sun energy ☀️"},{word:"FOREST",hint:"Tree home 🌳"},
  {word:"COMPOST",hint:"Scraps to soil 🪱"},{word:"CARBON",hint:"Footprint gas 👣"},
  {word:"GLACIER",hint:"Ice river 🏔️"},{word:"CORAL",hint:"Ocean rainforest 🪸"},
  {word:"HABITAT",hint:"Animal home 🏡"},{word:"CLIMATE",hint:"Long-term weather 🌡️"},
  {word:"TURBINE",hint:"Wind machine 🌬️"},{word:"SPECIES",hint:"Type of life 🐼"},
  {word:"OZONE",hint:"UV shield 🛡️"},{word:"EXTINCT",hint:"Gone forever 🦤"},
  {word:"ORGANIC",hint:"Grown naturally 🥬"},{word:"BIOME",hint:"Large ecosystem 🌎"},
];

// ═══ V3: SPEED QUIZ ═══
const SPEED_QS = [
  {q:"Trees produce...",a:"Oxygen",w:["CO2","Methane","Helium"]},
  {q:"Largest ocean?",a:"Pacific",w:["Atlantic","Indian","Arctic"]},
  {q:"Most recycled?",a:"Aluminum",w:["Plastic","Glass","Wood"]},
  {q:"Earth is __% water",a:"71%",w:["50%","90%","30%"]},
  {q:"Biggest rainforest?",a:"Amazon",w:["Congo","Borneo","Daintree"]},
  {q:"Plastic takes __yrs",a:"400+",w:["10","50","100"]},
  {q:"Wind energy is...",a:"Renewable",w:["Fossil","Nuclear","Chemical"]},
  {q:"Composting makes...",a:"Soil",w:["Plastic","Metal","Glass"]},
  {q:"Coral bleaching from...",a:"Warm water",w:["Cold","Fish","Sharks"]},
  {q:"Bees pollinate __%",a:"75%",w:["10%","25%","50%"]},
  {q:"Electric cars use...",a:"Batteries",w:["Gas","Coal","Wood"]},
  {q:"Ozone blocks...",a:"UV rays",w:["Rain","Wind","Sound"]},
  {q:"Deforestation causes...",a:"Habitat loss",w:["More trees","Rain","Snow"]},
  {q:"Biggest land animal?",a:"Elephant",w:["Rhino","Hippo","Giraffe"]},
  {q:"CO2 stands for...",a:"Carbon dioxide",w:["Calcium","Cobalt","Copper"]},
];

// ═══ V3: RANK SYSTEM ═══
const RANKS = [{n:"Seedling",e:"🌱",xp:0},{n:"Sprout",e:"🌿",xp:100},{n:"Sapling",e:"🪴",xp:300},{n:"Tree",e:"🌳",xp:600},{n:"Forest",e:"🌲",xp:1000},{n:"Guardian",e:"🛡️",xp:1500},{n:"Champion",e:"🏆",xp:2500},{n:"Legend",e:"⭐",xp:4000},{n:"Earth Hero",e:"🌍",xp:6000},{n:"Planet Savior",e:"💫",xp:10000}];
const getRank=(xp)=>[...RANKS].reverse().find(r=>xp>=r.xp)||RANKS[0];
const getNextRank=(xp)=>RANKS.find(r=>r.xp>xp)||RANKS[RANKS.length-1];

// ═══ V3: ECO FACTS ═══
const ECO_FACTS = ["🌳 One tree absorbs 48lbs CO2/year","🌊 Ocean makes 50%+ of oxygen","♻️ 1 ton recycled paper saves 17 trees","💡 LEDs use 75% less energy","🚰 Leaky faucet: 3,000 gal/year wasted","🌴 Rainforests = 50% of all species","🥤 Plastic bottle: 450 years to decompose","🌬️ Wind farms power millions of homes","🐝 Bees = 1 in 3 bites of food","🗑️ Average person: 4.4lbs trash/day","🐋 Oceans absorb 30% of CO2","🌡️ Earth warmed 1.1°C since 1880","🦠 Soil has more organisms than stars in galaxy","🚲 Cycling 10km saves 2.6kg CO2 vs driving"];

// ═══ SMALL COMPONENTS ═══
const XPBar = ({cur,max,color="#22C55E",h=12}) => (
  <div style={{width:"100%",height:h,background:"rgba(0,0,0,0.15)",borderRadius:h,overflow:"hidden",position:"relative"}}>
    <div style={{width:`${Math.min((cur/max)*100,100)}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}cc)`,borderRadius:h,transition:"width 0.8s cubic-bezier(.34,1.56,.64,1)",boxShadow:`0 0 8px ${color}55`}}/>
    {h >= 10 && <span style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:8,fontWeight:700,color:"#fff",textShadow:"0 1px 2px rgba(0,0,0,.4)"}}>{cur}/{max}</span>}
  </div>
);

const Btn = ({children,onClick,v="primary",sz="md",disabled,style:sx,...p}) => {
  const bg = {primary:"linear-gradient(135deg,#22C55E,#16A34A)",secondary:"rgba(255,255,255,0.1)",danger:"linear-gradient(135deg,#EF4444,#DC2626)",gold:"linear-gradient(135deg,#F59E0B,#D97706)",ghost:"transparent",purple:"linear-gradient(135deg,#8B5CF6,#7C3AED)"}[v];
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
const Home = ({user,setPage,setUser}) => {
  const [showFacts,setShowFacts] = useState(false);
  const tip = TIPS[new Date().getDate()%TIPS.length];
  const dc = DAILY_CHALLENGES[new Date().getDay()%DAILY_CHALLENGES.length];
  const dcDone = (user.completedChallenges||[]).includes(dc.id);
  const doDC = () => { if(dcDone)return; DB.addXP(user.username,dc.xp); DB.update(user.username,{completedChallenges:[...(user.completedChallenges||[]),dc.id]}); setUser(DB.get(user.username)); };
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

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:16}}>
      {[{e:"📚",v:user.completedLessons.length,l:"Lessons",c:"#22C55E"},{e:"📖",v:user.completedStories.length,l:"Stories",c:"#0EA5E9"},{e:"🎮",v:user.gamesPlayed||0,l:"Games",c:"#A855F7"},{e:"🌍",v:`${user.carbonSaved.toFixed(0)}kg`,l:"CO₂",c:"#F59E0B"}].map((s,i)=>
        <Card key={i} style={{textAlign:"center",padding:10}}>
          <div style={{fontSize:20}}>{s.e}</div>
          <div style={{fontSize:16,fontWeight:700,color:s.c}}>{s.v}</div>
          <div style={{fontSize:8,color:"#64748B"}}>{s.l}</div>
        </Card>
      )}
    </div>

    <Card style={{marginBottom:16,background:dcDone?"rgba(34,197,94,.08)":"linear-gradient(135deg,rgba(139,92,246,.12),rgba(139,92,246,.05))",border:dcDone?"1px solid rgba(34,197,94,.2)":"1px solid rgba(139,92,246,.15)"}}>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,fontWeight:700,color:dcDone?"#22C55E":"#A78BFA"}}>🎯 DAILY CHALLENGE</span><span style={{fontSize:11,color:"#22C55E"}}>+{dc.xp}XP</span></div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:6}}><span style={{fontSize:26}}>{dc.emoji}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#F8FAFC"}}>{dc.title}</div><div style={{fontSize:10,color:"#94A3B8"}}>{dc.desc}</div></div><Btn onClick={doDC} v={dcDone?"ghost":"purple"} sz="sm" disabled={dcDone}>{dcDone?"✅":"Done!"}</Btn></div>
    </Card>

    <Card style={{marginBottom:16,background:"linear-gradient(135deg,rgba(59,130,246,.08),rgba(139,92,246,.08))",border:"1px solid rgba(99,102,241,.12)"}}>
      <div style={{fontSize:11,fontWeight:700,color:"#818CF8",marginBottom:4}}>🌟 ECO TIP</div>
      <p style={{margin:0,fontSize:13,color:"#CBD5E1",lineHeight:1.5}}>{tip}</p>
    </Card>

    <Card onClick={()=>setShowFacts(true)} style={{marginBottom:16,cursor:"pointer",background:"linear-gradient(135deg,rgba(20,184,166,.1),rgba(20,184,166,.04))",border:"1px solid rgba(20,184,166,.15)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:24}}>📖</span><div><div style={{fontSize:13,fontWeight:700,color:"#14B8A6"}}>Eco Facts Diary</div><div style={{fontSize:10,color:"#94A3B8"}}>Tap to learn random facts!</div></div></div>
    </Card>
    <Modal open={showFacts} onClose={()=>setShowFacts(false)} title="📖 Eco Facts">
      <div style={{display:"flex",flexDirection:"column",gap:8}}>{ECO_FACTS.map((f,i)=><Card key={i} style={{padding:12}}><p style={{margin:0,fontSize:13,color:"#CBD5E1"}}>{f}</p></Card>)}</div>
    </Modal>
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
  const done = (xp) => { if(xp>0){DB.addXP(user.username,xp);}DB.update(user.username,{gamesPlayed:(user.gamesPlayed||0)+1});setUser(DB.get(user.username));setActive(null); };

  // Memory Match
  const MemoryMatch=()=>{const pairs=["🌳","🌊","☀️","🐝","♻️","🌍","🦋","💧"];const[cards]=useState(()=>[...pairs,...pairs].map((e,i)=>({id:i,emoji:e})).sort(()=>Math.random()-.5));const[fl,setFl]=useState([]);const[mt,setMt]=useState([]);const[mv,setMv]=useState(0);const isDone=mt.length===16;
    useEffect(()=>{if(fl.length===2){setMv(m=>m+1);const[a,b]=fl;if(cards[a].emoji===cards[b].emoji){setMt(m=>[...m,a,b]);setFl([]);}else setTimeout(()=>setFl([]),800);}},[fl]);
    if(isDone)return<div style={{textAlign:"center",padding:30}}><div style={{fontSize:64}}>🧠</div><h2 style={{color:"#F8FAFC"}}>Matched in {mv} moves!</h2>{mv<=16&&<p style={{color:"#22C55E",fontWeight:700}}>+25 XP!</p>}<Btn onClick={()=>done(mv<=16?25:10)}sz="lg"style={{marginTop:16}}>Done</Btn></div>;
    return<div style={{padding:"16px 16px 90px"}}><button onClick={()=>setActive(null)}style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginBottom:12}}>← Back</button><div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><h3 style={{color:"#F8FAFC",margin:0}}>🧠 Memory</h3><span style={{color:"#94A3B8",fontSize:13}}>Moves: {mv}</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>{cards.map((c,i)=>{const sh=fl.includes(i)||mt.includes(i);return<button key={i}onClick={()=>{if(fl.length<2&&!fl.includes(i)&&!mt.includes(i))setFl(f=>[...f,i])}}style={{aspectRatio:"1",borderRadius:14,fontSize:sh?28:20,display:"flex",alignItems:"center",justifyContent:"center",border:mt.includes(i)?"2px solid #22C55E":"1px solid rgba(255,255,255,.1)",background:mt.includes(i)?"rgba(34,197,94,.15)":sh?"rgba(99,102,241,.15)":"rgba(255,255,255,.05)",cursor:"pointer",transition:"all .3s"}}>{sh?c.emoji:"❓"}</button>})}</div></div>;
  };

  // Carbon Calculator
  const CarbonCalc=()=>{const[step,setStep]=useState(0);const[ans,setAns]=useState({});const qs=[{q:"Get to school?",opts:[{l:"🚶 Walk",v:0},{l:"🚌 Bus",v:2},{l:"🚗 Car",v:5}]},{q:"Eat meat?",opts:[{l:"🥗 Never",v:0},{l:"🍗 Sometimes",v:3},{l:"🥩 Daily",v:6}]},{q:"Recycle?",opts:[{l:"♻️ Everything",v:0},{l:"📦 Most",v:2},{l:"❌ No",v:5}]},{q:"Shower?",opts:[{l:"⚡ 3min",v:0},{l:"🚿 5min",v:1},{l:"🛁 15+",v:5}]}];
    if(step>=qs.length){const total=Object.values(ans).reduce((a,b)=>a+b,0);const pct=Math.round((1-total/(qs.length*6))*100);return<div style={{textAlign:"center",padding:30}}><div style={{fontSize:56}}>{pct>=70?"🏆":"🌱"}</div><h2 style={{color:"#F8FAFC"}}>Eco-score: {pct}%</h2><div style={{margin:"12px auto",maxWidth:200}}><XPBar cur={pct}max={100}color={pct>=60?"#22C55E":"#F59E0B"}h={16}/></div><Btn onClick={()=>done(pct>=60?25:10)}sz="lg"style={{marginTop:16}}>Done</Btn></div>;}
    return<div style={{padding:"16px 16px 90px"}}><button onClick={()=>setActive(null)}style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginBottom:12}}>← Back</button><h3 style={{color:"#F8FAFC",textAlign:"center"}}>👣 Carbon Calculator ({step+1}/{qs.length})</h3><XPBar cur={step}max={qs.length}color="#8B5CF6"h={6}/><h3 style={{color:"#F8FAFC",fontSize:18,margin:"20px 0 16px",textAlign:"center"}}>{qs[step].q}</h3><div style={{display:"flex",flexDirection:"column",gap:10}}>{qs[step].opts.map((o,i)=><button key={i}onClick={()=>{setAns({...ans,[step]:o.v});setStep(step+1)}}style={{padding:"14px",borderRadius:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"#E2E8F0",fontSize:15,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>{o.l}</button>)}</div></div>;
  };

  // Pollution Fighter
  const PollutionFighter=()=>{const[sc,setSc]=useState(0);const[tm,setTm]=useState(20);const[grid,setGrid]=useState(Array(9).fill(null));const ov=tm<=0;const bads=["🏭","💨","🛢️","🚗"];const gds=["🌳","🌸","🐝"];
    useEffect(()=>{if(ov)return;const t=setInterval(()=>setTm(t=>t-1),1000);return()=>clearInterval(t)},[ov]);
    useEffect(()=>{if(ov)return;const t=setInterval(()=>{setGrid(g=>{const n=[...g];n[Math.floor(Math.random()*9)]=Math.random()>.3?bads[Math.floor(Math.random()*bads.length)]:gds[Math.floor(Math.random()*gds.length)];return n})},900);return()=>clearInterval(t)},[ov]);
    const tap=i=>{if(!grid[i]||grid[i]==="💥"||grid[i]==="😢")return;if(bads.includes(grid[i])){setSc(s=>s+1);setGrid(g=>{const n=[...g];n[i]="💥";setTimeout(()=>setGrid(gg=>{const nn=[...gg];nn[i]=null;return nn}),300);return n})}else{setSc(s=>Math.max(0,s-1));setGrid(g=>{const n=[...g];n[i]="😢";setTimeout(()=>setGrid(gg=>{const nn=[...gg];nn[i]=null;return nn}),300);return n})}};
    if(ov)return<div style={{textAlign:"center",padding:30}}><div style={{fontSize:64}}>⚔️</div><h2 style={{color:"#F8FAFC"}}>Beat {sc} polluters!</h2>{sc>=10&&<p style={{color:"#22C55E",fontWeight:700}}>+25 XP!</p>}<Btn onClick={()=>done(sc>=10?25:10)}sz="lg"style={{marginTop:16}}>Done</Btn></div>;
    return<div style={{padding:"16px 16px 90px"}}><button onClick={()=>setActive(null)}style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginBottom:8}}>← Back</button><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{color:"#EF4444",fontWeight:700}}>⚔️ {sc}</span><span style={{color:"#F8FAFC",fontWeight:700}}>⏱ {tm}s</span></div><p style={{color:"#94A3B8",fontSize:10,textAlign:"center",marginBottom:6}}>Tap 🏭💨 — don't tap 🌳🐝!</p><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{grid.map((c,i)=><button key={i}onClick={()=>tap(i)}style={{aspectRatio:"1",borderRadius:16,fontSize:c?36:20,display:"flex",alignItems:"center",justifyContent:"center",background:c?"rgba(255,255,255,.06)":"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.08)",cursor:c?"pointer":"default"}}>{c||""}</button>)}</div></div>;
  };

  if(active==="sort") return <EcoSorter onDone={done} onBack={()=>setActive(null)}/>;
  if(active==="water") return <WaterDrop onDone={done} onBack={()=>setActive(null)}/>;
  if(active==="memory") return <MemoryMatch/>;
  if(active==="carbon") return <CarbonCalc/>;
  if(active==="fight") return <PollutionFighter/>;

  // V3: Word Scramble
  const WordScramble=()=>{const[wi,setWi]=useState(0);const[guess,setGuess]=useState("");const[sc,setSc]=useState(0);const[fb,setFb]=useState(null);
    const words=useRef([...ECO_WORDS].sort(()=>Math.random()-.5).slice(0,8));const scramble=(w)=>w.split("").sort(()=>Math.random()-.5).join("");
    if(wi>=words.current.length)return<div style={{textAlign:"center",padding:30}}><div style={{fontSize:64}}>📝</div><h2 style={{color:"#F8FAFC"}}>{sc}/{words.current.length} words!</h2>{sc>=5&&<p style={{color:"#22C55E",fontWeight:700}}>+30 XP!</p>}<Btn onClick={()=>done(sc>=5?30:10)}sz="lg"style={{marginTop:16}}>Done</Btn></div>;
    const cur=words.current[wi];const scr=scramble(cur.word);
    const check=()=>{if(guess.toUpperCase()===cur.word){setSc(s=>s+1);setFb("✅");setTimeout(()=>{setFb(null);setGuess("");setWi(w=>w+1)},600)}else{setFb("❌");setTimeout(()=>setFb(null),600)}};
    return<div style={{padding:"16px 16px 90px"}}><button onClick={()=>setActive(null)}style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginBottom:12}}>← Back</button>
      <h3 style={{color:"#F8FAFC",textAlign:"center"}}>📝 Word Scramble ({wi+1}/{words.current.length})</h3><XPBar cur={wi}max={words.current.length}color="#EC4899"h={6}/>
      <div style={{textAlign:"center",margin:"24px 0"}}><div style={{fontSize:32,letterSpacing:8,color:"#F59E0B",fontWeight:700,marginBottom:8}}>{scr}</div><p style={{color:"#94A3B8",fontSize:12}}>{cur.hint}</p></div>
      <div style={{display:"flex",gap:8}}><input value={guess}onChange={e=>setGuess(e.target.value)}onKeyDown={e=>e.key==="Enter"&&check()}placeholder="Type the word..."style={{flex:1,padding:"12px 16px",borderRadius:14,border:"2px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#F8FAFC",fontSize:16,fontFamily:"'Fredoka',sans-serif",outline:"none",textTransform:"uppercase",letterSpacing:3,boxSizing:"border-box"}}/><Btn onClick={check}>Go</Btn></div>
      {fb&&<div style={{textAlign:"center",marginTop:12,fontSize:24}}>{fb}</div>}
    </div>;
  };

  // V3: Speed Quiz
  const SpeedQuiz=()=>{const[qi,setQi]=useState(0);const[sc,setSc]=useState(0);const[tm,setTm]=useState(30);const ov=tm<=0||qi>=SPEED_QS.length;
    const qs=useRef([...SPEED_QS].sort(()=>Math.random()-.5));
    useEffect(()=>{if(ov)return;const t=setInterval(()=>setTm(t=>t-1),1000);return()=>clearInterval(t)},[ov]);
    if(ov)return<div style={{textAlign:"center",padding:30}}><div style={{fontSize:64}}>⚡</div><h2 style={{color:"#F8FAFC"}}>{sc} correct!</h2>{sc>=6&&<p style={{color:"#22C55E",fontWeight:700}}>+30 XP!</p>}<Btn onClick={()=>done(sc>=6?30:10)}sz="lg"style={{marginTop:16}}>Done</Btn></div>;
    const q=qs.current[qi];const opts=useRef([q.a,...q.w].sort(()=>Math.random()-.5));
    useEffect(()=>{if(qi<qs.current.length){const q2=qs.current[qi];opts.current=[q2.a,...q2.w].sort(()=>Math.random()-.5)}},[qi]);
    return<div style={{padding:"16px 16px 90px"}}><button onClick={()=>setActive(null)}style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginBottom:8}}>← Back</button>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{color:"#22C55E",fontWeight:700}}>⚡ {sc}</span><span style={{color:tm<=10?"#EF4444":"#F8FAFC",fontWeight:700,fontSize:tm<=5?20:14,transition:"all .3s"}}>⏱ {tm}s</span></div>
      <h3 style={{color:"#F8FAFC",fontSize:18,textAlign:"center",margin:"16px 0"}}>{q.q}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{opts.current.map((o,i)=><button key={o+i}onClick={()=>{if(o===q.a)setSc(s=>s+1);setQi(qi+1)}}style={{padding:"14px",borderRadius:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"#E2E8F0",fontSize:14,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>{o}</button>)}</div>
    </div>;
  };

  // V3: Ecosystem Builder
  const EcoBuilder=()=>{const[eco,setEco]=useState({water:50,air:50,soil:50,bio:50});const[turn,setTurn]=useState(0);const[log,setLog]=useState([]);const maxT=8;
    const actions=[
      {n:"Plant Trees",e:"🌳",eff:{air:15,soil:10,bio:10,water:5}},
      {n:"Clean River",e:"🏞️",eff:{water:20,bio:10,soil:5,air:0}},
      {n:"Build Wind Farm",e:"🌬️",eff:{air:15,water:0,soil:-5,bio:5}},
      {n:"Create Wetland",e:"🐸",eff:{water:15,bio:20,soil:5,air:5}},
      {n:"Start Recycling",e:"♻️",eff:{soil:15,air:10,water:5,bio:5}},
      {n:"Protect Species",e:"🦁",eff:{bio:25,water:0,soil:0,air:0}},
    ];
    const act=(a)=>{if(turn>=maxT)return;const ne={};Object.keys(eco).forEach(k=>{ne[k]=Math.min(100,Math.max(0,eco[k]+(a.eff[k]||0)))});setEco(ne);setTurn(turn+1);setLog([...log,a.n])};
    const avg=Math.round((eco.water+eco.air+eco.soil+eco.bio)/4);
    if(turn>=maxT)return<div style={{textAlign:"center",padding:30}}><div style={{fontSize:64}}>{avg>=75?"🌍":avg>=50?"🌱":"🏜️"}</div><h2 style={{color:"#F8FAFC"}}>Ecosystem: {avg}%</h2><p style={{color:"#94A3B8"}}>{avg>=75?"Thriving!":avg>=50?"Healthy":"Needs work"}</p>{avg>=60&&<p style={{color:"#22C55E",fontWeight:700}}>+30 XP!</p>}<Btn onClick={()=>done(avg>=60?30:10)}sz="lg"style={{marginTop:16}}>Done</Btn></div>;
    return<div style={{padding:"16px 16px 90px"}}><button onClick={()=>setActive(null)}style={{background:"none",border:"none",color:"#64748B",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",marginBottom:12}}>← Back</button>
      <h3 style={{color:"#F8FAFC",textAlign:"center",margin:"0 0 4px"}}>🌎 Ecosystem Builder</h3><p style={{color:"#64748B",textAlign:"center",fontSize:11,margin:"0 0 12px"}}>Turn {turn}/{maxT} — Balance your ecosystem!</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>{[{k:"water",l:"💧 Water",c:"#0EA5E9"},{k:"air",l:"🌬️ Air",c:"#22C55E"},{k:"soil",l:"🪨 Soil",c:"#A16207"},{k:"bio",l:"🦋 Biodiv.",c:"#A855F7"}].map(s=><div key={s.k}style={{padding:8,borderRadius:12,background:"rgba(255,255,255,.04)"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,color:"#94A3B8"}}>{s.l}</span><span style={{fontSize:10,color:s.c,fontWeight:700}}>{eco[s.k]}%</span></div><XPBar cur={eco[s.k]}max={100}color={s.c}h={8}/></div>)}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{actions.map((a,i)=><button key={i}onClick={()=>act(a)}style={{padding:"10px",borderRadius:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",color:"#E2E8F0",fontSize:12,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",textAlign:"center"}}><div style={{fontSize:22}}>{a.e}</div>{a.n}</button>)}</div>
    </div>;
  };

  if(active==="scramble") return <WordScramble/>;
  if(active==="speed") return <SpeedQuiz/>;
  if(active==="eco") return <EcoBuilder/>;

  const games = [
    {id:"sort",title:"Eco Sorter",emoji:"🗑️",desc:"Sort waste into bins!",color:"#22C55E",xp:20},
    {id:"water",title:"Water Drop Quest",emoji:"💧",desc:"Catch falling drops!",color:"#0EA5E9",xp:20},
    {id:"memory",title:"Eco Memory Match",emoji:"🧠",desc:"Match eco-symbol pairs!",color:"#8B5CF6",xp:25},
    {id:"carbon",title:"Carbon Calculator",emoji:"👣",desc:"Find your footprint!",color:"#F59E0B",xp:25},
    {id:"fight",title:"Pollution Fighter",emoji:"⚔️",desc:"Smash polluters!",color:"#EF4444",xp:25},
    {id:"scramble",title:"Word Scramble",emoji:"📝",desc:"Unscramble eco-words!",color:"#EC4899",xp:30},
    {id:"speed",title:"Speed Quiz",emoji:"⚡",desc:"Race the clock!",color:"#F97316",xp:30},
    {id:"eco",title:"Ecosystem Builder",emoji:"🌎",desc:"Build & balance an ecosystem!",color:"#14B8A6",xp:30},
  ];

  return <div style={{padding:"0 16px 90px"}}>
    <h2 style={{color:"#F8FAFC",fontSize:20,margin:"0 0 4px"}}>Mini Games 🎮</h2>
    <p style={{color:"#64748B",fontSize:12,margin:"0 0 16px"}}>Games played: {user.gamesPlayed||0}</p>
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
  const [tab,setTab] = useState("garden");
  const buy=(item)=>{if(user.ecoCoins<item.cost)return;DB.update(user.username,{ecoCoins:user.ecoCoins-item.cost,garden:[...user.garden,{...item,at:Date.now()}]});setUser(DB.get(user.username))};
  const adoptPet=(pet)=>{if(user.pet||user.ecoCoins<pet.cost)return;DB.update(user.username,{pet:pet.id,petName:pet.name,petHappiness:100,ecoCoins:user.ecoCoins-pet.cost});setUser(DB.get(user.username))};
  const feedPet=()=>{if(!user.pet)return;DB.update(user.username,{petHappiness:Math.min(100,(user.petHappiness||50)+20)});DB.addXP(user.username,5);setUser(DB.get(user.username))};
  const craft=(recipe)=>{const ge=user.garden.map(g=>g.emoji);const ok=recipe.need.every(n=>ge.filter(e=>e===n).length>=recipe.need.filter(x=>x===n).length);if(!ok)return;let rem=[...user.garden];recipe.need.forEach(n=>{const i=rem.findIndex(g=>g.emoji===n);if(i>=0)rem.splice(i,1)});rem.push({name:recipe.name,emoji:recipe.emoji,type:"crafted",at:Date.now()});DB.update(user.username,{garden:rem,craftedItems:[...(user.craftedItems||[]),recipe.id]});DB.addXP(user.username,recipe.xp);setUser(DB.get(user.username))};
  const petData=PETS.find(p=>p.id===user.pet);const petStage=petData?Math.min(Math.floor((user.level||1)/3),petData.evo.length-1):0;

  return <div style={{padding:"0 16px 90px"}}>
    <div style={{display:"flex",background:"rgba(255,255,255,.05)",borderRadius:14,padding:3,marginBottom:14,border:"1px solid rgba(255,255,255,.06)"}}>
      {[{id:"garden",l:"🌻 Garden"},{id:"pet",l:"🐾 Pet"},{id:"craft",l:"🔨 Craft"}].map(t=><button key={t.id}onClick={()=>setTab(t.id)}style={{flex:1,padding:"8px 0",borderRadius:11,border:"none",fontFamily:"'Fredoka',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",background:tab===t.id?"linear-gradient(135deg,#22C55E,#16A34A)":"transparent",color:tab===t.id?"#fff":"#64748B"}}>{t.l}</button>)}
    </div>

    {tab==="garden"&&<>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h2 style={{color:"#F8FAFC",fontSize:18,margin:0}}>Garden ({user.garden.length})</h2><Btn onClick={()=>setShop(true)}v="gold"sz="sm">🛒 Shop</Btn></div>
      {!user.garden.length?<Card style={{textAlign:"center",padding:36}}><div style={{fontSize:44}}>🌱</div><p style={{color:"#94A3B8"}}>Empty! Buy plants to grow your garden!</p><Btn onClick={()=>setShop(true)}v="gold"style={{marginTop:10}}>🛒 Shop</Btn></Card>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,background:"rgba(34,197,94,.04)",borderRadius:20,padding:12,border:"1px solid rgba(34,197,94,.1)"}}>
        {user.garden.map((it,i)=><div key={i}style={{display:"flex",flexDirection:"column",alignItems:"center",padding:5,borderRadius:12,background:it.type==="crafted"?"rgba(245,158,11,.08)":"rgba(255,255,255,.03)",border:it.type==="crafted"?"1px solid rgba(245,158,11,.3)":"1px solid rgba(255,255,255,.05)",aspectRatio:"1",justifyContent:"center"}}><span style={{fontSize:24}}>{it.emoji}</span><span style={{fontSize:7,color:it.type==="crafted"?"#F59E0B":"#94A3B8"}}>{it.name}</span></div>)}
      </div>}
      <Modal open={shop}onClose={()=>setShop(false)}title="🛒 Eco Shop"><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14,padding:"7px 12px",background:"rgba(245,158,11,.1)",borderRadius:10}}><span>🪙</span><span style={{color:"#F59E0B",fontWeight:700}}>{user.ecoCoins}</span></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{GARDEN_SHOP.map(it=>{const ok=user.ecoCoins>=it.cost;return<button key={it.id}onClick={()=>ok&&buy(it)}style={{padding:10,borderRadius:14,textAlign:"center",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.07)",cursor:ok?"pointer":"not-allowed",opacity:ok?1:.4,fontFamily:"'Fredoka',sans-serif"}}><div style={{fontSize:24}}>{it.emoji}</div><div style={{fontSize:10,color:"#F8FAFC",fontWeight:600}}>{it.name}</div><div style={{fontSize:10,color:"#F59E0B"}}>🪙 {it.cost}</div></button>})}</div></Modal>
    </>}

    {tab==="pet"&&<>
      <h2 style={{color:"#F8FAFC",fontSize:18,margin:"0 0 12px"}}>Eco Pet 🐾</h2>
      {user.pet?<Card style={{textAlign:"center",padding:24,background:"linear-gradient(135deg,rgba(139,92,246,.1),rgba(139,92,246,.04))",border:"1px solid rgba(139,92,246,.15)"}}>
        <div style={{fontSize:64,marginBottom:8}}>{petData.evo[petStage]}</div>
        <h3 style={{color:"#F8FAFC",margin:"0 0 4px"}}>{user.petName}</h3>
        <p style={{color:"#A78BFA",fontSize:12,margin:"0 0 12px"}}>Stage {petStage+1}/{petData.evo.length} — Evolves every 3 levels!</p>
        <div style={{marginBottom:12}}><div style={{fontSize:10,color:"#94A3B8",marginBottom:4}}>Happiness: {user.petHappiness||50}%</div><XPBar cur={user.petHappiness||50}max={100}color="#A855F7"h={10}/></div>
        <Btn onClick={feedPet}v="purple"sz="md">🍃 Feed Pet (+5 XP)</Btn>
      </Card>
      :<><p style={{color:"#94A3B8",fontSize:13,marginBottom:16}}>Adopt a companion! It evolves as you level up!</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{PETS.map(p=>{const ok=user.ecoCoins>=p.cost;return<Card key={p.id}onClick={()=>ok&&adoptPet(p)}style={{textAlign:"center",padding:14,cursor:ok?"pointer":"not-allowed",opacity:ok?1:.5}}>
          <div style={{fontSize:36}}>{p.emoji}</div><div style={{fontSize:13,fontWeight:700,color:"#F8FAFC",marginTop:4}}>{p.name}</div><div style={{fontSize:10,color:"#94A3B8"}}>{p.desc}</div>
          <div style={{fontSize:12,color:"#F59E0B",marginTop:4}}>{p.cost===0?"FREE!":"🪙 "+p.cost}</div>
          <div style={{fontSize:9,color:"#64748B",marginTop:2}}>{p.evo.join(" → ")}</div>
        </Card>})}</div>
      </>}
    </>}

    {tab==="craft"&&<>
      <h2 style={{color:"#F8FAFC",fontSize:18,margin:"0 0 4px"}}>Crafting 🔨</h2>
      <p style={{color:"#94A3B8",fontSize:11,marginBottom:14}}>Combine garden items to make special things!</p>
      {RECIPES.map(r=>{const ge=user.garden.map(g=>g.emoji);const ok=r.need.every(n=>ge.filter(e=>e===n).length>=r.need.filter(x=>x===n).length);const dn=(user.craftedItems||[]).includes(r.id);
        return<Card key={r.id}style={{display:"flex",alignItems:"center",gap:12,padding:14,marginBottom:8,opacity:dn?.5:1,border:ok&&!dn?"1px solid rgba(34,197,94,.2)":"1px solid rgba(255,255,255,.06)"}}>
          <span style={{fontSize:28}}>{dn?"✅":r.emoji}</span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#F8FAFC"}}>{r.name}</div><div style={{fontSize:10,color:"#94A3B8"}}>Needs: {r.need.join(" + ")} • +{r.xp}XP</div></div>
          {!dn&&<Btn onClick={()=>ok&&craft(r)}v={ok?"primary":"ghost"}sz="sm"disabled={!ok}>{ok?"Craft!":"Need items"}</Btn>}
        </Card>})}
    </>}
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
      <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 14px",borderRadius:20,background:"linear-gradient(135deg,rgba(34,197,94,.15),rgba(34,197,94,.05))",border:"1px solid rgba(34,197,94,.2)"}}><span style={{fontSize:16}}>{getRank(user.xp).e}</span><span style={{color:"#22C55E",fontSize:13,fontWeight:700}}>Lv.{user.level} {getRank(user.xp).n}</span></div>
      {getNextRank(user.xp).xp>user.xp&&<p style={{color:"#64748B",fontSize:10,marginTop:4}}>{getNextRank(user.xp).xp-user.xp} XP to {getNextRank(user.xp).n}</p>}
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

  const pages = {home:<Home user={user} setPage={setPage} setUser={setUser}/>,learn:<Learn user={user} setUser={setUser}/>,stories:<Stories user={user} setUser={setUser}/>,games:<Games user={user} setUser={setUser}/>,garden:<Garden user={user} setUser={setUser}/>,profile:<Profile user={user} setUser={setUser} onLogout={()=>{setUser(null);setPage("home")}}/>};

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
