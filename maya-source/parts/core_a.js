/* ============ TIỆN ÍCH ============ */
const LOADED_AT=(()=>{const d=new Date(),p=n=>String(n).padStart(2,"0");return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`})();
const EN_DICT=[['XUẤT NHẬP KHẨU','IMPORT EXPORT'],['MỘT THÀNH VIÊN','ONE MEMBER'],['CAO SU','RUBBER'],['ĐẦU TƯ','INVESTMENT'],['XÂY DỰNG','CONSTRUCTION'],['THƯƠNG MẠI','TRADING'],['DỊCH VỤ','SERVICE'],['SẢN XUẤT','MANUFACTURING'],['CÔNG NGHIỆP','INDUSTRIAL'],['KỸ THUẬT','ENGINEERING'],['DU LỊCH','TRAVEL'],['VẬN TẢI','TRANSPORT'],['CƠ KHÍ','MECHANICAL'],['CÔNG NGHỆ','TECHNOLOGY'],['GIẢI PHÁP','SOLUTIONS'],['TƯ VẤN','CONSULTING'],['PHÁT TRIỂN','DEVELOPMENT'],['VIỆT NAM','VIETNAM'],['HÀ NỘI','HANOI'],['HỒ CHÍ MINH','HO CHI MINH'],['CHI NHÁNH','BRANCH'],['VĂN PHÒNG ĐẠI DIỆN','REPRESENTATIVE OFFICE'],['QUỐC TẾ','INTERNATIONAL'],['ĐIỆN TỬ','ELECTRONICS'],['ĐIỆN','ELECTRIC'],['THỰC PHẨM','FOOD'],['GIÁO DỤC','EDUCATION'],['NHẬT BẢN','JAPAN'],['HÀN QUỐC','KOREA'],['TỔNG HỢP','GENERAL'],['VÀ','AND']];
function toEn(s){
  let t=String(s||'').toUpperCase().replace(/\s+/g,' ').trim();if(!t)return '';
  let suf='';
  const pre=[[/^CÔNG TY TNHH MTV\s+/,'CO., LTD'],[/^CÔNG TY TNHH MỘT THÀNH VIÊN\s+/,'CO., LTD'],[/^CÔNG TY TNHH\s+/,'CO., LTD'],[/^CÔNG TY CỔ PHẦN\s+/,'JOINT STOCK COMPANY'],[/^CÔNG TY CP\s+/,'JOINT STOCK COMPANY'],[/^CÔNG TY\s+/,'COMPANY'],[/^DOANH NGHIỆP TƯ NHÂN\s+/,'PRIVATE ENTERPRISE'],[/^CHI NHÁNH CÔNG TY\s+/,'COMPANY BRANCH']];
  for(const [re,v] of pre){if(re.test(t)){t=t.replace(re,'');suf=v;break}}
  EN_DICT.forEach(([vi,en])=>{t=t.replace(new RegExp('(^| )'+vi+'(?= |$)','g'),'$1'+en)});
  t=t.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/\s+/g,' ').trim();
  return (t+(suf?(/[A-Z]$/.test(t)&&suf.charAt(0)!==','?' ':'')+suf:'')).trim();
}
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const TODAY=iso(new Date());
const P=s=>{const a=s.split('-').map(Number);return new Date(a[0],a[1]-1,a[2])};
const dayDiff=(a,b)=>Math.round((P(b)-P(a))/864e5);
const addDays=(s,n)=>{const d=P(s);d.setDate(d.getDate()+n);return iso(d)};
const addMonths=(s,n)=>{const d=P(s);const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return iso(d)};
const fmtD=s=>s?s.split('-').reverse().join('/'):'—';
const fmtS=s=>s?s.split('-').reverse().slice(0,2).join('/'):'—';
const vnd=n=>{const v=Math.round(n||0);return (v<0?'-':'')+String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g,'.')};
const vndS=n=>Math.abs(n)>=1e6?(n/1e6).toFixed(1).replace('.',',')+' tr':vnd(n);
const sum=(a,f)=>a.reduce((t,x)=>t+f(x),0);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
const safeId=s=>String(s).trim().replace(/[^A-Za-z0-9_\-.~:@+]/g,'-').slice(0,120);
const gp=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const sp=(o,p,v)=>{const ks=p.split('.');const last=ks.pop();const t=ks.reduce((a,k)=>a[k],o);t[last]=v};
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);

/* Số tiền bằng chữ (tiếng Việt) */
function vnWords(n){
  n=Math.round(n||0);if(n===0)return 'Không đồng';
  const d=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
  const three=(x,full)=>{
    const tr=Math.floor(x/100),ch=Math.floor(x%100/10),dv=x%10;let s='';
    if(tr>0||full)s=d[tr]+' trăm';
    if(ch>1){s+=(s?' ':'')+d[ch]+' mươi';if(dv===1)s+=' mốt';else if(dv===4)s+=' tư';else if(dv===5)s+=' lăm';else if(dv>0)s+=' '+d[dv]}
    else if(ch===1){s+=(s?' ':'')+'mười';if(dv===5)s+=' lăm';else if(dv>0)s+=' '+d[dv]}
    else if(dv>0){s+=(tr>0||full)?' lẻ '+d[dv]:d[dv]}
    return s.trim();
  };
  const neg=n<0;n=Math.abs(n);
  const groups=[];while(n>0){groups.push(n%1000);n=Math.floor(n/1000)}
  const units=['',' nghìn',' triệu',' tỷ',' nghìn tỷ',' triệu tỷ'];
  const parts=[];
  for(let i=groups.length-1;i>=0;i--){
    if(groups[i]===0)continue;
    parts.push(three(groups[i],i<groups.length-1)+units[i]);
  }
  let r=parts.join(' ');
  r=r.charAt(0).toUpperCase()+r.slice(1);
  return (neg?'Âm ':'')+r+' đồng chẵn';
}

