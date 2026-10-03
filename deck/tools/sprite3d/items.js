/* The game's weapons as item icons: the same models the characters hold, laid on the diagonal
   and fitted to a 64 px cell, plus a slow turn so their depth shows. */
(function(){
const {grp}=LAB, PI=Math.PI;
for(const id in LAB.GAME_WEAPONS){ const spec=LAB.GAME_WEAPONS[id];
  LAB.ROSTER.push({id:'w_'+id, group:'Weapons', name:spec.name+(spec.legendary?' (legendary)':''), ref:'gear:'+id, cell:64, base:32, views:[{name:'icon',yaw:0}], moves:['icon','spin'],
    build:()=>{ const root=grp(null), turn=grp(root), tilt=grp(turn), w=LAB.weapon(spec); tilt.add(w);
      // icons exaggerate what tells weapons apart: thicker shafts, bigger heads
      if(['staff','spear','wand'].includes(spec.kind)){ const L=spec.kind==='wand'?1.25:1.7; w.scale.set(L,1,L); w.traverse(o=>{ if(o.userData.gem) o.scale.setScalar(1.5); });
        if(spec.kind==='spear') w.children.forEach(o=>{ if(o.position.y>(spec.len||1.8)-.75) o.scale.multiplyScalar(1.4); }); }
      const box=new THREE.Box3().setFromObject(w), size=new THREE.Vector3(), c=new THREE.Vector3(); box.getSize(size); box.getCenter(c);
      w.position.sub(c); const k=Math.min(2.25/Math.max(size.y,.01),1.5/Math.max(size.x,.01),3.2); tilt.scale.setScalar(k); tilt.rotation.z=spec.kind==='bow'||spec.kind==='crossbow'?-PI/4+.0:-PI/4;
      return {root, moves:{icon:{frames:1,fps:1}, spin:{frames:12,fps:8}}, pose:(m,t)=>{ turn.rotation.set(-.35,m==='spin'?t*PI*2:.45,0); root.rotation.y=0; }}; }}); }
})();
