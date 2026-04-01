// main.js - Registrador del Service Worker

// Comprueba si el navegador del usuario soporta Service Workers
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Registra el service-worker en segundo plano
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('[App Registro] ServiceWorker configurado correctamente con el alcance: ', registration.scope);
                
                // Vigilar si hay actualizaciones del Service Worker
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (installingWorker) {
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    console.log('[App] Nueva versión disponible. Recargando para actualizar...');
                                    // Forzar la recarga para que tome el nuevo CSS/JS
                                    location.reload();
                                }
                            }
                        };
                    }
                };
            })
            .catch(error => {
                console.log('[App Error] Falló el registro del ServiceWorker: ', error);
            });
    });
} else {
    console.warn('[App] Tu navegador no soporta carga por ServiceWorkers o estás en HTTP.');
}
