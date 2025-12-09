// ===== CONFIGURACIÓN =====
const API_URL = '/api';

// ===== UTILIDADES =====
const showLoading = () => document.getElementById('loadingOverlay').classList.remove('hidden');
const hideLoading = () => document.getElementById('loadingOverlay').classList.add('hidden');

const showAlert = (message, type = 'error') => {
    const container = document.getElementById('alertContainer');
    container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => container.innerHTML = '', 5000);
};

const saveToStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const getFromStorage = (key) => JSON.parse(localStorage.getItem(key));
const removeFromStorage = (key) => localStorage.removeItem(key);

// Calcular edad desde fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
    }
    
    return edad;
};

// Validar fecha de nacimiento
const validarFechaNacimiento = (fecha) => {
    const edad = calcularEdad(fecha);
    return edad >= 18 && edad <= 100;
};

// ===== VERIFICAR SESIÓN AL CARGAR =====
document.addEventListener('DOMContentLoaded', () => {
    const token = getFromStorage('token');
    const usuario = getFromStorage('usuario');

    if (token && usuario) {
        redirectBasedOnRole(usuario.tipoUsuario);
    }

    initTabs();
    initForms();
    initGeneroSelector();
    initFechaNacimientoValidation();
});

// ===== REDIRECCIÓN BASADA EN ROL =====
const redirectBasedOnRole = (tipoUsuario) => {
    if (tipoUsuario === 'Administrador') {
        window.location.href = 'html/admin.html';
    } else {
        window.location.href = 'html/tematica1.html';
    }
};

// ===== SELECTOR DE GÉNERO =====
const initGeneroSelector = () => {
    const generoSelect = document.getElementById('regGenero');
    const otroGeneroContainer = document.getElementById('otroGeneroContainer');
    const otroGeneroInput = document.getElementById('regOtroGenero');

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
};

// ===== VALIDACIÓN DE FECHA DE NACIMIENTO =====
const initFechaNacimientoValidation = () => {
    const fechaInput = document.getElementById('regFechaNacimiento');
    
    // Establecer fecha máxima (hace 18 años)
    const hoy = new Date();
    const hace18Years = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    fechaInput.max = hace18Years.toISOString().split('T')[0];
    
    // Establecer fecha mínima (hace 100 años)
    const hace100Years = new Date(hoy.getFullYear() - 100, hoy.getMonth(), hoy.getDate());
    fechaInput.min = hace100Years.toISOString().split('T')[0];
    
    // Validar en tiempo real
    fechaInput.addEventListener('change', () => {
        if (fechaInput.value) {
            if (!validarFechaNacimiento(fechaInput.value)) {
                showAlert('Debes tener entre 18 y 100 años', 'error');
                fechaInput.value = '';
            }
        }
    });
};

// ===== TABS =====
const initTabs = () => {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${targetTab}Form`).classList.add('active');
        });
    });

    // Link olvidé contraseña
    document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById('recuperarForm').classList.add('active');
        document.getElementById('authTabs').style.display = 'none';
    });

    // Link volver a login
    document.getElementById('backToLoginLink').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('authTabs').style.display = 'flex';
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById('loginForm').classList.add('active');
        document.querySelector('.auth-tab[data-tab="login"]').classList.add('active');
    });
};

// ===== FORMULARIOS =====
const initForms = () => {
    // Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const correo = document.getElementById('loginCorreo').value;
        const contraseña = document.getElementById('loginPassword').value;

        showLoading();

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contraseña })
            });

            const data = await response.json();

            if (data.success) {
                saveToStorage('token', data.token);
                saveToStorage('usuario', data.usuario);
                saveToStorage('sesionId', data.sesionId);
                
                showAlert('¡Bienvenido!', 'success');
                setTimeout(() => redirectBasedOnRole(data.usuario.tipoUsuario), 1000);
            } else {
                showAlert(data.mensaje);
            }
        } catch (error) {
            showAlert('Error de conexión. Intenta de nuevo.');
            console.error(error);
        } finally {
            hideLoading();
        }
    });

    // Registro
    document.getElementById('registroForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const cedula = document.getElementById('regCedula').value;
        const nombre = document.getElementById('regNombre').value;
        const correo = document.getElementById('regCorreo').value;
        const telefono = document.getElementById('regTelefono').value;
        
        // Usar la función helper para obtener valores correctos
        const genero = window.getFormValue ? window.getFormValue('regGenero', 'regOtroGenero') : document.getElementById('regGenero').value;
        const profesion = window.getFormValue ? window.getFormValue('regProfesion', 'regOtraProfesion') : document.getElementById('regProfesion').value;
        const cargo = window.getFormValue ? window.getFormValue('regCargo', 'regOtroCargo') : document.getElementById('regCargo').value;
        
        const fechaNacimiento = document.getElementById('regFechaNacimiento').value;
        const contraseña = document.getElementById('regPassword').value;
        const confirmar = document.getElementById('regPasswordConfirm').value;

        // Validaciones
        if (contraseña !== confirmar) {
            showAlert('Las contraseñas no coinciden');
            return;
        }

        if (!genero || genero === '') {
            showAlert('Por favor selecciona tu género');
            return;
        }

        if (!fechaNacimiento) {
            showAlert('Por favor ingresa tu fecha de nacimiento');
            return;
        }

        if (!validarFechaNacimiento(fechaNacimiento)) {
            showAlert('Debes tener entre 18 y 100 años');
            return;
        }

        if (!profesion || profesion === '') {
            showAlert('Por favor selecciona tu profesión');
            return;
        }

        if (!cargo || cargo === '') {
            showAlert('Por favor selecciona tu cargo');
            return;
        }

        showLoading();

        // 🔍 DEBUGGING: Ver qué datos se envían
        const datosRegistro = { 
            cedula, 
            nombre, 
            correo, 
            telefono, 
            genero,
            otroGenero: '', // Ya está incluido en genero si era "Otro"
            fechaNacimiento,
            profesion,
            cargo,
            contraseña 
        };
        
        console.log('🔍 DEBUG - Datos que se enviarán:', datosRegistro);
        console.log('🔍 DEBUG - Fecha de nacimiento:', fechaNacimiento, typeof fechaNacimiento);

        try {
            const response = await fetch(`${API_URL}/auth/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosRegistro)
            });

            const data = await response.json();
            
            console.log('📥 DEBUG - Respuesta del servidor:', data);
            console.log('📥 DEBUG - Status:', response.status);

            if (data.success) {
                saveToStorage('token', data.token);
                saveToStorage('usuario', data.usuario);
                
                showAlert('¡Registro exitoso! Bienvenido.', 'success');
                setTimeout(() => redirectBasedOnRole(data.usuario.tipoUsuario), 1000);
            } else {
                showAlert(data.mensaje);
                console.error('❌ Error del servidor:', data);
            }
        } catch (error) {
            showAlert('Error de conexión. Intenta de nuevo.');
            console.error('❌ Error completo:', error);
        } finally {
            hideLoading();
        }
    });

    // Recuperar contraseña
    document.getElementById('recuperarForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const correo = document.getElementById('recuperarCorreo').value;

        showLoading();

        try {
            const response = await fetch(`${API_URL}/auth/recuperar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo })
            });

            const data = await response.json();

            if (data.success) {
                showAlert('Se han enviado las instrucciones a tu correo.', 'success');
                document.getElementById('recuperarForm').reset();
            } else {
                showAlert(data.mensaje);
            }
        } catch (error) {
            showAlert('Error de conexión. Intenta de nuevo.');
            console.error(error);
        } finally {
            hideLoading();
        }
    });
};