const API_PRODUCTS = "http://localhost:4000/api/v1/products";
const API_USERS = "http://localhost:4000/api/v1/users";
const API_ORDERS = "http://localhost:4000/api/v1/orders";

let isEditMode = false;

/* ------------------- ✅ LOGOUT ------------------- */
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
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      window.location.href = "/login.html";
    }
  });
});

/* ------------------- ✅ SPA NAVIGATION ------------------- */
$(".nav-btn").on("click", function () {
  const page = $(this).data("page");
  loadPage(page);
});

/* ✅ Default Page */
$(document).ready(() => {
  loadPage("products");
});

/* ✅ Load Pages */
function loadPage(page) {
  $("#main-content").html("<p>Loading...</p>");

  if (page === "products") {
    loadProductsPage();
  } else if (page === "users") {
    loadUsersPage();
  } else if (page === "orders") {
    loadOrdersPage();
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

/* ------------------- ✅ USERS SECTION (DataTables Version) ------------------- */
function loadUsersPage() {
  $("#main-content").html(`
    <h2>All Users</h2>
    <table id="usersTable" class="table table-bordered table-striped mt-3" style="width:100%">
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
    </table>
  `);

  const token = localStorage.getItem("token");

  $('#usersTable').DataTable({
    destroy: true,
    ajax: {
      url: API_USERS,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      dataSrc: "data"
    },
    columns: [
      { data: "id" },
      { data: "name" },
      { data: "email" },
      {
        data: "role",
        render: (data, type, row) => `
          <select class="form-control form-control-sm user-role" data-id="${row.id}" disabled>
            <option value="User" ${data === "User" ? "selected" : ""}>User</option>
            <option value="Admin" ${data === "Admin" ? "selected" : ""}>Admin</option>
          </select>
        `
      },
      {
        data: "status",
        render: (data, type, row) => `
          <select class="form-control form-control-sm user-status" data-id="${row.id}" disabled>
            <option value="Active" ${data === "Active" ? "selected" : ""}>Active</option>
            <option value="Deactivated" ${data === "Deactivated" ? "selected" : ""}>Deactivated</option>
          </select>
        `
      },
      { data: "created_at", render: data => new Date(data).toLocaleString() },
      {
        data: null,
        render: (data, type, row) =>
          `<button class="btn btn-primary btn-sm edit-user" data-id="${row.id}">Edit</button>`
      }
    ]
  });

  // ✅ Edit or Save User
  $("#usersTable").on("click", ".edit-user", function () {
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
              $("#usersTable").DataTable().ajax.reload();
            },
            error: () => {
              Swal.fire("Error", "Failed to update user.", "error");
            }
          });
        } else {
          $role.prop("disabled", true);
          $status.prop("disabled", true);
          $btn.text("Edit").removeClass("btn-success").addClass("btn-primary");
        }
      });
    }
  });
}

/* ------------------- ✅ ORDERS SECTION (DataTables Version) ------------------- */
/* ------------------- ✅ ORDERS SECTION (Edit First, Then Update) ------------------- */
function loadOrdersPage() {
  $("#main-content").html(`
    <h2 class="mb-4">Manage Orders</h2>
    <table id="ordersTable" class="table table-bordered table-striped mt-3" style="width:100%">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Date Placed</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
    </table>
  `);

  const token = localStorage.getItem("token");

  $('#ordersTable').DataTable({
    destroy: true,
    ajax: {
      url: API_ORDERS,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      dataSrc: "data"
    },
    columns: [
      { data: "orderinfo_id" },
      { data: null, render: (data) => `${data.fname} ${data.lname}` },
      { data: "date_placed", render: data => new Date(data).toLocaleDateString() },
      {
        data: "status",
        render: (data, type, row) => `
          <select class="form-control form-control-sm order-status" data-id="${row.orderinfo_id}" disabled>
            <option value="Pending" ${data === "Pending" ? "selected" : ""}>Pending</option>
            <option value="Shipped" ${data === "Shipped" ? "selected" : ""}>Shipped</option>
            <option value="Delivered" ${data === "Delivered" ? "selected" : ""}>Delivered</option>
            <option value="Cancelled" ${data === "Cancelled" ? "selected" : ""}>Cancelled</option>
          </select>
        `
      },
      {
        data: null,
        render: (data, type, row) =>
          `<button class="btn btn-primary btn-sm edit-order" data-id="${row.orderinfo_id}">Edit</button>`
      }
    ]
  });

  // ✅ Edit → Enable Dropdown → Save
  $("#ordersTable").on("click", ".edit-order", function () {
    const id = $(this).data("id");
    const $btn = $(this);
    const $status = $(`.order-status[data-id="${id}"]`);

    if ($btn.text() === "Edit") {
      // 👉 Enable Edit Mode
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
            success: () => {
              Swal.fire("Updated!", "Order status updated successfully.", "success");
              $("#ordersTable").DataTable().ajax.reload();
            },
            error: () => {
              Swal.fire("Error", "Failed to update order.", "error");
            }
          });
        } else {
          // 👉 Reset to Edit Mode if Cancelled
          $status.prop("disabled", true);
          $btn.text("Edit").removeClass("btn-success").addClass("btn-primary");
        }
      });
    }
  });
}


/* ------------------- ✅ PRODUCTS SECTION (DataTables Version) ------------------- */
function loadProductsPage() {
  $("#main-content").html(`
    <h2 class="mb-4">All Products</h2>
    <table id="productsTable" class="table table-bordered table-striped mt-3" style="width:100%">
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

  loadProductsTable();
  initProductEvents();
}

function loadProductsTable() {
  const token = localStorage.getItem("token");

  $('#productsTable').DataTable({
    destroy: true,
    ajax: {
      url: API_PRODUCTS,
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      dataSrc: ""
    },
    columns: [
      { data: "id" },
      { data: "name" },
      { data: "description" },
      { data: "price", render: data => `₱${data}` },
      { data: "category" },
      {
        data: "image",
        render: (data) =>
          data
            .split(",")
            .map(img => `<img src="http://localhost:4000/images/${img}" width="40" class="mr-1">`)
            .join("")
      },
      { data: "created_at", render: data => new Date(data).toLocaleString() },
      {
        data: null,
        render: (data, type, row) => `
          <button class="btn btn-primary btn-sm edit-product"
            data-id="${row.id}"
            data-name="${row.name}"
            data-description="${row.description}"
            data-price="${row.price}"
            data-category="${row.category}">
            Edit
          </button>
          <button class="btn btn-danger btn-sm delete-product" data-id="${row.id}">Delete</button>
        `
      }
    ]
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

  $("#productsTable").on("click", ".edit-product", function () {
    const btn = $(this).data();
    editProduct(btn.id, btn.name, btn.description, btn.price, btn.category);
  });

  $("#productsTable").on("click", ".delete-product", function () {
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
          $('#productsTable').DataTable().ajax.reload();
        });
      },
      error: function (xhr) {
        Swal.fire({ icon: "error", title: "Error", text: xhr.responseJSON?.error || "Something went wrong." });
      }
    });
  });
}

/* ------------------- ✅ Product Utility Functions ------------------- */
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
          $('#productsTable').DataTable().ajax.reload();
        },
        error: function () {
          Swal.fire("Error", "Failed to delete product.", "error");
        }
      });
    }
  });
}
