const express = require('express');
const path = require('path');
const app = express();
const port = 3002;

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para manejar el cuerpo de las solicitudes
app.listen(port, '0.0.0.0', () => { // Escuchar en todas las interfaces de red
    console.log(`Servidor escuchando en http://localhost:${port}`);
    console.log(`Accesible desde cualquier dispositivo en la red local`);
    });