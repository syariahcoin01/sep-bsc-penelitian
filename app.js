/* SEP & BSC Studio – website pendamping pelatihan (PWA) */
(function(){
"use strict";
const D=window.DATA, $=s=>document.querySelector(s), app=$("#app");
const COLORS=["#FF7A1A","#00A6A6","#E63E8C","#7B4FE0","#2EBD6B","#3BA7FF","#FFC93C","#1B2A6B"];
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=(n,d=2)=>isFinite(n)?Number(n).toLocaleString("id-ID",{maximumFractionDigits:d,minimumFractionDigits:0}):"–";

/* ---------- storage (aman bila diblokir) ---------- */
const KEY="sepbsc-riset-v1"; let ST={};
try{ST=JSON.parse(localStorage.getItem(KEY)||"{}")||{};}catch(e){ST={};}
/* undo/redo: snapshot diambil sekali per rangkaian perubahan (jeda 1 detik) */
let UNDO=[],REDO=[],LAST=JSON.stringify(ST),BURST=null,PAGEKEYS=new Set();
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(ST));}catch(e){}};
const save=()=>{const now=JSON.stringify(ST);if(now===LAST)return;if(!BURST){UNDO.push(LAST);if(UNDO.length>60)UNDO.shift();REDO=[];}clearTimeout(BURST);BURST=setTimeout(()=>{BURST=null;},1000);LAST=now;persist();updUndo();};
const get=(k,def)=>{PAGEKEYS.add(k);if(ST[k]===undefined) ST[k]=JSON.parse(JSON.stringify(def)); return ST[k];};
function updUndo(){const u=document.getElementById("undoBtn"),r=document.getElementById("redoBtn");if(u){u.disabled=!UNDO.length;u.title="Batalkan perubahan terakhir ("+UNDO.length+" langkah tersimpan)";}if(r)r.disabled=!REDO.length;}
function undo(){if(!UNDO.length){toast("Tidak ada perubahan untuk dibatalkan");return;}clearTimeout(BURST);BURST=null;REDO.push(JSON.stringify(ST));ST=JSON.parse(UNDO.pop());LAST=JSON.stringify(ST);persist();route(true);toast("↶ Perubahan dibatalkan");}
function redo(){if(!REDO.length)return;UNDO.push(JSON.stringify(ST));ST=JSON.parse(REDO.pop());LAST=JSON.stringify(ST);persist();route(true);toast("↷ Perubahan diulang");}
function snapshotNow(){clearTimeout(BURST);BURST=null;}
async function resetMenu(){const k=(location.hash||"#beranda").slice(1);const keys=[...PAGEKEYS];
  const w=document.createElement("div");w.id="lightbox";w.style.cursor="default";
  w.innerHTML=`<div class="card" role="dialog" aria-modal="true" style="max-width:560px;width:100%;margin:0"><h3 style="margin-top:0;color:var(--navy)">Reset / kembali ke asal</h3>
  <p class="small">Semua tindakan di bawah ini masih bisa dibatalkan lagi dengan tombol ↶ Batalkan.</p>
  <div class="grid" style="gap:8px">
  <button class="btn line" data-r="undo">↶ Batalkan perubahan terakhir saja</button>
  <button class="btn o" data-r="page" ${keys.length?"":"disabled"}>⟲ Kembalikan halaman ini ke contoh awal${keys.length?"":" (tidak ada data)"}</button>
  <button class="btn p" data-r="all">🗑 Hapus SEMUA pekerjaan di semua modul</button>
  <button class="btn line" data-r="no">Tutup</button></div></div>`;
  const done=()=>w.remove();w.onclick=e=>{if(e.target===w)done();};
  w.querySelectorAll("[data-r]").forEach(b=>b.onclick=e=>{e.stopPropagation();const r=b.dataset.r;done();
    if(r==="undo")undo();
    if(r==="page"){snapshotNow();keys.forEach(x=>delete ST[x]);save();snapshotNow();route(true);toast("Halaman dikembalikan ke contoh awal");}
    if(r==="all"){snapshotNow();ST={};save();snapshotNow();route(true);toast("Semua pekerjaan dihapus (bisa dibatalkan)");}});
  document.body.appendChild(w);w.querySelector("[data-r=undo]").focus();}
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==="z"&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();undo();}});

/* ---------- utilities ---------- */
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove("on"),1800);}
async function copy(text){
  try{await navigator.clipboard.writeText(text);}catch(e){const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");}catch(_){ } ta.remove();}
  toast("Tersalin ke clipboard ✓");
}
function download(name,content,type="text/plain"){const b=content instanceof Blob?content:new Blob([content],{type});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
function tableTSV(head,rows){return [head,...rows].map(r=>r.join("\t")).join("\n");}
function tableHTML(head,rows,cls=""){return `<div class="tw"><table class="${cls}"><thead><tr>${head.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;}
let COPYREG=[]; const reg=t=>{COPYREG.push(t);return COPYREG.length-1;};
document.addEventListener("click",e=>{
  const c=e.target.closest("[data-copy]"); if(c){copy(COPYREG[+c.dataset.copy]);}
  const im=e.target.closest("figure img"); if(im){const lb=document.createElement("div");lb.id="lightbox";lb.innerHTML=`<img src="${im.src}" alt="${esc(im.alt)}">`;lb.onclick=()=>lb.remove();document.body.appendChild(lb);}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){const l=$("#lightbox");if(l){const b=l.querySelector("[data-b=no]");b?b.click():l.remove();}}});
const copyBtn=(text,label="Salin")=>`<button class="btn sm line" data-copy="${reg(text)}">📋 ${label}</button>`;

/* ---------- dialog dalam halaman (pengganti prompt/confirm) ---------- */
function dlg(title,fields=[],opt={}){return new Promise(res=>{const w=document.createElement("div");w.id="lightbox";w.style.cursor="default";
  w.innerHTML=`<div class="card" role="dialog" aria-modal="true" style="max-width:520px;width:100%;margin:0"><h3 style="margin-top:0;color:var(--navy)">${esc(title)}</h3>${fields.map((f,i)=>`<label class="f">${esc(f.label)}</label>${f.multi?`<textarea data-dl="${i}">${esc(f.value||"")}</textarea>`:`<input data-dl="${i}" value="${esc(f.value||"")}">`}`).join("")}<div class="row" style="margin-top:14px;justify-content:flex-end">${opt.del?`<button class="btn p" data-b="del" style="margin-right:auto">🗑 ${esc(opt.del)}</button>`:""}<button class="btn line" data-b="no">Batal</button><button class="btn" data-b="ok">${esc(opt.ok||"Simpan")}</button></div></div>`;
  const done=v=>{w.remove();res(v);};w.onclick=e=>{if(e.target===w)done(null);};
  w.querySelectorAll("[data-b]").forEach(b=>b.onclick=e=>{e.stopPropagation();const k=b.dataset.b;done(k==="ok"?[...w.querySelectorAll("[data-dl]")].map(x=>x.value):k==="del"?"DEL":null);});
  w.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.tagName==="INPUT"){e.preventDefault();w.querySelector('[data-b=ok]').click();}});
  document.body.appendChild(w);const f=w.querySelector("[data-dl]");(f||w.querySelector("[data-b=ok]")).focus();});}
/* ---------- render blok materi ---------- */
function blocks(bs,chap){
  let fi=0,ti=0;
  return bs.map(b=>{
    if(b.t==="p") return `<p>${esc(b.x)}</p>`;
    if(b.t==="h2") return `<h2>${esc(b.x)}</h2>`;
    if(b.t==="h3") return `<h3>${esc(b.x)}</h3>`;
    if(b.t==="ul") return `<ul>${b.x.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
    if(b.t==="ol") return `<ol>${b.x.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>`;
    if(b.t==="fig"){fi++;return `<figure><img loading="lazy" src="img/${b.f}" alt="${esc(b.c)}"><figcaption>Gambar ${chap}.${fi} ${esc(b.c)}</figcaption></figure>`;}
    if(b.t==="table"){ti++;return `<div class="row" style="justify-content:space-between;margin-top:12px"><b style="color:var(--orange)">Tabel ${chap}.${ti} <i style="color:var(--muted);font-weight:400">${esc(b.cap)}</i></b>${copyBtn(tableTSV(b.head,b.rows),"Salin tabel")}</div>${tableHTML(b.head,b.rows)}`;}
    if(b.t==="box") return `<div class="box ${b.k}"><b class="t">${esc(b.title)}</b>${b.k==="praktik"?"<ol>":"<ul>"}${b.x.map(x=>`<li>${esc(x)}</li>`).join("")}${b.k==="praktik"?"</ol>":"</ul>"}<div style="text-align:right">${copyBtn(b.title+"\n"+b.x.map((x,i)=>(b.k==="praktik"?(i+1)+". ":"• ")+x).join("\n"))}</div></div>`;
    if(b.t==="code") return `<div class="copywrap"><pre>${esc(b.x.join("\n"))}</pre>${copyBtn(b.x.join("\n"))}</div>`;
    if(b.t==="gallery") return `<div class="gal">${b.x.map(([f,c])=>`<figure><img loading="lazy" src="img/${f}" alt="${esc(c)}"><figcaption>${esc(c)}</figcaption></figure>`).join("")}</div>`;
    return "";
  }).join("");
}
const plain=bs=>bs.map(b=>b.t==="p"||b.t==="h2"||b.t==="h3"?b.x:b.t==="ul"||b.t==="ol"?b.x.map(x=>"- "+x).join("\n"):b.t==="table"?b.cap+"\n"+tableTSV(b.head,b.rows):b.t==="box"?b.title+"\n"+b.x.join("\n"):b.t==="code"?b.x.join("\n"):"").filter(Boolean).join("\n\n");

/* ======================= HALAMAN ======================= */
const P={};
P.beranda=()=>`
<section class="hero"><img src="img/collage_wide.jpg" alt="Kolase ilustrasi kampus, rapat strategi, dashboard, wisuda, strategy map, dan sticky notes"><div class="stripe">${COLORS.slice(0,6).map(c=>`<i style="background:${c}"></i>`).join("")}</div>
<div class="txt"><span class="badge">3 Hari · 24 JP</span><span class="badge" style="background:var(--teal)">IKU 358/M/KEP/2025</span><span class="badge" style="background:var(--pink)">Offline-ready PWA</span>
<h1>${esc(D.title)}</h1><p>${esc(D.author)} · bersama ${esc(D.org)}</p></div></section>
<div class="card"><h2 style="margin-top:0">Apa yang bisa Anda lakukan di sini?</h2>
<p>Website ini mendampingi buku tutorial dan presentasi pelatihan. Semua materi dapat <b>disalin</b>, setiap latihan dapat <b>dikerjakan langsung</b>, dan hasilnya tersimpan di peramban Anda. Gunakan tombol <b>Ekspor</b> untuk menyimpan pekerjaan kelompok sebagai berkas JSON, lalu <b>Impor</b> di perangkat lain.</p></div>
<div class="grid g4">
${[["#silabus","Silabus 24 JP","Rincian per JP, jadwal & output",0],["#materi","Materi Tutorial","14 bab + lampiran, siap salin",1],["#swot","SWOT → TOWS","Susun strategi berbasis skor",2],["#map","Strategy Map Builder","Seret kartu, tarik panah, ekspor PNG",3],["#kpi","Kalkulator IKU","AEE, IKU 2, IKU 3, Slovin, target",4],["#scorecard","Scorecard & Dashboard","RAG otomatis & grafik",5],["#cascade","Matriks Cascading","Univ → fakultas → prodi → individu",6],["#renstra","Generator Renstra","Draf Bab I–V otomatis",7]].map(([h,t,s,i])=>`<a class="tile" href="${h}" style="background:${COLORS[i]};${i===6?"color:#1B2A6B":""}"><b>${t}</b><span>${s}</span></a>`).join("")}
</div>
<div class="card" style="margin-top:18px"><h2 style="margin-top:0">Alur belajar</h2><figure><img src="img/f01_roadmap.jpg" alt="Peta perjalanan pelatihan 3 hari"><figcaption>Peta perjalanan pelatihan 3 hari (24 JP)</figcaption></figure></div>`;

P.silabus=()=>{
  const day=["","Hari 1 — Berpikir Strategis & Analisis Lingkungan","Hari 2 — Balanced Scorecard & Strategy Map","Hari 3 — Cascading, Dashboard & Eksekusi"];
  const all=tableTSV(["Hari","JP","Waktu","Tujuan","Materi","Metode","Output"],D.syl.map(r=>[r[0],r[1],D.times[(r[1]-1)%8],r[2],r[3],r[4],r[5]]));
  let h=`<h1>Silabus Pelatihan 24 JP</h1><p>1 JP = 45 menit · 8 JP per hari · rasio teori:praktik ≈ 30:70.</p><div class="toolbar">${copyBtn(all,"Salin seluruh silabus (tempel ke Excel/Docs)")}<select id="sylDay" style="width:auto"><option value="0">Semua hari</option><option value="1">Hari 1</option><option value="2">Hari 2</option><option value="3">Hari 3</option></select><input id="sylQ" placeholder="Cari topik, metode, output…" style="max-width:320px"></div><div id="sylList"></div>
  <div class="card"><h2 style="margin-top:0">Evaluasi Kirkpatrick</h2><figure><img src="img/f03_kirkpatrick.jpg" alt="Model Kirkpatrick"></figure></div>`;
  setTimeout(()=>{const draw=()=>{const d=+$("#sylDay").value,q=$("#sylQ").value.toLowerCase();let out="";[1,2,3].forEach(k=>{if(d&&d!==k)return;const rows=D.syl.filter(r=>r[0]===k&&(!q||r.join(" ").toLowerCase().includes(q)));if(!rows.length)return;out+=`<div class="card"><h2 style="margin-top:0">${day[k]}</h2>${rows.map(r=>`<div class="jp"><div class="n day${k}">JP ${r[1]}<br><small>${D.times[(r[1]-1)%8]}</small></div><div><b>${esc(r[2])}</b><div class="small">Materi: ${esc(r[3])}</div><span class="chip">🛠 ${esc(r[4])}</span><span class="chip">📦 ${esc(r[5])}</span></div></div>`).join("")}</div>`;});$("#sylList").innerHTML=out||"<p>Tidak ada hasil.</p>";};$("#sylDay").onchange=draw;$("#sylQ").oninput=draw;draw();});
  return h;
};

P.materi=()=>`<h1>Materi Tutorial</h1><p>Klik bab untuk membuka. Setiap tabel, kotak praktik, dan rumus memiliki tombol salin; tombol “Salin bab” menyalin seluruh teks bab.</p>
${D.chapters.map((c,i)=>`<details ${i===0?"open":""}><summary>Bab ${i+1}. ${esc(c.title)}</summary><div class="inner"><div style="text-align:right">${copyBtn(`BAB ${i+1} ${c.title}\n\n`+plain(c.blocks),"Salin bab")}</div>${blocks(c.blocks,i+1)}</div></details>`).join("")}
<h2>Lampiran</h2>
${D.apps.map((a,i)=>`<details><summary>${esc(a.title)}</summary><div class="inner">${blocks(a.blocks,String.fromCharCode(65+i))}</div></details>`).join("")}`;

P.galeri=()=>`<h1>Galeri Visual</h1><p>${D.figs.length} visualisasi siap dipakai untuk slide, poster, atau dokumen. Klik untuk memperbesar; klik kanan untuk menyimpan.</p><input id="galQ" placeholder="Cari gambar… (mis. strategy map, IKU, dashboard)" style="max-width:380px;margin-bottom:14px"><div class="gal" id="galG"></div>`+(setTimeout(()=>{const draw=()=>{const q=$("#galQ").value.toLowerCase();$("#galG").innerHTML=D.figs.filter(f=>!q||f.c.toLowerCase().includes(q)).map(f=>`<figure><img loading="lazy" src="img/${f.f}" alt="${esc(f.c)}"><figcaption>${esc(f.c)} <a href="img/${f.f}" download>⬇</a></figcaption></figure>`).join("")};$("#galQ").oninput=draw;draw();}),"");

/* ---------- SWOT → TOWS ---------- */
P.swot=()=>{
  const S=get("swot",{S:"70% dosen bergelar S3\nLab data bersertifikat\nJejaring alumni di industri TI",W:"AEE S1 di bawah ideal\nPublikasi bereputasi rendah\nPendapatan non-UKT kecil",O:"IKU 3 mengakui magang ber-SKS\nKebutuhan talenta data & AI\nSkema hibah Diktisaintek",T:"Penurunan peminat usia kuliah\nBootcamp & kursus daring\nRegulasi berubah cepat",
    strat:[{k:"SO",t:"Riset terapan bersama industri memakai dosen S3 & lab data (IKU 5)",d:4,f:4},{k:"WO",t:"Magang/proyek industri ber-SKS di semester 7 sebagai bahan TA",d:5,f:4},{k:"ST",t:"Micro-credential bersertifikat untuk alumni & publik",d:3,f:4},{k:"WT",t:"Klinik skripsi & dosen PA proaktif",d:4,f:5}]});
  const q=(k,t,c)=>`<div><label class="f" style="color:${c}">${t}</label><textarea data-sw="${k}" rows="5">${esc(S[k])}</textarea></div>`;
  setTimeout(()=>{
    document.querySelectorAll("[data-sw]").forEach(el=>el.oninput=()=>{S[el.dataset.sw]=el.value;save();drawTows();});
    $("#addStrat").onclick=()=>{S.strat.push({k:$("#nk").value,t:$("#nt").value||"Strategi baru",d:3,f:3});save();drawStrat();};
    drawTows();drawStrat();
  });
  function drawTows(){const L=k=>S[k].split("\n").filter(Boolean).map(x=>`<li>${esc(x)}</li>`).join("");
    $("#towsBox").innerHTML=`<div class="tows"><div></div><div class="h" style="background:var(--green)">KEKUATAN (S)<br></div><div class="h" style="background:var(--red)">KELEMAHAN (W)</div>
    <div class="h" style="background:#3BA7FF">PELUANG (O)</div><div class="card" style="margin:0"><b>SO · Agresif</b><div class="small">Gunakan S untuk meraih O</div>${S.strat.filter(s=>s.k==="SO").map(s=>"• "+esc(s.t)).join("<br>")}</div><div class="card" style="margin:0"><b>WO · Perbaikan</b><div class="small">Perbaiki W dengan memanfaatkan O</div>${S.strat.filter(s=>s.k==="WO").map(s=>"• "+esc(s.t)).join("<br>")}</div>
    <div class="h" style="background:var(--orange)">ANCAMAN (T)</div><div class="card" style="margin:0"><b>ST · Diversifikasi</b><div class="small">Gunakan S untuk menangkal T</div>${S.strat.filter(s=>s.k==="ST").map(s=>"• "+esc(s.t)).join("<br>")}</div><div class="card" style="margin:0"><b>WT · Bertahan</b><div class="small">Minimalkan W & hindari T</div>${S.strat.filter(s=>s.k==="WT").map(s=>"• "+esc(s.t)).join("<br>")}</div></div>
    <details style="margin-top:10px"><summary>Lihat daftar faktor</summary><div class="inner grid g4"><div><b>S</b><ul>${L("S")}</ul></div><div><b>W</b><ul>${L("W")}</ul></div><div><b>O</b><ul>${L("O")}</ul></div><div><b>T</b><ul>${L("T")}</ul></div></div></details>`;}
  function drawStrat(){
    const rows=S.strat.map((s,i)=>({...s,i,sc:s.d*s.f})).sort((a,b)=>b.sc-a.sc);
    $("#stratT").innerHTML=`<div class="tw"><table><thead><tr><th>#</th><th>Tipe</th><th>Strategi</th><th>Dampak (1–5)</th><th>Kelayakan (1–5)</th><th>Skor</th><th></th></tr></thead><tbody>${rows.map((s,r)=>`<tr class="${r<4?"rag-H":""}"><td>${r+1}</td><td><b>${s.k}</b></td><td><input data-st="${s.i}" data-f="t" value="${esc(s.t)}"></td><td><input type="number" min="1" max="5" data-st="${s.i}" data-f="d" value="${s.d}"></td><td><input type="number" min="1" max="5" data-st="${s.i}" data-f="f" value="${s.f}"></td><td><b>${s.sc}</b></td><td><button class="btn sm p" data-del="${s.i}">✕</button></td></tr>`).join("")}</tbody></table></div><p class="small">Baris hijau = 4 strategi prioritas teratas (skor dampak × kelayakan).</p>`;
    document.querySelectorAll("[data-st]").forEach(el=>el.onchange=()=>{const s=S.strat[+el.dataset.st];s[el.dataset.f]=el.dataset.f==="t"?el.value:Math.max(1,Math.min(5,+el.value||1));save();drawStrat();drawTows();});
    document.querySelectorAll("[data-del]").forEach(el=>el.onclick=()=>{S.strat.splice(+el.dataset.del,1);save();drawStrat();drawTows();});
    drawTows();
  }
  return `<h1>SWOT → TOWS</h1><p>Isi faktor (satu per baris) berbasis data. Tambahkan strategi, beri skor, dan kirim strategi prioritas ke Strategy Map Builder.</p>
  <div class="card grid g4">${q("S","Kekuatan (S)","var(--green)")}${q("W","Kelemahan (W)","var(--red)")}${q("O","Peluang (O)","#3BA7FF")}${q("T","Ancaman (T)","var(--orange)")}</div>
  <div class="card"><h2 style="margin-top:0">Strategi TOWS & skor prioritas</h2><div class="row"><select id="nk" style="width:90px"><option>SO</option><option>WO</option><option>ST</option><option>WT</option></select><input id="nt" placeholder="Tulis strategi baru…" style="flex:1;min-width:220px"><button class="btn o" id="addStrat">+ Tambah</button></div><div id="stratT"></div>
  <div class="row"><button class="btn n" id="toMap">➜ Jadikan sasaran di Strategy Map</button><button class="btn line" id="cpTows">📋 Salin matriks TOWS</button></div></div>
  <div class="card"><h2 style="margin-top:0">Matriks TOWS</h2><div id="towsBox"></div></div>`+(setTimeout(()=>{
    $("#toMap").onclick=()=>{const M=getMap();const top=[...S.strat].sort((a,b)=>b.d*b.f-a.d*a.f).slice(0,6);top.forEach((s,i)=>M.nodes.push({id:"T"+Date.now()+i,lane:2,x:120+i*150,label:s.t.slice(0,60)}));save();toast("Ditambahkan ke Strategy Map (lajur Proses)");location.hash="#map";};
    $("#cpTows").onclick=()=>copy(["Tipe\tStrategi\tDampak\tKelayakan\tSkor",...S.strat.map(s=>`${s.k}\t${s.t}\t${s.d}\t${s.f}\t${s.d*s.f}`)].join("\n"));
  }),"");
};

