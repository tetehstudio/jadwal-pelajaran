// ================= DATA =================
let jadwal = JSON.parse(localStorage.getItem("jadwal")) || [];
let kelas = JSON.parse(localStorage.getItem("kelas")) || [];

let jamPerHari = JSON.parse(localStorage.getItem("jamPerHari")) || {
  "Senin": 8,
  "Selasa": 8,
  "Rabu": 8,
  "Kamis": 8,
  "Jumat": 6,
  "Sabtu": 4
};

const hariList = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

let dragData = null;

// ================= NORMALISASI MAPEL =================
(function(){
  let guru = JSON.parse(localStorage.getItem("guru")) || [];
  let berubah = false;

  guru = guru.map(g => {
    if(typeof g.mapel === "string" && g.mapel.includes(",")){
      berubah = true;
      return { ...g, mapel: g.mapel.split(",").map(m => m.trim()) };
    }
    if(!Array.isArray(g.mapel)){
      berubah = true;
      return { ...g, mapel: [g.mapel] };
    }
    return g;
  });

  if(berubah){
    localStorage.setItem("guru", JSON.stringify(guru));
  }
})();

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  loadBrand();
  render();

  let elGuru = document.getElementById("mGuru");
  if(elGuru){
    elGuru.addEventListener("change", function(){
      isiDropdownMapel(this.value);
    });
  }
});

// ================= GROUP KELAS =================
function groupKelas(){
  let grup = { VII:[], VIII:[], IX:[] };

  kelas.sort((a,b)=>a.localeCompare(b));

  kelas.forEach(k=>{
    if(k.startsWith("VII ")) grup.VII.push(k);
    else if(k.startsWith("VIII ")) grup.VIII.push(k);
    else if(k.startsWith("IX ")) grup.IX.push(k);
  });

  return grup;
}

// ================= HELPER =================
function getNamaGuru(kode){
  let dataGuru = JSON.parse(localStorage.getItem("guru")) || [];
  let g = dataGuru.find(x => x.kode === kode);
  return g ? g.nama : kode;
}

// ================= RENDER =================
function render(){
  destroyTooltip();

  let grup = groupKelas();
  let semuaKelas = [...grup.VII, ...grup.VIII, ...grup.IX];

  if(semuaKelas.length === 0){
    document.getElementById("grid").innerHTML =
      "<div class='text-center text-muted'>Belum ada data kelas</div>";
    return;
  }

  let html = `<table class="table table-bordered text-center">`;

  html += `<tr>
    <th rowspan="2">Hari</th>
    <th rowspan="2">Jam</th>
    ${grup.VII.length ? `<th colspan="${grup.VII.length}">VII</th>` : ""}
    ${grup.VIII.length ? `<th colspan="${grup.VIII.length}">VIII</th>` : ""}
    ${grup.IX.length ? `<th colspan="${grup.IX.length}">IX</th>` : ""}
  </tr>`;

  html += `<tr>
    ${grup.VII.map(k=>`<th>${k}</th>`).join("")}
    ${grup.VIII.map(k=>`<th>${k}</th>`).join("")}
    ${grup.IX.map(k=>`<th>${k}</th>`).join("")}
  </tr>`;

  hariList.forEach(hari=>{
    let totalJam = jamPerHari[hari];

    for(let j=1; j<=totalJam; j++){
      html += `<tr>`;

      if(j===1){
          html += `
          <td rowspan="${totalJam}">
            <b>${hari}</b><br>

            <button onclick="tambahJam('${hari}')"
              class="btn btn-success btn-sm mt-1"
              style="font-size:10px">
              ➕
            </button>

            <button onclick="hapusJam('${hari}')"
              class="btn btn-danger btn-sm mt-1"
              style="font-size:10px">
              ➖
            </button>
          </td>
          `;
        }

      html += `<td>${j}</td>`;

      semuaKelas.forEach(kls=>{
        let isi = jadwal.find(x =>
          x.hari===hari && x.jam===j && x.kelas===kls
        );

        html += `
        <td
          draggable="${isi ? 'true' : 'false'}"
          ondragstart="dragStart(event,'${hari}',${j},'${kls}')"
          ondragover="allowDrop(event)"
          ondrop="dropJadwal(event,'${hari}',${j},'${kls}')"
          onclick="isiJadwal('${hari}',${j},'${kls}')"
          style="position:relative; cursor:pointer"
          data-bs-toggle="tooltip"
          title="${isi ? getNamaGuru(isi.guruKode) : ''}">

          ${isi ? `
            ${isi.guruKode}

            <span onclick="event.stopPropagation(); hapusCell(event,'${hari}',${j},'${kls}')"
              style="
                position:absolute;
                top:2px;
                right:5px;
                color:red;
                font-size:12px;
                cursor:pointer;
                font-weight:bold;
              ">
              ✖
            </span>
          ` : `<span style="color:#ccc">+</span>`}

        </td>`;
              });

      html += `</tr>`;
    }
  });

  html += `</table>`;
  document.getElementById("grid").innerHTML = html;

  // aktifkan tooltip
  setTimeout(()=>{
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el=>{
      new bootstrap.Tooltip(el);
    });
  },100);
}

