require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();

app.get("/health", (req, res) => {
    res.send("Hello from Elastic Beanstalk!");
});

app.use(express.static(
    path.join(__dirname, "../frontend/dist")
));

app.get("/{*splat}", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../frontend/dist/index.html")
    );
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});