document.addEventListener("DOMContentLoaded", function(){
  if(!document.getElementById("totalGuru")) return;

  console.log("✅ Dashboard jalan");

  // ================= AMBIL DATA =================
  let identitas = JSON.parse(localStorage.getItem("identitas")) || {};

  let guru = JSON.parse(localStorage.getItem("guru")) || [];
  let kelas = JSON.parse(localStorage.getItem("kelas")) || [];
  let jadwal = JSON.parse(localStorage.getItem("jadwal")) || [];

  console.log("DATA GURU:", guru);
  console.log("DATA KELAS:", kelas);
  console.log("DATA JADWAL:", jadwal);

  // ================= VALIDASI ELEMENT =================
  function setText(id, value){
    let el = document.getElementById(id);
    if(el) el.innerText = value;
  }

  // ================= IDENTITAS =================
  setText("nama", identitas.nama || "Nama Sekolah");
  setText("tahun", "Tahun: " + (identitas.tahun || "-"));
  setText("alamat", identitas.alamat || "-");
  setText("kepsek", identitas.kepsek || "-");

    // ================= RUNNING TEXT =================
  let runningText = document.getElementById("runningText");

  if(runningText){
    runningText.innerText =
      `📢 Jadwal Pelajaran Anti Bentrok ${identitas.nama || "Madrasah"} Tahun Pelajaran ${identitas.tahun || "2025-2026"}`;
  }

  if(identitas.logo){
    let logo = document.getElementById("logo");
    if(logo) logo.src = identitas.logo;
  }

  // ================= STATISTIK =================
  setText("totalGuru", guru.length);
  setText("totalKelas", kelas.length);
  setText("totalJadwal", jadwal.length);

  // ================= CHART =================
  let ctx = document.getElementById("chartStat");

  if(ctx){
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Guru', 'Kelas', 'Jadwal'],
        datasets: [{
          data: [guru.length, kelas.length, jadwal.length],
          backgroundColor: ['#3498db','#2ecc71','#f39c12']
        }]
      },
      options: {
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  // ================= JADWAL HARI INI =================
  tampilHariIni();

});

// ================= FUNCTION JADWAL =================
function tampilHariIni(){

  let hari = new Date().toLocaleDateString("id-ID", { weekday: 'long' });

  let jadwal = JSON.parse(localStorage.getItem("jadwal")) || [];
  let kelas = JSON.parse(localStorage.getItem("kelas")) || [];
  let guruList = JSON.parse(localStorage.getItem("guru")) || [];

  let el = document.getElementById("jadwalHariIni");
  if(!el) return;

  // 🔥 FILTER HARI INI
  let data = jadwal.filter(j => j.hari === hari);

  if(data.length === 0){
    el.innerHTML = `<div class="text-muted">Tidak ada jadwal hari ini</div>`;
    return;
  }

  // ================= JAM DINAMIS =================
  let jamList = [...new Set(data.map(j => parseInt(j.jam)))].sort((a,b)=>a-b);

  // ================= URUTKAN KELAS =================
  let grup = { VII:[], VIII:[], IX:[] };

  kelas.forEach(k=>{
    if(k.startsWith("VII")) grup.VII.push(k);
    else if(k.startsWith("VIII")) grup.VIII.push(k);
    else if(k.startsWith("IX")) grup.IX.push(k);
  });

  grup.VII.sort();
  grup.VIII.sort();
  grup.IX.sort();

  let semuaKelas = [...grup.VII, ...grup.VIII, ...grup.IX];

  // ================= RENDER =================
  let html = `<div class="jadwal-grid-wrapper">
  <table class="table table-bordered text-center jadwal-grid">`;

  // HEADER
  html += `<tr>
    <th>Jam</th>
    ${semuaKelas.map(k => `<th>${k}</th>`).join("")}
  </tr>`;

  // BODY
  jamList.forEach(jam => {

    html += `<tr>`;
    html += `<td class="jam-col">${jam}</td>`;

    semuaKelas.forEach(kls => {

      let item = data.find(j => j.jam == jam && j.kelas == kls);

      let namaMapel = "-";
      let namaGuru = "";

      if(item){

        // 🔥 AMBIL MAPEL
        namaMapel = item.mapel;

        // 🔥 FIX kalau mapel kosong
        if(!namaMapel && item.guruKode){
          let g = guruList.find(x => x.kode === item.guruKode);
          if(g){
            namaMapel = Array.isArray(g.mapel) ? g.mapel[0] : g.mapel;
          }
        }

        if(!namaMapel) namaMapel = "-";

        // 🔥 AMBIL NAMA GURU
        if(item.guruKode){
          let g = guruList.find(x => x.kode === item.guruKode);
          if(g) namaGuru = g.nama;
        }
      }

      html += `
        <td class="cell-mapel"
            data-bs-toggle="tooltip"
            title="${namaGuru}">
            
          ${item 
            ? `<div class="mapel">${namaMapel}</div>` 
            : `<span class="kosong">-</span>`}
        </td>
      `;
    });

    html += `</tr>`;
  });

  html += `</table></div>`;

  el.innerHTML = html;

  // 🔥 AKTIFKAN TOOLTIP
  setTimeout(()=>{
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el=>{
      new bootstrap.Tooltip(el);
    });
  },100);
}

