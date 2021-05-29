var children = document.getElementById("products").children;

var basicProdList = [];

for (var i = 0; i < children.length; i++) {
    basicProdList.push(children[i]);
}

var rangeMin = document.getElementById("pretMin");
var rangeMax = document.getElementById("pretMax");

rangeMin.addEventListener("change", function(){
    updateMinTextInput(rangeMin.value);
});

rangeMax.addEventListener("change", function(){
    updateMaxTextInput(rangeMax.value);
});

function updateMinTextInput(val) {
    document.getElementById('valueMin').innerHTML=val; 
  }
function updateMaxTextInput(val) {
    document.getElementById('valueMax').innerHTML=val; 
}

var preselect = document.getElementById("preselectedOption")

for (let elem of document.getElementById("radio").children) {
    if (elem.tagName == 'INPUT')

        if (elem.value.search(preselect.innerHTML) != -1) {
            elem.checked = true;
            filter();
        }

}

var filter = document.getElementById("filter").addEventListener('click', filter);
var ascendingSort = document.getElementById("aSort").addEventListener('click', function () { order(1) });
var descendingSort = document.getElementById("dSort").addEventListener('click', function () { order(-1) });
var reset = document.getElementById("reset").addEventListener('click', reset);
var reset = document.getElementById("calcBtn").addEventListener('click', calculate);

function order(value) {

    var currentChildren = document.getElementById("products").children;

    var prodList = [];
    for (let i = 0; i < currentChildren.length; i++)
        prodList.push(currentChildren[i])


    for (let i = 0; i < prodList.length - 1; i++) {
        for (let j = i + 1; j < prodList.length; j++) {
            if ((prodList[i].childNodes[1].firstElementChild.childNodes[1].innerText).localeCompare(prodList[j].childNodes[1].firstElementChild.childNodes[1].innerText) == value) {
                let aux = prodList[i];
                prodList[i] = prodList[j];
                prodList[j] = aux;
            }
        }
    }
    var parent = document.getElementById("products");
    while (parent.firstChild)
        parent.removeChild(parent.firstChild);

    for (let i = 0; i < prodList.length; i++)
        parent.appendChild(prodList[i]);

}

function reset() {
    var parent = document.getElementById("products");

    while (parent.firstChild)
        parent.removeChild(parent.firstChild);

    for (let i = 0; i < basicProdList.length; i++)
        parent.appendChild(basicProdList[i]);

    for (let elem of document.getElementById("radio").children) {
        if (elem.tagName == 'INPUT')
            elem.checked = false;              
    }

    for(let elem of document.getElementById("checkBoxes").children)
        elem.childNodes[0].checked = false;

    document.getElementById("all").checked = true;
}

function filter() {

    let selectedItem
    for (let elem of document.getElementById("radio").children) {
        if (elem.tagName == 'INPUT')
            if (elem.checked == true) {
                selectedItem = elem.value;
            }
    }

    let radioFilteredList = []
    for (let elem of basicProdList) {
        if ((elem.childNodes[1].childNodes[11].innerHTML.search(selectedItem) != -1 || selectedItem == "all") && (1==1))
            radioFilteredList.push(elem)
    }


    for(let elem of document.getElementById("checkBoxes").children) {
        let checkBoxFilteredList = [];
        if(elem.childNodes[0].checked == true) {
            let selection = elem.childNodes[0].name;
            for(let product of radioFilteredList) {
                if(product.childNodes[1].childNodes[13].innerHTML.search(selection) != -1)
                    checkBoxFilteredList.push(product);
            }
            radioFilteredList = checkBoxFilteredList;
        }
    }

    var rangeMin = Number(document.getElementById("pretMin").value);
    var rangeMax = Number(document.getElementById("pretMax").value);

    let rangeFilteredList = [];
    for(let product of radioFilteredList) {
        let prodPrice = Number(product.childNodes[1].childNodes[3].childNodes[3].innerHTML);

        if(prodPrice >= rangeMin && prodPrice <= rangeMax)
            rangeFilteredList.push(product);
    }
    radioFilteredList = rangeFilteredList;

    

    var parent = document.getElementById("products");
    while (parent.firstChild)
        parent.removeChild(parent.firstChild);

    for (let i = 0; i < radioFilteredList.length; i++)
        parent.appendChild(radioFilteredList[i]);
}

function calculate() {
    var sum = 0;
    var parent = document.getElementById("products").children;
    for(let product of parent) {
        let prodPrice = Number(product.childNodes[1].childNodes[3].childNodes[3].innerHTML);
        sum +=prodPrice;
    }

    var banner = document.createElement("div");
    banner.className = "priceBanner"
    banner.innerHTML= "Suma este: " + sum + "lei";
    document.body.appendChild(banner); 
    setTimeout(function(){
        document.body.removeChild(document.body.lastChild)}, 2000)
}