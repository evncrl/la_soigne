$(document).ready(function () {
    const url = 'http://localhost:4000/'

    // Load categories when page loads
    loadCategories();

    $('#itable').DataTable({
        ajax: {
            url: `${url}api/v1/items`,
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
                text: 'Add item',
                className: 'btn btn-primary',
                action: function (e, dt, node, config) {
                    $("#iform").trigger("reset");
                    $('#itemModal').modal('show');
                    $('#itemUpdate').hide();
                    $('#itemSubmit').show();
                    $('#itemImage').remove()
                }
            }
        ],
        columns: [
            { data: 'item_id' },
            {
                data: null,
                render: function (data, type, row) {
                    return `<img src="${url}${data.image}" width="50" height="60">`;
                }
            },
            { data: 'item_name' },
            { data: 'description' },
            { data: 'cost_price' },
            { data: 'sell_price' },
            { data: 'category' },
            { data: 'quantity' },
            {
                data: null,
                render: function (data, type, row) {
                    return "<a href='#' class = 'editBtn' id='editbtn' data-id=" + data.item_id + "><i class='fas fa-edit' aria-hidden='true' style='font-size:24px' ></i></a><a href='#'  class='deletebtn' data-id=" + data.item_id + "><i  class='fas fa-trash-alt' style='font-size:24px; color:red' ></a></i>";
                }
            }
        ],
    });

    // Function to load categories into dropdown
    function loadCategories() {
        return new Promise((resolve, reject) => {
            $.ajax({
                method: "GET",
                url: `${url}api/v1/categories`,
                dataType: "json",
                success: function (data) {
                    const categorySelect = $('#category');
                    categorySelect.empty();
                    categorySelect.append('<option value="">Select a category</option>');

                    if (data.rows && data.rows.length > 0) {
                        data.rows.forEach(function (category) {
                            categorySelect.append(
                                `<option value="${category.category_id}" data-description="${category.description}">
                                ${category.description}
                            </option>`
                            );
                        });
                    }
                    resolve(); // ✅ Done loading
                },
                error: function (error) {
                    console.log('Error loading categories:', error);
                    $('#category').html('<option value="">Error loading categories</option>');
                    reject(error);
                }
            });
        });
    }


    // Show category description when category is selected
    $('#category').on('change', function () {
        const selectedOption = $(this).find('option:selected');
        const description = selectedOption.data('description');

        if (description) {
            $('#category-description').text(`Category: ${description}`);
        } else {
            $('#category-description').text('');
        }

    });

    // Add new item button click handler
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
        var data = $('#iform')[0];
        console.log(data);
        let formData = new FormData(data);
        console.log(formData);
        for (var pair of formData.entries()) {
            console.log(pair[0] + ', ' + pair[1]);
        }
        $.ajax({
            method: "POST",
            url: `${url}api/v1/items`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (data) {
                console.log(data);
                $("#itemModal").modal("hide");
                var $itable = $('#itable').DataTable();

                $itable.ajax.reload()
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $('#itable tbody').on('click', 'a.editBtn', function (e) {
        e.preventDefault();
        $('#itemImage').remove()
        $('#itemId').remove()
        $("#iform").trigger("reset");
        // var id = $(e.relatedTarget).attr('data-id');

        var id = $(this).data('id');
        console.log(id);
        $('#itemModal').modal('show');
        $('<input>').attr({ type: 'hidden', id: 'itemId', name: 'item_id', value: id }).appendTo('#iform');

        $('#itemSubmit').hide()
        $('#itemUpdate').show()

        $.ajax({
            method: "GET",
            url: `${url}api/v1/items/${id}`,
            dataType: "json",
            success: function (data) {
                const { result } = data;
                console.log(result);

                loadCategories().then(() => {
                    $('#item_name').val(result[0].item_name);
                    $('#description').val(result[0].description);
                    $('#sell_price').val(result[0].sell_price);
                    $('#cost_price').val(result[0].cost_price);
                    $('#quantity').val(result[0].quantity);
                    $('#category').val(result[0].category_id || result[0].category).trigger('change');

                    $('#itemImage').remove();
                    $("#iform").append(`<img src="${url}${result[0].image}" width='200px' height='200px' id="itemImage" />`);
                });
            },
            error: function (error) {
                console.log(error);
            }
        });

    });

    $("#itemUpdate").on('click', function (e) {
        e.preventDefault();
        var id = $('#itemId').val();
        console.log(id);
        var table = $('#itable').DataTable();

        var data = $('#iform')[0];
        let formData = new FormData(data);

        $.ajax({
            method: "PUT",
            url: `${url}api/v1/items/${id}`,
            data: formData,
            contentType: false,
            processData: false,

            dataType: "json",
            success: function (data) {
                console.log(data);
                $('#itemModal').modal("hide");
                table.ajax.reload()

            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $('#itable tbody').on('click', 'a.deletebtn', function (e) {
        e.preventDefault();
        var table = $('#itable').DataTable();
        var id = $(this).data('id');
        var $row = $(this).closest('tr');
        console.log(id);
        bootbox.confirm({
            message: "do you want to delete this item",
            buttons: {
                confirm: {
                    label: 'yes',
                    className: 'btn-success'
                },
                cancel: {
                    label: 'no',
                    className: 'btn-danger'
                }
            },
            callback: function (result) {
                console.log(result);
                if (result) {
                    $.ajax({
                        method: "DELETE",
                        url: `${url}api/v1/items/${id}`,
                        dataType: "json",
                        success: function (data) {
                            console.log(data);
                            $row.fadeOut(4000, function () {
                                table.row($row).remove().draw();
                            });

                            bootbox.alert(data.message);
                        },
                        error: function (error) {
                            bootbox.alert(data.error);
                        }
                    });

                }

            }
        });
    })
})