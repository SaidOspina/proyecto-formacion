// ===== INICIALIZACIÓN =====
let usuariosPagina = 1;
let usuariosActuales = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar admin
    if (!auth.checkAdmin()) return;

    ui.updateNavbar();

    // Configurar navegación
    initNavegacion();

    // Cargar dashboard
    await cargarDashboard();

    // Configurar formularios
    initFormularios();
});

// ===== NAVEGACIÓN =====
function initNavegacion() {
    const menuItems = document.querySelectorAll('.admin-menu a');
    const sections = document.querySelectorAll('.admin-section');

    menuItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const section = item.dataset.section;

            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(s => s.classList.add('hidden'));
            document.getElementById(`${section}Section`).classList.remove('hidden');

            switch(section) {
                case 'dashboard': await cargarDashboard(); break;
                case 'usuarios': await cargarUsuarios(); break;
                case 'preguntas': await cargarPreguntas(); break;
            }
        });
    });
}

// ===== DASHBOARD =====
async function cargarDashboard() {
    ui.showLoading();
    try {
        const data = await api.get('/progreso/estadisticas');
        if (data.success) {
            const stats = data.estadisticas;
            document.getElementById('totalUsuarios').textContent = stats.totalUsuarios;
            document.getElementById('usuariosActivos').textContent = stats.usuariosActivos;
            document.getElementById('certificadosEmitidos').textContent = stats.certificadosEmitidos;
            document.getElementById('tasaCompletitud').textContent = `${stats.tasaCompletitud}%`;
            document.getElementById('completaronT1').textContent = stats.completaronTematica1;
            document.getElementById('completaronT2').textContent = stats.completaronTematica2;
            document.getElementById('completaronT3').textContent = stats.completaronTematica3;
        }
    } catch (error) {
        console.error('Error al cargar dashboard:', error);
    } finally {
        ui.hideLoading();
    }
}

// ===== USUARIOS =====
async function cargarUsuarios(pagina = 1) {
    ui.showLoading();
    try {
        const busqueda = document.getElementById('busquedaUsuario').value;
        const estado = document.getElementById('filtroEstado').value;
        const tipo = document.getElementById('filtroTipo').value;

        let url = `/usuarios?page=${pagina}&limit=10`;
        if (busqueda) url += `&busqueda=${encodeURIComponent(busqueda)}`;
        if (estado) url += `&estado=${estado}`;
        if (tipo) url += `&tipoUsuario=${tipo}`;

        const data = await api.get(url);
        
        if (data.success) {
            usuariosActuales = data.usuarios;
            renderizarUsuarios(data.usuarios);
            renderizarPaginacion(data.paginas, data.paginaActual);
        }
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
    } finally {
        ui.hideLoading();
    }
}

function renderizarUsuarios(usuarios) {
    const tbody = document.getElementById('tablaUsuarios');
    tbody.innerHTML = '';

    usuarios.forEach(u => {
        const progresoNum = (u.progreso.tematica1.completado ? 1 : 0) + 
                          (u.progreso.tematica2.completado ? 1 : 0) + 
                          (u.progreso.tematica3.completado ? 1 : 0);
        
        tbody.innerHTML += `
            <tr>
                <td>${u.nombre}</td>
                <td>${u.cedula}</td>
                <td>${u.correo}</td>
                <td><span class="badge badge-${u.tipoUsuario.toLowerCase()}">${u.tipoUsuario}</span></td>
                <td><span class="badge badge-${u.estado.toLowerCase()}">${u.estado}</span></td>
                <td>${progresoNum}/3</td>
                <td class="acciones-btn">
                    <button class="btn-icon edit" onclick="editarUsuario('${u._id}')" title="Editar">✏️</button>
                    <!--<button class="btn-icon view" onclick="verSesiones('${u._id}', '${u.nombre}')" title="Ver sesiones">📊</button> -->
                    <button class="btn-icon delete" onclick="toggleEstadoUsuario('${u._id}')" title="Cambiar estado">🔄</button>
                </td>
            </tr>
        `;
    });
}

function renderizarPaginacion(totalPaginas, paginaActual) {
    const container = document.getElementById('paginacionUsuarios');
    container.innerHTML = '';

    for (let i = 1; i <= totalPaginas; i++) {
        container.innerHTML += `
            <button class="${i === paginaActual ? 'active' : ''}" onclick="cargarUsuarios(${i})">${i}</button>
        `;
    }
}

function buscarUsuarios() {
    cargarUsuarios(1);
}

