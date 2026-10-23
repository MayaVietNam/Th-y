
/* ============ BẢNG GIÁ ============ */
VIEWS.prices=function(){
  const f=S.f.prices,pl=PLDATA[f.pl]?f.pl:'',es=f.tab==='esim'&&!pl;
  const srcs=[...new Set(prices().filter(p=>p.kind==='eSIM'&&p.src).map(p=>p.src))];
  return head('Bảng giá',pl?'Bảng giá Wi-Fi riêng của '+plName(pl)+' (đ, chưa VAT). Giá này chỉ áp dụng cho khách '+plName(pl)+' (kể cả nhân viên). Dòng nhỏ là giá thường để so sánh.':(es?'Giá bán eSIM chưa VAT (đ). Mỗi dòng là một dung lượng, các cột là số ngày. Bấm vào giá để sửa, dấu + để thêm.':'Mỗi quốc gia một dòng, giá theo từng gói dữ liệu (đ, chưa VAT). Bấm vào giá để sửa, bấm dấu + để thêm giá cho gói còn trống.'),`<div class="btns">${pl?expBtn('prices:'+pl):expBtn('prices')+newBtn('newprice','Thêm giá')}</div>`)+
  `<div class="seg" role="group" aria-label="Bảng giá" style="margin-bottom:12px"><button class="${pl?'':'on'}" data-act="ppl" data-id="">Bảng giá thường</button>${PLISTS.map(x=>`<button class="${pl===x[0]?'on':''}" data-act="ppl" data-id="${x[0]}">Giá riêng ${x[1]}</button>`).join('')}</div>
   ${pl?'':`<div class="tabs" role="tablist" style="margin-bottom:14px"><button role="tab" aria-selected="${!es}" data-act="ptab" data-id="wifi">Wi-Fi</button><button role="tab" aria-selected="${es}" data-act="ptab" data-id="esim">eSIM</button></div>`}
   <div class="filters"><input type="search" id="pq" placeholder="Tìm quốc gia, gói" value="${esc(f.q||'')}" aria-label="Tìm giá"><select id="pr" aria-label="Khu vực"><option value="">Mọi khu vực</option>${REGIONS.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('')}</select>${pl?'':es?`<select id="ps" aria-label="Nguồn SIM (nội bộ)"><option value="">Mọi nguồn SIM</option>${srcs.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('')}</select>`:`<select id="pk" aria-label="Loại"><option value="">Mọi loại</option>${KINDS.filter(k=>k[0]!=='eSIM').map(k=>`<option value="${esc(k[0])}">${k[1]}</option>`).join('')}</select>`}</div>${pl?plNote(pl):''}
   <div id="pbody"></div>`;
};
const kindLbl=x=>(KINDS.find(y=>y[0]===x)||[0,x])[1];
const otherRows=list=>list.map(p=>`<tr class="row" tabindex="0" data-act="editprice" data-id="${esc(p.id)}"><td><b>${esc(p.name)}</b></td><td>${esc(kindLbl(p.kind))}</td><td>${esc(CTRY[p.c]||'—')}</td><td>${esc(p.pkg||'—')}</td><td>${esc(p.unit)}</td><td class="num"><b>${vnd(p.price)}</b></td>${p.kind==='eSIM'?`<td>${esc(p.src||'—')}</td>`:''}<td><small class="muted">${esc(p.note||'')}</small></td><td>${p.active===false?chip('mute','Tạm ngưng'):chip('ok','Đang áp dụng')}</td></tr>`).join('');
const otherPanel=(list,es)=>list.length?`<div class="panel" style="margin-top:14px"><h2>Giá khác (không thuộc bảng trên)</h2><div class="scroll"><table class="tbl" style="min-width:700px"><thead><tr><th>Tên</th><th>Loại</th><th>Quốc gia</th><th>Gói</th><th>Đơn vị</th><th class="num">Đơn giá (chưa VAT)</th>${es?'<th>Nguồn SIM</th>':''}<th>Ghi chú</th><th>Áp dụng</th></tr></thead><tbody>${otherRows(list)}</tbody></table></div></div>`:'';
const plNote=pl=>{const has=CUS.some(c=>custPL(c.id)===pl);const n=CUS.filter(c=>custPL(c.id)===pl);
  return `<div class="note ${has?'info':'warn'}" style="margin-bottom:12px">${has?'Đang áp dụng cho: <b>'+n.map(c=>esc(cuLabel(c))).join(', ')+'</b>.':'Chưa có khách hàng nào dùng bảng giá này.'} ${has?'':`<button class="btn sm" data-act="mkplcus" data-id="${pl}" style="margin-left:6px">${ico('plus')}Thêm khách hàng ${esc(plName(pl))}</button>`}</div>`};
