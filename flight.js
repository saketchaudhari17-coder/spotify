'use strict';
const $=id=>document.getElementById(id),refs=[['Kanye West','Graduation','5fPglEDz9YEwRgbLRvhCZy'],['A$AP Rocky','LONG.LIVE.A$AP','6rzMufuu8sLkIizM4q9c7J'],['Playboi Carti','Whole Lotta Red'],['Travis Scott','Rodeo','4PWBTB6NYSKQwfo79I3prg'],['Future','DS2']];
const beats=[0,4,8,13,17], labels=['Launch','Orbit','Rings','Approach','Landing'], titles=[['Midnight','Frequencies.'],['Leaving','orbit.'],['Vinyl','rings.'],['Night','signal.'],['Final','approach.']], captions=['THE WORLD WENT QUIET. I TURNED IT UP.','THE BASS HIT. GRAVITY LET GO.','NO SIGNAL. STILL IN ROTATION.','THE NIGHT HAS ITS OWN FREQUENCY.','FINAL APPROACH: MIDNIGHT FREQUENCIES.'],phases=['SURFACE LAUNCH','CLEAR THE ATMOSPHERE','RING PASSAGE','DESTINATION APPROACH','DESCENT & TOUCHDOWN'];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x)),s=(a,b,t)=>{const v=clamp((t-a)/(b-a));return v*v*(3-2*v)},land=19.25, reduced=matchMedia('(prefers-reduced-motion:reduce)');
const cv=$('scene'),g=cv.getContext('2d'),imgs={},imgNames=['launch','rings','galaxy','station','craft','airfield'];let t=0,playing=false,active=true,origin=0,originTime=0,chapter=-1,lastGate=null,frame=0,dirty=true,manualDrop=true;
let ac,blue=false,bus,beatNode,score;
function makeScore(){const sr=22050,b=ac.createBuffer(1,sr*20,sr),d=b.getChannelData(0);for(let n=0;n<80;n++){const at=n*.25;for(let k=0;k<sr*.28&&at*sr+k<d.length;k++){const u=k/sr;let z=Math.sin((1200-n%3*110)*2*Math.PI*u)*.023*Math.exp(-u*48);if(n%2===0)z+=.29*Math.sin(2*Math.PI*(40*u+2.3*(1-Math.exp(-u*38))))*Math.exp(-u*16);if(n>=32&&n%4===0)z+=.22*Math.sin(2*Math.PI*(n%16<8?55:49)*u)*Math.exp(-u*6);d[Math.round(at*sr)+k]+=z}}return b}
function clockNow(){return blue&&ac?.state==='running'?ac.currentTime:performance.now()/1000}
function stopSound(){try{beatNode?.stop()}catch{}beatNode=null}
function anchor(){stopSound();origin=clockNow();originTime=t;if(playing&&blue&&t<20){beatNode=ac.createBufferSource();beatNode.buffer=score;beatNode.connect(bus);beatNode.start(origin,t)}}
function hit(){if(!blue||!ac)return;const o=ac.createOscillator(),v=ac.createGain();o.frequency.setValueAtTime(96,ac.currentTime);o.frequency.exponentialRampToValueAtTime(42,ac.currentTime+.2);v.gain.setValueAtTime(.25,ac.currentTime);v.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.3);o.connect(v).connect(bus);o.start();o.stop(ac.currentTime+.31)}
$('beat').onclick=async()=>{try{if(!ac){ac=new (window.AudioContext||window.webkitAudioContext)();bus=ac.createGain();bus.gain.value=.64;bus.connect(ac.destination);score=makeScore()}await ac.resume();if(playing)t=clamp(originTime+clockNow()-origin,0,20);blue=!blue;$('beat').textContent=blue?'♫ Beat on':'♩ Enable beat';$('beat').setAttribute('aria-pressed',blue);anchor();if(blue&&!playing)hit()}catch{$('beat').textContent='Beat unavailable'}};
function rect(){return $('flight').offsetHeight-document.querySelector('.stage').clientHeight}
function pause(){playing=false;stopSound();$('play').textContent=t>=20?'↶  Replay flight':'▶  Play flight'}
function seekFlight(n,manual=true){n=clamp(n,0,20);if(manual){if(t<8&&n>=8&&manualDrop){hit();manualDrop=false}if(n<7.4)manualDrop=true}t=n;if(manual)pause();scrollTo(0,t/20*rect());update()}
$('play').onclick=()=>{if(playing){pause();return}if(t>=19.999)seekFlight(0);playing=true;anchor();$('play').textContent='Ⅱ  Pause flight';requestDraw()};
$('slider').oninput=e=>seekFlight(+e.target.value);
labels.forEach((a,i)=>{let b=document.createElement('button');b.className='chapter';b.innerHTML=`<b>0${i+1}</b><span>${a}</span>`;b.onclick=()=>seekFlight(beats[i]);$('chapters').append(b)});
function requestDraw(){if(!frame&&active)frame=requestAnimationFrame(tick)}
function tick(){frame=0;if(!active)return;if(playing){t=clamp(originTime+clockNow()-origin,0,20);scrollTo(0,t/20*rect());if(t>=20)pause();update()}if(dirty){render();dirty=false}if(playing)requestDraw()}
function update(){const c=t<4?0:t<8?1:t<13?2:t<17?3:4,gate=t>=land;if(c!==chapter||gate!==lastGate){chapter=c;lastGate=gate;$('phase').textContent=`0${c+1} / ${phases[c]}`;const words=gate?['Welcome','aboard.']:titles[c];$('headline').innerHTML=words[0]+'<br><em>'+words[1]+'</em>';$('caption').textContent=gate?'TOUCHDOWN: MIDNIGHT FREQUENCIES.':captions[c];$('route').hidden=c!==3;$('artist').textContent=refs[c][0];$('albumName').textContent=refs[c][1];$('tel').textContent=`MF / 0${c+1}`;[...$('chapters').children].forEach((b,j)=>{b.classList.toggle('on',j===c);b.setAttribute('aria-current',j===c?'step':'false')});$('enter').hidden=$('enter').disabled=!gate;$('guide').hidden=gate;$('play').hidden=gate&&t<20}
 if(gate&&t>=20){$('play').hidden=false;$('play').textContent='↶  Replay flight'}$('clock').textContent='00:'+String(Math.floor(t+.00001)).padStart(2,'0');$('slider').value=t;dirty=true;requestDraw()}
