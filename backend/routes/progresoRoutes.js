const express = require('express');
const router = express.Router();
const {
    actualizarProgreso,
    obtenerProgreso,
    obtenerCertificado,
    verificarCertificado,
    obtenerEstadisticas
} = require('../controllers/progresoController');
const { proteger, soloAdmin } = require('../middleware/auth');

// Ruta pública para verificar certificados
router.get('/verificar-certificado/:codigo', verificarCertificado);

// Rutas protegidas
router.use(proteger);

router.get('/', obtenerProgreso);
router.put('/tematica/:numero', actualizarProgreso);
router.get('/certificado', obtenerCertificado);

// Solo admin
router.get('/estadisticas', soloAdmin, obtenerEstadisticas);

module.exports = router;
