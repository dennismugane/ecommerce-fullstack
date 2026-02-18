import { useEffect, useState } from "react";
import { getAllProducts } from "../../services/productService";
import { Header } from "../../components/Header";
import "./HomePage.css";
import { ProductGrid } from "./ProductGrid";

export function HomePage({ cart, loadCart }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    getAllProducts().then((data) => {
      setProducts(data);
      setFilteredProducts(data); // show all initially
    });
  }, []);

  return (
    <>
      <Header
        cart={cart}
        products={products}
        setFilteredProducts={setFilteredProducts}
      />
      <div className="home-page">
        <ProductGrid products={filteredProducts} loadCart={loadCart} />
      </div>
    </>
  );
}
