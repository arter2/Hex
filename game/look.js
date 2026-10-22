/* Hexmancers — the look shared by the dungeon (explore.js) and the battle (arena.js): the painted
   stone and its height fields, the lighting pass every lit material goes through (texture-pixel
   lighting, light bands, normal maps, baked and screen-space AO), the draw call that runs it, the
   frame-rate readout and the debug menu that tunes it all. One copy of every setting, so a slider
   changes both screens. */
// test values, tuned by hand in the debug menu: the dither ball's radius and the alpha strip's half-width, in tiles
const xSetF=(k,d)=>{ try{ const v=parseFloat(localStorage.getItem(k)); return isNaN(v)?d:v; }catch(e){ return d; } };
const XB_DEF={ ball:1.25, strip:6 };
const XB={ ball:xSetF('hexmancers-xball',XB_DEF.ball), strip:xSetF('hexmancers-xstrip',XB_DEF.strip) };
/* The debug menu: test sliders and switches for the dungeon's look. Three fingers tapped three
   times anywhere opens it (` on a keyboard); it sits low on the screen over a clear backdrop, so
   the dungeon behind changes live as you slide. Every value is saved in this browser. */
/* Lighting, tuned in the debug menu (three fingers, three taps; ` on a keyboard). Every lit
   material on the floor goes through xLit:
   - Texture-pixel lighting: each light is worked out at the middle of the texture pixel, not at
     the screen pixel, so light falls across walls and floors in crisp art-pixel steps. Off: smooth.
   - Light bands: the light is rounded to a few levels (0 keeps it smooth).
   - Normal maps, shaped per material from the same layout as the colour (xNormalMap).
   - Baked AO: floors darken toward the walls from a per-floor map (xBakeAO); walls and pillars
     darken toward their feet.
   - Screen-space AO: a pass over the depth of the whole frame shades every crease (xSSAO). */
const xSetB=(k,d)=>{ try{ const v=localStorage.getItem(k); return v==null?d:v==='1'; }catch(e){ return d; } };
const XLIT_DEF={ amb:4, sun:3.5, lamp:2.05, lampRad:0.4, lampY:3.7, torch:0.55, torchRad:0.75, flick:2.15, myGlow:1.2, fogNear:51, fogFar:119, texel:true, steps:8, nmap:true, nstrF:1.05, nstrW:0.23, ao:true, aoStr:0.9, aoRad:0.6, ssao:true, ssaoStr:1.25, ssaoRad:0.55, fps:false, autoQ:true, camPitch:42, camFov:64, arWalls:true, camZoom:1.05, camX:0, camY:-0.5, camZ:0.3, camRX:11, camRY:0, camRZ:0, dof:true, dofFocus:7.9, dofRange:10, dofFade:16.3, dofNear:0.35, dofFar:0.5, dofBlur:12.5, pbr:true, pbrEnv:1.25, pbrR_gold:0.68, pbrM_gold:1, pbrR_steel:1, pbrM_steel:1, pbrR_gloss:0.14, pbrM_gloss:0, pbrR_ice:0.97, pbrM_ice:0, pbrR_slab:0.7, pbrM_slab:0, pbrRMap:1,
  dPitch:48, dDist:9.4, dFov:46, dAhead:1, dAim:0, dFog:true, dFogStart:6, dFogLen:14, dMemLit:.7, dMemDark:.35, dLightMem:1, dCut:false, dCutH:.3, dDoorMin:.75, dDoorGlow:.3, dofShow:false, vig:0.98, vigR:0.79, vigSoft:0.38, mvSpeed:1.2, mvSnap:1, mvSnapR:0.46, mvSnapSpd:2.3, mvRest:0.6, mvDrag:2.5, mvAccel:0, mvShow:false, mvStick:true, mvStickShow:true, mvStickR:56, mvDead:.18, mvStickMin:.25, mvStickFull:.8, mvCurve:1, mvTapMs:200, mvTapPx:12, mvStickSpeed:5, mvEven:1, mvSnapTime:.12, mvSnapAhead:true, mvStride:.5, mvFaceWalk:true, mvMomentum:true, mvMAccel:.1, mvMBrake:.22, mvGrip:.7 };   // d...: the dungeon camera, haze, what you remember and walls; mv...: how you walk in battle (battle.js freeTick)
// the debug menu's pause: the game holds still (no moves, no clocks) but keeps being drawn; never saved
const DBG={pause:false};
const XLIT={}; for(const k in XLIT_DEF) XLIT[k]=typeof XLIT_DEF[k]==='boolean'?xSetB('hexmancers-xl-'+k,XLIT_DEF[k]):xSetF('hexmancers-xl-'+k,XLIT_DEF[k]);
const XLITU={ uXSteps:{value:XLIT.steps}, uXAO:{value:XLIT.ao?XLIT.aoStr:0}, uXAOTex:{value:null}, uXFoot:{value:1.75*XLIT.aoRad}, uXAOScale:{value:96}, uXAOOrg:{value:new THREE.Vector2()} };
const XLITMATS=new Set();
// a tangent-space normal map from a height field (in texel units, times k)
function xNormalMap(H,N,k){ const c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'), im=x.createImageData(N,N), at=(i,j)=>H[((j+N)%N)*N+((i+N)%N)];
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const nx=-(at(i+1,j)-at(i-1,j))*k, ny=(at(i,j+1)-at(i,j-1))*k, l=Math.hypot(nx,ny,1), o=(j*N+i)*4;
    im.data[o]=(nx/l*.5+.5)*255; im.data[o+1]=(ny/l*.5+.5)*255; im.data[o+2]=(1/l*.5+.5)*255; im.data[o+3]=255; }
  x.putImageData(im,0,0); return c; }
// mark a material for xLit: ao 1 = floor (the AO map), 2 = stands on the floor (darker at its foot);
// a painted texture with a height field (cv.h) gets its normal map
function xLitTag(m,ao,cv){ m.userData.xao=ao||0;
  if(cv&&cv.h){ const nm=cv.nm||(cv.nm=xNormalMap(cv.h,cv.width,cv.hk||.5)), t=xTex(nm,m.map&&m.map.wrapS===THREE.RepeatWrapping); m.userData.nmap=t;
    if(m.isMeshStandardMaterial){ const rm=cv.rm||(cv.rm=xRoughMap(cv.h,cv.width)), rt=xTex(rm,m.map&&m.map.wrapS===THREE.RepeatWrapping); if(m.map) rt.repeat.copy(m.map.repeat); m.roughnessMap=rt; } }
  return m; }
function xLitAll(root){ root=root||(typeof X3!=='undefined'&&X3&&X3.group); if(!root) return; root.traverse(o=>{ const M=o.material; if(!M) return; for(const m of Array.isArray(M)?M:[M]) if(m.isMeshPhongMaterial||m.isMeshStandardMaterial) xLit(m); }); }
function xLitDefines(m){ const d=m.defines||(m.defines={}); delete d.XLIT_TEXEL; delete d.XTEXN;
  if(XLIT.texel&&m.map&&m.map.image){ d.XLIT_TEXEL=''; d.XTEXN=(m.map.image.width||64).toFixed(1); }
  d.XLIT_AO=XLIT.ao?(m.userData.xao||0):0;
  const nm=XLIT.nmap?m.userData.nmap||null:null; if(m.normalMap!==nm) m.normalMap=nm; const ns=m.userData.xao===1?XLIT.nstrF:XLIT.nstrW; m.normalScale.set(ns,ns); }
function xLit(m){ if(m.userData.xlit) return m; m.userData.xlit=1; XLITMATS.add(m);
  const prev=m.onBeforeCompile, pk=m.customProgramCacheKey!==THREE.Material.prototype.customProgramCacheKey?m.customProgramCacheKey:null;
  m.extensions=Object.assign(m.extensions||{},{derivatives:true});
  m.onBeforeCompile=(sh,r)=>{ prev.call(m,sh,r); xLitShader(sh); };
  m.customProgramCacheKey=()=>(pk?pk.call(m):'p')+'|xlit';
  xLitDefines(m); m.needsUpdate=true; return m; }
// a lighting switch changed: every lit material is rebuilt with its new defines
function xLitRefresh(){ XLITU.uXSteps.value=XLIT.steps; XLITU.uXAO.value=XLIT.ao?XLIT.aoStr:0; XLITU.uXFoot.value=1.75*XLIT.aoRad;
  for(const m of XLITMATS){ const d=JSON.stringify(m.defines), n=m.normalMap; xLitDefines(m); if(d!==JSON.stringify(m.defines)||n!==m.normalMap) m.needsUpdate=true; } }
