# Guía para Construir un Backend con Node.js y Express para RDT360-Safety

Esta guía te proporcionará los pasos y el código de ejemplo para crear un servidor backend que pueda interactuar con tu aplicación RDT360-Safety, utilizando una base de datos MariaDB.

## 1. Requisitos Previos

-   Node.js y npm (o yarn) instalados en tu máquina.
-   Una base de datos MariaDB (o MySQL) en funcionamiento. Puedes usar una instancia local o un servicio en la nube.
-   El esquema SQL de la página de Ayuda de la aplicación para crear las tablas necesarias.

## 2. Configuración del Proyecto Backend

1.  **Crear un nuevo directorio** para tu backend fuera de la carpeta de tu proyecto Next.js.
    ```bash
    mkdir rdt360-backend
    cd rdt360-backend
    ```

2.  **Inicializar un nuevo proyecto de Node.js.**
    ```bash
    npm init -y
    ```

3.  **Instalar las dependencias necesarias:**
    -   `express`: El framework para construir el servidor.
    -   `mysql2`: El driver para conectar con MariaDB.
    -   `cors`: Para permitir peticiones desde tu frontend (la app Next.js).
    -   `dotenv`: Para manejar variables de entorno (credenciales de la base de datos).

    ```bash
    npm install express mysql2 cors dotenv
    ```

## 3. Estructura de Archivos Recomendada

Organizar tu proyecto te ayudará a mantenerlo escalable. Aquí tienes una estructura sugerida:

```
rdt360-backend/
├── config/
│   └── db.js         # Lógica de conexión a la base de datos
├── routes/
│   └── incidents.js  # Rutas para el endpoint /api/incidents
├── controllers/
│   └── incidentController.js # Lógica para manejar las peticiones de incidentes
├── .env              # Archivo para variables de entorno (¡NO subir a Git!)
├── .gitignore
└── server.js         # El punto de entrada principal de tu aplicación
```

## 4. Código de Ejemplo

### a. Archivo `.env` (Variables de Entorno)

Crea este archivo en la raíz de tu proyecto backend. Reemplaza los valores con tus credenciales de MariaDB.

```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_DATABASE=rdt360_safety_db
PORT=3001
```

### b. Conexión a la Base de Datos (`config/db.js`)

Este archivo manejará el pool de conexiones a tu base de datos.

```javascript
// config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

### c. Controlador de Incidentes (`controllers/incidentController.js`)

Aquí va la lógica para interactuar con la base de datos para los incidentes.

```javascript
// controllers/incidentController.js
const pool = require('../config/db');

// Obtener todos los incidentes
exports.getAllIncidents = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM incidents ORDER BY date DESC');
    // MariaDB no tiene un tipo JSON nativo como PostgreSQL. Si usas TEXT para almacenar JSON,
    // necesitarás parsearlo antes de enviarlo.
    const incidents = rows.map(incident => ({
        ...incident,
        comments: typeof incident.comments === 'string' ? JSON.parse(incident.comments) : incident.comments,
        linked_docs: typeof incident.linked_docs === 'string' ? JSON.parse(incident.linked_docs) : incident.linked_docs,
    }));
    res.json(incidents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al obtener los incidentes.' });
  }
};

// Crear un nuevo incidente (ejemplo simplificado)
exports.createIncident = async (req, res) => {
    try {
        const { display_id, date, area, type, description, severity, reported_by } = req.body;
        
        // Aquí iría la validación de los datos...

        const query = 'INSERT INTO incidents (display_id, date, area, type, description, severity, reported_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
        const values = [display_id, date, area, type, description, severity, reported_by, 'Open'];

        const [result] = await pool.query(query, values);
        
        res.status(201).json({ incident_id: result.insertId, ...req.body });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el incidente.' });
    }
}

// Aquí añadirías más funciones: getIncidentById, updateIncident, deleteIncident...
```

### d. Definición de Rutas (`routes/incidents.js`)

Este archivo define los endpoints específicos para `/api/incidents`.

```javascript
// routes/incidents.js
const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');

// GET /api/incidents
router.get('/', incidentController.getAllIncidents);

// POST /api/incidents
router.post('/', incidentController.createIncident);

// Aquí añadirías más rutas: /:id, etc.

module.exports = router;
```

### e. Servidor Principal (`server.js`)

Este es el archivo principal que une todo.

```javascript
// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors()); // Permite peticiones desde tu frontend
app.use(express.json()); // Para parsear el body de las peticiones como JSON

// Rutas de la API
const incidentRoutes = require('./routes/incidents');
app.use('/api/incidents', incidentRoutes);

// ... aquí usarías las otras rutas (observations, users, etc.) ...
// const observationRoutes = require('./routes/observations');
// app.use('/api/observations', observationRoutes);


// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('API del Backend de RDT360-Safety está en funcionamiento.');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
```

## 5. Puesta en Marcha

1.  **Ejecuta el servidor backend:**
    ```bash
    node server.js
    ```
    Si todo está configurado correctamente, deberías ver "Servidor escuchando en el puerto 3001" en tu consola.

2.  **Actualiza el servicio frontend:**
    Para que tu aplicación Next.js se comunique con este backend, necesitarás modificar el archivo `src/services/mariadb-service.ts` para que realice peticiones `fetch` reales a tu servidor local en lugar de retornar datos mock.
