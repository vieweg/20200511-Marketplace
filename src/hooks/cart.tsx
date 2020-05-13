import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

const STORAGE_KEY = '@GoMarketplace:Cart';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): Promise<void>;
  increment(id: string): Promise<void>;
  decrement(id: string): Promise<void>;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const persistOnStorage = useCallback(async cart => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, []);

  const increment = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);

      if (productIndex >= 0) {
        products[productIndex].quantity += 1;
        persistOnStorage([...products]);
        setProducts([...products]);
      }
    },
    [persistOnStorage, products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(item => item.id === id);

      if (products[productIndex].quantity > 1) {
        products[productIndex].quantity -= 1;
      } else {
        products.splice(productIndex, 1);
      }
      persistOnStorage([...products]);
      setProducts([...products]);
    },
    [persistOnStorage, products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(item => item.id === product.id);

      if (productIndex >= 0) {
        await increment(product.id);
        return;
      }

      const productCart: Product = product;
      productCart.quantity = 1;
      persistOnStorage([...products, productCart]);
      setProducts([...products, productCart]);
    },
    [persistOnStorage, products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
