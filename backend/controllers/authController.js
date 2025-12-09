const Usuario = require('../models/Usuario');
const Sesion = require('../models/Sesion');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generar token JWT
const generarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// Helper para calcular edad
const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }
    
    return edad;
};

// @desc    Registrar usuario
// @route   POST /api/auth/registro
// @access  Public
exports.registro = async (req, res) => {
    try {
        // Log para debugging
        console.log('📥 Datos recibidos en registro:', {
            cedula: req.body.cedula ? '✓' : '✗',
            nombre: req.body.nombre ? '✓' : '✗',
            correo: req.body.correo ? '✓' : '✗',
            telefono: req.body.telefono ? '✓' : '✗',
            contraseña: req.body.contraseña ? '✓' : '✗',
            genero: req.body.genero ? '✓' : '✗',
            fechaNacimiento: req.body.fechaNacimiento ? '✓' : '✗',
            profesion: req.body.profesion ? '✓' : '✗',
            cargo: req.body.cargo ? '✓' : '✗'
        });
        
        const { cedula, nombre, correo, telefono, contraseña, genero, otroGenero, fechaNacimiento, profesion, cargo } = req.body;

        // Validar campos básicos primero
        if (!cedula || !nombre || !correo || !telefono || !contraseña) {
            return res.status(400).json({
                success: false,
                mensaje: 'Todos los campos básicos son obligatorios'
            });
        }

        // Validar campos adicionales
        if (!genero || !fechaNacimiento || !profesion || !cargo) {
            return res.status(400).json({
                success: false,
                mensaje: 'Todos los campos son obligatorios'
            });
        }

        // Verificar si el usuario ya existe
        const usuarioExistente = await Usuario.findOne({ 
            $or: [{ cedula }, { correo }] 
        });

        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya existe un usuario con esa cédula o correo'
            });
        }

        // Validar edad mínima
        const edad = calcularEdad(fechaNacimiento);
        if (edad < 18) {
            return res.status(400).json({
                success: false,
                mensaje: 'Debes ser mayor de 18 años'
            });
        }

        // Si el género es "Otro", validar que se especifique cuál
        if (genero === 'Otro' && (!otroGenero || otroGenero.trim() === '')) {
            return res.status(400).json({
                success: false,
                mensaje: 'Por favor especifica el género'
            });
        }

        // Crear usuario
        const usuario = await Usuario.create({
            cedula,
            nombre,
            correo,
            telefono,
            contraseña,
            genero,
            otroGenero: genero === 'Otro' ? otroGenero : '',
            fechaNacimiento: new Date(fechaNacimiento),
            profesion,
            cargo,
            tipoUsuario: 'Asesor'
        });

        // Generar token
        const token = generarToken(usuario._id);

        res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                tipoUsuario: usuario.tipoUsuario,
                progreso: usuario.progreso
            }
        });
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al registrar usuario',
            error: error.message,
            detalles: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Login usuario
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        // Validar campos
        if (!correo || !contraseña) {
            return res.status(400).json({
                success: false,
                mensaje: 'Por favor ingresa correo y contraseña'
            });
        }

        // Buscar usuario
        const usuario = await Usuario.findOne({ correo }).select('+contraseña');

        if (!usuario) {
            return res.status(401).json({
                success: false,
                mensaje: 'Credenciales inválidas'
            });
        }

        // Verificar estado
        if (usuario.estado === 'Inactivo') {
            return res.status(401).json({
                success: false,
                mensaje: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
            });
        }

        // Verificar contraseña
        const contraseñaValida = await usuario.compararContraseña(contraseña);

        if (!contraseñaValida) {
            return res.status(401).json({
                success: false,
                mensaje: 'Credenciales inválidas'
            });
        }

        // Crear sesión
        const sesion = await Sesion.create({
            idUsuario: usuario._id,
            ip: req.ip,
            navegador: req.headers['user-agent']
        });

        // Generar token
        const token = generarToken(usuario._id);

        res.status(200).json({
            success: true,
            mensaje: 'Inicio de sesión exitoso',
            token,
            sesionId: sesion._id,
            usuario: {
                id: usuario._id,
                cedula: usuario.cedula,
                nombre: usuario.nombre,
                correo: usuario.correo,
                tipoUsuario: usuario.tipoUsuario,
                progreso: usuario.progreso
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// @desc    Cerrar sesión
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        const { sesionId } = req.body;

        if (sesionId) {
            const sesion = await Sesion.findById(sesionId);
            if (sesion) {
                sesion.fechaHoraFin = new Date();
                sesion.tiempo = Math.floor((sesion.fechaHoraFin - sesion.fechaHoraInicio) / 1000);
                sesion.activa = false;
                await sesion.save();
            }
        }

        res.status(200).json({
            success: true,
            mensaje: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al cerrar sesión',
            error: error.message
        });
    }
};

// @desc    Solicitar recuperación de contraseña
// @route   POST /api/auth/recuperar
// @access  Public
exports.recuperarContraseña = async (req, res) => {
    try {
        const { correo } = req.body;

        const usuario = await Usuario.findOne({ correo });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                mensaje: 'No existe un usuario con ese correo'
            });
        }

        // Generar token de recuperación
        const tokenRecuperacion = crypto.randomBytes(32).toString('hex');
        
        usuario.tokenRecuperacion = crypto
            .createHash('sha256')
            .update(tokenRecuperacion)
            .digest('hex');
        usuario.tokenExpiracion = Date.now() + 3600000; // 1 hora

        await usuario.save();

        // En producción, aquí enviarías el correo
        // Por ahora, devolvemos el token para pruebas
        res.status(200).json({
            success: true,
            mensaje: 'Se ha enviado un correo con las instrucciones para recuperar tu contraseña',
            // Solo para desarrollo:
            tokenRecuperacion
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al procesar la solicitud',
            error: error.message
        });
    }
};

// @desc    Restablecer contraseña
// @route   PUT /api/auth/restablecer/:token
// @access  Public
exports.restablecerContraseña = async (req, res) => {
    try {
        const tokenHash = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const usuario = await Usuario.findOne({
            tokenRecuperacion: tokenHash,
            tokenExpiracion: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({
                success: false,
                mensaje: 'Token inválido o expirado'
            });
        }

        usuario.contraseña = req.body.contraseña;
        usuario.tokenRecuperacion = undefined;
        usuario.tokenExpiracion = undefined;

        await usuario.save();

        res.status(200).json({
            success: true,
            mensaje: 'Contraseña actualizada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al restablecer contraseña',
            error: error.message
        });
    }
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
exports.obtenerUsuarioActual = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.usuario.id);

        res.status(200).json({
            success: true,
            usuario: {
                id: usuario._id,
                cedula: usuario.cedula,
                nombre: usuario.nombre,
                correo: usuario.correo,
                telefono: usuario.telefono,
                genero: usuario.genero,
                otroGenero: usuario.otroGenero,
                fechaNacimiento: usuario.fechaNacimiento,
                edad: usuario.edad, // Virtual
                profesion: usuario.profesion,
                cargo: usuario.cargo,
                tipoUsuario: usuario.tipoUsuario,
                progreso: usuario.progreso,
                estado: usuario.estado
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener usuario',
            error: error.message
        });
    }
};