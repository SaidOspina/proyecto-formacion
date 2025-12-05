const Usuario = require('../models/Usuario');
const Sesion = require('../models/Sesion');
const Certificado = require('../models/Certificado');
const bcrypt = require('bcryptjs');

// @desc    Obtener todos los usuarios
// @route   GET /api/usuarios
// @access  Private/Admin
exports.obtenerUsuarios = async (req, res) => {
    try {
        const { estado, tipoUsuario, busqueda, page = 1, limit = 10 } = req.query;
        
        let filtro = {};
        
        if (estado) filtro.estado = estado;
        if (tipoUsuario) filtro.tipoUsuario = tipoUsuario;
        if (busqueda) {
            filtro.$or = [
                { nombre: { $regex: busqueda, $options: 'i' } },
                { correo: { $regex: busqueda, $options: 'i' } },
                { cedula: { $regex: busqueda, $options: 'i' } }
            ];
        }

        const usuarios = await Usuario.find(filtro)
            .select('-contraseña')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Usuario.countDocuments(filtro);

        res.status(200).json({
            success: true,
            total,
            paginas: Math.ceil(total / limit),
            paginaActual: parseInt(page),
            usuarios
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

// @desc    Obtener un usuario
// @route   GET /api/usuarios/:id
// @access  Private/Admin
exports.obtenerUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select('-contraseña');

        if (!usuario) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            usuario
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener usuario',
            error: error.message
        });
    }
};

// @desc    Crear usuario (Admin)
// @route   POST /api/usuarios
// @access  Private/Admin
exports.crearUsuario = async (req, res) => {
    try {
        const { cedula, nombre, correo, telefono, contraseña, tipoUsuario } = req.body;

        const usuarioExistente = await Usuario.findOne({ 
            $or: [{ cedula }, { correo }] 
        });

        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya existe un usuario con esa cédula o correo'
            });
        }

        const usuario = await Usuario.create({
            cedula,
            nombre,
            correo,
            telefono,
            contraseña,
            tipoUsuario: tipoUsuario || 'Asesor'
        });

        res.status(201).json({
            success: true,
            mensaje: 'Usuario creado exitosamente',
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                tipoUsuario: usuario.tipoUsuario
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear usuario',
            error: error.message
        });
    }
};

// @desc    Actualizar usuario
// @route   PUT /api/usuarios/:id
// @access  Private/Admin
exports.actualizarUsuario = async (req, res) => {
    try {
        const { nombre, correo, telefono, tipoUsuario, estado } = req.body;

        let usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        // Verificar correo único
        if (correo && correo !== usuario.correo) {
            const correoExiste = await Usuario.findOne({ correo });
            if (correoExiste) {
                return res.status(400).json({
                    success: false,
                    mensaje: 'El correo ya está en uso'
                });
            }
        }

        usuario = await Usuario.findByIdAndUpdate(
            req.params.id,
            { nombre, correo, telefono, tipoUsuario, estado },
            { new: true, runValidators: true }
        ).select('-contraseña');

        res.status(200).json({
            success: true,
            mensaje: 'Usuario actualizado exitosamente',
            usuario
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar usuario',
            error: error.message
        });
    }
};

// @desc    Cambiar estado de usuario (Activo/Inactivo)
// @route   PATCH /api/usuarios/:id/estado
// @access  Private/Admin
exports.cambiarEstado = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        usuario.estado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
        await usuario.save();

        res.status(200).json({
            success: true,
            mensaje: `Usuario ${usuario.estado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`,
            estado: usuario.estado
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al cambiar estado',
            error: error.message
        });
    }
};

// @desc    Obtener sesiones de un usuario
// @route   GET /api/usuarios/:id/sesiones
// @access  Private/Admin
exports.obtenerSesiones = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const sesiones = await Sesion.find({ idUsuario: req.params.id })
            .populate('idUsuario', 'nombre correo')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ fechaHoraInicio: -1 });

        const total = await Sesion.countDocuments({ idUsuario: req.params.id });

        // Calcular tiempo total conectado
        const tiempoTotal = await Sesion.aggregate([
            { $match: { idUsuario: require('mongoose').Types.ObjectId(req.params.id) } },
            { $group: { _id: null, tiempoTotal: { $sum: '$tiempo' } } }
        ]);

        res.status(200).json({
            success: true,
            total,
            tiempoTotalConectado: tiempoTotal[0]?.tiempoTotal || 0,
            paginas: Math.ceil(total / limit),
            sesiones
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener sesiones',
            error: error.message
        });
    }
};

// @desc    Restablecer contraseña de usuario (Admin)
// @route   PUT /api/usuarios/:id/restablecer-contraseña
// @access  Private/Admin
exports.restablecerContraseñaAdmin = async (req, res) => {
    try {
        const { nuevaContraseña } = req.body;

        const usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        usuario.contraseña = nuevaContraseña;
        await usuario.save();

        res.status(200).json({
            success: true,
            mensaje: 'Contraseña restablecida exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al restablecer contraseña',
            error: error.message
        });
    }
};

// @desc    Restablecer progreso de usuario
// @route   PUT /api/usuarios/:id/restablecer-progreso
// @access  Private/Admin
exports.restablecerProgreso = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        usuario.progreso = {
            tematica1: { completado: false, puntuacion: 0 },
            tematica2: { completado: false, puntuacion: 0 },
            tematica3: { completado: false, puntuacion: 0 }
        };

        await usuario.save();

        // Eliminar certificado si existe
        await Certificado.findOneAndDelete({ idUsuario: req.params.id });

        res.status(200).json({
            success: true,
            mensaje: 'Progreso restablecido exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al restablecer progreso',
            error: error.message
        });
    }
};
