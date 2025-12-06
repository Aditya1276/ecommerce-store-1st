const API_URL = "https://fakestoreapi.com/products";

function getCart() {
  const raw = localStorage.getItem("cart");
  return raw ? JSON.parse(raw) : [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity
    });
  }
  saveCart(cart);
}

function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function setUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
  updateAuthLink();
}

function logoutUser() {
  localStorage.removeItem("user");
  updateAuthLink();
  alert("Logged out");
}


function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const el = document.getElementById("cart-count");
  if (el) el.textContent = count;
}

function updateAuthLink() {
  const link = document.getElementById("auth-link");
  if (!link) return;

  const user = getUser();
  link.replaceWith(link.cloneNode(true)); 
  const newLink = document.getElementById("auth-link");

  if (user) {
    newLink.textContent = "Logout";
    newLink.href = "#";
    newLink.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });
  } else {
    newLink.textContent = "Login";
    newLink.href = "login.html";
  }
}


document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  updateAuthLink();

  const grid = document.getElementById("product-grid");
  const detail = document.getElementById("product-detail");
  const cartSection = document.getElementById("cart-items");
  const checkoutPage = document.getElementById("checkout-page");
  const loginForm = document.getElementById("login-form");

  if (grid) {
    loadHomePage(grid);
  }

  if (detail) {
    loadProductPage(detail);
  }

  if (cartSection) {
    loadCartPage(cartSection);
  }

  if (checkoutPage) {
    loadCheckoutPage(checkoutPage);
  }

  if (loginForm) {
    initLoginPage(loginForm);
  }
});


let allProducts = [];

function loadHomePage(gridEl) {
  const searchInput = document.getElementById("search-input");

  fetch(API_URL, { method: "GET" })
    .then(response => response.json())
    .then(products => {
      allProducts = products;
      renderProductGrid(gridEl, products);

      if (searchInput) {
        searchInput.addEventListener("input", () => {
          const term = searchInput.value.toLowerCase();
          const filtered = allProducts.filter(p => {
            const title = p.title.toLowerCase();
            const category = (p.category || "").toLowerCase();
            return title.includes(term) || category.includes(term);
          });
          renderProductGrid(gridEl, filtered);
        });
      }
    })
    .catch(err => {
      console.error(err);
      gridEl.textContent = "Failed to load products.";
    });
}

