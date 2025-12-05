// ===== VARIABLES GLOBALES =====
let preguntasActuales = [];
let respuestasSeleccionadas = {};
let tematicaActual = 1;
let siguientePagina = '';

// ===== INICIALIZACIÓN =====
async function initTematica(numero, siguiente) {
    tematicaActual = numero;
    siguientePagina = siguiente;

    // Verificar autenticación
    if (!auth.checkAuth()) return;

    // Cargar datos del usuario
    ui.updateNavbar();

    // Cargar progreso
    await cargarProgreso();

    // Verificar acceso a esta temática
    await verificarAcceso();

    // Cargar preguntas
    await cargarPreguntas();

    // Configurar botón de enviar
    document.getElementById('btnEnviarEvaluacion').addEventListener('click', enviarEvaluacion);

    // Configurar botones del modal
    document.getElementById('btnContinuar').addEventListener('click', () => {
        window.location.href = siguientePagina;
    });

    document.getElementById('btnReintentar').addEventListener('click', () => {
        ui.hideModal('resultadoModal');
        reiniciarEvaluacion();
    });
}

// ===== CARGAR PROGRESO =====
async function cargarProgreso() {
    try {
        const data = await progreso.get();
        if (data && data.progreso) {
            actualizarUIProgreso(data.progreso);
            actualizarNavLinks(data.progreso);
        }
    } catch (error) {
        console.error('Error al cargar progreso:', error);
    }
}

function actualizarUIProgreso(prog) {
    let completadas = 0;

    if (prog.tematica1.completado) {
        document.getElementById('step1').classList.add('completed');
        document.getElementById('step1').classList.remove('active');
        completadas++;
    }
    if (prog.tematica2.completado) {
        document.getElementById('step2').classList.add('completed');
        document.getElementById('step2').classList.remove('active');
        completadas++;
    }
    if (prog.tematica3.completado) {
        document.getElementById('step3').classList.add('completed');
        document.getElementById('step3').classList.remove('active');
        document.getElementById('step4').classList.add('completed');
        completadas++;
    }

    // Marcar temática actual como activa
    const stepActual = document.getElementById(`step${tematicaActual}`);
    if (stepActual && !stepActual.classList.contains('completed')) {
        stepActual.classList.add('active');
    }

    // Actualizar barra de progreso
    const porcentaje = (completadas / 3) * 100;
    document.getElementById('progresoFill').style.width = `${porcentaje}%`;
}

function actualizarNavLinks(prog) {
    const link2 = document.getElementById('linkTematica2');
    const link3 = document.getElementById('linkTematica3');
    const linkCert = document.getElementById('linkCertificado');

    if (!prog.tematica1.completado && tematicaActual !== 2) {
        if (link2) {
            link2.style.opacity = '0.5';
            link2.style.pointerEvents = 'none';
        }
    }

    if (!prog.tematica2.completado && tematicaActual !== 3) {
        if (link3) {
            link3.style.opacity = '0.5';
            link3.style.pointerEvents = 'none';
        }
    }

    if (!prog.tematica3.completado) {
        if (linkCert) {
            linkCert.style.opacity = '0.5';
            linkCert.style.pointerEvents = 'none';
        }
    }
}

// ===== VERIFICAR ACCESO =====
async function verificarAcceso() {
    const data = await progreso.get();
    if (!data) return;

    const prog = data.progreso;

    if (tematicaActual === 2 && !prog.tematica1.completado) {
        ui.showAlert('Debes completar la Temática 1 primero', 'error');
        setTimeout(() => window.location.href = 'tematica1.html', 2000);
        return;
    }

    if (tematicaActual === 3 && !prog.tematica2.completado) {
        ui.showAlert('Debes completar la Temática 2 primero', 'error');
        setTimeout(() => window.location.href = 'tematica2.html', 2000);
        return;
    }
}

// ===== CARGAR PREGUNTAS =====
async function cargarPreguntas() {
    ui.showLoading();

    try {
        preguntasActuales = await evaluacion.getPreguntas(tematicaActual);
        renderizarPreguntas();
    } catch (error) {
        console.error('Error al cargar preguntas:', error);
        ui.showAlert('Error al cargar las preguntas');
    } finally {
        ui.hideLoading();
    }
}