// ================= INPUT =================
function isiJadwal(hari,jam,kelas){
  document.getElementById("mHari").value = hari;
  document.getElementById("mJam").value = jam;
  document.getElementById("mKelas").value = kelas;

  isiDropdownGuru();
  isiDropdownMapel("");

  new bootstrap.Modal(document.getElementById("modalGuru")).show();
}

// ================= SIMPAN =================
function simpanJadwal(){

  let hari = mHari.value;
  let jam = parseInt(mJam.value);
  let kelas = mKelas.value;
  let guruKode = mGuru.value;
  let mapel = mMapel.value;
  let jp = parseInt(mJP.value);

  if(!guruKode || !mapel){
    notif.innerHTML = "❗ Pilih guru & mapel";
    return;
  }

  // 🚫 GURU DOUBLE DI KELAS YANG SAMA
  if(cekGuruDouble(hari, kelas, guruKode)){
    alert("❌ Guru sudah mengajar di kelas ini hari ini!");
    return;
  }

  // 🚫 CEK BENTROK
  for(let i=0;i<jp;i++){
    let error = cekBentrok(hari, jam+i, kelas, guruKode);
    if(error){
      alert(error);
      return;
    }
  }

  // hapus slot lama
  jadwal = jadwal.filter(j =>
    !(j.hari===hari && j.kelas===kelas && j.jam>=jam && j.jam<jam+jp)
  );

  // simpan
  for(let i=0;i<jp;i++){
    jadwal.push({
      hari,
      jam: jam+i,
      kelas,
      guruKode,
      mapel
    });
  }

  localStorage.setItem("jadwal", JSON.stringify(jadwal));

  bootstrap.Modal.getInstance(modalGuru).hide();
  notif.innerHTML = "";

  render();
}

// ================= VALIDASI =================
function cekGuruDouble(hari, kelas, guruKode){

  let dataGuru = JSON.parse(localStorage.getItem("guru")) || [];
  let guru = dataGuru.find(g => g.kode === guruKode);

  if(!guru) return false;

  return jadwal.some(j => {
    let g2 = dataGuru.find(x => x.kode === j.guruKode);

    return (
      j.hari === hari &&
      j.kelas === kelas &&
      g2 && g2.nama === guru.nama
    );
  });
}

function cekBentrok(hari, jam, kelas, guruKode){

  let dataGuru = JSON.parse(localStorage.getItem("guru")) || [];

  // guru aktif
  let guruAktif = dataGuru.find(g => g.kode === guruKode);

  if(!guruAktif){
    return "❌ Guru tidak ditemukan";
  }

  // normalisasi nama
  let namaGuruAktif = guruAktif.nama.trim().toLowerCase();

  // =========================
  // CEK SLOT KELAS
  // =========================
  let bentrokKelas = jadwal.find(j =>
    j.hari === hari &&
    j.jam === jam &&
    j.kelas === kelas
  );

  if(bentrokKelas){
    return "❌ Slot kelas sudah terisi";
  }

  // =========================
  // CEK GURU BENTROK
  // =========================
  let bentrokGuru = jadwal.find(j => {

    if(j.hari !== hari) return false;
    if(j.jam !== jam) return false;
    if(j.kelas === kelas) return false;

    let guruJadwal = dataGuru.find(g => g.kode === j.guruKode);

    if(!guruJadwal) return false;

    let namaGuruJadwal = guruJadwal.nama.trim().toLowerCase();

    return namaGuruJadwal === namaGuruAktif;
  });

  if(bentrokGuru){
    return "❌ Guru bentrok di jam yang sama";
  }

  return null;
}

