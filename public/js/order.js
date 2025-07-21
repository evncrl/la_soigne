function checkout() {
  let cart = JSON.parse(localStorage.getItem(`cart_${userId}`)) || [];

  if (cart.length === 0) {
    Swal.fire("Oops!", "Your cart is empty!", "warning");
    return;
  }

  // ✅ Shipping_id placeholder (replace with real shipping selection later)
  const shipping_id = 1; 

  const payload = {
    user_id: userId, // This is from localStorage (already in your cart page)
    shipping_id: shipping_id,
    items: cart.map((product) => ({
      id: product.id,
      quantity: product.quantity,
    })),
  };

  $.ajax({
    url: "http://localhost:4000/api/v1/orders",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(payload),
    success: function (res) {
      if (res.success) {
        Swal.fire("✅ Success!", "Your order has been placed!", "success");
        localStorage.removeItem(`cart_${userId}`);
        loadCart();
      } else {
        Swal.fire("Error", res.message || "Order failed", "error");
      }
    },
    error: function (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong with checkout.", "error");
    },
  });
}
