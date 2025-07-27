document.addEventListener('DOMContentLoaded', () => {
    const hamburgerButton = document.getElementById('hamburger-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // S'assure que le code ne s'exécute que si les éléments existent
    if (hamburgerButton && mobileMenu) {
        hamburgerButton.addEventListener('click', () => {
            // "toggle" ajoute ou retire la classe 'hidden' à chaque clic
            mobileMenu.classList.toggle('hidden');
        });
    }
});