const {chromium}=require('playwright');const f=process.argv[2],S=process.argv[3];
(async()=>{const b=await chromium.launch();let ok=true;const fail=m=>{ok=false;console.log('FAIL',m)};
for(const vp of [{width:1440,height:900},{width:390,height:844}]){const p=await b.newPage({viewport:vp});const e=[];p.on('pageerror',x=>e.push(x.message));
await p.goto('file://'+f);await p.waitForTimeout(300);
await p.evaluate(()=>document.getElementById('psboard').scrollIntoView({block:'center'}));
try{await p.waitForSelector('#qnode.show',{timeout:6000});}catch(_){fail('qnode')}
await p.waitForTimeout(1300);
const tf=await p.$eval('#pscam',x=>x.style.transform);
if(vp.width>700&&!tf.includes('scale(1.35'))fail('camera '+tf);
if(vp.width<=700&&tf!=='none'&&tf!=='')fail('mobile cam '+tf);
try{await p.waitForSelector('#psboard.mode-solution',{timeout:12000});}catch(_){fail('auto-switch')}
await p.click('[data-ps="problem"]');await p.waitForTimeout(200);
if(!(await p.getAttribute('#psboard','class')).includes('mode-problem'))fail('tab');
await p.click('#ps-replay');await p.waitForTimeout(3000);
const ow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(ow>0)fail('overflow '+ow);
if(vp.width<=700)await p.locator('.ps').screenshot({path:S+'/ps-mobile.png'});
if(e.length)fail(e.join());await p.close();}
console.log(ok?'PASS test-ps':'FAILED');await b.close();process.exit(ok?0:1);})();
