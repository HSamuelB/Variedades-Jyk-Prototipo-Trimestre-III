document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Mostrar/ocultar contraseña
    togglePassword.addEventListener('click', () => {
        const tipo = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = tipo;
        togglePassword.textContent = tipo === 'password' ? '👁️' : '🙈';
    });

    // Login
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const usuarioInput = document.getElementById('usuario').value.trim();
        const contrasena   = passwordInput.value.trim();

        const usuarios = getUsuarios();
        const encontrado = usuarios.find(u => u.usuario === usuarioInput && u.password === contrasena);

        if (encontrado) {
            setUsuarioActual(encontrado);
            window.location.href = '../panel-de-control/index.html';
        } else {
            alert('❌ Usuario o contraseña incorrectos');
            passwordInput.value = '';
        }
    });
});