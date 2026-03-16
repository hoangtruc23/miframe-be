const { createLogger, format, transports } = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')

const { combine, timestamp, splat, colorize, printf } = format

const folderName = 'storages/logs'

const logger = createLogger({
    format: combine(
        splat(),
        timestamp({
            format: 'DD-MM-YYYY HH:mm:ss',
        }),
        colorize(),
        printf((log) => {
            const message =
                typeof log.message === 'object'
                    ? JSON.stringify(log.message, null, 2)
                    : log.message

            if (log.stack) return `${log.timestamp} ${log.level} ${log.stack}`
            return `${log.timestamp} ${log.level} ${message}`
        }),
    ),
    transports: [],
})

logger.configure({
    level: 'verbose',
    transports: [
        new DailyRotateFile({
            filename: `${folderName}/%DATE%-error.log`,
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
        new DailyRotateFile({
            filename: `${folderName}/%DATE%-log.log`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
})
//Chỉ show console khi môi trường khác production
if (process.env.NODE_ENV != 'production') {
    logger.add(new transports.Console())
}

module.exports = { logger }
