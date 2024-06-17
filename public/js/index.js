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
                    localStorage.setItem('token', result.token); // Store the token in localStorage
                    window.location.href = `/connections`;
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An unexpected error occurred');
            }
        });
    }
});
