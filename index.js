const createServerExpress = require('express');
const server = createServerExpress(); // server as object
const path = require("path");
const fs = require('fs');
const sharp = require('sharp');

server.set("view engine", "ejs");
server.use("/src", createServerExpress.static(path.join(__dirname, "src")));

function pictureCheck() {

    var jsonFile = fs.readFileSync("src/json/gallery.json");
    var obj = JSON.parse(jsonFile);
    var galleryPath = obj.myPath;
    var imagesPaths = [];

    for (let img of obj.images) {

        var oldImg = path.join(galleryPath, img.relPath);
        var ext = path.extname(img.relPath);
        var fileName = path.basename(img.relPath, ext);
        let newImg = path.join(galleryPath + "/small/" + fileName + "Small" + ".webp");    
        
        var data = new Date();
        var hour = data.getHours();

        if(img.time == "day" && hour >= 12 & hour <= 20)
            imagesPaths.push({normal:oldImg, small:newImg, description: img.description, license:img.license, link:img.licenseLink});
        else
            if(img.time == "morning" && hour > 5 && hour < 12 )
            imagesPaths.push({normal:oldImg, small:newImg, description: img.description, license:img.license, link:img.licenseLink});
            else
                if(img.time == "night" && ((hour >20 && hour <= 23) || (hour >= 0 && hour <= 5)))
                imagesPaths.push({normal:oldImg, small:newImg, description: img.description, license:img.license, link:img.licenseLink});

        if(!fs.existsSync(newImg)) {
            sharp(oldImg)
                .resize(150)
                .toFile(newImg, function(err) {
                    console.log("can't convert ", oldImg, " to ", newImg, err);
            });
        }
    }

    return imagesPaths

}



server.get("/", function (req, res) {

    let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    let galleryPaths = pictureCheck();

    res.render("pages/index.ejs", {myIp: String(ip), images:galleryPaths});
});

server.get("/index", function (req, res) {

    let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    let galleryPaths = pictureCheck();

    res.render("pages/index.ejs", {myIp: String(ip), images:galleryPaths});
});

server.get("/galerie", function (req, res) {

    let galleryPaths = pictureCheck();
    res.render("pages/galerie.ejs", {images:galleryPaths});
});


server.get("/*", function(req,res){
    
    

    res.render("pages" + req.url + ".ejs", function(err, renderResult) {

        if(err) {
            if(err.message.includes("Failed to lookup view")) {
                res.status(404).render("pages/page404.ejs");
            }
            else
                throw err;
        }
        else 
            res.send(renderResult);
    });
})


// un exemplu
server.get("/data", function (req, res) {
    res.setHeader("Content-type", "text/html");
    console.log("salut3");
    res.write("<!DOCTYPE html><html><body>" + new Date());
    res.write("</body></html>");
    res.end();
});


server.listen(8080);
console.log("Am pornit serverul");