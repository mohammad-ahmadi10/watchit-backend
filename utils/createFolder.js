const path = require("path");
const fs = require("fs");
const {baseURL} = require("./consts");

const createFolder = async (userID , foldername) =>{
    const folderDirectory =  path.join( baseURL ,`/${userID}`, `/${foldername}`)
    try {
      if (!fs.existsSync(folderDirectory)) {
        await fs.mkdirSync(folderDirectory , {recursive:true});
      }
      return new Promise(resolve =>{
          resolve(folderDirectory)
      }) 
    } catch (err) {
      console.error(err)
    }
  }


  module.exports = createFolder;