/* ---------- STRATEGY MAP BUILDER ---------- */
const TPL={
 pt:{lanes:["Dampak / Stakeholder","Mahasiswa & Mitra","Proses Internal","SDM · Informasi · Budaya","Keuangan"],nodes:[["D1","Lulusan berdaya saing & terserap kerja layak",0],["D2","Kontribusi nyata pada SDGs & kebijakan publik",0],["M1","Mahasiswa lulus tepat waktu & berprestasi",1],["M2","Mitra industri/pemerintah puas & berkelanjutan",1],["P1","Kurikulum OBE & pembelajaran luar prodi",2],["P2","Riset terapan & hilirisasi",2],["P3","Layanan akademik digital",2],["L1","Dosen kompeten & sejahtera",3],["L2","Sistem informasi & data terintegrasi",3],["L3","Budaya mutu & integritas",3],["F1","Pendapatan non-UKT meningkat",4],["F2","Anggaran efisien berbasis kinerja",4]],links:[["L1","P1"],["L1","P2"],["L2","P3"],["L3","P3"],["F1","P2"],["F2","P1"],["P1","M1"],["P2","M2"],["P3","M1"],["M1","D1"],["M2","D2"]]},
 prodi:{lanes:["Dampak / Stakeholder","Mahasiswa & Mitra","Proses Internal","SDM · Informasi · Budaya","Keuangan"],nodes:[["D1","Lulusan terserap kerja <6 bln, gaji >1,2×UMP",0],["M1","AEE S1 mendekati ideal 25%",1],["M2","Mahasiswa bersertifikat profesi data/AI",1],["M3","Kepuasan mitra industri tinggi",1],["P1","Kurikulum OBE berbasis sertifikasi & proyek",2],["P2","Magang & proyek industri ber-SKS",2],["P3","Klinik skripsi & monitoring PA",2],["L1","Dosen tersertifikasi industri",3],["L2","Dashboard akademik real-time",3],["F1","Pelatihan berbayar & micro-credential",4],["F2","Hibah kerja sama industri",4]],links:[["L1","P1"],["L2","P3"],["F2","P2"],["F1","L1"],["P1","M2"],["P2","M3"],["P2","M1"],["P3","M1"],["M1","D1"],["M2","D1"],["M3","D1"]]},
 sekolah:{lanes:["Dampak","Peserta Didik & Orang Tua","Proses Pembelajaran","Guru, Tendik & Data","Keuangan (BOS/BOP)"],nodes:[["D1","Literasi & numerasi meningkat",0],["D2","Karakter Profil Lulusan kuat",0],["S1","Kehadiran & keterlibatan siswa tinggi",1],["S2","Orang tua puas & terlibat",1],["P1","Pembelajaran berdiferensiasi",2],["P2","Iklim aman & inklusif",2],["P3","Asesmen formatif rutin",2],["G1","Guru kompeten (komunitas belajar)",3],["G2","Pemanfaatan Rapor Pendidikan (PBD)",3],["K1","RKAS selaras prioritas PBD",4]],links:[["G1","P1"],["G1","P3"],["G2","P3"],["K1","G1"],["K1","P2"],["P1","S1"],["P2","S1"],["P2","S2"],["P3","D1"],["S1","D1"],["S1","D2"],["S2","D2"]]},
 kosong:{lanes:["Dampak / Stakeholder","Mahasiswa & Mitra","Proses Internal","SDM · Informasi · Budaya","Keuangan"],nodes:[],links:[]}
};
function fromTpl(k){const t=TPL[k];const nodes=[];const cnt=[0,0,0,0,0];const per=t.lanes.map((_,i)=>t.nodes.filter(n=>n[2]===i).length);
  t.nodes.forEach(([id,l,lane])=>{const n=per[lane],i=cnt[lane]++;const W=1000,span=(W-200);nodes.push({id,label:l,lane,x:Math.round(200+span*(i+0.5)/n)});});
  return {lanes:[...t.lanes],nodes,links:t.links.map(([a,b])=>({a,b,why:""})),title:"Strategy Map"};}
