const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:950}});const e=[];p.on('pageerror',x=>e.push(x.message));
// Simulated assistant: the real one only exists inside the claude.ai viewer.
await p.addInitScript(()=>{
  const reply={reply:"Here is a first breakdown. Two questions will unblock scope.",
    questions:[{text:"What should happen when an item is out of stock?",role:"design",options:["Hide it","Show it, excluded from total","Block reorder"]},{text:"Do we have a repeat-order baseline?",role:"growth",options:["Yes, in analytics","No, needs instrumentation"]}],
    proposals:[{kind:"assumption",text:"Customers who reorder want the same basket most of the time.",source:"",why:"Not in your sources yet."},
               {kind:"evidence",text:"Tickets describe rebuilding a basket by hand.",source:"Support tickets, October",why:""},
               {kind:"evidence",text:"Most customers reorder monthly.",source:"Made-up source",why:""},
               {kind:"measure",text:"Raise repeat orders from 18% to 40% in 90 days",measureKind:"success",why:""},
               {kind:"scope_out",text:"Scheduled automatic reorders",why:"Keeps v1 small."}]};
  window.claude={use:async(n)=>{ if(n!=="sample") return null; const f=async()=>({text:JSON.stringify(reply)}); f.json=async()=>{await new Promise(r=>setTimeout(r,400)); return reply;}; return f; }};
});
await p.goto('file://'+process.argv[2]);await p.waitForTimeout(600);
await p.evaluate(()=>{try{localStorage.clear()}catch{}});await p.reload();await p.waitForTimeout(600);
await p.click('text=One-tap reorder');await p.waitForTimeout(400);
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
ok(await p.getByRole('button',{name:'Break down this request'}).count()===1,'starter shown');
await p.click('text=Break down this request');await p.waitForSelector('.pcard');
ok(await p.locator('.qcard').count()===2,'two follow-up questions');
ok(await p.getByText('Relabelled as an assumption').count()===1,'fake evidence source relabelled');
ok(await p.locator('.flag').count()===1,'invented numbers flagged');
await p.locator('.pcard',{hasText:'Scheduled automatic reorders'}).getByRole('button',{name:'Accept'}).click();
ok(await p.getByText('1 of 5 applied').count()===1,'applied counter');
await p.click('.steptabs [data-step=scope]');ok(await p.getByText('Out of this release · 1').count()===1,'accepted item added to scope');
await p.getByRole('button',{name:'Show it, excluded from total'}).click();
await p.click('.steptabs [data-step=evidence]');ok(await p.getByText('Show it, excluded from total').count()>=1,'answer saved as resolved question');
await p.locator('.pcard',{hasText:'same basket'}).getByText('Edit first').click();
await p.fill('.pcard textarea','Customers who reorder usually want the same basket.');
await p.locator('.pcard',{hasText:'Save and add'}).getByRole('button',{name:'Save and add'}).click();
ok(await p.getByText('Customers who reorder usually want the same basket.').count()>=1,'edit first then add');
await p.locator('details[data-gaps] summary').click();
ok(await p.locator('.prio li').count()>0,'top priorities list');
await p.screenshot({path:process.argv[3]+'/chat-desk.png'});
const m=await b.newPage({viewport:{width:390,height:844}});await m.goto('file://'+process.argv[2]);await m.waitForTimeout(500);
ok(!(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no phone overflow');
ok(e.length===0,'no errors '+e.join(';'));await b.close();})();
