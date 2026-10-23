const BACKEND = import.meta.env.BACKEND_URL;

export async function getProducts() {
  const response = await fetch(`${BACKEND}/api/products`);

  if (!response.ok) {
    throw new Error("Could not fetch products");
  }

  return response.json();
}
