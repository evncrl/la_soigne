const API_BASE_URL = 'http://localhost:4000/api/v1/';
const API_PRODUCTS = "http://localhost:4000/api/v1/products";
const API_USERS = "http://localhost:4000/api/v1/users";
const API_ORDERS = "http://localhost:4000/api/v1/orders";
const API_REVIEWS = "http://localhost:4000/api/v1/reviews/admin/all";
const API_AUTH_CHECK = "http://localhost:4000/api/auth/admin-check";

let isEditMode = false;
/* ------------------- IMPROVED ADMIN AUTHORIZATION CHECK ------------------- */
function checkAdminAuthorization() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  // Immediate redirect if no token
  if (!token || !userId) {
    showAuthError("Please login to access the admin dashboard");
    return;
  }

  // First verify token validity
  verifyToken(token).then(isValid => {
    if (!isValid) {
      showAuthError("Session expired - please login again");
      return;
    }

    // Then verify admin status
    verifyAdminStatus(token, userId);
  });
}

function verifyToken(token) {
  return new Promise((resolve) => {
    $.ajax({
      url: `http://localhost:4000/api/auth/admin-check`,
      method: "GET",
      headers: { 'Authorization': `Bearer ${token}` },
      success: () => resolve(true),
      error: () => resolve(false)
    });
  });
}

function verifyAdminStatus(token, userId) {
  $.ajax({
    url: `${API_USERS}/${userId}`,
    method: "GET",
    headers: { 'Authorization': `Bearer ${token}` },
    success: function (user) {
      if (user.role === 'Admin') {
        loadPage("products");
      } else {
        showAuthError("Administrator privileges required");
      }
    },
    error: function (xhr) {
      const errorMessage = xhr.status === 403
        ? "Administrator access required"
        : "Unable to verify admin status";
      showAuthError(errorMessage);
    }
  });
}
/* -------------------  AUTH ERROR HANDLER ------------------- */
function showAuthError(message) {
  Swal.fire({
    icon: 'error',
    title: 'Access Denied',
    text: message,
    confirmButtonText: 'Go to Login',
    allowOutsideClick: false
  }).then(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    window.location.href = "/login.html";
  });
}

/* -------------------  LOGOUT ------------------- */
$("#logoutBtn").click(() => {
  Swal.fire({
    icon: "warning",
    title: "Logout?",
    title: "Logout Confirmation",
    text: "Are you sure you want to log out?",
    showCancelButton: true,
    confirmButtonText: "Yes, Logout",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#d33"
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      window.location.href = "/login.html";
    }
  });
});

/* -------------------  SPA NAVIGATION ------------------- */
$(".nav-btn").on("click", function () {
  const page = $(this).data("page");
  loadPage(page);
});

$(document).ready(() => {
  checkAdminAuthorization();
});

/*  Default Page */
$(document).ready(() => {
  loadPage("products");
});

/*  Load Pages */
function loadPage(page) {
  $("#main-content").html("<p>Loading...</p>");

  if (page === "products") {
    loadProductsPage();
  } else if (page === "users") {
    loadUsersPage();
  } else if (page === "orders") {
    loadOrdersPage();
  } else if (page === "reviews") {
    loadReviewsPage();
  } else if (page === "charts") {
    loadChartsPage();
  }
}

