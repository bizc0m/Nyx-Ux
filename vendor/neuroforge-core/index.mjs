// Shared data contract. No application actions, imported CSS, or executable assets.
export const SCHEMA = 'neuroforge/project/v1';
export const MODULES = ['theme', 'identity', 'languages', 'about', 'publication'];
export const PRESETS = {
  'nyx-core': {name:'NYX Core', appearance:'dark', background:'#07070B', surface:'#16161E', text:'#F2F2F5', muted:'#8E8E93', accent:'#64D2FF'},
  'neuro-forge': {name:'Neuro Forge', appearance:'dark', background:'#050505', surface:'#161616', text:'#F7F3EA', muted:'#B8B2A9', accent:'#B11226'},
  'signal-light': {name:'Signal Light', appearance:'light', background:'#EEF1F5', surface:'#FFFFFF', text:'#111827', muted:'#596170', accent:'#1447E6'},
};
export function newProject(id = 'mon-application') {
  return {schema:SCHEMA, packVersion:'0.1.0', project:{id, name:'Mon application', version:'0.1.0', repository:'', license:''}, modules:[...MODULES], defaultLocale:'fr', locales:['fr','en'], translations:{fr:{description:'',purpose:'',audience:'',limits:''},en:{description:'',purpose:'',audience:'',limits:''}}, theme:{...PRESETS['nyx-core'], typography:{family:'system',size:13}, density:'comfortable'}, identity:{logo:'',icon:'',signature:'FORGED FOR ATYPICAL THINKERS. THEN, GREAT RESULTS.'}};
}
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const hex = v => typeof v === 'string' && /^#[\da-f]{6}$/i.test(v);
const semver = v => typeof v === 'string' && /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(v);
const text = (v,max=4000) => typeof v === 'string' && v.length <= max;
function keys(v, allowed) { return object(v) && Object.keys(v).every(k=>allowed.includes(k)); }
export function contrast(a,b) {
  if (!hex(a)||!hex(b)) return 0;
  const luminance = h => [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
function validImage(v) {
  if(v==='') return true;
  if(typeof v!=='string'||v.length>5600000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(v)) return false;
  try { const b=atob(v.slice(22)); if(b.length>4194304||b.length<24||![137,80,78,71,13,10,26,10].every((n,i)=>b.charCodeAt(i)===n)||b.slice(12,16)!=='IHDR')return false;
    const u=i=>[0,1,2,3].reduce((n,j)=>n*256+b.charCodeAt(i+j),0);return u(16)>0&&u(16)<=4096&&u(20)>0&&u(20)<=4096;
  }catch{return false;}
}
export function validate(p) {
  const errors=[],warnings=[];
  if(!keys(p,['schema','packVersion','project','modules','defaultLocale','locales','translations','theme','identity'])) return {errors:['Configuration absente ou champs inconnus.'],warnings};
  if(p.schema!==SCHEMA) errors.push('Version de contrat inconnue.');
  if(!semver(p.packVersion)) errors.push('Version de pack attendue : 1.0.0.');
  if(!keys(p.project,['id','name','version','repository','license'])) errors.push('Identité projet invalide.');
  else {
    if(!text(p.project.id,48)||! /^[a-z0-9][a-z0-9-]*$/.test(p.project.id))errors.push('Identifiant : lettres minuscules, chiffres et tirets, 48 caractères maximum.');
    if(!text(p.project.name,64)||!p.project.name.trim())errors.push('Nom requis (64 caractères maximum).');
    if(!semver(p.project.version)) errors.push('Version application attendue : 1.0.0.');
    if(!text(p.project.license,100))errors.push('Licence invalide.');
    if(typeof p.project.repository!=='string'||(p.project.repository!==''&&!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(p.project.repository)))errors.push('Dépôt attendu : https://github.com/propriétaire/projet.');
  }
  if(!Array.isArray(p.modules)||p.modules.some(m=>!MODULES.includes(m))||new Set(p.modules).size!==p.modules.length) errors.push('Modules inconnus ou dupliqués.');
  if(!Array.isArray(p.locales)||!p.locales.length||p.locales.length>20||p.locales.some(l=>typeof l!=='string'||! /^[a-z]{2}(?:-[A-Z]{2})?$/.test(l))||new Set(p.locales).size!==p.locales.length||!p.locales.includes(p.defaultLocale))errors.push('Langues ou langue de repli invalides.');
  if(!object(p.translations)||!Array.isArray(p.locales)||Object.keys(p.translations).some(l=>!p.locales.includes(l)))errors.push('Traductions invalides.');
  else for(const l of p.locales) {
    const t=p.translations[l];
    if(!keys(t,['description','purpose','audience','limits'])||['description','purpose','audience','limits'].some(k=>!text(t[k])))errors.push(`Textes invalides : ${l}.`);
    else for(const k of ['description','purpose','audience','limits'])if(!t[k].trim())warnings.push(`${l} : ${k} manquant${l!==p.defaultLocale?' — repli '+p.defaultLocale:''}.`);
  }
  const t=p.theme;
  if(!keys(t,['name','appearance','background','surface','text','muted','accent','typography','density'])||!text(t?.name,64)||!['light','dark'].includes(t?.appearance)||!['background','surface','text','muted','accent'].every(k=>hex(t?.[k]))||!['comfortable','compact'].includes(t?.density)||!keys(t?.typography,['family','size'])||!['system','monospace'].includes(t?.typography?.family)||typeof t?.typography?.size!=='number'||!(t.typography.size>=11&&t.typography.size<=18))errors.push('Thème invalide : palette, police, taille ou densité.');
  else if(p.modules?.includes('theme'))for(const fg of ['text','muted'])for(const bg of ['background','surface'])if(contrast(t[fg],t[bg])<4.5)errors.push(`Contraste ${fg}/${bg} : ${contrast(t[fg],t[bg]).toFixed(2)} (minimum 4,5).`);
  if(!keys(p.identity,['logo','icon','signature'])||!validImage(p.identity?.logo)||!validImage(p.identity?.icon)||!text(p.identity?.signature,300))errors.push('Identité : PNG uniquement, maximum 4 Mio et 4096 × 4096 ; signature limitée à 300 caractères.');
  return {errors,warnings};
}
export function assertProject(p) {const v=validate(p);if(v.errors.length)throw Error(v.errors.join('\n'));return p;}
export function parseProject(raw) {if(typeof raw!=='string'||raw.length>12000000)throw Error('Fichier trop volumineux (12 Mo maximum).');return assertProject(JSON.parse(raw));}
export function localized(p,locale) {
  const chosen=p.modules.includes('languages')&&p.locales.includes(locale)?locale:p.defaultLocale;
  return Object.fromEntries(['description','purpose','audience','limits'].map(k=>[k,p.translations[chosen]?.[k]?.trim()||p.translations[p.defaultLocale]?.[k]?.trim()||'—']));
}
const escapeHTML=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const escapeMD=v=>String(v).replace(/[\\`*_[\]<>#]/g,'\\$&');
export function publicationReady(p) {
  assertProject(p);const missing=[];
  if(!p.project.repository)missing.push('Dépôt GitHub');if(!p.project.license.trim())missing.push('Licence');
  for(const k of ['description','purpose','audience','limits'])if(!p.translations[p.defaultLocale][k].trim())missing.push(k);
  if(missing.length)throw Error('Compléter avant export public : '+missing.join(', '));
}
export function themeCSS(p) {assertProject(p);if(!p.modules.includes('theme'))return '';const t=p.theme;return `:root {\n${['background','surface','text','muted','accent'].map(k=>`  --nf-${k}: ${t[k]};`).join('\n')}\n  --nf-font: ${t.typography.family==='system'?'system-ui, sans-serif':'ui-monospace, monospace'};\n  --nf-size: ${t.typography.size}px;\n  --nf-space: ${t.density==='compact'?'8':'16'}px;\n}`;}
export function aboutHTML(p,locale=p.defaultLocale) {
  assertProject(p);locale=p.modules.includes('languages')&&p.locales.includes(locale)?locale:p.defaultLocale;if(!p.modules.includes('about'))throw Error('Module About désactivé.');
  const tr=localized(p,locale),en=locale.startsWith('en'),id=p.modules.includes('identity'),t=p.modules.includes('theme')?p.theme:PRESETS['signal-light'];
  return `<!doctype html><html lang="${escapeHTML(locale)}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escapeHTML(p.project.name)}</title><style>body{margin:0;padding:${p.modules.includes('theme')&&p.theme.density==='compact'?16:32}px;background:${t.background};color:${t.text};font:${p.modules.includes('theme')?p.theme.typography.size:16}px/1.6 ${p.modules.includes('theme')&&p.theme.typography.family==='monospace'?'ui-monospace,monospace':'system-ui,sans-serif'}}main{max-width:680px;margin:auto}img{width:80px;height:80px;object-fit:contain}p{white-space:pre-wrap}a{color:inherit}small{color:${t.muted}}</style><main>${id&&p.identity.logo?`<img alt="Logo" src="${p.identity.logo}">`:''}<h1>${escapeHTML(p.project.name)}</h1><p>${escapeHTML(tr.description)}</p><h2>${en?'Purpose':'Usage'}</h2><p>${escapeHTML(tr.purpose)}</p><h2>${en?'For':'Public'}</h2><p>${escapeHTML(tr.audience)}</p><h2>${en?'Limits':'Limites'}</h2><p>${escapeHTML(tr.limits)}</p><small>Version ${escapeHTML(p.project.version)} · ${escapeHTML(p.project.license||'Licence à renseigner')}</small>${p.project.repository?`<p><a href="${escapeHTML(p.project.repository)}" rel="noreferrer">GitHub</a></p>`:''}${id?`<p>${escapeHTML(p.identity.signature)}</p>`:''}</main></html>`;
}
export function readme(p,locale=p.defaultLocale) {publicationReady(p);if(!p.modules.includes('publication'))throw Error('Module publication désactivé.');const t=localized(p,locale);return `# ${escapeMD(p.project.name)}\n\n${escapeMD(t.description)}\n\n## ${locale.startsWith('en')?'Purpose':'Usage'}\n\n${escapeMD(t.purpose)}\n\n## ${locale.startsWith('en')?'Audience':'Public'}\n\n${escapeMD(t.audience)}\n\n## ${locale.startsWith('en')?'Limits':'Limites'}\n\n${escapeMD(t.limits)}\n\nVersion : ${escapeMD(p.project.version)}\n\nLicence : ${escapeMD(p.project.license)}\n\n[Dépôt GitHub](${p.project.repository})\n${p.modules.includes('identity')?'\n'+escapeMD(p.identity.signature)+'\n':''}`;}
export function siteHTML(p,locale=p.defaultLocale) {publicationReady(p);if(!p.modules.includes('publication'))throw Error('Module publication désactivé.');return aboutHTML({...p,modules:[...new Set([...p.modules,'about'])]},locale);}
export function noteMistressPack(p) {assertProject(p);if(!p.modules.includes('theme'))throw Error('Module thème désactivé.');const t=p.theme;return {schemaVersion:1,id:p.project.id,name:p.project.name,requiredCapabilities:['palette','typography','density'],appearance:t.appearance,palette:Object.fromEntries(['background','surface','text','muted','accent'].map(k=>[k,t[k]])),typography:t.typography,density:t.density};}
// Scoped adapter: only presentation tokens; never state colors or sidebar geometry.
export function applyNyx(p,root,shell) {
  assertProject(p);const changes=[],before=shell.getAttribute('data-density');
  const map={background:'--ink-0',surface:'--ink-1',text:'--bone-0',muted:'--bone-2',accent:'--accent'};
  if(p.modules.includes('theme')){const values=Object.fromEntries(Object.entries(map).map(([k,v])=>[v,p.theme[k]]));Object.assign(values,{'--ink-2':p.theme.surface,'--ink-3':p.theme.surface,'--ink-4':p.theme.muted,'--bone-1':p.theme.text,'--bone-3':p.theme.muted,'--accent-soft':p.theme.accent+'22'});for(const [v,value]of Object.entries(values)){changes.push([v,root.style.getPropertyValue(v),root.style.getPropertyPriority(v)]);root.style.setProperty(v,value);}shell.setAttribute('data-density',p.theme.density==='compact'?'2':'1');}
  return ()=>{for(const [k,v,priority]of changes){if(v)root.style.setProperty(k,v,priority);else root.style.removeProperty(k);}if(before===null)shell.removeAttribute('data-density');else shell.setAttribute('data-density',before);};
}
export async function decodeImages(p) {for(const value of [p.identity.logo,p.identity.icon]){if(!value)continue;const img=new Image();img.src=value;await img.decode();if(!img.naturalWidth||img.naturalWidth>4096||img.naturalHeight>4096)throw Error('Image non décodable ou dimensions excessives.');}return p;}
