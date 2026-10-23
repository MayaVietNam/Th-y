
/* ============ SỰ KIỆN ============ */
const getLine=id=>{const p=id.split('|');return ORD.find(o=>o.code===p[0]).lines[+p[1]]};
let armT;
function arm(t,key,label){
  if(S.armed===key)return true;
  S.armed=key;const old=t.textContent;t.textContent=label||'Bấm lần nữa để xóa';
  clearTimeout(armT);armT=setTimeout(()=>{S.armed='';try{t.textContent=old}catch(e){}},3500);return false;
}
function parseDoc(id){const p=id.split(':');return{kind:p[0],id:p[1],extra:p[2]}}

function fmtMoneyEl(t){const pos=t.selectionStart||0,before=t.value.slice(0,pos).replace(/\D/g,'').length,d=t.value.replace(/\D/g,'');t.value=d?vnd(+d):'';let n=0,i=0;if(before>0)for(i=0;i<t.value.length&&n<before;i++){if(/\d/.test(t.value[i]))n++}try{t.setSelectionRange(i,i)}catch(e){}}
const dig=v=>Number(String(v==null?'':v).replace(/\D/g,''));
function readStaff(){const cur=S.staffDraft||SET().staff||[];return cur.map((x,i)=>{const g=k=>{const e=$('st_'+i+'_'+k);return e?String(e.value).trim():(x[k]||'')};return{id:x.id||uid('s'),name:g('name'),title:g('title'),email:g('email'),authNo:g('authNo'),authDate:g('authDate')}})}
document.addEventListener('focusin',ev=>{if(ev.target&&ev.target.id==='ocu'){S.f.orders.cuqF='';ocuFill();return}
  const t=ev.target;if(t&&t.dataset&&t.dataset.cs&&CUR&&CUR.cddOpen)CUR.cddOpen(t.dataset.k)});
document.addEventListener('focusout',ev=>{if(ev.target&&ev.target.id==='ocu')ocuClose()});
document.addEventListener('mousedown',ev=>{const oc=ev.target.closest&&ev.target.closest('[data-act="pickocu"]');if(oc){ev.preventDefault();const f=S.f.orders;f.cus=oc.dataset.id||'';ocuClose();drawOrders();const e=$('ocu');if(e)e.blur();return}
  const cu=ev.target.closest&&ev.target.closest('[data-act="pickcu"]');if(cu&&CUR&&CUR.pickCu){ev.preventDefault();CUR.pickCu(cu.dataset.id);return}const t=ev.target.closest&&ev.target.closest('[data-act="pickc"]');if(t&&CUR&&CUR.pickC){ev.preventDefault();const p=t.dataset.id.split(':');CUR.pickC(p[0],p[1])}});
document.addEventListener('keydown',ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.k==='cuq'&&CUR&&CUR.pickCu){if(ev.key==='Enter'){ev.preventDefault();const L=cuFilter(CUR.s.cuq);if(L.length)CUR.pickCu(L[0].id)}else if(ev.key==='Escape'&&CUR.s.cuqOpen){ev.stopPropagation();CUR.s.cuqOpen=false;cuFill()}return}
  if(t&&t.dataset&&t.dataset.cs&&CUR&&CUR.pickC){const m=t.dataset.k.match(/^lines\.(\d+)\.cq$/);if(!m)return;if(ev.key==='Enter'){ev.preventDefault();const l=CUR.s.lines[+m[1]],L=ctryFilter(l.prod,l.cq);if(L.length)CUR.pickC(m[1],L[0][0])}else if(ev.key==='Escape'&&CUR.s.lines[+m[1]].cqOpen){ev.stopPropagation();CUR.s.lines[+m[1]].cqOpen=false;cddFill(+m[1])}}},true);
