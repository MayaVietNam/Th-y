
/* ============ TỔNG QUAN ============ */
function dispatchData(A){
  if(A===undefined)A=S.dispArea;
  const lim=addDays(TODAY,7),near=addDays(TODAY,2);
  const okA=x=>!A||x.area===A||(x.loc&&x.loc===A);
  const dlOf=l=>{const r=lineLead(l);return r&&r.dl?r.dl:l.s};
  const deliver=LINES.filter(l=>l.st==='pending'&&dlOf(l)<=lim&&okA(l)).sort((a,b)=>dlOf(a)<dlOf(b)?-1:dlOf(a)>dlOf(b)?1:0);
  const collect=LINES.filter(l=>l.st==='using'&&!l.hold&&!l.renew&&isPhys(l)&&l.e<=near&&okA(l)).sort((a,b)=>a.e<b.e?-1:1);
  const stock=devList().filter(d=>d.k==='transit'&&okA(d));
  return{deliver,collect,stock,total:deliver.length+collect.length+stock.length};
}
VIEWS.dashboard=function(){
  const D=devList();const cnt=k=>D.filter(d=>d.k===k).length;
  const invs=Object.values(INVS);const over=invs.filter(i=>i.over);
  const disp=dispatchData('');
  const unb=ORD.filter(unbilled);
  const miss=LINES.filter(needsRet);
  const od=D.filter(d=>d.k==='overdue');
  const qOpen=Object.values(LV('quotes')).filter(q=>q.status==='Đã gửi').length;
  const items=[
   {t:'bad',n:cnt('overdue'),h:'Máy quá hạn chưa thu',s:od.map(d=>`${d.code} (${d.late} ngày, ${CB[d.cusId].name})`).join('; ')||'Không có máy quá hạn',go:()=>setView('devices',{state:'overdue',q:'',loc:'',holder:''})},
   {t:'bad',n:over.length,h:'Hóa đơn quá hạn thu',s:over.length?`Tổng ${vnd(sum(over,i=>i.out))} đ chưa thu`:'Không có hóa đơn quá hạn',go:()=>setView('invoices',{f:'overdue'})},
   {t:disp.deliver.some(l=>{const r=lineLead(l);return r&&r.dl&&r.dl<TODAY})?'bad':'info',n:disp.deliver.length,h:'Cần giao trong 7 ngày',s:disp.deliver.map(l=>{const r=lineLead(l);return `${l.dev} giao trước ${fmtS(r&&r.dl?r.dl:l.s)}`}).join('; ')||'Chưa có lịch giao',go:()=>{S.dispArea='';setView('dispatch')}},
   {t:'warn',n:disp.stock.length,h:'Máy chờ về kho',s:disp.stock.map(d=>`${d.code} (${d.holder})`).join('; ')||'Không có máy chờ',go:()=>{S.dispArea='';setView('dispatch')}},
   {t:'warn',n:unb.length,h:'Đơn đang chạy chưa xuất hóa đơn',s:unb.map(o=>o.code).join('; ')||'Đã xuất đủ',go:()=>setView('orders',{pay:'none',status:'',q:'',area:'',src:'',issue:false})},
   {t:'info',n:qOpen,h:'Báo giá đã gửi, chờ khách phản hồi',s:qOpen?'Mở mục Báo giá để cập nhật kết quả':'Không có báo giá đang chờ',go:()=>setView('quotes',{status:'Đã gửi',q:''})},
   {t:'mute',n:miss.length,h:'Dòng thuê thiếu ngày trả máy',s:'Sheet ghi Đã dùng hoặc Đã trả nhưng ô ngày trả trống',go:()=>setView('orders',{issue:true,pay:'',status:'',q:'',area:'',src:''})}
  ];
  window.__todo=items;
  const order=['ready','rented','hold','overdue','transit','maint'];
  const tot=D.length;
  const bar=order.map(k=>{const n=cnt(k);return n?`<i class="c-${k}" style="flex:${n}" title="${DK[k][0]}: ${n}"></i>`:''}).join('');
  const legend=order.map(k=>`<button data-act="devstate" data-id="${k}"><span class="sw c-${k}"></span><span>${DK[k][0]}</span><b class="num" style="margin-left:auto">${cnt(k)}</b></button>`).join('');
  const locs=AREAS.map(a=>{const x=D.filter(d=>d.loc===a);
    return `<tr><td><b>${a}</b></td><td class="num">${x.length}</td><td class="num">${x.filter(d=>d.k==='ready').length}</td><td class="num">${x.filter(d=>['rented','hold','overdue'].includes(d.k)).length}</td><td class="num">${x.filter(d=>['transit','maint'].includes(d.k)).length}</td></tr>`}).join('');
  const srcs={};CUS.forEach(c=>{const x=sum(LINES.filter(l=>l.cus===c.id),l=>l.ex);if(x)srcs[c.src]=(srcs[c.src]||0)+x});
  const srcArr=Object.entries(srcs).sort((a,b)=>b[1]-a[1]);const smax=srcArr.length?srcArr[0][1]:1,stot=sum(srcArr,a=>a[1])||1;
  const debt=CUS.map(c=>({c,s:custStats(c.id)})).filter(x=>x.s.out>0).sort((a,b)=>b.s.out-a.s.out);
  const totalIn=sum(invs,i=>i.total),totalPaid=sum(invs,i=>i.paid);
  return head('Tổng quan',`Cập nhật lần cuối: ${LOADED_AT}`,
    `<div class="btns">${expBtn('all')}${newBtn('neworder','Tạo đơn')}</div>`)+
  `<div class="panel"><h2>Việc cần xử lý</h2><ul class="todo">${items.map((x,i)=>`<li><button data-act="todo" data-id="${i}"><span class="dot t-${x.n?x.t:'mute'}"></span><span style="min-width:0"><span class="tt">${x.h}</span><br><span class="ts">${esc(x.s)}</span></span><span class="tn" style="${x.n?'':'color:var(--ink-3)'}">${x.n}</span><span class="ta">›</span></button></li>`).join('')}</ul></div>`+
  `<div class="grid3"><div class="kpi"><span class="l">Doanh thu đã xuất hóa đơn</span><span class="v">${vndS(totalIn)}</span><span class="s">gồm VAT, ${invs.length} hóa đơn</span></div>
   <div class="kpi"><span class="l">Đã thu</span><span class="v">${vndS(totalPaid)}</span><span class="s">${totalIn?Math.round(totalPaid/totalIn*100):0}% giá trị hóa đơn</span></div>
   <div class="kpi"><span class="l">Dư nợ</span><span class="v">${vndS(totalIn-totalPaid)}</span><span class="s">trong đó quá hạn ${vndS(sum(over,i=>i.out))}</span></div>
   <div class="kpi"><span class="l">Máy đang ở khách</span><span class="v">${cnt('rented')+cnt('hold')+cnt('overdue')}<small class="muted" style="font-size:14px;font-weight:500"> / ${tot}</small></span><span class="s">${cnt('ready')} máy sẵn sàng trong kho</span></div></div>`+
  `<div class="grid2"><div class="panel"><h2>Thiết bị theo trạng thái</h2><div class="pb"><div class="bar" role="img" aria-label="Phân bố trạng thái thiết bị">${bar}</div><div class="legend">${legend}</div></div></div>
   <div class="panel"><h2>Thiết bị theo vị trí</h2><div class="pb scroll"><table class="tbl"><thead><tr><th>Vị trí</th><th class="num">Tổng</th><th class="num">Sẵn sàng</th><th class="num">Ở khách</th><th class="num">Chờ/bảo trì</th></tr></thead><tbody>${locs}</tbody></table></div></div></div>`+
  `<div class="grid2"><div class="panel"><h2>Dư nợ theo khách</h2><div class="pb">${debt.length?debt.map(x=>`<div class="hb" style="grid-template-columns:minmax(0,1fr) auto auto"><span>${clink(x.c.id)}</span><b class="num">${vnd(x.s.out)} đ</b>${x.s.over?chip('bad','Quá hạn'):chip('warn','Chờ thu')}</div>`).join(''):'<div class="empty">Không có dư nợ</div>'}</div></div>
   <div class="panel"><h2>Doanh thu theo nguồn khách</h2><div class="pb">${srcArr.map(([k,v])=>`<div class="hb"><span>${esc(k)}</span><span class="track"><i style="width:${Math.max(2,v/smax*100)}%"></i></span><span class="num sm">${vndS(v)} <span class="muted">(${Math.round(v/stot*100)}%)</span></span></div>`).join('')}<div class="sm muted" style="margin-top:6px">Chưa gồm VAT, tính trên mọi dòng thuê.</div></div></div></div>`;
};

