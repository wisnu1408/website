const cors = require("cors");
const path = require("path");
const express = require("express");
const secure = require("ssl-express-www");

const app = express();
const PORT = process.env.PORT || 8080;

app.enable("trust proxy");
app.set("json spaces", 2);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(secure);

app.use("/", express.static(path.join(__dirname, "public")));
require("./cpanel")(app);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server aktif di http://localhost:${PORT}`);
});

module.exports = app;
