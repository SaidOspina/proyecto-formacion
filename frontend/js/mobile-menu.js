// ===== MENÚ HAMBURGUESA =====

// Función para inicializar el menú hamburguesa
function initMobileMenu() {
    // Crear botón hamburguesa si no existe
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Verificar si ya existe el botón
    let menuToggle = document.querySelector('.menu-toggle');
    
    if (!menuToggle) {
        // Crear el botón hamburguesa
        menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.setAttribute('aria-label', 'Toggle menu');
        menuToggle.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        
        // Buscar el contenedor derecho del navbar o crearlo
        let navbarRight = navbar.querySelector('.navbar-menu');
        
        // Si estamos en admin, insertar antes del contenido derecho
        const isAdmin = document.querySelector('.admin-container');
        
        if (isAdmin) {
            // En admin, insertar el botón al final del navbar
            navbar.appendChild(menuToggle);
        } else if (navbarRight) {
            // En otras páginas, insertar antes del menú
            navbarRight.parentNode.insertBefore(menuToggle, navbarRight);
        } else {
            // Fallback: agregar al final del navbar
            navbar.appendChild(menuToggle);
        }
    }

    // Crear overlay si no existe
    let menuOverlay = document.querySelector('.menu-overlay');
    if (!menuOverlay) {
        menuOverlay = document.createElement('div');
        menuOverlay.className = 'menu-overlay';
        document.body.appendChild(menuOverlay);
    }

    const navbarMenu = document.querySelector('.navbar-menu');
    const adminSidebar = document.querySelector('.admin-sidebar');

    // Toggle menú navbar
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (navbarMenu) {
            navbarMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
            menuOverlay.classList.toggle('active');
            document.body.style.overflow = navbarMenu.classList.contains('active') ? 'hidden' : '';
        }

        if (adminSidebar) {
            adminSidebar.classList.toggle('active');
            menuToggle.classList.toggle('active');
            menuOverlay.classList.toggle('active');
            document.body.style.overflow = adminSidebar.classList.contains('active') ? 'hidden' : '';
        }
    });

    // Cerrar menú al hacer clic en overlay
    menuOverlay.addEventListener('click', function() {
        closeMenu();
    });

    // Cerrar menú al hacer clic en un enlace
    if (navbarMenu) {
        const menuLinks = navbarMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    closeMenu();
                }
            });
        });
    }

    if (adminSidebar) {
        const sidebarLinks = adminSidebar.querySelectorAll('a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 992) {
                    closeMenu();
                }
            });
        });
    }

    // Cerrar menú con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });

    // Función para cerrar el menú
    function closeMenu() {
        if (navbarMenu) navbarMenu.classList.remove('active');
        if (adminSidebar) adminSidebar.classList.remove('active');
        menuToggle.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Cerrar menú al cambiar tamaño de ventana
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 768 && navbarMenu) {
                closeMenu();
            }
            if (window.innerWidth > 992 && adminSidebar) {
                closeMenu();
            }
        }, 250);
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
} else {
    initMobileMenu();
}

// Exportar para uso global
window.initMobileMenu = initMobileMenu;

// ===== PREVENIR ZOOM EN INPUTS EN IOS =====
if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
            }
        });
        input.addEventListener('blur', function() {
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1');
            }
        });
    });
}

// ===== AJUSTAR ALTURA DE VIEWPORT EN MÓVILES =====
function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setVH();
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', setVH);