document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("checkout-form");
  const message = document.getElementById("checkout-message");
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");

  if (!cart.length) {
    document.getElementById("order-count").textContent = "0";
    document.getElementById("order-total").textContent = "0.00 ر.س";
    if (message) message.textContent = "السلة فارغة. أضف منتجًا أولًا.";
    form?.querySelector("button[type='submit']")?.setAttribute("disabled", "disabled");
    return;
  }

  const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalPrice = cart.reduce((sum, item) =>
    sum + Number(item.price || 0) * Number(item.quantity || 0), 0);

  document.getElementById("order-count").textContent = String(totalItems);
  document.getElementById("order-total").textContent = `${totalPrice.toFixed(2)} ر.س`;

  form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const payment = document.getElementById("payment").value;

    if (!name || !phone || !address) {
      if (message) message.textContent = "يرجى تعبئة جميع الحقول.";
      return;
    }

    const orderId = "LH-" + Date.now().toString().slice(-8);
    localStorage.setItem("lastOrder", JSON.stringify({
      id: orderId,
      name,
      phone,
      address,
      payment,
      items: cart,
      total: totalPrice,
      createdAt: new Date().toISOString()
    }));

    localStorage.removeItem("cart");
    localStorage.removeItem("totalPrice");
    localStorage.removeItem("totalItems");
    window.location.href = "success.html";
  });
});
