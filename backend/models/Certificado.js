const mongoose = require('mongoose');

const certificadoSchema = new mongoose.Schema({
    idUsuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true,
        unique: true
    },
    codigoCertificado: {
        type: String,
        unique: true
    },
    fechaEmision: {
        type: Date,
        default: Date.now
    },
    curso: {
        type: String,
        default: 'Lineamiento de la UARIV: UNIDAD PARA LAS VÍCTIMAS'
    },
    puntuacionFinal: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Generar código único de certificado antes de guardar
certificadoSchema.pre('save', function(next) {
    if (!this.codigoCertificado) {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.codigoCertificado = `UARIV-${año}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Certificado', certificadoSchema);
