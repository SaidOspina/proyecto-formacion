const mongoose = require('mongoose');

const sesionSchema = new mongoose.Schema({
    idUsuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tiempo: {
        type: Number, // Tiempo en segundos
        default: 0
    },
    fechaHoraInicio: {
        type: Date,
        default: Date.now
    },
    fechaHoraFin: {
        type: Date
    },
    activa: {
        type: Boolean,
        default: true
    },
    ip: String,
    navegador: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Sesion', sesionSchema);