function abrirModalUsuario() {
    document.getElementById('modalUsuarioTitulo').textContent = 'Nuevo Usuario';
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('campoPassword').style.display = 'block';
    document.getElementById('usuarioPassword').required = true;
    ui.showModal('modalUsuario');
}

async function editarUsuario(id) {
    const usuario = usuariosActuales.find(u => u._id === id);
    if (!usuario) return;

    document.getElementById('modalUsuarioTitulo').textContent = 'Editar Usuario';
    document.getElementById('usuarioId').value = usuario._id;
    document.getElementById('usuarioCedula').value = usuario.cedula;
    document.getElementById('usuarioNombre').value = usuario.nombre;
    document.getElementById('usuarioCorreo').value = usuario.correo;
    document.getElementById('usuarioTelefono').value = usuario.telefono;
    document.getElementById('usuarioTipo').value = usuario.tipoUsuario;
    document.getElementById('usuarioEstado').value = usuario.estado;
    document.getElementById('campoPassword').style.display = 'none';
    document.getElementById('usuarioPassword').required = false;
    ui.showModal('modalUsuario');
}

async function toggleEstadoUsuario(id) {
    if (!confirm('¿Cambiar el estado de este usuario?')) return;
    
    ui.showLoading();
    try {
        const data = await api.patch(`/usuarios/${id}/estado`);
        if (data.success) {
            ui.showAlert(data.mensaje, 'success');
            cargarUsuarios(usuariosPagina);
        }
    } catch (error) {
        ui.showAlert('Error al cambiar estado');
    } finally {
        ui.hideLoading();
    }
}

