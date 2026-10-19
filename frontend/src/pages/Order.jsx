
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import downloadIcon from "../../icon/download.svg";
import homeIcon from "../../icon/home.svg";
import searchIcon from "../../icon/search.svg";

const Order = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((response) => {
        if (!response.ok) throw new Error("Could not fetch products");
        return response.json();
      })
      .then((data) => setProducts(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const brands = [
    "All",
    ...new Set(products.map((p) => p.brand).filter(Boolean)),
  ];

  const filteredProducts = products.filter((product) => {
    const term = search.toLowerCase();

    const matchesSearch =
      (product.partNo || "").toLowerCase().includes(term) ||
      (product.description || "").toLowerCase().includes(term) ||
      (product.brand || "").toLowerCase().includes(term);

    const matchesBrand =
      selectedBrand === "All" || product.brand === selectedBrand;

    return matchesSearch && matchesBrand;
  });

  const addToCart = (product) => {
    const quantity = Number(quantities[product._id] ?? 1);
    const stock = Math.max(0, Number(product.stock) || 0);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setMessage("Please enter a valid quantity.");
      return;
    }

    if (stock <= 0) {
      setMessage("This product is out of stock.");
      return;
    }

    const existingItem = cart.find(
      (item) => item.product._id === product._id
    );

    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity + quantity > stock) {
      setMessage(
        `Only ${stock - currentQuantity} more item(s) can be added.`
      );
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.product._id === product._id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...currentCart, { product, quantity }];
    });

    setMessage(`${product.partNo} added to cart!`);
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.product._id !== productId)
    );
    setMessage("Item removed from cart.");
  };

  const updateCartQuantity = (productId, newQuantity) => {
    const item = cart.find(
      (entry) => entry.product._id === productId
    );

    if (!item) return;

    const stock = Math.max(0, Number(item.product.stock) || 0);

    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > stock) {
      setMessage(`Available stock is only ${stock}.`);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((entry) =>
        entry.product._id === productId
          ? { ...entry, quantity: newQuantity }
          : entry
      )
    );

    setMessage("");
  };

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + (Number(item.product.sellPrice) || 0) * item.quantity,
    0
  );

  return (
    <>
      <nav className="bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl py-3 px-6 md:px-10 flex justify-between items-center m-4 md:m-10">
  <Link to="/order">
    <img src={searchIcon} alt="Search" className="w-8 h-8" />
  </Link>

  <div className="flex gap-6 items-center">
    <a
      href="#cart"
      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700"
    >
      🛒 View Cart ({totalItems})
    </a>

    <Link to="/order">
      <img src={homeIcon} alt="Home" className="w-8 h-8" />
    </Link>

    <Link to="/bill">
      <img src={downloadIcon} alt="Bill" className="w-8 h-8" />
    </Link>
  </div>
</nav>

      <main className="m-4 md:m-10">
        <h1 className="text-3xl font-bold mb-2">Product Inventory</h1>

        <p className="text-gray-600 mb-6">
          Total products: {products.length}
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search by part number, brand or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 placeholder:text-gray-500"
          />

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900"
          >
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <p className="mb-4 text-blue-700 font-medium">{message}</p>
        )}

        {loading && <p>Loading products...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && filteredProducts.length === 0 && (
          <p>No matching products found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const mrp = Number(product.mrp) || 0;
            const sellPrice = Number(product.sellPrice) || 0;
            const stock = Math.max(0, Number(product.stock) || 0);
            const discount =
              mrp > 0
                ? Math.max(0, ((mrp - sellPrice) / mrp) * 100)
                : 0;

            const cartItem = cart.find(
              (item) => item.product._id === product._id
            );

            const remainingStock = Math.max(
              0,
              stock - (cartItem?.quantity || 0)
            );

            return (
              <div
                key={product._id}
                className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 text-gray-900 shadow-sm"
              >
                <h2 className="text-xl font-bold">
                  {product.description || "Unnamed product"}
                </h2>

                <p><strong>Part No:</strong> {product.partNo}</p>
                <p><strong>Brand:</strong> {product.brand || "N/A"}</p>
                <p><strong>MRP:</strong> ₹{mrp.toFixed(2)}</p>

                <p>
                  <strong>Availability:</strong>{" "}
                  {remainingStock > 0 ? "In Stock" : "Out of Stock"}
                </p>

                <p><strong>Available stock:</strong> {remainingStock}</p>
                <p><strong>Discount:</strong> {discount.toFixed(1)}%</p>

                <p className="text-green-700 font-semibold">
                  Customer Price: ₹{sellPrice.toFixed(2)}
                </p>

                <label
                  className="font-medium"
                  htmlFor={`qty-${product._id}`}
                >
                  Quantity
                </label>

                <input
                  id={`qty-${product._id}`}
                  type="number"
                  min="1"
                  max={remainingStock}
                  step="1"
                  value={quantities[product._id] ?? 1}
                  disabled={remainingStock <= 0}
                  onChange={(e) =>
                    setQuantities((current) => ({
                      ...current,
                      [product._id]: e.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />

                <button
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={remainingStock <= 0}
                  className="bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {remainingStock <= 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            );
          })}
        </div>

      <section
  id="cart"
  className="mt-12 bg-white text-gray-900 rounded-2xl shadow-sm border p-5 md:p-8 scroll-mt-6"
>

          <h2 className="text-2xl font-bold mb-6">
            Your Cart ({totalItems} items)
          </h2>

          {cart.length === 0 ? (
            <p className="text-gray-900">Your cart is empty.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3">Part No.</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Subtotal</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.product._id} className="border-b">
                        <td className="p-3">{item.product.partNo}</td>
                        <td className="p-3">{item.product.description}</td>

                        <td className="p-3">
                          ₹{(Number(item.product.sellPrice) || 0).toFixed(2)}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                updateCartQuantity(
                                  item.product._id,
                                  item.quantity - 1
                                )
                              }
                              className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 font-bold"
                            >
                              −
                            </button>

                            <span className="min-w-6 text-center">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() =>
                                updateCartQuantity(
                                  item.product._id,
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                item.quantity >=
                                (Number(item.product.stock) || 0)
                              }
                              className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100 font-bold disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="p-3">
                          ₹
                          {(
                            (Number(item.product.sellPrice) || 0) *
                            item.quantity
                          ).toFixed(2)}
                        </td>

                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product._id)}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col items-end gap-3">
                <p className="text-xl font-bold">
                  Total: ₹{cartTotal.toFixed(2)}
                </p>

                <Link
                  to="/bill"
                  state={{ cart, totalItems, cartTotal }}
                  className="bg-green-600 text-white rounded-xl px-6 py-3 font-semibold hover:bg-green-700"
                >
                  Proceed to Bill
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
};

export default Order;
