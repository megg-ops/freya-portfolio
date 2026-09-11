import { launch, connect, sleep, saveShot, SHOTS, BASE } from './cdp.mjs';

const { proc, wsUrl } = await launch(9347, { finePointer: true });
const browser = await connect(wsUrl);
let failures = 0;
let total = 0;
function check(name, ok) { total++; if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); }
try {
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  let { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  const send = (method, params = {}) => browser.send(method, params, sessionId);
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const errors = [];
  browser.on('Runtime.exceptionThrown', (event) => errors.push(event.exceptionDetails.text));
  browser.on('Runtime.consoleAPICalled', (event) => { if (event.type === 'error') errors.push('console error'); });
  await send('Runtime.enable'); await send('Page.enable');
  const key = async (key, extra = {}) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key, ...extra });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key, ...extra });
  };
  const click = async (selector) => {
    const point = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
    await sleep(80);
  };
  for (const [width, height, touch] of [[1440,900,false], [768,1024,true], [390,844,true], [320,740,true]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: touch });
    await send('Emulation.setTouchEmulationEnabled', { enabled: touch });
    await send('Page.navigate', { url: BASE + '/stars' }); await sleep(1000);
    check(`${width}: background loads`, await evaluate('document.querySelector("main > img").naturalWidth > 0'));
    check(`${width}: 9 accessible stars`, await evaluate('document.querySelectorAll("button[aria-haspopup=dialog]").length === 9'));
    check(`${width}: no horizontal overflow`, await evaluate('document.documentElement.scrollWidth <= innerWidth'));
    check(`${width}: unobstructed 44px star targets`, await evaluate(`(() => {
      const stars = [...document.querySelectorAll('button[aria-haspopup=dialog]')];
      return stars.every(s => { const r=s.getBoundingClientRect(); s.scrollIntoView({block:'center'}); const q=s.getBoundingClientRect(); const hit=document.elementFromPoint(q.x+q.width/2,q.y+q.height/2); return r.width>=44 && r.height>=44 && s.contains(hit); });
    })()`));
    await evaluate('window.scrollTo(0,0)');
    saveShot(SHOTS, `stars-${width}`, (await send('Page.captureScreenshot', { captureBeyondViewport: true })).data);
    for (let index = 0; index < 9; index++) {
      await evaluate(`window.star = document.querySelectorAll('button[aria-haspopup=dialog]')[${index}]; window.star.focus(); window.star.click()`);
      await sleep(50);
      check(`${width}: star ${index + 1} opens modal`, await evaluate('document.querySelector("dialog").open && document.querySelector("dialog").contains(document.activeElement)'));
      if (index === 0) {
        await key('Tab', { modifiers: 8 }); await sleep(20);
        check(`${width}: modal traps focus`, await evaluate('document.querySelector("dialog").contains(document.activeElement)'));
      }
      await key('Escape'); await sleep(40);
      check(`${width}: star ${index + 1} focus restored`, await evaluate('!document.querySelector("dialog").open && document.activeElement === window.star'));
    }
    check(`${width}: visited counter`, await evaluate('document.querySelector("footer").textContent.includes("9 / 9")'));
  }
  // Disabling touch restores headless pointer:none, not startup Blink settings.
  // A fresh target provides the explicitly configured desktop input hardware.
  await browser.send('Target.closeTarget', { targetId });
  const desktop = await browser.send('Target.createTarget', { url: 'about:blank' });
  ({ sessionId } = await browser.send('Target.attachToTarget', { targetId: desktop.targetId, flatten: true }));
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: BASE + '/stars' }); await sleep(600);
  check('Desktop emulates a fine pointer', await evaluate("matchMedia('(pointer: fine)').matches"));
  check('Background shower runs', await evaluate("document.querySelector('[data-paused]').getAnimations({subtree:true}).some(a=>a.playState==='running')"));
  await evaluate("document.querySelector('[data-paused] span').getAnimations()[0].currentTime=500");
  check('Background meteor becomes visible', await evaluate("Number(getComputedStyle(document.querySelector('[data-paused] span')).opacity) > .2"));
  saveShot(SHOTS, 'stars-shower', (await send('Page.captureScreenshot')).data);
  await click('button[aria-haspopup=dialog]');
  check('Glass note uses backdrop blur', await evaluate("getComputedStyle(document.querySelector('dialog')).backdropFilter.includes('blur')"));
  check('Shower pauses while reading', await evaluate("document.querySelector('[data-paused]').dataset.paused === 'true' && document.querySelector('[data-paused]').getAnimations({subtree:true}).length === 0"));
  saveShot(SHOTS, 'stars-note', (await send('Page.captureScreenshot')).data);
  await key('Escape');
  await click('footer button:first-child');
  check('Text guide reveals labels', await evaluate('document.querySelector("main").dataset.names === "true"'));
  await evaluate('window.scrollTo(0,0)');
  const ink = `(() => {const c=document.querySelector('canvas'); return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0);})()`;
  for (let i = 0; i < 14; i++) await send('Input.dispatchMouseEvent', { type:'mouseMoved', x:500+i*10, y:450+i*2 });
  await sleep(30);
  check('Meteor draws on mouse movement', await evaluate(ink));
  check('Cursor trail stays compact', await evaluate(`(() => {const c=document.querySelector('canvas'), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let min=c.width,max=0; for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) if(d[(y*c.width+x)*4+3]>12){ min=Math.min(min,x);max=Math.max(max,x); } return max>min && max-min<85;})()`));
  await sleep(600);
  check('Meteor fades completely after idle', !(await evaluate(ink)));
  await click('footer button:last-child');
  check('Pause stops CSS animations', await evaluate('document.querySelector("main").dataset.still === "true" && document.getAnimations().filter(a=>a.playState === "running").length === 0'));
  await send('Input.dispatchMouseEvent', { type:'mouseMoved', x:700, y:450 }); await sleep(30);
  check('Pause stops meteor', !(await evaluate(ink)));
  check('Pause stops background shower', await evaluate("document.querySelector('[data-paused]').dataset.paused === 'true'"));
  await click('footer button:last-child');
  await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] });
  await sleep(50);
  check('Reduced motion stops animations', await evaluate('document.getAnimations().filter(a=>a.playState === "running").length === 0'));
  check('Reduced motion hides background shower', await evaluate("getComputedStyle(document.querySelector('[data-paused]')).display === 'none'"));
  await send('Input.dispatchMouseEvent', { type:'mouseMoved', x:800, y:460 });
  check('Reduced motion disables trail', !(await evaluate(ink)));
  await click('button[aria-haspopup=dialog]');
  check('Reduced motion preserves interaction', await evaluate('document.querySelector("dialog").open'));
  await key('Escape');
  await click('header a:last-child'); await sleep(1500);
  check('Return to daylight and clear world', await evaluate('location.pathname === "/" && !document.documentElement.dataset.world'));
  await send('Page.navigate', {url:BASE+'/stars'}); await sleep(500);
  check('Night remount works', await evaluate('document.querySelectorAll("button[aria-haspopup=dialog]").length === 9'));
  check('No browser errors', errors.length === 0);
  console.log(`${total - failures}/${total} passed`);
} finally { proc.kill(); browser.ws.close(); }
process.exitCode = failures ? 1 : 0;
