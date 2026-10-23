
/* ============ BIỂU MẪU ============ */
const custOpts=()=>[['','— Chọn khách hàng —']].concat(CUS.map(c=>[c.id,c.name+(c.mst?' · '+c.mst:'')]));
const orderOpts=()=>[['','— Chọn đơn hàng —']].concat(ORD.slice().sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0).map(o=>[o.code,o.code+' · '+CB[o.cus].name]));
const UNITS=['Ngày','Tháng','Gói','Lượt'];

/* ---- đơn hàng ---- */
const formCus=s=>s.cus==='__new'?s.nc:CB[s.cus];
const formPct=s=>s.cus==='__new'?Math.max(0,+s.nc.pct||0):custPct(CB[s.cus]);
function fixPkg(l){if(l.prod==='eSIM'){const o=pkgOptions('eSIM',l.c,'');if(o.length&&o.indexOf(l.pkg)<0)l.pkg=o[0];return}const o=pkgOptions(l.prod,l.c,'',l.unit);if(o.indexOf(l.pkg)<0)l.pkg=o.length?(o.indexOf('5GB/day')>=0?'5GB/day':o[0]):''}
function autoIns(l){if(l.prod==='eSIM'){l.ins=0;l.insOn=false;return}const R=RUL();l.ins=l.insOn?(l.unit==='Tháng'?R.insMonth*Math.max(1,+l.months||1):R.insDay*formLine(l).days):0}
function settleForm(id){
  const l=getLine(id);const R=RUL();
  const s={use:l.useDays!=null?l.useDays:'',err:[]};
  const sim=u=>{const t=Object.assign({},l,{useDays:u});calc(t);return t};
  return {s,
    render(){
      const reg=l.days,need=Math.ceil(reg*R.minPct/100),u=s.use===''?null:Math.max(0,+s.use||0);
      const norm=sim(null),t=u==null?null:sim(Math.min(u,reg));
      let res='';
      if(t){const how=t.settle==='full'?`Đủ ngưỡng ${need} ngày: tính ${Math.min(u,reg)} ngày sử dụng thực tế × ${vnd(l.price)}, không phí mở máy.`:t.settle==='part'?`Dưới ngưỡng: ${vnd(l.price)} × ${Math.min(u,reg)} ngày + phí mở máy ${vnd(R.actFee)}.`:`Không sử dụng: phí mở máy ${vnd(R.actFee)} × ${reg} ngày.`;
        res=`<div class="calc"><div>${how}</div><div style="margin-top:6px">Chưa VAT: <b>${vnd(t.ex)} đ</b> <span class="muted">(thay vì ${vnd(norm.ex)} đ nếu không kết toán)</span></div></div>`}
      return `<div class="form">${formTop('Kết toán sử dụng thiết bị',esc(l.dev)+' · '+esc(l.o.code))}${ferr(s)}
      <div class="note info">Đăng ký ${reg} ngày (${fmtD(l.s)} – ${fmtD(l.e)}, không tính ngày giao và ngày trả). Luôn tính theo số ngày sử dụng thực tế (giống bảng kê). Sử dụng từ ${need} ngày trở lên (${R.minPct}% thời gian đăng ký) thì không tính phí mở máy. Dưới mức đó cộng phí mở máy ${vnd(R.actFee)} đ.</div>
      <div class="fg">${F('use','Số ngày sử dụng thực tế',{t:'num'})}</div>
      <div class="sm muted" style="margin:4px 0 10px">Ngày sử dụng là ngày dương lịch có ghi nhận từ ${R.minMb}MB dữ liệu trở lên trên hệ thống.</div>${res}
      ${fbar(l.useDays!=null?`<button class="btn danger" data-act="clearsettle" data-id="${esc(id)}">Bỏ kết toán</button>`:'','Lưu kết toán')}</div>`},
    onInput(){rerender()},
    onChange(){rerender()},
    async submit(){
      if(s.use===''){s.err=['Nhập số ngày sử dụng thực tế.'];rerender();return}
      if(+s.use<0||+s.use>l.days){s.err=['Số ngày sử dụng phải từ 0 đến '+l.days+'.'];rerender();return}
      try{await setLineOp(l,{useDays:Math.round(+s.use)})}catch(e){return}
      closeDrawer();toast('Đã lưu kết toán sử dụng');
    }};
}
function autoPrice(l){if(l.pm)return;const esim=l.prod==='eSIM';const p=findPrice(l.prod,l.c,esim?'Gói':l.unit,l.pkg);l.price=p?p.price:0;l.sim=esim&&p?(p.src||''):'';l.cover=esim&&p?(p.cover||''):''}
const nrm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim();
function ctryFor(prod){const set={};prices().forEach(p=>{if(p.active!==false&&p.kind===prod&&p.c&&CTRY[p.c])set[p.c]=1});const L=Object.keys(set).map(k=>[k,CTRY[k]]).sort((a,b)=>a[1].localeCompare(b[1],'vi'));return L.length?L:CTRY_OPTS()}
function ctryFilter(prod,txt){const t=nrm(txt);const L=ctryFor(prod);return t?L.filter(x=>nrm(x[1]).indexOf(t)>=0||nrm(x[0])===t):L}
function pddFill(i){const l=CUR.s.lines[i],n=$('pdd_'+i);if(!n)return;const t=nrm(l.pkF);const L=pkgOptions('eSIM',l.c,'').filter(x=>!t||nrm(x).indexOf(t)>=0);
  n.innerHTML=L.length?L.map(x=>`<div class="cdi" data-act="pickc" data-id="p${i}:${encodeURIComponent(x)}">${esc(x)}</div>`).join(''):'<div class="cde">Không có gói trong bảng giá. Cứ gõ tên gói rồi bấm ra ngoài để tự điền.</div>';n.classList.toggle('on',!!l.pkOpen)}
function cddFill(i){const l=CUR.s.lines[i],n=$('cdd_'+i);if(!n)return;const L=ctryFilter(l.prod,l.cqF!=null?l.cqF:'');n.innerHTML=L.length?L.map(x=>`<div class="cdi" data-act="pickc" data-id="${i}:${esc(x[0])}">${esc(x[1])}</div>`).join(''):(l.prod==='eSIM'&&PLSCOPE?'<div class="cde">Không có trong bảng giá. Gõ tên nước rồi bấm ra ngoài để tự nhập.</div>':'<div class="cde">Không có quốc gia phù hợp trong bảng giá</div>');n.classList.toggle('on',!!l.cqOpen)}
function readQr(file,cb){const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const m=Math.min(1,520/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*m);c.height=Math.round(im.height*m);c.getContext('2d').drawImage(im,0,0,c.width,c.height);cb(c.toDataURL('image/png'))};im.onerror=()=>cb('');im.src=r.result};r.onerror=()=>cb('');r.readAsDataURL(file)}
function qrFor(l){if(l.qr)return l.qr;try{if(l.lpa&&typeof qrcode==='function'){const q=qrcode(0,'M');q.addData(String(l.lpa).trim());q.make();return q.createDataURL(5,8)}}catch(e){}return ''}
const cuLabel=c=>c?(c.legal||c.name):'';
const autoHq=(s,l)=>{if(!nsForm(s)){l.hq='';l.hm=false;return}if(l.hm)return;l.hq=nsNet(s.cus,l.prod==='eSIM'?0:(+l.dpct||0))};
const nsForm=s=>/nam\s*san/i.test(((s.cus==='__new'?s.nc:CB[s.cus])||{}).src||'');
const plBanner=s=>{const p=custPL(s.cus);return p?`<div class="note info" style="margin-top:8px">Đang áp dụng <b>bảng giá riêng ${esc(plName(p))}</b> (chưa VAT) cho Wi-Fi. eSIM dùng bảng giá thường. Gói Wi-Fi không có trong bảng giá riêng sẽ hiện giá 0 để bạn tự nhập.</div>`:''};
function cuFilter(txt){const t=nrm(txt);const L=CUS.filter(c=>(!t||nrm(c.name+' '+(c.legal||'')+' '+(c.en||'')+' '+(c.mst||'')).indexOf(t)>=0));return L.slice(0,60)}
function cuFill(){const n=$('cdd_cu');if(!n)return;const s=CUR.s;const L=cuFilter(s.cuqF!=null?s.cuqF:'');
  n.innerHTML='<div class="cdi" data-act="pickcu" data-id="__new">+ Khách hàng mới</div>'+(L.length?L.map(c=>`<div class="cdi" data-act="pickcu" data-id="${esc(c.id)}"><b>${esc(cuLabel(c))}</b><br><small class="muted">${esc(c.name)}${c.mst?' · MST '+esc(c.mst):''}</small></div>`).join(''):'<div class="cde">Không tìm thấy khách hàng</div>');
  n.classList.toggle('on',!!s.cuqOpen)}
