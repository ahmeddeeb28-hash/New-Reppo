const {chromium}=require('playwright');const F='file://'+process.argv[2];const O=process.argv[3];const fs=require('fs');
const layout=JSON.parse(fs.readFileSync(O+'/layout.json'));
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:4});await p.emulateMedia({reducedMotion:'reduce'});
await p.goto(F);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForTimeout(800);
await p.addStyleTag({content:'.scard{transform:none!important} .verdict{box-shadow:none!important}'});
await p.evaluate(()=>document.getElementById('psboard').scrollIntoView({block:'center'}));await p.waitForTimeout(800);
for(let i=1;i<=4;i++){const l=p.locator(`.scard:nth-of-type(${i})`);layout['scard'+i]=await l.boundingBox();await l.screenshot({path:`${O}/scard${i}.png`,omitBackground:true});}
const v=p.locator('#verdict');layout.verdict=await v.boundingBox();await v.screenshot({path:O+'/verdict.png',omitBackground:true});
await p.evaluate(()=>scrollTo(0,0));await p.click('.lp-hero [data-act="new"]');await p.waitForTimeout(500);
await p.fill('#start-in','We want one-tap reorder to increase repeat purchases by 40%. Support tickets show customers rebuild baskets by hand.');await p.press('#start-in','Enter');await p.waitForSelector('.m-ai .pcard');await p.waitForTimeout(1200);
await p.click('[data-acceptall]');await p.waitForTimeout(1500);
const boxes={ev:'.docpane .ditem.co-ev',as:'.docpane .ditem.co-as'};
for(const [k,sel] of Object.entries(boxes)){const l=p.locator(sel);layout['doc_'+k]=await l.boundingBox();await l.screenshot({path:`${O}/doc_${k}.png`});}
fs.writeFileSync(O+'/layout.json',JSON.stringify(layout,null,1));console.log(JSON.stringify({s1:layout.scard1,d:layout.doc_ev,a:layout.doc_as}));await b.close();})();
