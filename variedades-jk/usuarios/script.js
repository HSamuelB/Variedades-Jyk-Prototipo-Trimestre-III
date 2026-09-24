document.addEventListener('DOMContentLoaded', () => {
    const usuario = protegerPagina();
    if (!usuario) return;
    marcarActivo();
    aplicarPermisos();

    // Solo el admin debe estar aquí
    if (!esAdmin()) {
        alert('⛔ Solo la administradora puede acceder a este módulo.');
        window.location.href = '../panel-de-control/index.html';
        return;
    }

    document.getElementById('avatarInicial').textContent = usuario.nombre.charAt(0).toUpperCase();
    document.getElementById('nombreUsuario').textContent = usuario.nombre;
    document.getElementById('rolUsuario').textContent = usuario.rol + ' · ' + (usuario.turno || '');

    let busqueda = '';

    document.getElementById('buscarUsuario').addEventListener('input', (e) => {
        busqueda = e.target.value.toLowerCase();
        pintarTabla();
    });

    function pintarTabla() {
        const usuarios = getUsuarios().filter(u =>
            u.nombre.toLowerCase().includes(busqueda) || u.usuario.toLowerCase().includes(busqueda)
        );

        const cuerpo = document.getElementById('cuerpoUsuarios');
        if (!usuarios.length) {
            cuerpo.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--texto-suave)">Sin usuarios</td></tr>`;
            return;
        }

        cuerpo.innerHTML = usuarios.map(u => `
            <tr>
                <td>${u.id}</td>
                <td><strong>${u.nombre}</strong></td>
                <td>${u.usuario}</td>
                <td><span class="badge ${u.rol.includes('Admin') ? 'badge-amarillo' : 'badge-gris'}">${u.rol}</span></td>
                <td>
                    <div class="celda-acciones">
                        <button class="icon-btn azul" onclick="editarUsuario(${u.id})" title="Editar">✏️</button>
                        <button class="icon-btn rojo" onclick="eliminarUsuario(${u.id})" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    const modal = document.getElementById('modalUsuario');
    const form = document.getElementById('formUsuario');
    const ojo = document.getElementById('ojoUsuario');
    const passInput = document.getElementById('userPassword');

    ojo.addEventListener('click', () => {
        const t = passInput.type === 'password' ? 'text' : 'password';
        passInput.type = t;
        ojo.textContent = t === 'password' ? '👁️' : '🙈';
    });

    document.getElementById('btnNuevoUsuario').addEventListener('click', () => {
        document.getElementById('tituloModalUsuario').textContent = 'Nuevo usuario';
        document.getElementById('ayudaPass').style.display = 'none';
        form.reset();
        document.getElementById('userId').value = '';
        passInput.required = true;
        modal.classList.add('activo');
        
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('userId').value;
        const usuarios = getUsuarios();

        const data = {
            id: id ? Number(id) : (usuarios.length ? Math.max(...usuarios.map(u => u.id)) + 1 : 1),
            nombre: document.getElementById('userNombre').value.trim(),
            usuario: document.getElementById('userUsuario').value.trim(),
            rol: document.getElementById('userRol').value,
            turno: 'Turno mañana',
            password: document.getElementById('userPassword').value
        };

        if (id) {
            const idx = usuarios.findIndex(u => u.id === Number(id));
            if (!data.password) data.password = usuarios[idx].password;
            usuarios[idx] = { ...usuarios[idx], ...data };
            showToast('¡Usuario actualizado correctamente!');
        } else {
            if (!data.password) { alert('La contraseña es obligatoria'); return; }
            usuarios.push(data);
            showToast('¡Usuario agregado correctamente!');
        }

        setUsuarios(usuarios);
        cerrarModal('modalUsuario');
        pintarTabla();
    });   

    window.editarUsuario = (id) => {
        const u = getUsuarios().find(x => x.id === id);
        if (!u) return;
        document.getElementById('tituloModalUsuario').textContent = 'Editar usuario';
        document.getElementById('userId').value = u.id;
        document.getElementById('userNombre').value = u.nombre;
        document.getElementById('userUsuario').value = u.usuario;
        document.getElementById('userRol').value = u.rol;
        passInput.value = '';
        passInput.required = false;
        document.getElementById('ayudaPass').style.display = 'block';
        modal.classList.add('activo');
        
    };
    
    window.eliminarUsuario = (id) => {
        const u = getUsuarios().find(x => x.id === id);
        const actual = getUsuarioActual();
        if (u && actual && u.usuario === actual.usuario) {
            alert('No puedes eliminar tu propio usuario');
            return;
        }
        if (!confirm('¿Eliminar este usuario?')) return;
        setUsuarios(getUsuarios().filter(x => x.id !== id));
        pintarTabla();
        
    };

    pintarTabla();
});

function cerrarModal(id) { document.getElementById(id).classList.remove('activo'); }

function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}