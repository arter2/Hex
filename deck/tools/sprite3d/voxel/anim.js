// walk and cast cycles at the reference's own view; limbs swing about an axis turned to the
// direction the character faces (FACE degrees), so the stride reads on screen
const {chromium}=require(process.env.PLAYWRIGHT); const fs=require('fs'), path=require('path');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const p=await b.newPage(); p.on('pageerror',e=>console.log(e.message)); await p.goto('file://'+path.join(__dirname,'vox.html'));
  const name=process.argv[2], face=+(process.argv[3]||35)*Math.PI/180, data=JSON.parse(fs.readFileSync(path.join(__dirname,name+'_model.json')));
  const ax=[Math.cos(face),0,-Math.sin(face)], N=8;
  for(let f=0;f<N;f++){ const s=Math.sin(f/N*2*Math.PI), c=Math.cos(f/N*2*Math.PI);
    const pose={legL:[...ax,0.55*s],legR:[...ax,-0.55*s],armL:[...ax,-0.45*s],armR:[...ax,0.35*s],head:[0,1,0,0.04*s],torso:[0,1,0,0.05*s],quiver:[0,1,0,0.05*s]};
    const u=await p.evaluate(([d,pose,bob])=>renderModel(d,0,pose,bob),[data,pose,Math.abs(c)<0.4?1:0]);
    fs.writeFileSync(path.join(__dirname,'out',`${name}_a_walk${f}.png`),Buffer.from(u.split(',')[1],'base64')); }
  await b.close(); })();
