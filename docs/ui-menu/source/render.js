/* Shared deterministic responsive layout for SVG masters and interactive preview. */
(function(root){
const S=typeof require==='function'?require('./skins.js'):root.HexSkins;
const I=typeof require==='function'?require('./icons.js'):root.HexIcons;
const C=S.colors,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const profiles={
 'phone-portrait':[390,844], 'phone-tall':[412,915], 'phone-landscape':[844,390],
 'tablet-portrait':[834,1194], 'tablet-landscape':[1194,834], 'browser':[1440,900]
};
const initial={screen:'home',selectedSlot:2,depth:2,detailsOpen:false,slots:[
 {id:1,empty:true},
 {id:2,empty:false,name:'Burn Rush',hp:60,maxHp:60,location:'Glowworm Hollows',depth:2,deepest:2,floors:4,gold:273,cards:59,crystals:0,level:1,xp:0,xpMax:100,points:12,characterSprite:'../assets/art/run-avatar-fire-wizard.png'},
 {id:3,empty:true}
]};
function render(width,height,state=initial){
 let output=[],controls=[],textBoxes=[],serial=0;
 const W=Math.max(320,width),H=Math.max(320,height),short=W>H&&H<550;
 const side=(short&&W>=740)||(W>H&&W>=1000),wide=W>=740;
 const pad=short?12:W>=740?24:12,gap=8;
 let paneX=pad,paneY=0,paneW=W-pad*2,hero={x:0,y:0,w:W,h:0};
 if(side){hero={x:pad,y:pad,w:clamp(W*.285,220,400),h:H-pad*2};paneX=hero.x+hero.w+16;paneW=W-paneX-pad;paneY=short?pad:Math.max(pad,(H-360)/2);}
 else{paneW=Math.min(paneW,820);paneX=(W-paneW)/2;hero={x:0,y:0,w:W,h:short?Math.min(140,H*.3):Math.min(W*.56,wide?350:232)};paneY=hero.h+8;}
 const saveColumnHeight=short?254:(!side&&wide?clamp(H*.34,296,400):296);
 if(wide&&!side){const estimated=state.screen==='saves'?40+8+saveColumnHeight+8+48:376;const free=H-hero.h-estimated-Math.min(W,1300)/3;paneY=hero.h+Math.max(8,free/2);}
 const actualRun=state.slots.find(s=>s.id===state.selectedSlot&&!s.empty)||state.slots.find(s=>!s.empty);
 const occupied=actualRun||{id:state.selectedSlot||1,empty:true,name:'No active run',hp:0,maxHp:0,location:'Choose a save slot',depth:1,deepest:1,floors:4,gold:0,cards:0,crystals:0,level:1,xp:0,xpMax:100,points:0};
 const localDepth=clamp(state.depth||1,1,occupied.deepest||1);
 function rect(x,y,w,h,fill,extra=''){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;}
 function text(s,x,y,size=20,color=C.text,anchor='start'){
  textBoxes.push({text:String(s),x,y,size,anchor});
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
 }
 function img(path,x,y,w,h,fit='xMidYMid meet'){return `<image href="${esc(path)}" xlink:href="${esc(path)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${fit}"/>`;}
 function icon(n,x,y,size=24){return I.icon(n,x,y,size);}
 function panel(x,y,w,h,tone='steel',diamond=false){return `<g transform="translate(${x} ${y})">${S.skin(w,h,tone)}${diamond?S.diamond(w/2,0,10):''}</g>`;}
 function button(action,label,x,y,w,h=48,ico=null,tone='steel',disabled=false,parent=null){
  const ariaLabel=label||({'depth-prev':'Previous depth','depth-next':'Next depth'}[action]||action);
  const id='control-'+serial++;controls.push({id,action,label:ariaLabel,x,y,w,h,disabled,parent});
  const iconSize=ico?22:0,contentWidth=label.length*8+iconSize+(ico?8:0),start=x+(w-contentWidth)/2;
  return `<g class="control" id="${id}" data-action="${action}" role="button" tabindex="${disabled?-1:0}" aria-label="${esc(ariaLabel)}" aria-disabled="${disabled}" ${parent?'data-parent="'+parent+'"':''}>${rect(x,y,w,h,'#000','fill-opacity="0" pointer-events="all"')}<g transform="translate(${x} ${y})">${S.skin(w,h,tone,disabled?'disabled':'idle')}<path class="focus-ring" d="${S.chamfer(w-8,h-8,3)}" transform="translate(4 4)"/></g>${ico?icon(ico,start,y+(h-iconSize)/2,iconSize):''}${text(label,ico?start+iconSize+8:x+w/2,y+h/2+7,20,disabled?C.muted:C.text,ico?'start':'middle')}</g>`;
 }
 function resource(gold,cards,crystals,x,y,size=17){
  return icon('coin',x,y-15,16)+text(gold,x+20,y,size,C.gold)+icon('cards',x+60,y-15,16)+text(cards,x+80,y,size)+icon('crystal',x+111,y-15,16)+text(crystals,x+131,y,size);
 }
 function activeStrip(x,y,w){
  let label=w<350?`Slot ${occupied.id} ▾ · ${occupied.name}`:`Slot ${occupied.id} ▾ · ${occupied.name}  ${occupied.hp}/${occupied.maxHp}`;
  controls.push({id:'active-slot',action:'saves',label:'Choose save slot',x,y,w,h:48,disabled:false,parent:null});
  return `<g class="control" id="active-slot" data-action="saves" role="button" tabindex="0" aria-label="Choose save slot">${panel(x,y,w,48)+S.diamond(x+3,y+3,9)+text(label,x+10,y+20,w<350?17:18)+resource(occupied.gold,occupied.cards,occupied.crystals,x+10,y+40,15)}</g>`;
 }
 function runPanel(x,y,w){
  let s=panel(x,y,w,232,'steel',true)+icon('cave',x+10,y+8,24)+text(occupied.location,x+42,y+26,w<330?21:23,C.mint);
  s+=text(`Deepest ${occupied.deepest}`,x+w-12,y+43,14,C.muted,'end');
  s+=text(`Depth ${localDepth}/${occupied.floors} · Boss 4`,x+12,y+70,17);
  s+=button('depth-prev','',x+w-144,y+45,48,48,'back','steel',localDepth<=1);
  s+=text(localDepth,x+w-74,y+76,25,C.gold,'middle');
  s+=button('depth-next','',x+w-54,y+45,48,48,'next','steel',localDepth>=occupied.deepest);
  const nx=[x+26,x+w*.36,x+w*.65,x+w-26],ny=y+101;
  s+=`<path d="M${nx[0]} ${ny}H${nx[3]}" stroke="#626f70" stroke-width="1.2"/>`;
  nx.forEach((xx,i)=>{s+=i===3?icon('skull',xx-9,ny-9,18):`<circle cx="${xx}" cy="${ny}" r="6" fill="${i+1===localDepth?C.cyan:'#3d4c56'}" stroke="${i+1===localDepth?'#d4fbff':'#8c9c9e'}"/>`;});
  s+=icon('leaf',x+12,y+130,16)+text('Verdant',x+32,y+144,16,C.mint)+icon('fire',x+100,y+130,16)+text('Weak: Fire',x+120,y+144,15);
  s+=button('details','Details',x+w-92,y+119,80,48,null,'steel');
  const bw=(w-32)/2;
  s+=button('explore','Explore',x+12,y+172,bw,48,'map','cyan',!actualRun)+button('battle','Battle',x+20+bw,y+172,bw,48,'battle','steel',!actualRun);
  return s;
 }
 function nav(x,y,w,rows=false){
  const data=[['cards','Cards','cards'],['market','Market','market'],['journal','Journal','journal'],['character','Character','character']];
  let s='';data.forEach((a,i)=>{
   const bw=rows?w:(w-8)/2,xx=rows?x:x+(i%2)*(bw+8),yy=rows?y+i*56:y+Math.floor(i/2)*56;
   s+=button(a[0],a[1],xx,yy,bw,48,a[2]);
   if(a[0]==='character'&&occupied.points>0)s+=rect(xx+bw-30,yy+4,26,14,C.mint,'rx="2"')+text('+'+occupied.points,xx+bw-17,yy+15,12,'#102824','middle');
  });return s;
 }
 function xp(x,y,w){const trackW=Math.max(30,w-130),ratio=occupied.xpMax>0?clamp(occupied.xp/occupied.xpMax,0,1):0;return text(`Lv ${occupied.level} · ${occupied.xp}/${occupied.xpMax} XP`,x+4,y+17,16,C.muted)+rect(x+126,y+8,trackW,5,'#13242c','stroke="#626f70" stroke-width=".8"')+(ratio?rect(x+126,y+8,trackW*ratio,5,C.cyan):'');}
 let bodyEnd=0,screen=state.screen==='saves'?'saves':'home';
 if(screen==='home'){
  if(wide||side){
   const navW=clamp(paneW*.35,176,260),runW=paneW-navW-12;
   output.push(activeStrip(paneX,paneY,runW),button('saves','Continue',paneX+runW+12,paneY,navW,48,'play','cyan'));
   const by=paneY+56;output.push(runPanel(paneX,by,runW),nav(paneX+runW+12,by,navW,true));
   const fy=by+240;output.push(button('settings','Settings',paneX,fy,paneW,48,'settings'),xp(paneX,fy+56,paneW));bodyEnd=fy+80;
  }else{
   let y=paneY;output.push(activeStrip(paneX,y,paneW));y+=56;
   output.push(button('saves','Continue',paneX,y,paneW,48,'play','cyan'),S.diamond(paneX+3,y+45,9));y+=56;
   output.push(runPanel(paneX,y,paneW));y+=240;
   output.push(nav(paneX,y,paneW));y+=112;
   output.push(button('settings','Settings',paneX,y,paneW,48,'settings'));y+=56;
   output.push(xp(paneX,y,paneW));bodyEnd=y+24;
  }
 }else{
  output.push(panel(paneX,paneY,paneW,40,'steel',true),text('Choose a save slot',paneX+paneW/2,paneY+27,25,C.text,'middle'));
  const by=paneY+48,columns=wide||side,cw=columns?(paneW-16)/3:paneW;
  let y=by;
  state.slots.slice(0,3).forEach((slot,index)=>{
   const xx=columns?paneX+index*(cw+8):paneX,yy=columns?by:y,ch=columns?saveColumnHeight:(slot.empty?104:196),selected=state.selectedSlot===slot.id;
   const id='slot-select-'+slot.id;controls.push({id,action:'slot-'+slot.id,label:'Select slot '+slot.id,x:xx,y:yy,w:cw,h:ch,disabled:false,parent:null});
   let card=panel(xx,yy,cw,ch,selected?'cyan':'steel',selected);
   if(columns){
    card+=text('Slot '+slot.id,xx+12,yy+23,20);
    const aw=slot.empty?68:short?64:94,ay=yy+32;
    card+=panel(xx+(cw-aw)/2,ay,aw,aw)+ (slot.empty?icon('empty',xx+cw/2-18,ay+aw/2-18,36):img(slot.characterSprite,xx+(cw-aw)/2+3,ay+3,aw-6,aw-6));
    if(slot.empty)card+=text('Empty slot',xx+cw/2,yy+164,19,C.muted,'middle');
    else{
     const ty=short?115:151;
     card+=text(slot.name,xx+cw/2,yy+ty,21,C.text,'middle')+text(slot.hp+'/'+slot.maxHp,xx+cw/2,yy+ty+17,16,C.mint,'middle');
     card+=text(slot.location,xx+cw/2,yy+ty+34,short?14:17,C.mint,'middle')+text('Depth '+slot.depth,xx+cw/2,yy+ty+50,15,C.muted,'middle');
     card+=resource(slot.gold,slot.cards,slot.crystals,xx+12,yy+ty+67,short?13:15);
     card+=button('load-'+slot.id,'Continue',xx+8,yy+ch-56,cw-16,48,'play','cyan',false,id);
    }
   }else{
    const aw=slot.empty?72:80,ay=yy+(slot.empty?16:40);
    card+=panel(xx+12,ay,aw,aw)+ (slot.empty?icon('empty',xx+32,ay+18,32):img(slot.characterSprite,xx+15,ay+3,aw-6,aw-6));
    const tx=xx+108;
    card+=text('Slot '+slot.id,tx,yy+29,22);
    if(slot.empty)card+=text('Empty slot',tx,yy+57,19,C.muted);
    else{
     card+=text(slot.name,tx,yy+56,22)+text(slot.hp+'/'+slot.maxHp,xx+cw-12,yy+56,18,C.mint,'end');
     card+=text(slot.location,tx,yy+80,19,C.mint)+text('Depth '+slot.depth,tx,yy+101,17,C.muted)+resource(slot.gold,slot.cards,slot.crystals,tx,yy+127,15);
     card+=button('load-'+slot.id,'Continue',xx+cw-124,yy+140,112,48,'play','cyan',false,id);
    }
   }
   output.push(`<g class="control save-card" id="${id}" data-action="slot-${slot.id}" role="button" tabindex="0" aria-label="Select save slot ${slot.id}" aria-pressed="${selected}">${card}</g>`);
   if(!columns)y+=ch+8;
  });
  const fy=columns?by+saveColumnHeight+8:y;
  const bw=(paneW-8)/2,full=state.slots.every(s=>!s.empty);
  output.push(button('home','Back',paneX,fy,bw,48,'back'),button('newgame','New game',paneX+bw+8,fy,bw,48,'newgame','steel',full));bodyEnd=fy+48;
 }
 const docH=Math.max(H,bodyEnd+(side?pad:58));
 let bg=`<defs><pattern id="brick" width="160" height="160" patternUnits="userSpaceOnUse">${img('../assets/art/brick-tile.png',0,0,160,160)}</pattern><linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#06131b" stop-opacity="0"/><stop offset="1" stop-color="#06131b" stop-opacity=".92"/></linearGradient></defs>${rect(0,0,W,docH,'#06131b')}${rect(0,0,W,docH,'url(#brick)')}${rect(0,0,W,docH,'#030a10','fill-opacity=".5"')}`;
 if(side){
  const sceneH=hero.w*.563,sceneY=hero.y+Math.max(0,(hero.h-sceneH)/2);
  bg+=img('../assets/art/hero-scene.png',hero.x,sceneY,hero.w,sceneH)+img('../assets/art/logo.png',hero.x+8,Math.max(hero.y,sceneY-hero.w/4),hero.w-16,(hero.w-16)/3);
  bg+=img('../assets/art/footer-foreground.png',hero.x,docH-hero.w/3,hero.w,hero.w/3);
 }else{
  bg+=img('../assets/art/hero-scene.png',hero.x,hero.y,hero.w,hero.h,'xMidYMax slice');
  const lw=Math.min(W*.84,620);bg+=img('../assets/art/logo.png',(W-lw)/2,Math.max(4,hero.h*.03),lw,lw/3);
  const fw=Math.min(W,1300);bg+=img('../assets/art/footer-foreground.png',(W-fw)/2,docH-fw/3,fw,fw/3);
 }
 const css=`@font-face{font-family:'Jersey 15';src:url('../assets/fonts/jersey-15-latin-400-normal.woff2')}text{font-family:'Jersey 15',monospace;paint-order:stroke;stroke:#061015;stroke-width:.35;stroke-linejoin:round;pointer-events:none}.control{cursor:pointer;outline:none}.control[aria-disabled=true]{cursor:default}.control .focus-ring{fill:none;stroke:#7dd8e6;stroke-width:1.5;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:active{filter:brightness(1.2)}image{image-rendering:auto}`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${docH}" viewBox="0 0 ${W} ${docH}" role="group" aria-labelledby="screen-title"><title id="screen-title">Hexmancers ${screen==='home'?'main menu':'three save slots'}</title><style>${css}</style>${bg}${output.join('')}</svg>`;
 return {svg,width:W,height:docH,viewportHeight:H,screen,mode:side?'side':wide?'wide':'stack',controls,textBoxes,pane:{x:paneX,y:paneY,w:paneW,bottom:bodyEnd},scrollY:docH>H};
}
const api={profiles,initial,render,clamp};if(typeof module!=='undefined')module.exports=api;root.HexMenus=api;
})(typeof globalThis!=='undefined'?globalThis:this);