function xLitShader(sh){ Object.assign(sh.uniforms,XLITU);
  sh.vertexShader='varying vec3 vXLW;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n  vec4 xlw=vec4(transformed,1.0);\n  #ifdef USE_INSTANCING\n  xlw=instanceMatrix*xlw;\n  #endif\n  vXLW=(modelMatrix*xlw).xyz;');
  let f=sh.fragmentShader;
  if(f.includes('#include <lights_fragment_begin>')) f=f.replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin);
  f=f.replace(/(geometry\.position = [^;]*?)- vViewPosition;/,'$1xLitPos(- vViewPosition);');
  f=f.replace('void main() {',`varying vec3 vXLW; uniform float uXSteps; uniform float uXAO; uniform sampler2D uXAOTex; uniform float uXFoot; uniform float uXAOScale; uniform vec2 uXAOOrg;
// the point lit, moved to the middle of its texture pixel: the screen-space step to there, from the
// change of uv across the pixel, taken along the change of position
vec3 xLitPos(vec3 p){
#if defined(XLIT_TEXEL)&&defined(USE_MAP)
  vec2 t=vUv*XTEXN, d=(floor(t)+.5-t)/XTEXN, ux=dFdx(vUv), uy=dFdy(vUv); float det=ux.x*uy.y-uy.x*ux.y;
  if(abs(det)>1e-12) p+=dFdx(p)*((d.x*uy.y-uy.x*d.y)/det)+dFdy(p)*((ux.x*d.y-d.x*ux.y)/det);
#endif
  return p; }
void main() {`);
  f=f.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
  {
#if XLIT_AO==1
  float xa=1.0-uXAO*.6*texture2D(uXAOTex,(vXLW.xz-uXAOOrg)/uXAOScale).r;
#elif XLIT_AO==2
  float xu=1.0-smoothstep(0.0,uXFoot,vXLW.y); float xa=1.0-uXAO*.55*xu*xu*(3.0-2.0*xu);
#else
  float xa=1.0;
#endif
  reflectedLight.directDiffuse*=xa; reflectedLight.indirectDiffuse*=xa;
  if(uXSteps>.5){ vec3 xd=reflectedLight.directDiffuse+reflectedLight.indirectDiffuse, xl3=xd/max(diffuseColor.rgb,vec3(.004)); float xl=max(xl3.r,max(xl3.g,xl3.b));
    if(xl>.0005){ float xs=ceil(xl*uXSteps-.25)/uXSteps/xl; reflectedLight.directDiffuse*=xs; reflectedLight.indirectDiffuse*=xs; } }
  }`);
  sh.fragmentShader=f; }
// the AO map: for each spot of floor, how shut in it is by the wall blocks around it (8 texels a cell)
const XAO_R=8;
function xBakeAO(){ if(!EX||!EX.wIdx) return; const R=XAO_R, W=XN*R, d=EX.aoData||(EX.aoData=new Uint8Array(W*W*4)), rad=Math.max(.05,XLIT.aoRad)*XCS, sz=XCS/R;
  const wall=(x,y)=>x<0||y<0||x>=XN||y>=XN||EX.wIdx.has(xi(x,y)), reach=Math.ceil(rad/XCS)+1;
  for(let ty=0;ty<W;ty++) for(let tx=0;tx<W;tx++){ const wx=(tx+.5)*sz, wz=(ty+.5)*sz, cx=Math.floor(wx/XCS), cy=Math.floor(wz/XCS); let o=0;
    if(wall(cx,cy)) o=9; else for(let dy=-reach;dy<=reach;dy++) for(let dx=-reach;dx<=reach;dx++){ if(!wall(cx+dx,cy+dy)) continue;
      const x0=(cx+dx)*XCS, z0=(cy+dy)*XCS, ex=Math.max(x0-wx,0,wx-x0-XCS), ez=Math.max(z0-wz,0,wz-z0-XCS), w=Math.max(0,1-Math.hypot(ex,ez)/rad); o+=w*w; }
    d[(ty*W+tx)*4]=Math.round(255*(1-Math.exp(-o*.9))); }
  if(!EX.aoTex){ const t=new THREE.DataTexture(d,W,W,THREE.RGBAFormat); t.magFilter=t.minFilter=THREE.LinearFilter; EX.aoTex=t; }
  EX.aoTex.needsUpdate=true; XLITU.uXAOTex.value=EX.aoTex; }
/* Screen-space AO: the frame is drawn into a target with its depth; a half-size pass rebuilds each
   pixel's position, takes twelve samples in a disc around it (the disc as wide on screen as
   ssaoRad tiles at that depth) and counts how much of what is near rises in front of its surface;
   the last pass blurs that a little and darkens the frame by it. */
const XSSAO={ ok:null };
function xSSAOInit(r){ if(XSSAO.ok!=null) return XSSAO.ok;
  if(!r.capabilities.isWebGL2&&!r.extensions.get('WEBGL_depth_texture')) return XSSAO.ok=false;
  const rt=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter}); rt.depthTexture=new THREE.DepthTexture(1,1); rt.depthTexture.type=THREE.UnsignedIntType;
  const ao=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false});
  const vs='varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
  const aoM=new THREE.ShaderMaterial({ depthTest:false, depthWrite:false, vertexShader:vs,
    uniforms:{ tDepth:{value:rt.depthTexture}, uInvProj:{value:new THREE.Matrix4()}, uP11:{value:1}, uRes:{value:new THREE.Vector2(1,1)}, uRad:{value:1}, uStr:{value:1} },
    fragmentShader:`uniform sampler2D tDepth; uniform mat4 uInvProj; uniform float uP11, uRad, uStr; uniform vec2 uRes; varying vec2 vUv;
vec3 xv(vec2 uv){ float d=texture2D(tDepth,uv).x; vec4 v=uInvProj*vec4(uv*2.0-1.0,d*2.0-1.0,1.0); return v.xyz/v.w; }
void main(){ if(texture2D(tDepth,vUv).x>=.99999){ gl_FragColor=vec4(1.0); return; }
  vec2 px=1.0/uRes; vec3 P=xv(vUv), r=xv(vUv+vec2(px.x,0.0)), l=xv(vUv-vec2(px.x,0.0)), u=xv(vUv+vec2(0.0,px.y)), b=xv(vUv-vec2(0.0,px.y));
  vec3 N=normalize(cross(abs(r.z-P.z)<abs(P.z-l.z)?r-P:P-l, abs(u.z-P.z)<abs(P.z-b.z)?u-P:P-b));
  float sr=uRad*uP11*.5/max(.1,-P.z), a0=6.2831*fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715)))), occ=0.0;
  for(int i=0;i<12;i++){ float t=(float(i)+.5)/12.0, a=a0+float(i)*2.39996; vec2 o=vec2(cos(a)*uRes.y/uRes.x,sin(a))*sqrt(t)*sr;
    vec2 su=vUv+o; if(su.x<0.0||su.y<0.0||su.x>1.0||su.y>1.0) continue;   // off the screen: nothing known there
    vec3 v=xv(su)-P; float vv=dot(v,v); occ+=max(0.0,dot(v,N)*inversesqrt(vv+1e-4)-.12)*(1.0-smoothstep(.4*uRad*uRad,uRad*uRad,vv)); }
  gl_FragColor=vec4(vec3(clamp(1.0-uStr*occ/12.0*2.2,0.0,1.0)),1.0); }` });
  const cM=new THREE.ShaderMaterial({ depthTest:false, depthWrite:false, vertexShader:vs, uniforms:{ tColor:{value:rt.texture}, tAO:{value:ao.texture}, uTx:{value:new THREE.Vector2()} },
    fragmentShader:`uniform sampler2D tColor, tAO; uniform vec2 uTx; varying vec2 vUv;