document.addEventListener('click',async ev=>{
  const t=ev.target.closest('[data-act]');if(!t||t.dataset.act==='pickc'||t.dataset.act==='pickcu'||t.dataset.act==='pickocu')return;
  const a=t.dataset.act,id=t.dataset.id;
  if(a==='nav'){setView(id)}
  else if(a==='close'){closeDrawer()}
  else if(a==='order'){openView(()=>orderDrawer(id))}
  else if(a==='dev'){openView(()=>devDrawer(id))}
  else if(a==='cust'){closeDrawer();S.cust=id;S.tab='orders';S.view='customers';render();window.scrollTo(0,0)}
  else if(a==='tab'){S.tab=id;render()}
  else if(a==='todo'){window.__todo[+id].go()}
  else if(a==='devstate'){setView('devices',{state:id,q:'',loc:'',holder:''})}
  else if(a==='darea'){S.dispArea=id;render()}
  else if(a==='ifilter'){S.f.invoices.f=id;render()}
  else if(a==='export'){doExport(id)}
  else if(a==='exportreport'){exportReport()}
  else if(a==='deliver'){const l=getLine(id);try{await setLineOp(l,{st:'using',del:TODAY});toast(`Đã ghi nhận giao máy ${l.dev}. Trạng thái chuyển sang Đang cho thuê.`)}catch(e){}}
  else if(a==='collect'){const l=getLine(id);try{await setLineOp(l,{st:'returned',ret:TODAY});toast(`Đã thu hồi máy ${l.dev}. Máy về kho ${l.area}, trạng thái Sẵn sàng.`)}catch(e){}}
  else if(a==='stock'){const d=devState(id);try{await setLineOp(d.cur,{retFirm:null,ret:d.cur.ret||TODAY,st:'returned'});toast(`Máy ${id} đã nhập kho ${d.loc}, trạng thái Sẵn sàng.`)}catch(e){}}
  /* mở biểu mẫu */
  else if(a==='qrclear'){if(CUR&&CUR.s&&CUR.s.lines&&CUR.s.lines[+id]){CUR.s.lines[+id].qr='';rerender()}}
  else if(a==='ivs'){return}
  else if(a==='ordsel'){const cb=t.querySelector('input');if(!cb)return;if(ev.target!==cb)cb.checked=!cb.checked;const f=S.f.orders;if(cb.checked)f.sel[id]=true;else delete f.sel[id];updBulk()}
  else if(a==='ordselall'){const f=S.f.orders;(LAST.orders||[]).forEach(o=>{if(t.checked)f.sel[o.code]=true;else delete f.sel[o.code]});drawOrders()}
  else if(a==='bulkclear'){S.f.orders.sel={};drawOrders()}
  else if(a==='bulkinv'){openForm(bulkInvoiceForm(Object.keys(S.f.orders.sel)))}
  else if(a==='bulkpay'){openForm(bulkPayForm(Object.keys(S.f.orders.sel)))}
  else if(a==='bulkdel'){const codes=Object.keys(S.f.orders.sel);if(!codes.length)return;if(!arm(t,'bulkdel','Bấm lần nữa để xóa '+codes.length+' đơn'))return;S.armed='';let ok=0,skip=0;
    for(const c of codes){const o=ORD.find(x=>x.code===c);if(!o){delete S.f.orders.sel[c];continue}if(o.lines.some(l=>l.inv)){skip++;continue}
      try{if(BASE_ORD.some(b=>b.code===c))await save('orders',c,{code:c,deleted:true,cus:o.cus,lines:[]});else await remove('orders',c);ok++;delete S.f.orders.sel[c]}catch(e){}}
    toast('Đã xóa '+ok+' đơn'+(skip?', bỏ qua '+skip+' đơn đã xuất hóa đơn':''));if(S.view==='orders')drawOrders()}
  else if(a==='editorder'){const o=ORD.find(x=>x.code===id);if(o){closeDrawer();setTimeout(()=>openForm(orderForm(orderEditPre(o),o.code)),80)}}
  else if(a==='copyorder'){const o=ORD.find(x=>x.code===id);if(o){closeDrawer();setTimeout(()=>openForm(orderForm(orderCopyPre(o))),80)}}
  else if(a==='neworder'){openForm(orderForm(id&&CB[id]?{cus:id}:null))}
  else if(a==='newcust'){openForm(customerForm())}
  else if(a==='editcust'){openForm(customerForm(id))}
  else if(a==='editdiscount'){openForm(discountForm(id))}
  else if(a==='newcontract'){openForm(contractForm(id))}
  else if(a==='ptab'){S.f.prices.tab=id;render()}
  else if(a==='ctab'){S.f.comm.t=id;S.f.comm.cm2='';S.f.comm.sel={};render()}
  else if(a==='csel'){const cb=t.querySelector('input');if(!cb)return;if(ev.target!==cb)cb.checked=!cb.checked;const CS=S.f.comm.sel=S.f.comm.sel||{};if(cb.checked)CS[id]=true;else delete CS[id];updCBulk()}
  else if(a==='csall'){const CS=S.f.comm.sel=S.f.comm.sel||{};commRows().forEach(r=>{const k=r.o.code+'|'+r.i;if(t.checked)CS[k]=true;else delete CS[k]});drawComm()}
  else if(a==='cmark'){await commMark(true)}
  else if(a==='cunmark'){await commMark(false)}
  else if(a==='cclear'){S.f.comm.sel={};drawComm()}
  else if(a==='editcomm'){if(ORD.some(o=>o.code===id))openForm(commForm(id))}
  else if(a==='ppl'){S.f.prices.pl=id||'';render()}
  else if(a==='mkplcus'){const nm=plName(id);if(!nm)return;try{await save('customers','c'+Date.now().toString(36),{name:nm,legal:nm,en:nm,mst:'',src:'Japanese Corporate',area:'HN',plist:id});toast('Đã thêm khách hàng '+nm+'. Bấm vào khách để nhập MST, địa chỉ.')}catch(e){}}
  else if(a==='newprice'){const p=(id||'').split('|');const kn=(KINDS.find(x=>x[0]===p[0])||[0,''])[1];openForm(priceForm(null,p.length>=4?Object.assign({kind:p[0],c:p[1],unit:p[2],pkg:p[3],region:p[4]||'',name:kn+' '+(CTRY[p[1]]||'')+' · '+p[3].replace('/day',' mỗi ngày')},p[0]==='eSIM'?{src:p[5]||'',ptype:p[6]||'',amt:p[7]||'',days:+p[8]||0,cover:p[9]||'',ip:+p[10]||0,fup:'128kbps',name:'eSIM '+(CTRY[p[1]]||'')+' · '+p[3]}:{}):(S.f.prices.tab==='esim'?{kind:'eSIM',unit:'Gói'}:null)))}
  else if(a==='editprice'){openForm(priceForm(id))}
  else if(a==='newdevice'){openForm(deviceForm())}
  else if(a==='editdev'){openForm(deviceForm(id))}
  else if(a==='devstatus'){openForm(deviceStatusForm(id))}
  else if(a==='newquote'){openForm(quoteForm(null,id&&CB[id]?{cus:id}:null))}
  else if(a==='newhandover'){
    const p=(id||'').split('|');
    const hp=p[0]?{order:p[0]}:null;if(hp&&p[1])hp.type=p[1];openForm(handoverForm(null,hp));
  }
  else if(a==='newpayreq'){
    let pre=null;
    if(id){const p=id.split(':');
      if(p[0]==='inv'&&INVS[p[1]])pre={cus:INVS[p[1]].cus,basis:'invoice',picks:{[p[1]]:true}};
      else if(p[0]==='cus')pre={cus:p[1]};
      else{const o=ORD.find(x=>x.code===id);if(o)pre={cus:o.cus,basis:'order',picks:{[o.code]:true}}}}
    openForm(payreqForm(null,pre));
  }
  else if(a==='newinvoice'){openForm(invoiceForm(id))}
  else if(a==='recordpay'){openForm(payForm(id))}
  else if(a==='quote2order'){const q=Object.assign({id},LV('quotes')[id]);openForm(orderFromQuote(q))}
  else if(a==='doc'){const d=parseDoc(id);openView(()=>docDrawer(d.kind,d.id))}
  else if(a==='docedit'){const d=parseDoc(id);openForm(d.kind==='quote'?quoteForm(d.id):d.kind==='handover'?handoverForm(d.id):d.kind==='statement'?statementForm(d.id):payreqForm(d.id))}
  else if(a==='docxlsx'){const d=parseDoc(id);const D=DOCS[d.kind];const doc=Object.assign({id:d.id},LV(D.col)[d.id]);if(window.ExcelJS&&DL){try{const u8=d.kind==='statement'?await exportStatementXlsx(doc):await htmlToXlsx(D.html(doc),D.label);const fn='RentalOps_'+D.label.replace(/\s/g,'')+'_'+safeId(doc.no)+'.xlsx';const rs=await DL.save({filename:fn,data:u8});if(rs&&rs.status==='saved')toast('Đã lưu file '+fn);return}catch(e){if(e&&e.code==='declined')return;console.error(e)}}await exportXlsx(D.sheets?D.sheets(doc):[{name:D.label,rows:D.aoa(doc),fromRow:8,plain:[0,1,2,3]}],'RentalOps_'+D.label.replace(/\s/g,'')+'_'+safeId(doc.no)+'.xlsx')}
  else if(a==='docprint'){const d=parseDoc(id);const D=DOCS[d.kind];const doc=Object.assign({id:d.id},LV(D.col)[d.id]);printDocHtml(htmlDoc(D.label+' '+doc.no,D.html(doc)))}
  else if(a==='dochtml'){const d=parseDoc(id);const D=DOCS[d.kind];const doc=Object.assign({id:d.id},LV(D.col)[d.id]);await savePdfFile(safeId(doc.no)+'.pdf',htmlDoc(D.label+' '+doc.no,D.html(doc)))}
  else if(a==='docstatus'){const d=parseDoc(id);const D=DOCS[d.kind];try{await save(D.col,d.id,Object.assign({},LV(D.col)[d.id],{status:d.extra}));toast('Đã đổi trạng thái sang '+d.extra)}catch(e){}}
  else if(a==='docdel'){if(!arm(t,'doc'+id,'Bấm lần nữa để xóa'))return;const d=parseDoc(id);const D=DOCS[d.kind];S.armed='';try{await remove(D.col,d.id);closeDrawer();toast('Đã xóa chứng từ')}catch(e){}}
  else if(a==='delorder'){const o=ORD.find(x=>x.code===id);if(!o)return;
    if(o.lines.some(l=>l.inv)){toast('Đơn đã xuất hóa đơn nên chưa xóa được. Hãy xử lý hóa đơn trước.');return}
    if(!arm(t,'ord'+id,'Bấm lần nữa để xóa đơn'))return;S.armed='';
    try{if(BASE_ORD.some(b=>b.code===id))await save('orders',id,{code:id,deleted:true,cus:o.cus,lines:[]});else await remove('orders',id);closeDrawer();toast('Đã xóa đơn '+id)}catch(e){}}
  else if(a==='delcust'){
    const n=ORD.filter(o=>o.cus===id).length;
    if(n){toast('Khách còn '+n+' đơn hàng nên chưa thể xóa. Hãy xóa hoặc chuyển các đơn trước.');return}
    if(!arm(t,'cu'+id,'Bấm lần nữa để xóa'))return;S.armed='';
    try{
      if(BASE_CUS.some(c=>c.id===id))await save('customers',id,{deleted:true});else await remove('customers',id);
      if(S.view==='customer'||S.cust===id){S.cust=null;S.view='customers'}
      closeDrawer();render();toast('Đã xóa khách hàng');
    }catch(e){}
  }
  else if(a==='delprice'){if(!arm(t,'pr'+id,'Bấm lần nữa để xóa'))return;S.armed='';try{if(BASE_PRICES.some(p=>p.id===id)||ESIM_BASE.some(p=>p.id===id))await save('prices',id,{deleted:true});else await remove('prices',id);closeDrawer();toast('Đã xóa dòng giá')}catch(e){}}
  else if(a==='delcontract'){
    if(!arm(t,'ct'+id,'Bấm lần nữa'))return;S.armed='';
    const c=LV('contracts')[id];
    try{await remove('contracts',id);if(c&&c.asset&&ASSETS)ASSETS.delete(c.asset).catch(()=>{});toast('Đã xóa hợp đồng')}catch(e){}
  }
  else if(a==='settle'){openForm(settleForm(id))}
  else if(a==='clearsettle'){const l=getLine(id);try{await setLineOp(l,{useDays:null});closeDrawer();toast('Đã bỏ kết toán')}catch(e){}}
  else if(a==='addstaff'){S.staffDraft=readStaff().concat([{id:uid('s'),name:'',title:'',email:'',authNo:'',authDate:''}]);render()}
  else if(a==='delstaff'){const L=readStaff();L.splice(+id,1);S.staffDraft=L;render()}
  else if(a==='resetterms'){const n=k=>dig($('s_'+k).value)||RULES0[k];const r={};Object.keys(RULES0).forEach(k=>r[k]=n(k));$('s_quoteTerms').value=termsFrom(r)}
  else if(a==='savesettings'){
    const g=k=>$('s_'+k).value;
    const doc={name:g('name').trim(),addr:g('addr').trim(),mst:g('mst').trim(),phone:g('phone').trim(),email:g('email').trim(),bankW:g('bankW').trim(),accW:g('accW').trim(),holderW:g('holderW').trim(),bankE:g('bankE').trim(),accE:g('accE').trim(),holderE:g('holderE').trim(),branchW:g('branchW').trim(),branchE:g('branchE').trim(),staff:readStaff().filter(x=>x.name),signer:g('signer').trim(),title:g('title').trim()||'Giám đốc',terms:+g('terms')||30,quoteTerms:g('quoteTerms')};
    Object.keys(RULES0).forEach(k=>{doc[k]=g(k).trim()!==''?dig(g(k)):RULES0[k]});
    if(doc.quoteTerms.trim()===SET().quoteTerms.trim())doc.quoteTerms='';
    try{await save('settings','company',doc);S.staffDraft=null;toast('Đã lưu thông tin công ty')}catch(e){}
  }
  /* biểu mẫu đang mở */
  else if(a==='formsubmit'){if(CUR){t.disabled=true;try{await CUR.submit()}finally{t.disabled=false}}}
  else if(a==='fadd'){if(CUR&&CUR.add)CUR.add()}
  else if(a==='fdel'){if(CUR&&CUR.del)CUR.del(id)}
  else if(a==='newstmt'){openForm(statementForm(null,id?{cus:id}:null))}
  else if(a==='dtpick'){dtPick(t)}
  else if(a==='lang'){setLang(id)}
  else if(a==='stsegadd'){if(CUR&&CUR.segAdd)CUR.segAdd(+id)}
  else if(a==='stsegdel'){const p=String(id).split('|');if(CUR&&CUR.segDel)CUR.segDel(+p[0],+p[1])}
  else if(a==='stgoorder'){const o=ORD.find(x=>x.code===id);if(o&&CUR&&CUR.refreshLines){window.STMT_STASH=CUR;openForm(orderForm(orderEditPre(o),o.code))}}
  else if(a==='stfee'){if(CUR&&CUR.addFee)CUR.addFee(+id)}
  else if(a==='stimgdel'){const p=String(id).split('|');if(CUR&&CUR.delImg)CUR.delImg(+p[0],+p[1])}
  else if(a==='stinv'){openForm(stmtInvoiceForm(id))}
  else if(a==='sttab'){S.f.statements.tab=id;render()}
  else if(a==='stfilter'){S.f.statements.per=id;render()}
  else if(a==='stmake'){const r=stRange('all',id);openForm(statementForm(null,{cus:id,from:r[0],to:r[1]}))}
  else if(a==='stper'){if(CUR&&CUR.setPer)CUR.setPer(id)}
  else if(a==='stopen'){if(CUR&&CUR.toggleOpen)CUR.toggleOpen(+id)}
  else if(a==='stimp'){if(CUR&&CUR.impText)CUR.impText()}
  else if(a==='stclr'){if(CUR&&CUR.clearUsage)CUR.clearUsage()}
  else if(a==='qpt'){const p=String(id).split('|');if(CUR&&CUR.setPt)CUR.setPt(+p[0],p[1])}
  else if(a==='qcadd'){if(CUR&&CUR.qcAdd)CUR.qcAdd(+id)}
  else if(a==='qcdel'){const p=String(id).split('|');if(CUR&&CUR.qcDel)CUR.qcDel(+p[0],+p[1])}
});
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape')closeDrawer();
  if(ev.key==='Enter'){const t=ev.target;if(t.matches&&t.matches('tr.row[data-act]'))t.click()}
});
const coerce=el=>{const t=el.dataset.t;if(t==='money')return +String(el.value).replace(/\D/g,'')||0;if(t==='bool')return el.checked;if(t==='num')return el.value===''?0:Number(el.value);return el.value};
document.addEventListener('input',ev=>{
  const t=ev.target;
  if(t.classList&&t.classList.contains('sfind')){
    const sel=t.parentNode.querySelector('select');if(!sel)return;
    if(!sel._all)sel._all=Array.from(sel.options).map(o=>[o.value,o.textContent]);
    const nz=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'d').toLowerCase();
    const toks=nz(t.value).split(/\s+/).filter(Boolean);const cur=sel.value;
    const list=sel._all.filter((x,i)=>i===0||x[0]===cur||toks.every(k=>nz(x[1]).includes(k)));
    sel.innerHTML=list.map(x=>`<option value="${esc(x[0])}"${x[0]===cur?' selected':''}>${esc(x[1])}</option>`).join('');
    sel.size=toks.length?Math.min(7,Math.max(2,list.length)):0;if(!toks.length)sel.removeAttribute('size');
    return;
  }
  if(t.dataset&&t.dataset.money!==undefined){fmtMoneyEl(t);return}
  if(t.dataset&&t.dataset.k&&CUR){
    if(t.tagName==='SELECT'||t.type==='checkbox'||t.type==='date')return;
    if(t.dataset.t==='money')fmtMoneyEl(t);
    sp(CUR.s,t.dataset.k,coerce(t));if(CUR.onInput)CUR.onInput(t.dataset.k,t);return;
  }
  if(t.id==='ofmin'){fmtMoneyEl(t);S.f.orders.min=String(t.value).replace(/\D/g,'');drawOrders();return}
  {const OF={ofc:'code',ofk:'cname',ofd:'dev',ofdate:'date',ofinv:'invno',ofidate:'invdate'};if(OF[t.id]){S.f.orders[OF[t.id]]=t.value;drawOrders();return}}
  if(t.id==='ocu'){const f=S.f.orders;f.cuqF=t.value;if(!t.value.trim()&&f.cus){f.cus='';drawOrders()}ocuFill();return}
  if(t.id==='oq'){S.f.orders.q=t.value;drawOrders()}
  else if(t.id==='dq'){S.f.devices.q=t.value;drawDevices()}
  else if(t.id==='cq'){S.f.customers.q=t.value;drawCustomers()}
  else if(t.id==='gq'){S.f.discounts.q=t.value;drawDiscounts()}
  else if(t.id==='cq2'){S.f.comm.q=t.value;drawComm()}
  else if(t.id==='qq'){S.f.quotes.q=t.value;drawQuotes()}
  else if(t.id==='hq'){S.f.handovers.q=t.value;drawHandovers()}
  else if(t.id==='pq'){S.f.prices.q=t.value;drawPrices()}
  else if(t.id==='rq'){S.f.payreqs.q=t.value;drawPayreqs()}
  else if(t.id==='kpq'){S.f.statements.pq=t.value;drawStatements()}
  else if(t.id==='kq'){S.f.statements.q=t.value;drawStatements()}
});
document.addEventListener('keydown',ev=>{const t=ev.target;if(ev.key==='Enter'&&t.classList&&t.classList.contains('sfind')){ev.preventDefault();const sel=t.parentNode.querySelector('select');if(!sel)return;const m=Array.from(sel.options).find((x,i)=>x.value!==''&&i>0)||null;if(m){sel.value=m.value;sel.dispatchEvent(new Event('change',{bubbles:true}))}}});
document.addEventListener('change',ev=>{
  const t=ev.target;
  if(t.id==='cfile'&&CUR&&CUR.setFile){CUR.setFile(t.files&&t.files[0]);return}
  if(t.dataset&&t.dataset.qr!==undefined&&CUR&&CUR.setQr){CUR.setQr(+t.dataset.qr,t.files&&t.files[0]);return}
  if(t.dataset&&t.dataset.k&&CUR){
    sp(CUR.s,t.dataset.k,coerce(t));
    if(t.tagName==='SELECT'||t.type==='checkbox'||t.type==='date'||t.dataset.cs){if(CUR.onChange)CUR.onChange(t.dataset.k,t)}
    return;
  }
  if(t.classList&&t.classList.contains('ivsel')){t.className='ivsel iv-'+(t.value||'none');setInvStatus(t.dataset.code,t.value);toast('Đã cập nhật trạng thái hóa đơn');return}
  if(t.id==='bulkiv'){const v=t.value;if(!v)return;const codes=Object.keys(S.f.orders.sel);(async()=>{for(const c of codes){try{await setInvStatus(c,v==='none'?'':v)}catch(e){}}toast('Đã cập nhật trạng thái hóa đơn cho '+codes.length+' đơn');if(S.view==='orders')drawOrders()})();return}
  const m={cm:['comm','m'],cs2:['comm','s'],ctm:['comm','cm2'],oinv:['orders','inv'],os:['orders','status'],oa:['orders','area'],osrc:['orders','src'],op:['orders','pay'],ds:['devices','state'],dl:['devices','loc'],dh:['devices','holder'],qs:['quotes','status'],pk:['prices','kind'],pr:['prices','region'],ps:['prices','src']}[t.id];
  if(m){S.f[m[0]][m[1]]=t.value;DRAW[m[0]]()}
  else if(t.id==='oi'){S.f.orders.issue=t.checked;drawOrders()}
  else if(t.id&&t.id.indexOf('rs_')===0){S.rep.sheets[t.id.slice(3)]=t.checked}
  else if(t.id==='rfrom'){S.rep.from=t.value}
  else if(t.id==='rto'){S.rep.to=t.value}
});
window.addEventListener('hashchange',()=>{const v=(location.hash||'').slice(1);if(VIEWS[v]&&v!=='customer'&&v!==S.view){S.view=v;S.cust=null;render()}});


