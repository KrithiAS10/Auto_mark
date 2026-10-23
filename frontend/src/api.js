const BACKEND = import.meta.env.VITE_BACKEND_URL;

if (!BACKEND) {
  throw new Error("VITE_BACKEND_URL is missing");
}

export async function getProducts() {
  const response = await fetch(`${BACKEND}/api/products`);

  if (!response.ok) {
    throw new Error(`Could not fetch products (${response.status})`);
  }

  return response.json();
}
