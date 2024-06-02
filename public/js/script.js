document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for registering a new user
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;

            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    registerForm.reset();
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An unexpected error occurred');
            }
        });
    }

    // Add event listener for logging in
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    window.location.href = `/connections?token=${result.token}`;
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An unexpected error occurred');
            }
        });
    }

    // Add event listener for logging out
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    window.location.href = '/login';
                } else {
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An unexpected error occurred');
            }
        });
    }

    // Add event listener for submitting SSH credentials form
    const sshCredentialsForm = document.getElementById('sshCredentialsForm');
    if (sshCredentialsForm) {
        sshCredentialsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const host = document.getElementById('host').value;
            const port = document.getElementById('port').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const token = localStorage.getItem('token'); // Retrieve user token from local storage
                const response = await fetch('/connections/ssh-credentials', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Include user token in request headers
                    },
                    body: JSON.stringify({ host, port, username, password })
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    sshCredentialsForm.reset();
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An unexpected error occurred');
            }
        });
    }

    // Open modal when add SSH connection button is clicked
    const addSshConnectionBtn = document.getElementById('addSshConnectionBtn');
    if (addSshConnectionBtn) {
        addSshConnectionBtn.addEventListener('click', function() {
            document.getElementById('myModal').style.display = 'block';
        });
    }

    // Close modal when close button or outside modal is clicked
    const closeBtn = document.getElementsByClassName('close')[0];
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('myModal').style.display = 'none';
        });
    }

    window.onclick = function(event) {
        if (event.target == document.getElementById('myModal')) {
            document.getElementById('myModal').style.display = 'none';
        }
    };
});
