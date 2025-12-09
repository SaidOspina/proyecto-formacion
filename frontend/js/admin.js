// ===== INICIALIZACIÓN =====
let usuariosPagina = 1;
let usuariosActuales = [];

// Calcular edad desde fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }
    
    return edad;
};

// Formatear fecha para input date
const formatearFechaParaInput = (fecha) => {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toISOString().split('T')[0];
};

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
    
    // Configurar selector de género en modal
    initGeneroModal();
    
    // Configurar validación de fecha de nacimiento
    initFechaNacimientoValidation();
});

// ===== VALIDACIÓN DE FECHA DE NACIMIENTO =====
function initFechaNacimientoValidation() {
    const fechaInput = document.getElementById('usuarioFechaNacimiento');
    
    if (fechaInput) {
        // Establecer fecha máxima (hace 18 años)
        const hoy = new Date();
        const hace18Years = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
        fechaInput.max = hace18Years.toISOString().split('T')[0];
        
        // Establecer fecha mínima (hace 100 años)
        const hace100Years = new Date(hoy.getFullYear() - 100, hoy.getMonth(), hoy.getDate());
        fechaInput.min = hace100Years.toISOString().split('T')[0];
    }
}

// ===== SELECTOR DE GÉNERO EN MODAL =====
function initGeneroModal() {
    const generoSelect = document.getElementById('usuarioGenero');
    const otroGeneroContainer = document.getElementById('campoOtroGenero');
    const otroGeneroInput = document.getElementById('usuarioOtroGenero');

    if (generoSelect && otroGeneroContainer && otroGeneroInput) {
        generoSelect.addEventListener('change', () => {
            if (generoSelect.value === 'Otro') {
                otroGeneroContainer.classList.remove('hidden');
                otroGeneroInput.required = true;
            } else {
                otroGeneroContainer.classList.add('hidden');
                otroGeneroInput.required = false;
                otroGeneroInput.value = '';
            }
        });
    }
}

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
                case 'estadisticas': await cargarEstadisticasDemograficas(); break;
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

