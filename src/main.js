import './style.css'

//TODO 
/**
 * list that contains 6 different moon divs
 * 
 * API calls to to grab celestial body positions as well To make the night more eventful
 * Add Cloud art
 * 
 * 
 * FINISH THE OTHER SECTIONS!
 */



// --- Lerp helper ---
// Blends from `begin` to `end` based on t (0.0 = begin, 1.0 = end)
function lerp(begin, end, t) {
  return begin + (end - begin) * t;
}

// Lerp each RGB channel separately
function lerpColor(c1, c2, t) {
  return {
    r: Math.round(lerp(c1.r, c2.r, t)),
    g: Math.round(lerp(c1.g, c2.g, t)),
    b: Math.round(lerp(c1.b, c2.b, t)),
  };
}

// --- Time of day constants ---
let SUNRISE = 6;   // 6:00 AM
let SUNSET  = 18;  // 6:00 PM

let Daylight = SUNSET- SUNRISE;
let Nightlight = 24 - Daylight;


/*
  Values meant to stop celestial bodies from teleporting after a load.
*/

let currentSunProgress  = 0;
let currentMoonProgress = 0;



// Sky colors at each phase (matching your CSS vars)
const SKY_COLORS = {
  morning:  { r: 208, g: 255, b: 196 },  // --Morning
  midday:   { r: 161, g: 217, b: 158 },  // --Midday
  twilight: { r: 62,  g: 98,  b: 148 },  // --Twilight
  midnight: { r: 38,  g: 40,  b: 64  },  // --Midnight  (#262840)
};

const FONT_COLORS = {
  day:   { r: 20,  g: 22,  b: 25 },  //  color that chat told me to use LOL
  night: { r: 208, g: 255, b: 196 },  // --Morning
}

const GLOW_COLORS = {
  day:   { r: 100, g: 140, b: 190  },  // --morning-glow
  night: { r: 255, g: 255, b: 255 },  // --night-glow
}

const TOOL_COLORS = {
  day: {r: 255, g: 255, b: 255},
  night: {r: 232, g: 238, b: 245},
}

//moon
const moonEl = document.createElement('div');
moonEl.classList.add('moon-full');

// moon craters
const moonC_1 = document.createElement('div');
moonC_1.classList.add('mooncrater-1-full');
const moonC_2 = document.createElement('div');
moonC_2.classList.add('mooncrater-2-full');
const moonC_3 = document.createElement('div');
moonC_3.classList.add('mooncrater-3-full');

const moonToolTip = document.createElement('div');
moonToolTip.classList.add('celestial-tooltip');
const moonTxtbox1 = document.createElement('p');
const moonTxtbox2 = document.createElement('p');
moonTxtbox1.textContent = `The moon's position reflects your real local time.`;
moonTxtbox2.textContent = `If location is enabled, it follows its actual arc across your sky!`;
moonToolTip.appendChild(moonTxtbox1);
moonToolTip.appendChild(moonTxtbox2);
moonEl.appendChild(moonToolTip);


moonEl.appendChild(moonC_1);
moonEl.appendChild(moonC_2);
moonEl.appendChild(moonC_3);


document.body.appendChild(moonEl);

// --- Sun position math ---
// Returns { x, y, visible } based on current real-world time
function getSunPosition() {
  const now     = new Date();
  // hours as a decimal, e.g. 14:30 = 14.5
  const hours   = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;



  // 0.0 = sunrise, 0.5 = noon, 1.0 = sunset
  const progress = (hours - SUNRISE) / Daylight;
  const visible_s  = progress >= 0 && progress <= 1;

  // Clamp so the sun sits at the horizon when below 0 or above 1
  const t     = Math.max(0, Math.min(1, progress));

  // t * PI traces the top half of a circle (0 = left, PI/2 = top, PI = right)
  const angle = t * Math.PI;

  const W = window.innerWidth;
  const H = window.innerHeight;

  // Arc geometry: horizon at 88% down, arc reaches near the top of the screen
  const horizonY  = H * 0.88;
  const xRadius   = W  * 0.46;   // how far left/right the arc stretches
  const yRadius   = H  * 0.78;   // how tall the arc is

  // Parametric half-circle
  //   cos(0)=1 → right side, so negate to start LEFT at sunrise
  const x_s = W / 2 - Math.cos(angle) * xRadius;
  const y_s = horizonY - Math.sin(angle) * yRadius;

  return { x_s, y_s, visible_s, progress};
}

