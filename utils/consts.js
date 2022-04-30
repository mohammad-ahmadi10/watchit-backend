const path = require("path");

const baseURL = path.join(__dirname , process.env.BASEVIDEOURL);
const tokenTime = 1000 * 60 * 15 ;
const refreshTokenTime = 1000 * 60 * 60 * 24 * 90 ;
const accessTokenName = "ACTKEN";
const refreshTokenName = "SSRFSH";



module.exports = {
    baseURL:baseURL,
    tokenTime,
    refreshTokenName,
    refreshTokenTime,
    accessTokenName
}