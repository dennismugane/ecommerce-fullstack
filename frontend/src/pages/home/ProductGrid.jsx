import { Product } from "./Product";

export function ProductGrid({ products, loadCart }) {
  // Move quantity state inside the map, so each product has its own
  return (
    <div className="products-grid">
      {products.map((product) => {
        // Each product gets its own quantity state
        return (
          <Product key={product.id} product={product} loadCart={loadCart} />
        );
      })}
    </div>
  );
}
