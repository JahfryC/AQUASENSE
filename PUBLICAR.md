# AquaSense — Guía de publicación permanente y gratuita

## 1. Publicar la página (para siempre, gratis)

### Opción recomendada: GitHub Pages — no expira nunca
1. Crea una cuenta en **github.com** (gratis).
2. Botón **New repository** → nombre `aquasense` → **Public** → Create.
3. Clic en **"uploading an existing file"** y sube TODOS los archivos de la
   carpeta del proyecto (los de este zip: `index.html`, los `.jsx`, los `.js`,
   `icon-180.png`). Commit.
4. **Settings → Pages → Source: Deploy from a branch → main → Save.**
5. En ~1 minuto tu app queda en `https://TU-USUARIO.github.io/aquasense`
   — esa URL **no caduca jamás** mientras exista tu cuenta. Sin límite
   práctico de visitas (100 GB/mes de tráfico, miles de visitas diarias).

### Alternativa: Netlify — igual de buena, CON cuenta
- https://app.netlify.com/drop → **inicia sesión primero** (con Google) y
  luego arrastra la carpeta o el zip.
- ⚠️ Importante: si arrastras SIN cuenta, el sitio es temporal y se borra.
  Con cuenta es permanente (100 GB/mes gratis).

## 2. Que TUS DATOS no se borren nunca

La app guarda todo (lecturas, fotos, rutinas, alertas) en dos niveles:

| Nivel | Dónde | Sobrevive a… | Se pierde si… |
|---|---|---|---|
| Local (ya activo) | El navegador de cada dispositivo | Cerrar la app, recargar, reiniciar el teléfono | Borras los datos del navegador |
| Nube (actívalo tú) | Firestore con tu cuenta Google | TODO — cambiar de teléfono, borrar el navegador | Nunca (mientras exista tu Google) |

### Activar la nube (gratis, ~5 minutos)
1. https://console.firebase.google.com → **Agregar proyecto** → nombre
   `aquasense` → desactiva Analytics → Crear.
2. **Compilación → Authentication → Comenzar → Google → Habilitar → Guardar.**
3. **Compilación → Firestore Database → Crear base de datos** (modo
   producción). En la pestaña **Reglas** pega y publica:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
4. ⚙ **Configuración del proyecto → Tus apps → icono Web `</>`** → registra
   la app → copia el objeto `firebaseConfig`.
5. Abre el archivo **`cloud.js`** y reemplaza `const FIREBASE_CONFIG = null;`
   por tu configuración:
   ```js
   const FIREBASE_CONFIG = {
     apiKey: "AIza…",
     authDomain: "aquasense-xxx.firebaseapp.com",
     projectId: "aquasense-xxx",
     storageBucket: "aquasense-xxx.appspot.com",
     messagingSenderId: "…",
     appId: "…",
   };
   ```
   (Si publicaste el archivo único `index.html` en vez de la carpeta, busca
   `FIREBASE_CONFIG` dentro de ese archivo y edítalo ahí.)
6. **Authentication → Settings → Dominios autorizados** → añade tu dominio
   (`tu-usuario.github.io` o `tu-sitio.netlify.app`).
7. Vuelve a subir el archivo editado a GitHub/Netlify. Desde entonces el
   botón **"Continuar con Google"** abre el login real, y tus datos se
   sincronizan en la nube entre todos tus dispositivos.

El plan gratuito de Firebase (Spark) incluye 1 GiB de base de datos y
50.000 lecturas/día — para un acuario es ilimitado en la práctica. No pide
tarjeta.

## 3. En el iPhone
Abre tu URL en Safari → botón compartir → **"Añadir a pantalla de inicio"**.
Queda instalada como app con su icono.

## 4. Respaldo del código
Guarda este zip en tu Google Drive o computadora: es el código fuente
completo. Con él puedes volver a publicar la app en cualquier momento y en
cualquier servicio.