/* -------------------  USERS SECTION (DataTables Version) ------------------- */
function loadUsersPage() {
  $("#main-content").html(`
    <h2>All Users</h2>
    <div class="table-responsive">
      <table class="table table-bordered table-striped mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="usersTableBody"></tbody>
      </table>
    </div>
    <div id="user-loader" class="text-center my-3" style="display:none;">
      <span>Loading more users...</span>
    </div>
  `);

  const token = localStorage.getItem("token");
  let page = 1;
  const limit = 10;
  let hasMore = true;
  let isLoading = false;

  function loadUsers() {
    if (!hasMore || isLoading) return;
    isLoading = true;
    $("#user-loader").show();

    $.ajax({
      url: `${API_USERS}?page=${page}&limit=${limit}`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      success: function (res) {
        res.data.forEach(user => {
          $("#usersTableBody").append(`
            <tr>
              <td>${user.id}</td>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>
                <select class="form-control form-control-sm user-role" data-id="${user.id}" disabled>
                  <option value="User" ${user.role === "User" ? "selected" : ""}>User</option>
                  <option value="Admin" ${user.role === "Admin" ? "selected" : ""}>Admin</option>
                </select>
              </td>
              <td>
                <select class="form-control form-control-sm user-status" data-id="${user.id}" disabled>
                  <option value="Active" ${user.status === "Active" ? "selected" : ""}>Active</option>
                  <option value="Deactivated" ${user.status === "Deactivated" ? "selected" : ""}>Deactivated</option>
                </select>
              </td>
              <td>${new Date(user.created_at).toLocaleString()}</td>
              <td>
                <button class="btn btn-primary btn-sm edit-user" data-id="${user.id}">Edit</button>
              </td>
            </tr>
          `);
        });

        hasMore = res.hasMore;
        page++;
        isLoading = false;
        $("#user-loader").hide();
      },
      error: function () {
        $("#user-loader").hide();
        isLoading = false;
        Swal.fire("Error", "Failed to load users.", "error");
      }
    });
  }

  // Initial load
  loadUsers();

  // Infinite scroll listener
  $("#main-content").off("scroll").on("scroll", function () {
    const scrollTop = $(this).scrollTop();
    const innerHeight = $(this).innerHeight();
    const scrollHeight = this.scrollHeight;

    if (scrollTop + innerHeight >= scrollHeight - 50) {
      loadUsers();
    }
  });

  //  Edit or Save User (unchanged logic)
  $("#main-content").off("click", ".edit-user").on("click", ".edit-user", function () {
    const id = $(this).data("id");
    const $btn = $(this);
    const $role = $(`.user-role[data-id="${id}"]`);
    const $status = $(`.user-status[data-id="${id}"]`);

    if ($btn.text() === "Edit") {
      $btn.text("Save").removeClass("btn-primary").addClass("btn-success");
      $role.prop("disabled", false);
      $status.prop("disabled", false);
    } else {
      const role = $role.val();
      const status = $status.val();

      Swal.fire({
        title: "Update User?",
        text: `Role: ${role}, Status: ${status}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, update"
      }).then((result) => {
        if (result.isConfirmed) {
          $.ajax({
            url: `${API_USERS}/${id}/update`,
            method: "PUT",
            contentType: "application/json",
            data: JSON.stringify({ role, status }),
            success: () => {
              Swal.fire("Updated!", "User updated successfully.", "success");
              $btn.text("Edit").removeClass("btn-success").addClass("btn-primary");
              $role.prop("disabled", true);
              $status.prop("disabled", true);
            },
            error: () => {
              Swal.fire("Error", "Failed to update user.", "error");
            }
          });
        } else {
          $btn.text("Edit").removeClass("btn-success").addClass("btn-primary");
          $role.prop("disabled", true);
          $status.prop("disabled", true);
        }
      });
    }
  });
}


/* -------------------  ORDERS SECTION (DataTables Version) ------------------- */
function loadOrdersPage() {
  $("#main-content").html(`
    <h2 class="mb-4">Manage Orders</h2>
    <table class="table table-bordered table-striped mt-3" style="width:100%">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Date Placed</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="ordersBody"></tbody>
    </table>
    <div id="loading" class="text-center my-3" style="display:none;">Loading more orders...</div>
  `);

  let offset = 0;
  const limit = 10;
  let loading = false;
  let allLoaded = false;
  const token = localStorage.getItem("token");

  function fetchOrders() {
    if (loading || allLoaded) return;
    loading = true;
    $("#loading").show();

    $.ajax({
      url: `${API_ORDERS}?offset=${offset}&limit=${limit}`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      success: (res) => {
        const orders = res.data;
        if (orders.length === 0) {
          allLoaded = true;
          $("#loading").text("No more orders.");
          return;
        }

        orders.forEach((order) => {
          const date = new Date(order.date_placed);
          const dateStr = isNaN(date) ? order.date_placed.split("T")[0] : date.toLocaleDateString();

          const row = `
            <tr>
              <td>${order.orderinfo_id}</td>
              <td>${order.fname} ${order.lname}</td>
              <td>${dateStr}</td>
              <td>
                <select class="form-control form-control-sm order-status" data-id="${order.orderinfo_id}" disabled>
                  <option value="Pending" ${order.status === "Pending" ? "selected" : ""}>Pending</option>
                  <option value="Shipped" ${order.status === "Shipped" ? "selected" : ""}>Shipped</option>
                  <option value="Delivered" ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
                  <option value="Cancelled" ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
                </select>
              </td>
              <td>
                <button class="btn btn-primary btn-sm edit-order" data-id="${order.orderinfo_id}">Edit</button>
              </td>
            </tr>
          `;
          $("#ordersBody").append(row);
        });

        offset += limit;
        loading = false;
        $("#loading").hide();
      },
      error: () => {
        loading = false;
        $("#loading").hide();
        Swal.fire("Error", "Failed to load orders.", "error");
      }
    });
  }

  // Initial fetch
  fetchOrders();

  // Infinite scroll listener
  $(window).off("scroll").on("scroll", function () {
    if ($(window).scrollTop() + $(window).height() >= $(document).height() - 100) {
      fetchOrders();
    }
  });

  // Edit/Save handler
  $("#main-content").on("click", ".edit-order", function () {
    const id = $(this).data("id");
    const $btn = $(this);
    const $status = $(`.order-status[data-id="${id}"]`);

    if ($btn.text() === "Edit") {
      $btn.text("Save").removeClass("btn-primary").addClass("btn-success");
      $status.prop("disabled", false);
    } else {
      const status = $status.val();

      Swal.fire({
        title: "Update Order Status?",
        text: `Set order #${id} to ${status}`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, update"
      }).then((result) => {
        if (result.isConfirmed) {
          $.ajax({
            url: `${API_ORDERS}/${id}/status`,
            method: "PUT",
            contentType: "application/json",
            data: JSON.stringify({ status }),
            headers: { Authorization: `Bearer ${token}` },
            success: () => {
              Swal.fire("Updated!", "Order status updated.", "success");
              $status.prop("disabled", true);
              $btn.text("Edit").removeClass("btn-success").addClass("btn-primary");
            },
            error: () => {
              Swal.fire("Error", "Failed to update order.", "error");
            }
          });
        }
      });
    }
  });
}



