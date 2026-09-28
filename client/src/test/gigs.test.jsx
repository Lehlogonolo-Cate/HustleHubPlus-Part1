import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import GigCard from '../components/GigCard';
import GigForm from '../components/GigForm';
import GigDetailPage from '../pages/GigDetailPage';
import GigsPage from '../pages/GigsPage';
import { client, mockApi, renderWithProviders, signInAs } from './utils';

const gig = {
  id: 'g1',
  title: 'Professional logo design',
  description: 'A modern logo with three revisions.',
  category: 'design',
  price: 1500,
  deliveryDays: 5,
  isActive: true,
  freelancer: { id: 'f1', name: 'Thandi Mokoena' }
};

describe('GigCard', () => {
  it('shows the title, seller and price in rand', () => {
    render(
      <MemoryRouter>
        <GigCard gig={gig} />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Professional logo design' })).toHaveAttribute('href', '/gigs/g1');
    expect(screen.getByText('by Thandi Mokoena')).toBeInTheDocument();
    expect(screen.getByText(/R\s?1\s?500,00/)).toBeInTheDocument();
  });

  it('renders HTML in gig text as plain text, never as markup', () => {
    const { container } = render(
      <MemoryRouter>
        <GigCard gig={{ ...gig, title: '<img src=x onerror=alert(1)>' }} />
      </MemoryRouter>
    );

    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('GigForm', () => {
  it('shows validation errors and does not submit invalid data', async () => {
    const onSubmit = vi.fn();
    render(<GigForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Title'), 'Hi');
    await userEvent.type(screen.getByLabelText('Price (ZAR)'), '10');
    await userEvent.click(screen.getByRole('button', { name: 'Create gig' }));

    expect(screen.getByText('Title must be between 5 and 100 characters')).toBeInTheDocument();
    expect(screen.getByText('Price must be between R50 and R1,000,000')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits clean, typed values', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<GigForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Title'), '  Website development  ');
    await userEvent.type(screen.getByLabelText('Description'), 'A responsive website built with modern tools.');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'development');
    await userEvent.type(screen.getByLabelText('Price (ZAR)'), '2500.50');
    await userEvent.type(screen.getByLabelText('Delivery (days)'), '10');
    await userEvent.click(screen.getByRole('button', { name: 'Create gig' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Website development',
      description: 'A responsive website built with modern tools.',
      category: 'development',
      price: 2500.5,
      deliveryDays: 10,
      isActive: true
    });
  });
});

describe('GigsPage', () => {
  it('lists gigs from the API and searches by title', async () => {
    const { calls } = mockApi({
      ...signInAs(client),
      'GET /gigs': ({ url }) => ({
        body: {
          gigs: url.includes('search=logo') ? [gig] : [gig, { ...gig, id: 'g2', title: 'Copywriting for websites' }],
          pagination: { page: 1, limit: 12, total: 2, pages: 1 }
        }
      })
    });
    renderWithProviders(<GigsPage />);

    expect(await screen.findByText('Copywriting for websites')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Search gigs'), 'logo');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByText('Professional logo design')).toBeInTheDocument();
    expect(screen.queryByText('Copywriting for websites')).not.toBeInTheDocument();
    expect(calls.some((call) => call.url.includes('search=logo'))).toBe(true);
  });

  it('shows an empty state when nothing matches', async () => {
    mockApi({ ...signInAs(client), 'GET /gigs': { body: { gigs: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } } } });
    renderWithProviders(<GigsPage />);

    expect(await screen.findByText('No gigs found')).toBeInTheDocument();
  });
});

describe('GigDetailPage booking flow', () => {
  it('lets a client confirm a simulated payment and shows the transaction reference', async () => {
    const { calls } = mockApi({
      ...signInAs(client),
      'GET /gigs/g1': { body: { gig } },
      'POST /bookings': { status: 201, body: { booking: { id: 'b1', transaction: { reference: 'TXN-ABC123' } } } }
    });
    renderWithProviders(<GigDetailPage />, { route: '/gigs/g1', path: '/gigs/:id' });

    await userEvent.type(await screen.findByLabelText(/Project requirements/), 'Blue colours');
    await userEvent.click(screen.getByRole('button', { name: 'Book this gig' }));

    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(within(dialog).getByText(/No card details are collected/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /Pay/, hidden: true }));

    expect(await screen.findByText(/TXN-ABC123/)).toBeInTheDocument();
    expect(calls.find((c) => c.method === 'POST').body).toEqual({ gigId: 'g1', requirements: 'Blue colours' });
  });
});
