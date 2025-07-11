$(document).ready(function () {
    const url = 'http://localhost:4000/';
    const imageBasePath = '/js/images/';  // Base path for images
    const imagePath = `${url}images/`;  // Full path for images

    // Load categories when page loads
    loadCategories();

    $('#itable').DataTable({
        ajax: {
            url: `${url}api/v1/items`,
            dataSrc: function (json) {
                // Check if response has expected structure
                if (json && (json.rows || json.data)) {
                    return json.rows || json.data;
                }
                console.error('Unexpected response structure:', json);
                Swal.fire({
                    icon: 'error',
                    title: 'Data Error',
                    text: 'Unexpected data format from server'
                });
                return [];
            },
            error: function(xhr, error, thrown) {
                console.error('DataTable load error:', xhr.responseText);
                Swal.fire({
                    icon: 'error',
                    title: 'Error loading items',
                    text: 'Failed to load items data'
                });
            }
        },
        dom: 'Bfrtip',
        buttons: [
            'pdf',
            'excel',
            {
                text: 'Add item',
                className: 'btn btn-primary',
                action: function () {
                    $("#iform").trigger("reset");
                    $('#itemModal').modal('show');
                    $('#itemUpdate').hide();
                    $('#itemSubmit').show();
                    $('#itemImage').remove();
                    $('#category').val('').trigger('change');
                }
            }
        ],
        columns: [
            { data: 'item_id' },
            {
                data: 'image',
                render: function (image) {
                    if (!image) {
                        return `<img src="${imageBasePath}default.jpg" width="50" height="60">`;
                    }
                    return `<img src="${imageBasePath}${image}" width="50" height="60" onerror="this.src='${imageBasePath}default.jpg'">`;
                }
            },
            { data: 'item_name' },
            { data: 'description' },
            { 
                data: 'cost_price',
                render: function(data) {
                    return parseFloat(data).toFixed(2);
                }
            },
            { 
                data: 'sell_price',
                render: function(data) {
                    return parseFloat(data).toFixed(2);
                }
            },
            { data: 'category' },
            { data: 'quantity' },
            {
                data: null,
                render: function (data) {
                    return `<a href='#' class='editBtn' data-id="${data.item_id}"><i class='fas fa-edit' style='font-size:24px'></i></a>
                            <a href='#' class='deletebtn' data-id="${data.item_id}"><i class='fas fa-trash-alt' style='font-size:24px; color:red'></i></a>`;
                }
            }
        ],
    });

    function loadCategories() {
        return new Promise((resolve, reject) => {
            $.ajax({
                method: "GET",
                url: `${url}api/v1/categories`,
                dataType: "json",
                success: function (response) {
                    const categorySelect = $('#category');
                    categorySelect.empty().append('<option value="">Select a category</option>');

                    if (response.rows && response.rows.length > 0) {
                        response.rows.forEach(function (category) {
                            categorySelect.append(
                                `<option value="${category.category_id}">
                                    ${category.description}
                                </option>`
                            );
                        });
                        resolve();
                    } else {
                        console.error('No categories found in response:', response);
                        reject('No categories found');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Category load error:', xhr.responseText);
                    $('#category').html('<option value="">Error loading categories</option>');
                    reject(error);
                }
            });
        });
    }

    $('#category').on('change', function () {
        const selectedOption = $(this).find('option:selected');
        const description = selectedOption.text();
        $('#category-description').text(description ? `Category: ${description}` : '');
    });

    $('[data-target="#itemModal"]').on('click', function () {
        $("#iform").trigger("reset");
        $('#itemModal').modal('show');
        $('#itemUpdate').hide();
        $('#itemSubmit').show();
        $('#itemImage').remove();
        $('#itemId').remove();
        $('#category-description').text('');
    });

    $("#itemSubmit").on('click', function (e) {
        e.preventDefault();
        let formData = new FormData($('#iform')[0]);

        // Validate required fields
        if (!$('#item_name').val() || !$('#category').val() || !$('#cost_price').val() || !$('#sell_price').val()) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please fill all required fields'
            });
            return;
        }

        $.ajax({
            method: "POST",
            url: `${url}api/v1/items`,
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                // Ensure response is properly parsed
                let responseData = typeof response === 'string' ? JSON.parse(response) : response;
                
                if (responseData && responseData.success) {
                    $("#itemModal").modal("hide");
                    $('#itable').DataTable().ajax.reload();

                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: responseData.message || 'Item added successfully',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: responseData?.message || 'Operation failed without error message'
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error("Add item error:", xhr.responseText);
                let message = 'Failed to add item';
                
                try {
                    const response = xhr.responseJSON || JSON.parse(xhr.responseText);
                    message = response.message || message;
                } catch (e) {
                    console.error("Error parsing response:", e);
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: message
                });
            }
        });
    });

    $('#itable tbody').on('click', 'a.editBtn', function (e) {
        e.preventDefault();
        $('#itemImage').remove();
        $('#itemId').remove();
        $("#iform").trigger("reset");

        var id = $(this).data('id');
        $('#itemModal').modal('show');
        $('<input>').attr({ type: 'hidden', id: 'itemId', name: 'item_id', value: id }).appendTo('#iform');
        $('#itemSubmit').hide();
        $('#itemUpdate').show();

        $.ajax({
            method: "GET",
            url: `${url}api/v1/items/${id}`,
            dataType: "json",
            success: function (response) {
                if (response && response.result && response.result.length > 0) {
                    const item = response.result[0];
                    loadCategories().then(() => {
                        $('#item_name').val(item.item_name);
                        $('#description').val(item.description);
                        $('#sell_price').val(item.sell_price);
                        $('#cost_price').val(item.cost_price);
                        $('#quantity').val(item.quantity);
                        $('#category').val(item.category_id || item.category).trigger('change');

                        if (item.image) {
                            $("#iform").append(`<img src="${imageBasePath}${item.image}" width='200px' height='200px' id="itemImage" onerror="this.src='${imageBasePath}default.jpg'"/>`);
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response?.message || 'Item not found'
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error("Edit item error:", xhr.responseText);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load item details'
                });
            }
        });
    });

    $("#itemUpdate").on('click', function (e) {
        e.preventDefault();
        var id = $('#itemId').val();
        let formData = new FormData($('#iform')[0]);

        // Validate required fields
        if (!$('#item_name').val() || !$('#category').val() || !$('#cost_price').val() || !$('#sell_price').val()) {
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                text: 'Please fill all required fields'
            });
            return;
        }

        $.ajax({
            method: "PUT",
            url: `${url}api/v1/items/${id}`,
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                // Ensure response is properly parsed
                let responseData = typeof response === 'string' ? JSON.parse(response) : response;
                
                if (responseData && responseData.success) {
                    $('#itemModal').modal("hide");
                    $('#itable').DataTable().ajax.reload();

                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: responseData.message || 'Item updated successfully',
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: responseData?.message || 'Operation failed without error message'
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error("Update error:", xhr.responseText);
                let message = 'Failed to update item';
                
                try {
                    const response = xhr.responseJSON || JSON.parse(xhr.responseText);
                    message = response.message || message;
                } catch (e) {
                    console.error("Error parsing response:", e);
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: message
                });
            }
        });
    });

    $('#itable tbody').on('click', 'a.deletebtn', function (e) {
        e.preventDefault();
        var table = $('#itable').DataTable();
        var id = $(this).data('id');
        var $row = $(this).closest('tr');

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: "DELETE",
                    url: `${url}api/v1/items/${id}`,
                    dataType: "json",
                    success: function (response) {
                        // Ensure response is properly parsed
                        let responseData = typeof response === 'string' ? JSON.parse(response) : response;
                        
                        if (responseData && responseData.success) {
                            table.row($row).remove().draw();

                            Swal.fire({
                                icon: 'success',
                                title: 'Deleted!',
                                text: responseData.message || 'Item has been deleted',
                                timer: 1500,
                                showConfirmButton: false
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: responseData?.message || 'Operation failed without error message'
                            });
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error("Delete error:", xhr.responseText);
                        let message = 'Failed to delete item';
                        
                        try {
                            const response = xhr.responseJSON || JSON.parse(xhr.responseText);
                            message = response.message || message;
                        } catch (e) {
                            console.error("Error parsing response:", e);
                        }

                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: message
                        });
                    }
                });
            }
        });
    });
});