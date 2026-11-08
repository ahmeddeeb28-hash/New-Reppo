const {chromium}=require('playwright');const F='file://'+process.argv[2];const S=process.argv[3];
let ok=true;const t=(c,m)=>{if(!c)ok=false;console.log((c?'PASS ':'FAIL ')+m)};
(async()=>{const b=await chromium.launch();const e=[];
for(const [w,h,n] of [[1440,950,'d'],[390,844,'m']]){const ctx=await b.newContext({viewport:{width:w,height:h},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();p.on('pageerror',x=>e.push(x.message));
await p.goto(F);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(300);await p.click('.lp-hero [data-act="new"]');
await p.fill('#start-in','We want team invites so admins can add colleagues. Sales says enterprise deals stall without it. We think simple email invites are enough for v1.');await p.press('#start-in','Enter');
await p.waitForSelector('.opts3');await p.locator('.opt3 .yes').first().click();await p.waitForTimeout(200);
await p.locator('.flowbar [data-act="finish"]').click();await p.waitForSelector('.plan');
const txt=await p.locator('.plan').textContent();
t(txt.includes('Action plan'),n+': Finish produces an action plan');
t(await p.locator('.plan .who-g').count()===4,n+': tasks grouped for Growth, Engineering, Design and PM');
t(await p.locator('.plan .task').count()>=8,n+': concrete tasks ('+await p.locator('.plan .task').count()+')');
t(txt.includes('Start small')||txt.includes('Ask for invites'),n+': plan uses the chosen v1 approach');
t(txt.includes('simple email invites'),n+': plan tests the user\'s own bet');
t(txt.includes('Dropbox'),n+': design task points to the similar-app patterns');
t(await p.locator('.plan .exp-rule').count()===1&&txt.includes('Scale if'),n+': experiment with a scale/iterate/stop rule');
t(await p.locator('.plan .ph').count()>=3,n+': unknown numbers stay as placeholders');
await p.locator('.plan input[data-ptask]').first().check();await p.waitForTimeout(200);
t((await p.locator('.plan .who-h').textContent()).includes('1 of'),n+': ticking a task updates progress');
await p.locator('.plan input[data-pdue]').first().fill('2026-12-01');await p.locator('.plan input[data-pdue]').first().dispatchEvent('change');await p.waitForTimeout(200);
const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('scopeline-chat-v1')).features[0].plan.tasks[0]);t(st.done&&st.due==='2026-12-01',n+': done and due date are saved');
if(n==='d'){await p.locator('.plan [data-ticket]').first().click();await p.waitForTimeout(200);const clip=await p.evaluate(()=>navigator.clipboard.readText());t(clip.startsWith('Title: ')&&clip.includes('Owner: Growth')&&clip.includes('Due: 2026-12-01'),'copy ticket gives a ready ticket');
await p.click('[data-act="copyslack"]');await p.waitForTimeout(200);const sl=await p.evaluate(()=>navigator.clipboard.readText());t(sl.includes('*Next up*')&&sl.includes('Engineering:'),'Slack update lists next step per role');}
t(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=0,n+': no sideways scroll');
await p.locator('.plan').screenshot({path:S+'/plan-'+n+'.png'});await ctx.close();}
t(e.length===0,'no errors '+e.join('; '));console.log(ok?'ALL PASS':'SOME FAIL');await b.close();})();