/* -------------------  PRODUCTS SECTION (Infinite Scroll Version) ------------------- */
function loadProductsPage() {
  $("#main-content").html(`
    <h2 class="mb-4">All Products</h2>
    <div class="table-responsive">
      <table class="table table-bordered table-striped mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Category</th>
            <th>Image</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="productsTableBody"></tbody>
      </table>
    </div>
    <div id="product-loader" class="text-center my-3" style="display:none;">
      <span>Loading more products...</span>
    </div>

    <button class="btn btn-success mt-3" id="openAddModal" data-toggle="modal" data-target="#productModal">
      + Add Product
    </button>

    <!--  PRODUCT MODAL -->
    <div class="modal fade" id="productModal" tabindex="-1" aria-labelledby="productModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="productModalLabel">Add New Product</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form id="productForm" enctype="multipart/form-data">
              <input type="hidden" id="productId" />
              <div class="form-group">
                <label for="name">Product Name</label>
                <input type="text" class="form-control" id="name" />
                <div class="text-danger small mt-1" id="nameError"></div>
              </div>
              <div class="form-group">
                <label for="description">Description</label>
                <textarea class="form-control" id="description" rows="3"></textarea>
                <div class="text-danger small mt-1" id="descriptionError"></div>
              </div>
              <div class="form-group">
                <label for="price">Price (₱)</label>
                <input type="number" class="form-control" id="price" />
                <div class="text-danger small mt-1" id="priceError"></div>
              </div>
              <div class="form-group">
                <label for="category">Category</label>
                <select class="form-control" id="category">
                  <option value="">Select a category</option>
                  <option value="Shirt">Shirt</option>
                  <option value="Bottoms">Bottoms</option>
                  <option value="Accessories">Accessories</option>
                </select>
                <div class="text-danger small mt-1" id="categoryError"></div>
              </div>
              <div class="form-group">
                <label for="images">Upload Product Images</label>
                <input type="file" class="form-control" id="images" name="images" multiple />
                <div class="text-danger small mt-1" id="imagesError"></div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
            <button type="button" class="btn btn-success" id="saveBtn">Save Product</button>
          </div>
        </div>
      </div>
    </div>
  `);

  const token = localStorage.getItem("token");
  let page = 1;
  const limit = 10;
  let hasMore = true;
  let isLoading = false;

  function loadProducts() {
    if (!hasMore || isLoading) return;
    isLoading = true;
    $("#product-loader").show();

    $.ajax({
      url: `${API_PRODUCTS}?page=${page}&limit=${limit}`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      success: function (products) {
        if (products.length < limit) hasMore = false;
        products.forEach(product => {
          const imagesHtml = product.image
            .split(",")
            .map(img => `<img src="http://localhost:4000/images/${img}" width="40" class="mr-1">`)
            .join("");

          $("#productsTableBody").append(`
            <tr>
              <td>${product.id}</td>
              <td>${product.name}</td>
              <td>${product.description}</td>
              <td>₱${product.price}</td>
              <td>${product.category}</td>
              <td>${imagesHtml}</td>
              <td>${new Date(product.created_at).toLocaleString()}</td>
              <td>
                <button class="btn btn-primary btn-sm edit-product"
                  data-id="${product.id}"
                  data-name="${product.name}"
                  data-description="${product.description}"
                  data-price="${product.price}"
                  data-category="${product.category}">
                  Edit
                </button>
                <button class="btn btn-danger btn-sm delete-product" data-id="${product.id}">Delete</button>
              </td>
            </tr>
          `);
        });
        page++;
        isLoading = false;
        $("#product-loader").hide();
      },
      error: function () {
        $("#product-loader").hide();
        isLoading = false;
        Swal.fire("Error", "Failed to load products.", "error");
      }
    });
  }

  // Initial load
  loadProducts();

  // Infinite scroll listener
  $("#main-content").off("scroll").on("scroll", function () {
    const scrollTop = $(this).scrollTop();
    const innerHeight = $(this).innerHeight();
    const scrollHeight = this.scrollHeight;

    if (scrollTop + innerHeight >= scrollHeight - 50) {
      loadProducts();
    }
  });

  initProductEvents();
}

