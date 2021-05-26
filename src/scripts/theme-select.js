var  isDark = (JSON.parse(localStorage.getItem("themeStatus"))).darkThemeEnabled;
if (isDark ==  null) {
    var themeStatusJSON = JSON.stringify({darkThemeEnabled: 0});
    localStorage.setItem("themeStatus", themeStatusJSON);
}

document.addEventListener("DOMContentLoaded", run)

function run() {
    let colorScheme = document.getElementById("scheme");
    if(isDark == 1) {
        if(colorScheme.href.search("black") == -1)
            colorScheme.href = "/src/styles/schema-cromatica-black.css";
    }
    else {
        if(colorScheme.href.search("black") != -1)
            colorScheme.href = "/src/styles/schema-cromatica.css";
    }

    var button = document.getElementById("changeThemeBtn");
    button.addEventListener('click', function click(){
        
        if(isDark == 0) {
            localStorage.setItem("themeStatus", JSON.stringify({darkThemeEnabled: 1}));
            colorScheme.href = colorScheme.href.replace("cromatica", "cromatica-black");
        }
        else
        localStorage.setItem("themeStatus", JSON.stringify({darkThemeEnabled: 0}));

        location.reload();
     
    })
}
