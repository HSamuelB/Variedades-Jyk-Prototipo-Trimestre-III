// Arreglo inicial de usuarios precargados (con nombre de usuario y contraseña para el login)
let users = JSON.parse(localStorage.getItem('users')) || [
    { id: 1, nombre: 'Carlos Lopez', username: 'Carlos', password: '123', rol: 'Administrador' },
    { id: 2, nombre: 'Maria Gomez', username: 'Maria', password: '456', rol: 'Vendedor' }
];

let deleteId = null; // Variable temporal para almacenar el ID del usuario a eliminar

// Elementos del DOM
const usersTableBody = document.getElementById('usersTableBody');
const searchInput = document.getElementById('searchInput');
const userModal = document.getElementById('userModal');
const deleteModal = document.getElementById('deleteModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtns = document.querySelectorAll('.close-modal, #cancelModalBtn');
const userForm = document.getElementById('userForm');
const modalTitle = document.getElementById('modalTitle');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Campos del formulario
const userIdInput = document.getElementById('userId');
const nombreInput = document.getElementById('nombre');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rolInput = document.getElementById('rol');

// Función para guardar en LocalStorage y renderizar la tabla
function saveAndRender() {
    localStorage.setItem('users', JSON.stringify(users));
    renderUsers(users);
}

// Función para mostrar los usuarios en la tabla HTML
function renderUsers(usersList) {
    usersTableBody.innerHTML = '';
    
    if (usersList.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #64748b;">No se encontraron usuarios.</td></tr>`;
        return;
    }

    usersList.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id}</td>
            <td>${user.nombre}</td>
            <td>${user.username}</td>
            <td>${user.rol}</td>
            <td>
                <button class="action-btn edit" onclick="openEditModal(${user.id})" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="action-btn delete" onclick="openDeleteModal(${user.id})" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        usersTableBody.appendChild(tr);
    });
}

// Abrir modal para crear usuario
openModalBtn.addEventListener('click', () => {
    modalTitle.textContent = 'Nuevo Usuario';
    userForm.reset();
    userIdInput.value = '';
    resetPasswordToggle();
    userModal.style.display = 'flex';
});

// Cerrar modales
function closeModals() {
    userModal.style.display = 'none';
    deleteModal.style.display = 'none';
    resetPasswordToggle();
}

closeModalBtns.forEach(btn => btn.addEventListener('click', closeModals));
cancelDeleteBtn.addEventListener('click', closeModals);

// Cerrar al hacer clic fuera del contenido del modal
window.addEventListener('click', (e) => {
    if (e.target === userModal || e.target === deleteModal) {
        closeModals();
    }
});

// Guardar usuario (Crear o Editar)
userForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = userIdInput.value;
    const nombre = nombreInput.value;
    const username = usernameInput.value;
    const password = passwordInput.value;
    const rol = rolInput.value;

    if (id) {
        // Editar usuario existente
        users = users.map(user => {
            if (user.id == id) {
                return { ...user, nombre, username, password, rol };
            }
            return user;
        });
        showToast('¡Usuario actualizado correctamente!');
    } else {
        // Crear nuevo usuario
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = { id: newId, nombre, username, password, rol };
        users.push(newUser);
        showToast('¡Usuario agregado correctamente!'); // <--- MENSAJE DE CREAR
    }

    saveAndRender();
    closeModals();
});

// Abrir modal para editar cargando los datos correspondientes
window.openEditModal = function(id) {
    const user = users.find(u => u.id == id);
    if (user) {
        modalTitle.textContent = 'Editar Usuario';
        userIdInput.value = user.id;
        nombreInput.value = user.nombre;
        usernameInput.value = user.username;
        passwordInput.value = user.password;
        rolInput.value = user.rol;
        resetPasswordToggle();
        userModal.style.display = 'flex';
    }
}

// Abrir modal de confirmación para eliminar
window.openDeleteModal = function(id) {
    deleteId = id;
    deleteModal.style.display = 'flex';
}

// Confirmar eliminación
confirmDeleteBtn.addEventListener('click', () => {
    if (deleteId !== null) {
        users = users.filter(user => user.id !== deleteId);
        deleteId = null;
        saveAndRender();
        closeModals();
    }
});

// Buscador en tiempo real
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filteredUsers = users.filter(user => 
        user.nombre.toLowerCase().includes(term) || 
        user.username.toLowerCase().includes(term) ||
        user.rol.toLowerCase().includes(term)
    );
    renderUsers(filteredUsers);
});

// Renderizar tabla al cargar la página por primera vez
document.addEventListener('DOMContentLoaded', () => {
    renderUsers(users);
});

// --- NUEVA FUNCIÓN PARA MOSTRAR LA NOTIFICACIÓN ---
function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    // Ocultar automáticamente después de 3 segundos (3000 milisegundos)
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Capturamos los elementos por sus IDs


const togglePasswordBtn = document.getElementById('togglePassword');
const toggleIcon = document.getElementById('togglePasswordIcon'); // El icono dentro del botón

togglePasswordBtn.addEventListener('click', function () {
    // 1. Verificar el tipo actual del input
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // 2. Cambiar la clase del icono de FontAwesome
    // Si es 'text', mostramos el ojo tachado (eye-slash); si no, el ojo normal (eye)
    if (type === 'text') {
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
});

// Función para reiniciar el campo de la contraseña a su estado oculto original
function resetPasswordToggle() {
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const toggleIcon = document.getElementById('togglePasswordIcon');

    if (passwordInput && togglePasswordBtn && toggleIcon) {
        passwordInput.setAttribute('type', 'password'); // Vuelve a ocultar la contraseña
        togglePasswordBtn.classList.remove('active');   // Quita el color azul de activo
        toggleIcon.classList.remove('fa-eye-slash');    // Quita el icono de ojo tachado
        toggleIcon.classList.add('fa-eye');            // Vuelve a poner el icono de ojo normal
        togglePasswordBtn.setAttribute('title', 'Mostrar contraseña');
    }
}