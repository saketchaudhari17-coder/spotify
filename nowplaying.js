'use strict';
// Full-screen "Now playing" view: big artwork, live visualizer, transport with shuffle/repeat, up-next queue.
(function(){
 const np={open:false,shuffle:false,repeat:'all',tab:'queue',ctx:null,an:null,data:null,raf:0,tint:'#d4f692'};
 const icon={shuffle:'⤮',prev:'⏮',next:'⏭',repeatAll:'↻',repeatOne:'↻¹'};
 const el=document.createElement('section');el.id='nowPlaying';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-label','Now playing');
 el.innerHTML=`<div class="npBg"><img alt=""></div><div class="npShade"></div>
 <header class="npTop"><button class="npIcon" data-np="close" aria-label="Close now playing">⌄</button><div><span class="eyebrow"><i></i> PLAYING FROM</span><strong id="npFrom">Midnight Frequencies</strong></div><button class="npIcon" data-np="tab" aria-label="Show up next" title="Up next">☰</button></header>
 <div class="npMain"><div class="npArtWrap"><div class="npVinyl"><i></i></div><img class="npArt" alt=""><canvas class="npViz" aria-hidden="true"></canvas></div>
 <div class="npInfo"><div class="npTitleRow"><div><h2 id="npSong"></h2><p id="npArtist"></p></div><button class="npIcon npLike" data-np="like" aria-label="Like">♡</button></div>
 <div class="npSeek"><input id="npSeek" type="range" min="0" max="1000" value="0" aria-label="Track position"><div><span id="npEl">0:00</span><span id="npLen">0:00</span></div></div>
 <div class="npCtrl"><button class="npIcon" data-np="shuffle" aria-label="Shuffle" aria-pressed="false">${icon.shuffle}</button><button class="npIcon big" data-np="prev" aria-label="Previous track">${icon.prev}</button><button class="npPlay" data-np="play" aria-label="Play">▶</button><button class="npIcon big" data-np="next" aria-label="Next track">${icon.next}</button><button class="npIcon on" data-np="repeat" aria-label="Repeat all" aria-pressed="true">${icon.repeatAll}</button></div>
 <label class="npVol"><span aria-hidden="true">🔈</span><input id="npVol" type="range" min="0" max="1" step=".01" aria-label="Volume"><span aria-hidden="true">🔊</span></label>
 <p class="npKeys mono">SPACE PLAY · ← → SEEK · SHIFT ← → TRACK · L LIKE · ESC CLOSE</p></div>
 <div class="npSide" role="region" aria-label="Up next"><div class="npTabs"><button data-tab="queue" class="on">Up next</button><button data-tab="about">Credits</button></div><div id="npList"></div></div></div>`;
 document.body.append(el);
 const q=s=>el.querySelector(s),art=q('.npArt'),bg=q('.npBg img'),cv=q('.npViz'),g=cv.getContext('2d');

 // ----- playback helpers (shared with the bottom player so shuffle/repeat behave the same everywhere)
 function order(){return queue.length?queue:songs.map(s=>s.id)}
 function advance(d,auto){
  const list=order();
  if(auto&&np.repeat==='one'){aud.currentTime=0;playAudio();return}
  if(np.shuffle&&list.length>1){let n;do n=list[Math.floor(Math.random()*list.length)];while(n===selected);setTrack(n);return}
  const i=list.indexOf(selected),j=i+d;
  if(auto&&np.repeat==='off'&&j>=list.length){aud.pause();aud.currentTime=0;return}
  setTrack(list[(j+list.length)%list.length]);
 }
 aud.onended=()=>advance(1,true);
 $('next').onclick=()=>advance(1);
 $('prev').onclick=()=>{if(aud.currentTime>3)aud.currentTime=0;else advance(-1)};

 // ----- open / close
 const opener=document.createElement('button');opener.className='npOpen';opener.setAttribute('aria-label','Open now playing');opener.title='Now playing';opener.textContent='⤢';
 document.querySelector('.player .now').append(opener);
 [opener,$('art'),$('song')].forEach(n=>{n.style.cursor='pointer';n.addEventListener('click',open)});
 function open(){if(np.open)return;np.open=true;el.hidden=false;requestAnimationFrame(()=>el.classList.add('show'));document.documentElement.classList.add('npLock');paint();list();initAudio();loop();q('[data-np="close"]').focus({preventScroll:true})}
 function close(){np.open=false;el.classList.remove('show');document.documentElement.classList.remove('npLock');cancelAnimationFrame(np.raf);setTimeout(()=>{if(!np.open)el.hidden=true},320);opener.focus({preventScroll:true})}

 // ----- audio analyser (created on first open, a user gesture)
 function initAudio(){
  if(np.ctx){np.ctx.resume();return}
  try{const C=window.AudioContext||window.webkitAudioContext;np.ctx=new C();const src=np.ctx.createMediaElementSource(aud);np.an=np.ctx.createAnalyser();np.an.fftSize=256;np.an.smoothingTimeConstant=.78;src.connect(np.an);np.an.connect(np.ctx.destination);np.data=new Uint8Array(np.an.frequencyBinCount);aud.addEventListener('play',()=>np.ctx.resume())}catch(e){np.an=null}
 }

 // ----- paint
 function cur(){return songs[selected]||songs[0]}
 function mixName(id){const m=mixes.find(m=>m.ids.length===queue.length&&m.ids.every((x,i)=>x===queue[i]));return m?m.name:songs[id]?.local?'Local files':'Midnight Frequencies'}
 function paint(){
  const a=cur(),src=`assets/${a.art}.webp`;
  if(art.getAttribute('src')!==src){art.src=bg.src=src;tint(src)}
  $('npSong').textContent=a.name;$('npArtist').textContent=a.artist;$('npFrom').textContent=mixName(a.id);
  const liked=likes.has(a.id);const lk=q('[data-np="like"]');lk.textContent=liked?'♥':'♡';lk.classList.toggle('on',liked);lk.setAttribute('aria-pressed',liked);lk.setAttribute('aria-label',liked?'Unlike':'Like');lk.disabled=!!a.local;
  const on=!aud.paused;const p=q('[data-np="play"]');p.textContent=on?'❚❚':'▶';p.setAttribute('aria-label',on?'Pause':'Play');el.classList.toggle('playing',on);
  const sh=q('[data-np="shuffle"]');sh.classList.toggle('on',np.shuffle);sh.setAttribute('aria-pressed',np.shuffle);
  const rp=q('[data-np="repeat"]');rp.classList.toggle('on',np.repeat!=='off');rp.textContent=np.repeat==='one'?icon.repeatOne:icon.repeatAll;rp.setAttribute('aria-label',{off:'Repeat off',all:'Repeat all',one:'Repeat one'}[np.repeat]);rp.setAttribute('aria-pressed',np.repeat!=='off');
  q('#npVol').value=$('volume').value;time();
  if(np.open&&np.tab==='queue')list();
 }
 function time(){const d=Number.isFinite(aud.duration)?aud.duration:cur().duration;$('npEl').textContent=fmt(aud.currentTime);$('npLen').textContent=fmt(d);const v=d?aud.currentTime/d*1000:0;q('#npSeek').value=v;q('#npSeek').style.setProperty('--p',v/10+'%')}
 function list(){
  const box=$('npList');
  el.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('on',b.dataset.tab===np.tab));
  if(np.tab==='about'){const a=cur();box.innerHTML=`<dl class="npCredits"><dt>Track</dt><dd>${safe(a.name)}</dd><dt>Artist</dt><dd>${safe(a.artist)}</dd><dt>From</dt><dd>${safe(mixName(a.id))}</dd><dt>Length</dt><dd>${fmt(Number.isFinite(aud.duration)?aud.duration:a.duration)}</dd><dt>Type</dt><dd>${a.local?'Local file from your device':'Original instrumental · no lyrics'}</dd></dl>`;return}
  const l=order(),i=Math.max(0,l.indexOf(selected));const rest=[...l.slice(i+1),...l.slice(0,i)];
  const row=(id,now)=>{const a=songs[id];return `<button class="npRow${now?' now':''}" data-goto="${id}"><img src="assets/${a.art}.webp" alt=""><span><strong>${safe(a.name)}</strong><small>${safe(a.artist)}</small></span><em>${now&&!aud.paused?'<i class="npEq"><b></b><b></b><b></b></i>':fmt(a.duration)}</em></button>`};
  box.innerHTML=`<h4>Now playing</h4>${row(selected,true)}<h4>${np.shuffle?'Up next · shuffled':'Up next'}</h4>${rest.length?rest.map(id=>row(id)).join(''):'<p class="npEmpty">Nothing queued after this track.</p>'}`;
 }
 function tint(src){const im=new Image();im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=24;const x=c.getContext('2d');x.drawImage(im,0,0,24,24);const d=x.getImageData(0,0,24,24).data;let r=0,gg=0,b=0,w=0;for(let i=0;i<d.length;i+=4){const mx=Math.max(d[i],d[i+1],d[i+2]),mn=Math.min(d[i],d[i+1],d[i+2]),s=(mx-mn)/255+.05;r+=d[i]*s;gg+=d[i+1]*s;b+=d[i+2]*s;w+=s}const k=255/Math.max(r/w,gg/w,b/w,1);np.tint=`rgb(${Math.min(255,r/w*k*.95)|0},${Math.min(255,gg/w*k*.95)|0},${Math.min(255,b/w*k*.95)|0})`;el.style.setProperty('--np',np.tint)}catch(e){}};im.src=src}

 // ----- visualizer: radial bars around the artwork
 function loop(){
  np.raf=requestAnimationFrame(loop);
  const s=cv.clientWidth,dpr=Math.min(devicePixelRatio||1,2);if(cv.width!==s*dpr){cv.width=cv.height=s*dpr}
  g.clearRect(0,0,cv.width,cv.height);
  let vals;if(np.an&&!aud.paused){np.an.getByteFrequencyData(np.data);vals=np.data}
  const n=72,cx=cv.width/2,r0=cv.width*.355,t=performance.now()/1000;
  g.lineCap='round';g.strokeStyle=np.tint;g.lineWidth=cv.width*.007;
  for(let i=0;i<n;i++){const v=vals?vals[Math.floor(Math.pow(i/n,1.4)*vals.length*.8)]/255:(.08+.04*Math.sin(t*1.5+i*.5));const a=i/n*Math.PI*2-Math.PI/2,len=cv.width*(.012+v*.11);g.globalAlpha=.35+v*.65;g.beginPath();g.moveTo(cx+Math.cos(a)*r0,cx+Math.sin(a)*r0);g.lineTo(cx+Math.cos(a)*(r0+len),cx+Math.sin(a)*(r0+len));g.stroke()}
  g.globalAlpha=1;
 }

 // ----- events
 el.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const k=b.dataset.np;
  if(k==='close')close();
  else if(k==='play')$('pp').click();
  else if(k==='prev')$('prev').click();
  else if(k==='next')advance(1);
  else if(k==='shuffle'){np.shuffle=!np.shuffle;paint();list()}
  else if(k==='repeat'){np.repeat={off:'all',all:'one',one:'off'}[np.repeat];paint()}
  else if(k==='like'){const id=selected;if(songs[id].local)return;likes.has(id)?likes.delete(id):likes.add(id);save('mf-liked',JSON.stringify([...likes]));paint();if(pageName==='Liked')renderView();else paintPlay();view.querySelectorAll(`[data-like="${id}"]`).forEach(x=>{x.textContent=likes.has(id)?'♥':'♡';x.classList.toggle('saved',likes.has(id))})}
  else if(k==='tab'){el.classList.toggle('sideOpen');list()}
  else if(b.dataset.tab){np.tab=b.dataset.tab;list()}
  else if(b.dataset.goto){const id=+b.dataset.goto;if(id===selected){$('pp').click()}else setTrack(id)}
 });
 q('#npSeek').addEventListener('input',e=>{if(Number.isFinite(aud.duration))aud.currentTime=aud.duration*+e.target.value/1000;time()});
 q('#npVol').addEventListener('input',e=>{$('volume').value=e.target.value;aud.volume=+e.target.value});
 $('volume').addEventListener('input',()=>{q('#npVol').value=$('volume').value});
 ['play','pause','loadedmetadata','emptied'].forEach(ev=>aud.addEventListener(ev,()=>{paint();media()}));
 aud.addEventListener('timeupdate',()=>{if(np.open)time()});
 document.addEventListener('keydown',e=>{
  if(!np.open||e.metaKey||e.ctrlKey||e.altKey)return;if(e.target.tagName==='INPUT'&&e.target.type!=='range')return;
  const k=e.key;
  if(k==='Escape'){if(el.classList.contains('sideOpen'))el.classList.remove('sideOpen');else close();return}
  if(k===' '&&e.target.tagName!=='BUTTON'){e.preventDefault();$('pp').click()}
  else if(k==='ArrowRight'||k==='ArrowLeft'){if(e.target.type==='range')return;e.preventDefault();if(e.shiftKey){k==='ArrowRight'?advance(1):$('prev').click()}else aud.currentTime=Math.max(0,Math.min((aud.duration||0)-.1,aud.currentTime+(k==='ArrowRight'?5:-5)))}
  else if(k==='l'||k==='L')q('[data-np="like"]').click();
 });

 // ----- OS media controls (lock screen, headphone buttons)
 function media(){
  if(!('mediaSession' in navigator))return;const a=cur();
  try{navigator.mediaSession.metadata=new MediaMetadata({title:a.name,artist:a.artist,album:mixName(a.id),artwork:[{src:new URL(`assets/${a.art}.webp`,location.href).href,sizes:'512x512',type:'image/webp'}]});navigator.mediaSession.playbackState=aud.paused?'paused':'playing'}catch(e){}
 }
 if('mediaSession' in navigator){const ms=navigator.mediaSession;const h=(n,f)=>{try{ms.setActionHandler(n,f)}catch(e){}};h('play',()=>playAudio());h('pause',()=>aud.pause());h('nexttrack',()=>advance(1));h('previoustrack',()=>$('prev').click());h('seekto',d=>{if(d.seekTime!=null)aud.currentTime=d.seekTime})}
 paint();media();
})();
