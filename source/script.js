document.addEventListener("DOMContentLoaded", () => {
    (function () {
        try {
            emailjs.init("Ja0ygnE_FA1EjbjGk");
        } catch (error) {
            console.error("Error initializing EmailJS:", error);
        }
    })();

    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                event.preventDefault();
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 50,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    const userForm = document.getElementById('user-form');
    const formResponseAuth = document.getElementById('form-response-auth');
    const formTitle = document.getElementById('form-title');
    const emailField = document.getElementById('email');
    const toggleFormLink = document.getElementById('toggle-form');
    let isLogin = true;

    if (toggleFormLink) {
        toggleFormLink.addEventListener('click', (event) => {
            event.preventDefault();
            isLogin = !isLogin;
            if (isLogin) {
                formTitle.textContent = 'Login';
                if (emailField) emailField.style.display = 'none';
                document.getElementById('submit-btn').textContent = 'Login';
                toggleFormLink.innerHTML = `Don't have an account? <a href="#">Register here</a>`;
            } else {
                formTitle.textContent = 'Register';
                if (emailField) emailField.style.display = 'block';
                document.getElementById('submit-btn').textContent = 'Register';
                toggleFormLink.innerHTML = `Already have an account? <a href="#">Login here</a>`;
            }
        });
    }

    if (userForm) {
        userForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = document.getElementById('username')?.value || '';
            const email = emailField?.value || '';
            const password = document.getElementById('password')?.value || '';

            if (!username || !password || (!isLogin && !email)) {
                formResponseAuth.textContent = 'All fields are required.';
                formResponseAuth.style.color = 'red';
                return;
            }

            const url = isLogin ? 'http://localhost:3000/login' : 'http://localhost:3000/register';
            const data = { username, password };
            if (!isLogin) data.email = email;

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error: ${errorText}`);
                }

                const result = await response.json();
                formResponseAuth.textContent = result.message;
                formResponseAuth.style.color = result.success ? 'green' : 'red';

                if (result.success && isLogin) {
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('username', result.username);
                    window.location.replace(result.redirect || '/portal');
                }
            } catch (error) {
                console.error('Error:', error);
                formResponseAuth.textContent = 'An error occurred. Please try again.';
                formResponseAuth.style.color = 'red';
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (event) => {
            event.preventDefault();

            try {
                const response = await fetch('http://localhost:3000/logout', { method: 'POST' });
                if (!response.ok) {
                    throw new Error('Error logging out');
                }

                const result = await response.json();
                if (result.success) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('username');
                    window.location.href = '/index.html';
                } else {
                    console.error('Error logging out:', result.message);
                }
            } catch (error) {
                console.error('Error in logout request:', error);
            }
        });
    }

    if (window.location.pathname === '/portal') {
        const username = localStorage.getItem('username');
        const authToken = localStorage.getItem('authToken');

        if (!authToken) {
            window.location.href = '/login';
        } else {
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome, ${username}`;
            }
        }
    }

    const ticketForm = document.getElementById('ticket-form');
    if (ticketForm) {
        ticketForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = ticketForm.querySelector('[name="email"]')?.value.trim();
            const motivo = ticketForm.querySelector('[name="motivo"]')?.value.trim();
            const descripcion = ticketForm.querySelector('[name="descripcion"]')?.value.trim();
            const prioridad = ticketForm.querySelector('[name="prioridad"]')?.value.trim();

            if (!email || !motivo || !descripcion || !prioridad) {
                alert('All fields are required.');
                return;
            }

            const ticketData = { email, motivo, descripcion, prioridad };

            try {
                const response = await fetch('http://localhost:3000/tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ticketData),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }

                const result = await response.json();
                alert(result.message || 'Ticket created successfully.');
                ticketForm.reset();
            } catch (error) {
                console.error('Error creating ticket:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }
});
