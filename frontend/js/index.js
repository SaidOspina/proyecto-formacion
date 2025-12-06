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
        const genero = document.getElementById('regGenero').value;
        const otroGenero = document.getElementById('regOtroGenero').value;
        const edad = document.getElementById('regEdad').value;
        const profesion = document.getElementById('regProfesion').value;
        const cargo = document.getElementById('regCargo').value;
        const contraseña = document.getElementById('regPassword').value;
        const confirmar = document.getElementById('regPasswordConfirm').value;

        // Validaciones
        if (contraseña !== confirmar) {
            showAlert('Las contraseñas no coinciden');
            return;
        }

        if (!genero) {
            showAlert('Por favor selecciona tu género');
            return;
        }

        if (genero === 'Otro' && !otroGenero.trim()) {
            showAlert('Por favor especifica tu género');
            return;
        }

        if (parseInt(edad) < 18 || parseInt(edad) > 100) {
            showAlert('La edad debe estar entre 18 y 100 años');
            return;
        }

        showLoading();

        try {
            const response = await fetch(`${API_URL}/auth/registro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    cedula, 
                    nombre, 
                    correo, 
                    telefono, 
                    genero,
                    otroGenero: genero === 'Otro' ? otroGenero : '',
                    edad: parseInt(edad),
                    profesion,
                    cargo,
                    contraseña 
                })
            });

            const data = await response.json();

            if (data.success) {
                saveToStorage('token', data.token);
                saveToStorage('usuario', data.usuario);
                
                showAlert('¡Registro exitoso! Bienvenido.', 'success');
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