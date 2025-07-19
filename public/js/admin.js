const API_PRODUCTS = "http://localhost:4000/api/v1/products";
const API_USERS = "http://localhost:4000/api/v1/users";
let isEditMode = false;

// ✅ Logout Function
$("#logoutBtn").click(() => {
  Swal.fire({
    icon: "warning",
    title: "Logout?",
    text: "Are you sure you want to log out?",
    showCancelButton: true,
    confirmButtonText: "Yes, Logout",
    cancelButtonText: "Cancel"
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.clear();
      window.location.href = "/login.html";
    }
  });
});

// ✅ SPA Navigation
$(".nav-btn").on("click", function () {
  const page = $(this).data("page");
  loadPage(page);
});

// ✅ Default Page
$(document).ready(() => {
  loadPage("products");
});

// ✅ Load Page
function loadPage(page) {
  $("#main-content").html("<p>Loading...</p>");

  if (page === "products") {
    loadProductsPage();
  } else if (page === "users") {
    loadUsersPage();
  } else if (page === "orders") {
    $("#main-content").html(`
      <h2>Manage Orders</h2>
      <p>Orders table goes here...</p>
    `);
  } else if (page === "reviews") {
    $("#main-content").html(`
      <h2>Customer Reviews</h2>
      <p>Reviews list goes here...</p>
    `);
  } else if (page === "charts") {
    $("#main-content").html(`
      <h2>Charts & Analytics</h2>
      <p>Charts visualization goes here...</p>
    `);
  }
}

/* ------------------- ✅ USERS SECTION ------------------- */
function loadUsersPage() {
  $("#main-content").html(`
    <h2>All Users</h2>
    <table class="table table-bordered table-striped mt-3">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Created At</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="usersBody"></tbody>
    </table>
  `);

  $.get(API_USERS, function (data) {
    if (!data || data.length === 0) {
      $("#usersBody").html("<tr><td colspan='7'>No users found.</td></tr>");
      return;
    }

    data.forEach(user => {
      const statusBtn = user.status === "Active"
        ? `<button class="btn btn-sm btn-danger" onclick="updateUserStatus(${user.id}, 'Deactivated')">Deactivate</button>`
        : `<button class="btn btn-sm btn-success" onclick="updateUserStatus(${user.id}, 'Active')">Activate</button>`;

      $("#usersBody").append(`
        <tr>
          <td>${user.id}</td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>${user.status}</td>
          <td>${new Date(user.created_at).toLocaleString()}</td>
          <td>${statusBtn}</td>
        </tr>
      `);
    });
  });
}

function updateUserStatus(id, newStatus) {
  Swal.fire({
    title: `Change status to ${newStatus}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, update"
  }).then((result) => {
    if (result.isConfirmed) {
      $.ajax({
        url: `${API_USERS}/${id}/status`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({ status: newStatus }),
        success: function () {
          Swal.fire("Updated!", "User status updated.", "success");
          loadUsersPage();
        },
        error: function () {
          Swal.fire("Error", "Failed to update user status.", "error");
        }
      });
    }
  });
}

/* ------------------- ✅ PRODUCTS SECTION ------------------- */
function loadProductsPage() {
  $("#main-content").html(`
    <h2 class="mb-4">All Products</h2>
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
      <tbody id="productsBody"></tbody>
    </table>
    <button class="btn btn-success mt-3" id="openAddModal" data-toggle="modal" data-target="#productModal">
      + Add Product
    </button>

    <!-- ✅ PRODUCT MODAL -->
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

  loadProducts();
  initProductEvents();
}

function loadProducts() {
  $("#productsBody").empty();
  $.get(API_PRODUCTS, function (data) {
    if (!data || data.length === 0) {
      $("#productsBody").append("<tr><td colspan='8'>No products found.</td></tr>");
      return;
    }
    data.forEach(product => {
      $("#productsBody").append(`
        <tr>
          <td>${product.id}</td>
          <td>${product.name}</td>
          <td>${product.description}</td>
          <td>₱${product.price}</td>
          <td>${product.category}</td>
          <td>
            ${product.image
              .split(',')
              .map(img => `<img src="http://localhost:4000/images/${img}" width="50" class="mr-1">`)
              .join('')}
          </td>
          <td>${new Date(product.created_at).toLocaleString()}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="editProduct(${product.id}, '${product.name}', '${product.description}', '${product.price}', '${product.category}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Delete</button>
          </td>
        </tr>
      `);
    });
  });
}

function initProductEvents() {
  $("#openAddModal").on("click", function () {
    isEditMode = false;
    $("#productModalLabel").text("Add New Product");
    $("#saveBtn").text("Save Product").removeClass("btn-primary").addClass("btn-success");
    $("#productForm")[0].reset();
    $("#productId").val("");
  });

  $("#saveBtn").on("click", function () {
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
          loadProducts();
        });
      },
      error: function (xhr) {
        Swal.fire({ icon: "error", title: "Error", text: xhr.responseJSON?.error || "Something went wrong." });
      }
    });
  });
}

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
          loadProducts();
        },
        error: function () {
          Swal.fire("Error", "Failed to delete product.", "error");
        }
      });
    }
  });
}
