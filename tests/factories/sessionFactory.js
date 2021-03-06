const Keygrip = require('keygrip');
const Buffer = require('safe-buffer').Buffer;
const keys = require('../../config/keys');
const keygrip = new Keygrip([keys.cookieKey]);

module.exports = ({ _id }) => {
    const sessionObj = {
        passport: {
            user: String(_id),
        },
    };

    const session = Buffer.from(JSON.stringify(sessionObj)).toString('base64');
    const sig = keygrip.sign('session=' + session);

    return {
        session, sig
    };
}