function getMap(){if(!ST.map) ST.map=fromTpl("pt"); return ST.map;}
P.map=()=>{
  setTimeout(initMap);
  return `<h1>Strategy Map Builder</h1><p>Seret kartu untuk memindahkan · klik dua kali untuk mengedit · aktifkan <b>Mode Panah</b> lalu klik kartu sumber dan tujuan · klik panah untuk menulis alasan “jika–maka” atau menghapusnya.</p>
  <div class="toolbar"><select id="tplSel" style="width:auto"><option value="">Muat template…</option><option value="pt">Perguruan tinggi</option><option value="kasus">Sekolah kasus (SMP Negeri X)</option><option value="sekolah">Sekolah/madrasah</option><option value="kosong">Kanvas kosong</option></select>
  <select id="laneSel" style="width:auto"></select><button class="btn o" id="addNode">+ Sasaran</button><button class="btn" id="linkMode">↗ Mode Panah: OFF</button>
  <button class="btn n" id="pngBtn">⬇ PNG</button><button class="btn line" id="svgBtn">⬇ SVG</button><button class="btn line" id="cpMap">📋 Salin sebagai teks</button><button class="btn line" id="renLane">✎ Ganti nama lajur</button></div>
  <div id="mapWrap"><svg id="mapSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1040 640" width="100%"></svg></div>
  <div class="card" style="margin-top:14px"><h2 style="margin-top:0">Uji logika (red team)</h2><div id="mapCheck"></div></div>`;
};
function wrap(t,n){const w=String(t).split(/\s+/),L=[];let c="";w.forEach(x=>{if((c+" "+x).trim().length>n){if(c)L.push(c);c=x;}else c=(c+" "+x).trim();});if(c)L.push(c);return L.slice(0,4);}
function initMap(){
  const M=getMap(),svg=$("#mapSvg"); if(!svg) return;
  const LH=120,TOP=16,W=1040,CW=160,CH=70; let linkMode=false,src=null,drag=null,lastN=null;
  const laneC=["#E63E8C","#FF7A1A","#00A6A6","#7B4FE0","#1B2A6B","#2EBD6B"];
  $("#laneSel").innerHTML=M.lanes.map((l,i)=>`<option value="${i}">${esc(l)}</option>`).join("");
  const yOf=l=>TOP+l*LH+LH/2;
  function draw(){
    svg.setAttribute("viewBox",`0 0 ${W} ${TOP*2+M.lanes.length*LH}`);
    let h=`<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#1B2A6B"/></marker></defs><rect width="${W}" height="${TOP*2+M.lanes.length*LH}" fill="#fff"/>`;
    M.lanes.forEach((l,i)=>{const y=TOP+i*LH,c=laneC[i%6];h+=`<rect x="0" y="${y+3}" width="${W}" height="${LH-6}" fill="${c}" opacity=".09"/><rect x="6" y="${y+8}" width="104" height="${LH-16}" rx="8" fill="${c}"/>`+wrap(l,13).map((t,j,a)=>`<text x="58" y="${y+LH/2+(j-(a.length-1)/2)*15+5}" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="Segoe UI,Arial">${esc(t)}</text>`).join("");});
    M.links.forEach((k,i)=>{const a=M.nodes.find(n=>n.id===k.a),b=M.nodes.find(n=>n.id===k.b);if(!a||!b)return;const ya=yOf(a.lane),yb=yOf(b.lane);const up=ya>yb;const y1=ya+(up?-CH/2:CH/2),y2=yb+(up?CH/2:-CH/2);
      h+=`<path data-link="${i}" d="M${a.x},${y1} C${a.x},${(y1+y2)/2} ${b.x},${(y1+y2)/2} ${b.x},${y2}" stroke="${k.why?"#1B2A6B":"#9CA3AF"}" stroke-width="${k.why?2.2:1.6}" fill="none" marker-end="url(#ar)" style="cursor:pointer" ${k.why?"":'stroke-dasharray="5 4"'}><title>${esc(k.why||"Klik untuk menulis alasan jika–maka")}</title></path><path data-link="${i}" d="M${a.x},${y1} C${a.x},${(y1+y2)/2} ${b.x},${(y1+y2)/2} ${b.x},${y2}" stroke="transparent" stroke-width="12" fill="none" style="cursor:pointer"/>`;});
    M.nodes.forEach(n=>{const y=yOf(n.lane),c=laneC[n.lane%6],sel=src===n.id;h+=`<g data-node="${n.id}" style="cursor:${linkMode?"crosshair":"move"}"><rect x="${n.x-CW/2}" y="${y-CH/2}" width="${CW}" height="${CH}" rx="12" fill="${sel?"#FFF4CC":"#fff"}" stroke="${c}" stroke-width="${sel?3.5:2.2}"/><text pointer-events="none" x="${n.x}" y="${y-CH/2+15}" text-anchor="middle" font-size="11" font-weight="800" fill="${c}" font-family="Segoe UI,Arial">${esc(n.id)}</text>`+wrap(n.label,24).map((t,j,a)=>`<text pointer-events="none" x="${n.x}" y="${y+6+(j-(a.length-1)/2)*13}" text-anchor="middle" font-size="11" fill="#1F2A44" font-family="Segoe UI,Arial">${esc(t)}</text>`).join("")+`</g>`;});
    svg.innerHTML=h; check();
  }
  function pt(e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
  svg.onpointerdown=e=>{const g=e.target.closest("[data-node]");if(!g)return;const n=M.nodes.find(x=>x.id===g.dataset.node);
    if(linkMode){ if(!src){src=n.id;draw();} else if(src!==n.id){ if(!M.links.some(l=>l.a===src&&l.b===n.id)) M.links.push({a:src,b:n.id,why:""}); src=null;save();draw(); } return;}
    const p=pt(e);lastN=n;drag={n,dx:p.x-n.x,dy:p.y-yOf(n.lane),moved:false};svg.setPointerCapture(e.pointerId);};
  svg.onpointermove=e=>{if(!drag)return;const p=pt(e);drag.n.x=Math.max(190,Math.min(W-85,Math.round(p.x-drag.dx)));const lane=Math.max(0,Math.min(M.lanes.length-1,Math.floor((p.y-TOP)/LH)));drag.n.lane=lane;draw();};
  svg.onpointerup=e=>{if(drag){drag=null;save();}try{svg.releasePointerCapture(e.pointerId);}catch(_){}};
  svg.ondblclick=async e=>{const g=e.target.closest("[data-node]");const n=g?M.nodes.find(x=>x.id===g.dataset.node):lastN;if(!n)return;const r=await dlg("Edit sasaran strategis",[{label:"Kode (mis. M1)",value:n.id},{label:"Sasaran (kata kerja + objek)",value:n.label,multi:true}],{del:"Hapus kartu"});if(!r)return;
    if(r==="DEL"){M.nodes=M.nodes.filter(x=>x!==n);M.links=M.links.filter(l=>l.a!==n.id&&l.b!==n.id);}else{const id=r[0].trim()||n.id;M.links.forEach(l=>{if(l.a===n.id)l.a=id;if(l.b===n.id)l.b=id;});n.id=id;n.label=r[1].trim()||n.label;}save();draw();};
  svg.onclick=async e=>{const p=e.target.closest("[data-link]");if(!p||linkMode)return;const k=M.links[+p.dataset.link];const r=await dlg(`Panah ${k.a} → ${k.b}`,[{label:`Jika ${k.a} tercapai, maka ${k.b} meningkat karena…`,value:k.why||"",multi:true}],{del:"Hapus panah"});if(!r)return;if(r==="DEL")M.links.splice(+p.dataset.link,1);else k.why=r[0].trim();save();draw();};
  $("#addNode").onclick=async()=>{const lane=+$("#laneSel").value;const pre=["D","M","P","L","F","X"][lane]||"X";let k=1;while(M.nodes.some(n=>n.id===pre+k))k++;const r=await dlg("Sasaran baru di lajur "+M.lanes[lane],[{label:"Kode",value:pre+k},{label:"Sasaran (kata kerja + objek)",value:"Meningkatkan ",multi:true}],{ok:"Tambah"});if(!r)return;M.nodes.push({id:r[0].trim()||pre+k,label:r[1].trim(),lane,x:200+((M.nodes.filter(n=>n.lane===lane).length*175)%800)});save();draw();};
  $("#linkMode").onclick=()=>{linkMode=!linkMode;src=null;$("#linkMode").textContent="↗ Mode Panah: "+(linkMode?"ON":"OFF");$("#linkMode").classList.toggle("p",linkMode);draw();};
  $("#tplSel").onchange=async e=>{const v=e.target.value;if(!v)return;if(M.nodes.length&&!(await dlg("Ganti peta saat ini dengan template?",[],{ok:"Ganti"}))){e.target.value="";return;}ST.map=fromTpl(v);save();route();};
  $("#renLane").onclick=async()=>{const i=+$("#laneSel").value;const r=await dlg("Ganti nama lajur/perspektif",[{label:"Nama",value:M.lanes[i]}]);if(r&&r[0].trim()){M.lanes[i]=r[0].trim();save();route();}};
  $("#svgBtn").onclick=()=>download("strategy-map.svg",new XMLSerializer().serializeToString(svg),"image/svg+xml");
  $("#pngBtn").onclick=()=>{const s=new XMLSerializer().serializeToString(svg);const vb=svg.viewBox.baseVal;const img=new Image();img.onload=()=>{const c=document.createElement("canvas");c.width=vb.width*2;c.height=vb.height*2;const x=c.getContext("2d");x.drawImage(img,0,0,c.width,c.height);c.toBlob(b=>download("strategy-map.png",b),"image/png");};img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s);};
  $("#cpMap").onclick=()=>copy(M.lanes.map((l,i)=>`${l.toUpperCase()}: `+M.nodes.filter(n=>n.lane===i).map(n=>`[${n.id}] ${n.label}`).join("  ")).join("\n")+"\nPANAH: "+M.links.map(l=>`${l.a}→${l.b}${l.why?" ("+l.why+")":""}`).join(", "));
  function check(){const el=$("#mapCheck");if(!el)return;const iso=M.nodes.filter(n=>!M.links.some(l=>l.a===n.id||l.b===n.id));const noWhy=M.links.filter(l=>!l.why).length;const act=M.nodes.filter(n=>/^(mengadakan|menyelenggarakan|melaksanakan|membuat|rapat)/i.test(n.label));
    const items=[[M.nodes.length>=8&&M.nodes.length<=20,`Jumlah sasaran ${M.nodes.length} (ideal 12–20 universitas, 8–14 prodi)`],[iso.length===0,iso.length?`Sasaran menggantung (tanpa panah): ${iso.map(n=>n.id).join(", ")}`:"Semua sasaran terhubung"],[noWhy===0,noWhy?`${noWhy} panah belum punya alasan “jika–maka” (garis putus-putus)`:"Semua panah punya alasan"],[act.length===0,act.length?`Sasaran berbentuk kegiatan, bukan hasil: ${act.map(n=>n.id).join(", ")}`:"Sasaran berbentuk hasil (bukan kegiatan)"],[M.lanes.every((_,i)=>M.nodes.some(n=>n.lane===i)),"Setiap perspektif memiliki minimal satu sasaran"]];
    el.innerHTML=items.map(([ok,t])=>`<div>${ok?'<span class="ok">✓</span>':'<span class="no">!</span>'} ${esc(t)}</div>`).join("");}
  draw();
}

/* ---------- KALKULATOR IKU ---------- */
P.kpi=()=>{
  const A=get("aee",[{j:"D3",l:30,t:100,i:33},{j:"D4",l:20,t:100,i:25},{j:"S1",l:20,t:100,i:25},{j:"S2",l:45,t:100,i:50},{j:"S3",l:30,t:100,i:33}]);
  const I2=get("iku2",{a:120,b:60,c:40,s:30,n:400});
  const TG=get("tg",{base:18,end:25,y0:2025,y1:2029,pol:"+",real:19.4});
  setTimeout(()=>{
    const dAEE=()=>{let s=0;const rows=A.map((r,k)=>{const aee=r.t?r.l/r.t*100:0,cap=r.i?aee/r.i*100:0;s+=cap;return `<tr><td><input data-a="${k}" data-f="j" value="${esc(r.j)}" style="width:70px"></td><td><input type="number" data-a="${k}" data-f="l" value="${r.l}"></td><td><input type="number" data-a="${k}" data-f="t" value="${r.t}"></td><td><input type="number" data-a="${k}" data-f="i" value="${r.i}"></td><td><b>${fmt(aee)}%</b></td><td class="${cap>=100?"rag-H":cap>=80?"rag-K":"rag-M"}"><b>${fmt(cap)}%</b></td><td><button class="btn sm p" data-ad="${k}">✕</button></td></tr>`;}).join("");
      const avg=A.length?s/A.length:0;
      $("#aeeT").innerHTML=`<div class="tw"><table><thead><tr><th>Jenjang/Prodi</th><th>Lulus tepat masa</th><th>Total mhs TA</th><th>AEE ideal (%)</th><th>AEE realisasi</th><th>Capaian</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><div class="row"><button class="btn sm o" id="aeeAdd">+ Baris</button><span>AEE PT (rata-rata capaian) = <span class="stat">${fmt(avg)}%</span></span>${copyBtn(["Jenjang\tLulus\tTotal\tIdeal\tAEE\tCapaian",...A.map(r=>`${r.j}\t${r.l}\t${r.t}\t${r.i}\t${fmt(r.l/r.t*100)}%\t${fmt(r.l/r.t*100/r.i*100)}%`),`AEE PT\t\t\t\t\t${fmt(avg)}%`].join("\n"),"Salin hasil")}</div><p class="small">Ideal (Kepmen 358/2025): D3 33%, Sarjana/Sarjana Terapan 25%, Magister 50%, Doktor 33%. Contoh resmi menghasilkan AEE PT 86,36%.</p>`;
      document.querySelectorAll("[data-a]").forEach(el=>el.onchange=()=>{const r=A[+el.dataset.a];r[el.dataset.f]=el.dataset.f==="j"?el.value:+el.value;save();dAEE();});
      document.querySelectorAll("[data-ad]").forEach(el=>el.onclick=()=>{A.splice(+el.dataset.ad,1);save();dAEE();});
      $("#aeeAdd").onclick=()=>{A.push({j:"Prodi",l:0,t:100,i:25});save();dAEE();};};
    const d2=()=>{["a","b","c","s","n"].forEach(k=>I2[k]=+$("#i2"+k).value||0);save();const sc=I2.a*1+I2.b*.8+I2.c*.6+I2.s*.6;const resp=I2.a+I2.b+I2.c+I2.s+ (+$("#i2x").value||0);const slov=Math.ceil(I2.n/(1+I2.n*0.023*0.023));
      $("#i2r").innerHTML=`Skor tertimbang = ${fmt(sc,1)} · Responden = ${resp} · <b>IKU 2 ≈ ${fmt(resp?sc/resp*100:0)}%</b><br>Sampel minimum Slovin (galat 2,3%) dari ${I2.n} lulusan = <b>${slov} responden</b> ${resp<slov?'<span class="no">(responden belum cukup)</span>':'<span class="ok">(cukup)</span>'}`;};
    const dT=()=>{["base","end","y0","y1","real"].forEach(k=>TG[k]=+$("#tg"+k).value);TG.pol=$("#tgpol").value;save();const n=TG.y1-TG.y0;const step=n?(TG.end-TG.base)/n:0;const rows=[];for(let i=0;i<=n;i++)rows.push([TG.y0+i,+(TG.base+step*i).toFixed(2)]);
      const t1=rows[1]?rows[1][1]:TG.base;const cap=TG.pol==="+"?TG.real/t1*100:t1/TG.real*100;
      $("#tgr").innerHTML=tableHTML(["Tahun","Target"],rows.map(r=>[r[0],fmt(r[1])]))+`<p>Kenaikan per tahun = (${TG.end} − ${TG.base}) ÷ ${n} = <b>${fmt(step)}</b>. Capaian tahun ${TG.y0+1} (realisasi ${TG.real} vs target ${fmt(t1)}) = <b class="${cap>=100?"ok":cap>=80?"":"no"}">${fmt(cap)}% ${cap>=100?"HIJAU":cap>=80?"KUNING":"MERAH"}</b></p>`+copyBtn(rows.map(r=>r.join("\t")).join("\n"),"Salin target");lineChart($("#tgc"),rows.map(r=>r[0]),[{n:"Target",c:"#FF7A1A",v:rows.map(r=>r[1])},{n:"Realisasi",c:"#00A6A6",v:[TG.base,TG.real]}]);};
    dAEE();document.querySelectorAll("[id^=i2]").forEach(el=>el.oninput=d2);d2();document.querySelectorAll("[id^=tg]").forEach(el=>{if(el.tagName!=="DIV"&&el.tagName!=="CANVAS")el.oninput=dT;});dT();
    const d3=()=>{const tot=+$("#i3t").value||0;const vals=[...document.querySelectorAll("[data-i3]")].map(e=>(+e.value||0)*(+e.dataset.i3));const s=vals.reduce((a,b)=>a+b,0);$("#i3r").innerHTML=`Σ mahasiswa tertimbang = ${fmt(s,1)} · <b>IKU 3 ≈ ${fmt(tot?s/tot*100:0)}%</b>`;};
    document.querySelectorAll("#i3 input").forEach(e=>e.oninput=d3);d3();
  });
  return `<h1>Kalkulator IKU & Target</h1><p>Rumus mengikuti lampiran Kepmendiktisaintek 358/M/KEP/2025. Untuk dokumen resmi, verifikasi kembali dengan panduan IKU terbaru.</p>
  <div class="card"><h2 style="margin-top:0">IKU 1 · Angka Efisiensi Edukasi (AEE)</h2><div id="aeeT"></div></div>
  <div class="grid g2"><div class="card"><h2 style="margin-top:0">IKU 2 · Lulusan bekerja/wirausaha/studi lanjut</h2>
  <label class="f">Masa tunggu &lt;6 bln &amp; gaji &gt;1,2×UMP (bobot 1)</label><input id="i2a" type="number" value="${I2.a}">
  <label class="f">Masa tunggu &lt;1 th &amp; gaji &gt;1,2×UMP (bobot 0,8)</label><input id="i2b" type="number" value="${I2.b}">
  <label class="f">Masa tunggu &lt;1 th &amp; gaji &lt;1,2×UMP (bobot 0,6)</label><input id="i2c" type="number" value="${I2.c}">
  <label class="f">Studi lanjut (bobot 0,6)</label><input id="i2s" type="number" value="${I2.s}">
  <label class="f">Responden lain (belum bekerja, dll.)</label><input id="i2x" type="number" value="20">
  <label class="f">Jumlah lulusan (populasi, untuk Slovin)</label><input id="i2n" type="number" value="${I2.n}"><p id="i2r"></p></div>
  <div class="card" id="i3"><h2 style="margin-top:0">IKU 3 · Mahasiswa berkegiatan/berprestasi luar prodi</h2><p class="small">Isi jumlah mahasiswa per kategori; bobot contoh dari panduan (sesuaikan dengan lampiran resmi).</p>
  <label class="f">Total mahasiswa aktif D & S</label><input id="i3t" type="number" value="640">
  ${[["Juara 1 internasional",1],["Juara 1 nasional",0.6],["Juara 1 provinsi",0.4],["Pembelajaran luar prodi ≥20 SKS",1],["Pembelajaran luar prodi 10–19 SKS",0.5]].map(([t,w])=>`<label class="f">${t} (bobot ${w})</label><input type="number" data-i3="${w}" value="${w===1&&t.includes("SKS")?150:w===0.5?60:2}">`).join("")}<p id="i3r"></p></div></div>
  <div class="card"><h2 style="margin-top:0">Lintasan target 5 tahun & % capaian</h2><div class="grid g3"><div><label class="f">Baseline</label><input id="tgbase" type="number" step="0.1" value="${TG.base}"></div><div><label class="f">Target akhir</label><input id="tgend" type="number" step="0.1" value="${TG.end}"></div><div><label class="f">Polaritas</label><select id="tgpol"><option value="+" ${TG.pol==="+"?"selected":""}>+ (makin tinggi makin baik)</option><option value="-" ${TG.pol==="-"?"selected":""}>− (makin rendah makin baik)</option></select></div><div><label class="f">Tahun baseline</label><input id="tgy0" type="number" value="${TG.y0}"></div><div><label class="f">Tahun akhir</label><input id="tgy1" type="number" value="${TG.y1}"></div><div><label class="f">Realisasi tahun pertama</label><input id="tgreal" type="number" step="0.1" value="${TG.real}"></div></div><div class="grid g2" style="margin-top:12px"><div id="tgr"></div><canvas id="tgc" width="520" height="280" style="width:100%;background:#fff;border-radius:10px;border:1px solid var(--line)"></canvas></div></div>`;
};

