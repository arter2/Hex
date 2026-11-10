/* Hexmancers - room shapes for the spacious floor (layout 2), from docs/dungeon-shapes-and-puzzles.md.
   A shape is a template: a name, what it is used for, and one string per row. The generator (dungeongen.js x2Rooms)
   picks one that fits, turns or mirrors it at random, and stamps it onto the floor. Only newly dug floors get them.
     .  rock         solid wall                         #  floor
     P  pillar       solid, full height                 L  low wall: solid underfoot, seen over
     W  water        blocks the way; a bridge crosses   C  chasm: blocks the way; a bridge crosses
     B  bridge       walkable, over water or a chasm    D  doorway: corridors join the room only here
   Rows and columns of plain rock round the edge are trimmed off, so every doorway on the trimmed edge opens
   straight out. A doorway that is not on the edge (the sanctum's, the keyhole's side one) is plain floor.
   Every template is checked when this file loads: all its walkable cells in one piece, and at least one doorway on
   its edge. A template that fails is left out (and says so in the console). */
(function(root){
const ROOM_SHAPES=[
  {id:'octagon', name:'Octagon', use:'room', rows:[
    '...##D##...','..#######..','.#########.','###########','###########','D#########D','###########','###########','.#########.','..#######..','...##D##...']},
  {id:'round', name:'Round', use:'room', rows:[
    '....#D#....','..#######..','.#########.','.#########.','###########','D#########D','###########','.#########.','.#########.','..#######..','....#D#....']},
  {id:'pillared', name:'Pillared hall', use:'room', rows:[
    '#####D#####','###########','##P##P##P##','D##########','###########','##P#####P##','###########','##########D','##P##P##P##','###########','#####D#####']},
  {id:'cave', name:'Cave pocket', use:'room', natural:true, rows:[
    '...####....','..######...','.########..','.#########.','D##########','##########.','.#########.','..########D','..########.','...######..','....#D#....']},
  {id:'sanctum', name:'Ring and sanctum', use:'room', heart:true, rows:[
    '#####D#####','###########','###########','###.....###','###.###.###','D##.###.##D','###.###.###','###..D..###','###########','###########','###########']},
  {id:'keyhole', name:'Keyhole', use:'room', rows:[
    '....#D#....','...#####...','..#######..','.#########.','.#########.','.#########.','..#######..','..#######..','..D######..','..#######..','..###D###..']},
  {id:'cathedral', name:'Cathedral', use:'hall', rows:[
    '......#D#......','.....#####.....','....#######....','....#######....','....#######....','###############','D#############D','###############',
    '..###########..','..##P#####P##..','..###########..','..##P#####P##..','..###########..','..##P#####P##..','..#####D#####..']},
  {id:'quatrefoil', name:'Quatrefoil', use:'hall', rows:[
    '......#D#......','.....#####.....','....#######....','....#######....','..###########..','.#############.','###############','D#############D',
    '###############','.#############.','..###########..','....#######....','....#######....','.....#####.....','......#D#......']},
  {id:'honeycomb', name:'Honeycomb', use:'hall', rows:[
    '...............','..####...####..','..#####.#####..','.######.######.','D#############D','.######.######.','..#####.#####..','..###########..',
    '.....#####.....','....#######....','....#######....','....#######....','.....#####.....','......#D#......','...............']},
  {id:'cloister', name:'Cloister', use:'hall', rows:[
    '...............','.######D######.','.#############.','.##P#P#P#P#P##.','.#############.','.##P#WWWWW#P##.','.####WWWWW####.','.D#P#WWWWW#P#D.',
    '.####WWWWW####.','.##P#WWWWW#P##.','.#############.','.##P#P#P#P#P##.','.#############.','.######D######.','...............']},
  {id:'spiral', name:'Spiral', use:'hall', heart:true, rows:[
    '...............','.#############.','.D############.','.##.........##.','.##########.##.','.##########.##.','.##.##...##.##.','.##.####.##.##.',
    '.##.##...##.##.','.##.#######.##.','.##.#######.##.','.##.........##.','.############D.','.#############.','...............']},
  {id:'chasm', name:'Chasm hall', use:'hall', rows:[
    '...............','...............','######CCC###D##','######CCC######','#####BBBBBB####','#######CCC#####','##L###CCC###L##','D#L###CCC###L#D',
    '##L###CCC###L##','######CCCC#####','#####BBBBBB####','######CCC######','######CCC######','...............','...............']},
];
const WALK='#BD';
// trim rows and columns of plain rock off every side
function rsTrim(rows){ let r=rows.slice(); const blank=s=>/^\.*$/.test(s);
  while(r.length&&blank(r[0])) r.shift(); while(r.length&&blank(r[r.length-1])) r.pop();
  const col=x=>r.every(s=>s[x]==='.');
  let a=0, b=r[0].length-1; while(a<b&&col(a)) a++; while(b>a&&col(b)) b--;
  return r.map(s=>s.slice(a,b+1)); }
// a quarter turn clockwise, and a mirror left to right
const rsTurn=rows=>{ const h=rows.length, w=rows[0].length, out=[]; for(let x=0;x<w;x++){ let s=''; for(let y=h-1;y>=0;y--) s+=rows[y][x]; out.push(s); } return out; };
const rsFlip=rows=>rows.map(s=>s.split('').reverse().join(''));
// the doorways on the trimmed edge, each with the way out: [x, y, dx, dy]
function rsDoors(rows){ const h=rows.length, w=rows[0].length, out=[];
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ if(rows[y][x]!=='D') continue;
    if(x===0) out.push([x,y,-1,0]); else if(x===w-1) out.push([x,y,1,0]); else if(y===0) out.push([x,y,0,-1]); else if(y===h-1) out.push([x,y,0,1]); }
  return out; }
// all walkable cells in one piece, and at least one doorway on the edge
function rsCheck(rows){ const h=rows.length, w=rows[0].length; if(!h||!w||rows.some(s=>s.length!==w)) return 'rows of different lengths';
  if(!/^[.#PLWCBD]+$/.test(rows.join(''))) return 'unknown tile';
  const walk=[]; for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(WALK.includes(rows[y][x])) walk.push(y*w+x);
  if(!walk.length) return 'no floor';
  const seen=new Set([walk[0]]), q=[walk[0]];
  for(let k=0;k<q.length;k++){ const c=q[k], x=c%w, y=(c/w)|0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy, n=ny*w+nx;
    if(nx<0||ny<0||nx>=w||ny>=h||seen.has(n)||!WALK.includes(rows[ny][nx])) continue; seen.add(n); q.push(n); } }
  if(seen.size!==walk.length) return 'floor not in one piece';
  if(!rsDoors(rows).length) return 'no doorway on the edge';
  return ''; }
const RS_OK=ROOM_SHAPES.filter(s=>{ s.rows=rsTrim(s.rows); const why=rsCheck(s.rows); if(why&&typeof console!=='undefined') console.warn('Room shape '+s.id+' left out: '+why); return !why; });
// one shape for a room: 'hall' (landmark) or 'room', never a cave pocket outside a natural area, never one of `skip`;
// turned and mirrored at random. Returns {k:'T', id, g:rows} for x2In, or null.
function rsPick(R,use,natural,skip){ const list=RS_OK.filter(s=>s.use===use&&(!s.natural||natural)&&!(skip&&skip.has(s.id)));
  if(!list.length) return null; const S=list[Math.floor(R()*list.length)]; let g=S.rows.slice();
  for(let k=Math.floor(R()*4);k>0;k--) g=rsTurn(g); if(R()<.5) g=rsFlip(g);
  return {k:'T', id:S.id, heart:!!S.heart, g}; }
const api={ROOM_SHAPES,rsTrim,rsTurn,rsFlip,rsDoors,rsCheck,rsPick,RS_OK};
Object.assign(root,api); if(typeof module!=='undefined') module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