void main(){ float a=0.0; for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++) a+=texture2D(tAO,vUv+vec2(float(x),float(y))*uTx).r; gl_FragColor=vec4(texture2D(tColor,vUv).rgb*a/9.0,1.0); }` });
  const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),aoM); q.frustumCulled=false; const qs=new THREE.Scene(); qs.add(q);
  Object.assign(XSSAO,{rt,ao,aoM,cM,q,qs,cam:new THREE.OrthographicCamera(-1,1,1,-1,0,1),sz:new THREE.Vector2()});
  return XSSAO.ok=true; }
/* Auto quality: a slow phone keeps its frame rate. A running average of frame time above 20 ms for a
   second and a half steps down (sharpness 2, 1.5, 1 then .75 screen pixels per pixel; then no
   screen-space AO; then half the spell lights); below 13 ms for 3 s steps back up. Off in the debug
   menu, the look stays as set. */
const LQ_STEPS=[{pr:2,lights:4},{pr:1.5,lights:4},{pr:1,lights:4},{pr:.75,lights:4},{pr:.75,lights:4,noSsao:1},{pr:.75,lights:2,noSsao:1}];
const LQ={step:0,avg:16,slowT:0,fastT:0,upWait:3,upAt:-1e9};
function lookQuality(dt){ if(!XLIT.autoQ){ LQ.step=0; return LQ_STEPS[0]; } const ms=Math.min(250,dt*1000); LQ.avg+=(ms-LQ.avg)/30;
  // a step back up that soon has to come down again (walking between a heavy room and a light one)
  // doubles the wait before the next step up, so the sharpness does not flip back and forth: each
  // flip resizes the frame, a hitch of its own
  const now=performance.now();
  if(LQ.avg>20){ LQ.slowT+=dt; LQ.fastT=0; if(LQ.slowT>1.5&&LQ.step<LQ_STEPS.length-1){ LQ.step++; LQ.slowT=0; LQ.avg=16; if(now-LQ.upAt<12000) LQ.upWait=Math.min(60,LQ.upWait*2); } }
  else if(LQ.avg<13){ LQ.fastT+=dt; LQ.slowT=0; if(LQ.fastT>LQ.upWait&&LQ.step>0){ LQ.step--; LQ.fastT=0; LQ.upAt=now; } }
  else { LQ.slowT=0; LQ.fastT=0; }
  return LQ_STEPS[LQ.step]; }
// the pixel ratio a renderer should draw at now
const lookPR=()=>Math.min(window.devicePixelRatio||1,LQ_STEPS[LQ.step].pr);
function xRender(G){ const r=G.renderer; r.info.autoReset=false; r.info.reset();
  // depth of field and its focus view need the focus distance (the battle's board, you in the dungeon); the vignette goes on any frame
  const ssao=XLIT.ssao&&!LQ_STEPS[LQ.step].noSsao, dof=!!(G.dof&&XLIT.dof&&XLIT.dofBlur>0), show=!!(G.dof&&XLIT.dofShow), post=dof||show||XLIT.vig>0;
  if((!ssao&&!post)||!xSSAOInit(r)){ r.render(G.scene,G.cam); return; }
  const S=XSSAO; r.getDrawingBufferSize(S.sz); const w=S.sz.x|0, h=S.sz.y|0, hw=Math.max(1,w>>1), hh=Math.max(1,h>>1);
  if(S.rt.width!==w||S.rt.height!==h){ S.rt.setSize(w,h); S.ao.setSize(hw,hh); }
  if(post) xDofInit(w,h);
  r.setRenderTarget(S.rt); r.render(G.scene,G.cam);
  if(ssao){ const U=S.aoM.uniforms; U.uInvProj.value.copy(G.cam.projectionMatrixInverse); U.uP11.value=G.cam.projectionMatrix.elements[5]; U.uRes.value.set(hw,hh); U.uRad.value=XLIT.ssaoRad*(G.unit||2); U.uStr.value=XLIT.ssaoStr;
    S.q.material=S.aoM; r.setRenderTarget(S.ao); r.render(S.qs,S.cam);
    S.cM.uniforms.uTx.value.set(1/hw,1/hh); S.q.material=S.cM; r.setRenderTarget(post?S.rt2:null); r.render(S.qs,S.cam); }
  if(post){ const U=S.dM.uniforms; U.tColor.value=ssao?S.rt2.texture:S.rt.texture; U.uInvProj.value.copy(G.cam.projectionMatrixInverse); U.uRes.value.set(w,h);
    const tl=G.tile||1.732; U.uFocus.value=(G.dof||10)+XLIT.dofFocus*tl; U.uRange.value=XLIT.dofRange*tl; U.uFade.value=Math.max(.05,XLIT.dofFade)*tl; U.uNear.value=XLIT.dofNear; U.uFar.value=XLIT.dofFar; U.uBlur.value=dof?XLIT.dofBlur*r.getPixelRatio():0;
    U.uShow.value=show?1:0; U.uVig.value=XLIT.vig; U.uVigR.value=XLIT.vigR; U.uVigSoft.value=Math.max(.05,XLIT.vigSoft);
    S.q.material=S.dM; r.setRenderTarget(null); r.render(S.qs,S.cam); } }
/* Depth of field (debug menu, battle camera): each pixel's distance from the camera, from the depth
   the frame was drawn with. Within the sharp depth of the focus it stays sharp; beyond that the blur eases
   in (a smooth curve, no edge) over the fade distance up to dofBlur screen pixels, times the near strength
   in front of the focus and the far strength behind it. The blur gathers 32 samples in a disc (a sample
   counts as far as it is itself blurred that far, so sharp things keep their edges), and the result is
   mixed in by how blurred the pixel is, so sharp and blurred meet without a seam.
   The same pass shows the focus (debug menu: a yellow line on the focus, green over the sharp depth,
   pink deepening in front of it and blue behind it as the blur grows) and lays the vignette on last. */
function xDofInit(w,h){ const S=XSSAO;
  if(!S.dM){ S.rt2=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false});
    S.dM=new THREE.ShaderMaterial({ depthTest:false, depthWrite:false, vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }',
      extensions:{derivatives:true},
      uniforms:{ tColor:{value:null}, tDepth:{value:S.rt.depthTexture}, uInvProj:{value:new THREE.Matrix4()}, uRes:{value:new THREE.Vector2(1,1)}, uFocus:{value:10}, uRange:{value:2}, uFade:{value:4}, uNear:{value:1}, uFar:{value:1}, uBlur:{value:6},
        uShow:{value:0}, uVig:{value:0}, uVigR:{value:.55}, uVigSoft:{value:.7} },
      fragmentShader:`uniform sampler2D tColor, tDepth; uniform mat4 uInvProj; uniform vec2 uRes; uniform float uFocus, uRange, uFade, uNear, uFar, uBlur, uShow, uVig, uVigR, uVigSoft; varying vec2 vUv;