function renderizarPreguntas() {
    const container = document.getElementById('preguntasContainer');
    container.innerHTML = '';

    preguntasActuales.forEach((pregunta, index) => {
        const preguntaHTML = `
            <div class="pregunta-card">
                <div class="pregunta-numero">Pregunta ${index + 1}</div>
                <div class="pregunta-texto">${pregunta.enunciado}</div>
                <div class="opciones-respuesta" data-pregunta="${pregunta._id}">
                    ${pregunta.opciones.map((opcion, i) => `
                        <label class="opcion" data-opcion="${opcion}">
                            <input type="radio" name="pregunta_${index}" value="${opcion}">
                            <span class="opcion-radio"></span>
                            <span class="opcion-texto">${opcion}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
        container.innerHTML += preguntaHTML;
    });

    document.querySelectorAll('.opcion').forEach(opcion => {
        opcion.addEventListener('click', () => seleccionarOpcion(opcion));
    });
}

function seleccionarOpcion(opcion) {
    const container = opcion.closest('.opciones-respuesta');
    const preguntaId = container.dataset.pregunta;
    const valor = opcion.dataset.opcion;

    container.querySelectorAll('.opcion').forEach(o => o.classList.remove('selected'));

    opcion.classList.add('selected');
    opcion.querySelector('input').checked = true;

    respuestasSeleccionadas[preguntaId] = valor;

    verificarRespuestasCompletas();
}

function verificarRespuestasCompletas() {
    const totalPreguntas = preguntasActuales.length;
    const totalRespuestas = Object.keys(respuestasSeleccionadas).length;

    const btnEnviar = document.getElementById('btnEnviarEvaluacion');
    btnEnviar.disabled = totalRespuestas < totalPreguntas;
}

// ===== ENVIAR EVALUACIÓN =====
async function enviarEvaluacion() {
    ui.showLoading();

    const respuestas = Object.entries(respuestasSeleccionadas).map(([preguntaId, respuesta]) => ({
        preguntaId,
        respuesta
    }));

    try {
        const resultado = await evaluacion.verificar(respuestas);

        if (!resultado) {
            ui.showAlert('Error al verificar las respuestas');
            return;
        }

        mostrarResultadosEnPreguntas(resultado.resultados);

        if (resultado.aprobado) {
            await progreso.actualizar(tematicaActual, resultado.puntuacion);
        }

        mostrarResultadoModal(resultado);

    } catch (error) {
        console.error('Error:', error);
        ui.showAlert('Error al enviar la evaluación');
    } finally {
        ui.hideLoading();
    }
}

function mostrarResultadosEnPreguntas(resultados) {
    resultados.forEach(r => {
        const container = document.querySelector(`[data-pregunta="${r.preguntaId}"]`);
        if (!container) return;

        container.querySelectorAll('.opcion').forEach(opcion => {
            const valor = opcion.dataset.opcion;

            if (valor === r.respuestaCorrecta) {
                opcion.classList.add('correct');
            } else if (opcion.classList.contains('selected') && !r.correcta) {
                opcion.classList.add('incorrect');
            }
        });
    });
}

function mostrarResultadoModal(resultado) {
    const modal = document.getElementById('resultadoModal');
    const icon = document.getElementById('resultadoIcon');
    const titulo = document.getElementById('resultadoTitulo');
    const puntuacion = document.getElementById('resultadoPuntuacion');
    const btnContinuar = document.getElementById('btnContinuar');
    const btnReintentar = document.getElementById('btnReintentar');

    if (resultado.aprobado) {
        icon.textContent = '🎉';
        titulo.textContent = '¡Felicidades!';
        titulo.className = 'resultado-titulo aprobado';
        puntuacion.textContent = `Has obtenido ${resultado.puntuacion}% (${resultado.correctas}/${resultado.total} correctas)`;
        btnContinuar.classList.remove('hidden');
        btnReintentar.classList.add('hidden');

        if (tematicaActual === 3) {
            btnContinuar.textContent = 'Ver Certificado 🎓';
        }
    } else {
        icon.textContent = '😕';
        titulo.textContent = 'No aprobaste';
        titulo.className = 'resultado-titulo reprobado';
        puntuacion.textContent = `Obtuviste ${resultado.puntuacion}% (${resultado.correctas}/${resultado.total} correctas). Necesitas mínimo 60%`;
        btnContinuar.classList.add('hidden');
        btnReintentar.classList.remove('hidden');
    }

    ui.showModal('resultadoModal');
}

function reiniciarEvaluacion() {
    respuestasSeleccionadas = {};
    
    document.querySelectorAll('.opcion').forEach(opcion => {
        opcion.classList.remove('selected', 'correct', 'incorrect');
        opcion.querySelector('input').checked = false;
    });

    document.getElementById('btnEnviarEvaluacion').disabled = true;
    
    document.getElementById('evaluacionSection').scrollIntoView({ behavior: 'smooth' });
}