function drawPL(f){
  const pl=f.pl,es=false,rg=f.region||'',q=(f.q||'').trim().toLowerCase();
  const pr=$('pr');if(pr)pr.value=rg;
  const body=$('pbody');if(!body)return;
  const sd=stdPrices();const base=s=>String(s||'').replace(/ · phương án \d+$/,'');
  const vr=s=>{const m=/ · phương án (\d+)$/.exec(String(s||''));return m?+m[1]:1};
  const stdOf=p=>sd.find(x=>x.active!==false&&x.kind===p.kind&&x.c===p.c&&x.unit===p.unit&&x.pkg===base(p.pkg));
  const cell=p=>{if(!p)return '<td class="num muted">—</td>';const s=stdOf(p);const d=s&&s.price?Math.round((p.price/s.price-1)*100):null;
    return `<td class="num"><b>${vnd(p.price)}</b><br><small class="muted">${s?'thường '+vnd(s.price)+(d==null?'':' · '+(d>0?'+':'')+d+'%'):'thường: chưa có'}</small></td>`};
  if(es){body.innerHTML='<div class="panel"><div class="empty">'+esc(plName(pl))+' không có giá eSIM riêng. eSIM dùng bảng giá thường, giá tự điền khi tạo đơn hoặc báo giá.</div></div>';return}
  const all=prices(pl).filter(p=>(es?p.kind==='eSIM':p.kind!=='eSIM')&&(!rg||p.region===rg)&&(!q||((CTRY[p.c]||'')+' '+(p.pkg||'')).toLowerCase().includes(q)));
  const cn=c=>CTRY[c]||c;const srt=(a,b)=>cn(a.c).localeCompare(cn(b.c),'vi')||a.v-b.v;
  const amtN=a=>{const m=/^(\d+)(GB|MB)$/.exec(a);return m?+m[1]*(m[2]==='GB'?1000:1):0};
  const tbl=(title,sub,heads,rows,w)=>rows.length?`<div class="panel" style="margin-bottom:14px"><h2>${title}</h2>${sub?`<p class="muted" style="margin:0 0 8px">${sub}</p>`:''}<div class="scroll"><table class="tbl" style="min-width:${w}px"><thead><tr><th>Quốc gia</th>${heads.map(h=>`<th class="num">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div></div>`:'';
  const gridRows=(L,keys,pick)=>{const g={};L.forEach(p=>{const k=p.c+'|'+vr(p.pkg);(g[k]||(g[k]={c:p.c,v:vr(p.pkg),cells:{}})).cells[pick(p)]=p});
    return Object.values(g).sort(srt).map(r=>`<tr><td><b>${esc(cn(r.c))}</b>${r.v>1?` <small class="muted">phương án ${r.v}</small>`:''}</td>${keys.map(k=>cell(r.cells[k])).join('')}</tr>`)};
  let h='';
  if(!es){
    h=tbl('Cho thuê Wi-Fi (giá mỗi ngày)','',PKGS.map(p=>p.replace('/day','')+' mỗi ngày'),gridRows(all,PKGS,p=>p.pkg),620);
  }else{
    const daily=all.filter(p=>p.ptype==='d'&&+p.days===1),pk=all.filter(p=>p.ptype==='t');
    const am=[...new Set(daily.map(p=>p.amt))].sort((a,b)=>amtN(a)-amtN(b));
    h=tbl('eSIM thuê theo ngày (giá mỗi ngày)','Gói nhiều ngày = đơn giá mỗi ngày × số ngày; khi tạo đơn hoặc báo giá có sẵn các gói 1, 3, 5, 7, 10, 14, 15, 30 ngày.',am.map(a=>a+' / ngày'),gridRows(daily,am,p=>p.amt),620);
    const cols=[...new Set(pk.map(p=>base(p.pkg)))].sort((a,b)=>{const pa=pk.find(p=>base(p.pkg)===a),pb=pk.find(p=>base(p.pkg)===b);return amtN(pa.amt)-amtN(pb.amt)||pa.days-pb.days});
    h+=tbl('eSIM thuê theo gói (giá mỗi gói)','',cols,gridRows(pk,cols,p=>base(p.pkg)),Math.max(700,150+cols.length*110));
  }
  body.innerHTML=h||'<div class="panel"><div class="empty">Không có dòng giá nào khớp.</div></div>';
}
function drawPrices(){
  if(PLDATA[S.f.prices.pl])return drawPL(S.f.prices);
  const f=S.f.prices,es=f.tab==='esim',rg=f.region||'',q=(f.q||'').trim().toLowerCase();
  const sel=es?$('ps'):$('pk');if(sel)sel.value=es?(f.src||''):(f.kind||'');const pr=$('pr');if(pr)pr.value=rg;
  const all=prices().filter(p=>(es?p.kind==='eSIM':p.kind!=='eSIM')&&(es||!f.kind||p.kind===f.kind)&&(!es||!f.src||p.src===f.src)&&(!rg||p.region===rg)&&(!q||(p.name+' '+(CTRY[p.c]||'')+' '+(p.pkg||'')+' '+(p.note||'')+' '+(p.region||'')).toLowerCase().includes(q)));
  LAST.prices=all;
  const body=$('pbody');if(!body)return;
  if(!es){
    const isMat=p=>p.c&&PKGS.indexOf(p.pkg)>=0;
    const g={};all.filter(isMat).forEach(p=>{const key=p.kind+'|'+p.c+'|'+p.unit;const r=g[key]||(g[key]={kind:p.kind,c:p.c,unit:p.unit,region:'',cells:{}});if(!r.cells[p.pkg])r.cells[p.pkg]=p;if(!r.region&&p.region)r.region=p.region});
    const tr=Object.values(g).map(r=>`<tr><td><b>${esc(CTRY[r.c]||r.c)}</b></td><td>${r.region?chip('mute',r.region):'<span class="muted">—</span>'}</td><td>${esc(kindLbl(r.kind))}${r.unit!=='Ngày'?`<br><small class="muted">theo ${esc(r.unit.toLowerCase())}</small>`:''}</td>${PKGS.map(pk=>{const p=r.cells[pk];return p?`<td class="num"><button class="pcell${p.active===false?' off':''}" data-act="editprice" data-id="${esc(p.id)}" title="${p.active===false?'Tạm ngưng':'Sửa giá'}">${vnd(p.price)}</button></td>`:`<td class="num"><button class="pcell add" data-act="newprice" data-id="${esc([r.kind,r.c,r.unit,pk,r.region].join('|'))}" aria-label="Thêm giá ${esc(pk)}">+</button></td>`}).join('')}</tr>`).join('')||`<tr><td colspan="6" class="empty">Không có dòng giá nào khớp.</td></tr>`;
    body.innerHTML=`<div class="panel"><div class="scroll"><table class="tbl" style="min-width:760px"><thead><tr><th>Quốc gia</th><th>Khu vực</th><th>Loại</th>${PKGS.map(p=>`<th class="num">${p.replace('/day','')} mỗi ngày</th>`).join('')}</tr></thead><tbody>${tr}</tbody></table></div></div>`+otherPanel(all.filter(p=>!isMat(p)),false);
    return;
  }
  const isM=p=>p.c&&p.ptype&&p.amt&&p.days;
  const mat=all.filter(isM);
  const block=(pt,title,sub)=>{
    const L=mat.filter(p=>p.ptype===pt);if(!L.length)return '';
    const days=[...new Set(L.map(p=>+p.days))].sort((a,b)=>a-b);
    const g={};L.forEach(p=>{const key=p.c+'|'+p.amt+'|'+(p.src||'')+'|'+(p.cover||'')+'|'+(p.ip?1:0)+'|'+(p.v||1);const r=g[key]||(g[key]={c:p.c,amt:p.amt,src:p.src||'',cover:p.cover||'',ip:p.ip?1:0,v:p.v||1,region:p.region||'',cells:{}});r.cells[p.days]=p});
    const amtN=a=>{const m=/^(\d+)(GB|MB)$/.exec(a);return m?+m[1]*(m[2]==='GB'?1000:1):0};
    const rows=Object.values(g).sort((a,b)=>(CTRY[a.c]||a.c).localeCompare(CTRY[b.c]||b.c,'vi')||amtN(a.amt)-amtN(b.amt)||a.src.localeCompare(b.src)||a.cover.localeCompare(b.cover,'vi')||a.ip-b.ip||a.v-b.v);
    const tr=rows.map(r=>`<tr><td><b>${esc(CTRY[r.c]||r.c)}</b></td><td>${r.region?chip('mute',r.region):'<span class="muted">—</span>'}</td><td><small>${esc(r.cover||'—')}</small></td><td>${esc(r.amt)}${pt==='d'?' / ngày':' tổng'}${r.ip?'<br><small class="muted">không dùng IP Hồng Kông</small>':''}${r.v>1?` <small class="muted">(bản ${r.v} trong file)</small>`:''}</td><td><small>${esc(r.src||'—')}</small></td>${days.map(d=>{const p=r.cells[d];return p?`<td class="num"><button class="pcell${p.active===false?' off':''}" data-act="editprice" data-id="${esc(p.id)}" title="Có VAT: ${vnd(p.price*1.1)} đ${p.cover?' · Phủ sóng: '+esc(p.cover):''}">${vnd(p.price)}</button></td>`:`<td class="num"><button class="pcell add" data-act="newprice" data-id="${esc(['eSIM',r.c,'Gói',esimPkg(pt,r.amt,d,r.ip),r.region,r.src,pt,r.amt,d,r.cover,r.ip].join('|'))}" aria-label="Thêm giá">+</button></td>`}).join('')}</tr>`).join('');
    return `<div class="panel" style="margin-bottom:14px"><h2>${title}</h2><div class="muted" style="padding:0 16px 6px;font-size:12.5px">${sub}</div><div class="scroll"><table class="tbl" style="min-width:${700+days.length*95}px"><thead><tr><th>Quốc gia / vùng</th><th>Khu vực</th><th>Vùng phủ sóng</th><th>Dung lượng</th><th>Nguồn SIM <span class="chip t-warn" style="font-size:10.5px">nội bộ</span></th>${days.map(d=>`<th class="num">${d} ngày</th>`).join('')}</tr></thead><tbody>${tr}</tbody></table></div></div>`;
  };
  body.innerHTML=(block('d','Gói theo ngày','Dung lượng tốc độ cao mỗi ngày; hết dung lượng trong ngày thì giảm còn 128kbps. Giá là cho toàn bộ số ngày của gói.')+block('q','Gói theo dung lượng','Một lượng dữ liệu dùng chung trong cả thời hạn của gói; hết dung lượng thì giảm còn 128kbps.')||'<div class="panel"><div class="empty">Không có dòng giá nào khớp.</div></div>')+otherPanel(all.filter(p=>!isM(p)),true);
}

/* ============ GIẢM GIÁ VÀ HỢP ĐỒNG ============ */
/* ============ HOA HỒNG NAM SAN ============ */
const isNS=o=>/nam\s*san/i.test((CB[o.cus]||{}).src||'');
const nsNet=(cid,dp)=>{const c=CB[cid]||{};dp=+dp||0;if(c.nsShare!=null&&c.nsShare!==''&&dp===(+c.pct||0))return +c.nsShare||0;return Math.max(0,30-dp)};
const nsRate=cid=>{const c=CB[cid]||{};return c.commPct!=null&&c.commPct!==''?(+c.commPct||0):30};
const commOf=o=>(LV('orderops')[o.code]||{}).comm||{};
/* một dòng: tổng tiền thuê = đơn giá × số ngày sử dụng thực tế × SL (chưa bảo hiểm, ship, VAT);
   giảm cho khách = % giảm giá của dòng; % hoa hồng thực nhận = % hoa hồng đại lý − % giảm (hoặc nhập tay) */
function commLine(o,l,i){const c=commOf(o),ov=(c.lines||{})[i]||{};const base=Math.round(l.base||0);const dp=+l.dpct||0;
  const q=ov.q!==''&&ov.q!=null?(+ov.q||0):(l.hq!==''&&l.hq!=null?(+l.hq||0):nsNet(o.cus,dp));
  const used=l.settle?(l.useDays||0):(l.days||0);
  return{base,dp,disc:Math.round(l.disc||0),q,net:Math.round(base*q/100),manual:(ov.q!==''&&ov.q!=null)||(l.hq!==''&&l.hq!=null),used}}
const isWifiL=l=>!(l.prod==='eSIM'||l.dev==='eSim'||l.type==='eSIM'||String(l.pkgType||l.iccid||'')!==''&&!l.dev);
const commOrder=o=>o.lines.reduce((t,l,i)=>{const k=commLine(o,l,i);t.base+=k.base;t.disc+=k.disc;t.net+=k.net;return t},{base:0,disc:0,net:0});
VIEWS.commission=function(){
  const f=S.f.comm;const ms=[...new Set(ORD.filter(isNS).filter(o=>o.lines.some(isWifiL)).map(o=>String(o.date||'').slice(0,7)).filter(Boolean))].sort().reverse();
  return head('Hoa hồng Nam San','Chỉ tính cho đơn Wi-Fi. Hoa hồng = đơn giá × số ngày sử dụng thực tế × số lượng × % Đại lý (30% trừ % giảm giá cho khách). Tích ô bên trái để đánh dấu đã tính hoa hồng theo tháng.',`<div class="btns">${expBtn('comm')}</div>`)+
  `<div class="tabs" role="tablist" style="margin-bottom:14px"><button role="tab" aria-selected="${f.t!=='done'}" data-act="ctab" data-id="todo">Chưa tính hoa hồng (${commCnt('todo')})</button><button role="tab" aria-selected="${f.t==='done'}" data-act="ctab" data-id="done">Đã tính hoa hồng (${commCnt('done')})</button></div>
  <div class="filters"><input type="search" id="cq2" placeholder="Tìm mã đơn, khách" value="${esc(f.q)}" aria-label="Tìm đơn"><select id="cm" aria-label="Tháng"><option value="">Mọi tháng</option>${ms.map(m=>`<option value="${m}"${f.m===m?' selected':''}>${m.split('-').reverse().join('/')}</option>`).join('')}</select><select id="cs2" aria-label="Trạng thái chi"><option value="">Mọi trạng thái</option><option value="paid"${f.s==='paid'?' selected':''}>Đã chi</option><option value="due"${f.s==='due'?' selected':''}>Chưa chi</option></select>${f.t==='done'?`<select id="ctm" aria-label="Tháng đã tính"><option value="">Mọi tháng đã tính</option>${calcMonths().map(m=>`<option value="${m}"${f.cm2===m?' selected':''}>Tháng ${m.split('-').reverse().join('/')}</option>`).join('')}</select>`:''}</div><div class="bulk" id="cbulk" hidden></div>
  <div class="panel"><div class="scroll"><table class="tbl" style="min-width:1250px"><thead><tr><th style="width:34px"><input type="checkbox" id="csall" data-act="csall" aria-label="Chọn tất cả"></th><th>Tính HH</th><th>Mã đơn</th><th>Khách hàng</th><th>Nơi đến</th><th class="num">SL</th><th>Từ ngày</th><th>Đến ngày</th><th class="num">Số ngày</th><th class="num">Đơn giá</th><th class="num">Tổng tiền thuê</th><th class="num">% trừ khách</th><th class="num">Tiền giảm</th><th class="num">% HH thực nhận</th><th class="num">Hoa hồng thực nhận</th><th>Mã máy</th><th>Hóa đơn</th><th>Khách thanh toán</th><th>Chi hoa hồng</th><th></th></tr></thead><tbody id="ctb"></tbody></table></div></div><div id="csum"></div>`;
};
const calcOf=(o,i)=>((commOf(o).calc||{})[i])||'';
const commCnt=t=>{let n=0;ORD.filter(isNS).forEach(o=>o.lines.forEach((l,i)=>{if(isWifiL(l)&&(t==='done')===!!calcOf(o,i))n++}));return n};
const calcMonths=()=>[...new Set(ORD.filter(isNS).flatMap(o=>Object.values(commOf(o).calc||{})).filter(Boolean))].sort().reverse();
function commRows(){const f=S.f.comm;const q=(f.q||'').trim().toLowerCase();const out=[];
  ORD.filter(isNS).filter(o=>(!f.m||String(o.date||'').slice(0,7)===f.m)&&(!q||(o.code+' '+((CB[o.cus]||{}).name||'')+' '+((CB[o.cus]||{}).legal||'')).toLowerCase().includes(q))).filter(o=>{const c=commOf(o);return !f.s||(f.s==='paid'&&c.paid)||(f.s==='due'&&!c.paid)}).sort((a,b)=>String(b.date).localeCompare(String(a.date))||(a.code<b.code?1:-1)).forEach(o=>o.lines.forEach((l,i)=>{if(!isWifiL(l))return;const cm=calcOf(o,i);if(f.t==='done'){if(!cm||(f.cm2&&cm!==f.cm2))return}else if(cm)return;out.push({o,l,i,k:commLine(o,l,i)})}));return out}
function drawComm(){
  const rows=commRows();const tb=$('ctb');if(!tb)return;const CS=S.f.comm.sel=S.f.comm.sel||{};
  tb.innerHTML=rows.map(({o,l,i,k})=>{const c=commOf(o),iv=l.inv&&INVS[l.inv];
    const pay=iv&&iv.recv?chip('ok','Đã thanh toán'):iv?chip('warn','Chưa thanh toán'):chip('mute','Chưa xuất HĐ');
    const st=c.paid?chip('ok','Đã chi'+(c.paidDate?' '+fmtD(c.paidDate):'')):chip('warn','Chưa chi');
    const key=o.code+'|'+i,cm=calcOf(o,i);
    return `<tr><td data-act="csel" data-id="${esc(key)}"><input type="checkbox"${CS[key]?' checked':''} aria-label="Chọn dòng"></td><td>${cm?chip('ok','Đã tính T'+cm.slice(5)+'/'+cm.slice(0,4)):chip('warn','Chưa tính')}</td><td class="mono"><b>${esc(o.code)}</b></td><td>${clink(o.cus)}</td><td>${esc(CTRY[l.c]||l.c||'')}</td><td class="num">${l.qty||1}</td><td>${fmtD(l.s)}</td><td>${fmtD(l.e)}</td><td class="num">${k.used}</td><td class="num">${vnd(l.price||0)}</td><td class="num">${vnd(k.base)}</td><td class="num">${k.dp?k.dp+'%':'<span class="muted">0%</span>'}</td><td class="num">${k.disc?vnd(k.disc):'<span class="muted">—</span>'}</td><td class="num"><b>${k.q}%</b>${k.manual?'<br><small class="muted">nhập tay</small>':''}</td><td class="num"><b>${vnd(k.net)}</b></td><td>${esc(l.dev&&l.dev!=='eSim'?l.dev:'eSIM')}</td><td class="mono">${l.inv||'<span class="muted">—</span>'}${iv&&iv.date?'<br><small class="muted">'+fmtD(iv.date)+'</small>':''}</td><td>${pay}${iv&&iv.recv?'<br><small class="muted">'+fmtD(iv.recv)+'</small>':''}</td><td>${st}${c.note?'<br><small class="muted">'+esc(c.note)+'</small>':''}</td><td><button class="btn sm" data-act="editcomm" data-id="${esc(o.code)}">Sửa</button></td></tr>`}).join('')||`<tr><td colspan="20" class="empty">Chưa có đơn Wi-Fi nào từ nguồn Nam San. Chọn nguồn khách "Nam san agent" trong hồ sơ khách hàng.</td></tr>`;
  const T=rows.reduce((t,r)=>{t.b+=r.k.base;t.d+=r.k.disc;t.n+=r.k.net;if(commOf(r.o).paid)t.p+=r.k.net;if(calcOf(r.o,r.i))t.c+=r.k.net;return t},{b:0,d:0,n:0,p:0,c:0});updCBulk();
  $('csum').innerHTML=`<div class="panel" style="margin-top:14px"><div class="sum" style="border-top:0"><div><span class="muted">Tổng tiền thuê (${rows.length} dòng)</span><span class="num">${vnd(T.b)} đ</span></div><div><span class="muted">Trừ trực tiếp cho khách</span><span class="num">${vnd(T.d)} đ</span></div><div><span class="muted">Hoa hồng thực nhận</span><span class="num">${vnd(T.n)} đ</span></div><div><span class="muted">Đã tính hoa hồng</span><span class="num">${vnd(T.c)} đ</span></div><div><span class="muted">Chưa tính hoa hồng</span><span class="num">${vnd(T.n-T.c)} đ</span></div><div><span class="muted">Đã chi</span><span class="num">${vnd(T.p)} đ</span></div><div class="tot"><span>Còn phải chi</span><span class="num">${vnd(T.n-T.p)} đ</span></div></div></div>`;
}
function updCBulk(){const CS=S.f.comm.sel||{};const ex=new Set();ORD.forEach(o=>o.lines.forEach((l,i)=>ex.add(o.code+'|'+i)));Object.keys(CS).forEach(k=>{if(!ex.has(k))delete CS[k]});const n=Object.keys(CS).length;const b=$('cbulk');if(!b)return;b.hidden=!n;const cur=(b.querySelector('#cmon')||{}).value||TODAY.slice(0,7);b.innerHTML=n?`<span><b>${n}</b> dòng được chọn</span><label class="sm">Tháng tính hoa hồng <input type="month" id="cmon" value="${cur}"></label><button class="btn sm pri" data-act="cmark">Đánh dấu đã tính</button><button class="btn sm" data-act="cunmark">Bỏ đánh dấu</button><button class="btn sm" data-act="cclear">Bỏ chọn</button>`:''}
async function commMark(on){const CS=S.f.comm.sel||{};const m=(($('cmon')||{}).value||TODAY.slice(0,7));const by={};Object.keys(CS).forEach(k=>{const [c,i]=k.split('|');(by[c]=by[c]||[]).push(+i)});let n=0;for(const c of Object.keys(by)){const o=ORD.find(x=>x.code===c);if(!o)continue;const cm=Object.assign({},commOf(o));const calc=Object.assign({},cm.calc||{});by[c].forEach(i=>{if(on)calc[i]=m;else delete calc[i];n++});cm.calc=calc;try{await save('orderops',c,Object.assign({},LV('orderops')[c]||{},{comm:cm}))}catch(e){}}S.f.comm.sel={};drawComm();toast(on?'Đã đánh dấu tính hoa hồng tháng '+m.split('-').reverse().join('/')+' cho '+n+' dòng':'Đã bỏ đánh dấu '+n+' dòng')}
function commForm(code){
  const o=ORD.find(x=>x.code===code);const c=commOf(o);
  const s={paid:!!c.paid,paidDate:c.paidDate||'',note:c.note||'',err:[]};o.lines.forEach((l,i)=>{s['q'+i]=((c.lines||{})[i]||{}).q==null?'':(c.lines[i].q)});
  const tot=()=>{let n=0;o.lines.forEach((l,i)=>{if(!isWifiL(l))return;const t=commLine(Object.assign({},o),l,i);const q=s['q'+i]!==''?(+s['q'+i]||0):t.q;n+=Math.round(t.base*q/100)});return n};
  return {s,
    render(){
      return `<div class="form">${formTop('Hoa hồng Nam San',esc(o.code)+' · '+esc((CB[o.cus]||{}).name||''))}${ferr(s)}
      <div class="note info">% hoa hồng thực nhận mặc định = tổng 30% trừ % giảm giá cho khách (hoặc số % hoa hồng ghi trong hồ sơ khách). Chỉ nhập ô % nếu dòng đó khác mặc định.</div>
      ${o.lines.map((l,i)=>{if(!isWifiL(l))return '';const k=commLine(o,l,i);return `<div class="ln"><div class="ln-h"><span>${esc(l.dev&&l.dev!=='eSim'?l.dev:'eSIM')} · ${esc(CTRY[l.c]||l.c||'')} · ${fmtD(l.s)} – ${fmtD(l.e)}</span></div><div class="sm muted" style="margin-bottom:6px">Tổng tiền thuê ${vnd(k.base)} đ (${k.used} ngày thực tế × ${vnd(l.price||0)}) · trừ cho khách ${k.dp}% (${vnd(k.disc)} đ) · mặc định ${nsNet(o.cus,k.dp)}%</div><div class="fg">${F('q'+i,'% hoa hồng thực nhận (để trống = mặc định)',{t:'num'})}</div></div>`}).join('')}
      <div class="calc" style="margin:10px 0"><span>Hoa hồng thực nhận cả đơn: <b id="cpv">${vnd(tot())} đ</b></span></div>
      <div class="fg">${F('paid','Đã chi hoa hồng cho Nam San',{t:'check'})}${s.paid?F('paidDate','Ngày chi',{t:'date'}):''}${F('note','Ghi chú',{cls:'wall'})}</div>
      ${fbar('','Lưu hoa hồng')}</div>`},
    onChange(){rerender()},
    onInput(){const n=$('cpv');if(n)n.textContent=vnd(tot())+' đ'},
    async submit(){
      const lines={};for(let i=0;i<o.lines.length;i++){if(!isWifiL(o.lines[i]))continue;const v=s['q'+i];if(v!==''){if(+v<0||+v>100){s.err=['% hoa hồng phải từ 0 đến 100.'];rerender();return}lines[i]={q:+v}}}
      const comm={lines,calc:c.calc||{},paid:!!s.paid,paidDate:s.paid?(s.paidDate||TODAY):'',note:String(s.note||'').trim()};
      try{await save('orderops',code,Object.assign({},LV('orderops')[code]||{},{comm}))}catch(e){return}
      closeDrawer();toast('Đã lưu hoa hồng')}};
}
VIEWS.discounts=function(){
  return head('Giảm giá và hợp đồng','Phần trăm giảm theo MST và hợp đồng đã ký của từng khách. Giảm giá tự điền vào đơn và báo giá.',`<div class="btns">${expBtn('customers')}</div>`)+
  `<div class="filters"><input type="search" id="gq" placeholder="Tìm tên khách, MST" value="${esc(S.f.discounts.q)}" aria-label="Tìm khách"></div>
   <div class="panel"><div class="scroll"><table class="tbl" style="min-width:900px"><thead><tr><th>Khách hàng</th><th>MST</th><th class="num">Giảm giá</th><th>Hiệu lực</th><th>Hợp đồng đã ký</th><th></th></tr></thead><tbody id="gtb"></tbody></table></div></div>`;
};
function drawDiscounts(){
  const q=S.f.discounts.q.trim().toLowerCase();
  const rows=CUS.filter(c=>!q||(c.name+c.legal+c.mst).toLowerCase().includes(q)).sort((a,b)=>(b.pct||0)-(a.pct||0)||(a.name<b.name?-1:1));
  $('gtb').innerHTML=rows.map(c=>{const cs=custContracts(c.id);
    return `<tr><td><div class="two"><span>${clink(c.id)}</span><small>${esc(c.src)}</small></div></td><td class="mono">${esc(c.mst||'—')}</td>
    <td class="num">${c.pct?`<b>${c.pct}%</b>`:'<span class="muted">0%</span>'}</td><td><small>${c.pct?`${c.pctFrom?fmtD(c.pctFrom):'từ trước'} đến ${c.pctTo?fmtD(c.pctTo):'không thời hạn'}`:'—'}${c.pct&&!custPct(c)?'<br>'+chip('warn','Hết hiệu lực'):''}</small></td>
    <td>${cs.length?cs.map(x=>x.asset?`<a href="/_blob/${esc(x.asset)}" target="_blank" rel="noopener">${esc(x.no||x.fname||'Hợp đồng')}</a>`:esc(x.no||'Hợp đồng')).join('<br>'):'<span class="muted">Chưa có</span>'}</td>
    <td><div class="btns"><button class="btn sm" data-act="editdiscount" data-id="${esc(c.id)}">Sửa giảm giá</button><button class="btn sm" data-act="newcontract" data-id="${esc(c.id)}">Gắn hợp đồng</button></div></td></tr>`}).join('')||`<tr><td colspan="6" class="empty">Không tìm thấy khách</td></tr>`;
}

/* ============ CHỨNG TỪ: tính toán ============ */
const qLine=l=>{const es=l.prod==='eSIM';const base=(+l.price||0)*(+l.qty||1)*(es?1:(+l.days||1));/* eSIM không có giảm giá, phí khác, bảo hiểm */const disc=es?0:Math.round(base*(+l.dpct||0)/100);return{base,disc,ex:base-disc+(es?0:(+l.fee||0)+(+l.ins||0))}};
function qTot(q){let ex=0,disc=0,vat=0;const vr=q.vat==null?10:+q.vat;q.lines.forEach(l=>{const c=qLine(l);ex+=c.ex;disc+=c.disc;vat+=Math.round(c.ex*vr/100)});return{ex,disc,vat,vr,total:ex+vat}}
const qKind=q=>q.kind||(q.lines.length&&q.lines.every(l=>l.prod==='eSIM')?'esim':q.lines.some(l=>l.prod==='eSIM')?'both':'wifi');
const qStatus=q=>q.status==='Đã gửi'&&q.valid&&q.valid<TODAY?'Hết hạn':(q.status||'Nháp');
const QTONE={'Nháp':'mute','Đã gửi':'info','Chấp nhận':'ok','Từ chối':'bad','Hết hạn':'warn'};
const QSTATUS=['Nháp','Đã gửi','Chấp nhận','Từ chối'];
const prStatus=r=>{const inv=r.items.filter(x=>x.type==='invoice');if(inv.length&&inv.length===r.items.length&&inv.every(x=>INVS[x.ref]&&INVS[x.ref].recv))return 'Đã thanh toán';return r.status||'Nháp'};
const PTONE={'Nháp':'mute','Đã gửi':'info','Đã thanh toán':'ok'};
const hoDevs=h=>h.items.map(x=>x.dev).join(', ');

/* ============ BÁO GIÁ ============ */
VIEWS.quotes=function(){
  const f=S.f.quotes;
  return head('Báo giá','Lập báo giá từ bảng giá, theo dõi trạng thái và chuyển thành đơn hàng khi khách chốt.',`<div class="btns">${expBtn('quotes')}${newBtn('newquote','Tạo báo giá')}</div>`)+
  `<div class="filters"><input type="search" id="qq" placeholder="Tìm số báo giá, khách" value="${esc(f.q)}" aria-label="Tìm báo giá"><select id="qs" aria-label="Trạng thái"><option value="">Mọi trạng thái</option>${[...QSTATUS,'Hết hạn'].map(s=>`<option>${s}</option>`).join('')}</select></div>
   <div class="panel"><div class="scroll"><table class="tbl" style="min-width:820px"><thead><tr><th>Số báo giá</th><th>Khách hàng</th><th>Ngày</th><th>Hiệu lực đến</th><th class="num">Giá trị gồm VAT</th><th>Trạng thái</th><th>Đơn hàng</th></tr></thead><tbody id="qtb"></tbody></table></div><div class="count" style="padding:10px 12px" id="qc"></div></div>`;
};
function drawQuotes(){
  const f=S.f.quotes;$('qs').value=f.status;const q=f.q.trim().toLowerCase();
  const all=Object.entries(LV('quotes')).map(([id,v])=>Object.assign({id},v));
  const rows=all.filter(x=>(!q||(x.no+' '+(CB[x.cus]||{}).name).toLowerCase().includes(q))&&(!f.status||qStatus(x)===f.status)).sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:(a.no<b.no?1:-1));
  LAST.quotes=rows;
  $('qtb').innerHTML=rows.map(x=>{const st=qStatus(x);return `<tr class="row" tabindex="0" data-act="doc" data-id="quote:${esc(x.id)}"><td class="mono"><b>${esc(x.no)}</b></td><td>${esc((CB[x.cus]||{name:'—'}).name)}</td><td>${fmtD(x.date)}</td><td>${fmtD(x.valid)}</td><td class="num">${vnd(qTot(x).total)}</td><td>${chip(QTONE[st],st)}</td><td>${x.order?olink(x.order):'<span class="muted">—</span>'}</td></tr>`}).join('')||`<tr><td colspan="7" class="empty">Chưa có báo giá. Bấm Tạo báo giá để lập báo giá đầu tiên.</td></tr>`;
  $('qc').textContent=`${rows.length} / ${all.length} báo giá`;
}

/* ============ BIÊN BẢN BÀN GIAO ============ */
VIEWS.handovers=function(){
  return head('Biên bản bàn giao','Biên bản giao và thu hồi thiết bị theo từng đơn, có chỗ ký hai bên.',`<div class="btns">${expBtn('handovers')}${newBtn('newhandover','Lập biên bản')}</div>`)+
  `<div class="filters"><input type="search" id="hq" placeholder="Tìm số biên bản, đơn, khách" value="${esc(S.f.handovers.q)}" aria-label="Tìm biên bản"></div>
   <div class="panel"><div class="scroll"><table class="tbl" style="min-width:820px"><thead><tr><th>Số biên bản</th><th>Loại</th><th>Đơn hàng</th><th>Khách hàng</th><th>Ngày</th><th>Thiết bị</th><th>Đại diện khách</th></tr></thead><tbody id="htb"></tbody></table></div></div>`;
};
function drawHandovers(){
  const q=S.f.handovers.q.trim().toLowerCase();
  const rows=Object.entries(LV('handovers')).map(([id,v])=>Object.assign({id},v)).filter(h=>!q||(h.no+' '+h.order+' '+(CB[h.cus]||{}).name).toLowerCase().includes(q)).sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:(a.no<b.no?1:-1));
  LAST.handovers=rows;
  $('htb').innerHTML=rows.map(h=>`<tr class="row" tabindex="0" data-act="doc" data-id="handover:${esc(h.id)}"><td class="mono"><b>${esc(h.no)}</b></td><td>${chip(h.type==='Giao'?'info':'warn',h.type==='Giao'?'Giao máy':'Thu hồi')}</td><td>${olink(h.order)}</td><td>${esc((CB[h.cus]||{name:'—'}).name)}</td><td>${fmtD(h.date)}</td><td class="mono">${esc(hoDevs(h))}</td><td>${esc(h.theirs||'—')}</td></tr>`).join('')||`<tr><td colspan="7" class="empty">Chưa có biên bản. Mở một đơn hàng rồi bấm Lập biên bản bàn giao, hoặc bấm nút ở góc trên.</td></tr>`;
}

/* ============ ĐỀ NGHỊ THANH TOÁN ============ */
VIEWS.payreqs=function(){
  return head('Đề nghị thanh toán','Lập đề nghị thanh toán theo hóa đơn hoặc theo đơn hàng, kèm thông tin chuyển khoản.',`<div class="btns">${expBtn('payreqs')}${newBtn('newpayreq','Lập đề nghị')}</div>`)+
  `<div class="filters"><input type="search" id="rq" placeholder="Tìm số đề nghị, khách" value="${esc(S.f.payreqs.q)}" aria-label="Tìm đề nghị"></div>
   <div class="panel"><div class="scroll"><table class="tbl" style="min-width:820px"><thead><tr><th>Số đề nghị</th><th>Khách hàng</th><th>Ngày</th><th>Căn cứ</th><th class="num">Số tiền đề nghị</th><th>Hạn thanh toán</th><th>Trạng thái</th></tr></thead><tbody id="rtb"></tbody></table></div></div>`;
};
function drawPayreqs(){
  const q=S.f.payreqs.q.trim().toLowerCase();
  const rows=Object.entries(LV('payreqs')).map(([id,v])=>Object.assign({id},v)).filter(r=>!q||(r.no+' '+(CB[r.cus]||{}).name).toLowerCase().includes(q)).sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:(a.no<b.no?1:-1));
  LAST.payreqs=rows;
  $('rtb').innerHTML=rows.map(r=>{const st=prStatus(r);return `<tr class="row" tabindex="0" data-act="doc" data-id="payreq:${esc(r.id)}"><td class="mono"><b>${esc(r.no)}</b></td><td>${esc((CB[r.cus]||{name:'—'}).name)}</td><td>${fmtD(r.date)}</td><td><small>${esc(r.items.map(x=>x.type==='invoice'?'HĐ '+x.ref:'Đơn '+x.ref).join(', '))}</small></td><td class="num"><b>${vnd(sum(r.items,x=>x.ask))}</b></td><td>${fmtD(r.due)}</td><td>${chip(PTONE[st],st)}</td></tr>`}).join('')||`<tr><td colspan="7" class="empty">Chưa có đề nghị thanh toán. Bấm Lập đề nghị, hoặc dùng nút Đề nghị TT ở dòng hóa đơn.</td></tr>`;
}

/* ============ XUẤT EXCEL ============ */
VIEWS.reports=function(){
  const R=S.rep;
  const defs=[['lines','Đơn hàng chi tiết (từng dòng thuê)','Một dòng cho mỗi máy hoặc SIM: khách, MST, nguồn, ngày, đơn giá, giảm giá, VAT, tổng, hóa đơn, dư nợ.'],
   ['customers','Khách hàng và công nợ','Doanh thu, đã thu, dư nợ, giảm giá, hợp đồng của từng khách.'],
   ['invoices','Hóa đơn và tuổi nợ','Mọi hóa đơn kèm hạn thu, ngày nhận, số ngày trễ và tuổi nợ.'],
   ['devices','Thiết bị','Trạng thái, vị trí, bên giữ, đơn hiện tại, ngày giao và ngày thu.'],
   ['quotes','Báo giá',''],['handovers','Biên bản bàn giao',''],['payreqs','Đề nghị thanh toán',''],['prices','Bảng giá','']];
  return head('Xuất Excel','Chọn các trang tính cần có, một lần xuất ra một file .xlsx. Mỗi danh sách cũng có nút Xuất Excel riêng.')+
  `<div class="panel"><h2>Nội dung báo cáo</h2><div class="pb"><div class="fs">${defs.map(([k,t,d])=>`<label class="ck" style="align-items:flex-start"><input type="checkbox" id="rs_${k}" ${R.sheets[k]?'checked':''}><span><b>${t}</b>${d?`<br><small class="muted">${d}</small>`:''}</span></label>`).join('')}</div></div></div>
   <div class="panel"><h2>Khoảng thời gian</h2><div class="pb"><div class="fg"><label class="f"><span>Từ ngày</span>${dateIn('id="rfrom"',R.from)}</label><label class="f"><span>Đến ngày</span>${dateIn('id="rto"',R.to)}</label></div>
   <div class="sm muted" style="margin-top:8px">Lọc theo ngày tạo đơn cho trang tính đơn hàng, và theo ngày hóa đơn cho trang tính hóa đơn. Để trống là lấy tất cả.</div></div></div>
   <div class="btns"><button class="btn pri" data-act="exportreport">${ico('download')}Xuất báo cáo Excel</button></div>`;
};
const inRange=d=>(!S.rep.from||d>=S.rep.from)&&(!S.rep.to||d<=S.rep.to);
const stLbl=l=>lineState(l).label;
function rowsLines(orders){
  const h=['Mã đơn','Ngày đặt','Khách hàng','MST','Nguồn khách','Khu vực','Đơn vị giao','Người dùng máy','Loại','Mã máy','IMEI','Quốc gia','Gói','Ngày giao','Ngày bắt đầu','Ngày kết thúc','Thời hạn','Đơn vị','Đơn giá','Giảm giá (%)','Giảm giá','Phí giao','Bảo hiểm','Đền bù','Chưa VAT','VAT (%)','Tiền VAT','Tổng cộng','Trạng thái','Ngày trả máy','Đơn vị trả','Số HĐ','Ngày HĐ','Hạn thu','Ngày nhận tiền','Dư nợ','Ngày sử dụng thực tế','Phí mở máy','Phí giữ máy','Mã đơn đối tác','ICCID'];
  const rows=[h];
  orders.forEach(o=>o.lines.forEach(l=>{const c=CB[o.cus];const i=l.inv&&INVS[l.inv];
    rows.push([o.code,fmtD(o.date),c.name,c.mst||'',c.src,o.area||'',o.firm||'',l.user||'',prodLbl(l),isPhys(l)?l.dev:'eSIM',isPhys(l)&&DEVS[l.dev]?DEVS[l.dev].imei:'',CTRY[l.c]||'',l.pkg||'',fmtD(l.del),fmtD(l.s),fmtD(l.e),l.days,l.months?'Tháng':'Ngày',l.price||l.fixed||0,l.dpct||0,l.disc,l.fee,l.ins,l.comp,l.ex,l.vat,l.vatAmt,l.total,stLbl(l),fmtD(l.ret),l.retFirm||'',i?i.no:'',i?fmtD(i.date):'',i?fmtD(i.due):'',i&&i.recv?fmtD(i.recv):'',i?(l.total*(i.out/(i.total||1))):l.total,l.useDays!=null?l.useDays:'',l.act||0,+l.holdFee||0,l.partner||'',l.iccid||'']);
  }));
  return rows;
}
function rowsCustomers(list){
  const rows=[['Khách hàng','Tên pháp lý','MST','Nguồn','Người liên hệ','Số điện thoại','Email','Địa chỉ','Giảm giá (%)','Hiệu lực từ','Hiệu lực đến','Hợp đồng','Số đơn','Doanh thu chưa VAT','Doanh thu gồm VAT','Đã thu','Dư nợ','Trong đó quá hạn','Máy đang giữ']];
  list.forEach(c=>{const s=custStats(c.id);rows.push([c.name,c.legal,c.mst||'',c.src,c.contact||'',c.phone||'',c.email||'',c.addr||'',c.pct||0,fmtD(c.pctFrom),fmtD(c.pctTo),custContracts(c.id).map(x=>x.no).filter(Boolean).join(', '),s.os.length,s.ex,s.inc,s.paid,s.out,s.over,s.held.length])});
  return rows;
}
function rowsInvoices(list){
  const rows=[['Số HĐ','Khách hàng','MST','Ngày HĐ','Hạn thu','Giá trị chưa VAT','Giá trị gồm VAT','Đã thu','Dư nợ','Ngày nhận','Trễ (ngày)','Tuổi nợ','Mã đơn']];
  list.forEach(i=>{const c=CB[i.cus]||{};rows.push([i.no,c.name||'',c.mst||'',fmtD(i.date),fmtD(i.due),i.ex,i.total,i.paid,i.out,fmtD(i.recv),i.late,i.recv?'Đã thu':AGE[i.age],[...new Set(i.lines.map(l=>l.o.code))].join(', ')])});
  return rows;
}
function rowsDevices(list){
  const rows=[['Mã máy','IMEI','Loại','Trạng thái','Vị trí','Bên giữ','Đơn hiện tại','Khách','Ngày giao','Ngày thu','Ghi chú']];
  list.forEach(d=>{const l=d.cur;rows.push([d.code,d.m.imei,d.m.type,DK[d.k][0],d.loc,d.holder,l?l.o.code:'',l?CB[l.cus].name:'',l?fmtD(l.del||l.s):'',l?(l.ret?fmtD(l.ret):d.k==='hold'?'Khách giữ máy':fmtD(l.e)):'',d.note||(d.m.base&&d.m.base.note)||''])});
  return rows;
}
function rowsQuotes(list){
  const rows=[['Số báo giá','Khách hàng','Ngày','Hiệu lực đến','Chưa VAT','VAT','Tổng cộng','Trạng thái','Đơn hàng']];
  list.forEach(q=>{const t=qTot(q);rows.push([q.no,(CB[q.cus]||{}).name||'',fmtD(q.date),fmtD(q.valid),t.ex,t.vat,t.total,qStatus(q),q.order||''])});return rows;
}
function rowsHandovers(list){
  const rows=[['Số biên bản','Loại','Đơn hàng','Khách hàng','Ngày','Thiết bị','Đại diện công ty','Đại diện khách','Ghi chú']];
  list.forEach(h=>rows.push([h.no,h.type==='Giao'?'Giao máy':'Thu hồi',h.order,(CB[h.cus]||{}).name||'',fmtD(h.date),hoDevs(h),h.ours||'',h.theirs||'',h.note||'']));return rows;
}
function rowsPayreqs(list){
  const rows=[['Số đề nghị','Khách hàng','Ngày','Căn cứ','Số tiền đề nghị','Hạn thanh toán','Trạng thái']];
  list.forEach(r=>rows.push([r.no,(CB[r.cus]||{}).name||'',fmtD(r.date),r.items.map(x=>(x.type==='invoice'?'HĐ ':'Đơn ')+x.ref).join(', '),sum(r.items,x=>x.ask),fmtD(r.due),prStatus(r)]));return rows;
}
function rowsPrices(list){
  const rows=[['Tên','Loại','Quốc gia','Khu vực','Gói','Đơn vị','Đơn giá (chưa VAT)','Giá có VAT','Nguồn SIM (chỉ nội bộ)','Ghi chú','Áp dụng']];
  list.forEach(p=>rows.push([p.name,(KINDS.find(x=>x[0]===p.kind)||[0,p.kind])[1],CTRY[p.c]||'',p.region||'',p.pkg||'',p.unit,p.price,p.priceVat||Math.round(p.price*1.1),p.src||'',p.note||'',p.active===false?'Tạm ngưng':'Đang áp dụng']));return rows;
}
const allQuotes=()=>Object.entries(LV('quotes')).map(([id,v])=>Object.assign({id},v)).sort((a,b)=>a.date<b.date?1:-1);
const allHandovers=()=>Object.entries(LV('handovers')).map(([id,v])=>Object.assign({id},v)).sort((a,b)=>a.date<b.date?1:-1);
const allPayreqs=()=>Object.entries(LV('payreqs')).map(([id,v])=>Object.assign({id},v)).sort((a,b)=>a.date<b.date?1:-1);

/* ---- xuất Excel chứng từ: dựng lại đúng bản in (chữ, bảng gộp ô, khối ký, ảnh) ---- */
async function htmlToXlsx(html,sheetName){
  const doc=new DOMParser().parseFromString('<body>'+html+'</body>','text/html');
  const root=doc.querySelector('.paper')||doc.body;
  const land=/\bland\b/.test(root.className||'');
  const wb=new ExcelJS.Workbook();
  const ws=wb.addWorksheet((sheetName||'Chứng từ').slice(0,31),{pageSetup:{orientation:land?'landscape':'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9},views:[{showGridLines:false}]});
  const FONT={name:'Arial',size:10};const thin={style:'thin',color:{argb:'FF9AA5AF'}};const BD={top:thin,left:thin,bottom:thin,right:thin};
  const BLK=new Set(['DIV','P','TABLE','UL','OL','H1','H2','H3','LI']);
  const tx=n=>(n.textContent||'').replace(/\s+/g,' ').trim();
  /* ---- lưới bảng ---- */
  const gridOf=t=>{const rows=[...t.querySelectorAll('tr')];const occ=[];const cells=[];let nc=0;
    rows.forEach((tr,ri)=>{occ[ri]=occ[ri]||[];let ci=0;[...tr.children].forEach(td=>{while(occ[ri][ci])ci++;const cs=Math.max(1,+td.getAttribute('colspan')||1),rsn=Math.max(1,+td.getAttribute('rowspan')||1);
      for(let a=0;a<rsn;a++)for(let b=0;b<cs;b++){occ[ri+a]=occ[ri+a]||[];occ[ri+a][ci+b]=true}
      cells.push({r:ri,c:ci,cs,rs:rsn,td,th:td.tagName==='TH',tr});ci+=cs;nc=Math.max(nc,ci)})});
    return{cells,nr:rows.length,nc}};
  const tables=[...root.querySelectorAll('table')].map(gridOf);
  let NC=Math.max(6,...tables.map(g=>g.nc));
  const W=Array(NC).fill(8);
  tables.forEach(g=>g.cells.forEach(c=>{if(c.cs===1&&!c.th){const L=Math.max(...String(c.td.innerText||c.td.textContent||'').split('\n').map(s=>s.trim().length),0);W[c.c]=Math.max(W[c.c],Math.min(L+2,44))}else if(c.cs===1)W[c.c]=Math.max(W[c.c],Math.min(Math.ceil(tx(c.td).length/2)+2,24))}));
  ws.columns=W.map(w=>({width:w}));
  const TW=W.reduce((a,b)=>a+b,0);
  const spanW=(a,b)=>{let s=0;for(let i=a;i<=b;i++)s+=W[i-1]||8;return s};
  let r=1;
  /* ---- chữ có định dạng ---- */
  const rich=el=>{const parts=[];const walk=(n,f)=>{n.childNodes.forEach(k=>{
      if(k.nodeType===3){const t=k.textContent.replace(/\s+/g,' ');if(t)parts.push({text:t,font:Object.assign({},FONT,f)});return}
      if(k.nodeType!==1)return;const tg=k.tagName;
      if(tg==='BR'){parts.push({text:'\n',font:Object.assign({},FONT,f)});return}
      const g=Object.assign({},f);if(tg==='B'||tg==='STRONG')g.bold=true;if(tg==='I'||tg==='EM')g.italic=true;
      if(k.classList&&k.classList.contains('en')){g.italic=true;g.color={argb:'FF4A5560'};if(tg==='SPAN'&&k.style.display==='block'&&parts.length&&!/\n$/.test(parts[parts.length-1].text)){parts.push({text:'\n',font:Object.assign({},FONT,f)})}}
      if(tg==='SMALL'){g.size=9;g.color={argb:'FF4A5560'}}
      walk(k,g)})};
    walk(el,{});
    /* gọn khoảng trắng đầu/cuối dòng */
    parts.forEach((p,i)=>{if(i===0||/\n$/.test(parts[i-1].text))p.text=p.text.replace(/^ +/,'')});
    while(parts.length&&/^\s*$/.test(parts[parts.length-1].text))parts.pop();
    if(parts.length)parts[parts.length-1].text=parts[parts.length-1].text.replace(/ +$/,'');
    return parts};
  const plain=parts=>parts.map(p=>p.text).join('');
  const lines=(s,w)=>String(s).split('\n').reduce((a,l)=>a+Math.max(1,Math.ceil(l.length/Math.max(8,w*1.05))),0);
  const textRow=(el,o)=>{o=o||{};let parts=rich(el);if(!parts.length)return;
    if(o.bold)parts.forEach(p=>p.font=Object.assign({},p.font,{bold:true}));
    if(o.size)parts.forEach(p=>p.font=Object.assign({},p.font,{size:o.size}));
    if(o.prefix)parts.unshift({text:o.prefix,font:FONT});
    const a=o.a||1,b=o.b||NC;if(b>a)ws.mergeCells(r,a,r,b);const c=ws.getCell(r,a);c.value={richText:parts};
    c.alignment={horizontal:o.h||'left',vertical:'top',wrapText:true};
    const n=lines(plain(parts),spanW(a,b));const sz=o.size||10;ws.getRow(r).height=Math.max(ws.getRow(r).height||0,Math.max(15,n*(sz+4)+2));if(!o.keep)r++};
  const gap=(h)=>{ws.getRow(r).height=h||8;r++};
  /* ---- bảng ---- */
  const doTable=(t,gi)=>{const g=gi;const base=r;const CEN={horizontal:'center',vertical:'middle',wrapText:true};
    const extra=NC-g.nc;const rowH=Array(g.nr).fill(0);
    g.cells.forEach(c=>{const cs=c.cs+((c.c+c.cs===g.nc)?extra:0);const a=c.c+1,b=c.c+cs;const r1=base+c.r,r2=base+c.r+c.rs-1;
      if(b>a||r2>r1)ws.mergeCells(r1,a,r2,b);
      const td=c.td;const parts=rich(td);let text=plain(parts);const cls=td.className||'';
      const tot=c.tr.classList.contains('tot');const bold=c.th||tot;
      const cell=ws.getCell(r1,a);
      const num=/\br\b/.test(cls)&&/^-?\d{1,3}(\.\d{3})*$/.test(text.trim())?+text.trim().replace(/\./g,''):null;
      if(num!=null){cell.value=num;cell.numFmt='#,##0;-#,##0;"-"';cell.font=Object.assign({},FONT,{bold})}
      else if(parts.length){cell.value={richText:parts.map(p=>bold?Object.assign({},p,{font:Object.assign({},p.font,{bold:true})}):p)}}
      cell.alignment=c.th?CEN:(/\bc\b/.test(cls)?CEN:/\br\b/.test(cls)?{horizontal:'right',vertical:'middle',wrapText:true}:{horizontal:'left',vertical:'middle',wrapText:true});
      if(c.th)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFEEF1F4'}};else if(tot)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF5F7F9'}};
      for(let y=r1;y<=r2;y++)for(let x=a;x<=b;x++){ws.getCell(y,x).border=BD;if(c.th)ws.getCell(y,x).fill=cell.fill}
      const need=Math.max(16,lines(text,spanW(a,b))*13+6);if(c.rs===1)rowH[c.r]=Math.max(rowH[c.r],need);else rowH[c.r]=Math.max(rowH[c.r],16)});
    g.cells.forEach(c=>{if(c.rs>1){const need=Math.max(16,lines(tx(c.td),spanW(c.c+1,c.c+c.cs))*13+6);const per=Math.ceil(need/c.rs);for(let k=0;k<c.rs;k++)rowH[c.r+k]=Math.max(rowH[c.r+k],per)}});
    rowH.forEach((h,i)=>{ws.getRow(base+i).height=Math.max(18,h)});
    r=base+g.nr;gap(8)};
  /* ---- ảnh ---- */
  const dim=src=>new Promise(res=>{const im=new Image();im.onload=()=>res([im.naturalWidth||600,im.naturalHeight||300]);im.onerror=()=>res([600,300]);im.src=src});
  const doImg=async el=>{const src=el.getAttribute('src')||'';const m=/^data:image\/(png|jpe?g|gif);base64,/i.exec(src);if(!m)return;
    const [w0,h0]=await dim(src);const maxW=Math.min(TW*7,760);const k=Math.min(1,maxW/w0,520/h0);const w=Math.round(w0*k),h=Math.round(h0*k);
    const id=wb.addImage({base64:src,extension:/jp/i.test(m[1])?'jpeg':m[1].toLowerCase()});ws.addImage(id,{tl:{col:0.1,row:r-1+0.1},ext:{width:w,height:h}});r+=Math.ceil(h/20)+1};
  /* ---- duyệt cây ---- */
  let ti=0;
  const walk=async el=>{for(const k of [...el.children]){
    const tg=k.tagName,cl=k.classList;
    if(tg==='TABLE'){const gi=tables[ti++];doTable(k,gi);continue}
    if(tg==='IMG'){await doImg(k);continue}
    if(tg==='H1'){textRow(k,{h:'center',bold:true,size:15});gap(6);continue}
    if(cl.contains('qh2')){textRow(k,{h:'center',size:11});continue}
    if(cl.contains('sub')){textRow(k,{h:'center'});gap(8);continue}
    if(cl.contains('sig')){const ds=[...k.children];const half=Math.floor(NC/2);const r0=r;
      ds.forEach((dv,i)=>{if(!tx(dv))return;textRow(dv,{a:i===0?1:half+1,b:i===0?half:NC,h:'center',keep:1})});
      ws.getRow(r0).height=Math.max(ws.getRow(r0).height||0,110);r=r0+1;gap(8);continue}
    if(cl.contains('kv2')){const ds=[...k.children];const lw=Math.min(3,NC-1);
      for(let i=0;i<ds.length;i+=2){const r0=r;textRow(ds[i],{a:1,b:lw,keep:1});if(ds[i+1])textRow(ds[i+1],{a:lw+1,b:NC,keep:1});r=r0+1}
      gap(6);continue}
    if(cl.contains('qtot')){const ds=[...k.children];const lw=Math.max(2,Math.floor(NC/2));
      const r0=r;textRow(ds[0],{a:Math.max(1,NC-lw-2),b:NC-2,h:'right',keep:1});if(ds[1])textRow(ds[1],{a:NC-1,b:NC,h:'right',keep:1});r=r0+1;gap(8);continue}
    if(tg==='UL'||tg==='OL'){[...k.children].forEach((li,i)=>{textRow(li,{prefix:tg==='UL'?'•  ':(i+1)+'. '})});gap(6);continue}
    if(cl.contains('sec')){gap(4);textRow(k,{bold:true});continue}
    if(cl.contains('lh')){textRow(k);gap(8);continue}
    if(cl.contains('ck')){textRow(k);continue}
    if(tg==='DIV'&&[...k.children].some(c=>BLK.has(c.tagName)||c.tagName==='IMG')){await walk(k);continue}
    if(tg==='P'||tg==='DIV'||tg==='LI'||tg==='H2'||tg==='H3'){
      if(tg==='H2'||tg==='H3')textRow(k,{bold:true,size:12});else textRow(k);
      if(tg==='P')gap(4);
      continue}
    }};
  await walk(root);
  const buf=await wb.xlsx.writeBuffer();return new Uint8Array(buf);
}
async function exportXlsx(sheets,filename){
  if(!window.XLSX){toast('Không tải được thư viện Excel. Kiểm tra mạng rồi tải lại trang.');return}
  if(!DL){toast('Trình xem này không hỗ trợ tải file. Mở trang trong claude.ai để xuất Excel.');return}
  try{
    const wb=XLSX.utils.book_new();
    sheets.forEach(sh=>{
      const ws=XLSX.utils.aoa_to_sheet(sh.rows);
      const w=[];sh.rows.forEach(r=>r.forEach((v,i)=>{const n=String(v==null?'':v).length;w[i]=Math.max(w[i]||8,Math.min(n+2,44))}));
      ws['!cols']=w.map(x=>({wch:x}));
      const ref=XLSX.utils.decode_range(ws['!ref']||'A1');
      for(let R=ref.s.r+(sh.fromRow||1);R<=ref.e.r;R++)for(let C=ref.s.c;C<=ref.e.c;C++){const c=ws[XLSX.utils.encode_cell({r:R,c:C})];if(c&&c.t==='n'&&!(sh.plain||[]).includes(C))c.z='#,##0'}
      XLSX.utils.book_append_sheet(wb,ws,sh.name.slice(0,31));
    });
    const out=XLSX.write(wb,{bookType:'xlsx',type:'array'});
    const r=await DL.save({filename,data:new Uint8Array(out)});
    if(r&&r.status==='saved')toast('Đã lưu file '+filename);
  }catch(e){
    if(e&&e.code==='declined')return;
    toast(e&&e.code==='rate_limited'?'Đang có hộp thoại lưu file khác, thử lại sau giây lát.':'Không xuất được file Excel.');
  }
}
async function saveHtmlFile(filename,html){
  if(!DL){toast('Trình xem này không hỗ trợ tải file. Mở trang trong claude.ai để tải bản in.');return}
  try{const r=await DL.save({filename,data:html});if(r&&r.status==='saved')toast('Đã lưu file '+filename)}catch(e){if(!e||e.code!=='declined')toast('Không tải được file.')}
}
function printDocHtml(html){
  const bar='<style>@page{size:'+(/class="paper land"/.test(html)?'A4 landscape':'A4')+';margin:12mm 10mm}.pbar{position:fixed;top:10px;right:14px;z-index:9;font:14px Arial,sans-serif}.pbar button{padding:9px 18px;border:0;border-radius:8px;background:#0E7490;color:#fff;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.2)}@media print{.pbar{display:none}}</style>';
  const tail='<div class="pbar"><button onclick="window.print()">In / Lưu PDF (Ctrl+P)</button></div><script>window.addEventListener("load",function(){setTimeout(function(){try{window.print()}catch(e){}},400)})<\/script>';
  const page=html.replace('</head>',bar+'</head>').replace('</body>',tail+'</body>');
  let w=null;try{w=window.open('','_blank')}catch(e){}
  if(w&&w.document){w.document.open();w.document.write(page);w.document.close();return}
  toast('Trình xem chặn mở tab mới, đã lưu bản HTML — mở file đó rồi bấm In.');
  saveHtmlFile('BanIn_'+stamp()+'.html',page);
}
async function renderPdfBlob(html){
  const land=/class="paper land"/.test(html);const W=land?1123:794,PH=land?794:1123,MT=30,MB=34,SC=2,PWpt=land?841.89:595.28,PHpt=land?595.28:841.89;
  const fr=document.createElement('iframe');fr.setAttribute('aria-hidden','true');
  fr.style.cssText='position:fixed;left:0;top:0;width:'+W+'px;height:'+PH+'px;border:0;opacity:0;pointer-events:none;z-index:-1';
  document.body.appendChild(fr);
  try{
    await new Promise(res=>{fr.onload=res;fr.srcdoc=html});
    const d=fr.contentDocument;
    const fix=d.createElement('style');fix.textContent='.paper{max-width:none!important;margin:0!important;padding:0 44px!important;width:'+W+'px;box-sizing:border-box}tr,.ck,.sig{break-inside:avoid}';d.head.appendChild(fix);
    await new Promise(r=>setTimeout(r,80));
    const paper=d.querySelector('.paper')||d.body;
    const top0=paper.getBoundingClientRect().top;
    const H=Math.ceil(paper.getBoundingClientRect().height)+36;
    const bs=getComputedStyle?d.defaultView.getComputedStyle(d.body):null;
    const cuts=[];
    paper.querySelectorAll('tr,.ck,.sig,.sec,p,h1,li,.qtot,.lh,.kv2,.qh2,.sub').forEach(e=>{const r=e.getBoundingClientRect();cuts.push({t:r.top-top0,b:r.bottom-top0})});
    const usable=PH-MT-MB;const pages=[];let start=0;
    while(start<H-1){
      const lim=start+usable;let end;
      if(lim>=H)end=H;
      else{
        let best=0;cuts.forEach(c=>{if(c.b<=lim+0.5&&c.b>start+160&&c.b>best)best=c.b});
        // không cắt ngang một khối đang vắt qua điểm cắt
        end=best||lim;
      }
      pages.push([start,Math.ceil(end)]);start=Math.ceil(end);
    }
    const css=[...d.querySelectorAll('style')].map(s=>s.textContent).join('\n').replace(/(^|[},\s])body\s*\{/g,'$1.pdfroot{').replace(/&/g,'&amp;').replace(/</g,'&lt;');
    const xml=new XMLSerializer().serializeToString(paper.cloneNode(true));
    const rootStyle='width:'+W+'px;background:#fff;color:'+bs.color+';font-family:'+bs.fontFamily.replace(/"/g,"'")+';font-size:'+bs.fontSize+';line-height:'+(parseFloat(bs.lineHeight)/parseFloat(bs.fontSize)||1.55).toFixed(4);
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'"><foreignObject x="0" y="0" width="'+W+'" height="'+H+'"><div xmlns="http://www.w3.org/1999/xhtml" class="pdfroot" style="'+rootStyle+'"><style>'+css+'</style>'+xml+'</div></foreignObject></svg>';
    const img=new Image();
    await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(new Error('svg'));img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
    const out=[];
    for(let i=0;i<pages.length;i++){
      const [a,b]=pages[i];const cv=document.createElement('canvas');cv.width=W*SC;cv.height=PH*SC;
      const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);
      x.imageSmoothingQuality='high';
      x.drawImage(img,0,a,W,b-a,0,MT*SC,W*SC,(b-a)*SC);
      if(pages.length>1){x.fillStyle='#8A949E';x.font=(10*SC)+'px Arial,sans-serif';x.textAlign='right';x.fillText((i+1)+' / '+pages.length,(W-44)*SC,(PH-18)*SC)}
      const blob=await new Promise(res=>cv.toBlob(res,'image/jpeg',0.93));
      if(!blob)throw new Error('jpeg');
      out.push({w:cv.width,h:cv.height,bytes:new Uint8Array(await blob.arrayBuffer())});
    }
    return makePdf(out,PWpt,PHpt);
  }finally{fr.remove()}
}
function makePdf(pages,PW,PH){
  const enc=new TextEncoder(),chunks=[],offs=[];let len=0;
  const push=b=>{if(typeof b==='string')b=enc.encode(b);chunks.push(b);len+=b.length};
  const n=pages.length;
  push('%PDF-1.4\n');
  offs[1]=len;push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offs[2]=len;push('2 0 obj\n<< /Type /Pages /Count '+n+' /Kids ['+pages.map((_,i)=>(3+i*3)+' 0 R').join(' ')+'] >>\nendobj\n');
  pages.forEach((p,i)=>{
    const pid=3+i*3,cid=pid+1,iid=pid+2;
    offs[pid]=len;push(pid+' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+PW+' '+PH+'] /Resources << /XObject << /Im0 '+iid+' 0 R >> >> /Contents '+cid+' 0 R >>\nendobj\n');
    const cs='q '+PW+' 0 0 '+PH+' 0 0 cm /Im0 Do Q';
    offs[cid]=len;push(cid+' 0 obj\n<< /Length '+cs.length+' >>\nstream\n'+cs+'\nendstream\nendobj\n');
    offs[iid]=len;push(iid+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+p.w+' /Height '+p.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.bytes.length+' >>\nstream\n');
    push(p.bytes);push('\nendstream\nendobj\n');
  });
  const xr=len,total=3+n*3;
  let x='xref\n0 '+total+'\n0000000000 65535 f \n';
  for(let i=1;i<total;i++)x+=String(offs[i]).padStart(10,'0')+' 00000 n \n';
  push(x+'trailer\n<< /Size '+total+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF\n');
  return new Blob(chunks,{type:'application/pdf'});
}
async function savePdfFile(filename,html){
  if(!DL){toast('Trình xem này không hỗ trợ tải file. Mở trang trong claude.ai để tải bản PDF.');return}
  toast('Đang tạo bản PDF…');
  let blob;
  try{blob=await renderPdfBlob(html)}
  catch(e){
    toast('Không tạo được PDF trên trình duyệt này, lưu bản HTML thay thế.');
    return saveHtmlFile(filename.replace(/\.pdf$/i,'.html'),html);
  }
  try{const r=await DL.save({filename,data:blob});if(r&&r.status==='saved')toast('Đã lưu file '+filename)}
  catch(e){if(!e||e.code!=='declined')toast('Không lưu được file PDF.')}
}
const stamp=()=>TODAY.replace(/-/g,'');
function doExport(kind){
  const base='RentalOps_';
  if(kind==='orders')return exportXlsx([{name:'Đơn hàng',rows:rowsLines(LAST.orders||ORD),plain:[3,10]}],base+'DonHang_'+stamp()+'.xlsx');
  if(kind.indexOf('order:')===0){const o=ORD.find(x=>x.code===kind.slice(6));return exportXlsx([{name:'Đơn '+o.code,rows:rowsLines([o]),plain:[3,10]}],base+'Don_'+safeId(o.code)+'.xlsx')}
  if(kind==='customers')return exportXlsx([{name:'Khách hàng',rows:rowsCustomers((LAST.customers?LAST.customers.map(x=>x.c):CUS)),plain:[2]}],base+'KhachHang_'+stamp()+'.xlsx');
  if(kind==='invoices')return exportXlsx([{name:'Hóa đơn',rows:rowsInvoices(LAST.invoices||Object.values(INVS)),plain:[0,2]}],base+'HoaDon_'+stamp()+'.xlsx');
  if(kind==='devices')return exportXlsx([{name:'Thiết bị',rows:rowsDevices(LAST.devices||devList()),plain:[1]}],base+'ThietBi_'+stamp()+'.xlsx');
  if(kind==='quotes')return exportXlsx([{name:'Báo giá',rows:rowsQuotes(LAST.quotes||allQuotes())}],base+'BaoGia_'+stamp()+'.xlsx');
  if(kind==='handovers')return exportXlsx([{name:'Biên bản',rows:rowsHandovers(LAST.handovers||allHandovers())}],base+'BienBan_'+stamp()+'.xlsx');
  if(kind==='statements')return exportXlsx([{name:'Bảng kê',rows:rowsStatements(LAST.statements||allStatements())}],base+'BangKe_'+stamp()+'.xlsx');
  if(kind==='payreqs')return exportXlsx([{name:'Đề nghị TT',rows:rowsPayreqs(LAST.payreqs||allPayreqs())}],base+'DeNghiThanhToan_'+stamp()+'.xlsx');
  if(kind.indexOf('prices:')===0){const p=kind.slice(7);return exportXlsx([{name:'Giá '+plName(p),rows:rowsPrices(prices(p))}],base+'BangGia_'+plName(p)+'_'+stamp()+'.xlsx')}
  if(kind==='comm'){const L=commRows();const H=['Tháng/ 月','Tên Khách Hàng\n（名前）','Số Đt\n（お客様TEL)','Địa chỉ\n（お客様住所）','Tên công ty\n(会社名)','Nơi đến\n(渡航先)','Số Lượng\n（台数）','Từ ngày \n使用日から','Đến ngày \n使用日まで','Số ngày\n（日数）','Đơn giá\n（単価）','Tổng tiền thuê máy\n(Không tính phí bảo hiểm, phí ship và VAT) ','Trừ trực tiếp cho khách \nお客さんに直接の割引率','Thành tiền giảm giá \n（割引金額）','% hoa hồng thực nhận\n(代理店割引率)','Hoa hồng thực nhận \n代理店のコミッション','IMEI\nIMEI番号','Mã máy (For reference) ','Số hóa đơn','Ngày hóa đơn','Ngày nhận tiền','Tình trạng thanh toán\n支払いの状況','Đã chi hoa hồng'];
    const R=L.map(({o,l,i,k})=>{const c=CB[o.cus]||{},iv=l.inv&&INVS[l.inv],d=l.dev&&l.dev!=='eSim'?l.dev:'eSIM',dv=DEVS[l.dev]||{};return [String(o.date||'').slice(0,7).split('-').reverse().join('.'),l.user||o.user||c.name||'',c.phone||'',c.addr||'',c.en||c.legal||'',CTRY[l.c]||l.c||'',l.qty||1,fmtD(l.s),fmtD(l.e),k.used,l.price||0,k.base,k.dp+'%',k.disc,k.q+'%',k.net,dv.imei||'',d,l.inv||'',iv&&iv.date?fmtD(iv.date):'',iv&&iv.recv?fmtD(iv.recv):'',iv&&iv.recv?'Đã thanh toán':iv?'Chưa thanh toán':'Chưa xuất hóa đơn',commOf(o).paid?'Đã chi'+(commOf(o).paidDate?' '+fmtD(commOf(o).paidDate):''):'Chưa chi']});
    const tot=['Tổng cộng','','','','','','','','','','',L.reduce((a,r)=>a+r.k.base,0),'',L.reduce((a,r)=>a+r.k.disc,0),'',L.reduce((a,r)=>a+r.k.net,0),'','','','','','',''];
    return exportXlsx([{name:'Hoa hồng Nam San',rows:[H].concat(R,[tot])}],'RentalOps_HoaHongNamSan_'+stamp()+'.xlsx')}
  if(kind==='prices')return exportXlsx([{name:'Bảng giá',rows:rowsPrices(prices())}],base+'BangGia_'+stamp()+'.xlsx');
  if(kind==='all')return exportReport({lines:true,customers:true,invoices:true,devices:true},true);
}
function exportReport(sel,ignoreRange){
  const R=S.rep;sel=sel||R.sheets;
  const inR=d=>ignoreRange||inRange(d);
  const sh=[];
  if(sel.lines)sh.push({name:'Đơn hàng',rows:rowsLines(ORD.filter(o=>inR(o.date))),plain:[3,10]});
  if(sel.customers)sh.push({name:'Khách hàng và công nợ',rows:rowsCustomers(CUS),plain:[2]});
  if(sel.invoices)sh.push({name:'Hóa đơn',rows:rowsInvoices(Object.values(INVS).filter(i=>inR(i.date))),plain:[0,2]});
  if(sel.devices)sh.push({name:'Thiết bị',rows:rowsDevices(devList()),plain:[1]});
  if(sel.quotes)sh.push({name:'Báo giá',rows:rowsQuotes(allQuotes())});
  if(sel.handovers)sh.push({name:'Biên bản bàn giao',rows:rowsHandovers(allHandovers())});
  if(sel.payreqs)sh.push({name:'Đề nghị thanh toán',rows:rowsPayreqs(allPayreqs())});
  if(sel.prices)sh.push({name:'Bảng giá',rows:rowsPrices(prices())});
  if(!sh.length){toast('Chọn ít nhất một trang tính để xuất.');return}
  return exportXlsx(sh,'RentalOps_BaoCao_'+stamp()+'.xlsx');
}

/* ============ THÔNG TIN CÔNG TY ============ */
VIEWS.settings=function(){
  const s=SET();
  const staff=S.staffDraft||(s.staff||[]);
  const inp=(id,l,v,w,m)=>`<label class="f ${w||''}"><span>${l}</span><input id="s_${id}"${m?' data-money inputmode="numeric" autocomplete="off"':''} value="${esc(m?vnd(v):v)}"></label>`;
  const st=(i,k,l,v,t)=>t==='date'?`<label class="f"><span>${l}</span>${dateIn('id="st_'+i+'_'+k+'"',v)}</label>`:`<label class="f"><span>${l}</span><input id="st_${i}_${k}" type="${t||'text'}" value="${esc(v||'')}"></label>`;
  return head('Thông tin công ty','Dùng làm phần đầu và phần ký của báo giá, biên bản bàn giao, đề nghị thanh toán.')+
  (s.name?'':`<div class="note">Chưa nhập tên công ty. Chứng từ đang để chỗ trống ở phần đầu trang.</div>`)+
  `<div class="panel"><h2>Công ty</h2><div class="pb"><div class="fg">${inp('name','Tên công ty',s.name,'w2')}${inp('mst','Mã số thuế',s.mst)}${inp('addr','Địa chỉ',s.addr,'w2')}${inp('phone','Số điện thoại',s.phone)}${inp('email','Email',s.email)}${inp('signer','Họ và tên',s.signer)}${inp('title','Chức danh',s.title)}</div></div></div>
   <div class="panel"><h2>Nhân viên ký thay (theo giấy ủy quyền)</h2><div class="pb"><div class="muted" style="margin-bottom:10px">Khi giám đốc đi công tác, nhân viên được ủy quyền ký thay trên báo giá, biên bản bàn giao và đề nghị thanh toán. Số giấy ủy quyền được in trên chứng từ để đối chiếu khi lưu hồ sơ.</div>${staff.map((x,i)=>`<div class="ln"><div class="ln-h"><span>Nhân viên ${i+1}</span><button class="btn sm danger" data-act="delstaff" data-id="${i}">Xóa</button></div><div class="fg fgstaff">${st(i,'name','Họ và tên',x.name)}${st(i,'title','Chức vụ',x.title)}${st(i,'email','Email',x.email)}${st(i,'authNo','Giấy ủy quyền số',x.authNo)}${st(i,'authDate','Ngày ủy quyền',x.authDate,'date')}</div></div>`).join('')||'<div class="muted">Chưa có nhân viên nào.</div>'}<div class="btns" style="margin-top:8px"><button class="btn" data-act="addstaff">${ico('plus')}Thêm nhân viên</button></div></div></div>
   <div class="panel"><h2>Tài khoản nhận thanh toán: dịch vụ Wi-Fi</h2><div class="pb"><div class="fg">${inp('bankW','Ngân hàng',s.bankW,'w2')}${inp('accW','Số tài khoản',s.accW)}${inp('holderW','Chủ tài khoản',s.holderW,'w2')}${inp('branchW','Chi nhánh (nếu có)',s.branchW||'','w2')}</div></div></div>
   <div class="panel"><h2>Tài khoản nhận thanh toán: dịch vụ eSIM</h2><div class="pb"><div class="fg">${inp('bankE','Ngân hàng',s.bankE,'w2')}${inp('accE','Số tài khoản',s.accE)}${inp('holderE','Chủ tài khoản',s.holderE,'w2')}${inp('branchE','Chi nhánh (nếu có)',s.branchE||'','w2')}</div></div></div>
   <div class="panel"><h2>Điều kiện dịch vụ</h2><div class="pb"><div class="muted" style="margin-bottom:10px">Theo hợp đồng: dùng để tự tính bảo hiểm khi tạo đơn, phí mở máy khi kết toán và in trên điều khoản báo giá, biên bản bàn giao.</div><div class="fg">${[['insDay','Bảo hiểm theo ngày (đ/ngày/thiết bị)',1],['insMonth','Bảo hiểm theo tháng (đ/tháng/thiết bị)',1],['actFee','Phí mở máy (đ/thiết bị)',1],['minPct','Ngưỡng sử dụng tối thiểu (% thời gian đăng ký)',0],['minMb','Dữ liệu tối thiểu tính là ngày sử dụng (MB)',0],['lossIns','Bồi thường khi có bảo hiểm (đ/thiết bị)',1],['lossNoIns','Bồi thường khi không có bảo hiểm (đ/thiết bị)',1],['accSet','Bồi thường bộ phụ kiện (đ/bộ)',1]].map(x=>inp(x[0],x[1],s[x[0]],'',x[2])).join('')}</div></div></div>
   <div class="panel"><h2>Mặc định</h2><div class="pb"><div class="fg"><label class="f"><span>Hạn thanh toán mặc định (ngày)</span><input id="s_terms" type="number" value="${esc(s.terms)}"></label></div>
    <label class="f" style="margin-top:10px"><span>Điều khoản in trên báo giá (điều khoản mẫu, chỉnh lại cho đúng chính sách của bạn)</span><textarea id="s_quoteTerms" rows="12">${esc(s.quoteTerms)}</textarea></label><div class="btns" style="margin-top:8px"><button class="btn sm" data-act="resetterms">Tạo lại điều khoản theo điều kiện dịch vụ</button></div></div></div>
   <div class="btns"><button class="btn pri" data-act="savesettings">Lưu thông tin</button></div>`;
};

/* ============ CHỨNG TỪ: bản in ============ */
const PAPER_CSS=`body{margin:0;background:#fff;color:#141B22;font-family:'Be Vietnam Pro','Segoe UI',Roboto,Arial,sans-serif;font-size:13px;line-height:1.55}
.paper{max-width:800px;margin:0 auto;padding:36px 40px}.lh{font-size:12px;border-bottom:1px solid #9AA5AF;padding-bottom:8px;margin-bottom:14px}.lh b{font-size:14px}
h1{font-size:19px;text-align:center;margin:10px 0 2px;letter-spacing:.02em}.sub{text-align:center;margin-bottom:14px;font-size:12.5px}
table{width:100%;border-collapse:collapse;margin:10px 0}th,td{border:1px solid #9AA5AF;padding:5px 8px;font-size:12.5px;vertical-align:top}th{background:#EEF1F4;text-align:center}
td.r{text-align:right;white-space:nowrap}td.c{text-align:center}.sig{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:22px;text-align:center}.sig div{min-height:110px}.tot td{font-weight:700}p{margin:6px 0}ol,ul{margin:6px 0;padding-left:20px}
.en{color:#5E6872;font-style:italic}.qh2{text-align:center;font-size:14px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#5E6872;font-style:normal;margin:2px 0 10px}.qh2::after{content:'';display:block;width:64px;height:2px;background:#1F2A33;margin:10px auto 0;opacity:.5}h1{font-weight:800}.lbl{display:inline-block;min-width:90px}
table.qt th,table.qt td{border:0;padding:7px 6px;vertical-align:middle}.tl{display:block;line-height:1;color:#5E6872}th,td{vertical-align:middle}table.qt thead th{border-top:1px solid #222;border-bottom:1px solid #222;background:#fff;font-weight:700}table.qt tbody tr:last-child td{border-bottom:1px solid #222}table.qt th .en{font-weight:400;display:block}
.qtot{display:flex;justify-content:flex-end;gap:36px;margin:8px 0 14px;text-align:right}.qtot b{font-size:14px}
.sec{font-weight:700;margin:14px 0 4px}.ck{margin:3px 0}.ck .en{display:block;margin-left:14px}.kv2{display:grid;grid-template-columns:160px 1fr;gap:2px 10px;margin:4px 0 4px 20px}.kv2 .en{display:block}
.paper.land{max-width:none;padding:24px 28px}
table.stt{width:100%;border-collapse:collapse;font-size:10.5px;margin:8px 0}table.stt th,table.stt td{border:1px solid #9AA5AF;padding:4px 5px;vertical-align:middle;font-size:10.5px}table.stt th{background:#EEF1F4;text-align:center}table.stt tr.tot td{font-weight:700;background:#F5F7F9}table.stt tr.dim td{color:#98A2AB}
.stsig{margin:14px 0 6px auto;width:380px;text-align:left;line-height:1.6}.stuh{margin-top:22px}.stu{margin:10px 0}.stu table.stt{width:72%}
@media print{.paper{padding:0}}`;
const htmlDoc=(title,inner)=>`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${PAPER_CSS}</style></head><body>${inner.replace('class="paper"','class="paper"')}</body></html>`;
function letterhead(){const s=SET();return `<div class="lh"><b>${esc(s.name||'[Tên công ty của bạn]')}</b><br>${esc(s.addr||'[Địa chỉ công ty]')}<br>${BL('MST','Tax code')}: ${esc(s.mst||'—')}${s.phone?' · '+BL('ĐT','Tel')+': '+esc(s.phone):''}${s.email?' · '+esc(s.email):''}</div>`}
function sigBlockHtml(doc){const s=SET();const g=doc&&doc.sg?doc.sg:signSnap('');return `<div class="sig"><div></div><div><b>ĐẠI DIỆN ${esc((s.name||'CÔNG TY').toUpperCase())}</b><br><span class="en">AUTHORIZED REPRESENTATIVE</span><br><i>(Ký, ghi rõ họ tên)</i><br><span class="en">(Signature and full name)</span><br><br><br>${esc(g.name||'')}<br>${esc(g.name?g.title:'')}${g.dir?'':`<br><i>(Theo Giấy ủy quyền số ${esc(g.authNo||'……')}${g.authDate?' ngày '+fmtD(g.authDate):''})</i><br><span class="en">(Per Power of Attorney No. ${esc(g.authNo||'……')}${g.authDate?' dated '+fmtD(g.authDate):''})</span>`}</div></div>`}
function acctsFor(r){
  const s=SET(),k={};
  (r.items||[]).forEach(x=>{const ls=x.type==='invoice'?((INVS[x.ref]||{}).lines||[]):((ORD.find(o=>o.code===x.ref)||{}).lines||[]);ls.forEach(l=>{k[l.prod==='eSIM'?'E':'W']=1})});
  if(!Object.keys(k).length)k.W=1;
  const both=k.W&&k.E;const out=[];
  ['W','E'].filter(x=>k[x]).forEach(x=>out.push({label:both?(x==='E'?'eSIM':'Wi-Fi'):'',bank:s['bank'+x],acc:s['acc'+x],holder:s['holder'+x]||s.name}));
  if(both&&out[0].acc===out[1].acc&&out[0].bank===out[1].bank){out.pop();out[0].label=''}
  return out;
}
function acctHtml(r){return acctsFor(r).map(a=>`<p><b>${BL('Thông tin chuyển khoản','Bank transfer details')}${a.label?' ('+BL('dịch vụ','service')+' '+a.label+')':''}:</b><br>${BL('Ngân hàng','Bank')}: ${esc(a.bank||'………………')}<br>${BL('Số tài khoản','Account No.')}: ${esc(a.acc||'………………')}<br>${BL('Chủ tài khoản','Account holder')}: ${esc(a.holder||'………………')}</p>`).join('')+`<p><b>${BL('Nội dung chuyển khoản','Transfer description')}:</b> ${BL('Thanh toán','Payment')} ${esc(r.no)}</p>`}
function signBlock(l1,l2,n1,n2,x1,x2){const E={'BÊN GIAO':'DELIVERING PARTY','BÊN NHẬN':'RECEIVING PARTY'};const lb=l=>`<b>${l}</b>${E[l]?'<br><span class="en">'+E[l]+'</span>':''}<br><i>(Ký, ghi rõ họ tên)</i><br><span class="en">(Signature and full name)</span>`;return `<div class="sig"><div>${lb(l1)}<br><br><br>${esc(n1||'')}${x1?'<br>'+x1:''}</div><div>${lb(l2)}<br><br><br>${esc(n2||'')}${x2?'<br>'+x2:''}</div></div>`}
const termLines=t=>String(t||'').split('\n').map(x=>x.replace(/^\s*\d+[.)]\s*/,'').trim()).filter(Boolean);
const durLbl=l=>l.unit==='Ngày'?(l.days||1)+' ngày':l.unit==='Tháng'?(l.days||1)+' tháng':'—';

const CTRY_EN={"JP":"Japan","CN":"China","VN":"Vietnam","ID":"Indonesia","KH":"Cambodia","TW":"Taiwan","TH":"Thailand","KR":"South Korea","SG":"Singapore","MY":"Malaysia","US":"United States","EU":"Europe","AU":"Australia","AE":"UAE (United Arab Emirates)","AG":"Antigua and Barbuda","AI":"Anguilla","AL":"Albania","AO":"Angola","AR":"Argentina","AT":"Austria","AW":"Aruba","AX":"Aland Islands","BA":"Bosnia and Herzegovina","BD":"Bangladesh","BE":"Belgium","BG":"Bulgaria","BH":"Bahrain","BN":"Brunei","BO":"Bolivia","BR":"Brazil","CA":"Canada","CH":"Switzerland","CL":"Chile","CNX":"China (without VPN)","CO":"Colombia","CR":"Costa Rica","CW":"Curacao","CY":"Cyprus","CZ":"Czech Republic","DE":"Germany","DK":"Denmark","DO":"Dominican Republic","DZ":"Algeria","EC":"Ecuador","EE":"Estonia","EG":"Egypt","EH":"Western Sahara","ES":"Spain","FI":"Finland","FJ":"Fiji","FR":"France","GB":"United Kingdom","GD":"Grenada","GG":"Guernsey","GH":"Ghana","GI":"Gibraltar","GP":"Guadeloupe","GR":"Greece","GT":"Guatemala","GU":"Guam","GY":"Guyana","HK":"Hong Kong","HR":"Croatia","HT":"Haiti","HU":"Hungary","IE":"Ireland","IL":"Israel","IM":"Isle of Man","IN":"India","IS":"Iceland","IT":"Italy","JE":"Jersey","JM":"Jamaica","JO":"Jordan","KE":"Kenya","KW":"Kuwait","KY":"Cayman Islands","KZ":"Kazakhstan","LA":"Laos","LI":"Liechtenstein","LK":"Sri Lanka","LT":"Lithuania","LU":"Luxembourg","LV":"Latvia","MA":"Morocco","MC":"Monaco","ME":"Montenegro","MF":"Saint Martin","MG":"Madagascar","MK":"North Macedonia","MM":"Myanmar","MN":"Mongolia","MO":"Macao","MP":"Saipan (Northern Mariana Islands)","MQ":"Martinique","MT":"Malta","MU":"Mauritius","MX":"Mexico","NG":"Nigeria","NI":"Nicaragua","NL":"Netherlands","NO":"Norway","NP":"Nepal","NZ":"New Zealand","OM":"Oman","PA":"Panama","PE":"Peru","PH":"Philippines","PK":"Pakistan","PL":"Poland","PR":"Puerto Rico","PT":"Portugal","QA":"Qatar","RO":"Romania","RS":"Serbia","RU":"Russia","SA":"Saudi Arabia","SE":"Sweden","SI":"Slovenia","SK":"Slovakia","SM":"San Marino","SR":"Suriname","SV":"El Salvador","TC":"Turks and Caicos Islands","TJ":"Tajikistan","TN":"Tunisia","TR":"Turkey","TT":"Trinidad and Tobago","TZ":"Tanzania","UA":"Ukraine","UY":"Uruguay","VA":"Vatican City","VC":"Saint Vincent and the Grenadines","VE":"Venezuela","VG":"British Virgin Islands","ZA":"South Africa","ZM":"Zambia","CNM":"Mainland China","CNHK":"China + Hong Kong + Macao","HKMO":"Hong Kong + Macao","TSM":"3 countries TH - SG - MY (by package)","TSM3":"3-country Pass TH - SG - MY","ASEAN5":"ASEAN 5 (TH, SG, MY, ID, VN)","ASEAN6":"ASEAN 6 Pass (TH, SG, MY, ID, VN, PH)","ASIA13":"Asia 13 countries (JP, KR, VN, HK, MO, TW, MY, SG, TH, ID, KH, AU, NZ)","EUTR":"Europe + Turkey","AUNZ":"Australia and New Zealand"};
const qCtry=l=>{if(l.multi&&l.mc&&l.mc.length)return `${esc(l.mc.map(k=>CTRY[k]||k).join(' + '))}<br><span class="en">${esc(l.mc.map(k=>CTRY_EN[k]||CTRY[k]||k).join(' + '))}</span>`;if(l.multi&&l.ctext)return esc(l.ctext);const v=CTRY[l.c]||'';return v?`${esc(v)}<br><span class="en">${esc(CTRY_EN[l.c]||v)}</span>`:'—'};
const qPkg=l=>{const p=String(l.pkg||l.desc||'');if(!p)return '—';const speed=l.prod!=='eSIM'&&/\d\s*(GB|MB)/i.test(p);const vi=p.replace(/\/day/ig,'/ngày');return speed?`Tốc độ cao ${esc(vi)}<br><span class="en">High speed ${esc(p)}</span>`:`${esc(vi)}<br><span class="en">${esc(p)}</span>`};
const bi2=(vi,en)=>`${vi}<span class="en" style="display:block;font-weight:400">${en}</span>`;
const BL=(vi,en)=>`${vi}/<span class="en">${en}</span>`;
const BR=(vi,en)=>`${vi}<br><span class="en">${en}</span>`;
function qAccts(kind){const s=SET();const o=[];const k=[kind==='esim'?'E':'W'];/* Wi-Fi: TK Wi-Fi; eSIM: TK eSIM; cả hai: TK Wi-Fi */
  k.forEach(x=>o.push({label:'',bank:s['bank'+x],acc:s['acc'+x],holder:s['holder'+x]||s.name,branch:s['branch'+x]||''}));
  if(o.length===2&&o[0].acc===o[1].acc&&o[0].bank===o[1].bank&&o[0].branch===o[1].branch){o.pop();o[0].label=''}
  return o}
function docQuote(q){
  const c=CB[q.cus]||{legal:'',mst:'',contact:'',addr:''};const s=SET();const t=qTot(q);const vr=t.vr;const R=RUL();
  const kind=qKind(q);const lw=q.lines.filter(l=>l.prod!=='eSIM'),le=q.lines.filter(l=>l.prod==='eSIM');
  const T={wifi:['BÁO GIÁ THUÊ WIFI','WIFI RENTAL QUOTATION'],esim:['BÁO GIÁ ESIM','ESIM QUOTATION'],both:['BÁO GIÁ WIFI VÀ ESIM','WIFI AND ESIM QUOTATION']}[kind];
  const lnx=l=>{const x=qLine(l);const v=Math.round(x.ex*vr/100);return{x,v,tot:x.ex+v}};
  const anyFee=lw.some(l=>+l.fee>0);
  const per=l=>l.unit==='Tháng'?'—':(l.s&&l.e?`${fmtD(l.s)}<span class="tl">~</span>${fmtD(l.e)}`:'—');
  const dayLbl=l=>l.unit==='Tháng'?(l.days||1)+' tháng':(l.days||1);
  const wRows=lw.map((l,i)=>{const z=lnx(l);return `<tr><td class="c">${i+1}</td><td class="c">${qCtry(l)}</td><td class="c">${qPkg(l)}</td><td class="c">${l.qty||1}</td><td class="c">${per(l)}</td><td class="c">${dayLbl(l)}</td><td class="r">${vnd(l.price)}</td><td class="r">${+l.ins?vnd(l.ins):'-'}</td><td class="c">${+l.dpct?l.dpct+'%':'-'}</td>${anyFee?`<td class="r">${+l.fee?vnd(l.fee):'-'}</td>`:''}<td class="c">${vr}%</td><td class="r">${vnd(z.tot)}</td></tr>`}).join('');
  const wTbl=lw.length?`<table class="qt"><thead><tr><th>${bi2('STT','Ord.')}</th><th>${bi2('Quốc gia','Country')}</th><th>${bi2('Dung lượng','Package')}</th><th>${bi2('Số lượng','Quantity')}</th><th>${bi2('Thời gian sử dụng','Period')}</th><th>${bi2('Số ngày','Days')}</th><th>${bi2('Đơn giá/Ngày','Price/Days')}</th><th>${bi2('Bảo hiểm','Insurance')}</th><th>${bi2('Giảm giá','Discount')}</th>${anyFee?`<th>${bi2('Phí khác','Other fee')}</th>`:''}<th>${bi2('VAT','VAT')}</th><th>${bi2('Thành tiền','Amount')}</th></tr></thead><tbody>${wRows}</tbody></table>`:'';
  const eRows=le.map((l,i)=>{const z=lnx(l);return `<tr><td class="c">${i+1}</td><td class="c">${qCtry(l)}</td><td class="c">${qPkg(l)}</td><td class="c">${l.qty||1}</td><td class="c">${l.days||1}</td><td class="r">${vnd(l.price)}</td><td class="c">${vr}%</td><td class="r">${vnd(z.v)}</td><td class="r">${vnd(z.tot)}</td></tr>`}).join('');
  const eTbl=le.length?`<table class="qt"><thead><tr><th>${bi2('STT','Ord.')}</th><th>${bi2('Quốc gia','Country')}</th><th>${bi2('Dung lượng','Package')}</th><th>${bi2('Số lượng','Quantity')}</th><th>${bi2('Số ngày','Days')}</th><th>${bi2('Đơn giá','Price')}</th><th>${bi2('VAT','VAT')}</th><th>${bi2('Tiền thuế','Taxes')}</th><th>${bi2('Thành tiền','Amount')}</th></tr></thead><tbody>${eRows}</tbody></table>`:'';
  let n=0;const sec=(vi,en)=>`<div class="sec">${++n}. ${vi}<br><span class="en" style="font-weight:400">${en}</span></div>`;
  const tables=kind==='both'?`${sec('Bảng giá dịch vụ cho thuê thiết bị wifi:','Price list for rental of wifi equipment:')}${wTbl}${sec('Bảng giá dịch vụ eSIM:','Price list for eSIM service:')}${eTbl}`
    :kind==='esim'?`${sec('Bảng giá dịch vụ eSIM:','Price list for eSIM service:')}${eTbl}`
    :`${sec('Bảng giá dịch vụ cho thuê thiết bị wifi có khả năng truy cập internet không dây:','Price list for rental of wifi equipment with wireless internet access:')}${wTbl}`;
  const ck=(vi,en)=>`<div class="ck">✓ ${vi}<span class="en">${en}</span></div>`;
  const wNotes=[
   ['Thời gian thuê không tính ngày Giao và Trả thiết bị;','The rental period does not include the date of delivery and return of equipment;'],
   ['Phí giao nhận thiết bị phụ thuộc vào biểu phí của đơn vị vận chuyển;','Delivery fee is based on the fee of delivery companies;'],
   ['Trường hợp sử dụng thiết bị wifi tại nhiều quốc gia trong 1 ngày, phí sử dụng của ngày đó được tính theo quốc gia có phí mạng cao nhất.','In case of using wifi device in multiple countries in 1 day, the usage fee for that day is calculated according to the country with the highest data fee.'],
   [`Trường hợp Quý khách thực tế sử dụng dưới ${R.minPct}% thời gian đăng ký mới nhất trước ngày tính phí dịch vụ (làm tròn đến giá trị số nguyên gần nhất, không có chữ số thập phân), Maya sẽ tính thêm Phí Giữ Máy với chi phí ${vnd(R.actFee)} VNĐ (chưa bao gồm thuế).`,`In case the customer actually uses less than ${R.minPct}% of the registered rental period (rounded to the nearest whole number, without decimals), Maya will apply an additional Device Retention Fee of ${vnd(R.actFee)} VND (excluding tax).`],
   [`Trường hợp không sử dụng thiết bị, Maya sẽ tính Phí Giữ Máy cho 100% thời gian đăng ký, với chi phí ${vnd(R.actFee)} VNĐ (chưa bao gồm thuế) cho toàn bộ thời gian đăng ký.`,`If the device is not used at all, Maya will charge the Device Retention Fee for 100% of the registered rental period at ${vnd(R.actFee)} VND (excluding tax) for the entire duration.`],
   ['Trường hợp Quý khách giữ máy quá thời gian đăng ký, Maya sẽ tính thêm Phí Giữ Thiết Bị tương ứng với thời gian vượt quá, trừ các trường hợp bất khả kháng (như thời tiết xấu, thiên tai, hoặc các yếu tố khách quan ngoài ý muốn).','If the customer keeps the device beyond the registered rental period, an additional Retention Fee will be charged based on the extra time kept, except for force majeure circumstances such as bad weather, natural disasters, or other uncontrollable circumstances.']
  ];
  const eNotes=[
   ['Thiết bị phải hỗ trợ eSIM (vui lòng kiểm tra model điện thoại trước khi đặt);','The device must support eSIM (please check the phone model before booking);'],
   ['eSIM chỉ cung cấp dữ liệu (data), không hỗ trợ gọi điện hay nhắn tin truyền thống;','eSIM only provides data, does not support traditional calls or messaging;'],
   ['Sau khi cài đặt eSIM, thời gian sử dụng bắt đầu tính từ lần kết nối đầu tiên tại quốc gia đích;','After installing the eSIM, the usage time starts from the first connection in the destination country;'],
   ['eSIM không thể chuyển sang thiết bị khác sau khi đã cài đặt. Vui lòng không xóa eSIM khi chưa hết thời gian sử dụng;','The eSIM cannot be transferred to another device after it has been installed. Please do not delete the eSIM before the end of the usage period;'],
   ['Tốc độ mạng phụ thuộc vào nhà mạng địa phương và vị trí sử dụng;','Network speed depends on local carrier and location of use;'],
   ['eSIM đã kích hoạt sẽ không được hoàn tiền trong mọi trường hợp;','An activated eSIM will not be refunded under any circumstances;']
  ];
  const notes=kind==='both'?`<p><b>Lưu ý:</b> <span class="en">Note:</span></p><p><b>Dịch vụ thuê Wi-Fi</b> <span class="en">(Wi-Fi rental)</span></p>${wNotes.map(x=>ck(...x)).join('')}<p><b>Dịch vụ eSIM</b> <span class="en">(eSIM service)</span></p>${eNotes.map(x=>ck(...x)).join('')}`
    :`<p><b>Lưu ý:</b> <span class="en">Note:</span></p>${(kind==='esim'?eNotes:wNotes).map(x=>ck(...x)).join('')}`;
  const acc=qAccts(kind).map(a=>`${a.label?`<p><b>Dịch vụ ${a.label}</b></p>`:''}<div class="kv2"><div>Người thụ hưởng:<span class="en">Beneficiary name:</span></div><div>${esc((a.holder||s.name||'').toUpperCase())}</div><div>Số tài khoản:</div><div>${esc(a.acc||'………………')}</div><div>Ngân hàng:</div><div>${esc(a.bank||'………………')}</div>${a.branch?`<div>Chi nhánh:</div><div>${esc(a.branch)}</div>`:''}</div>`).join('');
  const pay=`${sec('Thanh toán:','Payment method:')}${acc}`;
  const comp=kind==='esim'?'':`${sec('Chi phí bồi thường thiết bị:','Compensation fee:')}<p>Trong trường hợp mất mát, hư hỏng do lỗi của Quý khách thì Quý khách sẽ chịu phí bồi thường là ${vnd(R.lossNoIns)} VNĐ/ thiết bị, ${vnd(R.accSet)} VNĐ/ bộ phụ kiện đi kèm.<br><span class="en">In case of loss or damage due to the customer's fault, the customer shall be responsible for compensation of ${vnd(R.lossNoIns)} VND/ device and ${vnd(R.accSet)} VND/ set of accessories.</span></p>`;
  const g=(q.sg&&q.sg.name)?q.sg:(q.signer?signSnap(q.signer):(q.sg||{}));
  return `<div class="paper"><div class="lh"><b>${esc(s.name||'[Tên công ty của bạn]')}</b><br>${esc(s.addr||'')}${s.mst?'<br>MST: '+esc(s.mst):''}${s.phone?' · ĐT: '+esc(s.phone):''}${s.email?' · '+esc(s.email):''}</div>
  <h1>${T[0]}</h1><div class="qh2 en">${T[1]}</div><div class="sub">Ngày/<span class="en">date</span>: ${fmtD(q.date)}</div><div style="text-align:right">Số/<span class="en">No.</span>: ${esc(q.no)}</div>
  <p><span class="lbl">Kính gửi/<span class="en">Bill to</span>:</span> <b>${esc((c.legal||c.name||'').toUpperCase())}</b><br><span class="lbl">MST/<span class="en">Tax code</span>:</span> ${esc(c.mst||'—')}${c.addr?`<br><span class="lbl">Địa chỉ:</span> ${esc(c.addr)}`:''}</p>
  <p>${esc((s.name||'MAYA VIETNAM').toUpperCase())} xin chân thành cảm ơn Quý khách hàng đã quan tâm đến sản phẩm và dịch vụ của chúng tôi!<br>Chúng tôi xin gửi đến Quý khách bảng Báo giá với các thông tin chi tiết như sau:<br><span class="en">${esc((s.name||'MAYA VIETNAM').toUpperCase())} would like to give a sincere thanks for your interest in our product and service!<br>We would like to send you the Quotation with the following details:</span></p>
  ${tables}
  <div class="qtot"><div><b>TỔNG TIỀN (ĐÃ GỒM THUẾ)</b><br><span class="en"><b>TOTAL AMOUNT (INCLUDING TAX)</b></span></div><div><b style="font-size:15px">${vnd(t.total)}</b></div></div>
  <p><b>Bằng chữ:</b> ${esc(vnWords(t.total))}</p><p><b>Hiệu lực báo giá/</b><span class="en">Validity:</span> đến hết ngày ${fmtD(q.valid)}.</p>
  ${q.note?`<p><b>Ghi chú:</b> ${esc(q.note)}</p>`:''}
  ${q.lines.some(l=>l.note)?`<p class="sm">${q.lines.map((l,i)=>l.note?`<b>Ghi chú mục ${i+1}:</b> ${esc(l.note)}`:'').filter(Boolean).join('<br>')}</p>`:''}
  ${notes}${pay}${comp}
  <p style="text-align:center;margin-top:16px">Nếu Quý khách có câu hỏi, góp ý hay yêu cầu gì thêm, xin vui lòng liên hệ lại chúng tôi!<br><span class="en">If you have further questions, suggestions or requests, please contact us!</span><br>Xin chân thành cảm ơn Quý khách hàng đã tin tưởng sử dụng dịch vụ của chúng tôi!<br><span class="en">Sincere thanks to you for choosing our service!</span></p>
  <div class="sig"><div></div><div><b>Người lập</b><br><span class="en">Prepared by</span><br><span class="en" style="font-size:11px">(Ký và ghi rõ họ tên / Signature &amp; full name)</span><div style="height:84px"></div>${g.name?`<b>${esc(g.name.toUpperCase())}</b>`:'<span style="color:#9AA5AF">……………………………………</span>'}</div></div></div>`;
}
const ACC=[['charger','Sạc'],['cable','Cáp sạc'],['box','Hộp'],['pouch','Túi đựng'],['sim','SIM']];
function docHandover(h){
  const c=CB[h.cus]||{legal:'',mst:'',addr:''};const s=SET();const giao=h.type==='Giao';
  const PI=h.items.filter(x=>!x.esim),EI=h.items.filter(x=>x.esim),onlyE=!PI.length&&EI.length>0;
  const rows=PI.map((x,i)=>`<tr><td class="c">${i+1}</td><td><b>${esc(x.dev)}</b></td><td>${esc(x.imei||'')}</td><td>${esc(x.pkg||'')}</td><td class="c">${fmtD(x.s)} – ${fmtD(x.e)}</td><td class="c">${x.ins==null?'—':x.ins?BL('Có','Yes'):BL('Không','No')}</td></tr>`).join('');
  const erows=EI.map((x,i)=>`<tr><td class="c">${i+1}</td><td class="c"><b>${esc(x.iccid||'—')}</b></td><td>${esc(x.pkg||'')}</td><td class="c">${x.s?fmtD(x.s)+(x.e?' – '+fmtD(x.e):''):'—'}</td></tr>`).join('');
  const R=RUL(),anyIns=PI.some(x=>x.ins===true),anyNo=PI.some(x=>x.ins!==true);
  const comp=giao&&PI.length?`<p><b>Mức bồi thường khi thiết bị mất, thất lạc hoặc hư hỏng do lỗi của Bên nhận:</b><br><span class="en"><b>Compensation if the device is lost, mislaid or damaged due to the Receiving party's fault:</b></span></p><ul>${anyIns?`<li>Thiết bị có đăng ký bảo hiểm: ${vnd(R.lossIns)} đ/thiết bị, không phải bồi thường phụ kiện đi kèm.<br><span class="en">Insured device: ${vnd(R.lossIns)} VND/device; no compensation for included accessories.</span></li>`:''}${anyNo?`<li>Thiết bị không đăng ký bảo hiểm, hoặc Bên nhận lưu giữ tại văn phòng/địa điểm do Bên nhận quản lý: ${vnd(R.lossNoIns)} đ/thiết bị và ${vnd(R.accSet)} đ/bộ phụ kiện (01 túi đựng, 01 củ sạc, 02 chấu chuyển đổi, 01 dây sạc).<br><span class="en">Uninsured device, or device kept at an office/location managed by the Receiving party: ${vnd(R.lossNoIns)} VND/device and ${vnd(R.accSet)} VND/accessory set (1 pouch, 1 charger, 2 plug adapters, 1 charging cable).</span></li>`:''}</ul><p>Thời gian thuê không tính ngày giao và ngày trả thiết bị.<br><span class="en">The rental period excludes the delivery date and the return date.</span></p>`:'';
  const ACC_EN={charger:'Charger',cable:'Charging cable',box:'Box',pouch:'Pouch',sim:'SIM'};const acc=ACC.filter(a=>+(h.acc||{})[a[0]]>0).map(a=>`${a[1]}/${ACC_EN[a[0]]||a[1]}: ${h.acc[a[0]]}`).join(' · ')||'Không có/None';
  const sg=h.sg||null,auth=sg&&!sg.dir?`<i>(Theo Giấy ủy quyền số ${esc(sg.authNo||'……')}${sg.authDate?' ngày '+fmtD(sg.authDate):''})</i><br><span class="en">(Per Power of Attorney No. ${esc(sg.authNo||'……')}${sg.authDate?' dated '+fmtD(sg.authDate):''})</span>`:'';
  const company=`<b>${esc(s.name||'[Tên công ty của bạn]')}</b><br>${BL('Đại diện','Representative')}: ${esc(h.ours||'………………')}${sg&&!sg.dir?` (${esc(sg.title||'')}, ${BL('theo Giấy ủy quyền số','per Power of Attorney No.')} ${esc(sg.authNo||'……')})`:''}`;
  const cust=`<b>${esc(c.legal||c.name||'')}</b>${c.mst?` (${BL('MST','Tax code')} ${esc(c.mst)})`:''}<br>${BL('Đại diện','Representative')}: ${esc(h.theirs||'………………')}${h.tphone?' · '+BL('ĐT','Tel')+' '+esc(h.tphone):''}`;
  return `<div class="paper">${letterhead()}<h1>BIÊN BẢN ${giao?'BÀN GIAO':'THU HỒI'} ${onlyE?'ESIM':EI.length?'THIẾT BỊ VÀ ESIM':'THIẾT BỊ'}</h1><div class="qh2 en">${onlyE?'eSIM':EI.length?'Device and eSIM':'Device'} ${giao?'handover':'return'} minutes</div><div class="sub">${BL('Số','No.')}: ${esc(h.no)} · ${BL('Ngày','Date')}: ${fmtD(h.date)}</div>
  <p>Căn cứ đơn hàng số <b>${esc(h.order)}</b>, hai bên cùng lập biên bản ${giao?'bàn giao':'thu hồi'} ${onlyE?'eSIM':EI.length?'thiết bị và eSIM':'thiết bị'} như sau:<br><span class="en">Pursuant to order No. ${esc(h.order)}, both parties have prepared these minutes of ${giao?'handover':'return'} of ${onlyE?'eSIM':EI.length?'devices and eSIM':'devices'} as follows:</span></p>
  <p><b>${BL('Bên giao','Delivering party')}:</b><br>${giao?company:cust}</p><p><b>${BL('Bên nhận','Receiving party')}:</b><br>${giao?cust:company}</p>
  ${PI.length?`<table><thead><tr><th>${bi2('STT','No.')}</th><th>${bi2('Mã máy','Device code')}</th><th>IMEI</th><th>${bi2('Gói / quốc gia','Package / country')}</th><th>${bi2('Thời gian thuê','Rental period')}</th><th>${bi2('Bảo hiểm','Insurance')}</th></tr></thead><tbody>${rows}</tbody></table>`:''}
  ${EI.length?`${PI.length?'<p><b>eSIM:</b></p>':''}<table><thead><tr><th>${bi2('STT','No.')}</th><th>ICCID</th><th>${bi2('Quốc gia / gói','Country / package')}</th><th>${bi2('Thời gian sử dụng','Usage period')}</th></tr></thead><tbody>${erows}</tbody></table>`:''}
  ${PI.length?`<p><b>${BL('Phụ kiện kèm theo','Accessories included')}:</b> ${esc(acc)}</p>`:''}<p><b>${onlyE?BL('Tình trạng bàn giao','Handover condition'):BL('Tình trạng thiết bị','Device condition')}:</b> ${esc(h.cond||'')}</p>${h.note?`<p><b>${BL('Ghi chú','Notes')}:</b> ${esc(h.note)}</p>`:''}${comp}
  <p>Biên bản được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị như nhau.<br><span class="en">These minutes are made in two copies, each party keeps one copy, both having equal validity.</span></p>
  ${signBlock('BÊN GIAO','BÊN NHẬN',giao?h.ours:h.theirs,giao?h.theirs:h.ours,giao?auth:'',giao?'':auth)}</div>`;
}
function docPayreq(r){
  const c=CB[r.cus]||{legal:'',mst:'',addr:''};const s=SET();const total=sum(r.items,x=>x.ask);
  const rows=r.items.map((x,i)=>`<tr><td class="c">${i+1}</td><td>${x.type==='invoice'?'Hóa đơn số '+esc(x.ref)+'<br><span class="en">Invoice No. '+esc(x.ref)+'</span>':'Đơn hàng '+esc(x.ref)+'<br><span class="en">Order '+esc(x.ref)+'</span>'}<br><small>${esc(x.desc||'')}</small></td><td class="c">${fmtD(x.date)}</td><td class="r">${vnd(x.total)}</td><td class="r">${vnd(x.paid)}</td><td class="r">${vnd(x.ask)}</td></tr>`).join('');
  return `<div class="paper">${letterhead()}<h1>ĐỀ NGHỊ THANH TOÁN</h1><div class="qh2 en">PAYMENT REQUEST</div><div class="sub">${BL('Số','No.')}: ${esc(r.no)} · ${BL('Ngày','Date')}: ${fmtD(r.date)}</div>
  <p><b>${BL('Kính gửi','To')}:</b> ${esc(c.legal||c.name||'')}${c.mst?` (${BL('MST','Tax code')} ${esc(c.mst)})`:''}${c.addr?`<br>${BL('Địa chỉ','Address')}: ${esc(c.addr)}`:''}</p>
  <p>${esc(s.name||'Chúng tôi')} đề nghị Quý công ty thanh toán các khoản dịch vụ cho thuê thiết bị sau:<br><span class="en">${esc(s.name||'We')} kindly request your company to pay for the following equipment rental services:</span></p>
  <table><thead><tr><th>${bi2('STT','No.')}</th><th>${bi2('Căn cứ','Basis')}</th><th>${bi2('Ngày','Date')}</th><th>${bi2('Giá trị gồm VAT (đ)','Value incl. VAT (VND)')}</th><th>${bi2('Đã thanh toán (đ)','Paid (VND)')}</th><th>${bi2('Đề nghị thanh toán (đ)','Amount requested (VND)')}</th></tr></thead><tbody>${rows}<tr class="tot"><td colspan="5" class="r">${bi2('Tổng số tiền đề nghị thanh toán','Total amount requested')}</td><td class="r">${vnd(total)}</td></tr></tbody></table>
  <p><b>${BL('Bằng chữ','In words')}:</b> ${esc(vnWords(total))}</p><p><b>${BL('Hạn thanh toán','Payment due')}:</b> ${BL('trước ngày','before')} ${fmtD(r.due)}.</p>
  ${acctHtml(r)}${c.payDocs&&c.payDocs.length?`<p><b>${BL('Hồ sơ kèm theo','Attached documents')}:</b> ${docLabels(c).map(esc).join('; ')}.${c.payVia?`<br>${BL('Hình thức gửi','Delivery method')}: ${esc(c.payVia)}${c.payTo?' · '+esc(c.payTo):''}`:''}${c.payNote?`<br>${BL('Lưu ý','Note')}: ${esc(c.payNote)}`:''}</p>`:''}${r.note?`<p><b>${BL('Ghi chú','Notes')}:</b> ${esc(r.note)}</p>`:''}
  ${sigBlockHtml(r)}</div>`;
}
const DOCS={
 statement:{col:'statements',label:'Bảng kê',html:d=>docStatement(d),aoa:d=>STMT_AOA(d),sheets:d=>STMT_SHEETS(d)},
 quote:{col:'quotes',label:'Báo giá',html:docQuote,aoa:q=>{const c=CB[q.cus]||{};const t=qTot(q);return [['BÁO GIÁ'],['Số',q.no],['Ngày',fmtD(q.date)],['Hiệu lực đến',fmtD(q.valid)],['Khách hàng',c.legal||c.name||''],['MST',c.mst||''],[],['STT','Sản phẩm','Quốc gia','Gói','Từ ngày','Đến ngày','Số lượng','Thời hạn','Đơn giá','Bảo hiểm','Giảm (%)','Phí khác','Thành tiền (chưa VAT)']].concat(q.lines.map((l,i)=>[i+1,l.prod==='eSIM'?'eSIM':'Wi-Fi',(l.multi?l.ctext:CTRY[l.c])||'',l.pkg||l.desc||'',l.s?fmtD(l.s):'',l.e?fmtD(l.e):'',+l.qty||1,durLbl(l),+l.price||0,+l.ins||0,+l.dpct||0,+l.fee||0,qLine(l).ex])).concat([[],['','','','','','','','','','','','Chưa VAT',t.ex],['','','','','','','','','','','','VAT '+t.vr+'%',t.vat],['','','','','','','','','','','','Tổng cộng',t.total],['Bằng chữ',vnWords(t.total)]])}},
 handover:{col:'handovers',label:'Biên bản',html:docHandover,aoa:h=>{const c=CB[h.cus]||{};return [['BIÊN BẢN '+(h.type==='Giao'?'BÀN GIAO':'THU HỒI')+' THIẾT BỊ'],['Số',h.no],['Ngày',fmtD(h.date)],['Đơn hàng',h.order],['Khách hàng',c.legal||c.name||''],['Đại diện công ty',h.ours||''],['Đại diện khách',h.theirs||''],[],['STT','Mã máy','IMEI','Gói / quốc gia','Từ ngày','Đến ngày']].concat(h.items.map((x,i)=>[i+1,x.dev,x.imei||'',x.pkg||'',fmtD(x.s),fmtD(x.e)])).concat([[],['Phụ kiện',ACC.filter(a=>+(h.acc||{})[a[0]]>0).map(a=>a[1]+': '+h.acc[a[0]]).join(', ')],['Tình trạng',h.cond||''],['Ghi chú',h.note||'']])}},
 payreq:{col:'payreqs',label:'Đề nghị',html:docPayreq,aoa:r=>{const c=CB[r.cus]||{};const s=SET();const t=sum(r.items,x=>x.ask);return [['ĐỀ NGHỊ THANH TOÁN'],['Số',r.no],['Ngày',fmtD(r.date)],['Khách hàng',c.legal||c.name||''],['MST',c.mst||''],['Hạn thanh toán',fmtD(r.due)],[],['STT','Căn cứ','Ngày','Giá trị gồm VAT','Đã thanh toán','Đề nghị thanh toán']].concat(r.items.map((x,i)=>[i+1,(x.type==='invoice'?'Hóa đơn ':'Đơn hàng ')+x.ref,fmtD(x.date),x.total,x.paid,x.ask])).concat([[],['','','','','Tổng',t],['Bằng chữ',vnWords(t)],...acctsFor(r).flatMap(a=>[['Tài khoản'+(a.label?' '+a.label:''),''],['Ngân hàng',a.bank||''],['Số tài khoản',a.acc||''],['Chủ tài khoản',a.holder||'']])])}}
};
function docDrawer(kind,id){
  const D=DOCS[kind];const doc=LV(D.col)[id];
  if(!doc)return `<div class="dr-top"><h2>Không tìm thấy chứng từ</h2><button class="xbtn" data-act="close" aria-label="Đóng">×</button></div>`;
  const d=Object.assign({id},doc);const st=kind==='quote'?qStatus(d):kind==='payreq'?prStatus(d):kind==='statement'?(d.status||'Nháp'):'';
  const tone=kind==='quote'?QTONE[st]:kind==='payreq'?PTONE[st]:kind==='statement'?STMT_TONE[st]:'mute';
  const stSel=kind==='quote'?QSTATUS:kind==='payreq'?['Nháp','Đã gửi']:kind==='statement'?STMT_STATUS:null;
  const warn=SET().name?'':`<div class="note">Chưa nhập thông tin công ty nên phần đầu chứng từ còn trống. <button class="linkbtn" data-act="nav" data-id="settings">Nhập thông tin công ty</button></div>`;
  return `<div class="dr-top"><div><h2><span class="mono" style="font-size:19px">${esc(d.no)}</span> ${st?chip(tone,st):''}</h2><div class="muted" style="margin-top:4px">${D.label} · ${clink(d.cus)}</div></div><button class="xbtn" data-act="close" aria-label="Đóng">×</button></div>
  <div class="btns"><button class="btn pri" data-act="docxlsx" data-id="${kind}:${esc(id)}">${ico('download')}Xuất Excel</button><button class="btn" data-act="dochtml" data-id="${kind}:${esc(id)}">${ico('download')}Tải bản PDF</button><button class="btn" data-act="docprint" data-id="${kind}:${esc(id)}">In</button>${kind==='statement'&&d.inv?'':`<button class="btn" data-act="docedit" data-id="${kind}:${esc(id)}">Sửa</button>`}
   ${kind==='quote'?`<button class="btn" data-act="quote2order" data-id="${esc(id)}">Chuyển thành đơn hàng</button>`:''}${kind==='statement'&&d.inv?'':`<button class="btn danger" data-act="docdel" data-id="${kind}:${esc(id)}">Xóa</button>`}</div>
  ${kind==='statement'?(d.inv?`<div class="note info">Đã xuất <b>hóa đơn số ${esc(d.inv)}</b>${d.invDate?' ngày '+fmtD(d.invDate):''} cho các đơn: <span class="mono">${esc((d.invOrders||[]).join(', '))}</span>. Trạng thái các đơn đã chuyển sang đã xuất hóa đơn.</div>`:st==='Đã chốt'?`<div class="note info" style="display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span>Bảng kê đã chốt. Ghi số hóa đơn để đồng bộ trạng thái các đơn hàng.</span><button class="btn pri" data-act="stinv" data-id="${esc(id)}">Xuất hóa đơn</button></div>`:''):''}
  ${stSel?`<div class="filters"><span class="muted">Trạng thái:</span><div class="seg" role="group" aria-label="Trạng thái">${stSel.map(x=>`<button aria-pressed="${(d.status||'Nháp')===x}" data-act="docstatus" data-id="${kind}:${esc(id)}:${x}">${x}</button>`).join('')}</div></div>`:''}
  ${warn}<div class="sm muted">Nút In mở hộp thoại in của trình duyệt (khổ A4). Bản Excel có đủ số liệu để chỉnh tiếp.</div>${kind==='statement'?'<div class="scroll">'+D.html(d)+'</div>':D.html(d)}`;
}
