// cache.js — Registro del Service Worker + detección automática de actualizaciones
// NO necesitás cambiar versiones manualmente. El SW se encarga de todo.

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./service-worker.js');
            console.log('[App] Service Worker registrado correctamente.');

            // Cada vez que se detecta un nuevo Service Worker instalado,
            // recargamos la página automáticamente para aplicar los cambios.
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                        console.log('[App] Nueva versión detectada. Recargando...');
                        // Recarga automática sin que el usuario tenga que borrar caché
                        window.location.reload();
                    }
                });
            });

            // También verificar si hay actualizaciones al volver a la pestaña
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    registration.update();
                }
            });

        } catch (error) {
            console.error('[App] Error registrando Service Worker:', error);
        }
    });
}