/* -------------------  EVENTS + UTIL ------------------- */
function initProductEvents() {
  $("#openAddModal").on("click", function () {
    isEditMode = false;
    $("#productModalLabel").text("Add New Product");
    $("#saveBtn").text("Save Product").removeClass("btn-primary").addClass("btn-success");
    $("#productForm")[0].reset();
    $("#productId").val("");
  });

  $("#main-content").on("click", ".edit-product", function () {
    const btn = $(this).data();
    editProduct(btn.id, btn.name, btn.description, btn.price, btn.category);
  });

  $("#main-content").on("click", ".delete-product", function () {
    deleteProduct($(this).data("id"));
  });

  $("#saveBtn").off("click").on("click", function () {
    if (!validateFields()) {
      Swal.fire({ icon: "warning", title: "Please correct all fields before submitting." });
      return;
    }

    const formData = new FormData();
    formData.append("name", $("#name").val().trim());
    formData.append("description", $("#description").val().trim());
    formData.append("price", $("#price").val().trim());
    formData.append("category", $("#category").val().trim());
    const files = $("#images")[0].files;
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }

    const productId = $("#productId").val();
    const method = isEditMode ? "PUT" : "POST";
    const url = isEditMode ? `${API_PRODUCTS}/${productId}` : API_PRODUCTS;

    $.ajax({
      method: method,
      url: url,
      data: formData,
      processData: false,
      contentType: false,
      success: function (res) {
        Swal.fire({
          icon: "success",
          title: isEditMode ? "Product Updated" : "Product Created",
          text: res.message || "Success!"
        }).then(() => {
          $("#productForm")[0].reset();
          $("#productModal").modal("hide");
          $("#productsTableBody").empty();
          resetProductPaginationAndLoad(); // reload all
        });
      },
      error: function (xhr) {
        Swal.fire({ icon: "error", title: "Error", text: xhr.responseJSON?.error || "Something went wrong." });
      }
    });
  });
}

// Reset & load again after create/update
function resetProductPaginationAndLoad() {
  page = 1;
  hasMore = true;
  isLoading = false;
  $("#productsTableBody").empty();
  loadProducts();
}

// Form validation
function validateFields() {
  let valid = true;
  function showError(id, message) {
    $(`#${id}Error`).text(message);
    if (message) valid = false;
  }
  showError("name", $("#name").val().trim().length < 2 ? "Minimum 2 characters required" : "");
  showError("description", $("#description").val().trim().length < 5 ? "Minimum 5 characters required" : "");
  showError("price", ($("#price").val() <= 0 || isNaN($("#price").val())) ? "Enter a valid price" : "");
  showError("category", $("#category").val() === "" ? "Please select a category" : "");
  if (!isEditMode) {
    showError("images", $("#images")[0].files.length === 0 ? "At least one image is required" : "");
  } else {
    $("#imagesError").text("");
  }
  return valid;
}

