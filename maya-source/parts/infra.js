
/* ============ LƯU TRỮ (cơ sở dữ liệu của trang) ============ */
const $=id=>document.getElementById(id);
let DB=null,DL=null,ASSETS=null,CAN=true,DBSTATE='connecting';
const COLS=['orders','orderops','lineops','customers','devices','invoices','prices','quotes','handovers','payreqs','statements','contracts','settings'];
const SNAPJ={};
function setDbState(s){
  DBSTATE=s;const e=$('dbs');if(!e)return;
  e.className='dbs '+(s==='on'?'on':s==='off'?'off':'');
  e.lastChild.textContent={on:'Dữ liệu tự động lưu',off:'Chưa lưu được, chỉ trong phiên này',connecting:'Đang kết nối dữ liệu'}[s];
}
const dbErr=e=>e&&e.code==='invalid_argument'?'Bạn chưa có quyền ghi dữ liệu. Nhờ chủ trang cấp quyền Contributor trở lên.':e&&e.code==='quota_exceeded'?'Cơ sở dữ liệu đã đầy.':'Không lưu được, thử lại sau.';
let rt;function scheduleRefresh(){clearTimeout(rt);rt=setTimeout(()=>{rebuild();renderSoft()},40)}
async function save(col,id,data){
  const prev=(LIVE[col]||{})[id];(LIVE[col]=LIVE[col]||{})[id]=data;rebuild();renderSoft();
  if(DB){try{await DB.doc(col+'/'+id).set(data)}catch(e){
    if(prev===undefined)delete LIVE[col][id];else LIVE[col][id]=prev;rebuild();renderSoft();toast(dbErr(e));throw e}}
}
async function remove(col,id){
  const prev=(LIVE[col]||{})[id];if(LIVE[col])delete LIVE[col][id];rebuild();renderSoft();
  if(DB){try{await DB.doc(col+'/'+id).delete()}catch(e){if(prev!==undefined)LIVE[col][id]=prev;rebuild();renderSoft();toast(dbErr(e));throw e}}
}
function setLineOp(l,patch){
  const key=l.o.code+'__'+l.idx;
  return save('lineops',key,Object.assign({},LV('lineops')[key]||{},patch));
}
function nextNo(prefix,col){
  const ym=TODAY.slice(0,4)+TODAY.slice(5,7);
  const n=Object.values(LV(col)).filter(d=>d.no&&d.no.indexOf(prefix+'-'+ym)===0).length+1;
  let no=prefix+'-'+ym+'-'+String(n).padStart(3,'0');
  const used=new Set(Object.values(LV(col)).map(d=>d.no));let k=n;while(used.has(no)){k++;no=prefix+'-'+ym+'-'+String(k).padStart(3,'0')}
  return no;
}
async function initData(){
  if(!window.claude||!window.claude.use){setDbState('off');return}
  const [db,user,dl,as]=await Promise.all([claude.use('db'),claude.use('user'),claude.use('downloads'),claude.use('assets')]);
  DL=dl;ASSETS=as;
  if(user){try{const c=await user.can('data.write');CAN=c!==false}catch(e){}}
  if(!db){setDbState('off');return}
  DB=db;setDbState('on');
  COLS.forEach(c=>{
    db.collection(c).onSnapshot(snap=>{
      const m={};snap.docs.forEach(d=>{m[d.id]=d.data()});
      const j=JSON.stringify(m);if(SNAPJ[c]!==j){SNAPJ[c]=j;LIVE[c]=m;scheduleRefresh()}
    },e=>{if(!e||e.code!=='revoked')console.error(c,e);setDbState('off')});
  });
}

/* ============ BIỂU TƯỢNG ============ */
const ICON={
 grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
 file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
 users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 wifi:'<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
 truck:'<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
 dollar:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
 tag:'<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
 percent:'<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
 quote:'<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>',
 clip:'<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
 card:'<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
 download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
 plus:'<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
 trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
 sliders:'<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>'
};
const ico=n=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

/* ============ KHUNG GIAO DIỆN ============ */
const S={view:'dashboard',cust:null,tab:'orders',dispArea:'',
  f:{orders:{invno:'',invdate:'',inv:'',sel:{},code:'',cname:'',dev:'',date:'',min:'',cus:'',q:'',status:'',area:'',src:'',pay:'',issue:false},devices:{q:'',state:'',loc:'',holder:''},invoices:{f:'all'},customers:{q:''},
     quotes:{q:'',status:''},handovers:{q:''},payreqs:{q:''},statements:{q:''},prices:{kind:'',q:'',region:'',tab:'wifi',src:''},discounts:{q:''},comm:{q:'',m:'',s:'',t:'todo',cm2:'',sel:{}}},
  rep:{sheets:{lines:true,customers:true,invoices:true,devices:true,quotes:false,handovers:false,payreqs:false,prices:false},from:'',to:''},
  dr:null,armed:''};