// get moon position math, will work like sun position but for the moon.
function getMoonPosition(){
  const now = new Date();

  let hours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  // shift 0-6am into 24-30 range so the arc is continuous across midnight
  if(hours >= 0 && hours <= SUNRISE){
    hours += 24;
  }


  const progress = (hours - SUNSET) / Nightlight;
  // console.log(`nightlight hours ${Nightlight}`);
  // console.log(`hours ${hours} Sunset ${SUNSET}`);
  // console.log(progress);
  const visible_m = progress >= 0 && progress <= 1; //only visible when between the hours of 1800 and 2359 or 0000 and 0600

  const t = Math.max(0, Math.min(1, progress));

  const angle = Math.PI * t;


  const W = window.innerWidth;
  const H = window.innerHeight;

  // Arc geometry: horizon at 88% down, arc reaches near the top of the screen
  const horizonY  = H * 0.88;
  const xRadius   = W  * 0.46;   // how far left/right the arc stretches
  const yRadius   = H  * 0.78;   // how tall the arc is


  // Parametric half-circle
  //   cos(0)=1 → right side, so negate to start LEFT at sunrise
  const x_m = W / 2 - Math.cos(angle) * xRadius;
  const y_m = horizonY - Math.sin(angle) * yRadius;

  return { x_m, y_m, visible_m, progress};


}


// --- Sky color based on time ---

// Claude worked wonders here
function getSkyColor(hours) {
  const NOON = (SUNRISE + SUNSET) / 2;

  const stops = [
    { t:  0,       color: SKY_COLORS.midnight },
    { t: SUNRISE,  color: SKY_COLORS.morning  },
    { t: NOON,     color: SKY_COLORS.midday   },
    { t: SUNSET,   color: SKY_COLORS.twilight },
    { t: 24,       color: SKY_COLORS.midnight },
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (hours >= a.t && hours <= b.t) {
      return lerpColor(a.color, b.color, (hours - a.t) / (b.t - a.t));
    }
  }

  return SKY_COLORS.midnight;
}

function getToolTipColor(hours){
  if (hours > SUNSET || hours < SUNRISE) return TOOL_COLORS.night;
  return TOOL_COLORS.day;
}

// --- font color based on time ---
function getFontColor(hours){
  if (hours > SUNSET || hours < SUNRISE) return FONT_COLORS.night;
  return FONT_COLORS.day;
}

function getGlowColor(hours){
  if (hours > SUNSET || hours < SUNRISE) return GLOW_COLORS.night;
  return GLOW_COLORS.day;
}

// --- DOM setup ---


//sun
const sunEl = document.createElement('div');
sunEl.classList.add('sun');

for(let i = 0; i < 4; i++){
  const ray = document.createElement('div');
  ray.classList.add('ray');
  let d = i * 90;


  //if we ever need it
  ray.style.setProperty('--angle_' + i, d +`deg`);
  ray.style.transform = 'rotate(' +d+'deg)'
  sunEl.appendChild(ray);
}

const sunToolTip = document.createElement('div');
sunToolTip.classList.add('celestial-tooltip');
const celestialTxtbox1 = document.createElement('p');
const celestialTxtbox2 = document.createElement('p');
celestialTxtbox1.textContent = `The sun's position reflects your real local time.`;
celestialTxtbox2.textContent = `If location is enabled, it follows its actual arc across your sky!`;
sunToolTip.appendChild(celestialTxtbox1);
sunToolTip.appendChild(celestialTxtbox2);
sunEl.appendChild(sunToolTip);

sunEl.addEventListener('mouseenter', () => {
  const sunRect  = sunEl.getBoundingClientRect();
  const tipWidth = sunToolTip.offsetWidth;
  const margin   = 8;
  const sunCenterX = sunRect.left + sunRect.width / 2;

  // Default: center tooltip over the sun
  let tipLeft = sunCenterX - tipWidth / 2;

  // Clamp to viewport edges
  tipLeft = Math.max(margin, Math.min(tipLeft, window.innerWidth - tipWidth - margin));

  // Position tooltip in viewport coords, then offset relative to sun's left
  sunToolTip.style.left      = `${tipLeft - sunRect.left}px`;
  sunToolTip.style.transform = 'none';

  // Keep arrow pointing at the sun center
  const arrowLeft = sunCenterX - tipLeft;
  sunToolTip.style.setProperty('--arrow-left', `${arrowLeft}px`);
});

document.body.appendChild(sunEl);

// Persist a fixed epoch in sessionStorage so the spin animation stays in sync
// across page navigations and browser tab switches.
if (!sessionStorage.getItem('animEpoch')) {
  sessionStorage.setItem('animEpoch', Date.now());
}
const ANIM_EPOCH = parseInt(sessionStorage.getItem('animEpoch'));
const RAY_OFFSETS = [0, 2, 4, 6]; // matches the original staggered delays (seconds)


//CLaude Slop, will try to fix this myself lol 
function resyncRays() {
  const elapsed = (Date.now() - ANIM_EPOCH) / 1000;
  sunEl.querySelectorAll('.ray').forEach((ray, i) => {
    const delay = -((elapsed + RAY_OFFSETS[i]) % 8);
    ray.style.animation = 'none';
    void ray.offsetWidth; // force reflow so the new delay takes effect
    ray.style.animation = 'spin 8s linear infinite, pulse 2s infinite';
    ray.style.animationDelay = `${delay}s, 0s`;
  });
}

