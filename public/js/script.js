document.getElementById('registerForm').addEventListener('submit', async (e) => {
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
            document.getElementById('registerForm').reset();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred');
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
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
            // Redirect or perform action upon successful login
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred');
    }
});

document.getElementById('sshLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const host = document.getElementById('host').value;
    const port = document.getElementById('port').value;
    const username = document.getElementById('sshUsername').value;
    const password = document.getElementById('sshPassword').value;

    try {
        const response = await fetch('/ssh/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ host, port, username, password })
        });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            document.getElementById('ssh-form').style.display = 'none';
            document.getElementById('ssh-output').style.display = 'block';
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred');
    }
});

document.getElementById('sshCommandForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const command = document.getElementById('command').value;

    try {
        const response = await fetch('/ssh/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command })
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('output').innerText += result.output + '\n';
            document.getElementById('sshCommandForm').reset();
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred');
    }
});
