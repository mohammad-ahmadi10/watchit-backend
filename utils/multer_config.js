const createFolder = require("./createFolder");
const multer = require("multer");
const {nanoid} = require("nanoid");
const path = require("path");
const { baseURL } = require("./consts");




const createMulterThumb = async () =>{
    return new Promise((resolve , _) =>{
            // create storage object
        let storage = multer.diskStorage({
            destination: async (req , file, cb) =>{
            const folder = req.body.videoPath
            const userID = req.data._id
            const thumbfolder =  path.join(baseURL , userID ,  folder , "thumbnails");
            const folderPath = path.join(baseURL , userID , folder)
            req.body.folderPath = folderPath
            req.body.thumbfolder = thumbfolder
            cb(null , thumbfolder)
            },
            filename : async (req , file , cb) =>{
                const timestamp = Date.now();
                const filename = timestamp + "___" + nanoid(25) + path.extname(file.originalname);
                req.body.thumb = filename;
                cb(null ,  filename)
            }
        });

        resolve(multer({storage}));
    })
}

const createMulterVideo = async () =>{
    return new Promise((resolve , _) =>{
            // create storage object
        let storage = multer.diskStorage({
            destination: async (req , file , cb) =>{
            const timestamp = Date.now().toString();
            const userID = req.data._id
            const folder = timestamp.concat(nanoid(8));
            const folderPath = await createFolder(userID ,folder );
            req.body.folderPath = folderPath;
            req.body.folder = folder;
            
            cb(null , folderPath)
            },
            filename : async (req , file , cb) =>{
            const timestamp = Date.now();
            const filename = timestamp + "___" + nanoid(25) + path.extname(file.originalname);
            const vidoeInfos = {
                timestamp : timestamp,
                filename : filename
            }
            req.body.vidoeInfos = vidoeInfos;
            cb(null ,  filename)
            }
    
        });

        const maxSize = 1562378240;
        resolve(multer({storage, limits:{fileSize:maxSize}}));
    })
}

const createMulterAvatar = async () =>{
    return new Promise((resolve , _) =>{
            // create storage object
        let storage = multer.diskStorage({
            destination: async (req , file , cb) =>{
            const userID = req.data._id
            const folderPath = path.join(baseURL , userID)
            cb(null , folderPath)
            },
            filename : async (req , file , cb) =>{
            const filename = "avatar" + path.extname(file.originalname);
            req.avatar = filename;
            cb(null ,  filename)
            }
        });

        resolve(multer({storage}));
    })

}




module.exports = {createMulterThumb , createMulterVideo, createMulterAvatar};




