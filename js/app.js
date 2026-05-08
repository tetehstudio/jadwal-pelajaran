function getData(key){
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}

document.addEventListener("DOMContentLoaded", function(){

  let data = JSON.parse(localStorage.getItem("identitas")) || {};

  let logo = document.getElementById("brandLogo");

  if(logo){
    if(data.logo){
      logo.src = data.logo;
    }else{
      logo.src = "https://via.placeholder.com/60?text=Logo";
    }
  }

});