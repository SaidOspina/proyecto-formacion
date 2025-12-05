# 🎓 Ven a Formarte - Plataforma de Capacitación UARIV

Sistema de formación virtual para la Unidad para la Atención y Reparación Integral a las Víctimas (UARIV).

## 📋 Descripción

Plataforma educativa que incluye:
- **3 Temáticas de aprendizaje** con contenido sobre atención psicosocial, rutas humanitarias y principios humanitarios
- **Evaluaciones interactivas** de 5 preguntas por temática
- **Sistema de progreso** que desbloquea temáticas secuencialmente
- **Certificación automática** al completar el curso
- **Panel de administración** completo

## 🗂️ Estructura del Proyecto

```
proyecto-formacion/
├── backend/
│   ├── controllers/        # Lógica de negocio
│   ├── middleware/         # Autenticación JWT
│   ├── models/            # Modelos MongoDB
│   ├── routes/            # Rutas API REST
│   ├── server.js          # Servidor Express
│   ├── seed.js            # Datos iniciales
│   └── package.json
├── frontend/
│   ├── css/               # Estilos (tema pizarra)
│   ├── html/              # Páginas HTML
│   ├── js/                # Scripts JavaScript
│   ├── img/               # Imágenes
│   └── index.html         # Login/Registro
└── README.md
```

## 🚀 Instalación

### 1. Requisitos Previos
- Node.js v18+
- MongoDB Atlas (o local)
- npm o yarn

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Editar .env con tu URI de MongoDB y contraseña:
# MONGODB_URI=mongodb+srv://usuario:CONTRASEÑA@cluster.mongodb.net/venaformarte
# JWT_SECRET=tu_clave_secreta
# PORT=3000

# Poblar base de datos con datos iniciales
node seed.js

# Iniciar servidor
npm start
```

### 3. Acceder a la Aplicación

Abrir en el navegador: `http://localhost:3000`

## 👤 Credenciales Iniciales

### Administrador
- **Email:** admin@uariv.gov.co
- **Contraseña:** Admin123!

### Asesor (registrar nuevo)
- Usar el formulario de registro en la página principal

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/registro` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/recuperar` - Recuperar contraseña
- `GET /api/auth/me` - Usuario actual

### Usuarios (Admin)
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `PATCH /api/usuarios/:id/estado` - Cambiar estado
- `GET /api/usuarios/:id/sesiones` - Ver sesiones

### Preguntas
- `GET /api/preguntas/tematica/:num` - Obtener preguntas
- `POST /api/preguntas/verificar` - Verificar respuestas
- `POST /api/preguntas` - Crear pregunta (Admin)
- `PUT /api/preguntas/:id` - Editar pregunta (Admin)

### Progreso
- `GET /api/progreso` - Ver progreso del usuario
- `PUT /api/progreso/tematica/:num` - Actualizar progreso
- `GET /api/progreso/certificado` - Obtener certificado
- `GET /api/progreso/estadisticas` - Dashboard (Admin)

## 📊 Base de Datos

### Colecciones
- **usuarios** - Datos de usuarios
- **preguntas** - Banco de preguntas
- **sesiones** - Registro de conexiones
- **certificados** - Certificados emitidos

## 🎨 Diseño

El diseño utiliza una estética de **pizarra escolar** con:
- Fondo verde oscuro texturizado
- Tipografía tipo tiza (Caveat, Patrick Hand)
- Colores: amarillo (#f4d35e), naranja (#ee8959), blanco crema
- Banderines decorativos animados
- Bordes de madera en tarjetas

## 🔒 Seguridad

- Autenticación JWT
- Contraseñas hasheadas con bcrypt
- Validación de roles (Admin/Asesor)
- Protección de rutas

## 📱 Responsive

La interfaz se adapta a:
- Desktop (1200px+)
- Tablet (768px - 1200px)
- Móvil (< 768px)

## 📄 Licencia

Proyecto desarrollado para la UARIV - Uso interno.

---

⚠️ **Importante:** Antes de usar en producción:
1. Cambiar JWT_SECRET por una clave segura
2. Configurar correctamente MongoDB
3. Agregar las imágenes del curso (img1.png - img6.png, logo.png)
4. Configurar HTTPS
