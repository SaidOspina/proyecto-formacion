// ===== EXPORTACIÓN A PDF DE ESTADÍSTICAS =====

// Función principal para exportar estadísticas a PDF
async function exportarEstadisticasPDF() {
    ui.showLoading();
    
    try {
        // Obtener estadísticas actuales
        const data = await api.get('/usuarios/estadisticas/demograficas');
        
        if (!data.success) {
            throw new Error('No se pudieron obtener las estadísticas');
        }
        
        const estadisticas = data.estadisticas;
        
        // Cargar jsPDF y autoTable desde CDN si no están disponibles
        if (typeof jspdf === 'undefined') {
            await cargarLibreriasPDF();
        }
        
        // Crear el PDF
        await generarPDFEstadisticas(estadisticas);
        
    } catch (error) {
        console.error('Error al exportar PDF:', error);
        ui.showAlert('Error al generar el PDF', 'error');
    } finally {
        ui.hideLoading();
    }
}

// Cargar librerías necesarias
async function cargarLibreriasPDF() {
    return new Promise((resolve, reject) => {
        // Cargar jsPDF
        const scriptJsPDF = document.createElement('script');
        scriptJsPDF.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        scriptJsPDF.onload = () => {
            // Cargar autoTable
            const scriptAutoTable = document.createElement('script');
            scriptAutoTable.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js';
            scriptAutoTable.onload = resolve;
            scriptAutoTable.onerror = reject;
            document.head.appendChild(scriptAutoTable);
        };
        scriptJsPDF.onerror = reject;
        document.head.appendChild(scriptJsPDF);
    });
}

