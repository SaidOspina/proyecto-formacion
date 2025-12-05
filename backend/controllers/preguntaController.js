const Pregunta = require('../models/Pregunta');

// @desc    Obtener preguntas por temática
// @route   GET /api/preguntas/tematica/:numero
// @access  Private
exports.obtenerPreguntasPorTematica = async (req, res) => {
    try {
        const { numero } = req.params;
        
        const preguntas = await Pregunta.find({ 
            tematica: parseInt(numero),
            activa: true 
        });

        // Mezclar opciones de respuesta para cada pregunta
        const preguntasFormateadas = preguntas.map(p => {
            const opciones = [
                p.respuestaCorrecta,
                p.respuesta1,
                p.respuesta2,
                p.respuesta3
            ].sort(() => Math.random() - 0.5);

            return {
                _id: p._id,
                enunciado: p.enunciado,
                opciones,
                tematica: p.tematica
            };
        });

        res.status(200).json({
            success: true,
            total: preguntasFormateadas.length,
            preguntas: preguntasFormateadas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener preguntas',
            error: error.message
        });
    }
};

// @desc    Verificar respuestas
// @route   POST /api/preguntas/verificar
// @access  Private
exports.verificarRespuestas = async (req, res) => {
    try {
        const { respuestas } = req.body; // Array de { preguntaId, respuesta }

        let correctas = 0;
        const resultados = [];

        for (const r of respuestas) {
            const pregunta = await Pregunta.findById(r.preguntaId);
            
            if (pregunta) {
                const esCorrecta = pregunta.respuestaCorrecta === r.respuesta;
                if (esCorrecta) correctas++;
                
                resultados.push({
                    preguntaId: r.preguntaId,
                    correcta: esCorrecta,
                    respuestaCorrecta: pregunta.respuestaCorrecta
                });
            }
        }

        const puntuacion = Math.round((correctas / respuestas.length) * 100);
        const aprobado = puntuacion >= 60; // 60% para aprobar

        res.status(200).json({
            success: true,
            correctas,
            total: respuestas.length,
            puntuacion,
            aprobado,
            resultados
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al verificar respuestas',
            error: error.message
        });
    }
};

// @desc    Obtener todas las preguntas (Admin)
// @route   GET /api/preguntas
// @access  Private/Admin
exports.obtenerTodasPreguntas = async (req, res) => {
    try {
        const { tematica, activa } = req.query;
        
        let filtro = {};
        if (tematica) filtro.tematica = parseInt(tematica);
        if (activa !== undefined) filtro.activa = activa === 'true';

        const preguntas = await Pregunta.find(filtro).sort({ tematica: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            total: preguntas.length,
            preguntas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener preguntas',
            error: error.message
        });
    }
};

// @desc    Crear pregunta
// @route   POST /api/preguntas
// @access  Private/Admin
exports.crearPregunta = async (req, res) => {
    try {
        const { tematica, enunciado, respuestaCorrecta, respuesta1, respuesta2, respuesta3 } = req.body;

        const pregunta = await Pregunta.create({
            tematica,
            enunciado,
            respuestaCorrecta,
            respuesta1,
            respuesta2,
            respuesta3
        });

        res.status(201).json({
            success: true,
            mensaje: 'Pregunta creada exitosamente',
            pregunta
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear pregunta',
            error: error.message
        });
    }
};

// @desc    Actualizar pregunta
// @route   PUT /api/preguntas/:id
// @access  Private/Admin
exports.actualizarPregunta = async (req, res) => {
    try {
        const { enunciado, respuestaCorrecta, respuesta1, respuesta2, respuesta3, activa } = req.body;

        let pregunta = await Pregunta.findById(req.params.id);

        if (!pregunta) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pregunta no encontrada'
            });
        }

        pregunta = await Pregunta.findByIdAndUpdate(
            req.params.id,
            { enunciado, respuestaCorrecta, respuesta1, respuesta2, respuesta3, activa },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            mensaje: 'Pregunta actualizada exitosamente',
            pregunta
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar pregunta',
            error: error.message
        });
    }
};

// @desc    Eliminar pregunta (soft delete)
// @route   DELETE /api/preguntas/:id
// @access  Private/Admin
exports.eliminarPregunta = async (req, res) => {
    try {
        const pregunta = await Pregunta.findById(req.params.id);

        if (!pregunta) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pregunta no encontrada'
            });
        }

        pregunta.activa = false;
        await pregunta.save();

        res.status(200).json({
            success: true,
            mensaje: 'Pregunta eliminada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar pregunta',
            error: error.message
        });
    }
};
