/**
 * Script de Verificación - Modelo Usuario
 * 
 * Este script verifica que el modelo Usuario esté correctamente configurado
 * 
 * Uso: node verificar-modelo.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Verificando Modelo Usuario...\n');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ Conectado a MongoDB\n');
        await verificarModelo();
    })
    .catch((error) => {
        console.error('❌ Error de conexión:', error.message);
        process.exit(1);
    });

async function verificarModelo() {
    try {
        const Usuario = require('./models/Usuario');
        
        console.log('📋 CAMPOS DEL MODELO USUARIO:\n');
        
        const schema = Usuario.schema;
        const paths = Object.keys(schema.paths);
        
        console.log('Campos definidos:');
        paths.forEach(field => {
            const fieldInfo = schema.paths[field];
            const isRequired = fieldInfo.isRequired;
            const fieldType = fieldInfo.instance;
            
            console.log(`  ${isRequired ? '✅' : '⚪'} ${field.padEnd(20)} (${fieldType})`);
        });
        
        console.log('\n📊 RESUMEN:');
        console.log(`  Total de campos: ${paths.length}`);
        console.log(`  Campos requeridos: ${paths.filter(f => schema.paths[f].isRequired).length}`);
        
        // Verificar campo específico fechaNacimiento
        console.log('\n🎂 VERIFICACIÓN CAMPO fechaNacimiento:');
        const fechaField = schema.paths['fechaNacimiento'];
        
        if (fechaField) {
            console.log('  ✅ Campo existe');
            console.log(`  ✅ Tipo: ${fechaField.instance}`);
            console.log(`  ${fechaField.isRequired ? '✅' : '❌'} Requerido: ${fechaField.isRequired}`);
            console.log(`  ${fechaField.validators.length > 0 ? '✅' : '⚪'} Validadores: ${fechaField.validators.length}`);
        } else {
            console.log('  ❌ Campo NO existe en el modelo');
            console.log('  ⚠️  Debes actualizar el archivo models/Usuario.js');
        }
        
        // Verificar campo edad (no debe existir)
        console.log('\n👴 VERIFICACIÓN CAMPO edad (debe estar eliminado):');
        const edadField = schema.paths['edad'];
        
        if (edadField) {
            console.log('  ❌ Campo "edad" todavía existe');
            console.log('  ⚠️  Debes actualizar el archivo models/Usuario.js');
        } else {
            console.log('  ✅ Campo "edad" correctamente eliminado');
        }
        
        // Verificar virtual edad
        console.log('\n🔄 VERIFICACIÓN VIRTUAL edad:');
        const virtuals = Object.keys(schema.virtuals);
        if (virtuals.includes('edad')) {
            console.log('  ✅ Virtual "edad" existe');
            console.log('  ✅ La edad se calculará automáticamente');
        } else {
            console.log('  ⚠️  Virtual "edad" no encontrado');
            console.log('  ℹ️  Esto es opcional pero recomendado');
        }
        
        // Verificar toJSON
        console.log('\n📤 VERIFICACIÓN toJSON:');
        if (schema.options.toJSON && schema.options.toJSON.virtuals) {
            console.log('  ✅ Virtuals incluidos en JSON');
        } else {
            console.log('  ⚠️  Virtuals no incluidos en JSON');
            console.log('  ℹ️  Recomendado agregar: { toJSON: { virtuals: true } }');
        }
        
        // Intentar crear un usuario de prueba (sin guardar)
        console.log('\n🧪 PRUEBA DE CREACIÓN (sin guardar):');
        
        try {
            const usuarioPrueba = new Usuario({
                cedula: '9999999999',
                nombre: 'Usuario Prueba',
                correo: 'prueba@test.com',
                telefono: '3001234567',
                genero: 'Masculino',
                fechaNacimiento: new Date('1995-06-15'),
                profesion: 'Ingeniero',
                cargo: 'Desarrollador',
                contraseña: '123456'
            });
            
            // Validar sin guardar
            await usuarioPrueba.validate();
            
            console.log('  ✅ Validación exitosa');
            console.log('  ✅ Usuario de prueba válido');
            
            // Verificar edad calculada
            if (usuarioPrueba.edad) {
                console.log(`  ✅ Edad calculada: ${usuarioPrueba.edad} años`);
            }
            
        } catch (validationError) {
            console.log('  ❌ Error de validación:', validationError.message);
            Object.keys(validationError.errors || {}).forEach(field => {
                console.log(`     - ${field}: ${validationError.errors[field].message}`);
            });
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Verificación completada\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error al verificar modelo:', error.message);
        console.error('   Stack:', error.stack);
        process.exit(1);
    }
}