// ================= DROPDOWN =================
function isiDropdownGuru(){

  let data = JSON.parse(localStorage.getItem("guru")) || [];

  // ambil nama unik
  let unik = [...new Map(data.map(g => [
    g.nama.trim(),
    g
  ])).values()];

  // urutkan A-Z
  unik.sort((a,b)=>
    a.nama.localeCompare(b.nama,"id")
  );

  mGuru.innerHTML = `
    <option value="">Pilih Guru</option>
    ${unik.map(g=>`
      <option value="${g.kode}">
        ${g.nama}
      </option>
    `).join("")}
  `;
}

function isiDropdownMapel(kode){
  let data = JSON.parse(localStorage.getItem("guru")) || [];

  let guru = data.find(g=>g.kode===kode);

  if(!guru){
    mMapel.innerHTML = `<option value="">Pilih Mapel</option>`;
    return;
  }

  let semuaMapel = data
    .filter(g=>g.nama===guru.nama)
    .flatMap(g=>g.mapel);

  semuaMapel = [...new Set(semuaMapel)];

  mMapel.innerHTML = `
    <option value="">Pilih Mapel</option>
    ${semuaMapel.map(m=>`<option value="${m}">${m}</option>`).join("")}
  `;
}

// ================= TOOLTIP CLEAN =================
function destroyTooltip(){
  document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el=>{
    let tip = bootstrap.Tooltip.getInstance(el);
    if(tip) tip.dispose();
  });
}

// ================= HAPUS CELL =================
function hapusCell(e, hari, jam, kelas){
  if(e) e.stopPropagation();

  if(!confirm("Hapus jadwal ini?")) return;

  jadwal = jadwal.filter(j =>
    !(j.hari===hari && j.jam===jam && j.kelas===kelas)
  );

  localStorage.setItem("jadwal", JSON.stringify(jadwal));
  render();
}

// ================= TAMBAH JAM =================
function tambahJam(hari){
  jamPerHari[hari] += 1;
  simpanJam();
}

// ================= HAPUS JAM =================
function hapusJam(hari){

  if(jamPerHari[hari] <= 1){
    alert("Minimal 1 jam");
    return;
  }

  if(!confirm("Hapus jam terakhir?")) return;

  let jamTerakhir = jamPerHari[hari];

  jadwal = jadwal.filter(j =>
    !(j.hari===hari && j.jam===jamTerakhir)
  );

  jamPerHari[hari] -= 1;

  simpanJam();
}

// ================= SIMPAN JAM =================
function simpanJam(){
  localStorage.setItem("jamPerHari", JSON.stringify(jamPerHari));
  localStorage.setItem("jadwal", JSON.stringify(jadwal));
  render();
}

// ================= DRAG & DROP =================

// mulai drag
function dragStart(e, hari, jam, kelas){

  let data = jadwal.find(j =>
    j.hari === hari &&
    j.jam === jam &&
    j.kelas === kelas
  );

  if(!data) return;

  dragData = data;

  e.target.classList.add("dragging");
}

// izinkan drop
function allowDrop(e){
  e.preventDefault();
}

// saat drop
function dropJadwal(e, hari, jam, kelas){

  e.preventDefault();

  document.querySelectorAll(".dragging")
    .forEach(el => el.classList.remove("dragging"));

  if(!dragData) return;

  let asal = dragData;

  // 🔥 ambil isi target
  let target = jadwal.find(j =>
    j.hari === hari &&
    j.jam === jam &&
    j.kelas === kelas
  );

  // 🚫 kalau drop ke tempat yang sama
  if(
    asal.hari === hari &&
    asal.jam === jam &&
    asal.kelas === kelas
  ){
    return;
  }

  // =========================
  // 🔁 MODE SWAP
  // =========================
  if(target){

    // hapus keduanya dulu
    jadwal = jadwal.filter(j =>
      !(
        (j.hari===asal.hari && j.jam===asal.jam && j.kelas===asal.kelas) ||
        (j.hari===target.hari && j.jam===target.jam && j.kelas===target.kelas)
      )
    );

    // tukar posisi
    jadwal.push({
      ...asal,
      hari: target.hari,
      jam: target.jam,
      kelas: target.kelas
    });

    jadwal.push({
      ...target,
      hari: asal.hari,
      jam: asal.jam,
      kelas: asal.kelas
    });

  }

  // =========================
  // 📦 MODE PINDAH (kalau kosong)
  // =========================
  else{

    // hapus posisi lama
    jadwal = jadwal.filter(j =>
      !(j.hari===asal.hari && j.jam===asal.jam && j.kelas===asal.kelas)
    );

    // validasi bentrok
    let error = cekBentrok(hari, jam, kelas, asal.guruKode);

    if(error){
      alert(error);
      return;
    }

    // simpan posisi baru
    jadwal.push({
      ...asal,
      hari,
      jam,
      kelas
    });
  }

  localStorage.setItem("jadwal", JSON.stringify(jadwal));

  dragData = null;

  render();
}

