const mongoose = require('mongoose')
const { logger } = require('./loggerConfig')
require('dotenv').config();

const DB_HOST = process.env.DB_HOST,
    DB_PORT = process.env.DB_PORT,
    DB_NAME = process.env.DB_NAME,
    DB_USERNAME = process.env.DB_USERNAME,
    DB_PASSWORD = encodeURIComponent(process.env.DB_PASSWORD),
    LOGIN_DB =
        DB_USERNAME && DB_PASSWORD ? `${DB_USERNAME}:${DB_PASSWORD}@` : '',
    ATLAS_DB = process.env.DB_HOST?.indexOf('mongodb') > 0

const connectMongoDB = async () => {
    let reconnectTime
    let MONGO_URI = process.env.MONGO_URI || `mongodb${ATLAS_DB ? '+srv' : ''}://${LOGIN_DB}${DB_HOST}${ATLAS_DB ? '' : `:${DB_PORT}`}/${DB_NAME}`
    // let MONGO_URI = "mongodb+srv://hoangbaotruc19:TrucAdmin2026@miframe-be.uvlc0ve.mongodb.net/?appName=miframe-be"
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        })
        logger.info('MongoDB connected!')
        clearTimeout(reconnectTime)
    } catch (error) {
        logger.error(`----MONGO_URI: ${MONGO_URI}`)
        logger.error(`Error connect MongoDB: ${error}`)
        reconnectTime = setTimeout(() => {
            try {
                logger.info('Reconnect to mongodb')
                connectMongoDB()
            } catch (error) {
                logger.error(`Error reconnect MongoDB: ${error}`)
            }
        }, 10000)
    }
}
connectMongoDB()
