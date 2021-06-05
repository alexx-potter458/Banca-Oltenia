const createServerExpress = require('express');
const server = createServerExpress(); // server as object
const path = require("path");
const fs = require('fs');
const sharp = require('sharp');
const serverNetwork = require('ip');
const { Client } = require('pg');
var requestIp = require('request-ip');
var herokuPort = process.env.PORT || 8080

const client = new Client({
    host: 'ec2-54-225-228-142.compute-1.amazonaws.com', user: 'upopbwnaehhuib',
    password: 'bcc08249637396c43f1b55e63fbe68b8cadfa7e8ce80d7210cb18b45b6ceb37e', database: 'dfa2i2emu7diij', port: 5432, 
    ssl: {require: true, rejectUnauthorized: false}
});

client.connect();

var serverIp = serverNetwork.address();

server.set("view engine", "ejs");

server.get("/src/json/gallery.json", function (req, res) {
    res.status(403).render("pages/page403.ejs", { serverIp: serverIp });
})

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

        if (img.time == "day" && hour >= 12 & hour <= 20)
            imagesPaths.push({ normal: oldImg, small: newImg, description: img.description, license: img.license, link: img.licenseLink, name: fileName });
        else
            if (img.time == "morning" && hour > 5 && hour < 12)
                imagesPaths.push({ normal: oldImg, small: newImg, description: img.description, license: img.license, link: img.licenseLink });
            else
                if (img.time == "night" && ((hour > 20 && hour <= 23) || (hour >= 0 && hour <= 5)))
                    imagesPaths.push({ normal: oldImg, small: newImg, description: img.description, license: img.license, link: img.licenseLink });

        if (!fs.existsSync(newImg)) {
            sharp(oldImg)
                .resize(150)
                .toFile(newImg, function (err) {
                    console.log("can't convert ", oldImg, " to ", newImg, err);
                });
        }
    }

    return imagesPaths

}

server.get("/", function (req, res) {

    var userIp = requestIp.getClientIp(req);
    let galleryPaths = pictureCheck();
    const result = client.query("select * from products where special = true", function (err, queryResult) {
        res.render("pages/index", { userIp: userIp, images: galleryPaths, serverIp: serverIp, products: queryResult.rows });
    });
});

// server.get("/", function(req, res) {

//     var userIp = requestIp.getClientIp(req);
//     let galleryPaths = pictureCheck();
//     res.render("pages/index", { userIp: userIp, images: galleryPaths, serverIp: serverIp });

// });


server.get("/index", function (req, res) {

    var userIp = requestIp.getClientIp(req);
    let galleryPaths = pictureCheck();

    const result = client.query("select * from products where special = true", function (err, queryResult) {
        res.render("pages/index.ejs", { userIp: userIp, images: galleryPaths, serverIp: serverIp, products: queryResult.rows });
    });
});

server.get("/galerie", function (req, res) {

    let galleryPaths = pictureCheck();
    res.render("pages/galerie.ejs", { images: galleryPaths, serverIp: serverIp });
});

server.get("/produse", function (req, res) {

    const result = client.query("select * from products", function (err, queryResult) {
        res.render("pages/produse.ejs", { serverIp: serverIp, products: queryResult.rows, mainCategory: req.query.mainCategory });
    });
})

server.get("/produs/:id_prod", function (req, res) {
    const result = client.query("select * from products where id=" + req.params.id_prod, function (err, queryResult) {
        res.render("pages/produs.ejs", { serverIp: serverIp, products: queryResult.rows });
    });
})

server.get("/*", function (req, res) {

    res.render("pages" + req.url + ".ejs", { serverIp: serverIp }, function (err, renderResult) {
        if (err) {
            if (err.message.includes("Failed to lookup view")) {
                res.status(404).render("pages/page404.ejs");
            } else
                throw err;
        } else
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

server.listen(herokuPort);
console.log("Am pornit serverul");