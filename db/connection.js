const mongoose = require('mongoose');

const server = process.env.DBSERVER; // REPLACE WITH YOUR OWN SERVER

const connectDB = async () => {
    return new Promise(async(resolve,reject) =>{
        try {   
            const db = await mongoose.connect(`mongodb://${server}`);
            resolve(db)
        } catch (err) {
            reject(err)
        }
    })

};

module.exports = connectDB