resyncRays();
DayNightCycle();

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') resyncRays();
});


function DayNightCycle() {
  const { visible_s, progress: targetSunProgress  } = getSunPosition();
  const { visible_m, progress: targetMoonProgress } = getMoonPosition();
  const now   = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;

  const W = window.innerWidth;
  const H = window.innerHeight;
  const horizonY = H * 0.88;
  const xRadius  = W * 0.46;
  const yRadius  = H * 0.78;

  // Move the sun along the arc
  currentSunProgress = lerp(currentSunProgress, targetSunProgress, 0.05);
  const sunAngle = currentSunProgress * Math.PI;
  sunEl.style.left    = `${W / 2 - Math.cos(sunAngle) * xRadius}px`;
  sunEl.style.top     = `${horizonY - Math.sin(sunAngle) * yRadius}px`;
  sunEl.style.opacity = visible_s ? '1' : '0';
  console.log(visible_m)

  // Move the moon along the arc
  currentMoonProgress = lerp(currentMoonProgress, targetMoonProgress, 0.05);
  const moonAngle = currentMoonProgress * Math.PI;
  moonEl.style.left    = `${W / 2 - Math.cos(moonAngle) * xRadius}px`;
  moonEl.style.top     = `${horizonY - Math.sin(moonAngle) * yRadius}px`;
  moonEl.style.opacity = visible_m ? '1' : '0';
  console.log(visible_m);

  // Shift sky color
  const sky = getSkyColor(hours);
  document.body.style.backgroundColor = `rgb(${sky.r}, ${sky.g}, ${sky.b})`;

  const root = document.documentElement;

  // Shift tooltip color
  const tooltip = getToolTipColor(hours);
  root.style.setProperty('--tooltip-color', `rgb(${tooltip.r}, ${tooltip.g}, ${tooltip.b})`);

  // Shift nav font and glow colors
  const fontCol = getFontColor(hours);
  const glowCol = getGlowColor(hours);
  root.style.setProperty('--nav-font-color', `rgb(${fontCol.r}, ${fontCol.g}, ${fontCol.b})`);
  root.style.setProperty('--nav-glow-color', `rgb(${glowCol.r}, ${glowCol.g}, ${glowCol.b})`);
  root.style.setProperty('--text-color-rgb', `${fontCol.r}, ${fontCol.g}, ${fontCol.b}`);
}

  // window.addEventListener('scroll', () => {
  //   const current = window.scrollY;

  //   if (current > lastScroll) {
  //     document.querySelector('nav').classList.add('hidden');    // scrolling down
  //   } else {
  //     document.querySelector('nav').classList.remove('hidden'); // scrolling up
  //   }

  //   lastScroll = current;
  // });


/*
claude explinaation of the chache portion here:

 is there a way to only run this function once per day? this will give me the sunset and sunrise for   
  tomorrow but not today It seems                                                              
                                                                                               
● Two issues to fix here: passing today's local date to the API (which defaults to UTC and can 
  drift), and caching the result in localStorage so it only fetches once per day.              

  - Wrong day — the API defaults to today's UTC date, which can be off by a day depending on   
  your timezone. Passing date=today using your local date fixes that. en-CA locale is just a
  trick to get YYYY-MM-DD format cheaply.                                                      
  - Once per day — localStorage stores the result under a key like sunTimes_2026-05-06. On the
  next load it finds the cached value and skips the fetch entirely. Tomorrow the key is      
  different so it fetches fresh automatically.

*/ 

async function getSunTimes(lat, lng) {
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
  const cacheKey = `sunTimes_${today}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0&date=${today}`;
  const response = await fetch(url);
  const data = await response.json();
  localStorage.setItem(cacheKey, JSON.stringify(data.results));
  return data.results;
}

function startCycle() {
  function tick(){
    DayNightCycle();
    requestAnimationFrame(tick);
  }
  tick();
}


//function takes users lat and long data and places the celestial bodies accordinding to time of day.
window.addEventListener("load", () => {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const times = await getSunTimes(latitude, longitude);
        SUNRISE = new Date(times.sunrise).getHours() + new Date(times.sunrise).getMinutes() / 60;
        SUNSET  = new Date(times.sunset).getHours()  + new Date(times.sunset).getMinutes()  / 60;
        Daylight = SUNSET - SUNRISE;
        Nightlight = 24 - Daylight;
      } catch (e) {
        console.warn("Failed to fetch sun times, keeping defaults:", e);
      }
      startCycle();
    },
    () => {
      // user denied location, keep defaults
      startCycle();
    }
  );
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting));
}, { threshold: 0.2 });

document.querySelectorAll('section:not(#hero)').forEach(s => observer.observe(s));
