/* From the menu handoff (docs/ui-menu/source/icons.js), unchanged: the menu's colour pixel icons. */
/* Editable color pixel constructions. 24x24 logical grid, no background. */
(function(root){
const paths={
 play:'<path d="M7 4 20 12 7 20Z" fill="#7dd8e6" stroke="#d4fbff" stroke-width=".7"/>',
 back:'<path d="M17 4 4 12 17 20Z" fill="#7dd8e6" stroke="#d4fbff" stroke-width=".7"/>',
 next:'<path d="M7 4 20 12 7 20Z" fill="#a8b6b8"/>',
 down:'<path d="M4 8 12 17 20 8Z" fill="#a8b6b8"/>',
 plus:'<path d="M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7Z" fill="#a8b6b8"/>',
 coin:'<path d="M6 2h12l4 4v12l-4 4H6l-4-4V6Z" fill="#d39b24" stroke="#ffe8a2"/><path d="M8 4h8l4 4v8l-4 4H8l-4-4V8Z" fill="#f5cb60"/><path d="M10 5h2v14h-2m4-14h1v14h-1" fill="#b47b1c"/>',
 crystal:'<path d="M13 1 21 9 18 22 8 20 6 9Z" fill="#a47ce0" stroke="#d9beff" stroke-width=".7"/><path d="m13 1-1 18 6 3 3-13Z" fill="#704399"/><path d="M2 12h6l3 6-3 5H2l-1-6Z" fill="#bc98f6"/>',
 cards:'<path d="M5 2h14v18H5Z" fill="#124960" stroke="#7dd8e6"/><path d="M2 5h14v18H2Z" fill="#e6ebe7" stroke="#657980"/><path d="M8 8v11m-4-5h9" stroke="#4e93b9" stroke-width="1.5"/>',
 market:'<path d="M9 1h6l1 5-1 3 5 4 2 4-2 5H4l-2-5 2-4 5-4-1-3Z" fill="#778384" stroke="#202f37"/><path d="M8 5h8v3H8Z" fill="#bfa35a"/><path d="M10 15h4v3h-4Z" fill="#f5cb60"/>',
 journal:'<path d="M1 4h9l2 2 2-2h9v17h-9l-2 2-2-2H1Z" fill="#98764c" stroke="#c59c68"/><path d="M3 5h7l2 2 2-2h7v13h-7l-2 2-2-2H3Z" fill="#e3dbc1"/><path d="M12 7v12M5 8h4m-4 3h4m-4 3h4m6-6h4m-4 3h4m-4 3h4" stroke="#9b957e" stroke-width=".7"/>',
 character:'<path d="m12 1 7 13 4 3H1l5-3Z" fill="#1b6689" stroke="#74b3c8" stroke-width=".7"/><path d="M6 13h13v3H6Z" fill="#e8b64e"/><path d="M7 18h10v4l-5 2-5-2Z" fill="#e7d8b3"/><path d="M8 20h2m4 0h2" stroke="#36454e"/>',
 settings:'<path d="M9 1h6v4l3 2 4-1 2 6-4 2-1 4 2 3-5 3-3-3-4 1-1 3-6-2v-4l-3-2-3 1-2-6 4-2 1-4Z" transform="translate(2 0) scale(.85)" fill="#a8b6b8"/><circle cx="12" cy="12" r="4" fill="#12232c" stroke="#d1dfdd"/>',
 map:'<path d="M2 3 9 5l7-3 6 2v18l-6-2-7 3-7-2Z" fill="#69c0d7" stroke="#e0f7ee"/><path d="m2 8 6 3 4-4 6 3 4-2m-20 7 6 2 4-4 6 3 4-1" stroke="#62b64d" stroke-width="3"/><path d="M9 5v18m7-21v18" stroke="#e3df96" stroke-width=".6"/>',
 battle:'<path d="M3 2 18 17m-2 2 4-4m-1 5 3 3M21 2 6 17m-2-2 4 4m-3 1-3 3" fill="none" stroke="#d8dfd8" stroke-width="2.8"/><path d="m17 19 3 3M7 19l-3 3" stroke="#a77d47" stroke-width="2.5"/>',
 newgame:'<path d="m4 4 11-2 4 17-11 3Z" fill="none" stroke="#c5b6dd"/><path d="M8 5h13v17H8Z" fill="#152633" stroke="#d5e3e5"/><path d="M14 9v9m-4-4h9" stroke="#d5e3e5"/>',
 leaf:'<path d="M3 21C1 8 8 3 22 2 21 16 15 23 3 21Z" fill="#409c63" stroke="#8de9b5"/><path d="m3 21 14-14m-7 7V8m0 6h6" stroke="#a3eb96" stroke-width="1.1"/>',
 fire:'<path d="M11 1c5 7-2 9-1 13 3-1 5-4 5-7 8 8 7 15-3 16C1 22 1 14 7 8c-1 5 0 7 2 7-1-7 7-7 2-14Z" fill="#f07132" stroke="#f8b169"/><path d="M11 13c7 6 4 10 0 9-4-1-4-5 0-9Z" fill="#ffe5a1"/>',
 skull:'<path d="M6 2h12l5 5v9l-5 4v3H6v-3l-5-4V7Z" fill="#f5cb60" stroke="#9b773c"/><path d="M6 8h4v6H6m8-6h4v6h-4m-3 0h2v3h-2" fill="#342d25"/>',
 rune:'<path d="M6 2v20m0-8 9-8m-9 8h8" fill="none" stroke="#7dd8e6" stroke-width="1.5"/>',
 empty:'<path d="M4 8h16v12H4Z" fill="none" stroke="#647881"/><path d="M12 4v15m-6-7h12" stroke="#a8b6b8" stroke-width="1.4"/>',
 cave:'<path d="M1 23 5 4l4 9 4-12 6 12 4 10Z" fill="#10364e"/><path d="m12 5 6 9-5 9-5-9Z" fill="#4bc7e8"/><path d="m12 5-4 9h5Z" fill="#c6f7fa"/>'
};
function icon(name,x,y,size=24){return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${paths[name]||paths.empty}</svg>`;}
const api={paths,icon};if(typeof module!=='undefined')module.exports=api;root.HexIcons=api;
})(typeof globalThis!=='undefined'?globalThis:this);
