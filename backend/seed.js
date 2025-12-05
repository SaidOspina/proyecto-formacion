const mongoose = require('mongoose');
const Usuario = require('./models/Usuario');
const Pregunta = require('./models/Pregunta');
require('dotenv').config();

const preguntasIniciales = [
    // Temática 1 - Lineamientos Técnicos para la Atención Psicosocial
    {
        tematica: 1,
        enunciado: '¿Cuál de los siguientes principios busca asegurar que la atención se adapte a las particularidades de las distintas poblaciones víctimas (edad, etnia, género, etc.)?',
        respuestaCorrecta: 'Enfoque diferencial',
        respuesta1: 'Dignificación y reconocimiento',
        respuesta2: 'Contextualización',
        respuesta3: 'Participación'
    },
    {
        tematica: 1,
        enunciado: 'La inclusión de las víctimas en la caracterización de sus necesidades y en la construcción del plan de atención corresponde al principio de:',
        respuestaCorrecta: 'Participación',
        respuesta1: 'Enfoque de salud integral',
        respuesta2: 'Manejo de crisis',
        respuesta3: 'Dignificación'
    },
    {
        tematica: 1,
        enunciado: '¿Cuál es la modalidad de atención que involucra a toda la comunidad en el proceso de sanación y fortalecimiento del tejido social?',
        respuestaCorrecta: 'Intervención comunitaria',
        respuesta1: 'Atención individual',
        respuesta2: 'Atención grupal',
        respuesta3: 'Atención terapéutica'
    },
    {
        tematica: 1,
        enunciado: 'Dentro del proceso de implementación y seguimiento, ¿cuál es el primer paso a realizar con la participación de las víctimas para detectar sus necesidades específicas?',
        respuestaCorrecta: 'Caracterización psicosocial',
        respuesta1: 'Plan de atención participativo',
        respuesta2: 'Implementación oportuna',
        respuesta3: 'Seguimiento y evaluación'
    },
    {
        tematica: 1,
        enunciado: '¿Qué estrategia de intervención es fundamental para conectar con la experiencia de la víctima y validar su sufrimiento?',
        respuestaCorrecta: 'Escucha activa y empatía',
        respuesta1: 'Promoción de la esperanza',
        respuesta2: 'Fortalecimiento del afrontamiento',
        respuesta3: 'Manejo de crisis'
    },
    // Temática 2 - Rutas de Atención: Marco de Atención Humanitaria
    {
        tematica: 2,
        enunciado: 'La Atención Humanitaria Inmediata (AHI) está destinada específicamente a víctimas de qué hecho victimizante principal, ocurrido en los últimos 3 meses?',
        respuestaCorrecta: 'Desplazamiento forzado',
        respuesta1: 'Atentados terroristas',
        respuesta2: 'Confinamiento',
        respuesta3: 'Amenazas'
    },
    {
        tematica: 2,
        enunciado: '¿Cuál de los siguientes NO es un mecanismo de entrega válido para la ayuda humanitaria según los lineamientos?',
        respuestaCorrecta: 'Trueque (intercambio de bienes)',
        respuesta1: 'En especie',
        respuesta2: 'Dinero',
        respuesta3: 'Forma mixta'
    },
    {
        tematica: 2,
        enunciado: '¿En cuál etapa del proceso se decide si una persona es incluida formalmente en el Registro Único de Víctimas (RUV) y cuánto tiempo tiene la Unidad para las Víctimas para decidir?',
        respuestaCorrecta: 'Etapa RUV; 60 días hábiles',
        respuesta1: 'Etapa de Inmediatez; 15 días',
        respuesta2: 'Etapa de Ayuda Humanitaria de Emergencia; 30 días calendario',
        respuesta3: 'Etapa de Declaración; 45 días hábiles'
    },
    {
        tematica: 2,
        enunciado: 'En un evento de desplazamiento masivo, ¿quiénes son los responsables iniciales de levantar el acta y realizar el censo de las víctimas?',
        respuestaCorrecta: 'La alcaldía y la personería municipal',
        respuesta1: 'El Ministerio de Salud y Protección Social',
        respuesta2: 'La Policía Nacional y el Ejército',
        respuesta3: 'La Defensoría del Pueblo'
    },
    {
        tematica: 2,
        enunciado: '¿Cuál es el propósito principal de la Ayuda Humanitaria de Emergencia (AHE), que se entrega una vez la víctima está registrada?',
        respuestaCorrecta: 'Mantener el mínimo vital de la víctima mientras persiste la situación de vulnerabilidad',
        respuesta1: 'Iniciar el proceso de reparación económica definitiva',
        respuesta2: 'Cubrir exclusivamente los gastos de transporte de emergencia',
        respuesta3: 'Proporcionar vivienda permanente'
    },
    // Temática 3 - Principios Humanitarios Globales
    {
        tematica: 3,
        enunciado: '¿Cuál de los principios humanitarios establece que la ayuda debe basarse exclusivamente en las necesidades de las personas, sin discriminación alguna?',
        respuestaCorrecta: 'Imparcialidad',
        respuesta1: 'Humanidad',
        respuesta2: 'Neutralidad',
        respuesta3: 'Independencia'
    },
    {
        tematica: 3,
        enunciado: 'El principio de Humanidad busca principalmente:',
        respuestaCorrecta: 'Abordar el sufrimiento humano, proteger la vida y la salud, y garantizar el respeto del ser humano',
        respuesta1: 'Abstenerse de tomar partido en controversias políticas',
        respuesta2: 'Asegurar la autonomía de los objetivos humanitarios respecto a los objetivos militares',
        respuesta3: 'Priorizar los casos más urgentes de sufrimiento'
    },
    {
        tematica: 3,
        enunciado: 'Un actor humanitario que se abstiene de tomar parte en las hostilidades o en controversias ideológicas está adhiriéndose al principio de:',
        respuestaCorrecta: 'Neutralidad',
        respuesta1: 'Independencia',
        respuesta2: 'Acceso',
        respuesta3: 'Protección'
    },
    {
        tematica: 3,
        enunciado: '¿Qué principio garantiza que los objetivos de la ayuda no estén subordinados a metas políticas o militares?',
        respuestaCorrecta: 'Independencia',
        respuesta1: 'Protección',
        respuesta2: 'Rendición de cuentas',
        respuesta3: 'Neutralidad'
    },
    {
        tematica: 3,
        enunciado: 'Cuando las organizaciones humanitarias se comprometen a ser responsables de sus acciones ante las poblaciones a las que sirven, ¿qué principio están aplicando?',
        respuestaCorrecta: 'Rendición de Cuentas',
        respuesta1: 'Imparcialidad',
        respuesta2: 'Humanidad',
        respuesta3: 'Acceso'
    }
];

const adminInicial = {
    cedula: '1234567890',
    nombre: 'Administrador Sistema',
    correo: 'admin@uariv.gov.co',
    telefono: '3001234567',
    contraseña: 'Admin123!',
    tipoUsuario: 'Administrador',
    estado: 'Activo'
};

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');

        // Limpiar colecciones existentes
        await Pregunta.deleteMany({});
        console.log('Preguntas eliminadas');

        // Insertar preguntas
        await Pregunta.insertMany(preguntasIniciales);
        console.log('Preguntas insertadas:', preguntasIniciales.length);

        // Verificar si existe admin
        const adminExiste = await Usuario.findOne({ tipoUsuario: 'Administrador' });
        
        if (!adminExiste) {
            await Usuario.create(adminInicial);
            console.log('Administrador creado');
            console.log('Email: admin@uariv.gov.co');
            console.log('Contraseña: Admin123!');
        } else {
            console.log('Ya existe un administrador');
        }

        console.log('Seed completado exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('Error en seed:', error);
        process.exit(1);
    }
};

seedDatabase();
