let guru = getData("guru");
let kelas = getData("kelas");
let mapel = getData("mapel");

// TAMBAH
function tambahGuru(){
  let v = inputGuru.value.trim();
  if(!v) return;

  guru.push(v);
  setData("guru", guru);
  inputGuru.value="";
  render();
}

function tambahKelas(){
  let v = inputKelas.value.trim();
  if(!v) return;

  kelas.push(v);
  setData("kelas", kelas);
  inputKelas.value="";
  render();
}

function tambahMapel(){
  let v = inputMapel.value.trim();
  if(!v) return;

  mapel.push(v);
  setData("mapel", mapel);
  inputMapel.value="";
  render();
}

// HAPUS
function hapusGuru(i){
  guru.splice(i,1);
  setData("guru", guru);
  render();
}

function hapusKelas(i){
  kelas.splice(i,1);
  setData("kelas", kelas);
  render();
}

function hapusMapel(i){
  mapel.splice(i,1);
  setData("mapel", mapel);
  render();
}

// RENDER
function render(){

  // GURU
  listGuru.innerHTML = guru.map((g,i)=>`
    <div class="list-item">
      ${g}
      <button class="btn btn-sm btn-danger" onclick="hapusGuru(${i})">✖</button>
    </div>
  `).join("");

  // KELAS
  listKelas.innerHTML = kelas.map((k,i)=>`
    <div class="list-item">
      ${k}
      <button class="btn btn-sm btn-danger" onclick="hapusKelas(${i})">✖</button>
    </div>
  `).join("");

  // MAPEL
  listMapel.innerHTML = mapel.map((m,i)=>`
    <div class="list-item">
      ${m}
      <button class="btn btn-sm btn-danger" onclick="hapusMapel(${i})">✖</button>
    </div>
  `).join("");

  // COUNTER
  countGuru.innerText = guru.length;
  countKelas.innerText = kelas.length;
  countMapel.innerText = mapel.length;
}

// INIT
render();