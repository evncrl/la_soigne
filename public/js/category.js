$(document).ready(function () {
    const url = 'http://localhost:4000/'

    // Initialize Categories DataTable
    $('#ctable').DataTable({
        ajax: {
            url: `${url}api/v1/categories`,
            dataSrc: "rows",
            // headers: {
            //     "Authorization": "Bearer " + access_token 
            // },
        },
        dom: 'Bfrtip',
        buttons: [
            'pdf',
            'excel',
            {
                text: 'Add Category',
                className: 'btn btn-primary',
                action: function (e, dt, node, config) {
                    $("#cform").trigger("reset");
                    $('#categoryModal').modal('show');
                    $('#categoryUpdate').hide();
                    $('#categorySubmit').show();
                }
            }
        ],
        columns: [
            { data: 'category_id' },
            { data: 'description' },
            {
                 data: null,
    render: function (data, type, row) {
        let btns = `<a href='#' class='editCategoryBtn' data-id="${data.category_id}"><i class='fas fa-edit' aria-hidden='true' style='font-size:24px'></i></a>
                    <a href='#' class='deleteCategoryBtn' data-id="${data.category_id}"><i class='fas fa-trash-alt' style='font-size:24px; color:red'></i></a>`;
        // If category is soft deleted, show unarchive button
        if (data.deleted_at) {
            btns += ` <a href='#' class='unarchiveCategoryBtn' data-id="${data.category_id}"><i class='fas fa-undo' style='font-size:24px; color:green'></i></a>`;
        }
        return btns;
    }
},
        ],
    });


    $('[data-target="#categoryModal"]').on('click', function () {
        $("#cform").trigger("reset");
        $('#categoryModal').modal('show');
        $('#categoryUpdate').hide();
        $('#categorySubmit').show();
        $('#categoryId').remove();
        $('#category_description').text('');
    });


    // Submit new category
    $("#categorySubmit").on('click', function (e) {
        e.preventDefault();
        let formData = {
            description: $('#category_description').val()
        };

        $.ajax({
            method: "POST",
            url: `${url}api/v1/categories`,
            data: JSON.stringify(formData),
            contentType: "application/json",
            dataType: "json",
            success: function (data) {
                console.log(data);
                $("#categoryModal").modal("hide");
                var $itable = $('#ctable').DataTable();
                $itable.ajax.reload()
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    // Edit category
    $('#ctable tbody').on('click', 'a.editCategoryBtn', function (e) {
        e.preventDefault();
        $('#categoryId').remove();
        $("#cform").trigger("reset");

        var id = $(this).data('id');
        console.log(id);
        $('#categoryModal').modal('show');
        $('<input>').attr({ type: 'hidden', id: 'categoryId', name: 'category_id', value: id }).appendTo('#cform');

        $('#categorySubmit').hide();
        $('#categoryUpdate').show();

        $.ajax({
            method: "GET",
            url: `${url}api/v1/categories/${id}`,
            dataType: "json",
            success: function (data) {
                const { result } = data;
                console.log(result);
                $('#category_description').val(result[0].description);
            },
            error: function (xhr, status, error) {
                console.log(xhr.responseJSON);
                bootbox.alert("Error loading category data.");
            }
        });
    });

    $("#categoryUpdate").on('click', function (e) {
        e.preventDefault();
        var id = $('#categoryId').val();
        console.log(id);
        var table = $('#ctable').DataTable();

        var formData = {
            description: $('#category_description').val()
        };

        // Validate description
        if (!formData.description || formData.description.trim() === '') {
            bootbox.alert("Please enter a category description.");
            return;
        }

        $.ajax({
            method: "PUT",
            url: `${url}api/v1/categories/${id}`,
            data: JSON.stringify(formData),
            contentType: "application/json",
            dataType: "json",
            success: function (data) {
                console.log(data);
                $('#categoryModal').modal("hide");
                table.ajax.reload();
                bootbox.alert("Category updated successfully!");
            },
            error: function (xhr, status, error) {
                console.log(xhr.responseJSON);
                let errorMessage = "Error updating category. Please try again.";
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage = xhr.responseJSON.error;
                }
                bootbox.alert(errorMessage);
            }
        });
    });

    
    // Delete category
    $('#ctable tbody').on('click', 'a.deleteCategoryBtn', function (e) {
        e.preventDefault();
        var table = $('#ctable').DataTable();
        var id = $(this).data('id');
        var $row = $(this).closest('tr');
        console.log(id);

        bootbox.confirm({
            message: "Are you sure you want to delete this category? This action cannot be undone.",
            buttons: {
                confirm: {
                    label: 'Yes',
                    className: 'btn-success'
                },
                cancel: {
                    label: 'No',
                    className: 'btn-danger'
                }
            },
            callback: function (result) {
                console.log(result);
                if (result) {
                    $.ajax({
                        method: "DELETE",
                        url: `${url}api/v1/categories/${id}`,
                        dataType: "json",
                        success: function (data) {
                            console.log(data);
                            table.ajax.reload();

                            bootbox.alert(data.message || "Category deleted successfully!");
                        },
                        error: function (xhr, status, error) {
                            console.log(xhr.responseJSON);
                            let errorMessage = "Error deleting category. Please try again.";
                            if (xhr.responseJSON && xhr.responseJSON.error) {
                                errorMessage = xhr.responseJSON.error;
                            }
                            bootbox.alert(errorMessage);
                        }
                    });
                }
            }
        });
    });
});