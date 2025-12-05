const express = require('express');
const router = express.Router();
const {
    obtenerPreguntasPorTematica,
    verificarRespuestas,
    obtenerTodasPreguntas,
    crearPregunta,
    actualizarPregunta,
    eliminarPregunta
} = require('../controllers/preguntaController');
const { proteger, soloAdmin } = require('../middleware/auth');

// Rutas protegidas
router.use(proteger);

// Rutas para asesores
router.get('/tematica/:numero', obtenerPreguntasPorTematica);
router.post('/verificar', verificarRespuestas);

// Rutas solo admin
router.get('/', soloAdmin, obtenerTodasPreguntas);
router.post('/', soloAdmin, crearPregunta);
router.put('/:id', soloAdmin, actualizarPregunta);
router.delete('/:id', soloAdmin, eliminarPregunta);

module.exports = router;
