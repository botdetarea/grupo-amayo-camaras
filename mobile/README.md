# Grupo Amayo Android

Aplicacion React Native CLI para Android. Usa React Native 0.88, VisionCamera para vista previa de la camara y `react-native-keychain` para almacenar de forma segura la sesion JWT y la URL de la API. Expo Go y EAS no forman parte del proceso.

## Requisitos para desarrollo local

- Node.js 22 o posterior y npm.
- Android SDK, JDK 21, Android Platform 36 y NDK 27.1.12297006.
- Un telefono Android con depuracion USB o un emulador.
- Backend Node.js y MySQL activos para probar el login real.

## Ejecutar en Windows

Abre una ventana CMD para iniciar el backend:

```cmd
cd /d "C:\Users\botde\Desktop\Nueva carpeta\backend"
npm run dev
```

En otra ventana CMD:

```cmd
cd /d "C:\Users\botde\Desktop\Nueva carpeta\mobile"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
npm install
npm start
```

En una tercera ventana, desde `mobile`, ejecuta:

```cmd
npm run android
```

Para un emulador, la direccion predeterminada de la API es `http://10.0.2.2:3000/api`. En un telefono fisico, usa la URL del backend en la pantalla de login, por ejemplo `http://IP_DE_LA_PC:3000/api`; el celular y la PC deben estar en la misma red Wi-Fi. Si es necesario, permite el puerto 3000 en el Firewall de Windows para redes privadas.

## APK de prueba mediante GitHub Actions

El workflow `.github/workflows/android-apk.yml` valida tests, TypeScript y lint, compila un APK **QA instalable** (`assembleQa`, sin dependencia de Metro) en un runner Ubuntu y lo publica como artefacto descargable durante 7 dias. La variante QA esta firmada con la clave debug y permite HTTP solo para probar el backend en una red privada de confianza; no la distribuyas ni la uses en redes publicas.

Este directorio aun debe estar dentro de un repositorio GitHub. Desde la carpeta del proyecto crea un repositorio, sube el codigo y abre **Actions**. Cada push a `main`/`master` (o ejecucion manual **Run workflow**) crea el artefacto `grupo-amayo-qa-apk`. Descargalo desde la pagina de la ejecucion completada; dentro del ZIP encontraras `app-qa.apk`.

La compilacion usa la firma debug compartida de Android y sirve para pruebas, no para publicar en Play Store. No requiere instalar Android Studio en tu PC. GitHub-hosted runners publicos son gratuitos; para repositorios privados, GitHub aplica las cuotas y limites del plan vigente. No se suben `.env`, contrasenas, keystores de publicacion ni datos de MySQL.

## Estado real de funcionalidades

- Implementado: login/logout real contra Node/Express, validacion JWT y rol, resumen administrativo disponible en el backend, URL configurable antes del login y almacenamiento de sesion con Keychain.
- Implementado en codigo, pendiente de dispositivo real: vista previa optativa de la camara trasera con VisionCamera.
- Pendiente: deteccion/seguimiento, linea virtual, conteo de entradas/salidas, registro de asistencia/visitas, reportes y supervision administrativa ampliada.
- Pendiente: servicio Android en primer plano, notificacion persistente y pruebas de pantalla bloqueada/bateria. Android restringe el acceso a la camara en segundo plano; no se afirma que la vigilancia funcione con pantalla apagada.
- No se capturan ni envian imagenes para identificacion. No se implementa reconocimiento biometrico.

La API local de desarrollo de este equipo tiene actualmente `10.164.219.117` como URL por defecto. Cambiala en el campo **Direccion del backend** de la pantalla de login cuando cambie la IP o al instalar el APK en otra red.
