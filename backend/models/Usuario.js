const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
    cedula: {
        type: String,
        required: [true, 'La cédula es requerida'],
        unique: true,
        trim: true
    },
    nombre: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    correo: {
        type: String,
        required: [true, 'El correo es requerido'],
        unique: true,
        lowercase: true,
        trim: true
    },
    telefono: {
        type: String,
        required: [true, 'El teléfono es requerido'],
        trim: true
    },
    contraseña: {
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: 6
    },
    tipoUsuario: {
        type: String,
        enum: ['Administrador', 'Asesor'],
        default: 'Asesor'
    },
    progreso: {
        tematica1: { completado: { type: Boolean, default: false }, puntuacion: { type: Number, default: 0 } },
        tematica2: { completado: { type: Boolean, default: false }, puntuacion: { type: Number, default: 0 } },
        tematica3: { completado: { type: Boolean, default: false }, puntuacion: { type: Number, default: 0 } }
    },
    estado: {
        type: String,
        enum: ['Activo', 'Inactivo'],
        default: 'Activo'
    },
    tokenRecuperacion: String,
    tokenExpiracion: Date
}, {
    timestamps: true
});

// Encriptar contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
    if (!this.isModified('contraseña')) return next();
    this.contraseña = await bcrypt.hash(this.contraseña, 12);
    next();
});

// Método para comparar contraseñas
usuarioSchema.methods.compararContraseña = async function(contraseñaIngresada) {
    return await bcrypt.compare(contraseñaIngresada, this.contraseña);
};

module.exports = mongoose.model('Usuario', usuarioSchema);
