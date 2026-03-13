import { Product } from "./Product";
import "./Product.css";

export function ProductGrid({ products, loadCart }) {
  return (
    <div className="products-grid">
      {products.map((product) => (
        <Product key={product.id} product={product} loadCart={loadCart} />
      ))}
    </div>
  );
}