function ctryMatch(prod,txt){const t=nrm(txt);if(!t)return null;const L=ctryFor(prod);return L.find(x=>nrm(x[1])===t)||null}
function newOrderLine(s){const l={partner:'',iccid:'',pkgName:'',pkgType:'',lpa:'',qr:'',cq:'',sendVia:'Zalo',sendNote:'',comp:0,holdFee:0,insOn:false,im:false,prod:'Wifi device',c:'JP',unit:'Ngày',dev:'',s:'',e:'',months:1,pkg:'5GB/day',price:0,dpct:formPct(s),fee:0,ins:0,vat:10,pm:false,dm:false};{const L=ctryFor(l.prod);if(!L.some(x=>x[0]===l.c))l.c=L[0][0];l.cq=CTRY[l.c]||''}autoPrice(l);l.hq='';l.hm=false;autoHq(s,l);return l}
function formLine(l){
  const esim=l.prod==='eSIM';let days=1;
  if(!esim){if(l.unit==='Tháng')days=Math.max(1,+l.months||1);else days=(l.s&&l.e&&l.e>=l.s)?dayDiff(l.s,l.e)+1:0}
  const base=(+l.price||0)*days*(esim?1:Math.max(1,Math.round(+l.qty||1)));const disc=esim?0:Math.round(base*(+l.dpct||0)/100);const ex=base-disc+(esim?0:(+l.fee||0)+(+l.ins||0)+(+l.comp||0)+(+l.holdFee||0));const vat=Math.round(ex*(+l.vat||0)/100);
  const span=(l.s&&l.e&&l.e>=l.s)?dayDiff(l.s,l.e)+1:0;
  return{days,span,base,disc,ex,vat,total:ex+vat};
}
function suggestCode(s){
  if(!s.cus)return '';
  const pre=String(s.date||TODAY).slice(2).replace(/-/g,'');
  let mx=0;ORD.forEach(o=>{const m=String(o.code).match(/^(\d{6})-(\d+)$/);if(m&&m[1]===pre)mx=Math.max(mx,+m[2])});
  return pre+'-'+(mx+1);
}
/* máy có thể chọn cho khách: 'free' = còn rảnh để giao, 'held' = chính khách này đang giữ và không vướng lịch khác */
function devAvail(code,cus,st,en,excl){
  const d=devState(code);if(d.k==='maint')return false;
  const e=en||st;
  const held=!!(d.cur&&d.cur.st==='using'&&cus&&d.cur.cus===cus&&(!excl||d.cur.o.code!==excl||true));
  if(held){
    const clash=LINES.some(l=>l.dev===code&&l!==d.cur&&!(excl&&l.o&&l.o.code===excl)&&l.st==='pending'&&st&&!(l.e<st||l.s>e));
    return clash?false:'held';
  }
  if(st)return deviceFree(code,st,e,excl)?'free':false;
  return d.k==='ready'?'free':false;
}
function devChoices(l,s,i){
  const want=l.prod==='Wifi device insert sim'?'Wi-Fi + SIM':'Wi-Fi';
  const out=[['','— Chọn máy —']];
  /* theo khu vực khách: HN chỉ máy HN; HCM gồm HN và HCM; Other ship từ HN */
  const locOk=s.area==='HCM'?['HN','HCM']:['HN'];
  const en=l.unit==='Tháng'&&l.s?addDays(addMonths(l.s,Math.max(1,+l.months||1)),-1):l.e;
  devList().filter(d=>d.m.type===want).sort((a,b)=>(a.loc===s.area?0:1)-(b.loc===s.area?0:1)||(a.code<b.code?-1:1)).forEach(d=>{
    const dup=s.lines.some((o,j)=>j!==i&&o.dev===d.code&&o.s&&o.e&&l.s&&en&&!(o.e<l.s||o.s>en));
    const a=devAvail(d.code,s.cus,l.s,en,s.edit);
    const taken=a!=='held'&&LINES.some(x=>x.dev===d.code&&(x.st==='pending'||x.st==='using')&&!(s.edit&&x.o&&x.o.code===s.edit));
    const pickedHere=s.lines.some((o,j)=>j!==i&&o.dev===d.code);
    if(dup||pickedHere)return;
    if(taken&&d.code!==l.dev)return;
    if(!a&&d.code!==l.dev)return;
    if(a!=='held'&&d.code!==l.dev&&locOk.indexOf(d.loc)<0)return;
    out.push([d.code,`${d.code} · ${d.loc} · ${a==='held'?'Khách đang giữ':a?DK[d.k][0]:DK[d.k][0]+' (không còn rảnh)'}`]);
  });
  if(out.length===1)out.push(['','Không có máy phù hợp ('+(s.area==='HCM'?'kho HN, HCM':'kho HN')+', chọn ngày hoặc khách khác)',true]);
  return out;
}
function orderForm(pre,editCode){
  const s={edit:editCode||'',delDate0:'',delDate:'',areaNote:'',uphone:'',uemail:'',cus:'',nc:{name:'',legal:'',mst:'',src:'Japanese Corporate',contact:'',phone:'',email:'',addr:'',pct:0},code:'',codeEdit:false,date:TODAY,area:'HN',firm:'Grab',user:'',note:'',lines:[],err:[]};
  Object.assign(s,pre||{});PLSCOPE=custPL(s.cus);
  if(s.cus&&s.cus!=='__new'&&CB[s.cus]&&!(pre&&pre.area)&&CB[s.cus].area)s.area=CB[s.cus].area;
  if(!s.lines.length)s.lines.push(newOrderLine(s));
  s.cuq=s.cus==='__new'?'+ Khách hàng mới':cuLabel(CB[s.cus]);s.cuqOpen=false;s.cuqF=null;
  s.lines.forEach(l=>{if(nsForm(s)){const dp=l.prod==='eSIM'?0:(+l.dpct||0);l.hm=l.hq!==''&&l.hq!=null&&+l.hq!==nsNet(s.cus,dp)}else{l.hm=false}autoHq(s,l)});
  s.lines.forEach(l=>{l.qty=l.qty||1;['partner','iccid','pkgName','pkgType','lpa','qr'].forEach(k=>{if(l[k]==null)l[k]=''});if(!l.cq)l.cq=CTRY[l.c]||'';if(l.sendVia==null){l.sendVia='Zalo';l.sendNote=''}l.comp=l.comp||0;l.holdFee=l.holdFee||0;if(l.prod==='eSIM'){l.dpct=0;l.fee=0;l.ins=0;l.insOn=false;l.comp=0;l.holdFee=0}});
  if(!s.code)s.code=suggestCode(s);
  const f={s,
    render(){
      const c=formCus(s);const cs=s.cus&&s.cus!=='__new'?custContracts(s.cus):[];
      const info=s.cus&&s.cus!=='__new'&&c?`<div class="cinfo"><span>Nguồn: <b>${esc(c.src||'—')}</b></span><span>MST: <b>${esc(c.mst||'—')}</b></span><span>Địa chỉ: <b>${esc(c.addr||'—')}</b></span></div><div class="cinfo" style="margin-top:6px"><span>Giảm giá: <b>${custPct(c)?custPct(c)+'%':'Không có'}</b></span><span>Hạn thanh toán: <b>${c.terms||30} ngày</b></span><span>Hợp đồng: <b>${cs.length?cs.map(x=>esc(x.no||'đã ký')).join(', '):'Chưa gắn'}</b></span></div>`:'';
      const nc=s.cus==='__new'?`<div class="fg">${F('nc.name','Mã khách hàng')}${F('nc.legal','Tên pháp lý (trên hóa đơn)',{cls:'w2'})}${F('nc.mst','MST hoặc số định danh')}${F('nc.src','Nguồn khách',{opts:SOURCES})}${F('nc.contact','Người liên hệ')}${F('nc.phone','Số điện thoại')}${F('nc.email','Email')}${F('nc.addr','Địa chỉ',{cls:'w2'})}${F('nc.pct','Giảm giá (%)',{t:'num'})}</div>`:'';
      const lines=s.lines.map((l,i)=>{
        autoHq(s,l);const esim=l.prod==='eSIM';const m=Math.max(1,+l.months||1);
        const endNote=l.unit==='Tháng'&&l.s?`đến ${fmtD(addDays(addMonths(l.s,m),-1))}`:'';
        return `<div class="ln"><div class="ln-h"><span>Dòng thuê ${i+1}</span>${s.lines.length>1?`<button class="btn sm" data-act="fdel" data-id="${i}">Xóa dòng</button>`:''}</div>
        <div class="fg">${F(`lines.${i}.prod`,'Sản phẩm',{opts:KINDS.slice(0,3)})}<label class="f rel"><span>Quốc gia</span><input data-k="lines.${i}.cq" data-t="text" data-cs="1" autocomplete="off" placeholder="Gõ tên quốc gia…" value="${esc(l.cq)}"><div class="cdd" id="cdd_${i}"></div></label>
        ${esim?F(`lines.${i}.s`,'Ngày kích hoạt',{t:'date'})+(()=>{const eo=pkgOptions('eSIM',l.c,l.pkg);return eo.length?(PLSCOPE?`<label class="f rel w2"><span>Gói eSIM (bấm để chọn hoặc tự điền)</span><input data-k="lines.${i}.pkg" data-t="text" data-cs="p" autocomplete="off" placeholder="Bấm chọn gói hoặc gõ, ví dụ 10GB / 30 ngày" value="${esc(l.pkg)}"><div class="cdd" id="pdd_${i}"></div></label>`:F(`lines.${i}.pkg`,'Gói eSIM',{opts:eo,cls:'w2'}))+(l.cover?`<div class="sm muted wall" style="margin:-4px 0 6px">Vùng phủ sóng: ${esc(l.cover)}. Hết dung lượng giảm còn 128kbps.</div>`:''):F(`lines.${i}.pkg`,'Gói',{ph:'10GB / 30 ngày'})})()+F(`lines.${i}.sendVia`,'Phương thức gửi eSIM',{opts:[['Zalo','Zalo'],['Email','Email'],['Other','Other (khác)']]})+(l.sendVia==='Other'?F(`lines.${i}.sendNote`,'Ghi chú cách gửi eSIM',{cls:'wall',ph:'Ví dụ: gửi qua WhatsApp, giao trực tiếp…'}):'')+F(`lines.${i}.iccid`,'Mã số ICCID *',{ph:'89852...',cls:'w2'}):
          F(`lines.${i}.unit`,'Tính theo',{opts:['Ngày','Tháng']})+F(`lines.${i}.s`,'Ngày bắt đầu',{t:'date'})+(l.unit==='Tháng'?F(`lines.${i}.months`,'Số tháng '+(endNote?'('+endNote+')':''),{t:'num'}):F(`lines.${i}.e`,'Ngày kết thúc',{t:'date'}))+`<label class="f"><span>Tổng số ngày</span><input id="ld_${i}" disabled value="${l.unit==='Tháng'?(l.s&&l.e?dayDiff(l.s,l.e)+1:''):(formLine(l).days||'')}"></label>`+
          F(`lines.${i}.dev`,'Máy',{opts:devChoices(l,s,i),cls:'w2'})+F(`lines.${i}.pkg`,'Gói dữ liệu',(()=>{const o=pkgOptions(l.prod,l.c,'',l.unit);return o.length?{opts:o}:{opts:[['','— Chưa có gói trong bảng giá —']]}})())+F(`lines.${i}.qty`,'Số lượng',{t:'num'})}
        ${esim?'':F(`lines.${i}.insOn`,'Mua gói bảo hiểm ('+vnd(RUL().insDay)+' đ/ngày hoặc '+vnd(RUL().insMonth)+' đ/tháng mỗi thiết bị)',{t:'check'})}
        ${F(`lines.${i}.price`,'Đơn giá (đ)',{t:'money'})}${nsForm(s)?F(`lines.${i}.hq`,'Đại lý (%)',{t:'num',cls:'w2'}):''}${esim?'':F(`lines.${i}.dpct`,'Giảm giá (%)',{t:'num'})+F(`lines.${i}.fee`,'Phí ship (đ)',{t:'money'})+F(`lines.${i}.ins`,'Bảo hiểm (đ)',{t:'money'})+F(`lines.${i}.comp`,'Phí bồi thường (đ, nếu có)',{t:'money'})+F(`lines.${i}.holdFee`,'Phí giữ máy (đ)',{t:'money'})}${F(`lines.${i}.vat`,'VAT (%)',{opts:[[10,'10%'],[8,'8%'],[0,'0%']],num:true})}${esim||!s.edit?'':F(`lines.${i}.ret`,'Ngày trả máy',{t:'date'})+F(`lines.${i}.retFirm`,'Đơn vị trả',{opts:FIRMS})}</div>
        ${(()=>{if(esim||!s.firm||(s.edit&&l._orig&&l._orig.st&&l._orig.st!=='pending'))return '';const c0=formCus(s)||{};const r=leadRule(s.firm,c0.addr,s.area,s.areaNote,l.s);if(!r)return '';const late=l.s&&r.dl<TODAY;
          return `<div class="note ${late?'bad':'info'}" style="margin-top:8px">${esc(r.rule)}. ${l.s?(late?`Hạn giao ${fmtD(r.dl)}${r.time?' '+r.time:''} đã qua, nên chọn ngày bắt đầu từ ${fmtD(r.earliest)} trở đi hoặc đổi đơn vị giao.`:`Cần giao trước ${fmtD(r.dl)}${r.time?' '+r.time:''}.`):`Ngày bắt đầu sớm nhất: ${fmtD(r.earliest)}.`}</div>`})()}
        <div class="calc" id="lc_${i}"></div></div>`}).join('');
      return `<div class="form">${formTop(s.edit?'Sửa đơn hàng '+esc(s.edit):'Tạo đơn hàng','Chọn khách, thêm các dòng thuê. Giá và giảm giá tự điền, máy chỉ hiện khi còn rảnh đúng khoảng ngày.')}${ferr(s)}
      <div class="fs"><h3>Khách hàng</h3><div class="fg"><label class="f rel wall"><span>Khách hàng (gõ tên, MST để lọc)</span><input data-k="cuq" data-t="text" data-cs="cu" autocomplete="off" placeholder="Gõ tên hoặc MST khách hàng…" value="${esc(s.cuq)}"><div class="cdd" id="cdd_cu"></div></label></div>${info}${plBanner(s)}${nc}</div>
      <div class="fs"><h3>Thông tin đơn</h3><div class="fg fg5">${F('code','Mã đơn',{dis:!!s.edit})}${F('date','Ngày tạo đơn',{t:'date'})}${F('delDate','Ngày giao thực tế',{t:'date'})}${F('area','Khu vực',{opts:AREAS})}${s.area==='Other'?F('areaNote','Ghi chú khu vực (ghi rõ nơi giao) *',{cls:'wall',ph:'Ví dụ: Đà Nẵng, giao tại khách sạn…'}):''}${F('firm','Đơn vị giao',{opts:FIRMS})}</div>
      <div class="fg" style="margin-top:10px">${F('user','Người dùng máy')}${F('uphone','Số điện thoại')}${F('uemail','Email')}</div><div class="fg" style="margin-top:10px">${F('note','Ghi chú',{cls:'wall'})}</div></div>
      <div class="fs"><h3>Dòng thuê</h3>${lines}<div><button class="btn" data-act="fadd">${ico('plus')}Thêm dòng thuê</button></div></div>
      <div class="panel"><div class="sum" style="border-top:0"><div><span class="muted">Thành tiền chưa VAT</span><span class="num" id="ot_ex"></span></div><div><span class="muted">VAT</span><span class="num" id="ot_vat"></span></div><div class="tot"><span>Tổng thanh toán</span><span class="num" id="ot_tot"></span></div></div></div>
      ${s.edit&&s.lines.some(l=>l._orig&&l._orig.inv)?'<div class="note info" style="margin-top:10px">Đơn có dòng đã xuất hóa đơn: thay đổi giá hoặc phí sẽ làm đổi số tiền trên hóa đơn đó.</div>':''}${fbar('',s.edit?'Lưu thay đổi':'Lưu đơn')}</div>`;
    },
    after(){f.live();if(s.cuqOpen)cuFill();s.lines.forEach((l,i)=>{if(l.cqOpen)cddFill(i);if(l.pkOpen)pddFill(i)})},
    setQr(i,file){const l=s.lines[i];if(!file||!l)return;readQr(file,d=>{if(!d){s.err=['Không đọc được ảnh QR, hãy chọn lại.'];rerender();return}l.qr=d;s.err=[];rerender()})},
    pickCu(id){if(id!=='__new'&&!CB[id])return;s.cus=id;s.cuq=id==='__new'?'+ Khách hàng mới':cuLabel(CB[id]);s.cuqOpen=false;s.cuqF=null;NOFOCUS=true;try{f.onChange('cus')}finally{NOFOCUS=false}try{document.activeElement&&document.activeElement.blur&&document.activeElement.blur()}catch(e){}},
    cddOpen(k){if(k==='cuq'){s.cuqOpen=true;s.cuqF='';cuFill();return}const mp=k.match(/^lines\.(\d+)\.pkg$/);if(mp){const l=s.lines[+mp[1]];l.pkOpen=true;l.pkF='';pddFill(+mp[1]);return}const m=k.match(/^lines\.(\d+)\.cq$/);if(!m)return;const l=s.lines[+m[1]];l.cqOpen=true;l.cqF='';cddFill(+m[1])},
    pickC(i,key){if(String(i).charAt(0)==='p'){const l=s.lines[+String(i).slice(1)];if(!l)return;try{const a0=document.activeElement;if(a0&&a0.blur)a0.blur()}catch(e){}l.pkg=decodeURIComponent(key);l.pkOpen=false;l.pkF=null;l.pm=false;autoPrice(l);NOFOCUS=true;try{rerender()}finally{NOFOCUS=false}try{document.activeElement&&document.activeElement.blur&&document.activeElement.blur()}catch(e){}return}const l=s.lines[+i];if(!l||!CTRY[key])return;l.c=key;l.cq=CTRY[key];l.cqOpen=false;l.cqF=null;l.pm=false;fixPkg(l);autoPrice(l);if(l.insOn&&!l.im)autoIns(l);NOFOCUS=true;try{rerender()}finally{NOFOCUS=false}try{document.activeElement&&document.activeElement.blur&&document.activeElement.blur()}catch(e){}},
    live(){
      s.lines.forEach((l,i)=>{if(nsForm(s)&&!l.hm){autoHq(s,l);const n=$('dr').querySelector('[data-k="lines.'+i+'.hq"]');if(n&&document.activeElement!==n)n.value=l.hq}});
      let ex=0,vat=0,dsc=0;
      s.lines.forEach((l,i)=>{const c=formLine(l);ex+=c.ex;vat+=c.vat;dsc+=c.disc;const n=$('lc_'+i);if(n)n.innerHTML=`<span>Thời hạn: <b>${c.days}</b> ${l.unit==='Tháng'&&l.prod!=='eSIM'?'tháng':l.prod==='eSIM'?'gói':'ngày'}</span>${l.prod==='eSIM'?'':`<span>Đơn giá × số ngày${(+l.qty||1)>1?' × '+(+l.qty)+' gói':''}: <b>${vnd(c.base)}</b></span><span>Giảm giá (${+l.dpct||0}%): <b>${c.disc?'-':''}${vnd(c.disc)}</b></span>`}<span>Thành tiền chưa VAT: <b>${vnd(c.ex)}</b></span><span>VAT (${+l.vat||0}%): <b>${vnd(c.vat)}</b></span><span>Tổng thanh toán: <b>${vnd(c.total)}</b></span>${nsForm(s)?(()=>{const q=l.hq!==''&&l.hq!=null?(+l.hq||0):nsNet(s.cus,l.prod==='eSIM'?0:(+l.dpct||0));return `<span>Hoa hồng Nam San (${q}%): <b>${vnd(Math.round(c.base*q/100))}</b></span>`})():''}`;const dn=$('ld_'+i);if(dn)dn.value=l.unit==='Tháng'?(l.s&&l.e?c.span:''):(c.days||'')});
      const a=$('ot_ex');if(a){a.textContent=vnd(ex)+' đ';$('ot_vat').textContent=vnd(vat)+' đ';$('ot_tot').textContent=vnd(ex+vat)+' đ'}
    },
    onInput(k,el){
      if(k==='cuq'){s.cuqOpen=true;s.cuqF=s.cuq;cuFill();return}
      if(k==='code')s.codeEdit=true;
      const m=k.match(/^lines\.(\d+)\.(\w+)$/);
      if(m&&m[2]==='cq'){const l=s.lines[+m[1]];l.cqOpen=true;l.cqF=l.cq;cddFill(+m[1]);return}
      if(m&&m[2]==='pkg'&&$('pdd_'+m[1])){const l=s.lines[+m[1]];l.pkOpen=true;l.pkF=l.pkg;pddFill(+m[1]);return}
      if(m){const l=s.lines[+m[1]];if(m[2]==='price')l.pm=true;if(m[2]==='hq')l.hm=String(l.hq==null?'':l.hq).trim()!=='';if(m[2]==='dpct')l.dm=true;if(m[2]==='ins')l.im=true;if(m[2]==='months'&&l.s){l.e=addDays(addMonths(l.s,Math.max(1,+l.months||1)),-1);if(l.insOn&&!l.im)autoIns(l)}}
      if(k==='nc.mst'&&!s.codeEdit){s.code=suggestCode(s);const n=$('dr').querySelector('[data-k="code"]');if(n)n.value=s.code}
      f.live();
    },
    onChange(k){
      if(k==='date'&&!s.codeEdit&&!s.edit)s.code=suggestCode(s);
      if(k==='cuq'){const t=nrm(s.cuq);const h=CUS.find(c=>nrm(cuLabel(c))===t||nrm(c.name)===t);if(h&&h.id!==s.cus){s.cus=h.id;k='cus'}else{s.cuq=s.cus==='__new'?'+ Khách hàng mới':cuLabel(CB[s.cus]);s.cuqOpen=false;s.cuqF=null;const n=$('cdd_cu');if(n)n.classList.remove('on');const e=$('dr').querySelector('[data-k="cuq"]');if(e)e.value=s.cuq;return}}
      if(k==='cus'){PLSCOPE=custPL(s.cus);s.lines.forEach(l=>{if(!l.pm){fixPkg(l);autoPrice(l)}});const p=formPct(s);s.lines.forEach(l=>{if(!l.dm)l.dpct=p});s.lines.forEach(l=>{l.hm=false;autoHq(s,l)});if(s.cus&&s.cus!=='__new'&&CB[s.cus]&&CB[s.cus].area)s.area=CB[s.cus].area;if(!s.codeEdit)s.code=suggestCode(s)}
      const m=k.match(/^lines\.(\d+)\.(\w+)$/);
      if(m){const i=+m[1],l=s.lines[i],p=m[2];
        if(p==='cq'){const h=ctryMatch(l.prod,l.cq);l.cqOpen=false;l.cqF=null;if(h&&h[0]!==l.c){l.c=h[0];l.pm=false;fixPkg(l);autoPrice(l);if(l.insOn&&!l.im)autoIns(l);l.cq=CTRY[l.c]||''}else if(!h&&PLSCOPE&&l.prod==='eSIM'&&String(l.cq||'').trim()){const t=String(l.cq).trim();const ex=Object.keys(CTRY).find(k=>nrm(CTRY[k])===nrm(t));l.c=ex||t;if(!ex)CTRY[t]=t;l.cq=CTRY[l.c];l.pm=false;l.pkg='';autoPrice(l);if(!ex)l.price=0;l.cqOpen=false}else{l.cq=CTRY[l.c]||'';const n=$('cdd_'+i);if(n)n.classList.remove('on');const e=$('dr').querySelector('[data-k="lines.'+i+'.cq"]');if(e)e.value=l.cq;return}}
        if(p==='prod'){l.dev='';if(l.prod==='eSIM'){l.dpct=0;l.fee=0;l.ins=0;l.insOn=false;l.comp=0;l.holdFee=0;if(!l.sendVia)l.sendVia='Zalo'}else if(!l.dpct&&!l.dm)l.dpct=formPct(s);{const L=ctryFor(l.prod);if(!L.some(x=>x[0]===l.c))l.c=L[0][0];l.cq=CTRY[l.c]||''}if(l.prod==='eSIM'){l.pkg='';l.unit='Ngày'}else if(!l.pkg||/GB \//.test(l.pkg))l.pkg='5GB/day';l.pm=false;fixPkg(l);if(l.prod==='eSIM'&&!l.pkg)l.pkg='10GB / 30 ngày';autoPrice(l)}
        if(p==='c'||p==='unit'){l.pm=false;fixPkg(l);autoPrice(l)}
        if(p==='pkg'){l.pkOpen=false;l.pkF=null;l.pm=false;autoPrice(l)}
        if(p==='insOn'){l.im=false;autoIns(l)}else if(l.insOn&&!l.im&&(p==='prod'||p==='unit'||p==='s'||p==='e'||p==='months'))autoIns(l)
        if(l.unit==='Tháng'&&l.s)l.e=addDays(addMonths(l.s,Math.max(1,+l.months||1)),-1);
        if(l.dev&&l.s&&l.e&&!devAvail(l.dev,s.cus,l.s,l.e,s.edit))l.dev='';
      }
      rerender();
    },
    add(){s.lines.push(newOrderLine(s));rerender()},
    del(i){s.lines.splice(+i,1);if(!s.lines.length)s.lines.push(newOrderLine(s));rerender()},
    async submit(){
      const err=[];const code=safeId(s.code);
      let c=formCus(s);
      if(!s.cus)err.push('Chọn khách hàng.');
      if(s.cus==='__new'&&!String(s.nc.name).trim())err.push('Nhập tên khách hàng mới.');
      if(s.area==='Other'&&!String(s.areaNote||'').trim())err.push('Khu vực Other: ghi chú nơi giao.');
      if(s.delDate&&s.delDate<s.date)err.push('Ngày giao thực tế không được trước ngày tạo đơn.');
      if(!code)err.push('Nhập mã đơn.');
      else if(!s.edit&&ORD.some(o=>o.code===code))err.push('Mã đơn '+code+' đã tồn tại.');
      s.lines.forEach((l,i)=>{const n='Dòng '+(i+1)+': ';const esim=l.prod==='eSIM';
        if(esim){if(!l.s)err.push(n+'chọn ngày kích hoạt.');if(l.sendVia==='Other'&&!String(l.sendNote||'').trim())err.push(n+'ghi chú cách gửi eSIM.');const ic=String(l.iccid||'').replace(/\s/g,'');if(!ic)err.push(n+'nhập mã số ICCID.');else if(!/^\d{18,22}$/.test(ic))err.push(n+'ICCID gồm 18 đến 22 chữ số.');else if(s.lines.some((o,j)=>j!==i&&o.prod==='eSIM'&&String(o.iccid||'').replace(/\s/g,'')===ic)||ORD.some(o=>o.code!==s.edit&&o.lines.some(x=>x.iccid===ic)))err.push(n+'ICCID '+ic+' đã có trong đơn khác.');}
        else{if(!l.s)err.push(n+'chọn ngày bắt đầu.');if(l.unit!=='Tháng'&&(!l.e||l.e<l.s))err.push(n+'ngày kết thúc phải sau ngày bắt đầu.');if(!l.dev)err.push(n+'chọn máy.')}
        if(!esim&&l.ret&&l.s&&l.ret<l.s)err.push(n+'ngày trả máy không được trước ngày bắt đầu.');if(!(+l.price>0))err.push(n+'nhập đơn giá.')});
      if(err.length){s.err=err;rerender();$('dr').scrollTop=0;return}
      s.err=[];
      let cusId=s.cus;
      if(s.cus==='__new'){const nc=s.nc;cusId='c'+Date.now().toString(36);
        await save('customers',cusId,{name:nc.name.trim(),legal:(nc.legal||nc.name).trim(),en:toEn(nc.legal||nc.name),mst:nc.mst.trim(),src:nc.src,contact:nc.contact,phone:nc.phone,email:nc.email,addr:nc.addr,area:s.area,pay:'Từng đơn',terms:30,pct:+nc.pct||0,pctFrom:'',pctTo:'',pctNote:''})}
      const lines=s.lines.map(l=>{const esim=l.prod==='eSIM';const c2=formLine(l);const sd=l.s||s.date;const month=!esim&&l.unit==='Tháng';
        const ed=esim?sd:month?addDays(addMonths(sd,Math.max(1,+l.months||1)),-1):l.e;
        const nl={qty:esim?1:Math.max(1,Math.round(+l.qty||1)),dev:esim?'eSim':l.dev,c:l.c,s:sd,e:ed,days:c2.days,months:month,price:+l.price,dpct:esim?0:(+l.dpct||0),fee:esim?0:(+l.fee||0),ins:esim?0:(+l.ins||0),comp:esim?0:(+l.comp||0),holdFee:esim?0:(+l.holdFee||0),partner:esim?String(l.partner||'').trim():'',iccid:esim?String(l.iccid||'').replace(/\s/g,''):'',pkgName:esim?(String(l.pkgName||'').trim()||l.pkg||''):'',pkgType:esim?String(l.pkgType||'').trim():'',lpa:esim?String(l.lpa||'').trim():'',qr:esim?(l.qr||''):'',sendVia:esim?(l.sendVia||'Zalo'):'',sendNote:esim&&l.sendVia==='Other'?String(l.sendNote||'').trim():'',vat:+l.vat,hq:(nsForm(s)&&l.hm&&l.hq!==''&&l.hq!=null)?+l.hq:'',prod:l.prod,pkg:l.pkg||'',sim:esim?(l.sim||''):'',cover:esim?(l.cover||''):'',type:esim?'eSIM':month?'Monthly':'Daypass',st:esim?'used':(sd>TODAY?'pending':'using'),del:s.delDate?s.delDate:((!esim&&sd<=TODAY)?TODAY:null),fixed:null};
        const o0=l._orig;if(!o0)return nl;
        if(!esim){nl.ret=l.ret||null;nl.retFirm=l.retFirm||null}
        nl.user=s.user;nl.fixed=(o0.fixed!=null&&+l.price===+o0.price)?o0.fixed:null;
        if(!(o0.st==='pending')||esim)nl.st=o0.st;
        if(o0.st!=='pending'||esim)nl.del=(s.delDate!==s.delDate0)?(s.delDate||null):(o0.del!=null?o0.del:null);
        return Object.assign({},o0,nl)});
      const doc={code,cus:cusId,date:s.date,delDate:s.delDate||'',firm:s.firm,area:s.area,areaNote:s.area==='Other'?String(s.areaNote||'').trim():'',user:s.user,uphone:s.uphone||'',uemail:s.uemail||'',note:s.note,lines,created:s.created0||TODAY};
      if(s.demo0)doc.demo=true;
      try{await save('orders',code,doc)}catch(e){return}
      try{for(let i=0;i<s.lines.length;i++){const l=s.lines[i],o0=l._orig;if(!o0||l.prod==='eSIM')continue;
        if((l.ret||'')!==(o0.ret||'')||(l.retFirm||'')!==(o0.retFirm||'')){const key=code+'__'+i;const patch={ret:l.ret||null,retFirm:l.retFirm||null};if(l.ret&&o0.st!=='pending')patch.st='returned';
          await save('lineops',key,Object.assign({},LV('lineops')[key]||{},patch))}}}catch(e){}
      closeDrawer();toast(s.edit?'Đã cập nhật đơn '+code:'Đã lưu đơn '+code);
      setTimeout(()=>openView(()=>orderDrawer(code)),60);
    }};
  return f;
}
function orderEditPre(o){
  const strip=['base','disc','ex','vatAmt','total','act','settle','o','cus','area','demo','idx'];
  const lines=o.lines.map(l=>{const esim=l.prod==='eSIM',month=!!l.months;const orig={};Object.keys(l).forEach(k=>{if(strip.indexOf(k)<0)orig[k]=l[k]});
    return{_orig:orig,qty:+l.qty||1,cq:CTRY[l.c]||'',prod:l.prod,c:l.c,unit:esim?'Ngày':month?'Tháng':'Ngày',dev:esim?'':(l.dev||''),s:l.s||'',e:l.e||'',months:month?Math.max(1,+l.days||1):1,pkg:l.pkg||'',price:+l.price||0,dpct:+l.dpct||0,fee:+l.fee||0,ins:+l.ins||0,insOn:!esim&&+l.ins>0,im:false,comp:+l.comp||0,holdFee:+l.holdFee||0,vat:+l.vat,pm:true,dm:true,sim:l.sim||'',cover:l.cover||'',sendVia:l.sendVia||'Zalo',sendNote:l.sendNote||'',iccid:l.iccid||'',ret:l.ret||'',retFirm:l.retFirm||''}});
  const dl=o.lines.filter(l=>l.prod!=='eSIM').map(l=>l.del||'');const dd=o.delDate||(dl.length&&dl.every(x=>x&&x===dl[0])?dl[0]:'');
  return{cus:o.cus,code:o.code,codeEdit:true,date:o.date,delDate:dd,delDate0:dd,area:o.area||'HN',areaNote:o.areaNote||'',firm:o.firm||'',user:o.user||(o.lines[0]&&o.lines[0].user)||'',uphone:o.uphone||'',uemail:o.uemail||'',note:o.note||'',created0:o.created||'',demo0:!!o.demo,lines};
}
function orderCopyPre(o){
  const lines=o.lines.map(l=>{const esim=l.prod==='eSIM',month=!!l.months;const x={cq:CTRY[l.c]||'',prod:l.prod,c:l.c,unit:esim?'Ngày':month?'Tháng':'Ngày',dev:'',s:'',e:'',months:month?Math.max(1,+l.days||1):1,pkg:l.pkg||'',price:+l.price||0,dpct:esim?0:(+l.dpct||0),fee:esim?0:(+l.fee||0),ins:0,insOn:!esim&&!!(+l.ins>0),im:false,comp:0,holdFee:0,vat:+l.vat,pm:true,dm:true,sim:l.sim||'',cover:l.cover||'',sendVia:l.sendVia||'Zalo',sendNote:l.sendNote||''};return x});
  return{cus:o.cus,area:o.area||'HN',areaNote:o.areaNote||'',firm:o.firm||'Grab',user:o.user||'',uphone:o.uphone||'',uemail:o.uemail||'',note:'Sao chép từ đơn '+o.code,lines};
}
function orderFromQuote(q){
  const lines=[];const s0={cus:q.cus,nc:{pct:0}};
  q.lines.forEach(l=>{
    const it=(priceById(l.pid)||{});const prod=l.prod==='eSIM'?'eSIM':(['Wifi device','Wifi device insert sim'].includes(it.kind)?it.kind:'Wifi device');const unit=l.unit==='Tháng'?'Tháng':'Ngày';
    for(let k=0;k<(+l.qty||1);k++)lines.push({prod,c:l.c||it.c||'JP',unit:prod==='eSIM'?'Ngày':unit,dev:'',s:l.s||'',e:l.e||'',months:unit==='Tháng'?(+l.days||1):1,pkg:l.pkg||(prod==='eSIM'?(it.pkg||it.note||''):(it.pkg||'5GB/day')),price:+l.price||0,dpct:prod==='eSIM'?0:(+l.dpct||0),fee:prod==='eSIM'?0:(+l.fee||0),ins:0,vat:q.vat==null?10:+q.vat,pm:true,dm:true});
  });
  return orderForm({cus:q.cus,lines,note:'Từ báo giá '+q.no,quote:q.id});
}

/* ---- khách hàng ---- */
function customerForm(id){
  const c=id?CB[id]:null;
  const s=Object.assign({name:'',legal:'',en:'',mst:'',src:'Japanese Corporate',contact:'',phone:'',email:'',addr:'',area:'HN',pay:'Từng đơn',terms:30,pct:0,pctFrom:'',pctTo:'',pctNote:'',payVia:'Email',payTo:'',payNote:'',err:[]},c?clone(c):{});
  if(s.plist==null)s.plist=plAuto(s);s.plistT=false;s.nsT=false;if(s.nsShare==null||s.nsShare===''){s.nsShare=Math.max(0,30-(+s.pct||0))}else if(+s.nsShare!==Math.max(0,30-(+s.pct||0)))s.nsT=true;
  s.docs={};(c&&c.payDocs?c.payDocs:['inv','pr']).forEach(k=>s.docs[k]=true);
  s.enTouched=!!String(s.en||'').trim()&&(!c||s.en!==toEn(c.legal));
  const f={s,
    render(){return `<div class="form">${formTop(c?'Sửa khách hàng':'Thêm khách hàng',c?esc(c.name):'')}${ferr(s)}
      <div class="fs"><h3>Thông tin</h3><div class="fg">${F('name','Mã khách hàng')}${F('legal','Tên pháp lý (trên hóa đơn)',{cls:'w2'})}${F('en','Tên tiếng Anh',{cls:'w2'})}${F('mst','MST hoặc số định danh')}${F('src','Nguồn khách',{opts:SOURCES.indexOf(s.src)<0?SOURCES.concat([s.src]):SOURCES})}${F('area','Khu vực',{opts:AREAS})}${F('contact','Người liên hệ')}${F('phone','Số điện thoại')}${F('email','Email')}${F('addr','Địa chỉ',{cls:'wall'})}</div></div>
      <div class="fs"><h3>Bảng giá áp dụng</h3><div class="fg">${F('plist','Bảng giá',{opts:[['','Bảng giá thường']].concat(PLISTS.filter(x=>x[0]===s.plist||x[0]===plAuto(s)).map(x=>[x[0],'Bảng giá riêng '+x[1]])),cls:'w2'})}</div><div class="note info" style="margin-top:8px">Bảng giá riêng chỉ dành cho khách Toyota và Yamaha. Khách có tên hoặc tên pháp lý chứa "Toyota" hoặc "Yamaha" (kể cả nhân viên của họ) tự áp dụng giá riêng trong mọi đơn hàng và báo giá. Khách khác luôn dùng bảng giá thường.</div></div>
      <div class="fs"><h3>Hồ sơ khách cần để thanh toán</h3><div class="note info" style="margin-bottom:10px">Tích những chứng từ khách yêu cầu có đủ thì mới thanh toán. Danh sách này hiện ở hồ sơ khách và in kèm trên đề nghị thanh toán.</div><div class="fg">${PAYDOCS.map(d=>F('docs.'+d[0],esc(d[1]),{t:'check'})).join('')}</div><div class="fg" style="margin-top:10px">${F('payVia','Hình thức gửi hồ sơ',{opts:PAYVIA})}${F('payTo','Người hoặc email nhận hồ sơ',{cls:'w2'})}${F('payNote','Lưu ý khi làm hồ sơ (ví dụ: PO phải ghi trên hóa đơn, nộp trước ngày 25)',{t:'textarea',rows:2,cls:'wall'})}</div></div>
      <div class="fs"><h3>Thanh toán và giảm giá</h3><div class="fg">${F('pay','Đặc điểm thanh toán',{opts:['Từng đơn','Từng tháng']})}${F('terms','Hạn thanh toán (ngày)',{t:'num'})}${F('pct',/nam\s*san/i.test(s.src||'')?'Giảm giá (%)':'Giảm giá (%)',{t:'num'})}${/nam\s*san/i.test(s.src||'')?F('nsShare','Đại lý (%)',{t:'num'}):''}${F('pctFrom','Hiệu lực từ',{t:'date'})}${F('pctTo','Hiệu lực đến',{t:'date'})}${F('pctNote','Ghi chú giảm giá',{cls:'wall'})}</div>${/nam\s*san/i.test(s.src||'')?'<div class="note info" style="margin-top:8px">Tổng hoa hồng cố định 30% = giảm giá cho khách + hoa hồng Nam San được hưởng (ví dụ khách 15% thì Nam San 15%). Xem tổng hợp ở mục Hoa hồng Nam San.</div>':''}</div>
      ${fbar('','Lưu khách hàng')}</div>`},
    onChange(k){if(k==='plist')s.plistT=true;rerender()},
    onInput(k,t){
      if(k==='pct'&&!s.nsT){s.nsShare=Math.max(0,30-(+s.pct||0));const e=document.querySelector('[data-k="nsShare"]');if(e)e.value=s.nsShare}
      if(k==='nsShare')s.nsT=true;
      if(k==='en'){s.enTouched=String(s.en).trim()!=='';return}
      if((k==='legal'||k==='name')&&!s.enTouched){s.en=toEn(s.legal||s.name);const e=document.querySelector('[data-k="en"]');if(e)e.value=s.en}
    },
    async submit(){
      const err=[];if(!String(s.name).trim())err.push('Nhập mã khách hàng.');
      if(+s.pct<0||+s.pct>100)err.push('Giảm giá phải từ 0 đến 100.');
      if(s.pctFrom&&s.pctTo&&s.pctTo<s.pctFrom)err.push('Hiệu lực đến phải sau hiệu lực từ.');
      if(err.length){s.err=err;rerender();return}
      const cid=id||'c'+Date.now().toString(36);
      const doc=Object.assign({},LV('customers')[cid]||{},{name:s.name.trim(),legal:(s.legal||s.name).trim(),en:s.en,mst:s.mst.trim(),src:s.src,contact:s.contact,phone:s.phone,email:s.email,addr:s.addr,area:s.area,payDocs:PAYDOCS.map(d=>d[0]).filter(k=>s.docs[k]),payVia:s.payVia,payTo:s.payTo,payNote:s.payNote,pay:s.pay,terms:+s.terms||30,pct:+s.pct||0,pctFrom:s.pctFrom,pctTo:s.pctTo,pctNote:s.pctNote,plist:s.plistT?(s.plist||''):(s.plist||plAuto(s)),nsShare:/nam\s*san/i.test(s.src||'')?(+s.nsShare||0):null,commPct:null});
      try{await save('customers',cid,doc)}catch(e){return}
      closeDrawer();toast('Đã lưu khách hàng');
    }};
  return f;
}
function discountForm(id){
  const c=CB[id];const s={mst:c.mst||'',pct:c.pct||0,pctFrom:c.pctFrom||'',pctTo:c.pctTo||'',pctNote:c.pctNote||'',terms:c.terms||30,err:[]};
  return {s,
    render(){return `<div class="form">${formTop('Giảm giá theo MST',esc(c.name))}${ferr(s)}<div class="fg">${F('mst','MST hoặc số định danh')}${F('pct','Giảm giá (%)',{t:'num'})}${F('pctFrom','Hiệu lực từ',{t:'date'})}${F('pctTo','Hiệu lực đến',{t:'date'})}${F('terms','Hạn thanh toán (ngày)',{t:'num'})}${F('pctNote','Ghi chú',{cls:'wall'})}</div>
      <div class="note info">Phần trăm này tự điền vào mọi đơn và báo giá mới của khách trong thời gian hiệu lực. Bạn vẫn sửa được từng dòng.</div>${fbar('','Lưu')}</div>`},
    onChange(){rerender()},
    async submit(){
      const err=[];if(+s.pct<0||+s.pct>100)err.push('Giảm giá phải từ 0 đến 100.');if(s.pctFrom&&s.pctTo&&s.pctTo<s.pctFrom)err.push('Hiệu lực đến phải sau hiệu lực từ.');
      if(err.length){s.err=err;rerender();return}
      const doc=Object.assign({},LV('customers')[id]||{},{mst:s.mst.trim(),pct:+s.pct||0,pctFrom:s.pctFrom,pctTo:s.pctTo,pctNote:s.pctNote,terms:+s.terms||30});
      try{await save('customers',id,doc)}catch(e){return}
      closeDrawer();toast('Đã lưu giảm giá');
    }};
}

/* ---- hợp đồng ---- */
function contractForm(cusId){
  const s={cus:cusId,no:'',type:'Hợp đồng nguyên tắc',signed:TODAY,expires:'',note:'',err:[]};
  const f={s,file:null,
    render(){const c=CB[cusId];return `<div class="form">${formTop('Gắn hợp đồng đã ký',esc(c.name))}${ferr(s)}<div class="fg">${F('no','Số hợp đồng')}${F('type','Loại',{opts:['Hợp đồng nguyên tắc','Hợp đồng dịch vụ','Phụ lục','Thỏa thuận giá','Khác']})}${F('signed','Ngày ký',{t:'date'})}${F('expires','Hiệu lực đến',{t:'date'})}${F('note','Ghi chú',{cls:'wall'})}</div>
      <div class="fs"><h3>File hợp đồng</h3>${ASSETS?`<label class="f"><span>Chọn file PDF hoặc ảnh scan</span><input type="file" id="cfile" accept=".pdf,image/png,image/jpeg,image/webp"></label><div class="sm muted" id="cfn">${f.file?esc(f.file.name)+' ('+Math.round(f.file.size/1024)+' KB)':'Chưa chọn file. Bạn có thể lưu số hợp đồng trước và đính kèm sau.'}</div>`:`<div class="note">Tài khoản của bạn chưa được phép tải file lên trang này. Số hợp đồng và ngày ký vẫn được lưu, nhờ chủ trang cấp quyền Editor để đính kèm file.</div>`}</div>
      ${fbar('','Lưu hợp đồng')}</div>`},
    setFile(file){f.file=file||null;const n=$('cfn');if(n)n.textContent=file?file.name+' ('+Math.round(file.size/1024)+' KB)':'Chưa chọn file.'},
    onChange(){},
    async submit(){
      const err=[];if(!s.no.trim()&&!f.file)err.push('Nhập số hợp đồng hoặc chọn file.');
      if(s.expires&&s.signed&&s.expires<s.signed)err.push('Hiệu lực đến phải sau ngày ký.');
      if(f.file&&!/^(application\/pdf|image\/(png|jpeg|webp))$/.test(f.file.type))err.push('Chỉ nhận file PDF, PNG, JPG hoặc WebP.');
      if(f.file&&f.file.size>20*1024*1024)err.push('File lớn hơn 20 MB.');
      if(err.length){s.err=err;rerender();return}
      const doc={cus:cusId,no:s.no.trim(),type:s.type,signed:s.signed,expires:s.expires,note:s.note};
      if(f.file&&ASSETS){try{const r=await ASSETS.upload(f.file,{type:f.file.type});doc.asset=r.id;doc.fname=f.file.name;doc.size=r.sizeBytes}catch(e){s.err=['Không tải được file lên: '+(e&&e.code==='too_large'?'file quá lớn.':e&&e.code==='quota_or_state'?'đã hết dung lượng lưu trữ.':'thử lại sau.')];rerender();return}}
      try{await save('contracts',uid('ct'),doc)}catch(e){return}
      closeDrawer();toast('Đã gắn hợp đồng');
    }};
  return f;
}

/* ---- bảng giá ---- */
const fmtKind=x=>x;
function priceForm(id,preset){
  const p=id?priceById(id):null;
  const s=Object.assign({name:'',kind:'Wifi device',c:'JP',unit:'Ngày',pkg:'',region:'',src:'',cover:'',price:0,note:'',active:true,err:[]},p?clone(p):(preset||{}));
  return {s,
    render(){return `<div class="form">${formTop(id?'Sửa giá':'Thêm giá')}${ferr(s)}<div class="fg">${F('name','Tên dòng giá',{cls:'w2',ph:'Wi-Fi Nhật Bản'})}${F('kind','Loại',{opts:KINDS})}${F('c','Quốc gia',{opts:[['','— Không —']].concat(CTRY_OPTS())})}${F('unit','Đơn vị tính',{opts:UNITS})}${s.kind==='eSIM'?F('pkg','Gói (ví dụ 1GB/ngày × 3 ngày, 10GB / 30 ngày)',{cls:'w2'})+F('src','Nguồn SIM (chỉ nội bộ, khách không thấy)',{cls:'w2'})+F('cover','Vùng phủ sóng',{cls:'wall'}):F('pkg','Gói dữ liệu',{opts:[['','— Không —']].concat(PKGS.map(x=>[x,x]))})}${F('region','Khu vực',{opts:[['','— Không —']].concat(REGIONS.map(x=>[x,x]))})}${F('price','Đơn giá (đ, chưa VAT)',{t:'money'})}${F('note','Ghi chú',{cls:'wall'})}${F('active','Đang áp dụng',{t:'check'})}</div>
      ${fbar(id?`<button class="btn danger" data-act="delprice" data-id="${esc(id)}">Xóa dòng giá</button>`:'',id?'Lưu':'Thêm')}</div>`},
    onChange(k){if(k==='kind'){if(s.kind==='eSIM'){s.unit='Gói';if(PKGS.indexOf(s.pkg)>=0)s.pkg=''}else if(s.unit==='Gói')s.unit='Ngày'}rerender()},
    async submit(){
      const err=[];if(!s.name.trim())err.push('Nhập tên dòng giá.');if(!(+s.price>=0)||s.price==='')err.push('Nhập đơn giá.');
      if(err.length){s.err=err;rerender();return}
      try{await save('prices',id||uid('p'),{name:s.name.trim(),kind:s.kind,c:s.c,unit:s.unit,pkg:s.pkg||'',region:s.region||'',src:s.kind==='eSIM'?(s.src||''):'',cover:s.kind==='eSIM'?(s.cover||''):'',ip:s.ip||0,fup:s.fup||'',ptype:s.ptype||'',amt:s.amt||'',days:s.days||0,v:s.v||1,priceVat:Math.round(+s.price*1.1),price:+s.price,note:s.note,active:s.active!==false})}catch(e){return}
      closeDrawer();toast('Đã lưu bảng giá');
    }};
}

/* ---- thiết bị ---- */
function deviceForm(editCode){
  const m0=editCode&&DEVS[editCode];
  const s=m0?{code:editCode,imei:m0.imei||'',type:m0.type||'Wi-Fi',home:m0.home||'HN',note:(m0.base&&m0.base.note)||'',err:[]}:{code:'',imei:'',type:'Wi-Fi',home:'HN',note:'',err:[]};
  return {s,
    render(){return `<div class="form">${formTop(m0?'Sửa thiết bị '+esc(editCode):'Thêm thiết bị')}${ferr(s)}<div class="fg">${F('code','Mã máy',{ph:'MR120',dis:!!m0})}${F('imei','IMEI')}${F('type','Loại',{opts:['Wi-Fi','Wi-Fi + SIM']})}${F('home','Vị trí',{opts:AREAS})}${F('note','Ghi chú (ví dụ Đà Nẵng nếu vị trí là Other)',{cls:'wall'})}</div>${fbar('','Thêm thiết bị')}</div>`},
    onChange(){rerender()},
    async submit(){
      const code=safeId(s.code);const err=[];
      if(!code)err.push('Nhập mã máy.');else if(!m0&&DEVS[code])err.push('Mã máy '+code+' đã tồn tại.');
      const im=s.imei.trim();if(im&&Object.keys(DEVS).some(k=>k!==code&&DEVS[k].imei===im))err.push('IMEI này đã có ở máy khác.');
      if(err.length){s.err=err;rerender();return}
      const other=s.home==='Other';
      const b0=(m0&&m0.base)||{};const keepNon=b0.k&&b0.k!=='ready';
      const base=keepNon?Object.assign({},b0,{loc:s.home,note:s.note}):{k:'ready',label:'Sẵn sàng',loc:s.home,holder:other?(s.note||'Khác'):'Kho '+s.home,holderType:other?'partner':'kho',note:s.note};
      try{await save('devices',code,{imei:im,type:s.type,home:s.home,base})}catch(e){return}
      closeDrawer();toast(m0?'Đã cập nhật máy '+code:'Đã thêm máy '+code);
      if(m0)setTimeout(()=>openView(()=>devDrawer(code)),60);
    }};
}


/* ---- cập nhật trạng thái máy ---- */
function deviceStatusForm(code){
  const d=devState(code),m=d.m,cur=d.cur;
  const open=!!(cur&&cur.st!=='pending'&&!cur.ret);const using=!!(cur&&cur.st==='using');
  const s={to:d.k==='maint'?'maint':'ready',date:TODAY,firm:(cur&&cur.retFirm)||'',note:(m.base&&m.base.note)||'',err:[]};
  const opts=()=>{const o=[['ready','Sẵn sàng (đã về kho)']];if(open)o.push(['transit','Chờ về kho (đang trên đường về)']);o.push(['maint','Bảo trì']);return o};
  return {s,
    render(){
      const cs=using?`<div class="note info">Máy đang ở ${esc(d.holder)} theo đơn ${esc(cur.o.code)}. Chuyển sang trạng thái khác sẽ ghi nhận máy đã được trả.</div>`:'';
      return `<div class="form">${formTop('Cập nhật trạng thái máy '+esc(code),'Hiện tại: '+DK[d.k][0]+' · '+esc(d.holder))}${ferr(s)}${cs}
      <div class="fg">${F('to','Trạng thái mới',{opts:opts(),cls:'w2'})}
      ${s.to==='ready'?(open?F('date','Ngày trả máy (ghi vào đơn '+cur.o.code+')',{t:'date'}):'')+`<div class="sm muted wall">Máy sẽ về kho ${esc(cur?cur.area:m.home)}, sẵn sàng cho đơn mới.</div>`:''}
      ${s.to==='transit'?F('firm','Đơn vị trả',{opts:FIRMS.slice(1)})+`<div class="sm muted wall">Ngày trả máy của đơn ${esc(cur.o.code)} sẽ để trống cho đến khi máy về kho.</div>`:''}
      ${s.to==='maint'?F('note','Lý do bảo trì',{cls:'wall',ph:'Ví dụ: hỏng pin, chờ sửa'}):''}</div>
      ${fbar('','Cập nhật')}</div>`},
    onChange(){rerender()},
    async submit(){
      const err=[];
      if(s.to==='maint'&&using)err.push('Máy đang cho thuê, hãy ghi nhận trả máy trước khi chuyển sang bảo trì.');
      if(s.to==='ready'&&open&&!s.date)err.push('Chọn ngày trả máy.');
      if(s.to==='ready'&&open&&s.date<cur.s)err.push('Ngày trả máy không được trước ngày bắt đầu thuê.');
      if(s.to==='transit'&&!s.firm)err.push('Chọn đơn vị trả.');
      if(err.length){s.err=err;rerender();return}
      try{
        const home=m.home||'HN',other=home==='Other';
        const kho={k:'ready',label:'Sẵn sàng',loc:home,holder:other?((m.base&&m.base.note)||'Khác'):'Kho '+home,holderType:other?'partner':'kho',note:(m.base&&m.base.note)||''};
        if(s.to==='ready'){if(open)await setLineOp(cur,{st:'returned',ret:s.date,retFirm:null});await save('devices',code,{imei:m.imei,type:m.type,home,base:kho})}
        else if(s.to==='transit'){await setLineOp(cur,{st:'returned',ret:null,retFirm:s.firm});await save('devices',code,{imei:m.imei,type:m.type,home,base:kho})}
        else{await save('devices',code,{imei:m.imei,type:m.type,home,base:{k:'maint',label:'Bảo trì',loc:home,holder:other?'Khác':'Kho '+home,holderType:other?'partner':'kho',note:s.note||''}})}
      }catch(e){return}
      closeDrawer();toast('Đã cập nhật máy '+code+': '+DK[devState(code).k][0]);
      setTimeout(()=>openView(()=>devDrawer(code)),60);
    }};
}

/* ---- báo giá ---- */
const QKINDS=[['wifi','Báo giá Wi-Fi'],['esim','Báo giá eSIM'],['both','Báo giá Wi-Fi và eSIM']];
function newQuoteLine(s){const es=s.kind==='esim';return{pt:es?'d':'',pa:'',prod:es?'eSIM':'Wifi device',c:'',cq:'',multi:false,ctext:'',mc:[],mq:[],manual:false,gp:0,note:'',pkg:'',pid:'',desc:'',unit:es?'Gói':'Ngày',qty:1,days:1,s:'',e:'',price:0,ins:0,dpct:es?0:formPct(s),fee:0,pm:false,dm:false}}
const cbx=(k,val,opts,ph)=>`<div class="cbx" data-opts="${esc(JSON.stringify(opts))}"><input data-k="${k}" data-t="text" data-cs="q" autocomplete="off" placeholder="${esc(ph)}" value="${esc(val)}"><span class="cbx-ar">▾</span><div class="cbx-l" hidden></div></div>`;
const qAmtN=a=>{const m=/^(\d+(?:\.\d+)?)(GB|MB)$/.exec(a||'');return m?+m[1]*(m[2]==='GB'?1000:1):0};
const qEsimBase=l=>prices().filter(p=>p.active!==false&&p.kind==='eSIM'&&p.c===l.c&&(l.pt==='d'?p.ptype==='d':l.pt==='t'?p.ptype!=='d':true));
const qAmtOpts=l=>[['','Tất cả']].concat([...new Set(qEsimBase(l).map(p=>p.amt).filter(Boolean))].sort((a,b)=>qAmtN(a)-qAmtN(b)).map(a=>[a,l.pt==='d'?a+'/ngày':a]));
const qPkgOpts=l=>[['','Chọn gói…']].concat(prices().filter(p=>p.active!==false&&p.c===l.c&&(l.prod==='eSIM'?(p.kind==='eSIM'&&(l.pt==='d'?p.ptype==='d':l.pt==='t'?p.ptype!=='d':true)&&(!l.pa||p.amt===l.pa)):((p.kind==='Wifi device'||p.kind==='Wifi device insert sim')&&p.unit===l.unit))).map(p=>[p.id,`${p.pkg||p.name} · ${vnd(p.price)}/${String(p.unit).toLowerCase()}`]));
const qCtryOpts=l=>{const set={};prices().forEach(p=>{if(p.active!==false&&p.c&&CTRY[p.c]&&(l.prod==='eSIM'?p.kind==='eSIM':(p.kind==='Wifi device'||p.kind==='Wifi device insert sim')))set[p.c]=1});return Object.keys(set).map(k=>CTRY[k]).sort((a,b)=>a.localeCompare(b,'vi'))};
const qPriceOpts=l=>[['','Dòng tự nhập']].concat(prices().filter(p=>p.active!==false&&(l.prod==='eSIM'?p.kind==='eSIM':(p.kind==='Wifi device'||p.kind==='Wifi device insert sim'))).map(p=>[p.id,`${p.name} · ${vnd(p.price)}/${String(p.unit).toLowerCase()}`]));
function quoteForm(id,pre){
  const q=id?LV('quotes')[id]:null;
  const s=q?Object.assign({err:[]},clone(q)):Object.assign({kind:'wifi',cus:'',date:TODAY,valid:addDays(TODAY,14),vat:10,status:'Nháp',signer:'',note:'',lines:[],err:[],nc:{pct:0}},pre||{});
  if(q)s.kind=qKind(q);PLSCOPE=custPL(s.cus);
  if(s.sname==null)s.sname=(q&&((q.sg&&q.sg.name)||signSnap(q.signer).name))||signSnap(s.signer).name||'';
  const fillC=()=>{const c=CB[s.cus];if(c){s.qcontact=c.contact||'';s.qphone=c.phone||'';s.qemail=c.email||''}};
  if(!q){s.qcontact=s.qcontact||'';s.qphone=s.qphone||'';s.qemail=s.qemail||'';if(s.cus&&!s.qcontact&&!s.qphone&&!s.qemail)fillC()}else{if(s.qcontact==null){s.qcontact='';s.qphone='';s.qemail=''}}
  if(!s.lines.length)s.lines.push(newQuoteLine(s));
  s.lines.forEach(l=>{if(!l.prod)l.prod=l.unit==='Gói'?'eSIM':'Wifi device';if(l.pa==null)l.pa='';if(l.prod==='eSIM'&&!l.pt){const it0=l.pid?priceById(l.pid):null;l.pt=it0?(it0.ptype==='d'?'d':'t'):(/ngày\s*×|\/ngày/i.test(l.pkg||'')?'d':(l.pkg?'t':'d'))}if(l.pkg==null||l.pkg==='')l.pkg=l.desc||'';if(l.c==null)l.c='';l.cq=l.c?(CTRY[l.c]||''):(l.cq||'');if(l.multi==null){l.multi=false;l.ctext=l.ctext||''}if(!Array.isArray(l.mc))l.mc=[];l.mq=l.mc.map(k=>CTRY[k]||'');if(l.multi&&!l.mq.length){l.mc=['',''];l.mq=['','']}if(l.manual==null)l.manual=!l.pid;if(l.gp==null){const it=l.pid?priceById(l.pid):null;l.gp=it?it.price:0}if(l.note==null)l.note='';if(l.ins==null)l.ins=0;if(l.s==null)l.s='';if(l.e==null)l.e=''});
  const syncDays=l=>{if(l.prod!=='eSIM'&&l.unit==='Ngày'&&l.s&&l.e&&l.e>=l.s)l.days=dayDiff(l.s,l.e)+1};
  const f={s,
    render(){
      const lines=s.lines.map((l,i)=>{const es=l.prod==='eSIM';
        const ckx=(k,t,on)=>`<label class="ckx"><input type="checkbox" data-k="lines.${i}.${k}" data-t="bool"${on?' checked':''}> ${t}</label>`;
        const ctry=(l.multi&&!es)?`<div class="mcl">${l.mq.map((v,j)=>`<div class="mcr">${cbx(`lines.${i}.mq.${j}`,v,Object.values(CTRY).sort((a,b)=>a.localeCompare(b,'vi')),'Chọn quốc gia…')}<button type="button" class="xdel" data-act="qcdel" data-id="${i}|${j}" title="Bỏ nước này" aria-label="Bỏ nước này">✕</button></div>`).join('')}<button type="button" class="btn" data-act="qcadd" data-id="${i}">${ico('plus')}Thêm nước</button></div>`
          :cbx(`lines.${i}.cq`,l.cq,qCtryOpts(l),'Chọn quốc gia…');
        const man=es?(l.manual||(!!l.c&&qPkgOpts(l).length<=1)):l.manual;
        const pk=man?`<input data-k="lines.${i}.pkg" data-t="text" autocomplete="off" placeholder="${es?'Ví dụ: 20GB/5Days':'Ví dụ: 5GB/day'}" value="${esc(l.pkg)}">`
          :`<select data-k="lines.${i}.pid" data-t="text"${l.c?'':' disabled'}>${qPkgOpts(l).map(x=>`<option value="${esc(x[0])}"${String(x[0])===String(l.pid)?' selected':''}>${esc(x[1])}</option>`).join('')}</select>`;
        return `<div class="ln qln"><div class="ln-h"><span>Mục ${i+1} · ${es?'eSIM':'Wi-Fi'}</span></div>
        ${s.kind==='both'?`<div class="fg" style="margin-bottom:8px">${F(`lines.${i}.prod`,'Sản phẩm',{opts:[['Wifi device','Wi-Fi'],['eSIM','eSIM']]})}</div>`:''}
        ${es?`<div class="qpf"><div class="f"><span>Chọn gói theo</span><div class="seg"><button type="button" class="${l.pt==='d'?'on':''}" data-act="qpt" data-id="${i}|d">Theo ngày</button><button type="button" class="${l.pt==='t'?'on':''}" data-act="qpt" data-id="${i}|t">Theo tổng dung lượng</button></div></div>${l.c&&!man?F(`lines.${i}.pa`,l.pt==='d'?'Dung lượng mỗi ngày':'Tổng dung lượng',{opts:qAmtOpts(l)}):''}</div>`:''}
        <div class="qr1${es?' es':''}"><label class="f"><span>Quốc gia / Country ${es?'':ckx('multi','Gộp nhiều nước',l.multi)}</span>${ctry}</label>
          <label class="f"><span>Gói dịch vụ ${es?'':ckx('manual','Chỉnh tay',l.manual||l.multi)}</span>${pk}</label>
          ${es?'':F(`lines.${i}.unit`,'Loại tính giá',{opts:[['Ngày','Theo ngày'],['Tháng','Theo tháng']]})}
          ${F(`lines.${i}.qty`,'SL',{t:'num'})}
          <div class="f"><span>Thành tiền (chưa VAT)</span><div class="amt" id="qa_${i}">0 đ</div></div>
          <div class="f"><span>&nbsp;</span>${s.lines.length>1?`<button class="btn sm danger" data-act="fdel" data-id="${i}" title="Xóa mục" aria-label="Xóa mục">${ico('trash')}</button>`:''}</div></div>
        <div class="qr2${es?' es':''}">${F(`lines.${i}.gp`,'Giá gốc (đ)',{t:'money',dis:true})}${F(`lines.${i}.price`,es?'Đơn giá (đ)':'Đơn giá/ngày (đ)',{t:'money'})}
          ${es?'':F(`lines.${i}.s`,'Ngày bắt đầu',{t:'date'})+F(`lines.${i}.e`,'Ngày kết thúc',{t:'date'})}
          ${F(`lines.${i}.days`,es?'Số ngày của gói':(l.unit==='Tháng'?'Số tháng':'Số ngày'),{t:'num'})}</div>
        ${es?'':`<div class="qr3">${F(`lines.${i}.dpct`,'Giảm giá (%)',{t:'num'})}${F(`lines.${i}.ins`,'Bảo hiểm (đ)',{t:'money'})}${F(`lines.${i}.fee`,'Phí khác (đ)',{t:'money'})}</div>`}
        <div class="fg" style="margin-top:8px">${F(`lines.${i}.note`,'Ghi chú / Note',{cls:'wall',ph:'Ghi chú cho dòng này…'})}</div><div class="calc" id="ql_${i}"></div></div>`}).join('');
      const c=s.cus?CB[s.cus]:null;
      return `<div class="form">${formTop(id?'Sửa báo giá':'Tạo báo giá',id?esc(q.no):'Chọn loại báo giá, khách hàng rồi thêm các mục.')}${ferr(s)}
      <div class="fs"><h3>Thông tin</h3><div class="fg">${F('kind','Loại báo giá',{opts:QKINDS,cls:'w2'})}${F('cus','Khách hàng',{opts:[['','— Chọn khách hàng —']].concat(CUS.map(c=>[c.id,(c.legal||c.name)+(c.mst?' · '+c.mst:'')])),cls:'wall'})}${F('date','Ngày báo giá',{t:'date'})}${F('valid','Hiệu lực đến',{t:'date'})}${F('vat','VAT (%)',{opts:[[10,'10%'],[8,'8%'],[0,'0%']],num:true})}${F('status','Trạng thái',{opts:QSTATUS})}${F('signer','Người lập',{opts:signerOpts(),cls:'w2'})}</div>
      ${c?`<div class="cinfo"><span>MST: <b>${esc(c.mst||'—')}</b></span></div><div class="cinfo" style="margin-top:6px"><span>Địa chỉ: <b>${esc(c.addr||'—')}</b></span></div>${s.kind==='esim'?'':`<div class="cinfo" style="margin-top:6px"><span>Giảm giá: <b>${custPct(c)?custPct(c)+'%':'Không có'}</b>${s.kind==='both'?' <span class="muted">(chỉ áp dụng cho Wi-Fi, eSIM không có giảm giá)</span>':''}</span></div>`}`:''}${plBanner(s)}</div>
      <div class="fs"><h3>Nội dung báo giá</h3>${lines}<div class="btns"><button class="btn" data-act="fadd">${ico('plus')}Thêm mục</button></div></div>
      <div class="fs"><div class="fg">${F('note','Ghi chú trên báo giá',{t:'textarea',rows:2,cls:'wall'})}</div></div>
      <div class="panel"><div class="sum" style="border-top:0"><div><span class="muted">Chưa VAT</span><span class="num" id="qt_ex"></span></div><div><span class="muted">VAT</span><span class="num" id="qt_vat"></span></div><div class="tot"><span>Tổng cộng</span><span class="num" id="qt_tot"></span></div></div></div>
      ${fbar('',id?'Lưu báo giá':'Tạo báo giá')}</div>`;
    },
    after(){f.live()},
    live(){
      s.lines.forEach((l,i)=>{const x=qLine(l);const n=$('ql_'+i);if(n){n.innerHTML=l.prod==='eSIM'?`<span>Đơn giá: <b>${vnd(+l.price||0)} đ</b></span>`:`<span>Đơn giá × SL × ngày: <b>${vnd(x.base)}</b></span><span>Giảm: <b>${vnd(x.disc)}</b></span>`}const a=$('qa_'+i);if(a)a.textContent=vnd(x.ex)+' đ'});
      const t=qTot(s);const a=$('qt_ex');if(a){a.textContent=vnd(t.ex)+' đ';$('qt_vat').textContent=vnd(t.vat)+' đ';$('qt_tot').textContent=vnd(t.total)+' đ'}
    },
    onInput(k){const m=k.match(/^lines\.(\d+)\.(\w+)$/);if(m){const l=s.lines[+m[1]];if(m[2]==='price')l.pm=true;if(m[2]==='dpct')l.dm=true}f.live()},
    onChange(k){
      if(k==='signer')s.sname=signSnap(s.signer).name||'';
      if(k==='cus'){PLSCOPE=custPL(s.cus);const p=formPct(s);s.lines.forEach(l=>{if(!l.dm&&l.prod!=='eSIM')l.dpct=p});fillC();
        s.lines.forEach(l=>{if(l.pid&&!l.manual){const o=priceById(l.pid);const n=o&&prices().find(x=>x.active!==false&&x.kind===o.kind&&x.c===o.c&&x.unit===o.unit&&x.pkg===String(o.pkg||'').replace(/ · phương án \d+$/,''));
          if(n){l.pid=n.id;l.price=n.price;l.gp=n.price;l.desc=n.name;l.pkg=n.pkg}else{l.pid='';l.gp=0;l.manual=true;l.price=0}}})}
      if(k==='kind'){s.lines.forEach(l=>{if(s.kind==='esim')l.prod='eSIM';else if(s.kind==='wifi')l.prod='Wifi device';if(l.prod==='eSIM'){l.unit='Gói';l.dpct=0;l.fee=0;l.ins=0;l.s='';l.e='';l.pt=l.pt||'d'}else if(l.unit==='Gói')l.unit='Ngày';l.pid='';l.gp=0;if(!l.manual)l.pkg=''})}
      const mm=k.match(/^lines\.(\d+)\.mq\.(\d+)$/);
      if(mm){const l=s.lines[+mm[1]],j=+mm[2];const t=nrm(l.mq[j]);let hit=Object.keys(CTRY).find(x=>nrm(CTRY[x])===t);if(!hit&&t){const cand=Object.keys(CTRY).filter(x=>nrm(CTRY[x]).indexOf(t)===0);if(cand.length===1)hit=cand[0]}
        l.mc[j]=hit||(t?l.mc[j]:'')||'';l.mq[j]=l.mc[j]?CTRY[l.mc[j]]:''}
      const m=k.match(/^lines\.(\d+)\.(\w+)$/);
      if(m){const l=s.lines[+m[1]],p=m[2];
        if(p==='pa'){const it=l.pid?priceById(l.pid):null;if(it&&l.pa&&it.amt!==l.pa){l.pid='';l.gp=0;l.pkg=''}}
        if(p==='prod'){l.pid='';l.gp=0;l.pkg='';l.c='';l.cq='';l.pa='';if(l.prod==='eSIM')l.pt=l.pt||'d';if(l.prod==='eSIM'){l.unit='Gói';l.dpct=0;l.fee=0;l.ins=0;l.s='';l.e=''}else{l.unit='Ngày';if(!l.dm)l.dpct=formPct(s)}}
        if(p==='cq'){const t=nrm(l.cq);let hit=Object.keys(CTRY).find(x=>nrm(CTRY[x])===t);if(!hit&&t){const cand=Object.keys(CTRY).filter(x=>nrm(CTRY[x]).indexOf(t)===0);if(cand.length===1)hit=cand[0]}
          if(hit){if(hit!==l.c){l.c=hit;l.pa='';l.pid='';l.gp=0;if(!l.manual)l.pkg='';l.pm=false}l.cq=CTRY[hit]}else{l.cq=l.c?(CTRY[l.c]||''):''}}
        if(p==='multi'){if(l.multi){l.manual=true;if(!l.mc.length||l.mc.every(x=>!x))l.mc=[l.c||'',''];l.mq=l.mc.map(x=>CTRY[x]||'');l.pid='';l.gp=0}else{const f1=l.mc.find(Boolean);if(f1&&!l.c){l.c=f1;l.cq=CTRY[f1]}}}
        if(p==='manual'){if(l.manual){l.pid='';l.gp=0}else{l.pkg='';l.pid=''}}
        if(p==='pid'){const it=priceById(l.pid);if(it){l.pkg=it.pkg||it.note||'';l.unit=l.prod==='eSIM'?'Gói':(it.unit==='Tháng'?'Tháng':'Ngày');l.price=it.price;l.gp=it.price;l.pm=false;l.desc=it.name;if(l.prod==='eSIM')l.days=it.days||l.days||1}else{l.pkg='';l.gp=0}}
        if(p==='unit'){if(l.unit==='Tháng'){l.s='';l.e='';l.days=1}if(l.pid){const it=priceById(l.pid);if(it&&it.unit!==l.unit){l.pid='';l.gp=0;l.pkg=''}}}
        if(p==='s'||p==='e'||p==='unit')syncDays(l);
      }
      rerender();
    },
    setPt(i,t){const l=s.lines[i];if(!l||l.pt===t)return;l.pt=t;l.pa='';const it=l.pid?priceById(l.pid):null;if(it&&(t==='d')!==(it.ptype==='d')){l.pid='';l.gp=0;l.pkg=''}rerender()},
    qcAdd(i){const l=s.lines[i];if(!l)return;l.mc.push('');l.mq.push('');rerender()},
    qcDel(i,j){const l=s.lines[i];if(!l)return;l.mc.splice(j,1);l.mq.splice(j,1);if(!l.mc.length){l.mc=[''];l.mq=['']}rerender()},
    add(){s.lines.push(newQuoteLine(s));rerender()},
    del(i){s.lines.splice(+i,1);if(!s.lines.length)s.lines.push(newQuoteLine(s));rerender()},
    async submit(){
      const err=[];if(!s.cus)err.push('Chọn khách hàng.');
      if(s.valid&&s.valid<s.date)err.push('Hiệu lực phải sau ngày báo giá.');
      s.lines.forEach((l,i)=>{if(l.multi?!l.mc.filter(Boolean).length:!l.c)err.push('Mục '+(i+1)+': '+(l.multi?'chọn ít nhất một quốc gia (gõ tên rồi chọn trong danh sách).':'chọn quốc gia (gõ tên rồi chọn trong danh sách).'));if(!String(l.pkg||'').trim())err.push('Mục '+(i+1)+': nhập dung lượng / gói.');if(!(+l.price>0))err.push('Mục '+(i+1)+': nhập đơn giá.');if(l.prod!=='eSIM'&&l.s&&l.e&&l.e<l.s)err.push('Mục '+(i+1)+': ngày kết thúc phải sau ngày bắt đầu.')});
      if(err.length){s.err=err;rerender();$('dr').scrollTop=0;return}
      const qid=id||uid('q');
      const doc={no:q?q.no:nextNo('BG','quotes'),kind:s.kind,cus:s.cus,qcontact:String(s.qcontact||'').trim(),qphone:String(s.qphone||'').trim(),qemail:String(s.qemail||'').trim(),date:s.date,valid:s.valid,vat:+s.vat,status:s.status,signer:s.signer||'',sg:Object.assign(signSnap(s.signer),{name:String(s.sname||'').trim()||signSnap(s.signer).name}),note:s.note,order:q?q.order||'':'',created:q?q.created:TODAY,
        lines:s.lines.map(l=>{const es=l.prod==='eSIM';return{pid:l.pid||'',prod:es?'eSIM':'Wifi device',c:l.multi?'':(l.c||''),multi:!!l.multi,mc:l.multi?l.mc.filter(Boolean):[],ctext:l.multi?l.mc.filter(Boolean).map(k=>CTRY[k]).join(' + '):'',note:String(l.note||'').trim(),gp:+l.gp||0,pkg:String(l.pkg||'').trim(),desc:(l.multi?l.mc.filter(Boolean).map(k=>CTRY[k]).join(' + '):(CTRY[l.c]||''))+(l.pkg?' · '+String(l.pkg).trim():''),unit:es?'Gói':l.unit,qty:+l.qty||1,days:+l.days||1,s:es?'':(l.s||''),e:es?'':(l.e||''),price:+l.price,ins:es?0:(+l.ins||0),dpct:es?0:(+l.dpct||0),fee:es?0:(+l.fee||0)}})};
      try{await save('quotes',qid,doc)}catch(e){return}
      closeDrawer();toast('Đã lưu báo giá '+doc.no);
      setTimeout(()=>openView(()=>docDrawer('quote',qid)),60);
    }};
  return f;
}

/* ---- biên bản bàn giao ---- */
function handoverForm(id,pre){
  const h=id?LV('handovers')[id]:null;
  const s=h?Object.assign({err:[],apply:false,devs:{}},clone(h)):Object.assign({order:'',type:'Giao',date:TODAY,signer:'',ours:SET().signer||'',theirs:'',tphone:'',devs:{},acc:{charger:1,cable:1,box:1,pouch:1,sim:0},cond:'Thiết bị hoạt động bình thường, ngoại hình tốt, đủ phụ kiện.',note:'',apply:true,err:[]},pre||{});
  if(h){(h.items||[]).forEach(x=>{s.devs[x.esim?'esim:'+x.li:x.dev]=true})}
  const ESC_COND='eSIM được gửi/kích hoạt cho khách theo đúng thông tin trong đơn hàng.',DEV_COND='Thiết bị hoạt động bình thường, ngoại hình tốt, đủ phụ kiện.';
  const fill=()=>{const o=ORD.find(x=>x.code===s.order);if(!o)return;const c=CB[o.cus];s.devs={};o.lines.forEach((l,i)=>{if(isPhys(l))s.devs[l.dev]=true;else s.devs['esim:'+i]=true});s.theirs=c.contact||'';s.tphone=c.phone||'';
    const only=o.lines.every(l=>!isPhys(l));
    if(only){s.type='Giao';if(!s.cond||s.cond===DEV_COND)s.cond=ESC_COND}else if(s.cond===ESC_COND)s.cond=DEV_COND;
    else if(!pre||!pre.type)s.type=o.lines.some(l=>l.st==='pending')?'Giao':'Thu'};
  if(s.order&&!h&&!(pre&&pre.devs))fill();
  const f={s,
    render(){
      const o=ORD.find(x=>x.code===s.order);
      const onlyE=!!o&&o.lines.every(l=>!isPhys(l)),anyP=!!o&&o.lines.some(isPhys);
      const devs=o?[...new Set(o.lines.filter(isPhys).map(l=>l.dev))].map(d=>`<label class="ck"><input type="checkbox" data-k="devs.${esc(d)}" data-t="bool"${s.devs[d]?' checked':''}> <span class="mono">${esc(d)}</span> <span class="muted">${esc((DEVS[d]||{}).imei||'')}</span></label>`).join('')+o.lines.map((l,i)=>isPhys(l)?'':`<label class="ck"><input type="checkbox" data-k="devs.esim:${i}" data-t="bool"${s.devs['esim:'+i]?' checked':''}> <b>eSIM</b> <span class="mono">${esc(l.iccid||'(chưa có ICCID)')}</span> <span class="muted">${esc((CTRY[l.c]||'')+(l.pkg?' · '+l.pkg:'')+(l.s?' · '+fmtD(l.s)+' – '+fmtD(l.e):''))}</span></label>`).join(''):'<span class="muted">Chọn đơn hàng để hiện danh sách thiết bị / eSIM.</span>';
      return `<div class="form">${formTop(id?'Sửa biên bản':'Lập biên bản bàn giao',id?esc(h.no):'')}${ferr(s)}
      <div class="fs"><div class="fg">${F('order','Đơn hàng',{opts:orderOpts(),cls:'w2',dis:!!id})}${F('type','Loại biên bản',{opts:onlyE?[['Giao','Bàn giao eSIM cho khách']]:[['Giao','Giao máy cho khách'],['Thu','Thu hồi máy từ khách']]})}${F('date','Ngày lập',{t:'date'})}${F('signer','Người ký bên công ty',{opts:signerOpts()})}${F('ours','Đại diện công ty')}${F('theirs','Đại diện khách')}${F('tphone','SĐT khách')}</div></div>
      <div class="fs"><h3>${onlyE?'eSIM trong biên bản':'Thiết bị / eSIM trong biên bản'}</h3><div class="fg">${devs}</div></div>
      ${anyP||!o?`<div class="fs"><h3>Phụ kiện kèm theo (số lượng)</h3><div class="fg">${ACC.map(a=>F('acc.'+a[0],a[1],{t:'num'})).join('')}</div></div>`:''}
      <div class="fs"><div class="fg">${F('cond',onlyE?'Tình trạng bàn giao':'Tình trạng thiết bị',{t:'textarea',rows:2,cls:'wall'})}${F('note','Ghi chú',{cls:'wall'})}</div>
      ${id?'':F('apply',onlyE?'Đồng thời ghi nhận đã bàn giao eSIM (đổi trạng thái sang Đang sử dụng)':s.type==='Giao'?'Đồng thời ghi nhận đã giao máy (đổi trạng thái sang Đang cho thuê)':'Đồng thời ghi nhận đã thu hồi máy (ngày trả là ngày lập biên bản)',{t:'check'})}</div>
      ${fbar('',id?'Lưu biên bản':'Lập biên bản')}</div>`;
    },
    onChange(k){if(k==='order')fill();if(k==='signer'){const g=signSnap(s.signer);if(g.name)s.ours=g.name}rerender()},
    async submit(){
      const o=ORD.find(x=>x.code===s.order);const err=[];
      if(!o)err.push('Chọn đơn hàng.');
      const lines=o?o.lines.filter((l,i)=>isPhys(l)?s.devs[l.dev]:s.devs['esim:'+i]):[];
      if(o&&!lines.length)err.push('Chọn ít nhất một thiết bị hoặc eSIM.');
      if(err.length){s.err=err;rerender();return}
      const items=lines.map(l=>isPhys(l)?{ins:(+l.ins>0),dev:l.dev,imei:(DEVS[l.dev]||{}).imei||'',pkg:(CTRY[l.c]||'')+(l.pkg?' · '+l.pkg:''),s:l.s,e:l.e}:{esim:true,li:o.lines.indexOf(l),ins:null,dev:'eSIM',iccid:l.iccid||'',imei:'',pkg:(CTRY[l.c]||'')+(l.pkg?' · '+l.pkg:''),s:l.s,e:l.e});
      const hid=id||uid('b');
      const doc={no:h?h.no:nextNo('BB','handovers'),order:o.code,cus:o.cus,type:s.type,date:s.date,signer:s.signer||'',sg:signSnap(s.signer),ours:s.ours,theirs:s.theirs,tphone:s.tphone,items,acc:s.acc,cond:s.cond,note:s.note};
      try{await save('handovers',hid,doc)}catch(e){return}
      if(!id&&s.apply){
        for(const l of lines){
          if(s.type==='Giao'&&l.st==='pending')await setLineOp(l,{st:'using',del:s.date}).catch(()=>{});
          if(s.type==='Thu'&&isPhys(l)&&(l.st==='using'||(l.st!=='pending'&&!l.ret)))await setLineOp(l,{st:'returned',ret:s.date}).catch(()=>{});
        }
      }
      closeDrawer();toast('Đã lưu biên bản '+doc.no);
      setTimeout(()=>openView(()=>docDrawer('handover',hid)),60);
    }};
  return f;
}

/* ---- đề nghị thanh toán ---- */
const payChoices=(cus,basis)=>basis==='invoice'?Object.values(INVS).filter(i=>i.cus===cus&&i.out>0).sort((a,b)=>a.date<b.date?-1:1).map(i=>({key:String(i.no),label:`Hóa đơn ${i.no} · ${fmtD(i.date)} · còn ${vnd(i.out)} đ${i.over?' · quá hạn':''}`}))
  :ORD.filter(o=>o.cus===cus&&orderTotal(o)-orderPaid(o)>0).sort((a,b)=>a.date<b.date?-1:1).map(o=>({key:o.code,label:`Đơn ${o.code} · ${fmtD(o.date)} · còn ${vnd(orderTotal(o)-orderPaid(o))} đ`}));
function payreqForm(id,pre){
  const r=id?LV('payreqs')[id]:null;
  const s=r?{err:[],id,cus:r.cus,basis:r.items[0]?r.items[0].type:'invoice',picks:{},date:r.date,due:r.due,note:r.note||'',signer:r.signer||'',status:r.status||'Nháp'}:Object.assign({cus:'',basis:'invoice',picks:{},date:TODAY,due:addDays(TODAY,7),note:'',signer:'',status:'Nháp',err:[]},pre||{});
  if(r)r.items.forEach(x=>{s.picks[x.ref]=true});
  const all=()=>{s.picks={};payChoices(s.cus,s.basis).forEach(c=>{s.picks[c.key]=true})};
  if(s.cus&&!r&&!Object.keys(s.picks).length)all();
  const f={s,
    render(){
      const ch=s.cus?payChoices(s.cus,s.basis):[];
      return `<div class="form">${formTop(id?'Sửa đề nghị thanh toán':'Lập đề nghị thanh toán',id?esc(r.no):'')}${ferr(s)}
      <div class="fs"><div class="fg">${F('cus','Khách hàng',{opts:custOpts(),cls:'w2',dis:!!id})}${F('basis','Lập theo',{opts:[['invoice','Hóa đơn đã xuất'],['order','Đơn hàng']],dis:!!id})}${F('date','Ngày lập',{t:'date'})}${F('due','Hạn thanh toán',{t:'date'})}${F('signer','Người ký',{opts:signerOpts(),cls:'w2'})}</div></div>
      <div class="fs"><h3>${s.basis==='invoice'?'Hóa đơn còn nợ':'Đơn hàng còn phải thu'}</h3>${s.cus?(ch.length?ch.map(c=>`<label class="ck"><input type="checkbox" data-k="picks.${esc(c.key)}" data-t="bool"${s.picks[c.key]?' checked':''}> ${esc(c.label)}</label>`).join(''):'<div class="muted">Khách này không còn khoản nào cần thu theo cách lập này.</div>'):'<div class="muted">Chọn khách hàng để hiện các khoản cần thu.</div>'}</div>
      <div class="fs"><div class="fg">${F('note','Ghi chú',{cls:'wall'})}</div></div>${fbar('',id?'Lưu đề nghị':'Lập đề nghị')}</div>`;
    },
    onChange(k){if(k==='cus'||k==='basis')all();rerender()},
    async submit(){
      const err=[];if(!s.cus)err.push('Chọn khách hàng.');
      const keys=Object.keys(s.picks).filter(k=>s.picks[k]);
      let items=[];
      if(s.basis==='invoice')items=keys.map(k=>INVS[k]).filter(Boolean).map(i=>({type:'invoice',ref:String(i.no),date:i.date,desc:'Cho thuê thiết bị, đơn '+[...new Set(i.lines.map(l=>l.o.code))].join(', '),total:i.total,paid:i.paid,ask:i.out}));
      else items=keys.map(k=>ORD.find(o=>o.code===k)).filter(Boolean).map(o=>({type:'order',ref:o.code,date:o.date,desc:'Máy: '+[...new Set(o.lines.map(l=>l.dev))].join(', '),total:orderTotal(o),paid:orderPaid(o),ask:orderTotal(o)-orderPaid(o)}));
      if(s.cus&&!items.length){if(r&&r.items.length&&keys.length)items=r.items.filter(x=>s.picks[x.ref]);else err.push('Chọn ít nhất một khoản.')}
      if(s.due<s.date)err.push('Hạn thanh toán phải sau ngày lập.');
      if(err.length){s.err=err;rerender();return}
      const pid=id||uid('r');
      const doc={no:r?r.no:nextNo('DN','payreqs'),cus:s.cus,date:s.date,due:s.due,note:s.note,signer:s.signer||'',sg:signSnap(s.signer),status:r?r.status||'Nháp':'Nháp',items};
      try{await save('payreqs',pid,doc)}catch(e){return}
      closeDrawer();toast('Đã lưu đề nghị '+doc.no);
      setTimeout(()=>openView(()=>docDrawer('payreq',pid)),60);
    }};
  return f;
}

/* ---- hóa đơn: ghi nhận xuất và thu ---- */
function bulkInvoiceForm(codes){
  const os=codes.map(c=>ORD.find(x=>x.code===c)).filter(Boolean);
  const items=os.map(o=>({o,cand:o.lines.filter(l=>!l.inv)})).filter(x=>x.cand.length);
  const skipped=os.length-items.length;
  const s={no:'',date:TODAY,method:'Chưa thanh toán',mode:'each',err:[]};
  return {s,
    render(){const tot=sum(items,x=>sum(x.cand,l=>l.total));
      return `<div class="form">${formTop('Ghi hóa đơn hàng loạt',items.length+' đơn có dòng chưa xuất hóa đơn')}${ferr(s)}<div class="fg">${F('no','Số hóa đơn (đầu tiên)',{t:'num'})}${F('date','Ngày hóa đơn',{t:'date'})}${F('method','Phương thức thanh toán',{opts:['Chưa thanh toán','Chuyển khoản','Tiền mặt','Thẻ']})}${F('mode','Cách ghi',{opts:[['each','Mỗi đơn một hóa đơn (số tăng dần)'],['merge','Gộp một hóa đơn (cùng khách hàng)']],cls:'w2'})}</div>
      <div class="fs"><h3>Đơn đưa vào hóa đơn</h3>${items.map(x=>`<div class="sm" style="padding:3px 0"><span class="mono">${esc(x.o.code)}</span> · ${esc(CB[x.o.cus].name)} · ${x.cand.length} dòng · ${vnd(sum(x.cand,l=>l.total))} đ</div>`).join('')||'<div class="muted">Không có đơn nào đủ điều kiện</div>'}</div>
      ${skipped?`<div class="note info">${skipped} đơn bị bỏ qua vì đã xuất hóa đơn.</div>`:''}<div class="note info" style="margin-top:8px">Tổng giá trị: <b>${vnd(tot)} đ</b> (gồm VAT).</div>${fbar('','Ghi hóa đơn')}</div>`},
    onChange(){rerender()},
    async submit(){
      const err=[];const start=Math.round(+s.no||0);
      if(!(start>0))err.push('Nhập số hóa đơn.');if(!items.length)err.push('Không có đơn nào đủ điều kiện.');
      if(s.mode==='merge'&&new Set(items.map(x=>x.o.cus)).size>1)err.push('Gộp một hóa đơn chỉ dùng cho các đơn cùng một khách hàng.');
      const nos=s.mode==='merge'?[start]:items.map((x,i)=>start+i);
      nos.forEach(n=>{if(start>0&&INVMETA[n])err.push('Số hóa đơn '+n+' đã tồn tại.')});
      if(err.length){s.err=err;rerender();return}
      try{for(let i=0;i<nos.length;i++){await save('invoices',String(nos[i]),{no:nos[i],date:s.date,recv:null,method:s.method});
        const grp=s.mode==='merge'?items:[items[i]];for(const x of grp)for(const l of x.cand)await setLineOp(l,{inv:nos[i]})}}catch(e){return}
      S.f.orders.sel={};closeDrawer();toast('Đã ghi '+nos.length+' hóa đơn');if(S.view==='orders')drawOrders();
    }};
}
function bulkPayForm(codes){
  const nos=[];codes.forEach(c=>{const o=ORD.find(x=>x.code===c);if(o)o.lines.forEach(l=>{if(l.inv&&INVS[l.inv]&&!INVS[l.inv].recv&&nos.indexOf(String(l.inv))<0)nos.push(String(l.inv))})});
  const s={date:TODAY,method:'Chuyển khoản',err:[]};
  return {s,
    render(){const tot=sum(nos,n=>INVS[n].out);
      return `<div class="form">${formTop('Ghi nhận thu tiền hàng loạt',nos.length+' hóa đơn chưa thu')}${ferr(s)}<div class="fg">${F('date','Ngày nhận tiền',{t:'date'})}${F('method','Phương thức',{opts:['Chuyển khoản','Tiền mặt','Thẻ']})}</div>
      <div class="fs"><h3>Hóa đơn được ghi nhận</h3>${nos.map(n=>`<div class="sm" style="padding:3px 0"><b>${n}</b> · ${esc((CB[INVS[n].cus]||{}).name||'')} · ${vnd(INVS[n].out)} đ</div>`).join('')||'<div class="muted">Các đơn đã chọn chưa có hóa đơn nào chờ thu.</div>'}</div>
      <div class="note info" style="margin-top:8px">Tổng số tiền ghi nhận: <b>${vnd(tot)} đ</b>.</div>${fbar('','Ghi nhận')}</div>`},
    onChange(){rerender()},
    async submit(){
      if(!nos.length){s.err=['Không có hóa đơn nào cần ghi nhận.'];rerender();return}
      if(!s.date){s.err=['Chọn ngày nhận tiền.'];rerender();return}
      try{for(const n of nos){await save('invoices',n,Object.assign({},LV('invoices')[n]||{},{no:+n,date:INVS[n].date,recv:s.date,method:s.method}))}}catch(e){return}
      S.f.orders.sel={};closeDrawer();toast('Đã ghi nhận thu '+nos.length+' hóa đơn');if(S.view==='orders')drawOrders();
    }};
}
function invoiceForm(code){
  const o=ORD.find(x=>x.code===code);const cand=o.lines.filter(l=>!l.inv);
  const s={no:'',date:TODAY,method:'Chưa thanh toán',pick:{},err:[]};cand.forEach(l=>{s.pick[l.idx]=true});
  return {s,
    render(){const t=sum(cand.filter(l=>s.pick[l.idx]),l=>l.total);
      return `<div class="form">${formTop('Ghi hóa đơn cho đơn '+esc(code),esc(CB[o.cus].name))}${ferr(s)}<div class="fg">${F('no','Số hóa đơn',{t:'num'})}${F('date','Ngày hóa đơn',{t:'date'})}${F('method','Phương thức thanh toán',{opts:['Chưa thanh toán','Chuyển khoản','Tiền mặt','Thẻ']})}</div>
      <div class="fs"><h3>Dòng thuê đưa vào hóa đơn</h3>${cand.map(l=>`<label class="ck"><input type="checkbox" data-k="pick.${l.idx}" data-t="bool"${s.pick[l.idx]?' checked':''}> <span class="mono">${esc(l.dev)}</span> · ${fmtD(l.s)} – ${fmtD(l.e)} · ${vnd(l.total)} đ</label>`).join('')}</div>
      <div class="note info">Giá trị hóa đơn từ các dòng đã chọn: <b>${vnd(t)} đ</b> (gồm VAT). Nhập số hóa đơn đã có để thêm dòng vào hóa đơn đó.</div>${fbar('','Ghi hóa đơn')}</div>`},
    onChange(){rerender()},
    async submit(){
      const err=[];const no=String(Math.round(+s.no||0));const picked=cand.filter(l=>s.pick[l.idx]);
      if(!(+s.no>0))err.push('Nhập số hóa đơn.');if(!picked.length)err.push('Chọn ít nhất một dòng thuê.');
      if(INVS[no]&&INVS[no].cus&&INVS[no].cus!==o.cus)err.push('Số hóa đơn '+no+' đang thuộc khách khác.');
      if(err.length){s.err=err;rerender();return}
      try{
        if(!INVMETA[no])await save('invoices',no,{no:+no,date:s.date,recv:null,method:s.method});
        for(const l of picked)await setLineOp(l,{inv:+no});
      }catch(e){return}
      closeDrawer();toast('Đã ghi hóa đơn '+no);
      setTimeout(()=>openView(()=>orderDrawer(code)),60);
    }};
}
function payForm(no){
  const i=INVS[no];const s={date:TODAY,method:i.method||'Chuyển khoản',err:[]};
  return {s,
    render(){return `<div class="form">${formTop('Ghi nhận thu tiền hóa đơn '+esc(no),esc((CB[i.cus]||{}).name||''))}${ferr(s)}<div class="fg">${F('date','Ngày nhận tiền',{t:'date'})}${F('method','Phương thức',{opts:['Chuyển khoản','Tiền mặt','Thẻ']})}</div>
      <div class="note info">Số tiền ghi nhận: <b>${vnd(i.out)} đ</b>. Sau khi lưu, dư nợ của khách giảm tương ứng.</div>${fbar('','Ghi nhận')}</div>`},
    onChange(){rerender()},
    async submit(){
      if(!s.date){s.err=['Chọn ngày nhận tiền.'];rerender();return}
      try{await save('invoices',no,Object.assign({},LV('invoices')[no]||{},{no:+no,date:i.date,recv:s.date,method:s.method}))}catch(e){return}
      closeDrawer();toast('Đã ghi nhận thu hóa đơn '+no);
    }};
}
