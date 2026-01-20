import React, { useState } from 'react';
import "../styles/Pedidos.css";


/**
 * ToggleVisibilityButton
 * Componente reutilizable para mostrar/ocultar divs por className
 * 
 * @param {string|string[]} classNames - Uno o dos classNames de los divs a ocultar/mostrar
 * @param {string} [label="Filtros"] - Etiqueta del botón
 * @param {string} [iconSrc="/data/filter.png"] - Ruta de la imagen del icono
 * @param {string} [className=""] - Classes adicionales para el botón
 */
export default function ToggleVisibilityButton({ 
  classNames, 
  label = "Filtros", 
  iconSrc = "/data/filter.png",
  className = ""
}) {
  const [isVisible, setIsVisible] = useState(true);

  const handleToggle = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);

    // Convertir classNames a array si es string
    const targetClasses = Array.isArray(classNames) ? classNames : [classNames];

    // Buscar y ocultar/mostrar los divs
    targetClasses.forEach(cls => {
      const elements = document.querySelectorAll(`.${cls}`);
      elements.forEach(el => {
        el.style.display = newVisibility ? 'block' : 'none';
      });
    });
  };

  return (
    <button
      className={className}
      onClick={handleToggle}
      title={isVisible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      <img 
        src={iconSrc} 
        alt={label} 
        style={{ width: "20px", height: "20px" }} 
      />
      {isVisible ? "Ocultar" : "Mostrar"}
    </button>
  );
}