addEventListener('scroll',()=>{if(!active||playing)return;const n=clamp(scrollY/rect())*20;if(Math.abs(n-t)<.009)return;if(t<8&&n>=8&&manualDrop){hit();manualDrop=false}if(n<7.4)manualDrop=true;t=n;update()},{passive:true});
for(const ev of ['wheel','touchmove','keydown'])addEventListener(ev,e=>{if(!active||!playing||ev==='keydown'&&!['ArrowDown','ArrowUp','PageDown','PageUp','End','Home'].includes(e.key))return;pause()},{passive:true});
$('enter').onclick=()=>{if(t<land)return;pause();active=false;$('app').inert=false;$('flight').hidden=true;$('app').hidden=false;scrollTo(0,0);openView('Studio');$('studioTitle').focus({preventScroll:true})};
function replay(){active=true;stopLibrary();$('app').inert=true;$('app').hidden=true;$('flight').hidden=false;seekFlight(0);resize();$('play').focus({preventScroll:true})}
$('back').onclick=replay;document.querySelector('a.brand').onclick=e=>{e.preventDefault();seekFlight(0)};
let w=0,h=0;function resize(){if(!active)return;w=cv.clientWidth;h=cv.clientHeight;const d=Math.min(2560/w,1440/h,w<650?1.6:2);cv.width=Math.max(1,Math.round(w*d));cv.height=Math.max(1,Math.round(h*d));g?.setTransform(cv.width/w,0,0,cv.height/h,0,0);dirty=true;requestDraw()}
let seed=1741;function rng(){return((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)}
const flecks=Array.from({length:150},()=>[rng(),rng(),rng(),rng()]),cities=Array.from({length:900},(_,i)=>{let a=i%24*2.4,b=.4+.52*Math.sin(i%24*11);return [Math.cos(a)*b+(rng()-.5)*.18,Math.sin(a)*b+(rng()-.5)*.1,rng()]});
imgNames.forEach(k=>{const im=new Image();im.onload=()=>{imgs[k]=im;dirty=true;requestDraw()};im.src='assets/'+k+'.webp'});
function plate(name,opacity,zoom,fx=.5,fy=.5,dy=0){const im=imgs[name];if(!im||opacity<=.001)return;g.save();g.globalAlpha=opacity;const fit=Math.max(w/im.width,h/im.height)*zoom;const W=im.width*fit,H=im.height*fit;g.drawImage(im,(w-W)*fx,(h-H)*fy+dy,W,H);g.restore()}
function airfield(alpha,cx,van,X,roadY,sz,sh,lift){
 g.save();g.globalAlpha=alpha;
 if(imgs.airfield){const im=imgs.airfield,sc=Math.max(w/im.width,h/im.height),sw=im.width*sc,hh=im.height*sc;g.drawImage(im,(w-sw)*.68,van-hh*.39,sw,hh);g.fillStyle='#20252a';g.fillRect(0,van+.61*hh,w,Math.max(0,h-van-.61*hh))}
 const L=y=>w*(.006+.67*(y-van)/(h-van)),pr=(x,y)=>[cx+x*L(y),y];
 function poly(vertices,col){g.fillStyle=col;g.beginPath();for(let i=0;i<vertices.length;i++)g[i?'lineTo':'moveTo'](...pr(...vertices[i]));g.closePath();g.fill()}
 poly([[-1,van],[1,van],[1,h],[-1,h]],'#24282c');
 for(let k of [-1,1]){poly([[k*.94,van],[k*.954,van],[k*.954,h],[k*.94,h]],'#a0a8a3');poly([[k*.53,van],[k*.60,van],[k*.60,h],[k*.53,h]],'#222629')}
 const dist=1-(1-clamp((t-17)/3))**2;
 for(let i=0;i<84;i++){
   const z=((i+1-dist*15)%84+84)%84+.75,y=van+(h-van)*2/z;if(y>h)continue;
   const end=van+(h-van)*2/(z+.31),R=.45+10/z;
   if(i%2===0)poly([[-.013,y],[.013,y],[.013,end],[-.013,end]],'#acb0a8');
   for(const k of [-1,1]){const [xx]=pr(k*1.005,y);const glow=g.createRadialGradient(xx,y,0,xx,y,R*3.2);glow.addColorStop(0,i%8===0?'#ffbd72':'#e2effa');glow.addColorStop(.18,i%8===0?'#ffad6eba':'#a4c8ffb0');glow.addColorStop(1,'#8ca8d000');g.fillStyle=glow;g.fillRect(xx-R*3.2,y-R*3.2,6.4*R,6.4*R);g.fillStyle='#f7f3df';g.fillRect(xx-R*.5,y-R*.18,R,R*.36);if(i%11===0){for(let d=0;d<4;d++)poly([[k*(.3+d*.09),y],[k*(.34+d*.09),y],[k*(.34+d*.09),end],[k*(.3+d*.09),end]],'#a2a7a2')}}
 }g.fillStyle=`rgba(0,0,0,${.13+.69*(1-lift)})`;g.beginPath();g.ellipse(X,roadY+1,sz*.41,sh*.1,0,0,7);g.fill();g.restore()
}
function render(){if(!g||!w||!h)return;const m=w<760,q=reduced.matches?([1,5.6,10,15,18.5][chapter]||0):t;const cR=s(6.7,8.3,q),cG=s(12,14,q),cD=s(15.4,17.5,q),ground=s(16.9,18.25,q);g.fillStyle='#070a0f';g.fillRect(0,0,w,h);
 plate('launch',1,1.22-.18*s(0,7,q),.63,q/9);plate('rings',cR,1.14+.15*s(7,13,q),.62-.23*s(7,13,q),.47);plate('galaxy',cG,1.04+.2*s(12,17,q),.45,.45);if(cD>.001){g.fillStyle=`rgba(6,14,22,${cD*.76})`;g.fillRect(0,0,w,h);const px=w*(m?.56:.69),py=h*.91,R=h*(.36+.48*s(15,18,q));g.save();g.globalAlpha=cD;g.beginPath();g.arc(px,py,R,0,7);const pl=g.createRadialGradient(px-R*.5,py-R*.7,0,px,py,R);pl.addColorStop(0,'#425365');pl.addColorStop(.7,'#192333');pl.addColorStop(.986,'#0f1a29');pl.addColorStop(1,'#8aadc2');g.fillStyle=pl;g.fill();g.clip();for(const [x,y,b] of cities){g.fillStyle=`rgba(252,191,108,${.15+b*.75})`;g.fillRect(px+x*R,py+y*R,1+b,1+b)}g.restore()}
 const cx=w*(m?.51:.71),base=h*(m?.36:.49);const X=cx+w*(m?.018:.035)*Math.sin(q*.78)*Math.sin(Math.PI*q/20),roadY=h*(m?.42:.62),van=h*(m?.22:.39),lift=1-s(17.3,land,t);const sz=w*(m?.72:.405)*(1-.22*s(2,7,q)+.22*s(15,19,q)),sh=sz*95/357;let Y=base-h*.075*Math.sin(Math.PI*Math.min(q,8)/8)+.04*h*s(11,14,q);
 const landing=s(17,18.65,t);Y=Y*(1-landing)+(roadY-sh*.49-11-h*.18*lift+2*s(land,19.58,t))*landing;
 if(ground>.001)airfield(ground,cx,van,X,roadY,sz,sh,lift);
 if(!reduced.matches&&q>=8&&q<13){for(const [a,b,z] of flecks.slice(0,65)){const d=((z+(q-8)*(.09+.22*z))%1)**2;const xx=cx+(a-.5)*w*(.25+3*d),yy=base+(b-.5)*h*(.3+2*d);if(Math.abs(xx-X)<sz*.46&&Math.abs(yy-Y)<sh*.52)continue;g.fillStyle=`rgba(229,217,196,${.2+.56*d})`;g.fillRect(xx,yy,1+d*5,1+d*2)}}
 g.save();g.translate(X,Y);const bank=reduced.matches?0:-.30*Math.sin(Math.PI*clamp((q-8)/5))+.025*Math.sin(q*1.3)*Math.sin(Math.PI*q/20);g.rotate(bank);
 if(t>17){g.strokeStyle='#9ca0a1';g.lineWidth=Math.max(2,sz*.005);for(const k of [-1,1]){g.beginPath();g.moveTo(k*sz*.135,sh*.2);g.lineTo(k*sz*.16,sh*.49+6-2*s(land,19.58,t));g.stroke();g.fillStyle='#141719';g.beginPath();g.ellipse(k*sz*.16,sh*.49+6-2*s(land,19.58,t),5,5,0,0,7);g.fill()}}
 for(const k of [-1,1]){const ex=k*sz*.095,ey=sh*.32,r=sz*.12;const glow=g.createRadialGradient(ex,ey,0,ex,ey,r);glow.addColorStop(0,`rgba(162,222,255,${t>=land?.15:.6})`);glow.addColorStop(.36,'rgba(68,175,255,.18)');glow.addColorStop(1,'rgba(38,150,255,0)');g.fillStyle=glow;g.fillRect(ex-r,ey-r,2*r,2*r)}
 if(imgs.craft)g.drawImage(imgs.craft,-sz/2,-sh/2,sz,sh);g.restore();
 if(q>.15&&q<3&&!reduced.matches){for(const [a,b,z] of flecks.slice(0,65)){let k=((q*.55+z)%1);g.fillStyle=`rgba(229,204,167,${.24*Math.sin(k*Math.PI)*Math.sin(Math.PI*q/3)})`;g.beginPath();g.ellipse(X+(a-.5)*sz*(.4+1.5*k),Y+sh*(.6+k*.55)+b*8,1+k*7,1+k*2,0,0,7);g.fill()}}}
new ResizeObserver(resize).observe(cv);reduced.addEventListener('change',()=>{dirty=true;requestDraw()});resize();update();