float zof(vec2 uv){ float d=texture2D(tDepth,uv).x; if(d>=.99999) return 1e4; vec4 v=uInvProj*vec4(uv*2.0-1.0,d*2.0-1.0,1.0); return -v.z/v.w-uFocus; }
float coc(vec2 uv){ float z=zof(uv); return uBlur*smoothstep(uRange,uRange+uFade,abs(z))*(z<0.0?uNear:uFar); }
void main(){ float C=uBlur>0.0?coc(vUv):0.0; vec3 col=texture2D(tColor,vUv).rgb;
  if(C>=.05){ vec3 acc=col; float ws=1.0; float a0=6.2831*fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
    for(int i=0;i<32;i++){ float t=(float(i)+.5)/32.0, a=a0+float(i)*2.39996, rr=sqrt(t)*C; vec2 su=vUv+vec2(cos(a),sin(a))*rr/uRes;
      float w=smoothstep(rr*.6-1.0,rr+1.0,coc(su)); acc+=texture2D(tColor,su).rgb*w; ws+=w; }
    col=mix(col,acc/ws,smoothstep(0.0,1.5,C)); }
  if(uShow>.5){ float z=zof(vUv), a=abs(z), k=smoothstep(uRange,uRange+uFade,a)*(z<0.0?min(1.0,uNear):min(1.0,uFar)), e=min(fwidth(z),.06)*1.5;   // capped, so object edges do not light up as lines
    vec3 tint=a<uRange?vec3(.25,1.0,.35):z<0.0?vec3(1.0,.3,.7):vec3(.3,.55,1.0);
    col=mix(col,tint,a<uRange?.22:.22+.5*k);
    if(abs(a-uRange)<e) col=mix(col,vec3(.25,1.0,.35),.9);   // the edges of the sharp depth
    if(a<e*1.4) col=vec3(1.0,.92,.2); }                       // the focus itself
  if(uVig>0.0){ float r=length(vUv-.5)*1.414; col*=1.0-uVig*smoothstep(uVigR,uVigR+uVigSoft,r); }
  gl_FragColor=vec4(col,1.0); }` }); }
  if(S.rt2.width!==w||S.rt2.height!==h) S.rt2.setSize(w,h); }
// a change to the AO's reach re-bakes whichever map is in use: the dungeon floor's, or the battle arena's
function lookBake(){ if(typeof xBakeAO==='function') xBakeAO(); if(typeof arenaBakeAO==='function') arenaBakeAO(); }
// the shared AO uniforms point at the map of the screen about to draw (its texture, where it starts, how wide it is)
function lookUse(tex,scale,ox,oz){ XLITU.uXAOTex.value=tex||null; XLITU.uXAOScale.value=scale||96; XLITU.uXAOOrg.value.set(ox||0,oz||0); }
function xTex(cv,rep){ const t=new THREE.CanvasTexture(cv); t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }
/* PBR (a debug switch, to compare): the surfaces where it shows become MeshStandardMaterial, with a
   roughness and metalness of their own, a roughness map made from the painted stone's height (worn
   tops smoother, grout and cracks rougher), and the area's light reflected in them (lookEnv). Plain
   rock stays as it is: it is matte either way, and costs less to light.
     gold   polished metal          steel  bright metal (blades, gear, mirrors)
     gloss  crystals and storm-stones   ice  glassy ice
     slab   cut-stone floors, a dull sheen on the worn tops */
const XPBR_KIND={ gold:{e:1.1}, steel:{e:1}, gloss:{e:1.2}, ice:{e:1.4}, slab:{e:.6} };   // roughness and metalness: XLIT.pbrR_<kind>, XLIT.pbrM_<kind> (debug menu)
// the debug menu's values onto every PBR material, live
function xPBRTune(){ for(const m of XLITMATS) if(m.isMeshStandardMaterial&&m.userData.pbr){ const k=m.userData.pbr; m.roughness=XLIT['pbrR_'+k]; m.metalness=XLIT['pbrM_'+k]; m.envMapIntensity=XPBR_KIND[k].e*XLIT.pbrEnv;
    if(m.roughnessMap){ const want=XLIT.pbrRMap>0; if(!want&&m.roughnessMap){ m.userData.rmap=m.roughnessMap; m.roughnessMap=null; m.needsUpdate=true; } } else if(XLIT.pbrRMap>0&&m.userData.rmap){ m.roughnessMap=m.userData.rmap; m.needsUpdate=true; } } }
function xPBRKind(o){ if(o.pbr!==undefined) return o.pbr; if(o.color==null) return null; const c=new THREE.Color(o.color).getHex();
  if(c===0xf2c94c) return 'gold'; if((o.shininess||0)>=60) return 'steel'; return null; }
const xPhong=(o)=>{ o=o||{}; const k=XLIT.pbr&&xPBRKind(o), q=Object.assign({shininess:4,specular:0x111111},o); delete q.pbr;
  if(!k||!XPBR_KIND[k]) return new THREE.MeshPhongMaterial(q);
  const K=XPBR_KIND[k]; delete q.shininess; delete q.specular;
  const m=new THREE.MeshStandardMaterial(Object.assign(q,{roughness:XLIT['pbrR_'+k],metalness:XLIT['pbrM_'+k],envMapIntensity:K.e*XLIT.pbrEnv})); m.userData.pbr=k; return m; };
// a roughness map from a painted height field: the high, worn faces smoother, the low joints rougher
function xRoughMap(H,N){ const c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'), im=x.createImageData(N,N); let lo=1e9, hi=-1e9;
  for(let i=0;i<H.length;i++){ lo=Math.min(lo,H[i]); hi=Math.max(hi,H[i]); }
  for(let i=0;i<H.length;i++){ const t=(H[i]-lo)/Math.max(1e-6,hi-lo), v=Math.round(255*Math.max(.35,Math.min(1,1.25-t*.8))); im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=v; im.data[i*4+3]=255; }
  x.putImageData(im,0,0); return c; }
/* The area's light, for PBR surfaces to reflect: a small sky of the area's air (darker above, its
   haze around the horizon, its glow in a few bright patches low down), filtered once per renderer
   and area. */
const LOOK_ENV=new WeakMap();
function lookEnv(renderer,A){ if(!XLIT.pbr||!renderer||!A) return null; const c=LOOK_ENV.get(renderer); if(c&&c.key===A.id) return c.tex; if(c) c.tex.dispose();
  const sc=new THREE.Scene(), g=new THREE.SphereGeometry(10,32,16), fog=new THREE.Color(A.fog), glow=new THREE.Color(A.glow), col=[], P=g.attributes.position;
  for(let i=0;i<P.count;i++){ const y=P.getY(i)/10, h=Math.max(0,1-Math.abs(y+.1)*2.2), top=Math.max(0,y);
    const cc=fog.clone().multiplyScalar(.25+.9*h).lerp(new THREE.Color(0x000000),top*.7).add(glow.clone().multiplyScalar(.35*h*h)); col.push(cc.r,cc.g,cc.b); }
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); sc.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
  for(let k=0;k<5;k++){ const a=k*1.26, b=new THREE.Mesh(new THREE.SphereGeometry(.9,8,6),new THREE.MeshBasicMaterial({color:glow.clone().multiplyScalar(2.2)})); b.position.set(Math.cos(a)*8,-1+k%2*1.5,Math.sin(a)*8); sc.add(b); }
  const pm=new THREE.PMREMGenerator(renderer), tex=pm.fromScene(sc,.02).texture; pm.dispose(); g.dispose();
  LOOK_ENV.set(renderer,{key:A.id,tex}); return tex; }
/* Stone, drawn once per area from its `stone` look in world.js: periodic noise so big textures tile without seams, quantized to a
   few tones so it still reads as pixel art. Corridors are raw rock; rooms are cut stone in one
   of two patterns; walls are rough rock along corridors and chiseled blocks around rooms. */
function xNoise(N,cells,R){ const g=new Float32Array(cells*cells).map(()=>R());
  const at=(x,y)=>g[((y%cells+cells)%cells)*cells+((x%cells+cells)%cells)], sm=t=>t*t*(3-2*t);
  return (px,py)=>{ const fx=px/N*cells, fy=py/N*cells, x0=Math.floor(fx), y0=Math.floor(fy), tx=sm(fx-x0), ty=sm(fy-y0);
    return (at(x0,y0)*(1-tx)+at(x0+1,y0)*tx)*(1-ty)+(at(x0,y0+1)*(1-tx)+at(x0+1,y0+1)*tx)*ty; }; }
function xFbm(N,R,base){ const o=[base,base*2,base*4,base*8].map(c=>xNoise(N,c,R)); return (x,y)=>o[0](x,y)*.5+o[1](x,y)*.25+o[2](x,y)*.15+o[3](x,y)*.1; }
const xHexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function xPaint(N,fn){ const c=document.createElement('canvas'); c.width=c.height=N; const x=c.getContext('2d'), im=x.createImageData(N,N);
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const v=fn(i,j), o=(j*N+i)*4; im.data[o]=v[0]; im.data[o+1]=v[1]; im.data[o+2]=v[2]; im.data[o+3]=255; }
  x.putImageData(im,0,0); return c; }
const xTone=(S,t)=>{ const r=S.rock, k=Math.max(0,Math.min(r.length-1.001,t*(r.length-1))), i=Math.floor(k); return xHexRGB(r[i]).map((v,n)=>Math.round(v+(xHexRGB(r[i+1])[n]-v)*(k-i>.5?1:0))); };
function xSpeck(c,S,R,n,small){ const x=c.getContext('2d'), N=c.width;
  for(let k=0;k<n;k++){ const cx=R()*N|0, cy=R()*N|0;
    if(S.detail==='moss'){ x.fillStyle=S.moss; for(let m=0;m<7;m++) x.fillRect((cx+R()*6-3)%N|0,(cy+R()*4-2)%N|0,1,1); if(R()<.3){ x.fillStyle=S.spark; x.fillRect(cx,cy,1,1); } }
    else if(S.detail==='frost'){ x.fillStyle=S.moss; x.globalAlpha=.5; let px=cx, py=cy; for(let m=0;m<8;m++){ x.fillRect(px|0,py|0,1,1); px+=R()*2-.5; py+=R()*2-1; } x.globalAlpha=1; }
    else if(S.detail==='embers'){ x.fillStyle=S.spark; let px=cx, py=cy; for(let m=0;m<6;m++){ x.globalAlpha=.35+R()*.4; x.fillRect(px|0,py|0,1,1); px+=R()*2-1; py+=R()*2-1; } x.globalAlpha=1; }
    else if(S.detail==='gold'){ if(R()<.4){ x.fillStyle=S.spark; x.globalAlpha=.6; x.fillRect(cx,cy,small?1:2,1); x.globalAlpha=1; } }
    else { x.fillStyle=R()<.5?S.spark:S.moss; x.globalAlpha=.3+R()*.5; x.fillRect(cx,cy,1,1); x.globalAlpha=1; } } }
// raw cave rock: blotchy fbm, a few ridged cracks, pebbles with a lit top and a shadow
function xRockFloor(S,seed){ const N=256, R=caveRng(seed), f=xFbm(N,R,4), cr=xNoise(N,12,R), cr2=xNoise(N,7,R), H=new Float32Array(N*N);
  const c=xPaint(N,(i,j)=>{ let t=f(i,j)*1.25-.12; const k=Math.abs(cr(i,j)-.5), k2=Math.abs(cr2(i,j)-.5), fv=f(i,j);
    H[j*N+i]=fv*7-(k<.03?(.03-k)*80:0)-(k2<.02?(.02-k2)*90:0);   // lumpy rock, the cracks sunk in
    if(k<.012||k2<.008) t-=.35; else if(k<.03) t+=.06; return xTone(S,Math.max(0,Math.min(1,t))); });
  const x=c.getContext('2d');
  for(let n=0;n<90;n++){ const px=R()*N|0, py=R()*N|0, w=1+R()*3|0, h=1+R()*2|0, tt=.5+R()*.4;
    x.fillStyle='rgba(0,0,0,.45)'; x.fillRect(px+1,py+1,w,h); x.fillStyle='rgb('+xTone(S,tt).join(',')+')'; x.fillRect(px,py,w,h); x.fillStyle='rgb('+xTone(S,1).join(',')+')'; x.fillRect(px,py,w,1);
    for(let j=py;j<py+h;j++) for(let i=px;i<px+w;i++) H[(j%N)*N+i%N]+=1.6; }   // pebbles stand up
  xSpeck(c,S,R,40); c.h=H; c.hk=.55; return c; }
// cut stone: irregular slabs in staggered rows (style 0) or a tighter running bond of smaller tiles (style 1)
function xSlabFloor(S,seed,style){ const N=256, R=caveRng(seed), f=xFbm(N,R,8), id=new Int16Array(N*N), edge=new Uint8Array(N*N), dist=new Uint8Array(N*N), tone=[], tilt=[], H=new Float32Array(N*N);
  const rowsH=[]; let y=0; while(y<N){ const h=style?16:(20+R()*20|0); rowsH.push([y,Math.min(h,N-y)]); y+=h; }
  let sid=0;
  for(const [y0,h] of rowsH){ const off=R()*N|0; let x0=0; while(x0<N){ const w=style?32:(26+R()*40|0), ww=Math.min(w,N-x0);
      for(let j=y0;j<y0+h;j++) for(let i=x0;i<x0+ww;i++){ const X=(i+off)%N; id[j*N+X]=sid;
        edge[j*N+X]=(j===y0?1:0)|(j===y0+h-1?2:0)|(i===x0?4:0)|(i===x0+ww-1?8:0); dist[j*N+X]=Math.min(j-y0,y0+h-1-j,i-x0,x0+ww-1-i); }
      tone.push(.35+R()*.35); tilt.push([(R()-.5)*.06,(R()-.5)*.06]); sid++; x0+=ww; } }
  // the slabs' height: each one a little tilted, its edges worn round, sunk joints between them
  const c=xPaint(N,(i,j)=>{ const k=j*N+i, e=edge[k], tl=tilt[id[k]]; let t=tone[id[k]]+(f(i,j)-.5)*.35;
    H[k]=(e&(2|8)?-1:Math.min(dist[k],3)*.9)+tone[id[k]]*2+tl[0]*i+tl[1]*j+f(i,j)*1.6;
    if(e&(2|8)) t=.05; else if(e&(1|4)) t=Math.min(1,t+.28); return xTone(S,Math.max(0,Math.min(1,t))); });
  const x=c.getContext('2d');
  for(let n=0;n<26;n++){ let px=R()*N, py=R()*N, a=R()*6.3; x.fillStyle='rgba(0,0,0,.55)'; for(let m=0;m<6+R()*12;m++){ x.fillRect(px|0,py|0,1,1); H[((py|0)%N+N)%N*N+((px|0)%N+N)%N]-=1.4; a+=(R()-.5); px+=Math.cos(a); py+=Math.sin(a); } }
  xSpeck(c,S,R,style?18:26,true); c.h=H; c.hk=.6; c.pbr='slab'; return c; }
// walls: rough rock with strata (corridors), large ashlar blocks or small rubble stones (rooms)
function xRockWall(S,seed){ const N=64, R=caveRng(seed), f=xFbm(N,R,2), st=xNoise(N,4,R), H=new Float32Array(N*N);
  // the height: rough lumps with the strata standing out as ledges
  const c=xPaint(N,(i,j)=>{ const sb=Math.sin((j+st(i,j)*14)*.55); H[j*N+i]=f(i,j)*6+Math.max(0,sb)*1.6; let t=f(i,j)*1.1-.05+sb*.08; if(j<2) t+=.3; return xTone(S,Math.max(0,Math.min(1,t))); });
  c.h=H; c.hk=.5; return c; }
function xBlockWall(S,seed,rubble){ const N=64, R=caveRng(seed), f=xFbm(N,R,4);
  const rows=rubble?[0,9,18,27,36,45,54]:[0,16,32,48], H=rubble?9:16, out=new Float32Array(N*N).fill(-1), Hm=new Float32Array(N*N).fill(-1.5);
  // the height: each stone stands proud of the mortar with rounded edges (rubble more domed) and a chiselled face
  rows.forEach((y0,r)=>{ let x0=-(R()*20|0); while(x0<N){ const w=rubble?(8+R()*10|0):(18+R()*22|0), tn=.3+R()*.4, sk=R()-.5;
      for(let j=y0;j<Math.min(N,y0+H);j++) for(let i=Math.max(0,x0);i<Math.min(N,x0+w);i++){ const e=j===y0||i===x0?.3:j===y0+H-1||i===x0+w-1?-1:0; out[j*N+i]=e<0?.04:tn+e;
        const d=Math.min(j-y0,y0+H-1-j,i-x0,x0+w-1-i); Hm[j*N+i]=e<0?-1.5:Math.min(d,rubble?4:3)*(rubble?.75:.8)+sk*(i-x0)*.04+tn; }
      x0+=w; } });
  const c=xPaint(N,(i,j)=>{ const b=out[j*N+i]; if(Hm[j*N+i]>-1.5) Hm[j*N+i]+=f(i,j)*1.4; let t=b<0?.05:b+(f(i,j)-.5)*.25; if(j<2) t+=.25; return xTone(S,Math.max(0,Math.min(1,t))); });
  c.h=Hm; c.hk=.6; return c; }
const XDBG=[   // [element id, object, key, saved as, decimals (null: a checkbox), what a change does]
  ['dbgTexel',()=>XLIT,'texel','hexmancers-xl-texel',null,'lit'], ['dbgSteps',()=>XLIT,'steps','hexmancers-xl-steps',0,'lit'],
  ['dbgNmap',()=>XLIT,'nmap','hexmancers-xl-nmap',null,'lit'], ['dbgNStrF',()=>XLIT,'nstrF','hexmancers-xl-nstrF',2,'lit'], ['dbgNStrW',()=>XLIT,'nstrW','hexmancers-xl-nstrW',2,'lit'],
  ['dbgAO',()=>XLIT,'ao','hexmancers-xl-ao',null,'lit'], ['dbgAOStr',()=>XLIT,'aoStr','hexmancers-xl-aoStr',2,'lit'], ['dbgAORad',()=>XLIT,'aoRad','hexmancers-xl-aoRad',2,'bake'],
  ['dbgSSAO',()=>XLIT,'ssao','hexmancers-xl-ssao',null,''], ['dbgSSAOStr',()=>XLIT,'ssaoStr','hexmancers-xl-ssaoStr',2,''], ['dbgSSAORad',()=>XLIT,'ssaoRad','hexmancers-xl-ssaoRad',2,''],
  ['setXBall',()=>XB,'ball','hexmancers-xball',2,''], ['setXStrip',()=>XB,'strip','hexmancers-xstrip',2,''],
  ['dbgFps',()=>XLIT,'fps','hexmancers-xl-fps',null,'fps'], ['dbgAutoQ',()=>XLIT,'autoQ','hexmancers-xl-autoQ',null,''], ['dbgCamPitch',()=>XLIT,'camPitch','hexmancers-xl-camPitch',0,'cam'], ['dbgCamFov',()=>XLIT,'camFov','hexmancers-xl-camFov',0,'cam'], ['dbgCamZoom',()=>XLIT,'camZoom','hexmancers-xl-camZoom',2,''], ...['camX','camY','camZ','camRX','camRY','camRZ'].map(k=>['dbgC'+k.slice(1),()=>XLIT,k,'hexmancers-xl-'+k,k.length>4?0:1,'']), ['dbgDof',()=>XLIT,'dof','hexmancers-xl-dof',null,''], ['dbgDofFocus',()=>XLIT,'dofFocus','hexmancers-xl-dofFocus',1,''], ['dbgDofRange',()=>XLIT,'dofRange','hexmancers-xl-dofRange',1,''], ['dbgDofBlur',()=>XLIT,'dofBlur','hexmancers-xl-dofBlur',1,''], ['dbgDofFade',()=>XLIT,'dofFade','hexmancers-xl-dofFade',1,''], ['dbgDofNear',()=>XLIT,'dofNear','hexmancers-xl-dofNear',2,''], ['dbgDofFar',()=>XLIT,'dofFar','hexmancers-xl-dofFar',2,''], ['dbgArWalls',()=>XLIT,'arWalls','hexmancers-xl-arWalls',null,''], ['dbgPbr',()=>XLIT,'pbr','hexmancers-xl-pbr',null,'pbr'], ['dbgPbrEnv',()=>XLIT,'pbrEnv','hexmancers-xl-pbrEnv',2,'pbrEnv'], ['dbgPbrRMap',()=>XLIT,'pbrRMap','hexmancers-xl-pbrRMap',null,'pbrEnv'],
  ...['gold','steel','gloss','ice','slab'].flatMap(k=>[['dbgPbrR_'+k,()=>XLIT,'pbrR_'+k,'hexmancers-xl-pbrR_'+k,2,'pbrEnv'],['dbgPbrM_'+k,()=>XLIT,'pbrM_'+k,'hexmancers-xl-pbrM_'+k,2,'pbrEnv']]),
  ...[['dbgAmb','amb'],['dbgSun','sun'],['dbgLamp','lamp'],['dbgLampRad','lampRad'],['dbgLampY','lampY'],['dbgTorch','torch'],['dbgTorchRad','torchRad'],['dbgFlick','flick'],['dbgMyGlow','myGlow']].map(([id,k])=>[id,()=>XLIT,k,'hexmancers-xl-'+k,2,'']),
  ['dbgFogNear',()=>XLIT,'fogNear','hexmancers-xl-fogNear',0,''], ['dbgFogFar',()=>XLIT,'fogFar','hexmancers-xl-fogFar',0,''],
  ...[['dPitch',0,''],['dDist',1,''],['dFov',0,''],['dAhead',2,''],['dAim',1,''],['dFog',null,''],['dFogStart',0,''],['dFogLen',0,''],['dMemLit',2,'xpaint'],['dMemDark',2,'xpaint'],['dLightMem',2,''],['dCut',null,'xwalls'],['dCutH',2,'xwalls'],['dDoorMin',2,'xwalls'],['dDoorGlow',2,'xwalls'],['dofShow',null,''],['vig',2,''],['vigR',2,''],['vigSoft',2,''],['mvSpeed',2,''],['mvSnap',2,''],['mvSnapR',2,''],['mvSnapSpd',2,''],['mvRest',2,''],['mvDrag',2,''],['mvAccel',2,''],['mvShow',null,''],['mvStick',null,''],['mvStickShow',null,''],['mvStickR',0,''],['mvDead',2,''],['mvStickMin',2,''],['mvStickFull',2,''],['mvCurve',2,''],['mvTapMs',0,''],['mvTapPx',0,''],['mvStickSpeed',1,''],['mvEven',2,''],['mvSnapTime',2,''],['mvSnapAhead',null,''],['mvStride',2,''],['mvFaceWalk',null,''],['mvMomentum',null,''],['mvMAccel',2,''],['mvMBrake',2,''],['mvGrip',2,'']].map(([k,dec,what])=>['dbg_'+k,()=>XLIT,k,'hexmancers-xl-'+k,dec,what]) ];
let xBakeT=0;
function xDbgApply(what){ if(what==='lit') xLitRefresh(); else if(what==='bake'){ xLitRefresh(); clearTimeout(xBakeT); xBakeT=setTimeout(lookBake,120); }
  else if(what==='pbr') lookRebuild();
  else if(what==='pbrEnv') xPBRTune();
  else if(what==='cam'){ if(typeof resizeView==='function'&&typeof B!=='undefined'&&B) resizeView(); }
  else if(what==='xpaint'||what==='xwalls'){ if(typeof xDbgDungeon==='function') xDbgDungeon(what); }
  else if(what==='fps'){ const f=document.getElementById('xFps'); if(f) f.style.display=XLIT.fps?'':'none'; } }
function xBindSliders(){ xFineSliders(document.getElementById('debug')); for(const [id,obj,k,key,dec,what] of XDBG){ const el=document.getElementById(id), out=document.getElementById(id+'V'), O=obj(); if(!el) continue;
    const show=()=>{ if(dec==null) el.checked=!!O[k]; else { el.value=O[k]; if(out) out.textContent=(+O[k]).toFixed(dec); } };
    show(); el.oninput=el.onchange=()=>{ O[k]=dec==null?el.checked:+el.value; show(); try{ localStorage.setItem(key,dec==null?(O[k]?'1':'0'):String(O[k])); }catch(e){} xDbgApply(what); }; }
  const box=document.getElementById('debug'); if(!box||xBindSliders.done) return; xBindSliders.done=1;
  xDbgPanes(); xRowTools(box,'.srow',row=>{ const s=row.querySelector('small'); return s?s.textContent:''; });
  document.getElementById('dbgClose').onclick=xDbgClose; xDbgGrip();
  { const pz=document.getElementById('dbgPause'); if(pz){ pz.checked=DBG.pause; pz.onchange=()=>{ DBG.pause=pz.checked; document.body.classList.toggle('dbgPaused',DBG.pause); }; } }
  // while a slider is dragged the menu fades away but for that slider's row, so the whole field of play shows
  { let row=null, t=0; const end=()=>{ clearTimeout(t); t=setTimeout(()=>{ box.classList.remove('tuning'); if(row) row.classList.remove('dbgActive'); row=null; },250); };
    box.addEventListener('pointerdown',e=>{ const r=e.target.closest&&e.target.closest('input[type=range]'); if(!r) return; clearTimeout(t); if(row) row.classList.remove('dbgActive');
      row=r.closest('.srow'); if(row) row.classList.add('dbgActive'); box.classList.add('tuning'); },true);
    addEventListener('pointerup',()=>{ if(row) end(); },true); addEventListener('pointercancel',()=>{ if(row) end(); },true); }
  box.addEventListener('pointerdown',e=>{ if(e.target===box) xDbgClose(); });
  document.getElementById('dbgCopy').onclick=xDbgCopy;
  document.getElementById('dbgReset').onclick=()=>{ for(const [id,obj,k,key,dec,what] of XDBG){ const O=obj(); O[k]=(O===XB?XB_DEF:XLIT_DEF)[k]; try{ localStorage.removeItem(key); }catch(e){} }
    xBindSliders(); xLitRefresh(); lookBake(); xDbgApply('fps'); xDbgApply('xwalls'); };
  // three fingers down together, three times within a second and a half
  let taps=[], counted=false;
  document.addEventListener('touchstart',e=>{ if(e.touches.length<3||counted) return; counted=true; const t=performance.now(); taps=taps.filter(x=>t-x<1500); taps.push(t);
    if(taps.length>=3){ taps=[]; xDbgToggle(); } },{capture:true,passive:true});
  document.addEventListener('touchend',e=>{ if(e.touches.length===0) counted=false; },{capture:true,passive:true});
  document.addEventListener('touchcancel',e=>{ if(e.touches.length===0) counted=false; },{capture:true,passive:true});
  window.addEventListener('keydown',e=>{ if(e.key!=='`'||e.repeat) return; const t=e.target; if(t&&(t.tagName==='INPUT'&&t.type!=='range'&&t.type!=='checkbox'||t.tagName==='TEXTAREA')) return; if(document.getElementById('settings').classList.contains('on')) return; e.preventDefault(); xDbgToggle(); });
  xDbgApply('fps'); }
