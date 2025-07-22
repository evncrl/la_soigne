$(document).ready(function () {
    const url = 'http://localhost:4000/';

    // ✅ Save login data to storage (helper)
    function saveLoginData(user, token) {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('userId', user.id);
        sessionStorage.setItem('userRole', user.role);

        // optional: persist in localStorage if "remember me"
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('userRole', user.role);
    }

    // ✅ Check login helper
    const getToken = () => {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
        const userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');

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
        return { token, userId, userRole };
    };

    // Immediately block access if not logged in
    if (window.location.pathname.includes('profile.html')) {
        const authData = getToken();
        if (!authData) return;
    }

    // ✅ LOGIN HANDLER
    $("#loginBtn").on('click', function (e) {
        e.preventDefault();

        const email = $("#loginEmail").val();
        const password = $("#loginPassword").val();

        if (!email || !password) {
            Swal.fire({ icon: "error", text: "Please enter email and password" });
            return;
        }

        $.ajax({
            method: "POST",
            url: `${url}api/v1/login`,
            data: JSON.stringify({ email, password }),
            contentType: 'application/json; charset=utf-8',
            success: function (res) {
                if (res.success) {
                    saveLoginData(res.user, res.token);

                    Swal.fire({ icon: "success", text: "Login successful!" })
                        .then(() => {
                            if (res.user.role === "Admin") {
                                window.location.href = "admin-dashboard.html";
                            } else {
                                window.location.href = "profile.html";
                            }
                        });
                }
            },
            error: function (xhr) {
                Swal.fire({ icon: "error", text: xhr.responseJSON?.message || "Login failed" });
            }
        });
    });

    // ✅ Initialize profile page only on profile.html
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

                $('#username').text('USER');

                if (authData.userRole === 'Admin') {
                    $('body').addClass('is-admin');
                    console.log("✅ Admin logged in");
                }

                // ✅ Fetch name & profile image
                $.ajax({
                    url: `${url}api/v1/customers/${authData.userId}`,
                    method: 'GET',
                    success: function (res) {
                        if (res.success && res.data) {
                            const data = res.data;
                            const fullName = `${data.fname || ''} ${data.lname || ''}`.trim();
                            $('#username').text(fullName || 'USER');
                            if (data.image_path) {
                                $('.profile-img').attr('src', `/${data.image_path}`);
                            }
                        }
                    },
                    error: function (xhr) {
                        console.warn('Error fetching user data for dropdown:', xhr.responseText);
                    }
                });
            });

            function fetchProfileData() {
                $.ajax({
                    url: `${url}api/v1/customers/${userId}`,
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

            fetchProfileData();

            $('#image').on('change', function () {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        $('#profileImagePreview').attr('src', e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });

            $('#profileForm').on('submit', function (e) {
                e.preventDefault();
                const formData = new FormData(this);

                if (!formData.get('userId')) {
                    formData.set('userId', userId);
                }

                $.ajax({
                    url: `${url}api/v1/update-profile`,
                    method: 'POST',
                    data: formData,
                    contentType: false,
                    processData: false,
                    success: function (response) {
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

    // ✅ Register handler
    $("#register").on('click', function (e) {
        e.preventDefault();

        let fname = $("#fname").val();
        let lname = $("#lname").val();
        let email = $("#email").val();
        let password = $("#password").val();
        let confirmPassword = $("#confirmPassword").val();

        if (password !== confirmPassword) {
            Swal.fire({ icon: "error", text: "Passwords do not match", position: 'bottom-right' });
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
            success: function () {
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
                Swal.fire({ icon: "error", text: msg, position: 'bottom-right' });
            }
        });
    });

    // ✅ Deactivate handler
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
                    headers: { 'Authorization': `Bearer ${authData.token}` },
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
                    error: function () {
                        Swal.fire({ icon: "error", text: "Deactivation failed", position: 'bottom-right' });
                    }
                });
            }
        });
    });

    // ✅ Forgot password
    $('#forgotPasswordLink').on('click', function (e) {
        e.preventDefault();
        const email = $('#loginEmail').val();

        if (!email) {
            Swal.fire({ icon: 'error', text: 'Please enter your email address first' });
            $('#loginEmail').focus();
            return;
        }

        $.ajax({
            method: "POST",
            url: `${url}api/v1/forgot-password`,
            data: JSON.stringify({ email }),
            contentType: 'application/json; charset=utf-8',
            success: function () {
                Swal.fire({
                    icon: 'info',
                    text: 'Password reset instructions have been sent to your email address.',
                    showConfirmButton: true
                });
            },
            error: function (xhr) {
                Swal.fire({
                    icon: 'error',
                    text: xhr.responseJSON?.message || 'Failed to send reset instructions',
                    showConfirmButton: true
                });
            }
        });
    });

    // ✅ LOGOUT HANDLER (FIXED URL)
    $('#logoutBtn').on('click', function (e) {
        e.preventDefault();

        const authData = getToken();
        if (!authData) return;

        Swal.fire({
            title: 'Logout?',
            text: 'You will be logged out of your account.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${url}api/v1/logout`,
                    method: 'POST',
                    data: JSON.stringify({ userId: authData.userId }),
                    contentType: 'application/json; charset=utf-8',
                    success: function () {
                        sessionStorage.clear();
                        localStorage.clear();
                        Swal.fire('Logged out!', 'You have been logged out.', 'success');
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 1000);
                    },
                    error: function () {
                        Swal.fire('Error', 'Logout failed. Try again.', 'error');
                    }
                });
            }
        });
    });
});