/* ============ ĐƠN HÀNG ============ */
VIEWS.orders=function(){
  const f=S.f.orders;const srcs=[...new Set(CUS.map(c=>c.src).filter(Boolean))];
  return `<div class="stk" id="stk">`+head('Đơn hàng','Mỗi đơn gồm một hoặc nhiều dòng thuê. Bấm vào dòng để xem chi tiết.',`<div class="btns">${expBtn('orders')}${newBtn('neworder','Tạo đơn')}</div>`)+
  `<div class="filters"><label class="f rel" style="flex:1 1 240px;max-width:340px"><input type="text" id="ocu" autocomplete="off" placeholder="Lọc theo khách hàng…" value="${esc(f.cus&&CB[f.cus]?cuLabel(CB[f.cus]):'')}" aria-label="Lọc theo khách hàng"><div class="cdd" id="cdd_ocu"></div></label><input type="search" id="oq" placeholder="Tìm mã đơn, khách, mã máy" value="${esc(f.q)}" aria-label="Tìm đơn">
   <select id="os" aria-label="Trạng thái đơn"><option value="">Mọi trạng thái đơn</option><option value="overdue">Quá hạn</option><option value="using">Đang dùng</option><option value="hold">Khách giữ máy</option><option value="pending">Chờ giao</option><option value="done">Hoàn tất</option></select>
   <select id="oa" aria-label="Khu vực"><option value="">Mọi khu vực</option><option>HN</option><option>HCM</option><option>Other</option></select>
   <select id="osrc" aria-label="Nguồn khách"><option value="">Mọi nguồn</option>${srcs.map(s=>`<option>${esc(s)}</option>`).join('')}</select>
   <label class="ck"><input type="checkbox" id="oi"> Thiếu ngày trả máy</label></div><div class="bulk" id="bulk" hidden></div></div>
   <div class="panel"><div class="scroll clip"><table class="tbl stkth"><thead><tr><th style="width:34px"><input type="checkbox" id="osall" data-act="ordselall" aria-label="Chọn tất cả đơn đang hiển thị"></th><th>Hóa đơn</th><th>Mã đơn</th><th>Khách hàng</th><th>Máy</th><th class="num">Tổng tiền</th><th>Số HĐ</th><th>Ngày HĐ</th><th>Thanh toán</th></tr><tr class="fr"><th></th><th><select id="oinv" aria-label="Lọc trạng thái hóa đơn"><option value="">Tất cả</option><option value="none">Chưa làm</option><option value="issued">Xuất hóa đơn</option><option value="sent">Đã gửi HĐ và bảng kê</option></select></th><th><input id="ofc" placeholder="Lọc mã" value="${esc(f.code)}" aria-label="Lọc mã đơn"></th><th><input id="ofk" placeholder="Lọc khách" value="${esc(f.cname)}" aria-label="Lọc khách hàng"></th><th><input id="ofd" placeholder="Lọc máy" value="${esc(f.dev)}" aria-label="Lọc mã máy"></th><th><input id="ofmin" inputmode="numeric" placeholder="Từ… đ" value="${f.min?vnd(f.min):''}" style="text-align:right" aria-label="Tổng thanh toán từ"></th><th><input id="ofinv" placeholder="Số HĐ" value="${esc(f.invno)}" aria-label="Lọc số hóa đơn"></th><th>${dateIn('id="ofidate" aria-label="Lọc ngày hóa đơn"',f.invdate)}</th><th><select id="op" aria-label="Lọc thanh toán"><option value="">Tất cả</option><option value="overdue">Quá hạn thu</option><option value="wait">Chờ thu</option><option value="none">Chưa xuất HĐ</option><option value="paid">Đã thu</option></select></th></tr></thead><tbody id="otb"></tbody></table></div><div class="count" style="padding:10px 12px" id="oc"></div></div>`;
};
function drawOrders(){
  const f=S.f.orders;
  $('oinv').value=f.inv;$('os').value=f.status;$('oa').value=f.area;$('osrc').value=f.src;$('op').value=f.pay;$('oi').checked=f.issue;
  const q=f.q.trim().toLowerCase();
  const rows=ORD.filter(o=>{
    const c=CB[o.cus];
    if(f.cus&&o.cus!==f.cus)return false;
    if(f.code&&!String(o.code).toLowerCase().includes(f.code.trim().toLowerCase()))return false;
    if(f.cname&&!(c.name+' '+c.legal).toLowerCase().includes(f.cname.trim().toLowerCase()))return false;
    if(f.dev&&!o.lines.some(l=>String(l.dev||'').toLowerCase().includes(f.dev.trim().toLowerCase())))return false;
    if(f.date){const s0=o.lines.reduce((m,l)=>!m||l.s<m?l.s:m,''),e0=o.lines.reduce((m,l)=>l.e>m?l.e:m,'');if(!(s0<=f.date&&f.date<=e0))return false}
    if(f.min&&orderTotal(o)<+f.min)return false;
    if(f.inv&&(ivState(o)||'none')!==f.inv)return false;
    if(f.invno||f.invdate){const ivn=[...new Set(o.lines.filter(l=>l.inv&&INVS[l.inv]).map(l=>String(l.inv)))];if(f.invno&&!ivn.some(n=>n.includes(f.invno.trim())))return false;if(f.invdate&&!ivn.some(n=>INVS[n].date===f.invdate))return false}
    if(q&&!(o.code+' '+c.name+' '+c.legal+' '+o.lines.map(l=>l.dev).join(' ')).toLowerCase().includes(q))return false;
    if(f.status&&orderState(o).k!==f.status)return false;
    if(f.area&&o.area!==f.area)return false;
    if(f.src&&c.src!==f.src)return false;
    if(f.pay&&payState(o).k!==f.pay)return false;
    if(f.issue&&!o.lines.some(needsRet))return false;
    return true}).sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0);
  LAST.orders=rows;
  $('otb').innerHTML=rows.map(o=>{
    const c=CB[o.cus],os=orderState(o),ps=payState(o);
    const s=o.lines.reduce((m,l)=>!m||l.s<m?l.s:m,''),e=o.lines.reduce((m,l)=>l.e>m?l.e:m,'');
    const devs=[...new Set(o.lines.map(l=>l.dev))].join(', ');
    const ivs=[...new Set(o.lines.filter(l=>l.inv&&INVS[l.inv]).map(l=>String(l.inv)))];
    return `<tr class="row" tabindex="0" data-act="order" data-id="${esc(o.code)}"><td data-act="ordsel" data-id="${esc(o.code)}" style="width:34px"><input type="checkbox"${f.sel[o.code]?' checked':''} aria-label="Chọn đơn ${esc(o.code)}"></td>
    <td data-act="ivs"><select class="ivsel iv-${ivState(o)||'none'}" data-code="${esc(o.code)}" aria-label="Trạng thái hóa đơn ${esc(o.code)}">${IVOPT.map(x=>`<option value="${x[0]}"${x[0]===ivState(o)?' selected':''}>${x[1]}</option>`).join('')}</select></td>
    <td><span class="mono">${esc(o.code)}</span>${demoTag(o)}<br><small class="muted">${fmtD(o.date)}</small></td>
    <td><div class="two"><span>${esc(c.name)}</span><small>${o.lines.length} dòng thuê</small></div></td><td class="mono">${esc(devs)}</td>
    <td class="num"><b>${vnd(orderTotal(o))}</b></td><td style="font-weight:600">${ivs.map(n=>`<div>${n}</div>`).join('')||'<span class="muted">—</span>'}</td><td>${ivs.map(n=>`<div>${fmtD(INVS[n].date)}</div>`).join('')||'<span class="muted">—</span>'}</td><td>${chip(ps.tone,ps.label)}</td></tr>`}).join('')||`<tr><td colspan="9" class="empty">Không có đơn phù hợp bộ lọc</td></tr>`;
  $('oc').textContent=`${rows.length} / ${ORD.length} đơn`;
  updBulk();
}
function updBulk(){const f=S.f.orders;const ex=new Set(ORD.map(o=>o.code));Object.keys(f.sel).forEach(k=>{if(!ex.has(k))delete f.sel[k]});const n=Object.keys(f.sel).length;const b=$('bulk');if(b){b.hidden=!n;b.innerHTML=n?`<span><b>${n}</b> đơn được chọn</span><select id="bulkiv" aria-label="Đặt trạng thái hóa đơn"><option value="">Đặt trạng thái hóa đơn…</option><option value="issued">Xuất hóa đơn</option><option value="sent">Gửi hóa đơn và bảng kê</option><option value="none">Bỏ trạng thái (chưa làm)</option></select><button class="btn sm" data-act="bulkinv">Ghi hóa đơn</button><button class="btn sm" data-act="bulkpay">Ghi nhận thu tiền</button><button class="btn sm danger" data-act="bulkdel">Xóa</button><button class="btn sm" data-act="bulkclear">Bỏ chọn</button>`:''}const vis=LAST.orders||[];const a=$('osall');if(a){const c=vis.filter(o=>f.sel[o.code]).length;a.checked=vis.length>0&&c===vis.length;a.indeterminate=c>0&&c<vis.length}fixStk()}
function fixStk(){try{const s=$('stk');if(s){const st=document.documentElement.style;st.setProperty('--stkh',s.offsetHeight+'px');const tr=document.querySelector('.tbl.stkth thead tr');if(tr)st.setProperty('--thh',(tr.getBoundingClientRect().height-1)+'px');st.setProperty('--stkh',(s.getBoundingClientRect().height-1)+'px')}}catch(e){}}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(typeof S!=='undefined'&&S.view==='orders')fixStk()});
setTimeout(()=>{if(typeof S!=='undefined'&&S.view==='orders')fixStk()},400);
window.addEventListener('resize',()=>{if(S.view==='orders')fixStk()});
function ocuFill(){const n=$('cdd_ocu');if(!n)return;const f=S.f.orders;const L=cuFilter(f.cuqF||'');n.innerHTML='<div class="cdi" data-act="pickocu" data-id="">Tất cả khách hàng</div>'+(L.length?L.map(c=>`<div class="cdi" data-act="pickocu" data-id="${esc(c.id)}"><b>${esc(cuLabel(c))}</b><br><small class="muted">${esc(c.name)}${c.mst?' · MST '+esc(c.mst):''}</small></div>`).join(''):'<div class="cde">Không tìm thấy khách hàng</div>');n.classList.add('on')}
function ocuClose(reset){const n=$('cdd_ocu');if(n)n.classList.remove('on');const e=$('ocu');if(e&&reset!==false){const f=S.f.orders;e.value=f.cus&&CB[f.cus]?cuLabel(CB[f.cus]):''}S.f.orders.cuqF=''}
function orderDrawer(code){
  const o=ORD.find(x=>x.code===code);
  if(!o)return `<div class="dr-top"><h2>Không tìm thấy đơn</h2><button class="xbtn" data-act="close" aria-label="Đóng">×</button></div><div class="empty">Đơn ${esc(code)} đã bị xóa hoặc đang đồng bộ.</div>`;
  const c=CB[o.cus],os=orderState(o),ps=payState(o);
  const ex=orderEx(o),tot=orderTotal(o),vat=tot-ex;
  const fld=(k,v,cls)=>`<div class="it${cls?' '+cls:''}"><span>${k}</span><b>${v==null||v===''?'<i class="muted">—</i>':v}</b></div>`;
  const ivS=ivState(o),ivLbl=(IVOPT.find(x=>x[0]===ivS)||IVOPT[0])[1],ivTone=ivS==='sent'?'ok':ivS==='issued'?'info':'mute';
  const delD=o.delDate||(o.lines.map(l=>l.del).filter(Boolean).sort()[0]||'');
  const lr=o.lines.map(l=>{const st=lineState(l);const esim=!isPhys(l);const inv=l.inv&&INVS[l.inv]?INVS[l.inv]:null;
    const money=`${fld('Đơn giá',vnd(l.price||l.fixed))}${fld('Giảm giá (%)',(+l.dpct||0)+'%')}${fld('Phí giảm',l.disc?'-'+vnd(l.disc):'0')}${fld('Phí ship',vnd(l.fee))}${fld('Bảo hiểm',vnd(l.ins))}${fld('Bồi thường',vnd(l.comp))}${fld('Phí giữ máy',vnd(+l.holdFee||0))}${fld('Phí mở máy',vnd(l.act))}`;
    const tot=`${fld('Thành tiền (chưa VAT)','<span class="big">'+vnd(l.ex)+'</span>')}${fld('Mức thuế',(+l.vat||0)+'%')}${fld('Thuế GTGT',vnd(l.vatAmt))}${fld('Tổng cộng (gồm VAT)','<span class="big">'+vnd(l.total)+'</span>')}`;
    return `<div class="lc"><div class="lc-h"><div class="lc-t"><b>${esim?'eSIM':dlink(l.dev)}</b><span class="muted">${prodLbl(l)}</span></div><div class="lc-s">${chip(st.tone,st.label)}${needsRet(l)?'<span class="sm muted">thiếu ngày trả</span>':''}${isPhys(l)&&!l.months&&l.days>0?`<button class="btn sm" data-act="settle" data-id="${esc(o.code)}|${l.idx}">${l.useDays!=null?'Sửa kết toán':'Kết toán sử dụng'}</button>`:''}</div></div>
    <div class="kv">${fld('Sản phẩm',prodLbl(l))}${fld('Số lượng','1')}${fld('Mã máy'+(esim?'':' (IMEI)'),esim?'eSIM':esc(l.dev)+(DEVS[l.dev]&&DEVS[l.dev].imei?' <span class="mono muted">('+esc(DEVS[l.dev].imei)+')</span>':''))}${fld('Quốc gia',esc(CTRY[l.c]||''))}${fld('Gói',esc(l.pkg||''))}${fld('Loại',esc(l.type||''))}${fld('Đơn vị thời gian',l.months?'Tháng':esim?'Gói':'Ngày')}${fld('Thời gian sử dụng',l.months?l.days+' tháng':l.days+' ngày')}${fld('Gia hạn',l.renew?'Có':'Không')}
     ${fld('Ngày bắt đầu',l.s?fmtD(l.s):'')}${fld('Ngày kết thúc',l.e?fmtD(l.e):'')}${fld('Ngày giao',l.del?fmtD(l.del):'')}${(()=>{const r=l.st==='pending'?lineLead(l):null;return r?fld('Hạn giao / hẹn lịch','<span style="color:'+(r.dl<TODAY?'var(--bad)':'inherit')+'">'+fmtD(r.dl)+(r.time?' '+r.time:'')+'</span> <small class="muted">'+esc(r.rule)+'</small>','wide'):''})()}${fld('Ngày trả máy',l.ret?fmtD(l.ret):'')}${fld('Đơn vị trả',esc(l.retFirm||''))}${fld('Giữ máy',l.hold?'Khách giữ máy':'Không')}</div>
    <div class="kv kv-m">${money}</div><div class="kv kv-m">${tot}</div>
    <div class="kv kv-m">${fld('Số hóa đơn',inv?'<b>'+inv.no+'</b>':'')}${fld('Ngày hóa đơn',inv?fmtD(inv.date):'')}${fld('Thanh toán',inv?(inv.recv?'Đã thu '+fmtD(inv.recv):'Chờ thu · hạn '+fmtD(inv.due)):'Chưa xuất hóa đơn')}</div>
    ${l.stmt?`<div class="lc-st"><div class="lc-st-h">Theo bảng kê ${esc(l.stmt.no)}</div>${l.stmt.month?`<div>Thuê theo tháng: ${vnd(l.stmt.base)} đ</div>`:`<div><b>Đăng ký ${l.stmt.reg} ngày · dùng ${l.stmt.used} ngày${l.stmt.reg-l.stmt.used>0?' · không dùng '+(l.stmt.reg-l.stmt.used)+' ngày':''}</b></div>${l.stmt.usedText&&l.stmt.used<l.stmt.reg?`<div>Ngày có dùng: ${esc(l.stmt.usedText)}</div>`:''}${l.stmt.restText?`<div>Ngày không dùng: ${esc(l.stmt.restText)}</div>`:''}<div>Tiền thuê: ${l.stmt.days} ngày × ${vnd(l.stmt.price)}${l.stmt.qty>1?' × '+l.stmt.qty+' gói':''} = <b>${vnd(l.stmt.base)}</b>${l.stmt.disc?' · giảm '+vnd(l.stmt.disc):''}</div>`}${l.stmt.other?`<div>Phí giữ máy: <b>${vnd(l.stmt.other)}</b> ${l.stmt.hold==='all'?'(không dùng ngày nào: '+l.stmt.reg+' ngày × '+vnd(RUL().actFee)+')':l.stmt.hold==='flat'?'(dùng dưới '+RUL().minPct+'% số ngày đăng ký: cộng '+vnd(RUL().actFee)+')':''}</div>`:`<div class="muted">Không phát sinh phí giữ máy${l.stmt.used*100>=l.stmt.reg*RUL().minPct&&!l.stmt.month?' (dùng từ '+RUL().minPct+'% số ngày đăng ký trở lên, chỉ tính ngày thực tế)':''}</div>`}</div>`:''}
    ${l.settle?`<div class="sm muted lc-n">${l.settle==='full'?`Kết toán: dùng ${l.useDays}/${l.days} ngày (${Math.round(l.useDays*100/l.days)}%, từ ${RUL().minPct}% trở lên) → tính ${l.useDays} ngày thực tế × ${vnd(l.price)} = ${vnd(l.price*l.useDays*(+l.qty||1))}, không phí mở máy`:l.settle==='part'?`Kết toán: dùng ${l.useDays}/${l.days} ngày (${Math.round(l.useDays*100/l.days)}%, dưới ${RUL().minPct}%) → tính ${l.useDays} ngày thực tế × ${vnd(l.price)} = ${vnd(l.price*l.useDays*(+l.qty||1))}, cộng phí mở máy ${vnd(l.act)}`:`Kết toán: không sử dụng → không tính tiền thuê, phí mở máy ${l.days} ngày × ${vnd(RUL().actFee)} = ${vnd(l.act)}`}</div>`:''}
    ${esim&&(l.iccid||l.sim||l.sendVia||l.cover)?`<div class="kv kv-m">${fld('ICCID',l.iccid?'<span class="mono">'+esc(l.iccid)+'</span>':'')}${fld('Nguồn SIM (nội bộ)',esc(l.sim||''))}${fld('Gửi eSIM',esc(l.sendVia?(l.sendVia==='Other'?(l.sendNote||'Khác'):l.sendVia):''))}${l.cover?fld('Vùng phủ sóng',esc(l.cover),'wide'):''}${l.lpa?fld('Mã LPA','<span class="mono" style="word-break:break-all">'+esc(l.lpa)+'</span>','wide'):''}${qrFor(l)?`<div class="it"><span>QR eSIM</span><img src="${qrFor(l)}" alt="QR eSIM" style="width:96px;border:1px solid var(--line);border-radius:6px"></div>`:''}</div>`:''}</div>`}).join('');
  const invs=[...new Set(o.lines.filter(l=>l.inv&&INVS[l.inv]).map(l=>l.inv))].map(n=>INVS[n]);
  const ir=invs.map(i=>`<tr><td><b>${i.no}</b></td><td>${fmtD(i.date)}</td><td>${fmtD(i.due)}</td><td class="num">${vnd(i.total)}</td><td>${i.recv?fmtD(i.recv):'—'}</td><td>${i.recv?chip('ok','Đã thu'+(i.late?`, trễ ${i.late} ngày`:'')):i.over?chip('bad',`Quá hạn ${i.late} ngày`):chip('warn','Chờ thu')}</td><td>${i.recv?'':`<button class="btn sm" data-act="recordpay" data-id="${i.no}">Ghi nhận thu</button>`}</td></tr>`).join('');
  const evm={};const add=(d,t,x)=>{if(!d)return;const k=d+'|'+t;(evm[k]=evm[k]||{d,t,x:[]}).x.push(x)};
  add(o.date,'Tạo đơn','');
  o.lines.forEach(l=>{if(l.st!=='pending')add(l.del||l.s,'Giao',l.dev);if(l.ret)add(l.ret,'Thu hồi',l.dev)});
  invs.forEach(i=>{add(i.date,'Xuất hóa đơn','số '+i.no);if(i.recv)add(i.recv,'Nhận tiền','hóa đơn '+i.no)});
  Object.values(LV('handovers')).filter(h=>h.order===o.code).forEach(h=>add(h.date,'Biên bản '+(h.type==='Giao'?'giao':'thu hồi'),h.no));
  const tl=Object.values(evm).sort((a,b)=>a.d<b.d?-1:a.d>b.d?1:0).map(e=>`<li><time>${fmtD(e.d)}</time><span><b>${e.t}</b> ${esc([...new Set(e.x)].filter(Boolean).join(', '))}</span></li>`).join('');
  const isLive=!!LV('orders')[o.code]&&!BASE_ORD.some(b=>b.code===o.code);
  const hasUnbilled=o.lines.some(l=>!l.inv);
  return `<div class="dr-top"><div><h2><span class="mono" style="font-size:19px">${esc(o.code)}</span>${demoTag(o)} ${chip(os.tone,os.label)} ${chip(ivTone,ivLbl)} ${chip(ps.tone,ps.label)}</h2>
   <div class="muted" style="margin-top:4px">${clink(o.cus)} · ${esc(c.src)}</div></div><button class="xbtn" data-act="close" aria-label="Đóng">×</button></div>
  <div class="btns"><button class="btn pri" data-act="editorder" data-id="${esc(o.code)}">Sửa đơn</button><button class="btn" data-act="copyorder" data-id="${esc(o.code)}">Sao chép đơn</button><button class="btn" data-act="newhandover" data-id="${esc(o.code)}">Lập biên bản bàn giao</button>${hasUnbilled?`<button class="btn" data-act="newinvoice" data-id="${esc(o.code)}">Ghi hóa đơn</button>`:''}<button class="btn" data-act="newpayreq" data-id="${esc(o.code)}">Đề nghị thanh toán</button><button class="btn" data-act="export" data-id="order:${esc(o.code)}">${ico('download')}Excel</button><button class="btn danger" data-act="delorder" data-id="${esc(o.code)}">Xóa đơn</button></div>
  <div class="panel"><h2>Thông tin đơn</h2><div class="pb"><div class="kv">${fld('Mã đơn',`<span class="mono">${esc(o.code)}</span>`)}${fld('Ngày đặt',fmtD(o.date))}${fld('Ngày giao',delD?fmtD(delD):'')}${fld('Trạng thái đơn',chip(os.tone,os.label))}${fld('Trạng thái hóa đơn',chip(ivTone,ivLbl))}${fld('Trạng thái thanh toán',chip(ps.tone,ps.label))}${fld('Khách hàng',clink(o.cus),'wide')}${fld('Nguồn khách',esc(c.src||''))}${fld('Người liên hệ',esc(c.contact||'')+(c.phone?' · '+esc(c.phone):''))}${fld('Đơn vị giao',esc(o.firm||''))}${fld('Khu vực',esc(o.area||'')+(o.areaNote?' · '+esc(o.areaNote):''))}${fld('Người dùng máy',esc(o.user||o.lines[0].user||'')+(o.uphone?' · '+esc(o.uphone):'')+(o.uemail?' · '+esc(o.uemail):''),'wide')}${fld('Địa chỉ giao',esc(c.addr||'Chưa có'),'wide')}${fld('Giảm giá của khách',custPct(c)?custPct(c)+'%':'Không có')}${fld('Hạn thanh toán',(c.terms||30)+' ngày')}${o.note?fld('Ghi chú',esc(o.note),'wide'):''}${o.suggested?fld('Mã đơn','Sheet để trống. Mã đề xuất theo quy tắc 5 số cuối MST và số thứ tự.','wide'):''}</div></div></div>
  
  <div class="panel"><h2>Dòng thuê (${o.lines.length})</h2>${lr}
   <div class="sum"><div><span class="muted">Chưa VAT</span><span class="num">${vnd(ex)}</span></div><div><span class="muted">VAT</span><span class="num">${vnd(vat)}</span></div><div class="tot"><span>Tổng cộng</span><span class="num">${vnd(tot)} đ</span></div></div></div>
  <div class="panel"><h2>Hóa đơn và thanh toán</h2>${invs.length?`<div style="padding-top:8px"><table class="tbl fit"><thead><tr><th>Số HĐ</th><th>Ngày HĐ</th><th>Hạn thu</th><th class="num">Giá trị</th><th>Ngày nhận</th><th>Tình trạng</th><th></th></tr></thead><tbody>${ir}</tbody></table></div>`:'<div class="empty">Đơn chưa có hóa đơn</div>'}</div>
  <div class="panel"><h2>Dòng thời gian</h2><div class="pb"><ul class="tl">${tl}</ul></div></div>`;
}

