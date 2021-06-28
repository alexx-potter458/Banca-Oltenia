window.addEventListener("DOMContentLoaded",function(){
    document.getElementById("form").onsubmit=function(){
    
        if (document.getElementById("password").value!=document.getElementById("password2").value){
            alert("Parolele nu coincid...");
            return false;
        }
        return true;
    }
});