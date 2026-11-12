// CoCart Mono — Braille Patterns (U+2800–28FF), all 256.
// Load after cocart-mono.js. Adds glyphs to CCMono.glyphs and a block to CCMono.coverage.
// Proportions follow tactile braille, not a pixel grid: equal dot spacing across and down (2.5 mm in print),
// a cell-to-cell gap about 1.5× the dot spacing (6.2 mm pitch) and dots about 0.55 of the spacing across.
// On the 600-unit cell that gives a 242-unit dot pitch, centred on the line box (950 / −250).
// Dot numbering is Unicode's: bit 0–2 = dots 1–3 (left, top down), bit 3–5 = dots 4–6 (right), bit 6 = dot 7, bit 7 = dot 8.
// Mono's touch: the dot radius grows with the stroke (Thin 58 → Black 77 units), like every other dot in the family,
// and dots stay upright in the italics, as braille is never slanted.
(function(){
const C=window.CCMono; if(!C||C.braille) return;
const G=C.glyphs, P=242, CX=300, CY=-350, R0=55, K=0.175, N=24;
const col=[CX-P/2, CX+P/2], row=[CY-1.5*P, CY-0.5*P, CY+0.5*P, CY+1.5*P];
// Unicode bit → [column, row]
const POS=[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[0,3],[1,3]];
const dot=(x,y)=>Array.from({length:N},(_,i)=>{const a=2*Math.PI*i/N;return [+(x+R0*Math.cos(a)).toFixed(2),+(y+R0*Math.sin(a)).toFixed(2),+(K*Math.cos(a)).toFixed(4),+(K*Math.sin(a)).toFixed(4)]});
for(let b=0;b<256;b++){
  const fill=[]; POS.forEach(([c,r],i)=>{if(b&(1<<i))fill.push(dot(col[c],row[r]))});
  G[String.fromCharCode(0x2800+b)]=fill.length?{s:'',dots:[],wf:1,upright:true,fill}:{s:'',dots:[],wf:1,upright:true};
}
C.coverage.push({name:'Braille patterns',cps:Array.from({length:256},(_,i)=>0x2800+i)});
C.braille=true;
if(C.refresh)C.refresh();
})();