/* ---------- charts (canvas, tanpa pustaka) ---------- */
function lineChart(cv,labels,series){if(!cv)return;const x=cv.getContext("2d"),W=cv.width,H=cv.height,p=40;x.clearRect(0,0,W,H);const all=series.flatMap(s=>s.v).filter(v=>v!=null);const mn=Math.floor(Math.min(...all)*0.9),mx=Math.ceil(Math.max(...all)*1.05);const X=i=>p+i*(W-2*p)/Math.max(1,labels.length-1),Y=v=>H-p-(v-mn)/(mx-mn||1)*(H-2*p);
  x.strokeStyle="#E5E7EB";x.fillStyle="#6B7280";x.font="11px Segoe UI,Arial";for(let k=0;k<=4;k++){const v=mn+(mx-mn)*k/4;x.beginPath();x.moveTo(p,Y(v));x.lineTo(W-p/2,Y(v));x.stroke();x.fillText(fmt(v,1),4,Y(v)+4);}labels.forEach((l,i)=>x.fillText(l,X(i)-14,H-p+18));
  series.forEach((s,si)=>{x.strokeStyle=s.c;x.fillStyle=s.c;x.lineWidth=3;x.beginPath();s.v.forEach((v,i)=>{if(v==null)return;i?x.lineTo(X(i),Y(v)):x.moveTo(X(i),Y(v));});x.stroke();s.v.forEach((v,i)=>{if(v==null)return;x.beginPath();x.arc(X(i),Y(v),4,0,7);x.fill();});x.fillText("■ "+s.n,p+si*100,14);});}
function barChart(cv,labels,vals,colors){if(!cv)return;const x=cv.getContext("2d"),W=cv.width,H=cv.height,p=36,bw=(W-2*p)/labels.length;x.clearRect(0,0,W,H);const mx=Math.max(120,...vals);const Y=v=>H-p-v/mx*(H-2*p);
  x.font="11px Segoe UI,Arial";x.strokeStyle="#E5E7EB";[0,50,100].forEach(v=>{x.beginPath();x.moveTo(p,Y(v));x.lineTo(W-6,Y(v));x.stroke();x.fillStyle="#6B7280";x.fillText(v+"%",4,Y(v)+4);});
  x.strokeStyle="#1B2A6B";x.setLineDash([6,4]);x.beginPath();x.moveTo(p,Y(100));x.lineTo(W-6,Y(100));x.stroke();x.setLineDash([]);
  vals.forEach((v,i)=>{x.fillStyle=colors[i];const bx=p+i*bw+bw*.15;x.fillRect(bx,Y(Math.min(v,mx)),bw*.7,H-p-Y(Math.min(v,mx)));x.fillStyle="#1F2A44";x.fillText(fmt(v,0)+"%",bx,Y(Math.min(v,mx))-4);x.save();x.translate(bx+4,H-p+12);x.fillText(String(labels[i]).slice(0,12),0,0);x.restore();});}

/* ---------- SCORECARD & DASHBOARD ---------- */
const SC0={"persp": [["Murid & Pemangku Kep.", 47.0], ["Proses Internal", 24.6], ["Pembelajaran & Pertumbuhan", 17.8], ["Sumber Daya & Akuntabilitas", 10.6]], "rows": [["Murid & Pemangku Kep.", "M1 % murid ≥ kompetensi minimum literasi (A.1)", "+", 76, 74], ["Murid & Pemangku Kep.", "M2 % murid ≥ kompetensi minimum numerasi (A.2)", "+", 66, 63], ["Murid & Pemangku Kep.", "M3 Indeks karakter murid (A.3)", "+", 58, 56], ["Murid & Pemangku Kep.", "M4 Angka putus sekolah", "-", 0.3, 0.4], ["Murid & Pemangku Kep.", "M5 Indeks kepuasan orang tua (skala 1–4)", "+", 3.2, 3.12], ["Murid & Pemangku Kep.", "M6 % lulusan melanjutkan ke jenjang berikutnya", "+", 95, 94], ["Proses Internal", "P1 Indeks kualitas pembelajaran (D.1)", "+", 64, 62], ["Proses Internal", "P2 % guru melakukan asesmen diagnostik & formatif terdokumentasi", "+", 70, 68], ["Proses Internal", "P3 % murid di bawah kompetensi minimum yang ikut intervensi terstruktur", "+", 60, 63], ["Proses Internal", "P4 Indeks iklim keamanan sekolah (D.4)", "+", 72, 70], ["Proses Internal", "P5 Indeks iklim kebinekaan (D.8)", "+", 72, 71], ["Proses Internal", "P6 % kasus perundungan tertangani ≤ 7 hari", "+", 85, 80], ["Proses Internal", "P7 % orang tua hadir pertemuan kelas per semester", "+", 60, 52], ["Proses Internal", "P9 Siklus PBD/SPMI terdokumentasi lengkap", "+", 2, 2], ["Proses Internal", "P10 Rata-rata kehadiran murid", "+", 95, 94], ["Pembelajaran & Pertumbuhan", "L1 % guru aktif komunitas belajar (≥ 2 sesi/bulan)", "+", 70, 52], ["Pembelajaran & Pertumbuhan", "L2 Supervisi akademik kepala sekolah per guru per semester", "+", 1, 0.8], ["Pembelajaran & Pertumbuhan", "L3 % kelas memanfaatkan PID/TIK ≥ 3 kali per minggu", "+", 50, 40], ["Pembelajaran & Pertumbuhan", "L4 Indeks refleksi guru (D.2)", "+", 66, 64], ["Sumber Daya & Akuntabilitas", "K1 % belanja RKAS yang terpetakan ke sasaran strategis", "+", 80, 82], ["Sumber Daya & Akuntabilitas", "K2 Kepatuhan batas penggunaan BOSP (buku/honor/pemeliharaan)", "+", 100, 100], ["Sumber Daya & Akuntabilitas", "K3 Ketepatan waktu laporan BOSP", "+", 100, 100], ["Sumber Daya & Akuntabilitas", "K4 % ruang kelas kondisi baik", "+", 85, 82]]};
P.scorecard=()=>{
  const SC=get("sc",SC0);
  setTimeout(()=>{
    const draw=()=>{const cap=r=>{const v=r[2]==="+"?r[4]/r[3]*100:r[3]/r[4]*100;return isFinite(v)?Math.min(v,120):0;};const st=c=>c>=100?["HIJAU","#2EBD6B","H"]:c>=80?["KUNING","#FFC93C","K"]:["MERAH","#E5383B","M"];
      $("#scT").innerHTML=`<div class="tw"><table><thead><tr><th>Perspektif</th><th>KPI</th><th>Pol.</th><th>Target</th><th>Realisasi</th><th>% Capaian</th><th>Status</th><th></th></tr></thead><tbody>${SC.rows.map((r,i)=>{const c=cap(r),s=st(c);return `<tr><td><select data-r="${i}" data-c="0">${SC.persp.map(p=>`<option ${p[0]===r[0]?"selected":""}>${esc(p[0])}</option>`).join("")}</select></td><td><input data-r="${i}" data-c="1" value="${esc(r[1])}"></td><td><select data-r="${i}" data-c="2"><option ${r[2]==="+"?"selected":""}>+</option><option ${r[2]==="-"?"selected":""}>-</option></select></td><td><input type="number" step="any" data-r="${i}" data-c="3" value="${r[3]}"></td><td><input type="number" step="any" data-r="${i}" data-c="4" value="${r[4]}"></td><td><b>${fmt(c,1)}%</b></td><td class="rag-${s[2]}"><b>${s[0]}</b></td><td><button class="btn sm p" data-x="${i}">✕</button></td></tr>`;}).join("")}</tbody></table></div>`;
      document.querySelectorAll("[data-r]").forEach(el=>el.onchange=()=>{const c=+el.dataset.c;SC.rows[+el.dataset.r][c]=c>=3?+el.value:el.value;save();draw();});
      document.querySelectorAll("[data-x]").forEach(el=>el.onclick=()=>{SC.rows.splice(+el.dataset.x,1);save();draw();});
      // perspektif
      let tot=0;const pr=SC.persp.map(([p,w])=>{const rs=SC.rows.filter(r=>r[0]===p);const avg=rs.length?rs.reduce((a,r)=>a+cap(r),0)/rs.length:0;tot+=avg*w/100;return [p,w,avg];});
      const ts=st(tot);
      $("#scK").innerHTML=`<div class="kpi" style="background:${ts[1]};color:${ts[0]==="KUNING"?"#1B2A6B":"#fff"}"><small style="color:inherit">Skor total tertimbang</small><b>${fmt(tot,1)}</b>${ts[0]}</div>`+pr.map(([p,w,a])=>{const s=st(a);return `<div class="kpi"><small>${esc(p)} · bobot ${w}%</small><b>${fmt(a,1)}%</b><span class="dot" style="background:${s[1]}"></span> ${s[0]}</div>`;}).join("");
      $("#pw").innerHTML=SC.persp.map((p,i)=>`<div><label class="f">${esc(p[0])} (%)</label><input type="number" data-pw="${i}" value="${p[1]}"></div>`).join("");
      document.querySelectorAll("[data-pw]").forEach(el=>el.onchange=()=>{SC.persp[+el.dataset.pw][1]=+el.value;save();draw();});
      const caps=SC.rows.map(cap);barChart($("#scC"),SC.rows.map(r=>r[1]),caps,caps.map(c=>st(c)[1]));
      $("#scCopy").onclick=()=>copy(["Perspektif\tKPI\tPolaritas\tTarget\tRealisasi\t% Capaian\tStatus",...SC.rows.map(r=>[...r,fmt(cap(r),1)+"%",st(cap(r))[0]].join("\t")),`Skor total\t\t\t\t\t${fmt(tot,1)}\t${ts[0]}`].join("\n"));
      $("#scCsv").onclick=()=>download("scorecard.csv","﻿"+["Perspektif;KPI;Polaritas;Target;Realisasi;Capaian;Status",...SC.rows.map(r=>[...r,cap(r).toFixed(1),st(cap(r))[0]].join(";"))].join("\n"),"text/csv");
    };
    $("#scAdd").onclick=()=>{SC.rows.push([SC.persp[0][0],"KPI baru","+",100,0]);save();draw();};
    $("#scReset").onclick=async()=>{if(await dlg("Kembalikan scorecard ke contoh awal?",[],{ok:"Ya, reset"})){ST.sc=JSON.parse(JSON.stringify(SC0));save();route();}};
    draw();
  });
  return `<h1>Scorecard & Dasbor Sekolah</h1><p>Isi target dan realisasi; % capaian, status RAG, skor perspektif, dan skor total dihitung otomatis (capaian dibatasi maksimal 120%).</p>
  <div class="grid g3" id="scK" style="margin-bottom:16px"></div>
  <div class="card"><canvas id="scC" width="1100" height="300" style="width:100%"></canvas></div>
  <div class="card"><div class="toolbar"><button class="btn o" id="scAdd">+ KPI</button><button class="btn line" id="scCopy">📋 Salin tabel</button><button class="btn line" id="scCsv">⬇ CSV (Excel)</button><button class="btn line" id="scReset">↺ Contoh awal</button></div><div id="scT"></div>
  <h3>Bobot perspektif</h3><div class="grid g4" id="pw"></div>
  <h3>Rumus Google Sheets</h3><div class="copywrap"><pre>E2 : =IF(B2="+", D2/C2, C2/D2)
F2 : =IFS(E2>=1,"HIJAU", E2>=0.8,"KUNING", TRUE,"MERAH")
G2 : =SPARKLINE(Tren!B2:M2, {"charttype","line";"color","#00A6A6"})</pre>${copyBtn('E2 : =IF(B2="+", D2/C2, C2/D2)\nF2 : =IFS(E2>=1,"HIJAU", E2>=0.8,"KUNING", TRUE,"MERAH")\nG2 : =SPARKLINE(Tren!B2:M2, {"charttype","line";"color","#00A6A6"})')}</div></div>`;
};

