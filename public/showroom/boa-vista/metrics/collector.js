(()=>{
const KEY='neo360-bv-metrics-v1', CONSENT='neo360-bv-metrics-choice-v1';
let enabled=false,row=null,last=performance.now(),active=null,ratios=new Map(),box=null;
const read=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[];}catch{return [];}};
function elapsed(){const now=performance.now();if(enabled&&row&&active&&document.visibilityState==='visible')row.sections[active]=Math.min(300,(row.sections[active]||0)+(now-last)/1000);last=now;}
function save(){if(!enabled||!row)return;try{const rows=read().filter(r=>r.id!==row.id);rows.push(row);localStorage.setItem(KEY,JSON.stringify(rows.slice(-300)));}catch{status.textContent='Medição indisponível: não foi possível salvar neste navegador.';}}
function track(k){if(!enabled||!row||!k)return;row.actions[k]=1;save();}
function begin(){enabled=true;row={id:crypto.randomUUID(),started:new Date().toISOString(),sections:{},actions:{},scroll:0,path:[]};last=performance.now();save();}
const status=document.createElement('span');
const footer=document.createElement('div');footer.style.cssText='max-width:1100px;margin:20px auto 110px;padding:16px;font:13px/1.5 system-ui;color:#355445';
footer.append(status);document.body.append(footer);
function ask(){box?.remove();box=document.createElement('div');box.className='med-aviso';box.setAttribute('role','region');box.setAttribute('aria-label','Medição da navegação');box.innerHTML='<p>Podemos registrar como você navega nesta apresentação: as seções que vê, o tempo em cada parte e o que abre. Assim o corretor que te enviou esta página sabe o que mais te interessou. Os dados ficam com o corretor e com a Neo360. Não registramos o que você digita. Você pode recusar.</p><div class="med-bts"><button data-choice="yes">Aceitar</button><button data-choice="no">Recusar / parar</button><button data-choice="clear">Apagar registros deste aparelho</button></div>';document.body.append(box);box.addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(!b)return;elapsed();save();enabled=false;row=null;try{localStorage.setItem(CONSENT,b.dataset.choice==='yes'?'yes':'no');if(b.dataset.choice==='clear')localStorage.removeItem(KEY);}catch{}if(b.dataset.choice==='yes')begin();status.textContent=enabled?'Medição ativa: o corretor vê como você navega nesta página.':'Medição desativada.';box.remove();box=null;});}
try{if(localStorage.getItem(CONSENT)==='yes')begin();else if(!localStorage.getItem(CONSENT))ask();}catch{ask();}
status.textContent=enabled?'Medição ativa: o corretor vê como você navega nesta página.':'Medição desativada.';
window.BVMetrics={track};
if('IntersectionObserver'in window){const obs=new IntersectionObserver(entries=>{elapsed();entries.forEach(e=>ratios.set(e.target,e.isIntersecting?e.intersectionRatio:0));const item=[...ratios].sort((a,b)=>b[1]-a[1])[0];active=item?.[1]>0?(item[0].getAttribute('aria-labelledby')||item[0].getAttribute('aria-label')||item[0].id):null;if(enabled&&active&&row.path.at(-1)!==active&&row.path.length<40)row.path.push(active);},{threshold:[0,.1,.3,.5,.8]});document.querySelectorAll('section').forEach(s=>obs.observe(s));}
setInterval(()=>{elapsed();save();},2000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){const now=performance.now();if(enabled&&row&&active)row.sections[active]=Math.min(300,(row.sections[active]||0)+(now-last)/1000);last=now;save();}else last=performance.now();});
window.addEventListener('pagehide',()=>{elapsed();save();});
window.addEventListener('scroll',()=>{if(!enabled)return;const h=document.documentElement.scrollHeight-innerHeight;row.scroll=Math.max(row.scroll,h>0?Math.min(100,Math.round(scrollY/h*100)):100);},{passive:true});
document.addEventListener('click',e=>{const t=e.target.closest('button,a,img,[role=button]');if(!t)return;const vis=t.closest('[data-vis]')?.dataset.vis;if(vis)track(vis==='apto3d'?'abriu_3d':vis==='maq'?'abriu_maquete':'abriu_planta');if(t.closest('.gc-card, img[data-zoom="aerial"]'))track('ampliou_foto');if(t.closest('.refplan,#v2d,#plan-compare'))track('abriu_planta');if(t.id==='export-data'&&typeof validProposal==='function'&&validProposal())track('exportou_rascunho');if(t.id==='add-vehicle')setTimeout(()=>track('veiculos_'+(1+document.querySelectorAll('.extra-vehicle').length)),0);if(t.closest('[data-dia]'))track('usou_sol');});
document.addEventListener('change',e=>{if(e.target.closest('#negociar'))track('mexeu_simulador');});document.querySelector('#hora')?.addEventListener('input',()=>track('usou_sol'));
})();
