import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getProductsByCategory,
  getCategoryByLocalizedName,
  getSubcategories,
  addProductToCart,
  getOrCreateCustomerCart,
  getAnonymousCart,
  createAnonymousCart,
  changeLineItemQuantity,
} from "../../utils/api";
import { useCart } from "../../context/cartContext";
import { useAuth } from "../../context/authContext";
import { useCookieManager } from "../../hooks/useCookieManager";

import Slider from "@mui/material/Slider";
import { Button, CircularProgress, IconButton, Box, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { ProductProjection } from "@commercetools/platform-sdk";

import { ProductListProps } from "./catalog.types";
import "./Catalog.css";

const ProductList: React.FC<ProductListProps> = React.memo(
  ({ products, loading, onAddToCart, isAdding, getProductQuantity }) => {
    if (loading)
      return (
        <div className="loading">
          <CircularProgress size={40} />
        </div>
      );
    if (!products.length) return <p className="loading">No books found.</p>;

    return (
      <div className="product-grid">
        {products.map((product) => {
          const name = product.name?.["en-GB"] || "No title";
          const attrs = product.masterVariant?.attributes || [];
          const description = String(attrs.find((a) => a.name === "description")?.value || "No description");
          const author = String(attrs.find((a) => a.name === "author")?.value || "Unknown Author");
          const genre = String(attrs.find((a) => a.name === "genre")?.value || "No genre");
          const image = product.masterVariant?.images?.[0]?.url;
          const price = product.masterVariant?.prices?.[0];
          const originalPrice = price?.value.centAmount ? price.value.centAmount / 100 : null;
          const discountedPrice = price?.discounted?.value.centAmount ? price.discounted.value.centAmount / 100 : null;
          const variantId = product.masterVariant?.id || 1;
          const { quantity, lineItemId } = getProductQuantity(product.id, variantId);

          return (
            <div key={product.id} className="product-card">
              {image ? (
                <img src={image} alt={name} className="product-image" />
              ) : (
                <div className="product-image placeholder">No Image</div>
              )}
              <h2 className="product-name">{name}</h2>
              <p className="product-author">By {author}</p>
              <p className="product-description">{description}</p>
              <p className="product-genre">Genre: {genre}</p>
              <p className="product-price">
                {originalPrice !== null ? (
                  discountedPrice !== null ? (
                    <>
                      <span className="original-price">£{originalPrice.toFixed(2)}</span>
                      <span className="discounted-price">£{discountedPrice.toFixed(2)}</span>
                    </>
                  ) : (
                    `£${originalPrice.toFixed(2)}`
                  )
                ) : (
                  "Price unavailable"
                )}
              </p>
              <Link to={`/products/${product.key}`} className="view-details-button">
                View Details
              </Link>
              {quantity === 0 ? (
                <Button
                  variant="contained"
                  className="add-to-cart-button"
                  onClick={() => onAddToCart(product.id, variantId, "add")}
                  disabled={isAdding}
                  startIcon={isAdding ? <CircularProgress size={20} /> : null}
                >
                  Add to Cart
                </Button>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <IconButton
                    onClick={() => onAddToCart(product.id, variantId, "decrement")}
                    disabled={isAdding || !lineItemId}
                    sx={{
                      width: "37px",
                      height: "37px",
                      backgroundColor: "#f5f6f5",
                      border: "1px solid #d0d0d0",
                      borderRadius: "4px",
                      color: "#2d2d2d",
                      "&:hover": {
                        backgroundColor: "#e5e7eb",
                        borderColor: "#c15b5b",
                      },
                      "&:disabled": {
                        backgroundColor: "#f5f6f5",
                        borderColor: "#d0d0d0",
                        color: "#6b7280",
                      },
                    }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography
                    variant="body1"
                    sx={{
                      color: "#2d2d2d",
                      minWidth: "24px",
                      textAlign: "center",
                    }}
                  >
                    {quantity}
                  </Typography>
                  <IconButton
                    onClick={() => onAddToCart(product.id, variantId, "increment")}
                    disabled={isAdding}
                    sx={{
                      width: "37px",
                      height: "37px",
                      backgroundColor: "#f5f6f5",
                      border: "1px solid #d0d0d0",
                      borderRadius: "4px",
                      color: "#2d2d2d",
                      "&:hover": {
                        backgroundColor: "#e5e7eb",
                        borderColor: "#4a90e2",
                      },
                      "&:disabled": {
                        backgroundColor: "#f5f6f5",
                        borderColor: "#d0d0d0",
                        color: "#6b7280",
                      },
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

const Catalog = () => {
  const [products, setProducts] = useState<ProductProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [attributes, setAttributes] = useState<Record<string, string[]>>({});
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [priceLimits, setPriceLimits] = useState<[number, number]>([0, 0]);
  const [sortOrder, setSortOrder] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [subcategories, setSubcategories] = useState<{ id: string; name: { "en-GB": string } }[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const { cart, setCart } = useCart();
  const { isLoggedIn } = useAuth();
  const { cookies } = useCookieManager();
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 12;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const category = await getCategoryByLocalizedName("Books", "en-GB");
        if (!category) {
          setError("Category 'Books' not found");
          return;
        }

        const subs = await getSubcategories(category.id);
        setSubcategories(
          subs
            .filter((c) => c.name["en-GB"])
            .map((c) => ({
              id: c.id,
              name: { "en-GB": c.name["en-GB"]! },
            }))
        );

        const response = await getProductsByCategory(category.id, [], undefined, 0, itemsPerPage);
        setProducts(response.results);
        setTotalItems(response.total || response.results.length);

        const attrMap: Record<string, Set<string>> = {};
        let minPrice = Infinity;
        let maxPrice = -Infinity;

        response.results.forEach((product) => {
          const attrs = product.masterVariant?.attributes || [];
          attrs.forEach((attr) => {
            if (attr.name !== "description" && attr.value) {
              if (!attrMap[attr.name]) attrMap[attr.name] = new Set();
              attrMap[attr.name].add(String(attr.value));
            }
          });

          const price = product.masterVariant?.prices?.[0]?.value?.centAmount;
          if (typeof price === "number" && price > 0) {
            const pricePounds = price / 100;
            minPrice = Math.min(minPrice, pricePounds);
            maxPrice = Math.max(maxPrice, pricePounds);
          }
        });

        const sortedAttrMap: Record<string, string[]> = {};
        Object.keys(attrMap).forEach((name) => {
          sortedAttrMap[name] = [...attrMap[name]].sort();
        });

        const finalMinPrice = Number.isFinite(minPrice) ? Math.floor(minPrice) : 0;
        const finalMaxPrice = Number.isFinite(maxPrice) ? Math.ceil(maxPrice) : 100;
        setAttributes(sortedAttrMap);
        setPriceLimits([finalMinPrice, finalMaxPrice]);
        setPriceRange([finalMinPrice, finalMaxPrice]);
      } catch (error) {
        console.error("Catalog: Error fetching initial data:", error);
        setError("Failed to load catalog");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const applyFilters = async () => {
    setLoading(true);

    try {
      const category = await getCategoryByLocalizedName("Books", "en-GB");
      if (!category) {
        setError("Category 'Books' not found");
        return;
      }

      const filterArgs: string[] = [];

      if (selectedSubcategory) {
        filterArgs.push(`categories.id:"${selectedSubcategory}"`);
      } else {
        filterArgs.push(`categories.id:subtree("${category.id}")`);
      }

      Object.entries(selectedFilters).forEach(([attrName, value]) => {
        if (value) {
          filterArgs.push(`variants.attributes.${attrName}:"${value}"`);
        }
      });

      if (priceRange[0] !== priceLimits[0] || priceRange[1] !== priceLimits[1]) {
        const [minPrice, maxPrice] = priceRange;
        const minCent = Math.round(minPrice * 100);
        const maxCent = Math.round(maxPrice * 100);
        filterArgs.push(`variants.price.centAmount:range(${minCent} to ${maxCent})`);
      }

      const sortMap: Record<string, string> = {
        "price-asc": "price asc",
        "price-desc": "price desc",
        "title-asc": "name.en-GB asc",
        "title-desc": "name.en-GB desc",
      };

      const sortQuery = sortMap[sortOrder] || undefined;
      const offset = (currentPage - 1) * itemsPerPage;

      const response = await getProductsByCategory(category.id, filterArgs, sortQuery, offset, itemsPerPage);
      const results = response.results;

      if (sortOrder === "author-asc" || sortOrder === "author-desc") {
        results.sort((a, b) => {
          const aAuthor = (a.masterVariant?.attributes?.find((attr) => attr.name === "author")?.value as string) || "";
          const bAuthor = (b.masterVariant?.attributes?.find((attr) => attr.name === "author")?.value as string) || "";
          return sortOrder === "author-asc" ? aAuthor.localeCompare(bAuthor) : bAuthor.localeCompare(aAuthor);
        });
      }

      setProducts(results);
      setTotalItems(response.total || results.length);

      if (results.length === 0 && currentPage !== 1) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Catalog: Error applying filters:", error);
      setError("Failed to apply filters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [selectedFilters, priceRange, sortOrder, selectedSubcategory, currentPage]);

  const getProductQuantity = (productId: string, variantId: number) => {
    const lineItem = cart?.lineItems.find((item) => item.productId === productId && item.variant.id === variantId);
    return {
      quantity: lineItem ? lineItem.quantity : 0,
      lineItemId: lineItem ? lineItem.id : undefined,
    };
  };

  const handleAddToCart = async (productId: string, variantId: number, action: "add" | "increment" | "decrement") => {
    if (isAdding) return;

    setIsAdding(true);

    try {
      let cart;
      let accessToken = null;

      if (isLoggedIn && (localStorage.getItem("access_token") || cookies.access_token)) {
        accessToken = localStorage.getItem("access_token") || cookies.access_token;
        if (!accessToken) {
          throw new Error("No access token available");
        }
        cart = await getOrCreateCustomerCart(accessToken);
        localStorage.setItem("cartId", cart.id);
      } else {
        const anonymousCartId = localStorage.getItem("anonymousCartId");
        if (anonymousCartId) {
          cart = await getAnonymousCart(anonymousCartId);
        }
        if (!cart) {
          cart = await createAnonymousCart();
          localStorage.setItem("anonymousCartId", cart.id);
        }
      }

      let updatedCart;
      const { quantity, lineItemId } = getProductQuantity(productId, variantId);

      if (action === "add") {
        updatedCart = await addProductToCart(cart.id, productId, variantId, 1, accessToken);
      } else if (action === "increment") {
        updatedCart = await changeLineItemQuantity(cart.id, lineItemId!, quantity + 1, accessToken);
      } else if (action === "decrement" && lineItemId) {
        updatedCart = await changeLineItemQuantity(cart.id, lineItemId, quantity - 1, accessToken);
      }

      if (updatedCart) {
        setCart(updatedCart);
      }
    } catch {
      setError("Failed to update cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleFilterChange = (attrName: string, value: string) => {
    setSelectedFilters((prev) => ({ ...prev, [attrName]: value }));
    setCurrentPage(1);
  };

  const handlePriceChange = (_: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number]);
    setCurrentPage(1);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedSubcategory(categoryId);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedFilters({});
    setPriceRange(priceLimits);
    setSortOrder("");
    setSearchQuery("");
    setSelectedSubcategory("");
    setCurrentPage(1);
  };

  const filterBySearch = (products: ProductProjection[]) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return products;

    return products.filter((product) => {
      const name = product.name?.["en-GB"]?.toLowerCase() || "";
      const author =
        product.masterVariant?.attributes
          ?.find((attr) => attr.name === "author")
          ?.value?.toString()
          .toLowerCase() || "";
      return name.includes(query) || author.includes(query);
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const filteredProducts = filterBySearch(products);

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="catalog-container">
      <aside className="sidebar">
        <h2 className="sidebar-title">Filters</h2>
        <div className="filter-group">
          <label className="filter-label">Subcategory</label>
          <button
            className={`category-button ${selectedSubcategory === "" ? "active" : ""}`}
            onClick={() => handleCategorySelect("")}
          >
            All Subcategories
          </button>
          {subcategories.map((subcat) => (
            <button
              key={subcat.id}
              className={`category-button ${selectedSubcategory === subcat.id ? "active" : ""}`}
              onClick={() => handleCategorySelect(subcat.id)}
            >
              {subcat.name["en-GB"]}
            </button>
          ))}
        </div>
        {Object.entries(attributes).map(([attrName, values]) => (
          <div key={attrName} className="filter-group">
            <label htmlFor={`${attrName}-filter`} className="filter-label">
              {attrName.charAt(0).toUpperCase() + attrName.slice(1)}
            </label>
            <select
              id={`${attrName}-filter`}
              value={selectedFilters[attrName] || ""}
              onChange={(e) => handleFilterChange(attrName, e.target.value)}
              className="filter-select"
            >
              <option value="">All {attrName}</option>
              {values.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        ))}
        <div className="filter-group">
          <label className="filter-label">Price Range (£) (Excluding discounts)</label>
          <Slider
            value={priceRange}
            onChange={handlePriceChange}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `£${value}`}
            min={priceLimits[0]}
            max={priceLimits[1]}
            step={1}
            className="price-slider"
          />
          <div className="price-values">
            <span>£{priceRange[0]}</span>
            <span>£{priceRange[1]}</span>
          </div>
        </div>
        {(Object.values(selectedFilters).some(Boolean) ||
          priceRange[0] !== priceLimits[0] ||
          priceRange[1] !== priceLimits[1] ||
          sortOrder ||
          searchQuery ||
          selectedSubcategory) && (
          <button onClick={resetFilters} className="reset-button">
            Reset Filters
          </button>
        )}
      </aside>
      <main className="catalog-main">
        <div className="breadcrumb">
          <span className="breadcrumb-item static">Catalog</span>
          <span className="breadcrumb-separator">/</span>
          <button className="breadcrumb-item" onClick={() => handleCategorySelect("")}>
            Books
          </button>
          {selectedSubcategory && (
            <>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-item active">
                {subcategories.find((s) => s.id === selectedSubcategory)?.name["en-GB"]}
              </span>
            </>
          )}
        </div>
        <div className="catalog-controls">
          <input
            type="text"
            placeholder="Search products..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="filter-select">
            <option value="">Sort by...</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="title-asc">Title: A → Z</option>
            <option value="title-desc">Title: Z → A</option>
            <option value="author-asc">Author: A → Z</option>
            <option value="author-desc">Author: Z → A</option>
          </select>
        </div>
        <ProductList
          products={filteredProducts}
          loading={loading}
          onAddToCart={handleAddToCart}
          isAdding={isAdding}
          getProductQuantity={getProductQuantity}
        />
        {filteredProducts.length > 0 && (
          <div className="pagination">
            <Button
              variant="contained"
              disabled={currentPage === 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="pagination-button"
            >
              Previous
            </Button>
            <Typography variant="body1" className="pagination-info">
              Page {currentPage} of {totalPages}
            </Typography>
            <Button
              variant="contained"
              disabled={currentPage === totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="pagination-button"
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Catalog;
