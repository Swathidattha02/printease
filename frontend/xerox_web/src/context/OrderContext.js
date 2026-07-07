import React, { createContext, useState } from 'react';

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [preview, setPreview] = useState(null);

  const setOrderPreview = (data) => setPreview(data);
  const clearPreview = () => setPreview(null);

  return (
    <OrderContext.Provider value={{ preview, setOrderPreview, clearPreview }}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderContext;
