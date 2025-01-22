import React from 'react';
import { render, screen } from '@testing-library/react';
import Loader from '../Loader';

describe('Loader', () => {
    const getClasses = (element: Element): string[] => {
        return element.className.split(' ').filter(Boolean);
    };

    it('renders with default size (md)', () => {
        render(<Loader />);
        const loader = screen.getByRole('img', { hidden: true });
        const classes = getClasses(loader);
        expect(classes).toContain('h-8');
        expect(classes).toContain('w-8');
    });

    it('renders with small size', () => {
        render(<Loader size="sm" />);
        const loader = screen.getByRole('img', { hidden: true });
        const classes = getClasses(loader);
        expect(classes).toContain('h-4');
        expect(classes).toContain('w-4');
    });

    it('renders with large size', () => {
        render(<Loader size="lg" />);
        const loader = screen.getByRole('img', { hidden: true });
        const classes = getClasses(loader);
        expect(classes).toContain('h-12');
        expect(classes).toContain('w-12');
    });

    it('applies custom className', () => {
        render(<Loader className="text-red-500" />);
        const loader = screen.getByRole('img', { hidden: true });
        const classes = getClasses(loader);
        expect(classes).toContain('text-red-500');
    });

    it('combines size and custom classes correctly', () => {
        render(<Loader size="sm" className="text-red-500" />);
        const loader = screen.getByRole('img', { hidden: true });
        const classes = getClasses(loader);
        expect(classes).toContain('h-4');
        expect(classes).toContain('w-4');
        expect(classes).toContain('text-red-500');
        expect(classes).toContain('animate-spin');
    });

    it('maintains default text color when no custom color is provided', () => {
        render(<Loader />);
        const loader = screen.getByRole('img', { hidden: true });
        const classes = getClasses(loader);
        expect(classes).toContain('text-blue-500');
    });

    it('renders with proper SVG attributes', () => {
        render(<Loader />);
        const loader = screen.getByRole('img', { hidden: true });
        
        expect(loader.tagName.toLowerCase()).toBe('svg');
        expect(loader).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
        expect(loader).toHaveAttribute('fill', 'none');
        expect(loader).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('contains circle and path elements', () => {
        const { container } = render(<Loader />);
        
        expect(container.querySelector('circle')).toBeInTheDocument();
        expect(container.querySelector('path')).toBeInTheDocument();
    });

    it('has animation class', () => {
        render(<Loader />);
        const loader = screen.getByRole('img', { hidden: true });
        const classes = getClasses(loader);
        expect(classes).toContain('animate-spin');
    });

    it('circle has proper opacity', () => {
        const { container } = render(<Loader />);
        const circle = container.querySelector('circle');
        const classes = circle ? getClasses(circle) : [];
        expect(classes).toContain('opacity-25');
    });

    it('path has proper opacity', () => {
        const { container } = render(<Loader />);
        const path = container.querySelector('path');
        const classes = path ? getClasses(path) : [];
        expect(classes).toContain('opacity-75');
    });

    it('combines all default classes correctly', () => {
        render(<Loader />);
        const loader = screen.getByRole('img', { hidden: true });
        const classes = getClasses(loader);
        expect(classes).toContain('animate-spin');
        expect(classes).toContain('text-blue-500');
        expect(classes).toContain('h-8');
        expect(classes).toContain('w-8');
    });
});