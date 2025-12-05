const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const preguntaRoutes = require('./routes/preguntaRoutes');
const progresoRoutes = require('./routes/progresoRoutes');

const app = express();

// Configuración para producción
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
    origin: isProduction ? process.env.FRONTEND_URL : '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy para Render
app.set('trust proxy', 1);

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/preguntas', preguntaRoutes);
app.use('/api/progreso', progresoRoutes);

// Ruta de prueba API / Health check para Render
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        mensaje: 'API funcionando correctamente',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// Servir el frontend para cualquier otra ruta
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        mensaje: 'Error interno del servidor',
        error: isProduction ? undefined : err.message
    });
});

// Conectar a MongoDB y arrancar servidor
const PORT = process.env.PORT || 3000;

const mongoOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
    .then(() => {
        console.log('✅ Conectado a MongoDB');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch((error) => {
        console.error('❌ Error de conexión a MongoDB:', error.message);
        process.exit(1);
    });

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
    console.log('SIGTERM recibido, cerrando servidor...');
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
    process.exit(0);
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
    process.exit(0);
});