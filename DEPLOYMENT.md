# Guía de Despliegue - Cartera Clientes

## 🌐 Acceso desde la Red Local

### Modo Desarrollo
Para que otros dispositivos en tu red local puedan acceder:

1. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

2. Obtén tu dirección IP local:
```bash
ipconfig
```
Busca "Dirección IPv4" (ejemplo: 192.168.1.100)

3. Accede desde otros dispositivos en tu red:
```
http://TU_IP:5173
```
Ejemplo: `http://192.168.1.100:5173`

### Firewall
Si no puedes acceder, asegúrate de permitir el puerto 5173 en el firewall de Windows:
```bash
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173
```

## 📦 Construcción para Producción

### Crear build optimizado
```bash
npm run build
```

Esto generará una carpeta `dist/` con archivos optimizados.

### Vista previa del build
```bash
npm run preview
```
Accesible en: `http://TU_IP:4173`

## ☁️ Opciones de Despliegue en Internet

### 1. Vercel (Recomendado - Gratis)
```bash
npm install -g vercel
vercel
```

### 2. Netlify (Gratis)
1. Crea cuenta en netlify.com
2. Arrastra la carpeta `dist/` a Netlify Drop

### 3. GitHub Pages
1. Instala gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Agrega a package.json:
```json
"homepage": "https://tuusuario.github.io/CarteraClientes",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

3. Despliega:
```bash
npm run deploy
```

### 4. Servidor Propio
Copia el contenido de `dist/` a tu servidor web (Apache, Nginx, IIS).

## 🔒 Notas de Seguridad

- **Desarrollo**: Solo accesible desde tu red local
- **Producción**: Considera HTTPS para datos sensibles
- Revisa las URLs de los servicios si usas APIs externas
