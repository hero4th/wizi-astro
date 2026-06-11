import React, { useState } from 'react';

const accordionItems = [
  {
    id: 1,
    title: 'Clases en Vivo',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Simuladores Reales',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Material Exclusivo',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1973&auto=format&fit=crop',
  },
  {
    id: 4,
    title: 'Profesores Expertos',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop',
  },
];

const AccordionItem = ({ item, isActive, onMouseEnter }: { item: any, isActive: boolean, onMouseEnter: () => void }) => {
  return (
    <div
      className="relative h-[450px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 ease-in-out"
      style={{ width: isActive ? '400px' : '80px' }}
      onMouseEnter={onMouseEnter}
    >
      {/* Background Image */}
      <img
        src={item.imageUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/400x450/2d3748/ffffff?text=' + encodeURIComponent(item.title); }}
      />
      {/* Dark overlay for better text readability */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-500 ${isActive ? 'opacity-20' : 'opacity-50'}`}></div>

      {/* Caption Text */}
      <span
        className={`
          absolute text-white text-lg font-display font-semibold whitespace-nowrap
          transition-all duration-300 ease-in-out
          ${
            isActive
              ? 'bottom-6 left-1/2 -translate-x-1/2 rotate-0' 
              : 'w-auto text-left bottom-24 left-1/2 -translate-x-1/2 -rotate-90'
          }
        `}
      >
        {item.title}
      </span>
    </div>
  );
};

export function LandingAccordionItem() {
  const [activeIndex, setActiveIndex] = useState(3);

  const handleItemHover = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="flex flex-row items-center justify-center gap-4 overflow-x-auto py-8 lg:py-0">
      {accordionItems.map((item, index) => (
        <AccordionItem
          key={item.id}
          item={item}
          isActive={index === activeIndex}
          onMouseEnter={() => handleItemHover(index)}
        />
      ))}
    </div>
  );
}
