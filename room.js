'use strict';
// Studio A live room: mounts the interactive 3D studio (studio3d/studio3d.js) inside the Studio view.
let destroyRoom=()=>{};
function installLiveRoom(){
 destroyRoom();
 const intro=view.querySelector('.studioIntro');
 intro.querySelector('p').textContent='Step inside. Walk the room, click any instrument to play it, then mix and record your session.';
 intro.insertAdjacentHTML('afterend','<section id="liveStudio" aria-label="Interactive 3D music studio"></section>');
 const el=$('liveStudio');
 if(!window.MFStudio3D){el.innerHTML='<p class="studioFallback">The 3D studio could not load in this browser.</p>';return}
 const tracks=songs.filter(s=>!s.local).map(s=>({name:s.name,url:s.url}));
 const app=MFStudio3D.mount(el,{songs:tracks,base:'assets/studio/',onExclusive:()=>{if(!aud.paused)aud.pause()}});
 destroyRoom=()=>{app.destroy();destroyRoom=()=>{}};
}