/* ============ Ô chọn có lọc (combobox) ============ */
(function(){
  const nz=s=>String(s).normalize('NFC').split('').map(c=>c.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[đĐ]/g,'d').toLowerCase()[0]||'').join('');
  const isM=n=>/nước|asean|châu|global|toàn cầu|world|,/i.test(n);
  let act=null,idx=-1;
  const close=()=>{if(act){act.l.hidden=true;act=null;idx=-1}};
  const hl=(name,toks)=>{const f=nz(name);let a=-1,b=-1;for(const t of toks){const i=f.indexOf(t);if(i>=0){a=i;b=i+t.length;break}}const e=esc;return a<0?e(name):e(name.slice(0,a))+'<mark>'+e(name.slice(a,b))+'</mark>'+e(name.slice(b))};
  function draw(w,q){
    const inp=w.querySelector('input'),l=w.querySelector('.cbx-l');
    if(!w._o)try{w._o=JSON.parse(w.dataset.opts)}catch(e){w._o=[]}
    const toks=nz(q).split(/\s+/).filter(Boolean);
    const list=w._o.filter(n=>toks.every(t=>nz(n).includes(t)));
    const one=list.filter(n=>!isM(n)),mul=list.filter(isM);
    const item=n=>`<div class="cbx-i${n===inp.value?' sel':''}" data-v="${esc(n)}">${hl(n,toks)}</div>`;
    l.innerHTML=(one.length?(mul.length?'<div class="cbx-g">Quốc gia</div>':'')+one.map(item).join(''):'')+(mul.length?'<div class="cbx-g">Gói nhiều nước</div>'+mul.map(item).join(''):'')||'<div class="cbx-e">Không có kết quả — vẫn có thể gõ tên tự do.</div>';
    l.hidden=false;act={w,l,inp};idx=-1;
  }
  let skip=false;function pick(v){const a=act;if(!a)return;a.inp.value=v;close();skip=true;try{a.inp.blur()}catch(e){}try{a.inp.dispatchEvent(new Event('input',{bubbles:true}));a.inp.dispatchEvent(new Event('change',{bubbles:true}))}finally{skip=false}}
  const mark=()=>{if(!act)return;const it=act.l.querySelectorAll('.cbx-i');it.forEach((x,i)=>x.classList.toggle('on',i===idx));if(it[idx])it[idx].scrollIntoView({block:'nearest'})};
  document.addEventListener('focusin',ev=>{const t=ev.target,w=t.closest&&t.closest('.cbx');if(!w||t.tagName!=='INPUT'){return}if(act&&act.w!==w)close();draw(w,'');t.select&&t.select()});
  document.addEventListener('input',ev=>{const t=ev.target,w=t.closest&&t.closest('.cbx');if(w&&t.tagName==='INPUT'&&!skip)draw(w,t.value)});
  document.addEventListener('keydown',ev=>{if(!act||ev.target!==act.inp)return;const it=act.l.querySelectorAll('.cbx-i');
    if(ev.key==='ArrowDown'){ev.preventDefault();idx=Math.min(it.length-1,idx+1);mark()}
    else if(ev.key==='ArrowUp'){ev.preventDefault();idx=Math.max(0,idx-1);mark()}
    else if(ev.key==='Enter'){if(it.length&&idx<0&&act.inp.value.trim()===''){}else if(it.length){ev.preventDefault();pick(it[idx>=0?idx:0].dataset.v)}}
    else if(ev.key==='Escape'){ev.stopPropagation();close()}},true);
  document.addEventListener('mousedown',ev=>{const i=ev.target.closest&&ev.target.closest('.cbx-i');if(i){ev.preventDefault();pick(i.dataset.v)}});
  document.addEventListener('focusout',ev=>{if(act&&ev.target===act.inp)setTimeout(close,0)});
})();

