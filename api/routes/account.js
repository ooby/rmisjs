const {
    signup, login, reset, restore, activate,
    access, checkAccess, isActivated, me, idd
} = require('../middlewares/account');
module.exports = express => {
    const acc = express.Router();
    acc.post('/signup', signup);
    acc.post('/login', login);
    acc.post('/reset', reset);
    acc.post('/restore/:id?', restore);
    acc.get('/activate', activate);
    acc.get('/access', access);
    acc.use(checkAccess);
    acc.use(isActivated);
    acc.get('/me', me);
    acc.get('/id', idd);
    return acc;
};