// ===== ESTADÍSTICAS DEMOGRÁFICAS =====
async function cargarEstadisticasDemograficas() {
    ui.showLoading();
    try {
        const data = await api.get('/usuarios/estadisticas/demograficas');
        
        if (data.success) {
            renderizarEstadisticasGenero(data.estadisticas.porGenero);
            renderizarEstadisticasEdad(data.estadisticas.porEdad);
            renderizarEstadisticasProfesion(data.estadisticas.porProfesion);
            renderizarEstadisticasCargo(data.estadisticas.porCargo);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        ui.showAlert('Error al cargar estadísticas demográficas');
    } finally {
        ui.hideLoading();
    }
}

function renderizarEstadisticasGenero(datos) {
    const tbody = document.getElementById('tablaGenero');
    tbody.innerHTML = '';
    
    if (!datos || datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No hay datos disponibles</td></tr>';
        return;
    }
    
    const total = datos.reduce((sum, item) => sum + item.total, 0);
    
    datos.forEach(item => {
        const porcentaje = ((item.total / total) * 100).toFixed(1);
        let generoDisplay = item._id;
        
        if (item._id === 'Otro' && item.otrosGeneros && item.otrosGeneros.length > 0) {
            const otrosUnicos = [...new Set(item.otrosGeneros.filter(g => g))];
            if (otrosUnicos.length > 0) {
                generoDisplay += ` (${otrosUnicos.join(', ')})`;
            }
        }
        
        tbody.innerHTML += `
            <tr>
                <td>${generoDisplay}</td>
                <td>${item.total}</td>
                <td>${porcentaje}%</td>
            </tr>
        `;
    });
}

function renderizarEstadisticasEdad(datos) {
    const tbody = document.getElementById('tablaEdad');
    tbody.innerHTML = '';
    
    if (!datos || datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No hay datos disponibles</td></tr>';
        return;
    }
    
    const total = datos.reduce((sum, item) => sum + item.total, 0);
    
    const rangosOrden = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const datosOrdenados = rangosOrden
        .map(rango => datos.find(d => d._id === rango))
        .filter(d => d);
    
    datosOrdenados.forEach(item => {
        const porcentaje = ((item.total / total) * 100).toFixed(1);
        
        tbody.innerHTML += `
            <tr>
                <td>${item._id} años</td>
                <td>${item.total}</td>
                <td>${porcentaje}%</td>
            </tr>
        `;
    });
}

function renderizarEstadisticasProfesion(datos) {
    const tbody = document.getElementById('tablaProfesion');
    tbody.innerHTML = '';
    
    if (!datos || datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No hay datos disponibles</td></tr>';
        return;
    }
    
    const total = datos.reduce((sum, item) => sum + item.total, 0);
    
    datos.forEach(item => {
        const porcentaje = ((item.total / total) * 100).toFixed(1);
        
        tbody.innerHTML += `
            <tr>
                <td>${item._id}</td>
                <td>${item.total}</td>
                <td>${porcentaje}%</td>
            </tr>
        `;
    });
}

function renderizarEstadisticasCargo(datos) {
    const tbody = document.getElementById('tablaCargo');
    tbody.innerHTML = '';
    
    if (!datos || datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">No hay datos disponibles</td></tr>';
        return;
    }
    
    const total = datos.reduce((sum, item) => sum + item.total, 0);
    
    datos.forEach(item => {
        const porcentaje = ((item.total / total) * 100).toFixed(1);
        
        tbody.innerHTML += `
            <tr>
                <td>${item._id}</td>
                <td>${item.total}</td>
                <td>${porcentaje}%</td>
            </tr>
        `;
    });
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
        
        const generoDisplay = u.genero === 'Otro' && u.otroGenero ? 
            `${u.genero} (${u.otroGenero})` : u.genero;
        
        // Calcular edad desde fechaNacimiento
        const edad = u.fechaNacimiento ? calcularEdad(u.fechaNacimiento) : (u.edad || 'N/A');
        
        tbody.innerHTML += `
            <tr>
                <td>${u.nombre}</td>
                <td>${u.cedula}</td>
                <td>${u.correo}</td>
                <td>${generoDisplay || 'N/A'}</td>
                <td>${edad}</td>
                <td>${u.cargo || 'N/A'}</td>
                <td><span class="badge badge-${u.tipoUsuario.toLowerCase()}">${u.tipoUsuario}</span></td>
                <td><span class="badge badge-${u.estado.toLowerCase()}">${u.estado}</span></td>
                <td>${progresoNum}/3</td>
                <td class="acciones-btn">
                    <button class="btn-icon edit" onclick="editarUsuario('${u._id}')" title="Editar">✏️</button>
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
    document.getElementById('campoOtroGenero').classList.add('hidden');
    
    // Re-inicializar validación de fecha
    initFechaNacimientoValidation();
    
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
    
    // Cargar fecha de nacimiento
    if (usuario.fechaNacimiento) {
        document.getElementById('usuarioFechaNacimiento').value = formatearFechaParaInput(usuario.fechaNacimiento);
    }
    
    // Cargar género
    const generoSelect = document.getElementById('usuarioGenero');
    if (generoSelect) {
        const opcionesGenero = Array.from(generoSelect.options).map(opt => opt.value);
        
        if (opcionesGenero.includes(usuario.genero)) {
            generoSelect.value = usuario.genero;
        } else if (usuario.otroGenero) {
            generoSelect.value = 'Otro';
            const otroGeneroContainer = document.getElementById('campoOtroGenero');
            const otroGeneroInput = document.getElementById('usuarioOtroGenero');
            if (otroGeneroContainer && otroGeneroInput) {
                otroGeneroContainer.classList.remove('hidden');
                otroGeneroInput.value = usuario.otroGenero;
            }
        }
    }
    
    // Cargar profesión
    const profesionSelect = document.getElementById('usuarioProfesion');
    if (profesionSelect) {
        const opcionesProfesion = Array.from(profesionSelect.options).map(opt => opt.value);
        
        if (opcionesProfesion.includes(usuario.profesion)) {
            profesionSelect.value = usuario.profesion;
        } else if (usuario.profesion) {
            profesionSelect.value = 'Otra';
            const otraInput = document.getElementById('usuarioOtraProfesion');
            if (otraInput) {
                const container = otraInput.closest('.form-group');
                if (container) container.classList.remove('hidden');
                otraInput.value = usuario.profesion;
            }
        }
    }
    
    // Cargar cargo
    const cargoSelect = document.getElementById('usuarioCargo');
    if (cargoSelect) {
        const opcionesCargo = Array.from(cargoSelect.options).map(opt => opt.value);
        
        if (opcionesCargo.includes(usuario.cargo)) {
            cargoSelect.value = usuario.cargo;
        } else if (usuario.cargo) {
            cargoSelect.value = 'Otro';
            const otroInput = document.getElementById('usuarioOtroCargo');
            if (otroInput) {
                const container = otroInput.closest('.form-group');
                if (container) container.classList.remove('hidden');
                otroInput.value = usuario.cargo;
            }
        }
    }
    
    document.getElementById('campoPassword').style.display = 'none';
    document.getElementById('usuarioPassword').required = false;
    
    // Re-inicializar validación de fecha
    initFechaNacimientoValidation();
    
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

// ===== PREGUNTAS (continúa igual...) =====
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
        
        const genero = window.getFormValue ? window.getFormValue('usuarioGenero', 'usuarioOtroGenero') : document.getElementById('usuarioGenero').value;
        const profesion = window.getFormValue ? window.getFormValue('usuarioProfesion', 'usuarioOtraProfesion') : document.getElementById('usuarioProfesion').value;
        const cargo = window.getFormValue ? window.getFormValue('usuarioCargo', 'usuarioOtroCargo') : document.getElementById('usuarioCargo').value;
        const fechaNacimiento = document.getElementById('usuarioFechaNacimiento').value;
        
        // Validaciones
        if (!genero || genero === '') {
            ui.showAlert('Por favor selecciona el género');
            return;
        }
        
        if (!fechaNacimiento) {
            ui.showAlert('Por favor ingresa la fecha de nacimiento');
            return;
        }
        
        const edad = calcularEdad(fechaNacimiento);
        if (edad < 18 || edad > 100) {
            ui.showAlert('El usuario debe tener entre 18 y 100 años');
            return;
        }
        
        if (!profesion || profesion === '') {
            ui.showAlert('Por favor selecciona la profesión');
            return;
        }
        
        if (!cargo || cargo === '') {
            ui.showAlert('Por favor selecciona el cargo');
            return;
        }
        
        const datos = {
            cedula: document.getElementById('usuarioCedula').value,
            nombre: document.getElementById('usuarioNombre').value,
            correo: document.getElementById('usuarioCorreo').value,
            telefono: document.getElementById('usuarioTelefono').value,
            genero: genero,
            otroGenero: '',
            fechaNacimiento: fechaNacimiento,
            profesion: profesion,
            cargo: cargo,
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