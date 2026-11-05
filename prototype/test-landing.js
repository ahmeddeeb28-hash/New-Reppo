const {chromium}=require('playwright');const S=process.argv[2];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});const e=[];p.on('pageerror',x=>e.push(x.message));
const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
await p.goto('http://localhost:8000/');await p.waitForTimeout(400);
await p.screenshot({path:S+'/v7-fold.png'});
await p.evaluate(()=>document.getElementById('demo').scrollIntoView({block:'center'}));await p.waitForTimeout(3000);
await p.screenshot({path:S+'/v7-demo-mid.png'});await p.waitForTimeout(6500);
ok(await p.locator('.proposal.fixed').count()===1,'demo plays to the fix');
await p.locator('#demo').screenshot({path:S+'/v7-demo-end.png'});
// labeller
await p.evaluate(()=>document.getElementById('try').scrollIntoView());await p.waitForTimeout(400);
ok(await p.locator('#lab-claims li').count()===2,'example 1 splits into 2 claims');
ok((await p.textContent('#n-flag'))==='1','unsourced 20% flagged');
await p.click('[data-example="1"]');await p.waitForTimeout(300);
ok((await p.textContent('#n-ev'))==='1' && (await p.textContent('#n-dc'))==='1','evidence and decision detected');
await p.fill('#lab-text','Checkout will be 2x faster. Do users want it?');await p.waitForTimeout(300);
ok((await p.textContent('#n-qu'))==='1' && (await p.textContent('#n-as'))==='1','typing relabels live');
await p.click('[data-example="0"]');
await p.locator('#try').screenshot({path:S+'/v7-try.png'});
// gaps
for(const btn of await p.locator('[data-gap] button').all()){await btn.click();await p.waitForTimeout(120);}
ok((await p.textContent('#gap-agreed'))==='11','all gaps fixed fills readiness');
ok(await p.locator('#ready-state').isVisible(),'ready to agree shown');
await p.click('#agree-all');await p.waitForTimeout(300);
await p.locator('#gaps').screenshot({path:S+'/v7-gaps.png'});
// roles
await p.click('[data-role="growth"]');await p.waitForTimeout(200);
ok((await p.textContent('#res-q')).includes('baseline'),'growth questions shown');
await p.click('#res-opts button >> nth=1');await p.waitForTimeout(600);
ok((await p.textContent('#res-step'))==='2 / 2','answer advances');
await p.locator('#team').screenshot({path:S+'/v7-team.png'});
await p.evaluate(()=>document.getElementById('gaps').scrollIntoView());await p.waitForTimeout(500);
ok(await p.locator('.rail a.on[data-rail="gaps"]').count()===1,'rail tracks section');
await p.evaluate(()=>scrollTo(0,0));
console.log('height',await p.evaluate(()=>document.body.scrollHeight));
const m=await b.newPage({viewport:{width:390,height:844}});await m.goto('http://localhost:8000/');await m.waitForTimeout(600);
ok(!(await m.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'no phone overflow');
await m.screenshot({path:S+'/v7-m.png',fullPage:true});
ok(e.length===0,'no errors '+e.join('; '));await b.close();})();