/* Fine sliders (the debug menu and the Movement lab), like a phone's scrubbing: drag along a slider and
   it moves at full speed; slide your finger up or down away from it and it moves at half, a quarter, then a
   tenth of the speed, for a fine setting. A tap still jumps to where you tap. The value is kept to the
   slider's last decimal place (a slider in steps of 0.05 can stop on 0.01s). */
const xStepQ=s=>{ const t=String(s); return Math.pow(10,-(t.includes('.')?t.split('.')[1].length:0)); };   // a slider's finest stop: its step's last decimal place
function xFineSliders(root){ if(!root||root.dataset.fine) return; root.dataset.fine='1';
  const prep=el=>{ if(el.dataset.q) return; el.dataset.q=String(xStepQ(el.getAttribute('step')||'1')); el.step='any'; };
  root.querySelectorAll('input[type=range]').forEach(prep);
  const XY=e=>typeof appXY==='function'?appXY(e.clientX,e.clientY):[e.clientX,e.clientY];
  let S=null, badge=null;
  const set=(el,v)=>{ const mn=+el.min, mx=+el.max, q=+el.dataset.q; v=Math.min(mx,Math.max(mn,Math.round((v-mn)/q)*q+mn)); v=+v.toFixed(6);
    if(+el.value!==v){ el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); } };
  const box=el=>{ const r=typeof appBox==='function'?appBox(el):el.getBoundingClientRect(); return r; };
  root.addEventListener('pointerdown',e=>{ const el=e.target; if(!(el instanceof HTMLInputElement)||el.type!=='range'||e.button>0) return;
    prep(el); e.preventDefault(); try{ el.setPointerCapture(e.pointerId); }catch(_){}
    const [x,y]=XY(e); S={el,id:e.pointerId,x0:x,y0:y,lx:x,acc:+el.value,moved:false}; });
  root.addEventListener('touchstart',e=>{ if(e.target instanceof HTMLInputElement&&e.target.type==='range') e.preventDefault(); },{passive:false});
  root.addEventListener('pointermove',e=>{ if(!S||e.pointerId!==S.id) return; const [x,y]=XY(e), el=S.el;
    if(!S.moved&&Math.hypot(x-S.x0,y-S.y0)<4) return; S.moved=true;
    const off=Math.abs(y-S.y0), rate=off<45?1:off<95?.5:off<150?.25:.1, r=box(el);
    S.acc=Math.min(+el.max,Math.max(+el.min,S.acc+(x-S.lx)/Math.max(40,r.width)*(el.max-el.min)*rate)); S.lx=x; set(el,S.acc);
    if(!badge){ badge=document.createElement('div'); badge.className='finebadge'; document.body.appendChild(badge); }
    badge.textContent=(rate===1?'Full speed':rate===.5?'Half speed':rate===.25?'Quarter speed':'Fine ×0.1')+' · '+(+el.value).toFixed(Math.max(0,-Math.round(Math.log10(+el.dataset.q))));
    badge.style.left=e.clientX+'px'; badge.style.top=(e.clientY-44)+'px'; badge.hidden=false; });
  const end=e=>{ if(!S||e.pointerId!==S.id) return; const el=S.el;
    if(!S.moved&&e.type==='pointerup'){ const r=box(el), [x]=XY(e); set(el,+el.min+(x-r.left)/r.width*(el.max-el.min)); }
    el.dispatchEvent(new Event('change',{bubbles:true})); S=null; if(badge) badge.hidden=true; };
  root.addEventListener('pointerup',end); root.addEventListener('pointercancel',end); }
