const express = require("express");
const app = express();
const { authMiddleware } = require("./middlewares/auth");
const cors = require('cors')
const router = require("./routes");
const initDatabase = require("./configs/database");
const webConstants = require('./web-constants')


app.use(cors({credentials: true, origin: '*', allowHeaders: ['Content-Type, X-Authorization']}))
app.use(express.json());
app.use(authMiddleware);
app.use(router)
initDatabase()
.then(() => {
    app.listen(webConstants.PORT, () => console.log(`Server listening on http://localhost:${webConstants.PORT}`))
})
.catch((err) => console.log(err));
