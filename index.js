let seed = Math.random() * 100;
var scrollPos = 0;
var lastPosition = 0;
var colorDelta = 0;
var originLightHue = 0;
var root = null;
var pointer = null;
let darkColor = chroma('1345FA');
let lightColor = chroma('D3FED7');
var latestDark = darkColor.gl();
var latestLight = lightColor.gl();
let stepCount = 8;
let gradientFPS = 15;
var isTouching = false;
var isViewing = false;
var lastTouch = null;
var lastTouchEnd = null;
var debugColors = false;
var lastItem = null;
var lastContainer = null;
var currentItem = null;
var flip = 1;
var posters = {};
var videos = {};

const faviconElement = document.querySelector(`head > link[rel='icon']`);
const themeColor = document.getElementsByTagName('meta')['theme-color'];
const viewerElement = document.getElementById('viewer');
const videoFrame = document.getElementById('videoFrame');
const viewerFrame = document.getElementById('videoWrapper');
const viewerVideo = document.querySelector('#viewer video');
const viewerHit = document.getElementById('viewerHit');
const canvas = document.querySelector('#c');
const placeholder = document.querySelectorAll('#viewer h4');

const placeholders = [
  'placeholder.jpg',
  'blank page',
  "i'll find something to put here",
  "what's on your mind?",
  "what's happening?",
  'this space intentionally left blank',
  'spacer.gif',
  'blank page',
  "i'll find something to put here",
  "what's on your mind?",
  "what's happening?",
  'this space intentionally left blank',
];