/* Setting names in the debug menu and the Movement lab: press and hold one for what it does; double-tap one to
   swap the setting back to the value it had before you last moved it, and again to swap forward (an A/B test;
   the other value shows beside the name, ⇄). A switch just flips. The other values last until the page reloads. */
const XAB={};   // a slider's other value, by its id (debug menu) or data-k (lab)
const xABKey=el=>el&&(el.dataset.k||el.id);
function xABMark(el){ const k=xABKey(el), row=el&&el.closest('.srow,.mlrow'), lab=row&&row.firstElementChild; if(!lab) return;
  let i=lab.querySelector('.abv'); if(XAB[k]==null){ if(i) i.remove(); return; }
  if(!i){ i=document.createElement('i'); i.className='abv'; const sm=lab.querySelector('small'); sm?lab.insertBefore(i,sm):lab.appendChild(i); }
  const q=+el.dataset.q||xStepQ(el.getAttribute('step')||'1'); i.textContent=' ⇄ '+(+XAB[k]).toFixed(Math.max(0,-Math.round(Math.log10(q)))); }
function xABFlash(row){ row.classList.remove('abflash'); void row.offsetWidth; row.classList.add('abflash'); }
function xABSwap(row){ const r=row.querySelector('input[type=range]'), c=row.querySelector('input[type=checkbox]'), chip=row.querySelector('[data-tog]');
  if(r){ const k=xABKey(r); if(XAB[k]==null){ if(typeof tip==='function') tip('Move it first: then a double-tap swaps between the two values'); return; }
    const cur=+r.value; r.dataset.abbing='1'; r.value=XAB[k]; r.dispatchEvent(new Event('input',{bubbles:true})); r.dispatchEvent(new Event('change',{bubbles:true})); delete r.dataset.abbing;
    XAB[k]=cur; if(r.isConnected){ xABMark(r); xABFlash(row); } }
  else if(c){ c.checked=!c.checked; c.dispatchEvent(new Event('change',{bubbles:true})); xABFlash(row); }
  else if(chip) chip.click(); }