function renderProductGrid(gridEl, products) {
  gridEl.innerHTML = "";
  if (!products.length) {
    gridEl.textContent = "No products found.";
    return;
  }

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <img src="${product.image}" alt="${escapeHtml(product.title)}" />
      <div class="content">
        <h2 class="title">${escapeHtml(product.title)}</h2>
        <p class="price">₹${(product.price * 80).toFixed(2)}</p>
        <div style="display:flex; justify-content:space-between; gap:.5rem;">
          <a href="product.html?id=${product.id}" class="btn">View</a>
          <button class="btn primary" data-id="${product.id}">Add to cart</button>
        </div>
      </div>
    `;

    const btn = card.querySelector("button[data-id]");
    btn.addEventListener("click", () => {
      addToCart(product, 1);
      alert("Added to cart");
    });

    gridEl.appendChild(card);
  });
}


function loadProductPage(detailEl) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    detailEl.textContent = "No product selected.";
    return;
  }

  fetch(`${API_URL}/${id}`, { method: "GET" })
    .then(response => response.json())
    .then(product => {
      detailEl.innerHTML = `
        <section class="product-detail-card">
          <div>
            <img src="${product.image}" alt="${escapeHtml(product.title)}" />
          </div>
          <div class="product-detail-content">
            <h1>${escapeHtml(product.title)}</h1>
            <div class="category">${escapeHtml(product.category)}</div>
            <p class="price">₹${(product.price * 80).toFixed(2)}</p>
            <p>${escapeHtml(product.description)}</p>
            <div class="product-detail-actions">
              <div class="qty">
                <button type="button" id="qty-dec">-</button>
                <span id="qty-value">1</span>
                <button type="button" id="qty-inc">+</button>
              </div>
              <button class="btn primary" id="add-to-cart-btn">Add to cart</button>
            </div>
          </div>
        </section>
      `;

      let qty = 1;
      const qtyValue = document.getElementById("qty-value");
      document.getElementById("qty-dec").addEventListener("click", () => {
        if (qty > 1) {
          qty--;
          qtyValue.textContent = qty;
        }
      });
      document.getElementById("qty-inc").addEventListener("click", () => {
        qty++;
        qtyValue.textContent = qty;
      });

      document.getElementById("add-to-cart-btn").addEventListener("click", () => {
        addToCart(product, qty);
        alert("Added to cart");
      });
    })
    .catch(err => {
      console.error(err);
      detailEl.textContent = "Failed to load product.";
    });
}


function loadCartPage(cartEl) {
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");

  function render() {
    const cart = getCart();
    cartEl.innerHTML = "";

    if (cart.length === 0) {
      cartEl.textContent = "Your cart is empty.";
      totalEl.textContent = "₹0";
      return;
    }

    let total = 0;

    cart.forEach(item => {
      const line = document.createElement("article");
      line.className = "line";

      const lineTotal = item.price * 80 * item.quantity;
      total += lineTotal;

      line.innerHTML = `
        <img src="${item.image}" alt="${escapeHtml(item.title)}" />
        <div>
          <h3 class="line-info-title">${escapeHtml(item.title)}</h3>
          <p class="line-info-price">₹${(item.price * 80).toFixed(2)} each</p>
        </div>
        <div class="qty" data-id="${item.id}">
          <button type="button" class="dec">-</button>
          <span>${item.quantity}</span>
          <button type="button" class="inc">+</button>
        </div>
        <div>
          <div>₹${lineTotal.toFixed(2)}</div>
          <button type="button" class="btn" data-remove="${item.id}" style="margin-top:.4rem;">Remove</button>
        </div>
      `;

      const qtyWrapper = line.querySelector(".qty");
      const decBtn = qtyWrapper.querySelector(".dec");
      const incBtn = qtyWrapper.querySelector(".inc");
      const removeBtn = line.querySelector("[data-remove]");

      decBtn.addEventListener("click", () => {
        const cartCurrent = getCart();
        const found = cartCurrent.find(i => i.id === item.id);
        if (!found) return;
        if (found.quantity > 1) {
          found.quantity--;
        } else {
          const idx = cartCurrent.findIndex(i => i.id === item.id);
          cartCurrent.splice(idx, 1);
        }
        saveCart(cartCurrent);
        render();
      });

      incBtn.addEventListener("click", () => {
        const cartCurrent = getCart();
        const found = cartCurrent.find(i => i.id === item.id);
        if (!found) return;
        found.quantity++;
        saveCart(cartCurrent);
        render();
      });

      removeBtn.addEventListener("click", () => {
        const cartCurrent = getCart();
        const idx = cartCurrent.findIndex(i => i.id === item.id);
        if (idx !== -1) {
          cartCurrent.splice(idx, 1);
          saveCart(cartCurrent);
          render();
        }
      });

      cartEl.appendChild(line);
    });

    totalEl.textContent = `₹${total.toFixed(2)}`;
  }

  render();

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      const cart = getCart();
      if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
      }
      window.location.href = "checkout.html";
    });
  }
}

function loadCheckoutPage(container) {
  const summaryEl = document.getElementById("checkout-summary");
  const form = document.getElementById("checkout-form");
  const cart = getCart();

  if (!summaryEl) return;

  summaryEl.innerHTML = "";

  if (cart.length === 0) {
    summaryEl.textContent = "Your cart is empty. Add items before checking out.";
    if (form) {
      form.style.display = "none";
    }
    return;
  }

  let total = 0;

  cart.forEach(item => {
    const lineTotal = item.price * 80 * item.quantity;
    total += lineTotal;

    const line = document.createElement("article");
    line.className = "line";

    line.innerHTML = `
      <img src="${item.image}" alt="${escapeHtml(item.title)}" />
      <div>
        <h3 class="line-info-title">${escapeHtml(item.title)}</h3>
        <p class="line-info-price">Qty: ${item.quantity}</p>
      </div>
      <div style="grid-column: span 2; text-align:right;">
        ₹${lineTotal.toFixed(2)}
      </div>
    `;

    summaryEl.appendChild(line);
  });

  const totalDiv = document.createElement("div");
  totalDiv.style.marginTop = "1rem";
  totalDiv.innerHTML = `<strong>Total: ₹${total.toFixed(2)}</strong>`;
  summaryEl.appendChild(totalDiv);

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = form.fullName.value.trim();
      const address = form.address.value.trim();
      const city = form.city.value.trim();
      const zip = form.zip.value.trim();

      if (!name || !address || !city || !zip) {
        alert("Please fill all required fields.");
        return;
      }

      alert("Order placed successfully! (demo)");
      saveCart([]);
      window.location.href = "index.html";
    });
  }
}

function initLoginPage(form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value.trim();

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    setUser({ email });
    alert("Logged in as " + email);
    window.location.href = "index.html";
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
