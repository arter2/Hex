const {chromium}=require(process.env.PLAYWRIGHT);
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-webgl']}); const p=await b.newPage();
await p.goto('file://'+__dirname+'/lab.html'); console.log(JSON.stringify(await p.evaluate(()=>LAB.ids()))); await b.close(); })();