let CUR=null,lastFocus=null,LAST={};
const chip=(t,x)=>`<span class="chip t-${t}">${esc(x)}</span>`;
const dchip=d=>{const k=DK[d.k];return chip(k[1],k[0])};
const olink=c=>`<button class="linkbtn mono" data-act="order" data-id="${esc(c)}">${esc(c)}</button>`;
const dlink=c=>`<button class="linkbtn mono" data-act="dev" data-id="${esc(c)}">${esc(c)}</button>`;
const clink=id=>`<button class="linkbtn" data-act="cust" data-id="${esc(id)}">${esc((CB[id]||{name:'(khách đã xóa)'}).name)}</button>`;
const demoTag=o=>o.demo?' <span class="tag">MẪU</span>':'';
const prodLbl=l=>l.prod==='eSIM'?'eSIM':l.prod.includes('insert')?'Wi-Fi + SIM':'Wi-Fi';
const head=(t,p,extra)=>`<div class="ph"><div><h1>${t}</h1>${p?`<p>${p}</p>`:''}</div>${extra||''}</div>`;
const expBtn=k=>`<button class="btn" data-act="export" data-id="${k}">${ico('download')}Xuất Excel</button>`;
const newBtn=(act,t)=>`<button class="btn pri" data-act="${act}">${ico('plus')}${t}</button>`;
const CTRY_OPTS=()=>Object.keys(CTRY).map(k=>[k,CTRY[k]]).sort((a,b)=>a[1].localeCompare(b[1],'vi'));

const NAV=[
 {g:'Vận hành',items:[['dashboard','Tổng quan','grid'],['orders','Đơn hàng','file'],['customers','Khách hàng','users'],['devices','Thiết bị','wifi'],['dispatch','Giao nhận','truck'],['invoices','Hóa đơn và công nợ','dollar']]},
 {g:'Kinh doanh và chứng từ',items:[['prices','Bảng giá','tag'],['discounts','Giảm giá và hợp đồng','percent'],['commission','Hoa hồng Nam San','card'],['quotes','Báo giá','quote'],['statements','Bảng kê','file'],['handovers','Biên bản bàn giao','clip'],['payreqs','Đề nghị thanh toán','card']]},
 {g:'Báo cáo',items:[['reports','Xuất Excel','download'],['settings','Thông tin công ty','sliders']]}
];
function navBadge(v){
  if(v==='devices'){const n=devList().filter(d=>d.k==='overdue').length;return n?`<span class="badge t-bad">${n}</span>`:''}
  if(v==='dispatch'){const n=dispatchData('').total;return n?`<span class="badge t-info">${n}</span>`:''}
  if(v==='invoices'){const n=Object.values(INVS).filter(i=>i.over).length;return n?`<span class="badge t-bad">${n}</span>`:''}
  return '';
}
function drawNav(){
  $('nav').innerHTML=NAV.map(g=>`<div class="ng">${g.g}</div>`+g.items.map(([v,t,i])=>`<button data-act="nav" data-id="${v}" ${S.view===v&&!S.cust?'aria-current="page"':S.view===v?'aria-current="page"':''}>${ico(i)}<span class="lbl">${t}</span>${navBadge(v)}</button>`).join('')).join('');
  $('todayLbl').textContent=fmtD(TODAY);
  $('newbtn').innerHTML=ico('plus')+'<span>Tạo đơn mới</span>';
}
const VIEWS={};
function setView(v,f,keepCust){
  S.view=v;if(!keepCust)S.cust=null;
  if(f){Object.assign(S.f[v],f)}
  try{if(location.hash!=='#'+v)location.hash=v}catch(e){}
  closeDrawer();render();window.scrollTo(0,0);
}
const DRAW={orders:()=>drawOrders(),devices:()=>drawDevices(),customers:()=>drawCustomers(),invoices:()=>drawInvoices(),quotes:()=>drawQuotes(),handovers:()=>drawHandovers(),payreqs:()=>drawPayreqs(),statements:()=>drawStatements(),prices:()=>drawPrices(),discounts:()=>drawDiscounts(),commission:()=>drawComm(),comm:()=>drawComm()};
function render(){
  drawNav();
  const v=S.cust?'customer':S.view;const sv=PLSCOPE;PLSCOPE='';
  try{$('main').innerHTML=VIEWS[v]();
  if(DRAW[v])DRAW[v]();}finally{PLSCOPE=sv}
}
function renderSoft(){
  const a=document.activeElement;
  const typing=a&&$('main').contains(a)&&/^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName);
  if(typing){drawNav();const v=S.cust?'customer':S.view;const sv=PLSCOPE;PLSCOPE='';try{if(DRAW[v])DRAW[v]()}finally{PLSCOPE=sv}}else render();
  refreshDrawer();
}

