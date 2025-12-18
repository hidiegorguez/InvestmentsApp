# InvestmentsApp: Monorepo para la Gestión de Inversiones

Este repositorio contiene el código fuente de InvestmentsApp, una aplicación para la gestión de inversiones personales. La aplicación se compone de dos partes principales: un frontend desarrollado con React y un backend desarrollado con FastAPI.

## Estructura del Repositorio

Este repositorio utiliza un enfoque de monorepo, lo que significa que tanto el frontend como el backend se encuentran en el mismo repositorio. La estructura es la siguiente:

*   `app/backend`: Contiene el código del backend de la aplicación, implementado con FastAPI (Python).
*   `app/frontend`: Contiene el código del frontend de la aplicación, implementado con React, TypeScript y Vite.
*   `extension`: Contiene archivos relacionados con la extensión (en desarrollo).
*   `README.md`: Este archivo, que proporciona una descripción general del proyecto.
*   `.gitignore`: Define los archivos y directorios que deben ser ignorados por Git.
*   `.vscode`: Contiene configuraciones específicas para el editor Visual Studio Code.

## Descripción de las Aplicaciones

### Frontend (`app/frontend`)

El frontend de InvestmentsApp es una interfaz de usuario interactiva construida con React, TypeScript y Vite. Permite a los usuarios:

*   Iniciar sesión de forma segura.
*   Seleccionar los activos en los que están interesados.
*   Visualizar y gestionar sus carteras de inversión.

Para obtener más información sobre cómo ejecutar y desarrollar el frontend localmente, consulta el archivo `app/frontend/README.md`.

### Backend (`app/backend`)

El backend de InvestmentsApp es una API RESTful construida con FastAPI (Python). Proporciona los siguientes servicios:

*   Autenticación de usuarios.
*   Acceso a datos de carteras de inversión almacenados en Azure Blob Storage.
*   Gestión de la configuración de usuario.

Para obtener más información sobre cómo ejecutar y desarrollar el backend localmente, consulta el archivo `app/backend/README.md`.

## Tecnologías Utilizadas

*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite
    *   React Router
*   **Backend:**
    *   FastAPI (Python)
    *   Azure Blob Storage
    *   Pandas

## Despliegue

*   **Frontend:** Vercel (establecer la raíz del proyecto en `app/frontend`).
*   **Backend:** Fly.io o cualquier host de contenedores; se proporciona un `Dockerfile` en `app/backend/`.

## Próximos Pasos y Contribución

Si estás interesado en contribuir al proyecto, por favor consulta el archivo `extension/README.md` para ver los próximos pasos y las áreas donde se necesita ayuda.

## Notas Adicionales

*   Este proyecto utiliza un monorepo administrado con Lerna.
*   La configuración de Visual Studio Code se encuentra en el directorio `.vscode`.
*   **Este proyecto ha sido desarrollado con la asistencia de un agente de IA para la generación de código y documentación.**