/* ============ KHỞI ĐỘNG ============ */
(function(){
  let v='';try{v=(location.hash||'').slice(1)}catch(e){}
  if(VIEWS[v]&&v!=='customer')S.view=v;
  rebuild();render();
  initData().catch(e=>{console.error(e);setDbState('off')});
})();

/* ô ngày dd/mm/yyyy */
(function(){
  const iso=v=>{const m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);if(!m)return null;const d=new Date(+m[3],+m[2]-1,+m[1]);return d.getFullYear()==+m[3]&&d.getMonth()==+m[2]-1&&d.getDate()==+m[1]?m[3]+'-'+m[2]+'-'+m[1]:null};
  const push=(tw,val)=>{if(tw.value===val)return;tw.value=val;tw.dispatchEvent(new Event('input',{bubbles:true}));tw.dispatchEvent(new Event('change',{bubbles:true}))};
  document.addEventListener('input',ev=>{
    const t=ev.target;if(!(t.classList&&t.classList.contains('dt')))return;
    const d=t.value.replace(/\D/g,'').slice(0,8);let o=d.slice(0,2);if(d.length>2)o+='/'+d.slice(2,4);if(d.length>4)o+='/'+d.slice(4);
    if(ev.inputType!=='deleteContentBackward')t.value=o;
    const tw=t.parentNode.querySelector('.dtn');
    if(!t.value){push(tw,'');return}
    const v=iso(t.value);if(v)push(tw,v);
  },true);
  document.addEventListener('focusout',ev=>{
    const t=ev.target;if(!(t.classList&&t.classList.contains('dt')))return;
    const tw=t.parentNode.querySelector('.dtn');const v=iso(t.value);
    if(t.value&&!v){t.value=tw.value?tw.value.split('-').reverse().join('/'):''}
  });
  document.addEventListener('change',ev=>{
    const t=ev.target;if(!(t.classList&&t.classList.contains('dtn')))return;
    const tx=t.parentNode.querySelector('.dt');if(tx)tx.value=t.value?t.value.split('-').reverse().join('/'):'';
  },true);
  window.dtPick=b=>{const tw=b.parentNode.querySelector('.dtn');try{tw.showPicker()}catch(e){tw.focus();tw.click()}};
})();
