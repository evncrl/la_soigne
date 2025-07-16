$(document).ready(function () {
    const url = 'http://localhost:4000/';

    // Check login immediately on any page load
    const getToken = () => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');

        if (!token || !userId) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to access this page.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return null;
        }
        $('#userId').val(userId);
        return { token, userId };
    };

    // Immediately block access if not logged in
    if (window.location.pathname.includes('profile.html')) {
        const authData = getToken();
        if (!authData) return; // Stop further execution if not logged in
    }

    // Only initialize profile page if we're on the profile page
    function initializeProfilePage() {
        if (window.location.pathname.includes('profile.html') || $('#profileForm').length > 0) {
            const authData = getToken();
            if (!authData) return;

            const userId = authData.userId;
            $('#userId').val(userId);

            $('#header').load('/header.html', function () {
                $('body').css('padding-top', $('#header').outerHeight() + 20 + 'px');
                $('#login-link, #register-link').addClass('d-none');
                $('#user-dropdown').removeClass('d-none');

                // Fetch user data for header
                $.ajax({
                    url: `${url}api/users/customers/${authData.userId}`,
                    method: 'GET',
                    success: function (res) {
                        if (res.success && res.data) {
                            const data = res.data;
                            const fullName = `${data.fname || ''} ${data.lname || ''}`.trim();
                            $('#username').text(fullName || 'USER');
                            if (data.image_path) {
                                $('.profile-img').attr('src', `/${data.image_path}`);
                            }

                            // ✅ ADMIN CHECK
                            if (data.role === 'Admin') {
                                $('body').addClass('is-admin');
                                console.log("✅ Admin logged in");
                            }
                        }
                    },
                    error: function(xhr) {
                        console.warn('Error fetching user data for dropdown:', xhr.responseText);
                    }
                });
            });

            function fetchProfileData() {
                $.ajax({
                    url: `${url}api/users/customers/${userId}`,
                    method: 'GET',
                    success: function (res) {
                        if (res.success && res.data) {
                            const data = res.data;
                            $('#title').val(data.title || '');
                            $('#fname').val(data.fname || '');
                            $('#lname').val(data.lname || '');
                            $('#addressline').val(data.addressline || '');
                            $('#town').val(data.town || '');
                            $('#phone').val(data.phone || '');
                            if (data.image_path) {
                                $('#profileImagePreview').attr('src', `/${data.image_path}`);
                            }
                        }
                    },
                    error: function (xhr) {
                        console.warn('No profile found or error fetching profile:', xhr.responseText);
                    }
                });
            }

            // Load profile data on page load
            fetchProfileData();

            // Preview profile image
            $('#image').on('change', function () {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        $('#profileImagePreview').attr('src', e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Handle form submission
            $('#profileForm').on('submit', function (e) {
                e.preventDefault();

                const formData = new FormData(this);

                // Ensure userId is set
                if (!formData.get('userId')) {
                    formData.set('userId', userId);
                }

                console.log('Form data being sent:');
                for (let pair of formData.entries()) {
                    console.log(pair[0] + ': ' + pair[1]);
                }

                $.ajax({
                    url: `${url}api/v1/update-profile`,
                    method: 'POST',
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (response) {
                        console.log('Success:', response);
                        Swal.fire({
                            icon: 'success',
                            text: response.message || 'Profile updated successfully!',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true
                        });
                        fetchProfileData();
                    },
                    error: function (xhr) {
                        console.error('Error:', xhr);
                        let errorMsg = 'Profile update failed';

                        if (xhr.responseJSON && xhr.responseJSON.error) {
                            errorMsg = xhr.responseJSON.error;
                        }

                        Swal.fire({
                            icon: 'error',
                            text: errorMsg,
                            showConfirmButton: true
                        });
                    }
                });
            });
        }
    }

    initializeProfilePage();

    // Register handler
    $("#register").on('click', function (e) {
        e.preventDefault();

        let fname = $("#fname").val();
        let lname = $("#lname").val();
        let email = $("#email").val();
        let password = $("#password").val();
        let confirmPassword = $("#confirmPassword").val();

        if (password !== confirmPassword) {
            Swal.fire({
                icon: "error",
                text: "Passwords do not match",
                position: 'bottom-right'
            });
            return;
        }

        let user = { fname, lname, email, password, confirmPassword };

        $.ajax({
            method: "POST",
            url: `${url}api/v1/register`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                Swal.fire({
                    icon: "success",
                    text: "Registration successful",
                    position: 'bottom-right'
                }).then(() => {
                    window.location.href = 'login.html';
                });
            },
            error: function (xhr) {
                let msg = xhr.responseJSON?.error || "Registration failed";
                Swal.fire({
                    icon: "error",
                    text: msg,
                    position: 'bottom-right'
                });
            }
        });
    });

    // Deactivate handler
    $("#deactivateBtn").on('click', function (e) {
        e.preventDefault();

        const authData = getToken();
        if (!authData) return;

        Swal.fire({
            title: 'Are you sure?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, deactivate!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: "DELETE",
                    url: `${url}api/v1/deactivate`,
                    headers: {
                        'Authorization': `Bearer ${authData.token}`
                    },
                    data: JSON.stringify({ userId: authData.userId }),
                    processData: false,
                    contentType: 'application/json; charset=utf-8',
                    dataType: "json",
                    success: function (data) {
                        Swal.fire({
                            text: data.message,
                            showConfirmButton: false,
                            position: 'bottom-right',
                            timer: 2000,
                            timerProgressBar: true
                        });

                        sessionStorage.clear();
                        localStorage.clear();

                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2100);
                    },
                    error: function (xhr) {
                        Swal.fire({
                            icon: "error",
                            text: "Deactivation failed",
                            position: 'bottom-right'
                        });
                    }
                });
            }
        });
    });

    // Particle animation
    function createParticle() {
        const particle = $('<div class="particle"></div>');
        particle.css({
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 2 + 's',
            animationDuration: (Math.random() * 3 + 4) + 's'
        });
        $('body').append(particle);
        setTimeout(() => particle.remove(), 7000);
    }

    setInterval(createParticle, 2000);

    // Validation functions
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validatePassword(password) {
        return password.length >= 8;
    }

    function showError(inputId, message) {
        const input = $('#' + inputId);
        const errorDiv = $('#' + inputId.replace('login', '').toLowerCase() + 'Error');
        input.addClass('error').removeClass('success');
        errorDiv.text(message).addClass('show');
        setTimeout(() => input.removeClass('error'), 500);
    }

    function showSuccess(inputId) {
        const input = $('#' + inputId);
        const errorDiv = $('#' + inputId.replace('login', '').toLowerCase() + 'Error');
        input.addClass('success').removeClass('error');
        errorDiv.removeClass('show');
    }

    // Forgot password
    $('#forgotPasswordLink').on('click', function (e) {
        e.preventDefault();
        const email = $('#loginEmail').val();

        if (!email) {
            showError('loginEmail', 'Please enter your email address first');
            $('#loginEmail').focus();
            return;
        }

        if (!validateEmail(email)) {
            showError('loginEmail', 'Please enter a valid email address');
            $('#loginEmail').focus();
            return;
        }

        $.ajax({
            method: "POST",
            url: `${url}api/v1/forgot-password`,
            data: JSON.stringify({ email }),
            contentType: 'application/json; charset=utf-8',
            success: function() {
                Swal.fire({
                    icon: 'info',
                    text: 'Password reset instructions have been sent to your email address.',
                    showConfirmButton: true
                });
            },
            error: function(xhr) {
                Swal.fire({
                    icon: 'error',
                    text: xhr.responseJSON?.message || 'Failed to send reset instructions',
                    showConfirmButton: true
                });
            }
        });
    });
});
