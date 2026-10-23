/* ============ BẢNG KÊ (cuối tháng) ============ */
const STMT_TZ={JP:2,KR:2,SG:1,MY:1,HK:1,MO:1,TW:1,CN:1,PH:1,AU:3,TH:0,KH:0,LA:0,ID:0,VN:0,IN:-1.5,AE:-3};
const STMT_STATUS=['Nháp','Đã gửi','Đã chốt'];
const STMT_TONE={'Nháp':'mute','Đã gửi':'info','Đã chốt':'ok'};
const stRules=()=>{const r=RUL();return{minPct:+r.minPct||50,minMb:+r.minMb||10,act:+r.actFee||130000}};
const stSegOn=l=>l.pl!=='Tháng'&&!!l.s&&!!l.e&&(!!l.unused||stSegDays(l).length>0);
const stSegDays=l=>{if(l.pl==='Tháng'||!l.segs||!l.segs.length||!l.s||!l.e)return[];const set=new Set();l.segs.forEach(g=>{if(!g||!g.a||!g.b||g.b<g.a)return;stList(g.a,g.b).forEach(d=>{if(d>=l.s&&d<=l.e)set.add(d)})});return[...set].sort()};
const stSegQ=g=>Math.max(1,Math.round(+g.q||1));
const stSegUnits=l=>{if(l.pl==='Tháng'||!l.segs||!l.s||!l.e)return 0;let n=0;l.segs.forEach(g=>{if(!g||!g.a||!g.b||g.b<g.a)return;stList(g.a,g.b).forEach(d=>{if(d>=l.s&&d<=l.e)n+=stSegQ(g)})});return n};
const stSegText=l=>(l.segs||[]).filter(g=>g&&g.a&&g.b&&g.b>=g.a).map(g=>(g.a===g.b?fmtD(g.a):fmtD(g.a)+' – '+fmtD(g.b))+(stSegQ(g)>1?' (×'+stSegQ(g)+' gói)':'')).join(', ');
const stList=(a,b)=>{const o=[];if(!a||!b)return o;let d=a,n=0;while(d<=b&&n<800){o.push(d);d=addDays(d,1);n++}return o};
const stImei=x=>String(x||'').replace(/\D/g,'').slice(-15);
const stDt=(d,t)=>{let dd=d;const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);if(m)dd=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');let tt=t;if(/^\d{1,2}:\d{2}$/.test(tt))tt+=':00';const p=tt.split(':');tt=p[0].padStart(2,'0')+':'+p[1]+':'+p[2];return dd+' '+tt};
function stParseUsage(txt){
  const re=/(\d{14,16})\D{1,8}(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})[ T]+(\d{1,2}:\d{2}(?::\d{2})?)\D{1,8}(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})[ T]+(\d{1,2}:\d{2}(?::\d{2})?)[^A-Za-z0-9]{0,8}([A-Za-z]{2,3})\b[^\d\-]{0,14}(\d+(?:[.,]\d+)?)/g;
  const out=[];let m;
  while((m=re.exec(String(txt||'')))){
    const mbs=m[7];const mb=parseFloat(mbs.indexOf('.')<0&&mbs.indexOf(',')>=0?mbs.replace(',','.'):mbs.replace(/,/g,''));
    out.push({i:stImei(m[1]),s:stDt(m[2],m[3]),e:stDt(m[4],m[5]),c:m[6].toUpperCase(),mb:isNaN(mb)?0:mb});
  }
  return out;
}
const stMerge=(cur,add)=>{const k=g=>g.i+'|'+g.s+'|'+g.e;const seen=new Set(cur.map(k));const r=cur.slice();let n=0;add.forEach(g=>{if(!seen.has(k(g))){seen.add(k(g));r.push(g);n++}});r.sort((a,b)=>a.i<b.i?-1:a.i>b.i?1:a.s<b.s?1:-1);return{list:r,added:n}};
function stRate(l,c){
  if(!c||c===l.c)return +l.price||0;
  const p=prices().filter(x=>x.active!==false&&(x.kind==='Wifi device'||x.kind==='Wifi device insert sim')&&x.c===c&&x.unit==='Ngày');
  if(!p.length)return +l.price||0;
  const same=p.find(x=>x.pkg===l.pkg);return +(same||p.slice().sort((a,b)=>a.price-b.price)[0]).price;
}
/* gán từng ngày sử dụng (giờ Việt Nam) cho dòng thuê của máy */
function stUsageMap(lines,logs){
  const R=stRules();const out={};const byImei={};
  (logs||[]).forEach(g=>{(byImei[g.i]=byImei[g.i]||[]).push(g)});
  const grp={};lines.forEach(l=>{if(l.inc===false||l.pl==='Tháng')return;const im=stImei(l.imei);(grp[im]=grp[im]||[]).push(l)});
  Object.keys(grp).forEach(im=>{
    const ls=grp[im].slice().sort((a,b)=>(a.s||'')<(b.s||'')?-1:1);
    const logsI=byImei[im]||[];
    ls.forEach(l=>{out[l.key]={has:logsI.length>0,used:[],extra:[],ignored:0,dc:{}}});
    const days={};
    logsI.forEach(g=>{if(!(g.mb>=R.minMb))return;let d=g.s.slice(0,10);const e=g.e.slice(0,10);let n=0;while(d<=e&&n<400){(days[d]=days[d]||new Set()).add(g.c);d=addDays(d,1);n++}});
    Object.keys(days).sort().forEach(d=>{
      let tgt=ls.find(l=>l.s&&l.e&&l.s<=d&&d<=l.e);let ex=false;
      if(!tgt){const prev=ls.filter(l=>l.e&&l.e<d);tgt=prev.length?prev[prev.length-1]:null;
        if(!tgt||d>addDays(tgt.e,14)){const u0=out[(tgt||ls[0]).key];u0.ignored++;return}ex=true}
      const u=out[tgt.key];(ex?u.extra:u.used).push(d);u.dc[d]=[...days[d]];
    });
  });
  return out;
}
function stCalc(l,u,vatPct){
  const R=stRules();
  if(l.pl==='Tháng'){const n=Math.max(1,+l.nm||1);const base=Math.round((+l.price||0)*n*Math.max(1,Math.round(+l.qty||1)));const disc=Math.round(base*(+l.dpct||0)/100);const ex=base-disc+(+l.ins||0)+(+l.ship||0)+(+l.other||0);const vat=Math.round(ex*(+vatPct||0)/100);
    return{reg:n,usedN:null,extraN:0,mode:'reg',days:n,base,disc,other:+l.other||0,sug:0,ex,vat,total:ex+vat,price:+l.price||0,minD:0,has:false,month:true}}
  const reg=(l.s&&l.e)?stList(l.s,l.e).length:(+l.days||0);
  const sd=l.unused?[]:stSegDays(l);
  if(stSegOn(l)){
    const qn=Math.max(1,Math.round(+l.qty||1));const units=l.unused?0:stSegUnits(l);const base=Math.round((+l.price||0)*units*qn);const minD=Math.round(reg*R.minPct/100);
    const hold=sd.length===0?'all':(sd.length*100<reg*R.minPct?'flat':'');
    const sug=hold==='all'?reg*R.act:hold==='flat'?R.act:0;const other=l.om?(+l.other||0):sug;
    const disc=Math.round(base*(+l.dpct||0)/100);const ex=base-disc+(+l.ins||0)+(+l.ship||0)+other;const vat=Math.round(ex*(+vatPct||0)/100);
    return{reg,usedN:sd.length,extraN:0,mode:'seg',days:units,units,base,disc,other,sug,ex,vat,total:ex+vat,price:+l.price||0,minD,has:true,seg:true,hold};
  }
  const has=!!(u&&u.has);const mode=l.mode||(has?'actual':'reg');
  const rateOf=d=>{const cs=(u&&u.dc&&u.dc[d])||[];return cs.length?Math.max.apply(null,cs.map(c=>stRate(l,c))):(+l.price||0)};
  let rates=[];
  if(mode==='actual'&&has){rates=[].concat(u.used,u.extra).sort().map(rateOf)}
  else{const win=stList(l.s,l.e);rates=win.map(rateOf);if(has)u.extra.forEach(d=>rates.push(rateOf(d)));if(!win.length&&reg)rates=Array(reg).fill(+l.price||0)}
  const qn=Math.max(1,Math.round(+l.qty||1));const days=rates.length;const base=Math.round(rates.reduce((a,b)=>a+b,0)*qn);
  const minD=Math.round(reg*R.minPct/100);
  const sug=has&&reg>0&&u.used.length<minD?R.act:0;
  const other=l.om?(+l.other||0):sug;
  const disc=Math.round(base*(+l.dpct||0)/100);
  const ex=base-disc+(+l.ins||0)+(+l.ship||0)+other;
  const vat=Math.round(ex*(+vatPct||0)/100);
  return{reg,usedN:has?u.used.length:null,extraN:has?u.extra.length:0,mode,days,base,disc,other,sug,ex,vat,total:ex+vat,price:days?Math.round(base/days/qn):(+l.price||0),minD,has};
}
const stMonth=n=>{let y=+TODAY.slice(0,4),m=+TODAY.slice(5,7)+n;while(m<1){m+=12;y--}while(m>12){m-=12;y++}const f=y+'-'+String(m).padStart(2,'0')+'-01';return[f,addDays(addMonths(f,1),-1)]};
const stInStmt=()=>{const set=new Set();Object.values(LV('statements')).forEach(v=>(v.lines||[]).forEach(x=>set.add(x.key)));return set};
/* các dòng thuê chưa lập hóa đơn và chưa vào bảng kê nào, gom theo khách */
function stPending(){
  const used=stInStmt();const m={};
  ORD.forEach(o=>o.lines.forEach((l,i)=>{if(!isPhys(l)||!l.s||!l.e||l.inv||l.e>=TODAY)return;if(used.has(o.code+'|'+i))return;
    const g=m[o.cus]||(m[o.cus]={cus:o.cus,items:[]});g.items.push({o,l,i})}));
  return m;
}
function stRange(kind,cus){
  if(kind==='cur')return stMonth(0);
  if(kind==='prev')return stMonth(-1);
  const g=stPending()[cus];const ds=g?g.items.map(x=>x.l.s).sort():[];
  return ds.length?[ds[0],ds[ds.length-1]]:stMonth(-1);
}
const stSvc=l=>{const dst=CTRY[l.c]||l.c||'';return l.pl==='Tháng'?`Thuê 1 bộ phát Wifi sử dụng tại ${dst} ${l.nm||1} tháng, từ ${fmtD(l.s)} đến ${fmtD(l.e)}`:`Thuê 1 bộ phát Wifi sử dụng tại ${dst} từ ${fmtD(l.s).replace(/\/0/g,'/').replace(/^0/,'')} đến ngày ${fmtD(l.e).replace(/\/0/g,'/').replace(/^0/,'')}`};

