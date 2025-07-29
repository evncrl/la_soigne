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

                let images = [];
                if (Array.isArray(value.image)) {
                    images = value.image;
                } else if (typeof value.image === "string") {
                    images = value.image.split(',').map(img => img.trim());
                }

                let carouselItems = '';
                $.each(images, function (index, img) {
                    carouselItems += `
                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                            <img src="${url}images/${img}" class="d-block w-100" alt="${value.description}">
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

            // Show details event (carousel inside modal)
            $(document).on('click', '.show-details', function () {
                const id = $(this).data('id');
                const name = $(this).data('name');
                const description = $(this).data('description');
                const price = $(this).data('price');
                const images = JSON.parse($(this).attr('data-image'));
                const stock = $(this).data('stock');

                let modalCarouselItems = '';
                $.each(images, function (index, img) {
                    modalCarouselItems += `
                        <div class="carousel-item ${index === 0 ? 'active' : ''}">
                            <img src="${url}images/${img}" class="d-block w-100" style="max-height:200px;">
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
                    <input type="hidden" id="detailsItemId" value="${id}">
                    <button type="button" class="btn btn-primary mb-3" id="detailsAddToCart">Add to Cart</button>
                    <hr>
                    <h6>Product Reviews</h6>
                    <div id="product-reviews">
                        <p>Loading reviews...</p>
                    </div>
                `);

                $('#productDetailsModal').modal('show');

                // Load product reviews
                $.get(`${url}api/v1/reviews/${id}`, function (res) {
                    if (res.success && res.data.length > 0) {
                        const reviewsHTML = res.data.map(r => `
                            <div class="border p-2 mb-2 rounded bg-light">
                                <strong>${r.fname} ${r.lname}</strong>
                                <div>⭐ ${r.rating}/5</div>
                                <small class="text-muted">${new Date(r.created_at).toLocaleString()}</small>
                                <p class="mb-0">${r.review_text}</p>
                            </div>
                        `).join('');
                        $('#product-reviews').html(reviewsHTML);
                    } else {
                        $('#product-reviews').html('<p class="text-muted">No reviews yet.</p>');
                    }
                }).fail(() => {
                    $('#product-reviews').html('<p class="text-danger">Failed to load reviews.</p>');
                });
            });
        },
        error: function (error) {
            $("#items").append('<p class="text-danger">Failed to load items.</p>');
            console.log(error);
        }
    });

    // Add to cart without quantity input (always adds 1)
    $(document).on('click', '#detailsAddToCart', function () {
        const id = $("#detailsItemId").val();
        const description = $("#productDetailsModalLabel").text();
        const price = $("#productDetailsModalBody strong").text().replace(/[^\d.]/g, '');
        const image = $("#productDetailsModalBody img").attr('src');
        const stock = parseInt($("#productDetailsModalBody p:contains('Stock')").text().replace(/[^\d]/g, ''));
        let cart = getCart();

        let existing = cart.find(item => item.item_id == id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                item_id: id,
                description,
                price: parseFloat(price),
                image,
                stock,
                quantity: 1
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
    // Delay para hintayin matapos mag-load ang header bago mag-bind
    setTimeout(function () {
        $("#searchInput").autocomplete({
            source: function (request, response) {
                $.ajax({
                    url: `${url}api/v1/search`,
                    data: { q: request.term },
                    success: function (res) {
                        if (res.success) {
                            response(res.data.map(item => ({
                                label: item.item_name || item.description,
                                value: item.item_name || item.description,
                                item_id: item.item_id
                            })));
                        }
                    }
                });
            },
            minLength: 2,
            select: function (event, ui) {
                // Hanapin ang matching item card
                const itemId = ui.item.item_id;
                const card = $(`[data-id="${itemId}"]`).closest('.col-md-3');
                if (card.length) {
                    $('html, body').animate({
                        scrollTop: card.offset().top - 100
                    }, 500);
                    card.addClass('border border-primary rounded');

                    // optional: auto-click 'Details'
                    card.find('.show-details').click();
                }
            }
        });
    }, 500); // wait header to load

});
