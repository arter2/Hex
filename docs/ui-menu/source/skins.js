/* Authoritative border geometry. Logical units; preserve corners on resize. */
(function(root){
const colors={ink:'#101a1e',text:'#f3f1e7',muted:'#a8b6b8',steel:'#626f70',light:'#b5c1bb',bronze:'#897052',cyan:'#7dd8e6',mint:'#8de9b5',gold:'#f5cb60',danger:'#ec9384'};
function chamfer(w,h,c=5){return `M${c} 0H${w-c}L${w} ${c}V${h-c}L${w-c} ${h}H${c}L0 ${h-c}V${c}Z`;}
function layers(w,h,tone='steel',state='idle'){
 const cyan=tone==='cyan',light=cyan?'#c5f7ff':colors.light,mid=cyan?'#4199ab':colors.steel;
 const opacity=state==='pressed'?1:state==='disabled'?.28:.76;
 return {
  surface:`<path d="${chamfer(w,h)}" fill="${colors.ink}" fill-opacity="${opacity}"/>`,
  rim:`<defs><linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${light}"/><stop offset=".18" stop-color="${mid}"/><stop offset=".55" stop-color="#24323a"/><stop offset="1" stop-color="${mid}"/></linearGradient></defs><path d="${chamfer(w-1,h-1)}" transform="translate(.5 .5)" fill="none" stroke="#03090d" stroke-width="2"/><path d="${chamfer(w-2,h-2,4)}" transform="translate(1 1)" fill="none" stroke="url(#rim)" stroke-width="1.25"/>`,
  highlight:`<path d="M5 2H${w-5}L${w-2} 5" fill="none" stroke="${light}" stroke-opacity=".5" stroke-width=".6"/>`,
  keyline:`<path d="${chamfer(w-6,h-6,3)}" transform="translate(3 3)" fill="none" stroke="${cyan?colors.cyan:'#8a9c9c'}" stroke-opacity="${cyan?.4:.16}" stroke-width=".6"/>`,
  corners:`<g fill="${colors.bronze}" stroke="#bf9a60" stroke-width=".4"><rect x="3" y="3" width="2" height="2"/><rect x="${w-5}" y="3" width="2" height="2"/><rect x="3" y="${h-5}" width="2" height="2"/><rect x="${w-5}" y="${h-5}" width="2" height="2"/></g>`,
  focus:state==='focus'?`<path d="${chamfer(w-8,h-8,3)}" transform="translate(4 4)" fill="none" stroke="${colors.cyan}" stroke-width="1.5"/>`:'',
  hover:state==='hover'?`<path d="${chamfer(w-4,h-4,3)}" transform="translate(2 2)" fill="none" stroke="${colors.cyan}" stroke-opacity=".45"/>`:''
 };
}
let serial=0;
function skin(w,h,tone='steel',state='idle',only){
 const ls=layers(w,h,tone,state),id='hx-rim-'+serial++;
 const text=(only?ls[only]:Object.values(ls).join(''))||'';
 return `<g opacity="${state==='disabled'?.55:1}">${text.replaceAll('id="rim"',`id="${id}"`).replaceAll('url(#rim)',`url(#${id})`)}</g>`;
}
function diamond(x,y,size=10){return `<g transform="translate(${x-size/2} ${y-size/2})"><path d="M${size/2} 0L${size} ${size/2}L${size/2} ${size}L0 ${size/2}Z" fill="#133343" stroke="#897052" stroke-width=".7"/><path d="M${size/2} 1L${size-1} ${size/2}L${size/2} ${size-1}L1 ${size/2}Z" fill="#35bce1"/><path d="M${size/2} 1L1 ${size/2}H${size/2}Z" fill="#d4fbff"/><path d="M${size/2} ${size-1}L${size-1} ${size/2}H${size/2}Z" fill="#1266a6"/></g>`;}
const api={colors,chamfer,layers,skin,diamond};if(typeof module!=='undefined')module.exports=api;root.HexSkins=api;
})(typeof globalThis!=='undefined'?globalThis:this);
