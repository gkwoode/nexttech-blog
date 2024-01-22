const mongoose = require('mongoose');

const connectDB = async () => {

    try {
        mongoose.set('strictQuery', false);
        const connct = await mongoose.connect(process.env.MONGO_URL);
        console.log(`Database Connected: ${connct.connection.host}`)
    }
    catch (err) {
        console.log(err)
    }
}

module.exports = connectDB;