// ===== CONFIGURACIÓN GLOBAL =====
const API_URL = '/api';

// ===== UTILIDADES DE ALMACENAMIENTO =====
const storage = {
    save: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    get: (key) => JSON.parse(localStorage.getItem(key)),
    remove: (key) => localStorage.removeItem(key),
    clear: () => localStorage.clear()
};

// ===== AUTENTICACIÓN =====
const auth = {
    getToken: () => storage.get('token'),
    getUsuario: () => storage.get('usuario'),
    getSesionId: () => storage.get('sesionId'),
    
    isAuthenticated: () => !!storage.get('token'),
    
    isAdmin: () => {
        const usuario = storage.get('usuario');
        return usuario && usuario.tipoUsuario === 'Administrador';
    },
    
    logout: async () => {
        const token = storage.get('token');
        const sesionId = storage.get('sesionId');
        
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sesionId })
            });
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
        
        storage.clear();
        window.location.href = '../index.html';
    },
    
    checkAuth: () => {
        if (!auth.isAuthenticated()) {
            window.location.href = '../index.html';
            return false;
        }
        return true;
    },
    
    checkAdmin: () => {
        if (!auth.isAuthenticated() || !auth.isAdmin()) {
            window.location.href = '../index.html';
            return false;
        }
        return true;
    }
};

// ===== API HELPER =====
const api = {
    fetch: async (endpoint, options = {}) => {
        const token = auth.getToken();
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        });
        
        const data = await response.json();
        
        if (response.status === 401) {
            storage.clear();
            window.location.href = '../index.html';
            throw new Error('Sesión expirada');
        }
        
        return data;
    },
    
    get: (endpoint) => api.fetch(endpoint),
    
    post: (endpoint, body) => api.fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
    }),
    
    put: (endpoint, body) => api.fetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body)
    }),
    
    patch: (endpoint, body) => api.fetch(endpoint, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined
    }),
    
    delete: (endpoint) => api.fetch(endpoint, { method: 'DELETE' })
};

// ===== UI HELPERS =====
const ui = {
    showLoading: () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('hidden');
    },
    
    hideLoading: () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('hidden');
    },
    
    showAlert: (message, type = 'error', containerId = 'alertContainer') => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            setTimeout(() => container.innerHTML = '', 5000);
        }
    },
    
    showModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('show');
    },
    
    hideModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('show');
    },
    
    updateNavbar: () => {
        const usuario = auth.getUsuario();
        const userNameEl = document.getElementById('userName');
        if (userNameEl && usuario) {
            userNameEl.textContent = usuario.nombre;
        }
    }
};

// ===== PROGRESO =====
const progreso = {
    get: async () => {
        try {
            const data = await api.get('/progreso');
            return data.success ? data : null;
        } catch (error) {
            console.error('Error al obtener progreso:', error);
            return null;
        }
    },
    
    actualizar: async (tematica, puntuacion) => {
        try {
            const data = await api.put(`/progreso/tematica/${tematica}`, { puntuacion });
            return data;
        } catch (error) {
            console.error('Error al actualizar progreso:', error);
            return null;
        }
    },
    
    getCertificado: async () => {
        try {
            const data = await api.get('/progreso/certificado');
            return data.success ? data.certificado : null;
        } catch (error) {
            console.error('Error al obtener certificado:', error);
            return null;
        }
    }
};

// ===== EVALUACIÓN =====
const evaluacion = {
    getPreguntas: async (tematica) => {
        try {
            const data = await api.get(`/preguntas/tematica/${tematica}`);
            return data.success ? data.preguntas : [];
        } catch (error) {
            console.error('Error al obtener preguntas:', error);
            return [];
        }
    },
    
    verificar: async (respuestas) => {
        try {
            const data = await api.post('/preguntas/verificar', { respuestas });
            return data;
        } catch (error) {
            console.error('Error al verificar respuestas:', error);
            return null;
        }
    }
};

// ===== FORMAT HELPERS =====
const format = {
    fecha: (fecha) => {
        return new Date(fecha).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    tiempo: (segundos) => {
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = segundos % 60;
        
        if (horas > 0) {
            return `${horas}h ${minutos}m`;
        } else if (minutos > 0) {
            return `${minutos}m ${segs}s`;
        }
        return `${segs}s`;
    }
};

// ===== INICIALIZACIÓN COMÚN =====
document.addEventListener('DOMContentLoaded', () => {
    // Actualizar navbar si existe
    ui.updateNavbar();
    
    // Configurar botón de logout si existe
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.logout();
        });
    }
    
    // Cerrar modales al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Cerrar modales con botón X
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('show');
        });
    });
});
