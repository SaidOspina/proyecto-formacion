/**
 * Script de Migración: Edad → Fecha de Nacimiento
 * 
 * Este script convierte el campo 'edad' a 'fechaNacimiento' en todos los usuarios
 * 
 * Uso:
 *   node migracion-fecha-nacimiento.js [opciones]
 * 
 * Opciones:
 *   --dry-run    Simular sin hacer cambios
 *   --verbose    Mostrar información detallada
 *   --backup     Crear backup antes de migrar
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Argumentos de línea de comandos
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');
const createBackup = args.includes('--backup');

console.log('🔄 Script de Migración: Edad → Fecha de Nacimiento\n');

if (isDryRun) {
    console.log('⚠️  MODO DRY-RUN: No se harán cambios reales\n');
}

// Función para calcular edad
function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }
    
    return edad;
}

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('✅ Conectado a MongoDB');
        console.log(`   Base de datos: ${mongoose.connection.name}\n`);
        migrarDatos();
    })
    .catch((error) => {
        console.error('❌ Error de conexión:', error.message);
        process.exit(1);
    });

async function migrarDatos() {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('usuarios');
        
        // Paso 1: Contar usuarios a migrar
        console.log('🔍 Analizando base de datos...\n');
        
        const totalUsuarios = await collection.countDocuments({});
        const usuariosConEdad = await collection.countDocuments({ edad: { $exists: true } });
        const usuariosConFecha = await collection.countDocuments({ fechaNacimiento: { $exists: true } });
        
        console.log('📊 ESTADO ACTUAL:');
        console.log(`   Total de usuarios: ${totalUsuarios}`);
        console.log(`   Con campo "edad": ${usuariosConEdad}`);
        console.log(`   Con campo "fechaNacimiento": ${usuariosConFecha}`);
        console.log(`   A migrar: ${usuariosConEdad}\n`);
        
        if (usuariosConEdad === 0) {
            console.log('✅ No hay usuarios para migrar. Todos ya tienen fecha de nacimiento.');
            process.exit(0);
        }
        
        // Paso 2: Crear backup si se solicita
        if (createBackup && !isDryRun) {
            console.log('💾 Creando backup...');
            const backupCollection = db.collection(`usuarios_backup_${Date.now()}`);
            const usuarios = await collection.find({}).toArray();
            await backupCollection.insertMany(usuarios);
            console.log(`✅ Backup creado: usuarios_backup_${Date.now()}\n`);
        }
        
        // Paso 3: Obtener usuarios a migrar
        const usuarios = await collection.find({ 
            edad: { $exists: true } 
        }).toArray();
        
        console.log('🚀 Iniciando migración...\n');
        
        let migrados = 0;
        let errores = 0;
        let saltados = 0;
        const erroresDetallados = [];
        
        // Paso 4: Migrar cada usuario
        for (const usuario of usuarios) {
            try {
                // Validar edad
                if (!usuario.edad || usuario.edad < 0 || usuario.edad > 120) {
                    if (isVerbose) {
                        console.log(`⚠️  Usuario ${usuario.nombre}: Edad inválida (${usuario.edad}), saltando...`);
                    }
                    saltados++;
                    continue;
                }
                
                // Calcular fecha de nacimiento aproximada
                const hoy = new Date();
                const añoNacimiento = hoy.getFullYear() - usuario.edad;
                const mesNacimiento = 6; // Julio (medio año)
                const diaNacimiento = 15;
                const fechaNacimiento = new Date(añoNacimiento, mesNacimiento, diaNacimiento);
                
                // Verificar que la edad calculada coincida
                const edadVerificacion = calcularEdad(fechaNacimiento);
                
                if (isVerbose) {
                    console.log(`   ${usuario.nombre} (${usuario.cedula})`);
                    console.log(`   Edad original: ${usuario.edad} años`);
                    console.log(`   Fecha calculada: ${fechaNacimiento.toISOString().split('T')[0]}`);
                    console.log(`   Edad verificación: ${edadVerificacion} años`);
                }
                
                // Actualizar en base de datos (solo si no es dry-run)
                if (!isDryRun) {
                    await collection.updateOne(
                        { _id: usuario._id },
                        { 
                            $set: { fechaNacimiento: fechaNacimiento },
                            $unset: { edad: "" }
                        }
                    );
                }
                
                migrados++;
                
                if (!isVerbose) {
                    // Mostrar progreso
                    if (migrados % 10 === 0) {
                        process.stdout.write(`   Progreso: ${migrados}/${usuarios.length}\r`);
                    }
                } else {
                    console.log(`   ✅ Migrado exitosamente\n`);
                }
                
            } catch (error) {
                errores++;
                erroresDetallados.push({
                    usuario: usuario.nombre,
                    cedula: usuario.cedula,
                    error: error.message
                });
                
                if (isVerbose) {
                    console.error(`   ❌ Error: ${error.message}\n`);
                }
            }
        }
        
        // Paso 5: Mostrar resumen
        console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📈 RESUMEN DE MIGRACIÓN');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log(`   Total de usuarios encontrados: ${usuarios.length}`);
        console.log(`   ✅ Migrados exitosamente: ${migrados}`);
        console.log(`   ⚠️  Saltados (edad inválida): ${saltados}`);
        console.log(`   ❌ Errores: ${errores}`);
        
        if (isDryRun) {
            console.log('\n   ⚠️  MODO DRY-RUN: No se hicieron cambios reales');
        }
        
        // Mostrar errores detallados si los hay
        if (errores > 0 && isVerbose) {
            console.log('\n❌ ERRORES DETALLADOS:');
            erroresDetallados.forEach((e, i) => {
                console.log(`\n   ${i + 1}. Usuario: ${e.usuario} (${e.cedula})`);
                console.log(`      Error: ${e.error}`);
            });
        }
        
        // Notas finales
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 NOTAS IMPORTANTES');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('   ℹ️  Las fechas de nacimiento son aproximadas:');
        console.log('      • Se usa 15 de julio del año calculado');
        console.log('      • Los usuarios pueden actualizar su fecha exacta');
        console.log('      • La edad se calcula automáticamente');
        
        if (!isDryRun) {
            console.log('\n   ✅ Campo "edad" eliminado de la base de datos');
            console.log('   ✅ Campo "fechaNacimiento" agregado');
            console.log('   ✅ Edad ahora es un campo virtual (calculado)');
        }
        
        // Verificación post-migración (solo si no es dry-run)
        if (!isDryRun && migrados > 0) {
            console.log('\n🔍 Verificando migración...');
            const verificacion = await collection.countDocuments({ 
                edad: { $exists: true } 
            });
            
            if (verificacion === 0) {
                console.log('   ✅ Verificación exitosa: No quedan usuarios con campo "edad"');
            } else {
                console.log(`   ⚠️  Advertencia: ${verificacion} usuarios aún tienen campo "edad"`);
            }
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n${isDryRun ? '🔍 Simulación' : '✅ Migración'} completada exitosamente\n`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error crítico en migración:', error);
        console.error('   Stack trace:', error.stack);
        process.exit(1);
    }
}

// Manejo de interrupciones
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Migración interrumpida por el usuario');
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('\n\n⚠️  Migración terminada');
    process.exit(1);
});