/* ---- form lập bảng kê ---- */
function statementForm(id,pre){
  const d=id?LV('statements')[id]:null;
  const per=()=>{const dd=+TODAY.slice(8);let y=+TODAY.slice(0,4),m=+TODAY.slice(5,7);if(dd<=10){m--;if(m<1){m=12;y--}}const f=y+'-'+String(m).padStart(2,'0')+'-01';return[f,addDays(addMonths(f,1),-1)]};
  const pp=per();
  const s=d?Object.assign({err:[],paste:''},clone(d)):Object.assign({cus:'',from:pp[0],to:pp[1],date:TODAY,vat:10,signer:'',note:'',status:'Nháp',lines:[],usage:[],paste:'',err:[]},pre||{});
  s.lines.forEach(l=>{if(l.inc==null)l.inc=true});
  const collect=()=>{
    if(!s.cus){if(!id)s.lines=[];return}
    const keep={};s.lines.forEach(l=>{keep[l.key]=l});
    const other=new Set();Object.keys(LV('statements')).forEach(k=>{if(k===id)return;(LV('statements')[k].lines||[]).forEach(x=>other.add(x.key))});
    const list=[];
    ORD.filter(o=>o.cus===s.cus).forEach(o=>o.lines.forEach((l,i)=>{
      if(!isPhys(l)||!l.s||!l.e)return;if(!(l.s>=s.from&&l.s<=s.to)||(l.e>=s.date&&!keep[o.code+'|'+i]))return;
      const key=o.code+'|'+i;if(other.has(key)||(l.inv&&!keep[key]))return;
      if(keep[key]){list.push(keep[key]);return}
      list.push({key,ord:o.code,dev:l.dev,imei:(DEVS[l.dev]||{}).imei||'',user:l.user||'',c:l.c,pkg:l.pkg||'',del:l.del||o.date,s:l.s,e:l.e,price:+l.price||0,qty:Math.max(1,Math.round(+l.qty||1)),dpct:+l.dpct||0,ins:+l.ins||0,ship:+l.fee||0,other:+l.holdFee||0,om:!!l.holdFee,imgs:[],mode:'',note:'',inc:true,pl:l.months?'Tháng':'Ngày',nm:l.months?(+l.days||1):1});
    }));
    if(id)s.lines.forEach(l=>{if(!list.find(x=>x.key===l.key))list.push(l)});
    list.sort((a,b)=>(a.del||'')<(b.del||'')?-1:(a.del||'')>(b.del||'')?1:a.key<b.key?-1:1);
    s.lines=list;
  };
  if(!id&&s.cus&&!s.lines.length)collect();
  const calcAll=()=>{const um=stUsageMap(s.lines,s.usage);const rs={};s.lines.forEach(l=>{rs[l.key]=stCalc(l,um[l.key],s.vat)});return{um,rs}};
  const f={s,
    render(){
      const {um,rs}=calcAll();
      const imeis={};s.usage.forEach(g=>{const x=imeis[g.i]||(imeis[g.i]={n:0,mb:0,a:g.s,b:g.e});x.n++;x.mb+=g.mb;if(g.s<x.a)x.a=g.s;if(g.e>x.b)x.b=g.e});
      const cards=s.lines.map((l,i)=>`<div class="ln stl${l.inc?'':' off'}"><div class="ln-h stlh"><label class="ck" aria-label="Đưa đơn ${esc(l.ord)} vào bảng kê"><input type="checkbox" data-k="lines.${i}.inc" data-t="bool"${l.inc?' checked':''}></label><button type="button" class="linkbtn mono stgo" data-act="stgoorder" data-id="${esc(l.ord)}" title="Mở đơn để xem hoặc chỉnh sửa">${esc(l.ord)} <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg></button><span><b>${esc(l.dev)}</b> <span class="muted">${esc(l.imei||'chưa có IMEI')}</span> · ${esc(CTRY[l.c]||l.c||'')}${l.user?' · '+esc(l.user):''}</span></div>
        ${l.inc?`<div class="calc" id="sc_${i}"></div>
        <div class="stro"><div class="stro-h"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><b>Chi tiết đơn</b><span class="muted">lấy từ đơn hàng, không sửa tại đây</span><span class="stro-p">${fmtD(l.s)} → ${fmtD(l.e)}${l.s&&l.e&&l.pl!=='Tháng'?' · '+stList(l.s,l.e).length+' ngày':''}</span></div><div class="strg"><div><span>${l.pl==='Tháng'?'Đơn giá/tháng':'Đơn giá/ngày'}</span><b>${vnd(l.price)}</b></div><div><span>Số lượng</span><b>${+l.qty||1}</b></div><div><span>Giảm giá</span><b>${+l.dpct||0}%</b></div><div><span>Bảo hiểm</span><b>${vnd(l.ins)}</b></div><div><span>Phí ship</span><b>${vnd(l.ship)}</b></div></div></div>
        ${l.pl==='Tháng'?'':`<div class="stseg"><label class="ck" style="margin-bottom:8px"><input type="checkbox" data-k="lines.${i}.unused" data-t="bool"${l.unused?' checked':''}> Khách không dùng ngày nào (tính phí giữ máy cả kỳ)</label><div class="sm"><b>Thời gian sử dụng thực tế</b> <span class="muted">· để trống = tính đủ ${l.s&&l.e?stList(l.s,l.e).length:''} ngày đăng ký. Khách nghỉ giữa chừng thì nhập từng khoảng đã dùng. Ngày khách đăng ký nhiều gói thì thêm một khoảng cho ngày đó và nhập số lượng gói.</span></div>${l.unused?'':(l.segs||[]).map((g,j)=>`<div class="stsr">${F(`lines.${i}.segs.${j}.a`,'Từ ngày',{t:'date'})}${F(`lines.${i}.segs.${j}.b`,'Đến ngày',{t:'date'})}${F(`lines.${i}.segs.${j}.q`,'Số lượng gói',{t:'num'})}<button type="button" class="btn sm danger" data-act="stsegdel" data-id="${i}|${j}">Xóa</button></div>`).join('')}<button type="button" class="btn sm" data-act="stsegadd" data-id="${i}"${l.unused?' disabled':''}>+ Thêm khoảng ngày dùng</button></div>`}
        <div class="stfee">${F(`lines.${i}.other`,'Phí giữ máy (nếu phát sinh)',{t:'money'})}<button type="button" class="btn sm" data-act="stfee" data-id="${i}">+ Thêm ${vnd(stRules().act)} đ theo quy định</button></div>
        <div class="pz" tabindex="0" data-pz="${i}"><b>📷 Gắn hình ảnh cho đơn này</b> · dán ảnh chụp màn hình (Ctrl+V) ở bất kỳ đâu trong form, kéo thả ảnh vào đây <span class="muted">hoặc</span> <label class="linkbtn">chọn file<input type="file" accept="image/*" multiple hidden data-stimg="${i}"></label></div>
        ${(l.imgs&&l.imgs.length)?`<div class="pzl">${l.imgs.map((m,j)=>`<div class="pzi"><img src="${m}" alt="Ảnh ${j+1}"><button type="button" class="pzx" data-act="stimgdel" data-id="${i}|${j}" aria-label="Xóa ảnh">×</button></div>`).join('')}</div>`:''}`:''}</div>`).join('');
      const tbl='';void Object.keys(imeis).map(k=>{const x=imeis[k];const dv=s.lines.find(l=>stImei(l.imei)===k);return `<tr><td class="mono">${esc(k)}</td><td>${dv?esc(dv.dev):'<span class="muted">Chưa khớp máy nào trong kỳ</span>'}</td><td class="num">${x.n}</td><td>${esc(x.a.slice(0,16))} → ${esc(x.b.slice(0,16))}</td><td class="num">${vnd(x.mb)} MB</td></tr>`}).join('');
      return `<div class="form">${formTop(id?'Sửa bảng kê':'Lập bảng kê',id?esc(d.no):'Chọn Tháng này / Tháng trước, hệ thống tự gom các đơn chưa lập hóa đơn của khách.')}${ferr(s)}
      <div class="fs"><h3>1. Khách hàng và kỳ bảng kê</h3><div class="fg">${F('cus','Khách hàng',{opts:custOpts(),cls:'w2',dis:!!id})}${F('date','Ngày lập',{t:'date'})}${F('signer','Người lập',{opts:signerOpts(),cls:'w2'})}${F('vat','VAT (%)',{opts:[[10,'10%'],[8,'8%'],[0,'0%']],num:true})}</div>
        <div class="stper"><span class="muted">Lấy các đơn chưa lập hóa đơn phát sinh trong:</span><div class="seg"><button type="button" data-act="stper" data-id="cur">Tháng này</button><button type="button" data-act="stper" data-id="prev">Tháng trước</button><button type="button" data-act="stper" data-id="all">Dồn tất cả</button></div></div>
        <div class="fg" style="margin-top:8px">${F('from','Từ ngày',{t:'date'})}${F('to','Đến ngày',{t:'date'})}</div></div>
      <div class="fs"><h3>2. Các đơn hàng trong bảng kê ${s.lines.length?'('+s.lines.filter(l=>l.inc).length+'/'+s.lines.length+' đơn)':''}</h3>${cards||`<div class="muted">${s.cus?'Không có đơn hàng nào của khách này cần lập bảng kê trong kỳ (hoặc đã nằm trong bảng kê khác).':'Chọn khách hàng để lấy các đơn thuê trong kỳ.'}</div>`}</div>
      <div class="fs"><div class="fg">${F('note','Ghi chú chung',{cls:'wall'})}</div></div>
      <div class="note info" id="stt_box"></div>
      ${fbar('',id?'Lưu bảng kê':'Tạo bảng kê')}</div>`;
    },
    after(){f.live()},
    live(){
      const {um,rs}=calcAll();
      s.lines.forEach((l,i)=>{if(l.inc&&!l.om){const r0=rs[l.key];const v=r0?+r0.sug||0:0;if((+l.other||0)!==v){l.other=v;const el=document.querySelector('[data-k="lines.'+i+'.other"]');if(el&&document.activeElement!==el)el.value=v?vnd(v):''}}});
      s.lines.forEach((l,i)=>{const n=$('sc_'+i);if(!n||!l.inc)return;const r=rs[l.key];const u=um[l.key]||{};
        let t=`<span>Đăng ký <b>${r.reg}</b> ${r.month?'tháng':'ngày'}</span>`;
        if(r.seg)t+=`<span>Dùng thực tế <b>${r.usedN}</b> ngày${r.usedN?' ('+esc(stSegText(l))+')':''}</span>`;
        else if(r.has)t+=`<span>Dùng thực tế <b>${r.usedN}</b>${r.extraN?` · quá hạn <b>${r.extraN}</b>`:''}${u.ignored?` · bỏ qua ${u.ignored} ngày ngoài kỳ`:''}</span>`;
        t+=`<span>Tính <b>${r.days}</b> ${r.month?'tháng':'ngày'}${r.seg&&r.days!==r.usedN?' (quy đổi theo số gói)':''} × ${vnd(r.price)} = <b>${vnd(r.base)}</b></span>`;
        if(r.hold==='all'&&!l.om)t+=`<span class="warn">Khách không dùng ngày nào → phí giữ máy ${r.reg} ngày × ${vnd(stRules().act)} = ${vnd(r.sug)}, không tính tiền thuê. Sửa ô "Phí giữ máy" để đổi.</span>`;
        else if(r.hold==='flat'&&!l.om)t+=`<span class="warn">Dùng dưới ${stRules().minPct}% (${r.usedN}/${r.reg} ngày) → tính ${r.usedN} ngày thực tế cộng phí giữ máy ${vnd(r.sug)}. Sửa ô "Phí giữ máy" để đổi.</span>`;
        else if(r.sug&&!l.om)t+=`<span class="warn">Dùng dưới ${stRules().minPct}% (${r.usedN}/${r.reg} ngày, cần ≥ ${r.minD}) → tự tính phí giữ máy ${vnd(r.sug)}. Sửa ô "Phí giữ máy" để đổi.</span>`;
        else if(r.other)t+=`<span>Phí giữ máy <b>${vnd(r.other)}</b></span>`;
        t+=`<span>Chưa VAT <b>${vnd(r.ex)}</b> · Gồm VAT <b>${vnd(r.total)}</b></span>`;
        n.innerHTML=t});
      const inc=s.lines.filter(l=>l.inc);const b=$('stt_box');
      if(b)b.innerHTML=`Tổng cộng ${inc.length} đơn · chưa VAT <b>${vnd(sum(inc,l=>rs[l.key].ex))}</b> · VAT <b>${vnd(sum(inc,l=>rs[l.key].vat))}</b> · gồm VAT <b>${vnd(sum(inc,l=>rs[l.key].total))} đ</b>`;
    },
    onChange(k){if(k==='cus'||k==='from'||k==='to')collect();rerender()},
    onInput(k){const m=k.match(/^lines\.(\d+)\.(\w+)$/);if(m&&m[2]==='other')s.lines[+m[1]].om=true;if(k==='paste')return;f.live()},
    impText(){const g=stParseUsage(s.paste);if(!g.length){s.err=['Không nhận ra dòng dữ liệu nào. Mỗi dòng cần: IMEI, giờ bắt đầu, giờ kết thúc, mã nước, dung lượng (MB).'];rerender();return}
      const r=stMerge(s.usage,g);s.usage=r.list;s.paste='';s.err=[];toast('Đã nhập '+r.added+' phiên sử dụng');rerender()},
    clearUsage(){s.usage=[];rerender()},
    addFee(i){const l=s.lines[i];if(l){l.other=(+l.other||0)+stRules().act;l.om=true;rerender()}},
    async addImgs(i,files){const l=s.lines[i];if(!l)return;l.imgs=l.imgs||[];let n=0;for(const f of files){if(!/^image\//.test(f.type))continue;try{l.imgs.push(await stImg(f));n++}catch(e){}}if(n){s.err=[];rerender();toast('Đã thêm '+n+' ảnh')}},
    delImg(i,j){const l=s.lines[i];if(l&&l.imgs){l.imgs.splice(j,1);rerender()}},
    segAdd(i){const l=s.lines[i];if(!l)return;l.segs=l.segs||[];l.segs.push(l.segs.length?{a:'',b:'',q:1}:{a:l.s,b:l.e,q:1});l.open=true;rerender()},
    segDel(i,j){const l=s.lines[i];if(l&&l.segs){l.segs.splice(j,1);rerender()}},
    refreshLines(){
      s.lines=s.lines.map(l=>{const p=String(l.key).split('|');const o=ORD.find(q=>q.code===p[0]);const x=o&&o.lines[+p[1]];if(!x)return null;
        return Object.assign(l,{dev:x.dev,imei:(DEVS[x.dev]||{}).imei||'',user:x.user||'',c:x.c,pkg:x.pkg||'',del:x.del||o.date,s:x.s,e:x.e,price:+x.price||0,qty:Math.max(1,Math.round(+x.qty||1)),dpct:+x.dpct||0,ins:+x.ins||0,ship:+x.fee||0,pl:x.months?'Tháng':'Ngày',nm:x.months?(+x.days||1):1})}).filter(Boolean);
    },
    toggleOpen(i){const l=s.lines[i];if(l){l.open=!l.open;rerender()}},
    setPer(k){if(!s.cus){s.err=['Chọn khách hàng trước.'];rerender();return}const r=stRange(k,s.cus);s.from=r[0];s.to=r[1];s.err=[];collect();rerender()},
    async setFile(file){
      if(!file)return;
      try{
        let txt='';
        if(/\.xlsx?$/i.test(file.name)){
          if(!window.XLSX){s.err=['Chưa tải được thư viện Excel. Hãy dán dữ liệu vào ô bên trên hoặc dùng file CSV.'];rerender();return}
          const wb=XLSX.read(new Uint8Array(await file.arrayBuffer()),{type:'array',cellDates:false});
          txt=wb.SheetNames.map(n=>XLSX.utils.sheet_to_csv(wb.Sheets[n],{FS:'\t',RS:'\n',rawNumbers:false})).join('\n');
        }else txt=await file.text();
        const g=stParseUsage(txt);
        if(!g.length){s.err=['Không nhận ra dòng dữ liệu nào trong file '+file.name+'.'];rerender();return}
        const r=stMerge(s.usage,g);s.usage=r.list;s.err=[];toast('Đã nhập '+r.added+' phiên từ '+file.name);rerender();
      }catch(e){s.err=['Không đọc được file.'];rerender()}
    },
    async submit(){
      const err=[];const inc=s.lines.filter(l=>l.inc);
      if(!s.cus)err.push('Chọn khách hàng.');if(!s.from||!s.to||s.to<s.from)err.push('Chọn kỳ bảng kê hợp lệ.');
      if(s.cus&&!inc.length)err.push('Chọn ít nhất một máy trong kỳ.');
      if(err.length){s.err=err;rerender();return}
      if(sum(inc,l=>(l.imgs||[]).join('').length)>900000){s.err=['Ảnh đính kèm quá nặng, hãy xóa bớt hoặc chụp vùng nhỏ hơn.'];rerender();return}
      const um=stUsageMap(s.lines,s.usage);
      const lines=inc.map(l=>{const r=stCalc(l,um[l.key],s.vat);return Object.assign({},l,{other:r.other,om:true,r,ud:(um[l.key]||{}).used||[],ux:(um[l.key]||{}).extra||[]})});
      const imset=new Set(lines.map(l=>stImei(l.imei)));
      const usage=s.usage.filter(g=>imset.has(g.i));
      const doc={no:d?d.no:nextNo('BK','statements'),cus:s.cus,from:s.from,to:s.to,date:s.date,vat:+s.vat,status:s.status||'Nháp',signer:s.signer||'',sg:signSnap(s.signer),note:s.note||'',lines,usage,
        ex:sum(lines,l=>l.r.ex),vatAmt:sum(lines,l=>l.r.vat),total:sum(lines,l=>l.r.total),created:d?d.created:TODAY};
      const sid=id||uid('k');
      try{await save('statements',sid,doc)}catch(e){return}
      closeDrawer();toast('Đã lưu bảng kê '+doc.no);
      setTimeout(()=>openView(()=>docDrawer('statement',sid)),60);
    }};
  return f;
}

/* ---- bản in / xem bảng kê ---- */
/* mỗi đơn tách thành các dòng theo khoảng ngày sử dụng thực tế; bảo hiểm, ship, phí giữ máy ghi ở dòng đầu */
function stParts(l,r,vatPct){
  const v=+vatPct||0;const qn=Math.max(1,Math.round(+l.qty||1));const dp=+l.dpct||0;
  const segs=r.seg&&!l.unused?(l.segs||[]).filter(g=>g&&g.a&&g.b&&g.b>=g.a).map(g=>({g,n:stList(g.a,g.b).filter(x=>x>=l.s&&x<=l.e).length})).filter(x=>x.n>0):[];
  let out;
  if(r.seg&&segs.length)out=segs.map(x=>{const q=stSegQ(x.g);const a=x.g.a<l.s?l.s:x.g.a,b=x.g.b>l.e?l.e:x.g.b;const base=Math.round((+l.price||0)*x.n*q*qn);
    return{from:a,to:b,days:x.n*q,qty:qn,price:+l.price||0,base,disc:Math.round(base*dp/100),ins:0,ship:0,other:0,note:q>1?'Đăng ký '+q+' gói/ngày':'',en:q>1?'Registered '+q+' packages/day':''}});
  else out=[{from:l.s,to:l.e,days:r.days,qty:qn,price:r.price,base:r.base,disc:r.disc,ins:0,ship:0,other:0,note:r.seg?'Không sử dụng':'',en:r.seg?'Not used':''}];
  const f=out[0];f.ins=+l.ins||0;f.ship=+l.ship||0;f.other=r.other||0;
  const pc=stRules().minPct;
  const low=r.hold==='flat'||(r.has&&r.usedN<r.minD);
  const hn=r.other?(r.hold==='all'?'Phí giữ máy '+r.reg+' ngày (không sử dụng)':low?'Phí giữ máy (dùng dưới '+pc+'% thời gian đăng ký)':'Phí giữ máy'):'';
  const hne=r.other?(r.hold==='all'?'Holding fee '+r.reg+' days (not used)':low?'Holding fee (used less than '+pc+'% of registered time)':'Holding fee'):'';
  let an='',ane='';
  if(!r.seg&&r.has&&r.usedN!=null&&r.mode==='actual'){an=`Dùng thực tế ${r.usedN}/${r.reg} ngày${r.extraN?', quá hạn '+r.extraN+' ngày':''}`;ane=`Actual use ${r.usedN}/${r.reg} days${r.extraN?', overdue '+r.extraN+' days':''}`}
  f.note=[l.note,f.note,an,hn].filter(Boolean).join('; ');
  f.en=[f.en,ane,hne].filter(Boolean).join('; ');
  let acc=0;out.forEach((p,i)=>{p.ex=p.base-p.disc+p.ins+p.ship+p.other;p.vat=i===out.length-1?r.vat-acc:Math.round(p.ex*v/100);acc+=p.vat;p.total=p.ex+p.vat});
  return out;
}
const stSvcEn=l=>{const dst=CTRY_EN[l.c]||CTRY[l.c]||l.c||'';return l.pl==='Tháng'?`Rental of 1 Wi-Fi router for use in ${dst} for ${l.nm||1} month(s), from ${fmtD(l.s)} to ${fmtD(l.e)}`:`Rental of 1 Wi-Fi router for use in ${dst} from ${fmtD(l.s)} to ${fmtD(l.e)}`};
const STH=[['STT','No.'],['Ngày đặt/ Ngày giao','Order date / Delivery date'],['Tên dịch vụ','Service'],['Mã máy','Device code'],['Tên khách hàng','Customer'],['Nơi đến','Destination'],['Số lượng','Qty'],['Từ ngày','From'],['Đến ngày','To'],['Số ngày','Days'],['Đơn giá','Unit price'],['Giảm giá','Discount'],['Bảo hiểm','Insurance'],['Phí ship','Shipping'],['Phí khác','Other fee'],['Tổng cộng (chưa gồm VAT)','Subtotal (excl. VAT)'],['VAT','VAT'],['Thành tiền (bao gồm VAT)','Total (incl. VAT)'],['Ghi chú','Notes']];
const stHeads=anyOther=>STH.filter(h=>anyOther||h[0]!=='Phí khác');
function docStatement(d){
  const c=CB[d.cus]||{legal:'',mst:'',addr:'',name:''};const s=SET();const R=stRules();
  const L=d.lines||[];const anyOther=L.some(l=>(l.r&&l.r.other)>0);
  const rows=L.map((l,i)=>{const r=l.r||stCalc(l,null,d.vat);const ps=stParts(l,r,d.vat);const n=ps.length;
    const rs=(t,x)=>`<td class="${t}"${n>1?' rowspan="'+n+'"':''}>${x}</td>`;
    const m=x=>x?vnd(x):'-';
    return ps.map((p,j)=>{const first=j===0;
      return `<tr${first?'':' class="sub"'}>${first?rs('c',i+1)+rs('c',fmtD(l.del))+rs('',esc(stSvc(l))+'<br><span class="en">'+esc(stSvcEn(l))+'</span>')+rs('',esc(l.dev)+(l.imei?' ('+esc(l.imei)+')':''))+rs('',esc(l.user||c.legal||c.name||''))+rs('c',esc(CTRY[l.c]||l.c||'')):''}<td class="c">${p.qty}</td><td class="c">${fmtD(p.from)}</td><td class="c">${fmtD(p.to)}</td><td class="c">${p.days}</td><td class="r">${vnd(p.price)}</td><td class="r">${m(p.disc)}</td><td class="r">${m(p.ins)}</td><td class="r">${m(p.ship)}</td>${anyOther?`<td class="r">${m(p.other)}</td>`:''}<td class="r">${vnd(p.ex)}</td><td class="r">${vnd(p.vat)}</td><td class="r"><b>${vnd(p.total)}</b></td><td>${esc(p.note||'')}${p.note&&p.en?'<br>':''}${p.en?'<span class="en">'+esc(p.en)+'</span>':''}</td></tr>`}).join('')}).join('');
  const T=k=>sum(L,l=>(l.r||{})[k]||0);
  const tr=`<tr class="tot"><td colspan="9" class="c">${bi2('TỔNG CỘNG','TOTAL')}</td><td class="c">${T('days')}</td><td></td><td class="r">${vnd(T('disc'))}</td><td class="r">${vnd(sum(L,l=>+l.ins||0))}</td><td class="r">${vnd(sum(L,l=>+l.ship||0))}</td>${anyOther?`<td class="r">${vnd(T('other'))}</td>`:''}<td class="r">${vnd(T('ex'))}</td><td class="r">${vnd(T('vat'))}</td><td class="r">${vnd(T('total'))}</td><td></td></tr>`;
  const byIm={};(d.usage||[]).forEach(g=>{(byIm[g.i]=byIm[g.i]||[]).push(g)});
  const cs=new Set((d.usage||[]).map(g=>g.c));const tz=[...cs].filter(k=>STMT_TZ[k]).map(k=>{const h=STMT_TZ[k];return `${esc(CTRY[k]||k)} (${k}) ${h>0?'trước':'sau'} Việt Nam (VN) ${Math.abs(h)} giờ`});
  let n=0;
  const hist=L.map(l=>{const g=(byIm[stImei(l.imei)]||[]);if(!g.length)return '';n++;const r=l.r||{};
    return `<div class="stu"><p><b>${n}. ${esc(l.dev)}</b> (${esc(l.imei)}) · đăng ký ${fmtD(l.s)} – ${fmtD(l.e)} (${r.reg||0} ngày) · <b>dùng thực tế ${(l.ud||[]).length} ngày${(l.ux||[]).length?', quá hạn '+l.ux.length+' ngày':''}</b></p>
    <table class="stt"><thead><tr><th>IMEI</th><th>Bắt đầu</th><th>Kết thúc</th><th>Nước</th><th>Dung lượng (MB)</th></tr></thead><tbody>${g.map(x=>`<tr${x.mb<R.minMb?' class="dim"':''}><td>${esc(x.i)}</td><td>${esc(x.s)}</td><td>${esc(x.e)}</td><td class="c">${esc(x.c)}</td><td class="r">${x.mb}${x.mb<R.minMb?' (không tính)':''}</td></tr>`).join('')}</tbody></table></div>`}).join('');
  const secs=L.map((l,i)=>{const g=(byIm[stImei(l.imei)]||[]);const im=l.imgs||[];if(!g.length&&!im.length)return '';const r=l.r||{};
    return `<div class="stu"><p class="stuo"><span class="stun">${i+1}</span><b>${esc(l.dev)}</b>${l.imei?' <span class="muted">('+esc(l.imei)+')</span>':''} · đơn ${esc(l.ord)} · ${fmtD(l.s)} – ${fmtD(l.e)}</p>${im.map(m=>`<img class="stim" src="${m}" alt="">`).join('')}${g.length?`<table class="stt"><thead><tr><th>IMEI</th><th>Bắt đầu</th><th>Kết thúc</th><th>Nước</th><th>Dung lượng (MB)</th></tr></thead><tbody>${g.map(x=>`<tr${x.mb<R.minMb?' class="dim"':''}><td>${esc(x.i)}</td><td>${esc(x.s)}</td><td>${esc(x.e)}</td><td class="c">${esc(x.c)}</td><td class="r">${x.mb}${x.mb<R.minMb?' (không tính)':''}</td></tr>`).join('')}</tbody></table>`:''}</div>`}).join('');
  const sec=secs?`<div class="stuh"><h2 class="stuh-t">Lịch sử sử dụng chi tiết của bộ phát wifi</h2><p class="stuh-s">Ảnh dưới là giờ Việt Nam.${tz.length?' Trong đó: '+tz.join('; ')+'.':''}<br><span class="en">Detailed usage history of the Wi-Fi router. Times shown are Vietnam time.</span></p>${secs}</div>`:'';
  return `<div class="paper land"><p style="white-space:pre-line">${BL('Kính gửi','To')}: <b>${esc((c.legal||c.name||'').toUpperCase())}</b>${c.addr?'\n'+BL('Địa chỉ','Address')+': '+esc(c.addr):''}${c.mst?'\n'+BL('Mã số thuế','Tax code')+': '+esc(c.mst):''}</p>
  <h1>BẢNG KÊ CHI TIẾT ĐƠN THUÊ BỘ PHÁT WIFI</h1><div class="qh2 en">Detailed statement of Wi-Fi router rental orders</div><div class="sub">${BL('Số','No.')}: ${esc(d.no)} · ${BL('Kỳ từ','Period from')} ${fmtD(d.from)} ${BL('đến','to')} ${fmtD(d.to)}</div>
  <table class="stt big"><thead><tr>${stHeads(anyOther).map(h=>'<th>'+bi2(h[0],h[1])+'</th>').join('')}</tr></thead><tbody>${rows}${tr}</tbody></table>
  ${d.note?`<p><b>${BL('Ghi chú','Notes')}:</b> ${esc(d.note)}</p>`:''}
  <p><b>${BL('Bằng chữ','In words')}:</b> ${esc(vnWords(T('total')))}</p>
  <div class="stsig"><b>${esc((s.name||'[Tên công ty của bạn]').toUpperCase())}</b><br>${esc(s.addr||'')}<br>${BL('Ngày','Date')}: ${fmtD(d.date).replace(/\//g,'.')}<br>${BL('Người lập','Prepared by')}: ${esc(((d.sg&&d.sg.name)||(d.signer?signSnap(d.signer).name:'')||'').toUpperCase())||'………………'}</div>
  ${sec}</div>`;
}
function stNote(l,r){
  const a=[];
  if(l.note)a.push(l.note);
  if(r.seg){a.push(r.usedN?`Sử dụng thực tế: ${stSegText(l)} (${r.usedN}/${r.reg} ngày)`:'Không sử dụng');if(r.other)a.push(r.hold==='all'?`Phí giữ máy ${r.reg} ngày`:'Phí giữ máy (dùng dưới '+stRules().minPct+'% thời gian đăng ký)')}
  else if(r.has&&r.usedN!=null&&r.mode==='actual')a.push(`Dùng thực tế ${r.usedN}/${r.reg} ngày${r.extraN?', quá hạn '+r.extraN+' ngày':''}`);
  if(r.other&&r.has&&r.usedN<r.minD)a.push('Phí giữ máy (dùng dưới '+stRules().minPct+'% thời gian đăng ký)');
  return a.join('; ');
}
const STMT_AOA=d=>{
  const c=CB[d.cus]||{};const s=SET();const L=d.lines||[];const anyOther=L.some(l=>(l.r&&l.r.other)>0);
  const rows=[['Kính gửi: '+(c.legal||c.name||'').toUpperCase()],['Địa chỉ: '+(c.addr||'')],['Mã số thuế: '+(c.mst||'')],[],['BẢNG KÊ CHI TIẾT ĐƠN THUÊ BỘ PHÁT WIFI'],['Số',d.no,'Kỳ',fmtD(d.from)+' - '+fmtD(d.to)],
   ['STT','Ngày đặt/ Ngày giao','Tên dịch vụ','Mã máy','Tên Khách Hàng','Nơi đến','Số Lượng','Từ ngày','Đến ngày','Số ngày','Đơn giá','Giảm giá','Bảo hiểm','Phí ship'].concat(anyOther?['Phí khác']:[]).concat(['Tổng cộng (Chưa gồm VAT)','VAT','Thành tiền (Bao gồm VAT)','Ghi chú'])];
  L.forEach((l,i)=>{const r=l.r||stCalc(l,null,d.vat);stParts(l,r,d.vat).forEach((p,j)=>{const f=j===0;
    rows.push([f?i+1:'',f?fmtD(l.del):'',f?stSvc(l):'',f?l.dev+(l.imei?' ('+l.imei+')':''):'',f?(l.user||c.legal||c.name||''):'',f?(CTRY[l.c]||l.c||''):'',p.qty,fmtD(p.from),fmtD(p.to),p.days,p.price,p.disc,p.ins,p.ship].concat(anyOther?[p.other]:[]).concat([p.ex,p.vat,p.total,p.note||'']))})});
  const T=k=>sum(L,l=>(l.r||{})[k]||0);
  rows.push(['TỔNG CỘNG','','','','','','','','',T('days'),'',T('disc'),sum(L,l=>+l.ins||0),sum(L,l=>+l.ship||0)].concat(anyOther?[T('other')]:[]).concat([T('ex'),T('vat'),T('total')]));
  rows.push([]);rows.push([(s.name||'').toUpperCase()]);rows.push([s.addr||'']);rows.push(['Ngày: '+fmtD(d.date).replace(/\//g,'.')]);rows.push(['Người lập: '+((d.sg&&d.sg.name)||'')]);
  return rows;
};
const STMT_SHEETS=d=>{
  const R=stRules();const rows=[['IMEI','Máy','Bắt đầu (giờ VN)','Kết thúc (giờ VN)','Nước','Dung lượng (MB)','Tính ngày']];
  (d.lines||[]).forEach(l=>{(d.usage||[]).filter(g=>g.i===stImei(l.imei)).forEach(g=>rows.push([g.i,l.dev,g.s,g.e,g.c,g.mb,g.mb>=R.minMb?'Có':'Không (<'+R.minMb+'MB)']))});
  return[{name:'Bảng kê',rows:STMT_AOA(d),fromRow:6,plain:[0,3,9]},{name:'Lịch sử sử dụng',rows,fromRow:1,plain:[0,5]}];
};

/* ---- xuất Excel bảng kê: giống bản in (gộp ô theo đơn, định dạng, ảnh theo đơn) ---- */
async function exportStatementXlsx(d){
  const c=CB[d.cus]||{legal:'',mst:'',addr:'',name:''};const s=SET();const R=stRules();const L=d.lines||[];
  const anyOther=L.some(l=>(l.r&&l.r.other)>0);
  const wb=new ExcelJS.Workbook();const ws=wb.addWorksheet('Bảng kê',{pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9},views:[{showGridLines:false}]});
  const widths=[6,13,38,22,26,11,9,12,12,8,12,10,10,10].concat(anyOther?[10]:[]).concat([16,13,17,30]);
  const NC=widths.length;ws.columns=widths.map(w=>({width:w}));
  const thin={style:'thin',color:{argb:'FF9AA5AF'}};const bd={top:thin,left:thin,bottom:thin,right:thin};
  const FONT={name:'Arial',size:10};
  const put=(r,cn,v,o)=>{const x=ws.getCell(r,cn);x.value=v;x.font=Object.assign({},FONT,(o&&o.font)||{});if(o&&o.al)x.alignment=o.al;if(o&&o.fill)x.fill={type:'pattern',pattern:'solid',fgColor:{argb:o.fill}};if(o&&o.b)x.border=bd;if(o&&o.nf)x.numFmt=o.nf;return x};
  let r=1;
  put(r,1,'Kính gửi/To: '+(c.legal||c.name||'').toUpperCase(),{font:{bold:true}});r++;
  if(c.addr){put(r,1,'Địa chỉ/Address: '+c.addr);r++}
  if(c.mst){put(r,1,'Mã số thuế/Tax code: '+c.mst);r++}
  r++;
  ws.mergeCells(r,1,r,NC);put(r,1,'BẢNG KÊ CHI TIẾT ĐƠN THUÊ BỘ PHÁT WIFI',{font:{bold:true,size:15},al:{horizontal:'center',vertical:'middle'}});ws.getRow(r).height=26;r++;
  ws.mergeCells(r,1,r,NC);put(r,1,'DETAILED STATEMENT OF WI-FI ROUTER RENTAL ORDERS',{font:{italic:true,size:11,color:{argb:'FF5E6872'}},al:{horizontal:'center'}});r++;
  ws.mergeCells(r,1,r,NC);put(r,1,'Số/No.: '+d.no+' · Kỳ từ/Period from '+fmtD(d.from)+' đến/to '+fmtD(d.to),{al:{horizontal:'center'}});r+=2;
  const heads=stHeads(anyOther).map(h=>h[0]+'\n'+h[1]);
  heads.forEach((h,i)=>put(r,i+1,h,{font:{bold:true},fill:'FFEEF1F4',b:1,al:{horizontal:'center',vertical:'middle',wrapText:true}}));ws.getRow(r).height=46;r++;
  const CEN={horizontal:'center',vertical:'middle',wrapText:true},LEFT={horizontal:'left',vertical:'middle',wrapText:true},RIGHT={horizontal:'right',vertical:'middle'};
  const NF='#,##0;-#,##0;"-"';
  L.forEach((l,i)=>{const rr=l.r||stCalc(l,null,d.vat);const ps=stParts(l,rr,d.vat);const r0=r;
    ps.forEach((p,j)=>{const row=r+j;
      let k=7;put(row,k++,p.qty,{al:CEN,b:1});put(row,k++,fmtD(p.from),{al:CEN,b:1});put(row,k++,fmtD(p.to),{al:CEN,b:1});put(row,k++,p.days,{al:CEN,b:1});
      put(row,k++,p.price,{al:RIGHT,b:1,nf:'#,##0'});put(row,k++,p.disc,{al:RIGHT,b:1,nf:NF});put(row,k++,p.ins,{al:RIGHT,b:1,nf:NF});put(row,k++,p.ship,{al:RIGHT,b:1,nf:NF});
      if(anyOther)put(row,k++,p.other,{al:RIGHT,b:1,nf:NF});
      put(row,k++,p.ex,{al:RIGHT,b:1,nf:'#,##0'});put(row,k++,p.vat,{al:RIGHT,b:1,nf:'#,##0'});put(row,k++,p.total,{al:RIGHT,b:1,nf:'#,##0',font:{bold:true}});put(row,k++,(p.note||'')+(p.note&&p.en?'\n':'')+(p.en||''),{al:LEFT,b:1});
      ws.getRow(row).height=ps.length>1?22:60});
    const f=[[1,i+1,CEN],[2,fmtD(l.del),CEN],[3,stSvc(l)+'\n'+stSvcEn(l),LEFT],[4,l.dev+(l.imei?' ('+l.imei+')':''),LEFT],[5,l.user||c.legal||c.name||'',LEFT],[6,CTRY[l.c]||l.c||'',CEN]];
    f.forEach(([cn,v,al])=>{if(ps.length>1)ws.mergeCells(r0,cn,r0+ps.length-1,cn);put(r0,cn,v,{al,b:1});for(let q=1;q<ps.length;q++)ws.getCell(r0+q,cn).border=bd});
    if(ps.length>1){const need=Math.ceil(String(stSvc(l)).length/36)*13+Math.ceil(String(stSvcEn(l)).length/36)*13+8;const per=Math.max(20,Math.ceil(need/ps.length));ps.forEach((p,j)=>ws.getRow(r0+j).height=per)}
    r+=ps.length});
  const T=k=>sum(L,l=>(l.r||{})[k]||0);
  ws.mergeCells(r,1,r,9);put(r,1,'TỔNG CỘNG / TOTAL',{font:{bold:true},fill:'FFF5F7F9',b:1,al:CEN});
  for(let cn=10;cn<=NC;cn++){const x=ws.getCell(r,cn);x.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF5F7F9'}};x.border=bd;x.font=Object.assign({},FONT,{bold:true});x.alignment=cn===10?CEN:RIGHT;x.numFmt=NF}
  let cn=10;ws.getCell(r,cn++).value=T('days');cn++;ws.getCell(r,cn++).value=T('disc');ws.getCell(r,cn++).value=sum(L,l=>+l.ins||0);ws.getCell(r,cn++).value=sum(L,l=>+l.ship||0);
  if(anyOther)ws.getCell(r,cn++).value=T('other');ws.getCell(r,cn++).value=T('ex');ws.getCell(r,cn++).value=T('vat');ws.getCell(r,cn++).value=T('total');
  r+=2;
  put(r,1,'',{});ws.getCell(r,1).value={richText:[{text:'Bằng chữ/In words: ',font:Object.assign({},FONT,{bold:true})},{text:vnWords(T('total')),font:FONT}]};r+=2;
  if(d.note){put(r,1,'Ghi chú/Notes: '+d.note);r+=2}
  const sc=NC-3;
  [[(s.name||'[Tên công ty của bạn]').toUpperCase(),1],[s.addr||'',0],['Ngày/Date: '+fmtD(d.date).replace(/\//g,'.'),0],['Người lập/Prepared by: '+(((d.sg&&d.sg.name)||(d.signer?signSnap(d.signer).name:'')||'').toUpperCase()||'………………'),0]].forEach(([v,b])=>{ws.mergeCells(r,sc,r,NC);put(r,sc,v,{font:{bold:!!b},al:{horizontal:'left',vertical:'top',wrapText:true}});if(String(v).length>46)ws.getRow(r).height=28;r++});
  r++;
  /* lịch sử sử dụng: ảnh gắn theo từng đơn */
  const byIm={};(d.usage||[]).forEach(g=>{(byIm[g.i]=byIm[g.i]||[]).push(g)});
  const has=L.some(l=>(l.imgs||[]).length||(byIm[stImei(l.imei)]||[]).length);
  if(has){
    for(let c2=1;c2<=NC;c2++)ws.getCell(r,c2).border={top:{style:'medium',color:{argb:'FF1F2A33'}}};r+=1;
    ws.mergeCells(r,1,r,NC);put(r,1,'LỊCH SỬ SỬ DỤNG CHI TIẾT CỦA BỘ PHÁT WIFI / DETAILED USAGE HISTORY OF THE WI-FI ROUTER',{font:{bold:true,size:12}});ws.getRow(r).height=22;r++;
    const cs=new Set((d.usage||[]).map(g=>g.c));const tz=[...cs].filter(k=>STMT_TZ[k]).map(k=>{const h=STMT_TZ[k];return (CTRY[k]||k)+' ('+k+') '+(h>0?'trước':'sau')+' Việt Nam (VN) '+Math.abs(h)+' giờ'});
    ws.mergeCells(r,1,r,NC);put(r,1,'Ảnh dưới là giờ Việt Nam. / Times shown are Vietnam time.'+(tz.length?' Trong đó: '+tz.join('; ')+'.':''),{font:{italic:true,color:{argb:'FF4A5560'}}});r+=2;
    const dim=src=>new Promise(res=>{const im=new Image();im.onload=()=>res([im.naturalWidth||600,im.naturalHeight||300]);im.onerror=()=>res([600,300]);im.src=src});
    for(let i=0;i<L.length;i++){const l=L[i];const g=byIm[stImei(l.imei)]||[];const im=l.imgs||[];if(!g.length&&!im.length)continue;
      ws.mergeCells(r,1,r,NC);put(r,1,(i+1)+'.  '+l.dev+(l.imei?' ('+l.imei+')':'')+' · đơn '+l.ord+' · '+fmtD(l.s)+' – '+fmtD(l.e),{font:{bold:true},fill:'FFEEF1F4',al:{vertical:'middle'}});ws.getRow(r).height=22;r++;
      for(const src of im){const m=/^data:image\/(png|jpe?g|gif);base64,/i.exec(src);if(!m)continue;
        const [w0,h0]=await dim(src);const k=Math.min(1,760/w0,520/h0);const w=Math.round(w0*k),h=Math.round(h0*k);
        const id=wb.addImage({base64:src,extension:/jp/i.test(m[1])?'jpeg':m[1].toLowerCase()});
        ws.addImage(id,{tl:{col:0.1,row:r-1+0.15},ext:{width:w,height:h}});r+=Math.ceil(h/20)+1}
      if(g.length){['IMEI','Bắt đầu','Kết thúc','Nước','Dung lượng (MB)'].forEach((h,q)=>put(r,[1,3,4,5,6][q],h,{font:{bold:true},fill:'FFEEF1F4',b:1,al:CEN}));r++;
        g.forEach(x=>{[[1,x.i],[3,x.s],[4,x.e],[5,x.c],[6,x.mb+(x.mb<R.minMb?' (không tính)':'')]].forEach(([c3,v])=>put(r,c3,v,{b:1,al:{horizontal:'center'}}));r++});r++}
      r++}
  }
  const buf=await wb.xlsx.writeBuffer();return new Uint8Array(buf);
}

/* ---- trang Bảng kê ---- */
VIEWS.statements=function(){
  const tab=S.f.statements.tab||'wait';
  const body=tab==='done'?`<section class="panel stsec"><div class="stph"><div><h2>Bảng kê đã lập</h2><p class="muted" id="kcnt1"></p></div><input type="search" id="kq" placeholder="Tìm số bảng kê, khách hàng" value="${esc(S.f.statements.q)}" aria-label="Tìm bảng kê"></div>
    <div class="scroll"><table class="tbl" style="min-width:820px"><thead><tr><th>Số bảng kê</th><th>Khách hàng</th><th>Kỳ</th><th class="num">Số máy</th><th class="num">Chưa VAT</th><th class="num">Gồm VAT</th><th>Trạng thái</th></tr></thead><tbody id="ktb"></tbody></table></div></section>`
  :`<section class="panel stsec"><div class="stph"><div><h2>Chờ lập bảng kê</h2><p class="muted" id="kcnt2"></p></div><input type="search" id="kpq" placeholder="Tìm khách hàng" value="${esc(S.f.statements.pq||'')}" aria-label="Tìm khách hàng"></div>
    <div class="scroll"><table class="tbl" style="min-width:760px"><thead><tr><th>Khách hàng</th><th></th></tr></thead><tbody id="kpend"></tbody></table></div></section>`;
  return head('Bảng kê','Lập bảng kê cuối tháng từ các đơn chưa lập hóa đơn, sau đó mới nháp hóa đơn cho khách.',`<div class="btns">${expBtn('statements')}${newBtn('newstmt','Lập bảng kê thủ công')}</div>`)+
  `<div class="tabs" role="tablist" style="margin-bottom:14px"><button role="tab" aria-selected="${tab==='wait'}" data-act="sttab" data-id="wait">Chờ lập (${stPendRows().length})</button><button role="tab" aria-selected="${tab==='done'}" data-act="sttab" data-id="done">Đã lập (${stOpen().length})</button></div>`+body;
};
function stPendRows(){
  const out=[];const m=stPending();
  Object.keys(m).forEach(cus=>{
    const its=m[cus].items;if(!its.length)return;
    const ds=its.map(x=>x.l.s).sort();
    out.push({cus,orders:new Set(its.map(x=>x.o.code)).size,n:its.length,a:ds[0],b:ds[ds.length-1],tot:sum(its,x=>+x.l.total||0)});
  });
  return out.sort((x,y)=>(CB[x.cus]||{name:''}).name.localeCompare((CB[y.cus]||{name:''}).name,'vi'));
}
/* ảnh dán / chọn file: thu nhỏ rồi lưu dạng data URL */
function stImg(file){return new Promise((ok,no)=>{const fr=new FileReader();fr.onerror=no;fr.onload=()=>{const im=new Image();im.onerror=no;im.onload=()=>{const M=1100;let w=im.width,h=im.height;if(w>M){h=Math.round(h*M/w);w=M}const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);ok(c.toDataURL('image/jpeg',0.72))};im.src=fr.result};fr.readAsDataURL(file)})}
(function(){
  const cardIdx=el=>{const z=el&&el.closest&&el.closest('[data-pz],.stl');if(!z)return -1;if(z.dataset.pz!=null)return +z.dataset.pz;const p=z.querySelector('[data-pz]');return p?+p.dataset.pz:-1};
  document.addEventListener('paste',ev=>{
    if(!CUR||!CUR.addImgs||!CUR.s||!CUR.s.lines)return;
    let i=cardIdx(ev.target);if(i<0)i=cardIdx(document.activeElement);
    if(i<0){if(!document.querySelector('.stl'))return;i=(window.stLast!=null&&CUR.s.lines[window.stLast]&&CUR.s.lines[window.stLast].inc)?window.stLast:CUR.s.lines.findIndex(l=>l.inc);if(i<0)return}
    const fs=[...(ev.clipboardData&&ev.clipboardData.items||[])].filter(x=>x.kind==='file'&&/^image\//.test(x.type)).map(x=>x.getAsFile()).filter(Boolean);
    if(!fs.length)return;ev.preventDefault();CUR.addImgs(i,fs);
  });
  const mark=ev=>{const i=cardIdx(ev.target);if(i>=0)window.stLast=i};
  document.addEventListener('focusin',mark);document.addEventListener('click',mark);
  document.addEventListener('dragover',ev=>{if(ev.target.closest&&ev.target.closest('[data-pz]'))ev.preventDefault()});
  document.addEventListener('drop',ev=>{const z=ev.target.closest&&ev.target.closest('[data-pz]');if(!z||!CUR||!CUR.addImgs)return;ev.preventDefault();CUR.addImgs(+z.dataset.pz,[...ev.dataTransfer.files])});
  document.addEventListener('change',ev=>{const t=ev.target;if(t.dataset&&t.dataset.stimg!=null&&CUR&&CUR.addImgs){CUR.addImgs(+t.dataset.stimg,[...t.files]);t.value=''}},true);
})();
/* ---- xuất hóa đơn từ bảng kê ---- */
function stmtInvoiceForm(id){
  const d=LV('statements')[id];
  const items=(d.lines||[]).filter(x=>x.inc!==false).map(x=>{const p=x.key.split('|');const o=ORD.find(q=>q.code===p[0]);return o&&o.lines[+p[1]]?{o,l:o.lines[+p[1]],x}:null}).filter(Boolean);
  const todo=items.filter(it=>!it.l.inv);
  const s={no:'',date:TODAY,method:'Chưa thanh toán',err:[]};
  return {s,
    render(){return `<div class="form">${formTop('Ghi hóa đơn từ bảng kê',esc(d.no)+' · '+esc((CB[d.cus]||{}).name||''))}${ferr(s)}<div class="fg">${F('no','Số hóa đơn',{t:'num'})}${F('date','Ngày hóa đơn',{t:'date'})}${F('method','Phương thức thanh toán',{opts:['Chưa thanh toán','Chuyển khoản','Tiền mặt']})}</div>
      <div class="fs"><h3>Đơn đưa vào hóa đơn</h3>${[...new Set(todo.map(it=>it.o.code))].map(c=>`<div class="sm" style="padding:3px 0"><span class="mono">${esc(c)}</span> · ${todo.filter(it=>it.o.code===c).length} máy</div>`).join('')||'<div class="muted">Tất cả các đơn đã có hóa đơn.</div>'}</div>
      <div class="note info">Giá trị bảng kê: <b>${vnd(d.total)} đ</b> (gồm VAT). Sau khi ghi, các đơn trên chuyển sang đã xuất hóa đơn và được cập nhật ngược theo bảng kê (số ngày dùng thực tế, phí giữ máy, VAT).</div>${fbar('','Ghi hóa đơn')}</div>`},
    onChange(){rerender()},
    async submit(){
      const no=Math.round(+s.no||0);const err=[];
      if(!(no>0))err.push('Nhập số hóa đơn.');if(INVMETA[no])err.push('Số hóa đơn '+no+' đã tồn tại.');if(!todo.length)err.push('Không có dòng nào cần ghi hóa đơn.');
      if(err.length){s.err=err;rerender();return}
      try{await save('invoices',String(no),{no,date:s.date,recv:null,method:s.method,stmt:d.no});
        for(const it of todo){
          const r=it.x.r||{};const x=it.x;
          const win=(x.s&&x.e)?stList(x.s,x.e):[];
          const sdays=r.seg?stSegDays(x):win;const used=r.seg?sdays.length:win.length;
          const rest=win.filter(dd=>sdays.indexOf(dd)<0);
          const rng=ds=>{const o=[];let a=null,p=null;ds.forEach(dd=>{if(a&&addDays(p,1)===dd){p=dd}else{if(a)o.push(a===p?fmtD(a):fmtD(a)+' – '+fmtD(p));a=p=dd}});if(a)o.push(a===p?fmtD(a):fmtD(a)+' – '+fmtD(p));return o.join(', ')};
          const op={inv:no,vat:+d.vat,fixed:Math.round(+r.ex||0),stmt:{no:d.no,reg:r.reg,used,days:r.days,price:r.price,qty:+x.qty||1,month:!!r.month,base:r.base,disc:r.disc,other:r.other,hold:r.hold||'',usedText:r.month?'':(r.seg?stSegText(x):rng(sdays)),restText:r.month?'':rng(rest),unused:!!x.unused}};
          await setLineOp(it.l,op)}
        await save('statements',id,Object.assign({},d,{inv:no,invDate:s.date,invOrders:[...new Set(items.map(it=>it.o.code))]}))}catch(e){return}
      closeDrawer();toast('Đã ghi hóa đơn số '+no);render();
    }};
}
const allStatements=()=>Object.entries(LV('statements')).map(([id,v])=>Object.assign({id},v)).sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:(a.no<b.no?1:-1));
const stOpen=()=>allStatements().filter(r=>!r.inv);
function drawStatements(){
  const pq=(S.f.statements.pq||'').trim().toLowerCase();
  const pr=stPendRows().filter(r=>!pq||((CB[r.cus]||{}).name||'').toLowerCase().includes(pq));
  if($('kpend')){
  $('kpend').innerHTML=pr.map(r=>`<tr><td><b>${esc((CB[r.cus]||{name:'—'}).name)}</b></td><td class="num"><button class="btn pri sm" data-act="stmake" data-id="${esc(r.cus)}">Lập bảng kê</button></td></tr>`).join('')||`<tr><td colspan="2" class="empty">Không có khách nào cần lập bảng kê.</td></tr>`;
  $('kcnt2').textContent=pr.length?pr.length+' khách hàng có đơn đã kết thúc, chưa lập bảng kê':'Tất cả đơn đã được lập bảng kê';
  }
  if($('ktb')){
  $('kcnt1').textContent=stOpen().length+' bảng kê';
  const q=S.f.statements.q.trim().toLowerCase();
  const rows=stOpen().filter(r=>!q||(r.no+' '+(CB[r.cus]||{}).name).toLowerCase().includes(q));
  LAST.statements=rows;
  $('ktb').innerHTML=rows.map(r=>`<tr class="row" tabindex="0" data-act="doc" data-id="statement:${esc(r.id)}"><td class="mono"><b>${esc(r.no)}</b></td><td>${esc((CB[r.cus]||{name:'—'}).name)}</td><td>${fmtD(r.from)} – ${fmtD(r.to)}</td><td class="num">${(r.lines||[]).length}</td><td class="num">${vnd(r.ex)}</td><td class="num"><b>${vnd(r.total)}</b></td><td>${chip(STMT_TONE[r.status||'Nháp']||'mute',r.status||'Nháp')}${r.inv?` ${chip('ok','HĐ '+r.inv)}`:''}</td></tr>`).join('')||`<tr><td colspan="7" class="empty">Chưa có bảng kê. Bấm Lập bảng kê để tạo từ các đơn thuê trong tháng.</td></tr>`;
  }
}
const rowsStatements=list=>[['Số bảng kê','Khách hàng','Từ ngày','Đến ngày','Số máy','Chưa VAT','VAT','Gồm VAT','Trạng thái']].concat(list.map(r=>[r.no,(CB[r.cus]||{}).name||'',fmtD(r.from),fmtD(r.to),(r.lines||[]).length,r.ex||0,r.vatAmt||0,r.total||0,r.status||'Nháp']));
