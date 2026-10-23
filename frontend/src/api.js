const BACKEND = import.meta.env.VITE_BACKEND_URL;

export async function getProducts() {
  if (!BACKEND) {
    throw new Error(
      "VITE_BACKEND_URL is missing. Check your frontend environment variables.",
    );
  }

  try {
    const response = await fetch(`${BACKEND}/api/products`);

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Products API error:", error);
    throw error;
  }
}
