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
    genero: {
        type: String,
        required: [true, 'El género es requerido'],
        trim: true
    },
    otroGenero: {
        type: String,
        trim: true,
        default: ''
    },
    fechaNacimiento: {
        type: Date,
        required: [true, 'La fecha de nacimiento es requerida'],
        validate: {
            validator: function(fecha) {
                // Validar que sea mayor de 18 años
                const hoy = new Date();
                const fechaNac = new Date(fecha);
                const edad = Math.floor((hoy - fechaNac) / (365.25 * 24 * 60 * 60 * 1000));
                return edad >= 18 && edad <= 100;
            },
            message: 'Debes tener entre 18 y 100 años'
        }
    },
    profesion: {
        type: String,
        required: [true, 'La profesión es requerida'],
        trim: true
    },
    cargo: {
        type: String,
        required: [true, 'El cargo es requerido'],
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

// Virtual para calcular la edad
usuarioSchema.virtual('edad').get(function() {
    if (!this.fechaNacimiento) return null;
    
    const hoy = new Date();
    const fechaNac = new Date(this.fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }
    
    return edad;
});

// Asegurar que los virtuals se incluyan en JSON
usuarioSchema.set('toJSON', { virtuals: true });
usuarioSchema.set('toObject', { virtuals: true });

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