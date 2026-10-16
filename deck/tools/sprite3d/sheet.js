/* Renders one roster entry into a sprite sheet: one row per (view, move), one column per frame. */
(function(){
LAB.buildEntry=e=>{ LAB.curYaw=(e.views.find(v=>v.name!=='back')||e.views[0]).yaw; if(e.kind==='humanoid'){ const R=LAB.humanoid(e.spec); return {R, root:R.root, headPx:R.headPx, moves:LAB.HMOVES, pose:(m,t)=>LAB.poseHumanoid(R,LAB.HMOVES[m].pose(t,R))}; } return e.build(); };
LAB.renderSheet=function(id,only){ const e=LAB.ROSTER.find(x=>x.id===id); const B=LAB.buildEntry(e), cell=Math.round(e.cell*LAB.SCALE/8)*8, base=e.base==null?null:Math.round(e.base*LAB.SCALE);
  const rows=[]; for(const v of e.views) for(const m of e.moves) if(!only||only.includes(m)) rows.push({view:v.name,yaw:v.yaw,move:m,frames:B.moves[m].frames,fps:B.moves[m].fps});
  const W=Math.max(...rows.map(r=>r.frames))*cell, c=document.createElement('canvas'); c.width=W; c.height=rows.length*cell; const x=c.getContext('2d');
  rows.forEach((r,ri)=>{ for(let f=0;f<r.frames;f++){ B.root.rotation.y=r.yaw; B.pose(r.move,f/r.frames); x.drawImage(LAB.render(B.root,cell,base),f*cell,ri*cell); } });
  return {url:c.toDataURL('image/png'), meta:{id, name:e.name, group:e.group, cell, ref:e.ref, note:e.note||'', rows:rows.map(({view,move,frames,fps})=>({view,move,frames,fps})), head:B.headPx?[cell/2+B.headPx[0],cell-(base==null?Math.round(cell*.06):base)-B.headPx[1],B.headPx[2]]:null}}; };
// frames for the game: [{key, view, move, t, bare}] -> {key:{url, tip:[x,y]|null}}; tip is where the weapon's
// focus sits in the frame (pixels), found by projecting the weapon's gem point through the sprite camera
LAB.exportGame=function(id,list){ const e=LAB.ROSTER.find(x=>x.id===id); const B=LAB.buildEntry(e), cell=Math.round(e.cell*LAB.SCALE/8)*8, base=e.base==null?null:Math.round(e.base*LAB.SCALE);
  const out={}, cam=LAB.camFor(cell,base==null?Math.round(cell*.06):base);
  for(const f of list){ const v=e.views.find(x=>x.name===f.view)||e.views[0]; B.root.rotation.y=v.yaw;
    if(B.R&&B.R.hat) B.R.hat.visible=!f.bare;
    B.pose(f.move,f.t||0); let tip=null;
    if(B.R&&B.R.weapon){ B.root.updateMatrixWorld(true); const g=B.R.weapon, y=g.userData.gemAt!=null?g.userData.gemAt:g.userData.top; if(y!=null){ const p=g.localToWorld(new THREE.Vector3(0,y,0)).project(cam); tip=[(p.x+1)/2*cell,(1-p.y)/2*cell]; } }
    out[f.key]={url:LAB.render(B.root,cell,base).toDataURL('image/png'), tip, cell}; }
  if(B.R&&B.R.hat) B.R.hat.visible=true; return out; };
LAB.ids=()=>LAB.ROSTER.map(e=>e.id);
})();
