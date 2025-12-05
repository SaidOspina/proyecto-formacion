const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Middleware para proteger rutas
exports.proteger = async (req, res, next) => {
    try {
        let token;

        // Verificar si existe el token en el header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                mensaje: 'No tienes autorización para acceder a esta ruta'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar usuario
        const usuario = await Usuario.findById(decoded.id);

        if (!usuario) {
            return res.status(401).json({
                success: false,
                mensaje: 'El usuario no existe'
            });
        }

        if (usuario.estado === 'Inactivo') {
            return res.status(401).json({
                success: false,
                mensaje: 'Tu cuenta ha sido desactivada'
            });
        }

        req.usuario = usuario;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            mensaje: 'Token inválido'
        });
    }
};

// Middleware para restringir a administradores
exports.soloAdmin = (req, res, next) => {
    if (req.usuario.tipoUsuario !== 'Administrador') {
        return res.status(403).json({
            success: false,
            mensaje: 'No tienes permisos para realizar esta acción'
        });
    }
    next();
};

// Middleware para verificar asesor activo
exports.soloAsesor = (req, res, next) => {
    if (req.usuario.tipoUsuario !== 'Asesor') {
        return res.status(403).json({
            success: false,
            mensaje: 'Esta ruta es solo para asesores'
        });
    }
    next();
};
