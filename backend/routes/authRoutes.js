const express = require('express');
const router = express.Router();
const {
    registro,
    login,
    logout,
    recuperarContraseña,
    restablecerContraseña,
    obtenerUsuarioActual
} = require('../controllers/authController');
const { proteger } = require('../middleware/auth');

router.post('/registro', registro);
router.post('/login', login);
router.post('/logout', proteger, logout);
router.post('/recuperar', recuperarContraseña);
router.put('/restablecer/:token', restablecerContraseña);
router.get('/me', proteger, obtenerUsuarioActual);

module.exports = router;
