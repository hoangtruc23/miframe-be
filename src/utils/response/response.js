const response = {
    badRequest: (message) => {
        return {
            status: 400,
            code: message.code,
            message: message.message,
            data: null,
        }
    },
    success: (data, status = 200) => {
        return {
            status,
            code: 1,
            message: 'OK!',
            data,
        }
    },
    serverError: (error) => {
        return {
            status: 500,
            code: -1,
            message: error.message,
            data: error.stack || null,
        }
    },
    notFound: () => {
        return {
            status: 404,
            code: -1,
            message: 'Not found!',
            data: null,
        }
    },
    unauthorized: (message) => {
        return {
            status: 401,
            code: -1,
            message,
            data: null,
        }
    },
    forbidden: (message) => {
        return {
            status: 403,
            code: -1,
            message,
            data: null,
        }
    },
    locked: (message) => {
        return {
            status: 423,
            code: -1,
            message,
            data: null,
        }
    },
    cors: () => {
        return {
            status: 500,
            code: -1,
            message: 'Cors error!',
            data: null,
        }
    },
}

module.exports = response