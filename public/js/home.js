$(document).ready(function () {
    const url = 'http://localhost:4000/';
    var itemCount = 0;

    // Utility functions for cart
    const getCart = () => {
        let cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    };
    const saveCart = (cart) => {
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    // Fetch and render items
    $.ajax({
        method: "GET",
        url: `${url}api/v1/items`,
        dataType: 'json',
        success: function (data) {
            $("#items").empty();
            let row;

            $.each(data.rows, function (key, value) {
                if (key % 4 === 0) {
                    row = $('<div class="row"></div>');
                    $("#items").append(row);
                }

                // ✅ Handle multiple images (auto-detect JSON array or comma-separated)
                let images = [];
                if (Array.isArray(value.image)) {
                    images = value.image;
                } else if (typeof value.image === "string") {
                    images = value.image.split(',').map(img => img.trim());
                }

                // ✅ Build carousel items dynamically
                let carouselItems = '';
                $.each(images, function (index, img) {
                    carouselItems += `
                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                            <img src="${url}${img}" class="d-block w-100" alt="${value.description}">
                        </div>`;
                });

                var item = `<div class="col-md-3 mb-4">
                    <div class="card h-100">
                        <div id="carousel${value.item_id}" class="carousel slide" data-ride="carousel">
                            <div class="carousel-inner">
                                ${carouselItems}
                            </div>
                            <a class="carousel-control-prev" href="#carousel${value.item_id}" role="button" data-slide="prev">
                                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            </a>
                            <a class="carousel-control-next" href="#carousel${value.item_id}" role="button" data-slide="next">
                                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            </a>
                        </div>
                        <div class="card-body">
                            <h5 class="card-title">${value.item_name || value.description}</h5>
                            <p class="card-text">₱ ${value.sell_price}</p>
                            <p class="card-text"><small class="text-muted">Stock: ${value.quantity ?? 0}</small></p>
                            <a href="#!" class="btn btn-primary show-details" role="button" data-id="${value.item_id}"
                                data-name="${value.item_name || value.description}"
                                data-description="${value.description}"
                                data-price="${value.sell_price}"
                                data-image='${JSON.stringify(images)}'
                                data-stock="${value.quantity ?? 0}">Details</a>
                        </div>
                    </div>
                </div>`;
                row.append(item);
            });

            // Modal for product details (append once)
            if ($('#productDetailsModal').length === 0) {
                $('body').append(`
                    <div class="modal fade" id="productDetailsModal" tabindex="-1" role="dialog" aria-labelledby="productDetailsModalLabel" aria-hidden="true">
                      <div class="modal-dialog modal-dialog-centered" role="document">
                        <div class="modal-content">
                          <div class="modal-header">
                            <h5 class="modal-title" id="productDetailsModalLabel"></h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                          <div class="modal-body text-center" id="productDetailsModalBody">
                            <!-- Product details will be injected here -->
                          </div>
                        </div>
                      </div>
                    </div>
                `);
            }

            // Show details event (carousel inside modal)
            $(".show-details").on('click', function () {
                const id = $(this).data('id');
                const name = $(this).data('name');
                const description = $(this).data('description');
                const price = $(this).data('price');
                const images = JSON.parse($(this).attr('data-image'));
                const stock = $(this).data('stock');

                // Build carousel for modal
                let modalCarouselItems = '';
                $.each(images, function (index, img) {
                    modalCarouselItems += `
                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                            <img src="${url}${img}" class="d-block w-100" style="max-height:200px;">
                        </div>`;
                });

                $('#productDetailsModalLabel').text(name);
                $('#productDetailsModalBody').html(`
                    <div id="modalCarousel${id}" class="carousel slide mb-3" data-ride="carousel">
                        <div class="carousel-inner">
                            ${modalCarouselItems}
                        </div>
                        <a class="carousel-control-prev" href="#modalCarousel${id}" role="button" data-slide="prev">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        </a>
                        <a class="carousel-control-next" href="#modalCarousel${id}" role="button" data-slide="next">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        </a>
                    </div>
                    <p class="mb-2"><strong>Description:</strong> ${description}</p>
                    <p id="price">Price: ₱<strong>${price}</strong></p>
                    <p>Stock: ${stock}</p>
                    <input type="number" class="form-control mb-3" id="detailsQty" min="1" max="${stock}" value="1">
                    <input type="hidden" id="detailsItemId" value="${id}">
                    <button type="button" class="btn btn-primary" id="detailsAddToCart">Add to Cart</button>
                `);

                $('#productDetailsModal').modal('show');
            });
        },
        error: function (error) {
            $("#items").append('<p class="text-danger">Failed to load items.</p>');
            console.log(error);
        }
    });

    // Add to cart event
    $(document).on('click', '#detailsAddToCart', function () {
        const qty = parseInt($("#detailsQty").val());
        const id = $("#detailsItemId").val();
        const description = $("#productDetailsModalLabel").text();
        const price = $("#productDetailsModalBody strong").text().replace(/[^\d.]/g, '');
        const image = $("#productDetailsModalBody img").attr('src'); // takes first image
        const stock = parseInt($("#productDetailsModalBody p:contains('Stock')").text().replace(/[^\d]/g, ''));
        let cart = getCart();

        let existing = cart.find(item => item.item_id == id);
        if (existing) {
            existing.quantity += qty;
        } else {
            cart.push({
                item_id: id,
                description,
                price: parseFloat(price),
                image,
                stock,
                quantity: qty
            });
        }
        saveCart(cart);

        itemCount++;
        $('#itemCount').text(itemCount).css('display', 'block');
        $('#productDetailsModal').modal('hide');
        console.log(cart);
    });

    // Load header
    $("#home").load("header.html");
});
