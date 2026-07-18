# Despliegue de LifeOS

## Estado actual

- El proyecto ya tiene `npm run build` verificado en local: compila sin errores (`vite build`, ~490ms, sin warnings).
- `vercel.json` incluye el rewrite SPA necesario para que rutas internas como `/app/inicio` o `/login` funcionen al recargar o al entrar por URL directa.
- El vídeo de fondo (`public/video/landing-background.mp4`, 3.5 MB) y el icono (`public/icons/icon.svg`) se copian tal cual a `dist/` en el build — confirmado localmente.
- Hay un proyecto de prueba (`lifeos`) creado en Vercel a modo de ensayo que no llegó a un estado funcional; puede borrarse o reutilizarse desde el panel de Vercel.
- La vía recomendada y estándar es conectar el repositorio Git (ver abajo), que es más fiable que subir archivos sueltos uno a uno.

## Opción recomendada: desplegar desde Git

1. **Inicializar Git y subir a GitHub** (el proyecto ya tiene `git init` hecho localmente, con `.gitignore` cubriendo `node_modules`, `dist`, `.env`):
   ```bash
   cd /Users/maximoduperez/Documents/Proyectos/lifeos
   git add -A
   git commit -m "Initial commit: LifeOS app"
   # crear un repo en GitHub (con gh CLI o desde la web) y luego:
   git remote add origin https://github.com/<tu-usuario>/lifeos.git
   git branch -M main
   git push -u origin main
   ```

2. **Importar el proyecto en Vercel:**
   - Ve a https://vercel.com/new
   - Selecciona el repositorio `lifeos` de GitHub
   - Framework preset: Vercel detectará **Vite** automáticamente
   - Build command: `npm run build` (o `vite build`)
   - Output directory: `dist`
   - Install command: `npm install`
   - No hace falta ninguna variable de entorno para que la app arranque (ver `.env.example`)
   - Pulsa **Deploy**

3. **Verificar el despliegue:**
   - Abre la URL `*.vercel.app` que Vercel genera
   - Comprueba: landing con vídeo, `/login`, `/register`, recarga de una ruta interna como `/app/inicio` (no debe dar 404 gracias a `vercel.json`), y que no haya errores en la consola del navegador

## Dominio personalizado: `lifeos.maximoduperez.com`

1. En el proyecto de Vercel: **Settings → Domains → Add** → introduce `lifeos.maximoduperez.com`
2. Vercel mostrará el registro DNS exacto que debes crear. **No uses los valores de ejemplo de abajo como definitivos** — copia literalmente lo que te indique el panel de Vercel en ese momento, ya que puede variar.

Tabla de referencia (formato esperado, valores reales solo desde el panel de Vercel):

| Tipo  | Nombre / Host | Valor / Destino                  | TTL  |
|-------|---------------|-----------------------------------|------|
| CNAME | `lifeos`      | *(el que indique Vercel, normalmente `cname.vercel-dns.com`)* | Auto o 3600 |

3. **En Hostinger** (panel de DNS del dominio `maximoduperez.com`):
   - Ve a Dominios → `maximoduperez.com` → DNS / Nameservers
   - Antes de crear el registro nuevo, **revisa y elimina cualquier registro A o CNAME conflictivo ya existente para el host `lifeos`**
   - Añade el registro CNAME (host `lifeos`, destino = el valor exacto de Vercel) con el TTL que Hostinger te permita (por defecto suele ser correcto)
4. **Verificación:**
   - Vuelve a Vercel → Domains: el estado pasará de "Pending" a "Valid" cuando el DNS propague (puede tardar de minutos a un par de horas)
   - Vercel emite el certificado SSL automáticamente una vez el dominio está verificado
   - Abre `https://lifeos.maximoduperez.com` y confirma que carga por HTTPS, sin bucles de redirección, y que muestra la misma versión que la URL `*.vercel.app`

## Variables de entorno

Ver [.env.example](.env.example). Esta versión no necesita ninguna variable para funcionar — la autenticación y los datos viven en el almacenamiento local del navegador (ver nota de seguridad en `src/auth.js`). El archivo queda preparado para cuando se conecte un backend real de autenticación o datos.

## Notas importantes antes de ir a producción real

- **Autenticación**: `src/auth.js` implementa registro/login con contraseñas hasheadas (SHA-256 + sal) en `localStorage`. Es funcional para una demo, pero **no es un sistema de autenticación seguro para producción** — no hay verificación de identidad real ni protección contra manipulación del navegador. Sustituir por un proveedor real (Supabase Auth, Auth0, etc.) antes de manejar datos sensibles de usuarios reales.
- **Recuperación de contraseña**: `requestPasswordReset` es simulado (no hay backend de email). Conectar un servicio de email transaccional antes de producción.
- **Páginas legales** (`/privacy`, `/terms`): contienen marcadores `[Completar con...]` donde falta la identidad legal real del responsable del servicio. Completar antes de publicar.
