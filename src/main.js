import './style.css'

//TODO 
/**
 * list that contains 6 different moon divs
 * 
 * function takes users location based off of lat and long and returns users'
 * current visible moon
 * 
 * API calls to ^ get the moon position, I want to grab celestial body positions as well.
 * 
 * a function and constant to change the font color as well.
 */



// --- Lerp helper ---
// Blends from `begin` to `end` based on t (0.0 = begin, 1.0 = end)
 let lastScroll = 0;


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
const SUNRISE = 6;   // 6:00 AM
const SUNSET  = 18;  // 6:00 PM

// Sky colors at each phase (matching your CSS vars)
const SKY_COLORS = {
  morning:  { r: 208, g: 255, b: 196 },  // --Morning
  midday:   { r: 161, g: 217, b: 158 },  // --Midday
  twilight: { r: 62,  g: 98,  b: 148 },  // --Twilight
  midnight: { r: 38,  g: 40,  b: 64  },  // --Midnight  (#262840)
};

const FONT_COLORS = {
  day:   { r: 62,  g: 98,  b: 148 },  // --Twilight
  night: { r: 208, g: 255, b: 196 },  // --Morning
}

const GLOW_COLORS = {
  day:   { r: 100, g: 140, b: 190  },  // --morning-glow
  night: { r: 255, g: 255, b: 255 },  // --night-glow
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
  const progress = (hours - SUNRISE) / (SUNSET - SUNRISE);
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
  if(hours >= 0 && hours < 6){
    hours += 24;
  }

  // moon arc spans 18 → 30 (12 hours)
  const progress = (hours - SUNSET) / 12;
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
function getSkyColor(hours) {
  // Divide the day into segments and lerp between your palette colors
  if (hours < 5)  return SKY_COLORS.midnight;                                       // deep night
  if (hours < 7)  return lerpColor(SKY_COLORS.midnight,  SKY_COLORS.morning,  (hours - 5)  / 2);  // pre-dawn → morning
  if (hours < 12) return lerpColor(SKY_COLORS.morning,   SKY_COLORS.midday,   (hours - 7)  / 5);  // morning → noon
  if (hours < 17) return lerpColor(SKY_COLORS.midday,    SKY_COLORS.twilight, (hours - 12) / 5);  // noon → twilight
  if (hours < 20) return lerpColor(SKY_COLORS.twilight,  SKY_COLORS.midnight, (hours - 17) / 3);  // dusk → night
  return SKY_COLORS.midnight;
}

// --- font color based on time ---
function getFontColor(hours){
  if (hours > 18 || hours < 6) return FONT_COLORS.night;
  return FONT_COLORS.day;
}

function getGlowColor(hours){
  if (hours > 18 || hours < 6) return GLOW_COLORS.night;
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

document.body.appendChild(sunEl);


function DayNightCycle() {
  const { x_s, y_s, visible_s } = getSunPosition();
  const { x_m, y_m, visible_m } = getMoonPosition();
  const now   = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;

  // Move the sun
  sunEl.style.left    = `${x_s}px`;
  sunEl.style.top     = `${y_s}px`;
  sunEl.style.opacity = visible_s ? '1' : '0';

  // Move the moon
  moonEl.style.left    = `${x_m}px`;
  moonEl.style.top     = `${y_m}px`;
  moonEl.style.opacity = visible_m ? '1' : '0';

  // Shift sky color
  const sky = getSkyColor(hours);
  document.body.style.backgroundColor = `rgb(${sky.r}, ${sky.g}, ${sky.b})`;

  // Shift nav font and glow colors
  const fontCol = getFontColor(hours);
  const glowCol = getGlowColor(hours);
  const root = document.documentElement;
  root.style.setProperty('--nav-font-color', `rgb(${fontCol.r}, ${fontCol.g}, ${fontCol.b})`);
  root.style.setProperty('--nav-glow-color', `rgb(${glowCol.r}, ${glowCol.g}, ${glowCol.b})`);


}

  window.addEventListener('scroll', () => {
    const current = window.scrollY;

    if (current > lastScroll) {
      document.querySelector('nav').classList.add('hidden');    // scrolling down
    } else {
      document.querySelector('nav').classList.remove('hidden'); // scrolling up
    }

    lastScroll = current;
  });

window.addEventListener("load", () => {
  DayNightCycle();
  // Update every second so the sun glides smoothly (CSS transition handles the motion)
  setInterval(DayNightCycle, 1000);
});