function ready(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
const isMobile = () => {
  return window.matchMedia('(max-width: 850px)').matches;
};
const isVisible = () => {
  return scrollPos > canvas.height && isMobile() ? false : true;
};
const isFloating = () => {
  return window.matchMedia('(max-aspect-ratio: 16/12)').matches;
};
const noCursor = () => {
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
};

const debounce = (fn) => {
  let frame;
  return (...params) => {
    if (frame) {
      cancelAnimationFrame(frame);
    }
    frame = requestAnimationFrame(() => {
      fn(...params);
    });
  };
};

const scale = (num, in_min, in_max, out_min, out_max) => {
  let mappedValue =
    ((num - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  if (mappedValue > out_max) {
    return out_max;
  } else if (mappedValue < out_min) {
    return out_min;
  } else {
    return mappedValue;
  }
};

function shuffle(array) {
  var currentIndex = array.length,
    temporaryValue,
    randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

const setGradient = () => {
  let newDark = darkColor.set('hsl.h', '+' + colorDelta);
  let newLight = lightColor.set('hsl.h', '+' + colorDelta);
  let contrast = chroma.contrast(newDark, newLight);
  let contrastOffset = scale(contrast, 5, 1, 0, 1.5);
  let newDarkContrast = newDark.darken(contrastOffset);
  latestDark = newDarkContrast.gl();
  latestLight = newLight.darken(0.2).gl();

  root.style.setProperty(
    '--dark-rgb',
    `${newDarkContrast.get('rgb.r')}, ${newDarkContrast.get(
      'rgb.g'
    )}, ${newDarkContrast.get('rgb.b')}`
  );
  root.style.setProperty(
    '--light-rgb',
    `${newLight.get('rgb.r')}, ${newLight.get('rgb.g')}, ${newLight.get(
      'rgb.b'
    )}`
  );
  root.style.setProperty('--dark-color', newDarkContrast.css('hsl'));
  root.style.setProperty('--scrim', newDarkContrast.alpha(0.05).css());
  root.style.setProperty('--light-color', newLight.css('hsl'));
  themeColor.setAttribute('content', newDarkContrast.css());
  let faviconString = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="8" fill="${newDarkContrast.hex()}"/>
    <path d="M12.5 9.78547C12.4905 8.6081 11.1992 7.97193 9.39511 7.81052L11.56 6.81354C11.7404 6.72809 11.7878 6.60465 11.7878 6.41475V5.33232C11.7878 5.12343 11.6644 5 11.4555 5H4.22034C4.01145 5 3.88801 5.12343 3.88801 5.33232V6.04445C3.88801 6.25334 4.01145 6.37677 4.22034 6.37677H9.61349L7.14479 7.50668C6.98338 7.57314 6.90742 7.71557 6.90742 7.89597V8.65557C6.90742 8.86446 7.03085 8.9879 7.24924 8.9879C9.2147 8.9879 10.6864 9.3582 10.6959 9.7285C10.7054 9.96588 10.0977 10.2317 8.13227 10.2317C6.07186 10.2317 4.99892 9.84244 4.35327 9.65254C4.16337 9.60507 3.96397 9.62406 3.907 9.76648L3.56518 10.4311C3.47973 10.64 3.45124 10.7445 3.65064 10.8869C4.06842 11.1717 5.6161 11.7225 8.2652 11.7225C10.544 11.7225 12.5095 11.3237 12.5 9.78547Z" fill="${newLight.hex()}"/>
    <defs>
    <linearGradient id="paint0_linear" x1="0" y1="0" x2="0" y2="16" gradientUnits="userSpaceOnUse">
    <stop stop-color="${newDarkContrast.hex()}"/>
    <stop offset="1" stop-color="${newLight.hex()}"/>
    </linearGradient>
    </defs>
    </svg>`;
  faviconElement.setAttribute(
    `href`,
    `data:image/svg+xml;base64,${window.btoa(faviconString)}`
  );
  colorDelta += 0.5;
  if (colorDelta > 360) {
    colorDelta = 0;
  }
};

const storeScroll = () => {
  document.documentElement.dataset.scroll = window.scrollY > 1200;
  scrollPos = window.scrollY;
  var scrollDelta = scrollPos - lastPosition;
  if (Math.abs(scrollDelta) > 200 && isViewing) {
    endViewer(lastContainer);
  }
};

storeScroll();

const gradientRAF = () => {
  if (windowHasFocus) {
    if (root && !isTouching && !debugColors) {
      window.requestAnimationFrame(setGradient);
    }
  }
};

const viewItem = (caller) => {
  if (caller == currentItem) {
    return;
  } else {
    if (!caller && currentItem) {
      caller = currentItem;
    } else {
      return;
    }
  }

  viewerElement.removeAttribute('class');
  if (caller.dataset.viewer) {
    lastPosition = scrollPos;
    isViewing = true;
    document.body.classList.add('viewing');
    viewerElement.classList.add(caller.dataset.viewer);

    let media = caller.dataset.media.split('.');
    if (isFloating() && caller.dataset.viewer == 'phone') {
      videoFrame.style.flexBasis =
        viewerVideo.getBoundingClientRect().width + 100 + 'px';
    } else {
      videoFrame.removeAttribute('style');
    }

    if (media[0] == '#') {
      media = ['404', 'mp4'];
    }

    if (media[1] == 'mp4') {
      viewerVideo.style.display = 'block';
      viewerVideo.setAttribute('poster', posters[media[0]]);
      viewerVideo.setAttribute('src', videos[media[0]]);
      console.log(videos[media[0]]);
    } else {
      viewerVideo.style.display = 'none';
      viewerElement.classList.add(media[0]);
    }
  }
};

const endViewer = (container) => {
  if (isViewing) {
    isViewing = false;
    container?.parentElement.classList.remove('active');
    container?.parentElement.parentElement.classList.remove('active');
    document.body.classList.remove('viewing', 'cursor');
    lastItem?.classList.remove('active', 'above', 'below');
    console.log(container, lastItem);
    viewerVideo.removeAttribute('src');
    viewerVideo.removeAttribute('poster');
    lastItem = null;
    currentItem = null;
    placeholder[0].innerHTML = shuffle(placeholders)[0];
  }
};

const prepViewer = (workItem, e) => {
  document.body.classList.add('cursor');
  workItem.parentElement.parentElement.parentElement.classList.add('active');
  if (lastItem) {
    lastItem.classList.remove('active', 'above', 'below');
  }
  lastItem = workItem;
  flip = -1;
  if (workItem.querySelector('a')) {
    document.body.classList.add('link');
    flip = 1;
  } else {
    document.body.classList.remove('link');
    if (isFloating()) {
      flip = 1;
    } else {
      flip = -1;
    }
  }

  workItem.classList.add('active');
  currentItem = e.target;
  viewItem();
};

const prefetchPoster = async (item) => {
  let itemInfo = item.dataset.media.split('.');
  if (itemInfo[1] == 'mp4' && !posters[`${itemInfo[0]}`]) {
    posters[`${itemInfo[0]}`] = `/img/${itemInfo[0]}.jpg`;
    let response = await fetch(`/img/${itemInfo[0]}.jpg`);
    let blob = await response.blob();
    posters[`${itemInfo[0]}`] = URL.createObjectURL(blob);
  }
};

const prefetchVideo = async (item) => {
  let itemInfo = item.dataset.media.split('.');
  if (itemInfo[1] == 'mp4' && !videos[`${itemInfo[0]}`]) {
    videos[`${itemInfo[0]}`] = `/img/${itemInfo[0]}.mp4`;
    let response = await fetch(`/img/${itemInfo[0]}.mp4`);
    let blob = await response.blob();
    videos[`${itemInfo[0]}`] = URL.createObjectURL(blob);
  }
};

const addListeners = () => {
  pointer = document.getElementById('pointer');
  let workWrapper = document.querySelectorAll('.row .work-wrapper, .col ul');
  let work = document.querySelectorAll('.work-wrapper ul li, .col ul li');
  viewerVideo.addEventListener('loadedmetadata', (event) => {
    viewerVideo.muted = true;
    viewerVideo.play();
  });

  viewerHit.addEventListener('click', (e) => {
    if (isViewing) {
      document.body.classList.toggle('expanded');
    }
  });
  workWrapper.forEach((workContainer) => {
    workContainer.addEventListener('mouseenter', (e) => {
      lastContainer = e.target;
    });
    workContainer.addEventListener('mouseleave', (e) => {
      if (!noCursor()) {
        endViewer(lastContainer);
      }
    });
  });

  work.forEach((workItem) => {
    prefetchPoster(workItem);
    prefetchVideo(workItem);
    workItem.addEventListener('mouseenter', (e) => {
      if (!noCursor()) {
        prepViewer(workItem, e);
      }
    });
    workItem.addEventListener('click', (e) => {
      if (!workItem.querySelector('a')) {
        if (noCursor() && currentItem != e.target) {
          prepViewer(workItem, e);
        }
      }
    });
  });

  document.addEventListener('mousemove', (e) => {
    pointer.style.setProperty(
      'transform',
      'translate(' + e.clientX + 'px, ' + e.clientY + 'px) scale(' + flip + ')'
    );
  });
};

const windowHasFocus = function () {
  if (document.hasFocus()) return true;
  let hasFocus = false;

  window.addEventListener('focus', function () {
    hasFocus = true;
  });
  window.focus();

  return hasFocus;
};

function main() {
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.autoClearColor = false;

  const camera = new THREE.OrthographicCamera(
    -1, // left
    1, // right
    1, // top
    -1, // bottom
    -1, // near,
    1 // far
  );
  const scene = new THREE.Scene();
  const plane = new THREE.PlaneGeometry(2, 2);

  const fragmentShader = `
  #include <common>

  uniform vec3 iResolution;
  uniform float iTime;
  uniform vec3 extcolor1;
  uniform vec3 extcolor2;

  // By iq: https://www.shadertoy.com/user/iq  
  // license: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
  mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
                sin(angle),cos(angle));
}
float gradientNoise(in vec2 uv)
{
    const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(uv, magic.xy)));
}
float variation(vec2 v1, vec2 v2, float strength, float speed) {
	return sin(
        dot(normalize(v1), normalize(v2)) * strength + iTime * speed
    ) / 100.0;
}

vec3 paintCircle (vec2 uv, vec2 center, float rad, float width) {
    
    vec2 diff = center-uv;
    float len = length(diff);

    len += variation(diff, vec2(0.0, 1.0), 5.0, 1.0);
    len -= variation(diff, vec2(1.0, 0.0), 5.0, 1.0);
    
    float circle = smoothstep(rad-width, rad, len) - smoothstep(rad, rad+width, len);
    return vec3(circle);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = fragCoord.xy / iResolution.xy;
    uv.x *= 1.5;
    uv.x -= 0.25;
    
    vec3 color;
    vec3 color2;
    float radius = 0.5;
    vec2 center = vec2(0.5);
    vec2 v = rotate2d(iTime * 0.1) * uv;
    vec2 v3 = rotate2d(iTime * 0.3) * uv;
    vec2 v5 = rotate2d(iTime * 0.5) * uv;
     
    color = paintCircle(uv * v5, center * v3, 1.0 * v.x, 1.5);
    color2 = paintCircle(uv * v3, vec2(0.2) * v, 1.0 * v3.x, 1.3);
        
    color *= vec3(v5.x, v5.x, v5.x);
    v = rotate2d(iTime * -0.3) * uv;
    color2 *= vec3(v.y, v.y, v.y);
    vec3 finalColor = color + color2;

    float grayscaleValue = clamp(dot(finalColor.rgb, vec3(0.299, 0.587, 0.114)), 0.0, 0.95);
    vec3 preComp = mix(extcolor2, extcolor1, grayscaleValue);
    preComp += (1.0/255.0) * gradientNoise(fragCoord) - (0.5/255.0);

    float strength = 8.0;
    
    float x = (uv.x + 0.5) * (uv.y + 0.5) * (iTime * 1.0);
    vec4 grain = vec4(mod((mod(x, 13.0) + 1.0) * (mod(x, 123.0) + 1.0), 0.01)-0.005) * strength;
    

    
    if(uv.x > 0.5)
    {
    	grain = 1.0 - grain;
		  fragColor = vec4(preComp, 1.0) * grain;
    }
    else
    {
		fragColor = vec4(preComp, 1.0) + grain;
    }

}



  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
  `;
  const uniforms = {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3() },
    extcolor1: { value: new THREE.Vector3() },
    extcolor2: { value: new THREE.Vector3() },
  };
  const material = new THREE.ShaderMaterial({
    fragmentShader,
    uniforms,
  });
  scene.add(new THREE.Mesh(plane, material));

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    resizeRendererToDisplaySize(renderer);
    if (isVisible()) {
      time *= 0.001;

      const canvas = renderer.domElement;
      uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
      uniforms.iTime.value = time + seed;

      uniforms.extcolor1.value.set(
        latestLight[0],
        latestLight[1],
        latestLight[2]
      );
      uniforms.extcolor2.value.set(latestDark[0], latestDark[1], latestDark[2]);
      renderer.render(scene, camera);
    }
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

ready(function () {
  originDarkHue = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--dark-h')
  );
  originLightHue = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--light-h')
  );
  root = document.styleSheets[1].rules[0];

  window.setInterval(gradientRAF, 1000 / gradientFPS);

  addListeners();
  document.addEventListener('scroll', debounce(storeScroll), {
    passive: true,
  });

  placeholder[0].innerHTML = shuffle(placeholders)[0];

  if (isMobile()) {
    seed = 10;
  }

  main();
});