function xRowTools(root,rowSel,tipOf){ if(!root||root.dataset.rowtools) return; root.dataset.rowtools='1';
  // a slider's value when you take hold of it becomes its other value once you let go somewhere new
  root.addEventListener('pointerdown',e=>{ const el=e.target; if(el instanceof HTMLInputElement&&el.type==='range') el.dataset.v0=el.value; },true);
  root.addEventListener('change',e=>{ const el=e.target; if(!(el instanceof HTMLInputElement)||el.type!=='range') return;
    if(el.dataset.v0!=null&&!el.dataset.abbing&&Math.abs(+el.dataset.v0-+el.value)>1e-9){ XAB[xABKey(el)]=+el.dataset.v0; xABMark(el); } delete el.dataset.v0; },true);
  let hold=null, last={row:null,t:0}, tipEl=null;
  const hideTip=()=>{ if(tipEl){ tipEl.remove(); tipEl=null; } };
  root.addEventListener('pointerdown',e=>{ hideTip(); const lab=e.target.closest&&e.target.closest(rowSel+' > span:first-child'); if(!lab||!root.contains(lab)) return; const row=lab.parentElement;
    hold={row,x:e.clientX,y:e.clientY,tipped:false,t:setTimeout(()=>{ const txt=tipOf(row); if(!txt||!hold) return; hold.tipped=true;
      tipEl=document.createElement('div'); tipEl.className='rowtip'; tipEl.textContent=txt; document.body.appendChild(tipEl);
      const r=lab.getBoundingClientRect(), h=tipEl.offsetHeight, w=tipEl.offsetWidth;
      tipEl.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left))+'px'; tipEl.style.top=(r.bottom+8+h>innerHeight?r.top-h-8:r.bottom+8)+'px'; if(navigator.vibrate) navigator.vibrate(8); },450)}; });
  root.addEventListener('pointermove',e=>{ if(hold&&Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>10){ clearTimeout(hold.t); hold=null; } });
  root.addEventListener('pointerup',()=>{ if(!hold) return; clearTimeout(hold.t); const h=hold; hold=null; if(h.tipped) return;
    const now=performance.now(); if(last.row===h.row&&now-last.t<350){ last={row:null,t:0}; xABSwap(h.row); } else last={row:h.row,t:now}; });
  root.addEventListener('pointercancel',()=>{ if(hold){ clearTimeout(hold.t); hold=null; } });
  root.addEventListener('contextmenu',e=>{ if(e.target.closest&&e.target.closest(rowSel)) e.preventDefault(); });
  addEventListener('pointerdown',e=>{ if(tipEl&&!root.contains(e.target)) hideTip(); },true); }
/* Copy settings: every setting in the menu that differs from its default goes to the clipboard, as a
   list and as JSON, ready to paste into a message so they can become the new defaults. The text also shows
   under the buttons, selected, in case the browser won't let the page copy. */
