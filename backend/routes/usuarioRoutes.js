const express = require('express');
const router = express.Router();
const {
    obtenerUsuarios,
    obtenerUsuario,
    crearUsuario,
    actualizarUsuario,
    cambiarEstado,
    obtenerSesiones,
    restablecerContraseñaAdmin,
    restablecerProgreso
} = require('../controllers/usuarioController');
const { proteger, soloAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y ser admin
router.use(proteger);
router.use(soloAdmin);

router.route('/')
    .get(obtenerUsuarios)
    .post(crearUsuario);

router.route('/:id')
    .get(obtenerUsuario)
    .put(actualizarUsuario);

router.patch('/:id/estado', cambiarEstado);
router.get('/:id/sesiones', obtenerSesiones);
router.put('/:id/restablecer-contraseña', restablecerContraseñaAdmin);
router.put('/:id/restablecer-progreso', restablecerProgreso);

module.exports = router;