// ===== SESIONES =====
async function verSesiones(id, nombre) {
    document.querySelectorAll('.admin-menu a').forEach(i => i.classList.remove('active'));
    document.querySelector('[data-section="sesiones"]').classList.add('active');
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('sesionesSection').classList.remove('hidden');

    ui.showLoading();
    try {
        const data = await api.get(`/usuarios/${id}/sesiones`);
        
        document.getElementById('infoSesiones').classList.remove('hidden');
        document.getElementById('nombreSesiones').textContent = nombre;
        document.getElementById('tiempoTotal').textContent = format.tiempo(data.tiempoTotalConectado || 0);

        const tbody = document.getElementById('tablaSesiones');
        tbody.innerHTML = '';

        if (data.sesiones && data.sesiones.length > 0) {
            data.sesiones.forEach(s => {
                tbody.innerHTML += `
                    <tr>
                        <td>${format.fecha(s.fechaHoraInicio)}</td>
                        <td>${format.tiempo(s.tiempo || 0)}</td>
                        <td><span class="badge badge-${s.activa ? 'activo' : 'inactivo'}">${s.activa ? 'Activa' : 'Finalizada'}</span></td>
                        <td>${s.ip || 'N/A'}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay sesiones registradas</td></tr>';
        }
    } catch (error) {
        ui.showAlert('Error al cargar sesiones');
    } finally {
        ui.hideLoading();
    }
}

function buscarSesionesUsuario() {
    const busqueda = document.getElementById('busquedaSesion').value;
    if (!busqueda) return;
    
    api.get(`/usuarios?busqueda=${encodeURIComponent(busqueda)}&limit=1`)
        .then(data => {
            if (data.success && data.usuarios.length > 0) {
                verSesiones(data.usuarios[0]._id, data.usuarios[0].nombre);
            } else {
                ui.showAlert('Usuario no encontrado');
            }
        });
}

// ===== PREGUNTAS =====
async function cargarPreguntas() {
    ui.showLoading();
    try {
        const tematica = document.getElementById('filtroTematica').value;
        let url = '/preguntas';
        if (tematica) url += `?tematica=${tematica}`;

        const data = await api.get(url);
        
        if (data.success) {
            renderizarPreguntas(data.preguntas);
        }
    } catch (error) {
        console.error('Error al cargar preguntas:', error);
    } finally {
        ui.hideLoading();
    }
}

function renderizarPreguntas(preguntas) {
    const container = document.getElementById('listaPreguntas');
    container.innerHTML = '';

    const agrupadas = { 1: [], 2: [], 3: [] };
    preguntas.forEach(p => agrupadas[p.tematica].push(p));

    [1, 2, 3].forEach(t => {
        if (agrupadas[t].length > 0) {
            container.innerHTML += `<h3 class="titulo-tiza" style="margin: 20px 0;">Temática ${t}</h3>`;
            
            agrupadas[t].forEach((p, i) => {
                container.innerHTML += `
                    <div class="pregunta-card">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <div class="pregunta-numero">Pregunta ${i + 1} ${!p.activa ? '(Inactiva)' : ''}</div>
                                <div class="pregunta-texto">${p.enunciado}</div>
                                <div style="margin-top: 10px; font-size: 0.9rem; opacity: 0.8;">
                                    ✅ ${p.respuestaCorrecta}<br>
                                    ❌ ${p.respuesta1}<br>
                                    ❌ ${p.respuesta2}<br>
                                    ❌ ${p.respuesta3}
                                </div>
                            </div>
                            <div class="acciones-btn">
                                <button class="btn-icon edit" onclick="editarPregunta('${p._id}')" title="Editar">✏️</button>
                                <button class="btn-icon delete" onclick="eliminarPregunta('${p._id}')" title="Eliminar">🗑️</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    });
}

function abrirModalPregunta() {
    document.getElementById('modalPreguntaTitulo').textContent = 'Nueva Pregunta';
    document.getElementById('formPregunta').reset();
    document.getElementById('preguntaId').value = '';
    ui.showModal('modalPregunta');
}

async function editarPregunta(id) {
    ui.showLoading();
    try {
        const data = await api.get('/preguntas');
        const pregunta = data.preguntas.find(p => p._id === id);
        
        if (pregunta) {
            document.getElementById('modalPreguntaTitulo').textContent = 'Editar Pregunta';
            document.getElementById('preguntaId').value = pregunta._id;
            document.getElementById('preguntaTematica').value = pregunta.tematica;
            document.getElementById('preguntaEnunciado').value = pregunta.enunciado;
            document.getElementById('preguntaCorrecta').value = pregunta.respuestaCorrecta;
            document.getElementById('preguntaR1').value = pregunta.respuesta1;
            document.getElementById('preguntaR2').value = pregunta.respuesta2;
            document.getElementById('preguntaR3').value = pregunta.respuesta3;
            ui.showModal('modalPregunta');
        }
    } catch (error) {
        ui.showAlert('Error al cargar pregunta');
    } finally {
        ui.hideLoading();
    }
}

async function eliminarPregunta(id) {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    
    ui.showLoading();
    try {
        const data = await api.delete(`/preguntas/${id}`);
        if (data.success) {
            ui.showAlert('Pregunta eliminada', 'success');
            cargarPreguntas();
        }
    } catch (error) {
        ui.showAlert('Error al eliminar pregunta');
    } finally {
        ui.hideLoading();
    }
}

// ===== FORMULARIOS =====
function initFormularios() {
    document.getElementById('formUsuario').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('usuarioId').value;
        const datos = {
            cedula: document.getElementById('usuarioCedula').value,
            nombre: document.getElementById('usuarioNombre').value,
            correo: document.getElementById('usuarioCorreo').value,
            telefono: document.getElementById('usuarioTelefono').value,
            tipoUsuario: document.getElementById('usuarioTipo').value,
            estado: document.getElementById('usuarioEstado').value
        };

        if (!id) {
            datos.contraseña = document.getElementById('usuarioPassword').value;
        }

        ui.showLoading();
        try {
            let data;
            if (id) {
                data = await api.put(`/usuarios/${id}`, datos);
            } else {
                data = await api.post('/usuarios', datos);
            }

            if (data.success) {
                ui.showAlert(data.mensaje, 'success');
                cerrarModal('modalUsuario');
                cargarUsuarios();
            } else {
                ui.showAlert(data.mensaje);
            }
        } catch (error) {
            ui.showAlert('Error al guardar usuario');
        } finally {
            ui.hideLoading();
        }
    });

    document.getElementById('formPregunta').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('preguntaId').value;
        const datos = {
            tematica: parseInt(document.getElementById('preguntaTematica').value),
            enunciado: document.getElementById('preguntaEnunciado').value,
            respuestaCorrecta: document.getElementById('preguntaCorrecta').value,
            respuesta1: document.getElementById('preguntaR1').value,
            respuesta2: document.getElementById('preguntaR2').value,
            respuesta3: document.getElementById('preguntaR3').value
        };

        ui.showLoading();
        try {
            let data;
            if (id) {
                data = await api.put(`/preguntas/${id}`, datos);
            } else {
                data = await api.post('/preguntas', datos);
            }

            if (data.success) {
                ui.showAlert(data.mensaje, 'success');
                cerrarModal('modalPregunta');
                cargarPreguntas();
            } else {
                ui.showAlert(data.mensaje);
            }
        } catch (error) {
            ui.showAlert('Error al guardar pregunta');
        } finally {
            ui.hideLoading();
        }
    });
}

function cerrarModal(id) {
    document.getElementById(id).classList.remove('show');
}
