import React, { useState, useEffect, useRef } from 'react';

interface VirtualListProps {
    items: any[];
    rowHeight: number;
    renderRow: (item: any, index: number) => React.ReactNode;
    height?: number;
    overscan?: number;
    className?: string;
}

const VirtualList: React.FC<VirtualListProps> = ({
    items,
    rowHeight,
    renderRow,
    height = 500,
    overscan = 5,
    className = '',
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                setScrollTop(containerRef.current.scrollTop);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => {
                container.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);

    const totalHeight = items.length * rowHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
        items.length - 1,
        Math.floor((scrollTop + height) / rowHeight) + overscan
    );

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * rowHeight;

    return (
        <div
            ref={containerRef}
            style={{ height, overflow: 'auto', position: 'relative' }}
            className={className}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                    {visibleItems.map((item, index) => renderRow(item, startIndex + index))}
                </div>
            </div>
        </div>
    );
};

export default VirtualList; 