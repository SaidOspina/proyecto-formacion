// ===== LISTAS DE OPCIONES =====

// Lista completa de géneros
const GENEROS_LISTA = [
    'Masculino',
    'Femenino',
    'No binario',
    'Género fluido',
    'Agénero',
    'Bigénero',
    'Pangénero',
    'Demigénero',
    'Transgénero',
    'Género queer',
    'Prefiero no decirlo',
    'Otro'
];

// Lista de profesiones comunes en Colombia
const PROFESIONES_LISTA = [
    'Abogado/a',
    'Administrador/a de Empresas',
    'Arquitecto/a',
    'Contador/a',
    'Comunicador/a Social',
    'Economista',
    'Educador/a',
    'Enfermero/a',
    'Ingeniero/a Civil',
    'Ingeniero/a de Sistemas',
    'Ingeniero/a Industrial',
    'Ingeniero/a Electrónico/a',
    'Licenciado/a en Educación',
    'Médico/a',
    'Psicólogo/a',
    'Sociólogo/a',
    'Trabajador/a Social',
    'Tecnólogo/a',
    'Técnico/a',
    'Bachiller',
    'Estudiante',
    'Sin profesión',
    'Otra'
].sort();

// Lista de cargos comunes
const CARGOS_LISTA = [
    'Director/a',
    'Gerente',
    'Coordinador/a',
    'Supervisor/a',
    'Jefe de Área',
    'Líder de Proyecto',
    'Analista',
    'Especialista',
    'Consultor/a',
    'Asesor/a',
    'Asistente',
    'Auxiliar',
    'Técnico/a',
    'Operario/a',
    'Profesional',
    'Practicante',
    'Voluntario/a',
    'Funcionario/a Público',
    'Docente',
    'Investigador/a',
    'Otro'
].sort();

// ===== FUNCIÓN PARA INICIALIZAR SELECTORES =====
function initFormSelectors() {
    // Inicializar en página de registro
    initRegistroSelectors();
    
    // Inicializar en modal de admin
    initAdminModalSelectors();
}

// ===== SELECTORES EN PÁGINA DE REGISTRO =====
function initRegistroSelectors() {
    const regGenero = document.getElementById('regGenero');
    const regProfesion = document.getElementById('regProfesion');
    const regCargo = document.getElementById('regCargo');
    
    if (regGenero) {
        // Convertir género en select completo
        const otroGeneroContainer = document.getElementById('otroGeneroContainer');
        const otroGeneroInput = document.getElementById('regOtroGenero');
        
        // Limpiar opciones existentes y agregar todas
        regGenero.innerHTML = '<option value="">Selecciona tu género</option>';
        GENEROS_LISTA.forEach(genero => {
            const option = document.createElement('option');
            option.value = genero;
            option.textContent = genero;
            regGenero.appendChild(option);
        });
        
        // Manejar cambio de género
        regGenero.addEventListener('change', function() {
            if (this.value === 'Otro') {
                otroGeneroContainer.classList.remove('hidden');
                otroGeneroInput.required = true;
            } else {
                otroGeneroContainer.classList.add('hidden');
                otroGeneroInput.required = false;
                otroGeneroInput.value = '';
            }
        });
    }
    
    if (regProfesion) {
        // Convertir profesión en select si es input
        const isInput = regProfesion.tagName === 'INPUT';
        
        if (isInput) {
            const newSelect = createSelectFromInput(regProfesion, PROFESIONES_LISTA, 'Selecciona tu profesión');
            regProfesion.parentNode.replaceChild(newSelect, regProfesion);
            
            // Agregar input para "Otra"
            addOtherOptionInput(newSelect, 'Profesión', 'regOtraProfesion');
        } else {
            // Ya es select, solo agregar opciones
            populateSelect(regProfesion, PROFESIONES_LISTA, 'Selecciona tu profesión');
            addOtherOptionInput(regProfesion, 'Profesión', 'regOtraProfesion');
        }
    }
    
    if (regCargo) {
        // Convertir cargo en select si es input
        const isInput = regCargo.tagName === 'INPUT';
        
        if (isInput) {
            const newSelect = createSelectFromInput(regCargo, CARGOS_LISTA, 'Selecciona tu cargo');
            regCargo.parentNode.replaceChild(newSelect, regCargo);
            
            // Agregar input para "Otro"
            addOtherOptionInput(newSelect, 'Cargo', 'regOtroCargo');
        } else {
            // Ya es select, solo agregar opciones
            populateSelect(regCargo, CARGOS_LISTA, 'Selecciona tu cargo');
            addOtherOptionInput(regCargo, 'Cargo', 'regOtroCargo');
        }
    }
}

