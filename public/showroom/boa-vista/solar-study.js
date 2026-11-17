function sunPosition(date, lat, lng){
  const rad=Math.PI/180, dayMs=864e5, J1970=2440588, J2000=2451545, e=rad*23.4397;
  const d = date.valueOf()/dayMs - 0.5 + J1970 - J2000;
  const M = rad*(357.5291 + 0.98560028*d);
  const L = M + rad*(1.9148*Math.sin(M) + 0.02*Math.sin(2*M) + 0.0003*Math.sin(3*M)) + rad*102.9372 + Math.PI;
  const dec = Math.asin(Math.sin(e)*Math.sin(L)), ra = Math.atan2(Math.sin(L)*Math.cos(e), Math.cos(L));
  const lw = rad*-lng, phi = rad*lat, H = rad*(280.16 + 360.9856235*d) - lw - ra;
  return { az: Math.atan2(Math.sin(H), Math.cos(H)*Math.sin(phi) - Math.tan(dec)*Math.cos(phi)),
           alt: Math.asin(Math.sin(phi)*Math.sin(dec) + Math.cos(phi)*Math.cos(dec)*Math.cos(H)) };
}
const $=id=>document.getElementById(id);
function update(){
 const date=$('date').value, hour=Number($('hour').value);if(!date)return;
 const dt=new Date(date+'T00:00:00-03:00');dt.setTime(dt.getTime()+hour*3600000);
 const p=sunPosition(dt,-29.3795,-50.8740),alt=p.alt*180/Math.PI,az=(p.az*180/Math.PI+540)%360;
 $('time').textContent=String(Math.floor(hour)).padStart(2,'0')+':'+String(Math.round((hour%1)*60)).padStart(2,'0');
 $('altitude').textContent=alt.toFixed(1)+'°';$('azimuth').textContent=az.toFixed(1)+'°';
 const rad=az*Math.PI/180; $('sun-dot').setAttribute('cx',150+95*Math.sin(rad));$('sun-dot').setAttribute('cy',150-95*Math.cos(rad));
 $('sun-dot').setAttribute('fill',alt>0?'#d8a34e':'#82918a');
 $('sun-ray').setAttribute('x2',150+95*Math.sin(rad));$('sun-ray').setAttribute('y2',150-95*Math.cos(rad));
 $('horizon').textContent=alt>0?'Sol acima do horizonte geométrico':'Sol abaixo do horizonte geométrico';
 $('caption').textContent='Direção geográfica do Sol. Esta bússola não está alinhada à planta da unidade 104.';
 $('month').value=Number(date.slice(5,7));
}
$('month').addEventListener('change',()=>{$('date').value='2026-'+String($('month').value).padStart(2,'0')+'-21';update()});
$('date').addEventListener('change',update);$('hour').addEventListener('input',update);
document.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{$('date').value=b.dataset.date;update()});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{$('plan').src=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)))});
update();
