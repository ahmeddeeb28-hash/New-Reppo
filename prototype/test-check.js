const {chromium}=require('playwright');const F='file://'+process.argv[2];const S=process.argv[3];
let ok=true;const t=(c,m)=>{if(!c)ok=false;console.log((c?'PASS ':'FAIL ')+m)};
(async()=>{const b=await chromium.launch();const e=[];
for(const [w,h,n] of [[1440,950,'d'],[390,844,'m']]){const p=await b.newPage({viewport:{width:w,height:h}});p.on('pageerror',x=>e.push(x.message));
await p.goto(F);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(300);
await p.click('.lp-hero [data-act="check"]');t(await p.locator('.ck-form textarea').isVisible(),n+': hero opens Check a doc');
await p.click('[data-act="cksample"]');await p.click('.ck-form [type=submit]');await p.waitForSelector('.ck-doc');
const groups=await p.locator('.ck-group h3').allTextContents();
t(groups.some(g=>g.startsWith('Numbers without a source')),n+': flags numbers without a source');
t(groups.some(g=>g.startsWith('Untested assumptions')),n+': flags untested assumptions');
t(groups.some(g=>g.startsWith('Vague words')),n+': flags vague words');
t(groups.some(g=>g.startsWith('Missing basics')),n+': flags missing basics');
t(await p.locator('.ck-doc .ck-s.ev').count()>=1,n+': sourced sentence shown as evidence');
t((await p.textContent('.ck-side')).includes('2 days has no source'),n+': numbers keep their unit');
t(!(await p.locator('.ck-doc').textContent()).includes('twice a week')||await p.locator('.ck-doc .ck-s.ev .ck-num').count()===0,n+': sourced numbers are not flagged');
t(await p.locator('.ck-group').first().locator('.ck-flag').count()<=2,n+': each group shows two flags first');
// placeholder
await p.locator('[data-fix^="n:"][data-fix$="|placeholder"]').first().click();await p.waitForTimeout(150);
t((await p.textContent('.ck-doc')).includes('[target]'),n+': placeholder replaces the number in the doc');
// add source
await p.locator('[data-fix^="n:"][data-fix$="|source"]').first().click();await p.waitForTimeout(150);
await p.locator('[data-srcform] input').fill('Q3 reminder pilot');await p.locator('[data-srcform] input').press('Enter');await p.waitForTimeout(150);
t((await p.textContent('.ck-doc')).includes('source: Q3 reminder pilot'),n+': adding a source writes it into the doc');
t(!(await p.textContent('.ck-side')).includes('has no source'),n+': no unsourced numbers left');
// ask + test + add missing
await p.locator('[data-fix^="a:"][data-fix$="|ask"]').first().click();await p.waitForTimeout(150);
t(await p.locator('.ck-asks li').count()===1,n+': asking a role collects a question to send');
await p.locator('[data-fix^="a:"][data-fix$="|test"]').first().click();await p.waitForTimeout(150);
const before=await p.locator('.ck-basics li.ok').count();await p.locator('[data-fix^="b:"][data-fix$="|add"]').first().click();await p.waitForTimeout(150);
t(await p.locator('.ck-basics li.ok').count()===before+1,n+': adding a missing basic ticks it off');
t((await p.textContent('.ck-score')).includes(`${before+1} of 8`),n+': score updates');
t(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,n+': no sideways scroll');
await p.screenshot({path:S+'/check-'+n+'.png'});
// plan
await p.click('[data-act="ckplan"]');await p.waitForSelector('.plan2');
t(await p.locator('.plan2').count()===1,n+': Turn into a plan opens an action plan');
const st=await p.evaluate(()=>{const f=JSON.parse(localStorage.getItem('scopeline-chat-v1')).features[0];return {k:f.doc.map(x=>x.kind),q:f.doc.filter(x=>x.kind==='question').length,title:f.title}});
t(st.k.includes('problem')&&st.k.includes('evidence')&&st.k.includes('assumption'),n+': doc lines land in the right sections');
t(st.q===1,n+': the asked question carries over');t(st.title==='Smart reorder reminders',n+': plan named after the doc');
// ledger
await p.evaluate(()=>{document.querySelector('[data-act="ledger"]')?.click();});await p.waitForTimeout(200);
if(!(await p.locator('.lg').count())){await p.click('[data-act="home"]');await p.click('.lp-hero [data-act="check"]');await p.click('.ck-nav [data-act="ledger"]');}
await p.waitForSelector('.lg');t(await p.locator('.lg-list li').count()>=3,n+': ledger lists the bets');
await p.locator('.lg-list li').first().locator('[data-bet$="|held"]').click();await p.waitForTimeout(150);
t((await p.locator('.lg-st.st-held b').textContent()).trim()==='1',n+': marking a bet updates the counts');
t((await p.textContent('.lg-origins')).includes('1 of 1 held up'),n+': track record by origin appears once results exist');
t(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,n+': ledger has no sideways scroll');
await p.screenshot({path:S+'/ledger-'+n+'.png'});await p.close();}
t(e.length===0,'no errors '+e.join('; '));console.log(ok?'ALL PASS':'SOME FAIL');await b.close();})();