// ===== SELECTORES EN MODAL DE ADMIN =====
function initAdminModalSelectors() {
    const usuarioGenero = document.getElementById('usuarioGenero');
    const usuarioProfesion = document.getElementById('usuarioProfesion');
    const usuarioCargo = document.getElementById('usuarioCargo');
    
    if (usuarioGenero) {
        // Ya es select, agregar todas las opciones
        const currentOptions = Array.from(usuarioGenero.options).map(opt => opt.value);
        if (!currentOptions.includes('No binario')) {
            usuarioGenero.innerHTML = '<option value="">Seleccionar</option>';
            GENEROS_LISTA.forEach(genero => {
                const option = document.createElement('option');
                option.value = genero;
                option.textContent = genero;
                usuarioGenero.appendChild(option);
            });
        }
        
        // Manejar "Otro"
        const otroGeneroContainer = document.getElementById('campoOtroGenero');
        const otroGeneroInput = document.getElementById('usuarioOtroGenero');
        
        if (otroGeneroContainer) {
            usuarioGenero.addEventListener('change', function() {
                if (this.value === 'Otro') {
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
    
    if (usuarioProfesion) {
        // Convertir a select si es input
        const isInput = usuarioProfesion.tagName === 'INPUT';
        
        if (isInput) {
            const newSelect = createSelectFromInput(usuarioProfesion, PROFESIONES_LISTA, 'Seleccionar profesión');
            usuarioProfesion.parentNode.replaceChild(newSelect, usuarioProfesion);
            addOtherOptionInput(newSelect, 'Profesión', 'usuarioOtraProfesion');
        } else {
            populateSelect(usuarioProfesion, PROFESIONES_LISTA, 'Seleccionar profesión');
            addOtherOptionInput(usuarioProfesion, 'Profesión', 'usuarioOtraProfesion');
        }
    }
    
    if (usuarioCargo) {
        // Convertir a select si es input
        const isInput = usuarioCargo.tagName === 'INPUT';
        
        if (isInput) {
            const newSelect = createSelectFromInput(usuarioCargo, CARGOS_LISTA, 'Seleccionar cargo');
            usuarioCargo.parentNode.replaceChild(newSelect, usuarioCargo);
            addOtherOptionInput(newSelect, 'Cargo', 'usuarioOtroCargo');
        } else {
            populateSelect(usuarioCargo, CARGOS_LISTA, 'Seleccionar cargo');
            addOtherOptionInput(usuarioCargo, 'Cargo', 'usuarioOtroCargo');
        }
    }
}

// ===== FUNCIONES AUXILIARES =====

// Crear un select desde un input
function createSelectFromInput(inputElement, options, placeholder) {
    const select = document.createElement('select');
    select.id = inputElement.id;
    select.className = inputElement.className;
    select.required = inputElement.required;
    
    populateSelect(select, options, placeholder);
    
    return select;
}

// Poblar un select con opciones
function populateSelect(selectElement, options, placeholder) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        selectElement.appendChild(opt);
    });
}

// Agregar input para opción "Otra"
function addOtherOptionInput(selectElement, fieldName, inputId) {
    const formGroup = selectElement.closest('.form-group');
    
    // Crear contenedor para "Otra"
    let otherContainer = document.getElementById(`container${inputId}`);
    
    if (!otherContainer) {
        otherContainer = document.createElement('div');
        otherContainer.id = `container${inputId}`;
        otherContainer.className = 'form-group hidden';
        otherContainer.style.marginTop = '10px';
        
        const label = document.createElement('label');
        label.textContent = `Especifica ${fieldName.toLowerCase()}`;
        label.htmlFor = inputId;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = inputId;
        input.className = 'form-control';
        input.placeholder = `Escribe ${fieldName.toLowerCase()}`;
        
        otherContainer.appendChild(label);
        otherContainer.appendChild(input);
        
        // Insertar después del form-group actual
        formGroup.parentNode.insertBefore(otherContainer, formGroup.nextSibling);
    }
    
    const otherInput = document.getElementById(inputId);
    
    // Manejar cambio en el select
    selectElement.addEventListener('change', function() {
        if (this.value === 'Otra' || this.value === 'Otro') {
            otherContainer.classList.remove('hidden');
            otherInput.required = true;
        } else {
            otherContainer.classList.add('hidden');
            otherInput.required = false;
            otherInput.value = '';
        }
    });
}

// ===== FUNCIÓN PARA OBTENER VALORES =====
function getFormValue(selectId, otherId) {
    const select = document.getElementById(selectId);
    const otherInput = document.getElementById(otherId);
    
    if (!select) return '';
    
    const value = select.value;
    
    if ((value === 'Otra' || value === 'Otro') && otherInput) {
        return otherInput.value.trim();
    }
    
    return value;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initFormSelectors();
    
    // Re-inicializar cuando se abra el modal de admin
    const modalUsuario = document.getElementById('modalUsuario');
    if (modalUsuario) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    if (modalUsuario.classList.contains('show')) {
                        // Pequeño delay para asegurar que el contenido esté renderizado
                        setTimeout(initAdminModalSelectors, 100);
                    }
                }
            });
        });
        
        observer.observe(modalUsuario, { attributes: true });
    }
});

// Exportar funciones para uso global
window.getFormValue = getFormValue;
window.initFormSelectors = initFormSelectors;
window.GENEROS_LISTA = GENEROS_LISTA;
window.PROFESIONES_LISTA = PROFESIONES_LISTA;
window.CARGOS_LISTA = CARGOS_LISTA;