/* ============ CẤU HÌNH API GOOGLE APPS SCRIPT ============ */
const GAS_WEB_APP_URL = 'ĐIỀN_LINK_WEB_APP_URL_CỦA_BẠN_VÀO_ĐÂY'; // Sẽ lấy ở bước cuối cùng

/* ============ LƯU TRỮ VÀ API ============ */
const $=id=>document.getElementById(id);
let CAN=true,DBSTATE='on';
const LSKEY='maya_rental_ops_v1';
const OFFLINE_MSG='Tính năng đính kèm file tạm tắt ở phiên bản offline';
const ASSETS={upload(){toast(OFFLINE_MSG);return Promise.reject({code:'offline'})},delete(){return Promise.resolve()}};

function persistLive(){try{localStorage.setItem(LSKEY,JSON.stringify(LIVE));return true}catch(e){toast('Bộ nhớ trình duyệt đã đầy.');return false}}
function downloadBlob(filename,data,type){
  const blob=data instanceof Blob?data:new Blob([data],{type:type||'application/octet-stream'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1500);
}
const COLS=['orders','orderops','lineops','customers','devices','invoices','prices','quotes','handovers','payreqs','statements','contracts','settings'];

function setDbState(s){
  DBSTATE=s;const e=$('dbs');if(!e)return;
  e.className='dbs '+(s==='on'?'on':s==='off'?'off':s==='connecting'?'connecting':'');
  e.lastChild.textContent={on:'Đã đồng bộ Google Sheets',off:'Lưu tạm trên trình duyệt',connecting:'Đang đồng bộ Sheets…'}[s];
}

let rt;function scheduleRefresh(){clearTimeout(rt);rt=setTimeout(()=>{rebuild();renderSoft()},40)}

async function save(col,id,data){
  (LIVE[col]=LIVE[col]||{})[id]=data;
  persistLive(); rebuild(); renderSoft();
  if (GAS_WEB_APP_URL) {
    try {
      fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ collection: col, id: id, data: data })
      });
    } catch (e) { console.warn("Lỗi API:", e); }
  }
}

async function remove(col,id){
  if(LIVE[col])delete LIVE[col][id];
  persistLive(); rebuild(); renderSoft();
  if (GAS_WEB_APP_URL) {
    fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ collection: col, id: id, deleted: true })
    });
  }
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
  let st={};
  try{const raw=localStorage.getItem(LSKEY);if(raw){const o=JSON.parse(raw);if(o&&typeof o==='object')st=o}}catch(e){st={}}
  COLS.forEach(c=>{LIVE[c]=(st[c]&&typeof st[c]==='object')?st[c]:{}});
  rebuild(); renderSoft();
  if (GAS_WEB_APP_URL) {
    setDbState('connecting');
    try {
      const response = await fetch(GAS_WEB_APP_URL);
      const serverData = await response.json();
      if (serverData && !serverData.error) {
        COLS.forEach(c => {
          if (serverData[c]) Object.assign(LIVE[c] = LIVE[c] || {}, serverData[c]);
        });
        persistLive(); setDbState('on'); rebuild(); renderSoft();
      } else { setDbState('on'); }
    } catch (e) { setDbState('on'); }
  } else { setDbState('on'); }
}