function previewExcel(){

  let grup = groupKelas();

  let semuaKelas = [
    ...grup.VII,
    ...grup.VIII,
    ...grup.IX
  ];

  let html = `<table class="table table-bordered text-center">`;

  // HEADER 1
  html += `<tr>
    <th rowspan="2">Hari</th>
    <th rowspan="2">Jam</th>
    ${grup.VII.length ? `<th colspan="${grup.VII.length}">VII</th>` : ""}
    ${grup.VIII.length ? `<th colspan="${grup.VIII.length}">VIII</th>` : ""}
    ${grup.IX.length ? `<th colspan="${grup.IX.length}">IX</th>` : ""}
  </tr>`;

  // HEADER 2
  html += `<tr>
    ${grup.VII.map(k=>`<th>${k}</th>`).join("")}
    ${grup.VIII.map(k=>`<th>${k}</th>`).join("")}
    ${grup.IX.map(k=>`<th>${k}</th>`).join("")}
  </tr>`;

  // BODY
  hariList.forEach(hari=>{
    let totalJam = jamPerHari[hari];

    for(let j=1; j<=totalJam; j++){

      html += `<tr>`;

      if(j===1){
        html += `<td rowspan="${totalJam}"><b>${hari}</b></td>`;
      }

      html += `<td>${j}</td>`;

      semuaKelas.forEach(kls=>{

        let isi = jadwal.find(x =>
          x.hari===hari &&
          x.jam===j &&
          x.kelas===kls
        );

        html += `
          <td>
            ${isi ? isi.guruKode : ""}
          </td>
        `;
      });

      html += `</tr>`;
    }
  });

  html += `</table>`;

  document.getElementById("excelPreview").innerHTML = html;

  new bootstrap.Modal(document.getElementById("modalExcel")).show();
}

function downloadExcel(){

  let table = document.querySelector("#excelPreview table");

  if(!table){
    alert("Preview belum tersedia!");
    return;
  }

  // ================= DOWNLOAD FILE =================
  let wb = XLSX.utils.table_to_book(table, {
    sheet: "Jadwal"
  });

  XLSX.writeFile(wb, "Jadwal_Pelajaran.xlsx");

  // ================= TUTUP MODAL PREVIEW =================
  let modalPreview = document.getElementById("modalExcel");
  let instancePreview = bootstrap.Modal.getInstance(modalPreview);

  if(instancePreview){
    instancePreview.hide();
  }

  // ================= TAMPILKAN DONASI =================
  setTimeout(() => {

    if(!localStorage.getItem("donasiShown")){
      let modalDonasi = new bootstrap.Modal(
        document.getElementById("modalDonasi")
      );

      modalDonasi.show();

      localStorage.setItem("donasiShown", "true");
    }

  }, 500); // beri jeda biar smooth
}

function bukaDonasi(){
  console.log("💰 User klik donasi");

  window.open("https://saweria.co/tetehstudio","_blank");
}

function loadBrand(){
  let data = JSON.parse(localStorage.getItem("identitas"));

  if(!data) return;

  let logo = document.getElementById("brandLogo");

  if(logo && data.logo){
    logo.src = data.logo;
  }
}
// ================= GLOBAL BINDING =================
window.hapusCell = hapusCell;
window.tambahJam = tambahJam;
window.hapusJam = hapusJam;
window.isiJadwal = isiJadwal;
window.dragStart = dragStart;
window.allowDrop = allowDrop;
window.dropJadwal = dropJadwal;
window.simpanJadwal = simpanJadwal;
window.previewExcel = previewExcel;
window.downloadExcel = downloadExcel;
window.dragStart = dragStart;
window.allowDrop = allowDrop;
window.dropJadwal = dropJadwal;