const express = require("express");
const cors = require("cors");
const route = require('./routes/index')
const app = express();


require('./config/mongodbConfig')

app.use(express.json());

app.use(cors())

app.get("/", (req, res) => {
    res.json({ message: "Hello NodeJS 🚀" });
});

app.use(process.env.BASE_URL, route)


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});