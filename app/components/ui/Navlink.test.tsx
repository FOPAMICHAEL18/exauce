import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navlink from './Navlink';

// Mock de usePathname pour contrôler la route courante
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock du composant Link de Next.js pour un rendu JSX simple en test
vi.mock('next/link', () => ({
  default: ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe('Navlink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche correctement le composant avec ses enfants et son href', () => {
    mockUsePathname.mockReturnValue('/about');

    render(<Navlink href="/about">A propos</Navlink>);

    const linkElement = screen.getByRole('link', { name: 'A propos' });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', '/about');
  });

  describe('Gestion des classes actives (isActive)', () => {
    it('applique activeClassName si la route correspond exactement (exact = true)', () => {
      mockUsePathname.mockReturnValue('/admin/products');

      render(
        <Navlink href="/admin/products" exact activeClassName="active-link" className="base-link">
          Produits
        </Navlink>
      );

      const spanElement = screen.getByText('Produits');
      expect(spanElement).toHaveClass('base-link active-link');
    });

    it('n’applique pas activeClassName si la route ne correspond pas exactement (exact = true)', () => {
      mockUsePathname.mockReturnValue('/admin/products/123');

      render(
        <Navlink href="/admin/products" exact activeClassName="active-link" className="base-link">
          Produits
        </Navlink>
      );

      const spanElement = screen.getByText('Produits');
      expect(spanElement).toHaveClass('base-link');
      expect(spanElement).not.toHaveClass('active-link');
    });

    it('applique activeClassName si href est "/" et que le pathname est "/"', () => {
      mockUsePathname.mockReturnValue('/');

      render(
        <Navlink href="/" activeClassName="active-link">
          Accueil
        </Navlink>
      );

      const spanElement = screen.getByText('Accueil');
      expect(spanElement).toHaveClass('active-link');
    });

    it('n’applique pas activeClassName si href est "/" mais que le pathname est "/about"', () => {
      mockUsePathname.mockReturnValue('/about');

      render(
        <Navlink href="/" activeClassName="active-link">
          Accueil
        </Navlink>
      );

      const spanElement = screen.getByText('Accueil');
      expect(spanElement).not.toHaveClass('active-link');
    });

    it('applique activeClassName pour un sous-chemin quand exact est false (pathname.startsWith)', () => {
      mockUsePathname.mockReturnValue('/admin/products/123');

      render(
        <Navlink href="/admin/products" activeClassName="active-link">
          Produits
        </Navlink>
      );

      const spanElement = screen.getByText('Produits');
      expect(spanElement).toHaveClass('active-link');
    });

    it('n’applique pas activeClassName pour une route complètement différente quand exact est false', () => {
      mockUsePathname.mockReturnValue('/admin/settings');

      render(
        <Navlink href="/admin/products" activeClassName="active-link">
          Produits
        </Navlink>
      );

      const spanElement = screen.getByText('Produits');
      expect(spanElement).not.toHaveClass('active-link');
    });

    it('gère le cas où activeClassName n’est pas fourni (fallback chaîne vide)', () => {
      mockUsePathname.mockReturnValue('/about');

      render(<Navlink href="/about" className="my-class">A propos</Navlink>);

      const spanElement = screen.getByText('A propos');
      expect(spanElement).toHaveClass('my-class');
    });
  });

  describe('Événements', () => {
    it('déclenche la fonction onClick lorsqu’on clique sur le lien', () => {
      mockUsePathname.mockReturnValue('/home');
      const handleClick = vi.fn();

      render(
        <Navlink href="/home" onClick={handleClick}>
          Accueil
        </Navlink>
      );

      const linkElement = screen.getByRole('link', { name: 'Accueil' });
      fireEvent.click(linkElement);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});