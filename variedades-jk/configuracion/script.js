document.addEventListener('DOMContentLoaded', () => {
    const usuario = protegerPagina();
    if (!usuario) return;
    marcarActivo();
    aplicarPermisos();

    document.getElementById('avatarInicial').textContent = usuario.nombre.charAt(0).toUpperCase();
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    document.getElementById('rolUsuario').textContent = usuario.rol + ' · ' + (usuario.turno || '');

    // Cargar perfil
    document.getElementById('cfgNombre').value = usuario.nombre;
    document.getElementById('cfgUsuario').value = usuario.usuario;
    document.getElementById('cfgRol').value = usuario.rol;

    // Cargar datos de tienda si existen
    const tienda = JSON.parse(localStorage.getItem('jk_tienda') || '{}');
    if (tienda.nombre)  document.getElementById('cfgTiendaNombre').value = tienda.nombre;
    if (tienda.nit)     document.getElementById('cfgTiendaNit').value = tienda.nit;
    if (tienda.direccion) document.getElementById('cfgTiendaDir').value = tienda.direccion;
    if (tienda.telefono)  document.getElementById('cfgTiendaTel').value = tienda.telefono;

    // Guardar perfil
    document.getElementById('btnGuardarPerfil').addEventListener('click', () => {
        const nombre = document.getElementById('cfgNombre').value.trim();
        const usuarioNombre = document.getElementById('cfgUsuario').value.trim();

        if (!nombre || !usuarioNombre) { alert('Completa todos los campos'); return; }

        const usuarios = getUsuarios();
        const idx = usuarios.findIndex(u => u.id === usuario.id);
        if (idx === -1) return;

        // Verificar que el nuevo usuario no esté tomado
        const ocupado = usuarios.some((u, i) => i !== idx && u.usuario === usuarioNombre);
        if (ocupado) { alert('Ese nombre de usuario ya está en uso'); return; }

        usuarios[idx].nombre = nombre;
        usuarios[idx].usuario = usuarioNombre;
        setUsuarios(usuarios);

        // Actualizar sesión
        const actualizado = { ...usuario, nombre, usuario: usuarioNombre };
        setUsuarioActual(actualizado);

        document.getElementById('nombreUsuario').textContent = nombre;
        document.getElementById('avatarInicial').textContent = nombre.charAt(0).toUpperCase();

        alert('✅ Perfil actualizado');
    });

    // Cambiar contraseña
    document.getElementById('btnCambiarPass').addEventListener('click', () => {
        const actual = document.getElementById('cfgPassActual').value;
        const nueva = document.getElementById('cfgPassNueva').value;
        const confirm = document.getElementById('cfgPassConfirm').value;

        if (!actual || !nueva || !confirm) { alert('Completa todos los campos'); return; }
        if (actual !== usuario.password) { alert('❌ La contraseña actual no es correcta'); return; }
        if (nueva !== confirm) { alert('❌ Las contraseñas nuevas no coinciden'); return; }
        if (nueva.length < 4) { alert('La nueva contraseña debe tener al menos 4 caracteres'); return; }

        const usuarios = getUsuarios();
        const idx = usuarios.findIndex(u => u.id === usuario.id);
        if (idx === -1) return;
        usuarios[idx].password = nueva;
        setUsuarios(usuarios);

        const actualizado = { ...usuario, password: nueva };
        setUsuarioActual(actualizado);

        document.getElementById('cfgPassActual').value = '';
        document.getElementById('cfgPassNueva').value = '';
        document.getElementById('cfgPassConfirm').value = '';
        alert('✅ Contraseña actualizada');
    });

    // Guardar datos de tienda
    const btnTienda = document.getElementById('btnGuardarTienda');
    if (btnTienda) {
        btnTienda.addEventListener('click', () => {
            const tiendaData = {
                nombre: document.getElementById('cfgTiendaNombre').value.trim(),
                nit: document.getElementById('cfgTiendaNit').value.trim(),
                direccion: document.getElementById('cfgTiendaDir').value.trim(),
                telefono: document.getElementById('cfgTiendaTel').value.trim()
            };
            localStorage.setItem('jk_tienda', JSON.stringify(tiendaData));
            alert('✅ Datos de la tienda guardados');
        });
    }

    // Zona de peligro
    const btnReiniciar = document.getElementById('btnReiniciarStock');
    if (btnReiniciar) {
        btnReiniciar.addEventListener('click', () => {
            if (!confirm('¿Reiniciar el stock de todos los productos a los valores iniciales?')) return;
            setProductos(JSON.parse(JSON.stringify(DATOS_SEMILLA.productos)));
            alert('✅ Stock reiniciado');
        });
    }

    const btnBorrarVentas = document.getElementById('btnBorrarVentas');
    if (btnBorrarVentas) {
        btnBorrarVentas.addEventListener('click', () => {
            if (!confirm('¿Borrar TODO el historial de ventas?')) return;
            setVentas([]);
            alert('✅ Historial de ventas eliminado');
        });
    }

    const btnRestaurar = document.getElementById('btnRestaurarTodo');
    if (btnRestaurar) {
        btnRestaurar.addEventListener('click', () => {
            if (!confirm('⚠️ Esto borrará TODO (productos, ventas, usuarios y configuración). ¿Continuar?')) return;
            localStorage.clear();
            alert('Sistema restaurado. Serás redirigido al login.');
            window.location.href = '../login/index.html';
        });
    }
});