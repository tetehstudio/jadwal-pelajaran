document.addEventListener("DOMContentLoaded", function(){

  console.log("✅ identitas.js aktif");

  loadData();

  let btn = document.getElementById("btnSimpan");
  if(btn){
    btn.addEventListener("click", simpan);
  }

});

function simpan(){

  console.log("🔥 klik simpan");

  let data = {
    nama: document.getElementById("nama").value,
    tahun: document.getElementById("tahun").value,
    alamat: document.getElementById("alamat").value,
    kepsek: document.getElementById("kepsek").value,
    logo: document.getElementById("previewLogo").src || ""
  };

  if(!data.nama){
    alert("Nama wajib diisi");
    return;
  }

  localStorage.setItem("identitas", JSON.stringify(data));

  alert("✅ Data tersimpan");
}

function loadData(){

  let data = JSON.parse(localStorage.getItem("identitas"));

  if(!data) return;

  document.getElementById("nama").value = data.nama || "";
  document.getElementById("tahun").value = data.tahun || "";
  document.getElementById("alamat").value = data.alamat || "";
  document.getElementById("kepsek").value = data.kepsek || "";

  if(data.logo){
    document.getElementById("previewLogo").src = data.logo;
  }

}

function uploadLogo(){

  let file = document.getElementById("logoInput").files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(e){
    document.getElementById("previewLogo").src = e.target.result;
  };

  reader.readAsDataURL(file);
}