const mongoose = require('mongoose');

const preguntaSchema = new mongoose.Schema({
    tematica: {
        type: Number,
        required: true,
        enum: [1, 2, 3]
    },
    enunciado: {
        type: String,
        required: [true, 'El enunciado es requerido']
    },
    respuestaCorrecta: {
        type: String,
        required: [true, 'La respuesta correcta es requerida']
    },
    respuesta1: {
        type: String,
        required: [true, 'La respuesta 1 es requerida']
    },
    respuesta2: {
        type: String,
        required: [true, 'La respuesta 2 es requerida']
    },
    respuesta3: {
        type: String,
        required: [true, 'La respuesta 3 es requerida']
    },
    activa: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Pregunta', preguntaSchema);
