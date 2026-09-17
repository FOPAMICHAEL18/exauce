import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Breadcrumb, { BreadcrumbItem } from './Breadcrumb';

describe('Breadcrumb Component', () => {
  it('rend le lien Accueil et la structure de base sans éléments', () => {
    render(<Breadcrumb items={[]} />);

    const homeLink = screen.getByRole('link', { name: /accueil/i });
    expect(homeLink).toBeDefined();
    expect(homeLink.getAttribute('href')).toBe('/');
  });

  it('affiche correctement un seul élément final non cliquable', () => {
    const items: BreadcrumbItem[] = [{ label: 'Contact' }];

    render(<Breadcrumb items={items} />);

    const label = screen.getByText('Contact');
    expect(label).toBeDefined();
    expect(label.tagName.toLowerCase()).toBe('span');
    expect(label.className).toContain('font-semibold');
  });

  it('affiche un fil d’Ariane complet avec des liens et un élément actif', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Admin', href: '/admin' },
      { label: 'Paramètres', href: '/admin/settings' },
      { label: 'Contact' },
    ];

    render(<Breadcrumb items={items} />);

    // Vérification des liens intermédiaires
    const adminLink = screen.getByRole('link', { name: 'Admin' });
    expect(adminLink.getAttribute('href')).toBe('/admin');

    const settingsLink = screen.getByRole('link', { name: 'Paramètres' });
    expect(settingsLink.getAttribute('href')).toBe('/admin/settings');

    // Vérification du dernier élément (doit être un span)
    const activeItem = screen.getByText('Contact');
    expect(activeItem.tagName.toLowerCase()).toBe('span');
  });

  it('rend un span si un élément intermédiaire n’a pas de propriété href (Ligne conditionnelle)', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Catégorie sans lien' }, // isLast est false, mais href est undefined
      { label: 'Page courante', href: '/courante' },
    ];

    render(<Breadcrumb items={items} />);

    // Doit être un span car href est absent
    const noHrefItem = screen.getByText('Catégorie sans lien');
    expect(noHrefItem.tagName.toLowerCase()).toBe('span');

    // Le dernier élément est aussi un span car isLast est true
    const lastItem = screen.getByText('Page courante');
    expect(lastItem.tagName.toLowerCase()).toBe('span');
  });
});