// Generar el PDF con las estadísticas
async function generarPDFEstadisticas(estadisticas) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPosition = margin;
    
    // ===== ENCABEZADO CON LOGOS =====
    try {
        // Cargar logos como base64
        const logoUT = await cargarImagenBase64('../img/logoFondo.png');
        const logoUARIV = await cargarImagenBase64('../img/logoUnidadVictimas.jpeg');
        
        // Logo izquierdo (UT Funde Caminos)
        doc.addImage(logoUT, 'PNG', margin, yPosition, 30, 30);
        
        // Logo derecho (Unidad para las Víctimas)
        doc.addImage(logoUARIV, 'JPEG', pageWidth - margin - 30, yPosition, 30, 30);
        
        yPosition += 35;
    } catch (error) {
        console.error('Error al cargar logos:', error);
        yPosition += 10;
    }
    
    // ===== TÍTULO PRINCIPAL =====
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 58, 42); // Color verde oscuro
    doc.text('ESTADÍSTICAS DEMOGRÁFICAS', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Plataforma Ven a Formarte - UARIV', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    
    // ===== FECHA Y CONVENIO =====
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const fechaActual = new Date().toLocaleDateString('es-CO', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    doc.text(`Fecha de generación: ${fechaActual}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 90, 69);
    doc.text('CONVENIO DE ASOCIACIÓN N° 2354-2025', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 12;
    
    // Línea separadora
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    // ===== RESUMEN GENERAL =====
    const totalUsuarios = calcularTotalUsuarios(estadisticas);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 90, 69);
    doc.text('RESUMEN GENERAL', margin, yPosition);
    
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Total de usuarios registrados: ${totalUsuarios}`, margin + 5, yPosition);
    
    yPosition += 10;
    
    // ===== TABLA 1: DISTRIBUCIÓN POR GÉNERO =====
    yPosition = agregarSeccionTabla(
        doc, 
        'DISTRIBUCIÓN POR GÉNERO', 
        ['Género', 'Total', 'Porcentaje'],
        prepararDatosGenero(estadisticas.porGenero),
        yPosition,
        pageWidth,
        margin
    );
    
    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
    }
    
    // ===== TABLA 2: DISTRIBUCIÓN POR EDAD =====
    yPosition = agregarSeccionTabla(
        doc, 
        'DISTRIBUCIÓN POR RANGO DE EDAD', 
        ['Rango de Edad', 'Total', 'Porcentaje'],
        prepararDatosEdad(estadisticas.porEdad),
        yPosition,
        pageWidth,
        margin
    );
    
    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
    }
    
    // ===== TABLA 3: TOP 10 PROFESIONES =====
    yPosition = agregarSeccionTabla(
        doc, 
        'TOP 10 PROFESIONES', 
        ['Profesión', 'Total', 'Porcentaje'],
        prepararDatosProfesion(estadisticas.porProfesion),
        yPosition,
        pageWidth,
        margin
    );
    
    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = margin;
    }
    
    // ===== TABLA 4: TOP 10 CARGOS =====
    yPosition = agregarSeccionTabla(
        doc, 
        'TOP 10 CARGOS', 
        ['Cargo', 'Total', 'Porcentaje'],
        prepararDatosCargo(estadisticas.porCargo),
        yPosition,
        pageWidth,
        margin
    );
    
    // ===== PIE DE PÁGINA =====
    const totalPaginas = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        
        // Línea superior del pie
        doc.setDrawColor(180, 180, 180);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        // Texto del pie
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        
        doc.text(
            'Unidad para las Víctimas - Plataforma Ven a Formarte', 
            pageWidth / 2, 
            pageHeight - 10, 
            { align: 'center' }
        );
        
        doc.text(
            `Página ${i} de ${totalPaginas}`, 
            pageWidth - margin, 
            pageHeight - 10, 
            { align: 'right' }
        );
    }
    
    // ===== GUARDAR PDF =====
    const nombreArchivo = `Estadisticas_Demograficas_UARIV_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
    
    ui.showAlert('PDF generado exitosamente', 'success');
}

// Agregar sección con tabla
function agregarSeccionTabla(doc, titulo, columnas, datos, yPosition, pageWidth, margin) {
    // Título de sección
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 90, 69);
    doc.text(titulo, margin, yPosition);
    
    yPosition += 5;
    
    // Generar tabla
    doc.autoTable({
        startY: yPosition,
        head: [columnas],
        body: datos,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [60, 60, 60],
        },
        headStyles: {
            fillColor: [45, 90, 69],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { left: margin, right: margin },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'center', cellWidth: 30 },
            2: { halign: 'center', cellWidth: 30 }
        }
    });
    
    return doc.lastAutoTable.finalY + 10;
}

// ===== PREPARAR DATOS =====

function calcularTotalUsuarios(estadisticas) {
    if (estadisticas.porGenero && estadisticas.porGenero.length > 0) {
        return estadisticas.porGenero.reduce((sum, item) => sum + item.total, 0);
    }
    return 0;
}

function prepararDatosGenero(datos) {
    if (!datos || datos.length === 0) {
        return [['No hay datos disponibles', '-', '-']];
    }
    
    const total = datos.reduce((sum, item) => sum + item.total, 0);
    
    return datos.map(item => {
        const porcentaje = ((item.total / total) * 100).toFixed(1);
        let generoDisplay = item._id;
        
        // Si es "Otro", agregar los valores específicos
        if (item._id === 'Otro' && item.otrosGeneros && item.otrosGeneros.length > 0) {
            const otrosUnicos = [...new Set(item.otrosGeneros.filter(g => g))];
            if (otrosUnicos.length > 0) {
                generoDisplay += ` (${otrosUnicos.join(', ')})`;
            }
        }
        
        return [generoDisplay, item.total.toString(), `${porcentaje}%`];
    });
}

function prepararDatosEdad(datos) {
    if (!datos || datos.length === 0) {
        return [['No hay datos disponibles', '-', '-']];
    }
    
    const total = datos.reduce((sum, item) => sum + item.total, 0);
    
    // Ordenar por rangos
    const rangosOrden = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const datosOrdenados = rangosOrden
        .map(rango => datos.find(d => d._id === rango))
        .filter(d => d);
    
    return datosOrdenados.map(item => {
        const porcentaje = ((item.total / total) * 100).toFixed(1);
        return [`${item._id} años`, item.total.toString(), `${porcentaje}%`];
    });
}

function prepararDatosProfesion(datos) {
    if (!datos || datos.length === 0) {
        return [['No hay datos disponibles', '-', '-']];
    }
    
    const total = datos.reduce((sum, item) => sum + item.total, 0);
    
    return datos.map(item => {
        const porcentaje = ((item.total / total) * 100).toFixed(1);
        return [item._id, item.total.toString(), `${porcentaje}%`];
    });
}

function prepararDatosCargo(datos) {
    if (!datos || datos.length === 0) {
        return [['No hay datos disponibles', '-', '-']];
    }
    
    const total = datos.reduce((sum, item) => sum + item.total, 0);
    
    return datos.map(item => {
        const porcentaje = ((item.total / total) * 100).toFixed(1);
        return [item._id, item.total.toString(), `${porcentaje}%`];
    });
}

// ===== UTILIDAD PARA CARGAR IMÁGENES =====
function cargarImagenBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            try {
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            } catch (e) {
                console.error('Error al convertir imagen:', e);
                reject(e);
            }
        };
        
        img.onerror = reject;
        img.src = url;
    });
}

// Exportar función principal
window.exportarEstadisticasPDF = exportarEstadisticasPDF;