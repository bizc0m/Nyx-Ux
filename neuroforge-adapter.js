// Pinned, automatically vendored core. See vendor/neuroforge-core/SOURCE.json.
import { parseProject, decodeImages, applyNyx, aboutHTML } from './vendor/neuroforge-core/index.mjs';
const KEY='nyx-neuroforge-pack-v1';
export function mountNeuroForge(){
  const host=document.querySelector('#themePanel');
  const panel=document.createElement('section');panel.style.cssText='padding:12px;border-bottom:1px solid var(--ink-4);font-size:12px';
  panel.innerHTML='<strong>NeuroForge · pack commun</strong><p>Palette, densité et About. Typographie et icônes système non raccordées.</p><label>Importer un pack <input id="nf-import" type="file" accept="application/json,.json" style="max-width:100%"></label><div style="display:flex;gap:8px;margin-top:8px"><button id="nf-about" class="tool-button" disabled>About</button><button id="nf-reset" class="tool-button" disabled>Restaurer</button></div><p id="nf-result" role="status">Aucun pack actif.</p>';
  host.insertBefore(panel,host.children[1]);
  const status=panel.querySelector('#nf-result'),about=panel.querySelector('#nf-about'),reset=panel.querySelector('#nf-reset');
  let active=null,undo=null;
  const dialog=document.createElement('dialog');dialog.style.cssText='padding:12px;border:1px solid #777;width:min(700px,90vw);background:#171923;color:white';
  const close=document.createElement('button');close.textContent='Fermer About';close.onclick=()=>dialog.close();
  const frame=document.createElement('iframe');frame.title='About NeuroForge';frame.setAttribute('sandbox','');frame.style.cssText='display:block;width:100%;height:65vh;border:0;margin-top:12px';dialog.append(close,frame);document.body.append(dialog);
  function apply(p){if(undo)undo();undo=applyNyx(p,document.documentElement,document.querySelector('.app-shell'));active=p;about.disabled=!p.modules.includes('about');reset.disabled=false;status.textContent='Actif : '+p.project.name+' · pack '+p.packVersion;}
  function clear(){localStorage.removeItem(KEY);if(undo)undo();undo=null;active=null;about.disabled=true;reset.disabled=true;status.textContent='Apparence précédente restaurée. Les données sont conservées.';}
  panel.querySelector('#nf-import').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>12000000)throw Error('12 Mo maximum.');const p=await decodeImages(parseProject(await f.text()));const old=localStorage.getItem(KEY);try{localStorage.setItem(KEY,JSON.stringify(p));apply(p);}catch(error){if(old===null)localStorage.removeItem(KEY);else localStorage.setItem(KEY,old);throw error;}}catch(error){status.textContent='Refusé : '+error.message;}e.target.value='';};
  about.onclick=()=>{frame.srcdoc=aboutHTML(active);dialog.showModal();};
  reset.onclick=()=>{try{clear();}catch(e){status.textContent=e.message;}};
  // Manual theme controls relinquish this adapter before their own handler runs.
  for(const el of document.querySelectorAll('#themeForm,.preset-row,#resetTheme'))el.addEventListener(el.id==='themeForm'?'input':'click',()=>{if(active)clear();},true);
  try{const raw=localStorage.getItem(KEY);if(raw){const p=parseProject(raw);decodeImages(p).then(()=>apply(p)).catch(e=>{status.textContent='Défaut conservé : '+e.message;});}}catch(e){status.textContent='Défaut conservé : '+e.message;}
}
