const Usuario = require('../models/Usuario');
const Certificado = require('../models/Certificado');
const Pregunta = require('../models/Pregunta');

// @desc    Actualizar progreso de temática
// @route   PUT /api/progreso/tematica/:numero
// @access  Private
exports.actualizarProgreso = async (req, res) => {
    try {
        const { numero } = req.params;
        const { puntuacion } = req.body;
        const userId = req.usuario.id;

        const usuario = await Usuario.findById(userId);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        // Verificar que la temática anterior esté completada (excepto la 1)
        if (parseInt(numero) > 1) {
            const tematicaAnterior = `tematica${parseInt(numero) - 1}`;
            if (!usuario.progreso[tematicaAnterior].completado) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'Debes completar la temática anterior primero'
                });
            }
        }

        const tematica = `tematica${numero}`;
        const aprobado = puntuacion >= 60;

        if (aprobado) {
            usuario.progreso[tematica].completado = true;
            usuario.progreso[tematica].puntuacion = puntuacion;
            await usuario.save();
        }

        // Verificar si completó todas las temáticas
        const todasCompletadas = 
            usuario.progreso.tematica1.completado &&
            usuario.progreso.tematica2.completado &&
            usuario.progreso.tematica3.completado;

        let certificado = null;
        if (todasCompletadas) {
            // Verificar si ya tiene certificado
            certificado = await Certificado.findOne({ idUsuario: userId });
            
            if (!certificado) {
                const puntuacionFinal = Math.round(
                    (usuario.progreso.tematica1.puntuacion +
                    usuario.progreso.tematica2.puntuacion +
                    usuario.progreso.tematica3.puntuacion) / 3
                );

                certificado = await Certificado.create({
                    idUsuario: userId,
                    puntuacionFinal
                });
            }
        }

        res.status(200).json({
            success: true,
            mensaje: aprobado ? '¡Felicidades! Has completado esta temática' : 'No alcanzaste el puntaje mínimo. Intenta de nuevo.',
            aprobado,
            puntuacion,
            progreso: usuario.progreso,
            todasCompletadas,
            certificado: certificado ? {
                codigo: certificado.codigoCertificado,
                fecha: certificado.fechaEmision
            } : null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar progreso',
            error: error.message
        });
    }
};

// @desc    Obtener progreso del usuario
// @route   GET /api/progreso
// @access  Private
exports.obtenerProgreso = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);

        const certificado = await Certificado.findOne({ idUsuario: req.usuario.id });

        res.status(200).json({
            success: true,
            progreso: usuario.progreso,
            certificado: certificado ? {
                codigo: certificado.codigoCertificado,
                fecha: certificado.fechaEmision,
                puntuacionFinal: certificado.puntuacionFinal
            } : null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener progreso',
            error: error.message
        });
    }
};

// @desc    Obtener certificado
// @route   GET /api/progreso/certificado
// @access  Private
exports.obtenerCertificado = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);
        const certificado = await Certificado.findOne({ idUsuario: req.usuario.id });

        if (!certificado) {
            return res.status(404).json({
                success: false,
                mensaje: 'No tienes certificado aún. Completa todas las temáticas.'
            });
        }

        res.status(200).json({
            success: true,
            certificado: {
                codigo: certificado.codigoCertificado,
                fecha: certificado.fechaEmision,
                curso: certificado.curso,
                puntuacionFinal: certificado.puntuacionFinal,
                usuario: {
                    nombre: usuario.nombre,
                    cedula: usuario.cedula
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener certificado',
            error: error.message
        });
    }
};

// @desc    Verificar certificado por código
// @route   GET /api/progreso/verificar-certificado/:codigo
// @access  Public
exports.verificarCertificado = async (req, res) => {
    try {
        const certificado = await Certificado.findOne({ 
            codigoCertificado: req.params.codigo 
        }).populate('idUsuario', 'nombre cedula');

        if (!certificado) {
            return res.status(404).json({
                success: false,
                mensaje: 'Certificado no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            certificado: {
                codigo: certificado.codigoCertificado,
                fecha: certificado.fechaEmision,
                curso: certificado.curso,
                titular: certificado.idUsuario.nombre,
                cedula: certificado.idUsuario.cedula
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al verificar certificado',
            error: error.message
        });
    }
};

// @desc    Obtener estadísticas del curso (Admin)
// @route   GET /api/progreso/estadisticas
// @access  Private/Admin
exports.obtenerEstadisticas = async (req, res) => {
    try {
        const totalUsuarios = await Usuario.countDocuments({ tipoUsuario: 'Asesor' });
        const usuariosActivos = await Usuario.countDocuments({ tipoUsuario: 'Asesor', estado: 'Activo' });
        
        const completaronTematica1 = await Usuario.countDocuments({ 
            tipoUsuario: 'Asesor',
            'progreso.tematica1.completado': true 
        });
        const completaronTematica2 = await Usuario.countDocuments({ 
            tipoUsuario: 'Asesor',
            'progreso.tematica2.completado': true 
        });
        const completaronTematica3 = await Usuario.countDocuments({ 
            tipoUsuario: 'Asesor',
            'progreso.tematica3.completado': true 
        });

        const certificadosEmitidos = await Certificado.countDocuments();

        res.status(200).json({
            success: true,
            estadisticas: {
                totalUsuarios,
                usuariosActivos,
                completaronTematica1,
                completaronTematica2,
                completaronTematica3,
                certificadosEmitidos,
                tasaCompletitud: totalUsuarios > 0 
                    ? Math.round((certificadosEmitidos / totalUsuarios) * 100) 
                    : 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};
