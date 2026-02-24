import React, { useState, useEffect, useRef } from 'react';
import './ReturnToggle.css';

const ReturnToggle = ({ onToggle, options, activeId }) => {
  // Default options if none provided
  const defaultOptions = [
    { id: 'fixed', label: 'Fixed Return' },
    { id: 'leveraging', label: 'Leveraging Return' }
  ];

  const items = options || defaultOptions;
  const [activeTab, setActiveTab] = useState(activeId || items[0].id);
  const [sliderStyle, setSliderStyle] = useState({});
  
  const itemRefs = useRef({});

  useEffect(() => {
    // Update internal state if prop changes
    if (activeId) {
      setActiveTab(activeId);
    }
  }, [activeId]);

  useEffect(() => {
    const activeElement = itemRefs.current[activeTab];
    
    if (activeElement) {
      setSliderStyle({
        width: `${activeElement.offsetWidth}px`,
        transform: `translateX(${activeElement.offsetLeft - 4}px)`, // -4 accounts for parent padding
      });
    }
  }, [activeTab, items]);

  const handleToggle = (id) => {
    setActiveTab(id);
    if (onToggle) onToggle(id);
  };

  return (
    <div className="return-toggle-container">
      <div className="return-toggle-pill">
        <div className="toggle-slider" style={sliderStyle} />
        
        {items.map((item) => (
          <div 
            key={item.id}
            ref={el => itemRefs.current[item.id] = el}
            className={`toggle-option ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => handleToggle(item.id)}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReturnToggle;
