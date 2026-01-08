// src/services/CartService.js
import { useState, useEffect } from "react";
import { CartItem } from "../Models/CartItem";

let subscribers = [];

let items = [];

export function useCartService() {
  const [cartItems, setCartItems] = useState(items);

  useEffect(() => {
    const sub = () => setCartItems([...items]);
    subscribers.push(sub);
    return () => {
      subscribers = subscribers.filter((s) => s !== sub);
    };
  }, []);

  const notify = () => {
    subscribers.forEach((s) => s());
  };

  const addToCart = (product, quantity = 1) => {
    const existing = items.find((i) => i.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push(new CartItem(product, quantity));
    }
    notify();
  };

  const removeFromCart = (productId) => {
    items = items.filter((i) => i.product.id !== productId);
    notify();
  };

  const updateQuantity = (productId, quantity) => {
    const existing = items.find((i) => i.product.id === productId);
    if (existing) {
      existing.quantity = Math.max(1, quantity);
      notify();
    }
  };

  const getTotal = () => items.reduce((sum, i) => sum + i.total, 0);

  const getCount = () => items.reduce((sum, i) => sum + i.quantity, 0);

  const clear = () => {
    items = [];
    notify();
  };

  return {
    getItems: () => cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotal,
    getCount,
    clear,
    subscribe: (fn) => {
      subscribers.push(fn);
      return () => {
        subscribers = subscribers.filter((s) => s !== fn);
      };
    },
  };
}