/* ---------- CASCADING ---------- */
P.cascade=()=>{
  const head=["Sasaran sekolah","KPI sekolah","Unit (PIC)","KPI unit","KPI guru/wali kelas","Pola"];
  const CS=get("cs",[["S1 Literasi & numerasi", "M1, M2 (Rapor A.1, A.2)", "P2, P3 (Wakasek kurikulum)", "P2, P3", "% murid naik 1 level numerasi; asesmen formatif mingguan", "Identik + kontributif"], ["S2 Karakter & kesejahteraan", "M3 (Rapor A.3)", "P4, P6 (Wakasek kesiswaan)", "P4, P6", "Tindak lanjut perundungan ≤ 7 hari", "Kontributif"], ["S4 Bertahan & melanjutkan", "M4, M6", "P10 (Wakasek kesiswaan & BK)", "P10", "Kehadiran ≥ 95%; pendampingan murid berisiko", "Kontributif"], ["L1 Komunitas belajar", "L1", "L1 (Wakasek kurikulum)", "L1", "≥ 2 sesi komunitas belajar/bulan", "Identik"], ["R1 Alokasi BOSP", "K1, K2", "K1, K2 (Bendahara)", "K1, K2", "Usulan kegiatan berkode sasaran", "Unik"]]);
  setTimeout(()=>{const draw=()=>{$("#csT").innerHTML=`<div class="tw"><table><thead><tr>${head.map(h=>`<th>${h}</th>`).join("")}<th></th></tr></thead><tbody>${CS.map((r,i)=>`<tr>${r.map((c,j)=>`<td>${j===5?`<select data-cs="${i}" data-j="5">${["Identik","Kontributif","Unik","Identik + kontributif"].map(o=>`<option ${o===c?"selected":""}>${o}</option>`).join("")}</select>`:`<textarea rows="2" data-cs="${i}" data-j="${j}" style="min-height:52px">${esc(c)}</textarea>`}</td>`).join("")}<td><button class="btn sm p" data-cx="${i}">✕</button></td></tr>`).join("")}</tbody></table></div>`;
    document.querySelectorAll("[data-cs]").forEach(el=>el.onchange=()=>{CS[+el.dataset.cs][+el.dataset.j]=el.value;save();});
    document.querySelectorAll("[data-cx]").forEach(el=>el.onclick=()=>{CS.splice(+el.dataset.cx,1);save();draw();});};
    $("#csAdd").onclick=()=>{CS.push(["","","","","","Identik"]);save();draw();};$("#csCp").onclick=()=>copy(tableTSV(head,CS));
    $("#csMap").onclick=()=>{const M=getMap();M.nodes.forEach(n=>{if(!CS.some(r=>r[0].startsWith(n.id+" ")))CS.push([n.id+" "+n.label,"","","","","Identik"]);});save();draw();toast("Sasaran dari strategy map ditambahkan");};draw();});
  return `<h1>Matriks Cascading</h1><figure><img src="img/r39_cascading.jpg" alt="Cascading sekolah ke guru" style="max-width:900px"></figure><div class="card"><div class="toolbar"><button class="btn o" id="csAdd">+ Baris</button><button class="btn n" id="csMap">⇩ Ambil sasaran dari Strategy Map</button><button class="btn line" id="csCp">📋 Salin tabel</button></div><div id="csT"></div></div>`;
};

/* ---------- PRIORITAS INISIATIF ---------- */
P.inisiatif=()=>{
  const IN=get("ini",[{n:"Klinik skripsi",s:"M1",d:9,k:8,b:40,p:"Koord. TA"},{n:"Magang ber-SKS",s:"P1, M1",d:9,k:7,b:70,p:"Kaprodi"},{n:"Dashboard akademik",s:"L2",d:7,k:6,b:55,p:"TIK"},{n:"Micro-credential",s:"F1",d:6,k:8,b:35,p:"Unit usaha"},{n:"Lab AI baru",s:"P2",d:9,k:3,b:120,p:"Dekan"}]);
  const BUD=get("bud",{tok:100});
  setTimeout(()=>{const draw=()=>{const tot=IN.reduce((a,b)=>a+(+b.tk||0),0);
    $("#inT").innerHTML=`<div class="tw"><table><thead><tr><th>Inisiatif</th><th>Sasaran</th><th>Dampak 1–10</th><th>Kelayakan 1–10</th><th>Anggaran (jt)</th><th>PIC</th><th>Token</th><th>Kuadran</th><th></th></tr></thead><tbody>${IN.map((r,i)=>{const q=r.d>=5&&r.k>=5?["Prioritas utama","H"]:r.d>=5?["Proyek besar","K"]:r.k>=5?["Quick win kecil","K"]:["Tunda","M"];return `<tr>${["n","s","d","k","b","p","tk"].map(f=>`<td><input ${["d","k","b","tk"].includes(f)?'type="number"':""} data-in="${i}" data-f="${f}" value="${esc(r[f]??0)}"></td>`).join("")}<td class="rag-${q[1]}">${q[0]}</td><td><button class="btn sm p" data-ix="${i}">✕</button></td></tr>`;}).join("")}</tbody></table></div><p>Token terpakai: <b class="${tot>BUD.tok?"no":"ok"}">${tot}</b> / ${BUD.tok}</p>`;
    document.querySelectorAll("[data-in]").forEach(el=>el.onchange=()=>{const f=el.dataset.f;IN[+el.dataset.in][f]=["d","k","b","tk"].includes(f)?+el.value:el.value;save();draw();});
    document.querySelectorAll("[data-ix]").forEach(el=>el.onclick=()=>{IN.splice(+el.dataset.ix,1);save();draw();});
    const cv=$("#inC"),x=cv.getContext("2d"),W=cv.width,H=cv.height,p=40;x.clearRect(0,0,W,H);x.fillStyle="#fff";x.fillRect(0,0,W,H);x.strokeStyle="#DDE2EF";x.beginPath();x.moveTo(p+(W-2*p)/2,p/2);x.lineTo(p+(W-2*p)/2,H-p);x.moveTo(p,p/2+(H-1.5*p)/2);x.lineTo(W-p/2,p/2+(H-1.5*p)/2);x.stroke();
    x.font="bold 12px Segoe UI";x.fillStyle="#2EBD6B";x.fillText("PRIORITAS UTAMA",W-150,24);x.fillStyle="#FF7A1A";x.fillText("PROYEK BESAR",p+6,24);x.fillStyle="#3BA7FF";x.fillText("QUICK WIN",W-110,H-p-8);x.fillStyle="#E5383B";x.fillText("TUNDA",p+6,H-p-8);
    x.fillStyle="#6B7280";x.font="12px Segoe UI";x.fillText("Kelayakan →",W/2-30,H-10);x.save();x.translate(14,H/2+30);x.rotate(-Math.PI/2);x.fillText("Dampak →",0,0);x.restore();
    IN.forEach((r,i)=>{const cx=p+(r.k/10)*(W-2*p),cy=H-p-(r.d/10)*(H-1.5*p),rad=Math.max(8,Math.sqrt(r.b||1)*2.2);x.globalAlpha=.8;x.fillStyle=COLORS[i%8];x.beginPath();x.arc(cx,cy,rad,0,7);x.fill();x.globalAlpha=1;x.fillStyle="#1F2A44";x.fillText(r.n,cx-r.n.length*3,cy+rad+13);});};
    $("#inAdd").onclick=()=>{IN.push({n:"Inisiatif baru",s:"",d:5,k:5,b:20,p:"",tk:0});save();draw();};
    $("#inCut").onclick=()=>{BUD.tok=Math.round(BUD.tok*0.8);save();toast("Kejutan! Token dipotong 20% → "+BUD.tok);draw();};
    $("#inRes").onclick=()=>{BUD.tok=100;save();draw();};
    $("#inCp").onclick=()=>copy(tableTSV(["Inisiatif","Sasaran","Dampak","Kelayakan","Anggaran","PIC","Token"],IN.map(r=>[r.n,r.s,r.d,r.k,r.b,r.p,r.tk||0])));draw();});
  return `<h1>Prioritas Inisiatif & Budget Allocation Game</h1><p>Beri skor dampak dan kelayakan, alokasikan 100 token, lalu tekan “Kejutan” untuk simulasi pemotongan dana 20%.</p>
  <div class="card"><canvas id="inC" width="900" height="420" style="width:100%;border-radius:10px"></canvas></div>
  <div class="card"><div class="toolbar"><button class="btn o" id="inAdd">+ Inisiatif</button><button class="btn p" id="inCut">⚡ Kejutan: dana −20%</button><button class="btn line" id="inRes">↺ 100 token</button><button class="btn line" id="inCp">📋 Salin</button></div><div id="inT"></div></div>`;
};

/* ---------- GENERATOR RENSTRA ---------- */
P.renstra=()=>{
  const R=get("ren",{inst:"Program Studi Sistem Informasi",per:"2026–2030",visi:"Menjadi program studi sistem informasi yang unggul dalam data dan kecerdasan buatan terapan di Jawa Barat pada tahun 2030.",misi:"Menyelenggarakan pendidikan berbasis OBE dan sertifikasi profesi\nMelaksanakan riset terapan bersama industri\nMemberdayakan masyarakat melalui solusi digital",nilai:"Integritas, Kolaborasi, Inovasi, Kepedulian",kondisi:"Akreditasi Baik Sekali; AEE S1 18%; lulusan bekerja ≤6 bulan 72%."});
  const gen=()=>{const M=getMap(),SC=ST.sc||SC0,sw=ST.swot,ini=ST.ini||[];
    let t=`# RENCANA STRATEGIS ${R.inst.toUpperCase()} ${R.per}\n\n## BAB I PENDAHULUAN\n### 1.1 Kondisi Umum\n${R.kondisi}\n\n### 1.2 Potensi dan Permasalahan (SWOT)\n`;
    if(sw){["S","W","O","T"].forEach(k=>{t+=`**${{S:"Kekuatan",W:"Kelemahan",O:"Peluang",T:"Ancaman"}[k]}:**\n`+sw[k].split("\n").filter(Boolean).map(x=>"- "+x).join("\n")+"\n\n";});t+=`### 1.3 Strategi TOWS Prioritas\n`+[...sw.strat].sort((a,b)=>b.d*b.f-a.d*a.f).map((s,i)=>`${i+1}. [${s.k}] ${s.t} (skor ${s.d*s.f})`).join("\n")+"\n\n";}
    t+=`### 1.4 Mandat dan Keselarasan\n- Renstra Kemdiktisaintek 2025–2029 (Permendiktisaintek 40/2025)\n- IKU Diktisaintek Berdampak (Kepmendiktisaintek 358/M/KEP/2025)\n- Penjaminan mutu (Permendiktisaintek 39/2025 jo. 10/2026)\n- SAKIP (Perpres 29/2014) dan instrumen akreditasi\n\n## BAB II VISI, MISI, NILAI, TUJUAN, DAN SASARAN\n**Visi:** ${R.visi}\n\n**Misi:**\n`+R.misi.split("\n").filter(Boolean).map((m,i)=>`${i+1}. ${m}`).join("\n")+`\n\n**Nilai:** ${R.nilai}\n\n**Sasaran strategis:**\n`;
    M.lanes.forEach((l,i)=>{const ns=M.nodes.filter(n=>n.lane===i);if(ns.length)t+=`- *${l}*: `+ns.map(n=>`${n.id} ${n.label}`).join("; ")+"\n";});
    t+=`\n## BAB III ARAH KEBIJAKAN DAN STRATEGI\n### 3.1 Strategy Map (hubungan sebab-akibat)\n`+M.links.map(l=>`- ${l.a} → ${l.b}${l.why?": "+l.why:""}`).join("\n")+`\n\n### 3.2 Inisiatif Strategis\n`+(ini.length?ini.map(r=>`- ${r.n} (sasaran ${r.s}; anggaran Rp${r.b} juta; PIC ${r.p})`).join("\n"):"- (isi di menu Prioritas Inisiatif)")+`\n\n## BAB IV TARGET KINERJA DAN KERANGKA PENDANAAN\n| Perspektif | KPI | Polaritas | Target | Realisasi |\n|---|---|---|---|---|\n`+SC.rows.map(r=>`| ${r.join(" | ")} |`).join("\n")+`\n\n## BAB V PENUTUP\nRenstra dipantau melalui rapat operasional bulanan, tinjauan kinerja triwulanan, dan tinjauan strategi tahunan. Strategy map diuji sebagai hipotesis dan direvisi berdasarkan data.\n`;
    return t;};
  setTimeout(()=>{document.querySelectorAll("[data-rn]").forEach(el=>el.oninput=()=>{R[el.dataset.rn]=el.value;save();$("#rnOut").textContent=gen();});$("#rnOut").textContent=gen();
    $("#rnCp").onclick=()=>copy(gen());$("#rnMd").onclick=()=>download("Draf_Renstra.md",gen(),"text/markdown");
    $("#rnDoc").onclick=()=>{const md=gen();const html=md.split("\n").map(l=>l.startsWith("# ")?`<h1>${esc(l.slice(2))}</h1>`:l.startsWith("## ")?`<h2>${esc(l.slice(3))}</h2>`:l.startsWith("### ")?`<h3>${esc(l.slice(4))}</h3>`:l.startsWith("|")?(l.includes("---")?"":`<tr>${l.split("|").slice(1,-1).map(c=>`<td style="border:1px solid #999;padding:4px">${esc(c.trim())}</td>`).join("")}</tr>`):`<p>${esc(l).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\*(.+?)\*/g,"<i>$1</i>")}</p>`).join("").replace(/(<tr>.*?<\/tr>)+/gs,m=>`<table style="border-collapse:collapse">${m}</table>`);
      download("Draf_Renstra.doc",`<html><head><meta charset="utf-8"></head><body style="font-family:Calibri">${html}</body></html>`,"application/msword");};});
  return `<h1>Generator Renstra</h1><p>Draf Bab I–V disusun otomatis dari isian di bawah, matriks SWOT–TOWS, Strategy Map, Prioritas Inisiatif, dan Scorecard yang sudah Anda kerjakan.</p>
  <div class="grid g2"><div class="card"><label class="f">Nama institusi/unit</label><input data-rn="inst" value="${esc(R.inst)}"><label class="f">Periode</label><input data-rn="per" value="${esc(R.per)}"><label class="f">Visi</label><textarea data-rn="visi">${esc(R.visi)}</textarea><label class="f">Misi (satu per baris)</label><textarea data-rn="misi">${esc(R.misi)}</textarea><label class="f">Nilai</label><input data-rn="nilai" value="${esc(R.nilai)}"><label class="f">Kondisi umum & capaian</label><textarea data-rn="kondisi">${esc(R.kondisi)}</textarea></div>
  <div class="card"><div class="toolbar"><button class="btn" id="rnCp">📋 Salin draf</button><button class="btn o" id="rnMd">⬇ Markdown</button><button class="btn n" id="rnDoc">⬇ Word (.doc)</button></div><pre id="rnOut" style="white-space:pre-wrap;max-height:640px"></pre></div></div>`;
};

