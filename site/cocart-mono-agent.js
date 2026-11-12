// CoCart Mono — agent marks: the symbols AI coding agents print in terminals
// (thinking spinner, tool-call bullets, prompts, status), drawn on the Mono grid.
// Load after cocart-mono.js. Adds glyphs to CCMono.glyphs and a block to CCMono.coverage.
// Every mark is centred on the symbol axis (300, −330) like ● and ★. The spinner frames (· ✢ ✳ ✶ ✻ ✽)
// share one outer radius so an animation pulses in place, and their waists thicken with the stroke.
(function(){
const C=window.CCMono; if(!C||C.agent) return;
const G=C.glyphs, K=0.58, CX=300, CY=-330;
function P(){let s='',X=0,Y=0;const o={
 m(x,y){s+=`M${x} ${y} `;X=x;Y=y;return o},l(x,y){s+=`L${x} ${y} `;X=x;Y=y;return o},
 v(x,y){s+=`C${X} ${+(Y+(y-Y)*K).toFixed(1)} ${+(x+(X-x)*K).toFixed(1)} ${y} ${x} ${y} `;X=x;Y=y;return o},
 h(x,y){s+=`C${+(X+(x-X)*K).toFixed(1)} ${Y} ${x} ${+(y+(Y-y)*K).toFixed(1)} ${x} ${y} `;X=x;Y=y;return o},
 get d(){return s}};return o}
const ov=(cx,cy,rx,ry)=>P().m(cx-rx,cy).v(cx,cy-ry).h(cx+rx,cy).v(cx,cy+ry).h(cx-rx,cy).d+'Z ';
const def=(ch,s,dots,wf,o)=>{G[ch]=Object.assign({s:s||'',dots:dots||[],wf:wf||1},o||{})};
const defF=(ch,fill,o)=>{if(typeof fill[0][0]==='number')fill=[fill];G[ch]=Object.assign({s:'',dots:[],wf:1,fill},o||{})};
const r1=v=>+v.toFixed(2);
// star with n points: tips fixed at R, waist at r0 + k·stroke (so it fills in with weight)
const wstar=(n,R,r0,k,rot=-Math.PI/2,cx=CX,cy=CY)=>Array.from({length:2*n},(_,i)=>{const a=rot+i*Math.PI/n;return i%2?[r1(cx+r0*Math.cos(a)),r1(cy+r0*Math.sin(a)),r1(k*Math.cos(a)),r1(k*Math.sin(a))]:[r1(cx+R*Math.cos(a)),r1(cy+R*Math.sin(a)),0,0]});
const disc=(r,k=0,cx=CX,cy=CY,n=40)=>Array.from({length:n},(_,i)=>{const a=2*Math.PI*i/n;return [r1(cx+r*Math.cos(a)),r1(cy+r*Math.sin(a)),r1(k*Math.cos(a)),r1(k*Math.sin(a))]});
const half=(a0,r=220,n=24)=>[[CX,CY,0,0],...Array.from({length:n+1},(_,i)=>{const a=a0+Math.PI*i/n;return [r1(CX+r*Math.cos(a)),r1(CY+r*Math.sin(a)),0,0]})];
const spokes=(n,R,cx=CX,cy=CY,rot=-Math.PI/2)=>Array.from({length:n},(_,i)=>{const a=rot+i*Math.PI/n;return `M${r1(cx-R*Math.cos(a))} ${r1(cy-R*Math.sin(a))} L${r1(cx+R*Math.cos(a))} ${r1(cy+R*Math.sin(a))}`}).join(' ');
const kp=pts=>pts.map(([x,y])=>[x,y,0,0]);
const cpath=pts=>'M'+pts.map(p=>p.join(' ')).join(' L')+' Z';

// thinking spinner (outer radius 215)
defF('✢',wstar(4,215,22,.3));                       // four spokes, pinched
def('✳',spokes(4,205),null,.82);                     // eight-spoked asterisk
defF('✶',wstar(6,215,88,.45));                       // six-pointed star
defF('✻',wstar(8,215,34,.34,-Math.PI/2));            // eight teardrop spokes
defF('✽',wstar(8,215,70,.5,-Math.PI/2));             // heavy teardrop spokes
defF('✦',wstar(4,230,62,.42));                       // four-pointed star
def('✧',cpath(wstar(4,215,70,0).map(([x,y])=>[x,y])));
def('⁂',spokes(3,72,300,-520)+' '+spokes(3,72,180,-260)+' '+spokes(3,72,420,-260),null,.62);
// agent markers
defF('⏺',disc(150,.3));                              // tool call / reply bullet
def('⎿','M180 -800 L180 -32 L500 -32');              // hooks output under a tool call
def('❯','M200 -560 L440 -330 L200 -100',null,1.5);   // prompt
def('❮','M400 -560 L160 -330 L400 -100',null,1.5);
defF('⏵',kp([[175,-510],[470,-330],[175,-150]]));
defF('▸',kp([[215,-450],[430,-330],[215,-210]]));
// status
const ring=ov(CX,CY,220,220);
[['◐',Math.PI/2],['◑',-Math.PI/2],['◒',0],['◓',Math.PI]].forEach(([c,a])=>{G[c]={s:ring,dots:[],wf:1,fill:[half(a)]}});
def('✘',G['✗']?G['✗'].s:'M160 -520 L470 -110 M470 -540 C380 -420 270 -260 130 -110',null,1.6);
def('⏸','M205 -540 L205 -120 M395 -540 L395 -120',null,1.1);
defF('⏹',kp([[160,-470],[440,-470],[440,-190],[160,-190]]));
G['⏳']={s:'M150 -630 L450 -630 M150 -30 L450 -30 M195 -630 C195 -420 405 -240 405 -30 M405 -630 C405 -420 195 -240 195 -30',dots:[],wf:.9,fill:[kp([[240,-75],[360,-75],[300,-175]]),kp([[255,-560],[345,-560],[300,-480]])]};
def('⚠',cpath([[300,-640],[545,-60],[55,-60]])+' M300 -440 L300 -250',[[300,-160]],.85);G['⚠'].dotScale=.9;
defF('⚡',kp([[355,-650],[140,-300],[285,-300],[225,-10],[465,-390],[315,-390]]));
// stretchy pieces: horizontal and bracket extensions that join across cells and lines (line box 950 / −250)
def('⎯','M0 -330 L600 -330');
def('⎢','M220 -950 L220 250');def('⎥','M380 -950 L380 250');
def('⎡','M480 -700 L220 -700 L220 250');def('⎤','M120 -700 L380 -700 L380 250');
def('⎣','M220 -950 L220 0 L480 0');def('⎦','M380 -950 L380 0 L120 0');
['✢','✳','✶','✻','✽','✦','✧','⁂','⏺','⏵','▸','◐','◑','◒','◓','⏸','⏹','⏳','⚠','⚡','⎯','⎢','⎥','⎡','⎤','⎣','⎦','⎿'].forEach(c=>{if(G[c])G[c].upright=true});
C.coverage.push({name:'Agent marks',cps:[...'·✢✳✶✻✽✦✧⁂⏺⎿❯❮⏵▸◐◑◒◓✓✔✗✘⏸⏹⏳⚠⚡⎯⎡⎢⎣⎤⎥⎦'].map(c=>c.codePointAt(0))});
C.agent=true;
if(C.refresh)C.refresh();
})();
