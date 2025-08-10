document.addEventListener('DOMContentLoaded', () => {
  const userList = document.getElementById('user-list');
  const token = localStorage.getItem('token');

  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'x-auth-token': token,
        },
      });

      if (response.status === 403) {
        alert('You are not authorized to view this page.');
        window.location.href = '/';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const users = await response.json();
      renderUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users. Please try again.');
    }
  };

  const renderUsers = (users) => {
    userList.innerHTML = '';
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.username}</td>
        <td>
          <select data-id="${user._id}" class="role-select">
            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </td>
        <td class="actions">
          <button class="delete-btn" data-id="${user._id}">Delete</button>
        </td>
      `;
      userList.appendChild(row);
    });
  };

  userList.addEventListener('change', async (e) => {
    if (e.target.classList.contains('role-select')) {
      const userId = e.target.dataset.id;
      const newRole = e.target.value;
      try {
        const response = await fetch(`/api/users/${userId}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
          },
          body: JSON.stringify({ role: newRole }),
        });
        if (!response.ok) {
          throw new Error('Failed to update role');
        }
        alert('User role updated successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error updating role:', error);
        alert('Failed to update role. Please try again.');
      }
    }
  });

  userList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const userId = e.target.dataset.id;
      if (confirm('Are you sure you want to delete this user?')) {
        try {
          const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'x-auth-token': token,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to delete user');
          }
          alert('User deleted successfully');
          fetchUsers();
        } catch (error) {
          console.error('Error deleting user:', error);
          alert('Failed to delete user. Please try again.');
        }
      }
    }
  });

  fetchUsers();
});
