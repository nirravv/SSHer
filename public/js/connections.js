document.addEventListener('DOMContentLoaded', () => {
    const term = new Terminal({
        scrollback: 1000,
        theme: {
            background: '#000000'
        },
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

    let commandBuffer = ''; // Buffer to store command input
    let ws = null; // WebSocket instance
    let sessionId = null; // Session ID for WebSocket connection

    // Handle keyboard input
    term.onData((data) => {
        // Check for Enter key press (Carriage Return \r or New Line \n)
        if (data === '\r' || data === '\n') {
            // Handle Enter press: Execute the command
            if (commandBuffer.trim() !== '') {
                executeCommand(commandBuffer.trim());
                commandBuffer = ''; // Clear command buffer
            }
            term.write('\r\n$ '); // Write new prompt
        } else if (data === '\x7F') {
            // Handle Backspace: Remove last character from buffer and terminal
            if (commandBuffer.length > 0) {
                commandBuffer = commandBuffer.slice(0, -1);
                term.write('\b \b');
            }
        } else {
            // Normal key press: Append the character to the command buffer
            commandBuffer += data;
            term.write(data);
        }
    });

    // Function to execute command
    function executeCommand(command) {
        if (!ws) {
            console.error('WebSocket connection not established');
            return;
        }

        const message = JSON.stringify({ action: 'exec', sshSessionId: sessionId, command });
        ws.send(message); // Send command with session ID to server
    }

    // WebSocket connection handling
    function connectWebSocket(sessionId) {
        ws = new WebSocket(`ws://localhost:3000/ssh-connect/${sessionId}`);

        ws.onopen = function() {
            console.log('WebSocket connection established');
        };

        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.action === 'output') {
                term.write(data.output);
            } else if (data.action === 'error') {
                term.write(`Error: ${data.error}\r\n`);
            }
        };

        ws.onclose = function() {
            term.write('\r\nConnection closed');
            ws = null; // Reset WebSocket instance on close
        };
    }

    // Fetch SSH connections and display them
    function fetchConnections() {
        var token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/'; // Redirect to login page if no token
            return;
        }

        fetch('/connections/ssh-credentials', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`
            }
        })
        .then(response => response.ok ? response.json() : Promise.reject('Failed to fetch connections'))
        .then(connections => {
            displayConnections(connections);
        })
        .catch(error => {
            console.error('Error fetching connections:', error);
        });
    }

    // Display SSH connections in UI
    function displayConnections(connections) {
        var connectionsList = document.getElementById('sshConnectionList');
        if (connections.length === 0) {
            connectionsList.innerHTML = '<p>No connections added yet!</p>';
        } else {
            connectionsList.innerHTML = '';
            connections.forEach(conn => {
                var listItem = document.createElement('li');
                listItem.className = 'ssh-connection-item';
                listItem.textContent = `${conn.host}:${conn.port}`;
                listItem.addEventListener('click', function() {
                    connectToSSH(conn._id); // Connect to SSH server when clicked
                });
                connectionsList.appendChild(listItem);
            });
        }
    }

    // Connect to SSH server
    function connectToSSH(connectionId) {
        var token = localStorage.getItem('token');
        fetch(`/connections/ssh-connect/${connectionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`
            }
        })
        .then(response => response.ok ? response.json() : Promise.reject('Failed to connect'))
        .then(data => {
            if (data.success) {
                sessionId = data.sshSessionId; // Store session ID
                connectWebSocket(sessionId); // Start WebSocket connection
            } else {
                alert('Failed to connect to SSH');
            }
        })
        .catch(error => {
            console.error('Error connecting to SSH:', error);
        });
    }

    // Initialize SSH connections when the page loads
    fetchConnections();

    // Event listener for SSH credentials form submission
    const sshCredentialsForm = document.getElementById('sshCredentialsForm');
    if (sshCredentialsForm) {
        sshCredentialsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const host = document.getElementById('host').value;
            const port = document.getElementById('port').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/connections/ssh-credentials', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${token}`
                    },
                    body: JSON.stringify({ host, port, username, password })
                });
                const result = await response.json();
                if (response.ok) {
                    alert(result.message);
                    sshCredentialsForm.reset();
                    fetchConnections(); // Refresh connections list
                } else {
                    alert(result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An unexpected error occurred');
            }
        });
    }

    // Event listener for logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                localStorage.removeItem('token'); // Remove token from localStorage
                window.location.href = '/'; // Redirect to login page
            } catch (error) {
                console.error('Error:', error);
                alert('An unexpected error occurred');
            }
        });
    }

});