/* ---- ngăn kéo và biểu mẫu ---- */
function openDrawer(html){
  lastFocus=document.activeElement;$('dr').innerHTML=html;$('drawer').classList.add('open');$('drawer').setAttribute('aria-hidden','false');$('dr').scrollTop=0;
  const x=$('dr').querySelector('.xbtn');if(x)x.focus();
}
function openView(fn){CUR=null;S.dr=fn;openDrawer(fn())}
function refreshDrawer(){
  if(!$('drawer').classList.contains('open')||CUR||!S.dr)return;
  try{const st=$('dr').scrollTop;$('dr').innerHTML=S.dr();$('dr').scrollTop=st}catch(e){closeDrawer()}
}
function closeDrawer(){
  CUR=null;S.dr=null;PLSCOPE='';
  if(window.STMT_STASH){const f=window.STMT_STASH;window.STMT_STASH=null;setTimeout(()=>{try{f.refreshLines()}catch(e){}openForm(f)},120);return}
  if(!$('drawer').classList.contains('open'))return;
  $('drawer').classList.remove('open');$('drawer').setAttribute('aria-hidden','true');
  if(lastFocus&&lastFocus.focus&&document.contains(lastFocus))try{lastFocus.focus()}catch(e){}
}
let tt;function toast(t){const e=$('toast');e.textContent=t;e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>{e.hidden=true},3200)}
const plScopeOf=f=>f&&f.s&&f.s.cus!==undefined?custPL(f.s.cus):'';
function openForm(f){S.dr=null;CUR=f;PLSCOPE=plScopeOf(f);openDrawer(f.render());if(f.after)f.after()}
let NOFOCUS=false;
function rerender(){
  if(!CUR)return;PLSCOPE=plScopeOf(CUR);
  const a=document.activeElement;const fk=NOFOCUS?null:(a&&a.dataset&&a.dataset.k);let ss=null;try{ss=a.selectionStart}catch(e){}
  const st=$('dr').scrollTop;
  $('dr').innerHTML=CUR.render();$('dr').scrollTop=st;
  if(fk){const n=$('dr').querySelector('[data-k="'+fk+'"]');if(n){n.focus();if(ss!=null)try{n.setSelectionRange(ss,ss)}catch(e){}}}
  if(CUR.after)CUR.after();
}
/* tạo trường nhập */
/* ô ngày dd/mm/yyyy: ô chữ hiển thị + ô date ẩn giữ giá trị ISO cho toàn bộ logic cũ */
const dateIn=(attrs,iso,cls)=>`<span class="dtw${cls?' '+cls:''}"><input type="text" class="dt" inputmode="numeric" autocomplete="off" maxlength="10" placeholder="dd/mm/yyyy" value="${iso?fmtD(iso):''}"><button type="button" class="dtb" data-act="dtpick" tabindex="-1" aria-label="Chọn ngày"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg></button><input type="date" class="dtn" tabindex="-1" aria-hidden="true" ${attrs} value="${esc(iso||'')}"></span>`;
function F(path,label,o){
  o=o||{};const v=gp(CUR.s,path);const t=o.t||'text';const ph=o.ph?` placeholder="${esc(o.ph)}"`:'';const dis=o.dis?' disabled':'';
  let c;
  if(o.opts){const fnd=!dis&&o.find!==false&&(o.find||path==='order'||path==='cus')&&o.opts.length>=8;c=(fnd?`<input type="text" class="sfind" autocomplete="off" placeholder="🔎 Gõ để tìm nhanh (tên, mã đơn, MST…)">`:'')+`<select data-k="${path}" data-t="${o.num?'num':'text'}"${dis}>${o.opts.map(x=>{x=Array.isArray(x)?x:[x,x];return `<option value="${esc(x[0])}"${String(x[0])===String(v)?' selected':''}${x[2]?' disabled':''}>${esc(x[1])}</option>`}).join('')}</select>`}
  else if(t==='textarea'){c=`<textarea data-k="${path}" data-t="text" rows="${o.rows||3}"${ph}${dis}>${esc(v)}</textarea>`}
  else if(t==='money'){c=`<input data-k="${path}" data-t="money" type="text" inputmode="numeric" autocomplete="off" value="${v?vnd(v):''}" placeholder="0"${dis}>`}
  else if(t==='check'){return `<label class="ck"><input type="checkbox" data-k="${path}" data-t="bool"${v?' checked':''}${dis}> ${label}</label>`}
  else if(t==='date'){c=dateIn(`data-k="${path}" data-t="text"${dis}`,v)}
  else{c=`<input data-k="${path}" data-t="${t==='num'?'num':'text'}" type="${t==='num'?'number':t}"${t==='num'?' step="any" inputmode="decimal"':''} value="${esc(v)}"${ph}${dis}>`}
  return `<label class="f${o.cls?' '+o.cls:''}"><span>${label}</span>${c}</label>`;
}
const fbar=(extra,label)=>`<div class="fbar"><span class="grow muted">${extra||''}</span><button class="btn" data-act="close">Hủy</button><button class="btn pri" data-act="formsubmit" id="fsub">${label||'Lưu'}</button></div>`;
const ferr=s=>s.err&&s.err.length?`<div class="ferr" role="alert">Chưa lưu được:<ul>${s.err.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></div>`:'';
const formTop=(t,sub)=>`<div class="dr-top"><div><h2>${t}</h2>${sub?`<div class="muted" style="margin-top:4px">${sub}</div>`:''}</div><button class="xbtn" data-act="close" aria-label="Đóng">×</button></div>`;
