import unreadMailsRouter from './unread_mails'

exports.init = function ({ app }) {
    app.use('/api/v4', unreadMailsRouter);
}