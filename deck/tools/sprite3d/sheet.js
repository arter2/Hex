/* Renders one roster entry into a sprite sheet: one row per (view, move), one column per frame. */
(function(){
LAB.buildEntry=e=>{ if(e.kind==='humanoid'){ const R=LAB.humanoid(e.spec); return {root:R.root, moves:LAB.HMOVES, pose:(m,t)=>LAB.poseHumanoid(R,LAB.HMOVES[m].pose(t,R))}; } return e.build(); };
LAB.renderSheet=function(id,only){ const e=LAB.ROSTER.find(x=>x.id===id); const B=LAB.buildEntry(e), cell=e.cell;
  const rows=[]; for(const v of e.views) for(const m of e.moves) if(!only||only.includes(m)) rows.push({view:v.name,yaw:v.yaw,move:m,frames:B.moves[m].frames,fps:B.moves[m].fps});
  const W=Math.max(...rows.map(r=>r.frames))*cell, c=document.createElement('canvas'); c.width=W; c.height=rows.length*cell; const x=c.getContext('2d');
  rows.forEach((r,ri)=>{ for(let f=0;f<r.frames;f++){ B.root.rotation.y=r.yaw; B.pose(r.move,f/r.frames); x.drawImage(LAB.render(B.root,cell,e.base),f*cell,ri*cell); } });
  return {url:c.toDataURL('image/png'), meta:{id, name:e.name, group:e.group, cell, ref:e.ref, note:e.note||'', rows:rows.map(({view,move,frames,fps})=>({view,move,frames,fps}))}}; };
LAB.ids=()=>LAB.ROSTER.map(e=>e.id);
})();