function editProduct(id, name, description, price, category) {
  isEditMode = true;
  $("#productModalLabel").text("Edit Product");
  $("#saveBtn").text("Update Product").removeClass("btn-success").addClass("btn-primary");
  $("#productId").val(id);
  $("#name").val(name);
  $("#description").val(description);
  $("#price").val(price);
  $("#category").val(category);
  $("#images").val("");
  $("#productModal").modal("show");
}

function deleteProduct(id) {
  Swal.fire({
    title: "Are you sure?",
    text: "This product will be deleted permanently!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!"
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        method: "DELETE",
        url: `${API_PRODUCTS}/${id}`,
        success: function () {
          Swal.fire("Deleted!", "Product has been deleted.", "success");
          $("#productsTableBody").empty();
          resetProductPaginationAndLoad();
        },
        error: function () {
          Swal.fire("Error", "Failed to delete product.", "error");
        }
      });
    }
  });
}


/* -------------------  REVIEWS SECTION (DataTables Version) ------------------- */
function loadReviewsPage() {
  const API_BASE_URL = 'http://localhost:4000/api/v1/';
  const API_REVIEWS = `${API_BASE_URL}reviews/admin/all`;
  const token = localStorage.getItem("token");
  let offset = 0;
  const limit = 10;
  let isLoading = false;
  let allLoaded = false;

  $("#main-content").html(`
    <h2 class="mb-4">Customer Reviews</h2>
    <div id="reviewsList" class="table-responsive">
      <table class="table table-bordered table-striped">
        <thead>
          <tr>
            <th>Review ID</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Rating</th>
            <th>Review</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="reviewsBody"></tbody>
      </table>
    </div>
    <div id="loading" class="text-center my-3" style="display:none;">
      <div class="spinner-border text-primary" role="status"></div>
    </div>
    <div id="endOfReviews" class="text-center text-muted my-3" style="display:none;">
      <small>No more reviews to load.</small>
    </div>
  `);

  function loadMoreReviews() {
    if (isLoading || allLoaded) return;
    isLoading = true;
    $("#loading").show();

    $.ajax({
      url: `${API_REVIEWS}?offset=${offset}&limit=${limit}`,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      success: function (res) {
        const reviews = res.data;
        if (!reviews.length) {
          allLoaded = true;
          $("#endOfReviews").show();
          return;
        }

        reviews.forEach(r => {
          const filled = '⭐'.repeat(r.rating);
          const empty = '☆'.repeat(5 - r.rating);
          const row = `
            <tr>
              <td>${r.review_id}</td>
              <td>${r.customer_fname} ${r.customer_lname}</td>
              <td>${r.product_name}</td>
              <td><span style="color:gold; font-size:16px;">${filled}${empty}</span></td>
              <td>${r.review_text || "<i>No comment</i>"}</td>
              <td>${new Date(r.created_at).toLocaleString()}</td>
              <td>
                <button class="btn btn-sm btn-danger delete-review-btn" data-id="${r.review_id}">
                  <i class="bi bi-trash"></i> Delete
                </button>
              </td>
            </tr>
          `;
          $("#reviewsBody").append(row);
        });

        offset += limit;
      },
      error: function (err) {
        console.error(err);
        Swal.fire("Error", err.responseJSON?.message || "Failed to load reviews.", "error");
      },
      complete: function () {
        isLoading = false;
        $("#loading").hide();
      }
    });
  }

  //  Initial load
  loadMoreReviews();

  //  Infinite scroll trigger
  $('#main-content').off('scroll').on('scroll', function () {
    const container = $(this);
    if (container.scrollTop() + container.innerHeight() >= container[0].scrollHeight - 10) {
      loadMoreReviews();
    }
  });

  //  Handle delete review
  $('#main-content').off('click', '.delete-review-btn').on('click', '.delete-review-btn', function () {
    const reviewId = $(this).data('id');
    Swal.fire({
      title: 'Are you sure?',
      text: "This review will be permanently deleted.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `${API_BASE_URL}reviews/${reviewId}`,
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          },
          success: function (res) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: res.message || 'Review deleted successfully.',
              timer: 2000,
              showConfirmButton: false
            });

            // Optional: Reload all reviews
            offset = 0;
            allLoaded = false;
            $("#reviewsBody").empty();
            loadMoreReviews();
          },
          error: function (err) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.responseJSON?.message || 'Something went wrong.'
            });
          }
        });
      }
    });
  });
}
