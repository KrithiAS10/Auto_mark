const BACKEND = import.meta.env.BACKEND_URL;

export async function getProducts() {
  if (!BACKEND) {
    throw new Error("BACKEND_URL is missing");
  }

  const response = await fetch(`${BACKEND}/api/products`);

  if (!response.ok) {
    throw new Error(`Failed to fetch products. Status: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw new Error("Backend returned HTML instead of JSON");
  }

  return response.json();
}