/* ---------- RTL ---------- */
P.rtl=()=>{
  const RT=get("rtl",{"30 hari":[{t:"Sosialisasi hasil pelatihan ke pimpinan",d:false},{t:"Bentuk tim inti BSC (SK)",d:false},{t:"Kumpulkan baseline 10 KPI",d:false}],"60 hari":[{t:"Finalisasi strategy map",d:false},{t:"Kamus KPI & pemilik",d:false},{t:"Draf cascading ke unit",d:false}],"90 hari":[{t:"Dashboard v1 berjalan",d:false},{t:"Rapat tinjauan kinerja #1",d:false},{t:"Revisi Renop/RKAT",d:false}]});
  setTimeout(()=>{const draw=()=>{$("#rtlG").innerHTML=Object.keys(RT).map((k,ci)=>{const done=RT[k].filter(x=>x.d).length;return `<div class="rtl-col" style="border-color:${COLORS[ci]}"><h2 style="margin:0 0 6px">${k}</h2><div class="small">${done}/${RT[k].length} selesai</div>${RT[k].map((x,i)=>`<div class="rtl-item"><input type="checkbox" data-k="${k}" data-i="${i}" ${x.d?"checked":""} aria-label="Selesai"><input data-k="${k}" data-t="${i}" value="${esc(x.t)}" style="${x.d?"text-decoration:line-through;color:#9CA3AF":""}"><button class="btn sm p" data-k="${k}" data-del="${i}">✕</button></div>`).join("")}<button class="btn sm o" data-add="${k}" style="margin-top:8px">+ Kegiatan</button></div>`;}).join("");
    document.querySelectorAll("#rtlG input[type=checkbox]").forEach(el=>el.onchange=()=>{RT[el.dataset.k][+el.dataset.i].d=el.checked;save();draw();});
    document.querySelectorAll("#rtlG [data-t]").forEach(el=>el.onchange=()=>{RT[el.dataset.k][+el.dataset.t].t=el.value;save();});
    document.querySelectorAll("#rtlG [data-del]").forEach(el=>el.onclick=()=>{RT[el.dataset.k].splice(+el.dataset.del,1);save();draw();});
    document.querySelectorAll("#rtlG [data-add]").forEach(el=>el.onclick=()=>{RT[el.dataset.add].push({t:"Kegiatan baru",d:false});save();draw();});};
    $("#rtlCp").onclick=()=>copy(Object.entries(RT).map(([k,v])=>k.toUpperCase()+"\n"+v.map(x=>`[${x.d?"x":" "}] ${x.t}`).join("\n")).join("\n\n"));draw();});
  return `<h1>Planner RTL 30-60-90 Hari</h1><p>Rencana tindak lanjut menjadi dasar evaluasi Kirkpatrick Level 3. Centang kegiatan yang selesai.</p><div class="toolbar"><button class="btn line" id="rtlCp">📋 Salin RTL</button></div><div class="grid g3" id="rtlG"></div>`;
};

/* ---------- TEMPLATE ---------- */
const TEMPL=[
 ["Kartu KPI (KPI Dictionary)","Kode & nama KPI : \nSasaran strategis : \nPerspektif : \nDefinisi : \nFormula : \nJenis (lead/lag) & polaritas : \nSumber data : \nFrekuensi : \nBaseline : \nTarget (per tahun) : \nAmbang warna : Hijau ≥100% · Kuning 80–99% · Merah <80%\nPemilik KPI : \nPengelola data : \nInisiatif terkait : \nRujukan : Kepmendiktisaintek 358/M/KEP/2025"],
 ["Format isu strategis","Bagaimana [institusi] dapat [mencapai sesuatu]\nmengingat [faktor penyebab / kendala],\nagar [konsekuensi yang dihindari / dicapai]?"],
 ["Uji kualitas visi","[ ] Spesifik – unggul dalam bidang apa?\n[ ] Berbatas waktu – kapan?\n[ ] Terukur – indikator keberhasilan?\n[ ] Membedakan – apa yang khas?\n[ ] Menginspirasi – bangga diucapkan warga kampus?"],
 ["Rencana inisiatif strategis","Nama inisiatif : \nSasaran/KPI yang didorong : \nKesenjangan kinerja (baseline vs target) : \nDeskripsi : \nTonggak (milestone) : \nAnggaran & sumber dana : \nPenanggung jawab : \nRisiko & mitigasi : \nStatus (RAG) : "],
 ["Perjanjian Kinerja (format SAKIP)","PERJANJIAN KINERJA TAHUN ____\nPihak Pertama : ____________ (jabatan)\nPihak Kedua   : ____________ (jabatan)\n\nNo | Sasaran Strategis | Indikator Kinerja | Target\n1  |                   |                   |\n2  |                   |                   |\n\nProgram & anggaran : ____________\n\n____________, __ ________ ____\nPihak Kedua                         Pihak Pertama"],
 ["Agenda rapat tinjauan kinerja triwulanan (90')","1. Pembukaan & tindak lanjut rapat sebelumnya ...... 10'\n2. Dashboard: KPI merah & kuning saja .............. 20'\n3. Analisis akar masalah 2 KPI prioritas (5 Whys) .. 30'\n4. Keputusan: perbaikan, realokasi, revisi target .. 20'\n5. Penetapan PIC & tenggat; komunikasi hasil ....... 10'"],
 ["Analisis capaian Laporan Kinerja (LKj)","Indikator : ________  Target: ____  Realisasi: ____  Capaian: ____%\nPerbandingan dengan tahun lalu : naik/turun ___ poin\nPerbandingan dengan target Renstra : ___% dari target akhir\nAnalisis penyebab keberhasilan/kegagalan : ________\nEfisiensi sumber daya : anggaran ____ ; realisasi ____\nRencana perbaikan & PIC : ________"],
 ["OKR untuk proyek akreditasi","Objective : Prodi siap akreditasi dengan bukti kinerja yang kuat\nKR1 : 100% dokumen LED kriteria 1–3 lengkap sebelum 31 Maret\nKR2 : Dashboard 10 KPI prodi aktif dan diperbarui bulanan\nKR3 : 3 MoA kerja sama industri baru dengan luaran terdokumentasi"],
 ["Kerangka Renstra Bab I–V","BAB I PENDAHULUAN (kondisi umum, capaian, SWOT/TOWS, mandat)\nBAB II VISI, MISI, NILAI, TUJUAN, SASARAN\nBAB III ARAH KEBIJAKAN & STRATEGI (strategy map, tema, inisiatif)\nBAB IV TARGET KINERJA & KERANGKA PENDANAAN (IKU/IKT 5 tahun; StratEx & OpEx)\nBAB V PENUTUP (pemantauan, evaluasi, revisi)"],
 ["Register risiko strategis","Risiko | Sasaran terdampak | Kemungkinan (R/S/T) | Dampak (R/S/T) | Mitigasi | PIC\n       |                   |                     |                |          |"],
];
P.template=()=>`<h1>Template Siap Salin</h1><p>Klik “Salin”, lalu tempel ke Word, Google Docs, atau Excel.</p><div class="grid g2">${TEMPL.map(([t,b])=>`<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(t)}</h3>${copyBtn(b)}</div><pre style="white-space:pre-wrap;margin-top:10px">${esc(b)}</pre></div>`).join("")}</div>
<h2>Kamus KPI (Lampiran B)</h2>${(()=>{const a=D.apps[1].blocks.find(b=>b.t==="table");return copyBtn(tableTSV(a.head,a.rows),"Salin kamus KPI")+tableHTML(a.head,a.rows);})()}`;

/* ---------- GLOSARIUM ---------- */
P.glosarium=()=>{setTimeout(()=>{const draw=()=>{const q=$("#gQ").value.toLowerCase();$("#gL").innerHTML=D.gloss.filter(g=>!q||(g[0]+g[1]).toLowerCase().includes(q)).map(g=>`<div class="card" style="padding:12px 16px;margin-bottom:8px"><div class="row" style="justify-content:space-between"><b style="color:var(--navy)">${esc(g[0])}</b>${copyBtn(g[0]+": "+g[1])}</div><div>${esc(g[1])}</div></div>`).join("")||"<p>Tidak ditemukan.</p>";};$("#gQ").oninput=draw;draw();});
  return `<h1>Glosarium</h1><div class="toolbar"><input id="gQ" placeholder="Cari istilah…" style="max-width:360px">${copyBtn(D.gloss.map(g=>g.join("\t")).join("\n"),"Salin semua")}</div><div id="gL"></div>`;};

/* ---------- KUIS ---------- */
const QZ=[["Siapa yang memperkenalkan Balanced Scorecard pada 1992?",["Bryson","Kaplan & Norton","Porter","Kirkpatrick"],1],["Pada BSC lembaga pendidikan, perspektif yang disarankan di puncak adalah…",["Keuangan","Proses internal","Dampak/stakeholder","SDM"],2],["IKU 1 pada Kepmen 358/M/KEP/2025 adalah…",["Publikasi bereputasi","Angka Efisiensi Edukasi","Pendapatan non-UKT","Keterlibatan SDGs"],1],["AEE ideal jenjang sarjana adalah…",["25%","33%","50%","100%"],0],["Contoh lead indicator untuk kelulusan tepat waktu…",["AEE","IPK lulusan","% mhs smt 7 sudah seminar proposal","Masa tunggu kerja"],2],["Pola cascading ketika unit memiliki KPI berbeda yang mendorong KPI induk…",["Identik","Kontributif","Unik","Linear"],1],["Matriks yang menyilangkan SWOT menjadi strategi…",["VRIO","PESTEL","TOWS","OKR"],2],["Kritik Nørreklit (2000) terhadap BSC terutama tentang…",["Biaya implementasi","Hubungan sebab-akibat","Perangkat lunak","Jumlah perspektif"],1],["Regulasi yang mencabut Permendikbudristek 53/2023…",["Permendiktisaintek 39/2025","Perpres 29/2014","Kepmen 358/2025","PermenPANRB 88/2021"],0],["Unit pengelola eksekusi strategi menurut Kaplan & Norton…",["SPI","OSM","BPM","LPPM"],1]];
P.kuis=()=>{const K=get("quiz",{pre:null,post:null});setTimeout(()=>{$("#qBtn").onclick=()=>{let s=0;QZ.forEach((q,i)=>{const v=document.querySelector(`input[name=q${i}]:checked`);const ok=v&&+v.value===q[2];if(ok)s++;$("#qa"+i).innerHTML=ok?'<span class="ok">✓ Benar</span>':`<span class="no">✗ Jawaban: ${esc(q[1][q[2]])}</span>`;});const m=$("#qMode").value;K[m]=s*10;save();$("#qRes").innerHTML=`Skor ${m}-test: <span class="stat">${s*10}</span>`+(K.pre!=null&&K.post!=null?` · Peningkatan (gain): <b>${K.post-K.pre} poin</b>`:"");};});
  return `<h1>Kuis Pre-test / Post-test</h1><div class="card"><div class="row"><label>Mode: <select id="qMode" style="width:auto"><option value="pre">Pre-test (JP 1)</option><option value="post">Post-test (JP 24)</option></select></label><span class="small">Skor tersimpan: pre ${K.pre??"–"} · post ${K.post??"–"}</span></div>
  ${QZ.map((q,i)=>`<div class="q"><b>${i+1}. ${esc(q[0])}</b>${q[1].map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}" style="width:auto"> ${esc(o)}</label>`).join("")}<div id="qa${i}"></div></div>`).join("")}
  <div class="row" style="margin-top:12px"><button class="btn o" id="qBtn">Periksa jawaban</button><div id="qRes"></div></div></div>`;};

P.pustaka=()=>`<h1>Daftar Pustaka (APA 7)</h1><div class="toolbar">${copyBtn(D.refs.join("\n\n"),"Salin semua referensi")}</div><div class="card">${D.refs.map(r=>`<p style="padding-left:2em;text-indent:-2em;margin:.5em 0">${esc(r).replace(/(https?:\/\/\S+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>')}</p>`).join("")}</div>`;


/* ======== OVERRIDES: versi Laporan Penelitian Dikdasmen ======== */
const PNAME={M:"Murid & Pemangku Kepentingan",P:"Proses Internal",L:"Pembelajaran & Pertumbuhan",K:"Sumber Daya & Akuntabilitas"};
TPL.kasus={lanes:["Misi / Murid & Pemangku Kep.","Proses Internal","Pembelajaran & Pertumbuhan","Sumber Daya & Akuntabilitas"],nodes:[["S1","Meningkatkan literasi & numerasi murid",0],["S2","Menguatkan karakter & kesejahteraan murid",0],["S3","Meningkatkan kepuasan & keterlibatan orang tua",0],["S4","Memastikan murid bertahan & melanjutkan",0],["P1","Pembelajaran mendalam & asesmen formatif",1],["P2","Intervensi murid di bawah kompetensi minimum",1],["P3","Iklim aman, inklusif, bebas perundungan",1],["P4","Kemitraan orang tua",1],["P5","Siklus PBD/SPMI berjalan",1],["L1","Komunitas belajar guru",2],["L2","Kepemimpinan instruksional",2],["L3","Kapabilitas data & TIK",2],["L4","Budaya refleksi",2],["R1","Alokasi BOSP selaras prioritas",3],["R2","Pelaporan tepat & akuntabel",3],["R3","Sarpras layak",3]],links:[["L1","P1"],["L2","P1"],["L2","P2"],["L3","P5"],["L4","P3"],["R1","P2"],["R1","L1"],["R3","P3"],["P1","S1"],["P2","S1"],["P3","S2"],["P4","S3"],["P5","S4"],["P2","S4"]]};
getMap=function(){if(!ST.map) ST.map=fromTpl("kasus"); return ST.map;};

P.beranda=()=>`
<section class="hero"><img src="img/collage_riset.jpg" alt="Kolase foto kelas, kelulusan, perencanaan, dan dashboard"><div class="stripe">${COLORS.slice(0,6).map(c=>`<i style="background:${c}"></i>`).join("")}</div>
<div class="txt"><span class="badge">Laporan Penelitian</span><span class="badge" style="background:var(--teal)">DSRM · Delphi · AHP</span><span class="badge" style="background:var(--pink)">Rapor Pendidikan · RKAS/BOSP</span>
<h1>${esc(D.title)}</h1><p><b style="color:#FFC93C">${esc(D.sub)}</b><br>${esc(D.author)} · Program Studi Sistem Informasi, Universitas Widyatama</p></div></section>
<div class="card"><h2 style="margin-top:0">Abstrak</h2>${D.abstrak.map(p=>`<p>${esc(p)}</p>`).join("")}<p><i>${esc(D.kw)}</i></p>${copyBtn(D.abstrak.join("\n\n")+"\n\n"+D.kw,"Salin abstrak")}</div>
<div class="grid g4">
${[["#planner","Research Planner 16 Langkah","Alur DSRM: diagnosis → Delphi → AHP → scorecard → evaluasi",7],["#materi","Laporan Lengkap","Bab 1–5 + lampiran, siap salin",0],["#map","Strategy Map Sekolah","Seret, tarik panah, ekspor PNG",1],["#ahp","Kalkulator AHP","Bobot perspektif + CR",2],["#delphi","Kalkulator Delphi–CVR","Validasi KPI (Ayre & Scally)",3],["#scorecard","Scorecard & Dasbor","23 KPI, RAG otomatis",4],["#bosp","Cek RKAS/BOSP","Batas juknis & kode sasaran",5],["#cascade","Matriks Cascading","Sekolah → unit → guru",6],["#sus","Kalkulator SUS","Uji usabilitas artefak",7]].map(([h,t,s,i])=>`<a class="tile" href="${h}" style="background:${COLORS[i]};${i===6?"color:#1B2A6B":""}"><b>${t}</b><span>${s}</span></a>`).join("")}
</div>
<div class="card" style="margin-top:18px"><h2 style="margin-top:0">Alur penelitian</h2><figure><img src="img/r23_dsrm.jpg" alt="Alur DSRM"><figcaption>Enam aktivitas DSRM beserta metode</figcaption></figure></div>`;

P.materi=()=>`<h1>Laporan Penelitian</h1><p>Klik bab untuk membuka. Tabel, kotak, dan rumus memiliki tombol salin; “Salin bab” menyalin seluruh teks bab.</p>
<div class="card"><h2 style="margin-top:0">Abstrak</h2>${D.abstrak.map(p=>`<p>${esc(p)}</p>`).join("")}</div>
${D.chapters.map((c,i)=>`<details ${i===0?"open":""}><summary>Bab ${["I","II","III","IV","V"][i]}. ${esc(c.title)}</summary><div class="inner"><div style="text-align:right">${copyBtn(`BAB ${["I","II","III","IV","V"][i]} ${c.title}\n\n`+plain(c.blocks),"Salin bab")}</div>${blocks(c.blocks,i+1)}</div></details>`).join("")}
<h2>Lampiran</h2>${D.apps.map((a,i)=>`<details><summary>${esc(a.title)}</summary><div class="inner">${blocks(a.blocks,String.fromCharCode(65+i))}</div></details>`).join("")}`;

/* ---------- AHP ---------- */
const SAATY=[9,8,7,6,5,4,3,2,1,1/2,1/3,1/4,1/5,1/6,1/7,1/8,1/9];
const sv=v=>v>=1?String(v):"1/"+Math.round(1/v);
function ahpCalc(A){const n=A.length;let w=Array(n).fill(1/n);for(let it=0;it<100;it++){const nw=A.map(r=>r.reduce((s,a,j)=>s+a*w[j],0));const s=nw.reduce((a,b)=>a+b,0);w=nw.map(x=>x/s);}
  const Aw=A.map(r=>r.reduce((s,a,j)=>s+a*w[j],0));const lam=Aw.reduce((s,x,i)=>s+x/w[i],0)/n;const RI={1:0,2:0,3:.58,4:.9,5:1.12,6:1.24,7:1.32,8:1.41,9:1.45,10:1.49}[n];const ci=(lam-n)/(n-1);return {w,lam,ci,cr:RI?ci/RI:0};}
P.ahp=()=>{
  const AH=get("ahpM",{names:["Murid & Pemangku Kep.","Proses Internal","Pembelajaran & Pertumbuhan","Sumber Daya & Akuntabilitas"],u:{"0-1":2,"0-2":3,"0-3":5,"1-2":2,"1-3":3,"2-3":2}});
  setTimeout(()=>{const draw=()=>{const n=AH.names.length;const A=[...Array(n)].map((_,i)=>[...Array(n)].map((_,j)=>i===j?1:(i<j?AH.u[`${i}-${j}`]||1:1/(AH.u[`${j}-${i}`]||1))));
    const cellH=(v,i,j)=>{ if(i===j) return "1"; if(i>j) return sv(v); const opts=SAATY.map(s=>'<option value="'+s+'"'+(Math.abs(s-v)<1e-6?' selected':'')+'>'+sv(s)+'</option>').join(""); return '<select data-u="'+i+'-'+j+'">'+opts+'</select>'; };
    let th='<th></th>'+AH.names.map(x=>'<th>'+esc(x)+'</th>').join("");
    let tb=A.map((r,i)=>'<tr><td><b>'+esc(AH.names[i])+'</b></td>'+r.map((v,j)=>'<td>'+cellH(v,i,j)+'</td>').join("")+'</tr>').join("");
    $("#ahpT").innerHTML='<div class="tw"><table><thead><tr>'+th+'</tr></thead><tbody>'+tb+'</tbody></table></div>';
    document.querySelectorAll("[data-u]").forEach(el=>el.onchange=()=>{AH.u[el.dataset.u]=+el.value;save();draw();});
    const r=ahpCalc(A);const ok=r.cr<=0.1;
    $("#ahpR").innerHTML=`<div class="grid g4">${r.w.map((w,i)=>`<div class="kpi" style="background:${["#E63E8C","#00A6A6","#7B4FE0","#FF7A1A","#2EBD6B","#3BA7FF"][i%6]}"><small style="color:#fff">${esc(AH.names[i])}</small><b>${fmt(w*100,1)}%</b></div>`).join("")}</div>
     <p style="margin-top:12px">λmax = <b>${fmt(r.lam,4)}</b> · CI = <b>${fmt(r.ci,4)}</b> · CR = <b class="${ok?"ok":"no"}">${fmt(r.cr,4)} ${ok?"(konsisten)":"(tidak konsisten — revisi penilaian)"}</b></p>`+copyBtn(AH.names.map((x,i)=>x+"\t"+fmt(r.w[i]*100,2)+"%").join("\n")+`\nCR\t${fmt(r.cr,4)}`,"Salin bobot");};
    $("#ahpRes").onclick=()=>{const g=D.ahp.group.matrix;const n=4;AH.names=["Murid & Pemangku Kep.","Proses Internal","Pembelajaran & Pertumbuhan","Sumber Daya & Akuntabilitas"];AH.u={};for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){let v=g[i][j];let best=SAATY.reduce((a,b)=>Math.abs(Math.log(b)-Math.log(v))<Math.abs(Math.log(a)-Math.log(v))?b:a);AH.u[`${i}-${j}`]=best;}save();draw();toast("Matriks agregat penelitian dimuat (dibulatkan ke skala Saaty)");};
    $("#ahpAdd").onclick=async()=>{const r=await dlg("Tambah kriteria",[{label:"Nama kriteria",value:"Kriteria baru"}]);if(r&&r[0].trim()&&AH.names.length<8){AH.names.push(r[0].trim());save();draw();}};
    $("#ahpDel").onclick=()=>{if(AH.names.length>3){const n=AH.names.length-1;AH.names.pop();Object.keys(AH.u).forEach(k=>{if(k.split("-").includes(String(n)))delete AH.u[k];});save();draw();}};
    draw();});
  return `<h1>Kalkulator AHP</h1><p>Isi segitiga atas matriks dengan skala Saaty (1–9 atau kebalikannya). Bobot dihitung dengan metode eigenvektor dan diuji konsistensinya (CR ≤ 0,10).</p>
  <div class="card"><div class="toolbar"><button class="btn n" id="ahpRes">Muat agregat hasil penelitian</button><button class="btn o" id="ahpAdd">+ Kriteria</button><button class="btn line" id="ahpDel">− Kriteria terakhir</button></div><div id="ahpT"></div></div>
  <div class="card"><h2 style="margin-top:0">Hasil</h2><div id="ahpR"></div></div>
  <div class="card"><h3>Hasil penelitian (7 responden, agregat geometrik)</h3><figure><img src="img/r34_ahp.jpg" alt="Hasil AHP"></figure></div>`;
};

/* ---------- Delphi CVR ---------- */
function critNe(N){const C=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return r;};for(let ne=Math.ceil(N/2);ne<=N;ne++){let p=0;for(let k=ne;k<=N;k++)p+=C(N,k);p/=Math.pow(2,N);if(p<0.05)return ne;}return N;}
P.delphi=()=>{
  const DL=get("delphi",{N:12,rows:D.kpi.map(r=>({c:r.code,k:r.name,ne:r.ne2,med:r.med,iqr:r.iqr}))});
  setTimeout(()=>{const draw=()=>{const N=+DL.N||1;const ce=critNe(N);const cc=(ce-N/2)/(N/2);
    $("#dlInfo").innerHTML=`N = ${N} → nilai kritis Ayre & Scally: nₑ ≥ <b>${ce}</b> (CVR ≥ <b>${fmt(cc,3)}</b>) · uji binomial satu sisi α = 0,05`;
    let acc=0;$("#dlT").innerHTML=`<div class="tw"><table><thead><tr><th>Kode</th><th>KPI</th><th>nₑ</th><th>CVR</th><th>Median</th><th>IQR</th><th>Keputusan</th><th></th></tr></thead><tbody>${DL.rows.map((r,i)=>{const cvr=(r.ne-N/2)/(N/2);const ok=r.ne>=ce&&r.med>=4&&r.iqr<=1;if(ok)acc++;return `<tr><td><input data-d="${i}" data-f="c" value="${esc(r.c)}" style="width:60px"></td><td><input data-d="${i}" data-f="k" value="${esc(r.k)}"></td><td><input type="number" data-d="${i}" data-f="ne" value="${r.ne}" style="width:70px"></td><td><b>${fmt(cvr,3)}</b></td><td><input type="number" step="0.5" data-d="${i}" data-f="med" value="${r.med}" style="width:70px"></td><td><input type="number" step="0.25" data-d="${i}" data-f="iqr" value="${r.iqr}" style="width:70px"></td><td class="${ok?"rag-H":"rag-M"}"><b>${ok?"Valid":"Tidak valid"}</b></td><td><button class="btn sm p" data-dx="${i}">✕</button></td></tr>`;}).join("")}</tbody></table></div><p><b>${acc}</b> dari ${DL.rows.length} KPI valid.</p>`;
    document.querySelectorAll("[data-d]").forEach(el=>el.onchange=()=>{const f=el.dataset.f;DL.rows[+el.dataset.d][f]=["c","k"].includes(f)?el.value:+el.value;save();draw();});
    document.querySelectorAll("[data-dx]").forEach(el=>el.onclick=()=>{DL.rows.splice(+el.dataset.dx,1);save();draw();});};
    $("#dlN").oninput=e=>{DL.N=+e.target.value;save();draw();};
    $("#dlAdd").onclick=()=>{DL.rows.push({c:"X"+(DL.rows.length+1),k:"KPI baru",ne:0,med:3,iqr:2});save();draw();};
    $("#dlCp").onclick=()=>{const N=+DL.N,ce=critNe(N);copy(["Kode\tKPI\tne\tCVR\tMedian\tIQR\tKeputusan",...DL.rows.map(r=>[r.c,r.k,r.ne,fmt((r.ne-N/2)/(N/2),3),r.med,r.iqr,(r.ne>=ce&&r.med>=4&&r.iqr<=1)?"Valid":"Tidak valid"].join("\t"))].join("\n"));};
    draw();});
  return `<h1>Kalkulator Delphi – CVR</h1><p>CVR = (nₑ − N/2)/(N/2). KPI valid bila nₑ ≥ nilai kritis Ayre & Scally (2014), median ≥ 4, dan IQR ≤ 1.</p>
  <div class="card"><div class="row"><label>Jumlah pakar (N): <input id="dlN" type="number" min="5" max="40" value="${DL.N}" style="width:90px"></label><span id="dlInfo"></span></div>
  <div class="toolbar"><button class="btn o" id="dlAdd">+ KPI</button><button class="btn line" id="dlCp">📋 Salin tabel</button></div><div id="dlT"></div></div>
  <div class="card"><figure><img src="img/r35_delphi.jpg" alt="Hasil Delphi penelitian"><figcaption>Hasil Delphi penelitian (putaran 1 → 2)</figcaption></figure></div>`;
};

/* ---------- Cek RKAS/BOSP ---------- */
P.bosp=()=>{
  const BS=get("bosp",{total:1036800000,status:"negeri",coded:82,c:[["Buku",11],["Pembelajaran & ekstrakurikuler",19],["Asesmen/evaluasi",7],["Pengembangan profesi guru",7],["Administrasi",7],["Langganan daya & jasa",9.5],["Pemeliharaan sarpras",14],["Multimedia",9.5],["Honor",16]]});
  setTimeout(()=>{const draw=()=>{const sum=BS.c.reduce((a,b)=>a+(+b[1]||0),0);const g=n=>+(BS.c.find(x=>x[0].startsWith(n))||[0,0])[1];const hm=BS.status==="negeri"?20:40;
    const checks=[["Buku ≥ 10%",g("Buku")>=10,g("Buku")+"%"],[`Honor ≤ ${hm}% (${BS.status})`,g("Honor")<=hm,g("Honor")+"%"],["Pemeliharaan sarpras ≤ 20%",g("Pemeliharaan")<=20,g("Pemeliharaan")+"%"],["Total = 100%",Math.abs(sum-100)<0.01,fmt(sum,1)+"%"],["Belanja berkode sasaran ≥ 80% (K1)",BS.coded>=80,BS.coded+"%"]];
    $("#bsT").innerHTML=`<div class="tw"><table><thead><tr><th>Komponen</th><th>%</th><th>Rupiah</th></tr></thead><tbody>${BS.c.map((r,i)=>`<tr><td>${esc(r[0])}</td><td><input type="number" step="0.5" data-b="${i}" value="${r[1]}" style="width:90px"></td><td>Rp${Math.round(BS.total*r[1]/100).toLocaleString("id-ID")}</td></tr>`).join("")}</tbody></table></div>`;
    $("#bsC").innerHTML=checks.map(([t,ok,v])=>`<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--line)"><span class="${ok?"ok":"no"}">${ok?"✓":"✗"}</span> ${esc(t)} <b style="margin-left:auto">${v}</b></div>`).join("");
    document.querySelectorAll("[data-b]").forEach(el=>el.onchange=()=>{BS.c[+el.dataset.b][1]=+el.value;save();draw();});
    barChart($("#bsG"),BS.c.map(r=>r[0]),BS.c.map(r=>r[1]),BS.c.map((r,i)=>COLORS[i%8]));};
    $("#bsTot").oninput=e=>{BS.total=+e.target.value;save();draw();};$("#bsSt").onchange=e=>{BS.status=e.target.value;save();draw();};$("#bsCo").oninput=e=>{BS.coded=+e.target.value;save();draw();};draw();});
  return `<h1>Cek RKAS / BOSP</h1><p>Periksa kepatuhan batas penggunaan BOS Reguler (Juknis BOSP 2026) dan porsi belanja yang berkode sasaran strategis. Verifikasi batas terbaru pada juknis resmi.</p>
  <div class="grid g3"><div class="card"><label class="f">Total BOS Reguler (Rp)</label><input id="bsTot" type="number" value="${BS.total}"><label class="f">Status sekolah</label><select id="bsSt"><option value="negeri" ${BS.status==="negeri"?"selected":""}>Negeri</option><option value="swasta" ${BS.status==="swasta"?"selected":""}>Swasta</option></select><label class="f">% belanja berkode sasaran</label><input id="bsCo" type="number" value="${BS.coded}"></div>
  <div class="card" style="grid-column:span 2"><h3 style="margin-top:0">Hasil pemeriksaan</h3><div id="bsC"></div></div></div>
  <div class="card"><div id="bsT"></div><canvas id="bsG" width="1100" height="300" style="width:100%"></canvas></div>`;
};