function xDbgCopy(taId,btnId){ taId=typeof taId==='string'?taId:'dbgCopyText'; btnId=btnId||'dbgCopy'; const ch={}, lines=[];
  for(const [id,obj,k,key,dec] of XDBG){ const O=obj(), D=(O===XB?XB_DEF:XLIT_DEF)[k], v=O[k]; if(v===D||(dec!=null&&Math.abs(+v-+D)<1e-9)) continue;
    const val=dec==null?!!v:+(+v).toFixed(Math.max(dec,2)); ch[k]=val; lines.push(k+': '+val+'  (default '+D+')'); }
  if(typeof MLAB!=='undefined') for(const k in MLAB) if(MLAB[k]!==MLAB_DEF[k]){ ch['lab.'+k]=MLAB[k]; lines.push('Movement lab '+k+': '+MLAB[k]+'  (default '+MLAB_DEF[k]+')'); }
  const txt=lines.length?'Hexmancers debug settings changed from the defaults:\n'+lines.join('\n')+'\n\n'+JSON.stringify(ch):'Hexmancers debug settings: all at their defaults.';
  const ta=document.getElementById(taId); ta.hidden=false; ta.value=txt; ta.focus(); ta.select();
  const done=ok=>{ const b=document.getElementById(btnId); b.textContent=ok?'Copied ✓':'Select & copy ↓'; setTimeout(()=>{ b.textContent='Copy settings'; },1800); };
  let ok=false; try{ ok=document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(()=>done(true),()=>done(ok)); else done(ok); }
/* The debug menu's panes: its sections are sorted under a row of tabs at the top, so only one group of
   settings shows at a time. The pane last opened is remembered in this browser. */
const XDBG_PANES=[['Dungeon',['Dungeon camera','Dungeon view','Walls']],['Battle',['Battle camera','Battle movement']],['Post',['Post effects']],['Lights',['Lighting','Lights']],['Surfaces',['PBR','Normal maps','Ambient occlusion']],['General',['Info']]];
function xDbgPanes(){ const body=document.getElementById('dbgBody'); if(!body||body.querySelector('.dbgTabs')) return;
  const panes={}, tabs=document.createElement('div'); tabs.className='dbgTabs';
  for(const [name] of XDBG_PANES){ const d=document.createElement('div'); d.className='dbgPane'; d.dataset.pane=name; panes[name]=d; }
  const kids=[...body.children], first=kids.findIndex(e=>e.tagName==='H3'), end=kids.findIndex(e=>e.classList.contains('controls'));
  let cur='General';
  kids.forEach((e,i)=>{ if(e.classList.contains('bar')||e.classList.contains('controls')||i>end&&end>=0) return;
    if(e.tagName==='H3'){ const t=e.textContent.trim(), P=XDBG_PANES.find(([,h])=>h.includes(t)); cur=P?P[0]:'General'; }
    else if(i<first&&!e.classList.contains('hint')) cur='General';
    (e.classList.contains('hint')?panes.General:panes[cur]).appendChild(e); });
  // the General pane opens with the pause and lab switches and the note on how the menu works
  const G=panes.General, hint=G.querySelector('.hint'); if(hint) G.prepend(hint);
  const show=n=>{ for(const k in panes) panes[k].hidden=k!==n; for(const b of tabs.children) b.classList.toggle('on',b.dataset.pane===n); body.scrollTop=0; try{ localStorage.setItem('hexmancers-dbgpane',n); }catch(e){} };
  for(const [name] of XDBG_PANES){ const b=document.createElement('button'); b.type='button'; b.textContent=name; b.dataset.pane=name; b.onclick=()=>show(name); tabs.appendChild(b); }
  const bar=body.querySelector('.bar'), ctl=body.querySelector('.controls'); bar.after(tabs); let at=tabs; for(const [name] of XDBG_PANES){ at.after(panes[name]); at=panes[name]; }
  let saved=null; try{ saved=localStorage.getItem('hexmancers-dbgpane'); }catch(e){} show(panes[saved]?saved:'Dungeon'); }
/* The debug menu is a drawer at the top of the screen: drag its grip down for more menu, up for more
   dungeon. A tap on the grip folds it to its title bar or unfolds it. The height is remembered here. */
function xDbgGrip(){ const grip=document.getElementById('dbgGrip'), pan=grip&&grip.parentElement, box=document.getElementById('debug'), KEY='hexmancers-dbgh'; if(!grip) return;
  const MIN=120, def=()=>Math.round(box.clientHeight*.42), maxH=()=>Math.max(MIN,box.clientHeight-24);
  const set=h=>{ h=Math.round(Math.max(MIN,Math.min(maxH(),h))); pan.style.height=h+'px'; return h; };
  let saved=null; try{ const v=localStorage.getItem(KEY); if(v!==null&&+v>0) saved=+v; }catch(e){}
  const keep=h=>{ saved=h; try{ localStorage.setItem(KEY,String(h)); }catch(e){} };
  const fit=()=>{ if(box.classList.contains('on')&&saved!=null) set(saved); };
  new MutationObserver(()=>requestAnimationFrame(fit)).observe(box,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',fit);
  const P=e=>typeof appXY==='function'?appXY(e.clientX,e.clientY):[e.clientX,e.clientY];
  let drag=null;
  grip.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ grip.setPointerCapture(e.pointerId); }catch(_){}
    drag={id:e.pointerId,p0:P(e)[1],s0:pan.offsetHeight,moved:false}; grip.classList.add('on'); box.classList.add('gripping'); });
  grip.addEventListener('pointermove',e=>{ if(!drag||e.pointerId!==drag.id) return; const d=P(e)[1]-drag.p0; if(Math.abs(d)>4) drag.moved=true; if(drag.moved) set(drag.s0+d); });
  const end=e=>{ if(!drag||e.pointerId!==drag.id) return; const d=drag; drag=null; grip.classList.remove('on'); box.classList.remove('gripping');
    if(d.moved) keep(pan.offsetHeight);
    else if(e.type==='pointerup'){ pan.style.transition='height .2s'; keep(set(d.s0>MIN+20?MIN:(saved>MIN+20?saved:def()))); setTimeout(()=>pan.style.transition='',250); } };
  grip.addEventListener('pointerup',end); grip.addEventListener('pointercancel',end); }
function xDbgToggle(){ const b=document.getElementById('debug'); if(b.classList.contains('on')) xDbgClose(); else { xBindSliders(); b.classList.add('on'); } }   // opening shows each setting as it is now (the Movement lab may have changed some)
function xDbgClose(){ document.getElementById('debug').classList.remove('on'); }
if(typeof document!=='undefined'){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',xBindSliders); else xBindSliders(); }
// the frame-rate readout (debug menu): frames a second and the slowest frame of the last second
let xFpsN=0, xFpsT=0, xFpsMax=0;
function lookFps(dt,renderer){ if(!XLIT.fps) return; xFpsN++; xFpsT+=dt; xFpsMax=Math.max(xFpsMax,dt);
  if(xFpsT>=1){ const f=document.getElementById('xFps'); if(f){ const ri=renderer.info.render; f.textContent=Math.round(xFpsN/xFpsT)+' fps · worst '+Math.round(xFpsMax*1000)+' ms · '+ri.calls+' calls · q'+LQ.step; } xFpsN=0; xFpsT=0; xFpsMax=0; } }
/* Coming back to the game: a phone can drop the GPU's copy of everything while the browser is in
   the background (the WebGL context is lost) and hand back an empty one. three.js restores the
   context, but some phones come back with every texture blank: floors black, lights gone, sprites
   invisible. So on a restored context, and whenever the page is shown again, every texture, material
   and buffer the screen uses is sent to the GPU again. */
function lookRevive(renderer,scene){ if(!renderer||!scene) return; const seen=new Set();
  const tex=t=>{ if(t&&t.isTexture&&!seen.has(t)){ seen.add(t); t.needsUpdate=true; } };
  scene.traverse(o=>{ const M=o.material; if(M) for(const m of Array.isArray(M)?M:[M]){ for(const k of ['map','emissiveMap','normalMap','alphaMap','aoMap','lightMap','bumpMap','specularMap']) tex(m[k]); if(m.uniforms) for(const u in m.uniforms) tex(m.uniforms[u]&&m.uniforms[u].value); m.needsUpdate=true; }
    const g=o.geometry; if(g&&g.attributes) for(const a in g.attributes) g.attributes[a].needsUpdate=true; if(g&&g.index) g.index.needsUpdate=true;
    if(o.isInstancedMesh){ o.instanceMatrix.needsUpdate=true; if(o.instanceColor) o.instanceColor.needsUpdate=true; } });
  for(const u in XLITU) tex(XLITU[u].value); if(scene.background) tex(scene.background);
  if(XSSAO.ok){ XSSAO.ok=null; }   // its render targets belonged to the old context: made again on next use
}
// a renderer's canvas: revive its scene when the context comes back
function lookWatch(renderer,getScene){ const cv=renderer.domElement;
  cv.addEventListener('webglcontextlost',e=>{ e.preventDefault(); },false);
  cv.addEventListener('webglcontextrestored',()=>setTimeout(()=>lookRevive(renderer,getScene()),0),false);
  (lookWatch.all||(lookWatch.all=[])).push([renderer,getScene]); }
if(typeof document!=='undefined') document.addEventListener('visibilitychange',()=>{ if(document.hidden) return;
  setTimeout(()=>{ for(const [r,g] of lookWatch.all||[]) try{ lookRevive(r,g()); }catch(e){ console.warn('revive',e); } },250); });
// PBR switched: both screens are built again with the other materials
function lookRebuild(){ if(typeof EX!=='undefined'&&EX&&typeof xBuildScene==='function'&&typeof X3!=='undefined'&&X3){ xBuildScene(); for(const tr of EX.traps||[]) if(tr.known&&tr.armed&&typeof xTrapMesh==='function') xTrapMesh(tr);
    xUpdateVis(); xFadeCells(10); }   // what you can see, at once (a new scene starts all in the dark)
  if(typeof AR!=='undefined'&&AR) AR.key=null; }
