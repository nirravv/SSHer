document.addEventListener('DOMContentLoaded', () => {
    // Terminal initialization
    const term = new Terminal({
        scrollback: 1000,
        theme: {
            background: '#000000'
        },
        // fontFamily: 'DejaVu Mono',
        fontSize: 14,
        cursorBlink: true
    });

    term.open(document.getElementById('terminal'));
    term.write('Welcome to \x1B[1;3;31mSSHer\x1B[0m $ ');

    // Ensure the terminal resizes properly
    window.addEventListener('resize', () => {
        term.fit();
    });

    // Focus the terminal when the page loads
    term.focus();

    // Handle keyboard input
    term.onData((data) => {
        // Check for Enter key press (Carriage Return \r or New Line \n)
        if (data === '\r' || data === '\n') {
            // Handle Enter press: Move cursor to a new line
            term.write('\r\n'); // Write new line characters
            // Here you can handle executing a command or any other logic
        } else {
            // Normal key press: Write the character to the terminal
            term.write(data);
        }
    });

    // Add event listener for logging out
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Remove token from localStorage
                localStorage.removeItem('token');

                // Redirect to login page
                window.location.href = '/';
            } catch (error) {
                console.error('Error:', error);
                alert('An unexpected error occurred');
            }
        });
    }

    // Check if the current page is connections and fetch data if so
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/'; // Redirect to login page if no token
    } else {
        // Fetch connections data
        fetch('/connections/ssh-credentials', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Failed to fetch connections');
            }
        })
        .then(connections => {
            // Display connections data
            const connectionsList = document.getElementById('sshConnectionList');
            if (connections.length === 0) {
                connectionsList.innerHTML = '<p>No connections added yet!</p>';
            } else {
                connectionsList.innerHTML = connections.map(conn => `<p>${conn.host}:${conn.port}</p>`).join('');
            }
        })
        .catch(error => {
            console.error('Error fetching connections:', error);
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
                        'Authorization': `${token}` // Include user token in request headers
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