/* ---------- SUS ---------- */
const SUSQ=["Saya akan sering menggunakan dasbor ini.","Dasbor ini terlalu rumit.","Dasbor ini mudah digunakan.","Saya butuh bantuan teknisi untuk memakainya.","Fungsi-fungsinya terintegrasi dengan baik.","Terlalu banyak inkonsistensi.","Kebanyakan orang akan cepat mempelajarinya.","Dasbor ini merepotkan.","Saya percaya diri menggunakannya.","Saya perlu banyak belajar sebelum bisa memakainya."];
P.sus=()=>{const SU=get("susR",[]);setTimeout(()=>{
  const draw=()=>{const avg=SU.length?SU.reduce((a,b)=>a+b,0)/SU.length:0;$("#suL").innerHTML=SU.length?`Responden: <b>${SU.length}</b> · rerata SUS: <span class="stat">${fmt(avg,1)}</span> ${avg>=80.3?"(A – sangat baik)":avg>=68?"(di atas rata-rata)":"(di bawah rata-rata 68)"}<br>${SU.map((s,i)=>`<span class="chip">R${i+1}: ${fmt(s,1)}</span>`).join("")}`:"Belum ada responden.";};
  $("#suB").onclick=()=>{const v=SUSQ.map((_,i)=>{const e=document.querySelector(`input[name=s${i}]:checked`);return e?+e.value:null;});if(v.includes(null)){toast("Lengkapi 10 butir");return;}const sc=(v.filter((_,i)=>i%2===0).reduce((a,b)=>a+b-1,0)+v.filter((_,i)=>i%2===1).reduce((a,b)=>a+5-b,0))*2.5;SU.push(sc);save();draw();toast("Skor responden: "+fmt(sc,1));document.querySelectorAll("#suF input").forEach(x=>x.checked=false);};
  $("#suX").onclick=()=>{SU.length=0;save();draw();};draw();});
  return `<h1>Kalkulator SUS</h1><p>System Usability Scale (Brooke, 1996): 1 = sangat tidak setuju, 5 = sangat setuju. Skor 0–100; rata-rata industri 68. Hasil penelitian: ${fmt(D.sus.reduce((a,b)=>a+b,0)/D.sus.length,1)}.</p>
  <div class="card" id="suF">${SUSQ.map((q,i)=>`<div class="q"><b>${i+1}. ${esc(q)}</b><div class="row">${[1,2,3,4,5].map(v=>`<label style="display:inline-flex;gap:4px"><input type="radio" name="s${i}" value="${v}" style="width:auto">${v}</label>`).join("")}</div></div>`).join("")}
  <div class="row" style="margin-top:10px"><button class="btn o" id="suB">Simpan responden</button><button class="btn line" id="suX">Reset</button></div></div><div class="card" id="suL"></div>`;};

