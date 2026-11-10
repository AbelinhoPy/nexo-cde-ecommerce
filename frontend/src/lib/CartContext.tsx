"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartProduct {
  id: string;
  sku?: string;
  nombre: string;
  precioUsd: number;
  precioPyg: number;
  fletePyg: number;
  tipoFlete: "REGULAR" | "PESADO" | string;
  img: string;
  categoria?: string;
  cantidad: number;
}

export interface CustomerData {
  id: string;
  nombre: string;
  email: string;
  ci: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  departamento: string;
  fechaRegistro?: string;
}

export interface CouponData {
  codigo: string;
  descripcion: string;
  descuentoPyg: number;
}

interface CartContextType {
  cart: CartProduct[];
  addToCart: (product: Omit<CartProduct, "cantidad">, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalPyg: number;
  subtotalUsd: number;
  fletePyg: number;
  descuentoPyg: number;
  totalPagarPyg: number;
  cupon: CouponData | null;
  aplicarCupon: (codigo: string) => Promise<{ success: boolean; mensaje: string }>;
  removerCupon: () => void;
  
  // Modales
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  
  // Autenticación de Cliente
  customer: CustomerData | null;
  customerToken: string | null;
  loginCustomer: (identificador: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerCustomer: (data: any) => Promise<{ success: boolean; error?: string }>;
  logoutCustomer: () => void;
  refreshProfile: () => Promise<void>;
  notificacion: string | null;
  mostrarNotificacion: (msg: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartProduct[]>([]);
  const [cupon, setCupon] = useState<CouponData | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem("nexo_cart");
        if (savedCart) setCart(JSON.parse(savedCart));

        const savedToken = localStorage.getItem("nexo_customer_token");
        const savedCustomer = localStorage.getItem("nexo_customer_data");
        if (savedToken && savedCustomer) {
          setCustomerToken(savedToken);
          setCustomer(JSON.parse(savedCustomer));
        }

        const savedCupon = localStorage.getItem("nexo_cupon");
        if (savedCupon) setCupon(JSON.parse(savedCupon));
      } catch (e) {
        console.error("Error cargando carrito local:", e);
      }
    }
  }, []);

  // Guardar carrito al cambiar
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nexo_cart", JSON.stringify(cart));
    }
  }, [cart]);

  // Guardar cupón al cambiar
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (cupon) {
        localStorage.setItem("nexo_cupon", JSON.stringify(cupon));
      } else {
        localStorage.removeItem("nexo_cupon");
      }
    }
  }, [cupon]);

  const mostrarNotificacion = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 3500);
  };

  const addToCart = (product: Omit<CartProduct, "cantidad">, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].cantidad += qty;
        return updated;
      }
      return [...prev, { ...product, cantidad: qty }];
    });
    mostrarNotificacion(`✓ "${product.nombre.slice(0, 32)}..." agregado al carrito`);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad: qty } : p))
    );
  };

  const clearCart = () => {
    setCart([]);
    setCupon(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexo_cart");
      localStorage.removeItem("nexo_cupon");
    }
  };

  const totalItems = cart.reduce((acc, it) => acc + it.cantidad, 0);
  const subtotalPyg = cart.reduce((acc, it) => acc + it.precioPyg * it.cantidad, 0);
  const subtotalUsd = cart.reduce((acc, it) => acc + it.precioUsd * it.cantidad, 0);

  // Flete TSI: si algún producto es PESADO -> ₲50.000, sino ₲35.000 (tarifa plana si hay items)
  const tienePesado = cart.some((it) => it.tipoFlete === "PESADO");
  const fletePyg = cart.length > 0 ? (tienePesado ? 50000 : 35000) : 0;
  const descuentoPyg = cupon ? Math.min(cupon.descuentoPyg, subtotalPyg + fletePyg) : 0;
  const totalPagarPyg = Math.max(0, subtotalPyg + fletePyg - descuentoPyg);

  const aplicarCupon = async (codigo: string) => {
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo,
          subtotalProductosPyg: subtotalPyg,
          fletePyg,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCupon(data.cupon);
        mostrarNotificacion(`🎉 ¡Cupón ${data.cupon.codigo} aplicado con éxito!`);
        return { success: true, mensaje: data.cupon.descripcion };
      } else {
        return { success: false, mensaje: data.error || "Cupón no válido" };
      }
    } catch (e) {
      return { success: false, mensaje: "Error validando cupón" };
    }
  };

  const removerCupon = () => {
    setCupon(null);
    mostrarNotificacion("Cupón removido");
  };

  // Auth Functions
  const loginCustomer = async (identificador: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identificador, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomer(data.cliente);
        setCustomerToken(data.token);
        if (typeof window !== "undefined") {
          localStorage.setItem("nexo_customer_token", data.token);
          localStorage.setItem("nexo_customer_data", JSON.stringify(data.cliente));
        }
        setIsAuthModalOpen(false);
        mostrarNotificacion(`👋 ¡Bienvenido de nuevo, ${data.cliente.nombre.split(" ")[0]}!`);
        return { success: true };
      }
      return { success: false, error: data.error || "Error al iniciar sesión" };
    } catch {
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  const registerCustomer = async (formData: any) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomer(data.cliente);
        setCustomerToken(data.token);
        if (typeof window !== "undefined") {
          localStorage.setItem("nexo_customer_token", data.token);
          localStorage.setItem("nexo_customer_data", JSON.stringify(data.cliente));
        }
        setIsAuthModalOpen(false);
        mostrarNotificacion(`🎉 ¡Cuenta creada con éxito! Bienvenido, ${data.cliente.nombre.split(" ")[0]}.`);
        return { success: true };
      }
      return { success: false, error: data.error || "Error al crear cuenta" };
    } catch {
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  const logoutCustomer = () => {
    setCustomer(null);
    setCustomerToken(null);
    setIsProfileOpen(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("nexo_customer_token");
      localStorage.removeItem("nexo_customer_data");
    }
    mostrarNotificacion("Has cerrado sesión correctamente");
  };

  const refreshProfile = async () => {
    if (!customerToken) return;
    try {
      const res = await fetch("/api/auth/profile", {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomer(data.cliente);
        if (typeof window !== "undefined") {
          localStorage.setItem("nexo_customer_data", JSON.stringify(data.cliente));
        }
      }
    } catch (e) {
      console.error("Error refrescando perfil:", e);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotalPyg,
        subtotalUsd,
        fletePyg,
        descuentoPyg,
        totalPagarPyg,
        cupon,
        aplicarCupon,
        removerCupon,
        isCartOpen,
        setIsCartOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isProfileOpen,
        setIsProfileOpen,
        customer,
        customerToken,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        refreshProfile,
        notificacion,
        mostrarNotificacion,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }
  return context;
}
