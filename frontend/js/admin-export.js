// ===== FUNCIONES DE EXPORTACIÓN =====

// Abrir modal de exportación
function abrirModalExportar() {
    ui.showModal('modalExportar');
}

// Exportar datos a Excel
async function exportarDatos(event) {
    event.preventDefault();
    
    const ordenarPor = document.getElementById('ordenarPor').value;
    
    ui.showLoading();
    cerrarModal('modalExportar');
    
    try {
        const token = auth.getToken();
        
        const response = await fetch(`/api/usuarios/exportar/demograficas?ordenarPor=${ordenarPor}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al exportar');
        }
        
        // Obtener el blob del archivo
        const blob = await response.blob();
        
        // Crear URL temporal
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = `Estadisticas_Demograficas_UARIV_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        ui.showAlert('Archivo Excel descargado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error al exportar:', error);
        ui.showAlert('Error al exportar los datos');
    } finally {
        ui.hideLoading();
    }
}

// Agregar al objeto window para uso global
window.abrirModalExportar = abrirModalExportar;
window.exportarDatos = exportarDatos;