/* ---------- Template ---------- */
TEMPL.length=0;
[["Format isu strategis sekolah","Bagaimana [sekolah] dapat [menaikkan indikator Rapor X dari a ke b]\nmengingat [akar masalah hasil refleksi PBD],\nagar [konsekuensi bagi murid]?"],
 ["Kartu KPI sekolah","Kode & nama     : \nSasaran         : \nFormula         : \nJenis/polaritas : Lead/Lag · +/−\nSumber data     : Rapor Pendidikan / Dapodik / ARKAS / supervisi\nBaseline        : \nTarget 2027/2029: \nAmbang RAG      : Hijau ≥ target · Kuning 90–99% · Merah < 90%\nPemilik         : \nKPI lead terkait: "],
 ["Baris RKAS berkode sasaran","Kode sasaran | Program RKT | Kegiatan | Komponen BOSP | Anggaran | KPI terkait\nP2/S1        | Intervensi numerasi | Kelas penguatan 2×/minggu | Pembelajaran & ekskul | Rp45.000.000 | P3, M2"],
 ["Notulen tinjauan triwulanan","Tanggal/peserta : \nKPI merah & kuning : \nAnalisis akar masalah (5 Whys) : \nKeputusan (perbaikan/realokasi/revisi target) : \nPIC & tenggat : \nHipotesis strategy map yang diuji ulang : "],
 ["Struktur RKJM berbasis BSC","BAB I   Evaluasi diri (PBD) & tren Rapor 3 tahun\nBAB II  Visi, misi, nilai, tujuan\nBAB III Strategy map & sasaran per perspektif\nBAB IV  Kamus KPI, baseline & target 4 tahun\nBAB V   Program strategis & pendanaan\nBAB VI  Tata kelola: Tim Strategi, ritme tinjauan, cascading"],
 ["Root definition (SSM)","Sistem milik kepala sekolah dan komite, dijalankan Tim Strategi dan guru,\nuntuk mengubah data Rapor Pendidikan menjadi keputusan program dan anggaran yang terarah,\ndengan keyakinan bahwa belanja sekolah harus menggerakkan hasil belajar,\ndalam batasan Juknis BOSP, SNP, IASP, dan siklus AN, demi murid dan orang tua."]].forEach(x=>TEMPL.push(x));
P.template=()=>`<h1>Template Siap Salin</h1><div class="grid g2">${TEMPL.map(([t,b])=>`<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${esc(t)}</h3>${copyBtn(b)}</div><pre style="white-space:pre-wrap;margin-top:10px">${esc(b)}</pre></div>`).join("")}</div>
<h2>Kamus 23 KPI tervalidasi</h2>${(()=>{const rows=D.kpi.filter(r=>r.accept).map(r=>[r.code,r.name,PNAME[r.p],r.type,r.src]);return copyBtn(tableTSV(["Kode","KPI","Perspektif","Jenis","Sumber"],rows),"Salin kamus KPI")+tableHTML(["Kode","KPI","Perspektif","Jenis","Sumber"],rows);})()}`;

/* ---------- router ---------- */
function route(keep){const k=(location.hash||"#beranda").slice(1);COPYREG=[];PAGEKEYS=new Set();const y=window.scrollY;const f=P[k]||P.beranda;app.innerHTML=f();document.querySelectorAll(".side a").forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+k));$("#side").classList.remove("open");window.scrollTo(0,keep===true?y:0);document.title=(document.querySelector(".side a.on")?.textContent||"Beranda")+" · SEP & BSC Studio";updUndo();setTimeout(abbrFooter,60);}
/* ---------- keterangan singkatan di bagian paling bawah setiap halaman ---------- */
const ABBR=window.ABBR||[];const FIGAB=window.FIGABBR||{};
const ABRE=ABBR.map(([k,v])=>[k,v,new RegExp("(?<![A-Za-z0-9À-ÿ])"+k.replace(/[.*+?^${}()|[\]\\\/-]/g,"\\$&")+"(?![A-Za-z0-9À-ÿ])")]);
function pageText(){const parts=[];const walk=n=>{if(n.nodeType===3){parts.push(n.nodeValue);return;}if(n.nodeType!==1)return;if(n.classList&&n.classList.contains("abbr"))return;if(/SCRIPT|STYLE/.test(n.tagName))return;
  if(n.tagName==="INPUT"||n.tagName==="TEXTAREA")parts.push(n.value||n.placeholder||"");if(n.tagName==="SELECT"&&n.selectedOptions[0])parts.push(n.selectedOptions[0].textContent);
  if(n.tagName==="IMG"){const b=(n.getAttribute("src")||"").split("/").pop();(FIGAB[b]||[]).forEach(x=>parts.push(x));parts.push(n.alt||"");}
  if(n.tagName==="SELECT")return;for(const c of n.childNodes)walk(c);};walk(app);return parts.join(" \n ");}
let abT=null,abLast="";
function abbrFooter(){const t=pageText();const hits=ABRE.filter(([k,v,re])=>re.test(t)).map(([k,v])=>`<b>${esc(k)}</b> = ${esc(v)}`);const html=hits.length?"singkatan: "+hits.join("; "):"";
  let f=app.querySelector(":scope > .abbr");if(!html){if(f)f.remove();abLast="";return;}if(html===abLast&&f&&f===app.lastElementChild)return;abLast=html;
  if(!f){f=document.createElement("div");f.className="abbr";}f.innerHTML=html;app.appendChild(f);}
new MutationObserver(ms=>{if(ms.every(m=>m.target.closest&&m.target.closest(".abbr")))return;clearTimeout(abT);abT=setTimeout(abbrFooter,500);}).observe(app,{childList:true,subtree:true,characterData:true});
app.addEventListener("input",()=>{clearTimeout(abT);abT=setTimeout(abbrFooter,700);});
window.SEPAPI={P,get,save,esc,fmt,copy,download,dlg,toast,tableHTML,tableTSV,COLORS,route:()=>route(true),undo,snapshotNow,getST:()=>ST,D};
(window.SEP_EXT||[]).forEach(fn=>{try{fn(window.SEPAPI);}catch(e){console.error(e);}});
window.addEventListener("hashchange",()=>route());route();
$("#undoBtn").onclick=undo;$("#redoBtn").onclick=redo;$("#resetBtn").onclick=resetMenu;
$("#menuBtn").onclick=()=>$("#side").classList.toggle("open");
$("#exportBtn").onclick=()=>download("sep-bsc-pekerjaan.json",JSON.stringify(ST,null,1),"application/json");
$("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{snapshotNow();ST=JSON.parse(t);save();route(true);toast("Pekerjaan berhasil dimuat");}catch(_){toast("Berkas tidak valid");}});};
/* ---------- PWA ---------- */
let deferred=null;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferred=e;$("#installBtn").classList.remove("hidden");});
$("#installBtn").onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$("#installBtn").classList.add("hidden");};
if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("sw.js").catch(()=>{});});}
})();