/* ============ KHÁCH HÀNG ============ */
VIEWS.customers=function(){
  return head('Khách hàng','Bấm vào một khách để xem lịch sử đơn, nguồn, doanh thu và dư nợ.',`<div class="btns">${expBtn('customers')}${newBtn('newcust','Thêm khách hàng')}</div>`)+
  `<div class="filters"><input type="search" id="cq" placeholder="Tìm mã khách, tên, MST" value="${esc(S.f.customers.q)}" aria-label="Tìm khách"></div>
   <div class="panel"><div class="scroll"><table class="tbl" style="min-width:900px"><thead><tr><th>Mã khách hàng</th><th>Nguồn</th><th class="num">Giảm giá</th><th class="num">Số đơn</th><th class="num">Doanh thu chưa VAT</th><th class="num">Dư nợ</th><th class="num">Máy đang giữ</th><th>Thuê gần nhất</th><th></th></tr></thead><tbody id="ctb"></tbody></table></div></div>`;
};
function drawCustomers(){
  const q=S.f.customers.q.trim().toLowerCase();
  const rows=CUS.map(c=>({c,s:custStats(c.id)})).filter(x=>!q||(x.c.name+x.c.legal+(x.c.en||'')+x.c.mst).toLowerCase().includes(q)).sort((a,b)=>b.s.ex-a.s.ex);
  LAST.customers=rows;
  $('ctb').innerHTML=rows.map(({c,s})=>`<tr class="row" tabindex="0" data-act="cust" data-id="${esc(c.id)}"><td><div class="two"><b>${esc(c.name)}</b><small>${esc(c.legal)}${c.mst?' · '+esc(c.mst):''}</small></div></td><td><small>${esc(c.src)}</small></td>
   <td class="num">${custPct(c)?custPct(c)+'%':'<span class="muted">—</span>'}</td><td class="num">${s.os.length}</td><td class="num">${vnd(s.ex)}</td><td class="num">${s.out?`<b style="color:var(--${s.over?'bad':'warn'})">${vnd(s.out)}</b>`:'<span class="muted">0</span>'}</td><td class="num">${s.held.length||'<span class="muted">0</span>'}</td><td>${fmtD(s.last)}</td><td style="white-space:nowrap"><button class="btn sm" data-act="editcust" data-id="${esc(c.id)}">Sửa</button> <button class="btn sm danger" data-act="delcust" data-id="${esc(c.id)}">Xóa</button></td></tr>`).join('')||`<tr><td colspan="9" class="empty">Không tìm thấy khách</td></tr>`;
}
function contractList(id,editable){
  const cs=custContracts(id);
  if(!cs.length)return '<div class="muted">Chưa có hợp đồng nào được gắn.</div>';
  return `<div class="scroll"><table class="tbl" style="min-width:560px"><thead><tr><th>Số hợp đồng</th><th>Loại</th><th>Ngày ký</th><th>Hiệu lực đến</th><th>File</th>${editable?'<th></th>':''}</tr></thead><tbody>${cs.map(c=>`<tr><td><b>${esc(c.no||'—')}</b>${c.note?`<br><small class="muted">${esc(c.note)}</small>`:''}</td><td>${esc(c.type||'')}</td><td>${fmtD(c.signed)}</td><td>${c.expires?fmtD(c.expires)+(c.expires<TODAY?' '+chip('bad','Hết hạn'):''):'Không thời hạn'}</td>
   <td>${c.asset?`<a href="/_blob/${esc(c.asset)}" target="_blank" rel="noopener">${esc(c.fname||'Mở file')}</a>`:'<span class="muted">Chưa đính kèm</span>'}</td>${editable?`<td><button class="btn sm danger" data-act="delcontract" data-id="${esc(c.id)}">Xóa</button></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
VIEWS.customer=function(){
  const c=CB[S.cust],s=custStats(c.id);
  const tabs=[['orders','Lịch sử đơn'],['invoices','Hóa đơn và công nợ'],['devices','Thiết bị đang giữ'],['info','Liên hệ và hợp đồng']];
  let body='';
  if(S.tab==='orders'){
    body=`<div class="scroll"><table class="tbl" style="min-width:760px"><thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th class="num">Dòng</th><th>Thời gian thuê</th><th>Nguồn đơn</th><th class="num">Chưa VAT</th><th>Trạng thái</th><th>Thanh toán</th></tr></thead><tbody>${
    s.os.slice().sort((a,b)=>a.date<b.date?1:-1).map(o=>{const os=orderState(o),ps=payState(o);const st=o.lines.reduce((m,l)=>!m||l.s<m?l.s:m,''),en=o.lines.reduce((m,l)=>l.e>m?l.e:m,'');
     return `<tr class="row" tabindex="0" data-act="order" data-id="${esc(o.code)}"><td class="mono">${esc(o.code)}${demoTag(o)}</td><td>${fmtD(o.date)}</td><td class="num">${o.lines.length}</td><td>${fmtD(st)} – ${fmtD(en)}</td><td><small>${esc(c.src)}</small></td><td class="num">${vnd(orderEx(o))}</td><td>${chip(os.tone,os.label)}</td><td>${chip(ps.tone,ps.label)}</td></tr>`}).join('')||'<tr><td colspan="8" class="empty">Khách chưa có đơn</td></tr>'}</tbody></table></div>`;
  }else if(S.tab==='invoices'){
    body=s.invs.length?`<div class="scroll"><table class="tbl" style="min-width:780px"><thead><tr><th>Số HĐ</th><th>Ngày HĐ</th><th>Hạn thu</th><th class="num">Giá trị</th><th>Ngày nhận</th><th class="num">Dư nợ</th><th>Tuổi nợ</th></tr></thead><tbody>${
     s.invs.slice().sort((a,b)=>a.date<b.date?1:-1).map(i=>`<tr><td><b>${i.no}</b></td><td>${fmtD(i.date)}</td><td>${fmtD(i.due)}</td><td class="num">${vnd(i.total)}</td><td>${i.recv?fmtD(i.recv):'—'}</td><td class="num">${i.out?`<b>${vnd(i.out)}</b>`:'0'}</td>
     <td>${i.recv?chip('ok','Đã thu'+(i.late?`, trễ ${i.late} ngày`:'')):chip(i.age===0?'warn':'bad',AGE[i.age])}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Chưa có hóa đơn</div>';
  }else if(S.tab==='devices'){
    body=s.held.length?`<div class="scroll"><table class="tbl" style="min-width:640px"><thead><tr><th>Máy</th><th>Trạng thái</th><th>Đơn</th><th>Ngày giao</th><th>Hạn thu</th></tr></thead><tbody>${
     s.held.map(d=>`<tr><td>${dlink(d.code)}</td><td>${dchip(d)}${d.late?`<br><small class="muted">trễ ${d.late} ngày</small>`:''}</td><td>${olink(d.cur.o.code)}</td><td>${fmtD(d.cur.del||d.cur.s)}</td><td>${d.k==='hold'?'Khách giữ máy':fmtD(d.cur.e)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Khách không giữ máy nào</div>';
  }else{
    body=`<div class="pb"><div class="btns" style="margin-bottom:12px"><button class="btn" data-act="editcust" data-id="${esc(c.id)}">Sửa thông tin</button><button class="btn" data-act="editdiscount" data-id="${esc(c.id)}">Sửa giảm giá</button><button class="btn" data-act="newcontract" data-id="${esc(c.id)}">${ico('plus')}Gắn hợp đồng</button></div>
     <dl class="dl"><dt>Tên pháp lý</dt><dd>${esc(c.legal)}</dd><dt>Tên tiếng Anh</dt><dd>${esc(c.en||'—')}</dd><dt>MST / số định danh</dt><dd class="mono">${esc(c.mst||'—')}</dd>
     <dt>Người liên hệ</dt><dd>${esc(c.contact||'—')}</dd><dt>Số điện thoại</dt><dd>${esc(c.phone||'—')}</dd><dt>Email</dt><dd>${esc(c.email||'—')}</dd><dt>Địa chỉ</dt><dd>${esc(c.addr||'—')}</dd>
     <dt>Giảm giá</dt><dd>${c.pct?`<b>${c.pct}%</b>${c.pctFrom||c.pctTo?` · hiệu lực ${c.pctFrom?fmtD(c.pctFrom):'từ trước'} đến ${c.pctTo?fmtD(c.pctTo):'không thời hạn'}`:''}${custPct(c)?'':' '+chip('warn','Chưa hoặc hết hiệu lực')}${c.pctNote?`<br><small class="muted">${esc(c.pctNote)}</small>`:''}`:'Không có'}</dd>
     <dt>Đặc điểm thanh toán</dt><dd>${esc(c.pay||'—')}</dd><dt>Hạn thanh toán</dt><dd>${c.terms||30} ngày kể từ ngày hóa đơn</dd></dl>
     <h3 style="margin:18px 0 8px;font-size:12.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-2)">Hồ sơ cần để thanh toán</h3>${c.payDocs?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">${docLabels(c).map(x=>chip('info',x)).join('')||'<span class="muted">Không yêu cầu chứng từ riêng.</span>'}</div><dl class="dl"><dt>Hình thức gửi</dt><dd>${esc(c.payVia||'—')}</dd><dt>Người hoặc email nhận</dt><dd>${esc(c.payTo||'—')}</dd><dt>Lưu ý</dt><dd>${esc(c.payNote||'—')}</dd></dl>`:`<div class="muted">Chưa thiết lập. Bấm "Sửa thông tin" để chọn các chứng từ khách yêu cầu.</div>`}
     <h3 style="margin:18px 0 8px;font-size:12.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-2)">Hợp đồng đã ký</h3>${contractList(c.id,true)}</div>`;
  }
  return `<div><button class="back" data-act="nav" data-id="customers">‹ Khách hàng</button>
   <div class="cust-head"><h1 style="margin:0;font-size:22px;letter-spacing:-.015em">${esc(c.name)}</h1>${chip('acc',c.src)}${s.held.length?chip('info','Đang giữ '+s.held.length+' máy'):''}${c.pct?chip('ok','Giảm '+c.pct+'%'):''}</div><div class="muted" style="margin-top:2px">${esc(c.legal)}${c.mst?' · MST '+esc(c.mst):''}</div></div>
  <div class="btns"><button class="btn pri" data-act="neworder" data-id="${esc(c.id)}">${ico('plus')}Tạo đơn</button><button class="btn" data-act="newquote" data-id="${esc(c.id)}">Tạo báo giá</button><button class="btn" data-act="newstmt" data-id="${esc(c.id)}">Lập bảng kê</button><button class="btn" data-act="newpayreq" data-id="cus:${esc(c.id)}">Đề nghị thanh toán</button><button class="btn" data-act="editcust" data-id="${esc(c.id)}">Sửa khách</button><button class="btn danger" data-act="delcust" data-id="${esc(c.id)}">Xóa khách</button></div>
  <div class="grid3"><div class="kpi"><span class="l">Doanh thu chưa VAT</span><span class="v">${vnd(s.ex)}</span><span class="s">${vnd(s.inc)} đ gồm VAT</span></div>
   <div class="kpi"><span class="l">Số đơn</span><span class="v">${s.os.length}</span><span class="s">${s.ls.length} dòng thuê</span></div>
   <div class="kpi"><span class="l">Dư nợ</span><span class="v" style="color:var(--${s.out?(s.over?'bad':'warn'):'ink'})">${vnd(s.out)}</span><span class="s">${s.over?'có '+vnd(s.over)+' đ quá hạn':s.out?'chưa đến hạn':'không còn nợ'}</span></div>
   <div class="kpi"><span class="l">Thu tiền sau hóa đơn</span><span class="v">${s.avg==null?'—':s.avg+' ngày'}</span><span class="s">trung bình các hóa đơn đã thu</span></div>
   <div class="kpi"><span class="l">Nguồn khách</span><span class="v" style="font-size:16px;line-height:1.5">${esc(c.src)}</span><span class="s">Thuê gần nhất ${fmtD(s.last)}</span></div></div>
  <div class="panel"><div class="tabs" role="tablist">${tabs.map(([k,t])=>`<button role="tab" aria-selected="${S.tab===k}" data-act="tab" data-id="${k}">${t}</button>`).join('')}</div>${body}</div>`;
};

/* ============ THIẾT BỊ ============ */
VIEWS.devices=function(){
  const f=S.f.devices;
  return head('Thiết bị','Vị trí, bên đang giữ và lịch thuê của từng máy.',`<div class="btns">${expBtn('devices')}${newBtn('newdevice','Thêm thiết bị')}</div>`)+
  `<div class="filters"><input type="search" id="dq" placeholder="Tìm mã máy, IMEI, khách" value="${esc(f.q)}" aria-label="Tìm thiết bị">
   <select id="ds" aria-label="Trạng thái"><option value="">Mọi trạng thái</option>${Object.keys(DK).map(k=>`<option value="${k}">${DK[k][0]}</option>`).join('')}</select>
   <select id="dl" aria-label="Vị trí"><option value="">HN, HCM, Other</option><option>HN</option><option>HCM</option><option>Other</option></select>
   <select id="dh" aria-label="Bên giữ"><option value="">Mọi bên giữ</option><option value="kho">Kho công ty</option><option value="cus">Khách hàng</option><option>Regus</option><option>Grab</option></select></div>
   <div class="panel"><div class="scroll"><table class="tbl" style="min-width:960px"><thead><tr><th>Mã máy</th><th>Loại</th><th>Trạng thái</th><th>Vị trí</th><th>Bên giữ</th><th>Đơn hiện tại</th><th>Ngày giao</th><th>Ngày thu</th><th></th></tr></thead><tbody id="dtb"></tbody></table></div><div class="count" style="padding:10px 12px" id="dc"></div></div>`;
};
function drawDevices(){
  const f=S.f.devices;$('ds').value=f.state;$('dl').value=f.loc;$('dh').value=f.holder;
  const q=f.q.trim().toLowerCase();
  const all=devList();
  const rows=all.filter(d=>{
    if(q&&!(d.code+' '+d.m.imei+' '+d.holder).toLowerCase().includes(q))return false;
    if(f.state&&d.k!==f.state)return false;if(f.loc&&d.loc!==f.loc)return false;if(f.holder&&holderKey(d)!==f.holder)return false;return true})
    .sort((a,b)=>{const w={overdue:0,transit:1,hold:2,rented:3,ready:4,maint:5};return w[a.k]-w[b.k]||(a.code<b.code?-1:1)});
  LAST.devices=rows;
  $('dtb').innerHTML=rows.map(d=>{const l=d.cur;
    const del=l?fmtD(l.del||l.s):'—';
    let thu='—';if(l){thu=l.ret?`${fmtD(l.ret)}<br><small class="muted">thực tế</small>`:d.k==='hold'?'<span class="muted">Khách giữ máy</span>':`${fmtD(l.e)}<br><small class="muted">${d.k==='overdue'?`trễ ${d.late} ngày`:d.k==='rented'?'dự kiến':'kết thúc thuê'}</small>`}
    const note=(d.note||(d.m.base&&d.m.base.note))||'';
    return `<tr class="row" tabindex="0" data-act="dev" data-id="${esc(d.code)}"><td><span class="mono"><b>${esc(d.code)}</b></span>${d.m.demo?' <span class="tag">MẪU</span>':''}<br><small class="mono muted">${esc(d.m.imei)}</small></td><td>${esc(d.m.type)}</td><td>${dchip(d)}${note?`<br><small class="muted">${esc(note)}</small>`:''}</td>
    <td><b>${esc(d.loc)}</b></td><td>${esc(d.holder)}</td><td>${l?olink(l.o.code):'<span class="muted">—</span>'}</td><td>${del}</td><td>${thu}</td><td><button class="btn sm" data-act="devstatus" data-id="${esc(d.code)}">Cập nhật</button></td></tr>`}).join('')||`<tr><td colspan="9" class="empty">Không có thiết bị phù hợp</td></tr>`;
  $('dc').textContent=`${rows.length} / ${all.length} thiết bị`;
}
function devDrawer(code){
  if(!DEVS[code])return `<div class="dr-top"><h2>Không tìm thấy máy</h2><button class="xbtn" data-act="close" aria-label="Đóng">×</button></div>`;
  const d=devState(code);const m=d.m;
  const ls=d.lines;
  let g='<div class="empty">Máy chưa có lượt thuê</div>';
  if(ls.length){
    const mn=addDays(ls[0].s,-4);const mxRaw=ls.reduce((x,l)=>l.e>x?l.e:x,TODAY);const mx=addDays(mxRaw,4);const T=dayDiff(mn,mx)+1;
    const pos=s=>dayDiff(mn,s)/T*100;
    const ticks=[];let t=P(mn);t.setDate(1);t.setMonth(t.getMonth()+1);while(iso(t)<=mx){ticks.push(iso(t));t.setMonth(t.getMonth()+1)}
    g=`<div class="gantt"><div class="g-axis">${ticks.map(x=>`<span style="left:${pos(x)}%">${pad(P(x).getMonth()+1)}/${P(x).getFullYear()}</span>`).join('')}</div>
    <div class="g-today" style="left:calc(12px + (100% - 24px) * ${pos(TODAY)/100})"></div>
    ${ls.map(l=>{const st=lineState(l);const w=Math.max((dayDiff(l.s,l.e)+1)/T*100,1.5);const tone=st.k==='pending'?'info':st.k==='closed'?'mute':st.tone;
      return `<div class="g-track"><span class="g-bar t-${tone}" style="left:${pos(l.s)}%;width:${w}%" title="${esc(CB[l.cus].name)} ${fmtD(l.s)} – ${fmtD(l.e)}">${esc(CB[l.cus].name)}</span></div>`}).join('')}</div>
    <div class="sm muted" style="margin-top:6px">Đường đỏ là ngày ${fmtD(TODAY)}.${d.k==='hold'?' Máy đang được khách giữ liên tục, thanh kết thúc là hạn ghi trong đơn.':''}</div>`;
  }
  const ev=[];
  ls.forEach(l=>{if(l.st!=='pending')ev.push({d:l.del||l.s,t:`Giao cho ${CB[l.cus].name}`+(l.o.firm?` (${l.o.firm})`:''),o:l.o.code});
    if(l.ret)ev.push({d:l.ret,t:'Thu hồi'+(l.retFirm?` qua ${l.retFirm}`:''),o:l.o.code});
    else if(l.st!=='using'&&l.st!=='pending')ev.push({d:l.e,t:'Kết thúc thuê, chưa ghi ngày trả'+(l.retFirm?`, trả qua ${l.retFirm}`:''),o:l.o.code,warn:true})});
  ev.sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0);
  const l=d.cur;
  return `<div class="dr-top"><div><h2><span class="mono" style="font-size:19px">${esc(code)}</span>${m.demo?' <span class="tag">MẪU</span>':''} ${dchip(d)}</h2><div class="muted mono" style="margin-top:4px">IMEI ${esc(m.imei)} · ${esc(m.type)}</div></div><button class="xbtn" data-act="close" aria-label="Đóng">×</button></div>
  <div class="btns"><button class="btn pri" data-act="devstatus" data-id="${esc(code)}">Cập nhật trạng thái</button><button class="btn" data-act="editdev" data-id="${esc(code)}">Sửa thiết bị</button>${l&&l.st!=='pending'&&!l.ret?`<button class="btn" data-act="devstatus" data-id="${esc(code)}">Ghi nhận trả máy</button>`:''}</div>
  <div class="panel"><div class="pb"><dl class="dl"><dt>Vị trí hiện tại</dt><dd><b>${esc(d.loc)}</b>${(d.note||(m.base&&m.base.note))?` · ${esc(d.note||m.base.note)}`:''}</dd><dt>Bên đang giữ</dt><dd>${d.cusId?clink(d.cusId):esc(d.holder)}${d.k==='transit'?' <span class="muted">(suy ra từ đơn vị trả trong đơn)</span>':''}</dd>
   <dt>Đơn hiện tại</dt><dd>${l?olink(l.o.code):'—'}</dd><dt>Ngày giao máy</dt><dd>${l?fmtD(l.del||l.s):'—'}</dd>
   <dt>Ngày thu máy</dt><dd>${l?(l.ret?fmtD(l.ret)+' (thực tế)':d.k==='hold'?'Khách giữ máy':fmtD(l.e)+(d.k==='overdue'?` (trễ ${d.late} ngày)`:' (dự kiến)')):'—'}</dd>
   ${d.next?`<dt>Lượt thuê tiếp theo</dt><dd>${olink(d.next.o.code)} từ ${fmtD(d.next.s)}</dd>`:''}</dl></div></div>
  <div class="panel"><h2>Lịch thuê</h2><div class="pb">${g}</div></div>
  <div class="panel"><h2>Lịch sử di chuyển</h2><div class="pb">${ev.length?`<ul class="tl">${ev.map(e=>`<li><time>${fmtD(e.d)}</time><span${e.warn?' style="color:var(--warn)"':''}>${esc(e.t)}${e.o?` · ${olink(e.o)}`:''}</span></li>`).join('')}</ul>`:'<div class="empty">Chưa có lịch sử</div>'}</div></div>`;
}

/* ============ GIAO NHẬN ============ */
VIEWS.dispatch=function(){
  const D=dispatchData();const A=S.dispArea;
  const addr=l=>{const c=CB[l.cus];return [c.contact,c.phone,c.addr].filter(Boolean).join(' · ')||'Chưa có thông tin liên hệ'};
  const sect=(t,n,thead,rows)=>`<div class="panel"><h2>${t} <span class="muted" style="text-transform:none;letter-spacing:0">(${n})</span></h2><div class="scroll" style="padding-top:8px"><table class="tbl" style="min-width:820px"><thead><tr>${thead}</tr></thead><tbody>${rows||`<tr><td colspan="7" class="empty">Không có việc</td></tr>`}</tbody></table></div></div>`;
  const dr=D.deliver.map(l=>`<tr><td>${isPhys(l)?dlink(l.dev):'eSIM'}<br><small class="muted">${prodLbl(l)}</small></td><td>${clink(l.cus)}<br><small class="muted">${olink(l.o.code)}</small></td><td><b>${esc(l.area||'—')}</b><br><small class="muted">${esc(l.o.firm||'Chưa chọn đơn vị giao')}</small></td><td><small>${esc(addr(l))}</small></td><td>${(()=>{const r=lineLead(l);if(!r)return isPhys(l)?'<small class="muted">'+(l.o.firm||'Chưa chọn đơn vị giao')+': không có quy định</small>':'<small class="muted">eSIM gửi trực tuyến</small>';const late=r.dl<TODAY,today=r.dl===TODAY;return `<b style="color:${late?'var(--bad)':today?'var(--warn)':'inherit'}">${fmtD(r.dl)}${r.time?' '+r.time:''}</b><br><small class="${late?'':'muted'}" style="${late?'color:var(--bad);font-weight:600':''}">${late?'trễ '+dayDiff(r.dl,TODAY)+' ngày · ':today?'hôm nay · ':''}${esc(r.rule)}</small>`})()}</td><td>${fmtD(l.s)}<br><small class="muted">${l.s<=TODAY?'hôm nay':'sau '+dayDiff(TODAY,l.s)+' ngày'}</small></td><td><div class="btns"><button class="btn pri" data-act="deliver" data-id="${esc(l.o.code)}|${l.idx}">Đã giao</button><button class="btn" data-act="newhandover" data-id="${esc(l.o.code)}">Biên bản</button></div></td></tr>`).join('');
  const cr=D.collect.map(l=>{const s=lineState(l);return `<tr><td>${dlink(l.dev)}</td><td>${clink(l.cus)}<br><small class="muted">${olink(l.o.code)}</small></td><td><b>${esc(l.area||'—')}</b><br><small class="muted">${esc(l.retFirm||l.o.firm||'Chưa chọn đơn vị thu')}</small></td><td><small>${esc(addr(l))}</small></td><td>${fmtD(l.e)}<br>${s.k==='overdue'?`<small style="color:var(--bad);font-weight:600">trễ ${s.late} ngày</small>`:'<small class="muted">đến hạn</small>'}</td><td><div class="btns"><button class="btn pri" data-act="collect" data-id="${esc(l.o.code)}|${l.idx}">Đã thu hồi</button><button class="btn" data-act="newhandover" data-id="${esc(l.o.code)}|Thu">Biên bản</button></div></td></tr>`}).join('');
  const sr=D.stock.map(d=>`<tr><td>${dlink(d.code)}</td><td>${d.cur?clink(d.cur.cus):''}<br><small class="muted">${d.cur?olink(d.cur.o.code):''}</small></td><td><b>${esc(d.loc)}</b></td><td><b>${esc(d.holder)}</b><br><small class="muted">đơn vị nhận trả</small></td><td>${d.cur?fmtD(d.cur.ret||d.cur.e):'—'}<br><small class="muted">${d.cur&&d.cur.ret?'ngày trả':'ngày kết thúc thuê'}</small></td><td><button class="btn pri" data-act="stock" data-id="${esc(d.code)}">Nhập kho ${esc(d.loc)}</button></td></tr>`).join('');
  return head('Giao nhận','Bấm một lần để máy tự đổi trạng thái, vị trí và bên giữ.',
   `<div class="seg" role="group" aria-label="Khu vực">${[['','Tất cả'],['HN','HN'],['HCM','HCM']].map(([v,t])=>`<button aria-pressed="${A===v}" data-act="darea" data-id="${v}">${t}</button>`).join('')}</div>`)+
  sect('Cần giao trong 7 ngày (theo hạn giao)',D.deliver.length,'<th>Máy</th><th>Khách và đơn</th><th>Khu vực</th><th>Liên hệ và địa chỉ</th><th>Hạn giao / hẹn lịch</th><th>Ngày bắt đầu</th><th></th>',dr)+
  sect('Cần thu hồi',D.collect.length,'<th>Máy</th><th>Khách và đơn</th><th>Khu vực</th><th>Liên hệ và địa chỉ</th><th>Hạn thu</th><th></th>',cr)+
  sect('Chờ về kho',D.stock.length,'<th>Máy</th><th>Khách và đơn</th><th>Khu vực</th><th>Đang ở</th><th>Mốc</th><th></th>',sr)+
  `<div class="sm muted">Quy định giao máy: Grab giao trước 1,5 ngày. Chuyển phát khác hẹn lịch trước 3 ngày (HN, HCM, tỉnh lân cận HN) hoặc 5 ngày (khu vực khác), tính theo địa chỉ khách.</div><div class="sm muted">Máy khách đang giữ liên tục (như Yamaha, Trung Nam) không vào danh sách thu hồi, bạn xem ở mục Thiết bị.</div>`;
};

/* ============ HÓA ĐƠN VÀ CÔNG NỢ ============ */
VIEWS.invoices=function(){
  const all=Object.values(INVS);const out=all.filter(i=>!i.recv);
  const bk=[0,1,2,3].map(a=>sum(out.filter(i=>i.age===a),i=>i.out));const mx=Math.max(1,...bk);
  return head('Hóa đơn và công nợ','Hạn thu tính theo số ngày của từng khách, mặc định 30 ngày kể từ ngày hóa đơn.',`<div class="btns">${expBtn('invoices')}</div>`)+
  `<div class="grid3"><div class="kpi"><span class="l">Đã xuất</span><span class="v">${vndS(sum(all,i=>i.total))}</span><span class="s">${all.length} hóa đơn gồm VAT</span></div>
   <div class="kpi"><span class="l">Đã thu</span><span class="v">${vndS(sum(all,i=>i.paid))}</span><span class="s">${all.filter(i=>i.recv).length} hóa đơn</span></div>
   <div class="kpi"><span class="l">Dư nợ</span><span class="v">${vndS(sum(out,i=>i.out))}</span><span class="s">${out.length} hóa đơn chưa thu</span></div>
   <div class="kpi"><span class="l">Quá hạn</span><span class="v" style="color:var(--bad)">${vndS(sum(all.filter(i=>i.over),i=>i.out))}</span><span class="s">${all.filter(i=>i.over).length} hóa đơn</span></div></div>
  <div class="panel"><h2>Tuổi nợ</h2><div class="pb">${AGE.map((a,i)=>`<div class="hb"><span>${a}</span><span class="track"><i style="width:${bk[i]?Math.max(2,bk[i]/mx*100):0}%;background:var(--${i?'bad':'warn'})"></i></span><span class="num sm">${bk[i]?vnd(bk[i])+' đ':'0'}</span></div>`).join('')}</div></div>
  <div class="filters"><div class="seg" role="group" aria-label="Lọc hóa đơn">${[['all','Tất cả'],['open','Chưa thu'],['overdue','Quá hạn'],['paid','Đã thu']].map(([v,t])=>`<button aria-pressed="${S.f.invoices.f===v}" data-act="ifilter" data-id="${v}">${t}</button>`).join('')}</div></div>
  <div class="panel"><div class="scroll"><table class="tbl" style="min-width:940px"><thead><tr><th>Số HĐ</th><th>Khách hàng</th><th>Ngày HĐ</th><th>Hạn thu</th><th class="num">Giá trị</th><th>Ngày nhận</th><th class="num">Dư nợ</th><th>Tình trạng</th><th></th></tr></thead><tbody id="itb"></tbody></table></div></div>`;
};
function drawInvoices(){
  const f=S.f.invoices.f;
  const rows=Object.values(INVS).filter(i=>f==='all'||(f==='open'&&!i.recv)||(f==='overdue'&&i.over)||(f==='paid'&&i.recv)).sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0);
  LAST.invoices=rows;
  $('itb').innerHTML=rows.map(i=>`<tr><td><b>${i.no}</b>${INVMETA[i.no]&&INVMETA[i.no].demo?' <span class="tag">MẪU</span>':''}<br><small class="muted">${[...new Set(i.lines.map(l=>l.o.code))].slice(0,2).join(', ')}${new Set(i.lines.map(l=>l.o.code)).size>2?'…':''}</small></td><td>${clink(i.cus)}</td><td>${fmtD(i.date)}</td><td>${fmtD(i.due)}</td><td class="num">${vnd(i.total)}</td><td>${i.recv?fmtD(i.recv):'—'}</td><td class="num">${i.out?`<b>${vnd(i.out)}</b>`:'0'}</td>
   <td>${i.recv?chip('ok','Đã thu'+(i.late?`, trễ ${i.late} ngày`:'')):i.over?chip('bad',`Quá hạn ${i.late} ngày`):chip('warn','Chờ thu')}</td>
   <td><div class="btns">${i.recv?'':`<button class="btn sm" data-act="recordpay" data-id="${i.no}">Ghi nhận thu</button><button class="btn sm" data-act="newpayreq" data-id="inv:${i.no}">Đề nghị TT</button>`}</div></td></tr>`).join('')||`<tr><td colspan="9" class="empty">Không có hóa đơn</td></tr>`;
}
